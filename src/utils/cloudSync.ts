import { CloudAccount, CloudProvider, DocumentMetadata, DocumentVersion } from '../types/document';

const LOCAL_STORAGE_DOCS_KEY = 'word_studio_saved_docs_v1';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'word_studio_cloud_accounts_v1';
const LOCAL_STORAGE_VERSIONS_KEY = 'word_studio_doc_versions_v1';

export interface CloudFileItem {
  id: string;
  name: string;
  provider: CloudProvider;
  size: string;
  modifiedAt: string;
  path: string;
  type: 'file' | 'folder';
  htmlContent?: string;
}

export const INITIAL_CLOUD_ACCOUNTS: CloudAccount[] = [
  {
    id: 'gdrive-1',
    provider: 'google-drive',
    name: 'Google Drive',
    email: '',
    connected: false,
    storageUsedMb: 0,
    storageTotalMb: 15360,
    autoSync: false,
  }
];

export const MOCK_CLOUD_FILES: Record<CloudProvider, CloudFileItem[]> = {
  'google-drive': [],
  'browser-cloud': []
};

/**
 * Load cloud accounts from local storage or defaults
 */
export function getSavedCloudAccounts(): CloudAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading cloud accounts', e);
  }
  return INITIAL_CLOUD_ACCOUNTS;
}

/**
 * Save cloud accounts state
 */
export function saveCloudAccounts(accounts: CloudAccount[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving cloud accounts', e);
  }
}

/**
 * Save document to local browser cloud vault
 */
export function saveDocumentLocally(meta: DocumentMetadata, htmlContent: string): void {
  try {
    const allDocs = getAllLocalDocuments();
    const existingIndex = allDocs.findIndex(d => d.meta.id === meta.id);
    const updatedRecord = {
      meta: {
        ...meta,
        updatedAt: new Date().toISOString(),
      },
      htmlContent
    };

    if (existingIndex >= 0) {
      allDocs[existingIndex] = updatedRecord;
    } else {
      allDocs.unshift(updatedRecord);
    }

    localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(allDocs));
  } catch (e) {
    console.error('Failed to save document locally', e);
  }
}

/**
 * Get all local documents stored in browser
 */
export function getAllLocalDocuments(): Array<{ meta: DocumentMetadata; htmlContent: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading local documents', e);
  }
  return [];
}

/**
 * Delete a local document
 */
export function deleteLocalDocument(id: string): void {
  try {
    const allDocs = getAllLocalDocuments().filter(d => d.meta.id !== id);
    localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(allDocs));
  } catch (e) {
    console.error('Error deleting local document', e);
  }
}

/**
 * Version history management
 */
export function saveVersionSnapshot(docId: string, version: DocumentVersion): void {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_VERSIONS_KEY}_${docId}`);
    const versions: DocumentVersion[] = raw ? JSON.parse(raw) : [];
    versions.unshift(version);
    // Keep last 25 versions
    localStorage.setItem(`${LOCAL_STORAGE_VERSIONS_KEY}_${docId}`, JSON.stringify(versions.slice(0, 25)));
  } catch (e) {
    console.error('Error saving version snapshot', e);
  }
}

export function getVersionSnapshots(docId: string): DocumentVersion[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_VERSIONS_KEY}_${docId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error getting version snapshots', e);
  }
  return [];
}
