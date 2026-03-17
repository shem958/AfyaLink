'use client'
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import {
  Box, Card, CardContent, Typography, Chip, Button, Stack, AppBar, Toolbar,
  List, ListItem, Divider, ToggleButtonGroup, ToggleButton
} from '@mui/material'

const condColor: Record<string, string> = { Hypertension:'#f472b6', Diabetes:'#60a5fa', Asthma:'#a78bfa', Cancer: '#34d399' }
const sevColor:  Record<string, 'error'|'warning'|'info'|'success'> = { critical:'error', high:'warning', medium:'info', low:'success' }
const sevEmoji:  Record<string, string> = { critical:'🫀', high:'🤒', medium:'💊', low:'✅' }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchAlerts = () => {
    api.get('/alerts')
      .then(res => setAlerts(res.data.alerts || []))
      .catch(err => console.error('Failed to fetch alerts', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const ack = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/acknowledge`)
      // Optimistically update UI
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
    } catch (err) {
      console.error('Failed to acknowledge alert', err)
    }
  }

  const displayed = filter === 'unack'
    ? alerts.filter(a => !a.acknowledged)
    : filter === 'all' ? alerts : alerts.filter(a => a.severity === filter)

  const unack    = alerts.filter(a => !a.acknowledged).length
  const critical = alerts.filter(a => a.severity === 'critical').length
  const high     = alerts.filter(a => a.severity === 'high').length
  const medium   = alerts.filter(a => a.severity === 'medium').length

  return (
    <>
      <AppBar position="sticky" color="default">
        <Toolbar>
          <Box flex={1}>
            <Typography variant="h6">Alerts</Typography>
            <Typography variant="caption" color="text.secondary">{unack} unacknowledged</Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box p={3}>
        {/* Summary cards */}
        <Stack direction="row" spacing={2} mb={3}>
          {[
            { label: 'Critical', count: critical, color: 'error'   as const },
            { label: 'High',     count: high,     color: 'warning' as const },
            { label: 'Medium',   count: medium,   color: 'info'    as const },
          ].map(s => (
            <Card key={s.label} sx={{ flex: '0 0 auto' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
                <Chip label={s.label.toLowerCase()} size="small" color={s.color} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} />
                <Typography variant="h5" color={`${s.color}.main`} fontWeight={900}>{s.count}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Filters */}
        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small" sx={{ mb: 2 }}>
          <ToggleButton value="all">All ({alerts.length})</ToggleButton>
          <ToggleButton value="unack" sx={{ color: unack > 0 ? 'error.main' : undefined }}>Unacknowledged ({unack})</ToggleButton>
          <ToggleButton value="critical">Critical</ToggleButton>
          <ToggleButton value="high">High</ToggleButton>
          <ToggleButton value="medium">Medium</ToggleButton>
        </ToggleButtonGroup>

        <Card>
          <List disablePadding>
            {displayed.map((a, i) => (
              <div key={a.id}>
                <ListItem sx={{ gap: 1.5, py: 2, px: 2.5, opacity: a.acknowledged ? 0.5 : 1 }}>
                  <Typography fontSize={22}>{sevEmoji[a.severity] || '⚠️'}</Typography>
                  <Box flex={1}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <Chip label={a.severity} size="small" color={sevColor[a.severity] || 'info'} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} />
                      <Typography variant="body2" fontWeight={700}>{a.Patient?.name || 'Unknown Patient'}</Typography>
                      {a.Patient?.condition && (
                        <Chip label={a.Patient?.condition} size="small"
                          sx={{ background: `${condColor[a.Patient?.condition] || '#60a5fa'}20`, color: condColor[a.Patient?.condition] || '#60a5fa', border: `1px solid ${condColor[a.Patient?.condition] || '#60a5fa'}55`, fontSize: '0.65rem' }} />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{a.message}</Typography>
                    <Typography variant="caption" color="text.disabled" mt={0.5} display="block">{new Date(a.created_at).toLocaleString()}</Typography>
                  </Box>
                  {a.acknowledged
                    ? <Typography variant="caption" color="success.main" fontWeight={700}>✓ Acknowledged</Typography>
                    : <Button id={`ack-${a.id}`} variant="contained" size="small" onClick={() => ack(a.id)}>Acknowledge</Button>
                  }
                </ListItem>
                {i < displayed.length - 1 && <Divider sx={{ borderColor: 'divider' }} />}
              </div>
            ))}
            {displayed.length === 0 && !loading && (
              <ListItem>
                <Typography variant="body2" color="text.secondary" py={2}>No alerts in this filter</Typography>
              </ListItem>
            )}
          </List>
        </Card>
      </Box>
    </>
  )
}
