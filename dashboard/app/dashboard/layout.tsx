'use client'
import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, Avatar, Badge, Chip, Divider,
  IconButton, Tooltip
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import ChatIcon from '@mui/icons-material/Chat'
import BarChartIcon from '@mui/icons-material/BarChart'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import LogoutIcon from '@mui/icons-material/Logout'

const DRAWER_W = 240

const NAV = [
  { href: '/dashboard',  label: 'Overview',   Icon: DashboardIcon,           badge: 0 },
  { href: '/patients',   label: 'Patients',   Icon: PeopleIcon,              badge: 0 },
  { href: '/alerts',     label: 'Alerts',     Icon: NotificationsActiveIcon, badge: 5 },
  { href: '/messages',   label: 'Messages',   Icon: ChatIcon,                badge: 2 },
  { href: '/analytics',  label: 'Analytics',  Icon: BarChartIcon,            badge: 0 },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [doctor, setDoctor] = useState<any>(null)

  useEffect(() => {
    const d = localStorage.getItem('cdp_doctor')
    if (d) setDoctor(JSON.parse(d))
    else window.location.href = '/'
  }, [])

  const initials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'DR'
  const logout = () => { localStorage.clear(); window.location.href = '/' }

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg,#34d399,#059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LocalHospitalIcon sx={{ color: '#050d1a', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.2, color: 'text.primary' }}>CHP Monitor</Typography>
          <Typography variant="caption" color="text.disabled">Clinical Dashboard</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'divider' }} />

      <List sx={{ px: 1.5, pt: 1.5, flex: 1 }}>
        <Typography variant="caption" sx={{ px: 1, color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          Main
        </Typography>
        {NAV.map(({ href, label, Icon, badge }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <ListItemButton
              key={href}
              component={Link}
              href={href}
              selected={active}
              sx={{ mt: 0.5, borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Badge badgeContent={badge || null} color="error" variant={badge > 9 ? 'standard' : 'standard'}>
                  <Icon sx={{ fontSize: 20, color: active ? 'primary.main' : 'text.secondary' }} />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'primary.main' : 'text.secondary' }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'divider' }} />

      {/* Doctor footer */}
      {doctor && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg,#34d399,#6366f1)', fontSize: 13, fontWeight: 700 }}>
            {initials(doctor.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>{doctor.name}</Typography>
            <Typography variant="caption" color="text.disabled">{doctor.specialization || 'Clinician'}</Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={logout} sx={{ color: 'text.secondary' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_W,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_W, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', background: '#050d1a' }}>
        {children}
      </Box>
    </Box>
  )
}
