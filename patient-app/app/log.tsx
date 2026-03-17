import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native'

import api from '../lib/api'

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050d1a' },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#e8f0fe', marginBottom: 4 },
  sub: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#4a5a72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)', backgroundColor: '#0f1e35', alignItems: 'center', marginHorizontal: 4 },
  typeBtnActive: { borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.08)' },
  typeBtnText: { color: '#94a3b8', fontWeight: '600', fontSize: 12, marginTop: 6 },
  typeBtnTextActive: { color: '#34d399' },
  card: { backgroundColor: '#0f1e35', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)' },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#0a1628', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', color: '#e8f0fe', fontSize: 20, fontWeight: '700', padding: 14, textAlign: 'center' },
  bigInput: { fontSize: 36 },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: '#34d399', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#050d1a', fontWeight: '800', fontSize: 16 },
  refCard: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(96,165,250,0.08)', flexDirection: 'row', justifyContent: 'space-between' },
})

const types = [
  { key: 'blood_pressure', label: 'Blood Pressure', emoji: '🫀', unit: 'mmHg' },
  { key: 'glucose', label: 'Blood Sugar', emoji: '🩸', unit: 'mmol/L' },
  { key: 'heart_rate', label: 'Heart Rate', emoji: '💓', unit: 'bpm' },
  { key: 'weight', label: 'Weight', emoji: '⚖️', unit: 'kg' },
  { key: 'pain_level', label: 'Pain Level', emoji: '🤕', unit: '/10' },
  { key: 'spo2', label: 'Oxygen (SpO2)', emoji: '🫁', unit: '%' },
  { key: 'peak_flow', label: 'Peak Flow', emoji: '🌬️', unit: 'L/min' },
]

const normalRanges = {
  blood_pressure: { normal: '< 120/80', warning: '120–139 / 80–89', high: '≥ 140/90' },
  glucose: { normal: '3.9–7.0', warning: '7.0–10.0', high: '> 10.0' },
  heart_rate: { normal: '60–100 bpm', warning: '—', high: '> 100 bpm' },
  weight: { normal: 'Stable', warning: 'Sudden ±2kg', high: 'Continuous loss' },
  pain_level: { normal: '0–3', warning: '4–7', high: '8–10' },
  spo2: { normal: '≥ 95%', warning: '90–94%', high: '< 90%' },
  peak_flow: { normal: '> 80% personal best', warning: '50–80%', high: '< 50%' },
}

export default function LogScreen() {
  const [type, setType] = useState('blood_pressure')
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (type === 'blood_pressure' && (!systolic || !diastolic)) { Alert.alert('Error', 'Please enter both systolic and diastolic values'); return }
    if (type !== 'blood_pressure' && !value) { Alert.alert('Error', 'Please enter a value'); return }
    
    setLoading(true)
    try {
      const payload: any = { type, unit: types.find(t => t.key === type)?.unit }
      
      if (type === 'blood_pressure') {
        payload.systolic = parseFloat(systolic)
        payload.diastolic = parseFloat(diastolic)
      } else {
        payload.value = parseFloat(value)
      }

      await api.post('/patient/readings', payload)
      
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
      setSystolic(''); setDiastolic(''); setValue('')
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Could not save reading')
    } finally {
      setLoading(false)
    }
  }

  const range = normalRanges[type as keyof typeof normalRanges]

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Log Reading</Text>
        <Text style={s.sub}>Record your health metric</Text>

        {/* Type selector */}
        <Text style={s.sectionTitle}>What are you recording?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
          {types.map(t => (
            <TouchableOpacity key={t.key} style={[s.typeBtn, { minWidth: '30%', flexGrow: 1, marginHorizontal: 0 }, type === t.key && s.typeBtnActive]} onPress={() => setType(t.key)}>
              <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
              <Text style={[s.typeBtnText, type === t.key && s.typeBtnTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={s.card}>
          <Text style={s.label}>Enter value ({types.find(t => t.key === type)?.unit})</Text>
          {type === 'blood_pressure'
            ? <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...s.label, marginBottom: 4 }}>Systolic</Text>
                  <TextInput id="systolic-input" style={[s.input, s.bigInput]} keyboardType="numeric" value={systolic} onChangeText={setSystolic} placeholder="120" placeholderTextColor="#4a5a72" />
                </View>
                <View style={{ alignSelf: 'flex-end', paddingBottom: 12 }}><Text style={{ color: '#94a3b8', fontSize: 24, fontWeight: '300' }}>/</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...s.label, marginBottom: 4 }}>Diastolic</Text>
                  <TextInput id="diastolic-input" style={[s.input, s.bigInput]} keyboardType="numeric" value={diastolic} onChangeText={setDiastolic} placeholder="80" placeholderTextColor="#4a5a72" />
                </View>
              </View>
            : <TextInput id="value-input" style={[s.input, s.bigInput]} keyboardType="decimal-pad" value={value} onChangeText={setValue} placeholder={type === 'glucose' ? '7.2' : '75'} placeholderTextColor="#4a5a72" />
          }
        </View>

        {/* Reference */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Reference Ranges</Text>
          {Object.entries(range).map(([k, v]) => (
            <View key={k} style={s.refCard}>
              <Text style={{ color: k === 'normal' ? '#34d399' : k === 'warning' ? '#fbbf24' : '#ef4444', fontWeight: '700', fontSize: 13, textTransform: 'capitalize' }}>{k}</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>{v}</Text>
            </View>
          ))}
        </View>

        {submitted
          ? <View style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' }}>
              <Text style={{ color: '#34d399', fontWeight: '700', fontSize: 16 }}>✅ Reading Logged!</Text>
              <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 13 }}>Your doctor has been notified</Text>
            </View>
          : <TouchableOpacity id="submit-reading-btn" style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
              <Text style={s.submitText}>{loading ? 'Submitting...' : '📤 Submit Reading'}</Text>
            </TouchableOpacity>
        }
      </ScrollView>
    </View>
  )
}
