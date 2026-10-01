export type DocumentType = 'writer' | 'calc' | 'impress' | 'pdf';

export interface OfficeFile {
  id: string;
  name: string;
  type: DocumentType;
  extension: string;
  updatedAt: number;
  createdAt: number;
  size: number;
  isFavorite: boolean;
  isPinned: boolean;
  folder: string;
  tags: string[];
  content: any;
}

export interface CellData {
  value: string | number;
  display?: string;
  formula?: string;
  format?: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
}

export interface CalcSheet {
  id: string;
  name: string;
  data: Record<string, CellData>;
  rowCount: number;
  colCount: number;
  frozenRows?: number;
  frozenCols?: number;
}

export type SlideElementType = 'title' | 'text' | 'shape' | 'badge' | 'metric';

export interface SlideElement {
  id: string;
  type: SlideElementType;
  text?: string;
  shapeType?: 'rect' | 'round' | 'circle' | 'triangle';
  color?: string;
  bgColor?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  background: string;
  transition?: string;
  notes?: string;
  elements: SlideElement[];
}

export type PDFAnnotationType = 'highlight' | 'note' | 'stamp' | 'signature' | 'drawing';

export interface PDFAnnotation {
  id: string;
  type: PDFAnnotationType;
  page: number;
  x: number;
  y: number;
  text?: string;
  color?: string;
  points?: Array<{ x: number; y: number }>;
  signatureDataUrl?: string;
}

export interface AppSettings {
  pinLockEnabled: boolean;
  pinCode: string;
  theme: 'dark' | 'amoled' | 'light';
  language: 'fr' | 'en' | 'es';
  viewMode: 'mobile' | 'tablet' | 'fluid';
  cloudProvider: 'none' | 'nextcloud' | 'gdrive' | 'onedrive';
  autoSave: boolean;
  spellCheck: boolean;
  lastSyncTime: number | null;
}
