'use client'
import { use } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const patientData: Record<string, any> = {
  p1: {
    name: 'John Mwangi', age: 58, gender: 'Male', phone: '0712345678', condition: 'hypertension',
    medications: [
      { name: 'Amlodipine', dosage: '5mg', schedule: '08:00', frequency: 'Daily', active: true },
      { name: 'Losartan', dosage: '50mg', schedule: '20:00', frequency: 'Daily', active: true },
    ],
    readings: Array.from({ length: 30 }, (_, i) => ({
      day: `Mar ${i + 1}`,
      systolic: 130 + i * 1.8 + (i % 3) * 3,
      diastolic: 85 + i * 0.8,
    })),
    alerts: [
      { severity: 'critical', message: 'Critically high blood pressure: 182/115 mmHg', time: '2h ago' },
      { severity: 'medium', message: 'Blood pressure above normal range: 145/92 mmHg', time: '1d ago' },
    ],
  },
  p2: {
    name: 'Mary Achieng', age: 45, gender: 'Female', phone: '0723456789', condition: 'diabetes',
    medications: [
      { name: 'Metformin', dosage: '500mg', schedule: '08:00, 20:00', frequency: 'Twice daily', active: true },
      { name: 'Glibenclamide', dosage: '5mg', schedule: '07:00', frequency: 'Daily', active: true },
    ],
    readings: Array.from({ length: 30 }, (_, i) => ({
      day: `Mar ${i + 1}`,
      value: 6.5 + (i % 7) * 1.1,
    })),
    alerts: [
      { severity: 'high', message: 'High blood glucose detected: 13.2 mmol/L', time: '5h ago' },
    ],
  },
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const p = patientData[id] || patientData['p1']
  const isGlucose = p.condition === 'diabetes'
  const tooltipStyle = { background: '#0f1e35', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '10px', color: '#e8f0fe' }

  return (
    <>
      <div className="top-bar">
        <div>
          <Link href="/patients" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>← Patients /</Link>
          <div className="top-bar-title" style={{ display: 'inline', marginLeft: '8px' }}>{p.name}</div>
        </div>
        <Link href="/messages" className="btn btn-primary btn-sm">💬 Message</Link>
      </div>

      <div className="page-content">
        {/* Header */}
        <div className="card mb-6" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="avatar" style={{ width: 60, height: 60, fontSize: '22px' }}>
            {p.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800 }}>{p.name}</h1>
            <div className="flex gap-3 mt-2">
              <span className={`condition-badge condition-${p.condition}`}>{p.condition}</span>
              <span className="text-sm text-muted">{p.age} yrs · {p.gender}</span>
              <span className="text-sm text-muted">📱 {p.phone}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm">Edit Patient</button>
          </div>
        </div>

        <div className="grid-2 mb-6">
          {/* Trend chart */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">
                {isGlucose ? '🩸 Blood Glucose (30 days)' : '🫀 Blood Pressure (30 days)'}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={p.readings}>
                <defs>
                  <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isGlucose ? '#60a5fa' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isGlucose ? '#60a5fa' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                  {!isGlucose && (
                    <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.08)" />
                <XAxis dataKey="day" tick={{ fill: '#4a5a72', fontSize: 9 }} tickLine={false} interval={6} />
                <YAxis tick={{ fill: '#4a5a72', fontSize: 9 }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                {isGlucose
                  ? <Area type="monotone" dataKey="value" stroke="#60a5fa" fill="url(#r1)" strokeWidth={2} name="Glucose (mmol/L)" />
                  : <>
                      <Area type="monotone" dataKey="systolic" stroke="#ef4444" fill="url(#r1)" strokeWidth={2} name="Systolic" />
                      <Area type="monotone" dataKey="diastolic" stroke="#f97316" fill="url(#r2)" strokeWidth={2} name="Diastolic" />
                    </>
                }
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Medications */}
          <div className="card">
            <div className="section-title mb-4">💊 Medications</div>
            {p.medications.map((m: any, i: number) => (
              <div key={i} style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '10px', marginBottom: '10px', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div style={{ fontWeight: 700 }}>{m.name}</div>
                  <span style={{ background: 'var(--low-bg)', color: 'var(--low)', border: '1px solid var(--low-border)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>Active</span>
                </div>
                <div className="text-sm text-muted mt-1">{m.dosage} · {m.frequency} · ⏰ {m.schedule}</div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm w-full mt-2">+ Add Medication</button>
          </div>
        </div>

        {/* Alerts history */}
        <div className="card">
          <div className="section-title mb-4">🚨 Alert History</div>
          {p.alerts.map((a: any, i: number) => (
            <div key={i} className="alert-item">
              <span className={`severity-badge severity-${a.severity}`}>{a.severity}</span>
              <div style={{ flex: 1 }}>{a.message}</div>
              <span className="text-xs text-muted">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
