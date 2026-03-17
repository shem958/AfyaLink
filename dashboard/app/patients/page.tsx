'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '../../lib/api'
import {
  Box, Card, CardContent, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Button, AppBar, Toolbar, Stack, Avatar,
  InputAdornment
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

const condColor: Record<string, string> = {
  Hypertension: '#f472b6', Diabetes: '#60a5fa', Asthma: '#a78bfa', Cancer: '#34d399', Multiple: '#34d399'
}

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [condFilter, setCondFilter] = useState('')
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/patients')
      .then(res => setPatients(res.data.patients || []))
      .catch(err => console.error('Failed to fetch patients', err))
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)) &&
    (!condFilter || p.condition === condFilter)
  )

  return (
    <>
      <AppBar position="sticky" color="default">
        <Toolbar sx={{ gap: 2 }}>
          <Box flex={1}>
            <Typography variant="h6">Patients</Typography>
            <Typography variant="caption" color="text.secondary">{patients.length} under monitoring</Typography>
          </Box>
          <Button variant="contained" size="small" startIcon={<PersonAddIcon />}>Enrol Patient</Button>
        </Toolbar>
      </AppBar>

      <Box p={3}>
        <Stack direction="row" spacing={2} mb={2.5}>
          <TextField
            id="patient-search"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled', fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl sx={{ width: 190 }} size="small">
            <InputLabel id="cond-filter-label">All Conditions</InputLabel>
            <Select
              labelId="cond-filter-label"
              id="condition-filter"
              value={condFilter}
              label="All Conditions"
              onChange={e => setCondFilter(e.target.value)}
            >
              <MenuItem value="">All Conditions</MenuItem>
              <MenuItem value="Hypertension">Hypertension</MenuItem>
              <MenuItem value="Diabetes">Diabetes</MenuItem>
              <MenuItem value="Asthma">Asthma</MenuItem>
              <MenuItem value="Cancer">Cancer</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Card sx={{ overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Age / Sex</TableCell>
                <TableCell>Last Reading</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Alerts</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(p => {
                const initials = p.name ? p.name.split(' ').map((n: string) => n[0]).join('') : 'UN'
                const latest = p.latest_reading
                const rdate = latest ? new Date(latest.recorded_at).toLocaleString() : '—'
                const readingStr = latest
                  ? latest.type === 'blood_pressure' && latest.systolic && latest.diastolic
                    ? `${latest.systolic}/${latest.diastolic} ${latest.unit || 'mmHg'}`
                    : `${latest.value} ${latest.unit || ''}`
                  : '—'
                
                let riskType: 'success' | 'warning' | 'error' | 'info' = 'success'
                if (p.alert_count > 0) riskType = 'warning'
                if (p.alert_count > 2) riskType = 'error'

                return (
                <TableRow key={p.id} component={Link} href={`/patients/${p.id}`} sx={{ textDecoration: 'none' }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 34, height: 34, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {initials}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{p.name}</Typography>
                        <Typography variant="caption" color="text.disabled">{p.phone}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.condition} size="small"
                      sx={{ background: `${condColor[p.condition] || '#cbd5e1'}20`, color: condColor[p.condition] || '#94a3b8', border: `1px solid ${condColor[p.condition] || '#cbd5e1'}55`, fontWeight: 600, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.age}yrs · {p.gender}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{readingStr}</Typography>
                    <Typography variant="caption" color="text.disabled">{rdate}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.alert_count > 0 ? (p.alert_count > 2 ? 'critical' : 'attention') : 'stable'} size="small" color={riskType} variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase' }} />
                  </TableCell>
                  <TableCell>
                    {p.alert_count > 0
                      ? <Typography variant="body2" color="error.main" fontWeight={700}>{p.alert_count} open</Typography>
                      : <Typography variant="body2" color="text.disabled">None</Typography>
                    }
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" size="small">View →</Button>
                  </TableCell>
                </TableRow>
              )})}
              {filtered.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>No patients found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </>
  )
}
