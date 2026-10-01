import React from 'react';
import {
  X,
  HardDrive,
  ShieldCheck,
  Lock,
  Cloud,
  Palette,
  Globe,
  Download,
  Upload,
  Info,
  ExternalLink,
  Trash2,
  FileText,
  Table2,
  Presentation,
  FileCheck,
  RefreshCw,
  FolderArchive
} from 'lucide-react';
import { AppSettings, OfficeFile } from '../types/office';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  files: OfficeFile[];
  onSelectTab: (tab: string) => void;
  onOpenPinSetup: () => void;
  onExportAllData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  files,
  onSelectTab,
  onOpenPinSetup,
  onExportAllData,
  onImportData,
}) => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalBytes = files.reduce((acc, f) => acc + (f.size || 1024), 0);
  const formattedSize = (totalBytes / 1024).toFixed(1) + ' Ko';

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onUpdateSettings({ lastSyncTime: Date.now() });
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-50 flex overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-80 max-w-[85%] h-full bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-br from-indigo-900/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-tight">StarOffice</h2>
              <p className="text-xs text-indigo-300">v2.4.0 LTS • Open Source</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm text-slate-300">
          {/* Storage Stat Card */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Stockage Documents
              </span>
              <span className="text-xs font-mono text-indigo-300 font-bold">{formattedSize}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full w-[24%]"></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
              <span>{files.length} fichiers enregistrés</span>
              <span className="text-emerald-400 font-medium">✓ Hors-ligne 100%</span>
            </p>
          </div>

          {/* Quick Module Navigation */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Modules Bureautique
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => { onSelectTab('writer'); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="flex-1">Writer (Texte .docx)</span>
                <span className="text-xs text-slate-400 font-mono">
                  {files.filter((f) => f.type === 'writer').length}
                </span>
              </button>

              <button
                onClick={() => { onSelectTab('calc'); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <Table2 className="w-4 h-4 text-emerald-400" />
                <span className="flex-1">Calc (Tableur .xlsx)</span>
                <span className="text-xs text-slate-400 font-mono">
                  {files.filter((f) => f.type === 'calc').length}
                </span>
              </button>

              <button
                onClick={() => { onSelectTab('impress'); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <Presentation className="w-4 h-4 text-amber-400" />
                <span className="flex-1">Impress (Diapos .pptx)</span>
                <span className="text-xs text-slate-400 font-mono">
                  {files.filter((f) => f.type === 'impress').length}
                </span>
              </button>

              <button
                onClick={() => { onSelectTab('pdf'); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <FileCheck className="w-4 h-4 text-rose-400" />
                <span className="flex-1">PDF Studio & Signature</span>
                <span className="text-xs text-slate-400 font-mono">
                  {files.filter((f) => f.type === 'pdf').length}
                </span>
              </button>

              <button
                onClick={() => { onSelectTab('files'); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
              >
                <FolderArchive className="w-4 h-4 text-purple-400" />
                <span className="flex-1">Gestionnaire de Fichiers</span>
              </button>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Sécurité & Vie Privée
            </div>
            
            <button
              onClick={onOpenPinSetup}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Verrouillage Code PIN</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                settings.pinLockEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {settings.pinLockEnabled ? 'Activé' : 'Désactivé'}
              </span>
            </button>

            <div className="px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zéro pub, zéro traqueur, chiffrement sandbox local.</span>
            </div>
          </div>

          {/* Cloud Sync Simulation */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Synchronisation
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  <span>Nextcloud / WebDAV</span>
                </div>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="text-xs flex items-center gap-1 text-indigo-300 hover:text-indigo-200 bg-indigo-600/30 px-2 py-1 rounded"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Synchro...' : 'Synchroniser'}
                </button>
              </div>
              <div className="text-[11px] text-slate-400">
                Dernière synchro : {settings.lastSyncTime ? new Date(settings.lastSyncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
              </div>
            </div>
          </div>

          {/* Backup & Data */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Sauvegarde & Restauration
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportAllData}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Exporter (.json)
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" /> Importer
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportData}
                className="hidden"
              />
            </div>
          </div>

          {/* About / Open Source */}
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1 px-2">
            <div className="font-semibold text-slate-300">Licence Libre GNU GPLv3</div>
            <p className="text-[11px]">StarOffice pour Android est un projet libre et respectueux de la vie privée.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
