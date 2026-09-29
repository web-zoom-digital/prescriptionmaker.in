import {
  View, Text, TextInput, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useState, useEffect } from 'react'
import { getPrescription, createPrescription, updatePrescription } from '../lib/prescriptions'

export default function EditorModal() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)

  // Form state
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState('')
  const [advice, setAdvice] = useState('')
  const [followUp, setFollowUp] = useState('')

  // Load existing prescription if editing
  useEffect(() => {
    if (!id) return
    getPrescription(id).then((rx) => {
      if (rx) {
        setPatientName(rx.patient_info?.name ?? '')
        setPatientAge(rx.patient_info?.age ?? '')
        setDiagnosis(rx.diagnosis ?? '')
        setMedicines(
          Array.isArray(rx.medicines)
            ? rx.medicines.map((m: any) => `${m.name} ${m.strength ?? ''} - ${m.frequency ?? ''}`).join('\n')
            : ''
        )
      }
      setLoading(false)
    })
  }, [id])

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!patientName.trim()) {
      Alert.alert('Validation', 'Please enter patient name.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: `Rx: ${patientName}`,
        status,
        mode: 'form' as const,
        diagnosis,
        patient_info: { name: patientName, age: patientAge },
        medicines: medicines
          .split('\n')
          .filter(Boolean)
          .map((line, i) => ({ id: String(i + 1), name: line })),
      }

      if (id) {
        await updatePrescription(id, payload)
      } else {
        await createPrescription(payload)
      }

      Alert.alert('Saved!', `Prescription ${status === 'complete' ? 'completed' : 'saved as draft'}.`, [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (err: any) {
      Alert.alert('Save Failed', err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Patient Details</Text>

        <Text style={styles.label}>Patient Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Rahul Sharma" value={patientName} onChangeText={setPatientName} />

        <Text style={styles.label}>Age</Text>
        <TextInput style={styles.input} placeholder="e.g. 35" value={patientAge} onChangeText={setPatientAge} keyboardType="numeric" />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Prescription</Text>

        <Text style={styles.label}>Diagnosis</Text>
        <TextInput style={styles.input} placeholder="e.g. Viral Fever" value={diagnosis} onChangeText={setDiagnosis} />

        <Text style={styles.label}>Medicines (one per line)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={"Paracetamol 500mg - 1-0-1 x 3 days\nCetirizine 10mg - 0-0-1 x 5 days"}
          value={medicines}
          onChangeText={setMedicines}
          multiline
          numberOfLines={5}
        />

        <Text style={styles.label}>Advice</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Rest, drink plenty of fluids..."
          value={advice}
          onChangeText={setAdvice}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Follow-up Date</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. After 5 days"
          value={followUp}
          onChangeText={setFollowUp}
        />

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.draftBtn, saving && { opacity: 0.6 }]}
            onPress={() => handleSave('draft')}
            disabled={saving}
          >
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </Pressable>
          <Pressable
            style={[styles.completeBtn, saving && { opacity: 0.6 }]}
            onPress={() => handleSave('complete')}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.completeBtnText}>Complete ✓</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f766e', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0fdf4', paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#f8fafc',
    color: '#0f172a', marginBottom: 12,
  },
  textArea: { height: 110, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  draftBtn: {
    flex: 1, borderWidth: 2, borderColor: '#0f766e',
    paddingVertical: 14, borderRadius: 10, alignItems: 'center',
  },
  draftBtnText: { color: '#0f766e', fontWeight: '700', fontSize: 15 },
  completeBtn: {
    flex: 1, backgroundColor: '#0f766e',
    paddingVertical: 14, borderRadius: 10, alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
