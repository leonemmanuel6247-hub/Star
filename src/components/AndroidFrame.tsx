import React from 'react';
import { Smartphone, Tablet, Monitor, Maximize2 } from 'lucide-react';

interface AndroidFrameProps {
  viewMode: 'mobile' | 'tablet' | 'fluid';
  onViewModeChange: (mode: 'mobile' | 'tablet' | 'fluid') => void;
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  viewMode,
  onViewModeChange,
  children,
}) => {
  // Fluid 100% adaptive mode - perfect for any screen size (mobile, tablet, desktop)
  if (viewMode === 'fluid') {
    return (
      <div className="w-full h-screen h-[100dvh] bg-slate-900 text-slate-100 flex flex-col overflow-hidden relative">
        {children}
      </div>
    );
  }

  // Simulated Device Frame for developers/testing
  return (
    <div className="min-h-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Simulation Toolbar */}
      <header className="py-1.5 px-3 flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 backdrop-blur-md rounded-xl mb-2 border border-slate-800 w-full max-w-xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200 text-xs">Simulateur Écran</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={() => onViewModeChange('mobile')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all ${
              viewMode === 'mobile'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Format Mobile (390px)"
          >
            <Smartphone className="w-3 h-3" />
            <span>Mobile</span>
          </button>
          <button
            onClick={() => onViewModeChange('tablet')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-all ${
              viewMode === 'tablet'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Format Tablette (768px)"
          >
            <Tablet className="w-3 h-3" />
            <span>Tablette</span>
          </button>
          <button
            onClick={() => onViewModeChange('fluid')}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-white"
            title="Plein Écran Adaptatif"
          >
            <Maximize2 className="w-3 h-3 text-indigo-400" />
            <span>Plein Écran</span>
          </button>
        </div>
      </header>

      {/* Frame Container */}
      <main
        className={`w-full transition-all duration-300 flex flex-col flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative ${
          viewMode === 'mobile'
            ? 'max-w-[420px] max-h-[850px]'
            : 'max-w-[860px] max-h-[880px]'
        }`}
      >
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-900">
          {children}
        </div>
      </main>
    </div>
  );
};

