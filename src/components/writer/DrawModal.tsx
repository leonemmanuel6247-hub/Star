import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Polyline, Rect, Ellipse } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DocDrawing, Stroke } from './DocPreview';

const W = 400;
const H = 240;

type Tool = 'pen' | 'line' | 'rect' | 'ellipse';

const COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#fef08a'];
const WIDTHS = [2, 4, 8];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (drawing: DocDrawing) => void;
}

export default function DrawModal({ visible, onClose, onSave }: Props) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<DocDrawing['shapes']>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(4);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [draftShape, setDraftShape] = useState<DocDrawing['shapes'][number] | null>(null);
  const size = useRef({ w: 1, h: 1 });
  const origin = useRef({ x: 0, y: 0 });

  const toLocal = (px: number, py: number) => ({
    x: Math.max(0, Math.min(W, (px / size.current.w) * W)),
    y: Math.max(0, Math.min(H, (py / size.current.h) * H)),
  });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const p = toLocal(e.nativeEvent.locationX, e.nativeEvent.locationY);
        if (tool === 'pen') {
          setDraft({ color, width, points: [p] });
        } else {
          origin.current = p;
          setDraftShape({ kind: tool, color, width, x1: p.x, y1: p.y, x2: p.x, y2: p.y });
        }
      },
      onPanResponderMove: (e) => {
        const p = toLocal(e.nativeEvent.locationX, e.nativeEvent.locationY);
        if (tool === 'pen') {
          setDraft((d) => (d ? { ...d, points: [...d.points, p] } : d));
        } else {
          setDraftShape((d) => (d ? { ...d, x2: p.x, y2: p.y } : d));
        }
      },
      onPanResponderRelease: () => {
        if (tool === 'pen') {
          setDraft((d) => {
            if (d) setStrokes((s) => [...s, d]);
            return null;
          });
        } else {
          setDraftShape((d) => {
            if (d) setShapes((s) => [...s, d]);
            return null;
          });
        }
      },
      onPanResponderTerminate: () => {
        setDraft(null);
        setDraftShape(null);
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
  };

  const undo = () => {
    if (strokes.length > 0) setStrokes((s) => s.slice(0, -1));
    else if (shapes.length > 0) setShapes((s) => s.slice(0, -1));
  };

  const renderShape = (sh: DocDrawing['shapes'][number], key: string) => {
    const x = Math.min(sh.x1, sh.x2);
    const y = Math.min(sh.y1, sh.y2);
    const w = Math.abs(sh.x2 - sh.x1);
    const h = Math.abs(sh.y2 - sh.y1);
    if (sh.kind === 'line')
      return (
        <Polyline
          key={key}
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
          key={key}
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
        key={key}
        cx={x + w / 2}
        cy={y + h / 2}
        rx={Math.max(1, w / 2)}
        ry={Math.max(1, h / 2)}
        stroke={sh.color}
        strokeWidth={sh.width}
        fill="none"
      />
    );
  };

  const tools: Array<{ id: Tool; icon: string; label: string }> = [
    { id: 'pen', icon: 'pencil', label: 'Crayon' },
    { id: 'line', icon: 'slash-forward', label: 'Ligne' },
    { id: 'rect', icon: 'rectangle-outline', label: 'Rectangle' },
    { id: 'ellipse', icon: 'ellipse-outline', label: 'Ellipse' },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dessin à main levée</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable accessibilityRole="button"
              style={styles.saveBtn}
              onPress={() => {
                onSave({ strokes, shapes });
                setStrokes([]);
                setShapes([]);
              }}
            >
              <MaterialCommunityIcons name="check" size={16} color="#fff" />
              <Text style={styles.saveText}>Insérer</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Fermer</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.toolbar}>
          {tools.map((t) => (
            <Pressable accessibilityRole="button"
              key={t.id}
              style={[styles.toolBtn, tool === t.id && styles.toolBtnActive]}
              onPress={() => setTool(t.id)}
            >
              <MaterialCommunityIcons
                name={t.icon as never}
                size={18}
                color={tool === t.id ? '#fff' : '#334155'}
              />
              <Text style={[styles.toolLabel, tool === t.id && { color: '#fff' }]}>{t.label}</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" style={styles.toolBtn} onPress={undo}>
            <MaterialCommunityIcons name="undo" size={18} color="#334155" />
            <Text style={styles.toolLabel}>Annuler</Text>
          </Pressable>
          <Pressable accessibilityRole="button"
            style={styles.toolBtn}
            onPress={() => {
              setStrokes([]);
              setShapes([]);
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#334155" />
            <Text style={styles.toolLabel}>Effacer</Text>
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          {COLORS.map((c) => (
            <Pressable accessibilityRole="button"
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.swatch,
                { backgroundColor: c },
                color === c && styles.swatchActive,
              ]}
            />
          ))}
          <View style={styles.divider} />
          {WIDTHS.map((w) => (
            <Pressable accessibilityRole="button"
              key={w}
              onPress={() => setWidth(w)}
              style={[styles.widthBtn, width === w && styles.toolBtnActive]}
            >
              <View style={{ width: w * 2, height: w * 2, borderRadius: w, backgroundColor: width === w ? '#fff' : '#334155' }} />
            </Pressable>
          ))}
        </View>

        <View style={styles.canvasWrap}>
          <View style={styles.canvas} onLayout={onLayout} {...pan.panHandlers}>
            <Svg viewBox={`0 0 ${W} ${H}`} style={{ flex: 1 }} pointerEvents="none">
              {strokes.map((s, i) =>
                s.points.length > 1 ? (
                  <Polyline
                    key={i}
                    points={s.points.map((p) => `${p.x},${p.y}`).join(' ')}
                    stroke={s.color}
                    strokeWidth={s.width}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null
              )}
              {shapes.map((sh, i) => renderShape(sh, `s${i}`))}
              {draft && draft.points.length > 1 && (
                <Polyline
                  points={draft.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  stroke={draft.color}
                  strokeWidth={draft.width}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {draftShape && renderShape(draftShape, 'draft')}
            </Svg>
          </View>
          <Text style={styles.hint}>Dessinez du doigt ou à la souris dans le cadre ci-dessus.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2b579a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  closeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: '#e2e8f0' },
  closeText: { color: '#334155', fontWeight: '600' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexWrap: 'wrap',
  },
  toolBtn: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9' },
  toolBtnActive: { backgroundColor: '#2b579a' },
  toolLabel: { fontSize: 10, color: '#334155' },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#cbd5e1' },
  swatchActive: { borderWidth: 3, borderColor: '#2b579a' },
  widthBtn: { padding: 8, borderRadius: 6, backgroundColor: '#f1f5f9' },
  divider: { width: 1, height: 24, backgroundColor: '#cbd5e1', marginHorizontal: 4 },
  canvasWrap: { flex: 1, padding: 12 },
  canvas: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', overflow: 'hidden' },
  hint: { textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 8 },
});
