import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'


type PatientSummary = {
  name: string
  phone: string
  lastDate: string
  rxCount: number
}

export default function PatientsTab() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)

  const loadPatients = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('prescriptions')
        .select('patient_info, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const patientMap = new Map<string, PatientSummary>()
      for (const rx of data) {
        const name = rx.patient_info?.name?.trim()
        const phone = rx.patient_info?.phone?.trim()
        if (!name) continue
        const key = phone || name

        if (!patientMap.has(key)) {
          patientMap.set(key, {
            name,
            phone: phone || '',
            lastDate: new Date(rx.created_at).toLocaleDateString(),
            rxCount: 1
          })
        } else {
          const entry = patientMap.get(key)!
          entry.rxCount += 1
        }
      }

      setPatients(Array.from(patientMap.values()))
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadPatients()
    }, [])
  )

  const renderPatient = ({ item }: { item: PatientSummary }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({
        pathname: '/patient/[phone]',
        params: { phone: item.phone || item.name, name: item.name, byname: item.phone ? '0' : '1' }
      })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {!!item.phone && <Text style={styles.phone}>{item.phone}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.statText}><Ionicons name="document-text-outline" /> {item.rxCount} Prescriptions</Text>
        <Text style={styles.statText}><Ionicons name="calendar-outline" /> Last: {item.lastDate}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : patients.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Patients Yet</Text>
          <Text style={styles.emptyDesc}>Create a prescription to add patients.</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.phone || item.name}
          renderItem={renderPatient}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f766e',
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  phone: { fontSize: 14, color: '#64748b', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  statText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#64748b', marginTop: 8 }
})
