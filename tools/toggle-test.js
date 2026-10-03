// Tests unitaires du moteur de formatage Writer (rapides, sans navigateur).
// Usage : node tools/toggle-test.js   (depuis la racine du dépôt)
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fmt-test-'));
execSync(
  `npx --no-install tsc src/components/writer/format.ts --outDir "${outDir}" --module commonjs --target es2020 --skipLibCheck`,
  { cwd: root, stdio: 'pipe' }
);
const fmt = require(path.join(outDir, 'format.js'));
const {
  toggleWrap, parseInline, parseInlineKeepMarkers, stripMarkers, proofFrench,
  tableContextAt, tableInsertRow, tableDeleteRow, tableInsertCol, tableDeleteCol,
  tableDeleteBlock, tableSelectRow, tableSort, tableCellNav, applyAutoFix,
  buildPrintHtml, buildDocFile, buildRtf,
} = fmt;

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

// ── Tableaux : contexte ──
const T2 = '| Nom | Ville |\n| --- | --- |\n| Zoe | Paris |\n| Max | Lyon |';
eq('ctx cellule (0,0)', tableContextAt(T2, 2), { inTable: true, startLine: 0, endLine: 3, lineIndex: 0, row: 0, col: 0, colCount: 2, isSepRow: false, cellStart: 1, cellEnd: 6 });
eq('ctx cellule (2,0)', ((c) => [c.lineIndex, c.row, c.col, c.isSepRow])(tableContextAt(T2, 33)), [2, 2, 0, false]);
eq('ctx ligne ---', ((c) => [c.isSepRow, c.col])(tableContextAt(T2, 18)), [true, 0]);
eq('ctx colonne 1', ((c) => [c.col, c.cellStart, c.cellEnd])(tableContextAt(T2, 10)), [1, 7, 14]);
eq('ctx hors tableau', tableContextAt('hello', 2).inTable, false);

// ── Tableaux : lignes ──
eq('ligne en-dessous', tableInsertRow(T2, { start: 33, end: 33 }, 'below'), { text: '| Nom | Ville |\n| --- | --- |\n| Zoe | Paris |\n|    |    |\n| Max | Lyon |', sel: { start: 48, end: 48 } });
eq('ligne au-dessus', tableInsertRow(T2, { start: 33, end: 33 }, 'above'), { text: '| Nom | Ville |\n| --- | --- |\n|    |    |\n| Zoe | Paris |\n| Max | Lyon |', sel: { start: 32, end: 32 } });
eq('ligne hors tableau', tableInsertRow('hello', { start: 0, end: 0 }, 'below'), { text: 'hello', sel: { start: 0, end: 0 } });
eq('suppr ligne', tableDeleteRow(T2, { start: 33, end: 33 }), { text: '| Nom | Ville |\n| --- | --- |\n| Max | Lyon |', sel: { start: 30, end: 30 } });
eq('suppr ligne unique', tableDeleteRow('| a |', { start: 1, end: 1 }), { text: '', sel: { start: 0, end: 0 } });

// ── Tableaux : colonnes ──
const T2C3 = '| Nom |  | Ville |\n| --- | --- | --- |\n| Zoe |  | Paris |\n| Max |  | Lyon |';
eq('colonne à droite', tableInsertCol(T2, { start: 33, end: 33 }, 'right'), { text: T2C3, sel: { start: 47, end: 47 } });
eq('colonne à gauche (col 1)', tableInsertCol(T2, { start: 38, end: 38 }, 'left').text, T2C3);
eq('suppr colonne', tableDeleteCol(T2, { start: 33, end: 33 }), { text: '| Ville |\n| --- |\n| Paris |\n| Lyon |', sel: { start: 20, end: 20 } });
eq('suppr dernière colonne = bloc', tableDeleteCol('| a |\n| --- |\n| b |', { start: 1, end: 1 }), { text: '', sel: { start: 0, end: 0 } });

// ── Tableaux : bloc, sélection, tri ──
eq('suppr bloc', tableDeleteBlock('intro\n' + T2 + '\nfin', { start: 55, end: 55 }), { text: 'intro\nfin', sel: { start: 6, end: 6 } });
eq('sélect ligne', tableSelectRow(T2, { start: 33, end: 33 }), { text: T2, sel: { start: 30, end: 45 } });
const TS = '| Nom | Age |\n| --- | --- |\n| Zoe | 30 |\n| Max | 7 |\n| Ana | 25 |';
eq('tri A-Z col 0', tableSort(TS, { start: 32, end: 32 }, 1).text, '| Nom | Age |\n| --- | --- |\n| Ana | 25 |\n| Max | 7 |\n| Zoe | 30 |');
eq('tri Z-A col 1 numérique', tableSort(TS, { start: 38, end: 38 }, -1).text, '| Nom | Age |\n| --- | --- |\n| Zoe | 30 |\n| Ana | 25 |\n| Max | 7 |');
eq('tri une seule ligne = inchangé', tableSort('| a |\n| --- |', { start: 1, end: 1 }, 1).text, '| a |\n| --- |');

// ── Tableaux : navigation Tab/Entrée ──
eq('nav suivante', tableCellNav(T2, { start: 2, end: 2 }, 'next'), { text: T2, sel: { start: 8, end: 13 } });
eq('nav suivante saute ---', tableCellNav(T2, { start: 10, end: 10 }, 'next'), { text: T2, sel: { start: 32, end: 35 } });
eq('nav Tab fin = nouvelle ligne', tableCellNav(T2, { start: 56, end: 56 }, 'next'), { text: T2 + '\n|    |    |', sel: { start: 62, end: 62 } });
eq('nav précédente', tableCellNav(T2, { start: 39, end: 39 }, 'prev'), { text: T2, sel: { start: 32, end: 35 } });
eq('nav précédent début = bloc', tableCellNav(T2, { start: 2, end: 2 }, 'prev'), { text: T2, sel: { start: 0, end: 0 } });
eq('nav bas', tableCellNav(T2, { start: 33, end: 33 }, 'down'), { text: T2, sel: { start: 48, end: 51 } });
eq('nav bas fin tableau = null', tableCellNav(T2, { start: 60, end: 60 }, 'down'), null);
eq('nav bas dernière ligne = étend', tableCellNav(T2, { start: 49, end: 49 }, 'down'), { text: T2 + '\n|    |    |', sel: { start: 62, end: 62 } });
eq('nav hors tableau = null', tableCellNav('hello', { start: 1, end: 1 }, 'next'), null);
eq('nav depuis --- vers bas', tableCellNav(T2, { start: 18, end: 18 }, 'next'), { text: T2, sel: { start: 32, end: 35 } });
eq('nav depuis --- vers haut', tableCellNav(T2, { start: 18, end: 18 }, 'prev'), { text: T2, sel: { start: 8, end: 13 } });
eq('nav cellule vide = curseur', tableCellNav('| a |\n| --- |\n|  |', { start: 2, end: 2 }, 'down'), { text: '| a |\n| --- |\n|  |', sel: { start: 15, end: 15 } });

// ── Correction automatique ──
eq('fix doubles espaces', applyAutoFix('a  b'), { text: 'a b', count: 1 });
eq('fix retrait préservé', applyAutoFix('  indented'), { text: '  indented', count: 0 });
eq('fix mot répété', applyAutoFix('le le chat'), { text: 'le chat', count: 1 });
eq('fix répété casse', applyAutoFix('Le le'), { text: 'Le', count: 1 });
eq('fix répété multi-ligne ignoré', applyAutoFix('mot\nmot'), { text: 'mot\nmot', count: 0 });
eq('fix répété multi-ligne signalé', proofFrench('mot\nmot').length, 1);
eq('fix points', applyAutoFix('vite...'), { text: 'vite…', count: 1 });
eq('fix ponctuation', applyAutoFix('a,b'), { text: 'a, b', count: 1 });
eq('fix majuscule', applyAutoFix('fini. suite'), { text: 'fini. Suite', count: 1 });
eq('fix chaîne', applyAutoFix('fini.suite'), { text: 'fini. Suite', count: 2 });
eq('fix coquilles', applyAutoFix('parmis les language'), { text: 'parmi les langage', count: 2 });
eq('fix coquille casse', applyAutoFix('Parmis'), { text: 'Parmi', count: 1 });
eq('fix URL intacte', applyAutoFix('voir http://x.fr/page'), { text: 'voir http://x.fr/page', count: 0 });
eq('fix e-mail intact', applyAutoFix('écris à a@b.com vite'), { text: 'écris à a@b.com vite', count: 0 });
eq('fix M. Dupont', applyAutoFix('M.dupont vient'), { text: 'M. Dupont vient', count: 2 });
eq('preuve ignore URL', proofFrench('voir http://x.fr').length, 0);
eq('preuve signale a,b', proofFrench('a,b').some((i) => i.message.includes('Espace manquante')), true);

// ── Divers ──
eq('strip ***', stripMarkers('***x***'), 'x');

// ── Export impression/PDF/DOC/RTF : couleurs, liens, police ──
const sampleText = '# Titre\nUn ==surligné==, du `code` et un [lien](https://x.fr).\n| A | B |\n| --- | --- |\n| 1 | 2 |';
const printOpts = { title: 't', text: sampleText, font: 'DejaVu Sans', fontSize: 12, color: '#123456', lineHeight: 1.5, highlight: '#ff0000', fontFaceCss: 'FACE' };
const printHtml = buildPrintHtml(printOpts);
eq('print conserve les fonds (color-adjust)', printHtml.includes('print-color-adjust: exact') && printHtml.includes('-webkit-print-color-adjust: exact'), true);
eq('print surlignage couleur choisie', printHtml.includes('<mark style="background:#ff0000">'), true);
eq('print surlignage défaut jaune', buildPrintHtml({ ...printOpts, highlight: undefined }).includes('<mark>'), true);
eq('print lien stylé', printHtml.includes('<a href="https://x.fr" style="color:#2b579a'), true);
eq('print police quotée', printHtml.includes("font-family: 'DejaVu Sans', Arial"), true);
eq('print injecte @font-face', printHtml.includes('FACE'), true);
eq('print fond code conservé', printHtml.includes('<code style="background:#f1f5f9'), true);
eq('print fond entête tableau', printHtml.includes('background:#e2e8f0'), true);
eq('doc hérite color-adjust', buildDocFile(printOpts).includes('print-color-adjust'), true);
eq('rtf police choisie', buildRtf(printOpts).includes('DejaVu Sans'), true);

console.log(`\nTOTAL: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
