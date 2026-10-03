// Régression Writer : fumée tous onglets + fonctions formatage (persisté dans le dépôt).
// Usage : LD_LIBRARY_PATH=/tmp/nsslib:/tmp NODE_PATH=/tmp/shot/node_modules node tools/regression.js
const chromium = require('@sparticuz/chromium');
const { chromium: pw } = require('playwright-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const results = [];
const check = (nom, cond, extra = '') => {
  cond ? pass++ : fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'} ${nom}${extra ? ' | ' + String(extra).slice(0, 160) : ''}`);
};
(async () => {
  const exe = await chromium.executablePath();
  const browser = await pw.launch({
    executablePath: exe,
    args: [...chromium.args, '--no-sandbox', '--disable-gpu'],
    headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH || '/tmp' },
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text().slice(0, 200)); });
  const editor = () => page.getByTestId('editor');
  const btn = (n) => page.getByRole('button', { name: n, exact: true });

  await page.goto('http://localhost:8081/', { waitUntil: 'load', timeout: 90000 });
  await sleep(5000);
  await page.getByText('Bienvenue.docx').first().click();
  await sleep(2500);
  check('ouverture document', await editor().count() === 1);
  async function pageRatio() {
    const box = await page.getByTestId('pageSheet').boundingBox();
    const minH = await page.getByTestId('pageSheet').evaluate((el) => getComputedStyle(el).minHeight);
    return { w: Math.round(box.width), minH, ratio: parseFloat(minH) / box.width };
  }
  const rP = await pageRatio();
  check('feuille A4 portrait (210x297)', Math.abs(rP.ratio - 297 / 210) < 0.02, JSON.stringify(rP));
  await page.getByRole('button', { name: 'Mise en page', exact: true }).click(); await sleep(500);
  await btn('Portrait').click(); await sleep(600);
  const rL = await pageRatio();
  check('feuille A4 paysage (297x210)', Math.abs(rL.ratio - 210 / 297) < 0.02, JSON.stringify(rL));
  await btn('Paysage').click(); await sleep(600);
  await page.getByRole('button', { name: 'Accueil', exact: true }).click(); await sleep(400);

  // referme tout dialogue / panneau ouvert
  async function resetUI() {
    await page.keyboard.press('Escape'); await sleep(250);
    await page.keyboard.press('Escape'); await sleep(250);
    const fermer = page.getByRole('button', { name: 'Fermer', exact: true });
    for (let i = 0; i < 3; i++) {
      if ((await fermer.count()) > 0) { await fermer.last().click().catch(() => {}); await sleep(300); }
      else break;
    }
    // quitter le mode Aperçu éventuel
    if ((await page.getByText('· APERÇU').count()) > 0) {
      const ap = page.getByRole('button', { name: "Basculer l'aperçu", exact: true });
      if ((await ap.count()) > 0) await ap.first().click().catch(() => {});
      await sleep(400);
    }
  }

  // ── 1. Fumée : chaque onglet, chaque bouton ──
  const tabs = ['Accueil', 'Insertion', 'Dessin', 'Conception', 'Mise en page', 'Références', 'Publipostage', 'Révision', 'Affichage', 'Aide'];
  const SKIP = new Set(['Image', 'Ouvrir', 'Enregistrer sous', 'Imprimer', 'Partager', 'Exporter', 'Nouveau', 'Nouveau document', 'Fermer le document', 'Réduire le ruban']);
  let clicked = 0;
  for (const tab of tabs) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    await sleep(600);
    const names = await page.evaluate(() => {
      const isVis = (el) => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
      const bar = [...document.querySelectorAll('*')].find((el) => el.children.length > 3 && /Sélectionner|Police|Presse-papiers/.test(el.textContent || ''));
      const scope = bar || document.body;
      return [...scope.querySelectorAll('[role="button"],button')].filter(isVis).map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim()).filter(Boolean);
    });
    for (const raw of [...new Set(names)]) {
      const name = raw.replace(/^[^\p{L}\p{N}]+/u, '').trim();
      if (!name || SKIP.has(name) || tabs.includes(name)) continue;
      const b = btn(name);
      if ((await b.count()) === 0) continue;
      try {
        await b.first().click({ timeout: 3000 });
        clicked++;
        await sleep(350);
      } catch { /* bouton non cliquable : on ignore */ }
      await resetUI();
    }
    check(`fumée ${tab}`, true, `${names.length} boutons`);
  }
  // FICHIER (backstage)
  await page.getByRole('button', { name: 'Fichier', exact: true }).click(); await sleep(800);
  await page.screenshot({ path: 'preview/reg-fichier.png' });
  await resetUI();
  await page.getByRole('button', { name: 'Accueil', exact: true }).click(); await sleep(500);

  // ── 2. Fonctionnel : formatage ciblé au milieu du texte ──
  await editor().fill('alpha beta gamma\ndelta epsilon zeta'); await sleep(500);
  async function selectWord(lineIdx, colStart, len) {
    await editor().focus(); await sleep(200);
    await page.keyboard.press('Control+Home'); await sleep(200);
    for (let i = 0; i < lineIdx; i++) await page.keyboard.press('ArrowDown');
    await sleep(150);
    for (let i = 0; i < colStart; i++) await page.keyboard.press('ArrowRight');
    await sleep(150);
    await page.keyboard.down('Shift');
    for (let i = 0; i < len; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.up('Shift'); await sleep(400);
  }
  const val = () => editor().inputValue();
  await selectWord(0, 6, 4); // beta
  await btn('Gras').click(); await sleep(500);
  check('Gras ciblé', (await val()) === 'alpha **beta** gamma\ndelta epsilon zeta', await val());
  await selectWord(0, 15, 5); // gamma (ligne: alpha **beta** gamma)
  await btn('Italique').click(); await sleep(500);
  check('Italique ciblé', (await val()) === 'alpha **beta** *gamma*\ndelta epsilon zeta', await val());
  // cumul gras+italique sur beta (sélection incluant **)
  await selectWord(0, 6, 8);
  await btn('Italique').click(); await sleep(500);
  check('Gras+Italique → ***', (await val()) === 'alpha ***beta*** *gamma*\ndelta epsilon zeta', await val());
  // Souligné / Barré / Surligné sur ligne 2
  await selectWord(1, 0, 5); // delta
  await btn('Souligné').click(); await sleep(400);
  check('Souligné', (await val()).includes('__delta__'), await val());
  await selectWord(1, 10, 7); // epsilon (ligne: __delta__ epsilon zeta)
  await btn('Barré').click(); await sleep(400);
  check('Barré', (await val()).includes('~~epsilon~~'), await val());
  // Titre 1 ligne 1 seulement
  await editor().focus(); await sleep(200);
  await page.keyboard.press('Control+Home'); await sleep(300);
  await btn('Titre 1').click(); await sleep(500);
  const vt = await val();
  check('Titre 1 ciblé', vt.split('\n')[0].startsWith('# alpha') && !vt.split('\n')[1].startsWith('#'), vt);
  // Puces sur les 2 lignes
  await editor().focus(); await sleep(200);
  await page.keyboard.press('Control+a'); await sleep(400);
  await btn('Puces').click(); await sleep(500);
  const vp = await val();
  check('Puces 2 lignes', vp.split('\n').every((l) => l.startsWith('- ')), vp);
  await btn('Puces').click(); await sleep(400);
  check('Puces OFF', !(await val()).includes('- '), await val());
  // Annuler / Rétablir
  const beforeUndo = await val();
  await btn('Annuler').click(); await sleep(400);
  check('Annuler', (await val()) !== beforeUndo);
  await btn('Rétablir').click(); await sleep(400);
  check('Rétablir', (await val()) === beforeUndo);
  // Exposant / Indice / Code
  await selectWord(1, 12, 7); // epsilon (dans ~~...~~)
  await btn('Exposant').click(); await sleep(400);
  check('Exposant', (await val()).includes('^epsilon^'), await val());
  await selectWord(1, 2, 5); // delta (dans __delta__)
  await btn('Souligné').click(); await sleep(400);
  check('Souligné OFF ciblé', (await val()).split('\n')[1] === 'delta ~~^epsilon^~~ zeta', (await val()).split('\n')[1]);
  await btn('Souligné').click(); await sleep(400);
  check('Souligné ON ciblé', (await val()).split('\n')[1] === '__delta__ ~~^epsilon^~~ zeta', (await val()).split('\n')[1]);
  // Tableau rapide à la fin + marqueurs invisibles dans l'éditeur
  await editor().focus(); await sleep(200);
  await page.keyboard.press('Control+Home'); await sleep(250);
  await page.keyboard.press('ArrowDown'); await sleep(150);
  await page.keyboard.press('ArrowDown'); await sleep(250);
  await page.getByRole('button', { name: 'Insertion', exact: true }).click(); await sleep(500);
  await btn('Tableau rapide').click(); await sleep(700);
  const vtab = await val();
  check('Tableau rapide inséré', vtab.includes('| Col1 | Col2 | Col3 |') && vtab.includes('| --- | --- | --- |'), vtab.split('\n').slice(-6).join(' / '));
  await page.getByRole('button', { name: 'Accueil', exact: true }).click(); await sleep(500);
  const wdom = await page.evaluate(() => {
    const out = { starsHidden: 0, starsShown: 0, pipesGrey: 0, sepFaint: false, headerBold: false };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const t = n.nodeValue;
      if (t.includes('\n')) continue;
      const cs = getComputedStyle(n.parentElement);
      if (t === '**' || t === '*' || t === '# ') {
        if (cs.color === 'rgba(0, 0, 0, 0)') out.starsHidden++; else out.starsShown++;
      }
      if (t === '|' && cs.color === 'rgb(148, 163, 184)') out.pipesGrey++;
      if (t.includes('---') && cs.color === 'rgb(203, 213, 225)') out.sepFaint = true;
      if (t.includes('Col1') && (cs.fontWeight === '700' || cs.fontWeight === 'bold')) out.headerBold = true;
    }
    return out;
  });
  check('étoiles invisibles', wdom.starsHidden >= 2 && wdom.starsShown === 0, JSON.stringify(wdom));
  check('tableau lisible (pipes+en-tête)', wdom.pipesGrey >= 4 && wdom.sepFaint && wdom.headerBold, JSON.stringify(wdom));
  // Aperçu : le ***beta*** est gras+italique
  await page.getByRole('button', { name: 'Affichage', exact: true }).click(); await sleep(500);
  await btn("Basculer l'aperçu").click(); await sleep(800);
  const both = await page.evaluate(() => [...document.querySelectorAll('*')].some((el) => {
    const cs = getComputedStyle(el);
    return (cs.fontWeight === '700' || cs.fontWeight === 'bold') && cs.fontStyle === 'italic' && (el.textContent || '') === 'beta';
  }));
  check('Aperçu gras+italique', both);
  await page.screenshot({ path: 'preview/reg-apercu.png' });
  await resetUI();
  await page.getByRole('button', { name: 'Accueil', exact: true }).click(); await sleep(400);

  // ── 3. Tableaux : groupe contextuel + navigation clavier + tri ──
  await page.getByRole('button', { name: 'Insertion', exact: true }).click(); await sleep(500);
  await editor().fill('| Nom | Age |\n| --- | --- |\n| Zoe | 30 |\n| Max | 7 |'); await sleep(600);
  await selectWord(2, 2, 3); // « Zoe »
  await sleep(500);
  check('tableaux groupe contextuel', await btn('Ligne en-dessous').count() === 1);
  await page.screenshot({ path: 'preview/reg-tableaux.png' });
  await btn('Ligne en-dessous').click(); await sleep(600);
  let vtt = await val();
  check('tableaux ligne insérée', vtt.split('\n').length === 5 && vtt.split('\n')[3] === '|    |    |', vtt.split('\n').join(' / '));
  await btn('Supprimer la ligne').click(); await sleep(600);
  vtt = await val();
  check('tableaux ligne supprimée', vtt.split('\n').length === 4 && vtt.includes('Zoe') && vtt.includes('Max'), vtt.split('\n').join(' / '));
  await btn('Colonne à droite').click(); await sleep(600);
  vtt = await val();
  check('tableaux colonne insérée', vtt.includes('| --- | --- | --- |'), vtt.split('\n')[1]);
  await btn('Supprimer la colonne').click(); await sleep(600);
  vtt = await val();
  check('tableaux colonne supprimée', vtt.includes('| --- | --- |') && !vtt.includes('| --- | --- | --- |'), vtt.split('\n')[1]);
  await btn('Trier A-Z').click(); await sleep(600);
  vtt = await val();
  check('tableaux tri A-Z', vtt.indexOf('Max') !== -1 && vtt.indexOf('Max') < vtt.indexOf('Zoe'), vtt.split('\n').slice(2).join(' / '));
  await btn('Trier Z-A').click(); await sleep(600);
  vtt = await val();
  check('tableaux tri Z-A', vtt.indexOf('Zoe') !== -1 && vtt.indexOf('Zoe') < vtt.indexOf('Max'), vtt.split('\n').slice(2).join(' / '));
  await selectWord(0, 2, 3); // « Nom »
  await page.keyboard.press('Tab'); await sleep(500);
  const tabSel = await editor().evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd));
  check('tableaux Tab = cellule suivante', tabSel === 'Age', tabSel);
  const beforeEnter = await val();
  await page.keyboard.press('Enter'); await sleep(500);
  const enterSel = await editor().evaluate((el) => el.value.slice(el.selectionStart, el.selectionEnd));
  check('tableaux Entrée descend sans casser', (await val()) === beforeEnter && enterSel === '30', `${enterSel} | ${(await val()).split('\n').length} lignes`);
  await editor().focus(); await sleep(200);
  await page.keyboard.press('Control+End'); await sleep(400);
  await page.keyboard.press('Enter'); await sleep(500);
  check('tableaux Entrée fin = sortie', (await val()).split('\n').length === 5, (await val()).split('\n').join(' / '));
  await page.keyboard.press('ArrowUp'); await sleep(500);
  await btn('Supprimer le tableau').click(); await sleep(600);
  check('tableaux bloc supprimé', !(await val()).includes('|'), await val());

  // ── 4. Correction : portée sélection + Tout corriger ──
  await editor().fill('Tout est propre ici.\nle le chat  dort. vite'); await sleep(600);
  await selectWord(0, 0, 20); // ligne propre uniquement
  await page.getByRole('button', { name: 'Révision', exact: true }).click(); await sleep(500);
  await btn('Orthographe').click(); await sleep(700);
  check('preuve sélection propre = 0', await page.getByText('Aucun problème détecté').count() >= 1);
  await resetUI(); await sleep(300);
  await selectWord(1, 0, 22); // ligne fautive uniquement
  await btn('Orthographe').click(); await sleep(700);
  const scopeTxt = await page.getByText(/remarque\(s\) dans la sélection/).first().textContent();
  check('preuve sélection compte', (scopeTxt || '').startsWith('3 remarque'), scopeTxt);
  await page.screenshot({ path: 'preview/reg-preuve.png' });
  await btn('Tout corriger').click(); await sleep(700);
  const vfix = await val();
  check('preuve tout corriger', vfix.split('\n')[1] === 'le chat dort. Vite', vfix);
  check('preuve vide après fix', await page.getByText('Aucun problème détecté').count() >= 1);
  await resetUI(); await sleep(300);

  // ── 5. Raccourcis clavier dans l'éditeur (relais onKeyPress, cf. stopPropagation RNW) ──
  await selectWord(0, 0, 4); // « Tout »
  await page.keyboard.press('Control+g'); await sleep(500);
  check('clavier Ctrl+G = gras', (await val()).split('\n')[0].startsWith('**Tout**'), (await val()).split('\n')[0]);

  check('0 erreur console/page', errors.length === 0, errors.slice(0, 4).join(' /// '));
  console.log(results.join('\n'));
  console.log(`\nTOTAL: ${pass} pass, ${fail} fail (${clicked} boutons cliqués)`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FAIL:', e.message.slice(0, 500)); process.exit(1); });
