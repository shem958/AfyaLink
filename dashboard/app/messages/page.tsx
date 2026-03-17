'use client'
import { useEffect, useState, useRef } from 'react'
import api from '../../lib/api'
import {
  Box, Card, CardContent, Typography, Chip, TextField, Button,
  Stack, AppBar, Toolbar, Avatar, Divider, IconButton, Tooltip
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

const condColor: Record<string, string> = { Hypertension:'#f472b6', Diabetes:'#60a5fa', Asthma:'#a78bfa', Cancer: '#34d399' }

export default function MessagesPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [activePatient, setActivePatient] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const msgEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/patients')
      .then(res => {
        const list = res.data.patients || []
        setPatients(list)
        if (list.length > 0) setActivePatient(list[0])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!activePatient) return
    const fetchMsgs = () => {
      api.get(`/messages/${activePatient.id}`)
        .then(res => {
          setMessages(res.data.messages || [])
          setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
        .catch(console.error)
    }
    fetchMsgs()
    const int = setInterval(fetchMsgs, 5000)
    return () => clearInterval(int)
  }, [activePatient])

  const send = async () => {
    if (!newMsg.trim() || !activePatient) return
    try {
      await api.post('/messages', { patient_id: activePatient.id, content: newMsg.trim() })
      setNewMsg('')
      // Optimistically fetch
      api.get(`/messages/${activePatient.id}`).then(res => {
        setMessages(res.data.messages || [])
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
    } catch (err) {
      console.error(err)
    }
  }

  const initials = (name: string) => name ? name.split(' ').map(n => n[0]).join('') : 'U'

  return (
    <>
      <AppBar position="sticky" color="default">
        <Toolbar>
          <Box flex={1}>
            <Typography variant="h6">Messages</Typography>
            <Typography variant="caption" color="text.secondary">Patient communications</Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Thread list */}
        <Box sx={{ width: 270, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto', background: '#0a1628' }}>
          {patients.map(p => {
            const isActive = activePatient?.id === p.id
            return (
            <Box
              key={p.id}
              id={`thread-${p.id}`}
              onClick={() => setActivePatient(p)}
              sx={{
                p: 2, cursor: 'pointer',
                borderBottom: '1px solid', borderColor: 'divider',
                background: isActive ? '#0f1e35' : 'transparent',
                borderLeft: '3px solid',
                borderLeftColor: isActive ? 'primary.main' : 'transparent',
                transition: 'all .15s',
                '&:hover': { background: '#0f1e35' },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                <Avatar sx={{ width: 32, height: 32, fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {initials(p.name)}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>{p.name}</Typography>
                  <Chip label={p.condition} size="small"
                    sx={{ mt: 0.25, fontSize: 9, height: 16, background: `${condColor[p.condition] || '#cbd5e1'}20`, color: condColor[p.condition] || '#94a3b8', border: `1px solid ${condColor[p.condition] || '#cbd5e1'}55` }} />
                </Box>
              </Stack>
            </Box>
          )})}
        </Box>

        {/* Chat */}
        {activePatient ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Chat header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, background: '#0a1628' }}>
              <Avatar sx={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', fontWeight: 700 }}>
                {initials(activePatient.name)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{activePatient.name}</Typography>
                <Chip label={activePatient.condition} size="small"
                  sx={{ fontSize: 10, height: 18, background: `${condColor[activePatient.condition] || '#cbd5e1'}20`, color: condColor[activePatient.condition] || '#94a3b8', border: `1px solid ${condColor[activePatient.condition] || '#cbd5e1'}55` }} />
              </Box>
            </Box>

            {/* Messages area */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {messages.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" mt={4}>No messages yet. Send one to start the conversation.</Typography>
              )}
              {messages.map(m => (
                <Box key={m.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_type === 'doctor' ? 'flex-start' : 'flex-end' }}>
                  <Typography variant="caption" color="text.disabled" mb={0.5}>
                    {m.sender_type === 'doctor' ? '🩺 You' : `👤 ${activePatient.name}`} · {new Date(m.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Typography>
                  <Box sx={{
                    maxWidth: '70%', p: 1.5, borderRadius: 2,
                    background: m.sender_type === 'doctor' ? 'rgba(52,211,153,.1)' : '#0f1e35',
                    border: '1px solid',
                    borderColor: m.sender_type === 'doctor' ? 'rgba(52,211,153,.2)' : 'divider',
                    borderBottomLeftRadius: m.sender_type === 'doctor' ? 2 : 12,
                    borderBottomRightRadius: m.sender_type === 'patient' ? 2 : 12,
                  }}>
                    <Typography variant="body2">{m.content}</Typography>
                  </Box>
                </Box>
              ))}
              <div ref={msgEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
              <TextField
                id="message-input"
                fullWidth
                placeholder={`Message ${activePatient.name}…`}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                size="small"
              />
              <Button id="send-message-btn" variant="contained" onClick={send} endIcon={<SendIcon />}>Send</Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Select a patient to start messaging</Typography>
          </Box>
        )}
      </Box>
    </>
  )
}
