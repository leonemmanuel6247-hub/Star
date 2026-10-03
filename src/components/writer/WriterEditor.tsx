import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { OfficeFile } from '../../types/office';
import {
  PAGEBREAK,
  SECTIONBREAK,
  Selection,
  uid,
  legacyToMarkers,
  stripMarkers,
  insertAtCursor,
  wrapSelection,
  toggleWrap,
  toggleLinePrefix,
  toggleList,
  indentLines,
  computeStats,
  extractHeadings,
  proofFrench,
  applyAutoFix,
  tableContextAt,
  tableInsertRow,
  tableDeleteRow,
  tableInsertCol,
  tableDeleteCol,
  tableDeleteBlock,
  tableSort,
  tableCellNav,
  mergeFields,
  parseInlineKeepMarkers,
  classifyUnderlayLine,
  RichSeg,
  UnderlayLineStyle,
  buildPrintHtml,
  buildDocFile,
  buildRtf,
  escapeHtml,
  Recipient,
  ProofIssue,
} from './format';
import DocPreview, {
  DocImage,
  DocDrawing,
  DocChart,
  TextEffect,
} from './DocPreview';
import DrawModal from './DrawModal';

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
  onCloseDocument: () => void;
  onNewDocument: () => void;
  onCreateFiles?: (files: Array<{ name: string; content: object }>) => void;
}

const RIBBON_TABS = [
  { id: 'file', label: 'Fichier' },
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
];

const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];
const TEXT_COLORS = ['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#1864ab', '#c2255c'];
const HL_COLORS = ['#fef08a', '#fdba74', '#bef264', '#93c5fd', '#d8b4fe'];
const PAGE_COLORS = ['#ffffff', '#fffbeb', '#f8fafc', '#eff6ff', '#fef2f2', '#f0fdf4'];
const SYMBOLS = '« » … — – • · © ® ™ € £ ¥ ± × ÷ ½ ¼ ¾ → ← ↑ ↓ ★ ☆ ♥ ♦ ♣ ♠ ✓ ✗ § ¶ ° µ ∑ √ ∫ π Δ ≠ ≤ ≥ ∞ ⌂'.split(' ');
const EQUATIONS = ['E = mc²', 'a² + b² = c²', '∑(i=1→n)', '∫ f(x) dx', '√(a² + b²)', 'π ≈ 3,14159', 'Δ = b² − 4ac', 'x = (−b ± √Δ) / 2a', '∞', '≠  ≤  ≥  ±'];

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Align = 'left' | 'center' | 'right' | 'justify';
type ViewMode = 'page' | 'lecture' | 'web' | 'plan' | 'brouillon';
type ExportFormat = 'txt' | 'md' | 'html' | 'rtf' | 'doc' | 'pdf';

interface DocComment {
  id: string;
  quote: string;
  text: string;
  at: number;
}
interface DocVersion {
  id: string;
  at: number;
  label: string;
  text: string;
}
interface Footnote {
  n: number;
  text: string;
}
interface Source {
  id: string;
  auteur: string;
  annee: string;
  titre: string;
}

function RibbonButton({
  icon,
  label,
  onPress,
  color = '#444444',
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable style={styles.rBtn} onPress={onPress} accessibilityLabel={label} accessibilityRole="button">
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={styles.rBtnLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function RibbonSmallBtn({
  icon,
  label,
  onPress,
  color = '#444444',
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable style={styles.rSmallBtn} onPress={onPress} accessibilityLabel={label} accessibilityRole="button">
      <MaterialCommunityIcons name={icon} size={16} color={color} />
    </Pressable>
  );
}

function RibbonGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.rGroup}>
      <View style={styles.rGroupTools}>{children}</View>
      <Text style={styles.rGroupTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

function Sheet({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, wide && { maxWidth: 640 }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable accessibilityRole="button" style={styles.sheetClose} onPress={onClose} accessibilityLabel="Fermer">
              <MaterialCommunityIcons name="close" size={16} color="#334155" />
              <Text style={styles.sheetCloseText}>Fermer</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.sheetBody}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ActionRow({
  label,
  desc,
  onPress,
}: {
  label: string;
  desc?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" style={styles.actionRow} onPress={onPress}>
      <Text style={styles.actionLabel}>{label}</Text>
      {!!desc && <Text style={styles.actionDesc}>{desc}</Text>}
    </Pressable>
  );
}

const initialTextOf = (content: Record<string, unknown>): string => {
  const raw = String(
    (content?.text as string) ?? (content?.html as string) ?? ''
  );
  return legacyToMarkers(raw)
    .replace(/\n+/g, '\n')
    .replace(/^Commencez à rédiger votre texte ici\.\.\.$/, '')
    .replace(/^Commencez à rédiger votre document\.\.\.$/, '')
    .trim();
};

// ── Rendu WYSIWYG d'une ligne : les marqueurs (** * __ ~~ # > ...) sont
// invisibles (mais gardent une micro-largeur pour que le curseur reste aligné),
// les « | » des tableaux restent visibles en gris (structure du tableau).
function renderUnderlaySegs(
  segs: RichSeg[],
  cls: UnderlayLineStyle,
  effFontSize: number,
  highlightColor: string
) {
  let list = segs;
  const pre =
    cls === 'h1' || cls === 'h2' || cls === 'h3'
      ? /^(\s*#{1,3}\s+)/
      : cls === 'quote'
        ? /^(\s*>\s?)/
        : cls === 'textbox'
          ? /^(\s*>>>\s?)/
          : null;
  if (pre && list.length > 0 && !list[0].marker) {
    const m = pre.exec(list[0].text);
    if (m) {
      const head: RichSeg = { text: m[1], marker: true };
      const tail = list[0].text.slice(m[1].length);
      const rest = list.slice(1);
      list = tail ? [head, { ...list[0], text: tail }, ...rest] : [head, ...rest];
    }
  }
  const hiddenMarker = {
    color: 'transparent',
    fontSize: Math.max(1, Math.round(effFontSize * 0.5)),
  };
  const isTable = cls === 'table';
  if (list.length === 0) return '';
  return list.map((sg: RichSeg, si: number) => {
    const base = [
      sg.marker && hiddenMarker,
      sg.bold && { fontWeight: 'bold' as const },
      sg.italic && { fontStyle: 'italic' as const },
      sg.underline && !sg.strike && { textDecorationLine: 'underline' as const },
      sg.strike && !sg.underline && { textDecorationLine: 'line-through' as const },
      sg.underline && sg.strike && { textDecorationLine: 'underline line-through' as const },
      sg.code && { fontFamily: 'monospace', backgroundColor: '#eef2f7' },
      sg.sub && { fontSize: Math.max(8, effFontSize - 3) },
      sg.sup && { fontSize: Math.max(8, effFontSize - 3) },
      sg.highlight && { backgroundColor: highlightColor },
      sg.field && { backgroundColor: '#fef9c3' },
      sg.link && { color: '#2b579a' },
    ];
    if (!isTable || sg.marker || !sg.text.includes('|')) {
      return (
        <Text key={si} style={base}>
          {sg.text}
        </Text>
      );
    }
    return (
      <Text key={si} style={base}>
        {sg.text.split(/(\|)/g).map((part, pi) =>
          part === '|' ? (
            <Text key={pi} style={{ color: '#94a3b8' }}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  });
}


export default function WriterEditor({ file, onUpdateFile, onCloseDocument, onNewDocument, onCreateFiles }: Props) {
  const dims = useWindowDimensions();
  const isLandscape = dims.width > dims.height;
  const c = (file.content || {}) as Record<string, never>;
  const s = ((c.settings as Record<string, never> | undefined) || {}) as Record<string, never>;

  // ── Document ──
  const [text, setText] = useState<string>(() => initialTextOf(c as Record<string, unknown>));
  const [sel, setSel] = useState<Selection>({ start: 0, end: 0 });
  const [history, setHistory] = useState<string[]>(() => [initialTextOf(c as Record<string, unknown>)]);
  const [hIndex, setHIndex] = useState(0);

  // ── Réglages persistés ──
  const [font, setFont] = useState<string>(String(s.font || 'Calibri'));
  const [fontSize, setFontSize] = useState<number>(Number(s.fontSize || 11));
  const [textColor, setTextColor] = useState<string>(String(s.color || '#000000'));
  const [highlightColor, setHighlightColor] = useState<string>(String(s.highlight || '#fef08a'));
  const [align, setAlign] = useState<Align>((s.align as Align) || 'left');
  const [lineSpacing, setLineSpacing] = useState<number>(Number(s.lineSpacing || 1.5));
  const [paraGap, setParaGap] = useState<number>(Number(s.paraGap ?? 4));
  const [header, setHeader] = useState<{ text: string; on: boolean }>(
    (s.header as { text: string; on: boolean }) || { text: '', on: false }
  );
  const [footer, setFooter] = useState<{ text: string; on: boolean }>(
    (s.footer as { text: string; on: boolean }) || { text: '', on: false }
  );
  const [pageNumbers, setPageNumbers] = useState<boolean>(Boolean(s.pageNumbers));
  const [pageColor, setPageColor] = useState<string>(String(s.pageColor || '#ffffff'));
  const [pageBorder, setPageBorder] = useState<string>(String(s.pageBorder || 'none'));
  const [watermark, setWatermark] = useState<{ text: string; on: boolean }>(
    (s.watermark as { text: string; on: boolean }) || { text: 'BROUILLON', on: false }
  );
  const [columns, setColumns] = useState<number>(Number(s.columns || 1));
  const [lineNumbers, setLineNumbers] = useState<boolean>(Boolean(s.lineNumbers));
  const [orientation, setOrientation] = useState<string>(String(s.orientation || 'portrait'));
  const [pageW, setPageW] = useState(0);
  const [margins, setMargins] = useState<string>(String(s.margins || 'normal'));
  const [paper, setPaper] = useState<string>(String(s.paper || 'A4'));
  const [effect, setEffect] = useState<TextEffect>((s.effect as TextEffect) || 'none');
  const [language, setLanguage] = useState<string>(String(s.language || 'fr'));
  const [comments, setComments] = useState<DocComment[]>((c.comments as DocComment[]) || []);
  const [versions, setVersions] = useState<DocVersion[]>((c.versions as DocVersion[]) || []);
  const [tracking, setTracking] = useState<boolean>(Boolean(c.tracking));
  const [drawings, setDrawings] = useState<DocDrawing[]>((c.drawings as DocDrawing[]) || []);
  const [images, setImages] = useState<DocImage[]>((c.images as DocImage[]) || []);
  const [charts, setCharts] = useState<DocChart[]>((c.charts as DocChart[]) || []);
  const [recipients, setRecipients] = useState<Recipient[]>((c.recipients as Recipient[]) || []);
  const [footnotes, setFootnotes] = useState<Footnote[]>((c.footnotes as Footnote[]) || []);
  const [footnoteN, setFootnoteN] = useState<number>(Number((c.footnoteN as number) || 1));
  const [sources, setSources] = useState<Source[]>((c.sources as Source[]) || []);
  const [captionN, setCaptionN] = useState<number>(Number((c.captionN as number) || 1));

  // ── Interface ──
  const [activeTab, setActiveTab] = useState('home');
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('page');
  const [backstageOpen, setBackstageOpen] = useState(false);
  const [bsItem, setBsItem] = useState('infos');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [drawOpen, setDrawOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState<number>(0);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [autoCorrect, setAutoCorrect] = useState(true);

  // ── Recherche ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'find' | 'replace'>('find');
  const [query, setQuery] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [matchIdx, setMatchIdx] = useState(0);

  // ── Champs des modales ──
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://');
  const [tblRows, setTblRows] = useState(3);
  const [tblCols, setTblCols] = useState(3);
  const [chartTitle, setChartTitle] = useState('Mon graphique');
  const [chartVals, setChartVals] = useState('10, 25, 15, 30');
  const [chartLabels, setChartLabels] = useState('T1, T2, T3, T4');
  const [footnoteText, setFootnoteText] = useState('');
  const [srcAuteur, setSrcAuteur] = useState('');
  const [srcAnnee, setSrcAnnee] = useState(String(new Date().getFullYear()));
  const [srcTitre, setSrcTitre] = useState('');
  const [newRNom, setNewRNom] = useState('');
  const [newREmail, setNewREmail] = useState('');
  const [newRAdr, setNewRAdr] = useState('');
  const [mergeIdx, setMergeIdx] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [hdrText, setHdrText] = useState('');
  const [ftrText, setFtrText] = useState('');
  const [wmText, setWmText] = useState('BROUILLON');
  const [proofIssues, setProofIssues] = useState<ProofIssue[]>([]);
  const [proofDone, setProofDone] = useState(false);
  const [proofSelOnly, setProofSelOnly] = useState(false);
  const [proofRange, setProofRange] = useState({ start: 0, end: 0 });
  const [inputHeight, setInputHeight] = useState(480);

  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeCount = useRef(0);

  const showBanner = useCallback((msg: string) => {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 2600);
  }, []);

  // ── Persistance ──
  const buildContent = useCallback(
    (nextText: string) => {
      const wc = nextText.trim() ? nextText.split(/\s+/).filter(Boolean).length : 0;
      return {
        text: nextText,
        html: `<p>${escapeHtml(nextText).split('\n').join('</p><p>')}</p>`,
        wordCount: wc,
        settings: {
          font, fontSize, color: textColor, highlight: highlightColor, align,
          lineSpacing, paraGap, header, footer, pageNumbers, pageColor,
          pageBorder, watermark, columns, lineNumbers, orientation,
          margins, paper, effect, language,
        },
        comments, versions, tracking, drawings, images, charts,
        recipients, footnotes, footnoteN, sources, captionN,
      };
    },
    [font, fontSize, textColor, highlightColor, align, lineSpacing, paraGap, header, footer,
      pageNumbers, pageColor, pageBorder, watermark, columns, lineNumbers, orientation,
      margins, paper, effect, language, comments, versions, tracking, drawings, images,
      charts, recipients, footnotes, footnoteN, sources, captionN]
  );

  const persist = useCallback(
    (nextText: string) => {
      onUpdateFile({ content: buildContent(nextText), size: 12000 + nextText.length * 2 });
      setSavedTick(Date.now());
    },
    [buildContent, onUpdateFile]
  );

  // Sauvegarde quand un réglage change (sans toucher à l'historique)
  useEffect(() => {
    persist(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font, fontSize, textColor, highlightColor, align, lineSpacing, paraGap, header, footer,
    pageNumbers, pageColor, pageBorder, watermark, columns, lineNumbers, orientation,
    margins, paper, effect, language, comments, versions, tracking, drawings, images,
    charts, recipients, footnotes, footnoteN, sources, captionN]);

  const applyText = useCallback(
    (next: string, nextSel?: Selection, record = true) => {
      setText(next);
      if (nextSel) setSel({ start: Math.max(0, nextSel.start), end: Math.max(0, nextSel.end) });
      if (record) {
        setHistory((h) => {
          const cut = h.slice(0, hIndex + 1);
          cut.push(next);
          return cut.length > 80 ? cut.slice(cut.length - 80) : cut;
        });
        setHIndex((i) => Math.min(i + 1, 79));
        changeCount.current += 1;
        if (tracking && changeCount.current % 25 === 0) {
          setVersions((v) =>
            [{ id: uid(), at: Date.now(), label: 'Suivi auto', text: next }, ...v].slice(0, 8)
          );
        }
      }
      persist(next);
    },
    [hIndex, persist, tracking]
  );

  const undo = useCallback(() => {
    if (hIndex <= 0) {
      showBanner('Rien à annuler');
      return;
    }
    const ni = hIndex - 1;
    setHIndex(ni);
    setText(history[ni]);
    persist(history[ni]);
    showBanner('Annulé');
  }, [hIndex, history, persist, showBanner]);

  const redo = useCallback(() => {
    if (hIndex >= history.length - 1) {
      showBanner('Rien à rétablir');
      return;
    }
    const ni = hIndex + 1;
    setHIndex(ni);
    setText(history[ni]);
    persist(history[ni]);
    showBanner('Rétabli');
  }, [hIndex, history, persist, showBanner]);

  // ── Presse-papiers ──
  const selText = text.slice(Math.min(sel.start, sel.end), Math.max(sel.start, sel.end));

  const doCopy = useCallback(async () => {
    if (!selText) {
      showBanner('Sélectionnez du texte à copier');
      return;
    }
    try {
      await Clipboard.setStringAsync(selText);
      showBanner('Copié dans le presse-papiers');
    } catch {
      showBanner('Copie impossible sur cet appareil');
    }
  }, [selText, showBanner]);

  const doCut = useCallback(async () => {
    if (!selText) {
      showBanner('Sélectionnez du texte à couper');
      return;
    }
    try {
      await Clipboard.setStringAsync(selText);
    } catch {
      /* presse-papiers indisponible, on coupe quand même */
    }
    const s = Math.min(sel.start, sel.end);
    applyText(text.slice(0, s) + text.slice(Math.max(sel.start, sel.end)), { start: s, end: s });
    showBanner('Coupé');
  }, [selText, sel, text, applyText, showBanner]);

  const doPaste = useCallback(async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (!clip) {
        showBanner('Presse-papiers vide');
        return;
      }
      const r = insertAtCursor(text, sel, clip);
      applyText(r.text, r.sel);
      showBanner('Collé');
    } catch {
      showBanner('Collage impossible sur cet appareil');
    }
  }, [text, sel, applyText, showBanner]);

  // ── Raccourcis clavier (web / clavier physique) ──
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => handleKeyRef.current(e);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const textRef = useRef(text);
  textRef.current = text;
  const selRef = useRef(sel);
  selRef.current = sel;
  const applyRef = useRef(applyText);
  applyRef.current = applyText;
  const undoRef = useRef(undo);
  undoRef.current = undo;
  const redoRef = useRef(redo);
  redoRef.current = redo;

  // ── Clavier : logique partagée entre le document global et le champ éditeur.
  // RNW stoppe la propagation des touches du TextInput (stopPropagation) : sans le
  // relais onKeyPress, aucun raccourci ne fonctionne pendant la frappe. Les deux
  // voies sont complémentaires (jamais de double déclenchement).
  const handleKey = (e: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    preventDefault: () => void;
  }) => {
    const mod = !!(e.ctrlKey || e.metaKey);
    const k = e.key.toLowerCase();
    const apply = (fn: (t: string, s: Selection) => { text: string; sel: Selection }) => {
      const r = fn(textRef.current, selRef.current);
      applyRef.current(r.text, r.sel);
    };
    // Navigation dans les tableaux : Tab / Maj+Tab = cellule suivante/précédente, Entrée = ligne suivante.
    const ae = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
    const inEditor = !!ae && ae.tagName === 'TEXTAREA';
    if (inEditor && (e.key === 'Tab' || (e.key === 'Enter' && !mod && !e.shiftKey))) {
      const nav = tableCellNav(
        textRef.current,
        selRef.current,
        e.key === 'Tab' ? (e.shiftKey ? 'prev' : 'next') : 'down',
      );
      if (nav) {
        e.preventDefault();
        applyRef.current(nav.text, nav.sel, nav.text !== textRef.current);
        return;
      }
    }
    if (mod && k === 's') { e.preventDefault(); persist(textRef.current); showBanner('Document enregistré'); }
    else if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); undoRef.current(); }
    else if ((mod && k === 'y') || (mod && e.shiftKey && k === 'z')) { e.preventDefault(); redoRef.current(); }
    else if (mod && (k === 'b' || k === 'g')) { e.preventDefault(); apply((t, s) => toggleWrap(t, s, '**')); }
    else if (mod && k === 'i') { e.preventDefault(); apply((t, s) => toggleWrap(t, s, '*')); }
    else if (mod && k === 'u') { e.preventDefault(); apply((t, s) => toggleWrap(t, s, '__')); }
    else if (mod && k === 'e') { e.preventDefault(); setAlign('center'); }
    else if (mod && k === 'l') { e.preventDefault(); setAlign('left'); }
    else if (mod && k === 'r') { e.preventDefault(); setAlign('right'); }
    else if (mod && k === 'j') { e.preventDefault(); setAlign('justify'); }
    else if (mod && k === 'f') { e.preventDefault(); setSearchMode('find'); setSearchOpen(true); }
    else if (mod && k === 'h') { e.preventDefault(); setSearchMode('replace'); setSearchOpen(true); }
    else if (e.key === 'F7') { e.preventDefault(); runProofRef.current(); }
    else if (mod && e.key === 'F1') { e.preventDefault(); setRibbonCollapsed((v) => !v); }
  };
  const handleKeyRef = useRef(handleKey);
  handleKeyRef.current = handleKey;

  // ── Recherche / remplacement ──
  const matches = useRef<Array<{ start: number; end: number }>>([]);
  const computeMatches = (q: string) => {
    matches.current = [];
    if (!q) return matches.current;
    const lower = text.toLowerCase();
    const needle = q.toLowerCase();
    let at = 0;
    while (true) {
      const i = lower.indexOf(needle, at);
      if (i === -1 || matches.current.length > 500) break;
      matches.current.push({ start: i, end: i + needle.length });
      at = i + Math.max(1, needle.length);
    }
    return matches.current;
  };

  const jumpToMatch = (idx: number) => {
    const ms = computeMatches(query);
    if (ms.length === 0) {
      showBanner('Aucune occurrence trouvée');
      return;
    }
    const ni = ((idx % ms.length) + ms.length) % ms.length;
    setMatchIdx(ni);
    setSel({ start: ms[ni].start, end: ms[ni].end });
  };

  const replaceOne = () => {
    const ms = computeMatches(query);
    if (ms.length === 0 || !query) {
      showBanner('Aucune occurrence à remplacer');
      return;
    }
    const m = ms[Math.min(matchIdx, ms.length - 1)];
    const next = text.slice(0, m.start) + replaceWith + text.slice(m.end);
    const pos = m.start + replaceWith.length;
    applyText(next, { start: pos, end: pos });
    showBanner('Occurrence remplacée');
  };

  const replaceAll = () => {
    if (!query) {
      showBanner('Saisissez le texte à rechercher');
      return;
    }
    const ms = computeMatches(query);
    if (ms.length === 0) {
      showBanner('Aucune occurrence trouvée');
      return;
    }
    const next = text.split(query).join(replaceWith);
    // Remplacement insensible à la casse :
    const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const next2 = text.replace(rx, replaceWith);
    void next;
    applyText(next2, { start: 0, end: 0 });
    showBanner(`${ms.length} occurrence(s) remplacée(s)`);
  };

  // ── Vérification (document entier, ou sélection si non vide) ──
  const runProof = useCallback(() => {
    const s0 = Math.min(sel.start, sel.end);
    const e0 = Math.max(sel.start, sel.end);
    const scoped = e0 > s0;
    const slice = scoped ? text.slice(s0, e0) : text;
    const raw = proofFrench(slice);
    const issues = scoped ? raw.map((p) => ({ ...p, index: p.index + s0 })) : raw;
    setProofIssues(issues);
    setProofDone(true);
    setProofSelOnly(scoped);
    setProofRange({ start: s0, end: scoped ? e0 : text.length });
    setActiveModal('proof');
    if (issues.length === 0) showBanner(scoped ? 'Sélection sans problème détecté' : 'Aucun problème détecté');
  }, [text, sel, showBanner]);

  // ── Tout corriger (portée de la dernière vérification) ──
  const fixAllProof = useCallback(() => {
    const s0 = Math.max(0, proofRange.start);
    const e0 = Math.min(Math.max(proofRange.end, s0), text.length);
    const slice = text.slice(s0, e0);
    const r = applyAutoFix(slice);
    if (r.count === 0) {
      showBanner('Rien à corriger automatiquement');
      return;
    }
    const next = text.slice(0, s0) + r.text + text.slice(e0);
    const newEnd = s0 + r.text.length;
    applyText(next, { start: s0, end: newEnd });
    setProofRange({ start: s0, end: newEnd });
    const raw = proofFrench(r.text);
    setProofIssues(proofSelOnly ? raw.map((p) => ({ ...p, index: p.index + s0 })) : raw);
    showBanner(`${r.count} correction(s) automatique(s)`);
  }, [text, proofRange, proofSelOnly, applyText, showBanner]);
  // Entrée dans un tableau (natif) : descendre à la ligne suivante au lieu de casser le tableau.
  // Sur Android on ne peut pas annuler la touche : on détecte le « \n » inséré et on le remplace par la navigation.
  const onEditorChange = useCallback((t: string) => {
    if (Platform.OS !== 'web') {
      const prev = textRef.current;
      if (t.length === prev.length + 1) {
        let ins = 0;
        while (ins < prev.length && prev[ins] === t[ins]) ins += 1;
        if (t[ins] === '\n') {
          const nav = tableCellNav(prev, { start: ins, end: ins }, 'down');
          if (nav) {
            applyText(nav.text, nav.sel, nav.text !== prev);
            return;
          }
        }
      }
    }
    applyText(t);
  }, [applyText]);

  const runProofRef = useRef(runProof);
  runProofRef.current = runProof;

  // ── Fichiers : impression / partage / export ──
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const downloadOnWeb = (filename: string, content: string, mime: string) => {
    if (typeof document === 'undefined') return false;
    try {
      const blob = new Blob([content], { type: `${mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return true;
    } catch {
      return false;
    }
  };

  const doPrint = useCallback(async () => {
    const html = buildPrintHtml({
      title: file.name, text, font, fontSize, color: textColor, lineHeight: lineSpacing,
      header: header.on ? header.text : undefined,
      footer: footer.on ? footer.text : undefined,
      pageNumbers, columns,
    });
    if (Platform.OS === 'web') {
      if (downloadOnWeb(`${baseName}.html`, html, 'text/html')) {
        showBanner('Aperçu HTML téléchargé (Ctrl+P pour imprimer)');
      } else {
        showBanner('Impression impossible sur le web');
      }
      return;
    }
    try {
      await Print.printAsync({ html, width: 595, height: 842 });
      showBanner('Impression lancée');
    } catch {
      showBanner('Impression impossible');
    }
  }, [file.name, text, font, fontSize, textColor, lineSpacing, header, footer, pageNumbers, columns, baseName, showBanner]);

  const buildExport = (fmt: ExportFormat): { filename: string; content: string; mime: string } | null => {
    const o = {
      title: file.name, text, font, fontSize, color: textColor, lineHeight: lineSpacing,
      header: header.on ? header.text : undefined,
      footer: footer.on ? footer.text : undefined,
      pageNumbers, columns,
    };
    switch (fmt) {
      case 'txt':
        return { filename: `${baseName}.txt`, content: stripMarkers(text), mime: 'text/plain' };
      case 'md':
        return { filename: `${baseName}.md`, content: text, mime: 'text/markdown' };
      case 'html':
        return { filename: `${baseName}.html`, content: buildPrintHtml(o), mime: 'text/html' };
      case 'rtf':
        return { filename: `${baseName}.rtf`, content: buildRtf(o), mime: 'application/rtf' };
      case 'doc':
        return { filename: `${baseName}.doc`, content: buildDocFile(o), mime: 'application/msword' };
      default:
        return null;
    }
  };

  const doShareFile = useCallback(
    async (fmt: ExportFormat) => {
      if (fmt === 'pdf') {
        await doPrint();
        return;
      }
      const f = buildExport(fmt);
      if (!f) return;
      if (Platform.OS === 'web') {
        if (downloadOnWeb(f.filename, f.content, f.mime)) showBanner(`Fichier téléchargé : ${f.filename}`);
        else showBanner('Téléchargement impossible');
        return;
      }
      try {
        if (!(await Sharing.isAvailableAsync())) {
          showBanner('Partage indisponible sur cet appareil');
          return;
        }
        const uri = `${FileSystem.cacheDirectory}${f.filename}`;
        await FileSystem.writeAsStringAsync(uri, f.content, { encoding: 'utf8' });
        await Sharing.shareAsync(uri, { mimeType: f.mime, dialogTitle: `Partager ${f.filename}` });
        showBanner('Partage lancé');
      } catch {
        showBanner('Partage impossible');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, font, fontSize, textColor, lineSpacing, header, footer, pageNumbers, columns, baseName, doPrint, showBanner]
  );

  // ── Images ──
  const pickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showBanner('Autorisation galerie refusée');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const uri = res.assets[0].uri;
      const id = uid();
      setImages((imgs) => [...imgs, { id, uri }]);
      const r = insertAtCursor(textRef.current, selRef.current, `\n[image:${id}]\n`);
      applyRef.current(r.text, r.sel);
      showBanner('Image insérée (visible dans l’Aperçu)');
    } catch {
      showBanner('Insertion d’image impossible');
    }
  }, [showBanner]);

  // ── Helpers ruban ──
  const fmt = (before: string, after: string = before, toggle = true) => {
    const r = toggle ? toggleWrap(text, sel, before, after) : wrapSelection(text, sel, before, after);
    applyText(r.text, r.sel);
  };
  const insertSnippet = (snippet: string) => {
    const r = insertAtCursor(text, sel, snippet);
    applyText(r.text, r.sel);
  };

  // ── Tableaux : contexte du curseur (groupe contextuel façon Word) ──
  const tblCtx = tableContextAt(text, Math.min(sel.start, sel.end));

  const applyTableOp = (
    op: (t: string, s: Selection) => { text: string; sel: Selection },
    doneMsg: string,
    idleMsg = 'Placez le curseur dans un tableau',
  ) => {
    const r = op(text, sel);
    if (r.text === text) {
      showBanner(tblCtx.inTable ? idleMsg : 'Placez le curseur dans un tableau');
      return;
    }
    applyText(r.text, r.sel);
    showBanner(doneMsg);
  };

  const insertTable = (rows: number, cols: number) => {
    const head = `| ${Array.from({ length: cols }).map((_, i) => `Col${i + 1}`).join(' | ')} |`;
    const sep = `| ${Array.from({ length: cols }).map(() => '---').join(' | ')} |`;
    const body = Array.from({ length: Math.max(0, rows - 1) })
      .map(() => `| ${Array.from({ length: cols }).map(() => '  ').join(' | ')} |`)
      .join('\n');
    const s0 = Math.min(sel.start, sel.end);
    const needNl = s0 > 0 && text[s0 - 1] !== '\n';
    insertSnippet(`${needNl ? '\n' : ''}${head}\n${sep}\n${body}\n`);
    showBanner(`Tableau ${cols}×${rows} inséré`);
  };

  const applyStyleLine = (kind: 'h1' | 'h2' | 'h3' | 'normal') => {
    if (kind === 'normal') {
      const s0 = Math.min(sel.start, sel.end);
      const e0 = Math.max(sel.start, sel.end);
      const lines = text.split('\n');
      // Retire les # en début des lignes couvertes
      let pos = 0;
      const next = lines
        .map((l) => {
          const start = pos;
          pos += l.length + 1;
          if (pos >= s0 && start <= e0) return l.replace(/^#{1,3}\s+/, '');
          return l;
        })
        .join('\n');
      applyText(next, sel);
      showBanner('Style Normal appliqué');
      return;
    }
    const r = toggleLinePrefix(text, sel, kind === 'h1' ? '# ' : kind === 'h2' ? '## ' : '### ');
    applyText(r.text, r.sel);
    showBanner(`Style ${kind === 'h1' ? 'Titre 1' : kind === 'h2' ? 'Titre 2' : 'Titre 3'} appliqué`);
  };

  const cycleSpacing = () => {
    const steps = [1.0, 1.15, 1.5, 2.0];
    const i = steps.findIndex((v) => Math.abs(v - lineSpacing) < 0.01);
    const nv = steps[(i + 1) % steps.length];
    setLineSpacing(nv);
    showBanner(`Interligne : ${nv}`);
  };

  const cycleParaGap = () => {
    const steps = [0, 4, 8, 12];
    const i = steps.indexOf(paraGap);
    const nv = steps[(i + 1) % steps.length];
    setParaGap(nv);
    showBanner(`Espacement paragraphes : ${nv} pt (Aperçu/impression)`);
  };

  const cycleMargins = () => {
    const order = ['etroit', 'normal', 'large'];
    const labels: Record<string, string> = { etroit: 'Étroites', normal: 'Normales', large: 'Larges' };
    const nv = order[(order.indexOf(margins) + 1) % order.length];
    setMargins(nv);
    showBanner(`Marges : ${labels[nv]}`);
  };

  const cyclePaper = () => {
    const order = ['A4', 'Lettre', 'Légal'];
    const nv = order[(order.indexOf(paper) + 1) % order.length];
    setPaper(nv);
    showBanner(`Taille du papier : ${nv}`);
  };

  const cycleEffect = () => {
    const order: TextEffect[] = ['none', 'ombre', 'lueur'];
    const labels: Record<TextEffect, string> = { none: 'Aucun', ombre: 'Ombre', lueur: 'Lueur' };
    const nv = order[(order.indexOf(effect) + 1) % order.length];
    setEffect(nv);
    showBanner(`Effet de texte : ${labels[nv]} (Aperçu/impression)`);
  };

  const insertFootnote = () => {
    if (!footnoteText.trim()) {
      showBanner('Saisissez le texte de la note');
      return;
    }
    const n = footnoteN;
    setFootnotes((f) => [...f, { n, text: footnoteText.trim() }]);
    setFootnoteN(n + 1);
    const atEnd = text.endsWith('\n') ? text : `${text}\n`;
    const ref = insertAtCursor(atEnd, { start: sel.start, end: sel.end }, `[^${n}]`);
    const withDef = `${ref.text}\n[^${n}]: ${footnoteText.trim()}\n`;
    applyText(withDef, ref.sel);
    setFootnoteText('');
    setActiveModal(null);
    showBanner(`Note de bas de page ${n} insérée`);
  };

  const insertCaption = () => {
    insertSnippet(`Figure ${captionN} : `);
    setCaptionN(captionN + 1);
    showBanner(`Légende « Figure ${captionN} » insérée`);
  };

  const insertTOC = () => {
    const heads = extractHeadings(text);
    if (heads.length === 0) {
      showBanner('Aucun titre (Titre 1/2/3) dans le document');
      return;
    }
    const stats = computeStats(text);
    const lines = heads.map((h) => {
      const pg = Math.min(stats.pages, Math.floor((h.index / Math.max(1, text.length)) * stats.pages) + 1);
      return `${'  '.repeat(h.level - 1)}${stripMarkers(h.text)} .... ${pg}`;
    });
    insertSnippet(`\n## Table des matières\n${lines.join('\n')}\n`);
    setActiveModal(null);
    showBanner('Table des matières insérée');
  };

  const finishMerge = () => {
    if (!onCreateFiles) {
      showBanner('Fusion impossible ici');
      return;
    }
    if (recipients.length === 0) {
      showBanner('Ajoutez des destinataires d’abord');
      return;
    }
    const docs = recipients.map((r) => ({
      name: `${baseName}_${r.nom.replace(/\s+/g, '_') || 'doc'}.docx`,
      content: {
        ...buildContent(mergeFields(text, r)),
        recipients: [],
      },
    }));
    onCreateFiles(docs);
    setActiveModal(null);
    showBanner(`${docs.length} document(s) fusionné(s) créé(s)`);
  };

  const snapVersion = (label: string) => {
    setVersions((v) => [{ id: uid(), at: Date.now(), label, text }, ...v].slice(0, 8));
    showBanner('Version enregistrée');
  };

  const stats = computeStats(text);
  const headings = extractHeadings(text);
  const effFontSize = Math.round(fontSize * (viewMode === 'lecture' ? 1.2 : 1) * (zoom / 100));
  const marginPad = margins === 'etroit' ? 12 : margins === 'large' ? 48 : 24;
  const paperMax = paper === 'Lettre' ? 760 : paper === 'Légal' ? 850 : 800;
  const paperRatio = paper === 'Lettre' ? 8.5 / 11 : paper === 'Légal' ? 8.5 / 14 : 210 / 297;
  // La feuille garde les proportions du papier (A4 : 210 x 297).
  const paperMinH =
    pageW > 0 ? Math.round(orientation === 'paysage' ? pageW * paperRatio : pageW / paperRatio) : 0;
  const pageBorderStyle =
    pageBorder === 'simple'
      ? { borderWidth: 1, borderColor: '#64748b' }
      : pageBorder === 'double'
        ? { borderWidth: 4, borderColor: '#64748b' }
        : pageBorder === 'epais'
          ? { borderWidth: 3, borderColor: '#1e293b' }
          : null;

  const openLinkModal = () => {
    setLinkText(selText.slice(0, 60));
    setLinkUrl('https://');
    setActiveModal('link');
  };

  const confirmLink = () => {
    const t = linkText.trim() || 'Lien';
    const u = linkUrl.trim() || 'https://';
    const r = selText
      ? { text: text.slice(0, Math.min(sel.start, sel.end)) + `[${selText}](${u})` + text.slice(Math.max(sel.start, sel.end)), sel }
      : insertAtCursor(text, sel, `[${t}](${u})`);
    applyText(r.text, r.sel);
    setActiveModal(null);
    showBanner('Lien inséré');
  };

  const saveChart = () => {
    const values = chartVals
      .split(',')
      .map((v) => parseFloat(v.replace(',', '.')))
      .filter((v) => !Number.isNaN(v));
    if (values.length === 0) {
      showBanner('Saisissez des nombres séparés par des virgules');
      return;
    }
    const id = uid();
    const labels = chartLabels.split(',').map((l) => l.trim());
    setCharts((ch) => [...ch, { id, title: chartTitle.trim() || 'Graphique', values, labels }]);
    insertSnippet(`\n[graphique:${id}]\n`);
    setActiveModal(null);
    showBanner('Graphique inséré (visible dans l’Aperçu)');
  };

  const RULER_CM = 16;

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* Barre de titre + accès rapide */}
      <View style={styles.titleBar}>
        <Pressable accessibilityRole="button" style={styles.qaBtn} onPress={() => { persist(text); showBanner('Document enregistré'); }} accessibilityLabel="Enregistrer">
          <MaterialCommunityIcons name="content-save" size={16} color="#2b579a" />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.qaBtn} onPress={undo} accessibilityLabel="Annuler">
          <MaterialCommunityIcons name="undo" size={16} color={hIndex > 0 ? '#2b579a' : '#cbd5e1'} />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.qaBtn} onPress={redo} accessibilityLabel="Rétablir">
          <MaterialCommunityIcons name="redo" size={16} color={hIndex < history.length - 1 ? '#2b579a' : '#cbd5e1'} />
        </Pressable>
        <View style={styles.divider} />
        <MaterialCommunityIcons name="file-document-outline" size={16} color="#2b579a" />
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        <Text style={styles.appName}> - StarOffice Writer</Text>
        {savedTick > 0 && <Text style={styles.savedHint}> · Enregistré</Text>}
        {showPreview && <Text style={styles.previewHint}> · APERÇU</Text>}
        <View style={{ flex: 1 }} />
        <Pressable accessibilityRole="button" style={styles.qaBtn} onPress={() => setShowPreview((v) => !v)} accessibilityLabel="Basculer l'aperçu">
          <MaterialCommunityIcons name={showPreview ? 'pencil' : 'eye'} size={16} color="#2b579a" />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.qaBtn} onPress={onNewDocument} accessibilityLabel="Nouveau document">
          <MaterialCommunityIcons name="file-plus" size={16} color="#2b579a" />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.qaBtn} onPress={onCloseDocument} accessibilityLabel="Fermer le document">
          <MaterialCommunityIcons name="close" size={16} color="#64748b" />
        </Pressable>
      </View>

      {/* Onglets */}
      <View style={styles.tabsRow}>
        <ScrollView horizontal style={styles.tabsBar} contentContainerStyle={styles.tabsContent} showsHorizontalScrollIndicator={false}>
          {RIBBON_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const isFile = tab.id === 'file';
            return (
              <Pressable accessibilityRole="button"
                key={tab.id}
                testID={`tab-${tab.id}`}
                onPress={() => (isFile ? (setBsItem('infos'), setBackstageOpen(true)) : (setActiveTab(tab.id), setRibbonCollapsed(false)))}
                style={[styles.tab, isFile && styles.tabFile, active && !isFile && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, isFile && styles.tabLabelFile, active && !isFile && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable accessibilityRole="button"
          style={styles.collapseBtn}
          onPress={() => setRibbonCollapsed((v) => !v)}
          accessibilityLabel={ribbonCollapsed ? 'Afficher le ruban' : 'Réduire le ruban'}
        >
          <MaterialCommunityIcons name={ribbonCollapsed ? 'chevron-down' : 'chevron-up'} size={16} color="#64748b" />
        </Pressable>
      </View>

      {/* Ruban */}
      {!ribbonCollapsed && viewMode !== 'lecture' && (
        <ScrollView horizontal style={styles.ribbon} contentContainerStyle={styles.ribbonContent} showsHorizontalScrollIndicator={false} testID="ribbon">
          {activeTab === 'home' && (
            <>
              <RibbonGroup title="Presse-papiers">
                <RibbonButton icon="content-cut" label="Couper" onPress={doCut} />
                <RibbonButton icon="content-copy" label="Copier" onPress={doCopy} />
                <RibbonButton icon="content-paste" label="Coller" onPress={doPaste} />
              </RibbonGroup>
              <RibbonGroup title="Police">
                <View style={styles.rTwoRows}>
                  <View style={styles.rRow}>
                    <Pressable accessibilityRole="button" style={styles.fontBtn} onPress={() => setShowFontMenu(!showFontMenu)} accessibilityLabel="Choisir la police">
                      <Text style={{ fontFamily: font, fontSize: 12, color: '#1e293b' }} numberOfLines={1}>{font}</Text>
                      <MaterialCommunityIcons name="chevron-down" size={12} color="#64748b" />
                    </Pressable>
                    <Pressable accessibilityRole="button" style={styles.fontBtn} onPress={() => setShowSizeMenu(!showSizeMenu)} accessibilityLabel="Choisir la taille">
                      <Text style={{ fontSize: 12, color: '#1e293b' }}>{fontSize}</Text>
                      <MaterialCommunityIcons name="chevron-down" size={12} color="#64748b" />
                    </Pressable>
                    <RibbonSmallBtn icon="format-bold" label="Gras" onPress={() => fmt('**')} />
                    <RibbonSmallBtn icon="format-italic" label="Italique" onPress={() => fmt('*')} />
                    <RibbonSmallBtn icon="format-underline" label="Souligné" onPress={() => fmt('__')} />
                    <RibbonSmallBtn icon="format-strikethrough" label="Barré" onPress={() => fmt('~~')} />
                  </View>
                  <View style={styles.rRow}>
                    <RibbonSmallBtn icon="format-subscript" label="Indice" onPress={() => fmt('~')} />
                    <RibbonSmallBtn icon="format-superscript" label="Exposant" onPress={() => fmt('^')} />
                    <RibbonSmallBtn icon="format-color-text" label="Couleur de police" color="#2b579a" onPress={() => setShowColorMenu(!showColorMenu)} />
                    <RibbonSmallBtn icon="format-color-highlight" label="Surlignage" color="#b45309" onPress={() => setShowHighlightMenu(!showHighlightMenu)} />
                    <RibbonSmallBtn icon="marker" label="Appliquer le surlignage" color="#b45309" onPress={() => fmt('==')} />
                    <RibbonSmallBtn
                      icon="format-clear"
                      label="Effacer la mise en forme"
                      onPress={() => {
                        const s0 = Math.min(sel.start, sel.end);
                        const e0 = Math.max(sel.start, sel.end);
                        if (s0 === e0) {
                          applyText(stripMarkers(text), sel);
                          showBanner('Mise en forme effacée (document)');
                        } else {
                          const next = text.slice(0, s0) + stripMarkers(text.slice(s0, e0)) + text.slice(e0);
                          applyText(next, sel);
                          showBanner('Mise en forme effacée (sélection)');
                        }
                      }}
                    />
                  </View>
                </View>
              </RibbonGroup>
              <RibbonGroup title="Paragraphe">
                <View style={styles.rTwoRows}>
                  <View style={styles.rRow}>
                    <RibbonSmallBtn icon="format-align-left" label="Aligner à gauche" color={align === 'left' ? '#2b579a' : '#444'} onPress={() => setAlign('left')} />
                    <RibbonSmallBtn icon="format-align-center" label="Centrer" color={align === 'center' ? '#2b579a' : '#444'} onPress={() => setAlign('center')} />
                    <RibbonSmallBtn icon="format-align-right" label="Aligner à droite" color={align === 'right' ? '#2b579a' : '#444'} onPress={() => setAlign('right')} />
                    <RibbonSmallBtn icon="format-align-justify" label="Justifier" color={align === 'justify' ? '#2b579a' : '#444'} onPress={() => setAlign('justify')} />
                  </View>
                  <View style={styles.rRow}>
                    <RibbonSmallBtn icon="format-list-bulleted" label="Puces" onPress={() => { const r = toggleList(text, sel, 'bullet'); applyText(r.text, r.sel); }} />
                    <RibbonSmallBtn icon="format-list-numbered" label="Numérotation" onPress={() => { const r = toggleList(text, sel, 'number'); applyText(r.text, r.sel); }} />
                    <RibbonSmallBtn icon="format-line-spacing" label="Interligne" onPress={cycleSpacing} />
                    <RibbonSmallBtn icon="format-indent-decrease" label="Réduire le retrait" onPress={() => { const r = indentLines(text, sel, -1); applyText(r.text, r.sel); }} />
                    <RibbonSmallBtn icon="format-indent-increase" label="Augmenter le retrait" onPress={() => { const r = indentLines(text, sel, 1); applyText(r.text, r.sel); }} />
                  </View>
                </View>
              </RibbonGroup>
              <RibbonGroup title="Styles">
                <RibbonButton icon="format-header-1" label="Titre 1" onPress={() => applyStyleLine('h1')} />
                <RibbonButton icon="format-header-2" label="Titre 2" onPress={() => applyStyleLine('h2')} />
                <RibbonButton icon="format-header-3" label="Titre 3" onPress={() => applyStyleLine('h3')} />
                <RibbonButton icon="format-paragraph" label="Normal" onPress={() => applyStyleLine('normal')} />
              </RibbonGroup>
              <RibbonGroup title="Modification">
                <RibbonButton icon="magnify" label="Rechercher" onPress={() => { setSearchMode('find'); setSearchOpen(true); }} />
                <RibbonButton icon="find-replace" label="Remplacer" onPress={() => { setSearchMode('replace'); setSearchOpen(true); }} />
                <RibbonButton icon="select-all" label="Sélectionner" onPress={() => { setSel({ start: 0, end: text.length }); showBanner('Tout le document sélectionné'); }} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'insert' && (
            <>
              <RibbonGroup title="Pages">
                <RibbonButton icon="format-page-break" label="Saut de page" onPress={() => { insertSnippet(`\n${PAGEBREAK}\n`); showBanner('Saut de page inséré'); }} />
                <RibbonButton icon="file-document-outline" label="Page vierge" onPress={() => { insertSnippet(`\n${PAGEBREAK}\n\n`); showBanner('Page vierge insérée'); }} />
                <RibbonButton icon="book-open-page-variant" label="Couverture" onPress={() => insertSnippet(`\n# ${baseName}\n## Page de couverture\n${new Date().toLocaleDateString('fr-FR')}\n\n${PAGEBREAK}\n`)} />
              </RibbonGroup>
              <RibbonGroup title="Tableaux">
                <RibbonButton icon="table" label="Tableau" onPress={() => setActiveModal('table')} />
                <RibbonButton icon="table-large" label="Tableau rapide" onPress={() => insertTable(4, 3)} />
              </RibbonGroup>
              {tblCtx.inTable && (
                <RibbonGroup title="Lignes et colonnes">
                  <RibbonSmallBtn icon="table-row-plus-before" label="Ligne au-dessus" onPress={() => applyTableOp((t, s) => tableInsertRow(t, s, 'above'), 'Ligne insérée')} />
                  <RibbonSmallBtn icon="table-row-plus-after" label="Ligne en-dessous" onPress={() => applyTableOp((t, s) => tableInsertRow(t, s, 'below'), 'Ligne insérée')} />
                  <RibbonSmallBtn icon="table-row-remove" label="Supprimer la ligne" onPress={() => applyTableOp(tableDeleteRow, 'Ligne supprimée')} />
                  <RibbonSmallBtn icon="table-column-plus-before" label="Colonne à gauche" onPress={() => applyTableOp((t, s) => tableInsertCol(t, s, 'left'), 'Colonne insérée')} />
                  <RibbonSmallBtn icon="table-column-plus-after" label="Colonne à droite" onPress={() => applyTableOp((t, s) => tableInsertCol(t, s, 'right'), 'Colonne insérée')} />
                  <RibbonSmallBtn icon="table-column-remove" label="Supprimer la colonne" onPress={() => applyTableOp(tableDeleteCol, 'Colonne supprimée')} />
                  <RibbonSmallBtn icon="table-remove" label="Supprimer le tableau" color="#b91c1c" onPress={() => applyTableOp(tableDeleteBlock, 'Tableau supprimé')} />
                  <RibbonSmallBtn icon="sort-ascending" label="Trier A-Z" onPress={() => applyTableOp((t, s) => tableSort(t, s, 1), 'Tableau trié (A→Z)', 'Rien à trier')} />
                  <RibbonSmallBtn icon="sort-descending" label="Trier Z-A" onPress={() => applyTableOp((t, s) => tableSort(t, s, -1), 'Tableau trié (Z→A)', 'Rien à trier')} />
                </RibbonGroup>
              )}
              <RibbonGroup title="Illustrations">
                <RibbonButton icon="image" label="Image" onPress={pickImage} />
                <RibbonButton icon="shape-outline" label="Formes" onPress={() => setDrawOpen(true)} />
                <RibbonButton icon="star-outline" label="Icônes" onPress={() => setActiveModal('symbols')} />
                <RibbonButton icon="chart-bar" label="Graphique" onPress={() => setActiveModal('chart')} />
              </RibbonGroup>
              <RibbonGroup title="Liens">
                <RibbonButton icon="link" label="Lien" onPress={openLinkModal} />
              </RibbonGroup>
              <RibbonGroup title="En-tête et pied de page">
                <RibbonButton icon="page-layout-header" label="En-tête" color={header.on ? '#2b579a' : '#444'} onPress={() => { setHdrText(header.text); setActiveModal('header'); }} />
                <RibbonButton icon="page-layout-footer" label="Pied de page" color={footer.on ? '#2b579a' : '#444'} onPress={() => { setFtrText(footer.text); setActiveModal('footer'); }} />
                <RibbonButton icon="numeric" label="N° de page" color={pageNumbers ? '#2b579a' : '#444'} onPress={() => { setPageNumbers((v) => !v); showBanner(pageNumbers ? 'Numérotation désactivée' : 'Numérotation activée'); }} />
              </RibbonGroup>
              <RibbonGroup title="Texte">
                <RibbonButton icon="text-box" label="Zone de texte" onPress={() => insertSnippet('\n>>> Zone de texte : écrivez ici\n')} />
                <RibbonButton icon="calendar" label="Date et heure" onPress={() => insertSnippet(new Date().toLocaleString('fr-FR'))} />
                <RibbonButton icon="comment-quote" label="Citation" onPress={() => { const r = toggleLinePrefix(text, sel, '> '); applyText(r.text, r.sel); }} />
                <RibbonButton icon="code-braces" label="Code" onPress={() => fmt('`')} />
              </RibbonGroup>
              <RibbonGroup title="Symboles">
                <RibbonButton icon="omega" label="Symboles" onPress={() => setActiveModal('symbols')} />
                <RibbonButton icon="sigma" label="Équation" onPress={() => setActiveModal('equation')} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'draw' && (
            <>
              <RibbonGroup title="Outils de dessin">
                <RibbonButton icon="pencil" label="Dessiner" onPress={() => setDrawOpen(true)} />
                <RibbonButton icon="shape-outline" label="Formes" onPress={() => setDrawOpen(true)} />
                <RibbonButton icon="marker" label="Surligneur" onPress={() => setDrawOpen(true)} />
              </RibbonGroup>
              <RibbonGroup title="Mes dessins">
                <RibbonButton icon="drawing" label={`Voir (${drawings.length})`} onPress={() => setActiveModal('drawings')} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'design' && (
            <>
              <RibbonGroup title="Thèmes">
                <RibbonButton icon="palette" label="Thèmes" onPress={() => setActiveModal('theme')} />
                <RibbonButton icon="format-color-text" label="Couleurs" onPress={() => setActiveModal('colors')} />
                <RibbonButton icon="format-font" label="Polices" onPress={() => setActiveModal('fonts')} />
                <RibbonButton icon="creation" label={`Effets (${effect === 'none' ? 'Aucun' : effect === 'ombre' ? 'Ombre' : 'Lueur'})`} onPress={cycleEffect} />
              </RibbonGroup>
              <RibbonGroup title="Arrière-plan de page">
                <RibbonButton icon="water" label="Filigrane" color={watermark.on ? '#2b579a' : '#444'} onPress={() => { setWmText(watermark.text); setActiveModal('watermark'); }} />
                <RibbonButton icon="palette-swatch" label="Couleur de page" onPress={() => setActiveModal('pagecolor')} />
                <RibbonButton icon="border-all" label="Bordures" onPress={() => setActiveModal('pageborder')} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'layout' && (
            <>
              <RibbonGroup title="Mise en page">
                <RibbonButton icon="page-layout-body" label="Marges" onPress={cycleMargins} />
                <RibbonButton icon="page-layout-sidebar-left" label={orientation === 'portrait' ? 'Portrait' : 'Paysage'} onPress={() => { setOrientation((o) => (o === 'portrait' ? 'paysage' : 'portrait')); showBanner('Orientation modifiée'); }} />
                <RibbonButton icon="file-outline" label={paper} onPress={cyclePaper} />
                <RibbonButton icon="view-column" label={columns === 1 ? '1 colonne' : '2 colonnes'} onPress={() => { setColumns((c) => (c === 1 ? 2 : 1)); showBanner('Colonnes : aperçu/impression'); }} />
              </RibbonGroup>
              <RibbonGroup title="Sauts">
                <RibbonButton icon="format-page-break" label="Saut de page" onPress={() => { insertSnippet(`\n${PAGEBREAK}\n`); }} />
                <RibbonButton icon="arrow-split-horizontal" label="Saut de section" onPress={() => { insertSnippet(`\n${SECTIONBREAK}\n`); showBanner('Saut de section inséré'); }} />
              </RibbonGroup>
              <RibbonGroup title="Paragraphe">
                <RibbonButton icon="format-indent-decrease" label="Retrait −" onPress={() => { const r = indentLines(text, sel, -1); applyText(r.text, r.sel); }} />
                <RibbonButton icon="format-indent-increase" label="Retrait +" onPress={() => { const r = indentLines(text, sel, 1); applyText(r.text, r.sel); }} />
                <RibbonButton icon="format-line-spacing" label="Espacement" onPress={cycleParaGap} />
                <RibbonButton icon="format-list-numbered" label="N° de ligne" color={lineNumbers ? '#2b579a' : '#444'} onPress={() => { setLineNumbers((v) => !v); showBanner('Numéros de ligne : aperçu'); }} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'references' && (
            <>
              <RibbonGroup title="Tables">
                <RibbonButton icon="table-of-contents" label="Table des matières" onPress={() => setActiveModal('toc')} />
              </RibbonGroup>
              <RibbonGroup title="Notes">
                <RibbonButton icon="numeric" label="Note de bas de page" onPress={() => { setFootnoteText(''); setActiveModal('footnote'); }} />
              </RibbonGroup>
              <RibbonGroup title="Citations">
                <RibbonButton icon="comment-quote" label="Insérer citation" onPress={() => setActiveModal('sources')} />
                <RibbonButton icon="book-open" label="Bibliographie" onPress={() => {
                  if (sources.length === 0) { setActiveModal('sources'); showBanner('Ajoutez d’abord une source'); return; }
                  insertSnippet(`\n## Bibliographie\n${sources.map((s) => `- ${s.auteur} (${s.annee}). ${s.titre}`.trim()).join('\n')}\n`);
                }} />
              </RibbonGroup>
              <RibbonGroup title="Légendes">
                <RibbonButton icon="tag-text" label="Légende" onPress={insertCaption} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'mailings' && (
            <>
              <RibbonGroup title="Créer">
                <RibbonButton icon="email" label="Enveloppe" onPress={() => insertSnippet('\n>>> ENVELOPPE\n>>> De : {{NOM}}\n>>> {{ADRESSE}}\n')} />
                <RibbonButton icon="label" label="Étiquettes" onPress={() => insertSnippet('\n>>> ÉTIQUETTE : {{NOM}} — {{ADRESSE}}\n')} />
              </RibbonGroup>
              <RibbonGroup title="Fusion">
                <RibbonButton icon="account-multiple" label={`Destinataires (${recipients.length})`} onPress={() => setActiveModal('recipients')} />
                <RibbonButton icon="account" label="Champ" onPress={() => setActiveModal('fields')} />
                <RibbonButton icon="eye" label="Aperçu" onPress={() => { setMergeIdx(0); setActiveModal('mergeview'); }} />
                <RibbonButton icon="check-circle" label="Terminer" onPress={finishMerge} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'review' && (
            <>
              <RibbonGroup title="Vérification">
                <RibbonButton icon="spellcheck" label="Orthographe" onPress={runProof} />
                <RibbonButton icon="translate" label={language === 'fr' ? 'Français' : 'English'} onPress={() => { setLanguage((l) => (l === 'fr' ? 'en' : 'fr')); showBanner('Langue de vérification modifiée'); }} />
                <RibbonButton icon="counter" label="Statistiques" onPress={() => setActiveModal('stats')} />
              </RibbonGroup>
              <RibbonGroup title="Suivi">
                <RibbonButton icon="history" label="Suivi" color={tracking ? '#2b579a' : '#444'} onPress={() => { setTracking((v) => !v); showBanner(tracking ? 'Suivi désactivé' : 'Suivi activé : versions auto'); }} />
                <RibbonButton icon="check-circle" label="Accepter" onPress={() => { showBanner('Version actuelle conservée'); }} />
                <RibbonButton icon="undo" label="Refuser" onPress={() => {
                  if (versions.length === 0) { showBanner('Aucune version à restaurer'); return; }
                  applyText(versions[0].text, { start: 0, end: 0 });
                  showBanner('Version précédente restaurée');
                }} />
                <RibbonButton icon="folder-clock" label={`Versions (${versions.length})`} onPress={() => setActiveModal('versions')} />
              </RibbonGroup>
              <RibbonGroup title="Commentaires">
                <RibbonButton icon="comment-text" label={`Commentaires (${comments.length})`} onPress={() => { setCommentText(''); setActiveModal('comments'); }} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'view' && (
            <>
              <RibbonGroup title="Affichage">
                <RibbonButton icon="view-dashboard" label="Modes" onPress={() => setActiveModal('viewmodes')} />
                <RibbonButton icon="navigation" label="Navigation" color={showNav ? '#2b579a' : '#444'} onPress={() => setShowNav((v) => !v)} />
                <RibbonButton icon="ruler" label="Règle" color={showRuler ? '#2b579a' : '#444'} onPress={() => setShowRuler((v) => !v)} />
                <RibbonButton icon="grid" label="Grille" color={showGrid ? '#2b579a' : '#444'} onPress={() => setShowGrid((v) => !v)} />
                <RibbonButton icon="eye" label="Aperçu" color={showPreview ? '#2b579a' : '#444'} onPress={() => setShowPreview((v) => !v)} />
              </RibbonGroup>
              <RibbonGroup title="Zoom">
                <RibbonSmallBtn icon="magnify-minus" label="Zoom arrière" onPress={() => setZoom((z) => Math.max(50, z - 10))} />
                <Text style={styles.zoomLabel}>{zoom}%</Text>
                <RibbonSmallBtn icon="magnify-plus" label="Zoom avant" onPress={() => setZoom((z) => Math.min(200, z + 10))} />
                <RibbonButton icon="aspect-ratio" label="100%" onPress={() => setZoom(100)} />
              </RibbonGroup>
            </>
          )}

          {activeTab === 'help' && (
            <RibbonGroup title="Aide">
              <RibbonButton icon="help-circle" label="Aide" onPress={() => setActiveModal('help')} />
              <RibbonButton icon="keyboard" label="Raccourcis" onPress={() => setActiveModal('shortcuts')} />
              <RibbonButton icon="information" label="À propos" onPress={() => setActiveModal('about')} />
            </RibbonGroup>
          )}
        </ScrollView>
      )}

      {/* Menus police / taille / couleurs */}
      {showFontMenu && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 220 }}>
            {FONTS.map((f) => (
              <Pressable accessibilityRole="button" key={f} style={styles.dropdownItem} onPress={() => { setFont(f); setShowFontMenu(false); showBanner(`Police : ${f}`); }}>
                <Text style={{ fontFamily: f, fontSize: 13, color: '#1e293b' }}>{f}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {showSizeMenu && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 220 }}>
            {SIZES.map((s) => (
              <Pressable accessibilityRole="button" key={s} style={styles.dropdownItem} onPress={() => { setFontSize(s); setShowSizeMenu(false); showBanner(`Taille : ${s}`); }}>
                <Text style={{ fontSize: 13, color: '#1e293b' }}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      {showColorMenu && (
        <View style={[styles.dropdown, { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 230 }]}>
          {TEXT_COLORS.map((c) => (
            <Pressable accessibilityRole="button" key={c} onPress={() => { setTextColor(c); setShowColorMenu(false); }} style={[styles.colorSwatch, { backgroundColor: c }]} accessibilityLabel={`Couleur ${c}`} />
          ))}
        </View>
      )}
      {showHighlightMenu && (
        <View style={[styles.dropdown, { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 230 }]}>
          {HL_COLORS.map((c) => (
            <Pressable accessibilityRole="button" key={c} onPress={() => { setHighlightColor(c); setShowHighlightMenu(false); showBanner('Couleur de surlignage choisie : utilisez le marqueur'); }} style={[styles.colorSwatch, { backgroundColor: c }]} accessibilityLabel={`Surlignage ${c}`} />
          ))}
        </View>
      )}

      {/* Panneau recherche / remplacement */}
      {searchOpen && (
        <View style={styles.searchPanel}>
          <View style={styles.searchRow}>
            <Pressable accessibilityRole="button" style={[styles.searchTab, searchMode === 'find' && styles.searchTabActive]} onPress={() => setSearchMode('find')}>
              <Text style={[styles.searchTabText, searchMode === 'find' && styles.searchTabTextActive]}>Rechercher</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={[styles.searchTab, searchMode === 'replace' && styles.searchTabActive]} onPress={() => setSearchMode('replace')}>
              <Text style={[styles.searchTabText, searchMode === 'replace' && styles.searchTabTextActive]}>Remplacer</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable accessibilityRole="button" onPress={() => setSearchOpen(false)} accessibilityLabel="Fermer la recherche">
              <MaterialCommunityIcons name="close" size={16} color="#64748b" />
            </Pressable>
          </View>
          <View style={styles.searchRow}>
            <TextInput
              testID="search-input"
              style={styles.searchInput}
              placeholder="Rechercher…"
              value={query}
              onChangeText={(q) => { setQuery(q); setMatchIdx(0); }}
              onSubmitEditing={() => jumpToMatch(0)}
            />
            <Pressable accessibilityRole="button" style={styles.searchBtn} onPress={() => jumpToMatch(matchIdx - 1)} accessibilityLabel="Occurrence précédente">
              <MaterialCommunityIcons name="chevron-up" size={18} color="#334155" />
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.searchBtn} onPress={() => jumpToMatch(matchIdx + (computeMatches(query).length ? 1 : 0))} accessibilityLabel="Occurrence suivante">
              <MaterialCommunityIcons name="chevron-down" size={18} color="#334155" />
            </Pressable>
            <Text style={styles.searchCount}>
              {query ? `${computeMatches(query).length} trouvée(s)` : ''}
            </Text>
          </View>
          {searchMode === 'replace' && (
            <View style={styles.searchRow}>
              <TextInput
                testID="replace-input"
                style={styles.searchInput}
                placeholder="Remplacer par…"
                value={replaceWith}
                onChangeText={setReplaceWith}
              />
              <Pressable accessibilityRole="button" style={styles.searchAction} onPress={replaceOne} accessibilityLabel="Remplacer l'occurrence">
                <Text style={styles.searchActionText}>Remplacer</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.searchAction} onPress={replaceAll} accessibilityLabel="Tout remplacer">
                <Text style={styles.searchActionText}>Tout</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Règle */}
      {showRuler && viewMode !== 'plan' && (
        <View style={styles.ruler} testID="ruler">
          {Array.from({ length: RULER_CM }).map((_, cm) => (
            <View key={cm} style={styles.rulerCm}>
              <Text style={styles.rulerNum}>{cm + 1}</Text>
              <View style={styles.rulerTicks}>
                {Array.from({ length: 10 }).map((_, mm) => (
                  <View key={mm} style={[styles.rulerTick, mm === 0 && styles.rulerTickBig]} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Zone d'édition */}
      {viewMode === 'plan' ? (
        <ScrollView style={styles.planView}>
          <Text style={styles.planTitle}>Plan du document ({headings.length} titre{headings.length > 1 ? 's' : ''})</Text>
          {headings.length === 0 && (
            <Text style={styles.planEmpty}>Aucun titre. Appliquez les styles Titre 1, Titre 2 ou Titre 3 (onglet Accueil) pour structurer le document.</Text>
          )}
          {headings.map((h, i) => (
            <Pressable accessibilityRole="button"
              key={i}
              style={[styles.planItem, { marginLeft: (h.level - 1) * 18 }]}
              onPress={() => {
                setSel({ start: h.index, end: h.index + h.text.length + h.level + 1 });
                setViewMode('page');
                showBanner('Titre localisé dans le document');
              }}
            >
              <Text style={[styles.planItemText, h.level === 1 && { fontWeight: 'bold' }]}>
                {h.text}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.editorArea}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', padding: viewMode === 'web' ? 0 : isLandscape ? 8 : 12 }}
          >
            <View
              testID="pageSheet"
              onLayout={(e) => {
                const w = Math.round(e.nativeEvent.layout.width);
                setPageW((p) => (Math.abs(w - p) > 1 ? w : p));
              }}
              style={[
                styles.page,
                viewMode === 'web' && styles.pageWeb,
                viewMode === 'brouillon' && styles.pageDraft,
                {
                  width: viewMode === 'web' ? '100%' : isLandscape ? '85%' : '100%',
                  maxWidth: viewMode === 'web' ? undefined : orientation === 'paysage' ? Math.max(paperMax, 1000) : paperMax,
                  minHeight: viewMode === 'page' && paperMinH > 0 ? paperMinH : '85%',
                  flex: 1,
                  padding: marginPad,
                  backgroundColor: pageColor,
                },
                pageBorderStyle,
              ]}
            >
              {watermark.on && (
                <View style={styles.watermarkWrap} pointerEvents="none">
                  <Text style={styles.watermark}>{watermark.text || 'BROUILLON'}</Text>
                </View>
              )}
              {showPreview ? (
                <View style={{ flex: 1, minHeight: 480 }}>
                  <DocPreview
                    text={text}
                    font={font}
                    fontSize={effFontSize}
                    color={textColor}
                    align={align}
                    lineHeight={lineSpacing}
                    paraGap={paraGap}
                    header={header.on ? header.text : undefined}
                    footer={footer.on ? footer.text : undefined}
                    pageNumbers={pageNumbers}
                    columns={columns}
                    lineNumbers={lineNumbers}
                    images={images}
                    drawings={drawings}
                    charts={charts}
                    pageColor={pageColor}
                    hlColor={highlightColor}
                    effect={effect}
                    pages={stats.pages}
                  />
                </View>
              ) : (
                <View style={styles.editStack}>
                  {/* Sous-couche WYSIWYG : mêmes caractères, mise en forme visible */}
                  <Text
                    style={[
                      styles.underlay,
                      {
                        fontFamily: font as never,
                        fontSize: effFontSize,
                        color: textColor,
                        lineHeight: Math.round(effFontSize * lineSpacing),
                        textAlign: align,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    {text.split('\n').map((line, li, arr) => {
                      const cls = classifyUnderlayLine(line);
                      const nextIsSep =
                        li + 1 < arr.length && classifyUnderlayLine(arr[li + 1]) === 'tablesep';
                      const segs = parseInlineKeepMarkers(line);
                      return (
                        <Text
                          key={li}
                          style={[
                            cls === 'h1' && { fontWeight: 'bold' as const, color: '#1e3a8a', fontSize: effFontSize + 8 },
                            cls === 'h2' && { fontWeight: 'bold' as const, color: '#1e3a8a', fontSize: effFontSize + 5 },
                            cls === 'h3' && { fontWeight: 'bold' as const, color: '#1e3a8a', fontSize: effFontSize + 2 },
                            cls === 'quote' && { color: '#475569', fontStyle: 'italic' as const },
                            cls === 'textbox' && { backgroundColor: '#f8fafc' },
                            cls === 'muted' && { color: '#94a3b8', fontStyle: 'italic' as const },
                            cls === 'table' && { backgroundColor: '#f1f5f9' },
                            cls === 'table' && nextIsSep && { fontWeight: 'bold' as const },
                            cls === 'tablesep' && { color: '#cbd5e1' },
                          ]}
                        >
                          {renderUnderlaySegs(segs, cls, effFontSize, highlightColor)}
                          {li < arr.length - 1 ? '\n' : ''}
                        </Text>
                      );
                    })}
                  </Text>
                  <TextInput
                    testID="editor"
                    value={text}
                    onChangeText={onEditorChange}
                    onKeyPress={(e: any) => {
                      if (Platform.OS !== 'web') return;
                      if (e?.nativeEvent?.isComposing) return;
                      handleKey(e);
                    }}
                    onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
                    onContentSizeChange={(e) => {
                      const h = e.nativeEvent.contentSize.height;
                      setInputHeight((prev) => (Math.abs(h - prev) > 2 ? Math.max(480, h) : prev));
                    }}
                    selection={sel}
                    selectionColor="#2b579a"
                    multiline
                    scrollEnabled={false}
                    placeholder="Commencez à rédiger votre document..."
                    placeholderTextColor="#94a3b8"
                    autoCorrect={autoCorrect}
                    style={[
                      styles.textArea,
                      {
                        fontFamily: font as never,
                        fontSize: effFontSize,
                        color: 'transparent',
                        backgroundColor: 'transparent',
                        lineHeight: Math.round(effFontSize * lineSpacing),
                        textAlign: align,
                        height: inputHeight,
                        padding: 0,
                        margin: 0,
                      },
                    ]}
                    textAlignVertical="top"
                  />
                </View>
              )}
              {showGrid && !showPreview && (
                <View style={styles.gridOverlay} pointerEvents="none">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <View key={i} style={styles.gridLine} />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Volet de navigation */}
          {showNav && (
            <View style={styles.navPane}>
              <View style={styles.navHeader}>
                <Text style={styles.navTitle}>Navigation</Text>
                <Pressable accessibilityRole="button" onPress={() => setShowNav(false)} accessibilityLabel="Fermer la navigation">
                  <MaterialCommunityIcons name="close" size={14} color="#64748b" />
                </Pressable>
              </View>
              <ScrollView>
                {headings.length === 0 && <Text style={styles.navEmpty}>Aucun titre dans le document.</Text>}
                {headings.map((h, i) => (
                  <Pressable accessibilityRole="button"
                    key={i}
                    style={[styles.navItem, { paddingLeft: 8 + (h.level - 1) * 12 }]}
                    onPress={() => setSel({ start: h.index, end: h.index + h.text.length + h.level + 1 })}
                  >
                    <Text style={styles.navItemText} numberOfLines={1}>{h.text}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Barre d'état */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Page 1 sur {stats.pages} · {stats.words} mots · {stats.chars} caractères</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.statusText}>{language === 'fr' ? 'Français' : 'English'} · {orientation === 'portrait' ? 'Portrait' : 'Paysage'} · {align === 'left' ? 'Gauche' : align === 'center' ? 'Centré' : align === 'right' ? 'Droite' : 'Justifié'}</Text>
          <View style={{ width: 8 }} />
          <Pressable accessibilityRole="button" onPress={() => setZoom((z) => Math.max(50, z - 10))} accessibilityLabel="Zoom arrière">
            <MaterialCommunityIcons name="magnify-minus" size={12} color="#64748b" />
          </Pressable>
          <Text style={[styles.statusText, { marginHorizontal: 4 }]}>{zoom}%</Text>
          <Pressable accessibilityRole="button" onPress={() => setZoom((z) => Math.min(200, z + 10))} accessibilityLabel="Zoom avant">
            <MaterialCommunityIcons name="magnify-plus" size={12} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Bandeau d'information */}
      {!!banner && (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>{banner}</Text>
        </View>
      )}

      <DrawModal
        visible={drawOpen}
        onClose={() => setDrawOpen(false)}
        onSave={(d) => {
          const n = drawings.length + 1;
          setDrawings((ds) => [...ds, d]);
          const r = insertAtCursor(textRef.current, selRef.current, `\n[dessin:${n}]\n`);
          applyRef.current(r.text, r.sel);
          setDrawOpen(false);
          showBanner(`Dessin ${n} inséré (visible dans l’Aperçu)`);
        }}
      />

      {/* ═══ MODALES ═══ */}
      {activeModal === 'stats' && (
        <Sheet title="Statistiques du document" onClose={() => setActiveModal(null)}>
          {[
            ['Mots', String(stats.words)],
            ['Caractères (espaces compris)', String(stats.chars)],
            ['Caractères (sans espaces)', String(stats.charsNoSpaces)],
            ['Paragraphes', String(stats.paragraphs)],
            ['Phrases', String(stats.sentences)],
            ['Pages estimées', String(stats.pages)],
            ['Temps de lecture', stats.readingTime],
            ['Titres', String(headings.length)],
            ['Images', String(images.length)],
            ['Dessins', String(drawings.length)],
            ['Commentaires', String(comments.length)],
          ].map(([k, v]) => (
            <View key={k} style={styles.statRow}>
              <Text style={styles.statKey}>{k}</Text>
              <Text style={styles.statVal}>{v}</Text>
            </View>
          ))}
        </Sheet>
      )}

      {activeModal === 'proof' && (
        <Sheet title={`Vérification (${language === 'fr' ? 'français' : 'English'})`} onClose={() => setActiveModal(null)} wide>
          {!proofDone || proofIssues.length === 0 ? (
            <Text style={styles.modalText}>Aucun problème détecté. Astuce : la vérification repère les doubles espaces, mots répétés, majuscules manquantes, confusions a/à et sa/ça, espaces après ponctuation et fautes fréquentes.</Text>
          ) : (
            <>
              <Text style={styles.modalText}>{proofIssues.length} remarque(s){proofSelOnly ? ' dans la sélection' : ' dans le document'}. Touchez une remarque pour la localiser :</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Tout corriger" style={styles.primaryBtn} onPress={fixAllProof}>
                <Text style={styles.primaryBtnText}>Tout corriger</Text>
              </Pressable>
              {proofIssues.map((p, i) => (
                <Pressable accessibilityRole="button"
                  key={i}
                  style={styles.actionRow}
                  onPress={() => {
                    setSel({ start: p.index, end: p.index + p.length });
                    setActiveModal(null);
                  }}
                >
                  <Text style={styles.actionLabel}>{p.message}</Text>
                  <Text style={styles.actionDesc}>{p.excerpt}</Text>
                </Pressable>
              ))}
            </>
          )}
        </Sheet>
      )}

      {activeModal === 'symbols' && (
        <Sheet title="Symboles — touchez pour insérer" onClose={() => setActiveModal(null)} wide>
          <View style={styles.symbolGrid}>
            {SYMBOLS.map((s, i) => (
              <Pressable accessibilityRole="button" key={i} style={styles.symbolCell} onPress={() => { insertSnippet(s); }}>
                <Text style={styles.symbolChar}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </Sheet>
      )}

      {activeModal === 'equation' && (
        <Sheet title="Équations et formules" onClose={() => setActiveModal(null)}>
          {EQUATIONS.map((e, i) => (
            <ActionRow key={i} label={e} onPress={() => { insertSnippet(e); }} />
          ))}
        </Sheet>
      )}

      {activeModal === 'table' && (
        <Sheet title="Insérer un tableau" onClose={() => setActiveModal(null)}>
          <Text style={styles.modalText}>Colonnes : {tblCols}</Text>
          <View style={styles.stepperRow}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Pressable accessibilityRole="button" key={n} style={[styles.stepperBtn, tblCols === n && styles.stepperBtnActive]} onPress={() => setTblCols(n)}>
                <Text style={[styles.stepperText, tblCols === n && { color: '#fff' }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.modalText}>Lignes : {tblRows}</Text>
          <View style={styles.stepperRow}>
            {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
              <Pressable accessibilityRole="button" key={n} style={[styles.stepperBtn, tblRows === n && styles.stepperBtnActive]} onPress={() => setTblRows(n)}>
                <Text style={[styles.stepperText, tblRows === n && { color: '#fff' }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={() => { insertTable(tblRows, tblCols); setActiveModal(null); }}>
            <Text style={styles.primaryBtnText}>Insérer le tableau {tblCols}×{tblRows}</Text>
          </Pressable>
        </Sheet>
      )}

      {activeModal === 'link' && (
        <Sheet title="Insérer un lien" onClose={() => setActiveModal(null)}>
          <Text style={styles.fieldLabel}>Texte affiché</Text>
          <TextInput style={styles.fieldInput} value={linkText} onChangeText={setLinkText} placeholder="Texte du lien" />
          <Text style={styles.fieldLabel}>Adresse (URL)</Text>
          <TextInput style={styles.fieldInput} value={linkUrl} onChangeText={setLinkUrl} placeholder="https://…" autoCapitalize="none" />
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={confirmLink}>
            <Text style={styles.primaryBtnText}>Insérer</Text>
          </Pressable>
        </Sheet>
      )}

      {activeModal === 'chart' && (
        <Sheet title="Insérer un graphique" onClose={() => setActiveModal(null)}>
          <Text style={styles.fieldLabel}>Titre</Text>
          <TextInput style={styles.fieldInput} value={chartTitle} onChangeText={setChartTitle} />
          <Text style={styles.fieldLabel}>Valeurs (nombres séparés par des virgules)</Text>
          <TextInput style={styles.fieldInput} value={chartVals} onChangeText={setChartVals} keyboardType="numeric" />
          <Text style={styles.fieldLabel}>Étiquettes (séparées par des virgules)</Text>
          <TextInput style={styles.fieldInput} value={chartLabels} onChangeText={setChartLabels} />
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={saveChart}>
            <Text style={styles.primaryBtnText}>Insérer le graphique</Text>
          </Pressable>
        </Sheet>
      )}

      {activeModal === 'header' && (
        <Sheet title="En-tête de page" onClose={() => setActiveModal(null)}>
          <TextInput style={styles.fieldInput} value={hdrText} onChangeText={setHdrText} placeholder="Texte de l’en-tête" />
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={() => { setHeader({ text: hdrText, on: true }); setActiveModal(null); showBanner('En-tête activé (Aperçu/impression)'); }}>
            <Text style={styles.primaryBtnText}>Activer l’en-tête</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryBtn} onPress={() => { setHeader({ text: hdrText, on: false }); setActiveModal(null); }}>
            <Text style={styles.secondaryBtnText}>Désactiver</Text>
          </Pressable>
        </Sheet>
      )}

      {activeModal === 'footer' && (
        <Sheet title="Pied de page" onClose={() => setActiveModal(null)}>
          <TextInput style={styles.fieldInput} value={ftrText} onChangeText={setFtrText} placeholder="Texte du pied de page" />
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={() => { setFooter({ text: ftrText, on: true }); setActiveModal(null); showBanner('Pied de page activé (Aperçu/impression)'); }}>
            <Text style={styles.primaryBtnText}>Activer le pied de page</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryBtn} onPress={() => { setFooter({ text: ftrText, on: false }); setActiveModal(null); }}>
            <Text style={styles.secondaryBtnText}>Désactiver</Text>
          </Pressable>
        </Sheet>
      )}

      {activeModal === 'theme' && (
        <Sheet title="Thèmes du document" onClose={() => setActiveModal(null)}>
          {[
            { n: 'Normal', d: 'Calibri, noir sur blanc', v: { font: 'Calibri', color: '#000000', page: '#ffffff' } },
            { n: 'Élégant', d: 'Georgia, brun sur ivoire', v: { font: 'Georgia', color: '#3f2d20', page: '#fffbeb' } },
            { n: 'Moderne', d: 'Arial, bleu marine sur blanc', v: { font: 'Arial', color: '#1e3a8a', page: '#ffffff' } },
            { n: 'Machine à écrire', d: 'Courier New, gris sur blanc cassé', v: { font: 'Courier New', color: '#1f2937', page: '#f8fafc' } },
          ].map((t) => (
            <ActionRow key={t.n} label={t.n} desc={t.d} onPress={() => { setFont(t.v.font); setTextColor(t.v.color); setPageColor(t.v.page); setActiveModal(null); showBanner(`Thème « ${t.n} » appliqué`); }} />
          ))}
        </Sheet>
      )}

      {activeModal === 'colors' && (
        <Sheet title="Couleur du texte" onClose={() => setActiveModal(null)}>
          <View style={styles.swatchGrid}>
            {TEXT_COLORS.map((c) => (
              <Pressable accessibilityRole="button" key={c} onPress={() => { setTextColor(c); setActiveModal(null); }} style={[styles.colorSwatch, { backgroundColor: c, width: 34, height: 34 }]} />
            ))}
          </View>
        </Sheet>
      )}

      {activeModal === 'fonts' && (
        <Sheet title="Polices du document" onClose={() => setActiveModal(null)}>
          {FONTS.map((f) => (
            <ActionRow key={f} label={f} onPress={() => { setFont(f); setActiveModal(null); showBanner(`Police : ${f}`); }} />
          ))}
        </Sheet>
      )}

      {activeModal === 'pagecolor' && (
        <Sheet title="Couleur de page" onClose={() => setActiveModal(null)}>
          <View style={styles.swatchGrid}>
            {PAGE_COLORS.map((c) => (
              <Pressable accessibilityRole="button" key={c} onPress={() => { setPageColor(c); setActiveModal(null); }} style={[styles.colorSwatch, { backgroundColor: c, width: 40, height: 40, borderWidth: 2 }]} />
            ))}
          </View>
        </Sheet>
      )}

      {activeModal === 'pageborder' && (
        <Sheet title="Bordures de page" onClose={() => setActiveModal(null)}>
          {[
            ['none', 'Aucune'],
            ['simple', 'Simple'],
            ['double', 'Double'],
            ['epais', 'Épaisse'],
          ].map(([v, l]) => (
            <ActionRow key={v} label={`${pageBorder === v ? '● ' : ''}${l}`} onPress={() => { setPageBorder(v); setActiveModal(null); }} />
          ))}
        </Sheet>
      )}

      {activeModal === 'watermark' && (
        <Sheet title="Filigrane" onClose={() => setActiveModal(null)}>
          <TextInput style={styles.fieldInput} value={wmText} onChangeText={setWmText} placeholder="Texte du filigrane" />
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={() => { setWatermark({ text: wmText, on: true }); setActiveModal(null); showBanner('Filigrane activé'); }}>
            <Text style={styles.primaryBtnText}>Activer le filigrane</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryBtn} onPress={() => { setWatermark({ text: wmText, on: false }); setActiveModal(null); }}>
            <Text style={styles.secondaryBtnText}>Désactiver</Text>
          </Pressable>
        </Sheet>
      )}

      {activeModal === 'toc' && (
        <Sheet title="Table des matières" onClose={() => setActiveModal(null)} wide>
          {headings.length === 0 ? (
            <Text style={styles.modalText}>Aucun titre détecté. Utilisez les styles Titre 1, Titre 2, Titre 3 (onglet Accueil) puis revenez ici.</Text>
          ) : (
            <>
              {headings.map((h, i) => {
                const pg = Math.min(stats.pages, Math.floor((h.index / Math.max(1, text.length)) * stats.pages) + 1);
                return (
                  <View key={i} style={[styles.statRow, { paddingLeft: (h.level - 1) * 16 }]}>
                    <Text style={styles.statKey}>{h.text}</Text>
                    <Text style={styles.statVal}>{pg}</Text>
                  </View>
                );
              })}
              <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={insertTOC}>
                <Text style={styles.primaryBtnText}>Insérer au curseur</Text>
              </Pressable>
            </>
          )}
        </Sheet>
      )}

      {activeModal === 'footnote' && (
        <Sheet title="Note de bas de page" onClose={() => setActiveModal(null)}>
          <Text style={styles.modalText}>Note n° {footnoteN} — elle sera ajoutée en fin de document, avec un appel [^{footnoteN}] à la position du curseur.</Text>
          <TextInput style={[styles.fieldInput, { minHeight: 80 }]} multiline value={footnoteText} onChangeText={setFootnoteText} placeholder="Texte de la note…" />
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={insertFootnote}>
            <Text style={styles.primaryBtnText}>Insérer la note</Text>
          </Pressable>
        </Sheet>
      )}

      {activeModal === 'sources' && (
        <Sheet title="Citations et sources" onClose={() => setActiveModal(null)} wide>
          <Text style={styles.fieldLabel}>Nouvelle source</Text>
          <TextInput style={styles.fieldInput} value={srcAuteur} onChangeText={setSrcAuteur} placeholder="Auteur (ex. Dupont)" />
          <TextInput style={styles.fieldInput} value={srcAnnee} onChangeText={setSrcAnnee} placeholder="Année" keyboardType="numeric" />
          <TextInput style={styles.fieldInput} value={srcTitre} onChangeText={setSrcTitre} placeholder="Titre de l’ouvrage" />
          <Pressable accessibilityRole="button"
            style={styles.primaryBtn}
            onPress={() => {
              if (!srcAuteur.trim()) { showBanner('Indiquez au moins l’auteur'); return; }
              setSources((ss) => [...ss, { id: uid(), auteur: srcAuteur.trim(), annee: srcAnnee.trim(), titre: srcTitre.trim() }]);
              setSrcAuteur(''); setSrcTitre('');
              showBanner('Source ajoutée');
            }}
          >
            <Text style={styles.primaryBtnText}>Ajouter la source</Text>
          </Pressable>
          <Text style={styles.fieldLabel}>Sources ({sources.length}) — touchez « Citer » pour insérer (Auteur, année)</Text>
          {sources.map((s) => (
            <View key={s.id} style={styles.sourceRow}>
              <Text style={styles.statKey}>{s.auteur} ({s.annee}){s.titre ? `. ${s.titre}` : ''}</Text>
              <Pressable accessibilityRole="button"
                style={styles.miniBtn}
                onPress={() => { insertSnippet(`(${s.auteur}, ${s.annee})`); setActiveModal(null); showBanner('Citation insérée'); }}
              >
                <Text style={styles.miniBtnText}>Citer</Text>
              </Pressable>
            </View>
          ))}
        </Sheet>
      )}

      {activeModal === 'recipients' && (
        <Sheet title={`Destinataires (${recipients.length})`} onClose={() => setActiveModal(null)} wide>
          <TextInput style={styles.fieldInput} value={newRNom} onChangeText={setNewRNom} placeholder="Nom" />
          <TextInput style={styles.fieldInput} value={newREmail} onChangeText={setNewREmail} placeholder="E-mail" autoCapitalize="none" />
          <TextInput style={styles.fieldInput} value={newRAdr} onChangeText={setNewRAdr} placeholder="Adresse" />
          <Pressable accessibilityRole="button"
            style={styles.primaryBtn}
            onPress={() => {
              if (!newRNom.trim()) { showBanner('Indiquez au moins le nom'); return; }
              setRecipients((r) => [...r, { id: uid(), nom: newRNom.trim(), email: newREmail.trim(), adresse: newRAdr.trim() }]);
              setNewRNom(''); setNewREmail(''); setNewRAdr('');
            }}
          >
            <Text style={styles.primaryBtnText}>Ajouter</Text>
          </Pressable>
          {recipients.map((r) => (
            <View key={r.id} style={styles.sourceRow}>
              <Text style={styles.statKey}>{r.nom}{r.email ? ` — ${r.email}` : ''}{r.adresse ? ` — ${r.adresse}` : ''}</Text>
              <Pressable accessibilityRole="button" style={styles.miniBtnDanger} onPress={() => setRecipients((rs) => rs.filter((x) => x.id !== r.id))}>
                <Text style={styles.miniBtnText}>Retirer</Text>
              </Pressable>
            </View>
          ))}
        </Sheet>
      )}

      {activeModal === 'fields' && (
        <Sheet title="Insérer un champ de fusion" onClose={() => setActiveModal(null)}>
          <Text style={styles.modalText}>Les champs seront remplacés par les données de chaque destinataire.</Text>
          {['NOM', 'EMAIL', 'ADRESSE'].map((f) => (
            <ActionRow key={f} label={`{{${f}}}`} onPress={() => { insertSnippet(`{{${f}}}`); setActiveModal(null); }} />
          ))}
        </Sheet>
      )}

      {activeModal === 'mergeview' && (
        <Sheet title="Aperçu de la fusion" onClose={() => setActiveModal(null)} wide>
          {recipients.length === 0 ? (
            <Text style={styles.modalText}>Ajoutez des destinataires (Publipostage → Destinataires) puis insérez des champs {'{{NOM}}, {{EMAIL}}, {{ADRESSE}}'} dans le document.</Text>
          ) : (
            <>
              <View style={styles.searchRow}>
                <Pressable accessibilityRole="button" style={styles.searchBtn} onPress={() => setMergeIdx((i) => (i - 1 + recipients.length) % recipients.length)}>
                  <MaterialCommunityIcons name="chevron-left" size={18} color="#334155" />
                </Pressable>
                <Text style={styles.modalText}>Destinataire {mergeIdx + 1}/{recipients.length} : {recipients[mergeIdx].nom}</Text>
                <Pressable accessibilityRole="button" style={styles.searchBtn} onPress={() => setMergeIdx((i) => (i + 1) % recipients.length)}>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#334155" />
                </Pressable>
              </View>
              <View style={styles.mergeBox}>
                <Text style={styles.mergeText}>{stripMarkers(mergeFields(text, recipients[mergeIdx])).slice(0, 2000)}</Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={finishMerge}>
                <Text style={styles.primaryBtnText}>Terminer et fusionner ({recipients.length} documents)</Text>
              </Pressable>
            </>
          )}
        </Sheet>
      )}

      {activeModal === 'versions' && (
        <Sheet title={`Versions (${versions.length})`} onClose={() => setActiveModal(null)} wide>
          <Pressable accessibilityRole="button" style={styles.primaryBtn} onPress={() => snapVersion('Manuelle')}>
            <Text style={styles.primaryBtnText}>Créer une version maintenant</Text>
          </Pressable>
          <Text style={styles.modalText}>Le suivi des modifications enregistre automatiquement une version toutes les 25 modifications. Touchez une version pour la restaurer.</Text>
          {versions.map((v) => (
            <Pressable accessibilityRole="button"
              key={v.id}
              style={styles.actionRow}
              onPress={() => { applyText(v.text, { start: 0, end: 0 }); setActiveModal(null); showBanner('Version restaurée'); }}
            >
              <Text style={styles.actionLabel}>{v.label} — {new Date(v.at).toLocaleString('fr-FR')}</Text>
              <Text style={styles.actionDesc}>{v.text.slice(0, 90).replace(/\n/g, ' ')}…</Text>
            </Pressable>
          ))}
        </Sheet>
      )}

      {activeModal === 'comments' && (
        <Sheet title={`Commentaires (${comments.length})`} onClose={() => setActiveModal(null)} wide>
          <Text style={styles.modalText}>Extrait sélectionné : « {selText ? selText.slice(0, 80) : '(aucun — tout le document)'} »</Text>
          <TextInput style={[styles.fieldInput, { minHeight: 64 }]} multiline value={commentText} onChangeText={setCommentText} placeholder="Écrivez votre commentaire…" />
          <Pressable accessibilityRole="button"
            style={styles.primaryBtn}
            onPress={() => {
              if (!commentText.trim()) { showBanner('Écrivez le commentaire'); return; }
              setComments((cc) => [...cc, { id: uid(), quote: selText.slice(0, 120), text: commentText.trim(), at: Date.now() }]);
              setCommentText('');
              showBanner('Commentaire ajouté');
            }}
          >
            <Text style={styles.primaryBtnText}>Ajouter le commentaire</Text>
          </Pressable>
          {comments.map((cm) => (
            <View key={cm.id} style={styles.actionRow}>
              <Text style={styles.actionLabel}>{cm.text}</Text>
              <Text style={styles.actionDesc}>« {cm.quote || '(document)'} » — {new Date(cm.at).toLocaleString('fr-FR')}</Text>
              <Pressable accessibilityRole="button" style={[styles.miniBtnDanger, { alignSelf: 'flex-start', marginTop: 6 }]} onPress={() => setComments((cc) => cc.filter((x) => x.id !== cm.id))}>
                <Text style={styles.miniBtnText}>Supprimer</Text>
              </Pressable>
            </View>
          ))}
        </Sheet>
      )}

      {activeModal === 'drawings' && (
        <Sheet title={`Mes dessins (${drawings.length})`} onClose={() => setActiveModal(null)} wide>
          {drawings.length === 0 && <Text style={styles.modalText}>Aucun dessin. Utilisez Dessin → Dessiner.</Text>}
          {drawings.map((_, i) => (
            <View key={i} style={styles.sourceRow}>
              <Text style={styles.statKey}>Dessin {i + 1} — marqueur [dessin:{i + 1}]</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable accessibilityRole="button" style={styles.miniBtn} onPress={() => { insertSnippet(`\n[dessin:${i + 1}]\n`); setActiveModal(null); }}>
                  <Text style={styles.miniBtnText}>Insérer</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={styles.miniBtnDanger} onPress={() => {
                  setDrawings((ds) => ds.filter((__, k) => k !== i));
                  applyText(text.replace(`[dessin:${i + 1}]`, ''), sel);
                }}>
                  <Text style={styles.miniBtnText}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </Sheet>
      )}

      {activeModal === 'viewmodes' && (
        <Sheet title="Modes d’affichage" onClose={() => setActiveModal(null)}>
          {[
            ['page', 'Page', 'Présentation classique avec marges et page'],
            ['lecture', 'Lecture', 'Texte agrandi, ruban masqué'],
            ['web', 'Web', 'Pleine largeur, sans page'],
            ['plan', 'Plan', 'Structure des titres, navigation rapide'],
            ['brouillon', 'Brouillon', 'Édition simple, sans fioritures'],
          ].map(([v, l, d]) => (
            <ActionRow key={v} label={`${viewMode === v ? '● ' : ''}${l}`} desc={d} onPress={() => { setViewMode(v as ViewMode); setActiveModal(null); }} />
          ))}
        </Sheet>
      )}

      {activeModal === 'export' && (
        <Sheet title="Exporter / Enregistrer sous" onClose={() => setActiveModal(null)}>
          <Text style={styles.modalText}>Choisissez un format. Sur Android, le fichier est proposé en partage ; sur le web, il est téléchargé.</Text>
          {[
            ['txt', 'Texte brut (.txt)', 'Sans mise en forme'],
            ['md', 'Markdown (.md)', 'Conserve la syntaxe **gras**, # titres…'],
            ['html', 'Page web (.html)', 'Document mis en forme complet'],
            ['rtf', 'Texte enrichi (.rtf)', 'Lisible par Word et LibreOffice'],
            ['doc', 'Document Word (.doc)', 'Ouvrable dans Word'],
            ['pdf', 'PDF (.pdf)', 'Via l’impression système'],
          ].map(([v, l, d]) => (
            <ActionRow key={v} label={l} desc={d} onPress={() => { doShareFile(v as ExportFormat); setActiveModal(null); }} />
          ))}
        </Sheet>
      )}

      {activeModal === 'help' && (
        <Sheet title="Aide de StarOffice Writer" onClose={() => setActiveModal(null)} wide>
          <Text style={styles.helpH}>Mise en forme rapide</Text>
          <Text style={styles.modalText}>Sélectionnez du texte puis utilisez le ruban, ou tapez directement la syntaxe : **gras**, *italique*, __souligné__, ~~barré__, ==surligné==, `code`, ^exposant^, ~indice~. Titres : # Titre 1, ## Titre 2. Listes : - puce ou 1. numéroté. Citation : {'>'} texte. Tableau : lignes | Col1 | Col2 |. Activez l’Aperçu (œil) pour voir le rendu.</Text>
          <Text style={styles.helpH}>Impression et partage</Text>
          <Text style={styles.modalText}>Fichier → Imprimer pour un PDF (Android) ; Fichier → Partager/Exporter pour TXT, Markdown, HTML, RTF, DOC.</Text>
          <Text style={styles.helpH}>Publipostage</Text>
          <Text style={styles.modalText}>1) Ajoutez des destinataires. 2) Insérez {'{{NOM}}, {{EMAIL}}, {{ADRESSE}}'}. 3) Aperçu. 4) Terminer : un document par destinataire est créé.</Text>
        </Sheet>
      )}

      {activeModal === 'shortcuts' && (
        <Sheet title="Raccourcis clavier" onClose={() => setActiveModal(null)} wide>
          <Text style={styles.modalText}>Disponibles avec un clavier physique (ou sur la version web).</Text>
          {[
            ['Ctrl+S', 'Enregistrer'], ['Ctrl+Z', 'Annuler'], ['Ctrl+Y', 'Rétablir'],
            ['Ctrl+G / Ctrl+B', 'Gras'], ['Ctrl+I', 'Italique'], ['Ctrl+U', 'Souligné'],
            ['Ctrl+L', 'Aligner à gauche'], ['Ctrl+E', 'Centrer'], ['Ctrl+R', 'Aligner à droite'], ['Ctrl+J', 'Justifier'],
            ['Ctrl+F', 'Rechercher'], ['Ctrl+H', 'Remplacer'], ['F7', 'Vérification orthographique'], ['Ctrl+F1', 'Réduire le ruban'],
          ].map(([k, v]) => (
            <View key={k} style={styles.statRow}>
              <Text style={styles.statVal}>{k}</Text>
              <Text style={styles.statKey}>{v}</Text>
            </View>
          ))}
        </Sheet>
      )}

      {activeModal === 'about' && (
        <Sheet title="À propos" onClose={() => setActiveModal(null)}>
          <Text style={styles.modalText}>StarOffice Writer 1.0 — traitement de texte mobile (React Native, exportable en APK Android).</Text>
          <Text style={styles.modalText}>Ruban complet : Accueil, Insertion, Dessin, Conception, Mise en page, Références, Publipostage, Révision, Affichage, Aide. Formats d’export : TXT, MD, HTML, RTF, DOC, PDF.</Text>
        </Sheet>
      )}

      {/* ═══ VUE BACKSTAGE (Fichier) ═══ */}
      <Modal visible={backstageOpen} animationType="slide" transparent={false} onRequestClose={() => setBackstageOpen(false)}>
        <SafeAreaView style={{ flex: 1, flexDirection: 'row' }}>
          <View style={styles.backstageSidebar}>
            <Pressable accessibilityRole="button" style={styles.backstageBack} onPress={() => setBackstageOpen(false)}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#fff" />
              <Text style={styles.backstageBackText}>Retour</Text>
            </Pressable>
            <ScrollView>
              {[
                ['infos', 'information', 'Informations'],
                ['nouveau', 'file-plus', 'Nouveau'],
                ['ouvrir', 'folder-open', 'Ouvrir'],
                ['enregistrer', 'content-save', 'Enregistrer'],
                ['sous', 'content-save-all', 'Enregistrer sous'],
                ['imprimer', 'printer', 'Imprimer'],
                ['partager', 'share', 'Partager'],
                ['exporter', 'download', 'Exporter'],
                ['compte', 'account', 'Compte'],
                ['options', 'cog', 'Options'],
              ].map(([id, icon, label]) => (
                <Pressable accessibilityRole="button" key={id} style={[styles.backstageItem, bsItem === id && styles.backstageItemActive]} onPress={() => setBsItem(id)}>
                  <MaterialCommunityIcons name={icon as never} size={16} color="#fff" />
                  <Text style={styles.backstageItemText}>{label}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" style={styles.backstageItem} onPress={() => { setBackstageOpen(false); onCloseDocument(); }}>
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
                <Text style={styles.backstageItemText}>Fermer</Text>
              </Pressable>
            </ScrollView>
          </View>
          <ScrollView style={styles.backstageContent}>
            {bsItem === 'infos' && (
              <>
                <Text style={styles.backstageTitle}>{file.name}</Text>
                <Text style={styles.backstageSectionTitle}>Propriétés</Text>
                <Text style={styles.backstageProp}>Nom : {file.name}</Text>
                <Text style={styles.backstageProp}>Type : Document Writer (.docx)</Text>
                <Text style={styles.backstageProp}>Taille : {Math.round(file.size / 1024)} Ko</Text>
                <Text style={styles.backstageProp}>Créé : {new Date(file.createdAt).toLocaleString('fr-FR')}</Text>
                <Text style={styles.backstageProp}>Modifié : {new Date(file.updatedAt).toLocaleString('fr-FR')}</Text>
                <Text style={styles.backstageProp}>Mots : {stats.words} · Caractères : {stats.chars}</Text>
                <Text style={styles.backstageProp}>Pages estimées : {stats.pages} · Paragraphes : {stats.paragraphs}</Text>
                <Text style={styles.backstageProp}>Commentaires : {comments.length} · Versions : {versions.length}</Text>
                <Text style={styles.backstageProp}>Protection : verrouillage par PIN disponible dans l’application</Text>
              </>
            )}
            {bsItem === 'nouveau' && (
              <>
                <Text style={styles.backstageTitle}>Nouveau document</Text>
                <Pressable accessibilityRole="button" style={styles.bsBtn} onPress={() => { setBackstageOpen(false); onNewDocument(); }}>
                  <Text style={styles.bsBtnText}>Document vierge</Text>
                </Pressable>
                <Text style={styles.backstageProp}>Astuce : des modèles (CV, lettre, rapport…) sont disponibles depuis l’écran d’accueil → Modèles.</Text>
              </>
            )}
            {bsItem === 'ouvrir' && (
              <>
                <Text style={styles.backstageTitle}>Ouvrir</Text>
                <Text style={styles.backstageProp}>Revenez à la liste des fichiers pour ouvrir un autre document.</Text>
                <Pressable accessibilityRole="button" style={styles.bsBtn} onPress={() => { setBackstageOpen(false); onCloseDocument(); }}>
                  <Text style={styles.bsBtnText}>Voir mes fichiers</Text>
                </Pressable>
              </>
            )}
            {bsItem === 'enregistrer' && (
              <>
                <Text style={styles.backstageTitle}>Enregistrer</Text>
                <Text style={styles.backstageProp}>Le document est enregistré automatiquement à chaque modification sur cet appareil.</Text>
                <Pressable accessibilityRole="button" style={styles.bsBtn} onPress={() => { persist(text); setBackstageOpen(false); showBanner('Document enregistré'); }}>
                  <Text style={styles.bsBtnText}>Enregistrer maintenant</Text>
                </Pressable>
              </>
            )}
            {bsItem === 'sous' && (
              <>
                <Text style={styles.backstageTitle}>Enregistrer sous</Text>
                <Text style={styles.backstageProp}>Exporter une copie dans un autre format :</Text>
                {(['txt', 'md', 'html', 'rtf', 'doc', 'pdf'] as ExportFormat[]).map((f) => (
                  <Pressable accessibilityRole="button" key={f} style={styles.bsBtn} onPress={() => { setBackstageOpen(false); doShareFile(f); }}>
                    <Text style={styles.bsBtnText}>.{f.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </>
            )}
            {bsItem === 'imprimer' && (
              <>
                <Text style={styles.backstageTitle}>Imprimer</Text>
                <Text style={styles.backstageProp}>{stats.pages} page(s) · {stats.words} mots. Sur Android, choisissez « Enregistrer en PDF » dans la boîte de dialogue.</Text>
                <Pressable accessibilityRole="button" style={styles.bsBtn} onPress={() => { setBackstageOpen(false); doPrint(); }}>
                  <Text style={styles.bsBtnText}>Imprimer</Text>
                </Pressable>
              </>
            )}
            {bsItem === 'partager' && (
              <>
                <Text style={styles.backstageTitle}>Partager</Text>
                <Text style={styles.backstageProp}>Envoyez une copie par e-mail, messagerie, Drive…</Text>
                {(['txt', 'md', 'html', 'rtf', 'doc'] as ExportFormat[]).map((f) => (
                  <Pressable accessibilityRole="button" key={f} style={styles.bsBtn} onPress={() => { setBackstageOpen(false); doShareFile(f); }}>
                    <Text style={styles.bsBtnText}>Partager en .{f.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </>
            )}
            {bsItem === 'exporter' && (
              <>
                <Text style={styles.backstageTitle}>Exporter</Text>
                <Text style={styles.backstageProp}>Convertir vers un autre format :</Text>
                {(['pdf', 'rtf', 'doc', 'html', 'md', 'txt'] as ExportFormat[]).map((f) => (
                  <Pressable accessibilityRole="button" key={f} style={styles.bsBtn} onPress={() => { setBackstageOpen(false); doShareFile(f); }}>
                    <Text style={styles.bsBtnText}>Exporter en .{f.toUpperCase()}</Text>
                  </Pressable>
                ))}
              </>
            )}
            {bsItem === 'compte' && (
              <>
                <Text style={styles.backstageTitle}>Compte</Text>
                <Text style={styles.backstageProp}>Compte local StarOffice (aucun compte cloud requis).</Text>
                <Text style={styles.backstageProp}>Vos documents sont stockés sur cet appareil.</Text>
              </>
            )}
            {bsItem === 'options' && (
              <>
                <Text style={styles.backstageTitle}>Options</Text>
                <Pressable accessibilityRole="button" style={styles.bsBtn} onPress={() => setAutoCorrect((v) => !v)}>
                  <Text style={styles.bsBtnText}>Correction auto : {autoCorrect ? 'ON' : 'OFF'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={styles.bsBtn} onPress={() => setShowRuler((v) => !v)}>
                  <Text style={styles.bsBtnText}>Règle : {showRuler ? 'ON' : 'OFF'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={styles.bsBtn} onPress={() => setTracking((v) => !v)}>
                  <Text style={styles.bsBtnText}>Suivi des modifications : {tracking ? 'ON' : 'OFF'}</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  containerLandscape: { flexDirection: 'column' },
  titleBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 6,
    backgroundColor: '#e2e8f0', borderBottomWidth: 1, borderBottomColor: '#cbd5e1',
  },
  qaBtn: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  divider: { width: 1, height: 16, backgroundColor: '#cbd5e1', marginHorizontal: 4 },
  fileName: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginLeft: 4 },
  appName: { fontSize: 12, color: '#64748b' },
  savedHint: { fontSize: 11, color: '#16a34a' },
  previewHint: { fontSize: 11, fontWeight: '700', color: '#2b579a' },
  tabsRow: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#d4d4d4' },
  tabsBar: { height: 30, flexGrow: 1, flexShrink: 1, backgroundColor: '#f5f5f5' },
  tabsContent: { alignItems: 'stretch', paddingHorizontal: 2 },
  tab: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  tabFile: { backgroundColor: '#2b579a', paddingHorizontal: 16 },
  tabActive: { backgroundColor: '#ffffff', borderBottomWidth: 2, borderBottomColor: '#2b579a' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: '#444444', textTransform: 'uppercase' },
  tabLabelFile: { color: '#ffffff', fontWeight: '600' },
  tabLabelActive: { color: '#2b579a', fontWeight: '600' },
  collapseBtn: { justifyContent: 'center', paddingHorizontal: 10 },
  ribbon: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#d4d4d4', minHeight: 106, flexGrow: 0, flexShrink: 0 },
  ribbonContent: { alignItems: 'stretch', paddingVertical: 4 },
  rGroup: { flexDirection: 'column', justifyContent: 'space-between', paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#e5e5e5' },
  rGroupTools: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  rGroupTitle: { fontSize: 10, color: '#777777', textAlign: 'center', paddingTop: 2 },
  rBtn: { alignItems: 'center', justifyContent: 'flex-start', minWidth: 56, paddingTop: 2, paddingHorizontal: 7, borderRadius: 4 },
  rBtnLabel: { fontSize: 10, color: '#333333', textAlign: 'center', lineHeight: 12, marginTop: 2 },
  rSmallBtn: { padding: 5, borderRadius: 4 },
  rTwoRows: { flexDirection: 'column', justifyContent: 'flex-start', gap: 2 },
  rRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  zoomLabel: { fontSize: 11, color: '#1e293b', marginHorizontal: 2, alignSelf: 'center' },
  fontBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4,
    borderWidth: 1, borderColor: '#d4d4d4', backgroundColor: '#fff',
    marginRight: 2, maxWidth: 130,
  },
  dropdown: {
    position: 'absolute', top: 178, left: 80, zIndex: 100,
    backgroundColor: '#fff', borderRadius: 8, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 8, maxHeight: 240, borderWidth: 1, borderColor: '#e2e8f0',
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  colorSwatch: { width: 24, height: 24, borderRadius: 4, margin: 4 },
  searchPanel: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#d4d4d4', padding: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  searchTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#f1f5f9' },
  searchTabActive: { backgroundColor: '#2b579a' },
  searchTabText: { fontSize: 12, color: '#475569' },
  searchTabTextActive: { color: '#fff', fontWeight: '600' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#1e293b', backgroundColor: '#fff' },
  searchBtn: { padding: 6, borderRadius: 4, backgroundColor: '#f1f5f9' },
  searchCount: { fontSize: 11, color: '#64748b', minWidth: 90 },
  searchAction: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, backgroundColor: '#2b579a' },
  searchActionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  ruler: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingHorizontal: 12, height: 26, flexGrow: 0, flexShrink: 0 },
  rulerCm: { flex: 1, borderLeftWidth: 1, borderLeftColor: '#94a3b8', paddingLeft: 2 },
  rulerNum: { fontSize: 8, color: '#64748b' },
  rulerTicks: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 8 },
  rulerTick: { width: 1, height: 4, backgroundColor: '#cbd5e1' },
  rulerTickBig: { height: 8, backgroundColor: '#94a3b8' },
  editorArea: { flex: 1, backgroundColor: '#94a3b8' },
  page: { backgroundColor: '#fff', minHeight: 500, borderRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, position: 'relative' },
  pageWeb: { borderRadius: 0, shadowOpacity: 0, elevation: 0 },
  pageDraft: { borderRadius: 0, shadowOpacity: 0, elevation: 0, backgroundColor: '#f8fafc' },
  textArea: { flex: 1, minHeight: 480, textAlignVertical: 'top', zIndex: 2 },
  editStack: { flex: 1, minHeight: 480, position: 'relative' },
  underlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, padding: 0, margin: 0 },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 24 },
  gridLine: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', borderStyle: 'dotted', height: 22 },
  watermarkWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  watermark: { fontSize: 64, fontWeight: 'bold', color: 'rgba(100,116,139,0.18)', transform: [{ rotate: '-30deg' }] },
  navPane: { position: 'absolute', left: 8, top: 8, bottom: 8, width: 200, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', zIndex: 60, elevation: 6 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  navTitle: { fontWeight: '700', color: '#1e293b', fontSize: 13 },
  navEmpty: { padding: 10, color: '#94a3b8', fontSize: 12 },
  navItem: { paddingVertical: 7, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  navItemText: { fontSize: 12, color: '#334155' },
  planView: { flex: 1, backgroundColor: '#fff', padding: 16 },
  planTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  planEmpty: { color: '#64748b', fontSize: 13 },
  planItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  planItemText: { fontSize: 14, color: '#2b579a' },
  statusBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: '#e2e8f0', borderTopWidth: 1, borderTopColor: '#cbd5e1',
  },
  statusText: { fontSize: 11, color: '#475569' },
  banner: { position: 'absolute', bottom: 44, alignSelf: 'center', backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, zIndex: 200, elevation: 10, maxWidth: '90%' },
  bannerText: { color: '#fff', fontSize: 12 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  sheet: { backgroundColor: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '85%', overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', flex: 1 },
  sheetClose: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9' },
  sheetCloseText: { color: '#334155', fontSize: 12, fontWeight: '600' },
  sheetBody: { padding: 12 },
  actionRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actionLabel: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  actionDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  modalText: { fontSize: 13, color: '#475569', marginBottom: 10, lineHeight: 19 },
  helpH: { fontSize: 14, fontWeight: '700', color: '#2b579a', marginTop: 10, marginBottom: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statKey: { fontSize: 13, color: '#475569', flex: 1 },
  statVal: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginTop: 8, marginBottom: 4 },
  fieldInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#1e293b', marginBottom: 6, backgroundColor: '#fff' },
  primaryBtn: { backgroundColor: '#2b579a', borderRadius: 6, padding: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryBtn: { backgroundColor: '#f1f5f9', borderRadius: 6, padding: 12, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { color: '#334155', fontWeight: '600', fontSize: 14 },
  miniBtn: { backgroundColor: '#2b579a', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  miniBtnDanger: { backgroundColor: '#dc2626', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  miniBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sourceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  symbolGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  symbolCell: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, margin: 3 },
  symbolChar: { fontSize: 20, color: '#1e293b' },
  stepperRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  stepperBtn: { minWidth: 40, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#f1f5f9', alignItems: 'center' },
  stepperBtnActive: { backgroundColor: '#2b579a' },
  stepperText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  mergeBox: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, marginVertical: 8, maxHeight: 300 },
  mergeText: { fontSize: 13, color: '#1e293b', lineHeight: 20 },
  backstageSidebar: { width: 220, backgroundColor: '#2b579a', padding: 12 },
  backstageBack: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginBottom: 8 },
  backstageBackText: { color: '#fff', fontSize: 13 },
  backstageItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 4 },
  backstageItemActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  backstageItemText: { color: '#fff', fontSize: 13 },
  backstageContent: { flex: 1, padding: 24, backgroundColor: '#fff' },
  backstageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  backstageSectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 },
  backstageProp: { fontSize: 13, color: '#475569', marginBottom: 4 },
  bsBtn: { backgroundColor: '#2b579a', borderRadius: 6, padding: 12, alignItems: 'center', marginBottom: 8, maxWidth: 320 },
  bsBtnText: { color: '#fff', fontWeight: '600' },
});
