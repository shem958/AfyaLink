import { Tabs } from 'expo-router'
import { Platform, View, Text, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { autoLoginMVP } from '../lib/api'

export default function AppLayout() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      await autoLoginMVP()
      setIsReady(true)
    }
    init()
  }, [])

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050d1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#34d399" />
        <Text style={{ color: '#e8f0fe', marginTop: 12, fontWeight: '600' }}>Connecting to Clinic...</Text>
      </View>
    )
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0a1628',
          borderTopColor: 'rgba(96,165,250,0.12)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        },
        tabBarActiveTintColor: '#34d399',
        tabBarInactiveTintColor: '#4a5a72',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#0a1628', borderBottomColor: 'rgba(96,165,250,0.12)', borderBottomWidth: 1 },
        headerTintColor: '#e8f0fe',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="log"   options={{ title: 'Log Reading', tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} /> }} />
      <Tabs.Screen name="meds"  options={{ title: 'Medications', tabBarIcon: ({ color }) => <TabIcon emoji="💊" color={color} /> }} />
      <Tabs.Screen name="symptoms" options={{ title: 'Symptoms', tabBarIcon: ({ color }) => <TabIcon emoji="🤒" color={color} /> }} />
      <Tabs.Screen name="history"  options={{ title: 'History', tabBarIcon: ({ color }) => <TabIcon emoji="📈" color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Doctor', tabBarIcon: ({ color }) => <TabIcon emoji="💬" color={color} /> }} />
    </Tabs>
  )
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native')
  return <Text style={{ fontSize: 20, opacity: color === '#34d399' ? 1 : 0.5 }}>{emoji}</Text>
}
