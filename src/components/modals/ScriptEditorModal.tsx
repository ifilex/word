import React, { useState } from 'react';
import { 
  X, 
  Play, 
  FileCode2, 
  Terminal, 
  BookOpen, 
  Copy, 
  Save, 
  Trash2, 
  Check, 
  AlertTriangle,
  Code,
  Sparkles
} from 'lucide-react';
import { PRESET_SCRIPTS, executeDocumentScript, ScriptExecutionContext } from '../../utils/scriptEngine';
import { ScriptMacro } from '../../types/document';

interface ScriptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  content: string;
  onUpdateContent: (html: string) => void;
}

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  content,
  onUpdateContent,
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(PRESET_SCRIPTS[0].id);
  const [code, setCode] = useState<string>(PRESET_SCRIPTS[0].code);
  const [logs, setLogs] = useState<Array<{ id: string; text: string; type: 'info' | 'success' | 'warn' | 'error'; time: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const currentPreset = PRESET_SCRIPTS.find(s => s.id === selectedScriptId);

  const handleSelectPreset = (script: ScriptMacro) => {
    setSelectedScriptId(script.id);
    setCode(script.code);
  };

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        text: message,
        type,
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleRunScript = async () => {
    setIsRunning(true);
    addLog(`Ejecutando script "${currentPreset?.name || 'Personalizado'}"...`, 'info');

    let workingContent = content;

    const context: ScriptExecutionContext = {
      getContent: () => workingContent,
      setContent: (newHtml: string) => {
        workingContent = newHtml;
        onUpdateContent(newHtml);
      },
      insertHtml: (htmlToInsert: string) => {
        workingContent += htmlToInsert;
        onUpdateContent(workingContent);
      },
      getText: () => {
        const div = document.createElement('div');
        div.innerHTML = workingContent;
        return div.innerText || div.textContent || '';
      },
      log: (msg: string, type = 'info') => {
        addLog(msg, type);
      }
    };

    const result = await executeDocumentScript(code, context);
    setIsRunning(false);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div 
      id="modal-script-editor"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className={`w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 px-6 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/15 text-purple-600 flex items-center justify-center">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Entorno de Automatización & Scripts (Office JS)</h2>
              <p className="text-xs text-slate-500">
                Escribe macros y scripts en JavaScript para procesar, dar formato y transformar el documento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-run-script-now"
              onClick={handleRunScript}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Ejecutando...' : 'Ejecutar Script'}</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Grid: Presets Sidebar + Code Editor + Console Output */}
        <div className="flex-1 flex overflow-hidden">
          {/* Presets Library Sidebar */}
          <aside className={`w-64 border-r p-3 overflow-y-auto flex flex-col gap-2 shrink-0 ${
            darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'
          }`}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
              Biblioteca de Macros
            </span>

            {PRESET_SCRIPTS.map((script) => {
              const isSelected = selectedScriptId === script.id;
              return (
                <div
                  key={script.id}
                  onClick={() => handleSelectPreset(script)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-600/10 border-purple-500 text-purple-600 dark:text-purple-300 font-semibold'
                      : darkMode
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs mb-1">{script.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal line-clamp-2 leading-snug">
                    {script.description}
                  </div>
                </div>
              );
            })}
          </aside>

          {/* Center / Right: Code Area + Console */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Code Editor Area */}
            <div className="flex-1 flex flex-col border-b border-slate-200 dark:border-slate-800 p-3">
              <div className="flex items-center justify-between pb-2 text-xs">
                <span className="font-mono text-purple-600 font-semibold flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  Script activo: {currentPreset?.name || 'Personalizado'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Variables globales: <code>getContent()</code>, <code>setContent(html)</code>, <code>log(msg)</code>
                </span>
              </div>

              <textarea
                id="textarea-script-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl outline-none resize-none border border-slate-800 leading-relaxed shadow-inner"
              />
            </div>

            {/* Console Log Terminal */}
            <div className="h-44 flex flex-col bg-slate-950 text-slate-200 p-3 select-text">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Consola de Salida ({logs.length} eventos)</span>
                </div>
                <button
                  onClick={handleClearLogs}
                  className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto font-mono text-[11px] p-2 space-y-1">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">Haz clic en "Ejecutar Script" para ver los resultados aquí.</div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 ${
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'error' ? 'text-rose-400' :
                        log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      <span className="text-slate-600 text-[9px] shrink-0">[{log.time}]</span>
                      <span className="break-all">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
