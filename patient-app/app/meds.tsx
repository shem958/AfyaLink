import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'

import api from '../lib/api'

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050d1a' },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#e8f0fe', marginBottom: 4 },
  sub: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  card: { backgroundColor: '#0f1e35', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)' },
  medHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  medName: { fontSize: 16, fontWeight: '800', color: '#e8f0fe' },
  medDosage: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  timeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  timePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  timePillDone:   { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)' },
  timePillPending:{ backgroundColor: '#0a1628', borderColor: 'rgba(96,165,250,0.2)' },
  timePillTextDone:   { color: '#34d399', fontWeight: '600', fontSize: 12 },
  timePillTextPending:{ color: '#94a3b8', fontWeight: '600', fontSize: 12 },
  markBtn: { backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  markBtnText: { color: '#34d399', fontWeight: '700', fontSize: 12 },
  doneBadge: { backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  doneBadgeText: { color: '#34d399', fontWeight: '700', fontSize: 12 },
  adherenceCard: { backgroundColor: '#0a1628', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(96,165,250,0.08)' },
  adherenceTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 4 },
  adherenceVal: { fontSize: 24, fontWeight: '900', color: '#34d399' },
})

export default function MedsScreen() {
  const [taken, setTaken] = useState<Record<string, boolean>>({})
  const [meds, setMeds] = useState<any[]>([])
  
  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await api.get('/patient/medications')
        if (res.data.medications) {
          // Add default schedule times if not provided from seed
          const parsed = res.data.medications.map((m: any) => ({
            ...m,
            times: m.schedule ? m.schedule.split(',') : ['08:00 AM']
          }))
          setMeds(parsed)
        }
      } catch(err) {
        console.error(err)
      }
    }
    fetchMeds()
  }, [])

  const markTaken = async (medId: string, time: string) => {
    try {
      await api.patch(`/patient/medications/${medId}/taken`)
      setTaken(prev => ({ ...prev, [`${medId}-${time}`]: true }))
    } catch (err) {
      console.error('Failed to mark med as taken')
    }
  }

  const takenCount = Object.values(taken).filter(Boolean).length
  const total = meds.reduce((acc, med) => acc + med.times.length, 0) || 1
  const rate = Math.round((takenCount / total) * 100)

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Medications</Text>
        <Text style={s.sub}>Today's medication schedule</Text>

        {/* Adherence summary */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={[s.card, { flex: 1, marginBottom: 0 }]}>
            <Text style={s.adherenceTitle}>Today's Adherence</Text>
            <Text style={s.adherenceVal}>{rate}%</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{takenCount}/{total} taken</Text>
          </View>
          <View style={[s.card, { flex: 1, marginBottom: 0, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 36 }}>{rate === 100 ? '🌟' : '⏳'}</Text>
            <Text style={{ color: rate === 100 ? '#34d399' : '#fbbf24', fontWeight: '700', fontSize: 13, marginTop: 6 }}>
              {rate === 100 ? 'All done!' : 'In progress'}
            </Text>
          </View>
        </View>

        {/* Med cards */}
        {meds.map(m => (
          <View key={m.id} style={s.card}>
            <View style={s.medHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.medName}>{m.name}</Text>
                <Text style={s.medDosage}>{m.dosage}</Text>
              </View>
              <Text style={{ fontSize: 28 }}>💊</Text>
            </View>
            <View style={s.timeRow}>
              {m.times.map(time => {
                const key = `${m.id}-${time}`
                const isTaken = taken[key]
                return (
                  <View key={time} style={{ flex: 1 }}>
                    <View style={[s.timePill, isTaken ? s.timePillDone : s.timePillPending]}>
                      <Text style={isTaken ? s.timePillTextDone : s.timePillTextPending}>⏰ {time}</Text>
                    </View>
                    {!isTaken
                      ? <TouchableOpacity id={`take-${m.id}`} style={[s.markBtn, { marginTop: 8 }]} onPress={() => markTaken(m.id, time)}>
                          <Text style={s.markBtnText}>✓ Mark as Taken</Text>
                        </TouchableOpacity>
                      : <View style={[s.doneBadge, { marginTop: 8 }]}>
                          <Text style={s.doneBadgeText}>✅ Taken</Text>
                        </View>
                    }
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
