import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasActiveFile: boolean;
}

const TABS: Array<{ id: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { id: 'home', icon: 'home', label: 'Accueil' },
  { id: 'writer', icon: 'document-text', label: 'Writer' },
  { id: 'calc', icon: 'grid', label: 'Calc' },
  { id: 'impress', icon: 'easel', label: 'Impress' },
  { id: 'pdf', icon: 'document', label: 'PDF' },
  { id: 'files', icon: 'folder', label: 'Fichiers' },
];

export default function BottomNavBar({ activeTab, onTabChange, hasActiveFile }: Props) {
  if (hasActiveFile) return null;

  return (
    <View style={styles.container}>
      {TABS.map((t) => {
        const active = activeTab === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onTabChange(t.id)}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons
                name={t.icon as any}
                size={22}
                color={active ? '#a855f7' : '#94a3b8'}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 4,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  label: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  labelActive: {
    color: '#a855f7',
    fontWeight: '600',
  },
});
