import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Platform, Alert, ActivityIndicator, Dimensions, PanResponder
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path } from 'react-native-svg'
import * as Sharing from 'expo-sharing'
import * as Print from 'expo-print'
import * as FileSystem from 'expo-file-system'

const { width: SW, height: SH } = Dimensions.get('window')
const CANVAS_W = SW - 32
const CANVAS_H = Math.min(380, SH * 0.42) // responsive canvas height

type DrawnPath = { d: string; color: string; width: number }

export default function HandMode() {
  const [paths, setPaths] = useState<DrawnPath[]>([])
  const currentPathRef = useRef<string>('')
  const [renderKey, setRenderKey] = useState(0)
  const [penColor, setPenColor] = useState('#1e293b')
  const [penWidth, setPenWidth] = useState(3)
  const [saving, setSaving] = useState(false)
  const isDrawing = useRef(false)
  const currentPathData = useRef<DrawnPath | null>(null)

  const COLORS = [
    { color: '#1e293b', label: 'Black' },
    { color: '#0f766e', label: 'Teal' },
    { color: '#1e40af', label: 'Blue' },
    { color: '#be123c', label: 'Red' },
    { color: '#7c3aed', label: 'Purple' },
    { color: '#d97706', label: 'Amber' },
    { color: '#94a3b8', label: 'Gray' },
  ]
  const WIDTHS = [2, 4, 7, 12]

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
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

  const generateSVG = () => {
    const pathEls = paths.map((p, i) =>
      `<path d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('\n')
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
      <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="white"/>
      ${Array.from({ length: 11 }).map((_, i) =>
        `<line x1="16" y1="${30 + i * 32}" x2="${CANVAS_W - 16}" y2="${30 + i * 32}" stroke="#e2e8f0" stroke-width="1"/>`
      ).join('')}
      ${pathEls}
    </svg>`
  }

  const handleShare = async () => {
    if (paths.length === 0) { Alert.alert('Empty Canvas', 'Please draw your prescription first.'); return }
    setSaving(true)
    try {
      const svg = generateSVG()
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#fff;font-family:Arial,sans-serif;}h3{color:#0f766e;margin-bottom:10px;}.info{color:#94a3b8;font-size:12px;margin-top:10px;}</style></head><body><h3>✍️ Hand-written Prescription</h3>${svg}<p class="info">Created with PrescriptionMaker.in</p></body></html>`
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      const dest = `${FileSystem.documentDirectory}hand_rx_${Date.now()}.pdf`
      await FileSystem.moveAsync({ from: uri, to: dest })
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Share Hand Prescription' })
    } catch (err: any) { Alert.alert('Error', err.message) }
    finally { setSaving(false) }
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>✍️ Hand Mode</Text>
          <Text style={styles.headerSub}>{paths.length} stroke{paths.length !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable onPress={handleShare} style={[styles.shareBtn, saving && { opacity: 0.7 }]} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="share-social-outline" size={15} color="#fff" />
              <Text style={styles.shareBtnText}>Share PDF</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Full page scrollable */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info */}
        <View style={styles.infoBanner}>
          <Ionicons name="pencil-outline" size={14} color="#0369a1" />
          <Text style={styles.infoText}>Draw on the white canvas. Scroll below for pen tools.</Text>
        </View>

        {/* Canvas — touch handled by PanResponder only within this View */}
        <View style={styles.canvasOuter}>
          {/* Canvas touch area - isolated from ScrollView */}
          <View
            style={styles.canvasWrapper}
            onStartShouldSetResponder={() => false}
            {...panResponder.panHandlers}
          >
            {/* Lined paper background */}
            <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill} pointerEvents="none">
              {Array.from({ length: 11 }).map((_, i) => (
                <Path
                  key={i}
                  d={`M16,${30 + i * 32} L${CANVAS_W - 16},${30 + i * 32}`}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  fill="none"
                />
              ))}
            </Svg>

            {/* Drawn strokes layer */}
            <Svg key={renderKey} width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p, i) => (
                <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.width}
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {currentPathData.current && (
                <Path
                  d={currentPathData.current.d}
                  stroke={currentPathData.current.color}
                  strokeWidth={currentPathData.current.width}
                  fill="none" strokeLinecap="round" strokeLinejoin="round"
                />
              )}
            </Svg>

            {/* Placeholder text when empty */}
            {paths.length === 0 && (
              <View style={styles.emptyHint} pointerEvents="none">
                <Text style={styles.emptyIcon}>✍️</Text>
                <Text style={styles.emptyText}>Tap and drag to write</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Toolbar (scrollable below canvas) ── */}
        <View style={styles.toolbar}>
          {/* Pen Color */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>PEN COLOR</Text>
            <View style={styles.colorRow}>
              {COLORS.map(({ color, label }) => (
                <Pressable
                  key={color}
                  onPress={() => setPenColor(color)}
                  style={[styles.colorDot, { backgroundColor: color },
                    penColor === color && [styles.colorDotActive, { shadowColor: color }]]}
                  accessibilityLabel={label}
                />
              ))}
            </View>
          </View>

          {/* Pen Width */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>PEN SIZE</Text>
            <View style={styles.widthRow}>
              {WIDTHS.map(w => (
                <Pressable
                  key={w}
                  onPress={() => setPenWidth(w)}
                  style={[styles.widthBtn, penWidth === w && { borderColor: penColor, borderWidth: 2.5, backgroundColor: `${penColor}10` }]}
                >
                  <View style={{ width: w * 2.2, height: w * 2.2, borderRadius: w + 4, backgroundColor: penWidth === w ? penColor : '#94a3b8' }} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.toolSection}>
            <Text style={styles.toolLabel}>ACTIONS</Text>
            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]} onPress={handleUndo} disabled={paths.length === 0}>
                <Ionicons name="arrow-undo-outline" size={18} color={paths.length === 0 ? '#cbd5e1' : '#475569'} />
                <Text style={[styles.actionText, paths.length === 0 && { color: '#cbd5e1' }]}>Undo</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]} onPress={handleClear} disabled={paths.length === 0}>
                <Ionicons name="trash-outline" size={18} color={paths.length === 0 ? '#fca5a5' : '#ef4444'} />
                <Text style={[styles.actionText, { color: paths.length === 0 ? '#fca5a5' : '#ef4444' }]}>Clear All</Text>
              </Pressable>
            </View>
          </View>

          {/* Export */}
          <Pressable
            style={[styles.exportBtn, (saving || paths.length === 0) && { opacity: 0.5 }]}
            onPress={handleShare}
            disabled={saving || paths.length === 0}
          >
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="document-outline" size={20} color="#fff" />
                <Text style={styles.exportText}>Export as PDF & Share</Text>
              </>
            )}
          </Pressable>

          {/* Tips */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Tips</Text>
            <Text style={styles.tipText}>• Use thick pen for headings, thin for medicine names</Text>
            <Text style={styles.tipText}>• Undo removes the last stroke (one line at a time)</Text>
            <Text style={styles.tipText}>• Export creates a PDF you can share via WhatsApp, email, etc.</Text>
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
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0f766e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  shareBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll: { paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, marginBottom: 10,
    backgroundColor: '#e0f2fe', borderRadius: 10, padding: 11,
    borderLeftWidth: 3, borderLeftColor: '#0ea5e9',
  },
  infoText: { flex: 1, fontSize: 13, color: '#0369a1' },
  canvasOuter: { paddingHorizontal: 16, marginBottom: 16 },
  canvasWrapper: {
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyHint: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyIcon: { fontSize: 36, opacity: 0.2 },
  emptyText: { fontSize: 14, color: '#cbd5e1', marginTop: 8, fontStyle: 'italic' },
  toolbar: {
    marginHorizontal: 16, backgroundColor: '#fff',
    borderRadius: 16, padding: 16, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  toolSection: { gap: 10 },
  toolLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: {
    borderWidth: 3, borderColor: '#fff',
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
    transform: [{ scale: 1.15 }],
  },
  widthRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  widthBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
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
    borderWidth: 1, borderColor: '#e2e8f0', gap: 6,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
})
