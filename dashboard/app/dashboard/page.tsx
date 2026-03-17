'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '../../lib/api'
import {
  Box, Grid, Card, CardContent, Typography, Chip, Stack,
  AppBar, Toolbar, Button, Divider, List, ListItem, ListItemText, Avatar
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PeopleIcon from '@mui/icons-material/People'
import MedicationIcon from '@mui/icons-material/Medication'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const bpData = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  systolic:  128 + i * 1.8 + (i % 3) * 3,
  diastolic: 83  + i * 0.8,
}))

const condData = [
  { name: 'Hypertension', value: 3, color: '#f472b6' },
  { name: 'Diabetes',     value: 2, color: '#60a5fa' },
  { name: 'Asthma',       value: 1, color: '#a78bfa' },
  { name: 'Multiple',     value: 1, color: '#34d399' },
]

const recentAlerts = [
  { sev: 'critical', patient: 'John Mwangi',  msg: 'Critically high blood pressure: 182/115 mmHg',    time: '2h ago' },
  { sev: 'high',     patient: 'David Otieno', msg: 'Severe symptoms: chest pain, dizziness',           time: '30m ago' },
  { sev: 'high',     patient: 'Mary Achieng', msg: 'High blood glucose detected: 13.2 mmol/L',         time: '5h ago' },
  { sev: 'medium',   patient: 'Samuel Kamau', msg: "Medication 'Metformin' not logged for 3+ days",    time: '3h ago' },
]

const sevColor: Record<string, 'error' | 'warning' | 'success' | 'info'> = {
  critical: 'error', high: 'warning', medium: 'info', low: 'success',
}

const ttStyle = { background:'#0f1e35', border:'1px solid rgba(96,165,250,.2)', borderRadius:10, color:'#e8f0fe', fontSize:12 }

export default function OverviewPage() {
  const [doctor, setDoctor] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const d = localStorage.getItem('cdp_doctor')
    if (d) setDoctor(JSON.parse(d))

    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to load dashboard stats', err))
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Total Patients',    value: stats?.total_patients || 0,    icon: <PeopleIcon />,          color: '#60a5fa', cls: 'kpi-accent-blue',   change: 'Active roster', up: false },
    { label: 'Active Alerts',     value: stats?.total_open_alerts || 0,    icon: <WarningAmberIcon />,    color: '#ef4444', cls: 'kpi-accent-red',    change: `${stats?.critical_alerts || 0} critical`,    up: true },
    { label: 'Critical Readings', value: stats?.critical_alerts || 0,    icon: <TrendingUpIcon />,      color: '#f97316', cls: 'kpi-accent-orange', change: 'Requires attention',   up: true },
    { label: 'Adherence Rate',    value: '71%', icon: <MedicationIcon />,     color: '#34d399', cls: 'kpi-accent-teal',   change: '↓ −8% vs last wk', up: true },
  ]

  const condDataMap: any = {
    'Hypertension': { color: '#f472b6' },
    'Diabetes': { color: '#60a5fa' },
    'Asthma': { color: '#a78bfa' },
    'Cancer': { color: '#34d399' }
  }

  const liveCondData = stats?.condition_breakdown?.map((c: any) => ({
    name: c.Condition,
    value: c.Count,
    color: condDataMap[c.Condition]?.color || '#cbd5e1'
  })) || []

  const liveAlerts = stats?.recent_alerts || []

  return (
    <>
      <AppBar position="sticky" color="default">
        <Toolbar sx={{ gap: 2 }}>
          <Box flex={1}>
            <Typography variant="h6">Overview</Typography>
            <Typography variant="caption" color="text.secondary">Monday, 9 March 2026 · Nairobi General Hospital</Typography>
          </Box>
          <Button variant="contained" size="small" component={Link} href="/patients">+ Add Patient</Button>
        </Toolbar>
      </AppBar>

      <Box p={3}>
        {/* Greeting */}
        <Box mb={3}>
          <Typography variant="h5">Good morning, {doctor?.name?.split(' ')[1] || 'Doctor'} 👋</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            You have <Box component="span" color="error.main" fontWeight={700}>{stats?.total_open_alerts || 0} unacknowledged alerts</Box> and <Box component="span" color="warning.main" fontWeight={700}>{stats?.total_patients || 0} patients</Box> under monitoring.
          </Typography>
        </Box>

        {/* KPI cards */}
        <Grid container spacing={2} mb={3}>
          {kpis.map(k => (
            <Grid item xs={12} sm={6} md={3} key={k.label}>
              <Card className={k.cls} sx={{ position: 'relative', overflow: 'hidden', '&:hover': { transform: 'translateY(-2px)', transition: 'transform .2s' } }}>
                <CardContent>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, background: `${k.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: k.color }}>
                    {k.icon}
                  </Box>
                  <Typography variant="h4" sx={{ color: k.color, lineHeight: 1, mb: 0.5 }}>{k.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{k.label}</Typography>
                  <Typography variant="caption" sx={{ color: k.up ? 'error.main' : 'primary.main', fontWeight: 700, mt: 1, display: 'block' }}>
                    {k.change}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">📈 BP Trend – John Mwangi</Typography>
                  <Chip label="Hypertension" size="small" sx={{ background: 'rgba(244,114,182,.12)', color: '#f472b6', border: '1px solid rgba(244,114,182,.3)' }} />
                </Stack>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={bpData}>
                    <defs>
                      <linearGradient id="sys" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,.06)" />
                    <XAxis dataKey="day" tick={{ fill: '#4a5a72', fontSize: 9 }} tickLine={false} interval={5} />
                    <YAxis tick={{ fill: '#4a5a72', fontSize: 9 }} tickLine={false} domain={[70, 200]} />
                    <Tooltip contentStyle={ttStyle} />
                    <Area type="monotone" dataKey="systolic"  stroke="#ef4444" fill="url(#sys)" strokeWidth={2} name="Systolic" />
                    <Area type="monotone" dataKey="diastolic" stroke="#f97316" fill="url(#dia)" strokeWidth={2} name="Diastolic" />
                  </AreaChart>
                </ResponsiveContainer>
                <Stack direction="row" spacing={2} mt={1}>
                  <Typography variant="caption" sx={{ color: '#ef4444' }}>● Systolic</Typography>
                  <Typography variant="caption" sx={{ color: '#f97316' }}>● Diastolic</Typography>
                  <Typography variant="caption" color="error.main" ml="auto !important">⚠ Trending high</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" mb={2}>🩺 Patient Conditions</Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ width: 150 }}>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={liveCondData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                          {liveCondData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Stack spacing={1} flex={1}>
                    {liveCondData.map((c: any) => (
                      <Stack direction="row" alignItems="center" spacing={1} key={c.name}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" flex={1}>{c.name}</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: c.color }}>{c.value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent alerts */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">🚨 Recent Alerts</Typography>
              <Button variant="outlined" size="small" component={Link} href="/alerts">View all</Button>
            </Stack>
            <List disablePadding>
              {liveAlerts.length === 0 && <Typography variant="body2" color="text.secondary" mt={1}>No active alerts.</Typography>}
              {liveAlerts.map((a: any, i: number) => (
                <div key={a.id}>
                  <ListItem sx={{ px: 0, gap: 1.5 }}>
                    <Chip label={a.severity} size="small" color={sevColor[a.severity] || 'info'} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} />
                    <ListItemText
                      primary={a.Patient?.name || 'Unknown Patient'}
                      secondary={a.message}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: 13 }}
                      secondaryTypographyProps={{ fontSize: 12 }}
                    />
                    <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>{new Date(a.created_at).toLocaleDateString()}</Typography>
                    <Button variant="outlined" size="small" component={Link} href="/alerts">Review</Button>
                  </ListItem>
                  {i < liveAlerts.length - 1 && <Divider sx={{ borderColor: 'divider' }} />}
                </div>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}
