/**
 * Lightweight formula engine for CalcEditor.
 * Pure TS — no DOM dependencies.
 */

export function parseCellCoord(coord: string): { col: number; row: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(coord.toUpperCase());
  if (!m) return null;
  const colStr = m[1];
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  return { col: col - 1, row: parseInt(m[2], 10) - 1 };
}

export function coordToString(col: number, row: number): string {
  let c = col + 1;
  let colStr = '';
  while (c > 0) {
    const rem = (c - 1) % 26;
    colStr = String.fromCharCode(65 + rem) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  return `${colStr}${row + 1}`;
}

export function expandRange(
  start: string,
  end: string
): string[] {
  const s = parseCellCoord(start);
  const e = parseCellCoord(end);
  if (!s || !e) return [];
  const cells: string[] = [];
  const minC = Math.min(s.col, e.col);
  const maxC = Math.max(s.col, e.col);
  const minR = Math.min(s.row, e.row);
  const maxR = Math.max(s.row, e.row);
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      cells.push(coordToString(c, r));
    }
  }
  return cells;
}

export function splitArguments(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function getNumericValue(v: any): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function isFormula(s: string): boolean {
  return typeof s === 'string' && s.startsWith('=');
}

const FUNCS: Record<string, (args: number[]) => number> = {
  SUM: (a) => a.reduce((x, y) => x + y, 0),
  AVG: (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0),
  MIN: (a) => (a.length ? Math.min(...a) : 0),
  MAX: (a) => (a.length ? Math.max(...a) : 0),
  COUNT: (a) => a.length,
  ABS: (a) => Math.abs(a[0] || 0),
  ROUND: (a) => Math.round((a[0] || 0) * Math.pow(10, a[1] || 0)) / Math.pow(10, a[1] || 0),
  INT: (a) => Math.floor(a[0] || 0),
  SQRT: (a) => Math.sqrt(a[0] || 0),
};

export function evaluateFormula(
  formula: string,
  getCellValue: (coord: string) => string | number | undefined,
  visited: Set<string> = new Set()
): number | string {
  if (!isFormula(formula)) return formula;
  const expr = formula.slice(1).trim();

  function evalExpr(s: string): number | string {
    s = s.trim();
    if (s === '') return 0;

    // String literal
    if (/^".*"$/.test(s)) return s.slice(1, -1);

    // Number
    if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);

    // Function call
    const fnMatch = /^([A-Z]+)\((.*)\)$/i.exec(s);
    if (fnMatch) {
      const fn = fnMatch[1].toUpperCase();
      const argsRaw = fnMatch[2];
      const args = splitArguments(argsRaw);
      const nums: number[] = [];
      for (const a of args) {
        const v = evalExpr(a);
        if (typeof v === 'number') nums.push(v);
        else if (typeof v === 'string' && !isNaN(parseFloat(v))) {
          nums.push(parseFloat(v));
        }
      }
      if (FUNCS[fn]) return FUNCS[fn](nums);
      return 0;
    }

    // Range A1:B5
    const rangeMatch = /^([A-Z]+\d+):([A-Z]+\d+)$/i.exec(s);
    if (rangeMatch) {
      const cells = expandRange(rangeMatch[1], rangeMatch[2]);
      const nums: number[] = [];
      for (const c of cells) {
        if (visited.has(c)) continue;
        visited.add(c);
        const v = getCellValue(c);
        if (typeof v === 'number') nums.push(v);
        else if (typeof v === 'string' && !isNaN(parseFloat(v))) {
          nums.push(parseFloat(v));
        }
        visited.delete(c);
      }
      return nums;
    }

    // Single cell ref
    const cellMatch = /^([A-Z]+\d+)$/i.exec(s);
    if (cellMatch) {
      const coord = cellMatch[1].toUpperCase();
      if (visited.has(coord)) return 0;
      visited.add(coord);
      const v = getCellValue(coord);
      visited.delete(coord);
      if (v == null) return 0;
      if (typeof v === 'number') return v;
      const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
      return isNaN(n) ? 0 : n;
    }

    // Arithmetic: split on + - * / lowest precedence
    const tokens = tokenize(s);
    if (tokens.length === 1) {
      return evalExpr(tokens[0]);
    }
    return evalTokens(tokens, getCellValue, visited);
  }

  try {
    return evalExpr(expr);
  } catch (e) {
    return '#ERR';
  }
}

function tokenize(s: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth === 0 && (ch === '+' || ch === '-')) {
      if (cur.trim()) tokens.push(cur.trim());
      tokens.push(ch);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) tokens.push(cur.trim());
  return tokens;
}

function evalTokens(
  tokens: string[],
  getCellValue: (c: string) => string | number | undefined,
  visited: Set<string>
): number {
  let result = 0;
  let op: '+' | '-' | null = null;
  for (const t of tokens) {
    if (t === '+' || t === '-') {
      op = t;
    } else {
      const v = evaluateFormula('=' + t, getCellValue, visited);
      const n = typeof v === 'number' ? v : parseFloat(String(v)) || 0;
      if (op === null) result = n;
      else if (op === '+') result += n;
      else if (op === '-') result -= n;
    }
  }
  return result;
}

export function formatCellValue(value: any, format?: string): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (format === 'currency') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
    }
    if (format === 'percent') {
      return `${(value * 100).toFixed(1)}%`;
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}
