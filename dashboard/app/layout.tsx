import type { Metadata } from 'next'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import ThemeRegistry from '@/components/ThemeRegistry'
import './globals.css'

export const metadata: Metadata = {
  title: 'CHP Dashboard – Chronic Disease Monitoring',
  description: 'Doctor dashboard for monitoring chronic disease patients in real time',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
