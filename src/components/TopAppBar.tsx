import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile } from '../types/office';

interface Props {
  currentFile: OfficeFile | null;
  activeTab: string;
  onOpenDrawer: () => void;
  onBackToHome: () => void;
  onRenameFile: (newName: string) => void;
  onOpenExport: () => void;
  onLockApp: () => void;
  pinEnabled: boolean;
}

export default function TopAppBar({
  currentFile,
  activeTab,
  onOpenDrawer,
  onBackToHome,
  onRenameFile,
  onOpenExport,
  onLockApp,
  pinEnabled,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(currentFile?.name || '');

  React.useEffect(() => {
    setTempName(currentFile?.name || '');
  }, [currentFile?.name]);

  const tabLabel: Record<string, string> = {
    home: 'StarOffice',
    writer: 'Writer',
    calc: 'Calc',
    impress: 'Impress',
    pdf: 'PDF Studio',
    files: 'Mes fichiers',
  };

  return (
    <View style={styles.container}>
      {currentFile ? (
        <Pressable onPress={onBackToHome} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#f1f5f9" />
        </Pressable>
      ) : (
        <Pressable onPress={onOpenDrawer} style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color="#f1f5f9" />
        </Pressable>
      )}

      <View style={styles.titleWrap}>
        {isRenaming && currentFile ? (
          <TextInput
            value={tempName}
            onChangeText={setTempName}
            autoFocus
            selectTextOnFocus
            onSubmitEditing={() => {
              if (tempName.trim()) onRenameFile(tempName.trim());
              setIsRenaming(false);
            }}
            onBlur={() => {
              if (tempName.trim() && tempName !== currentFile.name) {
                onRenameFile(tempName.trim());
              }
              setIsRenaming(false);
            }}
            style={styles.titleInput}
            placeholder="Nom du fichier"
            placeholderTextColor="#64748b"
          />
        ) : (
          <Pressable
            onPress={() => currentFile && setIsRenaming(true)}
            disabled={!currentFile}
          >
            <Text style={styles.title} numberOfLines={1}>
              {currentFile ? currentFile.name : tabLabel[activeTab] || 'StarOffice'}
            </Text>
            {currentFile && (
              <Text style={styles.subtitle}>
                Appuyez pour renommer
              </Text>
            )}
          </Pressable>
        )}
      </View>

      <View style={styles.rightActions}>
        {currentFile && (
          <Pressable onPress={onOpenExport} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={22} color="#a855f7" />
          </Pressable>
        )}
        {pinEnabled && (
          <Pressable onPress={onLockApp} style={styles.iconBtn}>
            <Ionicons name="lock-closed" size={20} color="#f1f5f9" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    height: 56,
    paddingHorizontal: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  titleInput: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#a855f7',
    paddingVertical: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
