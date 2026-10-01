import React, { useState } from 'react';
import { Plus, FileText, Table2, Presentation, FileCheck, Sparkles, X } from 'lucide-react';
import { DocumentType } from '../types/office';

interface FloatingSpeedDialProps {
  onNewDocument: (type: DocumentType) => void;
  onOpenTemplates: () => void;
  isVisible: boolean;
}

export const FloatingSpeedDial: React.FC<FloatingSpeedDialProps> = ({
  onNewDocument,
  onOpenTemplates,
  isVisible,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible) return null;

  const actions = [
    {
      label: 'Modèles Pro',
      icon: Sparkles,
      color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      onClick: () => {
        setIsOpen(false);
        onOpenTemplates();
      },
    },
    {
      label: 'PDF & Signature',
      icon: FileCheck,
      color: 'bg-rose-600 text-white',
      onClick: () => {
        setIsOpen(false);
        onNewDocument('pdf');
      },
    },
    {
      label: 'Présentation Impress',
      icon: Presentation,
      color: 'bg-amber-600 text-white',
      onClick: () => {
        setIsOpen(false);
        onNewDocument('impress');
      },
    },
    {
      label: 'Tableur Calc',
      icon: Table2,
      color: 'bg-emerald-600 text-white',
      onClick: () => {
        setIsOpen(false);
        onNewDocument('calc');
      },
    },
    {
      label: 'Document Writer',
      icon: FileText,
      color: 'bg-blue-600 text-white',
      onClick: () => {
        setIsOpen(false);
        onNewDocument('writer');
      },
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Speed Dial Menu Container */}
      <div className="absolute bottom-20 right-4 z-50 flex flex-col items-end gap-2.5">
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-5 duration-200">
            {actions.map((act, index) => {
              const Icon = act.icon;
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-md shadow-md font-medium border border-slate-700/60">
                    {act.label}
                  </span>
                  <button
                    onClick={act.onClick}
                    className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${act.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Floating Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all duration-300 ${
            isOpen
              ? 'bg-slate-700 text-white rotate-45'
              : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white hover:shadow-indigo-500/25 shadow-indigo-600/30'
          }`}
          title="Créer un nouveau document"
        >
          {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
        </button>
      </div>
    </>
  );
};
