import React, { useState, useMemo } from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PieChart as PieChartIcon,
  BarChart2,
  TrendingUp,
  Percent,
  DollarSign,
  Plus,
  Trash2,
  Filter,
  ArrowUpDown,
  FunctionSquare,
  Sparkles,
  HelpCircle,
  X,
  Save,
  RotateCcw,
  RotateCw,
  Table2,
  Search,
  Sigma,
  Grid,
  Maximize2
} from 'lucide-react';
import { OfficeFile, CalcSheet, CellData } from '../../types/office';
import { formatCellValue, evaluateFormula } from '../../utils/calcEngine';
import { OfficeBackstageModal } from '../office/OfficeBackstageModal';

interface CalcEditorProps {
  file: OfficeFile;
  onUpdateFile: (updated: Partial<OfficeFile>) => void;
}

type ExcelRibbonTab = 'home' | 'insert' | 'formulas' | 'data' | 'view';

export const CalcEditor: React.FC<CalcEditorProps> = ({ file, onUpdateFile }) => {
  const sheets: CalcSheet[] = file.content?.sheets || [
    {
      id: 'sh-1',
      name: 'Feuille 1',
      rowCount: 25,
      colCount: 10,
      frozenRows: 1,
      frozenCols: 1,
      data: {},
    },
  ];

  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState('A1');
  const [formulaInput, setFormulaInput] = useState('');
  const [activeTab, setActiveTab] = useState<ExcelRibbonTab>('home');
  const [isBackstageOpen, setIsBackstageOpen] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [showFxModal, setShowFxModal] = useState(false);
  const [showGridlines, setShowGridlines] = useState(true);
  const [zoom, setZoom] = useState(100);

  const currentSheet = sheets[activeSheetIndex] || sheets[0];

  // Update formula bar input when cell selection changes
  React.useEffect(() => {
    const cell = currentSheet.data[selectedCell];
    setFormulaInput(cell?.value || '');
  }, [selectedCell, activeSheetIndex]);

  const updateCell = (cellKey: string, partial: Partial<CellData>) => {
    const updatedSheets = [...sheets];
    const targetSheet = { ...updatedSheets[activeSheetIndex] };
    const currentData = targetSheet.data || {};
    const existing = currentData[cellKey] || { value: '' };

    targetSheet.data = {
      ...currentData,
      [cellKey]: {
        ...existing,
        ...partial,
      },
    };

    updatedSheets[activeSheetIndex] = targetSheet;

    onUpdateFile({
      updatedAt: Date.now(),
      content: {
        ...file.content,
        sheets: updatedSheets,
      },
    });
  };

  const handleFormulaSubmit = (val: string) => {
    updateCell(selectedCell, { value: val });
  };

  const handleCellClick = (cellKey: string) => {
    setSelectedCell(cellKey);
  };

  // Add new sheet
  const handleAddSheet = () => {
    const newSheet: CalcSheet = {
      id: `sh-${Date.now()}`,
      name: `Feuille ${sheets.length + 1}`,
      rowCount: 25,
      colCount: 10,
      frozenRows: 1,
      frozenCols: 0,
      data: {},
    };
    const updated = [...sheets, newSheet];
    onUpdateFile({
      updatedAt: Date.now(),
      content: { ...file.content, sheets: updated },
    });
    setActiveSheetIndex(updated.length - 1);
  };

  const handleDeleteSheet = (index: number) => {
    if (sheets.length <= 1) return;
    const updated = sheets.filter((_, i) => i !== index);
    onUpdateFile({
      updatedAt: Date.now(),
      content: { ...file.content, sheets: updated },
    });
    setActiveSheetIndex(Math.max(0, index - 1));
  };

  const currentCellData = currentSheet.data[selectedCell] || { value: '' };

  // Generate chart data series from active sheet
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const values: number[] = [];

    for (let r = 2; r <= Math.min(12, currentSheet.rowCount); r++) {
      const labelCell = currentSheet.data[`A${r}`];
      const valCell = currentSheet.data[`B${r}`] || currentSheet.data[`F${r}`];
      if (labelCell?.value && valCell?.value) {
        labels.push(labelCell.value);
        let num = 0;
        if (valCell.value.startsWith('=')) {
          const res = evaluateFormula(valCell.value, currentSheet.data);
          num = typeof res === 'number' ? res : parseFloat(res) || 0;
        } else {
          num = parseFloat(valCell.value.replace(/[^0-9.-]/g, '')) || 0;
        }
        values.push(num);
      }
    }

    if (labels.length === 0) {
      return {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'],
        values: [1200, 1850, 2100, 1750, 2400],
      };
    }

    return { labels, values };
  }, [currentSheet]);

  const maxChartValue = Math.max(...chartData.values, 1);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 select-none overflow-hidden text-slate-100">
      {/* 1. Microsoft Excel Title Bar (Green Signature #107c41) */}
      <div className="bg-[#107c41] text-white px-3 py-1.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          {/* File Tab opens Backstage */}
          <button
            onClick={() => setIsBackstageOpen(true)}
            className="px-3 py-1 bg-[#0b5a2e] hover:bg-[#084523] rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
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
          <Table2 className="w-3.5 h-3.5 text-emerald-200" />
          <span className="truncate">{file.name}</span>
          <span className="text-[10px] text-emerald-200 bg-white/15 px-1.5 py-0.5 rounded font-mono">Excel</span>
        </div>

        {/* Right Search */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowChartModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-black/20 hover:bg-black/30 rounded text-xs text-white/90 transition-colors"
            title="Graphiques Excel"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Graphique</span>
          </button>
        </div>
      </div>

      {/* 2. Microsoft Excel Ribbon Tabs (Accueil, Insertion, Formules, Données, Affichage) */}
      <div className="bg-slate-850 border-b border-slate-750 px-2 flex items-center overflow-x-auto shrink-0 select-none">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'home'
              ? 'border-emerald-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Accueil
        </button>

        <button
          onClick={() => setActiveTab('insert')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'insert'
              ? 'border-emerald-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Insertion
        </button>

        <button
          onClick={() => setActiveTab('formulas')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'formulas'
              ? 'border-emerald-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Formules
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'data'
              ? 'border-emerald-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Données
        </button>

        <button
          onClick={() => setActiveTab('view')}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'view'
              ? 'border-emerald-500 text-white font-semibold bg-slate-800/60'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
          }`}
        >
          Affichage
        </button>
      </div>

      {/* 3. Excel Ribbon Command Bar */}
      <div className="bg-slate-850 border-b border-slate-700/80 px-3 py-1.5 flex items-center gap-2 overflow-x-auto shrink-0 text-slate-200 min-h-[50px]">
        {/* TAB 1: ACCUEIL */}
        {activeTab === 'home' && (
          <div className="flex items-center gap-2">
            {/* Font Family & Size */}
            <select
              value={currentCellData.fontFamily || 'Plus Jakarta Sans'}
              onChange={(e) => updateCell(selectedCell, { fontFamily: e.target.value })}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1 outline-none max-w-[120px] truncate"
              title="Police"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta</option>
              <option value="Arial">Arial</option>
              <option value="Calibri">Calibri</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
            </select>

            <select
              value={currentCellData.fontSize || 12}
              onChange={(e) => updateCell(selectedCell, { fontSize: parseInt(e.target.value, 10) })}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-1.5 py-1 outline-none font-mono"
              title="Taille"
            >
              {[9, 10, 11, 12, 14, 16, 18, 20, 24].map((s) => (
                <option key={s} value={s}>{s} pt</option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Bold / Italic */}
            <button
              onClick={() => updateCell(selectedCell, { bold: !currentCellData.bold })}
              className={`p-1.5 rounded transition-colors ${
                currentCellData.bold ? 'bg-emerald-600 text-white' : 'hover:bg-slate-700 text-slate-300'
              }`}
              title="Gras (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateCell(selectedCell, { italic: !currentCellData.italic })}
              className={`p-1.5 rounded transition-colors ${
                currentCellData.italic ? 'bg-emerald-600 text-white' : 'hover:bg-slate-700 text-slate-300'
              }`}
              title="Italique (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Alignments */}
            <button
              onClick={() => updateCell(selectedCell, { align: 'left' })}
              className={`p-1.5 rounded transition-colors ${
                currentCellData.align === 'left' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Aligner à gauche"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateCell(selectedCell, { align: 'center' })}
              className={`p-1.5 rounded transition-colors ${
                currentCellData.align === 'center' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Centrer"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateCell(selectedCell, { align: 'right' })}
              className={`p-1.5 rounded transition-colors ${
                currentCellData.align === 'right' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Aligner à droite"
            >
              <AlignRight className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            {/* Number Formats */}
            <button
              onClick={() =>
                updateCell(selectedCell, {
                  format: currentCellData.format === 'currency' ? undefined : 'currency',
                })
              }
              className={`p-1.5 rounded transition-colors ${
                currentCellData.format === 'currency' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-emerald-400'
              }`}
              title="Format Monétaire (€)"
            >
              <DollarSign className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                updateCell(selectedCell, {
                  format: currentCellData.format === 'percent' ? undefined : 'percent',
                })
              }
              className={`p-1.5 rounded transition-colors ${
                currentCellData.format === 'percent' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-indigo-400'
              }`}
              title="Format Pourcentage (%)"
            >
              <Percent className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 2: INSERTION */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChartModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Insérer un Graphique</span>
            </button>
          </div>
        )}

        {/* TAB 3: FORMULES */}
        {activeTab === 'formulas' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFxModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs border border-emerald-500/30"
            >
              <FunctionSquare className="w-4 h-4 text-emerald-400" />
              <span>Insérer une fonction fx</span>
            </button>

            <button
              onClick={() => {
                const colLetter = selectedCell.charAt(0);
                const formula = `=SUM(${colLetter}1:${colLetter}10)`;
                setFormulaInput(formula);
                handleFormulaSubmit(formula);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700"
              title="Somme automatique"
            >
              <Sigma className="w-4 h-4 text-amber-400" />
              <span>SOMME auto</span>
            </button>
          </div>
        )}

        {/* TAB 4: DONNÉES */}
        {activeTab === 'data' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert('Tri de la colonne actif (A-Z)');
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
              <span>Trier de A à Z</span>
            </button>
            <button
              onClick={() => {
                alert('Filtre automatique appliqué sur la ligne 1');
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700"
            >
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Filtrer</span>
            </button>
          </div>
        )}

        {/* TAB 5: AFFICHAGE */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGridlines(!showGridlines)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-colors ${
                showGridlines ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Quadrillage</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-lg text-xs">
              <span className="text-slate-400">Zoom :</span>
              <select
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value, 10))}
                className="bg-transparent text-white outline-none cursor-pointer font-mono"
              >
                <option value="100" className="bg-slate-800">100%</option>
                <option value="90" className="bg-slate-800">90%</option>
                <option value="80" className="bg-slate-800">80%</option>
                <option value="70" className="bg-slate-800">70%</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. Formula Bar */}
      <div className="bg-slate-850 border-b border-slate-700 px-3 py-1 flex items-center gap-2 shrink-0">
        <div className="font-mono text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 min-w-[50px] text-center select-none">
          {selectedCell}
        </div>

        <button
          onClick={() => setShowFxModal(true)}
          className="font-serif italic font-bold text-xs text-slate-300 hover:text-emerald-400 bg-slate-800 px-2 py-1 rounded border border-slate-700"
          title="Insérer une formule (fx)"
        >
          fx
        </button>

        <input
          type="text"
          value={formulaInput}
          onChange={(e) => setFormulaInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleFormulaSubmit(formulaInput);
            }
          }}
          onBlur={() => handleFormulaSubmit(formulaInput)}
          placeholder="Saisissez une valeur ou formule (ex: =SUM(A1:A5) ou =B2*1.2)"
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
        />
      </div>

      {/* 5. Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-slate-950 relative">
        <table className={`border-collapse text-xs w-max min-w-full ${showGridlines ? '' : 'border-none'}`}>
          <thead>
            <tr>
              <th className="w-10 h-7 bg-slate-900 border border-slate-800 text-slate-500 text-center sticky top-0 left-0 z-20 select-none">
                #
              </th>
              {Array.from({ length: currentSheet.colCount }).map((_, c) => {
                const colLetter = String.fromCharCode(65 + c);
                return (
                  <th
                    key={colLetter}
                    className="min-w-[85px] w-24 h-7 bg-slate-900 border border-slate-800 text-slate-400 font-semibold text-center sticky top-0 z-10 select-none"
                  >
                    {colLetter}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: currentSheet.rowCount }).map((_, r) => {
              const rowNum = r + 1;
              return (
                <tr key={rowNum}>
                  <td className="w-10 h-7 bg-slate-900 border border-slate-800 text-slate-400 font-mono text-center sticky left-0 z-10 select-none">
                    {rowNum}
                  </td>
                  {Array.from({ length: currentSheet.colCount }).map((_, c) => {
                    const colLetter = String.fromCharCode(65 + c);
                    const cellKey = `${colLetter}${rowNum}`;
                    const cell = currentSheet.data[cellKey];
                    const isSelected = selectedCell === cellKey;
                    const displayVal = cell ? formatCellValue(cell, currentSheet.data) : '';

                    return (
                      <td
                        key={cellKey}
                        onClick={() => handleCellClick(cellKey)}
                        className={`h-7 px-2 border border-slate-800 overflow-hidden text-ellipsis whitespace-nowrap cursor-cell transition-colors ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 bg-emerald-950/40 z-5 font-semibold'
                            : 'hover:bg-slate-850'
                        }`}
                        style={{
                          fontWeight: cell?.bold ? 'bold' : 'normal',
                          fontStyle: cell?.italic ? 'italic' : 'normal',
                          fontFamily: cell?.fontFamily || undefined,
                          fontSize: cell?.fontSize ? `${cell.fontSize}px` : undefined,
                          color: cell?.color || '#f1f5f9',
                          backgroundColor: cell?.bg || undefined,
                          textAlign: cell?.align || (cell?.format === 'currency' || !isNaN(parseFloat(displayVal)) ? 'right' : 'left'),
                        }}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Sheets Tabs Bar */}
      <div className="h-8 bg-slate-950 border-t border-slate-800 flex items-center px-2 gap-1 shrink-0 overflow-x-auto select-none">
        {sheets.map((sh, idx) => (
          <button
            key={sh.id}
            onClick={() => setActiveSheetIndex(idx)}
            className={`px-3 py-1 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border-t border-x ${
              activeSheetIndex === idx
                ? 'bg-slate-900 text-emerald-400 border-slate-700 border-b-2 border-b-emerald-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <span>{sh.name}</span>
            {sheets.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSheet(idx);
                }}
                className="hover:text-rose-400 rounded-full p-0.5 text-[10px]"
                title="Supprimer la feuille"
              >
                ✕
              </span>
            )}
          </button>
        ))}

        <button
          onClick={handleAddSheet}
          className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white"
          title="Ajouter une feuille"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400 font-mono pr-2">
          <span>Prêt</span>
          <span>•</span>
          <span>Excel Calc Engine</span>
        </div>
      </div>

      {/* Office Backstage Modal */}
      <OfficeBackstageModal
        isOpen={isBackstageOpen}
        onClose={() => setIsBackstageOpen(false)}
        file={file}
        onSave={() => onUpdateFile({ updatedAt: Date.now() })}
        onExport={() => alert('Export du classeur Excel')}
        onPrint={() => window.print()}
        onNew={() => {}}
        onBrowseFiles={() => {}}
      />

      {/* Formula Assistant Modal */}
      {showFxModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FunctionSquare className="w-4 h-4 text-emerald-400" />
                <span>Insérer une formule (Microsoft Excel)</span>
              </h3>
              <button onClick={() => setShowFxModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: 'SUM', example: '=SUM(A1:A5)', desc: 'Calcule la somme des cellules sélectionnées' },
                { name: 'AVERAGE', example: '=AVERAGE(B2:B10)', desc: 'Calcule la moyenne arithmétique' },
                { name: 'COUNT', example: '=COUNT(A1:A20)', desc: 'Compte le nombre de cellules contenant des nombres' },
                { name: 'MAX', example: '=MAX(C1:C10)', desc: 'Renvoie la valeur la plus grande' },
                { name: 'MIN', example: '=MIN(C1:C10)', desc: 'Renvoie la valeur la plus petite' },
                { name: 'MULT', example: '=B2*C2', desc: 'Multiplication simple entre deux cellules' },
              ].map((fn) => (
                <div
                  key={fn.name}
                  onClick={() => {
                    setFormulaInput(fn.example);
                    handleFormulaSubmit(fn.example);
                    setShowFxModal(false);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">{fn.name}</span>
                    <span className="font-mono text-[11px] text-slate-300">{fn.example}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{fn.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chart Visualizer Modal */}
      {showChartModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Graphique Dynamique Excel</span>
              </h3>
              <button onClick={() => setShowChartModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setChartType('bar')}
                className={`flex-1 py-1.5 rounded-lg border text-center transition-colors ${
                  chartType === 'bar' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 bg-slate-800/60 text-slate-400'
                }`}
              >
                Histogramme
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`flex-1 py-1.5 rounded-lg border text-center transition-colors ${
                  chartType === 'pie' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 bg-slate-800/60 text-slate-400'
                }`}
              >
                Secteurs (Camembert)
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`flex-1 py-1.5 rounded-lg border text-center transition-colors ${
                  chartType === 'line' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-800 bg-slate-800/60 text-slate-400'
                }`}
              >
                Courbe
              </button>
            </div>

            {/* Chart Area */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-h-[220px] flex items-end justify-between gap-2">
              {chartData.labels.map((lbl, idx) => {
                const val = chartData.values[idx] || 0;
                const heightPercent = Math.max(12, Math.round((val / maxChartValue) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] text-slate-400 font-mono">{val}</span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${heightPercent * 1.5}px` }}
                    />
                    <span className="text-[10px] text-slate-400 truncate w-full text-center">{lbl}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
