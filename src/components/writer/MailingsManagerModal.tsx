import React, { useState } from 'react';
import {
  Mail,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  X,
  FileText,
  Tag
} from 'lucide-react';

export interface Recipient {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  societe: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
}

export const INITIAL_RECIPIENTS: Recipient[] = [
  {
    id: 'rec-1',
    civilite: 'M.',
    nom: 'Dupont',
    prenom: 'Jean',
    societe: 'Tech Innovations France',
    adresse: '14 rue de Rivoli',
    codePostal: '75001',
    ville: 'Paris',
    email: 'j.dupont@techinno.fr',
  },
  {
    id: 'rec-2',
    civilite: 'Mme',
    nom: 'Curie',
    prenom: 'Marie',
    societe: 'Laboratoire Sorbonne',
    adresse: '12 rue Pierre et Marie Curie',
    codePostal: '75005',
    ville: 'Paris',
    email: 'm.curie@sorbonne.fr',
  },
  {
    id: 'rec-3',
    civilite: 'M.',
    nom: 'Edison',
    prenom: 'Thomas',
    societe: 'General Electric R&D',
    adresse: '8 boulevard Haussmann',
    codePostal: '75009',
    ville: 'Paris',
    email: 't.edison@ge-innov.com',
  },
];

interface MailingsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  onUpdateRecipients: (recipients: Recipient[]) => void;
  documentContent: string;
  onInsertField: (fieldTag: string) => void;
  onApplyMergedDocument: (mergedHtml: string) => void;
}

export const MailingsManagerModal: React.FC<MailingsManagerModalProps> = ({
  isOpen,
  onClose,
  recipients,
  onUpdateRecipients,
  documentContent,
  onInsertField,
  onApplyMergedDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'recipients' | 'preview' | 'finish'>('recipients');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mergeType, setMergeType] = useState<'letters' | 'labels' | 'envelopes' | 'directory'>('letters');

  // New recipient form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [formCivilite, setFormCivilite] = useState('M.');
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formSociete, setFormSociete] = useState('');
  const [formAdresse, setFormAdresse] = useState('');
  const [formCodePostal, setFormCodePostal] = useState('');
  const [formVille, setFormVille] = useState('');
  const [formEmail, setFormEmail] = useState('');

  if (!isOpen) return null;

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom || !formPrenom) return;
    const newRec: Recipient = {
      id: `rec-${Date.now()}`,
      civilite: formCivilite,
      nom: formNom,
      prenom: formPrenom,
      societe: formSociete || 'Particulier',
      adresse: formAdresse || 'Adresse non renseignée',
      codePostal: formCodePostal || '75000',
      ville: formVille || 'Paris',
      email: formEmail || `${formPrenom.toLowerCase()}.${formNom.toLowerCase()}@email.com`,
    };
    onUpdateRecipients([...recipients, newRec]);
    setShowAddForm(false);
    // reset
    setFormNom('');
    setFormPrenom('');
    setFormSociete('');
    setFormAdresse('');
    setFormCodePostal('');
    setFormVille('');
    setFormEmail('');
  };

  const handleDeleteRecipient = (id: string) => {
    const updated = recipients.filter((r) => r.id !== id);
    onUpdateRecipients(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const getMergedContent = (rec: Recipient | undefined) => {
    if (!rec) return documentContent;
    let res = documentContent;
    res = res.replace(/\{\{Civilite\}\}/g, rec.civilite);
    res = res.replace(/\{\{Nom\}\}/g, rec.nom);
    res = res.replace(/\{\{Prenom\}\}/g, rec.prenom);
    res = res.replace(/\{\{Societe\}\}/g, rec.societe);
    res = res.replace(/\{\{Adresse\}\}/g, rec.adresse);
    res = res.replace(/\{\{Code_Postal\}\}/g, rec.codePostal);
    res = res.replace(/\{\{Ville\}\}/g, rec.ville);
    res = res.replace(/\{\{Email\}\}/g, rec.email);
    return res;
  };

  const handleFinishMerge = () => {
    // Generate combined document separated by page breaks
    const allPages = recipients.map((r, i) => {
      const pageHtml = getMergedContent(r);
      return `<div class="merged-page" style="page-break-after: always; min-height: 1000px; padding: 40px; margin-bottom: 24px; border: 1px solid #cbd5e1; background: white;">
        <div style="font-size: 10px; color: #94a3b8; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Publipostage individuel • Destinataire ${i + 1} / ${recipients.length} : ${r.prenom} ${r.nom}</div>
        ${pageHtml}
      </div>`;
    }).join('');

    onApplyMergedDocument(allPages);
    onClose();
  };

  const currentRecipient = recipients[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 text-slate-100">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-4xl h-[86vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[#2b579a] text-white px-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                Gestionnaire de Publipostage Word
              </h2>
              <p className="text-[11px] text-blue-100 font-normal">
                Partie VI : Destinataires, Fusion, Aperçu et Impression individualisée
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="h-10 bg-slate-850 border-b border-slate-750 px-4 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('recipients')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'recipients' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Destinataires ({recipients.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Aperçu des résultats</span>
          </button>
          <button
            onClick={() => setActiveTab('finish')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'finish' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>3. Terminer &amp; Fusionner</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-200 space-y-4">
          {/* TAB 1: RECIPIENTS */}
          {activeTab === 'recipients' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Liste des destinataires</h3>
                  <p className="text-slate-400 text-[11px]">
                    Sélectionnez, ajoutez ou modifiez les contacts qui recevront le document fusionné.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau contact</span>
                </button>
              </div>

              {/* Add contact form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddRecipient}
                  className="bg-slate-850 border border-slate-700 rounded-xl p-4 space-y-3 animate-in fade-in"
                >
                  <div className="font-semibold text-white">Ajouter un nouveau destinataire</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Civilité</label>
                      <select
                        value={formCivilite}
                        onChange={(e) => setFormCivilite(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      >
                        <option value="M.">M.</option>
                        <option value="Mme">Mme</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof.">Prof.</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={formPrenom}
                        onChange={(e) => setFormPrenom(e.target.value)}
                        placeholder="Jean"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Nom *</label>
                      <input
                        type="text"
                        required
                        value={formNom}
                        onChange={(e) => setFormNom(e.target.value)}
                        placeholder="Dupont"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Société</label>
                      <input
                        type="text"
                        value={formSociete}
                        onChange={(e) => setFormSociete(e.target.value)}
                        placeholder="Acme Corp"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-slate-400 text-[10px] block mb-0.5">Adresse</label>
                      <input
                        type="text"
                        value={formAdresse}
                        onChange={(e) => setFormAdresse(e.target.value)}
                        placeholder="14 rue de Rivoli"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Code postal</label>
                      <input
                        type="text"
                        value={formCodePostal}
                        onChange={(e) => setFormCodePostal(e.target.value)}
                        placeholder="75001"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-0.5">Ville</label>
                      <input
                        type="text"
                        value={formVille}
                        onChange={(e) => setFormVille(e.target.value)}
                        placeholder="Paris"
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold"
                    >
                      Ajouter
                    </button>
                  </div>
                </form>
              )}

              {/* Table of recipients */}
              <div className="bg-slate-850 border border-slate-750 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-700">
                    <tr>
                      <th className="p-2.5">Civilité</th>
                      <th className="p-2.5">Nom complet</th>
                      <th className="p-2.5">Société</th>
                      <th className="p-2.5">Adresse</th>
                      <th className="p-2.5">Ville</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-750 text-slate-200">
                    {recipients.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/50">
                        <td className="p-2.5 text-slate-400">{rec.civilite}</td>
                        <td className="p-2.5 font-medium text-white">{rec.prenom} {rec.nom}</td>
                        <td className="p-2.5 text-slate-300">{rec.societe}</td>
                        <td className="p-2.5 text-slate-300">{rec.adresse}</td>
                        <td className="p-2.5 text-slate-300">{rec.codePostal} {rec.ville}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleDeleteRecipient(rec.id)}
                            className="p-1 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick field inserters */}
              <div className="bg-slate-850 border border-slate-750 rounded-xl p-3.5 space-y-2">
                <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  <span>Insérer un champ de fusion dans le document</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '« Civilité »', tag: ' {{Civilite}} ' },
                    { label: '« Prénom »', tag: ' {{Prenom}} ' },
                    { label: '« Nom »', tag: ' {{Nom}} ' },
                    { label: '« Société »', tag: ' {{Societe}} ' },
                    { label: '« Adresse »', tag: ' {{Adresse}} ' },
                    { label: '« Code Postal »', tag: ' {{Code_Postal}} ' },
                    { label: '« Ville »', tag: ' {{Ville}} ' },
                    { label: '« E-mail »', tag: ' {{Email}} ' },
                  ].map((f) => (
                    <button
                      key={f.tag}
                      onClick={() => {
                        onInsertField(f.tag);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50 rounded-lg text-xs transition-colors"
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW RESULTS */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-850 border border-slate-750 p-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Enregistrement :</span>
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono font-bold text-blue-400">
                    {currentIndex + 1} sur {recipients.length}
                  </span>
                  <button
                    disabled={currentIndex >= recipients.length - 1}
                    onClick={() => setCurrentIndex(Math.min(recipients.length - 1, currentIndex + 1))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {currentRecipient && (
                  <div className="text-slate-300 text-xs">
                    Destinataire : <strong className="text-white">{currentRecipient.prenom} {currentRecipient.nom}</strong> ({currentRecipient.societe})
                  </div>
                )}
              </div>

              {/* Rendered Preview Page */}
              <div className="border border-slate-700 rounded-xl bg-white text-slate-900 p-8 shadow-inner min-h-[350px] overflow-y-auto">
                <div className="text-[10px] text-slate-400 border-b pb-2 mb-4">
                  Aperçu de la fusion Word pour : {currentRecipient?.civilite} {currentRecipient?.prenom} {currentRecipient?.nom} • {currentRecipient?.adresse}, {currentRecipient?.codePostal} {currentRecipient?.ville}
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: getMergedContent(currentRecipient) }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: FINISH & MERGE */}
          {activeTab === 'finish' && (
            <div className="space-y-4 max-w-xl mx-auto py-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white">Prêt pour la fusion finale</h3>
                <p className="text-xs text-slate-400">
                  Votre document va être généré individuellement pour les {recipients.length} destinataires configurés.
                </p>
              </div>

              <div className="bg-slate-850 border border-slate-750 rounded-xl p-4 space-y-3">
                <div className="font-semibold text-white">Options de publication</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 cursor-pointer">
                    <input
                      type="radio"
                      name="mtype"
                      checked={mergeType === 'letters'}
                      onChange={() => setMergeType('letters')}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-white">Modifier les documents individuels</div>
                      <div className="text-[10px] text-slate-400">Génère un document continu A4 avec sauts de page pour chaque destinataire</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 cursor-pointer">
                    <input
                      type="radio"
                      name="mtype"
                      checked={mergeType === 'envelopes'}
                      onChange={() => setMergeType('envelopes')}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-white">Enveloppes et Étiquettes</div>
                      <div className="text-[10px] text-slate-400">Format d'expédition standard DL / C5 avec adresses postales</div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleFinishMerge}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>Générer et fusionner les {recipients.length} lettres</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
