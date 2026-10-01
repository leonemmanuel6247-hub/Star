import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppSettings, OfficeFile } from '../types/office';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  files: OfficeFile[];
  onSelectTab: (tab: string) => void;
  onOpenPinSetup: () => void;
  onExportAllData: () => void;
  onOpenSettings: () => void;
}

const NAV_ITEMS: Array<{ id: string; icon: any; label: string; color: string }> = [
  { id: 'home', icon: 'home', label: 'Accueil', color: '#6366f1' },
  { id: 'writer', icon: 'document-text', label: 'Writer', color: '#3b82f6' },
  { id: 'calc', icon: 'grid', label: 'Calc', color: '#10b981' },
  { id: 'impress', icon: 'easel', label: 'Impress', color: '#f59e0b' },
  { id: 'pdf', icon: 'document', label: 'PDF Studio', color: '#ef4444' },
  { id: 'files', icon: 'folder', label: 'Fichiers', color: '#a855f7' },
];

export default function DrawerMenu({
  isOpen,
  onClose,
  settings,
  files,
  onSelectTab,
  onOpenPinSetup,
  onExportAllData,
  onOpenSettings,
}: Props) {
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.overlay} />
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={styles.drawer}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>SO</Text>
              </View>
              <View>
                <Text style={styles.appName}>StarOffice</Text>
                <Text style={styles.subtitle}>{files.length} fichiers · {Math.round(totalSize / 1024)} Ko</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Modules</Text>
              {NAV_ITEMS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.navItem,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.navIcon, { backgroundColor: item.color + '22' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.navLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#475569" />
                </Pressable>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sécurité</Text>
              <Pressable onPress={onOpenPinSetup} style={styles.navItem}>
                <View style={[styles.navIcon, { backgroundColor: '#f59e0b22' }]}>
                  <Ionicons name="key" size={20} color="#f59e0b" />
                </View>
                <Text style={styles.navLabel}>
                  {settings.pinLockEnabled ? 'Changer le code PIN' : 'Configurer le PIN'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Données</Text>
              <Pressable onPress={onExportAllData} style={styles.navItem}>
                <View style={[styles.navIcon, { backgroundColor: '#3b82f622' }]}>
                  <Ionicons name="download" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.navLabel}>Sauvegarde</Text>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </Pressable>
              <Pressable
                onPress={() => {
                  onClose();
                  onOpenSettings();
                }}
                style={styles.navItem}
              >
                <View style={[styles.navIcon, { backgroundColor: '#a855f722' }]}>
                  <Ionicons name="settings" size={20} color="#a855f7" />
                </View>
                <Text style={styles.navLabel}>Paramètres</Text>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </Pressable>
            </View>

            <View style={{ flex: 1 }} />
            <Text style={styles.version}>StarOffice v1.0.0 · React Native</Text>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  appName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
    borderRadius: 8,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 14,
  },
  version: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
