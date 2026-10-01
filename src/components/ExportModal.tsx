import React from 'react';
import { X, Download, Printer, Share2, Copy, Check, FileText, Table2, Presentation, FileCheck } from 'lucide-react';
import { OfficeFile } from '../types/office';
import { exportWriterFile, exportCalcFile, exportPresentationFile, triggerPrint, downloadBlob } from '../utils/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: OfficeFile;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, file }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: `Document StarOffice : ${file.name}`,
        });
      } catch (e) {
        // ignored or cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderExportOptions = () => {
    switch (file.type) {
      case 'writer':
        return (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { exportWriterFile(file, 'docx'); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-blue-400 mb-0.5">Microsoft Word (.docx)</div>
              <div className="text-[11px] text-slate-400">Format universel Word 2016-2026</div>
            </button>
            <button
              onClick={() => { exportWriterFile(file, 'odt'); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-indigo-400 mb-0.5">OpenDocument (.odt)</div>
              <div className="text-[11px] text-slate-400">Format libre LibreOffice & Oasis</div>
            </button>
            <button
              onClick={() => { exportWriterFile(file, 'txt'); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-slate-300 mb-0.5">Texte brut (.txt)</div>
              <div className="text-[11px] text-slate-400">Sans mise en forme, ultra léger</div>
            </button>
            <button
              onClick={() => { exportWriterFile(file, 'html'); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-amber-400 mb-0.5">Page Web (.html)</div>
              <div className="text-[11px] text-slate-400">Format web autonome</div>
            </button>
          </div>
        );

      case 'calc':
        return (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { exportCalcFile(file, 'xlsx'); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-emerald-400 mb-0.5">Excel Classeur (.xlsx)</div>
              <div className="text-[11px] text-slate-400">Compatible Microsoft Excel & 365</div>
            </button>
            <button
              onClick={() => { exportCalcFile(file, 'csv'); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-teal-400 mb-0.5">Fichier CSV (.csv)</div>
              <div className="text-[11px] text-slate-400">Données tabulaires séparées par virgules</div>
            </button>
            <button
              onClick={() => { exportCalcFile(file, 'ods'); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-indigo-400 mb-0.5">OpenDocument (.ods)</div>
              <div className="text-[11px] text-slate-400">Format LibreOffice Calc</div>
            </button>
            <button
              onClick={() => { triggerPrint(); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-rose-400 mb-0.5">Imprimer / PDF</div>
              <div className="text-[11px] text-slate-400">Mise en page prête pour tirage</div>
            </button>
          </div>
        );

      case 'impress':
        return (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => { exportPresentationFile(file); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-amber-400 mb-0.5">PowerPoint / Deck (.json/.pptx)</div>
              <div className="text-[11px] text-slate-400">Sauvegarde structurée complète</div>
            </button>
            <button
              onClick={() => { triggerPrint(); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-rose-400 mb-0.5">Imprimer / Diaporama PDF</div>
              <div className="text-[11px] text-slate-400">Une page par diapositive</div>
            </button>
          </div>
        );

      case 'pdf':
        return (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                const json = JSON.stringify(file.content, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                downloadBlob(blob, `${file.name.replace(/\.[^/.]+$/, '')}_signe.json`);
                onClose();
              }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-rose-400 mb-0.5">Document Signé (.pdf)</div>
              <div className="text-[11px] text-slate-400">Avec signatures & tampons certifiés</div>
            </button>
            <button
              onClick={() => { triggerPrint(); onClose(); }}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all group"
            >
              <div className="font-semibold text-xs text-slate-300 mb-0.5">Impression directe</div>
              <div className="text-[11px] text-slate-400">Vers imprimante Wi-Fi ou PDF</div>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-white">Partager & Exporter</h3>
            <p className="text-xs text-slate-400 truncate max-w-[280px]">{file.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formats Grid */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Choisir un format de téléchargement
          </div>
          {renderExportOptions()}
        </div>

        {/* Quick share actions */}
        <div className="pt-2 border-t border-slate-800 flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/30"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager via Android</span>
          </button>

          <button
            onClick={() => {
              triggerPrint();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700"
            title="Imprimer le document"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
