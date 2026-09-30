import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Platform, Alert, FlatList, Modal, ActivityIndicator
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getReminders, addReminder, toggleReminder, deleteReminder, type Reminder } from '../lib/local-store'

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getReminders().then(r => { setReminders(r); setLoading(false) })
  }, [])

  const refresh = () => getReminders().then(setReminders)

  const handleAdd = async () => {
    if (!newName || !newDate) {
      Alert.alert('Required', 'Patient name and follow-up date are required.')
      return
    }
    setSaving(true)
    try {
      await addReminder({ patientName: newName, note: newNote, dueDate: newDate })
      await refresh()
      setNewName('')
      setNewNote('')
      setNewDate('')
      setShowAdd(false)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    await toggleReminder(id)
    refresh()
  }

  const handleDelete = async (id: string, name: string) => {
    Alert.alert('Delete Reminder', `Delete reminder for "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteReminder(id); refresh() } },
    ])
  }

  const pending = reminders.filter(r => !r.isDone)
  const done = reminders.filter(r => r.isDone)

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() 

  const renderItem = ({ item }: { item: Reminder }) => (
    <View style={[styles.card, item.isDone && styles.cardDone]}>
      <Pressable style={styles.checkbox} onPress={() => handleToggle(item.id)}>
        <Ionicons
          name={item.isDone ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.isDone ? '#22c55e' : '#94a3b8'}
        />
      </Pressable>
      <View style={styles.cardContent}>
        <Text style={[styles.patientName, item.isDone && styles.strikethrough]}>{item.patientName}</Text>
        {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={isOverdue(item.dueDate) && !item.isDone ? '#ef4444' : '#94a3b8'} />
          <Text style={[styles.dateText, isOverdue(item.dueDate) && !item.isDone && { color: '#ef4444', fontWeight: '700' }]}>
            {isOverdue(item.dueDate) && !item.isDone ? '⚠️ Overdue: ' : ''}
            {item.dueDate}
          </Text>
        </View>
      </View>
      <Pressable onPress={() => handleDelete(item.id, item.patientName)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={16} color="#ef4444" />
      </Pressable>
    </View>
  )

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Follow-up Reminders</Text>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#d97706' }]}>{pending.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#16a34a' }]}>{done.length}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#ef4444' }]}>
            {pending.filter(r => isOverdue(r.dueDate)).length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#0f766e" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {pending.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>PENDING ({pending.length})</Text>
              {pending.map(item => renderItem({ item }))}
            </>
          )}
          {done.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>COMPLETED ({done.length})</Text>
              {done.map(item => renderItem({ item }))}
            </>
          )}
          {reminders.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No reminders yet</Text>
              <Text style={styles.emptyText}>Add a follow-up reminder for patients using the + button above.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={styles.emptyBtnText}>+ Add First Reminder</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Reminder Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowAdd(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Add Follow-up Reminder</Text>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Patient Name *</Text>
              <TextInput style={styles.formInput} placeholder="Arun Kumar" placeholderTextColor="#94a3b8"
                value={newName} onChangeText={setNewName} />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Note</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Blood report review, Check BP"
                placeholderTextColor="#94a3b8" value={newNote} onChangeText={setNewNote} />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Follow-up Date *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. 05 Oct 2026, After 7 days"
                placeholderTextColor="#94a3b8" value={newDate} onChangeText={setNewDate} />
            </View>

            <View style={styles.sheetActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Add Reminder</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#0f766e', flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  addBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statsBanner: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardDone: { opacity: 0.6, backgroundColor: '#f8fafc' },
  checkbox: { paddingTop: 2 },
  cardContent: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  strikethrough: { textDecorationLine: 'line-through', color: '#94a3b8' },
  noteText: { fontSize: 13, color: '#64748b', marginTop: 4 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dateText: { fontSize: 12, color: '#94a3b8' },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: '#0f766e', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  formInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 13, fontSize: 15, color: '#1e293b' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  confirmBtn: { flex: 1, backgroundColor: '#0f766e', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})
