import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DocumentType } from '../types/office';

interface Props {
  isVisible: boolean;
  onNewDocument: (type: DocumentType) => void;
  onOpenTemplates: () => void;
}

const ACTIONS: Array<{ type: DocumentType | 'templates'; icon: any; color: string; label: string }> = [
  { type: 'writer', icon: 'document-text', color: '#3b82f6', label: 'Writer' },
  { type: 'calc', icon: 'grid', color: '#10b981', label: 'Calc' },
  { type: 'impress', icon: 'easel', color: '#f59e0b', label: 'Impress' },
  { type: 'pdf', icon: 'document', color: '#ef4444', label: 'PDF' },
  { type: 'templates', icon: 'albums', color: '#a855f7', label: 'Modèles' },
];

export default function FloatingSpeedDial({ isVisible, onNewDocument, onOpenTemplates }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!isVisible) return null;

  const handlePress = (a: typeof ACTIONS[number]) => {
    setExpanded(false);
    if (a.type === 'templates') {
      onOpenTemplates();
    } else {
      onNewDocument(a.type as DocumentType);
    }
  };

  return (
    <>
      {expanded && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => setExpanded(false)}
          activeOpacity={1}
        />
      )}
      <View pointerEvents="box-none" style={styles.container}>
        {expanded && (
          <View style={styles.actions}>
            {ACTIONS.map((a) => (
              <Pressable
                key={a.type}
                onPress={() => handlePress(a)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: a.color }]}>
                  <Ionicons name={a.icon} size={22} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name={expanded ? 'close' : 'add'} size={28} color="#fff" />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  actions: {
    marginBottom: 12,
    gap: 10,
    alignItems: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionLabel: {
    color: '#f1f5f9',
    fontSize: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
