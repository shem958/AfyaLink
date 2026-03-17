'use client'
import { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Stack, Divider
} from '@mui/material'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const DEMO = { email: 'doctor@hospital.com', password: 'password123' }

export default function LoginPage() {
  const [email, setEmail]     = useState(DEMO.email)
  const [password, setPassword] = useState(DEMO.password)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    try {
      const res = await fetch(`${API}/api/auth/login/doctor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('cdp_token', data.token)
        localStorage.setItem('cdp_doctor', JSON.stringify(data.doctor))
        window.location.href = '/dashboard'
        return
      }
    } catch { /* backend offline — fall through to demo mode */ }

    // Demo mode fallback
    if (email === DEMO.email && password === DEMO.password) {
      localStorage.setItem('cdp_token', 'demo_token')
      localStorage.setItem('cdp_doctor', JSON.stringify({
        id: 'd1', name: 'Dr. Amina Odhiambo', email: DEMO.email,
        hospital: 'Nairobi General Hospital', specialization: 'Cardiology',
      }))
      window.location.href = '/dashboard'
    } else {
      setError('Invalid credentials.  Use the demo credentials below.')
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%,rgba(52,211,153,.07) 0,transparent 60%),' +
                  'radial-gradient(ellipse at 80% 20%,rgba(99,102,241,.07) 0,transparent 60%),' +
                  '#050d1a',
    }}>
      <Card sx={{ width: 400, maxWidth: '95vw', p: 1 }}>
        <CardContent>
          {/* Logo */}
          <Box textAlign="center" mb={4}>
            <Box sx={{
              width: 60, height: 60, borderRadius: 3,
              background: 'linear-gradient(135deg,#34d399,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 8px 28px rgba(52,211,153,.3)',
            }}>
              <LocalHospitalIcon sx={{ color: '#050d1a', fontSize: 30 }} />
            </Box>
            <Typography variant="h5">CHP Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              Chronic Disease Monitoring Platform
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              <TextField
                id="email"
                label="Email Address"
                type="email"
                fullWidth
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <TextField
                id="password"
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                id="login-btn"
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? '⏳ Signing in…' : '🔐 Sign In to Dashboard'}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3, borderColor: 'divider' }} />

          <Box sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.disabled" display="block" mb={1} sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              Demo Credentials
            </Typography>
            <Typography variant="body2">📧 doctor@hospital.com</Typography>
            <Typography variant="body2">🔑 password123</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
