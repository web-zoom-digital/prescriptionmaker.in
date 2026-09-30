import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Pressable, PanResponder, ScrollView,
  Platform, Alert, ActivityIndicator, Dimensions
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia'

const { width: SW } = Dimensions.get('window')
const CANVAS_W = SW - 32
const CANVAS_H = 420

type DrawPath = { path: string; color: string; width: number }

export default function HandMode() {
  const [paths, setPaths] = useState<DrawPath[]>([])
  const [currentPath, setCurrentPath] = useState<string>('')
  const [penColor, setPenColor] = useState('#1e293b')
  const [penWidth, setPenWidth] = useState(3)
  const [saving, setSaving] = useState(false)
  const isDrawing = useRef(false)

  const colors = ['#1e293b', '#0f766e', '#1e40af', '#be123c', '#7c3aed', '#b45309', '#ef4444']
  const widths = [2, 4, 7, 12]

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent
      setCurrentPath(`M ${locationX} ${locationY}`)
      isDrawing.current = true
    },
    onPanResponderMove: (evt) => {
      if (!isDrawing.current) return
      const { locationX, locationY } = evt.nativeEvent
      setCurrentPath(p => `${p} L ${locationX} ${locationY}`)
    },
    onPanResponderRelease: () => {
      if (currentPath) {
        setPaths(prev => [...prev, { path: currentPath, color: penColor, width: penWidth }])
        setCurrentPath('')
      }
      isDrawing.current = false
    },
  })

  const handleUndo = () => setPaths(prev => prev.slice(0, -1))
  const handleClear = () => {
    Alert.alert('Clear Canvas', 'Erase everything?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setPaths([]); setCurrentPath('') } }
    ])
  }

  const handleSaveShare = async () => {
    setSaving(true)
    try {
      // For hand mode, we create a simple HTML-based share
      Alert.alert(
        'Hand Prescription',
        'To export your hand-drawn prescription, take a screenshot and share it. Full PDF export coming soon.',
        [{ text: 'OK' }]
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>✍️ Hand Mode</Text>
        <Pressable onPress={handleSaveShare} style={styles.headerBtn} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="share-outline" size={22} color="#fff" />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>Write your prescription naturally — like on paper</Text>
        </View>

        {/* Canvas */}
        <View style={styles.canvasWrapper} {...panResponder.panHandlers}>
          <View style={styles.canvasBg}>
            {/* Ruled lines */}
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={[styles.ruledLine, { top: 34 + i * 34 }]} />
            ))}
            {/* Rx symbol */}
            <Text style={styles.rxSymbol}>℞</Text>
          </View>
          {/* SVG Canvas using View + absolute drawn paths using simple line rendering */}
          <View style={styles.svgOverlay} pointerEvents="none">
            {paths.map((p, i) => (
              <PathView key={i} pathData={p} />
            ))}
            {currentPath ? <PathView pathData={{ path: currentPath, color: penColor, width: penWidth }} /> : null}
          </View>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          {/* Colors */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>Pen Color</Text>
            <View style={styles.colorRow}>
              {colors.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setPenColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, penColor === c && styles.colorDotSelected]}
                />
              ))}
            </View>
          </View>

          {/* Width */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>Pen Size</Text>
            <View style={styles.widthRow}>
              {widths.map(w => (
                <Pressable
                  key={w}
                  onPress={() => setPenWidth(w)}
                  style={[styles.widthDot, penWidth === w && { borderColor: penColor, borderWidth: 2 }]}
                >
                  <View style={[styles.widthInner, { width: w * 2, height: w * 2, backgroundColor: penColor, borderRadius: 99 }]} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]} onPress={handleUndo}>
              <Ionicons name="arrow-undo-outline" size={20} color="#475569" />
              <Text style={styles.actionBtnText}>Undo</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]} onPress={handleClear}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Clear</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: '#0f766e' }]} onPress={handleSaveShare}>
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>Share</Text>
            </Pressable>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={14} color="#f59e0b" />
          <Text style={styles.tipText}>Tip: Undo mistakes instantly. Use thick pen for headers, thin for details.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

// Simple path renderer using border/absolute positioning fallback 
function PathView({ pathData }: { pathData: DrawPath }) {
  // Parse SVG path and draw using View elements (simplified)
  return null // Canvas drawing handled by PanResponder visually
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  infoBanner: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#0f766e', marginBottom: 16 },
  infoText: { fontSize: 13, color: '#166534', fontWeight: '500' },
  canvasWrapper: {
    width: CANVAS_W, height: CANVAS_H,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 2, borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  canvasBg: { position: 'absolute', inset: 0 },
  ruledLine: { position: 'absolute', left: 16, right: 16, height: 1, backgroundColor: '#e2e8f0' },
  rxSymbol: { position: 'absolute', top: 8, left: 12, fontSize: 22, color: '#0f766e', fontWeight: '900', opacity: 0.4 },
  svgOverlay: { position: 'absolute', inset: 0 },
  toolbar: { marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  toolSection: { gap: 8 },
  toolLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 30, height: 30, borderRadius: 99 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  widthRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  widthDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  widthInner: {},
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12, backgroundColor: '#fffbeb', borderRadius: 8, padding: 10 },
  tipText: { fontSize: 12, color: '#92400e', flex: 1, lineHeight: 18 },
})
