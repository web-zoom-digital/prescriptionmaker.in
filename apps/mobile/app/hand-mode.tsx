import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Platform, Alert, ActivityIndicator, Dimensions, PanResponder
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path } from 'react-native-svg'

const { width: SW, height: SH } = Dimensions.get('window')
const CANVAS_W = SW - 32
const CANVAS_H = Math.min(360, SH * 0.42)

type DrawnPath = { d: string; color: string; width: number }

export default function HandMode() {
  const [paths, setPaths] = useState<DrawnPath[]>([])
  const currentPathRef = useRef<string>('')
  const [renderKey, setRenderKey] = useState(0)
  const [penColor, setPenColor] = useState('#1e293b')
  const [penWidth, setPenWidth] = useState(3)
  const [saving, setSaving] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true) // KEY: toggle scroll when drawing
  const isDrawing = useRef(false)
  const currentPathData = useRef<DrawnPath | null>(null)

  const COLORS = [
    { color: '#1e293b', label: 'Black' },
    { color: '#0f766e', label: 'Teal' },
    { color: '#1e40af', label: 'Blue' },
    { color: '#be123c', label: 'Red' },
    { color: '#7c3aed', label: 'Purple' },
    { color: '#d97706', label: 'Amber' },
    { color: '#ef4444', label: 'Orange' },
  ]
  const WIDTHS = [2, 4, 7, 12]

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Disable page scroll when finger touches canvas
        setScrollEnabled(false)
        const { locationX, locationY } = evt.nativeEvent
        const startPath = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`
        currentPathRef.current = startPath
        currentPathData.current = { d: startPath, color: penColor, width: penWidth }
        isDrawing.current = true
        setRenderKey(k => k + 1)
      },
      onPanResponderMove: (evt) => {
        if (!isDrawing.current) return
        const { locationX, locationY } = evt.nativeEvent
        currentPathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`
        if (currentPathData.current) {
          currentPathData.current = { ...currentPathData.current, d: currentPathRef.current }
        }
        setRenderKey(k => k + 1)
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current && currentPathData.current) {
          setPaths(prev => [...prev, { ...currentPathData.current! }])
        }
        currentPathRef.current = ''
        currentPathData.current = null
        isDrawing.current = false
        // Re-enable page scroll after finger lifts
        setScrollEnabled(true)
        setRenderKey(k => k + 1)
      },
      onPanResponderTerminate: () => {
        isDrawing.current = false
        setScrollEnabled(true)
        setRenderKey(k => k + 1)
      },
    })
  ).current

  const handleUndo = () => setPaths(prev => prev.slice(0, -1))

  const handleClear = () => {
    Alert.alert('Clear Canvas', 'Erase everything?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {
        setPaths([])
        currentPathRef.current = ''
        currentPathData.current = null
        setRenderKey(k => k + 1)
      }}
    ])
  }

  const handleShare = async () => {
    if (paths.length === 0) {
      Alert.alert('Empty Canvas', 'Please draw your prescription first.')
      return
    }
    setSaving(true)
    try {
      // Dynamic import to avoid web bundling issues
      const Print = await import('expo-print')
      const Sharing = await import('expo-sharing')
      const FileSystem = await import('expo-file-system')

      const pathEls = paths.map(p =>
        `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      ).join('\n')

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}">
        <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="white"/>
        ${Array.from({ length: 11 }).map((_, i) =>
          `<line x1="16" y1="${30 + i * 32}" x2="${CANVAS_W - 16}" y2="${30 + i * 32}" stroke="#e2e8f0" stroke-width="1"/>`
        ).join('')}
        ${pathEls}
      </svg>`

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#fff;font-family:Arial,sans-serif;}h3{color:#0f766e;margin-bottom:10px;}.footer{color:#94a3b8;font-size:11px;margin-top:12px;}</style></head><body><h3>✍️ Hand-written Prescription</h3>${svg}<p class="footer">PrescriptionMaker.in · ${new Date().toLocaleDateString('en-IN')}</p></body></html>`

      const { uri } = await Print.printToFileAsync({ html, base64: false })
      const dest = `${FileSystem.documentDirectory}hand_rx_${Date.now()}.pdf`
      await FileSystem.moveAsync({ from: uri, to: dest })
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Share Hand Prescription' })
    } catch (err: any) {
      Alert.alert('Export Error', err.message)
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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>✍️ Hand Mode</Text>
          <Text style={styles.headerSub}>{paths.length} stroke{paths.length !== 1 ? 's' : ''} · {scrollEnabled ? 'Scroll mode' : '✏️ Drawing...'}</Text>
        </View>
        <Pressable onPress={handleShare} style={[styles.shareBtn, saving && { opacity: 0.6 }]} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="share-outline" size={15} color="#fff" /><Text style={styles.shareBtnText}>PDF</Text></>
          }
        </Pressable>
      </View>

      {/* ScrollView — disabled while drawing, enabled rest of time */}
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status hint */}
        <View style={[styles.statusBar, !scrollEnabled && styles.statusBarDrawing]}>
          <Ionicons
            name={scrollEnabled ? 'hand-right-outline' : 'pencil'}
            size={14}
            color={scrollEnabled ? '#0369a1' : '#166534'}
          />
          <Text style={[styles.statusText, !scrollEnabled && { color: '#166534' }]}>
            {scrollEnabled
              ? 'Touch canvas to draw · Scroll freely outside canvas'
              : '✏️ Drawing — lift finger to scroll again'}
          </Text>
        </View>

        {/* Canvas */}
        <View style={styles.canvasOuter}>
          <View style={styles.canvasWrapper} {...panResponder.panHandlers}>
            {/* Lined paper */}
            <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill} pointerEvents="none">
              {Array.from({ length: 11 }).map((_, i) => (
                <Path
                  key={i}
                  d={`M16,${30 + i * 32} L${CANVAS_W - 16},${30 + i * 32}`}
                  stroke="#e2e8f0" strokeWidth={1} fill="none"
                />
              ))}
            </Svg>

            {/* All drawn strokes */}
            <Svg key={renderKey} width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p, i) => (
                <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.width}
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {/* Live stroke being drawn right now */}
              {currentPathData.current && (
                <Path
                  d={currentPathData.current.d}
                  stroke={currentPathData.current.color}
                  strokeWidth={currentPathData.current.width}
                  fill="none" strokeLinecap="round" strokeLinejoin="round"
                />
              )}
            </Svg>

            {paths.length === 0 && (
              <View style={styles.placeholder} pointerEvents="none">
                <Text style={styles.placeholderIcon}>✍️</Text>
                <Text style={styles.placeholderText}>Tap and drag to write</Text>
              </View>
            )}
          </View>
        </View>

        {/* Toolbar card */}
        <View style={styles.toolbar}>
          {/* Color picker */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>PEN COLOR</Text>
            <View style={styles.colorRow}>
              {COLORS.map(({ color }) => (
                <Pressable
                  key={color}
                  onPress={() => setPenColor(color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    penColor === color && { transform: [{ scale: 1.2 }], borderWidth: 3, borderColor: '#fff', shadowColor: color, shadowOpacity: 0.6, shadowRadius: 6, elevation: 6 },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Width picker */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>PEN SIZE</Text>
            <View style={styles.widthRow}>
              {WIDTHS.map(w => (
                <Pressable
                  key={w}
                  onPress={() => setPenWidth(w)}
                  style={[
                    styles.widthBtn,
                    penWidth === w && { borderColor: penColor, borderWidth: 2.5, backgroundColor: `${penColor}18` },
                  ]}
                >
                  <View style={{
                    width: w * 2.5, height: w * 2.5, borderRadius: w + 4,
                    backgroundColor: penWidth === w ? penColor : '#94a3b8'
                  }} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>ACTIONS</Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#f1f5f9' }, paths.length === 0 && { opacity: 0.4 }]}
                onPress={handleUndo} disabled={paths.length === 0}
              >
                <Ionicons name="arrow-undo-outline" size={18} color="#475569" />
                <Text style={[styles.actionText]}>Undo</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { flex: 1, backgroundColor: '#fff1f2' }, paths.length === 0 && { opacity: 0.4 }]}
                onPress={handleClear} disabled={paths.length === 0}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Clear</Text>
              </Pressable>
            </View>
          </View>

          {/* Export */}
          <Pressable
            style={[styles.exportBtn, (paths.length === 0 || saving) && { opacity: 0.4 }]}
            onPress={handleShare}
            disabled={paths.length === 0 || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="document-outline" size={20} color="#fff" /><Text style={styles.exportText}>Export as PDF & Share</Text></>
            }
          </Pressable>

          {/* Tips */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 How to use</Text>
            <Text style={styles.tipText}>1. Touch and drag on the white canvas to write</Text>
            <Text style={styles.tipText}>2. Scroll outside the canvas to see pen tools</Text>
            <Text style={styles.tipText}>3. Use Undo to remove the last stroke</Text>
            <Text style={styles.tipText}>4. Export PDF to share via WhatsApp, Email, etc.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14,
    paddingHorizontal: 16, gap: 10,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0f766e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  shareBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll: { paddingBottom: 48 },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, marginBottom: 10, backgroundColor: '#e0f2fe',
    borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#0ea5e9',
  },
  statusBarDrawing: { backgroundColor: '#f0fdf4', borderLeftColor: '#16a34a' },
  statusText: { flex: 1, fontSize: 12, color: '#0369a1' },
  canvasOuter: { paddingHorizontal: 16, marginBottom: 14 },
  canvasWrapper: {
    width: CANVAS_W, height: CANVAS_H,
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#cbd5e1',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  placeholder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderIcon: { fontSize: 36, opacity: 0.2 },
  placeholderText: { fontSize: 14, color: '#cbd5e1', marginTop: 8, fontStyle: 'italic' },
  toolbar: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16,
    padding: 16, gap: 18,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  toolSection: { gap: 10 },
  toolLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  widthRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  widthBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 12,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#0f766e', paddingVertical: 15, borderRadius: 14,
    shadowColor: '#0f766e', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  exportText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tipBox: {
    backgroundColor: '#f8fafc', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0', gap: 5,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
})
