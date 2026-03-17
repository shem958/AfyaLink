import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native'

import api from '../lib/api'

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050d1a' },
  scroll: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#e8f0fe', marginBottom: 4 },
  sub: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#4a5a72', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  chipDefault:   { borderColor: 'rgba(96,165,250,0.2)', backgroundColor: '#0f1e35' },
  chipSelected:  { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.1)' },
  chipText: { fontWeight: '600', fontSize: 13 },
  chipTextDefault:  { color: '#94a3b8' },
  chipTextSelected: { color: '#ef4444' },
  severityBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginHorizontal: 4 },
  card: { backgroundColor: '#0f1e35', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(96,165,250,0.12)' },
  input: { backgroundColor: '#0a1628', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(96,165,250,0.2)', color: '#e8f0fe', fontSize: 14, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#34d399', borderRadius: 14, padding: 16, alignItems: 'center' },
  submitText: { color: '#050d1a', fontWeight: '800', fontSize: 16 },
})

const symptomList = [
  // Hypertension
  'Headache', 'Dizziness', 'Chest pain',
  // Diabetes
  'Fatigue', 'Blurred vision', 'Numbness', 'Frequent Urination', 'Increased Thirst',
  // Asthma
  'Shortness of breath', 'Wheezing', 'Coughing', 'Chest Tightness',
  // Cancer
  'Severe Nausea', 'Extreme Fatigue', 'Loss of Appetite', 'Hair Loss', 'Fever'
]

const severities = [
  { key: 'mild',     label: 'Mild',     emoji: '😐', color: '#22c55e' },
  { key: 'moderate', label: 'Moderate', emoji: '😟', color: '#fbbf24' },
  { key: 'severe',   label: 'Severe',   emoji: '😰', color: '#ef4444' },
]

export default function SymptomsScreen() {
  const [selected, setSelected] = useState<string[]>([])
  const [severity, setSeverity] = useState<string>('mild')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggle = (s: string) => setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const submit = async () => {
    if (selected.length === 0) return
    setLoading(true)
    try {
      await api.post('/patient/symptoms', {
        symptoms: selected,
        severity,
        notes
      })
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3500)
      setSelected([]); setNotes('')
    } catch (err) {
      console.error('Failed to submit symptom report', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Report Symptoms</Text>
        <Text style={s.sub}>Let your doctor know how you feel</Text>

        {/* Symptoms */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Select Symptoms</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {symptomList.map(sym => {
              const sel = selected.includes(sym)
              return (
                <TouchableOpacity key={sym} id={`sym-${sym.replace(' ','-')}`}
                  style={[s.chip, sel ? s.chipSelected : s.chipDefault]} onPress={() => toggle(sym)}>
                  <Text style={[s.chipText, sel ? s.chipTextSelected : s.chipTextDefault]}>{sym}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Severity */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Severity</Text>
          <View style={{ flexDirection: 'row' }}>
            {severities.map(sev => (
              <TouchableOpacity key={sev.key} id={`sev-${sev.key}`}
                style={[s.severityBtn, {
                  borderColor: severity === sev.key ? `${sev.color}55` : 'rgba(96,165,250,0.12)',
                  backgroundColor: severity === sev.key ? `${sev.color}15` : '#0a1628',
                }]}
                onPress={() => setSeverity(sev.key)}>
                <Text style={{ fontSize: 28 }}>{sev.emoji}</Text>
                <Text style={{ fontWeight: '700', fontSize: 12, color: severity === sev.key ? sev.color : '#94a3b8', marginTop: 4 }}>{sev.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Additional Notes</Text>
          <TextInput
            id="symptom-notes"
            style={s.input}
            placeholder="Describe how you feel…"
            placeholderTextColor="#4a5a72"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {submitted
          ? <View style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' }}>
              <Text style={{ fontSize: 32 }}>✅</Text>
              <Text style={{ color: '#34d399', fontWeight: '800', fontSize: 16, marginTop: 8 }}>Report Submitted</Text>
              <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Your doctor has been notified</Text>
            </View>
          : <TouchableOpacity id="submit-symptoms-btn" style={[s.submitBtn, (selected.length === 0 || loading) && { opacity: 0.4 }]} onPress={submit} disabled={loading || selected.length === 0}>
              <Text style={s.submitText}>{loading ? 'Submitting...' : '📤 Submit Report'}</Text>
            </TouchableOpacity>
        }
      </ScrollView>
    </View>
  )
}
