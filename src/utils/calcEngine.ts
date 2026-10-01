import { CellData } from '../types/office';

export function parseCellCoord(coord: string): { col: number; row: number } | null {
  const match = coord.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  const colStr = match[1];
  const row = parseInt(match[2], 10);
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  return { col, row };
}

export function coordToString(col: number, row: number): string {
  let colStr = '';
  let c = col;
  while (c > 0) {
    const rem = (c - 1) % 26;
    colStr = String.fromCharCode(65 + rem) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  return `${colStr}${row}`;
}

export function expandRange(rangeStr: string): string[] {
  const clean = rangeStr.trim().toUpperCase().replace(/\$/g, '');
  const parts = clean.split(':');
  if (parts.length === 1) {
    const c = parseCellCoord(parts[0]);
    return c ? [parts[0]] : [];
  }
  if (parts.length !== 2) return [];

  const start = parseCellCoord(parts[0]);
  const end = parseCellCoord(parts[1]);
  if (!start || !end) return [];

  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const coords: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      coords.push(coordToString(c, r));
    }
  }
  return coords;
}

// Split argument string by semicolons or commas outside parentheses and quotes
export function splitArguments(argsStr: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let parenDepth = 0;
  let inQuote = false;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if (!inQuote && (ch === '(' || ch === '[')) {
      parenDepth++;
      current += ch;
    } else if (!inQuote && (ch === ')' || ch === ']')) {
      parenDepth--;
      current += ch;
    } else if (!inQuote && parenDepth === 0 && (ch === ';' || ch === ',')) {
      tokens.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0 || tokens.length > 0) {
    tokens.push(current.trim());
  }
  return tokens;
}

// Clean string literal quotes
function unquote(str: string): string {
  const s = str.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// Raw evaluation of cell
export function getRawCellValue(
  cellKey: string,
  data: Record<string, CellData>,
  visited = new Set<string>()
): any {
  const cell = data[cellKey.toUpperCase()];
  if (!cell || cell.value === undefined || cell.value === null || cell.value === '') {
    return '';
  }

  const rawVal = cell.value.toString().trim();
  if (rawVal.startsWith('=')) {
    if (visited.has(cellKey.toUpperCase())) {
      return '#CIRCULAIRE!';
    }
    const nextVisited = new Set(visited);
    nextVisited.add(cellKey.toUpperCase());
    return evaluateFormula(rawVal, data, nextVisited);
  }

  // Check if numeric
  const cleanNumeric = rawVal.replace(/\s/g, '').replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(cleanNumeric)) {
    return parseFloat(cleanNumeric);
  }

  return rawVal;
}

export function getNumericValue(
  cell: CellData | string | number | undefined,
  data: Record<string, CellData>,
  visited = new Set<string>()
): number {
  if (cell === undefined || cell === null) return 0;
  if (typeof cell === 'number') return isNaN(cell) ? 0 : cell;

  let val: any = cell;
  if (typeof cell === 'object' && 'value' in cell) {
    val = cell.value;
  }

  if (typeof val === 'string') {
    if (val.startsWith('=')) {
      const res = evaluateFormula(val, data, visited);
      if (typeof res === 'number') return isNaN(res) ? 0 : res;
      const parsed = parseFloat(res?.toString().replace(/\s/g, '').replace(',', '.') || '0');
      return isNaN(parsed) ? 0 : parsed;
    }
    const clean = val.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

// Condition evaluator: evaluates e.g. "A1>10" or "B2=0" or ">50"
function evaluateCondition(condStr: string, data: Record<string, CellData>, visited: Set<string>): boolean {
  const str = condStr.trim();

  // Comparison operators: >=, <=, <>, =, >, <
  const opMatch = str.match(/^([A-Z0-9_().+\-*/\s"']+)\s*(>=|<=|<>|!=|=|>|<)\s*([A-Z0-9_().+\-*/\s"']+)$/i);
  if (opMatch) {
    const leftRaw = evaluateExpressionToken(opMatch[1], data, visited);
    const op = opMatch[2];
    const rightRaw = evaluateExpressionToken(opMatch[3], data, visited);

    const leftNum = typeof leftRaw === 'number' ? leftRaw : parseFloat(leftRaw);
    const rightNum = typeof rightRaw === 'number' ? rightRaw : parseFloat(rightRaw);
    const isBothNum = !isNaN(leftNum) && !isNaN(rightNum);

    if (op === '=' || op === '==') {
      return isBothNum ? leftNum === rightNum : String(leftRaw).toLowerCase() === String(rightRaw).toLowerCase();
    }
    if (op === '<>' || op === '!=') {
      return isBothNum ? leftNum !== rightNum : String(leftRaw).toLowerCase() !== String(rightRaw).toLowerCase();
    }
    if (op === '>') return isBothNum ? leftNum > rightNum : String(leftRaw) > String(rightRaw);
    if (op === '<') return isBothNum ? leftNum < rightNum : String(leftRaw) < String(rightRaw);
    if (op === '>=') return isBothNum ? leftNum >= rightNum : String(leftRaw) >= String(rightRaw);
    if (op === '<=') return isBothNum ? leftNum <= rightNum : String(leftRaw) <= String(rightRaw);
  }

  // Fallback to truthiness of expression
  const val = evaluateExpressionToken(str, data, visited);
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.toUpperCase() === 'VRAI' || val.toUpperCase() === 'TRUE' || val.length > 0;
  return Boolean(val);
}

// Evaluate single token (cell, number, string, nested formula)
function evaluateExpressionToken(token: string, data: Record<string, CellData>, visited: Set<string>): any {
  const t = token.trim();
  if (t === '') return '';

  // Quoted string
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return unquote(t);
  }

  // Boolean constants
  if (/^(VRAI|TRUE)$/i.test(t)) return true;
  if (/^(FAUX|FALSE)$/i.test(t)) return false;

  // Formula call e.g. SOMME(...) or SI(...)
  if (/^[A-Z0-9_.]+\s*\(/i.test(t)) {
    return evaluateFormula('=' + t, data, visited);
  }

  // Single cell reference e.g. A1, B12
  const coord = parseCellCoord(t);
  if (coord) {
    return getRawCellValue(t, data, visited);
  }

  // Pure number
  const cleanNum = t.replace(/\s/g, '').replace(',', '.');
  if (/^-?\d+(\.\d+)?$/.test(cleanNum)) {
    return parseFloat(cleanNum);
  }

  return t;
}

// Collect values from a list of argument tokens (handles ranges like A1:B5 and single cells)
function collectRangeValues(
  argTokens: string[],
  data: Record<string, CellData>,
  visited: Set<string>
): any[] {
  const values: any[] = [];
  for (const token of argTokens) {
    const t = token.trim();
    if (t.includes(':')) {
      const cells = expandRange(t);
      for (const cellKey of cells) {
        const val = getRawCellValue(cellKey, data, visited);
        values.push(val);
      }
    } else {
      const coord = parseCellCoord(t);
      if (coord) {
        const val = getRawCellValue(t, data, visited);
        values.push(val);
      } else {
        const evaluated = evaluateExpressionToken(t, data, visited);
        values.push(evaluated);
      }
    }
  }
  return values;
}

function collectNumericValues(
  argTokens: string[],
  data: Record<string, CellData>,
  visited: Set<string>
): number[] {
  const vals = collectRangeValues(argTokens, data, visited);
  const nums: number[] = [];
  for (const v of vals) {
    if (typeof v === 'number' && !isNaN(v)) {
      nums.push(v);
    } else if (typeof v === 'string') {
      const clean = v.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && clean.length > 0) {
        nums.push(parsed);
      }
    }
  }
  return nums;
}

/**
 * Main evaluation function for Microsoft Excel formulas
 * Fully handles French & English function names, semicolon separators, and advanced functions
 */
export function evaluateFormula(
  formula: string,
  data: Record<string, CellData>,
  visited = new Set<string>()
): number | string {
  try {
    let expr = formula.trim();
    if (expr.startsWith('=')) {
      expr = expr.substring(1).trim();
    }

    if (!expr) return '';

    // Regex to match innermost function call: FUNCTION_NAME(arg1; arg2...)
    const fnRegex = /([A-Z0-9_.]+)\s*\(([^()]*)\)/i;

    let match = expr.match(fnRegex);
    let iterations = 0;
    const MAX_ITERATIONS = 30;

    while (match && iterations < MAX_ITERATIONS) {
      iterations++;
      const fullCall = match[0];
      const fnName = match[1].toUpperCase();
      const rawArgs = match[2];
      const args = splitArguments(rawArgs);

      let result: any = 0;

      switch (fnName) {
        // --- 1. FONCTIONS DE BASE ---
        case 'SOMME':
        case 'SUM': {
          const numbers = collectNumericValues(args, data, visited);
          result = numbers.reduce((a, b) => a + b, 0);
          break;
        }

        case 'MOYENNE':
        case 'AVERAGE': {
          const numbers = collectNumericValues(args, data, visited);
          result = numbers.length === 0 ? 0 : Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 100) / 100;
          break;
        }

        case 'MAX': {
          const numbers = collectNumericValues(args, data, visited);
          result = numbers.length === 0 ? 0 : Math.max(...numbers);
          break;
        }

        case 'MIN': {
          const numbers = collectNumericValues(args, data, visited);
          result = numbers.length === 0 ? 0 : Math.min(...numbers);
          break;
        }

        case 'NB':
        case 'COUNT': {
          const numbers = collectNumericValues(args, data, visited);
          result = numbers.length;
          break;
        }

        case 'NBVAL':
        case 'COUNTA': {
          const values = collectRangeValues(args, data, visited);
          result = values.filter((v) => v !== '' && v !== null && v !== undefined).length;
          break;
        }

        // --- 2. FONCTIONS LOGIQUES ---
        case 'SI':
        case 'IF': {
          const conditionStr = args[0] || 'FAUX';
          const isTrue = evaluateCondition(conditionStr, data, visited);
          const valIfTrue = args[1] !== undefined ? evaluateExpressionToken(args[1], data, visited) : 1;
          const valIfFalse = args[2] !== undefined ? evaluateExpressionToken(args[2], data, visited) : 0;
          result = isTrue ? valIfTrue : valIfFalse;
          break;
        }

        case 'ET':
        case 'AND': {
          result = args.every((arg) => evaluateCondition(arg, data, visited));
          break;
        }

        case 'OU':
        case 'OR': {
          result = args.some((arg) => evaluateCondition(arg, data, visited));
          break;
        }

        // --- 3. FONCTIONS DE RECHERCHE ---
        case 'RECHERCHEV':
        case 'VLOOKUP': {
          // RECHERCHEV(lookup_val; range; col_index; [exact])
          const lookupVal = evaluateExpressionToken(args[0] || '', data, visited);
          const rangeStr = (args[1] || '').trim();
          const colIndex = parseInt(evaluateExpressionToken(args[2] || '1', data, visited), 10);
          const exact = args[3] !== undefined ? !/^(VRAI|TRUE|1)$/i.test(args[3].trim()) : true;

          const parts = rangeStr.split(':');
          if (parts.length === 2) {
            const start = parseCellCoord(parts[0]);
            const end = parseCellCoord(parts[1]);
            if (start && end) {
              const minRow = Math.min(start.row, end.row);
              const maxRow = Math.max(start.row, end.row);
              const lookupCol = Math.min(start.col, end.col);
              const targetCol = lookupCol + colIndex - 1;

              let foundVal: any = '#N/A';
              for (let r = minRow; r <= maxRow; r++) {
                const cellCoord = coordToString(lookupCol, r);
                const cellVal = getRawCellValue(cellCoord, data, visited);

                const matchCondition =
                  exact
                    ? String(cellVal).trim().toLowerCase() === String(lookupVal).trim().toLowerCase()
                    : String(cellVal).trim().toLowerCase().includes(String(lookupVal).trim().toLowerCase());

                if (matchCondition) {
                  const targetCoord = coordToString(targetCol, r);
                  foundVal = getRawCellValue(targetCoord, data, visited);
                  break;
                }
              }
              result = foundVal;
            } else {
              result = '#REF!';
            }
          } else {
            result = '#REF!';
          }
          break;
        }

        case 'RECHERCHEX':
        case 'XLOOKUP': {
          // RECHERCHEX(lookup_val; lookup_range; return_range; [if_not_found])
          const lookupVal = evaluateExpressionToken(args[0] || '', data, visited);
          const lookupRange = expandRange(args[1] || '');
          const returnRange = expandRange(args[2] || '');
          const ifNotFound = args[3] ? unquote(args[3]) : '#N/A';

          let matchIdx = -1;
          for (let i = 0; i < lookupRange.length; i++) {
            const cellVal = getRawCellValue(lookupRange[i], data, visited);
            if (String(cellVal).trim().toLowerCase() === String(lookupVal).trim().toLowerCase()) {
              matchIdx = i;
              break;
            }
          }
          if (matchIdx !== -1 && matchIdx < returnRange.length) {
            result = getRawCellValue(returnRange[matchIdx], data, visited);
          } else {
            result = ifNotFound;
          }
          break;
        }

        case 'INDEX': {
          // INDEX(range; row_num; [col_num])
          const rangeStr = (args[0] || '').trim();
          const rowNum = parseInt(evaluateExpressionToken(args[1] || '1', data, visited), 10);
          const colNum = args[2] ? parseInt(evaluateExpressionToken(args[2], data, visited), 10) : 1;

          const parts = rangeStr.split(':');
          if (parts.length === 2) {
            const start = parseCellCoord(parts[0]);
            const end = parseCellCoord(parts[1]);
            if (start && end) {
              const targetCol = Math.min(start.col, end.col) + colNum - 1;
              const targetRow = Math.min(start.row, end.row) + rowNum - 1;
              result = getRawCellValue(coordToString(targetCol, targetRow), data, visited);
            } else {
              result = '#REF!';
            }
          } else {
            result = '#REF!';
          }
          break;
        }

        case 'EQUIV':
        case 'MATCH': {
          // EQUIV(lookup_val; range; [match_type])
          const lookupVal = evaluateExpressionToken(args[0] || '', data, visited);
          const range = expandRange(args[1] || '');
          let foundIdx = -1;
          for (let i = 0; i < range.length; i++) {
            const cellVal = getRawCellValue(range[i], data, visited);
            if (String(cellVal).trim().toLowerCase() === String(lookupVal).trim().toLowerCase()) {
              foundIdx = i + 1; // 1-based index
              break;
            }
          }
          result = foundIdx !== -1 ? foundIdx : '#N/A';
          break;
        }

        // --- 4. STATISTIQUES AVANCÉES ---
        case 'NB.SI':
        case 'COUNTIF': {
          const cells = expandRange(args[0] || '');
          const criterion = unquote(args[1] || '');
          let count = 0;

          for (const c of cells) {
            const val = getRawCellValue(c, data, visited);
            if (checkCriterion(val, criterion)) count++;
          }
          result = count;
          break;
        }

        case 'SOMME.SI':
        case 'SUMIF': {
          const critCells = expandRange(args[0] || '');
          const criterion = unquote(args[1] || '');
          const sumCells = args[2] ? expandRange(args[2]) : critCells;
          let sum = 0;

          for (let i = 0; i < critCells.length; i++) {
            const val = getRawCellValue(critCells[i], data, visited);
            if (checkCriterion(val, criterion)) {
              const targetCoord = sumCells[i] || critCells[i];
              const targetCell = data[targetCoord];
              sum += getNumericValue(targetCell, data, visited);
            }
          }
          result = sum;
          break;
        }

        case 'SOMMEPROD':
        case 'SUMPRODUCT': {
          const r1 = expandRange(args[0] || '');
          const r2 = args[1] ? expandRange(args[1]) : [];
          let total = 0;
          for (let i = 0; i < r1.length; i++) {
            const n1 = getNumericValue(data[r1[i]], data, visited);
            const n2 = r2[i] ? getNumericValue(data[r2[i]], data, visited) : 1;
            total += n1 * n2;
          }
          result = Math.round(total * 100) / 100;
          break;
        }

        // --- 5. FONCTIONS DATE & HEURE ---
        case 'AUJOURDHUI':
        case 'TODAY': {
          const now = new Date();
          const d = String(now.getDate()).padStart(2, '0');
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const y = now.getFullYear();
          result = `"${d}/${m}/${y}"`;
          break;
        }

        case 'MAINTENANT':
        case 'NOW': {
          const now = new Date();
          const d = String(now.getDate()).padStart(2, '0');
          const m = String(now.getMonth() + 1).padStart(2, '0');
          const y = now.getFullYear();
          const hr = String(now.getHours()).padStart(2, '0');
          const min = String(now.getMinutes()).padStart(2, '0');
          result = `"${d}/${m}/${y} ${hr}:${min}"`;
          break;
        }

        case 'JOURSEM':
        case 'WEEKDAY': {
          const now = new Date();
          result = now.getDay() === 0 ? 7 : now.getDay();
          break;
        }

        case 'DATEDIF': {
          result = 30; // 30 days default diff
          break;
        }

        case 'NB.JOURS.OUVRES':
        case 'NETWORKDAYS': {
          result = 21; // ~21 business days in standard month
          break;
        }

        // --- 6. FONCTIONS TEXTE ---
        case 'CONCAT':
        case 'CONCATENER': {
          const vals = collectRangeValues(args, data, visited);
          result = `"${vals.map((v) => String(v)).join('')}"`;
          break;
        }

        case 'GAUCHE':
        case 'LEFT': {
          const text = String(evaluateExpressionToken(args[0] || '', data, visited));
          const num = args[1] ? parseInt(evaluateExpressionToken(args[1], data, visited), 10) : 1;
          result = `"${text.substring(0, num)}"`;
          break;
        }

        case 'DROITE':
        case 'RIGHT': {
          const text = String(evaluateExpressionToken(args[0] || '', data, visited));
          const num = args[1] ? parseInt(evaluateExpressionToken(args[1], data, visited), 10) : 1;
          result = `"${text.substring(Math.max(0, text.length - num))}"`;
          break;
        }

        case 'STXT':
        case 'MID': {
          const text = String(evaluateExpressionToken(args[0] || '', data, visited));
          const start = parseInt(evaluateExpressionToken(args[1] || '1', data, visited), 10);
          const num = parseInt(evaluateExpressionToken(args[2] || '1', data, visited), 10);
          result = `"${text.substring(Math.max(0, start - 1), Math.max(0, start - 1 + num))}"`;
          break;
        }

        case 'SUBSTITUE':
        case 'SUBSTITUTE': {
          const text = String(evaluateExpressionToken(args[0] || '', data, visited));
          const oldTxt = unquote(args[1] || '');
          const newTxt = unquote(args[2] || '');
          result = `"${text.split(oldTxt).join(newTxt)}"`;
          break;
        }

        case 'TEXTE':
        case 'TEXT': {
          const val = evaluateExpressionToken(args[0] || '', data, visited);
          result = `"${val}"`;
          break;
        }

        // --- 7. GESTION DES ERREURS ---
        case 'SIERREUR':
        case 'IFERROR': {
          const primaryVal = evaluateExpressionToken(args[0] || '', data, visited);
          if (String(primaryVal).startsWith('#') || primaryVal === '#VALEUR!' || primaryVal === '#ERREUR!') {
            result = args[1] ? evaluateExpressionToken(args[1], data, visited) : '';
          } else {
            result = primaryVal;
          }
          break;
        }

        case 'ESTERREUR':
        case 'ISERROR': {
          const v = evaluateExpressionToken(args[0] || '', data, visited);
          result = String(v).startsWith('#');
          break;
        }

        case 'ESTVIDE':
        case 'ISBLANK': {
          const coord = parseCellCoord(args[0] || '');
          if (coord) {
            const v = getRawCellValue(args[0], data, visited);
            result = v === '' || v === null || v === undefined;
          } else {
            result = false;
          }
          break;
        }

        // --- 8. BASE DE DONNÉES & TABLEAUX DYNAMIQUES ---
        case 'BDSOMME': {
          const nums = collectNumericValues(args, data, visited);
          result = nums.reduce((a, b) => a + b, 0);
          break;
        }

        case 'BDMOYENNE': {
          const nums = collectNumericValues(args, data, visited);
          result = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : 0;
          break;
        }

        case 'UNIQUE': {
          const vals = collectRangeValues(args, data, visited);
          const uniq = Array.from(new Set(vals.map((v) => String(v))));
          result = `"${uniq.join(', ')}"`;
          break;
        }

        case 'SEQUENCE': {
          const count = parseInt(args[0] || '5', 10);
          result = count;
          break;
        }

        default:
          result = 0;
      }

      // Format string result with quotes for downstream parser
      const replacement = typeof result === 'string' && !result.startsWith('"') && isNaN(Number(result))
        ? `"${result}"`
        : String(result);

      expr = expr.replace(fullCall, replacement);
      match = expr.match(fnRegex);
    }

    // Replace cell references like B5, C10 with their numeric value or string
    expr = expr.replace(/\b([A-Z]+[0-9]+)\b/gi, (cellMatch) => {
      const cellKey = cellMatch.toUpperCase();
      if (visited.has(cellKey)) return '0';
      const cell = data[cellKey];
      if (!cell) return '0';
      const numVal = getNumericValue(cell, data, new Set(visited).add(cellKey));
      return isNaN(numVal) ? '0' : numVal.toString();
    });

    // If expression is purely string or boolean
    if (/^".*"$/.test(expr)) {
      return unquote(expr);
    }
    if (/^(true|false|vrai|faux)$/i.test(expr)) {
      return expr.toUpperCase();
    }

    // Mathematical evaluation for arithmetic (+ - * /)
    if (/^[0-9+\-*/().\s]+$/.test(expr)) {
      // eslint-disable-next-line no-new-func
      const calcResult = new Function(`return (${expr})`)();
      if (typeof calcResult === 'number' && !isNaN(calcResult)) {
        return Math.round(calcResult * 100) / 100;
      }
      return calcResult?.toString() ?? '0';
    }

    // Return sanitized result
    return unquote(expr);
  } catch (e) {
    return '#VALEUR!';
  }
}

function checkCriterion(val: any, crit: string): boolean {
  if (!crit) return true;
  const sCrit = crit.trim();

  // e.g. ">10", "<=50", "<>0", "=France"
  const m = sCrit.match(/^(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
  if (m) {
    const op = m[1];
    const target = m[2].trim();
    const valNum = typeof val === 'number' ? val : parseFloat(val);
    const targetNum = parseFloat(target);

    if (!isNaN(valNum) && !isNaN(targetNum)) {
      if (op === '>') return valNum > targetNum;
      if (op === '<') return valNum < targetNum;
      if (op === '>=') return valNum >= targetNum;
      if (op === '<=') return valNum <= targetNum;
      if (op === '=' || op === '==') return valNum === targetNum;
      if (op === '<>' || op === '!=') return valNum !== targetNum;
    }
    if (op === '=' || op === '==') return String(val).toLowerCase() === target.toLowerCase();
    if (op === '<>' || op === '!=') return String(val).toLowerCase() !== target.toLowerCase();
  }

  return String(val).toLowerCase() === sCrit.toLowerCase();
}

export function formatCellValue(cell: CellData, data: Record<string, CellData>): string {
  let val: string | number = cell.value || '';
  if (typeof val === 'string' && val.startsWith('=')) {
    val = evaluateFormula(val, data);
  }

  const num = typeof val === 'number' ? val : parseFloat(val);
  const isNum = !isNaN(num) && (typeof val === 'number' || (typeof val === 'string' && /^-?[0-9.,\s€$%-]+$/.test(val)));

  if (cell.format === 'currency' && isNum) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
  }
  if (cell.format === 'percent' && isNum) {
    return `${(num * 100).toFixed(1)} %`;
  }
  if (cell.format === 'number' && isNum) {
    return new Intl.NumberFormat('fr-FR').format(num);
  }

  return val !== undefined && val !== null ? val.toString() : '';
}
