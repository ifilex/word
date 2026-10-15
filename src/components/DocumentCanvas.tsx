import React, { useRef, useEffect } from 'react';
import { 
  PageSettings, 
  Collaborator, 
  DocumentComment,
  TrackedChange 
} from '../types/document';
import { TopRuler } from './Ruler';
import { FloatingFormatToolbar } from './FloatingFormatToolbar';
import { MessageSquare, X, Check, Reply, Trash2, ChevronRight, Hash } from 'lucide-react';

interface DocumentCanvasProps {
  darkMode: boolean;
  content: string;
  onContentChange: (newHtml: string) => void;
  pageSettings: PageSettings;
  onUpdatePageSettings: (settings: Partial<PageSettings>) => void;
  zoomLevel: number;
  showRuler: boolean;
  showNavPane: boolean;
  onCloseNavPane: () => void;
  comments: DocumentComment[];
  showComments: boolean;
  onCloseComments: () => void;
  onResolveComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
  onReplyComment: (commentId: string, replyText: string) => void;
  collaborators: Collaborator[];
  trackChangesActive: boolean;
  editorRef: React.RefObject<HTMLDivElement | null>;
  nightCanvasMode: boolean;
  onToggleNightCanvas: () => void;
  onFormat?: (command: string, value?: string) => void;
  onAddComment?: () => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  darkMode,
  content,
  onContentChange,
  pageSettings,
  onUpdatePageSettings,
  zoomLevel,
  showRuler,
  showNavPane,
  onCloseNavPane,
  comments,
  showComments,
  onCloseComments,
  onResolveComment,
  onDeleteComment,
  onReplyComment,
  collaborators,
  trackChangesActive,
  editorRef,
  nightCanvasMode,
  onToggleNightCanvas,
  onFormat,
  onAddComment,
}) => {
  const [replyInputs, setReplyInputs] = React.useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize incoming content (file loading, templates, undo/redo, scripts)
  // CRITICAL: We only update innerHTML if it differs from current content to prevent resetting caret or reversing typed text
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content, editorRef]);

  // Extract headings for Navigation Pane
  const [headings, setHeadings] = React.useState<Array<{ id: string; text: string; level: number }>>([]);

  useEffect(() => {
    if (editorRef.current) {
      const headingElements = editorRef.current.querySelectorAll('h1, h2, h3');
      const list: Array<{ id: string; text: string; level: number }> = [];
      headingElements.forEach((h, idx) => {
        const text = h.textContent?.trim() || `Sección ${idx + 1}`;
        const level = parseInt(h.tagName.substring(1), 10);
        list.push({ id: `heading-${idx}`, text, level });
      });
      setHeadings(list);
    }
  }, [content]);

  // Handle rich text input
  const handleInput = () => {
    if (editorRef.current) {
      onContentChange(editorRef.current.innerHTML);
    }
  };

  // Dimensions based on page size
  const isA4 = pageSettings.size === 'A4';
  const isLandscape = pageSettings.orientation === 'landscape';

  // Standard A4: 210mm x 297mm (approx 794px x 1123px at 96 DPI)
  // Standard Letter: 216mm x 279mm (approx 816px x 1056px)
  const pageWidthPx = isLandscape ? (isA4 ? 1123 : 1056) : (isA4 ? 794 : 816);
  const pageMinHeightPx = isLandscape ? (isA4 ? 794 : 816) : (isA4 ? 1123 : 1056);

  const columnClass = pageSettings.columns === 2 
    ? 'columns-2 gap-8' 
    : pageSettings.columns === 3 
    ? 'columns-3 gap-6' 
    : '';

  return (
    <div 
      id="word-workspace-area"
      className={`flex-1 flex overflow-hidden relative transition-colors ${
        darkMode ? 'bg-slate-950' : 'bg-[#e9e7e5]'
      }`}
    >
      {/* Navigation Pane / Panel de Navegación Lateral */}
      {showNavPane && (
        <aside 
          id="nav-pane-headings"
          className={`w-64 border-r flex flex-col shrink-0 text-xs select-none transition-colors z-20 ${
            darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <div className="p-3 border-b flex items-center justify-between border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Navegación / Títulos
            </span>
            <button 
              onClick={onCloseNavPane}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Cerrar panel de navegación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {headings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-[11px]">
                No hay títulos en el documento.<br />
                Aplica Título 1 o Título 2 para organizar tu índice.
              </div>
            ) : (
              headings.map((h, i) => (
                <div
                  key={i}
                  className={`px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 transition-colors ${
                    h.level === 1 ? 'font-semibold text-blue-700 dark:text-blue-400 pl-2' :
                    h.level === 2 ? 'font-medium text-slate-700 dark:text-slate-300 pl-4' : 'text-slate-500 pl-6'
                  }`}
                  onClick={() => {
                    const el = editorRef.current?.querySelectorAll('h1, h2, h3')[i];
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                  <span className="truncate">{h.text}</span>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Main Page Canvas Scroll Container */}
      <div 
        ref={containerRef}
        id="document-scroll-viewport"
        className="flex-1 flex flex-col overflow-y-auto relative items-center py-6 px-4 md:px-8"
      >
        {/* Top Ruler (if active) */}
        {showRuler && (
          <div className="w-full max-w-[900px] mb-2 sticky top-0 z-20 shadow-xs">
            <TopRuler
              darkMode={darkMode}
              pageWidthMm={isA4 ? 210 : 216}
              marginLeftMm={pageSettings.margins.left}
              marginRightMm={pageSettings.margins.right}
              onUpdateMargins={(l, r) => onUpdatePageSettings({ margins: { ...pageSettings.margins, left: l, right: r } })}
            />
          </div>
        )}

        {/* Night Canvas Toggle Helper */}
        {darkMode && (
          <div className="mb-3 flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            <span className="text-slate-400">Color de hoja:</span>
            <button
              onClick={onToggleNightCanvas}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                nightCanvasMode 
                  ? 'bg-slate-700 text-white shadow-xs' 
                  : 'bg-white text-slate-900'
              }`}
            >
              {nightCanvasMode ? '🌙 Hoja Oscura Nocturna' : '📄 Hoja Blanca Estándar'}
            </button>
          </div>
        )}

        {/* Scaled Word Page Container */}
        <div
          id="word-page-scaler"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="relative transition-all"
        >
          {/* Authentic Word Paper Sheet */}
          <div
            id="word-paper-sheet"
            style={{
              width: `${pageWidthPx}px`,
              minHeight: `${pageMinHeightPx}px`,
              paddingTop: `${pageSettings.margins.top}px`,
              paddingBottom: `${pageSettings.margins.bottom}px`,
              paddingLeft: `${pageSettings.margins.left}px`,
              paddingRight: `${pageSettings.margins.right}px`,
              backgroundColor: nightCanvasMode && darkMode ? '#1e293b' : pageSettings.pageColor || '#ffffff',
              color: nightCanvasMode && darkMode ? '#f1f5f9' : '#0f172a',
            }}
            className={`shadow-2xl rounded-xs border relative flex flex-col transition-colors ${
              darkMode 
                ? 'border-slate-800 shadow-slate-950/80' 
                : 'border-[#d1d5db] shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
            }`}
          >
            {/* Watermark (if present) */}
            {pageSettings.watermarkText && (
              <div 
                id="doc-watermark"
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0"
              >
                <div 
                  className="text-6xl md:text-8xl font-black text-rose-500/10 uppercase tracking-widest transform -rotate-45"
                  style={{ opacity: pageSettings.watermarkOpacity || 0.15 }}
                >
                  {pageSettings.watermarkText}
                </div>
              </div>
            )}

            {/* Document Header Area */}
            <div 
              id="doc-header"
              className="text-[10px] text-slate-400 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none"
            >
              <span>{pageSettings.headerText || ''}</span>
              <span className="opacity-70">{pageSettings.headerText ? 'Encabezado de Documento' : ''}</span>
            </div>

            {/* Simulated Live Collaborator Cursors inside the document */}
            {collaborators.filter(c => c.status === 'active' && c.cursorPosition).map(collab => (
              <div
                key={collab.id}
                style={{
                  top: `${(collab.cursorPosition?.y || 120) + pageSettings.margins.top}px`,
                  left: `${(collab.cursorPosition?.x || 100) + pageSettings.margins.left}px`,
                }}
                className="absolute pointer-events-none z-30 flex items-center gap-1 transition-all duration-300"
              >
                <div 
                  className="w-0.5 h-5 animate-pulse" 
                  style={{ backgroundColor: collab.color }}
                />
                <span 
                  className="text-[9px] text-white px-1.5 py-0.5 rounded shadow-md font-medium whitespace-nowrap"
                  style={{ backgroundColor: collab.color }}
                >
                  {collab.name}
                </span>
              </div>
            ))}

            {/* Interactive ContentEditable Document Body */}
            <div
              id="word-content-editable"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              style={{ minHeight: `${pageMinHeightPx - 180}px` }}
              className={`flex-1 outline-none font-sans leading-relaxed focus:ring-0 ${columnClass} text-[15px] prose dark:prose-invert max-w-none [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-blue-900 dark:[&>h1]:text-blue-300 [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-blue-800 dark:[&>h2]:text-blue-200 [&>h2]:mt-3 [&>h2]:mb-1.5 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-slate-800 dark:[&>h3]:text-slate-200 [&>p]:mb-2.5 [&>p]:leading-normal [&>table]:w-full [&>table]:border-collapse [&>table]:my-4 [&>table_th]:border [&>table_th]:border-slate-300 dark:[&>table_th]:border-slate-700 [&>table_th]:p-2 [&>table_th]:bg-slate-100 dark:[&>table_th]:bg-slate-800 [&>table_td]:border [&>table_td]:border-slate-300 dark:[&>table_td]:border-slate-700 [&>table_td]:p-2 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-2`}
            />

            {/* Floating Selection Mini Toolbar */}
            {onFormat && onAddComment && (
              <FloatingFormatToolbar
                darkMode={darkMode}
                editorRef={editorRef}
                onFormat={onFormat}
                onAddComment={onAddComment}
              />
            )}

            {/* Document Footer Area with dynamic page number */}
            <div 
              id="doc-footer"
              className="text-[10px] text-slate-400 pt-3 mt-auto border-t border-slate-200 dark:border-slate-800 flex items-center justify-between select-none"
            >
              <span>{pageSettings.footerText || ''}</span>
              <span>Página 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collaborative Comments Sidebar / Panel de Comentarios */}
      {showComments && (
        <aside 
          id="comments-sidebar-panel"
          className={`w-80 border-l flex flex-col shrink-0 select-none z-20 transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          <div className="p-3 border-b flex items-center justify-between border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Comentarios y Discusión ({comments.length})
            </span>
            <button 
              onClick={onCloseComments}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Cerrar panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No hay comentarios aún.<br />
                Selecciona un texto y haz clic en "Nuevo Comentario" en la pestaña Revisar.
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                    comment.resolved
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900/60 shadow-xs'
                  }`}
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {comment.author ? comment.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="font-semibold text-[11px]">{comment.author}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{comment.timestamp}</span>
                  </div>

                  {/* Highlighted text anchor */}
                  {comment.selectedText && (
                    <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/60 border-l-2 border-blue-500 text-[10px] text-blue-800 dark:text-blue-200 italic truncate">
                      "{comment.selectedText}"
                    </div>
                  )}

                  {/* Comment Text */}
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    {comment.text}
                  </p>

                  {/* Replies list */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-3 border-l border-slate-300 dark:border-slate-700 space-y-1.5 my-2">
                      {comment.replies.map(r => (
                        <div key={r.id} className="text-[10px]">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{r.author}:</div>
                          <div className="text-slate-600 dark:text-slate-400">{r.text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions (Resolve, Reply, Delete) */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                    <button
                      onClick={() => onResolveComment(comment.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Check className="w-3 h-3" />
                      <span>{comment.resolved ? 'Reabrir' : 'Resolver'}</span>
                    </button>

                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="text-rose-500 hover:text-rose-600 p-0.5 rounded"
                      title="Eliminar comentario"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Reply Input Box */}
                  <div className="flex items-center gap-1 pt-1">
                    <input
                      type="text"
                      placeholder="Responder..."
                      value={replyInputs[comment.id] || ''}
                      onChange={(e) => setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && replyInputs[comment.id]?.trim()) {
                          onReplyComment(comment.id, replyInputs[comment.id].trim());
                          setReplyInputs({ ...replyInputs, [comment.id]: '' });
                        }
                      }}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-[10px] outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (replyInputs[comment.id]?.trim()) {
                          onReplyComment(comment.id, replyInputs[comment.id].trim());
                          setReplyInputs({ ...replyInputs, [comment.id]: '' });
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-medium"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
