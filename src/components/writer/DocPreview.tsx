import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import Svg, { Polyline, Rect, Ellipse, Text as SvgText } from 'react-native-svg';
import { parseBlocks, parseInline, Block, InlineSeg } from './format';

export interface DocImage {
  id: string;
  uri: string;
}

export interface Stroke {
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

export interface DocDrawing {
  strokes: Stroke[];
  shapes: Array<{
    kind: 'line' | 'rect' | 'ellipse';
    color: string;
    width: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
}

export interface DocChart {
  id: string;
  title: string;
  values: number[];
  labels: string[];
}

export type TextEffect = 'none' | 'ombre' | 'lueur';

interface Props {
  text: string;
  font: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  paraGap: number;
  header?: string;
  footer?: string;
  pageNumbers?: boolean;
  columns?: number;
  lineNumbers?: boolean;
  images: DocImage[];
  drawings: DocDrawing[];
  charts: DocChart[];
  pageColor?: string;
  effect?: TextEffect;
  pages?: number;
  hlColor?: string;
}

const EFFECT_STYLE: Record<TextEffect, object> = {
  none: {},
  ombre: { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 },
  lueur: { textShadowColor: 'rgba(43,87,154,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 },
};

function SegText({ seg, base, hl }: { seg: InlineSeg; base: object; hl?: string }) {
  return (
    <Text
      style={[
        base,
        seg.bold && { fontWeight: 'bold' as const },
        seg.italic && { fontStyle: 'italic' as const },
        seg.underline && { textDecorationLine: 'underline' as const },
        seg.strike && { textDecorationLine: 'line-through' as const },
        seg.underline && seg.strike && { textDecorationLine: 'underline line-through' as const },
        seg.code && styles.code,
        seg.sub && { fontSize: 10 },
        seg.sup && { fontSize: 10 },
        seg.highlight && { backgroundColor: hl || '#fef08a' },
        seg.field && styles.field,
        seg.link && { color: '#2b579a' },
      ]}
    >
      {seg.text}
    </Text>
  );
}

function DrawingView({ drawing }: { drawing: DocDrawing }) {
  return (
    <View style={styles.drawingBox}>
      <Svg viewBox="0 0 400 240" style={{ width: '100%', height: 180 }}>
        {drawing.strokes.map((s, i) =>
          s.points.length > 1 ? (
            <Polyline
              key={`s${i}`}
              points={s.points.map((p) => `${p.x},${p.y}`).join(' ')}
              stroke={s.color}
              strokeWidth={s.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : s.points.length === 1 ? (
            <Rect
              key={`s${i}`}
              x={s.points[0].x - s.width / 2}
              y={s.points[0].y - s.width / 2}
              width={s.width}
              height={s.width}
              fill={s.color}
            />
          ) : null
        )}
        {drawing.shapes.map((sh, i) => {
          const x = Math.min(sh.x1, sh.x2);
          const y = Math.min(sh.y1, sh.y2);
          const w = Math.abs(sh.x2 - sh.x1);
          const h = Math.abs(sh.y2 - sh.y1);
          if (sh.kind === 'line')
            return (
              <Polyline
                key={`h${i}`}
                points={`${sh.x1},${sh.y1} ${sh.x2},${sh.y2}`}
                stroke={sh.color}
                strokeWidth={sh.width}
                fill="none"
                strokeLinecap="round"
              />
            );
          if (sh.kind === 'rect')
            return (
              <Rect
                key={`h${i}`}
                x={x}
                y={y}
                width={w}
                height={h}
                stroke={sh.color}
                strokeWidth={sh.width}
                fill="none"
              />
            );
          return (
            <Ellipse
              key={`h${i}`}
              cx={x + w / 2}
              cy={y + h / 2}
              rx={Math.max(1, w / 2)}
              ry={Math.max(1, h / 2)}
              stroke={sh.color}
              strokeWidth={sh.width}
              fill="none"
            />
          );
        })}
      </Svg>
    </View>
  );
}

function ChartView({ chart }: { chart: DocChart }) {
  const max = Math.max(1, ...chart.values);
  const W = 360;
  const H = 160;
  const bw = Math.min(48, (W - 40) / Math.max(1, chart.values.length) - 12);
  const colors = ['#2b579a', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2'];
  return (
    <View style={styles.chartBox}>
      <Text style={styles.chartTitle}>{chart.title}</Text>
      <Svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', height: 190 }}>
        {chart.values.map((v, i) => {
          const h = Math.max(4, (v / max) * H);
          const x = 30 + i * (bw + 12);
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={H - h + 10} width={bw} height={h} fill={colors[i % colors.length]} rx={3} />
              <SvgText x={x + bw / 2} y={H - h} fontSize="11" fill="#334155" textAnchor="middle">
                {String(v)}
              </SvgText>
              <SvgText x={x + bw / 2} y={H + 24} fontSize="11" fill="#64748b" textAnchor="middle">
                {(chart.labels[i] || `V${i + 1}`).slice(0, 10)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default function DocPreview(p: Props) {
  const blocks = useMemo(() => parseBlocks(p.text), [p.text]);
  const effect = EFFECT_STYLE[p.effect || 'none'];
  const base = useMemo(
    () => ({
      fontFamily: p.font as never,
      fontSize: p.fontSize,
      color: p.color,
      lineHeight: Math.round(p.fontSize * p.lineHeight),
      textAlign: p.align,
      ...effect,
    }),
    [p.font, p.fontSize, p.color, p.lineHeight, p.align, effect]
  );

  const renderBlock = (b: Block, key: number) => {
    switch (b.kind) {
      case 'heading':
        return (
          <Text
            key={key}
            style={[
              base,
              {
                fontSize: b.level === 1 ? p.fontSize + 10 : b.level === 2 ? p.fontSize + 6 : p.fontSize + 2,
                fontWeight: 'bold' as const,
                color: '#1e3a8a',
                marginTop: 10,
                marginBottom: 4,
              },
            ]}
          >
            {parseInline(b.text).map((s, i) => (
              <SegText key={i} seg={s} base={{}} hl={p.hlColor} />
            ))}
          </Text>
        );
      case 'bullet':
        return (
          <View key={key} style={{ marginVertical: 2 }}>
            {b.items.map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', paddingRight: 8 }}>
                <Text style={[base, { width: 18 }]}>•</Text>
                <Text style={[base, { flex: 1 }]}>
                  {parseInline(it).map((s, j) => (
                    <SegText key={j} seg={s} base={{}} hl={p.hlColor} />
                  ))}
                </Text>
              </View>
            ))}
          </View>
        );
      case 'number':
        return (
          <View key={key} style={{ marginVertical: 2 }}>
            {b.items.map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', paddingRight: 8 }}>
                <Text style={[base, { width: 24 }]}>{i + 1}.</Text>
                <Text style={[base, { flex: 1 }]}>
                  {parseInline(it).map((s, j) => (
                    <SegText key={j} seg={s} base={{}} hl={p.hlColor} />
                  ))}
                </Text>
              </View>
            ))}
          </View>
        );
      case 'quote':
        return (
          <View key={key} style={styles.quote}>
            <Text style={[base, { fontStyle: 'italic' as const, color: '#475569' }]}>
              {parseInline(b.text).map((s, i) => (
                <SegText key={i} seg={s} base={{}} hl={p.hlColor} />
              ))}
            </Text>
          </View>
        );
      case 'textbox':
        return (
          <View key={key} style={styles.textbox}>
            <Text style={base}>
              {parseInline(b.text).map((s, i) => (
                <SegText key={i} seg={s} base={{}} hl={p.hlColor} />
              ))}
            </Text>
          </View>
        );
      case 'table': {
        const colCount = Math.max(...b.rows.map((r) => r.length), 1);
        return (
          <View key={key} style={styles.table}>
            {b.rows.map((r, ri) => (
              <View key={ri} style={styles.tableRow}>
                {Array.from({ length: colCount }).map((_, ci) => (
                  <View
                    key={ci}
                    style={[styles.tableCell, ri === 0 && styles.tableHeaderCell]}
                  >
                    <Text style={[base, { fontSize: p.fontSize - 1 }, ri === 0 && { fontWeight: 'bold' as const }]}>
                      {parseInline(r[ci] || '').map((s, i) => (
                        <SegText key={i} seg={s} base={{}} hl={p.hlColor} />
                      ))}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      }
      case 'hr':
        return <View key={key} style={styles.hr} />;
      case 'pagebreak':
        return (
          <View key={key} style={styles.pagebreak}>
            <Text style={styles.pagebreakLabel}>— Saut de page —</Text>
          </View>
        );
      case 'sectionbreak':
        return (
          <View key={key} style={styles.sectionbreak}>
            <Text style={styles.pagebreakLabel}>═══ Nouvelle section ═══</Text>
          </View>
        );
      case 'footnote':
        return (
          <Text key={key} style={[base, { fontSize: p.fontSize - 2, color: '#64748b' }]}>
            <Text style={{ fontSize: 10 }}>^{b.n} </Text>
            {parseInline(b.text).map((s, i) => (
              <SegText key={i} seg={s} base={{}} hl={p.hlColor} />
            ))}
          </Text>
        );
      case 'image': {
        const img = p.images.find((x) => x.id === b.id);
        return img ? (
          <Image key={key} source={{ uri: img.uri }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text key={key} style={[base, { color: '#94a3b8' }]}>
            [Image introuvable : {b.id}]
          </Text>
        );
      }
      case 'drawing': {
        const d = p.drawings[b.n - 1];
        return d ? (
          <View key={key}>
            <DrawingView drawing={d} />
          </View>
        ) : (
          <Text key={key} style={[base, { color: '#94a3b8' }]}>
            [Dessin {b.n} introuvable]
          </Text>
        );
      }
      case 'chart': {
        const c = p.charts.find((x) => x.id === b.id);
        return c ? (
          <View key={key}>
            <ChartView chart={c} />
          </View>
        ) : (
          <Text key={key} style={[base, { color: '#94a3b8' }]}>
            [Graphique introuvable]
          </Text>
        );
      }
      default:
        return (
          <Text key={key} style={[base, { marginBottom: p.paraGap }]}>
            {parseInline((b as { text: string }).text).map((s, i) => (
              <SegText key={i} seg={s} base={{}} hl={p.hlColor} />
            ))}
          </Text>
        );
    }
  };

  const content =
    p.columns === 2 ? (
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flex: 1 }}>
          {blocks.filter((_, i) => i % 2 === 0).map((b, i) => renderBlock(b, i * 2))}
        </View>
        <View style={{ flex: 1 }}>
          {blocks.filter((_, i) => i % 2 === 1).map((b, i) => renderBlock(b, i * 2 + 1))}
        </View>
      </View>
    ) : (
      <>{blocks.map((b, i) => renderBlock(b, i))}</>
    );

  return (
    <ScrollView style={[styles.container, p.pageColor ? { backgroundColor: p.pageColor } : null]}>
      {!!p.header && <Text style={styles.header}>{p.header}</Text>}
      <View style={{ flexDirection: 'row' }}>
        {!!p.lineNumbers && (
          <View style={styles.gutter}>
            {blocks.map((_, i) => (
              <Text key={i} style={styles.gutterNum}>
                {i + 1}
              </Text>
            ))}
          </View>
        )}
        <View style={{ flex: 1 }}>{content}</View>
      </View>
      {!!(p.footer || p.pageNumbers) && (
        <Text style={styles.footer}>
          {[p.footer, p.pageNumbers ? `Page 1 sur ${p.pages || 1}` : ''].filter(Boolean).join(' — ')}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', padding: 20 },
  header: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
    marginBottom: 12,
  },
  footer: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 8,
    marginTop: 12,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#2b579a',
    paddingLeft: 10,
    marginVertical: 6,
  },
  textbox: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
    backgroundColor: '#f8fafc',
  },
  table: { borderWidth: 1, borderColor: '#94a3b8', marginVertical: 6 },
  tableRow: { flexDirection: 'row' },
  tableCell: {
    flex: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#94a3b8',
    padding: 6,
  },
  tableHeaderCell: { backgroundColor: '#e2e8f0' },
  hr: { borderTopWidth: 1, borderTopColor: '#94a3b8', marginVertical: 10 },
  pagebreak: { borderTopWidth: 1, borderTopColor: '#cbd5e1', borderStyle: 'dashed', marginVertical: 10, paddingTop: 4 },
  pagebreakLabel: { textAlign: 'center', color: '#94a3b8', fontSize: 11 },
  sectionbreak: { borderTopWidth: 2, borderTopColor: '#2b579a', marginVertical: 12, paddingTop: 4 },
  code: { fontFamily: 'monospace', backgroundColor: '#f1f5f9', fontSize: 12 },
  field: { backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#eab308' },
  image: { width: '100%', height: 220, marginVertical: 8, backgroundColor: '#f1f5f9' },
  drawingBox: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, marginVertical: 8, backgroundColor: '#fff' },
  chartBox: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, marginVertical: 8, padding: 8, backgroundColor: '#fff' },
  chartTitle: { fontWeight: 'bold', color: '#1e293b', marginBottom: 4, textAlign: 'center' },
  gutter: { width: 28, marginRight: 8, borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  gutterNum: { fontSize: 10, color: '#94a3b8', textAlign: 'right', paddingRight: 4, lineHeight: 20 },
});
