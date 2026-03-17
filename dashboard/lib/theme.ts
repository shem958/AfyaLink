'use client'
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#059669',
      contrastText: '#0a1628',
    },
    secondary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#2563eb',
    },
    error:   { main: '#ef4444' },
    warning: { main: '#f97316' },
    info:    { main: '#60a5fa' },
    success: { main: '#22c55e' },
    background: {
      default: '#050d1a',
      paper:   '#0f1e35',
    },
    text: {
      primary:   '#e8f0fe',
      secondary: '#94a3b8',
      disabled:  '#4a5a72',
    },
    divider: 'rgba(96,165,250,0.12)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, color: '#94a3b8' },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#050d1a',
          '::-webkit-scrollbar': { width: '6px' },
          '::-webkit-scrollbar-thumb': { background: 'rgba(96,165,250,0.2)', borderRadius: '3px' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(96,165,250,0.12)',
          transition: 'border-color 0.2s ease',
          '&:hover': { borderColor: 'rgba(96,165,250,0.25)' },
        },
      },
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#0f1e35',
          backgroundImage: 'none',
          border: '1px solid rgba(96,165,250,0.12)',
          '&:hover': { borderColor: 'rgba(96,165,250,0.3)' },
        },
      },
      defaultProps: { elevation: 0 },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          textTransform: 'none',
          fontSize: '0.875rem',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #34d399, #059669)',
          color: '#0a1628',
          '&:hover': {
            background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
            boxShadow: '0 4px 20px rgba(52,211,153,0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem', borderRadius: 20 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#0a1628',
          border: 'none',
          borderRight: '1px solid rgba(96,165,250,0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#0a1628',
          backgroundImage: 'none',
          borderBottom: '1px solid rgba(96,165,250,0.12)',
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 2,
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.08))',
            border: '1px solid rgba(52,211,153,0.2)',
            color: '#34d399',
            '&:hover': { background: 'rgba(52,211,153,0.18)' },
          },
          '&:hover': { background: 'rgba(255,255,255,0.04)' },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            color: '#4a5a72',
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            background: '#0a1628',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: 'rgba(255,255,255,0.03)', cursor: 'pointer' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(96,165,250,0.08)',
          padding: '12px 16px',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: '#0a1628',
            '& fieldset': { borderColor: 'rgba(96,165,250,0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(96,165,250,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#34d399' },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, border: '1px solid' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, background: 'rgba(255,255,255,0.08)' },
        bar: { borderRadius: 4 },
      },
    },
  },
})

export default theme
