import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile, DocumentType } from '../../types/office';

interface Props {
  files: OfficeFile[];
  onOpenFile: (file: OfficeFile) => void;
  onNewFile: (type: DocumentType) => void;
  onDeleteFile: (fileId: string) => void;
  onDuplicateFile: (file: OfficeFile) => void;
  onToggleFavorite: (fileId: string) => void;
}

const TYPE_FILTERS: Array<{ id: string; icon: any; color: string; label: string }> = [
  { id: 'all', icon: 'apps', color: '#a855f7', label: 'Tous' },
  { id: 'writer', icon: 'document-text', color: '#3b82f6', label: 'Writer' },
  { id: 'calc', icon: 'grid', color: '#10b981', label: 'Calc' },
  { id: 'impress', icon: 'easel', color: '#f59e0b', label: 'Impress' },
  { id: 'pdf', icon: 'document', color: '#ef4444', label: 'PDF' },
];

export default function FileManagerView({
  files,
  onOpenFile,
  onNewFile,
  onDeleteFile,
  onDuplicateFile,
  onToggleFavorite,
}: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  const filtered = filter === 'all' ? files : files.filter((f) => f.type === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
    return b.updatedAt - a.updatedAt;
  });

  const getIcon = (type: string): any => {
    switch (type) {
      case 'writer': return 'document-text';
      case 'calc': return 'grid';
      case 'impress': return 'easel';
      case 'pdf': return 'document';
      default: return 'document';
    }
  };

  const getColor = (type: string): string => {
    switch (type) {
      case 'writer': return '#3b82f6';
      case 'calc': return '#10b981';
      case 'impress': return '#f59e0b';
      case 'pdf': return '#ef4444';
      default: return '#6366f1';
    }
  };

  const showActions = (file: OfficeFile) => {
    Alert.alert(
      file.name,
      'Que souhaitez-vous faire ?',
      [
        { text: 'Ouvrir', onPress: () => onOpenFile(file) },
        {
          text: file.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris',
          onPress: () => onToggleFavorite(file.id),
        },
        { text: 'Dupliquer', onPress: () => onDuplicateFile(file) },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteFile(file.id),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterChip,
                filter === f.id && { backgroundColor: f.color, borderColor: f.color },
              ]}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={filter === f.id ? '#fff' : '#94a3b8'}
              />
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.count}>{sorted.length} fichiers</Text>
        <Pressable
          onPress={() => {
            const next = sortBy === 'date' ? 'name' : sortBy === 'name' ? 'size' : 'date';
            setSortBy(next);
          }}
          style={styles.sortBtn}
        >
          <Ionicons name="swap-vertical" size={14} color="#94a3b8" />
          <Text style={styles.sortText}>
            {sortBy === 'date' ? 'Date' : sortBy === 'name' ? 'Nom' : 'Taille'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>Aucun fichier</Text>
            <Text style={styles.emptySub}>Créez-en un depuis le bouton +</Text>
          </View>
        }
        renderItem={({ item: file }) => (
          <Pressable
            onPress={() => onOpenFile(file)}
            onLongPress={() => showActions(file)}
            style={({ pressed }) => [styles.fileCard, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.fileIcon, { backgroundColor: getColor(file.type) + '22' }]}>
              <Ionicons name={getIcon(file.type)} size={22} color={getColor(file.type)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileMeta}>
                {new Date(file.updatedAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })} · {Math.round(file.size / 1024)} Ko
              </Text>
            </View>
            {file.isFavorite && <Ionicons name="star" size={14} color="#f59e0b" />}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  filters: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  count: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  sortText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  fileMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 12,
  },
});
