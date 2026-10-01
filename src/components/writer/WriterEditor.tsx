import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile } from '../../types/office';

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
  onCloseDocument: () => void;
  onNewDocument: () => void;
}

const ACTIONS: Array<{ id: string; icon: any; label: string; tag: string }> = [
  { id: 'bold', icon: 'bold', label: 'Gras', tag: 'b' },
  { id: 'italic', icon: 'italic', label: 'Italique', tag: 'i' },
  { id: 'underline', icon: 'underline', label: 'Souligné', tag: 'u' },
  { id: 'h1', icon: 'text', label: 'Titre 1', tag: 'h1' },
  { id: 'h2', icon: 'text', label: 'Titre 2', tag: 'h2' },
  { id: 'p', icon: 'menu', label: 'Paragraphe', tag: 'p' },
  { id: 'ul', icon: 'list', label: 'Liste', tag: 'ul' },
];

export default function WriterEditor({
  file,
  onUpdateFile,
  onCloseDocument,
  onNewDocument,
}: Props) {
  const [text, setText] = useState<string>(
    String(file.content?.html || '').replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim()
  );
  const [selection, setSelection] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'format' | 'insert'>('home');

  useEffect(() => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    onUpdateFile({
      content: { html: `<p>${text.split('\n').join('</p><p>')}</p>`, wordCount },
    });
  }, [text]);

  const wrapSelection = (tag: string) => {
    // simple insert tag markers around selection — for plain text we just prepend
    setText((prev) => `<${tag}>${prev}</${tag}>`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.ribbon}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => wrapSelection(a.tag)}
              style={({ pressed }) => [styles.ribbonBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name={a.icon as any} size={18} color="#a855f7" />
              <Text style={styles.ribbonLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.editor} contentContainerStyle={{ padding: 16 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus={false}
          placeholder="Commencez à rédiger votre texte..."
          placeholderTextColor="#475569"
          style={styles.textArea}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.statusBar}>
        <Text style={styles.stat}>
          {text.split(/\s+/).filter(Boolean).length} mots · {text.length} caractères
        </Text>
        <View style={styles.statusActions}>
          <Pressable onPress={onNewDocument} style={styles.statusBtn}>
            <Ionicons name="add-circle" size={16} color="#a855f7" />
            <Text style={styles.statusBtnLabel}>Nouveau</Text>
          </Pressable>
          <Pressable onPress={onCloseDocument} style={styles.statusBtn}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
            <Text style={styles.statusBtnLabel}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  ribbon: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 8,
  },
  ribbonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ribbonLabel: {
    color: '#f1f5f9',
    fontSize: 12,
  },
  editor: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  textArea: {
    color: '#f1f5f9',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 400,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stat: {
    color: '#94a3b8',
    fontSize: 11,
  },
  statusActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBtnLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
});
