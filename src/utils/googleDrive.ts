import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut as fbSignOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { parseDocumentFile } from './documentParsers';

// 1. Initialize Firebase Auth
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// 2. Configure Google Provider with requested Workspace scopes
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// 3. In-memory access token cache (MANDATORY: Never in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface DriveQuotaInfo {
  storageUsedBytes: number;
  storageTotalBytes: number;
  userName: string;
  userEmail: string;
  userPhoto?: string;
}

/**
 * Initialize Google Auth state listener
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Popup and obtain access token
 */
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the cached access token or prompt login if null
 */
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Sign out of Google and clear in-memory session
 */
export const signOutGoogle = async (): Promise<void> => {
  await fbSignOut(auth);
  cachedAccessToken = null;
};

/**
 * List files from user's Google Drive
 */
export const listGoogleDriveFiles = async (
  searchQuery = '',
  accessToken?: string
): Promise<DriveFileInfo[]> => {
  const token = accessToken || cachedAccessToken;
  if (!token) {
    throw new Error('No hay sesión de Google activa. Inicia sesión primero.');
  }

  // Filter documents, docx, html, txt, or user search
  let q = "trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType contains 'word' or name contains '.docx' or name contains '.doc' or name contains '.html' or name contains '.txt' or name contains '.rtf' or mimeType = 'application/vnd.google-apps.folder')";
  
  if (searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q = `trashed = false and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)');
  url.searchParams.set('pageSize', '35');
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error de Google Drive API (${response.status})`);
  }

  const data = await response.json();
  const files: DriveFileInfo[] = (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleString('es-ES') : 'Reciente',
    size: f.size ? formatBytes(parseInt(f.size, 10)) : (f.mimeType === 'application/vnd.google-apps.document' ? 'Google Doc' : 'Nube'),
    webViewLink: f.webViewLink,
    iconLink: f.iconLink
  }));

  return files;
};

/**
 * Fetch and import content of a specific Google Drive file into Word Studio
 */
export const downloadGoogleDriveFile = async (
  fileId: string,
  mimeType: string,
  fileName: string,
  accessToken?: string
): Promise<{ title: string; html: string }> => {
  const token = accessToken || cachedAccessToken;
  if (!token) throw new Error('No hay sesión de Google activa.');

  const title = fileName.replace(/\.[^/.]+$/, '');

  // 1. Google Native Document: Export as HTML
  if (mimeType === 'application/vnd.google-apps.document') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('No se pudo exportar el documento de Google.');
    const rawHtml = await res.text();
    // Extract body content
    const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return {
      title,
      html: bodyMatch ? bodyMatch[1] : rawHtml
    };
  }

  // 2. Binary or DOCX / HTML / TXT file: Download media
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('No se pudo descargar el archivo desde Google Drive.');

  const blob = await res.blob();
  const file = new File([blob], fileName, { type: mimeType });
  const parsed = await parseDocumentFile(file);

  return {
    title: parsed.title || title,
    html: parsed.html
  };
};

/**
 * Upload and save current document directly into user's Google Drive
 */
export const saveDocumentToGoogleDrive = async (
  title: string,
  htmlContent: string,
  existingFileId?: string,
  accessToken?: string
): Promise<{ fileId: string; name: string; webViewLink?: string }> => {
  const token = accessToken || cachedAccessToken;
  if (!token) throw new Error('No hay sesión de Google activa.');

  const safeTitle = (title.trim() || 'Documento sin título') + '.html';
  
  const fullHtmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #1e3a8a; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  ${htmlContent || '<p></p>'}
</body>
</html>`;

  // Multipart upload for Google Drive API v3
  const metadata = {
    name: safeTitle,
    mimeType: 'text/html',
    description: 'Documento creado y sincronizado desde Word Studio 365'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    fullHtmlContent +
    closeDelimiter;

  let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';
  let method = 'POST';

  if (existingFileId) {
    uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name,webViewLink`;
    method = 'PATCH';
  }

  const response = await fetch(uploadUrl, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al guardar el archivo en Google Drive');
  }

  const result = await response.json();
  return {
    fileId: result.id,
    name: result.name,
    webViewLink: result.webViewLink
  };
};

/**
 * Get Google Drive storage quota and user profile
 */
export const getGoogleDriveQuota = async (accessToken?: string): Promise<DriveQuotaInfo> => {
  const token = accessToken || cachedAccessToken;
  if (!token) throw new Error('No hay sesión de Google activa.');

  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error('No se pudo obtener información del almacenamiento de Drive.');

  const data = await res.json();
  const usage = parseInt(data.storageQuota?.usage || '0', 10);
  const limit = parseInt(data.storageQuota?.limit || '16106127360', 10); // Default 15 GB

  return {
    storageUsedBytes: usage,
    storageTotalBytes: limit,
    userName: data.user?.displayName || 'Usuario Google',
    userEmail: data.user?.emailAddress || '',
    userPhoto: data.user?.photoLink
  };
};

/**
 * Delete a file with confirmation
 */
export const deleteGoogleDriveFile = async (
  fileId: string,
  fileName: string,
  accessToken?: string
): Promise<boolean> => {
  const token = accessToken || cachedAccessToken;
  if (!token) throw new Error('No hay sesión de Google activa.');

  const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${fileName}" de Google Drive?`);
  if (!confirmed) return false;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    throw new Error('No se pudo eliminar el archivo de Google Drive.');
  }

  return true;
};

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
