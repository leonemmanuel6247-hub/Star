import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  Eye,
  CheckCircle2,
  Highlighter,
  Type,
  Ruler,
  FileText,
  RotateCw,
  RotateCcw,
  Save,
  Download,
  Printer,
  FunctionSquare,
  Columns,
  BookOpen,
  Layout,
  Sliders,
  Scissors,
  Copy,
  Clipboard,
  Subscript,
  Superscript,
  ChevronDown,
  Plus,
  Mail,
  Send,
  Sparkles,
  Paintbrush,
  Palette,
  Minus,
  Maximize2,
  Minimize2,
  HelpCircle,
  X,
  FileCheck,
  Check,
  Grid,
  Bookmark,
  Share2,
  PenTool,
  Square,
  Circle,
  ArrowRight,
  PieChart,
  BarChart,
  MessageSquare,
  History,
  FileSpreadsheet,
  Globe,
  SlidersHorizontal
} from 'lucide-react';
import { OfficeFile } from '../../types/office';
import { LatexModal } from '../latex/LatexModal';
import { OfficeBackstageModal } from '../office/OfficeBackstageModal';
import { WordGuideModal } from './WordGuideModal';
import { MailingsManagerModal, INITIAL_RECIPIENTS, Recipient } from './MailingsManagerModal';
import { EditorPanel } from './EditorPanel';
import { NavigationPane } from './NavigationPane';
import { DrawingLayer } from './DrawingLayer';

interface WriterEditorProps {
  file: OfficeFile;
  onUpdateFile: (updated: Partial<OfficeFile>) => void;
  onCloseDocument?: () => void;
  onNewDocument?: () => void;
}

export type RibbonTab =
  | 'home'
  | 'insert'
  | 'draw'
  | 'design'
  | 'layout'
  | 'references'
  | 'mailings'
  | 'review'
  | 'view'
  | 'help';

export const WriterEditor: React.FC<WriterEditorProps> = ({
  file,
  onUpdateFile,
  onCloseDocument,
  onNewDocument,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [isBackstageOpen, setIsBackstageOpen] = useState(false);
  const [isLatexModalOpen, setIsLatexModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideInitialSection, setGuideInitialSection] = useState('part1');

  // Modals & Panels
  const [isMailingsOpen, setIsMailingsOpen] = useState(false);
  const [isEditorPanelOpen, setIsEditorPanelOpen] = useState(false);
  const [isNavigationPaneOpen, setIsNavigationPaneOpen] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showQuickAccessMenu, setShowQuickAccessMenu] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showShapesMenu, setShowShapesMenu] = useState(false);

  // Search & Replace
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // Formatting state
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [fontSize, setFontSize] = useState(15);
  const [textColor, setTextColor] = useState('#1e293b');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeHeading, setActiveHeading] = useState('p');
  const [lineSpacing, setLineSpacing] = useState('1.5');
  const [formatPainterCopiedStyle, setFormatPainterCopiedStyle] = useState<{
    fontFamily: string;
    fontSize: number;
    color: string;
  } | null>(null);

  // Page layout state
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginSize, setMarginSize] = useState<'normal' | 'narrow' | 'wide'>('normal');
  const [columnCount, setColumnCount] = useState<1 | 2 | 3>(1);
  const [pageColor, setPageColor] = useState('#ffffff');
  const [watermark, setWatermark] = useState<string | null>(null);
  const [pageBorder, setPageBorder] = useState<string | null>(null);
  const [showRuler, setShowRuler] = useState(true);
  const [showVerticalRuler, setShowVerticalRuler] = useState(false);
  const [showGridlines, setShowGridlines] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'page' | 'reading' | 'web' | 'outline' | 'draft'>('page');

  // Stats & Status Bar
  const [editMode, setEditMode] = useState<'INS' | 'REF'>('INS');
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    charsNoSpaces: 0,
    paragraphs: 0,
    lines: 0,
    readingTime: 1,
  });

  // Publipostage (Mail Merge)
  const [recipients, setRecipients] = useState<Recipient[]>(INITIAL_RECIPIENTS);
  const [mailMergeActive, setMailMergeActive] = useState(false);
  const [currentRecipientIndex, setCurrentRecipientIndex] = useState(0);

  // Track Changes & Comments
  const [trackChangesActive, setTrackChangesActive] = useState(false);
  const [comments, setComments] = useState<
    Array<{ id: string; author: string; text: string; date: string; resolved: boolean }>
  >([]);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);

  // Extracted Headings for Navigation Pane & TOC
  const [headings, setHeadings] = useState<Array<{ id: string; level: number; text: string }>>([]);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && file.content?.html) {
      if (editorRef.current.innerHTML !== file.content.html) {
        editorRef.current.innerHTML = file.content.html;
      }
      calculateStats();
      extractHeadings();
    }
  }, [file.id]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onUpdateFile({ updatedAt: Date.now() });
      }
      // Ctrl+P: Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
      // Ctrl+F: Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Ctrl+H: Replace
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowSearch(true);
      }
      // F7: Editor / Spelling
      if (e.key === 'F7') {
        e.preventDefault();
        setIsEditorPanelOpen(true);
      }
      // F12: Save As
      if (e.key === 'F12') {
        e.preventDefault();
        setIsBackstageOpen(true);
      }
      // Ctrl+F1: Collapse ribbon
      if ((e.ctrlKey || e.metaKey) && e.key === 'F1') {
        e.preventDefault();
        setIsRibbonCollapsed((prev) => !prev);
      }
      // Ctrl+B / Ctrl+G: Bold
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'g')) {
        e.preventDefault();
        execCmd('bold');
      }
      // Ctrl+I: Italic
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        execCmd('italic');
      }
      // Ctrl+U: Underline
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        execCmd('underline');
      }
      // Ctrl+E: Center
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        execCmd('justifyCenter');
      }
      // Ctrl+L: Left
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        execCmd('justifyLeft');
      }
      // Ctrl+R: Right
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        execCmd('justifyRight');
      }
      // Ctrl+J: Justify
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        execCmd('justifyFull');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const calculateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0).length || 1;
    const lines = Math.max(1, Math.ceil(chars / 80));
    const readingTime = Math.max(1, Math.ceil(words / 200));

    setStats({
      words,
      chars,
      charsNoSpaces,
      paragraphs,
      lines,
      readingTime,
    });
  };

  const extractHeadings = () => {
    if (!editorRef.current) return;
    const hElements = editorRef.current.querySelectorAll('h1, h2, h3');
    const items: Array<{ id: string; level: number; text: string }> = [];
    hElements.forEach((el, idx) => {
      const level = parseInt(el.tagName.replace('H', ''), 10) || 1;
      items.push({
        id: `heading-${idx}`,
        level,
        text: el.textContent || `Section ${idx + 1}`,
      });
    });
    setHeadings(items);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    calculateStats();
    extractHeadings();
    const newHtml = editorRef.current.innerHTML;
    onUpdateFile({
      updatedAt: Date.now(),
      size: new Blob([newHtml]).size,
      content: {
        ...file.content,
        html: newHtml,
        wordCount: stats.words,
      },
    });
  };

  const execCmd = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  const applyFontFamily = (family: string) => {
    setFontFamily(family);
    document.execCommand('fontName', false, family);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const applyFontSize = (sizeVal: number) => {
    setFontSize(sizeVal);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${sizeVal}px`;
      try {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.addRange(newRange);
      } catch (e) {
        document.execCommand('fontSize', false, '3');
      }
    } else {
      document.execCommand('fontSize', false, '3');
    }
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const stepFontSize = (delta: number) => {
    const next = Math.max(8, Math.min(72, fontSize + delta));
    applyFontSize(next);
  };

  const applyTextColor = (color: string) => {
    setTextColor(color);
    document.execCommand('foreColor', false, color);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const applyHighlight = (color: string) => {
    setHighlightColor(color);
    document.execCommand('hiliteColor', false, color);
    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  const clearFormatting = () => {
    execCmd('removeFormat');
    setFontFamily('Calibri');
    setFontSize(15);
    setTextColor('#1e293b');
    setHighlightColor('transparent');
  };

  const handleFormatPainter = () => {
    if (!formatPainterCopiedStyle) {
      setFormatPainterCopiedStyle({ fontFamily, fontSize, color: textColor });
    } else {
      applyFontFamily(formatPainterCopiedStyle.fontFamily);
      applyFontSize(formatPainterCopiedStyle.fontSize);
      applyTextColor(formatPainterCopiedStyle.color);
      setFormatPainterCopiedStyle(null);
    }
  };

  const insertHeading = (level: string) => {
    execCmd('formatBlock', level);
    setActiveHeading(level);
    setTimeout(extractHeadings, 100);
  };

  const insertLink = () => {
    const url = prompt("Entrez l'URL du lien hypertexte (Ctrl+K) :", 'https://');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const insertBookmark = () => {
    const name = prompt('Entrez le nom du signet Word :');
    if (name) {
      execCmd('insertHTML', `<a name="${name}" style="background:#e0e7ff; color:#3730a3; padding:2px 4px; border-radius:4px; font-size:11px;">🔖 Signet: ${name}</a>`);
    }
  };

  const insertTable = () => {
    let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;"><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        if (r === 0) {
          tableHtml += `<th style="border:1px solid #94a3b8; padding:8px 12px; background:#f1f5f9; font-weight:600; text-align:left;">Colonne ${c + 1}</th>`;
        } else {
          tableHtml += `<td style="border:1px solid #cbd5e1; padding:8px 12px;">Donnée ${r}.${c + 1}</td>`;
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';
    execCmd('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  const insertSampleImage = () => {
    const sampleImg = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80';
    execCmd('insertImage', sampleImg);
  };

  const insertShape = (shape: string) => {
    let shapeHtml = '';
    if (shape === 'rectangle') {
      shapeHtml = '<div style="width:140px; height:70px; background:#3b82f6; border:2px solid #1d4ed8; border-radius:6px; margin:12px auto; display:flex; align-items:center; justify-content:center; color:white; font-weight:600; font-size:12px;">Forme Rectangle</div>';
    } else if (shape === 'circle') {
      shapeHtml = '<div style="width:80px; height:80px; background:#10b981; border:2px solid #047857; border-radius:50%; margin:12px auto; display:flex; align-items:center; justify-content:center; color:white; font-weight:600; font-size:12px;">Cercle</div>';
    } else if (shape === 'arrow') {
      shapeHtml = '<div style="font-size:24px; color:#6366f1; text-align:center; margin:12px 0;">➔ ➔ ➔</div>';
    } else if (shape === 'callout') {
      shapeHtml = '<div style="background:#fef3c7; border:2px solid #f59e0b; border-radius:8px; padding:10px 14px; margin:12px 0; color:#92400e; font-size:12px; font-weight:500;">💬 Remarque importante : Insérer vos annotations ici.</div>';
    }
    execCmd('insertHTML', shapeHtml);
    setShowShapesMenu(false);
  };

  const insertSmartArt = () => {
    const smartArtHtml = `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:16px; margin:16px 0;" contenteditable="false">
        <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:8px;">SmartArt • Processus séquentiel</div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <div style="flex:1; background:#2563eb; color:white; padding:10px; border-radius:6px; text-align:center; font-size:12px; font-weight:600;">1. Planification</div>
          <div style="color:#94a3b8; font-weight:bold;">➔</div>
          <div style="flex:1; background:#0284c7; color:white; padding:10px; border-radius:6px; text-align:center; font-size:12px; font-weight:600;">2. Exécution</div>
          <div style="color:#94a3b8; font-weight:bold;">➔</div>
          <div style="flex:1; background:#059669; color:white; padding:10px; border-radius:6px; text-align:center; font-size:12px; font-weight:600;">3. Validation</div>
        </div>
      </div>
      <p><br></p>
    `;
    execCmd('insertHTML', smartArtHtml);
  };

  const insertChart = () => {
    const chartHtml = `
      <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:16px; margin:16px 0;" contenteditable="false">
        <div style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:8px;">Graphique en barres • Répartition trimestrielle</div>
        <div style="display:flex; align-items:flex-end; gap:16px; height:120px; border-bottom:2px solid #94a3b8; padding-bottom:4px;">
          <div style="flex:1; display:flex; flex-col; align-items:center; gap:4px;">
            <div style="width:100%; height:60px; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
            <span style="font-size:10px; color:#64748b;">T1</span>
          </div>
          <div style="flex:1; display:flex; flex-col; align-items:center; gap:4px;">
            <div style="width:100%; height:90px; background:#10b981; border-radius:4px 4px 0 0;"></div>
            <span style="font-size:10px; color:#64748b;">T2</span>
          </div>
          <div style="flex:1; display:flex; flex-col; align-items:center; gap:4px;">
            <div style="width:100%; height:75px; background:#f59e0b; border-radius:4px 4px 0 0;"></div>
            <span style="font-size:10px; color:#64748b;">T3</span>
          </div>
          <div style="flex:1; display:flex; flex-col; align-items:center; gap:4px;">
            <div style="width:100%; height:110px; background:#8b5cf6; border-radius:4px 4px 0 0;"></div>
            <span style="font-size:10px; color:#64748b;">T4</span>
          </div>
        </div>
      </div>
      <p><br></p>
    `;
    execCmd('insertHTML', chartHtml);
  };

  const insertWordArt = () => {
    const text = prompt('Texte pour le WordArt stylisé :', 'Microsoft Word');
    if (text) {
      execCmd('insertHTML', `<div style="font-size:28px; font-weight:900; background:linear-gradient(45deg, #1e3a8a, #3b82f6, #ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; text-align:center; margin:16px 0; letter-spacing:1px; filter:drop-shadow(2px 2px 2px rgba(0,0,0,0.15));">${text}</div><p><br></p>`);
    }
  };

  const insertPageBreak = () => {
    execCmd('insertHTML', '<div style="page-break-after: always; border-bottom: 2px dashed #94a3b8; margin: 36px 0 24px 0; text-align: center; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; user-select: none;">Saut de page A4</div><p><br></p>');
  };

  const insertSectionBreak = () => {
    execCmd('insertHTML', '<div style="page-break-before: always; border-bottom: 2px double #3b82f6; margin: 36px 0 24px 0; text-align: center; color: #2563eb; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; user-select: none;">Saut de section (Page suivante)</div><p><br></p>');
  };

  const insertTableOfContents = () => {
    extractHeadings();
    let entriesHtml = '';
    if (headings.length > 0) {
      entriesHtml = headings.map((h, i) => `
        <div style="display:flex; justify-content:space-between; margin:4px 0; padding-left:${(h.level - 1) * 16}px;">
          <span>${h.text}</span>
          <span style="color:#94a3b8;">............................................................ ${i + 1}</span>
        </div>
      `).join('');
    } else {
      entriesHtml = `
        <div style="display:flex; justify-content:space-between; margin:4px 0;">
          <span>1. Introduction et Spécifications</span>
          <span style="color:#94a3b8;">............................................................ 1</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin:4px 0;">
          <span>2. Analyse Détaillée des Fonctionnalités</span>
          <span style="color:#94a3b8;">............................................................ 2</span>
        </div>
      `;
    }

    const tocHtml = `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px 20px; margin:20px 0;" contenteditable="false">
        <div style="font-weight:700; font-size:14px; color:#1e293b; margin-bottom:8px; border-bottom:1px solid #cbd5e1; padding-bottom:4px;">
          Table des matières (Automatique Word)
        </div>
        <div style="font-size:12px; color:#2563eb; line-height:1.8;">
          ${entriesHtml}
        </div>
      </div>
      <p><br></p>
    `;
    execCmd('insertHTML', tocHtml);
  };

  const insertFootnote = () => {
    const num = Math.floor(Math.random() * 8) + 1;
    execCmd('insertHTML', `<sup>[${num}]</sup>`);
  };

  const insertCitation = () => {
    const author = prompt("Nom de l'auteur :", 'Dupont, J.');
    const year = prompt("Année de publication :", '2026');
    if (author) {
      execCmd('insertHTML', ` (${author}, ${year || '2026'}) `);
    }
  };

  const insertBibliography = () => {
    const biblioHtml = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:20px 0;" contenteditable="false">
        <div style="font-weight:700; font-size:13px; color:#1e293b; margin-bottom:8px; border-bottom:1px solid #cbd5e1; padding-bottom:4px;">
          Bibliographie &amp; Références (Style APA)
        </div>
        <div style="font-size:11px; color:#475569; line-height:1.6;">
          <p>• Dupont, J. (2026). <em>Guide complet du traitement de texte moderne</em>. Éditions Bureautique Pro.</p>
          <p>• Microsoft Corporation. (2026). <em>Documentation officielle de Microsoft Word 365</em>.</p>
        </div>
      </div>
      <p><br></p>
    `;
    execCmd('insertHTML', biblioHtml);
  };

  const addComment = () => {
    const text = prompt('Votre commentaire :');
    if (!text) return;
    const newComm = {
      id: `comm-${Date.now()}`,
      author: 'Utilisateur Word',
      text,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      resolved: false,
    };
    setComments([newComm, ...comments]);
    setShowCommentsSidebar(true);
    execCmd('insertHTML', `<span style="background:#fef08a; border-bottom:2px solid #ca8a04; cursor:pointer;" title="Commentaire: ${text}">[💬]</span>`);
  };

  const handleSearch = () => {
    if (!searchQuery || !editorRef.current) {
      setMatchCount(0);
      return;
    }
    const text = editorRef.current.innerText;
    const regex = new RegExp(searchQuery, 'gi');
    const matches = text.match(regex);
    setMatchCount(matches ? matches.length : 0);
  };

  const handleReplace = () => {
    if (!searchQuery || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const regex = new RegExp(searchQuery, 'gi');
    editorRef.current.innerHTML = currentHtml.replace(regex, replaceQuery);
    handleInput();
    setMatchCount(0);
  };

  const handleApplyEditorFix = (original: string, replacement: string) => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const regex = new RegExp(original, 'i');
    editorRef.current.innerHTML = currentHtml.replace(regex, replacement);
    handleInput();
  };

  // Publipostage field insertion
  const handleInsertMergeField = (tag: string) => {
    execCmd('insertHTML', tag);
  };

  const handleSelectHeading = (text: string) => {
    if (!editorRef.current) return;
    const elements = editorRef.current.querySelectorAll('h1, h2, h3, p');
    for (const el of Array.from(elements)) {
      if (el.textContent?.includes(text)) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none text-slate-100 font-sans">
      {/* 1. MS WORD TITLE BAR (Top Header per myITschools reference & User Guide Partie I.1) */}
      <header className="h-9 bg-[#2b579a] text-white px-3 flex items-center justify-between shrink-0 shadow-xs border-b border-[#1b3a6b] relative">
        {/* Quick Access Toolbar (Partie I.2) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateFile({ updatedAt: Date.now() })}
            className="p-1 hover:bg-white/15 rounded transition-colors"
            title="Enregistrer (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => execCmd('undo')}
            className="p-1 hover:bg-white/15 rounded transition-colors"
            title="Annuler (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={() => execCmd('redo')}
            className="p-1 hover:bg-white/15 rounded transition-colors"
            title="Rétablir (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Quick Access Toolbar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickAccessMenu(!showQuickAccessMenu)}
              className="p-0.5 hover:bg-white/15 rounded text-white/80"
              title="Personnaliser la barre d'outils Accès rapide"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {showQuickAccessMenu && (
              <div className="absolute top-7 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 w-52 z-50 text-xs space-y-1">
                <div className="text-[10px] text-slate-400 font-semibold px-2 py-1">
                  Personnaliser Accès Rapide
                </div>
                <button
                  onClick={() => {
                    if (onNewDocument) onNewDocument();
                    setShowQuickAccessMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Nouveau document (Ctrl+N)</span>
                </button>
                <button
                  onClick={() => {
                    setIsBackstageOpen(true);
                    setShowQuickAccessMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ouvrir / Parcourir (Ctrl+O)</span>
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setShowQuickAccessMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Aperçu avant impression (Ctrl+P)</span>
                </button>
                <button
                  onClick={() => {
                    setShowRuler(!showRuler);
                    setShowQuickAccessMenu(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <span>Activer/Désactiver la Règle</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Document Title & Word Branding (Partie I.1) */}
        <div className="text-xs font-semibold tracking-tight text-white/95 truncate max-w-sm flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-200 shrink-0" />
          <span className="truncate">{file.name}</span>
          <span className="text-[11px] text-white/70 font-normal shrink-0">- Word</span>
        </div>

        {/* Right: Window Controls (Partie I.1: Réduire, Agrandir/Restaurer, Fermer) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-black/20 hover:bg-black/30 text-white/90"
            title="Rechercher (Ctrl+F)"
          >
            <Search className="w-3 h-3" />
            <span className="hidden sm:inline">Rechercher</span>
          </button>

          <button
            onClick={() => {
              setGuideInitialSection('part1');
              setIsGuideOpen(true);
            }}
            className="p-1 hover:bg-white/15 rounded text-white/90"
            title="Aide & Guide exhaustif de Word"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-0.5 border-l border-white/20 pl-1.5 ml-0.5">
            <button
              onClick={() => setIsRibbonCollapsed(!isRibbonCollapsed)}
              className="p-1 hover:bg-white/15 rounded text-white/80"
              title={isRibbonCollapsed ? 'Agrandir le ruban (Ctrl+F1)' : 'Réduire le ruban (Ctrl+F1)'}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }}
              className="p-1 hover:bg-white/15 rounded text-white/80"
              title="Agrandir / Plein écran"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (onCloseDocument) onCloseDocument();
              }}
              className="p-1 hover:bg-rose-600 rounded text-white/90 transition-colors"
              title="Fermer le document (Ctrl+F4)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. THE RIBBON TAB BUTTONS (All 10 Official Tabs from User Guide Partie I.4) */}
      <nav className="h-9 bg-slate-850 border-b border-slate-750 px-2 flex items-center overflow-x-auto shrink-0 select-none">
        {/* File / Fichier Tab Button (Backstage View - Partie I.3) */}
        <button
          onClick={() => setIsBackstageOpen(true)}
          className="px-3 py-1.5 bg-[#2b579a] hover:bg-[#1f4277] text-white text-xs font-bold uppercase tracking-wider rounded-t transition-colors mr-1 shadow-xs"
          title="Fichier (Vue Backstage)"
        >
          Fichier
        </button>

        {/* 10 Official Ribbon Tabs */}
        {(
          [
            { id: 'home', label: 'Accueil' },
            { id: 'insert', label: 'Insertion' },
            { id: 'draw', label: 'Dessin' },
            { id: 'design', label: 'Conception' },
            { id: 'layout', label: 'Mise en page' },
            { id: 'references', label: 'Références' },
            { id: 'mailings', label: 'Publipostage' },
            { id: 'review', label: 'Révision' },
            { id: 'view', label: 'Affichage' },
            { id: 'help', label: 'Aide' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (isRibbonCollapsed) setIsRibbonCollapsed(false);
              }}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-white font-semibold bg-slate-800/80 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 3. THE RIBBON COMMAND GROUPS (Partie I.4) */}
      {!isRibbonCollapsed && (
        <div className="bg-slate-850 border-b border-slate-700/80 px-2 py-1.5 flex items-stretch gap-1 overflow-x-auto shrink-0 text-slate-200 min-h-[76px] animate-in fade-in duration-100">
          {/* ================= TAB 1: ACCUEIL (HOME) ================= */}
          {activeTab === 'home' && (
            <div className="flex items-stretch gap-1">
              {/* Group: Presse-papiers */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => execCmd('paste')}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200 transition-colors"
                    title="Coller (Ctrl+V)"
                  >
                    <Clipboard className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] mt-0.5">Coller</span>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => execCmd('cut')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1 text-[11px]"
                      title="Couper (Ctrl+X)"
                    >
                      <Scissors className="w-3 h-3 text-slate-400" />
                      <span>Couper</span>
                    </button>
                    <button
                      onClick={() => execCmd('copy')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1 text-[11px]"
                      title="Copier (Ctrl+C)"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copier</span>
                    </button>
                    <button
                      onClick={handleFormatPainter}
                      className={`p-1 rounded text-slate-300 flex items-center gap-1 text-[11px] ${
                        formatPainterCopiedStyle ? 'bg-amber-600/30 text-amber-300' : 'hover:bg-slate-700'
                      }`}
                      title="Reproduire la mise en forme"
                    >
                      <Paintbrush className="w-3 h-3 text-amber-400" />
                      <span>Pinceau</span>
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Presse-papiers
                </div>
              </div>

              {/* Group: Police (Font) */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <select
                      value={fontFamily}
                      onChange={(e) => applyFontFamily(e.target.value)}
                      className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-0.5 outline-none max-w-[125px] truncate"
                    >
                      <option value="Calibri">Calibri</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Merriweather">Merriweather</option>
                      <option value="JetBrains Mono">JetBrains Mono</option>
                    </select>

                    <select
                      value={fontSize}
                      onChange={(e) => applyFontSize(parseInt(e.target.value, 10))}
                      className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 outline-none font-mono"
                    >
                      {[9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => stepFontSize(1)}
                      className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700"
                      title="Agrandir la police (A⁺)"
                    >
                      A⁺
                    </button>
                    <button
                      onClick={() => stepFontSize(-1)}
                      className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700"
                      title="Diminuer la police (A⁻)"
                    >
                      A⁻
                    </button>
                    <button
                      onClick={clearFormatting}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-rose-300"
                      title="Effacer toute la mise en forme"
                    >
                      A⌫
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => execCmd('bold')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Gras (Ctrl+G / Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5 font-bold" />
                    </button>
                    <button
                      onClick={() => execCmd('italic')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Italique (Ctrl+I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('underline')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Souligné (Ctrl+U)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('strikeThrough')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Barré"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('subscript')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Indice"
                    >
                      <Subscript className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('superscript')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Exposant"
                    >
                      <Superscript className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative inline-block ml-1">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1 hover:bg-slate-700 rounded flex flex-col items-center"
                        title="Couleur de police et surlignage"
                      >
                        <Type className="w-3.5 h-3.5" />
                        <span className="w-3.5 h-1 rounded-full mt-0.5" style={{ backgroundColor: textColor }} />
                      </button>

                      {showColorPicker && (
                        <div className="absolute top-8 left-0 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl z-50 w-44">
                          <div className="text-[10px] text-slate-400 font-semibold mb-1">Couleurs de police</div>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {['#000000', '#1e293b', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'].map((c) => (
                              <button
                                key={c}
                                onClick={() => {
                                  applyTextColor(c);
                                  setShowColorPicker(false);
                                }}
                                className="w-5 h-5 rounded-full border border-white/20"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mb-1 border-t border-slate-800 pt-1">
                            Surlignage
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {['transparent', '#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8'].map((c) => (
                              <button
                                key={c}
                                onClick={() => {
                                  applyHighlight(c);
                                  setShowColorPicker(false);
                                }}
                                className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[9px]"
                                style={{ backgroundColor: c === 'transparent' ? '#334155' : c }}
                              >
                                {c === 'transparent' ? '✕' : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Police
                </div>
              </div>

              {/* Group: Paragraphe */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => execCmd('insertUnorderedList')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Puces"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('insertOrderedList')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Numérotation"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-3.5 w-px bg-slate-700 mx-0.5" />
                    <button
                      onClick={() => execCmd('outdent')}
                      className="px-1 text-[11px] text-slate-300 hover:text-white"
                      title="Diminuer le retrait"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => execCmd('indent')}
                      className="px-1 text-[11px] text-slate-300 hover:text-white"
                      title="Augmenter le retrait"
                    >
                      →
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => execCmd('justifyLeft')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Aligner à gauche (Ctrl+L)"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('justifyCenter')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Centrer (Ctrl+E)"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('justifyRight')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Aligner à droite (Ctrl+R)"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('justifyFull')}
                      className="p-1 hover:bg-slate-700 rounded text-slate-200"
                      title="Justifier (Ctrl+J)"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Paragraphe
                </div>
              </div>

              {/* Group: Styles */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  {[
                    { tag: 'p', label: 'Normal' },
                    { tag: 'h1', label: 'Titre 1' },
                    { tag: 'h2', label: 'Titre 2' },
                    { tag: 'blockquote', label: 'Citation' },
                  ].map((s) => (
                    <button
                      key={s.tag}
                      onClick={() => insertHeading(s.tag)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                        activeHeading === s.tag
                          ? 'border-blue-500 bg-blue-600/30 text-white'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Styles
                </div>
              </div>

              {/* Group: Édition */}
              <div className="flex flex-col justify-between px-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] hover:bg-slate-700 rounded text-slate-300"
                  >
                    <Search className="w-3 h-3 text-blue-400" />
                    <span>Rechercher (Ctrl+F)</span>
                  </button>
                  <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] hover:bg-slate-700 rounded text-slate-300"
                  >
                    <RotateCw className="w-3 h-3 text-emerald-400" />
                    <span>Remplacer (Ctrl+H)</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Édition
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: INSERTION (INSERT) ================= */}
          {activeTab === 'insert' && (
            <div className="flex items-stretch gap-1">
              {/* Pages */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  <button
                    onClick={insertPageBreak}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                    title="Saut de page (Ctrl+Entrée)"
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] mt-0.5">Saut page</span>
                  </button>
                  <button
                    onClick={insertSectionBreak}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                    title="Saut de section"
                  >
                    <Layout className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] mt-0.5">Section</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Pages
                </div>
              </div>

              {/* Tableaux */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <button
                  onClick={() => setShowTableModal(true)}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                  title="Insérer un tableau"
                >
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] mt-0.5">Tableau</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Tableaux
                </div>
              </div>

              {/* Illustrations */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  <button
                    onClick={insertSampleImage}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                    title="Insérer une image"
                  >
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] mt-0.5">Image</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowShapesMenu(!showShapesMenu)}
                      className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                      title="Formes géométriques"
                    >
                      <Square className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] mt-0.5">Formes</span>
                    </button>
                    {showShapesMenu && (
                      <div className="absolute top-12 left-0 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-50 w-36 space-y-1">
                        <button onClick={() => insertShape('rectangle')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-xs">Rectangle</button>
                        <button onClick={() => insertShape('circle')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-xs">Cercle</button>
                        <button onClick={() => insertShape('arrow')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-xs">Flèche</button>
                        <button onClick={() => insertShape('callout')} className="w-full text-left px-2 py-1 rounded hover:bg-slate-800 text-xs">Bulle</button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={insertSmartArt}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                    title="Diagramme SmartArt"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] mt-0.5">SmartArt</span>
                  </button>

                  <button
                    onClick={insertChart}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                    title="Graphique statistique"
                  >
                    <BarChart className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] mt-0.5">Graphique</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Illustrations
                </div>
              </div>

              {/* Liens & Signets */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  <button
                    onClick={insertLink}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                    title="Lien hypertexte (Ctrl+K)"
                  >
                    <LinkIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] mt-0.5">Lien</span>
                  </button>
                  <button
                    onClick={insertBookmark}
                    className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                    title="Insérer un signet"
                  >
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] mt-0.5">Signet</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Liens
                </div>
              </div>

              {/* Texte & WordArt */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <button
                  onClick={insertWordArt}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-700 rounded text-slate-200"
                  title="WordArt stylisé"
                >
                  <Type className="w-4 h-4 text-pink-400 font-bold" />
                  <span className="text-[10px] mt-0.5">WordArt</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Texte
                </div>
              </div>

              {/* Symboles & Équations (LaTeX) */}
              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsLatexModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                    title="Éditeur d'Équation LaTeX"
                  >
                    <FunctionSquare className="w-3.5 h-3.5 text-sky-200" />
                    <span>Équation</span>
                  </button>
                  <button
                    onClick={() => execCmd('insertHTML', ' π ')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 font-serif"
                    title="Insérer symbole Pi"
                  >
                    Ω / π
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Symboles
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: DESSIN (DRAW) - USER GUIDE PARTIE I.4 ================= */}
          {activeTab === 'draw' && (
            <div className="flex items-stretch gap-2">
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <button
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isDrawingMode ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span>{isDrawingMode ? 'Dessin actif (Quitter)' : 'Dessiner à main levée'}</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Outils de dessin
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="text-xs text-slate-300 flex items-center gap-3">
                  <span>Stylos feutre</span>
                  <span>•</span>
                  <span>Surligneurs</span>
                  <span>•</span>
                  <span>Gomme de précision</span>
                  <span>•</span>
                  <span className="text-blue-300">Canvas vectoriel superposé</span>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Options stylet
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: CONCEPTION (DESIGN) ================= */}
          {activeTab === 'design' && (
            <div className="flex items-stretch gap-1">
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  {[
                    { name: 'Office Standard', font: 'Calibri' },
                    { name: 'Moderne Épuré', font: 'Plus Jakarta Sans' },
                    { name: 'Éditorial', font: 'Merriweather' },
                  ].map((th) => (
                    <button
                      key={th.name}
                      onClick={() => applyFontFamily(th.font)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700"
                    >
                      {th.name}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Thèmes du document
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const tag = prompt('Texte du filigrane :', watermark || 'CONFIDENTIEL');
                      setWatermark(tag);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700"
                  >
                    Filigrane : {watermark || 'Aucun'}
                  </button>
                  <button
                    onClick={() => setPageColor(pageColor === '#ffffff' ? '#f8fafc' : '#ffffff')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700"
                  >
                    Couleur de page
                  </button>
                  <button
                    onClick={() => setPageBorder(pageBorder ? null : '2px solid #2563eb')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700"
                  >
                    Bordures de page
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Arrière-plan de page
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: MISE EN PAGE (LAYOUT) ================= */}
          {activeTab === 'layout' && (
            <div className="flex items-stretch gap-1">
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400">Marges :</span>
                    <select
                      value={marginSize}
                      onChange={(e) => setMarginSize(e.target.value as any)}
                      className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-0.5 outline-none"
                    >
                      <option value="normal">Normales (25 mm)</option>
                      <option value="narrow">Étroites (12,7 mm)</option>
                      <option value="wide">Larges (38,1 mm)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setPageOrientation(pageOrientation === 'portrait' ? 'landscape' : 'portrait')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 text-blue-300"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{pageOrientation === 'portrait' ? 'Portrait' : 'Paysage'}</span>
                  </button>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400">Format :</span>
                    <span className="bg-blue-950/60 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded font-mono font-semibold">
                      A4 (21,0 × 29,7 cm)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400">Colonnes :</span>
                    <div className="flex bg-slate-800 border border-slate-700 rounded p-0.5">
                      {[1, 2, 3].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => setColumnCount(cols as any)}
                          className={`px-1.5 py-0.5 text-xs rounded ${
                            columnCount === cols ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                          }`}
                        >
                          {cols}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Mise en page
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Interligne :</span>
                    <select
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(e.target.value)}
                      className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded px-2 py-0.5 outline-none font-mono"
                    >
                      <option value="1.0">1.0</option>
                      <option value="1.15">1.15</option>
                      <option value="1.5">1.5</option>
                      <option value="2.0">2.0</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                    className={`px-2 py-0.5 rounded border text-xs ${
                      showLineNumbers ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    N° de lignes
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Paragraphe &amp; Lignes
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 6: RÉFÉRENCES (REFERENCES) ================= */}
          {activeTab === 'references' && (
            <div className="flex items-stretch gap-1">
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <button
                  onClick={insertTableOfContents}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Table des matières</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Table des matières
                </div>
              </div>

              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <button
                  onClick={insertFootnote}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700"
                >
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Note de bas de page</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Notes
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={insertCitation}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700"
                  >
                    + Insérer citation
                  </button>
                  <button
                    onClick={insertBibliography}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700"
                  >
                    Bibliographie APA
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Citations et bibliographie
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: PUBLIPOSTAGE (MAILINGS) - USER GUIDE PARTIE VI ================= */}
          {activeTab === 'mailings' && (
            <div className="flex items-stretch gap-1">
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <button
                  onClick={() => setIsMailingsOpen(true)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Démarrer la fusion &amp; Destinataires</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Fusion et publipostage
                </div>
              </div>

              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  {['{{Civilite}}', '{{Prenom}}', '{{Nom}}', '{{Societe}}', '{{Adresse}}', '{{Ville}}'].map((f) => (
                    <button
                      key={f}
                      onClick={() => handleInsertMergeField(` ${f} `)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-[10px] font-mono rounded border border-slate-700 text-blue-300"
                    >
                      + {f.replace(/[{}]/g, '')}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Champs de fusion
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <button
                  onClick={() => setIsMailingsOpen(true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aperçu &amp; Terminer</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Terminer &amp; Fusionner
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 8: RÉVISION (REVIEW) - USER GUIDE PARTIE VII ================= */}
          {activeTab === 'review' && (
            <div className="flex items-stretch gap-1">
              {/* Vérification orthographique */}
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <button
                  onClick={() => setIsEditorPanelOpen(true)}
                  className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  title="Ouvrir le Volet Éditeur (F7)"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Volet Éditeur (F7)</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Vérification
                </div>
              </div>

              {/* Suivi des modifications */}
              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTrackChangesActive(!trackChangesActive)}
                    className={`px-2.5 py-1 rounded text-xs border font-medium transition-colors ${
                      trackChangesActive ? 'bg-amber-600 text-white border-amber-500 font-bold' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Suivi des modifications : {trackChangesActive ? 'Actif' : 'Inactif'}
                  </button>
                  <button
                    onClick={() => alert('Toutes les modifications ont été acceptées.')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 text-emerald-300"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => alert('Modifications rejetées.')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs border border-slate-700 text-rose-300"
                  >
                    Refuser
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Suivi des modifications
                </div>
              </div>

              {/* Commentaires */}
              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={addComment}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Nouveau commentaire</span>
                  </button>
                  <button
                    onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded border border-slate-700 text-slate-300"
                  >
                    Volet ({comments.length})
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Commentaires
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 9: AFFICHAGE (VIEW) ================= */}
          {activeTab === 'view' && (
            <div className="flex items-stretch gap-1">
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('page')}
                    className={`px-2 py-1 rounded text-xs ${viewMode === 'page' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    Mode Page A4
                  </button>
                  <button
                    onClick={() => setViewMode('reading')}
                    className={`px-2 py-1 rounded text-xs ${viewMode === 'reading' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    Mode Lecture
                  </button>
                  <button
                    onClick={() => setViewMode('web')}
                    className={`px-2 py-1 rounded text-xs ${viewMode === 'web' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    Mode Web
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Modes d'affichage
                </div>
              </div>

              <div className="flex flex-col justify-between px-2 border-r border-slate-700/70">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowRuler(!showRuler)}
                    className={`px-2 py-1 rounded text-xs ${showRuler ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    Règle
                  </button>
                  <button
                    onClick={() => setShowGridlines(!showGridlines)}
                    className={`px-2 py-1 rounded text-xs ${showGridlines ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    Quadrillage
                  </button>
                  <button
                    onClick={() => setIsNavigationPaneOpen(!isNavigationPaneOpen)}
                    className={`px-2 py-1 rounded text-xs ${isNavigationPaneOpen ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    Volet navigation
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Afficher
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <button onClick={() => setZoom(100)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 border border-slate-700">100%</button>
                  <button onClick={() => setZoom(75)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 border border-slate-700">75%</button>
                  <button onClick={() => setZoom(50)} className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 border border-slate-700">Une page</button>
                </div>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Zoom
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 10: AIDE (HELP) - USER GUIDE ================= */}
          {activeTab === 'help' && (
            <div className="flex items-stretch gap-2">
              <div className="flex flex-col justify-between pr-2 border-r border-slate-700/70">
                <button
                  onClick={() => {
                    setGuideInitialSection('part1');
                    setIsGuideOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Guide exhaustif de Microsoft Word</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Documentation officielle
                </div>
              </div>

              <div className="flex flex-col justify-between px-2">
                <button
                  onClick={() => {
                    setGuideInitialSection('part8');
                    setIsGuideOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5"
                >
                  <span>Tableau des raccourcis clavier (Partie VIII)</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center border-t border-slate-750 pt-0.5 font-medium">
                  Raccourcis
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Search & Replace Bar */}
      {showSearch && (
        <div className="bg-slate-850 border-b border-slate-750 p-2 flex flex-wrap items-center gap-2 text-xs shrink-0 shadow-md">
          <input
            type="text"
            placeholder="Rechercher dans Word..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyUp={handleSearch}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white focus:outline-none focus:border-blue-500 w-36"
          />
          <input
            type="text"
            placeholder="Remplacer par..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white focus:outline-none focus:border-blue-500 w-36"
          />
          <button
            onClick={handleSearch}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-xs"
          >
            Trouver ({matchCount})
          </button>
          <button
            onClick={handleReplace}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
          >
            Remplacer
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="p-1 text-slate-400 hover:text-white ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. WORK AREA: WORKSPACE WITH OPTIONAL NAVIGATION PANE & RULER & A4 SHEET */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Pane (Affichage > Volet de navigation) */}
        <NavigationPane
          isOpen={isNavigationPaneOpen}
          onClose={() => setIsNavigationPaneOpen(false)}
          headings={headings}
          onSelectHeading={handleSelectHeading}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            handleSearch();
          }}
          searchResultsCount={matchCount}
        />

        {/* Central Document Editing View */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-8 bg-slate-950 flex flex-col items-center relative">
          {/* Horizontal Centimeter Ruler (Partie I.6) */}
          {showRuler && viewMode === 'page' && (
            <div
              className="hidden md:flex items-end h-5 bg-slate-850 border border-slate-700 text-[8px] text-slate-400 font-mono mb-2 rounded shadow-inner select-none transition-all"
              style={{
                width: pageOrientation === 'portrait' ? '794px' : '1123px',
                maxWidth: '100%',
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: 'top center',
              }}
            >
              {Array.from({ length: pageOrientation === 'portrait' ? 22 : 30 }).map((_, cm) => (
                <div
                  key={cm}
                  className={`flex-1 border-r h-full flex flex-col justify-between items-center text-center ${
                    cm < 2 || cm >= (pageOrientation === 'portrait' ? 19 : 27)
                      ? 'bg-slate-800/80 border-slate-600 text-slate-500' // Margins
                      : 'border-slate-700/80 text-slate-300'
                  }`}
                >
                  <span className="leading-none mt-0.5">{cm}</span>
                  <span className="w-px h-1.5 bg-slate-600"></span>
                </div>
              ))}
            </div>
          )}

          {/* Real A4 Paper Sheet (794px × 1123px at 96 DPI, exact 210 × 297 mm ISO 216 - Partie I.5) */}
          <div
            className="transition-all duration-200 relative"
            style={{
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: 'top center',
            }}
          >
            <div
              id="print-area"
              className="bg-white text-slate-900 shadow-2xl rounded-xs leading-relaxed text-sm transition-all border border-slate-300 relative flex flex-col justify-between"
              style={{
                width: viewMode === 'web' ? '100%' : pageOrientation === 'portrait' ? '794px' : '1123px',
                minHeight: viewMode === 'web' ? 'auto' : pageOrientation === 'portrait' ? '1123px' : '794px',
                maxWidth: '100%',
                backgroundColor: pageColor,
                border: pageBorder || undefined,
                backgroundImage: showGridlines
                  ? 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)'
                  : undefined,
                backgroundSize: showGridlines ? '20px 20px' : undefined,
              }}
            >
              {/* Watermark simulation */}
              {watermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                  <span className="text-slate-300/40 text-7xl font-black uppercase rotate-[-35deg] tracking-widest">
                    {watermark}
                  </span>
                </div>
              )}

              {/* Freehand Drawing Layer when drawing mode is toggled on (Partie I.4) */}
              <DrawingLayer
                isActive={isDrawingMode}
                onClose={() => setIsDrawingMode(false)}
                width={pageOrientation === 'portrait' ? 794 : 1123}
                height={pageOrientation === 'portrait' ? 1123 : 794}
                onSaveDrawingToDocument={(img) => {
                  execCmd('insertHTML', `<img src="${img}" style="max-width:100%; border:1px solid #cbd5e1; border-radius:4px; margin:12px 0;" alt="Dessin Word" /><p><br></p>`);
                }}
              />

              {/* Header / En-tête A4 (Partie IV) */}
              <div className="px-6 sm:px-14 pt-6 pb-2 text-[11px] text-slate-400 border-b border-slate-200 flex justify-between items-center select-none font-sans z-10">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Document Word • Format A4 (21,0 × 29,7 cm)
                </span>
                <span>{pageOrientation === 'portrait' ? 'Portrait' : 'Paysage'}</span>
              </div>

              {/* Line Numbers in Margin if enabled */}
              <div className="flex-1 flex">
                {showLineNumbers && (
                  <div className="w-8 py-8 text-right pr-2 text-[10px] text-slate-400 select-none font-mono border-r border-slate-100">
                    {Array.from({ length: Math.min(30, stats.lines || 1) }).map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                )}

                {/* Editable Content Area with standard paper margins */}
                <div
                  ref={editorRef}
                  contentEditable={viewMode !== 'reading'}
                  onInput={handleInput}
                  spellCheck="true"
                  className={`flex-1 ${
                    marginSize === 'narrow'
                      ? 'px-4 sm:px-8 py-6'
                      : marginSize === 'wide'
                      ? 'px-8 sm:px-20 py-10'
                      : 'px-6 sm:px-14 py-8'
                  } outline-none z-10 ${viewMode === 'reading' ? 'cursor-default' : 'focus:ring-1 focus:ring-blue-500/20'}`}
                  style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    lineHeight: lineSpacing,
                    columnCount: columnCount,
                    columnGap: '28px',
                  }}
                />
              </div>

              {/* Footer / Pied de page A4 (Partie IV) */}
              <div className="px-6 sm:px-14 py-4 text-[11px] text-slate-400 border-t border-slate-200 flex justify-between items-center select-none font-sans z-10">
                <span>Standard ISO 216 • Marges {marginSize === 'narrow' ? '12,7 mm' : marginSize === 'wide' ? '38,1 mm' : '25 mm'}</span>
                <span className="font-semibold text-slate-600">Page 1 sur 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Sidebar (Partie VII) */}
        {showCommentsSidebar && (
          <aside className="w-72 bg-slate-900 border-l border-slate-750 p-4 flex flex-col h-full text-xs shadow-xl z-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Commentaires Word ({comments.length})</span>
              </span>
              <button onClick={() => setShowCommentsSidebar(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {comments.length === 0 ? (
                <div className="text-slate-400 text-center py-8">Aucun commentaire dans la marge.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-850 border border-slate-750 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <strong>{c.author}</strong>
                      <span>{c.date}</span>
                    </div>
                    <p className="text-slate-200">{c.text}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setComments(comments.filter((item) => item.id !== c.id))}
                        className="text-[10px] text-emerald-400 hover:underline"
                      >
                        Résoudre / Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* F7 Editor Sidebar (Partie VII) */}
        <EditorPanel
          isOpen={isEditorPanelOpen}
          onClose={() => setIsEditorPanelOpen(false)}
          documentText={editorRef.current?.innerText || ''}
          onApplyFix={handleApplyEditorFix}
          stats={stats}
        />
      </div>

      {/* 5. MS WORD STATUS BAR (Bottom bar per myITschools reference & User Guide Partie I.8) */}
      <footer className="h-7 bg-[#2b579a] text-white px-3 flex items-center justify-between text-[11px] shrink-0 font-medium select-none shadow-inner border-t border-[#1b3a6b]">
        {/* Left: Page, Words, Language, Proofing, INS/REF */}
        <div className="flex items-center gap-3">
          <span className="bg-black/20 px-2 py-0.5 rounded font-mono">Format A4</span>
          <span>Page 1 sur 1</span>
          <span>•</span>
          <button
            onClick={() => setIsEditorPanelOpen(true)}
            className="hover:underline flex items-center gap-1"
            title="Cliquer pour afficher les statistiques détaillées"
          >
            <span>{stats.words} mots</span>
          </button>
          <span>•</span>
          <span>Français (France)</span>
          <button
            onClick={() => setIsEditorPanelOpen(true)}
            className="hidden sm:flex items-center gap-1 text-blue-200 hover:text-white"
            title="Vérificateur orthographique (F7)"
          >
            <Check className="w-3 h-3 text-emerald-300" />
            <span>Aucune erreur détectée</span>
          </button>
          <button
            onClick={() => setEditMode(editMode === 'INS' ? 'REF' : 'INS')}
            className="px-1.5 py-0.5 rounded bg-black/20 font-mono text-[10px] hover:bg-black/40 text-blue-200"
            title="Mode d'édition : Insertion ou Refrappe"
          >
            {editMode}
          </button>
        </div>

        {/* Right: View Modes & Zoom Slider (Partie I.9) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setViewMode('reading')}
              className={`p-1 rounded hover:bg-white/15 ${viewMode === 'reading' ? 'bg-white/20' : ''}`}
              title="Mode Lecture"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('page')}
              className={`p-1 rounded hover:bg-white/15 ${viewMode === 'page' ? 'bg-white/20' : ''}`}
              title="Mode Page A4 (Impression)"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('web')}
              className={`p-1 rounded hover:bg-white/15 ${viewMode === 'web' ? 'bg-white/20' : ''}`}
              title="Mode Web"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Slider (Partie I.9) */}
          <div className="flex items-center gap-1.5 font-mono">
            <button onClick={() => setZoom(Math.max(40, zoom - 10))} className="hover:text-blue-200 font-bold px-1">
              —
            </button>
            <input
              type="range"
              min="40"
              max="150"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value, 10))}
              className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
            />
            <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="hover:text-blue-200 font-bold px-1">
              +
            </button>
            <span className="min-w-[36px] text-right">{zoom}%</span>
          </div>
        </div>
      </footer>

      {/* LaTeX Equation Editor Modal */}
      <LatexModal
        isOpen={isLatexModalOpen}
        onClose={() => setIsLatexModalOpen(false)}
        onInsertLatex={(html) => execCmd('insertHTML', html)}
      />

      {/* Office Backstage Modal for "Fichier" menu (Partie I.3) */}
      <OfficeBackstageModal
        isOpen={isBackstageOpen}
        onClose={() => setIsBackstageOpen(false)}
        file={file}
        onSave={() => onUpdateFile({ updatedAt: Date.now() })}
        onExport={() => window.print()}
        onPrint={() => window.print()}
        onNew={() => {
          if (onNewDocument) onNewDocument();
        }}
        onBrowseFiles={() => {
          if (onCloseDocument) onCloseDocument();
        }}
        onCloseDocument={onCloseDocument}
      />

      {/* Guide Exhaustif de Microsoft Word Modal (Partie I à VIII) */}
      <WordGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        initialSection={guideInitialSection}
      />

      {/* Publipostage (Mail Merge) Manager Modal (Partie VI) */}
      <MailingsManagerModal
        isOpen={isMailingsOpen}
        onClose={() => setIsMailingsOpen(false)}
        recipients={recipients}
        onUpdateRecipients={(recs) => setRecipients(recs)}
        documentContent={editorRef.current?.innerHTML || ''}
        onInsertField={handleInsertMergeField}
        onApplyMergedDocument={(mergedHtml) => {
          if (editorRef.current) {
            editorRef.current.innerHTML = mergedHtml;
            handleInput();
          }
        }}
      />

      {/* Insert Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-blue-400" /> Insérer un tableau Word
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nombre de lignes :</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Nombre de colonnes :</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Annuler
              </button>
              <button
                onClick={insertTable}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Insérer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
