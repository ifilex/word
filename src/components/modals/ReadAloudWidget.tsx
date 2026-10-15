import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, Square, FastForward, Rewind, X, Settings2 } from 'lucide-react';

interface ReadAloudWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  content: string;
}

export const ReadAloudWidget: React.FC<ReadAloudWidgetProps> = ({
  isOpen,
  onClose,
  darkMode,
  content,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        const spanishOrEnglish = available.find(v => v.lang.startsWith('es')) || available[0];
        if (spanishOrEnglish && !selectedVoice) {
          setSelectedVoice(spanishOrEnglish.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  // Clean text from HTML for reading
  const getPlainText = () => {
    const temp = document.createElement('div');
    temp.innerHTML = content;
    return (temp.innerText || temp.textContent || '').trim();
  };

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('La síntesis de voz no es soportada en este navegador.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const text = getPlainText();
    if (!text) {
      alert('El documento está vacío. Escribe algo para poder leerlo en voz alta.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleClose = () => {
    handleStop();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      id="read-aloud-bar"
      className={`fixed bottom-12 right-6 z-40 p-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 select-none animate-in slide-in-from-bottom-4 duration-150 ${
        darkMode ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-300 text-slate-900'
      }`}
    >
      <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
        <Volume2 className="w-5 h-5 text-blue-600 animate-pulse" />
        <div className="text-xs">
          <div className="font-bold">Lectura en Voz Alta</div>
          <div className="text-[10px] text-slate-500">
            {isPlaying ? 'Reproduciendo...' : isPaused ? 'Pausado' : 'Listo para leer'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs font-semibold transition-all hover:scale-105 active:scale-95"
            title="Reproducir lectura"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-semibold transition-all"
            title="Pausar lectura"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
        )}

        <button
          onClick={handleStop}
          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          title="Detener"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Speed Selector */}
        <select
          value={rate}
          onChange={(e) => {
            const newRate = parseFloat(e.target.value);
            setRate(newRate);
            if (isPlaying) {
              handleStop();
              setTimeout(handlePlay, 100);
            }
          }}
          className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
        >
          <option value="0.75">0.75x</option>
          <option value="1.0">1.0x (Normal)</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2.0">2.0x</option>
        </select>
      </div>

      <button
        onClick={handleClose}
        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-1"
        title="Cerrar widget de voz"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
