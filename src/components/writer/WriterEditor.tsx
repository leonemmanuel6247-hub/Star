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
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { OfficeFile } from '../../types/office';

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
  onCloseDocument: () => void;
  onNewDocument: () => void;
}

const RIBBON_TABS = [
  { id: 'file', label: 'Fichier', icon: 'file-document' as const },
  { id: 'home', label: 'Accueil', icon: 'home' as const },
  { id: 'insert', label: 'Insertion', icon: 'plus' as const },
  { id: 'design', label: 'Conception', icon: 'palette' as const },
  { id: 'layout', label: 'Mise en page', icon: 'page-layout-body' as const },
  { id: 'references', label: 'Références', icon: 'book-open' as const },
  { id: 'mailings', label: 'Publipostage', icon: 'email' as const },
  { id: 'review', label: 'Révision', icon: 'spell-check' as const },
  { id: 'view', label: 'Affichage', icon: 'eye' as const },
];

const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];
const TEXT_COLORS = ['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5', '#1864ab', '#c2255c'];

export default function WriterEditor({ file, onUpdateFile, onCloseDocument, onNewDocument }: Props) {
  const dims = useWindowDimensions();
  const isLandscape = dims.width > dims.height;
  const isMobile = Math.min(dims.width, dims.height) < 600;

  const [activeTab, setActiveTab] = useState('home');
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [backstageOpen, setBackstageOpen] = useState(false);
  const [font, setFont] = useState('Calibri');
  const [fontSize, setFontSize] = useState(11);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
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

  const wrapText = (prefix: string, suffix: string) => {
    setText((prev) => `${prefix}${prev}${suffix}`);
  };

  const insertAtEnd = (snippet: string) => {
    setText((prev) => `${prev}${snippet}`);
  };

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* Quick Access + Title bar */}
      <View style={styles.titleBar}>
        <Pressable style={styles.qaBtn} onPress={() => handleTextChange(text)}>
          <MaterialCommunityIcons name="content-save" size={16} color="#6366f1" />
        </Pressable>
        <Pressable style={styles.qaBtn} onPress={() => {}}>
          <MaterialCommunityIcons name="undo" size={16} color="#64748b" />
        </Pressable>
        <Pressable style={styles.qaBtn} onPress={() => {}}>
          <MaterialCommunityIcons name="redo" size={16} color="#64748b" />
        </Pressable>
        <View style={styles.divider} />
        <MaterialCommunityIcons name="file-document-outline" size={16} color="#6366f1" />
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        <Text style={styles.appName}> - StarOffice Writer</Text>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.qaBtn} onPress={onNewDocument}>
          <MaterialCommunityIcons name="file-plus" size={16} color="#6366f1" />
        </Pressable>
        <Pressable style={styles.qaBtn} onPress={onCloseDocument}>
          <MaterialCommunityIcons name="close" size={16} color="#64748b" />
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
              <MaterialCommunityIcons name={tab.icon} size={12} color={active ? '#a855f7' : '#64748b'} />
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
                <MaterialCommunityIcons name="content-cut" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="content-copy" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="content-paste" size={14} color="#475569" />
              </Pressable>
            </View>

            <View style={styles.ribbonGroup}>
              <Pressable style={styles.fontBtn} onPress={() => setShowFontMenu(!showFontMenu)}>
                <Text style={{ fontFamily: font, fontSize: 11, color: '#1e293b' }}>{font}</Text>
                <MaterialCommunityIcons name="chevron-down" size={10} color="#64748b" />
              </Pressable>
              <Pressable style={styles.fontBtn} onPress={() => setShowSizeMenu(!showSizeMenu)}>
                <Text style={{ fontSize: 11, color: '#1e293b' }}>{fontSize}</Text>
                <MaterialCommunityIcons name="chevron-down" size={10} color="#64748b" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<b>', '</b>')}>
                <MaterialCommunityIcons name="format-bold" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<i>', '</i>')}>
                <MaterialCommunityIcons name="format-italic" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<u>', '</u>')}>
                <MaterialCommunityIcons name="format-underline" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<s>', '</s>')}>
                <MaterialCommunityIcons name="format-strikethrough" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<sub>', '</sub>')}>
                <MaterialCommunityIcons name="format-subscript" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<sup>', '</sup>')}>
                <MaterialCommunityIcons name="format-superscript" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => setShowColorMenu(!showColorMenu)}>
                <MaterialCommunityIcons name="format-color-text" size={14} color="#a855f7" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => setShowHighlightMenu(!showHighlightMenu)}>
                <MaterialCommunityIcons name="format-color-highlight" size={14} color="#f59e0b" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => setText('')}>
                <MaterialCommunityIcons name="format-clear" size={14} color="#475569" />
              </Pressable>
            </View>

            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-align-left" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-align-center" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-align-right" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-align-justify" size={14} color="#475569" />
              </Pressable>
              <View style={styles.groupDivider} />
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-list-bulleted" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-list-numbered" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-quote-close" size={14} color="#475569" />
              </Pressable>
              <View style={styles.groupDivider} />
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-indent-decrease" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="format-indent-increase" size={14} color="#475569" />
              </Pressable>
            </View>

            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<h1>', '</h1>')}>
                <MaterialCommunityIcons name="format-header-1" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<h2>', '</h2>')}>
                <MaterialCommunityIcons name="format-header-2" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<h3>', '</h3>')}>
                <MaterialCommunityIcons name="format-header-3" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<p>', '</p>')}>
                <MaterialCommunityIcons name="format-paragraph" size={14} color="#475569" />
              </Pressable>
            </View>

            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="magnify" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="find-replace" size={14} color="#475569" />
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="select-all" size={14} color="#475569" />
              </Pressable>
            </View>
          </>
        )}

        {activeTab === 'insert' && (
          <>
            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('\n\n--- Saut de page ---\n\n')}>
                <MaterialCommunityIcons name="page-break" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Saut page</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('\n| Col1 | Col2 |\n|---|---|\n|  |  |\n')}>
                <MaterialCommunityIcons name="table" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Tableau</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => {}}>
                <MaterialCommunityIcons name="image" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Image</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('<a href="#">Lien</a>')}>
                <MaterialCommunityIcons name="link" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Lien</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('\n<hr/>\n')}>
                <MaterialCommunityIcons name="minus" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Ligne</Text>
              </Pressable>
            </View>
            <View style={styles.ribbonGroup}>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<h1>', '</h1>')}>
                <MaterialCommunityIcons name="format-header-1" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Titre 1</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<blockquote>', '</blockquote>')}>
                <MaterialCommunityIcons name="comment-quote" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Citation</Text>
              </Pressable>
              <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('<pre>code</pre>')}>
                <MaterialCommunityIcons name="code-braces" size={14} color="#475569" />
                <Text style={styles.ribbonLabel}>Code</Text>
              </Pressable>
            </View>
          </>
        )}

        {activeTab === 'design' && (
          <View style={styles.ribbonGroup}>
            <Pressable style={styles.ribbonBtn} onPress={() => setFont('Georgia')}>
              <MaterialCommunityIcons name="palette" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Thèmes</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => setTextColor('#1e40af')}>
              <MaterialCommunityIcons name="format-color-text" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Couleurs</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="water" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Filigrane</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="border-all" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Bordures</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'layout' && (
          <View style={styles.ribbonGroup}>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="page-layout-body" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Marges</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="page-layout-sidebar-left" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Orientation</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('\n\n--- Saut de page ---\n\n')}>
              <MaterialCommunityIcons name="page-break" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Saut page</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="view-column" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Colonnes</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'references' && (
          <View style={styles.ribbonGroup}>
            <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('\n## Table des matières\n')}>
              <MaterialCommunityIcons name="format-list-bulleted" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>TDM</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('<sup>1</sup>')}>
              <MaterialCommunityIcons name="numeric" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Note bas</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => wrapText('<blockquote>', '</blockquote>')}>
              <MaterialCommunityIcons name="comment-quote" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Citation</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'mailings' && (
          <View style={styles.ribbonGroup}>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="email-multiple" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Fusion</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => insertAtEnd('{{NOM}}')}>
              <MaterialCommunityIcons name="account" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Champ</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="eye" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Aperçu</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'review' && (
          <View style={styles.ribbonGroup}>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="spell-check" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Orthographe</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="translate" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Langue</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="counter" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Stats</Text>
            </Pressable>
            <View style={styles.groupDivider} />
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="history" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Suivi</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Accepter</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="undo" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Refuser</Text>
            </Pressable>
            <View style={styles.groupDivider} />
            <Pressable style={styles.ribbonBtn} onPress={() => {}}>
              <MaterialCommunityIcons name="comment-text" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>Commentaire</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'view' && (
          <View style={styles.ribbonGroup}>
            <Pressable style={styles.ribbonBtn} onPress={() => setZoom(Math.max(50, zoom - 10))}>
              <MaterialCommunityIcons name="magnify-minus" size={14} color="#475569" />
            </Pressable>
            <Text style={styles.zoomLabel}>{zoom}%</Text>
            <Pressable style={styles.ribbonBtn} onPress={() => setZoom(Math.min(200, zoom + 10))}>
              <MaterialCommunityIcons name="magnify-plus" size={14} color="#475569" />
            </Pressable>
            <View style={styles.groupDivider} />
            <Pressable style={styles.ribbonBtn} onPress={() => setShowRuler(!showRuler)}>
              <MaterialCommunityIcons
                name="ruler"
                size={14}
                color={showRuler ? '#a855f7' : '#475569'}
              />
              <Text style={styles.ribbonLabel}>Règle</Text>
            </Pressable>
            <Pressable style={styles.ribbonBtn} onPress={() => setZoom(100)}>
              <MaterialCommunityIcons name="aspect-ratio" size={14} color="#475569" />
              <Text style={styles.ribbonLabel}>100%</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Font menu dropdown */}
      {showFontMenu && (
        <View style={styles.dropdown}>
          {FONTS.map((f) => (
            <Pressable key={f} style={styles.dropdownItem} onPress={() => { setFont(f); setShowFontMenu(false); }}>
              <Text style={{ fontFamily: f, fontSize: 12, color: '#1e293b' }}>{f}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Size menu dropdown */}
      {showSizeMenu && (
        <View style={styles.dropdown}>
          {SIZES.map((s) => (
            <Pressable key={s} style={styles.dropdownItem} onPress={() => { setFontSize(s); setShowSizeMenu(false); }}>
              <Text style={{ fontSize: 12, color: '#1e293b' }}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Color menu */}
      {showColorMenu && (
        <View style={[styles.dropdown, { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 220 }]}>
          {TEXT_COLORS.map((c) => (
            <Pressable key={c} onPress={() => { setTextColor(c); setShowColorMenu(false); }}
              style={[styles.colorSwatch, { backgroundColor: c }]} />
          ))}
        </View>
      )}

      {/* Highlight menu */}
      {showHighlightMenu && (
        <View style={[styles.dropdown, { flexDirection: 'row', flexWrap: 'wrap', maxWidth: 220 }]}>
          {['#ffff00', '#fb923c', '#a3e635', '#60a5fa', '#c084fc'].map((c) => (
            <Pressable key={c} onPress={() => { setHighlightColor(c); setShowHighlightMenu(false); }}
              style={[styles.colorSwatch, { backgroundColor: c }]} />
          ))}
        </View>
      )}

      {/* Editor area - in landscape, allow horizontal split (ruler + page side by side conceptually) */}
      <ScrollView
        style={[styles.editorArea, isLandscape && styles.editorAreaLandscape]}
        contentContainerStyle={{ padding: 16 }}
        horizontal={isLandscape}
      >
        <View style={[styles.page, {
          fontFamily: font as any,
          fontSize: fontSize,
          color: textColor,
          width: isLandscape ? 'auto' : undefined,
          minWidth: isLandscape ? 600 : undefined,
        }]}>
          <TextInput
            value={text}
            onChangeText={handleTextChange}
            multiline
            placeholder="Commencez à rédiger votre document..."
            placeholderTextColor="#94a3b8"
            style={[styles.textArea, {
              fontFamily: font as any,
              fontSize: fontSize,
              color: textColor,
              lineHeight: fontSize * 1.5,
            }]}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Page 1 sur {pages} · {wordCount} mots · {charCount} caractères</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.statusText}>Français · {isLandscape ? 'Paysage' : 'Portrait'}</Text>
          <View style={{ width: 8 }} />
          <Pressable onPress={() => setZoom(Math.max(50, zoom - 10))}>
            <MaterialCommunityIcons name="magnify-minus" size={12} color="#64748b" />
          </Pressable>
          <Text style={[styles.statusText, { marginHorizontal: 4 }]}>{zoom}%</Text>
          <Pressable onPress={() => setZoom(Math.min(200, zoom + 10))}>
            <MaterialCommunityIcons name="magnify-plus" size={12} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Backstage view */}
      <Modal visible={backstageOpen} animationType="slide" transparent={false} onRequestClose={() => setBackstageOpen(false)}>
        <SafeAreaView style={{ flex: 1, flexDirection: 'row' }}>
          <View style={styles.backstageSidebar}>
            <Pressable style={styles.backstageBack} onPress={() => setBackstageOpen(false)}>
              <MaterialCommunityIcons name="close" size={14} color="#fff" />
              <Text style={styles.backstageBackText}>Retour</Text>
            </Pressable>
            {[
              { icon: 'information' as const, label: 'Informations' },
              { icon: 'file-plus' as const, label: 'Nouveau' },
              { icon: 'folder-open' as const, label: 'Ouvrir' },
              { icon: 'content-save' as const, label: 'Enregistrer' },
              { icon: 'printer' as const, label: 'Imprimer' },
              { icon: 'share' as const, label: 'Partager' },
              { icon: 'download' as const, label: 'Exporter' },
              { icon: 'close' as const, label: 'Fermer', action: onCloseDocument },
            ].map((item, i) => (
              <Pressable key={i} style={styles.backstageItem}
                onPress={() => { item.action?.(); setBackstageOpen(false); }}>
                <MaterialCommunityIcons name={item.icon} size={16} color="#fff" />
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
            <Text style={styles.backstageProp}>Caractères : {charCount}</Text>
            <Text style={styles.backstageProp}>Pages estimées : {pages}</Text>
            <Text style={styles.backstageProp}>Orientation : {isLandscape ? 'Paysage' : 'Portrait'}</Text>
            <Text style={styles.backstageProp}>Écran : {Math.round(dims.width)}×{Math.round(dims.height)}</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  containerLandscape: { flexDirection: 'column' },
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
  groupDivider: { width: 1, height: 16, backgroundColor: '#cbd5e1', marginHorizontal: 4 },
  ribbonBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ribbonLabel: { fontSize: 10, color: '#1e293b' },
  zoomLabel: { fontSize: 11, color: '#1e293b', marginHorizontal: 4 },
  fontBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  dropdown: {
    position: 'absolute', top: 90, left: 100, zIndex: 100,
    backgroundColor: '#fff', borderRadius: 8, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 8, maxHeight: 240,
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  colorSwatch: { width: 24, height: 24, borderRadius: 4, margin: 4 },
  editorArea: { flex: 1, backgroundColor: '#94a3b8' },
  editorAreaLandscape: { backgroundColor: '#94a3b8' },
  page: {
    backgroundColor: '#fff', minHeight: 600, padding: 40,
    marginHorizontal: 8, marginVertical: 8, borderRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 6,
  },
  textArea: { flex: 1, minHeight: 500, textAlignVertical: 'top' },
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
