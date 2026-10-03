/**
 * Moteur de formules Calc — français (style Excel FR).
 * Pur TS, sans dépendance DOM.
 *
 * Conventions : fonctions SOMME/MOYENNE/MAX/MIN/NB/NBVAL/SI/ET/OU (+VRAI/FAUX),
 * séparateur d'arguments « ; », décimales « , » ou « . », références absolues $A$1.
 */

export type CalcValue = number | string | boolean;

const ERR_DIV0 = '#DIV/0!';
const ERR_VALEUR = '#VALEUR!';
const ERR_NOM = '#NOM?';
const ERR_REF = '#REF!';

export function isError(v: CalcValue): boolean {
  return typeof v === 'string' && v.startsWith('#');
}

export function parseCellCoord(coord: string): { col: number; row: number } | null {
  const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(coord.toUpperCase());
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

const RANGE_CAP = 1000000;

export function expandRange(start: string, end: string): string[] {
  const s = parseCellCoord(start);
  const e = parseCellCoord(end);
  if (!s || !e) return [];
  const minC = Math.min(s.col, e.col);
  const maxC = Math.max(s.col, e.col);
  const minR = Math.min(s.row, e.row);
  const maxR = Math.max(s.row, e.row);
  if ((maxC - minC + 1) * (maxR - minR + 1) > RANGE_CAP) return [];
  const cells: string[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      cells.push(coordToString(c, r));
    }
  }
  return cells;
}

/** Découpe les arguments sur « ; » en respectant parenthèses et chaînes "...". */
export function splitArguments(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inStr = false;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      // "" échappé dans une chaîne
      if (inStr && s[i + 1] === '"') {
        cur += '""';
        i++;
        continue;
      }
      inStr = !inStr;
      cur += ch;
      continue;
    }
    if (!inStr && ch === '(') depth++;
    else if (!inStr && ch === ')') depth--;
    if (!inStr && depth === 0 && ch === ';') {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim() !== '' || out.length > 0) out.push(cur.trim());
  return out;
}

export function getNumericValue(v: unknown): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = parseFloat(String(v).replace(',', '.').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function isFormula(s: unknown): boolean {
  return typeof s === 'string' && s.startsWith('=');
}

function toNumber(v: CalcValue): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') {
    if (v.trim() === '') return null;
    const n = parseFloat(v.replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  return null;
}

function toBoolean(v: CalcValue): boolean | null {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const t = v.trim().toUpperCase();
    if (t === 'VRAI') return true;
    if (t === 'FAUX' || t === '') return false;
    const n = parseFloat(t.replace(',', '.'));
    if (!isNaN(n)) return n !== 0;
  }
  return null;
}

function toText(v: CalcValue): string {
  if (typeof v === 'boolean') return v ? 'VRAI' : 'FAUX';
  return String(v);
}

/** Nombre pour les stats : nombre, booléen, ou texte d'allure numérique. */
function statNumber(v: CalcValue): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseFloat(v.replace(',', '.'));
    if (!isNaN(n)) return n;
  }
  return null;
}

function compareValues(a: CalcValue, b: CalcValue): number {
  if (typeof a === 'number' && typeof b === 'number') return a < b ? -1 : a > b ? 1 : 0;
  // Excel : texte > nombre ; comparaison insensible à la casse
  if (typeof a === 'number') return -1;
  if (typeof b === 'number') return 1;
  const sa = toText(a).toLowerCase();
  const sb = toText(b).toLowerCase();
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

type CellGetter = (coord: string) => string | number | boolean | undefined;

interface EvalArg {
  values: CalcValue[]; // valeurs aplaties (plages incluses)
  countAll: number; // NBVAL : nombre d'arguments non vides (directs)
  hasEmpty: boolean;
}

class Parser {
  private pos = 0;
  constructor(
    private readonly text: string,
    private readonly getCell: CellGetter,
    private readonly visited: Set<string>
  ) {}

  parse(): CalcValue {
    const v = this.parseComparison();
    this.skipSpaces();
    if (this.pos < this.text.length) throw new Error(ERR_VALEUR);
    return v;
  }

  private skipSpaces(): void {
    while (this.text[this.pos] === ' ') this.pos++;
  }

  private peek(): string {
    return this.text[this.pos] || '';
  }

  private parseComparison(): CalcValue {
    let left = this.parseConcat();
    for (;;) {
      this.skipSpaces();
      const two = this.text.substr(this.pos, 2);
      let op: string | null = null;
      if (two === '<>' || two === '<=' || two === '>=') op = two;
      else if (this.peek() === '=' || this.peek() === '<' || this.peek() === '>') op = this.peek();
      if (!op) return left;
      this.pos += op.length;
      const right = this.parseConcat();
      if (isError(left)) return left;
      if (isError(right)) return right;
      const c = compareValues(left, right);
      left =
        op === '='
          ? c === 0
          : op === '<>'
            ? c !== 0
            : op === '<'
              ? c < 0
              : op === '>'
                ? c > 0
                : op === '<='
                  ? c <= 0
                  : c >= 0;
    }
  }

  private parseConcat(): CalcValue {
    let left = this.parseAdd();
    for (;;) {
      this.skipSpaces();
      if (this.peek() !== '&') return left;
      this.pos++;
      const right = this.parseAdd();
      if (isError(left)) return left;
      if (isError(right)) return right;
      left = toText(left) + toText(right);
    }
  }

  private parseAdd(): CalcValue {
    let left = this.parseMul();
    for (;;) {
      this.skipSpaces();
      const ch = this.peek();
      if (ch !== '+' && ch !== '-') return left;
      this.pos++;
      const right = this.parseMul();
      if (isError(left)) return left;
      if (isError(right)) return right;
      const a = toNumber(left);
      const b = toNumber(right);
      if (a === null || b === null) return ERR_VALEUR;
      left = ch === '+' ? a + b : a - b;
    }
  }

  private parseMul(): CalcValue {
    let left = this.parsePow();
    for (;;) {
      this.skipSpaces();
      const ch = this.peek();
      if (ch !== '*' && ch !== '/') return left;
      this.pos++;
      const right = this.parsePow();
      if (isError(left)) return left;
      if (isError(right)) return right;
      const a = toNumber(left);
      const b = toNumber(right);
      if (a === null || b === null) return ERR_VALEUR;
      if (ch === '/') {
        if (b === 0) return ERR_DIV0;
        left = a / b;
      } else {
        left = a * b;
      }
    }
  }

  private parsePow(): CalcValue {
    let left = this.parseUnary();
    this.skipSpaces();
    if (this.peek() === '^') {
      this.pos++;
      const right = this.parsePow(); // associatif à droite
      if (isError(left)) return left;
      if (isError(right)) return right;
      const a = toNumber(left);
      const b = toNumber(right);
      if (a === null || b === null) return ERR_VALEUR;
      const r = Math.pow(a, b);
      if (!isFinite(r) || isNaN(r)) return ERR_VALEUR;
      return r;
    }
    return left;
  }

  private parseUnary(): CalcValue {
    this.skipSpaces();
    const ch = this.peek();
    if (ch === '-') {
      this.pos++;
      const v = this.parseUnary();
      if (isError(v)) return v;
      const n = toNumber(v);
      return n === null ? ERR_VALEUR : -n;
    }
    if (ch === '+') {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePostfix();
  }

  private parsePostfix(): CalcValue {
    let v = this.parsePrimary();
    for (;;) {
      this.skipSpaces();
      if (this.peek() !== '%') return v;
      this.pos++;
      if (isError(v)) return v;
      const n = toNumber(v);
      if (n === null) return ERR_VALEUR;
      v = n / 100;
    }
  }

  private parsePrimary(): CalcValue {
    this.skipSpaces();
    const ch = this.peek();
    if (ch === '(') {
      this.pos++;
      const v = this.parseComparison();
      this.skipSpaces();
      if (this.peek() !== ')') throw new Error(ERR_VALEUR);
      this.pos++;
      return v;
    }
    if (ch === '"') return this.parseString();
    if (/[0-9]/.test(ch) || (ch === ',' || ch === '.') && /[0-9]/.test(this.text[this.pos + 1] || '')) {
      return this.parseNumber();
    }
    if (/[A-Za-zÀ-ÿ_$]/.test(ch)) return this.parseRefOrFunc();
    if (ch === '') throw new Error(ERR_VALEUR);
    throw new Error(ERR_VALEUR);
  }

  private parseString(): string {
    this.pos++; // "
    let out = '';
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (ch === '"') {
        if (this.text[this.pos + 1] === '"') {
          out += '"';
          this.pos += 2;
          continue;
        }
        this.pos++;
        return out;
      }
      out += ch;
      this.pos++;
    }
    throw new Error(ERR_VALEUR);
  }

  private parseNumber(): number {
    let num = '';
    let seenSep = false;
    while (this.pos < this.text.length) {
      const ch = this.text[this.pos];
      if (/[0-9]/.test(ch)) {
        num += ch;
        this.pos++;
      } else if ((ch === ',' || ch === '.') && !seenSep) {
        seenSep = true;
        num += '.';
        this.pos++;
      } else {
        break;
      }
    }
    return parseFloat(num || '0');
  }

  private parseRefOrFunc(): CalcValue {
    const start = this.pos;
    while (/[A-Za-zÀ-ÿ0-9_$.]/.test(this.peek())) this.pos++;
    const word = this.text.slice(start, this.pos);
    const upper = word.toUpperCase();
    this.skipSpaces();
    // Appel de fonction ?
    if (this.peek() === '(') {
      this.pos++;
      const args = this.parseCallArgs();
      return this.callFunc(upper, args);
    }
    // Constantes booléennes
    if (upper === 'VRAI') return true;
    if (upper === 'FAUX') return false;
    // Plage A1:B2 ?
    if (this.peek() === ':') {
      this.pos++;
      this.skipSpaces();
      const s2 = this.pos;
      while (/[A-Za-z0-9_$]/.test(this.peek())) this.pos++;
      const end = this.text.slice(s2, this.pos);
      return this.resolveRange(word, end);
    }
    // Référence simple
    if (/^\$?[A-Za-z]+\$?[0-9]+$/.test(word)) {
      return this.resolveCell(word.toUpperCase());
    }
    return ERR_NOM;
  }

  /** Lit les arguments bruts d'un appel (gère imbrication + chaînes), consomme ')'. */
  private parseCallArgs(): string[] {
    const args: string[] = [];
    let depth = 0;
    let inStr = false;
    let cur = '';
    for (;;) {
      if (this.pos >= this.text.length) throw new Error(ERR_VALEUR);
      const ch = this.text[this.pos];
      if (ch === '"') {
        if (inStr && this.text[this.pos + 1] === '"') {
          cur += '""';
          this.pos += 2;
          continue;
        }
        inStr = !inStr;
        cur += ch;
        this.pos++;
        continue;
      }
      if (!inStr && ch === '(') depth++;
      if (!inStr && ch === ')') {
        if (depth === 0) {
          this.pos++;
          break;
        }
        depth--;
      }
      if (!inStr && depth === 0 && ch === ';') {
        args.push(cur.trim());
        cur = '';
        this.pos++;
        continue;
      }
      cur += ch;
      this.pos++;
    }
    if (cur.trim() !== '' || args.length > 0) args.push(cur.trim());
    return args;
  }

  private evalArgText(t: string): CalcValue | { range: string[] } {
    const trimmed = t.trim();
    // Plage directe ?
    const rm = /^(\$?[A-Za-z]+\$?[0-9]+)\s*:\s*(\$?[A-Za-z]+\$?[0-9]+)$/.exec(trimmed);
    if (rm) {
      const cells = expandRange(rm[1], rm[2]);
      if (!cells.length) throw new Error(ERR_REF);
      return { range: cells };
    }
    const sub = new Parser(trimmed, this.getCell, this.visited);
    return sub.parse();
  }

  private resolveCell(coord: string): CalcValue {
    const norm = coord.replace(/\$/g, '');
    if (!parseCellCoord(norm)) return ERR_REF;
    if (this.visited.has(norm)) return ERR_REF;
    this.visited.add(norm);
    try {
      const raw = this.getCell(norm);
      if (raw === undefined || raw === null || raw === '') return 0;
      if (typeof raw === 'number' || typeof raw === 'boolean') return raw;
      const s = String(raw);
      if (isFormula(s)) {
        const sub = new Parser(s.slice(1), this.getCell, this.visited);
        return sub.parse();
      }
      return s;
    } finally {
      this.visited.delete(norm);
    }
  }

  private resolveRange(start: string, end: string): CalcValue {
    // Plage hors fonction (ex. =A1:B2 seul) : Excel refuse → #VALEUR!
    void start;
    void end;
    return ERR_VALEUR;
  }

  private collectValues(args: string[]): EvalArg {
    const values: CalcValue[] = [];
    let countAll = 0;
    let hasEmpty = false;
    for (const a of args) {
      if (a === '') {
        hasEmpty = true;
        continue;
      }
      // Référence seule vers une cellule vide → sentinelle vide (NB/NBVAL/MOYENNE l'ignorent)
      if (/^\$?[A-Za-z]+\$?[0-9]+$/.test(a)) {
        const raw = this.getCell(a.replace(/\$/g, '').toUpperCase());
        if (raw === undefined || raw === null || raw === '') {
          values.push('');
          continue;
        }
      }
      const v = this.evalArgText(a);
      if (typeof v === 'object' && v !== null && 'range' in v) {
        for (const c of (v as { range: string[] }).range) {
          const raw = this.getCell(c);
          if (raw === undefined || raw === null || raw === '') {
            values.push(''); // sentinelle vide : ignorée par NB/NBVAL/MOYENNE…
            continue;
          }
          const rv = this.resolveCell(c);
          if (isError(rv)) throw new Error(rv as string);
          values.push(rv);
        }
      } else {
        const val = v as CalcValue;
        if (isError(val)) throw new Error(val as string);
        values.push(val);
        if (!(typeof val === 'string' && val === '')) countAll++;
      }
    }
    return { values, countAll, hasEmpty };
  }

  private callFunc(name: string, args: string[]): CalcValue {
    try {
      switch (name) {
        case 'SOMME': {
          const { values } = this.collectValues(args);
          let total = 0;
          for (const v of values) {
            const n = statNumber(v);
            if (n !== null) total += n;
          }
          return total;
        }
        case 'MOYENNE': {
          const { values } = this.collectValues(args);
          const nums: number[] = [];
          for (const v of values) {
            const n = statNumber(v);
            if (n !== null) nums.push(n);
          }
          if (!nums.length) return ERR_DIV0;
          return nums.reduce((x, y) => x + y, 0) / nums.length;
        }
        case 'MAX': {
          const { values } = this.collectValues(args);
          const nums: number[] = [];
          for (const v of values) {
            const n = statNumber(v);
            if (n !== null) nums.push(n);
          }
          return nums.length ? Math.max(...nums) : 0;
        }
        case 'MIN': {
          const { values } = this.collectValues(args);
          const nums: number[] = [];
          for (const v of values) {
            const n = statNumber(v);
            if (n !== null) nums.push(n);
          }
          return nums.length ? Math.min(...nums) : 0;
        }
        case 'NB': {
          const { values } = this.collectValues(args);
          return values.filter((v) => statNumber(v) !== null).length;
        }
        case 'NBVAL': {
          const { values } = this.collectValues(args);
          return values.filter((v) => !(typeof v === 'string' && v === '')).length;
        }
        case 'SI': {
          if (args.length < 2 || args.length > 3) return ERR_VALEUR;
          const c = this.evalArgText(args[0]) as CalcValue;
          if (isError(c)) return c;
          const b = toBoolean(c);
          if (b === null) return ERR_VALEUR;
          if (b) return this.evalArgText(args[1]) as CalcValue;
          if (args.length === 3) return this.evalArgText(args[2]) as CalcValue;
          return false;
        }
        case 'ET':
        case 'OU': {
          if (!args.length) return ERR_VALEUR;
          const isAnd = name === 'ET';
          for (const a of args) {
            const ev = this.evalArgText(a);
            const vals: CalcValue[] =
              typeof ev === 'object' && ev !== null && 'range' in ev
                ? (ev as { range: string[] }).range.map((c) => this.resolveCell(c))
                : [ev as CalcValue];
            for (const v of vals) {
              if (isError(v)) return v;
              if (typeof v === 'string' && v === '') continue; // vide ignoré
              const b = toBoolean(v);
              if (b === null) return ERR_VALEUR;
              if (isAnd && !b) return false;
              if (!isAnd && b) return true;
            }
          }
          return isAnd;
        }
        case 'VRAI':
          return true;
        case 'FAUX':
          return false;
        default:
          return ERR_NOM;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return msg.startsWith('#') ? msg : ERR_VALEUR;
    }
  }
}

export function evaluateFormula(
  formula: string,
  getCellValue: CellGetter,
  visited: Set<string> = new Set()
): CalcValue {
  if (!isFormula(formula)) return formula;
  try {
    const p = new Parser(formula.slice(1), getCellValue, visited);
    const v = p.parse();
    // Plage seule hors fonction → déjà #VALEUR! via resolveRange
    return v;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return msg.startsWith('#') ? msg : ERR_VALEUR;
  }
}

export function formatCellValue(value: unknown, format?: string): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'VRAI' : 'FAUX';
  if (typeof value === 'number') {
    if (!isFinite(value)) return ERR_VALEUR;
    if (format === 'currency') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    }
    if (format === 'percent') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(value);
    }
    if (format === 'number') {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
    }
    return Number.isInteger(value)
      ? String(value)
      : String(Math.round(value * 100) / 100).replace('.', ',');
  }
  return String(value);
}
