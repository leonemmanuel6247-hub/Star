import React, { useState, useEffect } from 'react';
import katex from 'katex';
import { X, Check, HelpCircle, Code, FunctionSquare } from 'lucide-react';

interface LatexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLatex: (html: string, rawLatex: string) => void;
}

export const LatexModal: React.FC<LatexModalProps> = ({ isOpen, onClose, onInsertLatex }) => {
  const [latexInput, setLatexInput] = useState<string>('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<boolean>(true);

  // Quick mathematical equation templates (Office style)
  const equationPresets = [
    { label: 'Quadratique', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { label: 'Intégrale', latex: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)' },
    { label: 'Somme finie', latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
    { label: 'Pythagore', latex: 'a^2 + b^2 = c^2' },
    { label: 'Limite', latex: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1' },
    { label: 'Matrice 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Euler', latex: 'e^{i\\pi} + 1 = 0' },
    { label: 'Dérivée partielle', latex: '\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h, y) - f(x, y)}{h}' },
    { label: 'Physique Newton', latex: '\\vec{F} = m \\cdot \\vec{a}' },
    { label: 'Gaussienne', latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}' },
  ];

  const mathSymbols = [
    { label: 'α', val: '\\alpha ' },
    { label: 'β', val: '\\beta ' },
    { label: 'γ', val: '\\gamma ' },
    { label: 'θ', val: '\\theta ' },
    { label: 'λ', val: '\\lambda ' },
    { label: 'π', val: '\\pi ' },
    { label: 'σ', val: '\\sigma ' },
    { label: 'ω', val: '\\omega ' },
    { label: '∞', val: '\\infty ' },
    { label: '±', val: '\\pm ' },
    { label: '×', val: '\\times ' },
    { label: '÷', val: '\\div ' },
    { label: '≠', val: '\\neq ' },
    { label: '≤', val: '\\leq ' },
    { label: '≥', val: '\\geq ' },
    { label: '√x', val: '\\sqrt{x} ' },
    { label: 'x/y', val: '\\frac{x}{y} ' },
    { label: 'xⁿ', val: 'x^{n} ' },
    { label: 'xₙ', val: 'x_{n} ' },
    { label: '∫', val: '\\int ' },
    { label: '∑', val: '\\sum ' },
    { label: '∂', val: '\\partial ' },
    { label: '∇', val: '\\nabla ' },
    { label: '∈', val: '\\in ' },
  ];

  useEffect(() => {
    try {
      const html = katex.renderToString(latexInput || ' ', {
        displayMode: displayMode,
        throwOnError: true,
      });
      setRenderedHtml(html);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de syntaxe LaTeX');
    }
  }, [latexInput, displayMode]);

  if (!isOpen) return null;

  const handleInsert = () => {
    if (errorMsg) return;
    try {
      const compiled = katex.renderToString(latexInput, {
        displayMode: displayMode,
        throwOnError: false,
      });
      // Wrap in a styled math container for contentEditable
      const containerHtml = `<span class="staroffice-math-formula" contenteditable="false" style="display: ${displayMode ? 'block' : 'inline-block'}; margin: ${displayMode ? '16px 0' : '0 4px'}; text-align: center; user-select: all; padding: 4px 8px; background: rgba(37,99,235,0.04); border-radius: 4px; border: 1px dashed rgba(37,99,235,0.2);" data-latex="${encodeURIComponent(latexInput)}">${compiled}</span>&nbsp;`;
      onInsertLatex(containerHtml, latexInput);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const insertSymbol = (val: string) => {
    setLatexInput((prev) => prev + val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FunctionSquare className="w-4 h-4 text-blue-400" />
            <span>Éditeur d'Équation Scientifique LaTeX (Microsoft Word)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-200">
          {/* Quick symbol palette */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Symboles Mathématiques Rapides
            </div>
            <div className="flex flex-wrap gap-1 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80">
              {mathSymbols.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => insertSymbol(s.val)}
                  className="px-2 py-1 bg-slate-700/60 hover:bg-blue-600 hover:text-white text-slate-200 rounded-md font-serif text-xs transition-colors"
                  title={s.val}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Formulas */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Formules Prédéfinies
            </div>
            <div className="flex flex-wrap gap-1.5">
              {equationPresets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setLatexInput(p.latex)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-[11px] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* LaTeX Input Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                <span>Code source LaTeX :</span>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayMode}
                  onChange={(e) => setDisplayMode(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Mode bloc centré (Display mode)</span>
              </label>
            </div>
            <textarea
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              rows={3}
              placeholder="Exemple: \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              className="w-full bg-slate-950 font-mono text-xs text-blue-300 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed shadow-inner"
            />
          </div>

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Aperçu Typographique Haute Définition :
            </div>
            <div className="p-4 sm:p-6 bg-white text-slate-900 rounded-xl min-h-[90px] flex items-center justify-center border border-slate-300 shadow-md overflow-x-auto">
              {errorMsg ? (
                <div className="text-red-500 font-mono text-xs flex items-center gap-1.5">
                  <span>Syntaxe invalide : {errorMsg}</span>
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  className="text-base sm:text-lg select-text"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-850 border-t border-slate-700/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Moteur LaTeX KaTeX certifié</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleInsert}
              disabled={!!errorMsg}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insérer l'équation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
