import React, { useState } from 'react';
import { X, Search, Replace, ArrowRight } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  content: string;
  onReplaceAll: (findText: string, replaceText: string, matchCase: boolean) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  content,
  onReplaceAll,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSearch = () => {
    if (!findText) {
      setMatchCount(0);
      return;
    }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plain = tempDiv.innerText || tempDiv.textContent || '';
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const matches = plain.match(regex);
    setMatchCount(matches ? matches.length : 0);
  };

  const handleExecuteReplace = () => {
    if (!findText) return;
    onReplaceAll(findText, replaceText, matchCase);
    handleSearch();
  };

  return (
    <div 
      id="modal-find-replace"
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
            <Search className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm">Buscar y Reemplazar</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">Buscar texto:</label>
            <div className="flex items-center gap-2">
              <input
                id="input-find-term"
                type="text"
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                  setMatchCount(null);
                }}
                placeholder="Palabra o frase a buscar..."
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold"
              >
                Buscar
              </button>
            </div>
            {matchCount !== null && (
              <span className="text-[11px] text-blue-600 mt-1 block">
                {matchCount} {matchCount === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'}
              </span>
            )}
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Reemplazar con:</label>
            <input
              id="input-replace-term"
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Texto de reemplazo..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Coincidir mayúsculas y minúsculas</span>
            </label>
          </div>
        </div>

        <div className={`p-4 border-t flex items-center justify-end gap-2 ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-replace-all"
            onClick={handleExecuteReplace}
            disabled={!findText}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Reemplazar Todo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
