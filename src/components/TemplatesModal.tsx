import React, { useState } from 'react';
import { X, Sparkles, FileText, Table2, Presentation, FileCheck, ArrowRight } from 'lucide-react';
import { DocumentType, OfficeFile } from '../types/office';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Partial<OfficeFile>) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | DocumentType>('all');

  if (!isOpen) return null;

  const templates = [
    {
      id: 'tpl-writer-cv',
      type: 'writer' as DocumentType,
      extension: '.docx' as const,
      title: 'Curriculum Vitae Moderne',
      desc: 'Mise en page soignée, sections compétences, expériences et formation.',
      icon: FileText,
      color: 'bg-blue-600',
      content: {
        html: `
          <h1 style="color: #2563eb; margin-bottom: 4px;">JEAN DUPONT</h1>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">Développeur Full-Stack & Passionné d'Open-Source • Paris, France • jean.dupont@email.com</p>
          <hr style="border-top: 1px solid #cbd5e1; margin-bottom: 16px;"/>
          
          <h2 style="color: #1e293b; font-size: 18px;">PROFIL PROFESSIONNEL</h2>
          <p>Ingénieur logiciel avec 6 années d'expérience dans la conception d'applications mobiles et cloud souveraines. Spécialiste React, TypeScript, Kotlin et architectures légères.</p>

          <h2 style="color: #1e293b; font-size: 18px; margin-top: 16px;">EXPÉRIENCES CLÉS</h2>
          <p><strong>Lead Developer Mobile</strong> — OpenLabs (2022 - Présent)</p>
          <ul>
            <li>Développement d'une suite bureautique hors-ligne utilisée par 100k+ usagers.</li>
            <li>Optimisation des performances : réduction de 45% de la mémoire vive.</li>
          </ul>

          <h2 style="color: #1e293b; font-size: 18px; margin-top: 16px;">COMPÉTENCES</h2>
          <p>TypeScript, Kotlin, Python, Android SDK, Sécurité & Chiffrement, CI/CD, Git.</p>
        `,
        wordCount: 110,
        readingTime: 1,
      },
    },
    {
      id: 'tpl-writer-lettre',
      type: 'writer' as DocumentType,
      extension: '.docx' as const,
      title: 'Lettre de Motivation Professionnelle',
      desc: 'Structure formelle classique pour candidatures et partenariats.',
      icon: FileText,
      color: 'bg-blue-600',
      content: {
        html: `
          <p style="text-align: right; color: #64748b;">Le 1er Octobre 2026, Paris</p>
          <p><strong>Jean Dupont</strong><br/>75011 Paris<br/>jean.dupont@email.com</p>
          <p style="margin-top: 16px;"><strong>À l'attention du Directeur des Ressources Humaines</strong><br/>Société Tech Innovante</p>
          
          <p style="margin-top: 20px;"><strong>Objet : Candidature au poste de Responsable Logiciel Open Source</strong></p>
          <p>Madame, Monsieur,</p>
          <p>C'est avec un vif enthousiasme que je vous adresse ma candidature pour rejoindre vos équipes en tant que Responsable Logiciel...</p>
          <p>Fort de plusieurs années de contributions actives à des projets communautaires libres, j'ai développé une solide expertise dans l'optimisation des flux de travail.</p>
          <p>Je serais ravi de vous rencontrer afin de vous exposer mes motivations de vive voix.</p>
          <p style="margin-top: 24px;">Cordialement,<br/><strong>Jean Dupont</strong></p>
        `,
        wordCount: 130,
        readingTime: 1,
      },
    },
    {
      id: 'tpl-calc-budget',
      type: 'calc' as DocumentType,
      extension: '.xlsx' as const,
      title: 'Budget Familial Mensuel',
      desc: 'Suivi des revenus, loyer, courses, épargne et calcul automatique du reste à vivre.',
      icon: Table2,
      color: 'bg-emerald-600',
      content: {
        sheets: [
          {
            id: 'sh-1',
            name: 'Budget Mensuel',
            rowCount: 20,
            colCount: 8,
            frozenRows: 1,
            frozenCols: 1,
            data: {
              A1: { value: 'Catégorie', bold: true, bg: '#065f46', color: '#ffffff' },
              B1: { value: 'Prévu (€)', bold: true, bg: '#065f46', color: '#ffffff', align: 'right' },
              C1: { value: 'Réel (€)', bold: true, bg: '#065f46', color: '#ffffff', align: 'right' },
              D1: { value: 'Écart', bold: true, bg: '#065f46', color: '#ffffff', align: 'right' },
              A2: { value: 'Salaire 1' }, B2: { value: '2500', format: 'currency' }, C2: { value: '2500', format: 'currency' }, D2: { value: '=C2-B2', format: 'currency' },
              A3: { value: 'Salaire 2' }, B3: { value: '2200', format: 'currency' }, C3: { value: '2200', format: 'currency' }, D3: { value: '=C3-B3', format: 'currency' },
              A4: { value: 'Loyer / Crédit' }, B4: { value: '1100', format: 'currency' }, C4: { value: '1100', format: 'currency' }, D4: { value: '=C4-B4', format: 'currency' },
              A5: { value: 'Alimentation & Courses' }, B5: { value: '650', format: 'currency' }, C5: { value: '610', format: 'currency' }, D5: { value: '=C5-B5', format: 'currency' },
              A6: { value: 'Énergie & Télécoms' }, B6: { value: '180', format: 'currency' }, C6: { value: '175', format: 'currency' }, D6: { value: '=C6-B6', format: 'currency' },
              A7: { value: 'TOTAL REVENUS' }, B7: { value: '=SUM(B2:B3)', format: 'currency', bold: true }, C7: { value: '=SUM(C2:C3)', format: 'currency', bold: true }, D7: { value: '=C7-B7', format: 'currency' },
              A8: { value: 'TOTAL DÉPENSES' }, B8: { value: '=SUM(B4:B6)', format: 'currency', bold: true }, C8: { value: '=SUM(C4:C6)', format: 'currency', bold: true }, D8: { value: '=C8-B8', format: 'currency' },
              A9: { value: 'ÉPARGNE / RESTE', bold: true, bg: '#047857', color: '#ffffff' },
              B9: { value: '=B7-B8', format: 'currency', bold: true, bg: '#047857', color: '#ffffff' },
              C9: { value: '=C7-C8', format: 'currency', bold: true, bg: '#047857', color: '#ffffff' },
              D9: { value: '=C9-B9', format: 'currency', bold: true, bg: '#047857', color: '#ffffff' },
            },
          },
        ],
      },
    },
    {
      id: 'tpl-calc-facture',
      type: 'calc' as DocumentType,
      extension: '.xlsx' as const,
      title: 'Facturier / Devis Automatisé',
      desc: 'Tableau professionnel avec taux de TVA 20% et total TTC instantané.',
      icon: Table2,
      color: 'bg-emerald-600',
      content: {
        sheets: [
          {
            id: 'sh-fac',
            name: 'Facture N° 2026-001',
            rowCount: 20,
            colCount: 6,
            frozenRows: 1,
            frozenCols: 0,
            data: {
              A1: { value: 'Désignation prestation', bold: true, bg: '#1e3a8a', color: '#fff' },
              B1: { value: 'Qté', bold: true, bg: '#1e3a8a', color: '#fff', align: 'right' },
              C1: { value: 'Prix Unitaire HT', bold: true, bg: '#1e3a8a', color: '#fff', align: 'right' },
              D1: { value: 'Total HT (€)', bold: true, bg: '#1e3a8a', color: '#fff', align: 'right' },
              A2: { value: 'Audit d architecture logicielle' }, B2: { value: '2' }, C2: { value: '800', format: 'currency' }, D2: { value: '=B2*C2', format: 'currency' },
              A3: { value: 'Développement de fonctionnalités' }, B3: { value: '5' }, C3: { value: '650', format: 'currency' }, D3: { value: '=B3*C3', format: 'currency' },
              A4: { value: 'Formation des équipes' }, B4: { value: '1' }, C4: { value: '950', format: 'currency' }, D4: { value: '=B4*C4', format: 'currency' },
              A6: { value: 'SOUS-TOTAL HT', bold: true }, D6: { value: '=SUM(D2:D4)', format: 'currency', bold: true },
              A7: { value: 'TVA (20%)' }, D7: { value: '=D6*0.2', format: 'currency' },
              A8: { value: 'TOTAL NET TTC (€)', bold: true, bg: '#1e40af', color: '#fff' }, D8: { value: '=D6+D7', format: 'currency', bold: true, bg: '#1e40af', color: '#fff' },
            },
          },
        ],
      },
    },
    {
      id: 'tpl-impress-pitch',
      type: 'impress' as DocumentType,
      extension: '.pptx' as const,
      title: 'Pitch Deck Startup & Innovation',
      desc: 'Structure en 4 diapositives : Problème, Solution, Métriques et Équipe.',
      icon: Presentation,
      color: 'bg-amber-600',
      content: {
        slides: [
          {
            id: 's-1',
            title: 'Votre Projet Révolutionnaire',
            subtitle: 'La solution qui transforme le marché',
            background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
            transition: 'fade',
            notes: 'Présentation claire en 5 minutes chrono.',
            elements: [
              { id: 'b1', type: 'badge', content: '🌟 Startup Pitch 2026', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.2)' }
            ]
          },
          {
            id: 's-2',
            title: 'Le Problème',
            subtitle: 'Pourquoi les solutions actuelles échouent',
            background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
            transition: 'slide',
            notes: 'Évoquer la dépendance aux GAFAM et le coût élevé.',
            elements: [
              { id: 't1', type: 'text', content: '• Perte de souveraineté sur les documents confidentiels\n• Abonnements mensuels prohibitifs\n• Manque de mode hors-ligne fiable', color: '#fecaca', fontSize: 16 }
            ]
          },
          {
            id: 's-3',
            title: 'Notre Solution',
            subtitle: 'StarOffice Mobile Suite',
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
            transition: 'zoom',
            notes: 'Mettre l accent sur la gratuité open source et le format local.',
            elements: [
              { id: 'm1', type: 'metric', content: '100% Libre', subtitle: 'Aucun frais caché ni abonnement', color: '#6ee7b7' }
            ]
          }
        ]
      }
    },
    {
      id: 'tpl-pdf-contrat',
      type: 'pdf' as DocumentType,
      extension: '.pdf' as const,
      title: 'Contrat de Confidentialité & NDA',
      desc: 'Formulaire prêt pour signature tactile et apposition de tampons.',
      icon: FileCheck,
      color: 'bg-rose-600',
      content: {
        title: 'Accord de Non-Divulgation et Confidentialité (NDA)',
        docReference: 'NDA-2026-CONFID',
        totalPages: 2,
        signeeName: '',
        status: 'À signer',
        formFields: {
          company: '',
          agreeTerms: false,
        },
        annotations: [
          {
            id: 'ann-tpl-1',
            type: 'stamp',
            page: 1,
            x: 240,
            y: 50,
            text: 'STRICTEMENT CONFIDENTIEL',
            color: '#ef4444'
          }
        ]
      }
    }
  ];

  const filtered = selectedFilter === 'all' 
    ? templates 
    : templates.filter((t) => t.type === selectedFilter);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col p-4 select-none animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Galerie de Modèles StarOffice</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 py-3 overflow-x-auto text-xs">
        {[
          { id: 'all', label: 'Tous' },
          { id: 'writer', label: 'Documents' },
          { id: 'calc', label: 'Tableurs' },
          { id: 'impress', label: 'Présentations' },
          { id: 'pdf', label: 'PDF & Formulaires' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              selectedFilter === f.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filtered.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate({
                  name: `${tpl.title.replace(/\s+/g, '_')}${tpl.extension}`,
                  type: tpl.type,
                  extension: tpl.extension,
                  size: 32000,
                  folder: 'documents',
                  tags: ['Modèle'],
                  content: tpl.content,
                });
                onClose();
              }}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-3.5 rounded-xl cursor-pointer hover:bg-slate-850 active:scale-[0.99] transition-all group flex items-start gap-3 shadow-md"
            >
              <div className={`w-10 h-10 rounded-lg ${tpl.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                    {tpl.title}
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {tpl.extension}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tpl.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0 self-center transition-colors" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
