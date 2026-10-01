import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  mode: 'unlock' | 'setup';
  currentPin: string;
  onSuccess: (newPin?: string) => void;
  onCancel: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

export default function PinLockModal({ mode, currentPin, onSuccess, onCancel }: Props) {
  const [entry, setEntry] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'first' | 'confirm'>('first');

  useEffect(() => {
    if (mode === 'unlock' && entry.length === 4) {
      if (entry === currentPin) {
        onSuccess();
      } else {
        setError('Code PIN incorrect');
        setTimeout(() => {
          setEntry('');
          setError('');
        }, 800);
      }
    } else if (mode === 'setup' && entry.length === 4 && stage === 'first') {
      setStage('confirm');
    } else if (mode === 'setup' && stage === 'confirm' && confirm.length === 4) {
      if (entry === confirm) {
        onSuccess(entry);
      } else {
        setError('Les codes ne correspondent pas');
        setTimeout(() => {
          setEntry('');
          setConfirm('');
          setStage('first');
          setError('');
        }, 800);
      }
    }
  }, [entry, confirm, stage, mode, currentPin, onSuccess]);

  const handleKey = (k: string) => {
    setError('');
    if (mode === 'setup' && stage === 'confirm') {
      if (confirm.length < 4) setConfirm(confirm + k);
    } else {
      if (entry.length < 4) setEntry(entry + k);
    }
  };

  const handleDelete = () => {
    if (mode === 'setup' && stage === 'confirm') {
      setConfirm(confirm.slice(0, -1));
    } else {
      setEntry(entry.slice(0, -1));
    }
  };

  const display = mode === 'setup' && stage === 'confirm' ? confirm : entry;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={28} color="#a855f7" />
          </View>
          <Text style={styles.title}>
            {mode === 'unlock' ? 'Déverrouiller' : 'Configurer le PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'unlock'
              ? 'Saisissez votre code à 4 chiffres'
              : stage === 'first'
              ? 'Choisissez un code à 4 chiffres'
              : 'Confirmez votre code'}
          </Text>

          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[styles.dot, i < display.length && styles.dotActive]}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.keypad}>
            {KEYS.map((k, idx) => {
              if (k === '') return <View key={idx} style={styles.key} />;
              if (k === 'back') {
                return (
                  <Pressable key={idx} onPress={handleDelete} style={styles.key}>
                    <Ionicons name="backspace-outline" size={24} color="#f1f5f9" />
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleKey(k)}
                  style={({ pressed }) => [
                    styles.key,
                    pressed && { backgroundColor: '#334155' },
                  ]}
                >
                  <Text style={styles.keyLabel}>{k}</Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'setup' && (
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  dots: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  dotActive: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  key: {
    width: 64,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 16,
    padding: 8,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 13,
  },
});
