import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  Platform, FlatList
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { DOSAGE_DB, calculatePediatricDose, type DosageEntry } from '../lib/dosage-db'

type PatientType = 'pediatric' | 'adult'

function ResultCard({ med, weight, type }: { med: DosageEntry; weight: number; type: PatientType }) {
  const pediatricResult = type === 'pediatric' ? calculatePediatricDose(med, weight) : null

  return (
    <View style={styles.resultCard}>
      {/* Header */}
      <View style={styles.resultHeader}>
        <View style={styles.resultIcon}>
          <Ionicons name="flask" size={16} color="#0f766e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultName}>{med.name}</Text>
          <Text style={styles.resultCategory}>{med.category}</Text>
        </View>
        <View style={styles.routeBadge}>
          <Text style={styles.routeText}>{med.route}</Text>
        </View>
      </View>

      {/* Dose */}
      <View style={styles.doseBox}>
        {type === 'pediatric' && pediatricResult ? (
          <>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Calculated Dose</Text>
              <Text style={styles.doseValue}>{pediatricResult.calculatedMg} mg</Text>
            </View>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Per kg dose</Text>
              <Text style={styles.doseSmall}>{med.pediatricDose?.mgPerKg} mg/kg × {weight} kg</Text>
            </View>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Nearest Strength</Text>
              <Text style={[styles.doseValue, { color: '#1e40af' }]}>{pediatricResult.recommendedStrength}</Text>
            </View>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Frequency</Text>
              <Text style={styles.doseSmall}>{pediatricResult.frequency}</Text>
            </View>
            {pediatricResult.warning ? (
              <View style={styles.capWarning}>
                <Ionicons name="alert-circle" size={13} color="#d97706" />
                <Text style={styles.capWarningText}>{pediatricResult.warning}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Adult Dose</Text>
              <Text style={styles.doseValue}>{med.adultDose?.dose ?? 'N/A'}</Text>
            </View>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Frequency</Text>
              <Text style={styles.doseSmall}>{med.adultDose?.frequency ?? '—'}</Text>
            </View>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Available As</Text>
              <Text style={styles.doseSmall}>{med.strengths.slice(0, 3).join(', ')}</Text>
            </View>
          </>
        )}
        <View style={styles.instructRow}>
          <Ionicons name="information-circle-outline" size={14} color="#0f766e" />
          <Text style={styles.instructText}>{med.instructions}</Text>
        </View>
      </View>

      {/* Age limit */}
      {med.ageLimit && (
        <View style={styles.ageLimitRow}>
          <Ionicons name="calendar-outline" size={13} color="#64748b" />
          <Text style={styles.ageLimitText}>{med.ageLimit}</Text>
        </View>
      )}

      {/* Warnings */}
      {med.warnings.length > 0 && (
        <View style={styles.warningsBox}>
          <Text style={styles.warningsTitle}>⚠️ Warnings</Text>
          {med.warnings.map((w, i) => (
            <Text key={i} style={styles.warningItem}>• {w}</Text>
          ))}
        </View>
      )}
    </View>
  )
}

export default function DosageCalculatorScreen() {
  const [patientType, setPatientType] = useState<PatientType>('pediatric')
  const [weight, setWeight] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMed, setSelectedMed] = useState<DosageEntry | null>(null)

  const weightKg = parseFloat(weight) || 0

  const filtered = useMemo(() => {
    if (!search) return DOSAGE_DB
    const q = search.toLowerCase()
    return DOSAGE_DB.filter(m =>
      m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    )
  }, [search])

  const showResult = selectedMed && (patientType === 'adult' || weightKg > 0)

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>⚖️ Dosage Calculator</Text>
          <Text style={styles.headerSub}>Pediatric & Adult dose reference</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Patient Type Toggle */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, patientType === 'pediatric' && styles.toggleActive]}
            onPress={() => setPatientType('pediatric')}
          >
            <Ionicons name="happy-outline" size={16} color={patientType === 'pediatric' ? '#fff' : '#64748b'} />
            <Text style={[styles.toggleText, patientType === 'pediatric' && { color: '#fff' }]}>Pediatric</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, patientType === 'adult' && styles.toggleActive]}
            onPress={() => setPatientType('adult')}
          >
            <Ionicons name="person-outline" size={16} color={patientType === 'adult' ? '#fff' : '#64748b'} />
            <Text style={[styles.toggleText, patientType === 'adult' && { color: '#fff' }]}>Adult</Text>
          </Pressable>
        </View>

        {/* Weight input (pediatric only) */}
        {patientType === 'pediatric' && (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>PATIENT WEIGHT</Text>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                placeholder="e.g. 12"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            {weightKg > 0 && (
              <Text style={styles.weightHint}>
                {weightKg < 3 ? '🍼 Neonate (<3 kg)' :
                  weightKg < 10 ? '👶 Infant' :
                  weightKg < 20 ? '🧒 Young child' :
                  weightKg < 40 ? '🧑 Older child' : '🧑‍⚕️ Adolescent / Adult range'}
              </Text>
            )}
          </View>
        )}

        {/* Medicine search */}
        <View style={styles.searchCard}>
          <Text style={styles.inputLabel}>SEARCH MEDICINE</Text>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color="#94a3b8" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Type medicine name or category..."
              value={search}
              onChangeText={t => { setSearch(t); setSelectedMed(null) }}
              placeholderTextColor="#94a3b8"
            />
            {search ? (
              <Pressable onPress={() => { setSearch(''); setSelectedMed(null) }} style={{ marginRight: 10 }}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            ) : null}
          </View>

          {/* Suggestion list */}
          {search.length > 0 && !selectedMed && (
            <View style={styles.suggestionList}>
              {filtered.slice(0, 8).map(med => (
                <Pressable
                  key={med.name}
                  style={styles.suggestionItem}
                  onPress={() => { setSelectedMed(med); setSearch(med.name) }}
                >
                  <Ionicons name="flask-outline" size={14} color="#0f766e" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggName}>{med.name}</Text>
                    <Text style={styles.suggCategory}>{med.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                </Pressable>
              ))}
              {filtered.length === 0 && (
                <Text style={styles.noResult}>No medicines found for "{search}"</Text>
              )}
            </View>
          )}
        </View>

        {/* Result */}
        {showResult && (
          <View>
            <Text style={styles.resultLabel}>CALCULATED DOSE</Text>
            <ResultCard med={selectedMed!} weight={weightKg} type={patientType} />
          </View>
        )}

        {/* Prompt to enter weight */}
        {selectedMed && patientType === 'pediatric' && !weightKg && (
          <View style={styles.promptBox}>
            <Ionicons name="scale-outline" size={28} color="#0f766e" />
            <Text style={styles.promptText}>Please enter patient weight above to calculate the dose</Text>
          </View>
        )}

        {/* Quick picks */}
        {!selectedMed && (
          <View style={styles.quickSection}>
            <Text style={styles.inputLabel}>COMMON MEDICINES</Text>
            <View style={styles.chipRow}>
              {['Paracetamol', 'Amoxicillin', 'Cetirizine', 'Azithromycin', 'Ibuprofen', 'ORS (Oral Rehydration Salts)', 'Ondansetron', 'Cefixime'].map(name => {
                const med = DOSAGE_DB.find(m => m.name === name)
                if (!med) return null
                return (
                  <Pressable key={name} style={styles.chip} onPress={() => { setSelectedMed(med); setSearch(name) }}>
                    <Text style={styles.chipText}>{name.split(' ')[0]}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#64748b" />
          <Text style={styles.disclaimerText}>
            For reference only. Always verify doses clinically and adjust for individual patient factors (renal/hepatic function, comorbidities).
          </Text>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#0f766e', flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 48 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0' },
  toggleActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  inputCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weightInput: { flex: 1, fontSize: 28, fontWeight: '800', color: '#0f172a', borderBottomWidth: 2, borderBottomColor: '#0f766e', paddingBottom: 6 },
  weightUnit: { fontSize: 18, fontWeight: '600', color: '#64748b' },
  weightHint: { fontSize: 13, color: '#0f766e', fontWeight: '600' },
  searchCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', padding: 10 },
  suggestionList: { borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' },
  suggName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  suggCategory: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  noResult: { padding: 14, fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  resultLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 8 },
  resultCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#0f766e' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  resultName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  resultCategory: { fontSize: 11, color: '#64748b', marginTop: 1 },
  routeBadge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  routeText: { fontSize: 10, fontWeight: '700', color: '#0369a1' },
  doseBox: { padding: 14, gap: 8 },
  doseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doseLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  doseValue: { fontSize: 16, fontWeight: '800', color: '#0f766e' },
  doseSmall: { fontSize: 12, color: '#334155', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 },
  capWarning: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', backgroundColor: '#fffbeb', borderRadius: 8, padding: 8, marginTop: 4 },
  capWarningText: { fontSize: 11, color: '#92400e', flex: 1 },
  instructRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  instructText: { fontSize: 12, color: '#0f766e', fontWeight: '600', flex: 1 },
  ageLimitRow: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10 },
  ageLimitText: { fontSize: 11, color: '#64748b' },
  warningsBox: { backgroundColor: '#fff7ed', margin: 10, borderRadius: 10, padding: 12, gap: 4 },
  warningsTitle: { fontSize: 12, fontWeight: '700', color: '#9a3412', marginBottom: 4 },
  warningItem: { fontSize: 11, color: '#9a3412', lineHeight: 18 },
  promptBox: { alignItems: 'center', gap: 10, padding: 24, backgroundColor: '#f0fdf4', borderRadius: 14, borderWidth: 1.5, borderColor: '#bbf7d0', borderStyle: 'dashed' },
  promptText: { fontSize: 14, color: '#0f766e', textAlign: 'center', fontWeight: '600' },
  quickSection: { gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  chipText: { fontSize: 12, fontWeight: '700', color: '#0f766e' },
  disclaimer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12 },
  disclaimerText: { flex: 1, fontSize: 11, color: '#64748b', lineHeight: 17 },
})
