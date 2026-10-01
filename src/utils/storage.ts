import { OfficeFile, AppSettings, CalcSheet, Slide } from '../types/office';

const STORAGE_KEY_FILES = 'staroffice_files_v1';
const STORAGE_KEY_SETTINGS = 'staroffice_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  pinLockEnabled: false,
  pinCode: '1234',
  theme: 'dark',
  language: 'fr',
  viewMode: 'fluid',
  cloudProvider: 'none',
  autoSave: true,
  spellCheck: true,
  lastSyncTime: Date.now() - 3600000,
};

export const INITIAL_FILES: OfficeFile[] = [
  {
    id: 'doc-word-guide',
    name: 'Guide_Exhaustif_Microsoft_Word.docx',
    type: 'writer',
    extension: '.docx',
    updatedAt: Date.now(),
    createdAt: Date.now() - 1000 * 60 * 60,
    size: 64200,
    isFavorite: true,
    isPinned: true,
    folder: 'documents',
    tags: ['Guide', 'Microsoft Word', 'Officiel'],
    content: {
      html: `
        <h1 style="color: #2b579a; font-size: 26px; border-bottom: 2px solid #2b579a; padding-bottom: 6px; margin-bottom: 12px;">
          Guide exhaustif de Microsoft Word : Interface, Fonctions et Maîtrise Complète
        </h1>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;"><em>Manuel de Référence et d'Utilisation • Format A4 ISO 216</em></p>

        <h2>Partie I : Comprendre l'Interface de Word</h2>
        <p>L'interface de Word est conçue pour regrouper logiquement les outils selon leur fonction :</p>
        <ul>
          <li><strong>La Barre de Titre</strong> : Affiche le nom du document, l'application Word, ainsi que les boutons Réduire, Agrandir et Fermer.</li>
          <li><strong>La Barre d'Outils Accès Rapide</strong> : Enregistrer (Ctrl+S), Annuler (Ctrl+Z) et Rétablir (Ctrl+Y), avec menu déroulant de personnalisation.</li>
          <li><strong>L'Onglet Fichier (Vue Backstage)</strong> : Informations, Nouveau, Ouvrir, Enregistrer, Imprimer, Partager, Exporter, Fermer, Compte et Options.</li>
          <li><strong>Le Ruban (Ribbon)</strong> : 10 onglets thématiques (Accueil, Insertion, Dessin, Conception, Mise en page, Références, Publipostage, Révision, Affichage, Aide).</li>
          <li><strong>La Fenêtre d'Édition</strong> : Page A4 centrale avec curseur, mise en page fidèle et styles typographiques.</li>
          <li><strong>La Règle</strong> : Règle graduée en centimètres avec taquets de tabulation et ajustement des marges.</li>
          <li><strong>La Barre d'État</strong> : Nombre de pages, de mots, langue de vérification, mode INS/REF et curseur de zoom interactif.</li>
        </ul>

        <h2>Partie II : Opérations de Base</h2>
        <p>Prise en charge complète des formats <strong>.docx</strong>, <strong>.doc</strong>, <strong>.pdf</strong>, <strong>.rtf</strong> et <strong>.txt</strong>. Raccourcis de sélection rapide (double-clic pour un mot, triple-clic pour un paragraphe, Ctrl+A pour tout le document).</p>

        <h2>Partie III : Mise en Forme du Texte et des Paragraphes</h2>
        <p>Typographie (Calibri, Arial, Times New Roman), taille de 8 à 72 pt, <strong>Gras</strong>, <em>Italique</em>, <u>Souligné</u>, <s>Barré</s>, indice et exposant x<sup>2</sup>. Alignements (Gauche, Centré, Droite, Justifié), puces, numérotation et interlignes (1.0, 1.15, 1.5, 2.0).</p>

        <h2>Partie IV : Insertion d'Éléments</h2>
        <p>Insertion de tableaux quadrillés, images, formes vectorielles, diagrammes SmartArt, graphiques statistiques, en-têtes et pieds de page avec numérotation.</p>

        <h2>Partie V : Structuration de Documents Longs</h2>
        <p>Génération dynamique de la table des matières basée sur les styles Titre 1 et Titre 2, avec sauts de page (Ctrl+Entrée) et sauts de section.</p>

        <h2>Partie VI : Fonctions Avancées et Publipostage</h2>
        <p>Création d'enveloppes et d'étiquettes, gestionnaire de destinataires, insertion des champs de fusion tels que <strong>{{Civilite}}</strong>, <strong>{{Prenom}}</strong>, <strong>{{Nom}}</strong>, <strong>{{Societe}}</strong>, <strong>{{Adresse}}</strong>, <strong>{{Ville}}</strong>, avec aperçu individuel en direct.</p>

        <h2>Partie VII : Révision et Collaboration</h2>
        <p>Vérificateur orthographique et grammatical (touche F7) avec volet Éditeur interactif, suivi des modifications et commentaires dans la marge.</p>

        <h2>Partie VIII : Raccourcis Clavier Essentiels</h2>
        <p>Utilisez Ctrl+S pour sauvegarder, Ctrl+P pour imprimer, Ctrl+F pour rechercher, Ctrl+H pour remplacer, et F7 pour lancer le volet Éditeur.</p>
      `,
      wordCount: 380,
      readingTime: 2
    }
  },
  {
    id: 'doc-1',
    name: 'Cahier_des_Charges_StarOffice.docx',
    type: 'writer',
    extension: '.docx',
    updatedAt: Date.now() - 1000 * 60 * 15,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    size: 48200,
    isFavorite: true,
    isPinned: true,
    folder: 'documents',
    tags: ['Projet', 'Officiel'],
    content: {
      html: `
        <h1 style="color: #6366f1; font-size: 26px; margin-bottom: 8px;">🌟 StarOffice - Suite Bureautique Mobile</h1>
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 20px;"><em>Version 2.4 LTS • Conçue pour Android & Open-Source</em></p>
        
        <h2>1. Vision & Objectifs</h2>
        <p>StarOffice est conçue comme l'alternative libre, fluide et souveraine aux suites propriétaires (Microsoft 365, Google Docs, WPS). Elle garantit le respect total de vos données personnelles sans traqueurs ni télémétrie abusive.</p>
        
        <h2>2. Modules intégrés</h2>
        <ul>
          <li><strong>Writer</strong> : Traitement de texte compatible Word (.docx) et OpenDocument (.odt).</li>
          <li><strong>Calc</strong> : Tableur multi-feuilles avec moteur de calcul en temps réel et graphiques.</li>
          <li><strong>Impress</strong> : Créateur de présentations diaporama avec mode conférencier.</li>
          <li><strong>PDF Studio</strong> : Lecteur, surlignage, annotations et signature numérique intégrée.</li>
        </ul>

        <h2>3. Calendrier de déploiement 2026</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 16px;">
          <thead>
            <tr style="background-color: #312e81; color: white;">
              <th style="padding: 8px; text-align: left; border: 1px solid #4338ca;">Jalon</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #4338ca;">Date cible</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #4338ca;">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #475569;">Bêta Android & F-Droid</td>
              <td style="padding: 8px; border: 1px solid #475569;">15 Mars 2026</td>
              <td style="padding: 8px; border: 1px solid #475569; color: #10b981;">✓ Validé</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #475569;">Moteur Calc & Formules</td>
              <td style="padding: 8px; border: 1px solid #475569;">30 Avril 2026</td>
              <td style="padding: 8px; border: 1px solid #475569; color: #38bdf8;">En cours</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #475569;">Module Signature PDF</td>
              <td style="padding: 8px; border: 1px solid #475569;">15 Juin 2026</td>
              <td style="padding: 8px; border: 1px solid #475569; color: #f59e0b;">Planifié</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Sécurité & Données</h2>
        <p>Toutes les données sont stockées localement dans l'espace sécurisé de l'appareil. Le chiffrement AES-256 et la protection biométrique / code PIN peuvent être activés dans les paramètres.</p>
      `,
      wordCount: 198,
      readingTime: 1
    }
  },
  {
    id: 'sheet-1',
    name: 'Budget_Previsionnel_2026.xlsx',
    type: 'calc',
    extension: '.xlsx',
    updatedAt: Date.now() - 1000 * 60 * 45,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    size: 89400,
    isFavorite: true,
    isPinned: false,
    folder: 'documents',
    tags: ['Finance', 'Budget'],
    content: {
      sheets: [
        {
          id: 'sheet-main',
          name: 'Synthèse 2026',
          rowCount: 25,
          colCount: 10,
          frozenRows: 1,
          frozenCols: 1,
          data: {
            'A1': { value: 'Poste Budgétaire', bold: true, bg: '#312e81', color: '#ffffff', align: 'left' },
            'B1': { value: 'T1 (Jan-Mar)', bold: true, bg: '#312e81', color: '#ffffff', align: 'right' },
            'C1': { value: 'T2 (Avr-Juin)', bold: true, bg: '#312e81', color: '#ffffff', align: 'right' },
            'D1': { value: 'T3 (Juil-Sep)', bold: true, bg: '#312e81', color: '#ffffff', align: 'right' },
            'E1': { value: 'T4 (Oct-Déc)', bold: true, bg: '#312e81', color: '#ffffff', align: 'right' },
            'F1': { value: 'Total Annuel', bold: true, bg: '#1e1b4b', color: '#38bdf8', align: 'right' },

            'A2': { value: 'Revenus Licences Pro', bold: true, align: 'left' },
            'B2': { value: '18500', format: 'currency', align: 'right' },
            'C2': { value: '24200', format: 'currency', align: 'right' },
            'D2': { value: '29800', format: 'currency', align: 'right' },
            'E2': { value: '38000', format: 'currency', align: 'right' },
            'F2': { value: '=SUM(B2:E2)', format: 'currency', bold: true, align: 'right' },

            'A3': { value: 'Dons & Mécénat', align: 'left' },
            'B3': { value: '4500', format: 'currency', align: 'right' },
            'C3': { value: '5200', format: 'currency', align: 'right' },
            'D3': { value: '6100', format: 'currency', align: 'right' },
            'E3': { value: '7500', format: 'currency', align: 'right' },
            'F3': { value: '=SUM(B3:E3)', format: 'currency', bold: true, align: 'right' },

            'A4': { value: 'Services Support', align: 'left' },
            'B4': { value: '8200', format: 'currency', align: 'right' },
            'C4': { value: '9400', format: 'currency', align: 'right' },
            'D4': { value: '11200', format: 'currency', align: 'right' },
            'E4': { value: '13500', format: 'currency', align: 'right' },
            'F4': { value: '=SUM(B4:E4)', format: 'currency', bold: true, align: 'right' },

            'A5': { value: 'TOTAL REVENUS', bold: true, bg: '#064e3b', color: '#6ee7b7', align: 'left' },
            'B5': { value: '=SUM(B2:B4)', format: 'currency', bold: true, bg: '#064e3b', color: '#6ee7b7', align: 'right' },
            'C5': { value: '=SUM(C2:C4)', format: 'currency', bold: true, bg: '#064e3b', color: '#6ee7b7', align: 'right' },
            'D5': { value: '=SUM(D2:D4)', format: 'currency', bold: true, bg: '#064e3b', color: '#6ee7b7', align: 'right' },
            'E5': { value: '=SUM(E2:E4)', format: 'currency', bold: true, bg: '#064e3b', color: '#6ee7b7', align: 'right' },
            'F5': { value: '=SUM(B5:E5)', format: 'currency', bold: true, bg: '#064e3b', color: '#6ee7b7', align: 'right' },

            'A7': { value: 'DÉPENSES DÉVELOPPEMENT', bold: true, bg: '#450a0a', color: '#fca5a5', align: 'left' },
            'A8': { value: 'Salaires & Rémunérations', align: 'left' },
            'B8': { value: '14000', format: 'currency', align: 'right' },
            'C8': { value: '15500', format: 'currency', align: 'right' },
            'D8': { value: '16200', format: 'currency', align: 'right' },
            'E8': { value: '18000', format: 'currency', align: 'right' },
            'F8': { value: '=SUM(B8:E8)', format: 'currency', bold: true, align: 'right' },

            'A9': { value: 'Serveurs & Infrastructure Cloud', align: 'left' },
            'B9': { value: '1200', format: 'currency', align: 'right' },
            'C9': { value: '1400', format: 'currency', align: 'right' },
            'D9': { value: '1700', format: 'currency', align: 'right' },
            'E9': { value: '2000', format: 'currency', align: 'right' },
            'F9': { value: '=SUM(B9:E9)', format: 'currency', bold: true, align: 'right' },

            'A10': { value: 'TOTAL DÉPENSES', bold: true, bg: '#7f1d1d', color: '#fecaca', align: 'left' },
            'B10': { value: '=SUM(B8:B9)', format: 'currency', bold: true, bg: '#7f1d1d', color: '#fecaca', align: 'right' },
            'C10': { value: '=SUM(C8:C9)', format: 'currency', bold: true, bg: '#7f1d1d', color: '#fecaca', align: 'right' },
            'D10': { value: '=SUM(D8:D9)', format: 'currency', bold: true, bg: '#7f1d1d', color: '#fecaca', align: 'right' },
            'E10': { value: '=SUM(E8:E9)', format: 'currency', bold: true, bg: '#7f1d1d', color: '#fecaca', align: 'right' },
            'F10': { value: '=SUM(B10:E10)', format: 'currency', bold: true, bg: '#7f1d1d', color: '#fecaca', align: 'right' },

            'A12': { value: 'BÉNÉFICE NET', bold: true, bg: '#1e3a8a', color: '#93c5fd', align: 'left' },
            'B12': { value: '=B5-B10', format: 'currency', bold: true, align: 'right' },
            'C12': { value: '=C5-C10', format: 'currency', bold: true, align: 'right' },
            'D12': { value: '=D5-D10', format: 'currency', bold: true, align: 'right' },
            'E12': { value: '=E5-E10', format: 'currency', bold: true, align: 'right' },
            'F12': { value: '=F5-F10', format: 'currency', bold: true, bg: '#1d4ed8', color: '#ffffff', align: 'right' },
          }
        },
        {
          id: 'sheet-q1',
          name: 'Détail T1',
          rowCount: 15,
          colCount: 6,
          frozenRows: 1,
          frozenCols: 0,
          data: {
            'A1': { value: 'Semaine', bold: true },
            'B1': { value: 'Téléchargements', bold: true },
            'C1': { value: 'Utilisateurs Actifs', bold: true },
            'A2': { value: 'Semaine 1' }, 'B2': { value: '1420' }, 'C2': { value: '890' },
            'A3': { value: 'Semaine 2' }, 'B3': { value: '2300' }, 'C3': { value: '1650' },
            'A4': { value: 'Semaine 3' }, 'B4': { value: '3890' }, 'C4': { value: '2980' },
          }
        }
      ] as CalcSheet[]
    }
  },
  {
    id: 'pres-1',
    name: 'Presentation_StarOffice_Mobile.pptx',
    type: 'impress',
    extension: '.pptx',
    updatedAt: Date.now() - 1000 * 60 * 120,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    size: 152000,
    isFavorite: false,
    isPinned: false,
    folder: 'documents',
    tags: ['Pitch', 'Présentation'],
    content: {
      slides: [
        {
          id: 'slide-1',
          title: 'StarOffice Mobile',
          subtitle: 'La suite bureautique Android open source de référence',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          transition: 'fade',
          notes: 'Bienvenue à tous. Présenter la mission : redonner le contrôle de la productivité mobile aux utilisateurs.',
          elements: [
            {
              id: 'el-1',
              type: 'badge',
              content: '🚀 Open-Source • 100% Respectueux de la vie privée',
              color: '#38bdf8',
              bgColor: 'rgba(56, 189, 248, 0.15)',
              fontSize: 14,
              align: 'center'
            },
            {
              id: 'el-2',
              type: 'text',
              content: 'Compatibilité native DOCX • XLSX • PPTX • PDF • ODF',
              color: '#c7d2fe',
              fontSize: 16,
              align: 'center'
            }
          ]
        },
        {
          id: 'slide-2',
          title: 'Pourquoi StarOffice ?',
          subtitle: 'Les 3 piliers fondateurs',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          transition: 'slide',
          notes: 'Mettre l accent sur l absence totale de trackers et la compatibilité totale avec Microsoft Office.',
          elements: [
            {
              id: 'el-pillar-1',
              type: 'shape',
              shapeType: 'rectangle',
              content: '🔒 Souveraineté & Vie Privée\nAucun compte obligatoire, zéro tracker, stockage local chiffré.',
              bgColor: 'rgba(30, 41, 59, 0.8)',
              color: '#38bdf8',
              fontSize: 15
            },
            {
              id: 'el-pillar-2',
              type: 'shape',
              shapeType: 'rectangle',
              content: '⚡ Légèreté & Performance\nDémarrage instantané, faible consommation de batterie et RAM.',
              bgColor: 'rgba(30, 41, 59, 0.8)',
              color: '#34d399',
              fontSize: 15
            },
            {
              id: 'el-pillar-3',
              type: 'shape',
              shapeType: 'rectangle',
              content: '📱 Expérience Android Moderne\nMaterial Design 3, interface pensée pour smartphones et tablettes.',
              bgColor: 'rgba(30, 41, 59, 0.8)',
              color: '#fbbf24',
              fontSize: 15
            }
          ]
        },
        {
          id: 'slide-3',
          title: 'Indicateurs de Performance',
          subtitle: 'Statistiques clés de la communauté',
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
          transition: 'zoom',
          notes: 'Ces chiffres illustrent l engouement fort pour les alternatives libres sur mobile.',
          elements: [
            {
              id: 'metric-1',
              type: 'metric',
              content: '250 000+',
              subtitle: 'Téléchargements F-Droid & direct APK',
              color: '#818cf8',
              fontSize: 32,
              align: 'center'
            },
            {
              id: 'metric-2',
              type: 'metric',
              content: '99.8%',
              subtitle: 'Fidélité de rendu des fichiers .docx et .xlsx',
              color: '#34d399',
              fontSize: 32,
              align: 'center'
            },
            {
              id: 'metric-3',
              type: 'metric',
              content: '0 byte',
              subtitle: 'Donnée personnelle collectée',
              color: '#fb7185',
              fontSize: 32,
              align: 'center'
            }
          ]
        },
        {
          id: 'slide-4',
          title: 'Feuille de Route 2026',
          subtitle: 'Prochaines innovations',
          background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)',
          transition: 'fade',
          notes: 'Conclure sur l appel aux contributeurs et partenaires académiques.',
          elements: [
            {
              id: 'el-rd-1',
              type: 'text',
              content: '✓ T1 : Lancement du module d annotation et signature PDF',
              color: '#bfdbfe',
              fontSize: 16
            },
            {
              id: 'el-rd-2',
              type: 'text',
              content: '✓ T2 : Synchronisation Nextcloud / WebDAV chiffrée de bout en bout',
              color: '#bfdbfe',
              fontSize: 16
            },
            {
              id: 'el-rd-3',
              type: 'text',
              content: '✓ T3 : Mode collaboratif local en Wi-Fi direct (Peer-to-Peer)',
              color: '#bfdbfe',
              fontSize: 16
            }
          ]
        }
      ] as Slide[]
    }
  },
  {
    id: 'pdf-1',
    name: 'Accord_Partenariat_OpenSource.pdf',
    type: 'pdf',
    extension: '.pdf',
    updatedAt: Date.now() - 1000 * 60 * 360,
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
    size: 215400,
    isFavorite: false,
    isPinned: false,
    folder: 'documents',
    tags: ['Contrat', 'Signé'],
    content: {
      title: 'Accord de Partenariat & Licence Open Source StarOffice',
      docReference: 'SO-2026-FR-09',
      totalPages: 2,
      signeeName: 'Emmanuel Leon',
      signedDate: '2026-10-01',
      status: 'En attente de signature',
      formFields: {
        company: 'StarOffice Foundation',
        contactEmail: 'contact@staroffice.org',
        agreeTerms: true,
        licenseType: 'GPLv3 & Apache 2.0 Dual License'
      },
      annotations: [
        {
          id: 'ann-1',
          type: 'stamp',
          page: 1,
          x: 260,
          y: 60,
          text: 'DOCUMENT OFFICIEL',
          color: '#10b981'
        },
        {
          id: 'ann-2',
          type: 'highlight',
          page: 1,
          x: 40,
          y: 220,
          text: 'Le code source est libre d accès, réutilisable sans royalties.',
          color: '#facc15'
        }
      ]
    }
  }
];

export function loadFiles(): OfficeFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILES);
    if (!raw) {
      saveFiles(INITIAL_FILES);
      return INITIAL_FILES;
    }
    const parsed: OfficeFile[] = JSON.parse(raw);
    // Ensure doc-word-guide is always available
    if (!parsed.some((f) => f.id === 'doc-word-guide')) {
      const guideDoc = INITIAL_FILES.find((f) => f.id === 'doc-word-guide');
      if (guideDoc) {
        const merged = [guideDoc, ...parsed];
        saveFiles(merged);
        return merged;
      }
    }
    return parsed;
  } catch (e) {
    console.error('Error loading files from localStorage', e);
    return INITIAL_FILES;
  }
}

export function saveFiles(files: OfficeFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
  } catch (e) {
    console.error('Error saving files to localStorage', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed, viewMode: parsed.viewMode === 'mobile' ? 'fluid' : (parsed.viewMode || 'fluid') };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}
