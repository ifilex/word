import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  X,
  FileDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Check,
  FileText,
  Copy,
  Layers,
  Sparkles
} from 'lucide-react';
import { PageSettings, DocumentMetadata } from '../../types/document';
import { exportToPdf, printDocumentNative } from '../../utils/documentParsers';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  pageSettings: PageSettings;
  metadata: DocumentMetadata;
  darkMode: boolean;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  pageSettings,
  darkMode
}) => {
  const [copies, setCopies] = useState<number>(1);
  const [printerDestination, setPrinterDestination] = useState<string>('system');
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'current' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('1');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(pageSettings.orientation || 'portrait');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal'>(pageSettings.size as 'A4' | 'Letter' | 'Legal' || 'A4');
  const [marginPreset, setMarginPreset] = useState<'normal' | 'narrow' | 'moderate' | 'wide'>('normal');
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [includeHeaderFooter, setIncludeHeaderFooter] = useState<boolean>(true);

  // Preview zoom and page navigation
  const [previewZoom, setPreviewZoom] = useState<number>(85);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [printSuccessToast, setPrintSuccessToast] = useState<string | null>(null);

  const previewSheetRef = useRef<HTMLDivElement>(null);

  // Calculate simulated pages based on content length
  const pagesContent = useMemo(() => {
    if (!content || !content.trim()) {
      return ['<p style="color: #94a3b8; font-style: italic;">Documento en blanco listo para imprimir.</p>'];
    }

    // Split by page-break if exists
    if (content.includes('class="page-break"') || content.includes("class='page-break'")) {
      const parts = content.split(/<div[^>]*class=["']page-break["'][^>]*>[\s\S]*?<\/div>/gi);
      return parts.filter(p => p.trim().length > 0);
    }

    // Otherwise split by rough block volume for visual preview simulation
    const temp = document.createElement('div');
    temp.innerHTML = content;
    const children = Array.from(temp.children);

    if (children.length <= 4) {
      return [content];
    }

    const pages: string[] = [];
    let currentChunk = '';
    let charCount = 0;

    for (const child of children) {
      const outer = child.outerHTML;
      const textLen = child.textContent?.length || 0;
      
      if (charCount > 1800 && currentChunk) {
        pages.push(currentChunk);
        currentChunk = outer;
        charCount = textLen;
      } else {
        currentChunk += outer;
        charCount += textLen;
      }
    }

    if (currentChunk) {
      pages.push(currentChunk);
    }

    return pages.length > 0 ? pages : [content];
  }, [content]);

  const totalPages = pagesContent.length;

  // Margin values in mm
  const marginsMm = useMemo(() => {
    switch (marginPreset) {
      case 'narrow': return { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 };
      case 'moderate': return { top: 25.4, bottom: 25.4, left: 19.0, right: 19.0 };
      case 'wide': return { top: 25.4, bottom: 25.4, left: 50.8, right: 50.8 };
      case 'normal':
      default:
        return { top: 20.0, bottom: 20.0, left: 20.0, right: 20.0 };
    }
  }, [marginPreset]);

  // Execute system browser print
  const handlePrintSystem = () => {
    setPrintSuccessToast('Preparando orden de impresión del navegador...');
    
    // Determine content according to page range
    let contentToPrint = content;
    if (pageRangeMode === 'current') {
      contentToPrint = pagesContent[currentPage - 1] || content;
    }

    const success = printDocumentNative(title, contentToPrint, {
      pageSize,
      orientation,
      marginsMm,
      watermarkText: includeWatermark ? pageSettings.watermarkText : undefined,
      watermarkOpacity: pageSettings.watermarkOpacity || 0.12,
      includeHeaderFooter,
      colorMode,
      pageColor: '#ffffff'
    });

    if (success) {
      setPrintSuccessToast('¡Diálogo de impresión del sistema activado!');
    } else {
      setPrintSuccessToast('Si tu navegador bloquea la ventana, usa "Guardar como PDF".');
    }

    setTimeout(() => {
      setPrintSuccessToast(null);
    }, 3500);
  };

  // Direct High Quality PDF Generation
  const handleSaveAsPdf = async () => {
    setIsExportingPdf(true);
    setPrintSuccessToast('Generando archivo PDF...');
    try {
      await exportToPdf(title || 'Documento', content, {
        pageSize,
        orientation,
        watermarkText: includeWatermark ? pageSettings.watermarkText : undefined,
        pageColor: '#ffffff'
      });
      setPrintSuccessToast('¡PDF descargado con éxito!');
      setTimeout(() => {
        setPrintSuccessToast(null);
      }, 3000);
    } catch (e) {
      console.error('Error al exportar PDF:', e);
      setPrintSuccessToast('Abriendo cuadro de diálogo de impresión...');
      setTimeout(() => {
        handlePrintSystem();
      }, 500);
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-print-studio"
      className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
    >
      {/* Container Dialog */}
      <div 
        className={`w-full h-full flex flex-col md:flex-row ${
          darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'
        }`}
      >
        {/* =========================================================================
            LEFT COLUMN: CONTROLS & PRINT CONFIGURATION (Word 365 Backstage Style)
           ========================================================================= */}
        <div 
          className={`w-full md:w-[380px] lg:w-[420px] flex flex-col shrink-0 border-r overflow-y-auto ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Imprimir</h2>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">{title || 'Documento sin título'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6 flex-1">
            {/* Quick Action Button with Copies */}
            <div className="flex items-center gap-3">
              <button
                id="btn-confirm-print"
                onClick={printerDestination === 'pdf' ? handleSaveAsPdf : handlePrintSystem}
                disabled={isExportingPdf}
                className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                <span>{printerDestination === 'pdf' ? 'Guardar como PDF' : 'Imprimir'}</span>
              </button>

              {/* Copies Box */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-semibold text-slate-500 mb-1">Copias</span>
                <div className="flex items-center border rounded-lg overflow-hidden border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <button
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="px-2.5 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center text-xs font-bold bg-transparent outline-none"
                  />
                  <button
                    onClick={() => setCopies(Math.min(99, copies + 1))}
                    className="px-2.5 py-2 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Toast */}
            {printSuccessToast && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>{printSuccessToast}</span>
              </div>
            )}

            {/* Destination / Printer Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Impresora / Destino
              </label>
              <select
                id="select-printer-destination"
                value={printerDestination}
                onChange={(e) => setPrinterDestination(e.target.value)}
                className={`w-full p-2.5 rounded-lg border text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="system">🖨️ Impresora del Sistema (Diálogo del Navegador / Físico)</option>
                <option value="pdf">📄 Guardar como Documento PDF (.pdf vectorial)</option>
              </select>
            </div>

            {/* Print Settings Section */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Configuración
              </span>

              {/* Page Range */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Páginas:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPageRangeMode('all')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        pageRangeMode === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Todas ({totalPages})
                    </button>
                    <button
                      onClick={() => setPageRangeMode('current')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        pageRangeMode === 'current'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Actual ({currentPage})
                    </button>
                    <button
                      onClick={() => setPageRangeMode('custom')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        pageRangeMode === 'custom'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>
                </div>

                {pageRangeMode === 'custom' && (
                  <input
                    type="text"
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    placeholder="Ejemplo: 1-3, 5"
                    className={`w-full p-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                    }`}
                  />
                )}
              </div>

              {/* Orientation */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Orientación:</span>
                <div className="grid grid-cols-2 gap-2 w-52">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      orientation === 'portrait'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                        : 'border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-2.5 h-3.5 border border-current rounded-2xs"></div>
                    <span>Vertical</span>
                  </button>

                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      orientation === 'landscape'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                        : 'border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="w-3.5 h-2.5 border border-current rounded-2xs"></div>
                    <span>Horizontal</span>
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tamaño:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'A4' | 'Letter' | 'Legal')}
                  className={`w-52 p-2 rounded-lg border text-xs outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="A4">A4 (21.0 x 29.7 cm)</option>
                  <option value="Letter">Carta / Letter (21.6 x 27.9 cm)</option>
                  <option value="Legal">Oficio / Legal (21.6 x 35.6 cm)</option>
                </select>
              </div>

              {/* Margins */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Márgenes:</span>
                <select
                  value={marginPreset}
                  onChange={(e) => setMarginPreset(e.target.value as any)}
                  className={`w-52 p-2 rounded-lg border text-xs outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="normal">Normal (2.5 cm)</option>
                  <option value="narrow">Estrecho (1.27 cm)</option>
                  <option value="moderate">Moderado (Arriba/Abajo 2.5, Izq/Der 1.9)</option>
                  <option value="wide">Ancho (5.0 cm laterales)</option>
                </select>
              </div>

              {/* Color Mode */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Color:</span>
                <div className="grid grid-cols-2 gap-2 w-52">
                  <button
                    onClick={() => setColorMode('color')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      colorMode === 'color'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                        : 'border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <span>🎨 A Color</span>
                  </button>

                  <button
                    onClick={() => setColorMode('grayscale')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      colorMode === 'grayscale'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                        : 'border-slate-300 dark:border-slate-800'
                    }`}
                  >
                    <span>⚪ Escala Grises</span>
                  </button>
                </div>
              </div>

              {/* Checkboxes: Watermark & Header */}
              <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={includeHeaderFooter}
                    onChange={(e) => setIncludeHeaderFooter(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Incluir encabezados y números de página</span>
                </label>

                {pageSettings.watermarkText && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={includeWatermark}
                      onChange={(e) => setIncludeWatermark(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Imprimir marca de agua ({pageSettings.watermarkText})</span>
                  </label>
                )}
              </div>
            </div>

            {/* Direct PDF Download Button */}
            <div className="pt-2">
              <button
                id="btn-direct-download-pdf"
                onClick={handleSaveAsPdf}
                disabled={isExportingPdf}
                className="w-full py-2.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4 text-rose-500" />
                <span>Descargar PDF Vectorial de Alta Calidad</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: LIVE PRINT PREVIEW CANVAS
           ========================================================================= */}
        <div className="flex-1 flex flex-col bg-slate-200 dark:bg-slate-950/80 relative overflow-hidden">
          {/* Preview Toolbar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between text-xs px-6 shadow-xs z-10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Vista Previa de Impresión</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-600 font-bold uppercase">
                {pageSize} • {orientation === 'landscape' ? 'Horizontal' : 'Vertical'}
              </span>
            </div>

            {/* Zoom & Page Paging Controls */}
            <div className="flex items-center gap-4">
              {/* Pagination Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewZoom(prev => Math.max(40, prev - 10))}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Alejar"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono w-10 text-center font-bold text-slate-600 dark:text-slate-400">
                  {previewZoom}%
                </span>
                <button
                  onClick={() => setPreviewZoom(prev => Math.min(150, prev + 10))}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Acercar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Paper Viewport Scroll Container */}
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center relative">
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="py-4"
            >
              {/* Virtual Printed Sheet */}
              <div
                ref={previewSheetRef}
                style={{
                  width: orientation === 'landscape' ? '297mm' : '210mm',
                  minHeight: orientation === 'landscape' ? '210mm' : '297mm',
                  paddingTop: `${marginsMm.top}mm`,
                  paddingBottom: `${marginsMm.bottom}mm`,
                  paddingLeft: `${marginsMm.left}mm`,
                  paddingRight: `${marginsMm.right}mm`,
                  filter: colorMode === 'grayscale' ? 'grayscale(100%)' : 'none'
                }}
                className="bg-white text-slate-900 shadow-2xl rounded-xs border border-slate-300 relative flex flex-col justify-between"
              >
                {/* Watermark in preview */}
                {includeWatermark && pageSettings.watermarkText && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                    <div
                      className="text-7xl font-black text-rose-500 uppercase tracking-widest transform -rotate-45"
                      style={{ opacity: pageSettings.watermarkOpacity || 0.12 }}
                    >
                      {pageSettings.watermarkText}
                    </div>
                  </div>
                )}

                {/* Simulated Header */}
                {includeHeaderFooter && (
                  <div className="text-[10px] text-slate-400 pb-2 mb-4 border-b border-slate-100 flex items-center justify-between select-none">
                    <span>{title || 'Documento Microsoft Word'}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                )}

                {/* Page HTML Content */}
                <div 
                  className="flex-1 text-sm leading-relaxed outline-none select-text"
                  dangerouslySetInnerHTML={{ __html: pagesContent[currentPage - 1] || '' }}
                />

                {/* Simulated Footer with Page Number */}
                {includeHeaderFooter && (
                  <div className="text-[10px] text-slate-400 pt-3 mt-4 border-t border-slate-100 flex items-center justify-between select-none">
                    <span>Microsoft Word 365 Pro</span>
                    <span className="font-semibold">Página {currentPage} de {totalPages}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
