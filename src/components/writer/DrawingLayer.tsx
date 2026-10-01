import React, { useRef, useEffect, useState } from 'react';
import { Pen, Highlighter, Eraser, Trash2, Check, X } from 'lucide-react';

interface DrawingLayerProps {
  isActive: boolean;
  onClose: () => void;
  onSaveDrawingToDocument: (imageDataUrl: string) => void;
  width: number;
  height: number;
}

export const DrawingLayer: React.FC<DrawingLayerProps> = ({
  isActive,
  onClose,
  onSaveDrawingToDocument,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  if (!isActive) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

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
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 4;
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color === '#fef08a' ? 'rgba(254, 240, 138, 0.45)' : 'rgba(187, 247, 208, 0.45)';
      ctx.lineWidth = strokeWidth * 5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleInsertIntoDocument = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveDrawingToDocument(dataUrl);
    handleClear();
    onClose();
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center">
      {/* Drawing Toolbar on top */}
      <div className="pointer-events-auto bg-slate-900 border border-slate-750 shadow-2xl rounded-full px-4 py-1.5 mt-2 flex items-center gap-3 z-40 animate-in fade-in slide-in-from-top-2">
        <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
          Outils Dessin Word
        </span>

        <div className="h-4 w-px bg-slate-700" />

        {/* Tool buttons */}
        <button
          onClick={() => { setTool('pen'); setColor('#1e293b'); }}
          className={`p-1.5 rounded-lg flex items-center gap-1 text-xs ${
            tool === 'pen' && color === '#1e293b' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
          }`}
          title="Stylo bille noir"
        >
          <Pen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Stylo</span>
        </button>

        <button
          onClick={() => { setTool('pen'); setColor('#2563eb'); }}
          className={`w-5 h-5 rounded-full border border-white/20 ${
            tool === 'pen' && color === '#2563eb' ? 'ring-2 ring-white scale-110' : ''
          }`}
          style={{ backgroundColor: '#2563eb' }}
          title="Stylo bleu"
        />

        <button
          onClick={() => { setTool('pen'); setColor('#dc2626'); }}
          className={`w-5 h-5 rounded-full border border-white/20 ${
            tool === 'pen' && color === '#dc2626' ? 'ring-2 ring-white scale-110' : ''
          }`}
          style={{ backgroundColor: '#dc2626' }}
          title="Stylo rouge"
        />

        <button
          onClick={() => { setTool('highlighter'); setColor('#fef08a'); }}
          className={`p-1.5 rounded-lg flex items-center gap-1 text-xs ${
            tool === 'highlighter' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
          }`}
          title="Surligneur"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Surligneur</span>
        </button>

        <button
          onClick={() => setTool('eraser')}
          className={`p-1.5 rounded-lg flex items-center gap-1 text-xs ${
            tool === 'eraser' ? 'bg-rose-600 text-white font-bold' : 'text-slate-300 hover:text-white'
          }`}
          title="Gomme"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gomme</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        {/* Thickness */}
        <select
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
          className="bg-slate-800 text-white text-[11px] rounded border border-slate-700 px-1 py-0.5"
        >
          <option value="2">Fin (2px)</option>
          <option value="4">Moyen (4px)</option>
          <option value="8">Épais (8px)</option>
        </select>

        <button
          onClick={handleClear}
          className="p-1 text-slate-400 hover:text-rose-400"
          title="Effacer le dessin"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={handleInsertIntoDocument}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
          title="Insérer le dessin dans la page"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Valider</span>
        </button>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white"
          title="Fermer le mode dessin"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Actual drawing canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="pointer-events-auto cursor-crosshair absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
};
