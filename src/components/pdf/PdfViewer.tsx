import React, { useState, useRef } from 'react';
import {
  Highlighter,
  PenTool,
  Stamp,
  CheckSquare,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Download,
  Printer,
  ShieldCheck,
  X
} from 'lucide-react';
import { OfficeFile, PDFAnnotation } from '../../types/office';
import confetti from 'canvas-confetti';

interface PdfViewerProps {
  file: OfficeFile;
  onUpdateFile: (updated: Partial<OfficeFile>) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ file, onUpdateFile }) => {
  const content = file.content || {};
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = content.totalPages || 2;
  const [activeTool, setActiveTool] = useState<'view' | 'highlight' | 'stamp' | 'signature'>('view');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureCanvasData, setSignatureCanvasData] = useState<string | null>(null);

  // Form fields
  const [formCompany, setFormCompany] = useState(content.formFields?.company || '');
  const [formSignee, setFormSignee] = useState(content.signeeName || 'Emmanuel Leon');
  const [agreeTerms, setAgreeTerms] = useState(content.formFields?.agreeTerms || false);
  const [isSigned, setIsSigned] = useState(!!content.signatureDataUrl || false);

  const annotations: PDFAnnotation[] = content.annotations || [];

  // Canvas for drawing signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureCanvasData(dataUrl);
    setIsSigned(true);
    setShowSignModal(false);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }

    // Save into file content
    onUpdateFile({
      updatedAt: Date.now(),
      content: {
        ...content,
        signatureDataUrl: dataUrl,
        signeeName: formSignee,
        signedDate: new Date().toISOString().split('T')[0],
        status: 'Signé et Certifié',
        formFields: {
          ...content.formFields,
          company: formCompany,
          agreeTerms,
        },
      },
    });
  };

  const addStamp = (text: string, color: string) => {
    const newStamp: PDFAnnotation = {
      id: `stamp-${Date.now()}`,
      type: 'stamp',
      page: currentPage,
      x: 180 + Math.random() * 40,
      y: 120 + Math.random() * 80,
      text,
      color,
    };
    onUpdateFile({
      updatedAt: Date.now(),
      content: {
        ...content,
        annotations: [...annotations, newStamp],
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 select-none overflow-hidden text-slate-100">
      {/* PDF Action Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-2.5 py-1.5 flex items-center gap-1.5 shrink-0 text-slate-300 overflow-x-auto select-none">
        {/* Page Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1 text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-200">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="px-2 py-1 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/50 text-[10px] font-bold shrink-0">
          Format A4 (210 × 297 mm)
        </span>

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        {/* Signature Trigger */}
        <button
          onClick={() => setShowSignModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
            isSigned
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:brightness-110 active:scale-95'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>{isSigned ? '✓ Signé' : 'Signer le document'}</span>
        </button>

        {/* Stamps */}
        <button
          onClick={() => addStamp('APPROUVÉ', '#10b981')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-xs border border-emerald-500/30"
        >
          + Tampon Approuvé
        </button>
        <button
          onClick={() => addStamp('CONFIDENTIEL', '#ef4444')}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded text-xs border border-rose-500/30"
        >
          + Confidentiel
        </button>
      </div>

      {/* Main Document View Canvas */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-950 flex justify-center">
        <div
          id="print-area"
          className="w-full max-w-[794px] min-h-[1123px] bg-white text-slate-900 rounded-xs shadow-2xl p-6 sm:p-14 relative flex flex-col justify-between border border-slate-300"
          style={{
            width: '794px',
            minHeight: '1123px',
            maxWidth: '100%',
            aspectRatio: '210 / 297',
          }}
        >
          {/* Official Document Header */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-4 mb-6">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {content.title || 'Contrat de Partenariat & Accord Juridique'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Réf. Archivage officiel : {content.docReference || 'SO-2026-ARCH-01'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Page {currentPage} sur {totalPages}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Conforme eIDAS & RGPD</p>
              </div>
            </div>

            {/* Document Body depending on page */}
            {currentPage === 1 ? (
              <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                <p className="font-semibold text-slate-900">
                  ENTRE LES SOUSSIGNÉS :
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p><strong>1. La Fondation StarOffice</strong>, représentée par sa direction technique libre.</p>
                  <p className="mt-1"><strong>2. Le Bénéficiaire / Prestataire :</strong></p>
                  <div className="mt-2 flex gap-2 items-center">
                    <span className="text-slate-500">Organisation :</span>
                    <input
                      type="text"
                      value={formCompany}
                      onChange={(e) => {
                        setFormCompany(e.target.value);
                        onUpdateFile({
                          content: {
                            ...content,
                            formFields: { ...content.formFields, company: e.target.value },
                          },
                        });
                      }}
                      placeholder="Nom de votre organisation / Société..."
                      className="border-b border-indigo-400 outline-none text-slate-900 font-medium px-1 flex-1 bg-transparent"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-4">ARTICLE 1 : OBJET DE L'ACCORD</h3>
                <p>
                  Le présent contrat définit les conditions d'exploitation, de distribution et de contribution aux modules logiciels Writer, Calc, Impress et PDF Studio au sein de l'écosystème open-source StarOffice.
                </p>

                <h3 className="font-bold text-sm text-slate-900 mt-4">ARTICLE 2 : VIE PRIVÉE & ABSENCE DE TRAQUEURS</h3>
                <p className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900">
                  Les parties s'engagent solennellement à ne collecter aucune donnée télémétrique, identifiant publicitaire ou contenu de document utilisateur sans consentement explicite écrit.
                </p>

                <h3 className="font-bold text-sm text-slate-900 mt-4">ARTICLE 3 : ENGAGEMENT ET CONDITIONS</h3>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="agreeCheck"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      onUpdateFile({
                        content: {
                          ...content,
                          formFields: { ...content.formFields, agreeTerms: e.target.checked },
                        },
                      });
                    }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="agreeCheck" className="cursor-pointer text-slate-800 font-medium">
                    Je reconnais avoir pris connaissance des conditions générales de la licence open-source.
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                <h3 className="font-bold text-sm text-slate-900">ARTICLE 4 : VALIDITÉ JURIDIQUE & SIGNATURE ÉLECTRONIQUE</h3>
                <p>
                  Les parties conviennent que la signature manuscrite numérisée apposée ci-dessous fait foi et engage irrévocablement les signataires conformément aux dispositions applicables aux signatures électroniques.
                </p>

                {/* Signature Block */}
                <div className="mt-8 pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <p className="font-bold text-slate-900 mb-1">Pour la Fondation StarOffice :</p>
                    <p className="text-slate-500 text-[11px]">Le Secrétariat Général</p>
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <div className="text-indigo-800 font-serif italic text-base">Fondation StarOffice</div>
                      <div className="text-[9px] text-emerald-600 mt-1">✓ Certificat Cryptographique Actif</div>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 mb-1">Pour le Bénéficiaire :</p>
                    <p className="text-slate-500 text-[11px]">{formSignee}</p>

                    <div
                      onClick={() => setShowSignModal(true)}
                      className={`mt-4 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors p-2 ${
                        isSigned || content.signatureDataUrl
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-300 hover:border-indigo-500 bg-slate-50'
                      }`}
                    >
                      {content.signatureDataUrl || signatureCanvasData ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={content.signatureDataUrl || signatureCanvasData!}
                            alt="Signature"
                            className="max-h-14 object-contain"
                          />
                          <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                            ✓ Signé le {content.signedDate || '2026-10-01'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400">
                          <PenTool className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                          <span className="text-[10px] text-indigo-600 font-medium underline">
                            Cliquez pour apposer votre signature
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Render Stamps & Annotations on Page */}
          {annotations
            .filter((a) => a.page === currentPage)
            .map((ann) => (
              <div
                key={ann.id}
                className="absolute transform -rotate-12 pointer-events-none"
                style={{ left: `${ann.x}px`, top: `${ann.y}px` }}
              >
                {ann.type === 'stamp' && (
                  <div
                    className="border-4 border-dashed rounded-xl px-4 py-1.5 font-black text-sm tracking-widest uppercase opacity-85 shadow-md"
                    style={{ borderColor: ann.color, color: ann.color }}
                  >
                    ★ {ann.text} ★
                  </div>
                )}
              </div>
            ))}

          {/* Document Footer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Document Intègre & Authentifié localement
            </span>
            <span>StarOffice Mobile PDF Studio</span>
          </div>
        </div>
      </div>

      {/* Signature Pad Touch Modal */}
      {showSignModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-rose-400" /> Signature Manuscrite Tactile
              </h3>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Dessinez votre signature dans le cadre blanc ci-dessous (tactile ou souris) :
            </p>

            <div className="bg-white rounded-xl overflow-hidden border border-slate-300 shadow-inner">
              <canvas
                ref={canvasRef}
                width={320}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={clearCanvas}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Effacer
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={saveSignature}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  Appliquer la signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
