import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import api from '../lib/api'

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050d1a' },
  header: { padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(96,165,250,0.1)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '800', fontSize: 16 },
  doctorName: { fontSize: 16, fontWeight: '800', color: '#e8f0fe' },
  doctorRole: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  scroll: { flex: 1, padding: 16 },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 14, marginBottom: 10 },
  bubbleDoctor: { backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleMe:     { backgroundColor: '#0f1e35', borderWidth: 1, borderColor: 'rgba(96,165,250,0.15)', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: '#e8f0fe', lineHeight: 20 },
  bubbleMeta: { fontSize: 10, color: '#4a5a72', marginTop: 4 },
  inputRow: { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(96,165,250,0.1)', backgroundColor: '#0a1628' },
  input: { flex: 1, backgroundColor: '#0f1e35', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', color: '#e8f0fe', fontSize: 14, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#34d399', alignItems: 'center', justifyContent: 'center' },
})

export default function MessagesScreen() {
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, messagesRes] = await Promise.all([
          api.get('/patient/profile'),
          api.get('/patient/messages')
        ])
        setProfile(profileRes.data.patient)
        setMessages(messagesRes.data.messages || [])
      } catch (err) {
        console.error('Failed to fetch messages', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const send = async () => {
    if (!text.trim() || !profile) return
    const content = text.trim()
    setText('')
    
    try {
      const res = await api.post('/patient/messages', {
        patient_id: profile.id,
        doctor_id: profile.doctor_id,
        content
      })
      setMessages(prev => [...prev, res.data.message])
    } catch (err) {
      console.error('Failed to send message', err)
      alert('Failed to send message')
    }
  }

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#34d399" size="large" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Doctor header */}
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>AO</Text></View>
        <View>
          <Text style={s.doctorName}>Dr. Amina Odhiambo</Text>
          <Text style={s.doctorRole}>Cardiologist · Nairobi General</Text>
        </View>
        <View style={{ marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' }}>
          <Text style={{ color: '#34d399', fontSize: 11, fontWeight: '600' }}>● Online</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {messages.map(m => {
          const isDoc = m.sender_type === 'doctor'
          const time = new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          
          return (
            <View key={m.id} style={{ alignItems: isDoc ? 'flex-start' : 'flex-end' }}>
              {isDoc && (
                <Text style={{ fontSize: 10, color: '#4a5a72', marginBottom: 3, marginLeft: 2 }}>🩺 Dr. Amina</Text>
              )}
              <View style={[s.bubble, isDoc ? s.bubbleDoctor : s.bubbleMe]}>
                <Text style={s.bubbleText}>{m.content}</Text>
                <Text style={s.bubbleMeta}>{time}</Text>
              </View>
            </View>
          )
        })}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          id="patient-message-input"
          style={s.input}
          placeholder="Message your doctor…"
          placeholderTextColor="#4a5a72"
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
        />
        <TouchableOpacity id="patient-send-btn" style={s.sendBtn} onPress={send}>
          <Text style={{ fontSize: 18 }}>📤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
