import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  X,
  Keyboard,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Layout,
  Table as TableIcon,
  Calculator,
  BarChart3,
  Database,
  Printer,
  Sparkles,
  Zap,
  Code2,
  Copy,
  Check,
  Play,
  ArrowRight,
  Calendar,
  Layers,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { evaluateFormula } from '../../utils/calcEngine';

interface ExcelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: string;
  onInsertFormula?: (formula: string) => void;
}

export const ExcelGuideModal: React.FC<ExcelGuideModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'part1',
  onInsertFormula,
}) => {
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  // Interactive formula tester state
  const [testFormula, setTestFormula] = useState('=SOMME(A1:A4)');
  const [testResult, setTestResult] = useState<any>('100');

  // Sample data for the interactive tester
  const sampleData = {
    'A1': { value: '10' },
    'A2': { value: '25' },
    'A3': { value: '35' },
    'A4': { value: '30' },
    'B1': { value: 'Pomme' },
    'B2': { value: 'Banane' },
    'B3': { value: 'Orange' },
    'B4': { value: 'Fraise' },
    'C1': { value: '2.5' },
    'C2': { value: '1.8' },
    'C3': { value: '3.2' },
    'C4': { value: '4.5' },
  };

  const runTestFormula = (expr: string) => {
    try {
      const res = evaluateFormula(expr, sampleData);
      setTestResult(res);
    } catch (err: any) {
      setTestResult('#ERREUR!');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormula(text);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  if (!isOpen) return null;

  const sections = [
    {
      id: 'part1',
      title: "Partie I : Comprendre l'Interface d'Excel",
      icon: Layout,
      subsections: [
        '1. Le Classeur et la Feuille de Calcul (1 048 576 lignes × 16 384 colonnes)',
        '2. La Cellule : Élément de Base & Coordonnées',
        '3. Les Composants de l’Interface (Ruban, Barre de formule, Zone de nom, Barre d’état)',
        '4. Les 9 Onglets du Ruban (Fichier, Accueil, Insertion, Mise en page, Formules, Données, Révision, Affichage, Développeur)',
      ],
    },
    {
      id: 'part2',
      title: 'Partie II : Opérations de Base',
      icon: FileSpreadsheet,
      subsections: [
        '1. Créer et Enregistrer un Classeur (.xlsx, .csv)',
        '2. Saisir et Modifier des Données (Touche Entrée, Tab, F2)',
        '3. Sélectionner des Cellules, Lignes, Colonnes et Plages (Ctrl+A)',
        '4. Formules Simples (+, -, *, /)',
        '5. Somme Automatique (Alt+=)',
      ],
    },
    {
      id: 'part3',
      title: 'Partie III : Mise en Forme',
      icon: Sparkles,
      subsections: [
        'Mise en Forme des Cellules (Police, Taille, Gras, Italique, Couleurs, Bordures)',
        'Formats Numériques (Général, Nombre, Monétaire €, Pourcentage %, Date)',
        'Alignement, Fusion et Renvoi à la ligne automatique',
        'Styles de Cellules Prédéfinis',
      ],
    },
    {
      id: 'part4',
      title: 'Partie IV : Fonctions Essentielles',
      icon: Calculator,
      subsections: [
        'Fonctions de Base (SOMME, MOYENNE, MAX, MIN, NB, NBVAL)',
        'Fonctions Logiques (SI, SI imbriqués, ET, OU)',
        'Fonctions de Recherche (RECHERCHEV, RECHERCHEX, INDEX, EQUIV, INDEX+EQUIV)',
        'Statistiques Avancées (NB.SI, NB.SI.ENS, SOMME.SI, SOMME.SI.ENS, SOMMEPROD)',
        'Date & Heure (AUJOURDHUI, MAINTENANT, JOURSEM, DATEDIF, NB.JOURS.OUVRES)',
        'Fonctions Texte (CONCAT, GAUCHE, DROITE, STXT, SUBSTITUE, TEXTE)',
      ],
    },
    {
      id: 'part5',
      title: 'Partie V : Graphiques',
      icon: BarChart3,
      subsections: [
        'Types de Graphiques (Histogramme, Courbe, Secteurs, Barres, Aires, Nuages de points, Sparklines)',
        'Créer et Personnaliser un Graphique (Axes, Légende, Étiquettes)',
      ],
    },
    {
      id: 'part6',
      title: 'Partie VI : Gestion des Données',
      icon: Database,
      subsections: [
        'Trier (A à Z, Z à A, critères multiples)',
        'Filtrer les Données et Masquer les Lignes',
        'Mise en Forme Conditionnelle (Nuances, Règles, Seuils)',
        'Validation des Données (Listes déroulantes, Plages)',
        'Tableaux Structurés (Ctrl+T)',
        'Tableaux Croisés Dynamiques (TCD)',
      ],
    },
    {
      id: 'part7',
      title: 'Partie VII : Mise en Page et Impression',
      icon: Printer,
      subsections: [
        'Marges, Orientation (Portrait / Paysage) et Taille papier',
        'Zone d’impression et Sauts de Page',
        'En-têtes, Pieds de page et Titres à imprimer répétés',
        'Aperçu avant Impression (Ctrl+P)',
      ],
    },
    {
      id: 'part8',
      title: 'Partie VIII : Fonctions Avancées',
      icon: Zap,
      subsections: [
        'Fonctions Base de Données (BDSOMME, BDMOYENNE, BDNB, BDMAX, BDMIN)',
        'Fonctions Matricielles (FREQUENCE, TRANSPOSE, SOMMEPROD)',
        'Recherche Dynamique (DECALER, INDIRECT)',
        'Gestion des Erreurs (SIERREUR, ESTERREUR, ESTVIDE)',
        'Tableaux Dynamiques Modernes (RECHERCHEX, UNIQUE, TRIER, SEQUENCE, FILTRE)',
        'Macros VBA et Automatisation',
        'Analyse de Scénarios, Valeur Cible et Solveur',
      ],
    },
    {
      id: 'part9',
      title: 'Partie IX : Raccourcis Clavier Essentiels',
      icon: Keyboard,
      subsections: [
        'Raccourcis Généraux (Ctrl+S, Ctrl+O, Ctrl+N, Ctrl+P, Ctrl+Z, Ctrl+Y)',
        'Mise en forme rapide (Ctrl+G, Ctrl+I, Ctrl+U)',
        'Navigation et Édition (F2, Alt+=, Ctrl+;, Ctrl+:, Ctrl+A, F1)',
      ],
    },
  ];

  const shortcutsList = [
    { key: 'Ctrl + N', action: 'Nouveau classeur' },
    { key: 'Ctrl + O', action: 'Ouvrir un classeur' },
    { key: 'Ctrl + S', action: 'Enregistrer le fichier (.xlsx)' },
    { key: 'Ctrl + P', action: 'Imprimer / Aperçu avant impression' },
    { key: 'Ctrl + Z', action: 'Annuler la dernière action' },
    { key: 'Ctrl + Y', action: 'Rétablir l’action annulée' },
    { key: 'Ctrl + X', action: 'Couper la sélection' },
    { key: 'Ctrl + C', action: 'Copier la sélection' },
    { key: 'Ctrl + V', action: 'Coller le contenu' },
    { key: 'Ctrl + G / Ctrl + B', action: 'Mettre en Gras' },
    { key: 'Ctrl + I', action: 'Mettre en Italique' },
    { key: 'Ctrl + U', action: 'Souligner le texte' },
    { key: 'Ctrl + A', action: 'Sélectionner toute la feuille' },
    { key: 'Ctrl + F', action: 'Rechercher dans la feuille' },
    { key: 'Ctrl + H', action: 'Rechercher et remplacer' },
    { key: 'F5 / Ctrl + G', action: 'Atteindre une cellule spécifique' },
    { key: 'Ctrl + ;', action: 'Insérer la date du jour (JJ/MM/AAAA)' },
    { key: 'Ctrl + :', action: 'Insérer l’heure courante (HH:MM)' },
    { key: 'Alt + =', action: 'Insérer la formule SOMME automatique' },
    { key: 'F2', action: 'Modifier la cellule active (Mode Édition)' },
    { key: 'F1', action: 'Ouvrir l’aide / Guide Excel' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header with Excel Green Branding */}
        <div className="bg-gradient-to-r from-[#107c41] via-[#0e6937] to-[#0a4d28] px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-emerald-800/50 shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/20 rounded-xl border border-white/10 backdrop-blur-xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Guide exhaustif de Microsoft Excel</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 font-semibold tracking-wider">
                  Manuel de Référence
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80 hidden sm:block">
                Interface, Formules, Fonctions Avancées, Graphiques & Raccourcis Clavier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-100/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Fermer le guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Interactive Formula Quick-Bar */}
        <div className="bg-slate-850 px-4 py-2.5 border-b border-slate-750 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une fonction (ex: RECHERCHEV, SI, SOMMEPROD, TCD...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Formula Playground Trigger */}
          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-750 px-3 py-1.5 rounded-xl">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Testeur :</span>
            <input
              type="text"
              value={testFormula}
              onChange={(e) => {
                setTestFormula(e.target.value);
                runTestFormula(e.target.value);
              }}
              className="bg-slate-800 text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-700 w-36 outline-none focus:border-emerald-500"
              placeholder="=SOMME(A1:A4)"
            />
            <span className="text-slate-500">=</span>
            <span className="font-mono font-bold text-white bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
              {String(testResult)}
            </span>
          </div>
        </div>

        {/* Content Body with Left Sidebar & Main Scrollable Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-64 sm:w-72 bg-slate-900/90 border-r border-slate-750 flex flex-col shrink-0 overflow-y-auto p-2.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
              Sommaire Complet
            </span>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all group ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                    <span className="truncate">{sec.title}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'rotate-90 text-emerald-400' : 'text-slate-500'}`} />
                </button>
              );
            })}

            <div className="pt-4 mt-auto border-t border-slate-800 px-2">
              <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-750 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Compatibilité Excel</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  Supporte les séparateurs point-virgule <code>;</code> et virgule <code>,</code>, ainsi que les formules françaises et anglaises.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-8 bg-slate-900">
            {/* PARTIE I : L'INTERFACE D'EXCEL */}
            {(activeSection === 'part1' || searchQuery) && (
              <div id="part1" className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Layout className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie I : Comprendre l'Interface d'Excel</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    17 milliards de cellules
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>1. Le Classeur et la Feuille de Calcul</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Les documents Excel sont appelés <strong>classeurs</strong>. Chaque classeur contient une ou plusieurs <strong>feuilles de calcul</strong> (jusqu’à 255 feuilles par classeur).
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1 pl-4 list-disc">
                      <li><strong className="text-slate-200">1 048 576 lignes</strong> numérotées de 1 à 1 048 576</li>
                      <li><strong className="text-slate-200">16 384 colonnes</strong> nommées de A à XFD (A..Z, AA..AZ, ..., XFD)</li>
                      <li>Soit plus de <strong className="text-emerald-400">17 179 869 184 cellules</strong> adressables !</li>
                    </ul>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>2. La Cellule : Élément de Base</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Intersection d'une ligne et d'une colonne avec une <strong>référence unique</strong> (ex: <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">A1</code>, <code className="text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">B3</code>).
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <span className="font-semibold text-emerald-300">Types de contenu :</span>
                        <p className="text-slate-400 mt-1">Texte, Nombres, Formules (=A1+B1), Fonctions (=SOMME)</p>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <span className="font-semibold text-emerald-300">Cellule active :</span>
                        <p className="text-slate-400 mt-1">Entourée d'un contour vert, affichée dans la barre de formule.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Les Composants de l'Interface */}
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                  <h4 className="text-sm font-semibold text-white">3. Les Composants Clés de l'Interface</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                      <div className="font-semibold text-emerald-300 mb-1">Barre de titre & Accès rapide</div>
                      <p className="text-slate-400">Affiche le nom du classeur, Enregistrer (Ctrl+S), Annuler (Ctrl+Z) et Rétablir (Ctrl+Y).</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                      <div className="font-semibold text-emerald-300 mb-1">Zone de nom & Barre de formule</div>
                      <p className="text-slate-400">Affiche la cellule active (ex: A1) et permet d’éditer ou visualiser les formules en temps réel.</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                      <div className="font-semibold text-emerald-300 mb-1">Onglets de feuilles & Barre d'état</div>
                      <p className="text-slate-400">Navigation entre feuilles (+ pour ajouter), calculs automatiques instantanés (Somme, Moyenne, Nb) et zoom.</p>
                    </div>
                  </div>
                </div>

                {/* 4. Tableau des 9 Onglets du Ruban */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">4. Les 9 Onglets du Ruban Excel</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-750">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-800 text-slate-300 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="px-3.5 py-2">Onglet</th>
                          <th className="px-3.5 py-2">Fonctions & Commandes Principales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Fichier</td>
                          <td className="px-3.5 py-2 text-slate-400">Vue Backstage : Nouveau classeur, Ouvrir, Enregistrer, Imprimer, Exporter, Fermer.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Accueil</td>
                          <td className="px-3.5 py-2 text-slate-400">Presse-papiers, Police, Alignement, Format de Nombre, Styles de cellules, Somme auto, Trier et Filtrer.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Insertion</td>
                          <td className="px-3.5 py-2 text-slate-400">Tableaux structurés, Graphiques (Histogramme, Secteurs, Courbe), Sparklines, Liens, Symboles.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Mise en page</td>
                          <td className="px-3.5 py-2 text-slate-400">Thèmes, Marges, Orientation (Portrait/Paysage), Zone d’impression, Sauts de page, Titres à imprimer.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Formules</td>
                          <td className="px-3.5 py-2 text-slate-400">Bibliothèque de fonctions (Somme auto, Logique, Texte, Recherche), Gestionnaire de noms, Audit.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Données</td>
                          <td className="px-3.5 py-2 text-slate-400">Importer, Trier A-Z, Filtrer, Validation des données, Tableaux croisés dynamiques (TCD), Analyse de scénarios.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Révision</td>
                          <td className="px-3.5 py-2 text-slate-400">Vérification orthographique, Commentaires de cellule, Protection de la feuille et du classeur.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Affichage</td>
                          <td className="px-3.5 py-2 text-slate-400">Affichage Normal / Mise en page, Quadrillage, En-têtes, Figer les volets, Contrôle de zoom (70%-150%).</td>
                        </tr>
                        <tr className="hover:bg-slate-800/50">
                          <td className="px-3.5 py-2 font-semibold text-emerald-400 whitespace-nowrap">Développeur</td>
                          <td className="px-3.5 py-2 text-slate-400">Enregistreur de macros, Visual Basic (VBA), Compléments Excel.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE II : OPÉRATIONS DE BASE */}
            {(activeSection === 'part2' || searchQuery) && (
              <div id="part2" className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <FileSpreadsheet className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie II : Opérations de Base</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">1. Création & Enregistrement</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Nouveau classeur vide via <span className="text-emerald-300 font-mono">Ctrl+N</span> ou Fichier &gt; Nouveau. Enregistrement sécurisé avec <span className="text-emerald-300 font-mono">Ctrl+S</span> au format standard <strong className="text-white">.xlsx</strong> ou <strong className="text-white">.csv</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">2. Saisie et Modification de Données</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Tapez directement dans la cellule ou appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-300 font-mono">F2</kbd> pour entrer en mode édition. Appuyez sur <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">Entrée</kbd> pour valider et descendre, ou <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">Tab</kbd> pour aller à droite.
                    </p>
                  </div>
                </div>

                {/* Sélections de Cellules */}
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                  <h4 className="text-sm font-semibold text-white">3. Sélectionner des Cellules</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                      <span className="font-semibold text-emerald-300">Une cellule</span>
                      <p className="text-slate-400 mt-0.5">Cliquez directement dessus.</p>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                      <span className="font-semibold text-emerald-300">Une plage de cellules</span>
                      <p className="text-slate-400 mt-0.5">Cliquez et faites glisser le curseur (ex: A1:D10).</p>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                      <span className="font-semibold text-emerald-300">Colonne entière</span>
                      <p className="text-slate-400 mt-0.5">Cliquez sur la lettre d’en-tête (A, B, C...).</p>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
                      <span className="font-semibold text-emerald-300">Ligne entière</span>
                      <p className="text-slate-400 mt-0.5">Cliquez sur le numéro de la ligne (1, 2, 3...).</p>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 col-span-2 sm:col-span-1">
                      <span className="font-semibold text-emerald-300">Toute la feuille</span>
                      <p className="text-slate-400 mt-0.5">Ctrl+A ou bouton dans le coin supérieur gauche.</p>
                    </div>
                  </div>
                </div>

                {/* Formules Simples & Somme Automatique */}
                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                  <h4 className="text-sm font-semibold text-white">4. Formules Simples & Somme Automatique</h4>
                  <p className="text-xs text-slate-300">
                    Toute formule Excel commence impérativement par le signe égal <code className="text-emerald-400 font-bold">=</code>.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between">
                      <span className="text-slate-400">Addition (+)</span>
                      <code className="text-emerald-300 font-mono font-bold mt-1">=A1+A2</code>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between">
                      <span className="text-slate-400">Soustraction (-)</span>
                      <code className="text-emerald-300 font-mono font-bold mt-1">=A1-A2</code>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between">
                      <span className="text-slate-400">Multiplication (*)</span>
                      <code className="text-emerald-300 font-mono font-bold mt-1">=A1*A2</code>
                    </div>
                    <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between">
                      <span className="text-slate-400">Division (/)</span>
                      <code className="text-emerald-300 font-mono font-bold mt-1">=A1/A2</code>
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl flex items-center justify-between mt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <div>
                        <strong className="text-emerald-200">Somme Automatique instantanée :</strong>
                        <span className="text-slate-300 ml-1">Utilisez le raccourci clavier <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-300 font-mono">Alt + =</kbd></span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (onInsertFormula) onInsertFormula('=SOMME(A1:A10)');
                        copyToClipboard('=SOMME(A1:A10)');
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier =SOMME(A1:A10)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE III : MISE EN FORME */}
            {(activeSection === 'part3' || searchQuery) && (
              <div id="part3" className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie III : Mise en Forme Professionnelle</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Mise en Forme des Caractères</h4>
                    <p className="text-slate-300">Onglet <strong>Accueil</strong> &gt; Groupe <strong>Police</strong> :</p>
                    <ul className="text-slate-400 space-y-1 pl-4 list-disc">
                      <li><strong>Typographie</strong> : Police (Calibri, Plus Jakarta, Arial) et Taille de caractères</li>
                      <li><strong>Styles</strong> : Gras (<kbd className="font-mono text-emerald-300">Ctrl+G</kbd>), Italique (<kbd className="font-mono text-emerald-300">Ctrl+I</kbd>), Souligné (<kbd className="font-mono text-emerald-300">Ctrl+U</kbd>)</li>
                      <li><strong>Couleurs</strong> : Couleur du texte et couleur de remplissage (arrière-plan)</li>
                      <li><strong>Bordures</strong> : Contours fins, épais, double soulignement comptable</li>
                    </ul>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Formats Numériques</h4>
                    <p className="text-slate-300">Onglet <strong>Accueil</strong> &gt; Groupe <strong>Nombre</strong> :</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="font-semibold text-emerald-300">Monétaire</span>
                        <p className="text-slate-400 text-[11px]">1 500,00 €</p>
                      </div>
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="font-semibold text-emerald-300">Pourcentage</span>
                        <p className="text-slate-400 text-[11px]">25,0 %</p>
                      </div>
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="font-semibold text-emerald-300">Date & Heure</span>
                        <p className="text-slate-400 text-[11px]">01/10/2026 14:30</p>
                      </div>
                      <div className="bg-slate-800 p-2 rounded border border-slate-700">
                        <span className="font-semibold text-emerald-300">Nombre avec séparateur</span>
                        <p className="text-slate-400 text-[11px]">1 250 000</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2 text-xs">
                  <h4 className="text-sm font-semibold text-white">Alignement & Styles de Cellules</h4>
                  <p className="text-slate-300">
                    Alignement horizontal (Gauche, Centré, Droite) et vertical (Haut, Milieu, Bas), fusion de cellules pour les titres de tableaux, et renvoi automatique à la ligne pour le texte long.
                  </p>
                </div>
              </div>
            )}

            {/* PARTIE IV : FONCTIONS ESSENTIELLES */}
            {(activeSection === 'part4' || searchQuery) && (
              <div id="part4" className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Calculator className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie IV : Fonctions Essentielles (Guide & Syntaxe)</h3>
                  </div>
                </div>

                {/* 1. Fonctions de Base */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <span>1. Fonctions de Calcul de Base</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    {[
                      { name: 'SOMME', syntax: '=SOMME(A1:A10)', desc: 'Additionne tous les nombres de la plage.' },
                      { name: 'MOYENNE', syntax: '=MOYENNE(A1:A10)', desc: 'Calcule la moyenne arithmétique.' },
                      { name: 'MAX', syntax: '=MAX(A1:A10)', desc: 'Renvoie la valeur la plus grande.' },
                      { name: 'MIN', syntax: '=MIN(A1:A10)', desc: 'Renvoie la valeur la plus petite.' },
                      { name: 'NB', syntax: '=NB(A1:A10)', desc: 'Compte le nombre de cellules contenant des nombres.' },
                      { name: 'NBVAL', syntax: '=NBVAL(A1:A10)', desc: 'Compte les cellules non vides (texte ou nombre).' },
                    ].map((fn) => (
                      <div key={fn.name} className="p-3 bg-slate-850 rounded-xl border border-slate-750 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white">{fn.name}</span>
                            <button
                              onClick={() => {
                                if (onInsertFormula) onInsertFormula(fn.syntax);
                                copyToClipboard(fn.syntax);
                              }}
                              className="text-slate-400 hover:text-emerald-300"
                              title="Copier / Insérer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <code className="text-emerald-400 font-mono text-[11px] block bg-slate-900 px-2 py-1 rounded border border-slate-800">
                            {fn.syntax}
                          </code>
                          <p className="text-slate-400 mt-2 text-[11px]">{fn.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Fonctions Logiques */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <span>2. Fonctions Logiques (Conditions)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-750 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">SI (Condition simple)</span>
                        <code className="text-emerald-400 font-mono text-[11px]">=SI(A1&gt;10;"Grand";"Petit")</code>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Évalue si la condition A1&gt;10 est vraie. Si oui renvoie "Grand", sinon renvoie "Petit".
                      </p>
                      <button
                        onClick={() => {
                          setTestFormula('=SI(A1>10;"Grand";"Petit")');
                          runTestFormula('=SI(A1>10;"Grand";"Petit")');
                        }}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        <Play className="w-3 h-3" /> Tester dans le bac à sable
                      </button>
                    </div>

                    <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-750 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">SI imbriqués (Conditions multiples)</span>
                        <code className="text-emerald-400 font-mono text-[11px]">=SI(A1&gt;10;"Grand";SI(A1&gt;5;"Moyen";"Petit"))</code>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Permet de tester plusieurs paliers successifs de conditions.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-750 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">ET (Toutes vraies)</span>
                        <code className="text-emerald-400 font-mono text-[11px]">=SI(ET(A1&gt;0;B1&gt;0);"OK";"Non")</code>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Renvoie VRAI uniquement si toutes les conditions spécifiées sont vérifiées.
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-750 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">OU (Au moins une vraie)</span>
                        <code className="text-emerald-400 font-mono text-[11px]">=SI(OU(A1&gt;10;B1&gt;10);"Supérieur";"Inférieur")</code>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Renvoie VRAI si au moins une des conditions est satisfaite.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Fonctions de Recherche (RECHERCHEV, RECHERCHEX, INDEX+EQUIV) */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                    <span>3. Fonctions de Recherche</span>
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-750">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="px-3.5 py-2">Fonction</th>
                          <th className="px-3.5 py-2">Syntaxe Standard</th>
                          <th className="px-3.5 py-2">Explication & Cas d’usage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr className="hover:bg-slate-800/40">
                          <td className="px-3.5 py-2 font-bold text-emerald-400 whitespace-nowrap">RECHERCHEV</td>
                          <td className="px-3.5 py-2 font-mono text-emerald-300">=RECHERCHEV(A1;B1:D10;2;FAUX)</td>
                          <td className="px-3.5 py-2 text-slate-400">Recherche verticale de la valeur A1 dans la 1ère colonne et renvoie la colonne 2 (FAUX = correspondance exacte).</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="px-3.5 py-2 font-bold text-emerald-400 whitespace-nowrap">RECHERCHEX</td>
                          <td className="px-3.5 py-2 font-mono text-emerald-300">=RECHERCHEX(A1;B1:B10;C1:C10)</td>
                          <td className="px-3.5 py-2 text-slate-400">Version moderne 365 : recherche bidirectionnelle, gère les recherches vers la gauche sans décalage d'index.</td>
                        </tr>
                        <tr className="hover:bg-slate-800/40">
                          <td className="px-3.5 py-2 font-bold text-emerald-400 whitespace-nowrap">INDEX + EQUIV</td>
                          <td className="px-3.5 py-2 font-mono text-emerald-300">=INDEX(C1:C10;EQUIV(A1;B1:B10;0))</td>
                          <td className="px-3.5 py-2 text-slate-400">Combinaison très puissante et rapide pour chercher n’importe quelle colonne selon un critère.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Statistiques Avancées & Dates & Texte */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-2">
                    <h5 className="font-bold text-white text-xs">Statistiques Avancées</h5>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">NB.SI (Compte avec condition) :</span>
                        <span className="text-emerald-300">=NB.SI(A1:A10;"&gt;10")</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">SOMME.SI (Somme conditionnelle) :</span>
                        <span className="text-emerald-300">=SOMME.SI(A1:A10;"France";B1:B10)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">SOMMEPROD (Somme des produits) :</span>
                        <span className="text-emerald-300">=SOMMEPROD(A1:A5;B1:B5)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-2">
                    <h5 className="font-bold text-white text-xs">Date et Heure</h5>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">AUJOURDHUI (Date du jour) :</span>
                        <span className="text-emerald-300">=AUJOURDHUI()</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">MAINTENANT (Date et heure) :</span>
                        <span className="text-emerald-300">=MAINTENANT()</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">JOURSEM (Jour de semaine 1-7) :</span>
                        <span className="text-emerald-300">=JOURSEM(A1)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-2">
                    <h5 className="font-bold text-white text-xs">Fonctions Texte</h5>
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">CONCAT (Concaténation) :</span>
                        <span className="text-emerald-300">=CONCAT(A1;" ";B1)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">GAUCHE / DROITE :</span>
                        <span className="text-emerald-300">=GAUCHE(A1;3)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans text-[10px]">STXT (Sous-chaîne) :</span>
                        <span className="text-emerald-300">=STXT(A1;2;4)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE V : GRAPHIQUES */}
            {(activeSection === 'part5' || searchQuery) && (
              <div id="part5" className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <BarChart3 className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie V : Graphiques & Visualisations</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 space-y-1">
                    <strong className="text-emerald-300 block">Histogramme</strong>
                    <p className="text-slate-400">Comparaison de valeurs entre catégories (ventes par mois).</p>
                  </div>
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 space-y-1">
                    <strong className="text-emerald-300 block">Courbe</strong>
                    <p className="text-slate-400">Évolution continue dans le temps (chiffre d’affaires annuel).</p>
                  </div>
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 space-y-1">
                    <strong className="text-emerald-300 block">Secteurs (Camembert)</strong>
                    <p className="text-slate-400">Répartition en pourcentages et proportions d’un total.</p>
                  </div>
                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 space-y-1">
                    <strong className="text-emerald-300 block">Sparklines</strong>
                    <p className="text-slate-400">Mini-courbes et tendances compactes logées dans une seule cellule.</p>
                  </div>
                </div>

                <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3 text-xs">
                  <h4 className="text-sm font-semibold text-white">Étapes pour créer un graphique</h4>
                  <ol className="text-slate-300 space-y-1.5 pl-4 list-decimal">
                    <li>Sélectionnez les cellules de données avec leurs en-têtes (ex: A1:B10).</li>
                    <li>Rendez-vous dans l'onglet <strong className="text-emerald-300">Insertion</strong> &gt; groupe <strong className="text-emerald-300">Graphiques</strong>.</li>
                    <li>Sélectionnez le type souhaité (Histogramme, Secteurs ou Courbe).</li>
                    <li>Personnalisez le titre, les étiquettes d'axes et la légende.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* PARTIE VI : GESTION DES DONNÉES */}
            {(activeSection === 'part6' || searchQuery) && (
              <div id="part6" className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Database className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie VI : Gestion des Données & Tableaux Dynamiques</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Trier & Filtrer</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Onglet <strong>Données</strong> &gt; <strong>Trier</strong> (A à Z ou Z à A) et <strong>Filtrer</strong>. Des flèches déroulantes s'affichent sur les colonnes pour masquer instantanément les lignes non pertinentes.
                    </p>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Mise en Forme Conditionnelle</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Onglet <strong>Accueil</strong> &gt; <strong>Mise en forme conditionnelle</strong>. Colore automatiquement les cellules dépassant un seuil (ex: valeurs &gt; 1000 en vert, doublons en rouge).
                    </p>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Validation des Données</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Onglet <strong>Données</strong> &gt; <strong>Validation des données</strong>. Restreint la saisie utilisateur à une liste déroulante d'options ou à une plage numérique valide.
                    </p>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Tableaux Croisés Dynamiques (TCD)</h4>
                    <p className="text-slate-300 leading-relaxed">
                      Onglet <strong>Insertion</strong> &gt; <strong>Tableau croisé dynamique</strong>. L'outil suprême pour synthétiser, regrouper par mois/catégories et sommer des millions de lignes sans formules.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE VII : MISE EN PAGE ET IMPRESSION */}
            {(activeSection === 'part7' || searchQuery) && (
              <div id="part7" className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Printer className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie VII : Mise en Page et Impression</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1.5">
                    <h5 className="font-bold text-white text-xs">Mise en page</h5>
                    <ul className="text-slate-400 space-y-1 pl-4 list-disc">
                      <li><strong>Marges</strong> : normales, larges, étroites</li>
                      <li><strong>Orientation</strong> : Portrait ou Paysage</li>
                      <li><strong>Taille</strong> : Format A4 ou Letter</li>
                    </ul>
                  </div>

                  <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1.5">
                    <h5 className="font-bold text-white text-xs">Zone d’impression</h5>
                    <ul className="text-slate-400 space-y-1 pl-4 list-disc">
                      <li>Définir la plage exacte à imprimer</li>
                      <li>Sauts de page manuels</li>
                      <li>Ajuster pour tenir sur 1 page large</li>
                    </ul>
                  </div>

                  <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-750 space-y-1.5">
                    <h5 className="font-bold text-white text-xs">Titres à imprimer</h5>
                    <ul className="text-slate-400 space-y-1 pl-4 list-disc">
                      <li>Répéter la ligne d'en-tête sur chaque page</li>
                      <li>Numérotation de page automatique</li>
                      <li>Impression rapide via <strong>Ctrl+P</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE VIII : FONCTIONS AVANCÉES */}
            {(activeSection === 'part8' || searchQuery) && (
              <div id="part8" className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Zap className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie VIII : Fonctions Avancées & Automatisation</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Gestion des Erreurs (SIERREUR)</h4>
                    <p className="text-slate-300">
                      Évite l'affichage inélégant des erreurs comme <code className="text-rose-400 font-mono">#DIV/0!</code> ou <code className="text-rose-400 font-mono">#N/A</code>.
                    </p>
                    <code className="text-emerald-300 font-mono block bg-slate-900 p-2 rounded border border-slate-800">
                      =SIERREUR(A1/B1; 0)
                    </code>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Tableaux Dynamiques Modernes</h4>
                    <p className="text-slate-300">
                      Fonctions avec effet de propagation (Spill) :
                    </p>
                    <div className="font-mono text-emerald-300 space-y-1 text-[11px]">
                      <div>=UNIQUE(A1:A20) <span className="text-slate-500 font-sans">(liste sans doublons)</span></div>
                      <div>=TRIER(A1:A20) <span className="text-slate-500 font-sans">(tri dynamique)</span></div>
                      <div>=SEQUENCE(10) <span className="text-slate-500 font-sans">(génère 1 à 10)</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Fonctions Base de Données</h4>
                    <p className="text-slate-300">
                      Calculs ciblés sur de gros tableaux avec critères :
                    </p>
                    <div className="font-mono text-emerald-300 space-y-1 text-[11px]">
                      <div>BDSOMME(base; champ; critère)</div>
                      <div>BDMOYENNE(base; champ; critère)</div>
                    </div>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                    <h4 className="text-sm font-semibold text-white">Analyse de Scénarios & Valeur Cible</h4>
                    <p className="text-slate-300">
                      Trouvez quelle valeur d'entrée est requise pour obtenir le résultat financier souhaité (Gestionnaire de scénarios & Solveur).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE IX : RACCOURCIS CLAVIER ESSENTIELS */}
            {(activeSection === 'part9' || searchQuery) && (
              <div id="part9" className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <Keyboard className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-white">Partie IX : Raccourcis Clavier Essentiels</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Gain de productivité ×3</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                  {shortcutsList.map((sc) => (
                    <div
                      key={sc.key}
                      className="p-2.5 bg-slate-850 rounded-xl border border-slate-750 flex items-center justify-between hover:border-emerald-600/40 transition-colors"
                    >
                      <span className="text-slate-300">{sc.action}</span>
                      <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md font-mono text-emerald-300 font-bold text-[11px] shrink-0 ml-2">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Quick Action Feedback */}
        <div className="bg-slate-850 px-4 py-2.5 border-t border-slate-750 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Moteur Excel 365 / LibreOffice Calc synchronisé</span>
          </div>

          <div className="flex items-center gap-2">
            {copiedFormula && (
              <span className="text-emerald-400 text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Formule copiée dans le presse-papier !
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Compris & Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
