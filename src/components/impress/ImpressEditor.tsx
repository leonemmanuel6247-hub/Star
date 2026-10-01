import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Palette,
  Type,
  Square,
  Sparkles,
  FileText,
  Clock,
  Radio,
  X,
  Save,
  RotateCcw,
  RotateCw,
  Presentation,
  Sliders,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { OfficeFile, Slide, SlideElement } from '../../types/office';
import { OfficeBackstageModal } from '../office/OfficeBackstageModal';

interface ImpressEditorProps {
  file: OfficeFile;
  onUpdateFile: (updated: Partial<OfficeFile>) => void;
}

type PowerPointTab = 'home' | 'insert' | 'design' | 'transitions' | 'slideshow' | 'view';

export const ImpressEditor: React.FC<ImpressEditorProps> = ({ file, onUpdateFile }) => {
  const slides: Slide[] = file.content?.slides || [
    {
      id: 's-1',
      title: 'Titre de la Diapositive',
      subtitle: 'Sous-titre de présentation',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      transition: 'fade',
      notes: 'Notes pour le présentateur',
      elements: [],
    },
  ];

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<PowerPointTab>('home');
  const [isBackstageOpen, setIsBackstageOpen] = useState(false);
  const [isFullscreenShow, setIsFullscreenShow] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [laserActive, setLaserActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: 50, y: 50 });
  const [presentationSeconds, setPresentationSeconds] = useState(0);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // Presentation timer
  useEffect(() => {
    let interval: any;
    if (isFullscreenShow) {
      interval = setInterval(() => {
        setPresentationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setPresentationSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isFullscreenShow]);

  const updateCurrentSlide = (partial: Partial<Slide>) => {
    const updated = slides.map((s, idx) => (idx === activeSlideIndex ? { ...s, ...partial } : s));
    onUpdateFile({
      updatedAt: Date.now(),
      content: { ...file.content, slides: updated },
    });
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `s-${Date.now()}`,
      title: `Diapositive ${slides.length + 1}`,
      subtitle: 'Nouveau point clé ou section',
      background: currentSlide.background || 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      transition: 'fade',
      notes: '',
      elements: [],
    };
    const updated = [...slides, newSlide];
    onUpdateFile({
      updatedAt: Date.now(),
      content: { ...file.content, slides: updated },
    });
    setActiveSlideIndex(updated.length - 1);
  };

  const handleDuplicateSlide = (index: number) => {
    const target = slides[index];
    const copy: Slide = {
      ...target,
      id: `s-${Date.now()}`,
      title: `${target.title} (Copie)`,
    };
    const updated = [...slides.slice(0, index + 1), copy, ...slides.slice(index + 1)];
    onUpdateFile({
      updatedAt: Date.now(),
      content: { ...file.content, slides: updated },
    });
    setActiveSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== index);
    onUpdateFile({
      updatedAt: Date.now(),
      content: { ...file.content, slides: updated },
    });
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const addElementToSlide = (type: 'badge' | 'metric' | 'text') => {
    let newEl: SlideElement;
    if (type === 'badge') {
      newEl = {
        id: `el-${Date.now()}`,
        type: 'badge',
        content: 'Point Clé',
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.15)',
        fontSize: 14,
        align: 'center',
      };
    } else if (type === 'metric') {
      newEl = {
        id: `el-${Date.now()}`,
        type: 'metric',
        content: '98%',
        subtitle: 'Indicateur de performance',
        color: '#34d399',
        fontSize: 28,
        align: 'center',
      };
    } else {
      newEl = {
        id: `el-${Date.now()}`,
        type: 'text',
        content: 'Texte ou paragraphe explicatif.',
        color: '#e2e8f0',
        fontSize: 15,
      };
    }

    const updatedElements = [...(currentSlide.elements || []), newEl];
    updateCurrentSlide({ elements: updatedElements });
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 select-none overflow-hidden text-slate-100">
      {/* 1. Microsoft PowerPoint Title Bar (Red/Orange #c43e1c) */}
      <div className="bg-[#c43e1c] text-white px-3 py-1.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          {/* File Tab opens Backstage */}
          <button
            onClick={() => setIsBackstageOpen(true)}
            className="px-3 py-1 bg-[#982f14] hover:bg-[#7b240e] rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Fichier
          </button>

          {/* Quick Access Toolbar */}
          <div className="flex items-center gap-1 border-l border-white/20 pl-2">
            <button
              onClick={() => onUpdateFile({ updatedAt: Date.now() })}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Enregistrer (Ctrl+S)"
            >
              <Save className="w-4 h-4 text-white" />
            </button>
            <button
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Annuler (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Rétablir (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* Center Title Display */}
        <div className="text-xs font-semibold text-white/90 truncate max-w-xs flex items-center gap-1.5">
          <Presentation className="w-3.5 h-3.5 text-amber-200" />
          <span className="truncate">{file.name}</span>
          <span className="text-[10px] text-amber-200 bg-white/15 px-1.5 py-0.5 rounded font-mono">PowerPoint</span>
        </div>

        {/* Right Slideshow button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFullscreenShow(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-black/25 hover:bg-black/35 rounded text-xs text-white font-semibold transition-colors"
            title="Lancer le diaporama plein écran"
          >
            <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span className="hidden sm:inline">Diaporama</span>
          </button>
        </div>
      </div>

      {/* 2. Microsoft PowerPoint Ribbon Tabs */}
      <div className="bg-slate-850 border-b border-slate-750 px-2 flex items-center overflow-x-auto shrink-0 select-none">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'home'
              ? 'border-amber-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Accueil
        </button>

        <button
          onClick={() => setActiveTab('insert')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'insert'
              ? 'border-amber-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Insertion
        </button>

        <button
          onClick={() => setActiveTab('design')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'design'
              ? 'border-amber-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Création
        </button>

        <button
          onClick={() => setActiveTab('transitions')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'transitions'
              ? 'border-amber-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Transitions
        </button>

        <button
          onClick={() => setActiveTab('slideshow')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'slideshow'
              ? 'border-amber-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Diaporama
        </button>

        <button
          onClick={() => setActiveTab('view')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'view'
              ? 'border-amber-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Affichage
        </button>
      </div>

      {/* 3. PowerPoint Ribbon Command Bar */}
      <div className="bg-slate-850 border-b border-slate-700/80 px-3 py-1.5 flex items-center gap-2 overflow-x-auto shrink-0 text-slate-200 min-h-[50px]">
        {/* TAB 1: ACCUEIL */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddSlide}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle diapositive</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            <select
              value={(currentSlide as any).fontFamily || 'Plus Jakarta Sans'}
              onChange={(e) => updateCurrentSlide({ ...currentSlide, ...( { fontFamily: e.target.value } as any) })}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1 outline-none max-w-[120px] truncate"
              title="Police"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta</option>
              <option value="Poppins">Poppins</option>
              <option value="Roboto">Roboto</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
        )}

        {/* TAB 2: INSERTION */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => addElementToSlide('badge')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs border border-slate-700"
            >
              + Badge
            </button>
            <button
              onClick={() => addElementToSlide('metric')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs border border-slate-700"
            >
              + Chiffre clé
            </button>
            <button
              onClick={() => addElementToSlide('text')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700"
            >
              + Zone de texte
            </button>
          </div>
        )}

        {/* TAB 3: CRÉATION */}
        {activeTab === 'design' && (
          <div className="flex items-center gap-2">
            {[
              { name: 'Bleu Nuit', bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' },
              { name: 'Indigo Pro', bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
              { name: 'Émeraude', bg: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' },
              { name: 'Pourpre', bg: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)' },
              { name: 'Sombre Épuré', bg: '#090d16' },
            ].map((theme) => (
              <button
                key={theme.name}
                onClick={() => updateCurrentSlide({ background: theme.bg })}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 text-xs hover:border-amber-400 transition-colors"
                style={{ background: theme.bg }}
              >
                <span className="text-[11px] text-white font-medium drop-shadow-sm">{theme.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* TAB 4: TRANSITIONS */}
        {activeTab === 'transitions' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Effet :</span>
            <select
              value={currentSlide.transition || 'fade'}
              onChange={(e) => updateCurrentSlide({ transition: e.target.value as any })}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 outline-none"
            >
              <option value="fade">Fondu</option>
              <option value="slide">Glissement</option>
              <option value="zoom">Zoom</option>
              <option value="none">Aucune</option>
            </select>
          </div>
        )}

        {/* TAB 5: DIAPORAMA */}
        {activeTab === 'slideshow' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreenShow(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Démarrer le diaporama</span>
            </button>
          </div>
        )}

        {/* TAB 6: AFFICHAGE */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors ${
                showNotes ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Volet des notes</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Main Workspace (Thumbnails Rail + Slide Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails Sidebar */}
        <div className="w-24 sm:w-32 bg-slate-950 border-r border-slate-800 p-2 overflow-y-auto space-y-2 shrink-0 select-none">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-1">Diapositives</div>
          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setActiveSlideIndex(idx)}
              className={`p-1.5 rounded-lg border cursor-pointer transition-all ${
                activeSlideIndex === idx
                  ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              <div
                className="w-full aspect-video rounded flex flex-col justify-center items-center p-1 text-center overflow-hidden shadow-inner"
                style={{ background: s.background }}
              >
                <span className="text-[8px] font-bold text-white truncate max-w-full">{s.title || 'Diapo'}</span>
              </div>
              <div className="text-[10px] text-slate-400 text-center mt-1 font-mono">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Slide Canvas Editor */}
        <div className="flex-1 flex flex-col p-3 sm:p-6 bg-slate-950 overflow-y-auto items-center justify-center">
          <div
            className="w-full max-w-2xl aspect-video rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-slate-700/50"
            style={{
              background: currentSlide.background,
              fontFamily: (currentSlide as any).fontFamily || undefined,
            }}
          >
            {/* Slide Title & Subtitle Editable */}
            <div className="space-y-2">
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                className="w-full bg-transparent text-xl sm:text-2xl font-black text-white outline-none border-b border-transparent hover:border-white/30 focus:border-amber-400 transition-colors"
                placeholder="Titre de la diapositive"
              />
              <input
                type="text"
                value={currentSlide.subtitle || ''}
                onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-300 outline-none border-b border-transparent hover:border-white/30 focus:border-amber-400 transition-colors"
                placeholder="Sous-titre..."
              />
            </div>

            {/* Elements container */}
            <div className="grid grid-cols-2 gap-3 my-2 overflow-y-auto max-h-[140px]">
              {(currentSlide.elements || []).map((el) => (
                <div
                  key={el.id}
                  className="p-2 rounded-xl border border-white/10 backdrop-blur-xs flex flex-col justify-center"
                  style={{
                    backgroundColor: el.bgColor || 'rgba(255,255,255,0.05)',
                    color: el.color || '#fff',
                  }}
                >
                  <div className="font-bold text-xs truncate">{el.content}</div>
                  {el.subtitle && <div className="text-[10px] opacity-80 mt-0.5">{el.subtitle}</div>}
                </div>
              ))}
            </div>

            {/* Slide Footer */}
            <div className="flex items-center justify-between text-[10px] text-white/50 pt-2 border-t border-white/10">
              <span>{file.name}</span>
              <span>Diapositive {activeSlideIndex + 1} sur {slides.length}</span>
            </div>
          </div>

          {/* Notes Drawer */}
          {showNotes && (
            <div className="w-full max-w-2xl mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Notes pour l'orateur (visibles uniquement en mode présentation) :</span>
              </div>
              <textarea
                value={currentSlide.notes || ''}
                onChange={(e) => updateCurrentSlide({ notes: e.target.value })}
                placeholder="Ajoutez vos repères oraux, chiffres et arguments ici..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Status Bar */}
      <div className="h-7 bg-[#c43e1c] text-white px-4 flex items-center justify-between text-[11px] shrink-0 font-medium select-none shadow-inner">
        <div className="flex items-center gap-3">
          <span className="bg-black/20 px-2 py-0.5 rounded font-mono">16:9 HD</span>
          <span>Diapositive {activeSlideIndex + 1} sur {slides.length}</span>
          <span>•</span>
          <span>Transition : {currentSlide.transition || 'Fondu'}</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
          <span className="hidden sm:inline">Enregistré automatiquement</span>
        </div>
      </div>

      {/* Fullscreen Interactive Presentation Mode */}
      {isFullscreenShow && (
        <div
          onMouseMove={(e) => {
            if (laserActive) {
              const rect = e.currentTarget.getBoundingClientRect();
              setLaserPos({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
            }
          }}
          className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 cursor-default"
        >
          {/* Laser Pointer simulation */}
          {laserActive && (
            <div
              className="absolute w-4 h-4 bg-red-500 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_#ef4444] z-50 animate-pulse"
              style={{ left: `${laserPos.x}%`, top: `${laserPos.y}%` }}
            />
          )}

          {/* Presentation Top bar */}
          <div className="flex items-center justify-between text-white/80 z-20">
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{formatTimer(presentationSeconds)}</span>
              <span>•</span>
              <span>{activeSlideIndex + 1} / {slides.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLaserActive(!laserActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  laserActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Pointeur Laser</span>
              </button>

              <button
                onClick={() => setIsFullscreenShow(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
                title="Quitter le diaporama (Échap)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slide Presenter Content */}
          <div
            className="w-full max-w-4xl mx-auto aspect-video rounded-3xl p-10 flex flex-col justify-between shadow-2xl relative border border-white/10 transition-all duration-300"
            style={{ background: currentSlide.background }}
          >
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {currentSlide.title}
              </h1>
              {currentSlide.subtitle && (
                <p className="text-lg sm:text-xl text-slate-200 mt-3 font-light">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(currentSlide.elements || []).map((el) => (
                <div
                  key={el.id}
                  className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15"
                >
                  <div className="text-base font-bold text-white">{el.content}</div>
                  {el.subtitle && <div className="text-xs text-white/80 mt-1">{el.subtitle}</div>}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-white/50 pt-4 border-t border-white/15">
              <span>{file.name}</span>
              <span>Diapositive {activeSlideIndex + 1} sur {slides.length}</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 z-20">
            <button
              onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={activeSlideIndex === slides.length - 1}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Office Backstage Modal */}
      <OfficeBackstageModal
        isOpen={isBackstageOpen}
        onClose={() => setIsBackstageOpen(false)}
        file={file}
        onSave={() => onUpdateFile({ updatedAt: Date.now() })}
        onExport={() => alert('Exportation de la présentation')}
        onPrint={() => window.print()}
        onNew={() => {}}
        onBrowseFiles={() => {}}
      />
    </div>
  );
};
