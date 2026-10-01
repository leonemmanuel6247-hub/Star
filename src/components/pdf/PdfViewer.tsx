import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile } from '../../types/office';

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
}

export default function PdfViewer({ file, onUpdateFile }: Props) {
  const [signee, setSignee] = useState(file.content?.signeeName || '');
  const [formFields, setFormFields] = useState<Record<string, string>>(
    file.content?.formFields || {}
  );
  const [page, setPage] = useState(1);
  const [agree, setAgree] = useState(false);

  const title = file.content?.title || file.name;
  const docRef = file.content?.docReference || '';

  const updateField = (key: string, value: string) => {
    const updated = { ...formFields, [key]: value };
    setFormFields(updated);
    onUpdateFile({
      content: {
        ...file.content,
        signeeName: signee,
        formFields: updated,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.docTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.docRef}>Réf : {docRef}</Text>
        </View>

        <View style={styles.docMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>
              {new Date().toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="document-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaText}>Page {page}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Signataire</Text>
          <TextInput
            value={signee}
            onChangeText={(v) => {
              setSignee(v);
              onUpdateFile({
                content: { ...file.content, signeeName: v, formFields },
              });
            }}
            placeholder="Nom du signataire"
            placeholderTextColor="#475569"
            style={styles.input}
          />
        </View>

        <Text style={styles.sectionTitle}>Formulaire</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Partie émettrice</Text>
          <TextInput
            value={formFields.party1 || ''}
            onChangeText={(v) => updateField('party1', v)}
            placeholder="Nom de la partie émettrice"
            placeholderTextColor="#475569"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Partie destinataire</Text>
          <TextInput
            value={formFields.party2 || ''}
            onChangeText={(v) => updateField('party2', v)}
            placeholder="Nom de la partie destinataire"
            placeholderTextColor="#475569"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date d'effet</Text>
          <TextInput
            value={formFields.effectiveDate || ''}
            onChangeText={(v) => updateField('effectiveDate', v)}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor="#475569"
            style={styles.input}
          />
        </View>

        <View style={styles.signatureArea}>
          <Ionicons name="create" size={36} color="#475569" />
          <Text style={styles.signatureHint}>
            Zone de signature (appuyez longuement pour signer)
          </Text>
        </View>

        <Pressable
          onPress={() => setAgree(!agree)}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
            {agree && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            J'accepte les termes de ce document
          </Text>
        </Pressable>
      </View>

      <View style={styles.bottomActions}>
        <Pressable
          onPress={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          style={[styles.pageBtn, page === 1 && { opacity: 0.4 }]}
        >
          <Ionicons name="chevron-back" size={16} color="#f1f5f9" />
          <Text style={styles.pageBtnText}>Précédent</Text>
        </Pressable>
        <Text style={styles.pageCounter}>Page {page}</Text>
        <Pressable
          onPress={() => setPage(page + 1)}
          style={styles.pageBtn}
        >
          <Text style={styles.pageBtnText}>Suivant</Text>
          <Ionicons name="chevron-forward" size={16} color="#f1f5f9" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  page: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    minHeight: 500,
  },
  pageHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#a855f7',
    paddingBottom: 12,
    marginBottom: 12,
  },
  docTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: 'bold',
  },
  docRef: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  docMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#475569',
    fontSize: 11,
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0f172a',
    fontSize: 13,
  },
  signatureArea: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  signatureHint: {
    color: '#64748b',
    fontSize: 11,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  checkboxLabel: {
    color: '#0f172a',
    fontSize: 12,
    flex: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  pageBtnText: {
    color: '#f1f5f9',
    fontSize: 12,
  },
  pageCounter: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
