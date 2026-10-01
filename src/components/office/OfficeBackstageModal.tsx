import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Save,
  Download,
  Printer,
  Share2,
  FolderOpen,
  Info,
  Clock,
  HardDrive,
  FileCheck,
  CheckCircle2,
  Table2,
  Presentation,
  Shield,
  Lock,
  User,
  Settings,
  X,
  FileSpreadsheet,
  Copy,
  Mail,
  Check,
  Eye
} from 'lucide-react';
import { OfficeFile, DocumentType } from '../../types/office';
import { downloadBlob } from '../../utils/export';

interface OfficeBackstageModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: OfficeFile;
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
  onNew: (type: DocumentType) => void;
  onBrowseFiles: () => void;
  onCloseDocument?: () => void;
  onSelectTemplate?: (templateData: any) => void;
}

type BackstageTab =
  | 'info'
  | 'new'
  | 'open'
  | 'save'
  | 'saveAs'
  | 'print'
  | 'share'
  | 'export'
  | 'account'
  | 'options';

export const OfficeBackstageModal: React.FC<OfficeBackstageModalProps> = ({
  isOpen,
  onClose,
  file,
  onSave,
  onExport,
  onPrint,
  onNew,
  onBrowseFiles,
  onCloseDocument,
  onSelectTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<BackstageTab>('info');
  const [saveAsName, setSaveAsName] = useState(file.name);
  const [saveAsFormat, setSaveAsFormat] = useState('.docx');
  const [isProtected, setIsProtected] = useState(false);
  const [protectPassword, setProtectPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Print settings
  const [printCopies, setPrintCopies] = useState(1);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  if (!isOpen) return null;

  const handleDownloadAs = (format: string) => {
    let mimeType = 'text/plain';
    let content = file.content?.html || '';
    if (format === '.txt') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      content = tempDiv.innerText || '';
      mimeType = 'text/plain';
    } else if (format === '.html') {
      mimeType = 'text/html';
    } else if (format === '.docx' || format === '.doc') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (format === '.pdf') {
      window.print();
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const cleanName = saveAsName.replace(/\.[^/.]+$/, '');
    downloadBlob(blob, `${cleanName}${format}`);
    onClose();
  };

  const handleCopyDocumentText = () => {
    if (file.content?.html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = file.content.html;
      navigator.clipboard.writeText(tempDiv.innerText || '');
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  const templatesList = [
    {
      title: 'Document vierge',
      desc: 'Commencer avec une page blanche au format standard A4.',
      type: 'writer' as DocumentType,
      content: { html: '<p>Tapez votre texte ici...</p>', wordCount: 4 },
    },
    {
      title: 'Curriculum Vitae chronologique',
      desc: 'Modèle professionnel avec en-tête, compétences et expériences.',
      type: 'writer' as DocumentType,
      content: {
        html: `
          <h1 style="color:#1e3a8a; border-bottom:2px solid #2563eb; padding-bottom:6px;">Prénom NOM</h1>
          <p style="color:#475569; font-size:13px;">Développeur Full-Stack &amp; Ingénieur Logiciel • Paris, France • contact@exemple.fr</p>
          <h2 style="color:#1e40af; margin-top:16px;">Expériences Professionnelles</h2>
          <p><strong>Lead Developer</strong> — Tech Solutions (2022 - Présent)<br>Gestion de projets d'applications web complexes et encadrement d'équipe.</p>
          <h2 style="color:#1e40af; margin-top:16px;">Formation</h2>
          <p><strong>Master en Informatique</strong> — Université Sorbonne (2017 - 2022)</p>
          <h2 style="color:#1e40af; margin-top:16px;">Compétences Clés</h2>
          <p>TypeScript, React, Architecture logicielle, Suites bureautiques Office.</p>
        `,
        wordCount: 75,
      },
    },
    {
      title: 'Lettre de motivation formelle',
      desc: 'Mise en page standard conforme aux normes françaises de correspondance.',
      type: 'writer' as DocumentType,
      content: {
        html: `
          <p style="text-align:right;">Paris, le 1er octobre 2026</p>
          <p><strong>Prénom NOM</strong><br>12 rue de la Paix<br>75002 Paris</p>
          <p style="margin-top:20px;"><strong>À l'attention de la Direction des Ressources Humaines</strong><br>Société Avenir Technologies</p>
          <p style="margin-top:20px;"><strong>Objet : Candidature au poste de Responsable de Projet</strong></p>
          <p style="margin-top:16px;">Madame, Monsieur,</p>
          <p>Actuellement à la recherche de nouveaux défis professionnels, c'est avec un vif intérêt que je vous soumets ma candidature pour rejoindre votre entreprise en pleine expansion.</p>
          <p>Fort d'une expérience confirmée dans le domaine, j'ai développé une solide expertise en gestion de projets et optimisation des processus.</p>
          <p>Je reste à votre entière disposition pour tout entretien approfondi.</p>
          <p style="margin-top:20px;">Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
          <p style="margin-top:30px;"><em>Prénom NOM</em></p>
        `,
        wordCount: 120,
      },
    },
    {
      title: 'Rapport de projet d\'entreprise',
      desc: 'Structure complète avec table des matières, sections et conclusion.',
      type: 'writer' as DocumentType,
      content: {
        html: `
          <h1 style="color:#0f172a; text-align:center; margin-top:24px; font-size:26px;">RAPPORT ANNUEL DE STRATÉGIE</h1>
          <p style="text-align:center; color:#64748b;">Département Innovation &amp; Systèmes d'Information</p>
          <hr style="margin:24px 0; border:0; border-top:1px solid #cbd5e1;">
          <h2 style="color:#1e3a8a;">1. Synthèse Exécutive</h2>
          <p>L'exercice écoulé a été marqué par une forte consolidation de nos plateformes numériques et l'adoption d'outils collaboratifs modernes.</p>
          <h2 style="color:#1e3a8a;">2. Analyse des Résultats</h2>
          <p>Les indicateurs de productivité témoignent d'une hausse globale de 18% sur l'ensemble des départements opérationnels.</p>
          <h2 style="color:#1e3a8a;">3. Recommandations et Perspectives</h2>
          <p>Poursuite des investissements dans l'interopérabilité et la sécurité des documents d'entreprise.</p>
        `,
        wordCount: 95,
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none animate-in fade-in duration-150 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="h-12 bg-[#2b579a] text-white px-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/20 active:scale-95 transition-all text-white"
            title="Retour au document"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm tracking-tight">Microsoft Word • Vue Backstage (Fichier)</span>
        </div>
        <div className="text-xs text-white/80 font-mono hidden sm:block">Office Backstage View</div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Action Rail (Official MS Word Backstage commands) */}
        <nav className="w-48 sm:w-56 bg-slate-900 border-r border-slate-800 p-3 space-y-1 shrink-0 overflow-y-auto">
          {[
            { id: 'info', label: 'Informations', icon: Info },
            { id: 'new', label: 'Nouveau', icon: FileText },
            { id: 'open', label: 'Ouvrir', icon: FolderOpen },
            { id: 'save', label: 'Enregistrer', icon: Save },
            { id: 'saveAs', label: 'Enregistrer sous', icon: Download },
            { id: 'print', label: 'Imprimer', icon: Printer },
            { id: 'share', label: 'Partager', icon: Share2 },
            { id: 'export', label: 'Exporter', icon: FileCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'save') {
                    onSave();
                  }
                  setActiveTab(item.id as BackstageTab);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="h-px bg-slate-800 my-2" />

          {/* Fermer command (closes document and returns to home) */}
          <button
            onClick={() => {
              if (onCloseDocument) {
                onCloseDocument();
              } else {
                onBrowseFiles();
              }
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 text-xs font-medium text-left transition-colors"
            title="Ferme le document sans fermer l'application"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>Fermer le document</span>
          </button>

          <div className="h-px bg-slate-800 my-2" />

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
              activeTab === 'account' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-slate-400" />
            <span>Compte</span>
          </button>

          <button
            onClick={() => setActiveTab('options')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
              activeTab === 'options' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Options</span>
          </button>
        </nav>

        {/* Right Panel View */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-4xl text-slate-200">
          {/* 1. INFORMATIONS */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Informations sur le document</h2>
                <p className="text-xs text-slate-400">
                  Propriétés, sécurité, autorisations et historique
                </p>
              </div>

              {/* Protection Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isProtected ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Protéger le document</h3>
                      <p className="text-xs text-slate-400">
                        {isProtected ? 'Document protégé par mot de passe en lecture seule' : 'Contrôler le type de modifications autorisées sur ce fichier.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isProtected ? 'Modifier protection' : 'Chiffrer'}</span>
                  </button>
                </div>
              </div>

              {/* Properties Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Propriétés du fichier
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Nom du document :</span>
                    <span className="font-semibold text-white">{file.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Taille estimée :</span>
                    <span className="font-semibold text-white">{(file.size / 1024).toFixed(1)} Ko</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Pages &amp; Format :</span>
                    <span className="font-semibold text-white">1 page • Format A4 (210 × 297 mm)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Nombre de mots :</span>
                    <span className="font-semibold text-blue-400">{file.content?.wordCount || 10} mots</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Dernière modification :</span>
                    <span className="font-semibold text-white">{new Date(file.updatedAt).toLocaleString('fr-FR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Auteur du document :</span>
                    <span className="font-semibold text-white">Utilisateur Microsoft Word</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. NOUVEAU */}
          {activeTab === 'new' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Nouveau document</h2>
                <p className="text-xs text-slate-400">
                  Choisissez parmi les modèles officiels Microsoft Word
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {templatesList.map((tpl, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (onSelectTemplate) {
                        onSelectTemplate({
                          name: `${tpl.title.replace(/\s+/g, '_')}.docx`,
                          type: tpl.type,
                          extension: '.docx',
                          content: tpl.content,
                        });
                      } else {
                        onNew(tpl.type);
                      }
                      onClose();
                    }}
                    className="p-4 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl cursor-pointer transition-all hover:shadow-xl group space-y-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      {tpl.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. OUVRIR */}
          {activeTab === 'open' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Ouvrir un document</h2>
                <p className="text-xs text-slate-400">
                  Accéder aux documents récents ou parcourir votre ordinateur
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    onBrowseFiles();
                    onClose();
                  }}
                  className="w-full p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center gap-3 text-left transition-all"
                >
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Parcourir le gestionnaire de fichiers</h3>
                    <p className="text-xs text-slate-400">Explorer les dossiers internes, téléchargements et stockage local</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 4 & 5. ENREGISTRER / ENREGISTRER SOUS */}
          {(activeTab === 'save' || activeTab === 'saveAs') && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Enregistrer sous</h2>
                <p className="text-xs text-slate-400">
                  Partie II : Sauvegarder dans différents formats (.docx, .doc, .pdf, .rtf, .txt)
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nom du document :</label>
                  <input
                    type="text"
                    value={saveAsName}
                    onChange={(e) => setSaveAsName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Type de fichier (Format) :</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { ext: '.docx', label: 'Document Word (*.docx)', desc: 'Format standard Word moderne' },
                      { ext: '.doc', label: 'Document Word 97-2003 (*.doc)', desc: 'Compatibilité ancienne version' },
                      { ext: '.pdf', label: 'Document PDF (*.pdf)', desc: 'Format lecture seule & impression' },
                      { ext: '.rtf', label: 'Format Texte Enrichi (*.rtf)', desc: 'Format compatible multi-éditeurs' },
                      { ext: '.txt', label: 'Texte Brut (*.txt)', desc: 'Sans mise en forme' },
                      { ext: '.html', label: 'Page Web (*.html)', desc: 'Format balisé pour navigateur' },
                    ].map((fmt) => (
                      <button
                        key={fmt.ext}
                        type="button"
                        onClick={() => setSaveAsFormat(fmt.ext)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          saveAsFormat === fmt.ext
                            ? 'border-blue-500 bg-blue-600/20 text-white font-semibold'
                            : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs">{fmt.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDownloadAs(saveAsFormat)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. IMPRIMER */}
          {activeTab === 'print' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Imprimer</h2>
                <p className="text-xs text-slate-400">Options d'impression et aperçu avant impression A4</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Print Options */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <button
                    onClick={() => {
                      onPrint();
                      onClose();
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg active:scale-98 transition-all"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Lancer l'impression A4</span>
                  </button>

                  <div className="space-y-3 text-xs pt-3 border-t border-slate-800">
                    <div>
                      <label className="text-slate-400 block mb-1">Nombre d'exemplaires :</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={printCopies}
                        onChange={(e) => setPrintCopies(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Orientation de la page :</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPrintOrientation('portrait')}
                          className={`flex-1 p-2 rounded-lg border text-xs font-semibold ${
                            printOrientation === 'portrait' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          Portrait
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintOrientation('landscape')}
                          className={`flex-1 p-2 rounded-lg border text-xs font-semibold ${
                            printOrientation === 'landscape' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          Paysage
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Format papier :</label>
                      <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-white font-mono text-xs">
                        A4 (21,0 × 29,7 cm) - Standard ISO 216
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Preview Sheet */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <div className="text-xs text-slate-400 mb-2 font-medium">Aperçu avant impression</div>
                  <div className="w-52 h-72 bg-white text-slate-900 shadow-xl rounded-xs p-3 text-[7px] leading-tight overflow-hidden border border-slate-300">
                    <div className="border-b border-slate-200 pb-1 mb-2 font-bold uppercase text-[6px] text-slate-400">
                      Document Word A4
                    </div>
                    <div
                      className="prose prose-xs line-clamp-12"
                      dangerouslySetInnerHTML={{ __html: file.content?.html || '<p>Texte du document...</p>' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. PARTAGER */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Partager le document</h2>
                <p className="text-xs text-slate-400">Envoyer ou diffuser le texte vers d'autres applications</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleCopyDocumentText}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl text-left transition-all space-y-2 group"
                >
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
                    {copiedSuccess ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <h3 className="font-bold text-sm text-white">
                    {copiedSuccess ? 'Texte copié !' : 'Copier tout le contenu'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Copie l'intégralité du texte du document dans votre presse-papiers.
                  </p>
                </button>

                <button
                  onClick={() => {
                    const subject = encodeURIComponent(file.name);
                    const body = encodeURIComponent("Veuillez trouver ci-joint le document rédigé sous Word.");
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                  }}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl text-left transition-all space-y-2 group"
                >
                  <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Envoyer par E-mail</h3>
                  <p className="text-xs text-slate-400">
                    Ouvre votre client de messagerie avec le sujet prérempli.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* 8. EXPORTER */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Exporter</h2>
                <p className="text-xs text-slate-400">Conversion instantanée vers PDF et autres formats</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => handleDownloadAs('.pdf')}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-rose-500 rounded-2xl text-left transition-all space-y-2"
                >
                  <div className="p-3 bg-rose-600/20 text-rose-400 rounded-xl w-fit">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Créer PDF / XPS</h3>
                  <p className="text-xs text-slate-400">Conserve la mise en page et les polices pour diffusion</p>
                </button>

                <button
                  onClick={() => handleDownloadAs('.docx')}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-2xl text-left transition-all space-y-2"
                >
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl w-fit">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Fichier DOCX</h3>
                  <p className="text-xs text-slate-400">Pour continuer l'édition sur un autre poste</p>
                </button>

                <button
                  onClick={() => handleDownloadAs('.txt')}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl text-left transition-all space-y-2"
                >
                  <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Texte brut TXT</h3>
                  <p className="text-xs text-slate-400">Export universel sans balisage</p>
                </button>
              </div>
            </div>
          )}

          {/* 9. COMPTE */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Compte utilisateur</h2>
                <p className="text-xs text-slate-400">Informations de profil et licence Office</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                    WO
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Utilisateur Microsoft Word</h3>
                    <p className="text-xs text-slate-400">Compte local sécurisé • StarOffice Suite</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-xs space-y-2">
                  <div className="text-slate-400">Produit activé :</div>
                  <div className="font-bold text-white text-sm">Microsoft Word 365 Professional</div>
                  <div className="text-emerald-400 flex items-center gap-1 text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Licence complète active &amp; hors-ligne
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. OPTIONS */}
          {activeTab === 'options' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Options de Word</h2>
                <p className="text-xs text-slate-400">Personnalisation des paramètres de l'application</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-sm">Affichage et Édition</h3>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                    <span className="text-slate-300">Afficher la règle graduée en centimètres</span>
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                    <span className="text-slate-300">Vérification orthographique au cours de la frappe</span>
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800">
                    <span className="text-slate-300">Sauvegarde automatique des documents</span>
                    <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Password Protection Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" /> Chiffrer le document
            </h3>
            <p className="text-xs text-slate-400">
              Définissez un mot de passe pour protéger l'ouverture de ce document Word.
            </p>
            <input
              type="password"
              placeholder="Entrez un mot de passe..."
              value={protectPassword}
              onChange={(e) => setProtectPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setIsProtected(!!protectPassword);
                  setShowPasswordModal(false);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
