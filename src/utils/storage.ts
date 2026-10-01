import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OfficeFile, AppSettings } from '../types/office';

const FILES_KEY = '@staroffice/files';
const SETTINGS_KEY = '@staroffice/settings';

export const DEFAULT_SETTINGS: AppSettings = {
  pinLockEnabled: false,
  pinCode: '',
  theme: 'dark',
  language: 'fr',
  viewMode: 'fluid',
  cloudProvider: 'none',
  autoSave: true,
  spellCheck: true,
  lastSyncTime: null,
};

export const INITIAL_FILES: OfficeFile[] = [
  {
    id: 'welcome-doc',
    name: 'Bienvenue.docx',
    type: 'writer',
    extension: '.docx',
    updatedAt: Date.now(),
    createdAt: Date.now(),
    size: 2400,
    isFavorite: true,
    isPinned: true,
    folder: 'documents',
    tags: ['Bienvenue'],
    content: {
      html: '<h1>Bienvenue dans StarOffice</h1><p>StarOffice est une suite bureautique complète pour Android. Créez et éditez des documents Writer, des feuilles de calcul Calc, des présentations Impress et visualisez des PDF.</p><p>Appuyez sur le bouton + en bas à droite pour créer un nouveau document, ou explorez les modèles intégrés.</p>',
      wordCount: 50,
    },
  },
  {
    id: 'sample-budget',
    name: 'Budget_Mensuel.xlsx',
    type: 'calc',
    extension: '.xlsx',
    updatedAt: Date.now() - 3600000,
    createdAt: Date.now() - 7200000,
    size: 8200,
    isFavorite: false,
    isPinned: false,
    folder: 'documents',
    tags: ['Budget'],
    content: {
      sheets: [
        {
          id: 'sh-1',
          name: 'Budget',
          rowCount: 12,
          colCount: 4,
          frozenRows: 1,
          frozenCols: 0,
          data: {
            A1: { value: 'Catégorie', bold: true },
            B1: { value: 'Prévu', bold: true },
            C1: { value: 'Réel', bold: true },
            D1: { value: 'Écart', bold: true },
            A2: { value: 'Loyer' },
            B2: { value: 800 },
            C2: { value: 800 },
            A3: { value: 'Courses' },
            B3: { value: 350 },
            C3: { value: 412 },
            A4: { value: 'Transport' },
            B4: { value: 120 },
            C4: { value: 98 },
            A5: { value: 'Loisirs' },
            B5: { value: 200 },
            C5: { value: 156 },
            D2: { value: '=C2-B2' },
            D3: { value: '=C3-B3' },
            D4: { value: '=C4-B4' },
            D5: { value: '=C5-B5' },
          },
        },
      ],
    },
  },
  {
    id: 'sample-pitch',
    name: 'Pitch_Deck.pptx',
    type: 'impress',
    extension: '.pptx',
    updatedAt: Date.now() - 7200000,
    createdAt: Date.now() - 10800000,
    size: 15600,
    isFavorite: true,
    isPinned: false,
    folder: 'documents',
    tags: ['Présentation'],
    content: {
      slides: [
        {
          id: 's-1',
          title: 'Mon Startup',
          subtitle: 'La révolution commence ici',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          transition: 'fade',
          notes: 'Slide d\'ouverture — accroche forte',
          elements: [],
        },
        {
          id: 's-2',
          title: 'Le Problème',
          subtitle: '85% des utilisateurs rencontrent cette difficulté',
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          transition: 'slide',
          notes: '',
          elements: [],
        },
        {
          id: 's-3',
          title: 'Notre Solution',
          subtitle: 'Une approche simple et puissante',
          background: 'linear-gradient(135deg, #312e81 0%, #6d28d9 100%)',
          transition: 'fade',
          notes: '',
          elements: [],
        },
      ],
    },
  },
];

export async function loadFiles(): Promise<OfficeFile[]> {
  try {
    const raw = await AsyncStorage.getItem(FILES_KEY);
    if (!raw) return INITIAL_FILES;
    const parsed = JSON.parse(raw) as OfficeFile[];
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_FILES;
    return parsed;
  } catch (err) {
    console.error('loadFiles error', err);
    return INITIAL_FILES;
  }
}

export async function saveFiles(files: OfficeFile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FILES_KEY, JSON.stringify(files));
  } catch (err) {
    console.error('saveFiles error', err);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    if (parsed.viewMode === 'mobile') parsed.viewMode = 'fluid';
    return parsed;
  } catch (err) {
    console.error('loadSettings error', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('saveSettings error', err);
  }
}
