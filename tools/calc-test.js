// Tests unitaires du moteur de formules Calc (français, sans navigateur).
// Usage : node tools/calc-test.js   (depuis la racine du dépôt)
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calc-test-'));
execSync(
  `npx --no-install tsc src/utils/calcEngine.ts src/components/calc/chartData.ts --outDir "${outDir}" --module commonjs --target es2020 --skipLibCheck`,
  { cwd: root, stdio: 'pipe' }
);
const eng = require(path.join(outDir, 'utils', 'calcEngine.js'));
const chd = require(path.join(outDir, 'components', 'calc', 'chartData.js'));
const { rangeToSeries, guessSumRange, selectionStats } = chd;
const {
  parseCellCoord, coordToString, expandRange, splitArguments,
  evaluateFormula, formatCellValue, isFormula, isError,
} = eng;

let pass = 0;
let fail = 0;
const eq = (nom, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${nom}${ok ? '' : ` | reçu ${JSON.stringify(got)}, attendu ${JSON.stringify(want)}`}`);
};

// Feuille de test : A1=10 A2=20 A3=30 B1="5"(texte) B2=VRAI C1(formule)
const cells = {
  A1: 10, A2: 20, A3: 30,
  B1: '5', B2: true, B3: 'texte',
  C1: '=A1*2', C2: '=C1+A2', C3: '=B3&"!"',
  D1: '=D2', D2: '=D1', // circulaire
};
const get = (c) => cells[c];
const ev = (f) => evaluateFormula(f, get);

// ── Coordonnées / plages ──
eq('coord A1', parseCellCoord('A1'), { col: 0, row: 0 });
eq('coord $B$12', parseCellCoord('$B$12'), { col: 1, row: 11 });
eq('coord AA10', parseCellCoord('AA10'), { col: 26, row: 9 });
eq('coord invalide', parseCellCoord('ZZ'), null);
eq('coordToString', coordToString(27, 4), 'AB5');
eq('plage 2x2', expandRange('A1', 'B2'), ['A1', 'B1', 'A2', 'B2']);
eq('plage inversée', expandRange('B2', 'A1'), ['A1', 'B1', 'A2', 'B2']);
eq('split ;', splitArguments('A1;"a;b";SI(1;2;3)'), ['A1', '"a;b"', 'SI(1;2;3)']);
eq('isFormula', isFormula('=1+1') && !isFormula('x'), true);

// ── Arithmétique / précédences / opérateurs ──
eq('addition', ev('=1+2'), 3);
eq('précédence */+', ev('=2+3*4'), 14);
eq('parenthèses', ev('=(2+3)*4'), 20);
eq('division', ev('=20/4'), 5);
eq('div zéro', ev('=1/0'), '#DIV/0!');
eq('puissance', ev('=2^3'), 8);
eq('pourcent', ev('=50%'), 0.5);
eq('unaires', ev('=-5+8'), 3);
eq('décimale virgule', ev('=3,5+1'), 4.5);
eq('décimale point', ev('=3.5+1'), 4.5);
eq('référence', ev('=A1+A2'), 30);
eq('réf absolue', ev('=$A$1*2'), 20);
eq('casse insensible', ev('=a1+1'), 11);

// ── Concaténation / comparaisons ──
eq('concat &', ev('="a"&"b"'), 'ab');
eq('concat réf', ev('=C3'), 'texte!');
eq('égal', ev('=A1=10'), true);
eq('différent', ev('=A1<>10'), false);
eq('supérieur', ev('=A2>A1'), true);
eq('inférieur texte', ev('="a"<"b"'), true);
eq('comparaison mixte', ev('=A1<"x"'), true);

// ── Fonctions de base ──
eq('SOMME plage', ev('=SOMME(A1:A3)'), 60);
eq('SOMME args', ev('=SOMME(1;2;3)'), 6);
eq('SOMME mixte', ev('=SOMME(A1:A3;B1;100)'), 165);
eq('SOMME ignore texte', ev('=SOMME(B3;10)'), 10);
eq('MOYENNE', ev('=MOYENNE(A1:A3)'), 20);
eq('MOYENNE vide', ev('=MOYENNE(B3)'), '#DIV/0!');
eq('MAX', ev('=MAX(A1:A3;100)'), 100);
eq('MIN', ev('=MIN(A1:A3)'), 10);
eq('NB', ev('=NB(A1:A3;B1;B3)'), 4);
eq('NBVAL', ev('=NBVAL(A1:A3;B3;Z99)'), 4);

// ── Logique ──
eq('SI vrai', ev('=SI(A1>5;"Grand";"Petit")'), 'Grand');
eq('SI faux', ev('=SI(A1>50;"Grand";"Petit")'), 'Petit');
eq('SI imbriqué', ev('=SI(A1>50;"G";SI(A1>5;"M";"P"))'), 'M');
eq('SI sans sinon', ev('=SI(FAUX;1)'), false);
eq('ET', ev('=ET(A1>0;A2>0)'), true);
eq('OU', ev('=OU(A1>50;A2>10)'), true);
eq('ET plage', ev('=ET(A1:A3>5)'), '#VALEUR!'); // pas de matriciel MVP
eq('VRAI/FAUX', ev('=VRAI()'), true);
eq('constante VRAI', ev('=VRAI'), true);
eq('booléen arithm', ev('=VRAI+1'), 2);

// ── Chaînes / erreurs ──
eq('guillemets ""', ev('="a""b"'), 'a"b');
eq('fonction inconnue', ev('=TRUC(1)'), '#NOM?');
eq('anglais refusé', ev('=SUM(1)'), '#NOM?');
eq('syntaxe', ev('=1+'), '#VALEUR!');
eq('parens', ev('=(1+2'), '#VALEUR!');
eq('plage seule', ev('=A1:A2'), '#VALEUR!');
eq('circulaire', ev('=D1'), '#REF!');
eq('formule chaînée', ev('=C2'), 40);
eq('erreur propagée', ev('=1/0+5'), '#DIV/0!');
eq('isError', isError('#DIV/0!') && !isError(5), true);

// ── Affichage ──
eq('fmt bool', formatCellValue(true), 'VRAI');
eq('fmt décimal', formatCellValue(3.14159), '3,14');
eq('fmt monétaire', formatCellValue(1234.5, 'currency').replace(/[\s\u202f]/g, ''), '1234,50€');
eq('fmt pourcent', formatCellValue(0.156, 'percent').replace(/[\s\u202f]/g, ''), '15,6%');

// ── Données graphiques ──
const sh = { data: {
  A1: { value: 'Mois' }, B1: { value: 'Ventes' }, C1: { value: 'Coûts' },
  A2: { value: 'Jan' }, B2: { value: 100 }, C2: { value: 60 },
  A3: { value: 'Fév' }, B3: { value: 150 }, C3: { value: 90 },
} };
const m = rangeToSeries(sh, 'A1', 'C3');
eq('séries labels', m.labels, ['Jan', 'Fév']);
eq('séries noms', m.series.map((s) => s.name), ['Ventes', 'Coûts']);
eq('séries valeurs', m.series[0].values, [100, 150]);
const col = rangeToSeries(sh, 'B1', 'B3');
eq('colonne unique', [col.series[0].name, col.labels, col.series[0].values], ['Ventes', ['2', '3'], [100, 150]]);
const row = rangeToSeries(sh, 'B2', 'C2');
eq('ligne unique', [row.labels, row.series[0].values], [['B', 'C'], [100, 60]]);
eq('plage inversée', rangeToSeries(sh, 'C3', 'A1').labels, ['Jan', 'Fév']);
eq('Σ devine dessus', guessSumRange(sh, 'B4'), { start: 'B2', end: 'B3' });
eq('Σ devine gauche', guessSumRange({ data: { A5: { value: 1 }, B5: { value: 2 } } }, 'C5'), { start: 'A5', end: 'B5' });
eq('Σ rien', guessSumRange(sh, 'Z9'), null);
eq('stats sélection', selectionStats(sh, ['A1', 'B2', 'C2', 'Z9']), { sum: 160, avg: 80, count: 2 });

console.log(`\nTOTAL: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
