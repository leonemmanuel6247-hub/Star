// ─────────────────────────────────────────────────────────────
// StarOffice Writer — moteur de mise en forme, analyse et exports
// Syntaxe légère (proche Markdown) stockée en texte brut :
// **gras** *italique* __souligné__ ~~barré~~ ==surligné== `code`
// ^exposant^ ~indice~ # Titre1 ## Titre2 - puce 1. numéroté
// > citation | tableau | [texte](url) {{CHAMP}} [^1] note
// [image:id] [dessin:n] [graphique:id] >>> encadré
// ─────────────────────────────────────────────────────────────

export const PAGEBREAK = '--- Saut de page ---';
export const SECTIONBREAK = '=== Nouvelle section ===';

export interface Selection {
  start: number;
  end: number;
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ── Conversion des anciennes balises HTML vers la syntaxe légère ──
export function legacyToMarkers(input: string): string {
  let t = input;
  t = t.replace(/<a\s+href="([^"]*)">([\s\S]*?)<\/a>/gi, '[$2]($1)');
  t = t.replace(/<(b|strong)>([\s\S]*?)<\/(b|strong)>/gi, '**$2**');
  t = t.replace(/<(i|em)>([\s\S]*?)<\/(i|em)>/gi, '*$2*');
  t = t.replace(/<u>([\s\S]*?)<\/u>/gi, '__$2__');
  t = t.replace(/<(s|strike|del)>([\s\S]*?)<\/(s|strike|del)>/gi, '~~$2~~');
  t = t.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^$1^');
  t = t.replace(/<sub>([\s\S]*?)<\/sub>/gi, '~$1~');
  t = t.replace(/<h1>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  t = t.replace(/<h2>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  t = t.replace(/<h3>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  t = t.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n');
  t = t.replace(/<pre>([\s\S]*?)<\/pre>/gi, '`$1`');
  t = t.replace(/<hr\s*\/?>/gi, `\n${PAGEBREAK}\n`);
  t = t.replace(/<\/?p>/gi, '\n');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<[^>]+>/g, '');
  t = t.replace(/&nbsp;/g, ' ');
  t = t.replace(/&amp;/g, '&');
  t = t.replace(/&lt;/g, '<');
  t = t.replace(/&gt;/g, '>');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t;
}

// ── Suppression de toute mise en forme (texte brut) ──
export function stripMarkers(input: string): string {
  let t = legacyToMarkers(input);
  t = t.replace(/^#{1,3}\s+/gm, '');
  t = t.replace(/^>\s?/gm, '');
  t = t.replace(/^>>>\s?/gm, '');
  t = t.replace(/^\s*[-*]\s+/gm, '');
  t = t.replace(/^\s*\d+\.\s+/gm, '');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2');
  t = t.replace(/__([^_\n]+)__/g, '$1');
  t = t.replace(/~~([^~\n]+)~~/g, '$1');
  t = t.replace(/==([^=\n]+)==/g, '$1');
  t = t.replace(/`([^`\n]+)`/g, '$1');
  t = t.replace(/\^([^^,\n]+)\^/g, '$1');
  t = t.replace(/(^|[^~])~([^~\n]+)~/g, '$1$2');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  return t;
}

// ── Opérations sur la sélection ──
export function insertAtCursor(
  text: string,
  sel: Selection,
  snippet: string
): { text: string; sel: Selection } {
  const s = Math.max(0, Math.min(sel.start, sel.end, text.length));
  const e = Math.min(text.length, Math.max(sel.start, sel.end));
  const next = text.slice(0, s) + snippet + text.slice(e);
  const pos = s + snippet.length;
  return { text: next, sel: { start: pos, end: pos } };
}

/** Enveloppe la sélection (ou positionne le curseur entre les marqueurs). */
export function wrapSelection(
  text: string,
  sel: Selection,
  before: string,
  after: string = before
): { text: string; sel: Selection } {
  const s = Math.max(0, Math.min(sel.start, sel.end, text.length));
  const e = Math.min(text.length, Math.max(sel.start, sel.end));
  if (s === e) {
    const next = text.slice(0, s) + before + after + text.slice(e);
    return { text: next, sel: { start: s + before.length, end: s + before.length } };
  }
  const next = text.slice(0, s) + before + text.slice(s, e) + after + text.slice(e);
  return { text: next, sel: { start: s + before.length, end: e + before.length } };
}

/** Compte les caractères identiques en début / fin de chaîne. */
function runLen(s: string, ch: string): { lead: number; trail: number } {
  let lead = 0;
  while (lead < s.length && s[lead] === ch) lead += 1;
  let trail = 0;
  while (trail < s.length && s[s.length - 1 - trail] === ch) trail += 1;
  return { lead, trail };
}

/** Rétrograde les triples *** : en gras (***)->(*) garde l'italique, en italique (***)->(**) garde le gras. */
function demoteTriples(s: string, before: string): string {
  if (before === '**') return s.split('***').join('*');
  if (before === '*') return s.split('***').join('**');
  return s;
}

function loneReSrc(ch: string): string {
  const e = ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `(?<!${e})${e}(?!${e})`;
}

/** La sélection contient-elle déjà ce marqueur ? (les * et ~ isolés, pas ceux de ** et ~~) */
function containsMarker(inner: string, before: string): boolean {
  if (before === '*' || before === '~') return new RegExp(loneReSrc(before)).test(inner);
  return inner.includes(before);
}

/** Retire toutes les occurrences du marqueur (sans casser ** ni ~~). */
function removeMarker(s: string, before: string): string {
  if (before === '*' || before === '~') return s.replace(new RegExp(loneReSrc(before), 'g'), '');
  return s.split(before).join('');
}

/**
 * Gras/italique/souligné... : bascule idempotente, ne crée jamais de marqueurs
 * imbriqués en double (****) ni de soupes : appui 1 applique, appui 2 retire.
 * État mixte (**x** y) : normalisé à la Word (tout le passage prend le format).
 */
export function toggleWrap(
  text: string,
  sel: Selection,
  before: string,
  after: string = before
): { text: string; sel: Selection } {
  const s = Math.max(0, Math.min(sel.start, sel.end, text.length));
  const e = Math.min(text.length, Math.max(sel.start, sel.end));
  const single = before.length === 1;

  // ── Curseur seul ──
  if (s === e) {
    // Au milieu d'une paire vide (**|** ou *|*) : on la retire (anti-réappui).
    // Sinon : on insère la paire et on place le curseur entre les deux.
    const emptyBefore = text.slice(Math.max(0, s - before.length), s) === before;
    const emptyAfter = text.slice(e, e + after.length) === after;
    const emptyPartOfDouble =
      single &&
      (text[s - before.length - 1] === before || text[e + after.length] === after);
    if (emptyBefore && emptyAfter && !emptyPartOfDouble) {
      const next = text.slice(0, s - before.length) + text.slice(e + after.length);
      const pos = s - before.length;
      return { text: next, sel: { start: pos, end: pos } };
    }
    return wrapSelection(text, sel, before, after);
  }

  const inner = text.slice(s, e);

  // ── Cas 1 : les marqueurs entourent juste la sélection -> on les retire ──
  const outsideBefore = text.slice(Math.max(0, s - before.length), s) === before;
  const outsideAfter = text.slice(e, e + after.length) === after;
  const partOfDouble =
    single &&
    (text[s - before.length - 1] === before || text[e + after.length] === after);
  if (outsideBefore && outsideAfter && !partOfDouble) {
    const next =
      text.slice(0, s - before.length) + text.slice(s, e) + text.slice(e + after.length);
    return { text: next, sel: { start: s - before.length, end: e - before.length } };
  }

  const wrapped =
    inner.length >= before.length + after.length &&
    inner.startsWith(before) &&
    inner.endsWith(after);

  // ── Cas 2 : sélection entièrement enveloppée -> on retire le formatage ──
  if (wrapped) {
    if (single) {
      // * et ~ : sur un double exact (**x**, ~~x~~) on imbrique (***x***) ;
      // sinon on retire UN niveau (*x*->x, ***x***->**x**, ^x^->x).
      if ((before === '*' || before === '~') && before === after) {
        const { lead, trail } = runLen(inner, before);
        if (lead === 2 && trail === 2) return wrapSelection(text, sel, before, after);
      }
      const stripped = inner.slice(before.length, inner.length - after.length);
      const next = text.slice(0, s) + stripped + text.slice(e);
      return { text: next, sel: { start: s, end: s + stripped.length } };
    }
    // Marqueur double : retire TOUS les niveaux + occurrences internes
    // (**x**->x, ****x****->x, ***x***->*x* pour le gras : l'italique survit).
    let stripped = inner;
    let guard = 0;
    while (
      stripped.length >= before.length + after.length &&
      stripped.startsWith(before) &&
      stripped.endsWith(after) &&
      guard++ < 10
    ) {
      stripped = stripped.slice(before.length, stripped.length - after.length);
    }
    stripped = demoteTriples(stripped, before);
    if (stripped.includes(before)) stripped = stripped.split(before).join('');
    if (before !== after && stripped.includes(after)) stripped = stripped.split(after).join('');
    const next = text.slice(0, s) + stripped + text.slice(e);
    return { text: next, sel: { start: s, end: s + stripped.length } };
  }

  // ── Cas 3 : état mixte (marqueurs partiels) -> normalise puis applique ──
  if (containsMarker(inner, before)) {
    const clean = removeMarker(demoteTriples(inner, before), before);
    const next = text.slice(0, s) + before + clean + after + text.slice(e);
    return {
      text: next,
      sel: { start: s + before.length, end: s + before.length + clean.length },
    };
  }

  // ── Cas 4 : rien -> on enveloppe ──
  return wrapSelection(text, sel, before, after);
}

function lineRange(text: string, index: number): { start: number; end: number } {
  const i = Math.max(0, Math.min(index, text.length));
  const start = text.lastIndexOf('\n', i - 1) + 1;
  let end = text.indexOf('\n', i);
  if (end === -1) end = text.length;
  return { start, end };
}

/** Applique/retire un préfixe de ligne (# Titre, - puce...) sur les lignes de la sélection. */
export function toggleLinePrefix(
  text: string,
  sel: Selection,
  prefix: string
): { text: string; sel: Selection } {
  const s = Math.max(0, Math.min(sel.start, sel.end, text.length));
  const e = Math.min(text.length, Math.max(sel.start, sel.end));
  const first = lineRange(text, s).start;
  const last = lineRange(text, Math.max(e - 1, 0)).end;
  const chunk = text.slice(first, last);
  const lines = chunk.split('\n');
  const allHave = lines.every((l) => l.startsWith(prefix) || l.trim() === '');
  const next = lines
    .map((l) => {
      if (l.trim() === '') return l;
      if (allHave) return l.startsWith(prefix) ? l.slice(prefix.length) : l;
      return l.startsWith(prefix) ? l : prefix + l.replace(/^#{1,3}\s+/, '');
    })
    .join('\n');
  const out = text.slice(0, first) + next + text.slice(last);
  return { text: out, sel: { start: first, end: first + next.length } };
}

/** Puces / numérotation sur les lignes sélectionnées (bascule). */
export function toggleList(
  text: string,
  sel: Selection,
  kind: 'bullet' | 'number'
): { text: string; sel: Selection } {
  const s = Math.max(0, Math.min(sel.start, sel.end, text.length));
  const e = Math.min(text.length, Math.max(sel.start, sel.end));
  const first = lineRange(text, s).start;
  const last = lineRange(text, Math.max(e - 1, 0)).end;
  const lines = text.slice(first, last).split('\n');
  const nonEmpty = lines.filter((l) => l.trim() !== '');
  if (nonEmpty.length === 0) {
    const starter = kind === 'bullet' ? '- ' : '1. ';
    return insertAtCursor(text, sel, starter);
  }
  const rx = kind === 'bullet' ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/;
  const allHave = nonEmpty.every((l) => rx.test(l));
  let n = 0;
  const next = lines
    .map((l) => {
      if (l.trim() === '') return l;
      if (allHave) return l.replace(rx, '');
      const clean = l.replace(/^\s*([-*]|\d+\.)\s+/, '');
      n += 1;
      return kind === 'bullet' ? `- ${clean}` : `${n}. ${clean}`;
    })
    .join('\n');
  const out = text.slice(0, first) + next + text.slice(last);
  return { text: out, sel: { start: first, end: first + next.length } };
}

/** Retrait : ajoute/retire une tabulation en début des lignes sélectionnées. */
export function indentLines(
  text: string,
  sel: Selection,
  dir: 1 | -1
): { text: string; sel: Selection } {
  const s = Math.max(0, Math.min(sel.start, sel.end, text.length));
  const e = Math.min(text.length, Math.max(sel.start, sel.end));
  const first = lineRange(text, s).start;
  const last = lineRange(text, Math.max(e - 1, 0)).end;
  const next = text
    .slice(first, last)
    .split('\n')
    .map((l) => {
      if (l.trim() === '') return l;
      if (dir === 1) return '\t' + l;
      return l.startsWith('\t') ? l.slice(1) : l.replace(/^ {1,4}/, '');
    })
    .join('\n');
  const out = text.slice(0, first) + next + text.slice(last);
  return { text: out, sel: { start: first, end: first + next.length } };
}

// ── Statistiques ──
export interface DocStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  paragraphs: number;
  sentences: number;
  pages: number;
  readingTime: string;
}

export function computeStats(rawText: string): DocStats {
  const plain = stripMarkers(rawText);
  const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
  const chars = plain.length;
  const charsNoSpaces = plain.replace(/\s/g, '').length;
  const paragraphs = plain.trim() ? plain.split(/\n+/).filter((p) => p.trim()).length : 0;
  const sentences = plain.trim()
    ? plain.split(/[.!?…]+/).filter((p) => p.trim()).length
    : 0;
  const pages = Math.max(1, Math.ceil(words / 250));
  const mins = words / 200;
  const readingTime =
    mins < 1 ? 'moins d’une minute' : `environ ${Math.round(mins)} min`;
  return { words, chars, charsNoSpaces, paragraphs, sentences, pages, readingTime };
}

// ── Titres (volet de navigation + table des matières) ──
export interface Heading {
  level: number;
  text: string;
  index: number; // position dans le texte
}

export function extractHeadings(rawText: string): Heading[] {
  const text = legacyToMarkers(rawText);
  const out: Heading[] = [];
  const rx = /^(#{1,3})\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    out.push({ level: m[1].length, text: stripMarkers(m[2]).slice(0, 80), index: m.index });
  }
  return out;
}

// ── Vérification du français (hors-ligne, règles simples) ──
export interface ProofIssue {
  index: number;
  length: number;
  message: string;
  excerpt: string;
}

export function proofFrench(rawText: string): ProofIssue[] {
  const text = stripMarkers(rawText);
  const issues: ProofIssue[] = [];
  const push = (index: number, length: number, message: string) => {
    if (issues.length >= 60) return;
    const excerpt = text.slice(Math.max(0, index - 24), index + length + 24).replace(/\n/g, ' ');
    issues.push({ index, length, message, excerpt: `…${excerpt}…` });
  };
  // Doubles espaces
  let m: RegExpExecArray | null;
  const dbl = / {2,}/g;
  while ((m = dbl.exec(text)) !== null) push(m.index, m[0].length, 'Double espace');
  // Mots répétés
  const rep = /\b([A-Za-zÀ-ÿ]+)\s+\1\b/gi;
  while ((m = rep.exec(text)) !== null) push(m.index, m[0].length, `Mot répété : « ${m[1]} »`);
  // Majuscule en début de phrase
  const low = /([.!?…]\s+)([a-zàâäéèêëîïôöùûüç])/g;
  while ((m = low.exec(text)) !== null)
    push(m.index + m[1].length, 1, 'Majuscule manquante en début de phrase');
  // « a » devant un infinitif → probablement « à »
  const avs = /\ba\s+(aller|voir|faire|prendre|mettre|donner|dire|pouvoir|vouloir|devoir|savoir|venir|partir|sortir|rester|tomber|acheter|appeler|attendre|chercher|commencer|manger|parler|passer|penser|rendre|répondre|sentir|servir|suivre|tenir|vivre|devenir|revenir|obtenir|apprendre|comprendre|entreprendre|surprendre|été|ete)\b/gi;
  while ((m = avs.exec(text)) !== null)
    push(m.index, 1, `« a » ou « à » ? (devant « ${m[1]} », c’est souvent « à »)`);
  // « sa » suivi d'un verbe → probablement « ça »
  const savs = /\bsa\s+(va|vont|marche|dépend|dépendent|me|te|nous|vous|y|en|donne|fait|change)\b/gi;
  while ((m = savs.exec(text)) !== null)
    push(m.index, 2, '« sa » ou « ça » ? (devant un verbe, c’est souvent « ça »)');
  // Espace manquante après ponctuation (hors nombres, URL et domaines)
  const nospace = /([,.;:!?…])([^\s\d"’»/])/g;
  while ((m = nospace.exec(text)) !== null) {
    if (m[1] === '.' && /^[a-z]{2,4}\b/.test(text.slice(m.index + 1))) continue; // b.com, site.fr…
    push(m.index, 1, 'Espace manquante après la ponctuation');
  }
  // Points de suspension
  const dots = /\.{3,}/g;
  while ((m = dots.exec(text)) !== null)
    push(m.index, m[0].length, 'Préférez le caractère « … » aux trois points');
  // Fautes fréquentes
  const typos: Array<[RegExp, string]> = [
    [/\baujoud'hui\b/gi, '« aujourd’hui » s’écrit avec deux « h » : au-jour-d’hui'],
    [/\blanguage\b/gi, 'En français, on écrit « langage » (language est anglais)'],
    [/\bparmis\b/gi, 'On écrit « parmi » (sans s)'],
    [/\bmalgrés\b/gi, 'On écrit « malgré » (sans s)'],
  ];
  for (const [rx, msg] of typos) {
    rx.lastIndex = 0;
    let t: RegExpExecArray | null;
    while ((t = rx.exec(text)) !== null) push(t.index, t[0].length, msg);
  }
  issues.sort((a, b) => a.index - b.index);
  return issues;
}

// ── Publipostage ──
export interface Recipient {
  id: string;
  nom: string;
  email: string;
  adresse: string;
}

export function mergeFields(text: string, r: Recipient): string {
  return text
    .replace(/\{\{\s*NOM\s*\}\}/gi, r.nom || '«NOM»')
    .replace(/\{\{\s*EMAIL\s*\}\}/gi, r.email || '«EMAIL»')
    .replace(/\{\{\s*ADRESSE\s*\}\}/gi, r.adresse || '«ADRESSE»');
}

// ── Blocs du document (aperçu + impression + exports) ──
export type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'bullet'; items: string[] }
  | { kind: 'number'; items: string[] }
  | { kind: 'quote'; text: string }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'hr' }
  | { kind: 'image'; id: string }
  | { kind: 'drawing'; n: number }
  | { kind: 'chart'; id: string }
  | { kind: 'pagebreak' }
  | { kind: 'sectionbreak' }
  | { kind: 'textbox'; text: string }
  | { kind: 'footnote'; n: string; text: string };

export function parseBlocks(rawText: string): Block[] {
  const text = legacyToMarkers(rawText);
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (t === '') {
      i += 1;
      continue;
    }
    if (t === PAGEBREAK || t === '\f' || t === '---') {
      blocks.push({ kind: 'pagebreak' });
      i += 1;
      continue;
    }
    if (t === SECTIONBREAK || t === '===') {
      blocks.push({ kind: 'sectionbreak' });
      i += 1;
      continue;
    }
    if (/^<hr\s*\/?>$/i.test(t) || t === '---') {
      blocks.push({ kind: 'hr' });
      i += 1;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(t);
    if (h) {
      blocks.push({ kind: 'heading', level: h[1].length, text: h[2] });
      i += 1;
      continue;
    }
    const fn = /^\[\^(\d+)\]:\s*(.*)$/.exec(t);
    if (fn) {
      blocks.push({ kind: 'footnote', n: fn[1], text: fn[2] });
      i += 1;
      continue;
    }
    const img = /^\[image:([^\]]+)\]$/.exec(t);
    if (img) {
      blocks.push({ kind: 'image', id: img[1] });
      i += 1;
      continue;
    }
    const drw = /^\[dessin:(\d+)\]$/.exec(t);
    if (drw) {
      blocks.push({ kind: 'drawing', n: parseInt(drw[1], 10) });
      i += 1;
      continue;
    }
    const cht = /^\[graphique:([^\]]+)\]$/.exec(t);
    if (cht) {
      blocks.push({ kind: 'chart', id: cht[1] });
      i += 1;
      continue;
    }
    if (/^\|\s*.+\|\s*$/.test(t)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|\s*.+\|\s*$/.test(lines[i].trim())) {
        const cells = lines[i]
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i += 1;
      }
      if (rows.length > 0) blocks.push({ kind: 'table', rows });
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'bullet', items });
      continue;
    }
    if (/^\d+\.\s+/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ kind: 'number', items });
      continue;
    }
    if (/^>>>\s?/.test(t)) {
      const parts: string[] = [];
      while (i < lines.length && /^>>>\s?/.test(lines[i].trim())) {
        parts.push(lines[i].trim().replace(/^>>>\s?/, ''));
        i += 1;
      }
      blocks.push({ kind: 'textbox', text: parts.join('\n') });
      continue;
    }
    if (/^>\s?/.test(t)) {
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        parts.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ kind: 'quote', text: parts.join('\n') });
      continue;
    }
    // Paragraphe : regroupe les lignes simples consécutives
    const parts = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3}\s+|[-*]\s+|\d+\.\s+|>\s?|>>>\s?|\|.*\|\s*$|\[image:|\[dessin:|\[graphique:|\[\^\d+\]:)/.test(
        lines[i].trim()
      ) &&
      lines[i].trim() !== PAGEBREAK &&
      lines[i].trim() !== SECTIONBREAK
    ) {
      parts.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: 'para', text: parts.join(' ') });
  }
  return blocks;
}

// ── Segments en-ligne (gras, italique…) avec imbrication ──
export interface InlineSeg {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  sub?: boolean;
  sup?: boolean;
  highlight?: boolean;
  link?: string;
  field?: boolean;
  footnote?: string;
}

interface MarkerDef {
  open: string;
  close: string;
  key: keyof InlineSeg;
  key2?: keyof InlineSeg;
}

const MARKERS: MarkerDef[] = [
  { open: '***', close: '***', key: 'bold', key2: 'italic' },
  { open: '**', close: '**', key: 'bold' },
  { open: '__', close: '__', key: 'underline' },
  { open: '~~', close: '~~', key: 'strike' },
  { open: '==', close: '==', key: 'highlight' },
  { open: '`', close: '`', key: 'code' },
  { open: '^', close: '^', key: 'sup' },
  { open: '*', close: '*', key: 'italic' },
  { open: '~', close: '~', key: 'sub' },
];

export function parseInline(input: string, inherited: Partial<InlineSeg> = {}): InlineSeg[] {
  const segs: InlineSeg[] = [];
  let rest = input;
  // Liens [texte](url), champs {{X}}, notes [^n] d'abord (non imbriqués)
  const special = /(\[[^\]\n]+\]\([^)\n]+\))|(\{\{[A-Za-zÀ-ÿ ]+\}\})|(\[\^(\d+)\])/;
  const flushText = (chunk: string) => {
    if (chunk) segs.push({ text: chunk, ...inherited });
  };
  while (rest.length > 0) {
    const m = special.exec(rest);
    const cut = m ? m.index : -1;
    const head = cut === -1 ? rest : rest.slice(0, cut);
    // Analyse les marqueurs gras/italique dans « head » (récursif)
    flushMarkers(head, inherited, segs);
    if (!m) break;
    if (m[1]) {
      const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(m[1]);
      if (lm) segs.push({ text: lm[1], underline: true, link: lm[2], ...inherited });
    } else if (m[2]) {
      segs.push({ text: `« ${m[2].replace(/[{}]/g, '').trim()} »`, field: true, ...inherited });
    } else if (m[3]) {
      segs.push({ text: m[4], sup: true, footnote: m[4], ...inherited });
    }
    rest = rest.slice((m.index ?? 0) + m[0].length);
  }
  void flushText;
  return segs;
}

function flushMarkers(chunk: string, inherited: Partial<InlineSeg>, out: InlineSeg[]) {
  let rest = chunk;
  while (rest.length > 0) {
    // Position du premier marqueur ; en cas d'ambiguïté (***, **, * au même
    // endroit), on essaie du plus long au plus court et on garde le premier
    // qui a un fermeur (un * seul vide = moitié de ** : on le saute).
    let at = -1;
    for (const def of MARKERS) {
      const i = rest.indexOf(def.open);
      if (i === -1) continue;
      if (at === -1 || i < at) at = i;
    }
    if (at === -1) {
      if (rest) out.push({ text: rest, ...inherited });
      return;
    }
    const cands = MARKERS.filter((d) => rest.indexOf(d.open) === at).sort(
      (a, b) => b.open.length - a.open.length
    );
    let def: MarkerDef | null = null;
    let closeAt = -1;
    for (const d of cands) {
      const c = rest.indexOf(d.close, at + d.open.length);
      if (c === -1) continue;
      // Paire vide avec un marqueur simple = fragment de ** ou ~~ : sauter.
      if (c === at + d.open.length && (d.open === '*' || d.open === '~')) continue;
      def = d;
      closeAt = c;
      break;
    }
    if (!def) {
      // Ouvreur sans fermeur : texte littéral, on reprend après l'ouvreur
      // le plus long (ainsi **a *b* retrouve quand même l'italique b).
      const skipLen = cands.length > 0 ? cands[0].open.length : 1;
      out.push({ text: rest.slice(0, at + skipLen), ...inherited });
      rest = rest.slice(at + skipLen);
      continue;
    }
    if (at > 0) out.push({ text: rest.slice(0, at), ...inherited });
    const inner = rest.slice(at + def.open.length, closeAt);
    if (def.key === 'code' || def.key === 'sub' || def.key === 'sup') {
      out.push({ text: inner, [def.key]: true, ...inherited } as InlineSeg);
    } else {
      const nested = parseInline(inner, {
        ...inherited,
        [def.key]: true,
        ...(def.key2 ? { [def.key2]: true } : {}),
      });
      out.push(...nested);
    }
    rest = rest.slice(closeAt + def.close.length);
  }
}

// ── Échappement HTML ──
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineToHtml(text: string): string {
  return parseInline(text)
    .map((s) => {
      let t = escapeHtml(s.text);
      if (s.code) t = `<code style="background:#f1f5f9;padding:0 4px;border-radius:3px;font-family:monospace">${t}</code>`;
      if (s.bold) t = `<b>${t}</b>`;
      if (s.italic) t = `<i>${t}</i>`;
      if (s.underline) t = `<u>${t}</u>`;
      if (s.strike) t = `<s>${t}</s>`;
      if (s.sup) t = `<sup>${t}</sup>`;
      if (s.sub) t = `<sub>${t}</sub>`;
      if (s.highlight) t = `<mark>${t}</mark>`;
      if (s.field) t = `<span style="background:#fef9c3;border:1px solid #eab308;border-radius:3px;padding:0 4px">${t}</span>`;
      if (s.link) t = `<a href="${escapeHtml(s.link)}">${t}</a>`;
      return t;
    })
    .join('');
}

export interface PrintOptions {
  title: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  lineHeight: number;
  header?: string;
  footer?: string;
  pageNumbers?: boolean;
  columns?: number;
}

export function buildPrintHtml(o: PrintOptions): string {
  const blocks = parseBlocks(o.text);
  const cols = o.columns === 2 ? 'column-count:2;column-gap:32px;' : '';
  const body = blocks
    .map((b) => {
      switch (b.kind) {
        case 'heading':
          return `<h${b.level} style="color:#1e293b;margin:14px 0 6px">${inlineToHtml(b.text)}</h${b.level}>`;
        case 'bullet':
          return `<ul>${b.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join('')}</ul>`;
        case 'number':
          return `<ol>${b.items.map((it) => `<li>${inlineToHtml(it)}</li>`).join('')}</ol>`;
        case 'quote':
          return `<blockquote style="border-left:3px solid #2b579a;margin:8px 0;padding:4px 12px;color:#475569">${inlineToHtml(b.text)}</blockquote>`;
        case 'textbox':
          return `<div style="border:1px solid #94a3b8;border-radius:6px;padding:10px;margin:8px 0;background:#f8fafc">${inlineToHtml(b.text)}</div>`;
        case 'table': {
          const rows = b.rows
            .map(
              (r, ri) =>
                `<tr>${r.map((c) => `<td style="border:1px solid #94a3b8;padding:6px 10px;${ri === 0 ? 'background:#e2e8f0;font-weight:bold;' : ''}">${inlineToHtml(c)}</td>`).join('')}</tr>`
            )
            .join('');
          return `<table style="border-collapse:collapse;margin:8px 0" cellspacing="0" cellpadding="0">${rows}</table>`;
        }
        case 'hr':
          return '<hr style="border:none;border-top:1px solid #94a3b8;margin:12px 0"/>';
        case 'pagebreak':
          return '<div style="page-break-after:always;border-top:1px dashed #94a3b8;margin:12px 0"></div>';
        case 'sectionbreak':
          return '<div style="border-top:2px solid #2b579a;margin:16px 0"></div>';
        case 'footnote':
          return `<p style="font-size:0.85em;color:#64748b"><sup>${b.n}</sup> ${inlineToHtml(b.text)}</p>`;
        case 'image':
          return `<p style="color:#64748b">[Image : ${escapeHtml(b.id)}]</p>`;
        case 'drawing':
          return `<p style="color:#64748b">[Dessin ${b.n}]</p>`;
        case 'chart':
          return `<p style="color:#64748b">[Graphique : ${escapeHtml(b.id)}]</p>`;
        default:
          return `<p>${inlineToHtml((b as { text: string }).text)}</p>`;
      }
    })
    .join('\n');
  const head = o.header ? `<div style="text-align:center;color:#64748b;border-bottom:1px solid #cbd5e1;padding-bottom:8px;margin-bottom:16px">${escapeHtml(o.header)}</div>` : '';
  const foot = o.footer || o.pageNumbers
    ? `<div style="text-align:center;color:#64748b;border-top:1px solid #cbd5e1;padding-top:8px;margin-top:16px">${escapeHtml(o.footer || '')}${o.footer && o.pageNumbers ? ' — ' : ''}${o.pageNumbers ? 'Page <span class="pageno"></span>' : ''}</div>`
    : '';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>${escapeHtml(o.title)}</title>
<style>
@page { size: A4; margin: 18mm 15mm; }
body { font-family: ${o.font}, Arial, sans-serif; font-size: ${o.fontSize}pt; color: ${o.color}; line-height: ${o.lineHeight}; }
.content { ${cols} }
.pageno:after { counter-increment: page; content: counter(page); }
</style></head><body>${head}<div class="content">${body}</div>${foot}</body></html>`;
}

/** Document .doc compatible Word/LibreOffice (HTML encapsulé). */
export function buildDocFile(o: PrintOptions): string {
  const inner = buildPrintHtml(o)
    .replace('<!DOCTYPE html>', '')
    .replace(/<html lang="fr">/, '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">');
  return `MIME-Version: 1.0\nContent-Type: text/html; charset="utf-8"\n\n${inner}`;
}

/** RTF minimaliste (texte + gras/italique/souligné + titres). */
export function buildRtf(o: PrintOptions): string {
  const esc = (s: string) =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .split('')
      .map((ch) => {
        const c = ch.charCodeAt(0);
        if (c === 10) return '\\par ';
        if (c > 127) return `\\u${c > 32767 ? c - 65536 : c}?`;
        return ch;
      })
      .join('');
  const inline = (t: string) =>
    parseInline(stripMarkers(t) === t ? t : t)
      .map((s) => {
        let pre = '';
        let post = '';
        if (s.bold) { pre += '\\b '; post = '\\b0 ' + post; }
        if (s.italic) { pre += '\\i '; post = '\\i0 ' + post; }
        if (s.underline) { pre += '\\ul '; post = '\\ul0 ' + post; }
        if (s.strike) { pre += '\\strike '; post = '\\strike0 ' + post; }
        if (s.sup) { pre += '\\super '; post = '\\nosupersub ' + post; }
        if (s.sub) { pre += '\\sub '; post = '\\nosupersub ' + post; }
        return `{${pre}${esc(s.text)}${post}}`;
      })
      .join('');
  const body = parseBlocks(o.text)
    .map((b) => {
      switch (b.kind) {
        case 'heading':
          return `{\\fs${b.level === 1 ? 40 : b.level === 2 ? 32 : 26}\\b ${inline(b.text)}\\b0\\par}`;
        case 'bullet':
          return b.items.map((it) => `{\\bullet\\tab ${inline(it)}\\par}`).join('\n');
        case 'number':
          return b.items.map((it, k) => `{${k + 1}.\\tab ${inline(it)}\\par}`).join('\n');
        case 'quote':
          return `{\\i ${inline(b.text)}\\i0\\par}`;
        case 'table':
          return b.rows.map((r) => `{${r.map((c) => inline(c)).join(' \\tab ')}\\par}`).join('\n');
        case 'pagebreak':
          return '\\page ';
        case 'sectionbreak':
          return '{\\par\\par}';
        case 'image':
          return `{\\i [Image : ${esc(b.id)}]\\i0\\par}`;
        case 'drawing':
          return `{\\i [Dessin ${b.n}]\\i0\\par}`;
        case 'chart':
          return `{\\i [Graphique : ${esc(b.id)}]\\i0\\par}`;
        case 'footnote':
          return `{\\super ${b.n}\\nosupersub ${inline(b.text)}\\par}`;
        case 'textbox':
          return `{${inline(b.text)}\\par}`;
        case 'hr':
          return '{\\par}';
        default:
          return `{${inline((b as { text: string }).text)}\\par}`;
      }
    })
    .join('\n');
  return `{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0 ${o.font};}}\n\\f0\\fs${Math.round(o.fontSize * 2)}\n${body}\n}`;
}

// ── Sous-couche WYSIWYG : mêmes caractères, marqueurs conservés ──
export interface RichSeg extends InlineSeg {
  marker?: boolean;
}

export function parseInlineKeepMarkers(
  input: string,
  inherited: Partial<InlineSeg> = {}
): RichSeg[] {
  const segs: RichSeg[] = [];
  const special = /(\[[^\]\n]+\]\([^)\n]+\))|(\{\{[A-Za-zÀ-ÿ ]+\}\})|(\[\^(\d+)\])/;
  let rest = input;
  while (rest.length > 0) {
    const m = special.exec(rest);
    const cut = m ? m.index : -1;
    flushMarkersKeep(cut === -1 ? rest : rest.slice(0, cut), inherited, segs);
    if (!m) break;
    if (m[1]) {
      const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(m[1]);
      if (lm) {
        segs.push({ text: '[', marker: true, ...inherited });
        segs.push({ text: lm[1], underline: true, link: lm[2], ...inherited });
        segs.push({ text: '](', marker: true, ...inherited });
        segs.push({ text: lm[2], marker: true, ...inherited });
        segs.push({ text: ')', marker: true, ...inherited });
      }
    } else if (m[2]) {
      const inner = m[2].replace(/[{}]/g, '').trim();
      segs.push({ text: '{{', marker: true, ...inherited });
      segs.push({ text: inner, field: true, ...inherited });
      segs.push({ text: '}}', marker: true, ...inherited });
    } else if (m[3]) {
      segs.push({ text: '[^', marker: true, ...inherited });
      segs.push({ text: m[4], sup: true, footnote: m[4], ...inherited });
      segs.push({ text: ']', marker: true, ...inherited });
    }
    rest = rest.slice((m.index ?? 0) + m[0].length);
  }
  return segs;
}

function flushMarkersKeep(chunk: string, inherited: Partial<InlineSeg>, out: RichSeg[]) {
  let rest = chunk;
  while (rest.length > 0) {
    // Position du premier marqueur ; en cas d'ambiguïté (***, **, * au même
    // endroit), on essaie du plus long au plus court et on garde le premier
    // qui a un fermeur (un * seul vide = moitié de ** : on le saute).
    let at = -1;
    for (const def of MARKERS) {
      const i = rest.indexOf(def.open);
      if (i === -1) continue;
      if (at === -1 || i < at) at = i;
    }
    if (at === -1) {
      if (rest) out.push({ text: rest, ...inherited });
      return;
    }
    const cands = MARKERS.filter((d) => rest.indexOf(d.open) === at).sort(
      (a, b) => b.open.length - a.open.length
    );
    let def: MarkerDef | null = null;
    let closeAt = -1;
    for (const d of cands) {
      const c = rest.indexOf(d.close, at + d.open.length);
      if (c === -1) continue;
      // Paire vide avec un marqueur simple = fragment de ** ou ~~ : sauter.
      if (c === at + d.open.length && (d.open === '*' || d.open === '~')) continue;
      def = d;
      closeAt = c;
      break;
    }
    if (!def) {
      // Ouvreur sans fermeur : texte littéral, on reprend après l'ouvreur
      // le plus long (ainsi **a *b* retrouve quand même l'italique b).
      const skipLen = cands.length > 0 ? cands[0].open.length : 1;
      out.push({ text: rest.slice(0, at + skipLen), ...inherited });
      rest = rest.slice(at + skipLen);
      continue;
    }
    if (at > 0) out.push({ text: rest.slice(0, at), ...inherited });
    out.push({ text: def.open, marker: true, ...inherited });
    const inner = rest.slice(at + def.open.length, closeAt);
    if (def.key === 'code' || def.key === 'sub' || def.key === 'sup') {
      out.push({ text: inner, [def.key]: true, ...inherited } as RichSeg);
    } else {
      out.push(
        ...parseInlineKeepMarkers(inner, {
          ...inherited,
          [def.key]: true,
          ...(def.key2 ? { [def.key2]: true } : {}),
        })
      );
    }
    out.push({ text: def.close, marker: true, ...inherited });
    rest = rest.slice(closeAt + def.close.length);
  }
}

export type UnderlayLineStyle =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'textbox'
  | 'table'
  | 'tablesep'
  | 'muted'
  | null;

export function classifyUnderlayLine(line: string): UnderlayLineStyle {
  const t = line.trim();
  if (/^###\s+/.test(t)) return 'h3';
  if (/^##\s+/.test(t)) return 'h2';
  if (/^#\s+/.test(t)) return 'h1';
  if (/^>>>\s?/.test(t)) return 'textbox';
  if (/^>\s?/.test(t)) return 'quote';
  if (/^\|(\s*:?-{1,}:?\s*\|)+\s*$/.test(t)) return 'tablesep';
  if (/^\|\s*.+\|\s*$/.test(t)) return 'table';
  if (
    t === PAGEBREAK ||
    t === SECTIONBREAK ||
    t === '---' ||
    t === '===' ||
    /^<hr\s*\/?>$/i.test(t) ||
    /^\[image:[^\]]+\]$/.test(t) ||
    /^\[dessin:\d+\]$/.test(t) ||
    /^\[graphique:[^\]]+\]$/.test(t) ||
    /^\[\^\d+\]:/.test(t)
  )
    return 'muted';
  return null;
}

// ─────────────────────────────────────────────────────────────
// Tableaux — moteur d'édition façon Word (pur, testé)
// Inspiré du jeu de commandes de CasualOffice/docs (commands/table.ts),
// adapté au Markdown : lignes/colonnes/suppression/tri/navigation.
// ─────────────────────────────────────────────────────────────

const TABLE_ROW_RE = /^\|\s*.+\|\s*$/;
const TABLE_SEP_RE = /^\|(\s*:?-{1,}:?\s*\|)+\s*$/;

function isTableLine(line: string): boolean {
  return TABLE_ROW_RE.test(line.trim());
}

function isSepLine(line: string): boolean {
  return TABLE_SEP_RE.test(line.trim());
}

/** Découpe une ligne de tableau en cellules (sans les bordures). */
function splitRowCells(line: string): string[] {
  const t = line.trim();
  const inner =
    t.startsWith('|') && t.endsWith('|') && t.length >= 2 ? t.slice(1, -1) : t;
  return inner.split('|');
}

function pipeIdx(line: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < line.length; i += 1) if (line[i] === '|') out.push(i);
  return out;
}

function blankRow(colCount: number): string {
  const cells = Array.from({ length: Math.max(1, colCount) }).map(() => '  ');
  return `| ${cells.join(' | ')} |`;
}

function buildRow(cells: string[], sep: boolean): string {
  return `| ${cells.map((c) => (sep ? c.trim() || '---' : c.trim())).join(' | ')} |`;
}

function lineStartOffset(lines: string[], idx: number): number {
  let off = 0;
  for (let i = 0; i < idx && i < lines.length; i += 1) off += lines[i].length + 1;
  return off;
}

function blockDataRows(lines: string[], start: number, end: number): number[] {
  const rows: number[] = [];
  for (let i = start; i <= end; i += 1) if (!isSepLine(lines[i])) rows.push(i);
  return rows;
}

/** Resserre une plage brute sur son contenu (sans les espaces). */
function trimRange(text: string, s: number, e: number): Selection {
  let a = Math.max(0, s);
  let b = Math.min(text.length, e);
  while (a < b && text[a] === ' ') a += 1;
  while (b > a && text[b - 1] === ' ') b -= 1;
  if (a >= b) return { start: s, end: s };
  return { start: a, end: b };
}

function cellRange(text: string, line: string, lineStart: number, cellIdx: number): Selection {
  const pipes = pipeIdx(line);
  const c = Math.max(0, cellIdx);
  const left = pipes[Math.min(c, pipes.length - 1)] ?? -1;
  const right = pipes[Math.min(c + 1, pipes.length - 1)] ?? line.length;
  return trimRange(text, lineStart + left + 1, lineStart + Math.max(right, left + 1));
}

export interface TableContext {
  inTable: boolean;
  startLine: number; // 1re ligne du bloc (absolue)
  endLine: number; // dernière ligne du bloc (absolue)
  lineIndex: number; // ligne du curseur (absolue)
  row: number; // ligne relative au bloc
  col: number; // colonne du curseur
  colCount: number; // nb de colonnes du bloc
  isSepRow: boolean; // curseur sur une ligne « --- »
  cellStart: number; // offsets doc bruts de la cellule
  cellEnd: number;
}

const NO_TABLE: TableContext = {
  inTable: false,
  startLine: -1,
  endLine: -1,
  lineIndex: -1,
  row: -1,
  col: -1,
  colCount: 0,
  isSepRow: false,
  cellStart: -1,
  cellEnd: -1,
};

/** Contexte tableau à une position : bloc, ligne, colonne, cellule. */
export function tableContextAt(text: string, pos: number): TableContext {
  const lines = text.split('\n');
  const p = Math.max(0, Math.min(pos, text.length));
  let acc = 0;
  let li = 0;
  for (; li < lines.length; li += 1) {
    if (p <= acc + lines[li].length) break;
    acc += lines[li].length + 1;
  }
  if (li >= lines.length) return NO_TABLE;
  const cur = lines[li];
  if (!isTableLine(cur)) return NO_TABLE;
  let start = li;
  while (start > 0 && isTableLine(lines[start - 1])) start -= 1;
  let end = li;
  while (end < lines.length - 1 && isTableLine(lines[end + 1])) end += 1;
  // Nb de colonnes : ligne séparatrice de préférence, sinon 1re ligne.
  let ref = lines[start];
  for (let i = start; i <= end; i += 1) {
    if (isSepLine(lines[i])) {
      ref = lines[i];
      break;
    }
  }
  const colCount = Math.max(1, splitRowCells(ref).length);
  // Colonne : barres verticales strictement avant le curseur, moins une.
  const inLine = p - acc;
  const pipes = pipeIdx(cur);
  let col = 0;
  for (const px of pipes) if (px < inLine) col += 1;
  col = Math.max(0, Math.min(col - 1, colCount - 1));
  const left = pipes[Math.min(col, pipes.length - 1)] ?? -1;
  const right = pipes[Math.min(col + 1, pipes.length - 1)] ?? cur.length;
  return {
    inTable: true,
    startLine: start,
    endLine: end,
    lineIndex: li,
    row: li - start,
    col,
    colCount,
    isSepRow: isSepLine(cur),
    cellStart: acc + left + 1,
    cellEnd: acc + Math.max(right, left + 1),
  };
}

export function tableInsertRow(
  text: string,
  sel: Selection,
  where: 'above' | 'below',
): { text: string; sel: Selection } {
  const ctx = tableContextAt(text, Math.min(sel.start, sel.end));
  if (!ctx.inTable) return { text, sel };
  const lines = text.split('\n');
  const at = ctx.lineIndex + (where === 'below' ? 1 : 0);
  lines.splice(at, 0, blankRow(ctx.colCount));
  const off = lineStartOffset(lines, at);
  return { text: lines.join('\n'), sel: { start: off + 2, end: off + 2 } };
}

export function tableDeleteRow(text: string, sel: Selection): { text: string; sel: Selection } {
  const ctx = tableContextAt(text, Math.min(sel.start, sel.end));
  if (!ctx.inTable) return { text, sel };
  const lines = text.split('\n');
  lines.splice(ctx.lineIndex, 1);
  const next = lines.join('\n');
  if (lines.length === 0) return { text: next, sel: { start: 0, end: 0 } };
  const pos = lineStartOffset(lines, Math.min(ctx.lineIndex, lines.length - 1));
  return { text: next, sel: { start: pos, end: pos } };
}

export function tableInsertCol(
  text: string,
  sel: Selection,
  side: 'left' | 'right',
): { text: string; sel: Selection } {
  const ctx = tableContextAt(text, Math.min(sel.start, sel.end));
  if (!ctx.inTable) return { text, sel };
  const lines = text.split('\n');
  const at = ctx.col + (side === 'right' ? 1 : 0);
  for (let i = ctx.startLine; i <= ctx.endLine; i += 1) {
    const sep = isSepLine(lines[i]);
    const cells = splitRowCells(lines[i]);
    while (cells.length < ctx.colCount) cells.push(sep ? '---' : '  ');
    cells.splice(Math.min(at, cells.length), 0, sep ? '---' : '  ');
    lines[i] = buildRow(cells, sep);
  }
  const next = lines.join('\n');
  const rebuilt = lines[ctx.lineIndex];
  const pipes = pipeIdx(rebuilt);
  const pos = lineStartOffset(lines, ctx.lineIndex) + (pipes[Math.min(at, pipes.length - 1)] ?? 0) + 2;
  return { text: next, sel: { start: pos, end: pos } };
}

export function tableDeleteCol(text: string, sel: Selection): { text: string; sel: Selection } {
  const ctx = tableContextAt(text, Math.min(sel.start, sel.end));
  if (!ctx.inTable) return { text, sel };
  if (ctx.colCount <= 1) return tableDeleteBlock(text, sel);
  const lines = text.split('\n');
  for (let i = ctx.startLine; i <= ctx.endLine; i += 1) {
    const sep = isSepLine(lines[i]);
    const cells = splitRowCells(lines[i]);
    while (cells.length < ctx.colCount) cells.push(sep ? '---' : '  ');
    cells.splice(Math.min(ctx.col, cells.length - 1), 1);
    lines[i] = buildRow(cells, sep);
  }
  const next = lines.join('\n');
  const pos = lineStartOffset(lines, ctx.lineIndex) + 2;
  return { text: next, sel: { start: pos, end: pos } };
}

export function tableDeleteBlock(text: string, sel: Selection): { text: string; sel: Selection } {
  const ctx = tableContextAt(text, Math.min(sel.start, sel.end));
  if (!ctx.inTable) return { text, sel };
  const lines = text.split('\n');
  const off = lineStartOffset(lines, ctx.startLine);
  lines.splice(ctx.startLine, ctx.endLine - ctx.startLine + 1);
  const next = lines.join('\n');
  const pos = Math.min(off, next.length);
  return { text: next, sel: { start: pos, end: pos } };
}

export function tableSelectRow(text: string, sel: Selection): { text: string; sel: Selection } {
  const ctx = tableContextAt(text, Math.min(sel.start, sel.end));
  if (!ctx.inTable) return { text, sel };
  const lines = text.split('\n');
  const off = lineStartOffset(lines, ctx.lineIndex);
  return { text, sel: { start: off, end: off + lines[ctx.lineIndex].length } };
}

/** Tri des lignes de données selon la colonne du curseur (en-tête épinglée). */
export function tableSort(text: string, sel: Selection, dir: 1 | -1): { text: string; sel: Selection } {
  const ctx = tableContextAt(text, Math.min(sel.start, sel.end));
  if (!ctx.inTable) return { text, sel };
  const lines = text.split('\n');
  const data = blockDataRows(lines, ctx.startLine, ctx.endLine);
  if (data.length < 2) return { text, sel };
  const key = (lineIdx: number): string => {
    const cells = splitRowCells(lines[lineIdx]);
    return (cells[Math.min(ctx.col, cells.length - 1)] ?? '').trim();
  };
  const rest = data.slice(1);
  rest.sort((a, b) => dir * key(a).localeCompare(key(b), 'fr', { numeric: true, sensitivity: 'base' }));
  const sorted = lines.slice();
  rest.forEach((lineIdx, k) => {
    sorted[data[k + 1]] = lines[lineIdx];
  });
  return { text: sorted.join('\n'), sel };
}

/**
 * Navigation clavier dans un tableau (Tab / Maj+Tab / Entrée).
 * Retourne null hors tableau (laisser le comportement normal).
 * - Tab sur la dernière cellule : ajoute une ligne (façon Word) ;
 * - Entrée en fin de dernière ligne : null (sortir du tableau).
 */
export function tableCellNav(
  text: string,
  sel: Selection,
  move: 'next' | 'prev' | 'down',
): { text: string; sel: Selection } | null {
  const pos = Math.max(sel.start, sel.end);
  const ctx = tableContextAt(text, pos);
  if (!ctx.inTable) return null;
  const lines = text.split('\n');
  const data = blockDataRows(lines, ctx.startLine, ctx.endLine);
  const blockStart = lineStartOffset(lines, ctx.startLine);

  const gotoAppended = (col: number): { text: string; sel: Selection } => {
    const nl = lines.slice();
    nl.splice(ctx.endLine + 1, 0, blankRow(ctx.colCount));
    const next = nl.join('\n');
    const off = lineStartOffset(nl, ctx.endLine + 1);
    return { text: next, sel: cellRange(next, nl[ctx.endLine + 1], off, Math.min(col, ctx.colCount - 1)) };
  };

  if (data.length === 0) {
    // Bloc dégénéré (que des lignes « --- »).
    if (move === 'prev') return { text, sel: { start: blockStart, end: blockStart } };
    return gotoAppended(0);
  }

  const di = data.indexOf(ctx.lineIndex);
  if (di === -1) {
    // Curseur sur une ligne « --- » : on rejoint les données les plus proches.
    const before = data.filter((d) => d < ctx.lineIndex);
    const after = data.filter((d) => d > ctx.lineIndex);
    if (move === 'prev') {
      if (before.length === 0) return { text, sel: { start: blockStart, end: blockStart } };
      const li = before[before.length - 1];
      return { text, sel: cellRange(text, lines[li], lineStartOffset(lines, li), splitRowCells(lines[li]).length - 1) };
    }
    if (after.length === 0) return gotoAppended(move === 'down' ? ctx.col : 0);
    const li = after[0];
    const n = splitRowCells(lines[li]).length;
    const targetCol = move === 'down' ? Math.min(ctx.col, n - 1) : 0;
    return { text, sel: cellRange(text, lines[li], lineStartOffset(lines, li), Math.max(0, targetCol)) };
  }

  const cellsHere = splitRowCells(lines[ctx.lineIndex]).length;
  if (move === 'next') {
    if (ctx.col + 1 < cellsHere) {
      return { text, sel: cellRange(text, lines[ctx.lineIndex], lineStartOffset(lines, ctx.lineIndex), ctx.col + 1) };
    }
    if (di + 1 < data.length) {
      const li = data[di + 1];
      return { text, sel: cellRange(text, lines[li], lineStartOffset(lines, li), 0) };
    }
    return gotoAppended(0);
  }
  if (move === 'prev') {
    if (ctx.col > 0) {
      return { text, sel: cellRange(text, lines[ctx.lineIndex], lineStartOffset(lines, ctx.lineIndex), ctx.col - 1) };
    }
    if (di > 0) {
      const li = data[di - 1];
      return { text, sel: cellRange(text, lines[li], lineStartOffset(lines, li), splitRowCells(lines[li]).length - 1) };
    }
    return { text, sel: { start: blockStart, end: blockStart } };
  }
  // move === 'down'
  if (di + 1 < data.length) {
    const li = data[di + 1];
    return {
      text,
      sel: cellRange(text, lines[li], lineStartOffset(lines, li), Math.min(ctx.col, splitRowCells(lines[li]).length - 1)),
    };
  }
  // Dernière ligne de données : en fin de ligne, on laisse Entrée sortir du tableau.
  if (pos >= lineStartOffset(lines, ctx.lineIndex) + lines[ctx.lineIndex].length) return null;
  return gotoAppended(ctx.col);
}

// ─────────────────────────────────────────────────────────────
// Correction automatique (bouton « Tout corriger »)
// Mêmes règles que proofFrench, sauf a/à et sa/ça (jugement humain).
// ─────────────────────────────────────────────────────────────

export interface AutoFixResult {
  text: string;
  count: number;
}

export function applyAutoFix(input: string): AutoFixResult {
  let t = input;
  let n = 0;
  // 1. Points de suspension (avant la règle d'espacement).
  t = t.replace(/\.{3,}/g, () => {
    n += 1;
    return '…';
  });
  // 2. Coquilles fréquentes (casse préservée).
  const typoFix: Array<[RegExp, string]> = [
    [/\baujoud[’']hui\b/gi, 'aujourd’hui'],
    [/\blanguage\b/gi, 'langage'],
    [/\bparmis\b/gi, 'parmi'],
    [/\bmalgrés\b/gi, 'malgré'],
  ];
  for (const [rx, fix] of typoFix) {
    rx.lastIndex = 0;
    t = t.replace(rx, (w: string) => {
      n += 1;
      const first = w.slice(0, 1);
      const head = first === first.toUpperCase() ? fix.slice(0, 1).toUpperCase() : fix.slice(0, 1);
      return head + fix.slice(1);
    });
  }
  // 3. Mots répétés sur la même ligne (jamais à travers un saut de ligne).
  t = t.replace(/\b([A-Za-zÀ-ÿ]+)([ \t]+)\1\b/gi, (m: string, w: string) => {
    void m;
    n += 1;
    return w;
  });
  // 4. Espaces multiples (hors retraits en début de ligne).
  t = t.replace(/(\S) {2,}/g, (m: string, c: string) => {
    void m;
    n += 1;
    return `${c} `;
  });
  // 5. Espace après ponctuation (hors nombres, URL et domaines).
  t = t.replace(
    /([,.;:!?…])([^\s\d"'’»/.…])/g,
    (m: string, p1: string, p2: string, off: number, whole: string) => {
      void m;
      if (p1 === '.' && /^[a-z]{2,4}\b/.test(whole.slice(off + 1))) return `${p1}${p2}`;
      n += 1;
      return `${p1} ${p2}`;
    },
  );
  // 6. Majuscule en début de phrase.
  t = t.replace(/([.!?…]\s+)([a-zàâäéèêëîïôöùûüç])/g, (m: string, p1: string, p2: string) => {
    void m;
    n += 1;
    return p1 + p2.toUpperCase();
  });
  return { text: t, count: n };
}
