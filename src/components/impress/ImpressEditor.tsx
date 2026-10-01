import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OfficeFile, Slide } from '../../types/office';

interface Props {
  file: OfficeFile;
  onUpdateFile: (partial: Partial<OfficeFile>) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ImpressEditor({ file, onUpdateFile }: Props) {
  const slides: Slide[] = file.content?.slides || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [presenterMode, setPresenterMode] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (slides.length === 0) {
      const newSlide: Slide = {
        id: 's-1',
        title: 'Nouvelle diapositive',
        subtitle: '',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        transition: 'fade',
        notes: '',
        elements: [],
      };
      onUpdateFile({
        content: { ...file.content, slides: [newSlide] },
      });
    }
  }, []);

  const slide = slides[currentIdx] || slides[0];

  if (!slide) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: '#94a3b8' }}>Aucune diapositive</Text>
      </View>
    );
  }

  const bgColors: Record<string, string> = {
    'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)': '#1e1b4b',
    'linear-gradient(135deg, #0f172a 0%, #334155 100%)': '#0f172a',
    'linear-gradient(135deg, #312e81 0%, #6d28d9 100%)': '#312e81',
  };
  const bgColor = bgColors[slide.background] || '#1e1b4b';

  const updateSlide = (partial: Partial<Slide>) => {
    const updated = slides.map((s) =>
      s.id === slide.id ? { ...s, ...partial } : s
    );
    onUpdateFile({ content: { ...file.content, slides: updated } });
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: `s-${Date.now()}`,
      title: 'Nouvelle diapositive',
      subtitle: '',
      background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      transition: 'fade',
      notes: '',
      elements: [],
    };
    const updated = [...slides, newSlide];
    onUpdateFile({ content: { ...file.content, slides: updated } });
    setCurrentIdx(updated.length - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Pressable onPress={addSlide} style={styles.toolBtn}>
          <Ionicons name="add-circle" size={18} color="#a855f7" />
          <Text style={styles.toolLabel}>Ajouter</Text>
        </Pressable>
        <Pressable
          onPress={() => setPresenterMode(true)}
          style={styles.toolBtn}
        >
          <Ionicons name="play" size={18} color="#10b981" />
          <Text style={styles.toolLabel}>Présenter</Text>
        </Pressable>
      </View>

      <View style={[styles.slideArea, { backgroundColor: bgColor }]}>
        <Text style={styles.slideTitle}>{slide.title || 'Sans titre'}</Text>
        {slide.subtitle ? (
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        ) : null}
        <Text style={styles.slideNum}>{currentIdx + 1} / {slides.length}</Text>
      </View>

      <View style={styles.navRow}>
        <Pressable
          disabled={currentIdx === 0}
          onPress={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
          style={[styles.navBtn, currentIdx === 0 && { opacity: 0.4 }]}
        >
          <Ionicons name="chevron-back" size={18} color="#f1f5f9" />
        </Pressable>
        <Pressable
          disabled={currentIdx >= slides.length - 1}
          onPress={() => setCurrentIdx(Math.min(slides.length - 1, currentIdx + 1))}
          style={[styles.navBtn, currentIdx >= slides.length - 1 && { opacity: 0.4 }]}
        >
          <Ionicons name="chevron-forward" size={18} color="#f1f5f9" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        ref={scrollRef}
        style={styles.thumbStrip}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        showsHorizontalScrollIndicator={false}
      >
        {slides.map((s, i) => {
          const tBg = bgColors[s.background] || '#1e1b4b';
          return (
            <Pressable
              key={s.id}
              onPress={() => setCurrentIdx(i)}
              style={[
                styles.thumb,
                { backgroundColor: tBg },
                i === currentIdx && styles.thumbActive,
              ]}
            >
              <Text style={styles.thumbText} numberOfLines={1}>
                {i + 1}. {s.title || 'Sans titre'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal visible={presenterMode} animationType="slide" onRequestClose={() => setPresenterMode(false)}>
        <SafeAreaView style={[styles.slideArea, { backgroundColor: bgColor, flex: 1 }]}>
          <Pressable
            onPress={() => setCurrentIdx(Math.min(slides.length - 1, currentIdx + 1))}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={styles.presenterTitle}>{slide.title}</Text>
            {slide.subtitle && (
              <Text style={styles.presenterSub}>{slide.subtitle}</Text>
            )}
            <Text style={styles.slideNum}>
              {currentIdx + 1} / {slides.length}
            </Text>
          </Pressable>
          <View style={styles.presenterBar}>
            <Pressable
              onPress={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              style={[styles.navBtn, currentIdx === 0 && { opacity: 0.3 }]}
            >
              <Ionicons name="chevron-back" size={22} color="#f1f5f9" />
              <Text style={styles.toolLabel}>Précédent</Text>
            </Pressable>
            <Pressable
              onPress={() => setPresenterMode(false)}
              style={styles.navBtn}
            >
              <Ionicons name="close" size={22} color="#ef4444" />
              <Text style={styles.toolLabel}>Quitter</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentIdx(Math.min(slides.length - 1, currentIdx + 1))}
              disabled={currentIdx >= slides.length - 1}
              style={[styles.navBtn, currentIdx >= slides.length - 1 && { opacity: 0.3 }]}
            >
              <Ionicons name="chevron-forward" size={22} color="#f1f5f9" />
              <Text style={styles.toolLabel}>Suivant</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  toolLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  slideArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 12,
    borderRadius: 12,
    minHeight: 300,
  },
  slideTitle: {
    color: '#f1f5f9',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slideSubtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  slideNum: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    color: '#64748b',
    fontSize: 11,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  thumbStrip: {
    maxHeight: 80,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  thumb: {
    width: 120,
    height: 64,
    marginHorizontal: 4,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: '#a855f7',
  },
  thumbText: {
    color: '#f1f5f9',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  presenterTitle: {
    color: '#f1f5f9',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  presenterSub: {
    color: '#cbd5e1',
    fontSize: 20,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  presenterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
});
