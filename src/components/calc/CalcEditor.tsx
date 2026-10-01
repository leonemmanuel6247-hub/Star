import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile, CellData, CalcSheet } from '../../types/office';
import {
  coordToString,
  evaluateFormula,
  formatCellValue,
} from '../../utils/calcEngine';

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
}

const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function CalcEditor({ file, onUpdateFile }: Props) {
  const [activeSheetId, setActiveSheetId] = useState<string>(
    file.content?.sheets?.[0]?.id || 'sh-1'
  );
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [editValue, setEditValue] = useState('');

  const sheets: CalcSheet[] = file.content?.sheets || [];
  const sheet = sheets.find((s) => s.id === activeSheetId) || sheets[0];

  if (!sheet) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#94a3b8' }}>Aucune feuille disponible</Text>
      </View>
    );
  }

  const getCellValue = (coord: string): string | number | undefined => {
    return sheet.data?.[coord]?.value;
  };

  const resolveCell = (cell?: CellData): string => {
    if (!cell) return '';
    if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
      const result = evaluateFormula(cell.value, getCellValue);
      if (typeof result === 'number') {
        return formatCellValue(result, cell.format);
      }
      return String(result);
    }
    return formatCellValue(cell.value, cell.format);
  };

  const handleCellEdit = (coord: string, value: string) => {
    const updatedSheets = sheets.map((s) => {
      if (s.id !== sheet.id) return s;
      const data = { ...s.data };
      if (!value && value !== 0) {
        delete data[coord];
      } else {
        const existing = data[coord] || {};
        const isNumber = !isNaN(parseFloat(value));
        data[coord] = {
          ...existing,
          value: isNumber ? parseFloat(value) : value,
          formula: value.startsWith('=') ? value : undefined,
        };
      }
      return { ...s, data };
    });
    onUpdateFile({
      content: { ...file.content, sheets: updatedSheets },
    });
  };

  const handleSelectCell = (coord: string) => {
    setSelectedCell(coord);
    const cell = sheet.data?.[coord];
    setEditValue(cell?.formula || (cell?.value != null ? String(cell.value) : ''));
  };

  const headerCols = Array.from({ length: Math.min(sheet.colCount, 8) }, (_, i) =>
    COL_LETTERS[i]
  );

  return (
    <View style={styles.container}>
      <View style={styles.sheetTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sheets.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setActiveSheetId(s.id)}
              style={[
                styles.sheetTab,
                s.id === activeSheetId && styles.sheetTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sheetTabText,
                  s.id === activeSheetId && styles.sheetTabTextActive,
                ]}
              >
                {s.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.formulaBar}>
        <Text style={styles.formulaCellLabel}>{selectedCell}</Text>
        <TextInput
          value={editValue}
          onChangeText={(v) => {
            setEditValue(v);
            handleCellEdit(selectedCell, v);
          }}
          placeholder="Saisir une valeur ou une formule (=SUM(...))"
          placeholderTextColor="#475569"
          style={styles.formulaInput}
        />
        <Ionicons name="calculator" size={16} color="#a855f7" />
      </View>

      <ScrollView horizontal>
        <View>
          <View style={styles.row}>
            <View style={styles.cellHeader} />
            {headerCols.map((col) => (
              <View key={col} style={styles.cellHeader}>
                <Text style={styles.cellHeaderText}>{col}</Text>
              </View>
            ))}
          </View>

          {Array.from({ length: Math.min(sheet.rowCount, 20) }, (_, r) => r).map((r) => (
            <View key={r} style={styles.row}>
              <View style={styles.cellHeader}>
                <Text style={styles.cellHeaderText}>{r + 1}</Text>
              </View>
              {headerCols.map((col) => {
                const coord = `${col}${r + 1}`;
                const cell = sheet.data?.[coord];
                const isSel = coord === selectedCell;
                return (
                  <Pressable
                    key={coord}
                    onPress={() => handleSelectCell(coord)}
                    style={[
                      styles.cell,
                      isSel && styles.cellSelected,
                      cell?.bold && { backgroundColor: '#334155' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        cell?.bold && styles.cellTextBold,
                        { color: cell?.color || '#f1f5f9' },
                      ]}
                      numberOfLines={1}
                    >
                      {resolveCell(cell)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Feuille : {sheet.name} · Cellule : {selectedCell}
        </Text>
        <Text style={styles.statusText}>
          {sheet.rowCount} lignes × {sheet.colCount} colonnes
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  sheetTabs: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 6,
  },
  sheetTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sheetTabActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  sheetTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetTabTextActive: {
    color: '#fff',
  },
  formulaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  formulaCellLabel: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '700',
    width: 50,
    backgroundColor: '#0f172a',
    paddingVertical: 4,
    textAlign: 'center',
    borderRadius: 4,
  },
  formulaInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 13,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
  },
  cellHeader: {
    width: 40,
    height: 24,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  cellHeaderText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  cell: {
    width: 80,
    height: 30,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155',
  },
  cellSelected: {
    borderWidth: 2,
    borderColor: '#a855f7',
    zIndex: 1,
  },
  cellText: {
    fontSize: 12,
    color: '#f1f5f9',
  },
  cellTextBold: {
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
});
