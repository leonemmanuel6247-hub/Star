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
  Type,
  Table as TableIcon,
  FileText,
  Mail,
  CheckSquare,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface WordGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: string;
}

export const WordGuideModal: React.FC<WordGuideModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'part1',
}) => {
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'part1',
      title: "Partie I : L'Interface de Word",
      icon: Layout,
      subsections: [
        '1. La Barre de Titre',
        '2. La Barre d’Outils Accès Rapide',
        '3. L’Onglet Fichier (Vue Backstage)',
        '4. Le Ruban (Ribbon) et ses 10 onglets',
        '5. La Fenêtre d’Édition',
        '6. La Règle graduée',
        '7. Les Barres de Défilement',
        '8. La Barre d’État',
        '9. Le Contrôle de Zoom',
      ],
    },
    {
      id: 'part2',
      title: 'Partie II : Opérations de Base',
      icon: FileText,
      subsections: [
        'Créer, Enregistrer (Ctrl+S) et Ouvrir (Ctrl+O)',
        'Formats de fichier (.docx, .doc, .pdf, .rtf, .txt)',
        'Saisie, Déplacement et Sélections de texte (mot, phrase, paragraphe)',
      ],
    },
    {
      id: 'part3',
      title: 'Partie III : Mise en Forme Texte & Paragraphe',
      icon: Type,
      subsections: [
        'Mise en Forme des Caractères (Police, Taille, Gras, Italique, Souligné, Barré, Indice, Exposant, Couleur, Surlignage)',
        'Mise en Forme des Paragraphes (Alignement, Puces, Numérotation, Interligne, Retraits, Bordures & Trame)',
      ],
    },
    {
      id: 'part4',
      title: 'Partie IV : Insertion d’Éléments',
      icon: TableIcon,
      subsections: [
        'Tableaux (Grille, Dessin, Insertion précise)',
        'Images et Illustrations (Formes, Icônes, SmartArt, Graphiques)',
        'Habillage du texte (Carré, Aligné, Devant)',
        'En-têtes, Pieds de page et Numérotation',
      ],
    },
    {
      id: 'part5',
      title: 'Partie V : Structuration de Documents Longs',
      icon: BookOpen,
      subsections: [
        'Styles de Titres (Titre 1, Titre 2, Titre 3)',
        'Table des Matières Automatique',
        'Sauts de Page (Ctrl+Entrée) et Sauts de Section',
      ],
    },
    {
      id: 'part6',
      title: 'Partie VI : Fonctions Avancées & Publipostage',
      icon: Mail,
      subsections: [
        'Étapes du Publipostage (Fusion et Publipostage)',
        'Sélection des Destinataires et Gestion de la liste',
        'Insertion des Champs de Fusion (« {{Nom}} », « {{Adresse}} »)',
        'Aperçu des Résultats et Fusion finale',
      ],
    },
    {
      id: 'part7',
      title: 'Partie VII : Révision et Collaboration',
      icon: CheckSquare,
      subsections: [
        'Vérification Orthographique & Grammaticale (F7)',
        'Volet Éditeur et Suggestions en un clic',
        'Suivi des Modifications (Accepter / Refuser)',
        'Commentaires dans la marge et Résolution',
      ],
    },
    {
      id: 'part8',
      title: 'Partie VIII : Raccourcis Clavier Essentiels',
      icon: Keyboard,
      subsections: [
        'Tableau complet des 25 raccourcis incontournables',
        'Commandes de navigation et de mise en forme',
      ],
    },
  ];

  const shortcutsList = [
    { key: 'Ctrl + N', desc: 'Nouveau document vierge' },
    { key: 'Ctrl + O', desc: 'Ouvrir un document' },
    { key: 'Ctrl + S', desc: 'Enregistrer le document actif' },
    { key: 'F12', desc: 'Enregistrer sous (nouvel emplacement/format)' },
    { key: 'Ctrl + P', desc: 'Imprimer / Aperçu avant impression' },
    { key: 'Ctrl + Z', desc: 'Annuler la dernière action' },
    { key: 'Ctrl + Y', desc: 'Rétablir la dernière action' },
    { key: 'Ctrl + X', desc: 'Couper la sélection' },
    { key: 'Ctrl + C', desc: 'Copier la sélection' },
    { key: 'Ctrl + V', desc: 'Coller le contenu du presse-papiers' },
    { key: 'Ctrl + A', desc: 'Tout sélectionner dans le document' },
    { key: 'Ctrl + G / B', desc: 'Mettre en Gras (Bold)' },
    { key: 'Ctrl + I', desc: 'Mettre en Italique' },
    { key: 'Ctrl + U', desc: 'Souligner le texte' },
    { key: 'Ctrl + E', desc: 'Centrer le paragraphe' },
    { key: 'Ctrl + J', desc: 'Justifier le paragraphe' },
    { key: 'Ctrl + L', desc: 'Aligner à gauche' },
    { key: 'Ctrl + R', desc: 'Aligner à droite' },
    { key: 'Ctrl + F', desc: 'Rechercher dans le document' },
    { key: 'Ctrl + H', desc: 'Rechercher et Remplacer' },
    { key: 'F7', desc: 'Vérification orthographique (Volet Éditeur)' },
    { key: 'Ctrl + + / -', desc: 'Zoom avant / Zoom arrière' },
    { key: 'Ctrl + F1', desc: 'Réduire ou agrandir le Ruban' },
    { key: 'Ctrl + F4', desc: 'Fermer le document en cours' },
    { key: 'Alt + F4', desc: 'Fermer l’application Word' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <header className="h-14 bg-[#2b579a] text-white px-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                Guide exhaustif de Microsoft Word
              </h2>
              <p className="text-[11px] text-blue-100 font-normal">
                Interface, Fonctions et Maîtrise Complète • Manuel Officiel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-blue-200 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher dans le guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/25 text-white placeholder-blue-200/70 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-white/20 outline-none w-48 focus:w-64 transition-all"
              />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
              title="Fermer le guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <aside className="w-64 sm:w-72 bg-slate-850 border-r border-slate-750 p-3 overflow-y-auto space-y-1 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Table des matières
            </div>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <div className="min-w-0">
                    <div className="truncate">{sec.title}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {sec.subsections.length} rubriques
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Main Reading Panel */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-900 text-slate-200 text-sm leading-relaxed space-y-6">
            {/* PARTIE I */}
            {activeSection === 'part1' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie I
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Comprendre l'Interface de Word
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    L'interface de Word est conçue pour regrouper logiquement les outils selon leur fonction.
                  </p>
                </div>

                {/* 1. Barre de Titre */}
                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-base text-blue-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-bold">1</span>
                    La Barre de Titre
                  </h4>
                  <p className="text-xs text-slate-300 leading-normal">
                    Située tout en haut de la fenêtre, elle affiche le <strong>nom du document</strong> en cours d'édition, suivi du nom de l'application « Word ». Elle contient également les boutons standard de gestion de fenêtre : <strong>Réduire</strong>, <strong>Agrandir/Restaurer</strong> et <strong>Fermer</strong>.
                  </p>
                </div>

                {/* 2. Barre d'outils Accès Rapide */}
                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-base text-blue-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-bold">2</span>
                    La Barre d'Outils Accès Rapide
                  </h4>
                  <p className="text-xs text-slate-300 leading-normal">
                    Cette barre, située à gauche de la barre de titre, regroupe les commandes les plus fréquemment utilisées : <strong>Enregistrer</strong>, <strong>Annuler</strong> et <strong>Rétablir</strong>. Un menu déroulant à droite permet d'ajouter d'autres commandes courantes selon vos besoins (Nouveau, Ouvrir, Aperçu avant impression, etc.).
                  </p>
                </div>

                {/* 3. L'Onglet Fichier */}
                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-base text-blue-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-bold">3</span>
                    L'Onglet Fichier (Vue Backstage)
                  </h4>
                  <p className="text-xs text-slate-300 leading-normal">
                    En cliquant sur l'onglet <strong>Fichier</strong>, vous accédez à la « vue Backstage ». Contrairement aux autres onglets qui agissent sur le contenu du document, cet espace regroupe les commandes qui agissent sur le <strong>document lui-même</strong> :
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                    <li><strong>Informations</strong> : affiche les propriétés du document (nom, emplacement, taille, nombre de pages/mots, auteur). Permet aussi de protéger le document (chiffrement, restriction d'accès, signature numérique).</li>
                    <li><strong>Nouveau</strong> : propose des modèles (document vierge, CV, lettre, rapport, etc.).</li>
                    <li><strong>Ouvrir</strong> : permet d'accéder aux documents récents, à OneDrive, ou de parcourir l'ordinateur.</li>
                    <li><strong>Enregistrer / Enregistrer sous</strong> : sauvegarde du document.</li>
                    <li><strong>Imprimer</strong> : options d'impression et aperçu avant impression.</li>
                    <li><strong>Partager</strong> : partage du document en ligne.</li>
                    <li><strong>Exporter</strong> : conversion vers d'autres formats (PDF, DOC, TXT, etc.).</li>
                    <li><strong>Fermer</strong> : ferme le document (sans quitter l'application).</li>
                    <li><strong>Compte</strong> : gestion du compte Microsoft Office.</li>
                    <li><strong>Options</strong> : paramètres de personnalisation de Word.</li>
                  </ul>
                </div>

                {/* 4. Le Ruban */}
                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-base text-blue-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-bold">4</span>
                    Le Ruban (Ribbon) et ses Groupes Thématiques
                  </h4>
                  <p className="text-xs text-slate-300">
                    C'est le cœur de l'interface de Word. Le Ruban regroupe la majorité des commandes, organisées en <strong>onglets</strong> divisés en <strong>groupes</strong> thématiques :
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse border border-slate-700">
                      <thead>
                        <tr className="bg-slate-800 text-slate-200">
                          <th className="p-2 border border-slate-700 font-bold w-32">Onglet</th>
                          <th className="p-2 border border-slate-700 font-bold">Contenu et Fonctions Principales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-750 text-slate-300">
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Accueil</td>
                          <td className="p-2 border border-slate-750">Presse-papiers (Copier, Coller, Couper), Police (Gras, Italique, Souligné, taille, couleur), Paragraphe (Alignement, Puces, Numérotation, Interligne), Styles, Édition (Rechercher, Remplacer)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Insertion</td>
                          <td className="p-2 border border-slate-750">Pages (Couverture, Page vierge, Saut de page), Tableaux, Illustrations (Images, Formes, Icônes, SmartArt, Graphiques), Liens, En-tête/Pied de page, Texte, Symboles, Équations</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Dessin</td>
                          <td className="p-2 border border-slate-750">Outils de dessin à main levée, stylos, surligneurs, gomme, tracé</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Conception</td>
                          <td className="p-2 border border-slate-750">Thèmes du document, Couleurs, Polices, Effets, Mise en forme, Arrière-plan de page (Filigrane, Couleur de page, Bordures)</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Mise en page</td>
                          <td className="p-2 border border-slate-750">Marges, Orientation, Taille, Colonnes, Sauts de page, Numéros de ligne, Coupure de mots, Retraits, Espacement, Habillage</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Références</td>
                          <td className="p-2 border border-slate-750">Table des matières, Notes de bas de page, Citations et bibliographie, Légendes, Index</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Publipostage</td>
                          <td className="p-2 border border-slate-750">Créer (Enveloppes, Étiquettes), Démarrer la fusion, Sélectionner les destinataires, Insérer des champs de fusion, Aperçu des résultats, Terminer & Fusionner</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Révision</td>
                          <td className="p-2 border border-slate-750">Vérification orthographique et grammaticale (F7), Statistiques, Langue, Commentaires, Suivi des modifications, Accepter/Refuser, Protéger</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Affichage</td>
                          <td className="p-2 border border-slate-750">Modes d'affichage (Lecture, Page, Web, Plan, Brouillon), Volet de navigation, Règle, Grille, Zoom, Fractionner, Macros</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-semibold text-blue-300">Aide</td>
                          <td className="p-2 border border-slate-750">Aide, Contact Support, Commentaires, Nouveautés, Raccourcis clavier</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5 à 9: Fenêtre d'édition, Règle, Barres de défilement, Barre d'état, Zoom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-1">
                    <h5 className="font-bold text-sm text-blue-300">5. La Fenêtre d'Édition</h5>
                    <p className="text-xs text-slate-300">
                      La grande zone blanche au centre de l'écran où vous tapez et mettez en forme votre document A4 standard.
                    </p>
                  </div>
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-1">
                    <h5 className="font-bold text-sm text-blue-300">6. La Règle</h5>
                    <p className="text-xs text-slate-300">
                      Apparaît en haut et à gauche pour visualiser et ajuster les marges, retraits et taquets de tabulation en cm.
                    </p>
                  </div>
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-1">
                    <h5 className="font-bold text-sm text-blue-300">7. Les Barres de Défilement</h5>
                    <p className="text-xs text-slate-300">
                      Permettent de naviguer verticalement et horizontalement lorsque le document dépasse la fenêtre.
                    </p>
                  </div>
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-1">
                    <h5 className="font-bold text-sm text-blue-300">8. La Barre d'État</h5>
                    <p className="text-xs text-slate-300">
                      Affiche le nombre de pages, de mots, la langue de vérification, et l'état des modes d'édition (INS/REF).
                    </p>
                  </div>
                  <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-1 sm:col-span-2">
                    <h5 className="font-bold text-sm text-blue-300">9. Le Contrôle de Zoom</h5>
                    <p className="text-xs text-slate-300">
                      Curseur interactif à l'extrême droite de la barre d'état pour régler le niveau d'agrandissement en direct (40% à 150%).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE II */}
            {activeSection === 'part2' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie II
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Opérations de Base : Création, Enregistrement et Sélection
                  </h3>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-300">Créer, Enregistrer et Ouvrir</h4>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc pl-5">
                    <li><strong>Créer un nouveau document</strong> : Ctrl + N ou Fichier &gt; Nouveau &gt; Document blanc.</li>
                    <li><strong>Enregistrer</strong> : Ctrl + S pour sauvegarder les modifications en direct.</li>
                    <li><strong>Enregistrer sous</strong> : F12 pour changer de nom, d'emplacement ou de format.</li>
                    <li><strong>Ouvrir un document</strong> : Ctrl + O ou Fichier &gt; Ouvrir pour parcourir les documents récents.</li>
                  </ul>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-300">Formats de fichier courants</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <strong className="text-blue-400">.docx</strong> : Format par défaut moderne de Word
                    </div>
                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <strong className="text-amber-400">.doc</strong> : Format compatible Word 97-2003
                    </div>
                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <strong className="text-rose-400">.pdf</strong> : Format de partage en lecture seule et impression
                    </div>
                    <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                      <strong className="text-emerald-400">.rtf / .txt</strong> : Formats texte universels
                    </div>
                  </div>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-300">Techniques de Sélection Rapide</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border border-slate-700">
                      <thead className="bg-slate-800 text-slate-200">
                        <tr>
                          <th className="p-2 border border-slate-700">Pour sélectionner</th>
                          <th className="p-2 border border-slate-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-750 text-slate-300">
                        <tr>
                          <td className="p-2 border border-slate-750 font-medium">Un mot</td>
                          <td className="p-2 border border-slate-750">Double-cliquez dans le mot</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-medium">Une phrase</td>
                          <td className="p-2 border border-slate-750">Maintenez Ctrl et cliquez dans la phrase</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-medium">Un paragraphe</td>
                          <td className="p-2 border border-slate-750">Triple-cliquez dans le paragraphe</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-medium">Tout le document</td>
                          <td className="p-2 border border-slate-750">Ctrl + A</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-slate-750 font-medium">Une ligne entière</td>
                          <td className="p-2 border border-slate-750">Cliquez dans la marge gauche en face de la ligne</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PARTIE III */}
            {activeSection === 'part3' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie III
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Mise en Forme du Texte et des Paragraphes
                  </h3>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-300">Mise en Forme des Caractères (Police)</h4>
                  <p className="text-xs text-slate-300">
                    Accessible dans l'onglet <strong>Accueil</strong> &gt; groupe <strong>Police</strong> :
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                    <li><strong>Police & Taille</strong> : Choix typographique (Calibri, Arial, Times New Roman...) et taille de 8 à 72 points avec boutons A⁺ et A⁻.</li>
                    <li><strong>Styles</strong> : Gras (Ctrl+G), Italique (Ctrl+I), Souligné (Ctrl+U), Barré.</li>
                    <li><strong>Indices & Exposants</strong> : Subscript et Superscript pour formules chimiques et mathématiques.</li>
                    <li><strong>Couleur & Surlignage</strong> : Palette de couleurs de thème et surligneurs fluo.</li>
                    <li><strong>Effacer la mise en forme</strong> : Réinitialise au format par défaut.</li>
                  </ul>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-300">Mise en Forme des Paragraphes</h4>
                  <p className="text-xs text-slate-300">
                    Accessible dans l'onglet <strong>Accueil</strong> &gt; groupe <strong>Paragraphe</strong> :
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                    <li><strong>Alignements</strong> : Gauche (Ctrl+L), Centré (Ctrl+E), Droite (Ctrl+R), Justifié (Ctrl+J).</li>
                    <li><strong>Listes</strong> : Puces rondes ou carrées, Numérotation hiérarchique.</li>
                    <li><strong>Interlignes</strong> : 1.0, 1.15, 1.5 et 2.0 pour l'aération du texte.</li>
                    <li><strong>Retraits</strong> : Boutons augmenter / diminuer le retrait de paragraphe.</li>
                    <li><strong>Bordures & Trame de fond</strong> : Encadrer un paragraphe ou ajouter une couleur de fond.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* PARTIE IV */}
            {activeSection === 'part4' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie IV
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Insertion d'Éléments : Tableaux, Illustrations et En-têtes
                  </h3>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-sm text-blue-300">Tableaux</h4>
                  <p className="text-xs text-slate-300">
                    Onglet <strong>Insertion</strong> &gt; <strong>Tableau</strong> : Grille graphique interactive, dialogue précis pour définir le nombre de lignes et colonnes, et mise en page de tableau avec styles prédéfinis.
                  </p>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-sm text-blue-300">Images et Illustrations</h4>
                  <p className="text-xs text-slate-300">
                    Insertion d'images, de formes vectorielles (rectangles, flèches, cercles), d'icônes, de diagrammes SmartArt et de graphiques statistiques avec options d'habillage du texte.
                  </p>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-sm text-blue-300">En-têtes, Pieds de Page et Numérotation</h4>
                  <p className="text-xs text-slate-300">
                    Permet d'ajouter des mentions répétées sur chaque page A4 (titre du rapport, auteur, numérotation de page dynamique, séparation par sauts de section).
                  </p>
                </div>
              </div>
            )}

            {/* PARTIE V */}
            {activeSection === 'part5' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie V
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Structuration de Documents Longs
                  </h3>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-300">Styles et Table des Matières</h4>
                  <p className="text-xs text-slate-300">
                    Word utilise les styles <strong>Titre 1</strong>, <strong>Titre 2</strong> et <strong>Titre 3</strong> pour construire automatiquement la table des matières avec les numéros de page cliquables.
                  </p>
                  <p className="text-xs text-slate-300">
                    Pour insérer la table : placez le curseur et cliquez sur <strong>Références &gt; Table des matières &gt; Table automatique</strong>.
                  </p>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-sm text-blue-300">Sauts de Page et de Section</h4>
                  <p className="text-xs text-slate-300">
                    <strong>Saut de page (Ctrl+Entrée)</strong> force le début d'une nouvelle page A4. Le <strong>Saut de section</strong> permet de changer l'orientation ou les marges d'une partie du document indépendamment du reste.
                  </p>
                </div>
              </div>
            )}

            {/* PARTIE VI */}
            {activeSection === 'part6' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie VI
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Fonctions Avancées : Le Publipostage (Mail Merge)
                  </h3>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-sm text-blue-300">Le Processus Complet en 5 Étapes</h4>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-5">
                    <li><strong>Démarrer la fusion</strong> : Choisir le type de document (Lettres, E-mails, Enveloppes, Étiquettes, Répertoire).</li>
                    <li><strong>Sélectionner les destinataires</strong> : Créer une liste de contacts ou importer des données de tableur.</li>
                    <li><strong>Insérer des champs de fusion</strong> : Insérer des balises telles que {'« {{Nom}} », « {{Prenom}} », « {{Adresse}} »'}.</li>
                    <li><strong>Aperçu des résultats</strong> : Parcourir les destinataires un par un pour vérifier le rendu en temps réel.</li>
                    <li><strong>Terminer &amp; Fusionner</strong> : Générer les documents individualisés ou lancer l'impression.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* PARTIE VII */}
            {activeSection === 'part7' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie VII
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Révision et Collaboration : Orthographe, Suivi et Commentaires
                  </h3>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-sm text-blue-300">Vérification Orthographique &amp; Volet Éditeur (F7)</h4>
                  <p className="text-xs text-slate-300">
                    Word souligne en rouge les fautes d'orthographe et en bleu les erreurs grammaticales. Le volet Éditeur permet de parcourir chaque erreur et d'appliquer la correction en 1 clic.
                  </p>
                </div>

                <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-sm text-blue-300">Suivi des Modifications &amp; Commentaires</h4>
                  <p className="text-xs text-slate-300">
                    Activez le suivi pour enregistrer les ajouts et suppressions en couleur. Utilisez les boutons <strong>Accepter</strong> ou <strong>Refuser</strong> pour valider les propositions. Les commentaires s'affichent dans la marge latérale droite.
                  </p>
                </div>
              </div>
            )}

            {/* PARTIE VIII */}
            {activeSection === 'part8' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-800 pb-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    Partie VIII
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Tableau des Raccourcis Clavier Essentiels
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Gagnez en efficacité et en rapidité en mémorisant les raccourcis clés de Word.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {shortcutsList.map((sc) => (
                    <div
                      key={sc.key}
                      className="bg-slate-850 border border-slate-750 p-2.5 rounded-xl flex items-center justify-between hover:border-slate-600 transition-colors"
                    >
                      <span className="text-slate-300">{sc.desc}</span>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono font-bold text-[11px] shadow-xs shrink-0 ml-2">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
