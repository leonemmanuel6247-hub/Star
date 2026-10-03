// Tests unitaires du moteur de formatage Writer (rapides, sans navigateur).
// Usage : node tools/toggle-test.js   (depuis la racine du dépôt)
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fmt-test-'));
execSync(
  `npx tsc src/components/writer/format.ts --outDir "${outDir}" --module commonjs --target es2020 --skipLibCheck`,
  { cwd: root, stdio: 'pipe' }
);
const fmt = require(path.join(outDir, 'format.js'));
const { toggleWrap, parseInline, parseInlineKeepMarkers, stripMarkers } = fmt;

let pass = 0;
let fail = 0;
function eq(nom, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nom}${ok ? '' : ` | reçu ${a} ≠ attendu ${e}`}`);
}
const T = (text, s, e, m) => toggleWrap(text, { start: s, end: e }, m);
const TT = (r, m) => toggleWrap(r.text, r.sel, m);

// ── Gras ──
eq('gras wrap', T('alpha beta', 6, 10, '**'), { text: 'alpha **beta**', sel: { start: 8, end: 12 } });
eq('gras off (dehors)', T('alpha **beta**', 8, 12, '**'), { text: 'alpha beta', sel: { start: 6, end: 10 } });
eq('gras off (inclus)', T('**beta**', 0, 8, '**'), { text: 'beta', sel: { start: 0, end: 4 } });
eq('gras idempotent', TT(T('alpha beta', 6, 10, '**'), '**'), { text: 'alpha beta', sel: { start: 6, end: 10 } });
eq('gras curseur seul', T('ab', 1, 1, '**'), { text: 'a****b', sel: { start: 3, end: 3 } });
eq('gras réappui retire', T('a****b', 3, 3, '**'), { text: 'ab', sel: { start: 1, end: 1 } });
eq('gras mixte normalisé', T('**x** y', 0, 7, '**'), { text: '**x y**', sel: { start: 2, end: 5 } });
eq('gras sur *** -> *', T('***x***', 0, 7, '**'), { text: '*x*', sel: { start: 0, end: 3 } });
eq('gras aller-retour ***', TT(T('***x***', 0, 7, '**'), '**').text, '***x***');
eq('gras sur *x* -> ***', T('*x*', 0, 3, '**').text, '***x***');
eq('gras jamais ****', T('**x** y', 0, 8, '**').text.includes('****'), false);
eq('gras nettoie ****', T('****x****', 0, 9, '**').text, 'x');

// ── Italique ──
eq('ital wrap', T('beta', 0, 4, '*').text, '*beta*');
eq('ital off', T('*beta*', 1, 5, '*').text, 'beta');
eq('ital imbrique ** -> ***', T('**x**', 0, 5, '*').text, '***x***');
eq('ital *** -> **', T('***x***', 0, 7, '*').text, '**x**');
eq('ital aller-retour ***', TT(T('***x***', 0, 7, '*'), '*').text, '***x***');
eq('ital mixte', T('*a* b', 0, 5, '*').text, '*a b*');
eq('ital curseur aller-retour', TT(T('ab', 1, 1, '*'), '*').text, 'ab');

// ── Autres formats ──
eq('souligné aller-retour', TT(T('mot', 0, 3, '__'), '__').text, 'mot');
eq('barré aller-retour', TT(T('mot', 0, 3, '~~'), '~~').text, 'mot');
eq('surligné aller-retour', TT(T('mot', 0, 3, '=='), '==').text, 'mot');
eq('exposant aller-retour', TT(T('x', 0, 1, '^'), '^').text, 'x');
eq('code aller-retour', TT(T('c', 0, 1, '`'), '`').text, 'c');
eq('indice imbrique ~~', T('~~x~~', 0, 5, '~').text, '~~~x~~~');
eq('indice désimbrique', T('~~~x~~~', 0, 7, '~').text, '~~x~~');

// ── Parseur : documents valides inchangés ──
eq('parse valide', parseInline('**b** and *i*'), [
  { text: 'b', bold: true },
  { text: ' and ' },
  { text: 'i', italic: true },
]);
eq('parse ***', parseInline('***x***'), [{ text: 'x', bold: true, italic: true }]);

// ── Parseur : repli élégant (jamais de soupe, jamais de gras-qui-devient-italique) ──
const fb = parseInline('***x* y**');
eq('repli *** adjacent -> gras', fb.length > 0 && fb[0].bold === true, true);
eq('repli garde italique interne', fb.some((s) => s.italic && s.text === 'x'), true);
const fb2 = parseInline('**a *b*');
eq('repli ** non fermé', fb2.some((s) => s.italic && s.text === 'b'), true);
eq('repli ** non fermé visible', fb2.map((s) => s.text).join('').includes('**a '), true);
const lone = parseInline('**bold');
eq('** non fermé reste visible', lone.map((s) => s.text).join(''), '**bold');
eq('** non fermé sans gras', lone.every((s) => !s.bold), true);
eq('**** = paire vide', parseInline('****'), []);
const keep = parseInlineKeepMarkers('**ab');
eq('keep ** visible', keep.map((s) => s.text).join(''), '**ab');
eq('keep ** sans marqueur', keep.every((s) => !s.marker), true);

// ── Divers ──
eq('strip ***', stripMarkers('***x***'), 'x');

console.log(`\nTOTAL: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
