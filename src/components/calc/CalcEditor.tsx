import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  FlatList,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import type { OfficeFile, CellData, CalcSheet, CalcChartDef, CalcChartType } from '../../types/office';
import {
  coordToString,
  parseCellCoord,
  expandRange,
  evaluateFormula,
  formatCellValue,
} from '../../utils/calcEngine';
import { rangeToSeries, guessSumRange, selectionStats } from './chartData';
import CalcChart from './CalcChart';

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
}

const CELL_W = 88;
const CELL_H = 30;
const HEAD_W = 38;

const CALC_FONTS = ['Système', 'Roboto', 'Ubuntu', 'DejaVu Sans', 'Liberation Sans'];
const FONT_STACK: Record<string, string | undefined> = {
  Système: undefined,
  Roboto: 'Roboto',
  Ubuntu: 'Ubuntu',
  'DejaVu Sans': 'DejaVu Sans',
  'Liberation Sans': 'Liberation Sans',
};
const FORMATS = [
  { id: 'general', label: 'Gén' },
  { id: 'number', label: '1 234' },
  { id: 'currency', label: '€' },
  { id: 'percent', label: '%' },
];
const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
  '#a855f7', '#ec4899', '#ffffff', '#94a3b8', '#000000',
];
const CHART_TYPES: { id: CalcChartType; label: string; icon: string }[] = [
  { id: 'bar', label: 'Histogramme', icon: 'bar-chart' },
  { id: 'line', label: 'Courbe', icon: 'show-chart' },
  { id: 'pie', label: 'Secteurs', icon: 'pie-chart' },
  { id: 'hbar', label: 'Barres', icon: 'align-horizontal-left' },
  { id: 'area', label: 'Aires', icon: 'area-chart' },
  { id: 'scatter', label: 'Nuage XY', icon: 'scatter-plot' },
  { id: 'combo', label: 'Combiné', icon: 'stacked-bar-chart' },
  { id: 'spark', label: 'Miniature', icon: 'sparkles' },
];

let uid = 0;
const nid = (p: string) => `${p}-${Date.now()}-${uid++}`;

export default function CalcEditor({ file, onUpdateFile }: Props) {
  const { width: winW } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Roboto: require('../../../assets/fonts/Roboto-Regular.ttf'),
    Ubuntu: require('../../../assets/fonts/Ubuntu-Regular.ttf'),
    'DejaVu Sans': require('../../../assets/fonts/DejaVuSans.ttf'),
    'Liberation Sans': require('../../../assets/fonts/LiberationSans-Regular.ttf'),
  });
  void fontsLoaded;

  const sheets: CalcSheet[] = file.content?.sheets || [];
  const charts: CalcChartDef[] = file.content?.charts || [];
  const [activeSheetId, setActiveSheetId] = useState<string>(sheets[0]?.id || 'sh-1');
  const [selStart, setSelStart] = useState('A1');
  const [selEnd, setSelEnd] = useState('A1');
  const [rangeMode, setRangeMode] = useState(false);
  const [view, setView] = useState<'grid' | 'charts'>('grid');
  const [editValue, setEditValue] = useState('');
  const [paletteMode, setPaletteMode] = useState<'color' | 'bg' | null>(null);
  const [prompt, setPrompt] = useState<{ title: string; value: string; onOk: (v: string) => void } | null>(null);
  const [chartPicker, setChartPicker] = useState(false);
  const [sparkTarget, setSparkTarget] = useState('A1');

  const sheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  const commitSheets = useCallback(
    (next: CalcSheet[]) => onUpdateFile({ content: { ...file.content, sheets: next } }),
    [file.content, onUpdateFile]
  );
  const commitCharts = useCallback(
    (next: CalcChartDef[]) => onUpdateFile({ content: { ...file.content, charts: next } }),
    [file.content, onUpdateFile]
  );

  const selCoords = useMemo(() => expandRange(selStart, selEnd), [selStart, selEnd]);

  const getRaw = useCallback(
    (coord: string): string | number | boolean | undefined => sheet?.data?.[coord]?.value,
    [sheet]
  );

  const resolveCell = useCallback(
    (cell?: CellData): string => {
      if (!cell) return '';
      const v = cell.value;
      if (typeof v === 'string' && v.startsWith('=')) {
        const r = evaluateFormula(v, getRaw);
        return formatCellValue(r, cell.format);
      }
      return formatCellValue(v, cell.format);
    },
    [getRaw]
  );

  const stats = useMemo(
    () => (sheet ? selectionStats(sheet, selCoords) : { sum: 0, avg: 0, count: 0 }),
    [sheet, selCoords]
  );

  if (!sheet) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#94a3b8' }}>Aucune feuille disponible</Text>
      </View>
    );
  }

  // ── Sélection ──
  const tapCell = (coord: string) => {
    if (rangeMode) {
      setSelEnd(coord);
    } else {
      setSelStart(coord);
      setSelEnd(coord);
      const cell = sheet.data?.[coord];
      setEditValue(cell?.formula || (cell?.value != null ? String(cell.value) : ''));
    }
  };
  const selLabel = selStart === selEnd ? selStart : `${selStart}:${selEnd}`;

  // ── Saisie ──
  const parseInput = (text: string): string | number | boolean => {
    const t = text.trim();
    if (/^(VRAI|FAUX)$/i.test(t)) return t.toUpperCase() === 'VRAI';
    if (/^[+-]?[0-9]+([.,][0-9]+)?$/.test(t)) return parseFloat(t.replace(',', '.'));
    return text;
  };
  const commitCell = (coord: string, text: string) => {
    const next = sheets.map((s) => {
      if (s.id !== sheet.id) return s;
      const data = { ...s.data };
      if (text === '') {
        const ex = data[coord];
        if (ex) {
          const { value: _v, formula: _f, ...style } = ex;
          void _v;
          void _f;
          if (Object.keys(style).length) data[coord] = style as CellData;
          else delete data[coord];
        }
      } else {
        const existing = data[coord] || {};
        data[coord] = {
          ...existing,
          value: text.startsWith('=') ? text : parseInput(text),
          formula: text.startsWith('=') ? text : undefined,
        };
      }
      return { ...s, data };
    });
    commitSheets(next);
  };

  // ── Mise en forme de la sélection ──
  const styleSel = (patch: Partial<CellData> | ((c: CellData) => Partial<CellData>)) => {
    const next = sheets.map((s) => {
      if (s.id !== sheet.id) return s;
      const data = { ...s.data };
      for (const c of selCoords) {
        const ex = data[c] || { value: '' };
        const p = typeof patch === 'function' ? patch(ex) : patch;
        data[c] = { ...ex, ...p };
      }
      return { ...s, data };
    });
    commitSheets(next);
  };
  const clearFormatSel = () => {
    const next = sheets.map((s) => {
      if (s.id !== sheet.id) return s;
      const data = { ...s.data };
      for (const c of selCoords) {
        const ex = data[c];
        if (!ex) continue;
        const { value, formula } = ex;
        if (value === '' || value === undefined) delete data[c];
        else data[c] = { value, ...(formula ? { formula } : {}) };
      }
      return { ...s, data };
    });
    commitSheets(next);
  };
  const anchorCell: CellData = sheet.data?.[selStart] || { value: '' };

  // ── Σ automatique ──
  const autoSum = () => {
    const g = guessSumRange(sheet, selStart);
    if (!g) {
      Alert.alert('Somme automatique', 'Aucun nombre contigu trouvé au-dessus ou à gauche.');
      return;
    }
    const f = `=SOMME(${g.start}:${g.end})`;
    commitCell(selStart, f);
    setEditValue(f);
  };

  // ── Lignes / colonnes ──
  const shiftData = (
    data: Record<string, CellData>,
    kind: 'row' | 'col',
    at: number,
    delta: 1 | -1
  ): Record<string, CellData> => {
    const out: Record<string, CellData> = {};
    for (const [k, v] of Object.entries(data)) {
      const p = parseCellCoord(k);
      if (!p) continue;
      if (kind === 'row') {
        if (delta === -1 && p.row === at) continue;
        const nr = p.row >= at ? p.row + delta : p.row;
        if (nr < 0) continue;
        out[coordToString(p.col, nr)] = v;
      } else {
        if (delta === -1 && p.col === at) continue;
        const nc = p.col >= at ? p.col + delta : p.col;
        if (nc < 0) continue;
        out[coordToString(nc, p.row)] = v;
      }
    }
    return out;
  };
  const shiftCoord = (coord: string, kind: 'row' | 'col', at: number, delta: 1 | -1): string => {
    const p = parseCellCoord(coord);
    if (!p) return coord;
    if (kind === 'row' && p.row >= at) return coordToString(p.col, Math.max(0, p.row + delta));
    if (kind === 'col' && p.col >= at) return coordToString(Math.max(0, p.col + delta), p.row);
    return coord;
  };
  const mutateDim = (kind: 'row' | 'col', at: number, delta: 1 | -1) => {
    const next = sheets.map((s) => {
      if (s.id !== sheet.id) return s;
      const data = shiftData(s.data || {}, kind, at, delta);
      return {
        ...s,
        data,
        rowCount: kind === 'row' ? Math.max(1, s.rowCount + delta) : s.rowCount,
        colCount: kind === 'col' ? Math.max(1, s.colCount + delta) : s.colCount,
      };
    });
    commitSheets(next);
    // Recale les graphiques de la feuille
    const nc = charts.map((c) =>
      c.sheetId !== sheet.id
        ? c
        : {
            ...c,
            start: shiftCoord(c.start, kind, at, delta),
            end: shiftCoord(c.end, kind, at, delta),
            target: c.target ? shiftCoord(c.target, kind, at, delta) : undefined,
          }
    );
    commitCharts(nc);
    setSelStart('A1');
    setSelEnd('A1');
  };
  const rowMenu = (r: number) => {
    Alert.alert(`Ligne ${r + 1}`, '', [
      { text: 'Insérer au-dessus', onPress: () => mutateDim('row', r, 1) },
      ...(sheet.rowCount > 1
        ? [{ text: 'Supprimer', style: 'destructive' as const, onPress: () => mutateDim('row', r, -1) }]
        : []),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };
  const colMenu = (c: number) => {
    Alert.alert(`Colonne ${coordToString(c, 0).replace(/[0-9]+$/, '')}`, '', [
      { text: 'Insérer à gauche', onPress: () => mutateDim('col', c, 1) },
      ...(sheet.colCount > 1
        ? [{ text: 'Supprimer', style: 'destructive' as const, onPress: () => mutateDim('col', c, -1) }]
        : []),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  // ── Feuilles ──
  const addSheet = () => {
    const n = sheets.length + 1;
    commitSheets([
      ...sheets,
      { id: nid('sh'), name: `Feuille${n}`, data: {}, rowCount: 100, colCount: 26 },
    ]);
  };
  const sheetMenu = (id: string, name: string) => {
    Alert.alert(name, '', [
      {
        text: 'Renommer',
        onPress: () =>
          setPrompt({
            title: 'Renommer la feuille',
            value: name,
            onOk: (v) => {
              if (!v.trim()) return;
              commitSheets(sheets.map((s) => (s.id === id ? { ...s, name: v.trim() } : s)));
            },
          }),
      },
      ...(sheets.length > 1
        ? [
            {
              text: 'Supprimer',
              style: 'destructive' as const,
              onPress: () => {
                const rest = sheets.filter((s) => s.id !== id);
                commitSheets(rest);
                if (activeSheetId === id) setActiveSheetId(rest[0].id);
                commitCharts(charts.filter((c) => c.sheetId !== id));
              },
            },
          ]
        : []),
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  // ── Graphiques ──
  const insertChart = (type: CalcChartType) => {
    if (type === 'spark') {
      if (!parseCellCoord(sparkTarget)) {
        Alert.alert('Miniature', 'Cellule cible invalide.');
        return;
      }
      commitCharts([
        ...charts,
        {
          id: nid('ch'), type, title: 'Miniature', sheetId: sheet.id,
          start: selStart, end: selEnd, showLegend: false, target: sparkTarget.toUpperCase(),
        },
      ]);
    } else {
      const n = charts.filter((c) => c.type !== 'spark').length + 1;
      commitCharts([
        ...charts,
        {
          id: nid('ch'), type, title: `Graphique ${n}`, sheetId: sheet.id,
          start: selStart, end: selEnd, showLegend: true,
        },
      ]);
    }
    setChartPicker(false);
    setView('charts');
  };
  const sparkAt = (coord: string): CalcChartDef | undefined =>
    charts.find((c) => c.type === 'spark' && c.sheetId === sheet.id && c.target === coord);

  // ── Rendu grille ──
  const colLetters = useMemo(
    () => Array.from({ length: sheet.colCount }, (_, i) => coordToString(i, 0).replace(/[0-9]+$/, '')),
    [sheet.colCount]
  );
  const frozen = Math.min(sheet.frozenRows || 0, sheet.rowCount - 1);
  const bodyRows = useMemo(
    () => Array.from({ length: sheet.rowCount - frozen }, (_, i) => frozen + i),
    [sheet.rowCount, frozen]
  );

  const inSel = (coord: string) => {
    const a = parseCellCoord(selStart);
    const b = parseCellCoord(selEnd);
    const p = parseCellCoord(coord);
    if (!a || !b || !p) return false;
    return (
      p.col >= Math.min(a.col, b.col) &&
      p.col <= Math.max(a.col, b.col) &&
      p.row >= Math.min(a.row, b.row) &&
      p.row <= Math.max(a.row, b.row)
    );
  };

  const renderCell = (coord: string) => {
    const cell = sheet.data?.[coord];
    const spark = sparkAt(coord);
    const selected = inSel(coord);
    const anchor = coord === selStart;
    const txt = resolveCell(cell);
    const isErr = txt.startsWith('#');
    return (
      <Pressable
        key={coord}
        onPress={() => tapCell(coord)}
        style={[
          styles.cell,
          { backgroundColor: cell?.bg || '#0f172a' },
          selected && styles.cellInSel,
          anchor && styles.cellAnchor,
        ]}
      >
        {spark ? (
          <CalcChart
            type="spark"
            title=""
            data={rangeToSeries(sheet, spark.start, spark.end)}
            width={CELL_W - 8}
            height={CELL_H - 8}
          />
        ) : (
          <Text
            numberOfLines={1}
            style={[
              styles.cellText,
              cell?.bold && { fontWeight: '700' as const },
              cell?.italic && { fontStyle: 'italic' as const },
              cell?.underline && { textDecorationLine: 'underline' as const },
              cell?.fontSize ? { fontSize: cell.fontSize } : null,
              cell?.fontFamily && FONT_STACK[cell.fontFamily] && { fontFamily: FONT_STACK[cell.fontFamily] },
              { color: isErr ? '#f87171' : cell?.color || '#f1f5f9' },
              cell?.align && { textAlign: cell.align },
            ]}
          >
            {txt}
          </Text>
        )}
      </Pressable>
    );
  };

  // Défilement horizontal synchronisé (FlatList verticale bornée + lignes synchronisées)
  const headScroll = useRef<ScrollView>(null);
  const rowScrolls = useRef(new Map<number, ScrollView | null>());
  const syncing = useRef(false);
  const syncScroll = (x: number) => {
    if (syncing.current) return;
    syncing.current = true;
    headScroll.current?.scrollTo({ x, animated: false });
    rowScrolls.current.forEach((sv) => sv?.scrollTo({ x, animated: false }));
    setTimeout(() => {
      syncing.current = false;
    }, 60);
  };

  const renderRow = (r: number) => (
    <View key={r} style={styles.row}>
      <Pressable
        onPress={() => {
          setSelStart(coordToString(0, r));
          setSelEnd(coordToString(sheet.colCount - 1, r));
        }}
        onLongPress={() => rowMenu(r)}
        style={styles.rowHead}
      >
        <Text style={styles.headText}>{r + 1}</Text>
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={(sv) => {
          rowScrolls.current.set(r, sv);
        }}
        onScroll={(e) => syncScroll(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        <View style={styles.row}>{colLetters.map((_, c) => renderCell(coordToString(c, r)))}</View>
      </ScrollView>
    </View>
  );

  const fmtIdx = Math.max(0, FORMATS.findIndex((f) => f.id === (anchorCell.format || 'general')));

  return (
    <View style={styles.container}>
      {/* Onglets feuilles + vues */}
      <View style={styles.sheetTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {sheets.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setActiveSheetId(s.id);
                setSelStart('A1');
                setSelEnd('A1');
              }}
              onLongPress={() => sheetMenu(s.id, s.name)}
              style={[styles.sheetTab, s.id === activeSheetId && styles.sheetTabActive]}
            >
              <Text style={[styles.sheetTabText, s.id === activeSheetId && styles.sheetTabTextActive]}>
                {s.name}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={addSheet} style={styles.sheetTab}>
            <Text style={styles.sheetTabText}>+ Feuille</Text>
          </Pressable>
        </ScrollView>
        <Pressable
          onPress={() => setView(view === 'grid' ? 'charts' : 'grid')}
          style={[styles.viewBtn, view === 'charts' && styles.viewBtnActive]}
        >
          <MaterialCommunityIcons name="chart-bar" size={16} color={view === 'charts' ? '#fff' : '#a855f7'} />
          <Text style={[styles.viewBtnText, view === 'charts' && { color: '#fff' }]}>
            {view === 'grid' ? `Graphiques (${charts.length})` : 'Grille'}
          </Text>
        </Pressable>
      </View>

      {view === 'grid' ? (
        <>
          {/* Barre de formule */}
          <View style={styles.formulaBar}>
            <Text style={styles.formulaCellLabel} numberOfLines={1}>
              {selLabel}
            </Text>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              onSubmitEditing={() => commitCell(selStart, editValue)}
              onBlur={() => commitCell(selStart, editValue)}
              placeholder="Valeur ou formule (=SOMME(A1:A5))"
              placeholderTextColor="#475569"
              style={styles.formulaInput}
            />
            <Pressable onPress={() => commitCell(selStart, editValue)} style={styles.okBtn}>
              <Ionicons name="checkmark" size={16} color="#22c55e" />
            </Pressable>
          </View>

          {/* Barre Accueil */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar}>
            <ToolBtn
              label="B"
              bold
              active={!!anchorCell.bold}
              onPress={() => styleSel((c) => ({ bold: !c.bold }))}
            />
            <ToolBtn
              label="I"
              italic
              active={!!anchorCell.italic}
              onPress={() => styleSel((c) => ({ italic: !c.italic }))}
            />
            <ToolBtn
              label="U"
              underline
              active={!!anchorCell.underline}
              onPress={() => styleSel((c) => ({ underline: !c.underline }))}
            />
            <ToolBtn label="A−" onPress={() => styleSel((c) => ({ fontSize: Math.max(8, (c.fontSize || 12) - 2) }))} />
            <ToolBtn label="A+" onPress={() => styleSel((c) => ({ fontSize: Math.min(28, (c.fontSize || 12) + 2) }))} />
            <ToolBtn
              label={anchorCell.fontFamily || 'Police'}
              wide
              onPress={() => {
                const i = CALC_FONTS.indexOf(anchorCell.fontFamily || 'Système');
                const nf = CALC_FONTS[(i + 1) % CALC_FONTS.length];
                styleSel({ fontFamily: nf === 'Système' ? undefined : nf });
              }}
            />
            <ToolBtn label="A🎨" onPress={() => setPaletteMode('color')} />
            <ToolBtn label="🪣" onPress={() => setPaletteMode('bg')} />
            <ToolBtn
              label="⬅"
              active={anchorCell.align === 'left'}
              onPress={() => styleSel({ align: 'left' })}
            />
            <ToolBtn
              label="⬛"
              active={!anchorCell.align || anchorCell.align === 'center'}
              onPress={() => styleSel({ align: 'center' })}
            />
            <ToolBtn
              label="➡"
              active={anchorCell.align === 'right'}
              onPress={() => styleSel({ align: 'right' })}
            />
            <ToolBtn
              label={FORMATS[fmtIdx].label}
              wide
              onPress={() => {
                const nf = FORMATS[(fmtIdx + 1) % FORMATS.length].id;
                styleSel({ format: nf === 'general' ? undefined : nf });
              }}
            />
            <ToolBtn label="Σ" onPress={autoSum} />
            <ToolBtn label="⌫" onPress={clearFormatSel} />
          </ScrollView>

          {/* Barre Feuille/Insertion */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbar}>
            <ToolBtn label="+Lig" onPress={() => mutateDim('row', sheet.rowCount, 1)} />
            <ToolBtn label="−Lig" onPress={() => sheet.rowCount > 1 && mutateDim('row', sheet.rowCount - 1, -1)} />
            <ToolBtn label="+Col" onPress={() => mutateDim('col', sheet.colCount, 1)} />
            <ToolBtn label="−Col" onPress={() => sheet.colCount > 1 && mutateDim('col', sheet.colCount - 1, -1)} />
            <ToolBtn label="🔗 Plage" wide active={rangeMode} onPress={() => setRangeMode(!rangeMode)} />
            <ToolBtn label="📊 Graphique" wide onPress={() => { setSparkTarget(selStart); setChartPicker(true); }} />
          </ScrollView>

          {/* Grille */}
          <View style={{ flex: 1 }}>
            <View style={styles.row}>
              <View style={styles.corner} />
              <ScrollView
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                ref={headScroll}
                style={{ flex: 1 }}
              >
                <View style={styles.row}>
                  {colLetters.map((lb, c) => (
                    <Pressable
                      key={lb}
                      onPress={() => {
                        setSelStart(coordToString(c, 0));
                        setSelEnd(coordToString(c, sheet.rowCount - 1));
                      }}
                      onLongPress={() => colMenu(c)}
                      style={styles.colHead}
                    >
                      <Text style={styles.headText}>{lb}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
            {Array.from({ length: frozen }, (_, r) => renderRow(r))}
            <FlatList
              data={bodyRows}
              keyExtractor={(r) => `r${r}`}
              renderItem={({ item }) => renderRow(item)}
              initialNumToRender={25}
              windowSize={7}
              removeClippedSubviews
              style={{ flex: 1 }}
            />
          </View>

          {/* Barre d'état */}
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>
              {sheet.name} · {selLabel}
            </Text>
            <Text style={styles.statusText}>
              Σ {formatCellValue(Math.round(stats.sum * 100) / 100)} · Moy{' '}
              {formatCellValue(Math.round(stats.avg * 100) / 100)} · Nb {stats.count}
            </Text>
          </View>
        </>
      ) : (
        <ChartsView
          charts={charts}
          sheets={sheets}
          width={winW}
          onDelete={(id) => commitCharts(charts.filter((c) => c.id !== id))}
          onToggleLegend={(id) =>
            commitCharts(charts.map((c) => (c.id === id ? { ...c, showLegend: !c.showLegend } : c)))
          }
          onRename={(c) =>
            setPrompt({
              title: 'Titre du graphique',
              value: c.title,
              onOk: (v) => {
                if (!v.trim()) return;
                commitCharts(charts.map((x) => (x.id === c.id ? { ...x, title: v.trim() } : x)));
              },
            })
          }
        />
      )}

      {/* Palette couleurs */}
      <Modal visible={paletteMode !== null} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setPaletteMode(null)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {paletteMode === 'color' ? 'Couleur du texte' : 'Couleur de remplissage'}
            </Text>
            <View style={styles.paletteGrid}>
              {PALETTE.map((col) => (
                <Pressable
                  key={col}
                  onPress={() => {
                    styleSel(paletteMode === 'color' ? { color: col } : { bg: col });
                    setPaletteMode(null);
                  }}
                  style={[styles.swatch, { backgroundColor: col }]}
                />
              ))}
              <Pressable
                onPress={() => {
                  styleSel(paletteMode === 'color' ? { color: undefined } : { bg: undefined });
                  setPaletteMode(null);
                }}
                style={[styles.swatch, styles.swatchNone]}
              >
                <Text style={{ fontSize: 10 }}>∅</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Sélecteur de graphique */}
      <Modal visible={chartPicker} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setChartPicker(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Insérer un graphique — {selLabel}</Text>
            <View style={styles.paletteGrid}>
              {CHART_TYPES.map((t) => (
                <Pressable key={t.id} onPress={() => insertChart(t.id)} style={styles.chartPick}>
                  <MaterialCommunityIcons name={t.icon as never} size={22} color="#a855f7" />
                  <Text style={styles.chartPickText}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sparkRow}>
              <Text style={styles.statusText}>Cible miniature : </Text>
              <TextInput
                value={sparkTarget}
                onChangeText={setSparkTarget}
                autoCapitalize="characters"
                style={styles.sparkInput}
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Invite texte générique */}
      <Modal visible={prompt !== null} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setPrompt(null)}>
          <PromptBox prompt={prompt} onClose={() => setPrompt(null)} />
        </Pressable>
      </Modal>
    </View>
  );
}

function ToolBtn({
  label, onPress, active, bold, italic, underline, wide,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  wide?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tool, wide && styles.toolWide, active && styles.toolActive]}>
      <Text
        style={[
          styles.toolText,
          bold && { fontWeight: '800' as const },
          italic && { fontStyle: 'italic' as const },
          underline && { textDecorationLine: 'underline' as const },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PromptBox({
  prompt, onClose,
}: {
  prompt: { title: string; value: string; onOk: (v: string) => void } | null;
  onClose: () => void;
}) {
  const [v, setV] = useState(prompt?.value ?? '');
  if (!prompt) return null;
  return (
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>{prompt.title}</Text>
      <TextInput value={v} onChangeText={setV} style={styles.promptInput} autoFocus />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Pressable onPress={onClose} style={styles.tool}>
          <Text style={styles.toolText}>Annuler</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            prompt.onOk(v);
            onClose();
          }}
          style={[styles.tool, styles.toolActive]}
        >
          <Text style={[styles.toolText, { color: '#fff' }]}>OK</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ChartsView({
  charts, sheets, width, onDelete, onToggleLegend, onRename,
}: {
  charts: CalcChartDef[];
  sheets: CalcSheet[];
  width: number;
  onDelete: (id: string) => void;
  onToggleLegend: (id: string) => void;
  onRename: (c: CalcChartDef) => void;
}) {
  if (!charts.length) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#94a3b8', textAlign: 'center', paddingHorizontal: 24 }}>
          Aucun graphique.{'\n'}Sélectionnez une plage dans la grille puis « 📊 Graphique ».
        </Text>
      </View>
    );
  }
  const cardW = width - 24;
  return (
    <FlatList
      data={charts}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: 12, gap: 12 }}
      renderItem={({ item }) => {
        const sh = sheets.find((s) => s.id === item.sheetId);
        return (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Pressable onPress={() => onRename(item)} style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title} <Text style={styles.cardSub}>({item.start}:{item.end})</Text>
                </Text>
              </Pressable>
              {item.type !== 'spark' && (
                <Pressable onPress={() => onToggleLegend(item.id)} style={styles.tool}>
                  <Text style={styles.toolText}>{item.showLegend ? '◉' : '◎'}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => onDelete(item.id)} style={styles.tool}>
                <Ionicons name="trash" size={15} color="#f87171" />
              </Pressable>
            </View>
            {item.type === 'spark' ? (
              <Text style={styles.statusText}>
                Miniature → cellule {item.target} ({item.start}:{item.end})
              </Text>
            ) : sh ? (
              <CalcChart
                type={item.type}
                title=""
                data={rangeToSeries(sh, item.start, item.end)}
                showLegend={item.showLegend}
                width={cardW - 16}
                height={230}
              />
            ) : (
              <Text style={{ color: '#f87171' }}>Feuille introuvable</Text>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  sheetTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 4,
  },
  sheetTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sheetTabActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  sheetTabText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  sheetTabTextActive: { color: '#fff' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  viewBtnActive: { backgroundColor: '#a855f7' },
  viewBtnText: { color: '#a855f7', fontSize: 11, fontWeight: '700' },
  formulaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  formulaCellLabel: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 50,
    maxWidth: 110,
    backgroundColor: '#0f172a',
    paddingVertical: 4,
    paddingHorizontal: 6,
    textAlign: 'center',
    borderRadius: 4,
  },
  formulaInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  okBtn: { padding: 4 },
  toolbar: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 4,
    paddingHorizontal: 4,
    flexGrow: 0,
  },
  tool: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolWide: { paddingHorizontal: 12 },
  toolActive: { backgroundColor: '#a855f7', borderColor: '#a855f7' },
  toolText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row' },
  corner: {
    width: HEAD_W,
    height: 24,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  colHead: {
    width: CELL_W,
    height: 24,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  rowHead: {
    width: HEAD_W,
    height: CELL_H,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  headText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  cell: {
    width: CELL_W,
    height: CELL_H,
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  cellInSel: { borderColor: '#a855f7' },
  cellAnchor: { borderWidth: 2, borderColor: '#a855f7', zIndex: 1 },
  cellText: { fontSize: 12, color: '#f1f5f9', textAlign: 'center' },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  statusText: { color: '#94a3b8', fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: { backgroundColor: '#1e293b', borderRadius: 10, padding: 16, width: '100%', maxWidth: 420 },
  modalTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#475569' },
  swatchNone: { backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  chartPick: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  chartPickText: { color: '#e2e8f0', fontSize: 9, textAlign: 'center' },
  sparkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  sparkInput: {
    color: '#f1f5f9',
    backgroundColor: '#0f172a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 70,
  },
  promptInput: {
    color: '#f1f5f9',
    backgroundColor: '#0f172a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 12,
  },
  card: { backgroundColor: '#1e293b', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#334155' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  cardTitle: { color: '#f1f5f9', fontSize: 13, fontWeight: '700' },
  cardSub: { color: '#94a3b8', fontSize: 11, fontWeight: '400' },
});
