import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, Text, Alert, useWindowDimensions } from 'react-native';
import { OfficeFile, DocumentType, AppSettings } from './src/types/office';
import {
  loadFiles,
  saveFiles,
  loadSettings,
  saveSettings,
  INITIAL_FILES,
  DEFAULT_SETTINGS,
} from './src/utils/storage';

import TopAppBar from './src/components/TopAppBar';
import BottomNavBar from './src/components/BottomNavBar';
import FloatingSpeedDial from './src/components/FloatingSpeedDial';
import DrawerMenu from './src/components/DrawerMenu';
import PinLockModal from './src/components/PinLockModal';
import TemplatesModal from './src/components/TemplatesModal';
import ExportModal from './src/components/ExportModal';
import SettingsModal from './src/components/settings/SettingsModal';
import Toast from './src/components/Toast';

import HomeView from './src/components/home/HomeView';
import WriterEditor from './src/components/writer/WriterEditor';
import CalcEditor from './src/components/calc/CalcEditor';
import ImpressEditor from './src/components/impress/ImpressEditor';
import PdfViewer from './src/components/pdf/PdfViewer';
import FileManagerView from './src/components/files/FileManagerView';

export default function App() {
  const [files, setFiles] = useState<OfficeFile[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentFile, setCurrentFile] = useState<OfficeFile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'setup' | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const loadedFiles = await loadFiles();
        const loadedSettings = await loadSettings();
        setFiles(loadedFiles);
        setSettings(loadedSettings);
        if (loadedSettings.pinLockEnabled) {
          setIsLocked(true);
          setPinModalMode('unlock');
        }
      } catch (e) {
        console.error('init error', e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleUpdateFiles = useCallback(
    (newFiles: OfficeFile[]) => {
      setFiles(newFiles);
      saveFiles(newFiles);
    },
    []
  );

  const handleUpdateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);
      saveSettings(updated);
      showToast('Paramètres mis à jour');
    },
    [settings, showToast]
  );

  const handleOpenFile = useCallback((file: OfficeFile) => {
    setCurrentFile(file);
    setActiveTab(file.type);
  }, []);

  const handleNewFile = useCallback(
    (type: DocumentType) => {
      let name = 'Nouveau_Document.docx';
      let ext = '.docx';
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
              subtitle: 'Sous-titre',
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
    },
    [files, handleUpdateFiles, handleOpenFile, showToast]
  );

  const handleUpdateCurrentFile = useCallback(
    (partial: Partial<OfficeFile>) => {
      if (!currentFile) return;
      const updatedFile = { ...currentFile, ...partial, updatedAt: Date.now() };
      setCurrentFile(updatedFile);
      const updatedFiles = files.map((f) =>
        f.id === updatedFile.id ? updatedFile : f
      );
      handleUpdateFiles(updatedFiles);
    },
    [currentFile, files, handleUpdateFiles]
  );

  const handleRenameCurrentFile = useCallback(
    (newName: string) => {
      if (!currentFile) return;
      handleUpdateCurrentFile({ name: newName });
      showToast(`Fichier renommé en : ${newName}`);
    },
    [currentFile, handleUpdateCurrentFile, showToast]
  );

  const handleDeleteFile = useCallback(
    (fileId: string) => {
      Alert.alert('Supprimer le fichier', 'Confirmer la suppression ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updated = files.filter((f) => f.id !== fileId);
            handleUpdateFiles(updated);
            if (currentFile?.id === fileId) {
              setCurrentFile(null);
              setActiveTab('home');
            }
            showToast('Fichier supprimé');
          },
        },
      ]);
    },
    [files, currentFile, handleUpdateFiles, showToast]
  );

  const handleDuplicateFile = useCallback(
    (file: OfficeFile) => {
      const copy: OfficeFile = {
        ...file,
        id: `file-${Date.now()}`,
        name: `${file.name.replace(/\.[^/.]+$/, '')}_Copie${file.extension}`,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      handleUpdateFiles([copy, ...files]);
      showToast(`Copie créée : ${copy.name}`);
    },
    [files, handleUpdateFiles, showToast]
  );

  const handleToggleFavorite = useCallback(
    (fileId: string) => {
      const updated = files.map((f) =>
        f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f
      );
      handleUpdateFiles(updated);
    },
    [files, handleUpdateFiles]
  );

  const handleSelectTemplate = useCallback(
    (templateData: Partial<OfficeFile>) => {
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
      showToast('Modèle initialisé avec succès !');
    },
    [files, handleUpdateFiles, handleOpenFile, showToast]
  );

  const handleExportAllData = useCallback(async () => {
    try {
      const data = JSON.stringify(
        { files, settings, exportedAt: new Date().toISOString() },
        null,
        2
      );
      const { exportContent } = await import('./src/utils/export');
      await exportContent(
        data,
        `StarOffice_Sauvegarde_${new Date().toISOString().slice(0, 10)}.json`,
        'application/json'
      );
      showToast('Sauvegarde exportée');
    } catch (e) {
      showToast("Erreur lors de l'export");
    }
  }, [files, settings, showToast]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous restaurer les documents initiaux ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            handleUpdateFiles(INITIAL_FILES);
            showToast('Documents réinitialisés');
            setIsSettingsOpen(false);
          },
        },
      ]
    );
  }, [handleUpdateFiles, showToast]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <Text style={{ color: '#f1f5f9', textAlign: 'center', marginTop: 80 }}>
          Chargement...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar style="light" />
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

      <View style={{ flex: 1 }}>
        {currentFile ? (
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
        ) : activeTab === 'home' ? (
          <HomeView
            files={files}
            onOpenFile={handleOpenFile}
            onNewFile={handleNewFile}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteFile={handleDeleteFile}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        ) : (
          <FileManagerView
            files={activeTab === 'files' ? files : files.filter((f) => f.type === activeTab)}
            onOpenFile={handleOpenFile}
            onNewFile={handleNewFile}
            onDeleteFile={handleDeleteFile}
            onDuplicateFile={handleDuplicateFile}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </View>

      <FloatingSpeedDial
        isVisible={!currentFile}
        onNewDocument={handleNewFile}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />

      <BottomNavBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setCurrentFile(null);
          setActiveTab(tab);
        }}
        hasActiveFile={!!currentFile}
      />

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
        onOpenSettings={() => {
          setIsDrawerOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {isLocked && pinModalMode && (
        <PinLockModal
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

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {currentFile && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          file={currentFile}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenPinSetup={() => setPinModalMode('setup')}
        onClearCache={handleClearCache}
      />

      <Toast message={toast} />
    </SafeAreaView>
  );
}
