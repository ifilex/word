import React from 'react';
import { X, FileText, CheckCircle2, Clock, AlignLeft, Hash } from 'lucide-react';

interface WordStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  content: string;
}

export const WordStatsModal: React.FC<WordStatsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  content,
}) => {
  if (!isOpen) return null;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const plainText = tempDiv.innerText || tempDiv.textContent || '';

  const words = plainText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const charWithSpaces = plainText.length;
  const charWithoutSpaces = plainText.replace(/\s+/g, '').length;
  const paragraphs = plainText.split(/\n+/).filter(p => p.trim().length > 0).length || 1;
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
  const readingTimeMin = Math.ceil(wordCount / 200);
  const speakingTimeMin = Math.ceil(wordCount / 130);

  return (
    <div 
      id="modal-word-stats"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className={`p-4 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm">Contar Palabras & Estadísticas</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
              <div className="text-[11px] text-slate-500">Palabras</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{wordCount.toLocaleString()}</div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
              <div className="text-[11px] text-slate-500">Caracteres (con espacios)</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{charWithSpaces.toLocaleString()}</div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Caracteres (sin espacios):</span>
              <span className="font-semibold font-mono">{charWithoutSpaces.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Párrafos:</span>
              <span className="font-semibold font-mono">{paragraphs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Oraciones:</span>
              <span className="font-semibold font-mono">{sentences}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Promedio palabras/oración:</span>
              <span className="font-semibold font-mono">{(wordCount / sentences).toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                Tiempo de lectura estimado:
              </span>
              <span className="font-semibold">{readingTimeMin} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                Tiempo de locución estimado:
              </span>
              <span className="font-semibold">{speakingTimeMin} min</span>
            </div>
          </div>
        </div>

        <div className={`p-4 border-t flex items-center justify-end ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
