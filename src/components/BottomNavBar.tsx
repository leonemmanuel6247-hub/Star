import React from 'react';
import { Home, FileText, Table2, Presentation, FileCheck, FolderArchive } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasActiveFile: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  hasActiveFile,
}) => {
  if (hasActiveFile) {
    // When editing a document, the bottom bar is suppressed or minimized to provide full viewport
    return null;
  }

  const navItems = [
    { id: 'home', label: 'Accueil', icon: Home, color: 'text-indigo-400' },
    { id: 'writer', label: 'Writer', icon: FileText, color: 'text-blue-400' },
    { id: 'calc', label: 'Calc', icon: Table2, color: 'text-emerald-400' },
    { id: 'impress', label: 'Impress', icon: Presentation, color: 'text-amber-400' },
    { id: 'pdf', label: 'PDF', icon: FileCheck, color: 'text-rose-400' },
    { id: 'files', label: 'Fichiers', icon: FolderArchive, color: 'text-purple-400' },
  ];

  return (
    <nav className="h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-1 sm:px-4 flex items-center shrink-0 z-40 select-none w-full">
      <div className="w-full max-w-xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 group transition-all"
            >
              {/* Pill indicator for Material 3 look */}
              <div
                className={`w-10 sm:w-12 h-6 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 scale-105 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? item.color : 'text-slate-400'}`} />
              </div>
              <span
                className={`text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 font-medium transition-colors ${
                  isActive ? 'text-indigo-200 font-semibold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
