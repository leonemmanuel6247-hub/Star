import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  Check,
  RefreshCw,
  BarChart2,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export interface EditorIssue {
  id: string;
  type: 'orthographe' | 'grammaire' | 'style';
  word: string;
  suggestion: string;
  context: string;
  explanation: string;
}

interface EditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentText: string;
  onApplyFix: (original: string, replacement: string) => void;
  stats: {
    words: number;
    chars: number;
    charsNoSpaces: number;
    paragraphs: number;
    lines: number;
    readingTime: number;
  };
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  isOpen,
  onClose,
  documentText,
  onApplyFix,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'stats'>('editor');
  const [ignoredIds, setIgnoredIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // Real scan of frequent French grammar and spelling mistakes
  const commonFrenchMistakes: Array<{
    regex: RegExp;
    suggestion: string;
    type: 'orthographe' | 'grammaire' | 'style';
    explanation: string;
  }> = [
    {
      regex: /\b(a\s+été\s+fait|a\s+ete\s+fait)\b/gi,
      suggestion: 'a été fait',
      type: 'orthographe',
      explanation: 'Accent grave manquant sur la préposition "à" ou participe "été".',
    },
    {
      regex: /\b(acceuil)\b/gi,
      suggestion: 'accueil',
      type: 'orthographe',
      explanation: 'Inversion de lettres fréquente : "ue" après le c dur.',
    },
    {
      regex: /\b(malgrès)\b/gi,
      suggestion: 'malgré',
      type: 'orthographe',
      explanation: 'La préposition "malgré" ne prend jamais de "s".',
    },
    {
      regex: /\b(parmis)\b/gi,
      suggestion: 'parmi',
      type: 'orthographe',
      explanation: 'La préposition "parmi" ne prend jamais de "s".',
    },
    {
      regex: /\b(cauchemard)\b/gi,
      suggestion: 'cauchemar',
      type: 'orthographe',
      explanation: 'Cauchemar se termine par un "r", sans "d".',
    },
    {
      regex: /\b(connexion|connexions)\b/gi,
      suggestion: 'connexion',
      type: 'orthographe',
      explanation: 'En français standard, on écrit "connexion" avec un x.',
    },
    {
      regex: /\b(apres)\b/gi,
      suggestion: 'après',
      type: 'orthographe',
      explanation: 'Accent grave manquant sur "après".',
    },
    {
      regex: /\b(developpe|developpent|developpement)\b/gi,
      suggestion: 'développé',
      type: 'orthographe',
      explanation: 'Accent aigu manquant sur "développement".',
    },
    {
      regex: /\b(tout\s+les)\b/gi,
      suggestion: 'tous les',
      type: 'grammaire',
      explanation: 'Accord au pluriel : "tous" devant un nom pluriel.',
    },
    {
      regex: /\b(des\s+document)\b/gi,
      suggestion: 'des documents',
      type: 'grammaire',
      explanation: 'Accord au pluriel manquant pour le substantif.',
    },
    {
      regex: /\b(tres)\b/gi,
      suggestion: 'très',
      type: 'orthographe',
      explanation: 'Accent grave manquant sur l\'adverbe "très".',
    },
    {
      regex: /\b(differents|differente)\b/gi,
      suggestion: 'différents',
      type: 'orthographe',
      explanation: 'Accent aigu manquant sur "différent".',
    },
  ];

  const detectedIssues: EditorIssue[] = [];
  commonFrenchMistakes.forEach((rule, idx) => {
    const matches = documentText.match(rule.regex);
    if (matches && matches.length > 0) {
      matches.forEach((m, matchIdx) => {
        const id = `issue-${idx}-${matchIdx}`;
        if (!ignoredIds.includes(id)) {
          detectedIssues.push({
            id,
            type: rule.type,
            word: m,
            suggestion: rule.suggestion,
            context: `...${m}...`,
            explanation: rule.explanation,
          });
        }
      });
    }
  });

  const handleFix = (issue: EditorIssue) => {
    onApplyFix(issue.word, issue.suggestion);
    setIgnoredIds([...ignoredIds, issue.id]);
  };

  const handleIgnore = (issueId: string) => {
    setIgnoredIds([...ignoredIds, issueId]);
  };

  return (
    <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-750 flex flex-col h-full shadow-2xl z-20 text-slate-100 select-none animate-in slide-in-from-right-4 duration-150 shrink-0">
      {/* Top Header */}
      <header className="h-12 bg-[#2b579a] text-white px-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-200" />
          <h3 className="font-bold text-sm">Volet Éditeur Word (F7)</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-md text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Navigation tabs */}
      <div className="h-10 bg-slate-850 border-b border-slate-750 px-3 flex items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'editor' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Corrections ({detectedIssues.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'stats' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Statistiques</span>
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'editor' ? (
          <div className="space-y-4">
            {/* Score card */}
            <div className="bg-gradient-to-r from-blue-950/60 to-slate-850 border border-blue-800/40 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-blue-200 uppercase font-bold tracking-wider">
                  Score de rédaction
                </div>
                <div className="text-2xl font-black text-white mt-0.5">
                  {detectedIssues.length === 0 ? '100%' : `${Math.max(75, 100 - detectedIssues.length * 5)}%`}
                </div>
                <div className="text-[10px] text-slate-400">
                  {detectedIssues.length === 0 ? 'Document irréprochable' : `${detectedIssues.length} suggestion(s) à examiner`}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                detectedIssues.length === 0
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {detectedIssues.length === 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
            </div>

            {/* List of issues */}
            {detectedIssues.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="font-semibold text-white">Vérification orthographique terminée</div>
                <p className="text-slate-400 text-[11px] max-w-xs mx-auto">
                  Aucune faute d'orthographe ou d'accord majeure détectée dans le document.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Propositions de correction
                </div>
                {detectedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-slate-850 border border-slate-750 hover:border-slate-650 rounded-xl p-3.5 space-y-2 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        issue.type === 'orthographe' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                      }`}>
                        {issue.type}
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        "{issue.word}"
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      {issue.explanation}
                    </p>

                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Remplacer par :</span>
                        <strong className="text-emerald-400 text-xs">{issue.suggestion}</strong>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleIgnore(issue.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-[11px] transition-colors"
                      >
                        Ignorer
                      </button>
                      <button
                        onClick={() => handleFix(issue)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Corriger</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: DETAILED STATS (Partie I.8 & Partie VII) */
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm">Statistiques de document Word</h4>
            <div className="bg-slate-850 border border-slate-750 rounded-xl divide-y divide-slate-750">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Pages :</span>
                <span className="font-bold text-white">1</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Mots :</span>
                <span className="font-bold text-blue-400 text-sm">{stats.words}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Caractères (sans espaces) :</span>
                <span className="font-bold text-white">{stats.charsNoSpaces}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Caractères (avec espaces) :</span>
                <span className="font-bold text-white">{stats.chars}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Paragraphes :</span>
                <span className="font-bold text-white">{stats.paragraphs}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Lignes :</span>
                <span className="font-bold text-white">{stats.lines}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-400">Temps de lecture estimé :</span>
                <span className="font-bold text-emerald-400">~{stats.readingTime} min</span>
              </div>
            </div>

            <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-200">
              Langue active du dictionnaire : <strong>Français (France)</strong>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
