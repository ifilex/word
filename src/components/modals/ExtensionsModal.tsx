import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Binary, 
  PenTool, 
  QrCode, 
  Check, 
  Play, 
  Square, 
  Copy, 
  Plus,
  RefreshCw,
  Send
} from 'lucide-react';
import { AVAILABLE_EXTENSIONS } from '../../utils/extensions';

interface ExtensionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  activeExtensionId?: string;
  content: string;
  onInsertHtml: (html: string) => void;
  onReplaceContent: (newHtml: string) => void;
}

export const ExtensionsModal: React.FC<ExtensionsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  activeExtensionId = 'ai-copilot',
  content,
  onInsertHtml,
  onReplaceContent,
}) => {
  const [selectedExtension, setSelectedExtension] = useState<string>(activeExtensionId);

  // AI Copilot state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // APA Citation state
  const [citeType, setCiteType] = useState<'book' | 'article' | 'web'>('book');
  const [citeAuthor, setCiteAuthor] = useState('García Márquez, Gabriel');
  const [citeYear, setCiteYear] = useState('1967');
  const [citeTitle, setCiteTitle] = useState('Cien años de soledad');
  const [citePublisher, setCitePublisher] = useState('Editorial Sudamericana');
  const [citeUrl, setCiteUrl] = useState('');

  // TTS State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  // Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('Dra. Valeria Rincón');
  const [signerTitle, setSignerTitle] = useState('Directora de Operaciones');

  // QR Code State
  const [qrUrl, setQrUrl] = useState('https://wordstudio365.app/doc-preview');

  useEffect(() => {
    if (activeExtensionId) {
      setSelectedExtension(activeExtensionId);
    }
  }, [activeExtensionId]);

  if (!isOpen) return null;

  // AI Copilot Handler
  const handleAiGenerate = async (preset?: string) => {
    setAiLoading(true);
    const query = preset || aiPrompt;

    // Simulate smart AI writing assistant for document enhancement
    setTimeout(() => {
      let generated = '';
      if (query.includes('Resumir') || preset === 'resumen') {
        generated = `<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 16px 0;">
          <h4 style="margin-top: 0; color: #166534;">RESUMEN EJECUTIVO AUTOMATIZADO</h4>
          <ul>
            <li><strong>Optimización de procesos:</strong> Adopción de plataformas de procesamiento documental compatibles con OpenXML.</li>
            <li><strong>Colaboración sincrónica:</strong> Sincronización multi-dispositivo con Google Drive, OneDrive y Dropbox.</li>
            <li><strong>Eficiencia operativa:</strong> Reducción del 60% en tiempos de preparación de informes mediante scripts.</li>
          </ul>
        </div>`;
      } else if (query.includes('formal') || preset === 'formal') {
        generated = `<p style="text-align: justify; line-height: 1.6;">
          De conformidad con los requerimientos establecidos en el plan director de digitalización, se hace constar que los procedimientos operacionales han alcanzado un grado óptimo de madurez tecnológica, garantizando la interoperabilidad de los repositorios corporativos y la integridad de la información sensible.
        </p>`;
      } else if (query.includes('conclusión') || preset === 'conclusion') {
        generated = `<h3 style="color: #1e3a8a;">Conclusiones y Recomendaciones Finales</h3>
        <p style="text-align: justify; line-height: 1.6;">
          En conclusión, la suite ofimática implementada consolida un entorno de alta fidelidad visual y operativa. Se recomienda proseguir con la estandarización de macros de automatización para maximizar el retorno de inversión y la satisfacción del usuario final.
        </p>`;
      } else {
        generated = `<p style="line-height: 1.6;">
          <strong>Texto enriquecido:</strong> A través de una metodología integral de análisis y redacción estructurada, se determinó que la optimización de los flujos de trabajo incrementa exponencialmente la coherencia estilística en todos los niveles organizacionales.
        </p>`;
      }

      setAiResult(generated);
      setAiLoading(false);
    }, 600);
  };

  // APA Citation Generator
  const generateApaHtml = () => {
    let text = '';
    if (citeType === 'book') {
      text = `${citeAuthor} (${citeYear}). <em>${citeTitle}</em>. ${citePublisher}.`;
    } else if (citeType === 'article') {
      text = `${citeAuthor} (${citeYear}). ${citeTitle}. <em>Revista Científica de Tecnología</em>, 14(2), 45-58.`;
    } else {
      text = `${citeAuthor} (${citeYear}). <em>${citeTitle}</em>. Recuperado de ${citeUrl || 'https://recursos.edu'}`;
    }

    return `<div style="padding-left: 28px; text-indent: -28px; margin: 8px 0; font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5;">${text}</div>`;
  };

  // Text to Speech
  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textToRead = tempDiv.innerText || tempDiv.textContent || 'No hay texto para leer.';
      
      const utterance = new SpeechSynthesisUtterance(textToRead.slice(0, 1000));
      utterance.lang = 'es-ES';
      utterance.rate = speechRate;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Signature Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = darkMode ? '#38bdf8' : '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const insertSignatureToDoc = () => {
    const signatureBlock = `
      <div style="margin: 24px 0; width: 280px; text-align: center; border-top: 1.5px solid #0f172a; padding-top: 8px;">
        <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #1e40af; margin-bottom: 4px;">
          ${signerName}
        </div>
        <div style="font-weight: bold; font-size: 13px;">${signerName}</div>
        <div style="font-size: 11px; color: #64748b;">${signerTitle}</div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Firmado digitalmente • ${new Date().toLocaleDateString()}</div>
      </div>
    `;
    onInsertHtml(signatureBlock);
    onClose();
  };

  // Math Equations List
  const FORMULAS = [
    { name: 'Fórmula Cuadrática', html: '<p style="text-align: center; font-size: 16px; margin: 12px 0;"><strong>x = (-b ± √(b² - 4ac)) / 2a</strong></p>' },
    { name: 'Teorema de Pitágoras', html: '<p style="text-align: center; font-size: 16px; margin: 12px 0;"><strong>a² + b² = c²</strong></p>' },
    { name: 'Equivalencia Masa-Energía (Einstein)', html: '<p style="text-align: center; font-size: 16px; margin: 12px 0;"><strong>E = mc²</strong></p>' },
    { name: 'Integral Definida', html: '<p style="text-align: center; font-size: 16px; margin: 12px 0;"><strong>∫ [a, b] f(x) dx = F(b) - F(a)</strong></p>' },
    { name: 'Distribución Normal (Gauss)', html: '<p style="text-align: center; font-size: 14px; margin: 12px 0;"><strong>f(x) = (1 / (σ√(2π))) · e^(-(x-μ)² / 2σ²)</strong></p>' }
  ];

  return (
    <div 
      id="modal-extensions-hub"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
    >
      <div 
        className={`w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 px-6 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/15 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Centro de Extensiones & Complementos Word</h2>
              <p className="text-xs text-slate-500">
                Herramientas avanzadas de productividad, citas APA, accesibilidad y firma digital.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className={`w-64 border-r p-3 overflow-y-auto flex flex-col gap-1.5 shrink-0 ${
            darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'
          }`}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
              Complementos Instalados
            </span>

            {AVAILABLE_EXTENSIONS.map((ext) => {
              const isSelected = selectedExtension === ext.id;
              return (
                <button
                  key={ext.id}
                  onClick={() => setSelectedExtension(ext.id)}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : darkMode
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-blue-600'
                  }`}>
                    {ext.id === 'ai-copilot' ? <Sparkles className="w-3.5 h-3.5" /> :
                     ext.id === 'apa-citations' ? <BookOpen className="w-3.5 h-3.5" /> :
                     ext.id === 'text-to-speech' ? <Volume2 className="w-3.5 h-3.5" /> :
                     ext.id === 'math-equations' ? <Binary className="w-3.5 h-3.5" /> :
                     ext.id === 'signature-pad' ? <PenTool className="w-3.5 h-3.5" /> :
                     <QrCode className="w-3.5 h-3.5" />}
                  </div>
                  <div className="truncate">
                    <div className="text-xs truncate">{ext.name}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {ext.category}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Active Extension Workspace */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* EXTENSION 1: AI COPILOT */}
            {selectedExtension === 'ai-copilot' && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base">Asistente de Redacción Copilot IA</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Genera resúmenes, reescribe en tono formal o enriquece párrafos automáticamente.
                </p>

                {/* Preset Prompt Pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => handleAiGenerate('resumen')}
                    className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100"
                  >
                    ✨ Generar Resumen Ejecutivo
                  </button>
                  <button
                    onClick={() => handleAiGenerate('formal')}
                    className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100"
                  >
                    📝 Redactar en Tono Formal
                  </button>
                  <button
                    onClick={() => handleAiGenerate('conclusion')}
                    className="px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100"
                  >
                    🎯 Crear Conclusión Profesional
                  </button>
                </div>

                {/* Custom Prompt Box */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Escribe una instrucción (ej: Mejora la introducción)..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleAiGenerate()}
                    disabled={aiLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{aiLoading ? 'Generando...' : 'Generar'}</span>
                  </button>
                </div>

                {/* AI Result Box */}
                {aiResult && (
                  <div className="mt-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300">Resultado Generado:</div>
                    <div 
                      className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800"
                      dangerouslySetInnerHTML={{ __html: aiResult }}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          onInsertHtml(aiResult);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insertar en el Documento</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EXTENSION 2: APA CITATIONS */}
            {selectedExtension === 'apa-citations' && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-base">Gestor de Citas APA 7ª Edición</h3>
                </div>

                <div className="flex gap-2">
                  {(['book', 'article', 'web'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setCiteType(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        citeType === t ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {t === 'book' ? 'Libro' : t === 'article' ? 'Artículo' : 'Sitio Web'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Autor(es)</label>
                    <input
                      type="text"
                      value={citeAuthor}
                      onChange={(e) => setCiteAuthor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Año de Publicación</label>
                    <input
                      type="text"
                      value={citeYear}
                      onChange={(e) => setCiteYear(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Título de la Obra</label>
                    <input
                      type="text"
                      value={citeTitle}
                      onChange={(e) => setCiteTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">Editorial / URL</label>
                    <input
                      type="text"
                      value={citePublisher}
                      onChange={(e) => setCitePublisher(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-xs">
                  <div className="font-bold text-amber-800 dark:text-amber-300 mb-1">Vista Previa APA 7:</div>
                  <div dangerouslySetInnerHTML={{ __html: generateApaHtml() }} />
                </div>

                <button
                  onClick={() => {
                    onInsertHtml(generateApaHtml());
                    onClose();
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar Cita en el Documento</span>
                </button>
              </div>
            )}

            {/* EXTENSION 3: TEXT TO SPEECH */}
            {selectedExtension === 'text-to-speech' && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base">Narrador de Voz (Lectura en voz alta)</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Escucha el documento para detectar errores de concordancia y ritmo de lectura.
                </p>

                <div className="p-6 rounded-2xl border flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
                  <button
                    onClick={toggleSpeech}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 ${
                      isPlayingAudio ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
                    }`}
                  >
                    {isPlayingAudio ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </button>

                  <div className="text-xs font-semibold">
                    {isPlayingAudio ? 'Leyendo documento en voz alta...' : 'Haz clic para iniciar la lectura'}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Velocidad:</span>
                    {[0.8, 1.0, 1.2, 1.5].map(r => (
                      <button
                        key={r}
                        onClick={() => setSpeechRate(r)}
                        className={`px-2 py-0.5 rounded font-mono ${
                          speechRate === r ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* EXTENSION 4: MATH FORMULAS */}
            {selectedExtension === 'math-equations' && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Binary className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-base">Biblioteca de Ecuaciones Matemáticas</h3>
                </div>

                <div className="space-y-2">
                  {FORMULAS.map((formula, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border flex items-center justify-between hover:border-purple-500 transition-all bg-white dark:bg-slate-900"
                    >
                      <div>
                        <div className="font-semibold text-xs text-purple-600">{formula.name}</div>
                        <div dangerouslySetInnerHTML={{ __html: formula.html }} />
                      </div>
                      <button
                        onClick={() => {
                          onInsertHtml(formula.html);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insertar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXTENSION 5: SIGNATURE PAD */}
            {selectedExtension === 'signature-pad' && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base">Panel de Firma Digital</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Nombre del Firmante</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Cargo / Título</label>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Traza tu firma aquí:</span>
                    <button
                      onClick={clearSignature}
                      className="text-rose-500 hover:underline text-[11px]"
                    >
                      Limpiar trazo
                    </button>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-36 bg-white dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-crosshair"
                  />
                </div>

                <button
                  onClick={insertSignatureToDoc}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar Sello y Firma en Documento</span>
                </button>
              </div>
            )}

            {/* EXTENSION 6: QR CODE */}
            {selectedExtension === 'qr-generator' && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-base">Generador de Códigos QR</h3>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-400 mb-1">URL o Texto del Código QR</label>
                  <input
                    type="text"
                    value={qrUrl}
                    onChange={(e) => setQrUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-2 text-xs font-mono"
                  />
                </div>

                <div className="p-6 rounded-2xl border flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
                    alt="QR Code"
                    className="w-32 h-32 border p-2 bg-white rounded-lg shadow-xs"
                  />
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{qrUrl}</span>
                </div>

                <button
                  onClick={() => {
                    const qrHtml = `<div style="text-align: center; margin: 16px 0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}" alt="QR Code" style="width: 120px; height: 120px; border: 1px solid #cbd5e1; padding: 4px; border-radius: 6px;"><p style="font-size: 10px; color: #64748b; margin-top: 4px;">Escanear enlace</p></div>`;
                    onInsertHtml(qrHtml);
                    onClose();
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar Código QR en el Documento</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
