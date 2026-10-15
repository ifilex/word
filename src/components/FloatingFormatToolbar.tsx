import React, { useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Highlighter, 
  Type, 
  Heading1, 
  Heading2, 
  MessageSquarePlus,
  RemoveFormatting,
  List,
  ListOrdered
} from 'lucide-react';

interface FloatingFormatToolbarProps {
  darkMode: boolean;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onFormat: (command: string, value?: string) => void;
  onAddComment: () => void;
}

export const FloatingFormatToolbar: React.FC<FloatingFormatToolbarProps> = ({
  darkMode,
  editorRef,
  onFormat,
  onAddComment,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !editorRef.current) {
        setVisible(false);
        return;
      }

      // Check if selection is inside editorRef
      if (!editorRef.current.contains(selection.anchorNode)) {
        setVisible(false);
        return;
      }

      const text = selection.toString().trim();
      if (text.length === 0) {
        setVisible(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        setVisible(false);
        return;
      }

      // Position toolbar above the selection
      const top = Math.max(10, rect.top - 48);
      const left = Math.max(10, rect.left + (rect.width / 2) - 150);

      setPosition({ top, left });
      setVisible(true);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [editorRef]);

  if (!visible) return null;

  const btnClass = `p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center`;

  return (
    <div
      id="floating-selection-toolbar"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 60,
      }}
      className={`flex items-center gap-0.5 p-1 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none ${
        darkMode 
          ? 'bg-slate-900/95 border-slate-700 text-slate-200 shadow-slate-950/80' 
          : 'bg-white/95 border-slate-300 text-slate-800 shadow-slate-400/50'
      }`}
      onMouseDown={(e) => {
        // Prevent selection from clearing when clicking toolbar buttons
        e.preventDefault();
      }}
    >
      <button
        onClick={() => onFormat('bold')}
        className={btnClass}
        title="Negrita (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onFormat('italic')}
        className={btnClass}
        title="Cursiva (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onFormat('underline')}
        className={btnClass}
        title="Subrayado (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onFormat('strikeThrough')}
        className={btnClass}
        title="Tachado"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

      <button
        onClick={() => onFormat('hiliteColor', '#fef08a')}
        className={btnClass}
        title="Resaltar en Amarillo"
      >
        <Highlighter className="w-3.5 h-3.5 text-amber-500" />
      </button>

      <button
        onClick={() => onFormat('foreColor', '#1d4ed8')}
        className={btnClass}
        title="Color Azul Word"
      >
        <Type className="w-3.5 h-3.5 text-blue-600" />
      </button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

      <button
        onClick={() => onFormat('formatBlock', '<h1>')}
        className={btnClass}
        title="Título 1"
      >
        <Heading1 className="w-3.5 h-3.5 text-blue-600" />
      </button>

      <button
        onClick={() => onFormat('formatBlock', '<h2>')}
        className={btnClass}
        title="Título 2"
      >
        <Heading2 className="w-3.5 h-3.5 text-indigo-600" />
      </button>

      <button
        onClick={() => onFormat('insertUnorderedList')}
        className={btnClass}
        title="Viñetas"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

      <button
        onClick={() => {
          onAddComment();
          setVisible(false);
        }}
        className={`${btnClass} text-blue-600 dark:text-blue-400 font-medium`}
        title="Añadir comentario sobre la selección"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onFormat('removeFormat')}
        className={btnClass}
        title="Borrar formato"
      >
        <RemoveFormatting className="w-3.5 h-3.5 text-rose-500" />
      </button>
    </div>
  );
};
