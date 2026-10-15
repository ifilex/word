import React, { useState } from 'react';
import { X, Clock, RotateCcw, Plus, Check, ShieldCheck, History } from 'lucide-react';
import { DocumentVersion } from '../../types/document';
import { getVersionSnapshots, saveVersionSnapshot } from '../../utils/cloudSync';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  docId: string;
  currentTitle: string;
  currentContent: string;
  onRestoreVersion: (version: DocumentVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  docId,
  currentTitle,
  currentContent,
  onRestoreVersion,
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isOpen) return null;

  const versions = getVersionSnapshots(docId);

  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) return;
    const newVersion: DocumentVersion = {
      id: `ver-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      title: snapshotName.trim(),
      htmlContent: currentContent,
      author: 'Tú (Propietario)',
      summary: `Instantánea manual guardada.`
    };
    saveVersionSnapshot(docId, newVersion);
    setSnapshotName('');
    setRefreshKey(k => k + 1);
  };

  return (
    <div 
      id="modal-version-history"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 px-6 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Historial de Versiones y Restauración</h2>
              <p className="text-xs text-slate-500">Recupera versiones anteriores o guarda puntos de control.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Create new snapshot input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nombre del punto de restauración (ej: Versión enviada a revisión)..."
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs outline-none focus:border-blue-500"
            />
            <button
              onClick={handleCreateSnapshot}
              disabled={!snapshotName.trim()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar Versión</span>
            </button>
          </div>

          {/* Version list */}
          <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
              <div>
                <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Versión Actual (En Edición)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Modificada hace unos momentos</div>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                Activa
              </span>
            </div>

            {versions.map((ver) => (
              <div
                key={ver.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between hover:border-blue-500 transition-all"
              >
                <div>
                  <div className="font-semibold text-xs">{ver.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {ver.timestamp} • Guardado por {ver.author}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRestoreVersion(ver);
                    onClose();
                  }}
                  className="px-3 py-1 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
