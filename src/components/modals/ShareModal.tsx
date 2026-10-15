import React, { useState } from 'react';
import { X, Share2, Copy, Check, Users, Lock, Globe, Shield, UserPlus } from 'lucide-react';
import { Collaborator } from '../../types/document';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  documentTitle: string;
  collaborators: Collaborator[];
  onAddCollaborator: (name: string, email: string, role: 'editor' | 'reviewer' | 'viewer') => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  documentTitle,
  collaborators,
  onAddCollaborator,
}) => {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'reviewer' | 'viewer'>('editor');
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?room=word365-collab-${encodeURIComponent(documentTitle)}` : 'https://wordstudio365.app/collab';

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const name = inviteEmail.split('@')[0];
    onAddCollaborator(name, inviteEmail, inviteRole);
    setInviteEmail('');
  };

  return (
    <div 
      id="modal-share-collaboration"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Compartir & Colaboración en Vivo</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs">{documentTitle}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Share Link Box */}
          <div>
            <label className="block font-semibold mb-1.5">Enlace de acceso sincrónico:</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                {shareUrl}
              </div>
              <button
                id="btn-copy-share-link"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar enlace'}</span>
              </button>
            </div>
          </div>

          {/* Invite Collaborator Form */}
          <form onSubmit={handleInvite} className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block font-semibold mb-1.5">Invitar a usuarios o coautores:</label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs outline-none focus:border-blue-500"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs outline-none focus:border-blue-500"
              >
                <option value="editor">Puede editar</option>
                <option value="reviewer">Puede comentar</option>
                <option value="viewer">Solo ver</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invitar</span>
              </button>
            </div>
          </form>

          {/* Active Collaborators list */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="font-semibold text-slate-500 flex items-center justify-between">
              <span>Usuarios con acceso ({collaborators.length}):</span>
              <span className="text-[10px] text-emerald-600 font-normal">Sincronización P2P / Nube Activa</span>
            </div>

            {collaborators.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                No hay usuarios adicionales conectados. Comparte el enlace superior para colaborar en tiempo real.
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((c) => (
                  <div 
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center"
                        style={{ backgroundColor: c.color || '#2563eb' }}
                      >
                        {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.status === 'active' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.role === 'editor' ? 'Editor con permisos completos' : c.role === 'reviewer' ? 'Revisor de cambios' : 'Lector'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {c.role === 'editor' ? 'Editor' : c.role === 'reviewer' ? 'Revisor' : 'Lector'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
