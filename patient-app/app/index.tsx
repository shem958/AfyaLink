import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import api from '../lib/api'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050d1a' },
  scroll: { padding: 20 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#e8f0fe', marginBottom: 4 },
  sub: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  card: { backgroundColor: '#0f1e35', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)' },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#4a5a72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  reading: { fontSize: 28, fontWeight: '900', color: '#34d399', marginBottom: 2 },
  readingUnit: { fontSize: 13, color: '#94a3b8' },
  alertCard: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#ef4444', marginBottom: 4 },
  alertMsg: { fontSize: 14, color: '#e8f0fe' },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(96,165,250,0.08)' },
  medName: { fontSize: 14, fontWeight: '700', color: '#e8f0fe', flex: 1 },
  medDosage: { fontSize: 12, color: '#94a3b8' },
  pillBadge: { backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  pillText: { fontSize: 11, color: '#34d399', fontWeight: '600' },
  sectionBtn: { backgroundColor: '#0a1628', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)' },
  sectionBtnText: { fontSize: 15, fontWeight: '700', color: '#e8f0fe', flex: 1, marginLeft: 12 },
})

export default function HomeScreen() {
  const router = useRouter()
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [latestReading, setLatestReading] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, readRes, msgRes] = await Promise.all([
          api.get('/patient/profile'),
          api.get('/patient/readings'),
          api.get('/patient/messages').catch(() => ({ data: { messages: [] } }))
        ])
        
        setProfile(profRes.data.patient)
        if (readRes.data.readings && readRes.data.readings.length > 0) {
          setLatestReading(readRes.data.readings[0])
        }
        if (msgRes.data.messages) {
          setMessages(msgRes.data.messages)
        }
      } catch (err) {
        console.error('Failed to load dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const triggerEmergency = () => {
    Alert.alert(
      "Trigger Emergency SOS?",
      "This will immediately alert your doctor. Only use this in true emergencies.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Trigger SOS", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.post('/patient/emergency')
              Alert.alert("SOS Sent", "Emergency alert dispatched successfully.")
            } catch (err) {
              Alert.alert("Error", "Failed to send SOS. Please call emergency services directly.")
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#34d399" />
      </View>
    )
  }

  const firstName = profile?.name?.split(' ')[0] || 'Patient'

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
        <Text style={styles.sub}>{today} · Stay on track today</Text>

        {/* Highlighted Alerts / Messages */}
        {messages.length > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>🚨 Doctor Message</Text>
            <Text style={styles.alertMsg}>{messages[0].content}</Text>
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              Received {new Date(messages[0].created_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Latest Reading */}
        {latestReading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last Reading ({latestReading.type.replace('_', ' ')})</Text>
            {latestReading.type === 'blood_pressure' ? (
              <Text style={styles.reading}>{latestReading.systolic}/{latestReading.diastolic}</Text>
            ) : (
              <Text style={styles.reading}>{latestReading.value}</Text>
            )}
            <Text style={styles.readingUnit}>{latestReading.unit} · {new Date(latestReading.recorded_at).toLocaleDateString()}</Text>
          </View>
        )}

        {/* Today's meds */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Medications</Text>
          {profile?.Medications?.length > 0 ? (
            profile.Medications.map((m: any) => (
              <View key={m.id} style={styles.medRow}>
                <Text style={{ fontSize: 18, marginRight: 10 }}>⏳</Text>
                <Text style={styles.medName}>{m.name}</Text>
                <Text style={styles.medDosage}>{m.dosage}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#94a3b8' }}>No medications prescribed.</Text>
          )}
        </View>

        {/* Emergency SOS */}
        <TouchableOpacity 
          style={{ backgroundColor: '#ef4444', borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#ef4444', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
          activeOpacity={0.8}
          onPress={triggerEmergency}
        >
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🚨</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1 }}>Emergency SOS</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Notify your doctor immediately</Text>
        </TouchableOpacity>

        {/* Quick actions */}
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Actions</Text>
        <TouchableOpacity style={styles.sectionBtn} activeOpacity={0.7} onPress={() => router.push('/log')}>
          <Text style={{ fontSize: 22 }}>📊</Text>
          <Text style={styles.sectionBtnText}>Log New Reading</Text>
          <Text style={{ color: '#4a5a72', fontSize: 18 }}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sectionBtn} activeOpacity={0.7} onPress={() => router.push('/symptoms')}>
          <Text style={{ fontSize: 22 }}>🤒</Text>
          <Text style={styles.sectionBtnText}>Report Symptoms</Text>
          <Text style={{ color: '#4a5a72', fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
