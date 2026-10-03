import type { CalcSheet } from '../../types/office';
import { parseCellCoord, coordToString } from '../../utils/calcEngine';

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartSeriesData {
  labels: string[];
  series: ChartSeries[];
}

function rawText(sheet: CalcSheet, coord: string): string {
  const v = sheet.data?.[coord]?.value;
  if (v === undefined || v === null) return '';
  return String(v);
}

function rawNumber(sheet: CalcSheet, coord: string): number | null {
  const v = sheet.data?.[coord]?.value;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    if (v.startsWith('=')) return null; // formules résolues par l'éditeur si besoin
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  return null;
}

function normRange(
  start: string,
  end: string
): { c0: number; r0: number; c1: number; r1: number } | null {
  const s = parseCellCoord(start);
  const e = parseCellCoord(end);
  if (!s || !e) return null;
  return {
    c0: Math.min(s.col, e.col),
    r0: Math.min(s.row, e.row),
    c1: Math.max(s.col, e.col),
    r1: Math.max(s.row, e.row),
  };
}

/**
 * Convertit une plage en labels + séries.
 * - Matrice ≥2×2 : 1re ligne = noms de séries, 1re colonne = labels.
 * - Colonne unique : labels = n° de ligne (1re cellule texte = nom de série).
 * - Ligne unique : labels = lettres de colonnes.
 */
export function rangeToSeries(
  sheet: CalcSheet,
  start: string,
  end: string
): ChartSeriesData {
  const empty: ChartSeriesData = { labels: [], series: [] };
  const r = normRange(start, end);
  if (!r) return empty;
  const nCols = r.c1 - r.c0 + 1;
  const nRows = r.r1 - r.r0 + 1;

  if (nCols >= 2 && nRows >= 2) {
    const labels: string[] = [];
    for (let rr = r.r0 + 1; rr <= r.r1; rr++) {
      const t = rawText(sheet, coordToString(r.c0, rr));
      labels.push(t !== '' ? t : String(rr + 1));
    }
    const series: ChartSeries[] = [];
    for (let cc = r.c0 + 1; cc <= r.c1; cc++) {
      const head = rawText(sheet, coordToString(cc, r.r0));
      const values: number[] = [];
      for (let rr = r.r0 + 1; rr <= r.r1; rr++) {
        values.push(rawNumber(sheet, coordToString(cc, rr)) ?? 0);
      }
      series.push({ name: head !== '' ? head : `Série ${cc - r.c0}`, values });
    }
    return { labels, series };
  }

  if (nCols === 1 && nRows >= 2) {
    const head = rawText(sheet, coordToString(r.c0, r.r0));
    const headIsText = head !== '' && rawNumber(sheet, coordToString(r.c0, r.r0)) === null;
    const first = headIsText ? r.r0 + 1 : r.r0;
    const labels: string[] = [];
    const values: number[] = [];
    for (let rr = first; rr <= r.r1; rr++) {
      labels.push(String(rr + 1));
      values.push(rawNumber(sheet, coordToString(r.c0, rr)) ?? 0);
    }
    return { labels, series: [{ name: headIsText ? head : 'Série 1', values }] };
  }

  if (nRows === 1 && nCols >= 2) {
    const head = rawText(sheet, coordToString(r.c0, r.r0));
    const headIsText = head !== '' && rawNumber(sheet, coordToString(r.c0, r.r0)) === null;
    const first = headIsText ? r.c0 + 1 : r.c0;
    const labels: string[] = [];
    const values: number[] = [];
    for (let cc = first; cc <= r.c1; cc++) {
      labels.push(coordToString(cc, r.r0).replace(/[0-9]+$/, ''));
      values.push(rawNumber(sheet, coordToString(cc, r.r0)) ?? 0);
    }
    return { labels, series: [{ name: headIsText ? head : 'Série 1', values }] };
  }

  // Cellule unique
  const v = rawNumber(sheet, coordToString(r.c0, r.r0));
  return { labels: ['1'], series: [{ name: 'Série 1', values: [v ?? 0] }] };
}

/**
 * Devine la plage pour Σ (somme automatique) : nombres contigus au-dessus,
 * sinon à gauche de la cellule. Retourne null si rien trouvé.
 */
export function guessSumRange(
  sheet: CalcSheet,
  coord: string
): { start: string; end: string } | null {
  const p = parseCellCoord(coord);
  if (!p) return null;
  // Au-dessus
  let r = p.row - 1;
  const upCells: string[] = [];
  while (r >= 0) {
    const c = coordToString(p.col, r);
    if (rawNumber(sheet, c) === null) break;
    upCells.unshift(c);
    r--;
  }
  if (upCells.length) return { start: upCells[0], end: upCells[upCells.length - 1] };
  // À gauche
  let cIdx = p.col - 1;
  const leftCells: string[] = [];
  while (cIdx >= 0) {
    const c = coordToString(cIdx, p.row);
    if (rawNumber(sheet, c) === null) break;
    leftCells.unshift(c);
    cIdx--;
  }
  if (leftCells.length) return { start: leftCells[0], end: leftCells[leftCells.length - 1] };
  return null;
}

/** Statistiques Σ / moyenne sur une liste de coords (barre d'état). */
export function selectionStats(
  sheet: CalcSheet,
  coords: string[]
): { sum: number; avg: number; count: number } {
  let sum = 0;
  let count = 0;
  for (const c of coords) {
    const n = rawNumber(sheet, c);
    if (n !== null) {
      sum += n;
      count++;
    }
  }
  return { sum, avg: count ? sum / count : 0, count };
}
