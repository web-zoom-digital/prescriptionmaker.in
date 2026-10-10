import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  Platform, FlatList
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { DOSAGE_DB, calculatePediatricDose, type DosageEntry } from '../lib/dosage-db'
import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/design-system'

type PatientType = 'pediatric' | 'adult'

function ResultCard({ med, weight, type }: { med: DosageEntry; weight: number; type: PatientType }) {
  const pediatricResult = type === 'pediatric' ? calculatePediatricDose(med, weight) : null

  return (
    <View style={styles.resultCard}>
      {/* Header */}
      <View style={styles.resultHeader}>
        <View style={styles.resultIcon}>
          <Ionicons name="flask" size={18} color={Colors.primaryBlue} />
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
              <Text style={[styles.doseValue, { color: Colors.darkNavy }]}>{pediatricResult.recommendedStrength}</Text>
            </View>
            <View style={styles.doseRow}>
              <Text style={styles.doseLabel}>Frequency</Text>
              <Text style={styles.doseSmall}>{pediatricResult.frequency}</Text>
            </View>
            {pediatricResult.warning ? (
              <View style={styles.capWarning}>
                <Ionicons name="alert-circle" size={14} color={Colors.warning} />
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
          <Ionicons name="information-circle" size={16} color={Colors.primaryBlue} />
          <Text style={styles.instructText}>{med.instructions}</Text>
        </View>
      </View>

      {/* Age limit */}
      {med.ageLimit && (
        <View style={styles.ageLimitRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
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
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Dosage Calculator</Text>
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
            <Ionicons name="happy-outline" size={18} color={patientType === 'pediatric' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.toggleText, patientType === 'pediatric' && { color: Colors.white }]}>Pediatric</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, patientType === 'adult' && styles.toggleActive]}
            onPress={() => setPatientType('adult')}
          >
            <Ionicons name="person-outline" size={18} color={patientType === 'adult' ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.toggleText, patientType === 'adult' && { color: Colors.white }]}>Adult</Text>
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
                placeholderTextColor={Colors.textMuted}
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
            <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Type medicine name or category..."
              value={search}
              onChangeText={t => { setSearch(t); setSelectedMed(null) }}
              placeholderTextColor={Colors.textMuted}
            />
            {search ? (
              <Pressable onPress={() => { setSearch(''); setSelectedMed(null) }} style={{ marginRight: 12 }}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
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
                  <Ionicons name="flask" size={16} color={Colors.primaryBlue} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggName}>{med.name}</Text>
                    <Text style={styles.suggCategory}>{med.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.border} />
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
            <Ionicons name="scale-outline" size={32} color={Colors.primaryBlue} />
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
          <Ionicons name="shield-checkmark" size={16} color={Colors.textSecondary} />
          <Text style={styles.disclaimerText}>
            For reference only. Always verify doses clinically and adjust for individual patient factors (renal/hepatic function, comorbidities).
          </Text>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.paleBlue },
  
  header: {
    backgroundColor: Colors.darkNavy, flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 14, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { ...Typography.h3, color: Colors.white },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
  
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 48 },
  
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, 
    paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.white, 
    borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm
  },
  toggleActive: { backgroundColor: Colors.primaryBlue, borderColor: Colors.primaryBlue },
  toggleText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  
  inputCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16, gap: 10, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  inputLabel: { ...Typography.labelSm, color: Colors.primaryBlue },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weightInput: { 
    flex: 1, fontSize: 32, fontWeight: '900', color: Colors.textPrimary, 
    borderBottomWidth: 2, borderBottomColor: Colors.primaryBlue, paddingBottom: 6 
  },
  weightUnit: { fontSize: 20, fontWeight: '700', color: Colors.textSecondary },
  weightHint: { fontSize: 13, color: Colors.primaryBlue, fontWeight: '700' },
  
  searchCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16, gap: 12, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paleBlue, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary, padding: 12, fontWeight: '500' },
  suggestionList: { borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  suggName: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  suggCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  noResult: { padding: 16, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  
  resultLabel: { ...Typography.labelSm, color: Colors.textMuted, marginBottom: 8 },
  resultCard: { 
    backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', 
    ...Shadow.md, borderLeftWidth: 4, borderLeftColor: Colors.primaryBlue,
    borderWidth: 1, borderColor: Colors.border
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  resultIcon: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.paleBlue, alignItems: 'center', justifyContent: 'center' },
  resultName: { ...Typography.h4, color: Colors.textPrimary },
  resultCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, fontWeight: '500' },
  routeBadge: { backgroundColor: Colors.lightBlue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  routeText: { fontSize: 11, fontWeight: '800', color: Colors.primaryBlue },
  
  doseBox: { padding: 16, gap: 10 },
  doseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doseLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
  doseValue: { fontSize: 18, fontWeight: '900', color: Colors.primaryBlue },
  doseSmall: { fontSize: 13, color: Colors.textPrimary, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: 8 },
  capWarning: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.warningLight, borderRadius: Radius.md, padding: 10, marginTop: 6 },
  capWarningText: { fontSize: 12, color: Colors.warning, flex: 1, fontWeight: '600' },
  instructRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  instructText: { fontSize: 13, color: Colors.primaryBlue, fontWeight: '700', flex: 1 },
  ageLimitRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  ageLimitText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  warningsBox: { backgroundColor: Colors.errorLight, margin: 12, borderRadius: Radius.md, padding: 14, gap: 6 },
  warningsTitle: { fontSize: 13, fontWeight: '800', color: Colors.error, marginBottom: 4 },
  warningItem: { fontSize: 12, color: Colors.error, lineHeight: 18, fontWeight: '500' },
  
  promptBox: { alignItems: 'center', gap: 12, padding: 24, backgroundColor: Colors.lightBlue, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.primaryBlue, borderStyle: 'dashed' },
  promptText: { fontSize: 15, color: Colors.primaryBlue, textAlign: 'center', fontWeight: '700' },
  
  quickSection: { gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: Colors.white, borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  chipText: { fontSize: 13, fontWeight: '800', color: Colors.primaryBlue },
  
  disclaimer: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, borderWidth: 1, borderColor: Colors.border },
  disclaimerText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18, fontWeight: '500' },
})
