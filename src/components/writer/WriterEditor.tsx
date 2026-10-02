import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile } from '../../types/office';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 600;

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
  onCloseDocument: () => void;
  onNewDocument: () => void;
}

const RIBBON_TABS = [
  { id: 'file', label: 'Fichier', icon: 'document' as const },
  { id: 'home', label: 'Accueil', icon: 'home' as const },
  { id: 'insert', label: 'Insertion', icon: 'add' as const },
  { id: 'design', label: 'Conception', icon: 'color-palette' as const },
  { id: 'layout', label: 'Mise en page', icon: 'grid' as const },
  { id: 'references', label: 'Références', icon: 'book' as const },
  { id: 'mailings', label: 'Publipostage', icon: 'mail' as const },
  { id: 'review', label: 'Révision', icon: 'checkmark-circle' as const },
  { id: 'view', label: 'Affichage', icon: 'eye' as const },
];

const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];
const TEXT_COLORS = ['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#1864ab', '#c2255c'];

export default function WriterEditor({ file, onUpdateFile, onCloseDocument, onNewDocument }: Props) {
  const [activeTab, setActiveTab] = useState('home');
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [backstageOpen, setBackstageOpen] = useState(false);
  const [font, setFont] = useState('Calibri');
  const [fontSize, setFontSize] = useState(11);
  const [textColor, setTextColor] = useState('#000000');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [text, setText] = useState<string>(
    String(file.content?.html || '').replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim()
  );

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const pages = Math.max(1, Math.ceil(wordCount / 250));

  const handleTextChange = (newText: string) => {
    setText(newText);
    const wc = newText.split(/\s+/).filter(Boolean).length;
    onUpdateFile({ content: { html: `<p>${newText.split('\n').join('</p><p>')}</p>`, wordCount: wc } });
  };

  const applyTag = (tag: string) => {
    setText((prev) => `<${tag}>${prev}</${tag}>`);
  };

  const insertPageBreak = () => {
    setText((prev) => `${prev}\n\n--- Saut de page ---\n\n`);
  };

  const insertTable = () => {
    const rows = 3, cols = 3;
    let table = '\n\n| ';
    for (let c = 0; c < cols; c++) table += `Col ${c + 1} | `;
    table += '\n|';
    for (let c = 0; c < cols; c++) table += '---|';
    for (let r = 0; r < rows; r++) {
      table += '\n| ';
      for (let c = 0; c < cols; c++) table += `  ${r}${c}  | `;
    }
    setText((prev) => prev + table + '\n\n');
  };

  return (
    <View style={styles.container}>
      {/* Quick Access + Title bar */}
      <View style={styles.titleBar}>
        <Pressable style={styles.qaBtn} onPress={() => handleTextChange(text)}>
          <Ionicons name="save" size={16} color="#6366f1" />
        </Pressable>
        <Pressable style={styles.qaBtn} onPress={() => {}}>
          <Ionicons name="arrow-undo" size={16} color="#64748b" />
        </Pressable>
        <Pressable style={styles.qaBtn} onPress={() => {}}>
          <Ionicons name="arrow-redo" size={16} color="#64748b" />
        </Pressable>
        <View style={styles.divider} />
        <Ionicons name="document-text" size={16} color="#6366f1" />
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        <Text style={styles.appName}> - StarOffice Writer</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.qaBtn} onPress={onNewDocument}>
          <Ionicons name="add-circle" size={16} color="#6366f1" />
        </Pressable>
        <Pressable style={styles.qaBtn} onPress={onCloseDocument}>
          <Ionicons name="close" size={16} color="#64748b" />
        </Pressable>
      </View>

      {/* Ribbon Tabs */}
      <ScrollView horizontal style={styles.tabsBar} showsHorizontalScrollIndicator={false}>
        {RIBBON_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => tab.id === 'file' ? setBackstageOpen(true) : setActiveTab(tab.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Ionicons name={tab.icon} size={12} color={active ? '#a855f7' : '#64748b'} />
              {(!isMobile || active) && (
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Ribbon content */}
      <ScrollView horizontal style={styles.ribbon} showsHorizontalScrollIndicator={false}>
        {activeTab === 'home' && (
          <>
            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="cut" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="copy" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="clipboard" size={14} color="#475569" />
              </Pressable>
            </View>

            <View style={styles.ribbonGroup}>
              <Pressable style={styles.fontBtn} onPress={() => setShowFontMenu(!showFontMenu)}>
                <Text style={{ fontFamily: font, fontSize: 11, color: '#1e293b' }}>{font}</Text>
                <Ionicons name="chevron-down" size={10} color="#64748b" />
              </Pressable>
              <Pressable style={styles.fontBtn} onPress={() => setShowSizeMenu(!showSizeMenu)}>
                <Text style={{ fontSize: 11, color: '#1e293b' }}>{fontSize}</Text>
                <Ionicons name="chevron-down" size={10} color="#64748b" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => applyTag('b')}>
                <Ionicons name="bold" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => applyTag('i')}>
                <Ionicons name="italic" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => applyTag('u')}>
                <Ionicons name="underline" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => applyTag('strike')}>
                <Ionicons name="text-strike" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => setShowColorMenu(!showColorMenu)}>
                <Ionicons name="color-palette" size={14} color="#a855f7" />
              </Pressable>
            </View>

            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="text-align-left" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="text-align-center" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="text-align-right" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="list" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="list-number" size={14} color="#475569" />
              </Pressable>
            </View>

            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => applyTag('h1')}>
                <Text style={{ fontSize: 11, color: '#1e293b', fontWeight: 'bold' }}>H1</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => applyTag('h2')}>
                <Text style={{ fontSize: 11, color: '#1e293b', fontWeight: 'bold' }}>H2</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => applyTag('h3')}>
                <Text style={{ fontSize: 11, color: '#1e293b', fontWeight: 'bold' }}>H3</Text>
              </Pressable>
            </View>
          </>
        )}

        {activeTab === 'insert' && (
          <>
            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={insertPageBreak}>
                <Ionicons name="return-left" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Saut page</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={insertTable}>
                <Ionicons name="grid" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Tableau</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="image" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Image</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <Ionicons name="link" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Lien</Text>
              </Pressable>
            </View>
          </>
        )}

        {activeTab === 'view' && (
          <View style={styles.ribbonGroup}>
            <Pressable style={styles.ribbonBtn} onPress={() => setZoom(Math.max(50, zoom - 10))}>
              <Ionicons name="remove-circle" size={14} color="#475569" />
            </Pressable>
            <Text style={{ fontSize: 11, color: '#1e293b', marginHorizontal: 4 }}>{zoom}%</Text>
            <Pressable style={styles.ribbonBtn} onPress={() => setZoom(Math.min(200, zoom + 10))}>
              <Ionicons name="add-circle" size={14} color="#475569" />
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => { setShowRuler(!showRuler); }}>
              <Ionicons name="ruler" size={14} color={showRuler ? '#a855f7' : '#475569"} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Font menu */}
      {showFontMenu && (
        <View style={styles.dropdownMenu}>
          {FONTS.map((f) => (
            <Pressable key={f} style={styles.dropdownItem} onPress={() => { setFont(f); setShowFontMenu(false); }}>
              <Text style={{ fontFamily: f, fontSize: 12, color: '#1e293b' }}>{f}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Size menu */}
      {showSizeMenu && (
        <View style={styles.dropdownMenu}>
          {SIZES.map((s) => (
            <Pressable key={s} style={styles.dropdownItem} onPress={() => { setFontSize(s); setShowSizeMenu(false); }}>
              <Text style={{ fontSize: 12, color: '#1e293b' }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Color menu */}
      {showColorMenu && (
        <View style={[styles.dropdownMenu, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {TEXT_COLORS.map((c) => (
            <Pressable key={c} onPress={() => { setTextColor(c); setShowColorMenu(false); }}
              style={[styles.colorSwatch, { backgroundColor: c }]} />
          ))}
        </View>
      )}

      {/* Ruler */}
      {showRuler && (
        <View style={styles.ruler}>
          <View style={styles.rulerMargin} />
          <View style={styles.rulerMain}>
            {Array.from({ length: 25 }).map((_, i) => (
              <View key={i} style={[
                styles.rulerMark,
                { left: i * 12, height: i % 5 === 0 ? 10 : 5 }
              ]} />
            ))}
          </View>
        </View>
      )}

      {/* Editor area */}
      <ScrollView style={styles.editorArea} contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.page, { fontFamily: font, fontSize: fontSize, color: textColor }]}>
          <TextInput
            value={text}
            onChangeText={handleTextChange}
            multiline
            placeholder="Commencez à rédiger votre document..."
            placeholderTextColor="#94a3b8"
            style={[styles.textArea, { fontFamily: font, fontSize: fontSize, color: textColor }]}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Page 1 sur {pages} · {wordCount} mots · {charCount} caractères</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.statusText}>Français</Text>
          <View style={{ width: 8 }} />
          <Pressable onPress={() => setZoom(Math.max(50, zoom - 10))}>
            <Ionicons name="remove" size={12} color="#64748b" />
          </Pressable>
          <Text style={[styles.statusText, { marginHorizontal: 4 }]}>{zoom}%</Text>
          <Pressable onPress={() => setZoom(Math.min(200, zoom + 10))}>
            <Ionicons name="add" size={12} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Backstage view */}
      <Modal visible={backstageOpen} animationType="slide" transparent={false} onRequestClose={() => setBackstageOpen(false)}>
        <SafeAreaView style={{ flex: 1, flexDirection: 'row' }}>
          <View style={styles.backstageSidebar}>
            <Pressable style={styles.backstageBack} onPress={() => setBackstageOpen(false)}>
              <Ionicons name="close" size={14} color="#fff" />
              <Text style={styles.backstageBackText}>Retour</Text>
            </Pressable>
            {[
              { icon: 'information-circle' as const, label: 'Informations' },
              { icon: 'add-circle' as const, label: 'Nouveau' },
              { icon: 'folder-open' as const, label: 'Ouvrir' },
              { icon: 'save' as const, label: 'Enregistrer' },
              { icon: 'print' as const, label: 'Imprimer' },
              { icon: 'share' as const, label: 'Partager' },
              { icon: 'download' as const, label: 'Exporter' },
              { icon: 'close' as const, label: 'Fermer', action: onCloseDocument },
            ].map((item, i) => (
              <Pressable key={i} style={styles.backstageItem}
                onPress={() => { item.action?.(); setBackstageOpen(false); }}>
                <Ionicons name={item.icon} size={16} color="#fff" />
                <Text style={styles.backstageItemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.backstageContent}>
            <Text style={styles.backstageTitle}>{file.name}</Text>
            <Text style={styles.backstageSectionTitle}>Propriétés</Text>
            <Text style={styles.backstageProp}>Nom : {file.name}</Text>
            <Text style={styles.backstageProp}>Type : Document Writer (.docx)</Text>
            <Text style={styles.backstageProp}>Taille : {Math.round(file.size / 1024)} Ko</Text>
            <Text style={styles.backstageProp}>Modifié : {new Date(file.updatedAt).toLocaleString('fr-FR')}</Text>
            <Text style={styles.backstageProp}>Mots : {wordCount}</Text>
            <Text style={styles.backstageProp}>Pages estimées : {pages}</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  titleBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 6,
    backgroundColor: '#e2e8f0', borderBottomWidth: 1, borderBottomColor: '#cbd5e1',
  },
  qaBtn: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  divider: { width: 1, height: 16, backgroundColor: '#cbd5e1', marginHorizontal: 4 },
  fileName: { fontSize: 13, fontWeight: '600', color: '#1e293b', marginLeft: 4 },
  appName: { fontSize: 12, color: '#64748b' },
  tabsBar: { backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#cbd5e1' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#a855f7', backgroundColor: '#fff' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: '#475569' },
  tabLabelActive: { color: '#a855f7', fontWeight: '600' },
  ribbon: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingVertical: 6, paddingHorizontal: 4 },
  ribbonGroup: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  ribbonBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  ribbonLabel: { fontSize: 10, color: '#1e293b', marginLeft: 4 },
  fontBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  dropdownMenu: {
    position: 'absolute', top: 90, left: 100, zIndex: 100,
    backgroundColor: '#fff', borderRadius: 8, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 8, maxHeight: 240,
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  colorSwatch: { width: 24, height: 24, borderRadius: 4, margin: 4 },
  ruler: { height: 24, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', flexDirection: 'row' },
  rulerMargin: { width: 40, borderRightWidth: 1, borderRightColor: '#cbd5e1' },
  rulerMain: { flex: 1, position: 'relative' },
  rulerMark: { position: 'absolute', top: 0, width: 1, backgroundColor: '#94a3b8' },
  editorArea: { flex: 1, backgroundColor: '#94a3b8' },
  page: {
    backgroundColor: '#fff', minHeight: 800, padding: 40,
    marginHorizontal: 8, marginVertical: 8, borderRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 6,
  },
  textArea: { flex: 1, minHeight: 600, textAlignVertical: 'top', lineHeight: 22 },
  statusBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: '#e2e8f0', borderTopWidth: 1, borderTopColor: '#cbd5e1',
  },
  statusText: { fontSize: 11, color: '#475569' },
  backstageSidebar: {
    width: 220, backgroundColor: '#7e22ce', padding: 12,
  },
  backstageBack: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginBottom: 8 },
  backstageBackText: { color: '#fff', fontSize: 13 },
  backstageItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 4 },
  backstageItemText: { color: '#fff', fontSize: 13 },
  backstageContent: { flex: 1, padding: 24, backgroundColor: '#fff' },
  backstageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  backstageSectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 },
  backstageProp: { fontSize: 13, color: '#475569', marginBottom: 4 },
});
