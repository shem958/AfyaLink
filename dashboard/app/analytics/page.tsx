'use client'
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, AppBar, Toolbar, Stack
} from '@mui/material'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const days = Array.from({ length: 30 }, (_, i) => `D${i + 1}`)
const bpData = days.map((day, i) => ({
  day,
  john:  128 + i * 1.8 + (i % 3) * 2,
  grace: 143 + i * 0.5 + (i % 5) * 3,
}))
const glucData = days.map((day, i) => ({
  day,
  mary:   6.4 + (i % 7) * 1.0,
  samuel: 7.1 + (i % 5) * 0.8,
}))
const alertTypes = [
  { type: 'High BP',       count: 14 },
  { type: 'High Glucose',  count: 8  },
  { type: 'Missed Med',    count: 5  },
  { type: 'Symptoms',      count: 3  },
]
const adherence = [
  { week: 'Week 1', rate: 92 },
  { week: 'Week 2', rate: 87 },
  { week: 'Week 3', rate: 78 },
  { week: 'Week 4', rate: 71 },
]

const tt = { background:'#0f1e35', border:'1px solid rgba(96,165,250,.2)', borderRadius:10, color:'#e8f0fe', fontSize:12 }

export default function AnalyticsPage() {
  return (
    <>
      <AppBar position="sticky" color="default">
        <Toolbar>
          <Box flex={1}>
            <Typography variant="h6">Analytics & Reports</Typography>
            <Typography variant="caption" color="text.secondary">Population health trends · March 2026</Typography>
          </Box>
          <Button variant="outlined" size="small">⬇ Export PDF</Button>
        </Toolbar>
      </AppBar>

      <Box p={3}>
        {/* Summary KPIs */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Avg Blood Pressure', value: '151/97',      sub: 'Hypertension cohort',      color: '#f472b6' },
            { label: 'Avg Glucose',         value: '8.3 mmol/L',  sub: 'Diabetes cohort',          color: '#60a5fa' },
            { label: 'Med. Adherence',      value: '71%',         sub: '↓ vs 89% last month',      color: '#fbbf24' },
          ].map(k => (
            <Grid item xs={12} md={4} key={k.label}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>{k.label}</Typography>
                  <Typography variant="h4" sx={{ color: k.color, mt: 0.5 }}>{k.value}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>{k.sub}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* BP trend */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">🩺 Blood Pressure Trends (30 days)</Typography>
              <Chip label="Hypertension Patients" size="small" sx={{ background:'rgba(244,114,182,.12)', color:'#f472b6', border:'1px solid rgba(244,114,182,.3)' }} />
            </Stack>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bpData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,.06)" />
                <XAxis dataKey="day" tick={{ fill:'#4a5a72', fontSize:9 }} tickLine={false} interval={5} />
                <YAxis tick={{ fill:'#4a5a72', fontSize:9 }} tickLine={false} domain={[110, 210]} />
                <Tooltip contentStyle={tt} />
                <Legend wrapperStyle={{ color:'#94a3b8', fontSize:12 }} />
                <Line type="monotone" dataKey="john"  stroke="#ef4444" strokeWidth={2} dot={false} name="John Mwangi" />
                <Line type="monotone" dataKey="grace" stroke="#f472b6" strokeWidth={2} dot={false} name="Grace Njeri" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Grid container spacing={2.5} mb={2.5}>
          {/* Glucose */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">🩸 Glucose Trends</Typography>
                  <Chip label="Diabetes" size="small" sx={{ background:'rgba(96,165,250,.12)', color:'#60a5fa', border:'1px solid rgba(96,165,250,.3)' }} />
                </Stack>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={glucData}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,.06)" />
                    <XAxis dataKey="day" tick={{ fill:'#4a5a72', fontSize:9 }} tickLine={false} interval={6} />
                    <YAxis tick={{ fill:'#4a5a72', fontSize:9 }} tickLine={false} />
                    <Tooltip contentStyle={tt} />
                    <Legend wrapperStyle={{ color:'#94a3b8', fontSize:11 }} />
                    <Area type="monotone" dataKey="mary"   stroke="#60a5fa" fill="url(#g1)" strokeWidth={2} name="Mary Achieng" />
                    <Area type="monotone" dataKey="samuel" stroke="#34d399" fill="url(#g2)" strokeWidth={2} name="Samuel Kamau" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Alert bar chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>🚨 Alerts by Type</Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={alertTypes} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,.06)" />
                    <XAxis dataKey="type" tick={{ fill:'#4a5a72', fontSize:10 }} tickLine={false} />
                    <YAxis tick={{ fill:'#4a5a72', fontSize:10 }} tickLine={false} />
                    <Tooltip contentStyle={tt} />
                    <Bar dataKey="count" fill="#60a5fa" radius={[6,6,0,0]} name="Alerts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Adherence */}
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">💊 Medication Adherence Trend</Typography>
              <Typography variant="body2" color="error.main" fontWeight={700}>↓ Declining – intervention needed</Typography>
            </Stack>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={adherence}>
                <defs>
                  <linearGradient id="adh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,.06)" />
                <XAxis dataKey="week" tick={{ fill:'#4a5a72', fontSize:11 }} tickLine={false} />
                <YAxis tick={{ fill:'#4a5a72', fontSize:11 }} tickLine={false} domain={[50,100]} tickFormatter={v=>`${v}%`} />
                <Tooltip contentStyle={tt} formatter={(v:any) => [`${v}%`, 'Adherence']} />
                <Area type="monotone" dataKey="rate" stroke="#fbbf24" fill="url(#adh)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    </>
  )
}
