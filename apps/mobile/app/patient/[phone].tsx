import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'


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
              <Ionicons name="medical-outline" size={16} color="#0d9488" />
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>DIAGNOSIS</Text>
                <Text style={styles.infoValue}>{item.diagnosis}</Text>
              </View>
            </View>
          )}

          {meds.length > 0 && (
            <View style={[styles.infoRow, { marginTop: 12 }]}>
              <Ionicons name="bandage-outline" size={16} color="#2563eb" />
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
            <Ionicons name="copy-outline" size={16} color="#fff" />
            <Text style={styles.repeatButtonText}>Repeat Prescription</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: name }} />
      
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
          <View style={styles.vitalBox}>
            <Text style={styles.vitalLabel}>Visits</Text>
            <Text style={styles.vitalValue}>{prescriptions.length}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No prescriptions found</Text>
            </View>
          }
        />
      )}

      {/* FAB for New Prescription */}
      <TouchableOpacity style={styles.fab} onPress={handleNewRx}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>New Rx</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f766e', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  phone: { fontSize: 14, color: '#64748b' },
  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  vitalBox: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#f1f5f9' },
  vitalLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  vitalValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  list: { padding: 16, paddingBottom: 80, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0f766e' },
  dateText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  statusComplete: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusDraft: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusText: { fontSize: 11, fontWeight: '600' },
  textComplete: { color: '#166534' },
  textDraft: { color: '#92400e' },
  cardBody: { padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 12, color: '#1d4ed8', fontWeight: '500' },
  moreText: { fontSize: 12, color: '#64748b', alignSelf: 'center' },
  cardFooter: { padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  repeatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0f766e', paddingVertical: 8, borderRadius: 8 },
  repeatButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  fab: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f766e', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, gap: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
})
