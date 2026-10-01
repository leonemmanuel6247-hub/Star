import React, { useState } from 'react';
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
import type { OfficeFile, DocumentType } from '../../types/office';

interface Props {
  files: OfficeFile[];
  onOpenFile: (file: OfficeFile) => void;
  onNewFile: (type: DocumentType) => void;
  onOpenTemplates: () => void;
  onToggleFavorite: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

const QUICK: Array<{ type: DocumentType; icon: any; color: string; label: string }> = [
  { type: 'writer', icon: 'document-text', color: '#3b82f6', label: 'Writer' },
  { type: 'calc', icon: 'grid', color: '#10b981', label: 'Calc' },
  { type: 'impress', icon: 'easel', color: '#f59e0b', label: 'Impress' },
  { type: 'pdf', icon: 'document', color: '#ef4444', label: 'PDF' },
];

export default function HomeView({
  files,
  onOpenFile,
  onNewFile,
  onOpenTemplates,
  onToggleFavorite,
  onDeleteFile,
  onNavigateToTab,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'recent' | 'favorites'>('recent');

  const recent = [...files]
    .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 20);

  const favorites = files
    .filter((f) => f.isFavorite && (!search || f.name.toLowerCase().includes(search.toLowerCase())))
    .slice(0, 20);

  const list = filter === 'recent' ? recent : favorites;

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour 👋</Text>
        <Text style={styles.appName}>StarOffice Mobile</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un fichier..."
          placeholderTextColor="#475569"
          style={styles.search}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.quickGrid}>
          {QUICK.map((q) => (
            <Pressable
              key={q.type}
              onPress={() => onNewFile(q.type)}
              style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.8 }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: q.color + '22' }]}>
                <Ionicons name={q.icon} size={26} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
              <Text style={styles.quickSubLabel}>Nouveau document</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rowHeader}>
          <Pressable onPress={() => setFilter('recent')}>
            <Text style={[styles.sectionTitle, filter === 'recent' && styles.sectionTitleActive]}>
              Récents
            </Text>
          </Pressable>
          <Pressable onPress={() => setFilter('favorites')}>
            <Text style={[styles.sectionTitle, filter === 'favorites' && styles.sectionTitleActive]}>
              Favoris
            </Text>
          </Pressable>
        </View>

        {list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={36} color="#475569" />
            <Text style={styles.emptyText}>Aucun fichier {filter === 'favorites' ? 'favori' : 'récent'}</Text>
            <Pressable onPress={onOpenTemplates} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Voir les modèles</Text>
            </Pressable>
          </View>
        ) : (
          list.map((file) => (
            <Pressable
              key={file.id}
              onPress={() => onOpenFile(file)}
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
                    hour: '2-digit',
                    minute: '2-digit',
                  })} · {Math.round(file.size / 1024)} Ko
                </Text>
              </View>
              {file.isFavorite && (
                <Ionicons name="star" size={16} color="#f59e0b" />
              )}
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 13,
  },
  appName: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  search: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionTitleActive: {
    color: '#a855f7',
  },
  rowHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
  },
  quickSubLabel: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
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
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  emptyBtn: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
