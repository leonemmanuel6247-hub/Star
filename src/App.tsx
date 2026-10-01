/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OfficeFile, DocumentType, AppSettings } from './types/office';
import {
  loadFiles,
  saveFiles,
  loadSettings,
  saveSettings,
  INITIAL_FILES,
  DEFAULT_SETTINGS
} from './utils/storage';
import { downloadBlob } from './utils/export';

// Components
import { AndroidFrame } from './components/AndroidFrame';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { FloatingSpeedDial } from './components/FloatingSpeedDial';
import { DrawerMenu } from './components/DrawerMenu';
import { PinLockModal } from './components/PinLockModal';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/settings/SettingsModal';

// Views
import { HomeView } from './components/home/HomeView';
import { WriterEditor } from './components/writer/WriterEditor';
import { CalcEditor } from './components/calc/CalcEditor';
import { ImpressEditor } from './components/impress/ImpressEditor';
import { PdfViewer } from './components/pdf/PdfViewer';
import { FileManagerView } from './components/files/FileManagerView';

export default function App() {
  const [files, setFiles] = useState<OfficeFile[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentFile, setCurrentFile] = useState<OfficeFile | null>(null);

  // Modals & Panels
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'setup' | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedF = loadFiles();
    const loadedS = loadSettings();
    setFiles(loadedF);
    setSettings(loadedS);

    if (loadedS.pinLockEnabled) {
      setIsLocked(true);
      setPinModalMode('unlock');
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateFiles = (newFiles: OfficeFile[]) => {
    setFiles(newFiles);
    saveFiles(newFiles);
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveSettings(updated);
    showToast('Paramètres mis à jour');
  };

  // Open file in its editor
  const handleOpenFile = (file: OfficeFile) => {
    setCurrentFile(file);
    setActiveTab(file.type);
  };

  // Create new blank file
  const handleNewFile = (type: DocumentType) => {
    let name = 'Nouveau_Document.docx';
    let ext: any = '.docx';
    let content: any = { html: '<p>Commencez à rédiger votre texte ici...</p>', wordCount: 7 };

    if (type === 'calc') {
      name = 'Nouveau_Classeur.xlsx';
      ext = '.xlsx';
      content = {
        sheets: [
          {
            id: 'sh-1',
            name: 'Feuille 1',
            rowCount: 20,
            colCount: 8,
            frozenRows: 1,
            frozenCols: 0,
            data: {
              A1: { value: 'Désignation', bold: true },
              B1: { value: 'Montant (€)', bold: true },
            },
          },
        ],
      };
    } else if (type === 'impress') {
      name = 'Nouvelle_Presentation.pptx';
      ext = '.pptx';
      content = {
        slides: [
          {
            id: 's-1',
            title: 'Titre de la présentation',
            subtitle: 'Sous-titre et présentation',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            transition: 'fade',
            notes: '',
            elements: [],
          },
        ],
      };
    } else if (type === 'pdf') {
      name = 'Formulaire_Document.pdf';
      ext = '.pdf';
      content = {
        title: 'Nouveau Formulaire StarOffice',
        docReference: `SO-${Date.now().toString().slice(-4)}`,
        totalPages: 1,
        signeeName: '',
        formFields: {},
        annotations: [],
      };
    }

    const newDoc: OfficeFile = {
      id: `doc-${Date.now()}`,
      name,
      type,
      extension: ext,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      size: 15400,
      isFavorite: false,
      isPinned: false,
      folder: 'documents',
      tags: ['Brouillon'],
      content,
    };

    const updated = [newDoc, ...files];
    handleUpdateFiles(updated);
    handleOpenFile(newDoc);
    showToast(`Nouveau fichier créé : ${name}`);
  };

  // Update current file content
  const handleUpdateCurrentFile = (partial: Partial<OfficeFile>) => {
    if (!currentFile) return;
    const updatedFile = { ...currentFile, ...partial, updatedAt: Date.now() };
    setCurrentFile(updatedFile);

    const updatedFiles = files.map((f) => (f.id === updatedFile.id ? updatedFile : f));
    handleUpdateFiles(updatedFiles);
  };

  const handleRenameCurrentFile = (newName: string) => {
    if (!currentFile) return;
    handleUpdateCurrentFile({ name: newName });
    showToast(`Fichier renommé en : ${newName}`);
  };

  const handleDeleteFile = (fileId: string) => {
    const updated = files.filter((f) => f.id !== fileId);
    handleUpdateFiles(updated);
    if (currentFile?.id === fileId) {
      setCurrentFile(null);
      setActiveTab('home');
    }
    showToast('Fichier supprimé');
  };

  const handleDuplicateFile = (file: OfficeFile) => {
    const copy: OfficeFile = {
      ...file,
      id: `file-${Date.now()}`,
      name: `${file.name.replace(/\.[^/.]+$/, '')}_Copie${file.extension}`,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    handleUpdateFiles([copy, ...files]);
    showToast(`Copie créée : ${copy.name}`);
  };

  const handleToggleFavorite = (fileId: string) => {
    const updated = files.map((f) =>
      f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f
    );
    handleUpdateFiles(updated);
  };

  // Template creation
  const handleSelectTemplate = (templateData: Partial<OfficeFile>) => {
    const newDoc: OfficeFile = {
      id: `doc-${Date.now()}`,
      name: templateData.name || 'Modèle_StarOffice.docx',
      type: templateData.type || 'writer',
      extension: templateData.extension || '.docx',
      updatedAt: Date.now(),
      createdAt: Date.now(),
      size: templateData.size || 25000,
      isFavorite: false,
      isPinned: false,
      folder: 'documents',
      tags: ['Modèle'],
      content: templateData.content,
    };
    const updated = [newDoc, ...files];
    handleUpdateFiles(updated);
    handleOpenFile(newDoc);
    showToast(`Modèle initialisé avec succès !`);
  };

  // Export all backup JSON
  const handleExportAllData = () => {
    const data = JSON.stringify({ files, settings, exportedAt: new Date() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    downloadBlob(blob, `StarOffice_Sauvegarde_${new Date().toISOString().slice(0, 10)}.json`);
    showToast('Sauvegarde exportée');
  };

  // Import JSON backup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (parsed.files && Array.isArray(parsed.files)) {
        handleUpdateFiles(parsed.files);
        showToast(`${parsed.files.length} fichiers restaurés`);
      }
    } catch (err) {
      showToast('Erreur lors de la lecture du fichier de sauvegarde.');
    }
  };

  const handleClearCache = () => {
    if (confirm('Voulez-vous restaurer les documents d exemple initiaux ?')) {
      handleUpdateFiles(INITIAL_FILES);
      showToast('Documents d exemple réinitialisés.');
      setIsSettingsOpen(false);
    }
  };

  return (
    <AndroidFrame
      viewMode={settings.viewMode}
      onViewModeChange={(mode) => handleUpdateSettings({ viewMode: mode })}
    >
      {/* Top Application Bar */}
      <TopAppBar
        currentFile={currentFile}
        activeTab={activeTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onBackToHome={() => {
          setCurrentFile(null);
          setActiveTab('home');
        }}
        onRenameFile={handleRenameCurrentFile}
        onOpenExport={() => setIsExportOpen(true)}
        onLockApp={() => {
          setIsLocked(true);
          setPinModalMode('unlock');
        }}
        pinEnabled={settings.pinLockEnabled}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {currentFile ? (
          // Current Open Editor View
          currentFile.type === 'writer' ? (
            <WriterEditor
              file={currentFile}
              onUpdateFile={handleUpdateCurrentFile}
              onCloseDocument={() => {
                setCurrentFile(null);
                setActiveTab('home');
              }}
              onNewDocument={() => handleNewFile('writer')}
            />
          ) : currentFile.type === 'calc' ? (
            <CalcEditor file={currentFile} onUpdateFile={handleUpdateCurrentFile} />
          ) : currentFile.type === 'impress' ? (
            <ImpressEditor file={currentFile} onUpdateFile={handleUpdateCurrentFile} />
          ) : (
            <PdfViewer file={currentFile} onUpdateFile={handleUpdateCurrentFile} />
          )
        ) : (
          // Main Navigation Screens
          activeTab === 'home' ? (
            <HomeView
              files={files}
              onOpenFile={handleOpenFile}
              onNewFile={handleNewFile}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
              onToggleFavorite={handleToggleFavorite}
              onDeleteFile={handleDeleteFile}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          ) : activeTab === 'files' ? (
            <FileManagerView
              files={files}
              onOpenFile={handleOpenFile}
              onNewFile={handleNewFile}
              onDeleteFile={handleDeleteFile}
              onDuplicateFile={handleDuplicateFile}
              onRenameFile={(id, name) => {
                const updated = files.map((f) => (f.id === id ? { ...f, name } : f));
                handleUpdateFiles(updated);
              }}
              onToggleFavorite={handleToggleFavorite}
              onImportFile={(imp) => {
                handleUpdateFiles([imp, ...files]);
                handleOpenFile(imp);
                showToast(`Fichier importé : ${imp.name}`);
              }}
            />
          ) : (
            // Module-specific quick list
            <FileManagerView
              files={files.filter((f) => f.type === activeTab)}
              onOpenFile={handleOpenFile}
              onNewFile={handleNewFile}
              onDeleteFile={handleDeleteFile}
              onDuplicateFile={handleDuplicateFile}
              onRenameFile={(id, name) => {
                const updated = files.map((f) => (f.id === id ? { ...f, name } : f));
                handleUpdateFiles(updated);
              }}
              onToggleFavorite={handleToggleFavorite}
              onImportFile={(imp) => {
                handleUpdateFiles([imp, ...files]);
                handleOpenFile(imp);
              }}
            />
          )
        )}
      </div>

      {/* Material 3 Floating Speed Dial (only shown when not inside an editor) */}
      <FloatingSpeedDial
        isVisible={!currentFile}
        onNewDocument={handleNewFile}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />

      {/* Material 3 Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setCurrentFile(null);
          setActiveTab(tab);
        }}
        hasActiveFile={!!currentFile}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        files={files}
        onSelectTab={(tab) => {
          setCurrentFile(null);
          setActiveTab(tab);
        }}
        onOpenPinSetup={() => {
          setIsDrawerOpen(false);
          setPinModalMode('setup');
        }}
        onExportAllData={handleExportAllData}
        onImportData={handleImportBackup}
      />

      {/* PIN Lock Keypad Modal */}
      {isLocked && pinModalMode && (
        <PinLockModal
          isOpen={true}
          mode={pinModalMode}
          currentPin={settings.pinCode}
          onSuccess={(newPin) => {
            if (pinModalMode === 'setup' && newPin) {
              handleUpdateSettings({ pinLockEnabled: true, pinCode: newPin });
              showToast('Code PIN configuré avec succès !');
            }
            setIsLocked(false);
            setPinModalMode(null);
          }}
          onCancel={() => {
            if (pinModalMode === 'setup') {
              setPinModalMode(null);
            }
          }}
        />
      )}

      {/* Templates Gallery Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Export / Share Modal */}
      {currentFile && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          file={currentFile}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenPinSetup={() => setPinModalMode('setup')}
        onClearCache={handleClearCache}
      />

      {/* Material Toast / Snackbar */}
      {toastMessage && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-slate-100 text-xs px-4 py-2 rounded-full shadow-2xl border border-slate-700 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </AndroidFrame>
  );
}
