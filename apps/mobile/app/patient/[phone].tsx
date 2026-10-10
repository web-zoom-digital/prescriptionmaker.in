import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Typography, Spacing, Radius, Shadow } from '../../lib/design-system'

export default function PatientHistory() {
  const router = useRouter()
  const { phone, name, byname } = useLocalSearchParams<{ phone: string, name: string, byname: string }>()
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isByName = byname === '1'

  const loadHistory = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const filtered = data.filter(rx => {
        if (isByName) return rx.patient_info?.name?.trim() === name
        return rx.patient_info?.phone?.trim() === phone
      })

      setPrescriptions(filtered)
    } catch (err) {
      console.error('Error fetching patient history:', err)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadHistory()
    }, [phone, name, byname])
  )

  const latestInfo = prescriptions[0]?.patient_info || {}

  const handleNewRx = () => {
    router.push({
      pathname: '/editor',
      params: { prefill_name: name, prefill_phone: isByName ? '' : phone }
    })
  }

  const renderItem = ({ item }: { item: any }) => {
    const meds = item.medicines || []
    const date = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
    const isComplete = item.status === 'complete'

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
            <View style={styles.dot} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, isComplete ? styles.statusComplete : styles.statusDraft]}>
            <Text style={[styles.statusText, isComplete ? styles.textComplete : styles.textDraft]}>
              {isComplete ? '✓ Complete' : '✎ Draft'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {!!item.diagnosis && (
            <View style={styles.infoRow}>
              <Ionicons name="medical" size={14} color={Colors.primaryBlue} style={{ marginTop: 2 }} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>DIAGNOSIS</Text>
                <Text style={styles.infoValue}>{item.diagnosis}</Text>
              </View>
            </View>
          )}

          {meds.length > 0 && (
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="bandage" size={14} color={Colors.primaryBlue} style={{ marginTop: 2 }} />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>MEDICINES ({meds.length})</Text>
                <View style={styles.tagsContainer}>
                  {meds.slice(0, 3).map((m: any, i: number) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{m.name}</Text>
                    </View>
                  ))}
                  {meds.length > 3 && (
                    <Text style={styles.moreText}>+{meds.length - 3} more</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.repeatButton}
            onPress={() => router.push({ pathname: '/editor', params: { clone_id: item.id } })}
          >
            <Ionicons name="copy-outline" size={16} color={Colors.white} />
            <Text style={styles.repeatButtonText}>Repeat Prescription</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: name,
        headerStyle: { backgroundColor: Colors.darkNavy },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
      }} />
      
      {/* Vitals Overview */}
      <View style={styles.header}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.name}>{name}</Text>
            {!isByName && <Text style={styles.phone}>{phone}</Text>}
          </View>
        </View>
        <View style={styles.vitalsRow}>
          <View style={styles.vitalBox}>
            <Text style={styles.vitalLabel}>Age/Gender</Text>
            <Text style={styles.vitalValue}>
              {latestInfo.age ? `${latestInfo.age} Y` : '-'} {latestInfo.gender ? `/ ${latestInfo.gender}` : ''}
            </Text>
          </View>
          <View style={styles.vitalBox}>
            <Text style={styles.vitalLabel}>Weight</Text>
            <Text style={styles.vitalValue}>{latestInfo.weight ? `${latestInfo.weight} kg` : '-'}</Text>
          </View>
          <View style={[styles.vitalBox, { borderRightWidth: 0 }]}>
            <Text style={styles.vitalLabel}>Visits</Text>
            <Text style={styles.vitalValue}>{prescriptions.length}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No prescriptions found</Text>
            </View>
          }
        />
      )}

      {/* FAB for New Prescription */}
      <TouchableOpacity style={styles.fab} onPress={handleNewRx}>
        <Ionicons name="add" size={24} color={Colors.white} />
        <Text style={styles.fabText}>New Rx</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paleBlue },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    backgroundColor: Colors.white, padding: Spacing.lg, 
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    ...Shadow.sm
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { 
    width: 52, height: 52, borderRadius: 26, 
    backgroundColor: Colors.primaryBlue, 
    justifyContent: 'center', alignItems: 'center',
    ...Shadow.blue
  },
  avatarText: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  name: { ...Typography.h3, color: Colors.textPrimary },
  phone: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  
  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: Radius.md, paddingVertical: 10 },
  vitalBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.border },
  vitalLabel: { ...Typography.labelSm, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 2 },
  vitalValue: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  
  list: { padding: Spacing.md, paddingBottom: 80, gap: Spacing.sm },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryBlue },
  dateText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  statusComplete: { backgroundColor: Colors.successLight, borderColor: '#bbf7d0' },
  statusDraft: { backgroundColor: Colors.warningLight, borderColor: '#fde68a' },
  statusText: { fontSize: 11, fontWeight: '700' },
  textComplete: { color: Colors.success },
  textDraft: { color: Colors.warning },
  
  cardBody: { padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoCol: { flex: 1 },
  infoLabel: { ...Typography.labelSm, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { backgroundColor: Colors.lightBlue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  tagText: { fontSize: 12, color: Colors.primaryBlue, fontWeight: '600' },
  moreText: { fontSize: 12, color: Colors.textSecondary, alignSelf: 'center', fontWeight: '500' },
  
  cardFooter: { padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.paleBlue },
  repeatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primaryBlue, paddingVertical: 10, borderRadius: Radius.md, ...Shadow.blue },
  repeatButtonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, ...Typography.body, color: Colors.textSecondary },
  
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryBlue, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28, gap: 8, ...Shadow.blue },
  fabText: { color: Colors.white, fontWeight: '800', fontSize: 15 }
})
