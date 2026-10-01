import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppSettings } from '../../types/office';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onOpenPinSetup: () => void;
  onClearCache: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenPinSetup,
  onClearCache,
}: Props) {
  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#f1f5f9" />
          </Pressable>
          <Text style={styles.title}>Paramètres</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <Pressable onPress={onOpenPinSetup} style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="key" size={20} color="#f59e0b" />
              <View>
                <Text style={styles.rowLabel}>Verrouillage PIN</Text>
                <Text style={styles.rowSub}>
                  {settings.pinLockEnabled ? 'Activé' : 'Désactivé'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.pinLockEnabled}
              onValueChange={(v) => {
                if (v) onOpenPinSetup();
                else onUpdateSettings({ pinLockEnabled: false, pinCode: '' });
              }}
              trackColor={{ false: '#475569', true: '#a855f7' }}
            />
          </Pressable>

          <Text style={styles.sectionTitle}>Apparence</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="color-palette" size={20} color="#a855f7" />
              <Text style={styles.rowLabel}>Thème</Text>
            </View>
            <View style={styles.choiceGroup}>
              {(['light', 'dark', 'amoled'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => onUpdateSettings({ theme: t })}
                  style={[
                    styles.choiceChip,
                    settings.theme === t && styles.choiceChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      settings.theme === t && styles.choiceTextActive,
                    ]}
                  >
                    {t === 'light' ? 'Clair' : t === 'dark' ? 'Sombre' : 'AMOLED'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="language" size={20} color="#3b82f6" />
              <Text style={styles.rowLabel}>Langue</Text>
            </View>
            <View style={styles.choiceGroup}>
              {(['fr', 'en', 'es'] as const).map((l) => (
                <Pressable
                  key={l}
                  onPress={() => onUpdateSettings({ language: l })}
                  style={[
                    styles.choiceChip,
                    settings.language === l && styles.choiceChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      settings.language === l && styles.choiceTextActive,
                    ]}
                  >
                    {l.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Édition</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="save" size={20} color="#10b981" />
              <Text style={styles.rowLabel}>Sauvegarde automatique</Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={(v) => onUpdateSettings({ autoSave: v })}
              trackColor={{ false: '#475569', true: '#a855f7' }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="spell-check" size={20} color="#ef4444" />
              <Text style={styles.rowLabel}>Correction orthographique</Text>
            </View>
            <Switch
              value={settings.spellCheck}
              onValueChange={(v) => onUpdateSettings({ spellCheck: v })}
              trackColor={{ false: '#475569', true: '#a855f7' }}
            />
          </View>

          <Text style={styles.sectionTitle}>Stockage</Text>
          <Pressable onPress={onClearCache} style={styles.dangerBtn}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.dangerText}>Réinitialiser les documents</Text>
          </Pressable>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowLabel: {
    color: '#f1f5f9',
    fontSize: 13,
  },
  rowSub: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  choiceGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  choiceChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  choiceChipActive: {
    backgroundColor: '#a855f7',
  },
  choiceText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  choiceTextActive: {
    color: '#fff',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
