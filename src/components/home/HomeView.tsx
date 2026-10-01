import React, { useState } from 'react';
import {
  Search,
  FileText,
  Table2,
  Presentation,
  FileCheck,
  Sparkles,
  Clock,
  Star,
  MoreVertical,
  HardDrive,
  ShieldCheck,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { OfficeFile, DocumentType } from '../../types/office';

interface HomeViewProps {
  files: OfficeFile[];
  onOpenFile: (file: OfficeFile) => void;
  onNewFile: (type: DocumentType) => void;
  onOpenTemplates: () => void;
  onToggleFavorite: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  files,
  onOpenFile,
  onNewFile,
  onOpenTemplates,
  onToggleFavorite,
  onDeleteFile,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<'all' | 'recent' | 'favorites'>('recent');

  const filteredFiles = files
    .filter((f) => {
      if (searchQuery.trim()) {
        return f.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      if (selectedTag === 'favorites') {
        return f.isFavorite;
      }
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const getFileIcon = (type: DocumentType) => {
    switch (type) {
      case 'writer':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'calc':
        return <Table2 className="w-5 h-5 text-emerald-400" />;
      case 'impress':
        return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'pdf':
        return <FileCheck className="w-5 h-5 text-rose-400" />;
    }
  };

  const getBadgeColor = (type: DocumentType) => {
    switch (type) {
      case 'writer':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'calc':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'impress':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'pdf':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 p-3 sm:p-6 select-none bg-slate-900 w-full">
      <div className="w-full max-w-4xl mx-auto space-y-5">
        {/* Search Header */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans StarOffice..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Launch Cards */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">
              Créer un nouveau
            </span>
            <button
              onClick={onOpenTemplates}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Modèles Pro
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => onNewFile('writer')}
              className="bg-slate-800/70 hover:bg-slate-800 active:scale-95 border border-slate-700/60 p-3 rounded-2xl flex flex-col items-center text-center transition-all group shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-2 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Writer</span>
              <span className="text-[10px] text-slate-400">Documents .docx</span>
            </button>

            <button
              onClick={() => onNewFile('calc')}
              className="bg-slate-800/70 hover:bg-slate-800 active:scale-95 border border-slate-700/60 p-3 rounded-2xl flex flex-col items-center text-center transition-all group shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-2 shadow-sm">
                <Table2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Calc</span>
              <span className="text-[10px] text-slate-400">Tableurs .xlsx</span>
            </button>

            <button
              onClick={() => onNewFile('impress')}
              className="bg-slate-800/70 hover:bg-slate-800 active:scale-95 border border-slate-700/60 p-3 rounded-2xl flex flex-col items-center text-center transition-all group shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-2 shadow-sm">
                <Presentation className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">Impress</span>
              <span className="text-[10px] text-slate-400">Diaporamas .pptx</span>
            </button>

            <button
              onClick={() => onNewFile('pdf')}
              className="bg-slate-800/70 hover:bg-slate-800 active:scale-95 border border-slate-700/60 p-3 rounded-2xl flex flex-col items-center text-center transition-all group shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform mb-2 shadow-sm">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-200">PDF Studio</span>
              <span className="text-[10px] text-slate-400">Lecture & Signature</span>
            </button>
          </div>
        </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
        <button
          onClick={() => setSelectedTag('recent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedTag === 'recent'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Récents</span>
        </button>

        <button
          onClick={() => setSelectedTag('favorites')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedTag === 'favorites'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Favoris</span>
        </button>

        <button
          onClick={() => onNavigateToTab('files')}
          className="ml-auto text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Tout voir</span>
        </button>
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
            <p className="text-xs">Aucun document trouvé.</p>
            <button
              onClick={() => onNewFile('writer')}
              className="text-xs text-indigo-400 hover:underline font-semibold"
            >
              + Créer mon premier document
            </button>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => onOpenFile(file)}
              className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all active:scale-[0.99] group shadow-sm"
            >
              {/* Icon Container */}
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                {getFileIcon(file.type)}
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                    {file.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded border font-mono ${getBadgeColor(file.type)}`}>
                    {file.extension.toUpperCase()}
                  </span>
                  <span>{(file.size / 1024).toFixed(0)} Ko</span>
                  <span>•</span>
                  <span>
                    {new Date(file.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleFavorite(file.id)}
                  className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${
                    file.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Ajouter aux favoris"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Open Source Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 p-3 rounded-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-white">100% Souverain & Privé :</span> Vos documents restent sur cet appareil.
        </div>
      </div>
      </div>
    </div>
  );
};
