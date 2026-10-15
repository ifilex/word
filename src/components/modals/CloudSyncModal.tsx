import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Link, 
  Unlink, 
  FolderSync, 
  AlertCircle,
  HardDrive,
  CheckCircle2
} from 'lucide-react';
import { CloudAccount } from '../../types/document';
import { saveCloudAccounts } from '../../utils/cloudSync';
import { 
  signInWithGoogle, 
  signOutGoogle, 
  getGoogleAccessToken, 
  getGoogleDriveQuota, 
  DriveQuotaInfo 
} from '../../utils/googleDrive';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  accounts: CloudAccount[];
  onUpdateAccounts: (accounts: CloudAccount[]) => void;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  accounts,
  onUpdateAccounts,
  onSyncNow,
  isSyncing,
}) => {
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [gdriveQuota, setGdriveQuota] = useState<DriveQuotaInfo | null>(null);

  // Check active Google Token on modal open
  useEffect(() => {
    if (!isOpen) return;

    const token = getGoogleAccessToken();
    if (token) {
      getGoogleDriveQuota(token)
        .then((quota) => {
          setGdriveQuota(quota);
          const updated = accounts.map((acc) => {
            if (acc.provider === 'google-drive') {
              return {
                ...acc,
                connected: true,
                email: quota.userEmail || acc.email,
                avatar: quota.userPhoto,
                storageUsedMb: Math.round(quota.storageUsedBytes / (1024 * 1024)),
                storageTotalMb: Math.round(quota.storageTotalBytes / (1024 * 1024)),
                lastSync: 'Conectado ahora'
              };
            }
            return acc;
          });
          onUpdateAccounts(updated);
          saveCloudAccounts(updated);
        })
        .catch((err) => {
          console.warn('Could not fetch drive quota:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real Google Sign In
  const handleConnectGoogle = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { user, accessToken } = await signInWithGoogle();
      const quota = await getGoogleDriveQuota(accessToken).catch(() => ({
        storageUsedBytes: 0,
        storageTotalBytes: 15 * 1024 * 1024 * 1024,
        userName: user.displayName || 'Usuario Google',
        userEmail: user.email || '',
        userPhoto: user.photoURL || undefined
      }));

      setGdriveQuota(quota);

      const updated = accounts.map((acc) => {
        if (acc.provider === 'google-drive') {
          return {
            ...acc,
            connected: true,
            email: user.email || '',
            avatar: user.photoURL || undefined,
            storageUsedMb: Math.round(quota.storageUsedBytes / (1024 * 1024)),
            storageTotalMb: Math.round(quota.storageTotalBytes / (1024 * 1024)),
            lastSync: 'Justo ahora'
          };
        }
        return acc;
      });

      onUpdateAccounts(updated);
      saveCloudAccounts(updated);
      setSuccessToast(`¡Cuenta de Google (${user.email}) conectada con éxito!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Error al conectar Google Drive:', err);
      setErrorMessage(err.message || 'No se pudo completar el inicio de sesión con Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await signOutGoogle();
      setGdriveQuota(null);
      const updated = accounts.map((acc) => {
        if (acc.provider === 'google-drive') {
          return {
            ...acc,
            connected: false,
            email: '',
            avatar: undefined,
            lastSync: undefined
          };
        }
        return acc;
      });
      onUpdateAccounts(updated);
      saveCloudAccounts(updated);
      setSuccessToast('Google Drive desconectado.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al desconectar Google');
    }
  };

  const toggleAutoSync = (id: string) => {
    const updated = accounts.map((acc) => {
      if (acc.id === id) {
        return { ...acc, autoSync: !acc.autoSync };
      }
      return acc;
    });
    onUpdateAccounts(updated);
    saveCloudAccounts(updated);
  };

  const handleManualSync = async () => {
    setErrorMessage(null);
    try {
      await onSyncNow();
      setSuccessToast('Sincronización con Google Drive completada con éxito.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al sincronizar');
    }
  };

  const googleAccount = accounts.find(a => a.provider === 'google-drive') || {
    id: 'gdrive-1',
    provider: 'google-drive' as const,
    name: 'Google Drive',
    email: '',
    connected: false,
    storageUsedMb: 0,
    storageTotalMb: 15360,
    autoSync: true,
  };

  const usedPercent = Math.min(
    100, 
    Math.round((googleAccount.storageUsedMb / Math.max(1, googleAccount.storageTotalMb)) * 100)
  );

  return (
    <div 
      id="modal-cloud-sync-center"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className={`w-full max-w-xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Sincronización con Google Drive</h2>
              <p className="text-xs text-slate-500">
                Conecta tu cuenta de Google Drive para sincronizar y respaldar tus documentos.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {successToast && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sync status overview banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            darkMode ? 'bg-blue-950/20 border-blue-900/40 text-blue-200' : 'bg-blue-50/70 border-blue-100 text-blue-900'
          }`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Conexión Directa OAuth 2.0 Segura</div>
                <div className="text-[11px] opacity-80">
                  Tus documentos se guardan y leen directamente desde tu almacenamiento de Google Drive.
                </div>
              </div>
            </div>

            {googleAccount.connected && (
              <button
                id="btn-sync-all-clouds"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 ml-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </button>
            )}
          </div>

          {/* Google Drive Account Card */}
          <div
            className={`p-5 rounded-xl border transition-all ${
              googleAccount.connected
                ? darkMode ? 'bg-slate-800/90 border-blue-500/40' : 'bg-white border-blue-200 shadow-xs'
                : darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shadow-xs">
                  <svg className="w-full h-full" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>

                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span>Google Drive</span>
                    {googleAccount.connected ? (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Conectado
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-medium">
                        No conectado
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {googleAccount.connected ? (googleAccount.email || 'Cuenta vinculada') : 'Inicia sesión para ver y sincronizar tus archivos'}
                  </div>
                </div>
              </div>

              {/* Connect / Disconnect button */}
              {googleAccount.connected ? (
                <button
                  onClick={handleDisconnectGoogle}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center gap-1.5 transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  disabled={isGoogleLoading}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Link className="w-3.5 h-3.5" />
                  )}
                  <span>Iniciar sesión con Google</span>
                </button>
              )}
            </div>

            {googleAccount.connected && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Almacenamiento de Google Drive:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    {(googleAccount.storageUsedMb / 1024).toFixed(2)} GB de {(googleAccount.storageTotalMb / 1024).toFixed(0)} GB ({usedPercent}%)
                  </span>
                </div>

                {/* Storage Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(2, usedPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Estado: {googleAccount.lastSync || 'Sincronizado'}
                  </span>

                  <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={googleAccount.autoSync}
                      onChange={() => toggleAutoSync(googleAccount.id)}
                      className="rounded text-blue-600"
                    />
                    <span>Sincronización automática al guardar</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <span className="text-xs text-slate-500">
            {googleAccount.connected ? 'Google Drive activo' : 'Sin cuenta activa'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
