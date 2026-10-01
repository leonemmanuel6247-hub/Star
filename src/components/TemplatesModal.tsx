import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile, DocumentType } from '../types/office';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (data: Partial<OfficeFile>) => void;
}

interface Template {
  id: string;
  name: string;
  type: DocumentType;
  extension: string;
  icon: any;
  color: string;
  description: string;
  content: any;
}

const TEMPLATES: Template[] = [
  {
    id: 'tpl-cv',
    name: 'CV_Professionnel.docx',
    type: 'writer',
    extension: '.docx',
    icon: 'person-circle',
    color: '#3b82f6',
    description: 'Modèle de CV simple et élégant',
    content: {
      html: '<h1>Prénom Nom</h1><p>Email : votre.email@exemple.com | Téléphone : +33 6 00 00 00 00</p><h2>Expérience professionnelle</h2><p><strong>2022 - Aujourd\'hui</strong> · Poste · Entreprise</p><p>Description de vos missions principales...</p><h2>Formation</h2><p><strong>2018 - 2022</strong> · Diplôme · Université</p>',
      wordCount: 60,
    },
  },
  {
    id: 'tpl-letter',
    name: 'Lettre_Officielle.docx',
    type: 'writer',
    extension: '.docx',
    icon: 'mail',
    color: '#3b82f6',
    description: 'Lettre professionnelle formatée',
    content: {
      html: '<p align="right">Votre Nom<br/>Votre Adresse<br/>Votre Email</p><p align="left">Destinataire<br/>Adresse du destinataire</p><p align="right">Le 1er octobre 2026</p><p><strong>Objet :</strong> </p><p>Madame, Monsieur,</p><p>...</p><p>Veuillez agréer mes salutations distinguées.</p>',
      wordCount: 50,
    },
  },
  {
    id: 'tpl-budget',
    name: 'Budget_Mensuel.xlsx',
    type: 'calc',
    extension: '.xlsx',
    icon: 'cash',
    color: '#10b981',
    description: 'Tableau budgétaire mensuel',
    content: {
      sheets: [
        {
          id: 'sh-1',
          name: 'Budget',
          rowCount: 15,
          colCount: 4,
          frozenRows: 1,
          frozenCols: 0,
          data: {
            A1: { value: 'Catégorie', bold: true },
            B1: { value: 'Budget', bold: true },
            C1: { value: 'Dépenses', bold: true },
            D1: { value: 'Écart', bold: true },
            A2: { value: 'Loyer' },
            B2: { value: 800 },
            C2: { value: 800 },
            D2: { value: '=C2-B2' },
            A3: { value: 'Courses' },
            B3: { value: 350 },
            C3: { value: 0 },
            D3: { value: '=C3-B3' },
            A4: { value: 'Transport' },
            B4: { value: 120 },
            C4: { value: 0 },
            D4: { value: '=C4-B4' },
            B6: { value: 'Total', bold: true },
            C6: { value: '=SUM(C2:C4)', bold: true },
            D6: { value: '=SUM(D2:D4)', bold: true },
          },
        },
      ],
    },
  },
  {
    id: 'tpl-invoice',
    name: 'Facture_Modele.xlsx',
    type: 'calc',
    extension: '.xlsx',
    icon: 'receipt',
    color: '#10b981',
    description: 'Facture simple avec TVA',
    content: {
      sheets: [
        {
          id: 'sh-1',
          name: 'Facture',
          rowCount: 12,
          colCount: 4,
          frozenRows: 1,
          frozenCols: 0,
          data: {
            A1: { value: 'Désignation', bold: true },
            B1: { value: 'Qté', bold: true },
            C1: { value: 'PU', bold: true },
            D1: { value: 'Total', bold: true },
            A2: { value: 'Service 1' },
            B2: { value: 1 },
            C2: { value: 100 },
            D2: { value: '=B2*C2' },
            A3: { value: 'Service 2' },
            B3: { value: 2 },
            C3: { value: 50 },
            D3: { value: '=B3*C3' },
            D5: { value: '=SUM(D2:D3)', bold: true },
            D6: { value: '=D5*0.2', bold: true },
            A7: { value: 'TOTAL TTC', bold: true },
            D7: { value: '=D5+D6', bold: true },
          },
        },
      ],
    },
  },
  {
    id: 'tpl-pitch',
    name: 'Pitch_Startup.pptx',
    type: 'impress',
    extension: '.pptx',
    icon: 'rocket',
    color: '#f59e0b',
    description: 'Présentation pour startup',
    content: {
      slides: [
        {
          id: 's-1',
          title: 'Ma Startup',
          subtitle: 'Pitch Deck 2026',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          transition: 'fade',
          notes: '',
          elements: [],
        },
        {
          id: 's-2',
          title: 'Le Problème',
          subtitle: '85% des utilisateurs...',
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          transition: 'slide',
          notes: '',
          elements: [],
        },
        {
          id: 's-3',
          title: 'Notre Solution',
          subtitle: 'Simple et puissante',
          background: 'linear-gradient(135deg, #312e81 0%, #6d28d9 100%)',
          transition: 'fade',
          notes: '',
          elements: [],
        },
      ],
    },
  },
  {
    id: 'tpl-nda',
    name: 'Accord_Confidentialite.pdf',
    type: 'pdf',
    extension: '.pdf',
    icon: 'shield-checkmark',
    color: '#ef4444',
    description: 'Formulaire de NDA',
    content: {
      title: 'Accord de Confidentialité',
      docReference: `NDA-${new Date().getFullYear()}-001`,
      totalPages: 1,
      signeeName: '',
      formFields: {
        party1: 'Nom partie 1',
        party2: 'Nom partie 2',
        effectiveDate: new Date().toISOString().split('T')[0],
      },
      annotations: [],
    },
  },
];

export default function TemplatesModal({ isOpen, onClose, onSelectTemplate }: Props) {
  const [filter, setFilter] = useState<'all' | DocumentType>('all');

  const filtered = filter === 'all'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.type === filter);

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#f1f5f9" />
          </Pressable>
          <Text style={styles.title}>Modèles</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.filters}>
          {(['all', 'writer', 'calc', 'impress', 'pdf'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? 'Tous' : f === 'writer' ? 'Writer' : f === 'calc' ? 'Calc' : f === 'impress' ? 'Impress' : 'PDF'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {filtered.map((tpl) => (
            <Pressable
              key={tpl.id}
              onPress={() => {
                onSelectTemplate(tpl);
                onClose();
              }}
              style={({ pressed }) => [
                styles.templateCard,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.tplIcon, { backgroundColor: tpl.color + '22' }]}>
                <Ionicons name={tpl.icon} size={24} color={tpl.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tplName}>{tpl.name}</Text>
                <Text style={styles.tplDesc}>{tpl.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </Pressable>
          ))}
        </ScrollView>
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
  filters: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1e293b',
  },
  filterChipActive: {
    backgroundColor: '#a855f7',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#fff',
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tplIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplName: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  tplDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
});
