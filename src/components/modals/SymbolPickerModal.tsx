import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface SymbolPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onInsertSymbol: (symbol: string) => void;
}

interface SymbolCategory {
  name: string;
  symbols: string[];
}

const SYMBOL_CATEGORIES: SymbolCategory[] = [
  {
    name: 'Comunes y Monedas',
    symbols: ['©', '®', '™', '€', '$', '£', '¥', '₹', '₽', '₩', '¢', '¤', '§', '¶', '°', '†', '‡', '•', '·', '…', '‰']
  },
  {
    name: 'Matemáticas y Lógica',
    symbols: ['±', '×', '÷', '≠', '≈', '≤', '≥', '√', '∞', 'π', '∑', '∏', '∫', '∂', '∆', '∇', '∈', '∉', '⊂', '⊃', '∪', '∩', '∧', '∨', '¬', '∀', '∃', '∠', '⊥', '≡']
  },
  {
    name: 'Fracciones y Sub/Superíndices',
    symbols: ['½', '⅓', '⅔', '¼', '¾', '⅛', '⅜', '⅝', '⅞', '¹', '²', '³', '⁴', 'ⁿ', '₀', '₁', '₂', '₃', '₊', '₋', '⁼']
  },
  {
    name: 'Flechas y Dirección',
    symbols: ['←', '→', '↑', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '⇒', '⇔', '⇐', '⇑', '⇓', '➔', '➜', '➤', '↳', '↵']
  },
  {
    name: 'Alfabeto Griego',
    symbols: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω']
  },
  {
    name: 'Tipografía y Puntuación',
    symbols: ['«', '»', '“', '”', '‘', '’', '—', '–', '¿', '¡', '‹', '›', '„', '‚', '′', '″', '‴', '‱', '❦', '❧']
  },
  {
    name: 'Formas y Viñetas',
    symbols: ['■', '□', '▲', '△', '▼', '▽', '◆', '◇', '○', '●', '★', '☆', '✦', '✧', '✓', '✔', '✕', '✖', '✗', '❖', '❤', '⚡']
  }
];

export const SymbolPickerModal: React.FC<SymbolPickerModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onInsertSymbol,
}) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const currentCategory = SYMBOL_CATEGORIES[activeCategory];
  const displayedSymbols = search.trim()
    ? SYMBOL_CATEGORIES.flatMap(c => c.symbols).filter(s => s.includes(search.trim()))
    : currentCategory.symbols;

  return (
    <div 
      id="modal-symbol-picker"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm">Insertar Símbolo o Carácter Especial</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <input
            type="text"
            placeholder="Buscar símbolo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
          />

          {!search && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              {SYMBOL_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(idx)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                    activeCategory === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Symbols Grid */}
        <div className="p-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {displayedSymbols.map((sym, idx) => (
              <button
                key={`${sym}-${idx}`}
                onClick={() => {
                  onInsertSymbol(sym);
                  onClose();
                }}
                className={`h-11 rounded-lg text-lg flex items-center justify-center border transition-all hover:scale-110 active:scale-95 ${
                  darkMode 
                    ? 'border-slate-800 bg-slate-800/60 hover:bg-blue-600 hover:text-white hover:border-blue-500' 
                    : 'border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                }`}
                title={`Insertar: ${sym}`}
              >
                {sym}
              </button>
            ))}
          </div>
          {displayedSymbols.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No se encontraron símbolos para "{search}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t flex items-center justify-between text-xs text-slate-500 ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <span>Haz clic en cualquier símbolo para insertarlo directamente en el cursor.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
