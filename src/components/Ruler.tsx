import React from 'react';

interface RulerProps {
  darkMode: boolean;
  pageWidthMm?: number; // default A4 ~210mm
  marginLeftMm: number;
  marginRightMm: number;
  onUpdateMargins: (left: number, right: number) => void;
}

export const TopRuler: React.FC<RulerProps> = ({
  darkMode,
  pageWidthMm = 210,
  marginLeftMm,
  marginRightMm,
  onUpdateMargins,
}) => {
  // 1 cm = 10 mm
  const totalCm = Math.ceil(pageWidthMm / 10);

  return (
    <div 
      id="word-top-ruler"
      className={`h-5 border-b select-none flex items-center relative overflow-hidden text-[9px] ${
        darkMode ? 'bg-slate-800/90 border-slate-700 text-slate-400' : 'bg-[#f8fafc] border-[#e2e8f0] text-slate-500'
      }`}
    >
      <div className="w-8 shrink-0 flex items-center justify-center font-mono text-[8px] opacity-50 border-r border-slate-300 dark:border-slate-700">
        cm
      </div>

      {/* Ruler Track */}
      <div className="relative flex-1 h-full flex items-end">
        {/* Left Margin Shading */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-slate-300/40 dark:bg-slate-900/60 border-r border-blue-500"
          style={{ width: `${(marginLeftMm / pageWidthMm) * 100}%` }}
        />

        {/* Right Margin Shading */}
        <div 
          className="absolute top-0 bottom-0 right-0 bg-slate-300/40 dark:bg-slate-900/60 border-l border-blue-500"
          style={{ width: `${(marginRightMm / pageWidthMm) * 100}%` }}
        />

        {/* Number Ticks */}
        {Array.from({ length: totalCm + 1 }).map((_, i) => {
          const percent = (i / totalCm) * 100;
          return (
            <div
              key={i}
              className="absolute bottom-0 flex flex-col items-center pointer-events-none transform -translate-x-1/2"
              style={{ left: `${percent}%` }}
            >
              <span className="text-[8px] leading-none mb-0.5">{i}</span>
              <div className="h-2 w-px bg-slate-400 dark:bg-slate-600" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
