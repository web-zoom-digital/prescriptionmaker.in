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

const { width: SW } = Dimensions.get('window')
const CANVAS_W = SW - 32
const CANVAS_H = 460

type DrawnPath = { d: string; color: string; width: number }

export default function HandMode() {
  const [paths, setPaths] = useState<DrawnPath[]>([])
  const currentPathRef = useRef<string>('')
  const [renderKey, setRenderKey] = useState(0) // force re-render
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
          const finalPath = { ...currentPathData.current }
          setPaths(prev => [...prev, finalPath])
        }
        currentPathRef.current = ''
        currentPathData.current = null
        isDrawing.current = false
        setRenderKey(k => k + 1)
      },
    })
  ).current

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1))
  }

  const handleClear = () => {
    Alert.alert('Clear Canvas', 'Erase everything?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {
        setPaths([])
        currentPathRef.current = ''
        currentPathData.current = null
      }}
    ])
  }

  const generateSVG = () => {
    const pathElements = paths.map((p, i) =>
      `<path key="${i}" d="${p.d}" stroke="${p.color}" stroke-width="${p.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('\n')

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="white"/>
  ${Array.from({ length: 13 }).map((_, i) =>
    `<line x1="16" y1="${34 + i * 34}" x2="${CANVAS_W - 16}" y2="${34 + i * 34}" stroke="#e2e8f0" stroke-width="1"/>`
  ).join('\n')}
  <text x="14" y="26" font-size="20" fill="#0f766e" font-weight="900" opacity="0.4" font-family="serif">℞</text>
  ${pathElements}
</svg>`
  }

  const handleShare = async () => {
    if (paths.length === 0) {
      Alert.alert('Empty Canvas', 'Please draw your prescription first.')
      return
    }
    setSaving(true)
    try {
      const svg = generateSVG()
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#fff;font-family:Arial,sans-serif;} h3{color:#0f766e;margin-bottom:10px;} .info{color:#94a3b8;font-size:12px;margin-top:10px;}</style></head><body><h3>✍️ Hand-written Prescription</h3>${svg}<p class="info">Created with PrescriptionMaker.in</p></body></html>`
      const { uri } = await Print.printToFileAsync({ html, base64: false })
      const dest = `${FileSystem.documentDirectory}hand_prescription_${Date.now()}.pdf`
      await FileSystem.moveAsync({ from: uri, to: dest })
      await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Share Hand Prescription' })
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const strokesCount = paths.length

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={styles.headerTitle}>✍️ Hand Mode</Text>
          <Text style={styles.headerSub}>{strokesCount} stroke{strokesCount !== 1 ? 's' : ''}</Text>
        </View>
        <Pressable onPress={handleShare} style={[styles.shareBtn, saving && { opacity: 0.7 }]} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="share-social-outline" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>Share PDF</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} scrollEnabled={false}>
        {/* Info */}
        <View style={styles.infoBanner}>
          <Ionicons name="bulb-outline" size={14} color="#0369a1" />
          <Text style={styles.infoText}>Draw naturally on the canvas below. Use undo for mistakes.</Text>
        </View>

        {/* Drawing Canvas */}
        <View style={styles.canvasWrapper} {...panResponder.panHandlers}>
          {/* Ruled paper background */}
          <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill}>
            <Path d="" />
            {Array.from({ length: 13 }).map((_, i) => (
              <Path
                key={i}
                d={`M16,${34 + i * 34} L${CANVAS_W - 16},${34 + i * 34}`}
                stroke="#e2e8f0"
                strokeWidth={1}
                fill="none"
              />
            ))}
            {/* Rx symbol */}
            {paths.length === 0 && (
              <>
                <Path
                  d="M14,22 Q14,8 28,8 Q42,8 42,22 Q42,30 35,34 L45,50"
                  stroke="#0f766e"
                  strokeWidth={3}
                  fill="none"
                  opacity={0.15}
                />
              </>
            )}
          </Svg>

          {/* Drawn paths */}
          <Svg key={renderKey} width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill} pointerEvents="none">
            {paths.map((p, i) => (
              <Path
                key={i}
                d={p.d}
                stroke={p.color}
                strokeWidth={p.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {/* Current stroke being drawn */}
            {currentPathData.current && (
              <Path
                d={currentPathData.current.d}
                stroke={currentPathData.current.color}
                strokeWidth={currentPathData.current.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </Svg>

          {/* Empty state hint */}
          {paths.length === 0 && (
            <View style={styles.emptyHint} pointerEvents="none">
              <Text style={styles.emptyHintText}>✍️</Text>
              <Text style={styles.emptyHintSub}>Start writing here</Text>
            </View>
          )}
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          {/* Pen Color */}
          <View style={styles.toolRow}>
            <Text style={styles.toolLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(({ color, label }) => (
                <Pressable
                  key={color}
                  onPress={() => setPenColor(color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    penColor === color && styles.colorDotActive,
                  ]}
                  accessibilityLabel={label}
                />
              ))}
            </View>
          </View>

          {/* Pen Width */}
          <View style={styles.toolRow}>
            <Text style={styles.toolLabel}>Size</Text>
            <View style={styles.widthRow}>
              {WIDTHS.map(w => (
                <Pressable
                  key={w}
                  onPress={() => setPenWidth(w)}
                  style={[styles.widthBtn, penWidth === w && { borderColor: penColor, borderWidth: 2.5 }]}
                >
                  <View style={{ width: w * 1.8, height: w * 1.8, borderRadius: w, backgroundColor: penColor }} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]} onPress={handleUndo} disabled={paths.length === 0}>
              <Ionicons name="arrow-undo-outline" size={18} color={paths.length === 0 ? '#cbd5e1' : '#475569'} />
              <Text style={[styles.actionText, paths.length === 0 && { color: '#cbd5e1' }]}>Undo</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]} onPress={handleClear} disabled={paths.length === 0}>
              <Ionicons name="trash-outline" size={18} color={paths.length === 0 ? '#fca5a5' : '#ef4444'} />
              <Text style={[styles.actionText, { color: paths.length === 0 ? '#fca5a5' : '#ef4444' }]}>Clear All</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { backgroundColor: '#0f766e', flex: 1.5 }]} onPress={handleShare} disabled={saving || paths.length === 0}>
              <Ionicons name="share-social-outline" size={18} color={paths.length === 0 ? 'rgba(255,255,255,0.4)' : '#fff'} />
              <Text style={[styles.actionText, { color: paths.length === 0 ? 'rgba(255,255,255,0.4)' : '#fff' }]}>Export PDF</Text>
            </Pressable>
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
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 10,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0f766e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  shareBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 32 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#e0f2fe', borderRadius: 10, padding: 11,
    borderLeftWidth: 3, borderLeftColor: '#0ea5e9', marginBottom: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: '#0369a1' },
  canvasWrapper: {
    width: CANVAS_W, height: CANVAS_H,
    backgroundColor: '#fff',
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  emptyHint: {
    position: 'absolute', inset: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyHintText: { fontSize: 40, opacity: 0.15 },
  emptyHintSub: { fontSize: 14, color: '#cbd5e1', marginTop: 8, fontStyle: 'italic' },
  toolbar: {
    marginTop: 14, backgroundColor: '#fff',
    borderRadius: 16, padding: 16, gap: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toolLabel: { fontSize: 12, fontWeight: '700', color: '#94a3b8', width: 42 },
  colorRow: { flex: 1, flexDirection: 'row', gap: 10 },
  colorDot: { width: 28, height: 28, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  colorDotActive: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 5, elevation: 5, transform: [{ scale: 1.15 }] },
  widthRow: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' },
  widthBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#475569' },
})
