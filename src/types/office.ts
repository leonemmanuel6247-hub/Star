export type DocumentType = 'writer' | 'calc' | 'impress' | 'pdf';

export interface OfficeFile {
  id: string;
  name: string;
  type: DocumentType;
  extension: '.docx' | '.odt' | '.xlsx' | '.ods' | '.pptx' | '.odp' | '.pdf' | '.csv' | '.txt';
  updatedAt: number;
  createdAt: number;
  size: number; // in bytes
  isFavorite: boolean;
  isPinned: boolean;
  folder: 'internal' | 'sdcard' | 'documents' | 'downloads';
  tags: string[];
  content: any;
}

export interface CellData {
  value: string; // raw input e.g. "=SUM(A1:B3)" or "1500" or "Janvier"
  display?: string; // computed value e.g. "1 500 €"
  formula?: string;
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date';
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
  data: Record<string, CellData>; // key is e.g. "A1", "C4"
  rowCount: number;
  colCount: number;
  frozenRows: number;
  frozenCols: number;
}

export interface SlideElement {
  id: string;
  type: 'title' | 'text' | 'shape' | 'badge' | 'metric';
  content: string;
  subtitle?: string;
  shapeType?: 'rectangle' | 'circle' | 'pill' | 'star';
  color?: string;
  bgColor?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
}

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  background: string;
  elements: SlideElement[];
  notes: string;
  transition: 'none' | 'fade' | 'slide' | 'zoom';
}

export interface PDFAnnotation {
  id: string;
  type: 'highlight' | 'note' | 'stamp' | 'signature' | 'drawing';
  page: number;
  x: number;
  y: number;
  text?: string;
  color?: string;
  points?: { x: number; y: number }[];
  signatureDataUrl?: string;
}

export interface AppSettings {
  pinLockEnabled: boolean;
  pinCode: string;
  theme: 'dark' | 'light' | 'amoled';
  language: 'fr' | 'en' | 'es';
  viewMode: 'mobile' | 'tablet' | 'fluid';
  cloudProvider: 'none' | 'drive' | 'nextcloud' | 'dropbox';
  autoSave: boolean;
  spellCheck: boolean;
  lastSyncTime: number | null;
}
