import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile } from '../types/office';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  file: OfficeFile;
}

const FORMATS: Record<string, Array<{ id: string; label: string; mime: string; ext: string }>> = {
  writer: [
    { id: 'docx', label: 'Document Word (.docx)', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx' },
    { id: 'txt', label: 'Texte simple (.txt)', mime: 'text/plain', ext: '.txt' },
    { id: 'html', label: 'HTML (.html)', mime: 'text/html', ext: '.html' },
    { id: 'json', label: 'Sauvegarde JSON (.json)', mime: 'application/json', ext: '.json' },
  ],
  calc: [
    { id: 'csv', label: 'CSV (.csv)', mime: 'text/csv', ext: '.csv' },
    { id: 'json', label: 'Sauvegarde JSON (.json)', mime: 'application/json', ext: '.json' },
  ],
  impress: [
    { id: 'json', label: 'Sauvegarde JSON (.json)', mime: 'application/json', ext: '.json' },
  ],
  pdf: [
    { id: 'json', label: 'Sauvegarde JSON (.json)', mime: 'application/json', ext: '.json' },
  ],
};

export default function ExportModal({ isOpen, onClose, file }: Props) {
  const [busy, setBusy] = useState(false);
  const formats = FORMATS[file.type] || [];

  const handleExport = async (fmt: typeof formats[number]) => {
    setBusy(true);
    try {
      const { exportContent } = await import('../utils/export');
      let content = '';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const filename = `${baseName}${fmt.ext}`;

      if (file.type === 'writer') {
        if (fmt.id === 'txt') {
          // Strip HTML
          content = String(file.content?.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        } else {
          content = file.content?.html || '';
        }
      } else if (file.type === 'calc') {
        if (fmt.id === 'csv') {
          const lines: string[] = [];
          for (const sheet of file.content?.sheets || []) {
            for (let r = 0; r < sheet.rowCount; r++) {
              const cells: string[] = [];
              for (let c = 0; c < sheet.colCount; c++) {
                const coord = String.fromCharCode(65 + c) + (r + 1);
                const v = sheet.data?.[coord]?.value ?? '';
                cells.push(String(v).replace(/[,\n]/g, ' '));
              }
              if (cells.some((c) => c)) lines.push(cells.join(','));
            }
          }
          content = lines.join('\n');
        } else {
          content = JSON.stringify(file.content, null, 2);
        }
      } else {
        content = JSON.stringify(file.content, null, 2);
      }

      await exportContent(content, filename, fmt.mime);
      onClose();
    } catch (e) {
      Alert.alert("Erreur d'export", String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#f1f5f9" />
          </Pressable>
          <Text style={styles.title}>Exporter / Partager</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.fileCard}>
            <Ionicons
              name={file.type === 'writer' ? 'document-text' : file.type === 'calc' ? 'grid' : file.type === 'impress' ? 'easel' : 'document'}
              size={32}
              color="#a855f7"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileMeta}>{file.extension.toUpperCase()} · {Math.round(file.size / 1024)} Ko</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Choisir un format</Text>
          {formats.map((fmt) => (
            <Pressable
              key={fmt.id}
              disabled={busy}
              onPress={() => handleExport(fmt)}
              style={({ pressed }) => [
                styles.fmtBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="download-outline" size={20} color="#a855f7" />
              <Text style={styles.fmtLabel}>{fmt.label}</Text>
              <Ionicons name="chevron-forward" size={14} color="#475569" />
            </Pressable>
          ))}

          {busy && (
            <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
              Export en cours...
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fileName: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  fileMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fmtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fmtLabel: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 13,
  },
});
