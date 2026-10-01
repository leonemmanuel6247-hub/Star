import React, { useState } from 'react';
import {
  List,
  FileText,
  Search,
  X,
  ChevronRight,
  Hash
} from 'lucide-react';

interface HeadingItem {
  id: string;
  level: number;
  text: string;
}

interface NavigationPaneProps {
  isOpen: boolean;
  onClose: () => void;
  headings: HeadingItem[];
  onSelectHeading: (text: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResultsCount: number;
}

export const NavigationPane: React.FC<NavigationPaneProps> = ({
  isOpen,
  onClose,
  headings,
  onSelectHeading,
  searchQuery,
  onSearchChange,
  searchResultsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'headings' | 'pages' | 'results'>('headings');

  if (!isOpen) return null;

  return (
    <aside className="w-64 sm:w-72 bg-slate-900 border-r border-slate-750 flex flex-col h-full shadow-xl z-20 text-slate-100 select-none animate-in slide-in-from-left-4 duration-150 shrink-0">
      {/* Top Bar */}
      <header className="h-10 bg-slate-850 border-b border-slate-750 px-3 flex items-center justify-between shrink-0">
        <span className="font-bold text-xs text-slate-200">Volet de navigation</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-750 rounded text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Search Input in Navigation Pane */}
      <div className="p-2 border-b border-slate-750 bg-slate-850">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher dans le document..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (e.target.value && activeTab !== 'results') {
                setActiveTab('results');
              }
            }}
            className="w-full bg-slate-800 text-xs pl-8 pr-2 py-1.5 rounded-lg border border-slate-700 text-white outline-none focus:border-blue-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* 3 Navigation Tabs */}
      <div className="h-9 bg-slate-850 border-b border-slate-750 px-2 flex items-center gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('headings')}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors text-center ${
            activeTab === 'headings' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Titres ({headings.length})
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors text-center ${
            activeTab === 'pages' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Pages
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors text-center ${
            activeTab === 'results' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Résultats ({searchResultsCount})
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {activeTab === 'headings' && (
          <div className="space-y-1">
            {headings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-[11px]">
                Aucun style de titre (Titre 1, Titre 2) appliqué dans ce document.
              </div>
            ) : (
              headings.map((h, i) => (
                <button
                  key={i}
                  onClick={() => onSelectHeading(h.text)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 ${
                    h.level === 1 ? 'font-semibold text-white pl-2' : h.level === 2 ? 'pl-5 text-slate-300' : 'pl-7 text-slate-400'
                  }`}
                >
                  <Hash className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="truncate">{h.text}</span>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-3 p-2">
            <div className="border border-slate-700 bg-white/5 rounded-lg p-2 flex flex-col items-center hover:border-blue-500 cursor-pointer">
              <div className="w-20 h-28 bg-white rounded shadow-sm flex items-center justify-center text-[10px] text-slate-400 font-mono">
                Page 1
              </div>
              <span className="text-[10px] text-slate-300 mt-1 font-semibold">1. Standard A4</span>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-2 p-1">
            <div className="text-[11px] text-slate-400">
              {searchResultsCount} correspondance(s) pour "{searchQuery}"
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
