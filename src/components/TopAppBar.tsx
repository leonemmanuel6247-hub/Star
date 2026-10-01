import React from 'react';
import { Menu, ArrowLeft, Cloud, CloudOff, Check, Share2, MoreVertical, Search, Lock, FileText } from 'lucide-react';
import { OfficeFile, DocumentType } from '../types/office';

interface TopAppBarProps {
  currentFile: OfficeFile | null;
  activeTab: string;
  onOpenDrawer: () => void;
  onBackToHome: () => void;
  onRenameFile?: (newName: string) => void;
  onOpenExport?: () => void;
  onLockApp?: () => void;
  pinEnabled?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentFile,
  activeTab,
  onOpenDrawer,
  onBackToHome,
  onRenameFile,
  onOpenExport,
  onLockApp,
  pinEnabled,
}) => {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [tempTitle, setTempTitle] = React.useState('');

  React.useEffect(() => {
    if (currentFile) {
      setTempTitle(currentFile.name);
    }
  }, [currentFile]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && onRenameFile) {
      onRenameFile(tempTitle.trim());
    }
  };

  const getModuleTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'StarOffice';
      case 'writer':
        return 'Writer • Documents';
      case 'calc':
        return 'Calc • Tableurs';
      case 'impress':
        return 'Impress • Présentations';
      case 'pdf':
        return 'PDF Studio';
      case 'files':
        return 'Gestionnaire de Fichiers';
      default:
        return 'StarOffice';
    }
  };

  const getTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'writer':
        return <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30">DOCX</span>;
      case 'calc':
        return <span className="bg-emerald-600/30 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">XLSX</span>;
      case 'impress':
        return <span className="bg-amber-600/30 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">PPTX</span>;
      case 'pdf':
        return <span className="bg-rose-600/30 text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-500/30">PDF</span>;
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between z-30 shrink-0 text-slate-100 shadow-sm">
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        {currentFile ? (
          <button
            onClick={onBackToHome}
            className="p-2 rounded-full hover:bg-slate-800 active:scale-95 text-slate-300 transition-colors"
            title="Retour à l'accueil"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onOpenDrawer}
            className="p-2 rounded-full hover:bg-slate-800 active:scale-95 text-slate-300 transition-colors"
            title="Menu StarOffice"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {currentFile ? (
          <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
            {getTypeBadge(currentFile.type)}
            {isEditingTitle ? (
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-slate-800 text-white font-medium text-sm px-2 py-0.5 rounded border border-indigo-500 outline-none w-full"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="truncate font-medium text-sm text-slate-100 cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                title="Cliquer pour renommer"
              >
                <span className="truncate">{currentFile.name}</span>
                <span className="text-[11px] text-emerald-400 font-normal flex items-center gap-0.5 shrink-0">
                  <Check className="w-3 h-3" /> Enregistré
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-100 leading-none">
                {getModuleTitle()}
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight">StarOffice Suite</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1 shrink-0">
        {pinEnabled && (
          <button
            onClick={onLockApp}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title="Verrouiller par code PIN"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {currentFile && onOpenExport && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 bg-indigo-600/80 hover:bg-indigo-600 active:scale-95 text-white text-xs px-2.5 py-1.5 rounded-lg transition-all shadow-sm font-medium"
            title="Partager et Exporter"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        )}

        {!currentFile && (
          <div className="flex items-center gap-1 text-slate-400 text-xs px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700/50">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-300 hidden sm:inline">Hors-ligne prêt</span>
          </div>
        )}
      </div>
    </header>
  );
};
