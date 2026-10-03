import React from 'react';
import Svg, { Rect, Line, Polyline, Polygon, Circle, Text as SText, Path, G } from 'react-native-svg';
import type { CalcChartType } from '../../types/office';
import type { ChartSeriesData } from './chartData';

export const CHART_COLORS = [
  '#2b579a', '#e67e22', '#27ae60', '#c0392b',
  '#8e44ad', '#16a085', '#d35400', '#7f8c8d',
];

interface Props {
  type: CalcChartType;
  title: string;
  data: ChartSeriesData;
  showLegend?: boolean;
  width: number;
  height: number;
}

const AX = '#64748b'; // axes / grille
const TX = '#e2e8f0'; // texte

function fmtTick(v: number): string {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1000000) return `${Math.round(v / 100000) / 10}M`;
  if (a >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v * 10) / 10);
}

function niceBounds(min: number, max: number): { lo: number; hi: number; step: number } {
  if (min === max) {
    if (min === 0) { min = 0; max = 1; }
    else { const d = Math.abs(min) * 0.2 || 1; min -= d; max += d; }
  }
  const span = max - min;
  const raw = span / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
  return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step };
}

function short(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export default function CalcChart({ type, title, data, showLegend = true, width, height }: Props) {
  if (type === 'spark') return <Sparkline data={data} width={width} height={height} />;
  if (type === 'pie') {
    return (
      <Svg width={width} height={height}>
        <ChartTitle title={title} width={width} />
        <PieChart data={data} width={width} height={height - 20} y0={20} showLegend={showLegend} />
      </Svg>
    );
  }
  if (type === 'scatter') {
    return (
      <Svg width={width} height={height}>
        <ChartTitle title={title} width={width} />
        <ScatterChart data={data} width={width} height={height - 20} y0={20} showLegend={showLegend} />
      </Svg>
    );
  }
  return (
    <Svg width={width} height={height}>
      <ChartTitle title={title} width={width} />
      <CartesianChart type={type} data={data} width={width} height={height - 20} y0={20} showLegend={showLegend} />
    </Svg>
  );
}

function ChartTitle({ title, width }: { title: string; width: number }) {
  if (!title) return null;
  return (
    <SText x={width / 2} y={13} fill={TX} fontSize={12} fontWeight="700" textAnchor="middle">
      {short(title, 40)}
    </SText>
  );
}

function Legend({ items, width, y }: { items: { name: string; color: string }[]; width: number; y: number }) {
  const maxW = width - 8;
  let x = 8;
  const rows: { name: string; color: string; x: number; y: number }[] = [];
  let yy = y;
  for (const it of items.slice(0, 8)) {
    const w = Math.min(it.name.length, 12) * 6 + 16;
    if (x + w > maxW && x > 8) {
      x = 8;
      yy += 13;
    }
    rows.push({ ...it, x, y: yy });
    x += w;
  }
  return (
    <G>
      {rows.map((r, i) => (
        <G key={i}>
          <Circle cx={r.x + 4} cy={r.y + 3} r={4} fill={r.color} />
          <SText x={r.x + 11} y={r.y + 7} fill={TX} fontSize={9}>
            {short(r.name, 12)}
          </SText>
        </G>
      ))}
    </G>
  );
}

// ── Graphiques cartésiens : bar / hbar / line / area / combo ──

function CartesianChart({
  type, data, width, height, y0, showLegend,
}: {
  type: CalcChartType; data: ChartSeriesData; width: number; height: number; y0: number; showLegend: boolean;
}) {
  const legendH = showLegend && data.series.length > 1 ? 16 : 0;
  const padL = type === 'hbar' ? 64 : 38;
  const padB = 20 + legendH;
  const padT = 6;
  const padR = 8;
  const W = width - padL - padR;
  const H = height - padT - padB;
  if (W < 40 || H < 40 || !data.labels.length || !data.series.length) {
    return (
      <SText x={width / 2} y={y0 + height / 2} fill={AX} fontSize={11} textAnchor="middle">
        Pas de données
      </SText>
    );
  }
  const n = data.labels.length;
  const m = data.series.length;
  const all = data.series.flatMap((s) => s.values);
  const horizontal = type === 'hbar';

  if (horizontal) {
    const { lo, hi } = niceBounds(Math.min(0, ...all), Math.max(0, ...all));
    const X = (v: number) => padL + ((v - lo) / (hi - lo || 1)) * W;
    const slot = H / n;
    const bh = Math.min(14, (slot / m) * 0.7);
    const x0 = X(0);
    return (
      <G y={y0}>
        {[0, 1, 2, 3, 4].map((i) => {
          const v = lo + ((hi - lo) * i) / 4;
          return (
            <G key={i}>
              <Line x1={X(v)} y1={padT} x2={X(v)} y2={padT + H} stroke={AX} strokeWidth={0.5} opacity={0.4} />
              <SText x={X(v)} y={padT + H + 12} fill={AX} fontSize={8} textAnchor="middle">
                {fmtTick(v)}
              </SText>
            </G>
          );
        })}
        {data.labels.map((lb, i) => (
          <SText key={i} x={padL - 4} y={padT + slot * i + slot / 2 + 3} fill={TX} fontSize={9} textAnchor="end">
            {short(lb, 10)}
          </SText>
        ))}
        {data.series.map((s, si) =>
          s.values.map((v, i) => {
            const y = padT + slot * i + slot / 2 - (m * bh) / 2 + si * bh;
            const x = Math.min(x0, X(v));
            return (
              <Rect key={`${si}-${i}`} x={x} y={y} width={Math.max(1, Math.abs(X(v) - x0))} height={bh} fill={CHART_COLORS[si % CHART_COLORS.length]} rx={1} />
            );
          })
        )}
        {showLegend && m > 1 && (
          <Legend items={data.series.map((s, i) => ({ name: s.name, color: CHART_COLORS[i % CHART_COLORS.length] }))} width={width} y={padT + H + 16} />
        )}
      </G>
    );
  }

  const { lo, hi } = niceBounds(Math.min(0, ...all), Math.max(0, ...all));
  const Y = (v: number) => padT + H - ((v - lo) / (hi - lo || 1)) * H;
  const slot = W / n;
  const y0line = Y(0);
  const ticks = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * i) / 4);
  const isLine = (si: number) => type === 'line' || type === 'area' || (type === 'combo' && si > 0);

  return (
    <G y={y0}>
      {ticks.map((t, i) => (
        <G key={i}>
          <Line x1={padL} y1={Y(t)} x2={padL + W} y2={Y(t)} stroke={AX} strokeWidth={0.5} opacity={0.4} />
          <SText x={padL - 3} y={Y(t) + 3} fill={AX} fontSize={8} textAnchor="end">
            {fmtTick(t)}
          </SText>
        </G>
      ))}
      {data.labels.map((lb, i) =>
        n <= 12 || i % Math.ceil(n / 12) === 0 ? (
          <SText key={i} x={padL + slot * i + slot / 2} y={padT + H + 12} fill={AX} fontSize={8} textAnchor="middle">
            {short(lb, n > 8 ? 4 : 8)}
          </SText>
        ) : null
      )}
      <Line x1={padL} y1={y0line} x2={padL + W} y2={y0line} stroke={AX} strokeWidth={1} />
      {/* barres */}
      {(type === 'bar' || type === 'combo') &&
        data.series.map((s, si) => {
          if (isLine(si)) return null;
          const bw = Math.min(22, (slot / m) * 0.65);
          return s.values.map((v, i) => {
            const cx = padL + slot * i + slot / 2;
            const x = cx - (m * bw) / 2 + si * bw;
            const y = Math.min(y0line, Y(v));
            return (
              <Rect key={`${si}-${i}`} x={x} y={y} width={Math.max(1, bw - 1)} height={Math.max(1, Math.abs(Y(v) - y0line))} fill={CHART_COLORS[si % CHART_COLORS.length]} rx={1} />
            );
          });
        })}
      {/* aires */}
      {type === 'area' &&
        data.series.map((s, si) => {
          const pts = s.values.map((v, i) => `${padL + slot * i + slot / 2},${Y(v)}`).join(' ');
          const base = `${padL + slot * (n - 1) + slot / 2},${y0line} ${padL + slot / 2},${y0line}`;
          const col = CHART_COLORS[si % CHART_COLORS.length];
          return (
            <G key={si}>
              <Polygon points={`${pts} ${base}`} fill={col} opacity={0.35} />
              <Polyline points={pts} fill="none" stroke={col} strokeWidth={2} />
            </G>
          );
        })}
      {/* courbes */}
      {(type === 'line' || type === 'combo') &&
        data.series.map((s, si) => {
          if (!isLine(si)) return null;
          const col = CHART_COLORS[si % CHART_COLORS.length];
          const pts = s.values.map((v, i) => `${padL + slot * i + slot / 2},${Y(v)}`).join(' ');
          return (
            <G key={si}>
              <Polyline points={pts} fill="none" stroke={col} strokeWidth={2} />
              {s.values.map((v, i) => (
                <Circle key={i} cx={padL + slot * i + slot / 2} cy={Y(v)} r={2.5} fill={col} />
              ))}
            </G>
          );
        })}
      {showLegend && m > 1 && (
        <Legend items={data.series.map((s, i) => ({ name: s.name, color: CHART_COLORS[i % CHART_COLORS.length] }))} width={width} y={padT + H + 16} />
      )}
    </G>
  );
}

// ── Secteurs ──

function PieChart({
  data, width, height, y0, showLegend,
}: {
  data: ChartSeriesData; width: number; height: number; y0: number; showLegend: boolean;
}) {
  const vals = data.series[0]?.values ?? [];
  const total = vals.reduce((a, b) => a + Math.max(0, b), 0);
  const cx = width / 2;
  const cy = y0 + (height - (showLegend ? 30 : 8)) / 2;
  const R = Math.min(width / 2 - 16, (height - (showLegend ? 34 : 12)) / 2);
  if (!vals.length || total <= 0 || R < 20) {
    return (
      <SText x={cx} y={cy} fill={AX} fontSize={11} textAnchor="middle">
        Pas de données
      </SText>
    );
  }
  let acc = -Math.PI / 2;
  const slices = vals.map((v, i) => {
    const frac = Math.max(0, v) / total;
    const a0 = acc;
    acc += frac * Math.PI * 2;
    return { a0, a1: acc, frac, color: CHART_COLORS[i % CHART_COLORS.length], label: data.labels[i] ?? `P${i + 1}` };
  });
  return (
    <G>
      {slices.map((s, i) => {
        if (s.frac <= 0) return null;
        const large = s.a1 - s.a0 > Math.PI ? 1 : 0;
        const x0 = cx + R * Math.cos(s.a0);
        const y0p = cy + R * Math.sin(s.a0);
        const x1 = cx + R * Math.cos(s.a1);
        const y1 = cy + R * Math.sin(s.a1);
        const mid = (s.a0 + s.a1) / 2;
        const lx = cx + R * 0.68 * Math.cos(mid);
        const ly = cy + R * 0.68 * Math.sin(mid);
        return (
          <G key={i}>
            <Path d={`M ${cx} ${cy} L ${x0} ${y0p} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`} fill={s.color} stroke="#0f172a" strokeWidth={1} />
            {s.frac > 0.06 && (
              <SText x={lx} y={ly} fill="#fff" fontSize={9} fontWeight="700" textAnchor="middle">
                {Math.round(s.frac * 100)}%
              </SText>
            )}
          </G>
        );
      })}
      {showLegend && (
        <Legend items={slices.map((s) => ({ name: s.label, color: s.color }))} width={width} y={cy + R + 8} />
      )}
    </G>
  );
}

// ── Nuage de points : série 0 = X (ou index), suivantes = Y ──

function ScatterChart({
  data, width, height, y0, showLegend,
}: {
  data: ChartSeriesData; width: number; height: number; y0: number; showLegend: boolean;
}) {
  const padL = 38;
  const padB = 20 + (showLegend && data.series.length > 1 ? 16 : 0);
  const W = width - padL - 8;
  const H = height - 6 - padB;
  const xs = data.series.length > 1 ? data.series[0].values : data.series[0]?.values.map((_, i) => i + 1) ?? [];
  const ys = data.series.length > 1 ? data.series.slice(1) : data.series;
  const allX = xs.length ? xs : [0];
  const allY = ys.flatMap((s) => s.values);
  if (!allY.length || W < 40 || H < 40) {
    return (
      <SText x={width / 2} y={y0 + height / 2} fill={AX} fontSize={11} textAnchor="middle">
        Pas de données
      </SText>
    );
  }
  const xb = niceBounds(Math.min(...allX), Math.max(...allX));
  const yb = niceBounds(Math.min(...allY), Math.max(...allY));
  const X = (v: number) => padL + ((v - xb.lo) / (xb.hi - xb.lo || 1)) * W;
  const Y = (v: number) => 6 + H - ((v - yb.lo) / (yb.hi - yb.lo || 1)) * H;
  return (
    <G y={y0}>
      {[0, 1, 2, 3, 4].map((i) => {
        const t = yb.lo + ((yb.hi - yb.lo) * i) / 4;
        return (
          <G key={i}>
            <Line x1={padL} y1={Y(t)} x2={padL + W} y2={Y(t)} stroke={AX} strokeWidth={0.5} opacity={0.4} />
            <SText x={padL - 3} y={Y(t) + 3} fill={AX} fontSize={8} textAnchor="end">
              {fmtTick(t)}
            </SText>
          </G>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const t = xb.lo + ((xb.hi - xb.lo) * i) / 4;
        return (
          <SText key={i} x={X(t)} y={6 + H + 12} fill={AX} fontSize={8} textAnchor="middle">
            {fmtTick(t)}
          </SText>
        );
      })}
      {ys.map((s, si) =>
        s.values.map((v, i) => (
          <Circle key={`${si}-${i}`} cx={X(xs[i] ?? i)} cy={Y(v)} r={3.5} fill={CHART_COLORS[(si + (data.series.length > 1 ? 1 : 0)) % CHART_COLORS.length]} opacity={0.85} />
        ))
      )}
      {showLegend && data.series.length > 1 && (
        <Legend items={ys.map((s, i) => ({ name: s.name, color: CHART_COLORS[(i + 1) % CHART_COLORS.length] }))} width={width} y={6 + H + 16} />
      )}
    </G>
  );
}

// ── Sparkline : mini courbe/aire sans axes ──

function Sparkline({ data, width, height }: { data: ChartSeriesData; width: number; height: number }) {
  const vals = data.series[0]?.values ?? [];
  if (vals.length < 2) return null;
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const px = (i: number) => 2 + (i / (vals.length - 1)) * (width - 4);
  const py = (v: number) => 2 + (1 - (v - lo) / span) * (height - 4);
  const pts = vals.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const last = vals[vals.length - 1];
  return (
    <Svg width={width} height={height}>
      <Polygon points={`${pts} ${px(vals.length - 1)},${height} ${px(0)},${height}`} fill="#2b579a" opacity={0.3} />
      <Polyline points={pts} fill="none" stroke="#2b579a" strokeWidth={1.5} />
      <Circle cx={px(vals.length - 1)} cy={py(last)} r={2.5} fill="#c0392b" />
    </Svg>
  );
}
