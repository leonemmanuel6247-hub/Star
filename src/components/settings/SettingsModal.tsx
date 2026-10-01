import React from 'react';
import {
  X,
  Lock,
  Moon,
  Sun,
  Globe,
  Cloud,
  Shield,
  Trash2,
  HardDrive,
  Info,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { AppSettings } from '../../types/office';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenPinSetup: () => void;
  onClearCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenPinSetup,
  onClearCache,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Paramètres StarOffice</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs text-slate-300 pr-1">
          {/* Section: Sécurité & PIN */}
          <div className="space-y-2">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Sécurité & Verrouillage
            </div>
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">Verrouillage par code PIN</div>
                    <div className="text-[11px] text-slate-400">Demande le code à chaque ouverture</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.pinLockEnabled}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onOpenPinSetup();
                    } else {
                      onUpdateSettings({ pinLockEnabled: false });
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              {settings.pinLockEnabled && (
                <button
                  onClick={onOpenPinSetup}
                  className="w-full py-1.5 px-3 bg-slate-700/70 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Modifier mon code PIN
                </button>
              )}
            </div>
          </div>

          {/* Section: Thème d'affichage */}
          <div className="space-y-2">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Thème & Apparence
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white font-semibold'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                Sombre
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'amoled' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.theme === 'amoled'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white font-semibold'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black mx-auto mb-1 border border-slate-700" />
                AMOLED
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.theme === 'light'
                    ? 'border-indigo-500 bg-indigo-600/20 text-white font-semibold'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                Clair
              </button>
            </div>
          </div>

          {/* Section: Langue */}
          <div className="space-y-2">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Langue de l'application
            </div>
            <div className="flex gap-2">
              {[
                { id: 'fr', label: 'Français' },
                { id: 'en', label: 'English' },
                { id: 'es', label: 'Español' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => onUpdateSettings({ language: l.id as any })}
                  className={`flex-1 py-2 rounded-xl text-center border text-xs transition-colors ${
                    settings.language === l.id
                      ? 'border-indigo-500 bg-indigo-600 text-white font-semibold'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Synchronisation Cloud */}
          <div className="space-y-2">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Synchronisation & Sauvegarde
            </div>
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700/60 space-y-2">
              <label className="text-slate-400 block text-[11px]">Fournisseur de stockage distant :</label>
              <select
                value={settings.cloudProvider}
                onChange={(e) => onUpdateSettings({ cloudProvider: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
              >
                <option value="none">Stockage local 100% hors-ligne (Recommandé)</option>
                <option value="nextcloud">Nextcloud / WebDAV Libre</option>
                <option value="drive">Google Drive</option>
                <option value="dropbox">Dropbox</option>
              </select>
            </div>
          </div>

          {/* Section: Nettoyage */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Données Locales
            </div>
            <button
              onClick={onClearCache}
              className="w-full py-2 px-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Réinitialiser les documents d'exemple
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center text-[11px] text-slate-400">
          StarOffice Mobile OS • Licence Libre GNU GPLv3
        </div>
      </div>
    </div>
  );
};
