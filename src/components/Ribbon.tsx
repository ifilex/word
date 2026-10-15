import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Outdent,
  Indent,
  Highlighter,
  Type,
  RemoveFormatting,
  Table as TableIcon,
  Image as ImageIcon,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Search,
  Replace,
  FileCode2,
  Sparkles,
  Play,
  Languages,
  MessageSquarePlus,
  Eye,
  Minimize2,
  Maximize2,
  Printer,
  ChevronDown,
  Columns,
  CheckCircle2,
  Volume2,
  Binary,
  PenTool,
  QrCode,
  ShieldAlert,
  Sliders,
  ZoomIn,
  ZoomOut,
  Palette,
  FileSpreadsheet,
  FilePlus,
  FileText
} from 'lucide-react';
import { PageSettings } from '../types/document';

export type RibbonTab = 'inicio' | 'insertar' | 'disposicion' | 'referencias' | 'revisar' | 'scripts' | 'extensiones' | 'vista';

interface RibbonProps {
  darkMode: boolean;
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  onFormat: (command: string, value?: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImage: () => void;
  onInsertLink: () => void;
  onInsertEquation: () => void;
  onInsertSignature: () => void;
  onInsertQr: () => void;
  onOpenFindReplace: () => void;
  onOpenScriptsModal: () => void;
  onRunActiveScript: () => void;
  onOpenExtension: (extensionId: string) => void;
  onToggleComments: () => void;
  onAddComment: () => void;
  trackChangesActive: boolean;
  onToggleTrackChanges: () => void;
  onOpenWordStats: () => void;
  pageSettings: PageSettings;
  onUpdatePageSettings: (settings: Partial<PageSettings>) => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  showNavPane: boolean;
  onToggleNavPane: () => void;
  onOpenSymbolPicker?: () => void;
  onOpenReadAloud?: () => void;
  onOpenPrint?: () => void;
}

export const Ribbon: React.FC<RibbonProps> = ({
  darkMode,
  activeTab,
  onTabChange,
  onFormat,
  onInsertTable,
  onInsertImage,
  onInsertLink,
  onInsertEquation,
  onInsertSignature,
  onInsertQr,
  onOpenFindReplace,
  onOpenScriptsModal,
  onRunActiveScript,
  onOpenExtension,
  onToggleComments,
  onAddComment,
  trackChangesActive,
  onToggleTrackChanges,
  onOpenWordStats,
  pageSettings,
  onUpdatePageSettings,
  zoomLevel,
  onZoomChange,
  focusMode,
  onToggleFocusMode,
  showRuler,
  onToggleRuler,
  showNavPane,
  onToggleNavPane,
  onOpenSymbolPicker,
  onOpenReadAloud,
  onOpenPrint,
}) => {
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ rows: 3, cols: 3 });
  const [textColorPickerOpen, setTextColorPickerOpen] = useState(false);
  const [highlightColorPickerOpen, setHighlightColorPickerOpen] = useState(false);
  const [lineSpacingOpen, setLineSpacingOpen] = useState(false);
  const [marginMenuOpen, setMarginMenuOpen] = useState(false);
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [watermarkOpen, setWatermarkOpen] = useState(false);

  const FONT_FAMILIES = [
    { name: 'Aptos (Predeterminado 365)', value: 'Aptos, system-ui, sans-serif' },
    { name: 'Calibri', value: 'Calibri, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Segoe UI', value: '"Segoe UI", sans-serif' },
    { name: 'Courier New (Monoespaciada)', value: '"Courier New", Courier, monospace' },
    { name: 'Inter', value: 'Inter, sans-serif' }
  ];

  const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  const TEXT_COLORS = [
    '#000000', '#1e3a8a', '#1d4ed8', '#0284c7', '#0f766e', 
    '#15803d', '#b45309', '#b91c1c', '#6b21a8', '#374151'
  ];

  const HIGHLIGHT_COLORS = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#e2e8f0', 'transparent'
  ];

  const TABS: Array<{ id: RibbonTab; label: string }> = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'insertar', label: 'Insertar' },
    { id: 'disposicion', label: 'Disposición y Diseño' },
    { id: 'referencias', label: 'Referencias' },
    { id: 'revisar', label: 'Revisar' },
    { id: 'scripts', label: 'Automatización & Scripts' },
    { id: 'extensiones', label: 'Extensiones & Copilot' },
    { id: 'vista', label: 'Vista' }
  ];

  return (
    <div 
      id="word-ribbon-container"
      className={`border-b select-none transition-colors duration-150 ${
        darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-[#f3f2f1] border-[#e1dfdd] text-slate-800'
      }`}
    >
      {/* Top Tab Headers Bar */}
      <div className="flex items-center px-2 pt-1 gap-0.5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`ribbon-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-t-sm whitespace-nowrap transition-colors relative ${
                isActive
                  ? darkMode 
                    ? 'bg-slate-900 text-blue-400 font-semibold shadow-xs' 
                    : 'bg-white text-[#185abd] font-semibold shadow-xs'
                  : darkMode
                    ? 'hover:bg-slate-700/60 text-slate-300'
                    : 'hover:bg-[#e1dfdd] text-slate-700'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Ribbon Command Strip */}
      <div 
        id="ribbon-command-strip"
        className={`px-3 py-1.5 min-h-[92px] flex items-center overflow-x-auto gap-3 text-xs ${
          darkMode ? 'bg-slate-900/90' : 'bg-white'
        }`}
      >
        {/* =========================================================================
            TAB 1: INICIO (HOME)
           ========================================================================= */}
        {activeTab === 'inicio' && (
          <div className="flex items-center gap-3 w-full">
            {/* Clipboard Group */}
            <div className="flex flex-col items-center border-r pr-2.5 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-1 mb-1">
                <button
                  id="btn-clipboard-paste"
                  onClick={() => onFormat('paste')}
                  className="flex flex-col items-center p-1 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
                  title="Pegar contenido"
                >
                  <span className="text-sm">📋</span>
                  <span>Pegar</span>
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    id="btn-clipboard-cut"
                    onClick={() => onFormat('cut')}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] flex items-center gap-1"
                    title="Cortar"
                  >
                    ✂️ Cortar
                  </button>
                  <button
                    id="btn-clipboard-copy"
                    onClick={() => onFormat('copy')}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] flex items-center gap-1"
                    title="Copiar"
                  >
                    📄 Copiar
                  </button>
                </div>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium mt-auto">Portapapeles</span>
            </div>

            {/* Typography / Fuente Group */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              {/* Row 1: Font Name & Size */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <select
                  id="select-font-family"
                  onChange={(e) => onFormat('fontName', e.target.value)}
                  className="bg-transparent border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 max-w-[140px]"
                  defaultValue="Aptos, system-ui, sans-serif"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.name} value={f.value} className="dark:bg-slate-900 dark:text-white">
                      {f.name}
                    </option>
                  ))}
                </select>

                <select
                  id="select-font-size"
                  onChange={(e) => onFormat('fontSize', e.target.value)}
                  className="bg-transparent border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 w-14"
                  defaultValue="3"
                >
                  <option value="1">8 pt</option>
                  <option value="2">10 pt</option>
                  <option value="3">11 pt</option>
                  <option value="4">12 pt</option>
                  <option value="5">14 pt</option>
                  <option value="6">18 pt</option>
                  <option value="7">24 pt</option>
                </select>

                <button
                  onClick={() => onFormat('increaseFontSize')}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                  title="Aumentar tamaño de fuente"
                >
                  A^
                </button>
                <button
                  onClick={() => onFormat('decreaseFontSize')}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                  title="Disminuir tamaño de fuente"
                >
                  Av
                </button>

                <button
                  onClick={() => onFormat('removeFormat')}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500"
                  title="Borrar todo el formato"
                >
                  <RemoveFormatting className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Bold, Italic, Underline, Strikethrough, Color pickers */}
              <div className="flex items-center gap-0.5 relative">
                <button
                  id="btn-format-bold"
                  onClick={() => onFormat('bold')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Negrita (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-format-italic"
                  onClick={() => onFormat('italic')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Cursiva (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-format-underline"
                  onClick={() => onFormat('underline')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Subrayado (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-format-strike"
                  onClick={() => onFormat('strikeThrough')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Tachado"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFormat('subscript')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Subíndice"
                >
                  <Subscript className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFormat('superscript')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Superíndice"
                >
                  <Superscript className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>

                {/* Highlight Color */}
                <div className="relative">
                  <button
                    id="btn-highlight-color-picker"
                    onClick={() => {
                      setHighlightColorPickerOpen(!highlightColorPickerOpen);
                      setTextColorPickerOpen(false);
                    }}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-0.5"
                    title="Color de resaltado del texto"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {highlightColorPickerOpen && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border rounded shadow-lg z-50 grid grid-cols-4 gap-1.5 w-32">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            onFormat('hiliteColor', c);
                            setHighlightColorPickerOpen(false);
                          }}
                          style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                          className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-[9px]"
                          title={c === 'transparent' ? 'Sin resaltado' : c}
                        >
                          {c === 'transparent' && '❌'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Text Color */}
                <div className="relative">
                  <button
                    id="btn-text-color-picker"
                    onClick={() => {
                      setTextColorPickerOpen(!textColorPickerOpen);
                      setHighlightColorPickerOpen(false);
                    }}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-0.5"
                    title="Color de fuente"
                  >
                    <Type className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {textColorPickerOpen && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 border rounded shadow-lg z-50 grid grid-cols-5 gap-1.5 w-40">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            onFormat('foreColor', c);
                            setTextColorPickerOpen(false);
                          }}
                          style={{ backgroundColor: c }}
                          className="w-5 h-5 rounded border border-slate-400 hover:scale-110 transition-transform"
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Fuente</span>
            </div>

            {/* Paragraph / Párrafo Group */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              {/* Row 1: Lists & Indentation */}
              <div className="flex items-center gap-0.5 mb-1.5">
                <button
                  id="btn-list-bullets"
                  onClick={() => onFormat('insertUnorderedList')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Viñetas"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-list-numbers"
                  onClick={() => onFormat('insertOrderedList')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Numeración"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFormat('outdent')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Disminuir sangría"
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFormat('indent')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Aumentar sangría"
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Alignments & Line Spacing */}
              <div className="flex items-center gap-0.5">
                <button
                  id="btn-align-left"
                  onClick={() => onFormat('justifyLeft')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Alinear a la izquierda (Ctrl+L)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-align-center"
                  onClick={() => onFormat('justifyCenter')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Centrar (Ctrl+E)"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-align-right"
                  onClick={() => onFormat('justifyRight')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Alinear a la derecha (Ctrl+R)"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-align-justify"
                  onClick={() => onFormat('justifyFull')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Justificar (Ctrl+J)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                {/* Line Spacing Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setLineSpacingOpen(!lineSpacingOpen)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] flex items-center gap-0.5"
                    title="Espaciado entre líneas y párrafos"
                  >
                    <span>1.15</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {lineSpacingOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border rounded shadow-lg z-50 p-1 w-28 text-[11px]">
                      {['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'].map(val => (
                        <button
                          key={val}
                          onClick={() => {
                            onFormat('lineSpacing', val);
                            setLineSpacingOpen(false);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700"
                        >
                          Interlineado {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Párrafo</span>
            </div>

            {/* Styles Gallery / Estilos */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] pb-1">
                <button
                  onClick={() => onFormat('formatBlock', '<p>')}
                  className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 hover:border-blue-500 text-left min-w-[65px]"
                >
                  <div className="text-[11px] font-medium">Normal</div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-400 truncate">Calibri 11pt</div>
                </button>
                <button
                  onClick={() => onFormat('formatBlock', '<h1>')}
                  className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 hover:border-blue-500 text-left min-w-[70px]"
                >
                  <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400">Título 1</div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-400 truncate">Grande 18pt</div>
                </button>
                <button
                  onClick={() => onFormat('formatBlock', '<h2>')}
                  className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 hover:border-blue-500 text-left min-w-[70px]"
                >
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-300">Título 2</div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-400 truncate">Medio 14pt</div>
                </button>
                <button
                  onClick={() => onFormat('formatBlock', '<blockquote>')}
                  className="px-2 py-1 border rounded bg-slate-50 dark:bg-slate-800 hover:border-blue-500 text-left min-w-[65px]"
                >
                  <div className="text-[11px] italic text-slate-600 dark:text-slate-300">Cita</div>
                  <div className="text-[9px] text-slate-600 dark:text-slate-400 truncate">Destacada</div>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Estilos de Texto</span>
            </div>

            {/* Editing / Edición */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-1">
                <button
                  id="btn-open-find-replace-ribbon"
                  onClick={onOpenFindReplace}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                  title="Buscar y Reemplazar (Ctrl+F)"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Buscar</span>
                </button>
                <button
                  onClick={onOpenFindReplace}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                  title="Reemplazar texto (Ctrl+H)"
                >
                  <Replace className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reemplazar</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Edición</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: INSERTAR (INSERT)
           ========================================================================= */}
        {activeTab === 'insertar' && (
          <div className="flex items-center gap-4 w-full">
            {/* Pages Section */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  id="btn-insert-blank-page"
                  onClick={() => {
                    onFormat('insertHTML', '<div class="page-break" style="break-after: page; page-break-after: always; height: 16px; border-bottom: 2px dashed #94a3b8; margin: 24px 0; text-align: center; font-size: 10px; color: #94a3b8; user-select: none;">--- Salto de Página ---</div><p><br></p>');
                  }}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
                  title="Insertar página en blanco o salto de página"
                >
                  <FilePlus className="w-5 h-5 text-blue-600" />
                  <span>Pág. en Blanco</span>
                </button>
                <button
                  id="btn-insert-page-break"
                  onClick={() => {
                    onFormat('insertHTML', '<div class="page-break" style="break-after: page; page-break-after: always; height: 16px; border-bottom: 2px dashed #94a3b8; margin: 24px 0; text-align: center; font-size: 10px; color: #94a3b8; user-select: none;">--- Salto de Página ---</div><p><br></p>');
                  }}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  title="Finalizar la página actual e iniciar una nueva página"
                >
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span>Salto de Página</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Páginas</span>
            </div>

            {/* Tables */}
            <div className="flex flex-col items-center border-r pr-3 border-slate-300 dark:border-slate-700 relative">
              <button
                id="btn-insert-table-dropdown"
                onClick={() => setShowTableGrid(!showTableGrid)}
                className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
                title="Insertar tabla"
              >
                <TableIcon className="w-5 h-5 text-blue-600" />
                <span>Tabla</span>
              </button>

              {showTableGrid && (
                <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-slate-800 border rounded shadow-xl z-50 w-48">
                  <div className="text-[11px] font-semibold mb-2">Insertar tabla ({hoverGrid.rows}x{hoverGrid.cols})</div>
                  <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-900 p-2 rounded">
                    {Array.from({ length: 6 }).map((_, r) => (
                      <React.Fragment key={r}>
                        {Array.from({ length: 6 }).map((_, c) => (
                          <div
                            key={c}
                            onMouseEnter={() => setHoverGrid({ rows: r + 1, cols: c + 1 })}
                            onClick={() => {
                              onInsertTable(r + 1, c + 1);
                              setShowTableGrid(false);
                            }}
                            className={`w-4 h-4 border cursor-pointer ${
                              r < hoverGrid.rows && c < hoverGrid.cols
                                ? 'bg-blue-500 border-blue-600'
                                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                            }`}
                          />
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium mt-auto">Tablas</span>
            </div>

            {/* Illustrations / Multimedia */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  id="btn-insert-image"
                  onClick={onInsertImage}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  title="Insertar imagen desde tu dispositivo o URL"
                >
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <span>Imágenes</span>
                </button>
                <button
                  onClick={onInsertQr}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  title="Generar e insertar código QR"
                >
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <span>Código QR</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Ilustraciones</span>
            </div>

            {/* Links & Bookmarks */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <button
                id="btn-insert-hyperlink"
                onClick={onInsertLink}
                className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                title="Insertar hipervínculo web"
              >
                <Link className="w-5 h-5 text-sky-600" />
                <span>Vínculo</span>
              </button>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Vínculos</span>
            </div>

            {/* Math, Signatures & Symbols */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  onClick={onInsertEquation}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  title="Insertar fórmula o ecuación matemática"
                >
                  <Binary className="w-5 h-5 text-amber-600" />
                  <span>Ecuación</span>
                </button>
                {onOpenSymbolPicker && (
                  <button
                    onClick={onOpenSymbolPicker}
                    className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
                    title="Insertar símbolos especiales, monedas, letras griegas y matemáticas"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span>Símbolo</span>
                  </button>
                )}
                <button
                  onClick={onInsertSignature}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  title="Panel de firma digital y sello"
                >
                  <PenTool className="w-5 h-5 text-purple-600" />
                  <span>Firma</span>
                </button>
                <button
                  onClick={() => onFormat('insertHorizontalRule')}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  title="Línea separadora de sección"
                >
                  <span className="text-sm font-mono">—</span>
                  <span>Separador</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Símbolos & Firmas</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: DISPOSICIÓN Y DISEÑO (PAGE LAYOUT)
           ========================================================================= */}
        {activeTab === 'disposicion' && (
          <div className="flex items-center gap-4 w-full">
            {/* Margins */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700 relative">
              <button
                onClick={() => setMarginMenuOpen(!marginMenuOpen)}
                className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
              >
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>Márgenes</span>
              </button>

              {marginMenuOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border rounded shadow-xl z-50 p-2 w-44 text-[11px]">
                  <button
                    onClick={() => {
                      onUpdatePageSettings({ margins: { top: 25, bottom: 25, left: 25, right: 25 } });
                      setMarginMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div className="font-semibold">Normal</div>
                    <div className="text-[9px] text-slate-600 dark:text-slate-400">2.5 cm en todos los lados</div>
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePageSettings({ margins: { top: 12, bottom: 12, left: 12, right: 12 } });
                      setMarginMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div className="font-semibold">Estrecho</div>
                    <div className="text-[9px] text-slate-600 dark:text-slate-400">1.27 cm en todos los lados</div>
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePageSettings({ margins: { top: 25, bottom: 25, left: 38, right: 38 } });
                      setMarginMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <div className="font-semibold">Ancho</div>
                    <div className="text-[9px] text-slate-600 dark:text-slate-400">3.8 cm izq/der</div>
                  </button>
                </div>
              )}
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Márgenes</span>
            </div>

            {/* Orientation */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdatePageSettings({ orientation: 'portrait' })}
                  className={`px-2 py-1 rounded text-[11px] ${pageSettings.orientation === 'portrait' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Vertical
                </button>
                <button
                  onClick={() => onUpdatePageSettings({ orientation: 'landscape' })}
                  className={`px-2 py-1 rounded text-[11px] ${pageSettings.orientation === 'landscape' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  Horizontal
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Orientación</span>
            </div>

            {/* Paper Size */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700 relative">
              <button
                onClick={() => setSizeMenuOpen(!sizeMenuOpen)}
                className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
              >
                <span className="font-bold text-sm">A4</span>
                <span>Tamaño: {pageSettings.size}</span>
              </button>

              {sizeMenuOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border rounded shadow-xl z-50 p-2 w-36 text-[11px]">
                  {['A4', 'Letter', 'Legal', 'Executive'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => {
                        onUpdatePageSettings({ size: sz as any });
                        setSizeMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700 font-medium"
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Tamaño</span>
            </div>

            {/* Multi Columns */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => onUpdatePageSettings({ columns: cols as any })}
                    className={`px-2 py-1 rounded text-[11px] ${pageSettings.columns === cols ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {cols} {cols === 1 ? 'Col' : 'Cols'}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Columnas</span>
            </div>

            {/* Watermark / Marca de agua */}
            <div className="flex flex-col relative">
              <button
                onClick={() => setWatermarkOpen(!watermarkOpen)}
                className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
              >
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Marca de Agua</span>
              </button>

              {watermarkOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border rounded shadow-xl z-50 p-2 w-48 text-[11px]">
                  <button
                    onClick={() => {
                      onUpdatePageSettings({ watermarkText: 'CONFIDENCIAL' });
                      setWatermarkOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-600 font-semibold"
                  >
                    CONFIDENCIAL
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePageSettings({ watermarkText: 'BORRADOR' });
                      setWatermarkOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-600 font-semibold"
                  >
                    BORRADOR
                  </button>
                  <button
                    onClick={() => {
                      onUpdatePageSettings({ watermarkText: undefined });
                      setWatermarkOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                  >
                    Quitar marca de agua
                  </button>
                </div>
              )}
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Seguridad</span>
            </div>

            {/* Print Studio Quick Action */}
            {onOpenPrint && (
              <div className="flex flex-col pl-2 border-l border-slate-300 dark:border-slate-700">
                <button
                  id="btn-ribbon-open-print"
                  onClick={onOpenPrint}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px] text-blue-600 dark:text-blue-400 font-semibold"
                  title="Configuración de impresión y guardar como PDF"
                >
                  <Printer className="w-5 h-5 text-blue-600" />
                  <span>Imprimir</span>
                </button>
                <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Salida</span>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: REFERENCIAS (REFERENCES)
           ========================================================================= */}
        {activeTab === 'referencias' && (
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={() => onOpenExtension('apa-citations')}
              className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
              title="Generador y Administrador de Citas APA 7, MLA, IEEE"
            >
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
              <span>Citas APA 7ª / MLA</span>
            </button>

            <button
              onClick={() => onRunActiveScript()}
              className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
              title="Generar Tabla de Contenidos a partir de títulos"
            >
              <List className="w-5 h-5 text-blue-600" />
              <span>Tabla de Contenidos</span>
            </button>

            <button
              onClick={() => onFormat('insertHTML', '<p style="font-size: 10px; border-top: 1px solid #cbd5e1; margin-top: 16px; padding-top: 4px;"><sup>[1]</sup> Nota al pie de página explicativa.</p>')}
              className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
              title="Insertar nota al pie"
            >
              <span className="font-serif font-bold text-sm">AB¹</span>
              <span>Nota al pie</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 5: REVISAR (REVIEW & COLLABORATION)
           ========================================================================= */}
        {activeTab === 'revisar' && (
          <div className="flex items-center gap-4 w-full">
            {/* Word Count & Stats */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  id="btn-open-word-stats"
                  onClick={onOpenWordStats}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
                  title="Estadísticas de palabras, caracteres y tiempo de lectura"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Contar Palabras</span>
                </button>
                {onOpenReadAloud && (
                  <button
                    onClick={onOpenReadAloud}
                    className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
                    title="Leer documento en voz alta con sintetizador natural"
                  >
                    <Volume2 className="w-5 h-5 text-blue-600" />
                    <span>Leer en Voz Alta</span>
                  </button>
                )}
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Revisión & Voz</span>
            </div>

            {/* Comments */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  id="btn-add-new-comment"
                  onClick={onAddComment}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 text-[11px]"
                  title="Añadir nuevo comentario en la selección"
                >
                  <MessageSquarePlus className="w-5 h-5 text-sky-600" />
                  <span>Nuevo Comentario</span>
                </button>
                <button
                  id="btn-toggle-comments-sidebar"
                  onClick={onToggleComments}
                  className="flex flex-col items-center p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                  title="Ver todos los comentarios"
                >
                  <Eye className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <span>Ver Panel</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Comentarios</span>
            </div>

            {/* Track Changes / Control de cambios */}
            <div className="flex flex-col">
              <button
                id="btn-toggle-track-changes"
                onClick={onToggleTrackChanges}
                className={`flex flex-col items-center p-1.5 rounded transition-all text-[11px] ${
                  trackChangesActive 
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Control de Cambios (Rastreo de inserciones y modificaciones de coautores)"
              >
                <span className="text-sm">{trackChangesActive ? '📝 Activado' : '📝 Desactivado'}</span>
                <span>Control de Cambios</span>
              </button>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Seguimiento</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: AUTOMATIZACIÓN & SCRIPTS (MACROS)
           ========================================================================= */}
        {activeTab === 'scripts' && (
          <div className="flex items-center gap-4 w-full">
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <button
                id="btn-open-script-editor-ribbon"
                onClick={onOpenScriptsModal}
                className="flex flex-col items-center p-1.5 rounded bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[11px] font-semibold border border-purple-200 dark:border-purple-800"
              >
                <FileCode2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Editor de Scripts & VBA</span>
              </button>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Macros</span>
            </div>

            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <button
                onClick={onRunActiveScript}
                className="flex flex-col items-center p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-slate-800 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold"
                title="Ejecutar Script de Normalización APA 7"
              >
                <Play className="w-5 h-5 text-emerald-600" />
                <span>Ejecutar Script APA 7</span>
              </button>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Ejecución Rápida</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: EXTENSIONES & COPILOT
           ========================================================================= */}
        {activeTab === 'extensiones' && (
          <div className="flex items-center gap-3 w-full overflow-x-auto pb-1">
            <button
              onClick={() => onOpenExtension('ai-copilot')}
              className="flex items-center gap-2 p-2 rounded bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-semibold hover:shadow-xs"
            >
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <div className="text-left">
                <div>Copilot IA & Redacción</div>
                <div className="text-[9px] text-slate-500 font-normal">Reescribir, resumir y corregir</div>
              </div>
            </button>

            <button
              onClick={() => onOpenExtension('apa-citations')}
              className="flex items-center gap-1.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Citas APA 7ª</span>
            </button>

            <button
              onClick={() => onOpenExtension('text-to-speech')}
              className="flex items-center gap-1.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border text-xs"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Lector de Voz</span>
            </button>

            <button
              onClick={() => onOpenExtension('signature-pad')}
              className="flex items-center gap-1.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border text-xs"
            >
              <PenTool className="w-4 h-4 text-purple-600" />
              <span>Firma Digital</span>
            </button>

            <button
              onClick={() => onOpenExtension('qr-generator')}
              className="flex items-center gap-1.5 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border text-xs"
            >
              <QrCode className="w-4 h-4 text-sky-600" />
              <span>Código QR</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 8: VISTA (VIEW)
           ========================================================================= */}
        {activeTab === 'vista' && (
          <div className="flex items-center gap-4 w-full">
            {/* View Layouts */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  id="btn-toggle-focus-mode"
                  onClick={onToggleFocusMode}
                  className={`flex flex-col items-center p-1.5 rounded text-[11px] ${
                    focusMode ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Modo Concentración sin distracciones"
                >
                  <Maximize2 className="w-5 h-5 text-indigo-600" />
                  <span>Modo Concentración</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Vistas</span>
            </div>

            {/* Show / Hide Elements */}
            <div className="flex flex-col border-r pr-3 border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRuler}
                    onChange={onToggleRuler}
                    className="rounded text-blue-600"
                  />
                  <span>Regla</span>
                </label>
                <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNavPane}
                    onChange={onToggleNavPane}
                    className="rounded text-blue-600"
                  />
                  <span>Panel de Navegación</span>
                </label>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Mostrar</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold w-12 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onZoomChange(100)}
                  className="px-2 py-0.5 rounded border text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 font-medium ml-1"
                >
                  100%
                </button>
              </div>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 font-medium text-center mt-auto">Zoom</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
