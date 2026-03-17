import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native'
import api from '../lib/api'

const { width } = Dimensions.get('window')

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050d1a' },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#e8f0fe', marginBottom: 4 },
  sub: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  card: { backgroundColor: '#0f1e35', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#4a5a72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  readingRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(96,165,250,0.08)', paddingVertical: 10, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chartBar: { borderRadius: 3, marginRight: 4 },
})

const statusColor: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#fbbf24',
  low:      '#34d399',
}

const getBPStatus = (sys: number, dia: number) => {
  if (sys >= 180 || dia >= 110) return 'critical'
  if (sys >= 140 || dia >= 90) return 'high'
  if (sys >= 130 || dia >= 80) return 'medium'
  return 'low'
}

export default function HistoryScreen() {
  const [filter, setFilter] = useState('7d')
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const res = await api.get('/patient/readings')
        const all = res.data.readings || []
        
        // Parse BP readings
        const bp = all.filter((r: any) => r.type === 'blood_pressure').map((r: any) => {
          const [sys, dia] = r.value.split('/').map(Number)
          const date = new Date(r.recorded_at)
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            sys,
            dia,
            status: getBPStatus(sys, dia),
            timestamp: date.getTime()
          }
        }).sort((a: any, b: any) => b.timestamp - a.timestamp)
        
        setReadings(bp)
      } catch (err) {
        console.error('Failed to fetch readings', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReadings()
  }, [])

  const displayed = filter === '7d' ? readings.slice(0, 7) : readings
  const maxSys = displayed.length > 0 ? Math.max(...displayed.map(r => r.sys)) : 200

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#34d399" size="large" />
      </View>
    )
  }

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Reading History</Text>
        <Text style={s.sub}>Your blood pressure over time</Text>

        {/* Filter */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {['7d', '30d'].map(f => (
            <TouchableOpacity key={f}
              style={[s.filterBtn, filter === f
                ? { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.1)' }
                : { borderColor: 'rgba(96,165,250,0.2)', backgroundColor: '#0f1e35' }
              ]}
              onPress={() => setFilter(f)}>
              <Text style={{ color: filter === f ? '#34d399' : '#94a3b8', fontWeight: '700', fontSize: 13 }}>
                {f === '7d' ? 'Last 7 days' : 'Last 30 days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bar chart */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Systolic (mmHg)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, marginBottom: 8 }}>
            {displayed.slice().reverse().map((r, i) => {
              const barH = (r.sys / maxSys) * 110
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={[s.chartBar, { height: barH, backgroundColor: statusColor[r.status], width: '70%' }]} />
                </View>
              )
            })}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {displayed.slice().reverse().map((r, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: '#4a5a72', fontSize: 8 }}>{r.date.split(' ')[1]}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            {Object.entries(statusColor).map(([k, c]) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
                <Text style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{k}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Table */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Readings Log</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Text style={{ flex: 1, fontSize: 11, color: '#4a5a72', fontWeight: '600' }}>DATE</Text>
            <Text style={{ width: 100, fontSize: 11, color: '#4a5a72', fontWeight: '600' }}>SYSTOLIC/DIASTOLIC</Text>
            <Text style={{ width: 70, fontSize: 11, color: '#4a5a72', fontWeight: '600' }}>STATUS</Text>
          </View>
          {displayed.map((r, i) => (
            <View key={i} style={s.readingRow}>
              <Text style={{ flex: 1, fontSize: 13, color: '#94a3b8' }}>{r.date}</Text>
              <Text style={{ width: 100, fontSize: 14, fontWeight: '700', color: statusColor[r.status] }}>{r.sys}/{r.dia}</Text>
              <View style={{ width: 70, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: `${statusColor[r.status]}20`, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: statusColor[r.status], fontWeight: '700', textTransform: 'capitalize' }}>{r.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
