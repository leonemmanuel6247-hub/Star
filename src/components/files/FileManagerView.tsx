import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  HardDrive,
  FileText,
  Table2,
  Presentation,
  FileCheck,
  Search,
  Upload,
  Download,
  Trash2,
  Copy,
  Star,
  MoreVertical,
  ArrowUpDown,
  Filter,
  Plus,
  ExternalLink,
  Edit2
} from 'lucide-react';
import { OfficeFile, DocumentType } from '../../types/office';
import * as XLSX from 'xlsx';

interface FileManagerViewProps {
  files: OfficeFile[];
  onOpenFile: (file: OfficeFile) => void;
  onNewFile: (type: DocumentType) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (file: OfficeFile) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onToggleFavorite: (fileId: string) => void;
  onImportFile: (imported: OfficeFile) => void;
}

export const FileManagerView: React.FC<FileManagerViewProps> = ({
  files,
  onOpenFile,
  onNewFile,
  onDeleteFile,
  onDuplicateFile,
  onRenameFile,
  onToggleFavorite,
  onImportFile,
}) => {
  const [activeFolder, setActiveFolder] = useState<'all' | 'documents' | 'downloads' | 'sdcard'>('all');
  const [filterType, setFilterType] = useState<'all' | DocumentType>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const uploadedFile = fileList[0];
    const name = uploadedFile.name;
    const lowerName = name.toLowerCase();

    let docType: DocumentType = 'writer';
    let ext: any = '.docx';

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv') || lowerName.endsWith('.ods')) {
      docType = 'calc';
      ext = lowerName.endsWith('.csv') ? '.csv' : '.xlsx';
    } else if (lowerName.endsWith('.pptx') || lowerName.endsWith('.odp')) {
      docType = 'impress';
      ext = '.pptx';
    } else if (lowerName.endsWith('.pdf')) {
      docType = 'pdf';
      ext = '.pdf';
    } else {
      docType = 'writer';
      ext = lowerName.endsWith('.txt') ? '.txt' : '.docx';
    }

    if (docType === 'calc') {
      try {
        const buffer = await uploadedFile.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        const cellData: Record<string, any> = {};
        json.forEach((row: any[], rIdx) => {
          row.forEach((val, cIdx) => {
            const colLetter = String.fromCharCode(65 + cIdx);
            cellData[`${colLetter}${rIdx + 1}`] = {
              value: String(val ?? ''),
            };
          });
        });

        const newOfficeFile: OfficeFile = {
          id: `file-${Date.now()}`,
          name,
          type: 'calc',
          extension: ext,
          updatedAt: Date.now(),
          createdAt: Date.now(),
          size: uploadedFile.size,
          isFavorite: false,
          isPinned: false,
          folder: 'documents',
          tags: ['Importé'],
          content: {
            sheets: [
              {
                id: 'sh-imp',
                name: firstSheetName || 'Feuille 1',
                rowCount: Math.max(25, json.length + 5),
                colCount: 12,
                frozenRows: 1,
                frozenCols: 0,
                data: cellData,
              },
            ],
          },
        };

        onImportFile(newOfficeFile);
        return;
      } catch (err) {
        console.error('Error parsing spreadsheet', err);
      }
    }

    // Default text/document read
    const text = await uploadedFile.text();
    const newOfficeFile: OfficeFile = {
      id: `file-${Date.now()}`,
      name,
      type: docType,
      extension: ext,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      size: uploadedFile.size,
      isFavorite: false,
      isPinned: false,
      folder: 'documents',
      tags: ['Importé'],
      content: docType === 'writer' ? {
        html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
        wordCount: text.split(/\s+/).length,
      } : {
        title: name,
        notes: text.slice(0, 200),
      },
    };

    onImportFile(newOfficeFile);
  };

  const filtered = files
    .filter((f) => {
      if (searchQuery.trim() && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterType !== 'all' && f.type !== filterType) {
        return false;
      }
      if (activeFolder !== 'all' && f.folder !== activeFolder) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'size') cmp = a.size - b.size;
      else cmp = a.updatedAt - b.updatedAt;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  const getIcon = (type: DocumentType) => {
    switch (type) {
      case 'writer': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'calc': return <Table2 className="w-5 h-5 text-emerald-400" />;
      case 'impress': return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'pdf': return <FileCheck className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 select-none overflow-hidden text-slate-100">
      {/* Top Search & Filter Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="w-full max-w-4xl mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des fichiers..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => uploadInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all shrink-0"
              title="Importer un fichier de l'appareil"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importer</span>
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept=".docx,.xlsx,.pptx,.pdf,.csv,.txt,.json,.ods,.odt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Folder Breadcrumbs / Location */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <button
              onClick={() => setActiveFolder('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeFolder === 'all' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tous les dossiers
            </button>
            <button
              onClick={() => setActiveFolder('documents')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeFolder === 'documents' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setActiveFolder('downloads')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeFolder === 'downloads' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Téléchargements</span>
            </button>
          </div>

          {/* Type Filter & Sorting */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <div className="flex gap-1 overflow-x-auto">
              {(['all', 'writer', 'calc', 'impress', 'pdf'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    filterType === t
                      ? 'bg-slate-700 text-indigo-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'all' ? 'Tous' : t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Trier :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-800 text-slate-200 rounded px-1.5 py-0.5 border border-slate-700 outline-none"
              >
                <option value="date">Date</option>
                <option value="name">Nom</option>
                <option value="size">Taille</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:text-white"
                title="Inverser l'ordre"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Aucun fichier correspondant dans ce dossier.
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filtered.map((file) => (
              <div
                key={file.id}
                onClick={() => onOpenFile(file)}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 p-3 rounded-2xl flex items-center gap-3 cursor-pointer group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
                  {getIcon(file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  {renamingId === file.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                          if (renameValue.trim()) onRenameFile(file.id, renameValue.trim());
                          setRenamingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (renameValue.trim()) onRenameFile(file.id, renameValue.trim());
                            setRenamingId(null);
                          }
                        }}
                        autoFocus
                        className="bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white outline-none w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 truncate">
                        {file.name}
                      </h4>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono bg-slate-900 px-1 rounded text-slate-300 uppercase">
                      {file.extension}
                    </span>
                    <span>{(file.size / 1024).toFixed(0)} Ko</span>
                    <span>•</span>
                    <span>
                      {new Date(file.updatedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite(file.id)}
                    className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${
                      file.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Favori"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => {
                      setRenamingId(file.id);
                      setRenameValue(file.name);
                    }}
                    className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Renommer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDuplicateFile(file)}
                    className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Dupliquer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-rose-400"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
