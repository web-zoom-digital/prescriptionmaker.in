import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Platform, Alert, FlatList, Modal, ActivityIndicator
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getReminders, addReminder, toggleReminder, deleteReminder, type Reminder } from '../lib/local-store'
import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/design-system'

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
          size={26}
          color={item.isDone ? Colors.success : Colors.textMuted}
        />
      </Pressable>
      <View style={styles.cardContent}>
        <Text style={[styles.patientName, item.isDone && styles.strikethrough]}>{item.patientName}</Text>
        {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={isOverdue(item.dueDate) && !item.isDone ? Colors.error : Colors.textSecondary} />
          <Text style={[styles.dateText, isOverdue(item.dueDate) && !item.isDone && { color: Colors.error, fontWeight: '700' }]}>
            {isOverdue(item.dueDate) && !item.isDone ? '⚠️ Overdue: ' : ''}
            {item.dueDate}
          </Text>
        </View>
      </View>
      <Pressable onPress={() => handleDelete(item.id, item.patientName)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={Colors.error} />
      </Pressable>
    </View>
  )

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Follow-up Reminders</Text>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </Pressable>
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.warning }]}>{pending.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.success }]}>{done.length}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.error }]}>
            {pending.filter(r => isOverdue(r.dueDate)).length}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primaryBlue} size="large" /></View>
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
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>COMPLETED ({done.length})</Text>
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
              <TextInput style={styles.formInput} placeholder="Arun Kumar" placeholderTextColor={Colors.textMuted}
                value={newName} onChangeText={setNewName} />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Note</Text>
              <TextInput style={styles.formInput} placeholder="e.g. Blood report review, Check BP"
                placeholderTextColor={Colors.textMuted} value={newNote} onChangeText={setNewNote} />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Follow-up Date *</Text>
              <TextInput style={styles.formInput} placeholder="e.g. 05 Oct 2026, After 7 days"
                placeholderTextColor={Colors.textMuted} value={newDate} onChangeText={setNewDate} />
            </View>

            <View style={styles.sheetActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.confirmText}>Add Reminder</Text>}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paleBlue },
  
  header: { 
    backgroundColor: Colors.darkNavy, flexDirection: 'row', alignItems: 'center', 
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12 
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, ...Typography.h3, color: Colors.white },
  addBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  statsBanner: { 
    flexDirection: 'row', backgroundColor: Colors.white, padding: 16, 
    marginHorizontal: 16, marginTop: 16, borderRadius: Radius.lg, 
    ...Shadow.md, borderWidth: 1, borderColor: Colors.border
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statNum: { fontSize: 28, fontWeight: '900' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.md, paddingBottom: 40 },
  
  sectionLabel: { ...Typography.labelSm, color: Colors.primaryBlue, marginBottom: 12 },
  
  card: { 
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: 16, marginBottom: 10, 
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, 
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border 
  },
  cardDone: { opacity: 0.6, backgroundColor: Colors.surface },
  checkbox: { paddingTop: 2 },
  cardContent: { flex: 1 },
  patientName: { ...Typography.h4, color: Colors.textPrimary },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  noteText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dateText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  deleteBtn: { padding: 8 },
  
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 8 },
  emptyText: { ...Typography.bodySm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.primaryBlue, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.md, ...Shadow.blue },
  emptyBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  
  overlay: { flex: 1, backgroundColor: 'rgba(16,42,86,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 36 },
  sheetTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 20 },
  formField: { marginBottom: 16 },
  formLabel: { ...Typography.label, color: Colors.primaryBlue, marginBottom: 8 },
  formInput: { 
    backgroundColor: Colors.paleBlue, borderWidth: 1.5, borderColor: Colors.border, 
    borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' 
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 16, borderRadius: Radius.md, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  confirmBtn: { flex: 1, backgroundColor: Colors.primaryBlue, paddingVertical: 16, borderRadius: Radius.md, alignItems: 'center', ...Shadow.blue },
  confirmText: { fontSize: 15, fontWeight: '800', color: Colors.white },
})
