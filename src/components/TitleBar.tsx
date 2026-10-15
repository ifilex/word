import React, { useState } from 'react';
import { 
  Save, 
  Undo, 
  Redo, 
  Printer, 
  Share2, 
  Sun, 
  Moon, 
  Cloud, 
  Check, 
  HardDrive, 
  Sparkles,
  Search,
  Minus,
  Square,
  X,
  FileText,
  FolderOpen,
  FilePlus
} from 'lucide-react';
import { Collaborator, CloudAccount } from '../types/document';

interface TitleBarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPrint: () => void;
  onNewDocument?: () => void;
  onOpenBackstage: () => void;
  onOpenCloudSync: () => void;
  onOpenShare: () => void;
  onOpenScripts: () => void;
  onOpenExtensions: () => void;
  collaborators: Collaborator[];
  cloudAccounts: CloudAccount[];
  isSaving: boolean;
  lastSavedText: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  onTitleChange,
  darkMode,
  onToggleDarkMode,
  onSave,
  onUndo,
  onRedo,
  onPrint,
  onNewDocument,
  onOpenBackstage,
  onOpenCloudSync,
  onOpenShare,
  onOpenScripts,
  onOpenExtensions,
  collaborators,
  cloudAccounts,
  isSaving,
  lastSavedText,
}) => {
  const connectedCloudCount = cloudAccounts.filter(a => a.connected).length;
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <header 
      id="word-title-bar"
      className={`h-10 px-2 flex items-center justify-between border-b select-none transition-colors duration-150 text-xs ${
        darkMode 
          ? 'bg-[#1e1e1e] border-[#333333] text-slate-200' 
          : 'bg-[#185abd] border-[#104a96] text-white'
      }`}
    >
      {/* Left section: Word Icon + Backstage Button + Quick Access Icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Word Document Brand Badge */}
        <div 
          onClick={onOpenBackstage}
          className="w-6 h-6 rounded bg-[#0f4c81] dark:bg-blue-600 flex items-center justify-center font-bold text-white text-xs cursor-pointer shadow-xs mr-1"
          title="Word Studio 365 Pro"
        >
          W
        </div>

        {/* Backstage trigger */}
        <button
          id="btn-backstage-file"
          onClick={onOpenBackstage}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
            darkMode 
              ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50' 
              : 'bg-white/15 text-white hover:bg-white/25'
          }`}
          title="Menú Archivo / Backstage (Abrir, Guardar, Exportar)"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Archivo</span>
        </button>

        {/* Quick New Blank Document */}
        {onNewDocument && (
          <button
            id="btn-quick-new"
            onClick={onNewDocument}
            className="p-1.5 rounded hover:bg-white/20 active:bg-white/30 text-inherit transition-colors"
            title="Nuevo Documento en Blanco (Lienzo totalmente limpio)"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="h-3.5 w-px bg-white/20 mx-1"></div>

        {/* Quick Save */}
        <button
          id="btn-quick-save"
          onClick={onSave}
          disabled={isSaving}
          className="p-1.5 rounded hover:bg-white/20 active:bg-white/30 text-inherit transition-colors disabled:opacity-50"
          title="Guardar localmente y en la nube (Ctrl+S)"
        >
          {isSaving ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Undo / Redo */}
        <button
          id="btn-quick-undo"
          onClick={onUndo}
          className="p-1.5 rounded hover:bg-white/20 active:bg-white/30 text-inherit transition-colors"
          title="Deshacer (Ctrl+Z)"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-quick-redo"
          onClick={onRedo}
          className="p-1.5 rounded hover:bg-white/20 active:bg-white/30 text-inherit transition-colors"
          title="Rehacer (Ctrl+Y)"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>

        {/* Quick Print */}
        <button
          id="btn-quick-print"
          onClick={onPrint}
          className="p-1.5 rounded hover:bg-white/20 active:bg-white/30 text-inherit transition-colors hidden sm:block"
          title="Imprimir / Exportar PDF (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle section: Document Title and Fluent Search Bar */}
      <div className="flex items-center gap-3 justify-center flex-1 max-w-xl mx-2">
        {/* Document Title Capsule */}
        <div className="flex items-center bg-black/15 hover:bg-black/25 focus-within:bg-black/35 rounded px-2.5 py-0.5 transition-colors max-w-[200px] sm:max-w-[260px]">
          <input
            id="input-document-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-semibold text-inherit text-center w-full truncate cursor-pointer focus:cursor-text"
            title="Haz clic para renombrar el documento"
          />
          <span className="text-[10px] opacity-70 ml-1">.docx</span>
        </div>

        {/* Fluent Central Search Bar (Office "Tell me what you want to do") */}
        <div className="hidden lg:flex items-center bg-black/20 hover:bg-black/30 rounded-lg px-2.5 py-1 w-56 text-slate-200 focus-within:bg-black/40 transition-colors">
          <Search className="w-3 h-3 opacity-70 mr-1.5 shrink-0" />
          <input 
            type="text"
            placeholder="Buscar o escribir comando..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-white placeholder:text-white/60 w-full"
          />
        </div>

        {/* Cloud status badge */}
        <button
          id="btn-cloud-status-badge"
          onClick={onOpenCloudSync}
          className="hidden md:flex items-center gap-1 text-[11px] opacity-90 hover:opacity-100 bg-black/15 hover:bg-black/25 px-2 py-0.5 rounded transition-all cursor-pointer shrink-0"
          title={`Sincronización activa en ${connectedCloudCount} nubes`}
        >
          <Cloud className="w-3 h-3 text-sky-300" />
          <span className="text-[10px]">{lastSavedText || 'Guardado'}</span>
          <Check className="w-2.5 h-2.5 text-emerald-300 ml-0.5" />
        </button>
      </div>

      {/* Right section: Scripts, Extensions, Dark Mode, Share & Window controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Scripts shortcut */}
        <button
          id="btn-quick-scripts"
          onClick={onOpenScripts}
          className={`hidden xl:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            darkMode 
              ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60' 
              : 'bg-white/15 text-white hover:bg-white/25'
          }`}
          title="Editor de Scripts y Macros Word"
        >
          <span className="font-mono text-[10px]">&lt;/&gt;</span>
          <span>Scripts</span>
        </button>

        {/* Extensions Hub */}
        <button
          id="btn-quick-extensions"
          onClick={onOpenExtensions}
          className={`hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            darkMode 
              ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-900/60' 
              : 'bg-white/15 text-white hover:bg-white/25'
          }`}
          title="Centro de Extensiones y Copilot IA"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Extensiones</span>
        </button>

        {/* Cloud Sync Center Trigger */}
        <button
          id="btn-open-cloud-sync"
          onClick={onOpenCloudSync}
          className="p-1.5 rounded hover:bg-white/20 text-inherit transition-colors relative"
          title="Gestor de Nubes (Google Drive, OneDrive, Dropbox)"
        >
          <HardDrive className="w-3.5 h-3.5" />
          {connectedCloudCount > 0 && (
            <span className="absolute 0.5 top-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="btn-toggle-dark-mode"
          onClick={onToggleDarkMode}
          className="p-1.5 rounded hover:bg-white/20 text-inherit transition-colors"
          title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-sky-100" />
          )}
        </button>

        {/* Share Button */}
        <button
          id="btn-open-share-modal"
          onClick={onOpenShare}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all shadow-xs ${
            darkMode 
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-white text-blue-900 hover:bg-blue-50'
          }`}
          title="Colaborar en tiempo real"
        >
          <Share2 className="w-3 h-3" />
          <span className="hidden sm:inline">Compartir</span>
        </button>

        {/* Desktop Window Controls Decoration (Min, Max, Close) */}
        <div className="hidden sm:flex items-center ml-1 border-l border-white/20 pl-1 space-x-0.5">
          <button 
            className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Minimizar"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button 
            className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Maximizar"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button 
            onClick={onOpenBackstage}
            className="p-1 rounded hover:bg-rose-600 text-white/80 hover:text-white transition-colors"
            title="Cerrar / Salir a menú"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
