import React from 'react';
import { 
  FileText, 
  Globe, 
  CheckCheck, 
  ZoomIn, 
  ZoomOut, 
  BookOpen, 
  LayoutGrid, 
  Columns,
  CloudCheck,
  Edit3
} from 'lucide-react';

interface StatusBarProps {
  darkMode: boolean;
  wordCount: number;
  charCount: number;
  pageCount: number;
  currentPage: number;
  language: string;
  onLanguageClick?: () => void;
  trackChangesActive: boolean;
  onToggleTrackChanges: () => void;
  cloudSyncStatus: string;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onOpenWordStats: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  darkMode,
  wordCount,
  charCount,
  pageCount,
  currentPage,
  language,
  trackChangesActive,
  onToggleTrackChanges,
  cloudSyncStatus,
  zoomLevel,
  onZoomChange,
  onOpenWordStats,
  focusMode,
  onToggleFocusMode,
}) => {
  return (
    <footer
      id="word-status-bar"
      className={`h-6 px-3 flex items-center justify-between border-t text-[11px] select-none z-30 transition-colors ${
        darkMode 
          ? 'bg-slate-900 border-slate-700 text-slate-300' 
          : 'bg-[#185abd] border-[#134997] text-white'
      }`}
    >
      {/* Left items: Page number, Word Count, Language, Track Changes */}
      <div className="flex items-center gap-3">
        {/* Page counter */}
        <div 
          className="flex items-center gap-1 hover:bg-white/15 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          title="Página actual de páginas totales"
        >
          <FileText className="w-3 h-3 opacity-80" />
          <span>Página {currentPage} de {Math.max(1, pageCount)}</span>
        </div>

        {/* Word count with clickable stats modal */}
        <button
          id="btn-status-word-count"
          onClick={onOpenWordStats}
          className="flex items-center gap-1 hover:bg-white/15 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          title="Haz clic para ver estadísticas detalladas de legibilidad"
        >
          <Edit3 className="w-3 h-3 opacity-80" />
          <span>{wordCount.toLocaleString()} palabras</span>
        </button>

        {/* Language selector */}
        <div 
          className="hidden sm:flex items-center gap-1 hover:bg-white/15 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          title="Diccionario e idioma de corrección ortográfica"
        >
          <Globe className="w-3 h-3 opacity-80" />
          <span className="truncate max-w-[120px]">{language}</span>
        </div>

        {/* Track Changes badge */}
        <button
          onClick={onToggleTrackChanges}
          className={`hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            trackChangesActive 
              ? 'bg-amber-400 text-slate-950 font-bold' 
              : 'hover:bg-white/15 opacity-80'
          }`}
          title="Alternar Control de Cambios"
        >
          <span>{trackChangesActive ? 'Revisión: ON' : 'Revisión: OFF'}</span>
        </button>
      </div>

      {/* Right items: Cloud Sync, Focus Mode, Zoom Slider */}
      <div className="flex items-center gap-3">
        {/* Cloud sync indicator */}
        <div 
          className="hidden lg:flex items-center gap-1 opacity-80 hover:opacity-100"
          title="Estado de sincronización en la nube"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px]">{cloudSyncStatus}</span>
        </div>

        {/* Focus Mode button */}
        <button
          onClick={onToggleFocusMode}
          className="p-1 hover:bg-white/15 rounded transition-colors"
          title="Modo Lectura / Concentración"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
            className="hover:bg-white/15 p-0.5 rounded"
            title="Reducir Zoom"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          {/* Slider */}
          <input
            id="input-zoom-slider"
            type="range"
            min="50"
            max="200"
            step="5"
            value={zoomLevel}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-16 sm:w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
          />

          <button
            onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
            className="hover:bg-white/15 p-0.5 rounded"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-3 h-3" />
          </button>

          <button
            onClick={() => onZoomChange(100)}
            className="text-[10px] font-mono hover:bg-white/15 px-1 rounded min-w-[34px] text-right"
            title="Restablecer zoom al 100%"
          >
            {zoomLevel}%
          </button>
        </div>
      </div>
    </footer>
  );
};
