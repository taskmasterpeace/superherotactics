import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import { Phone, MessageSquare, Map, Users, Settings, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import WorldMapGrid from './WorldMap/WorldMapGrid'

export default function MobileInterface() {
  const { 
    characters, 
    investigations, 
    day,
    selectedFaction,
    budget 
  } = useGameStore()
  
  const [activeTab, setActiveTab] = useState<'phone' | 'messages' | 'map' | 'team' | 'settings'>('phone')
  const [notifications, setNotifications] = useState<any[]>([])
  const [incomingCall, setIncomingCall] = useState<any>(null)

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const notification = generateRandomNotification()
        setNotifications(prev => [notification, ...prev.slice(0, 9)])
        toast.success(notification.message)
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-gray-800 border-b border-sht-primary-400 p-4 pt-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-sht-primary-400">⚡ SuperHero Tactics</h1>
            <p className="text-xs text-gray-400">{selectedFaction} Faction</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-sht-success">${budget.toLocaleString()}</div>
            <div className="text-xs text-gray-400">Day {day}</div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'phone' && <PhoneTab key="phone" />}
          {activeTab === 'messages' && <MessagesTab key="messages" notifications={notifications} />}
          {activeTab === 'map' && <MapTab key="map" />}
          {activeTab === 'team' && <TeamTab key="team" />}
          {activeTab === 'settings' && <SettingsTab key="settings" />}
        </AnimatePresence>
      </div>

      {/* Mobile Navigation */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 pb-6">
        <div className="flex justify-around">
          <TabButton 
            icon={<Phone size={20} />} 
            label="Phone" 
            active={activeTab === 'phone'}
            onClick={() => setActiveTab('phone')}
            badge={incomingCall ? 1 : 0}
          />
          <TabButton 
            icon={<MessageSquare size={20} />} 
            label="Messages" 
            active={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            badge={notifications.length}
          />
          <TabButton 
            icon={<Map size={20} />} 
            label="World" 
            active={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
          />
          <TabButton 
            icon={<Users size={20} />} 
            label="Team" 
            active={activeTab === 'team'}
            onClick={() => setActiveTab('team')}
          />
          <TabButton 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </div>
    </div>
  )
}

function TabButton({ icon, label, active, onClick, badge = 0 }: any) {
  return (
    <button 
      onClick={onClick}
      className={`relative p-3 rounded-lg transition-all ${
        active ? 'bg-sht-primary-500 text-black' : 'text-gray-400 hover:text-white'
      }`}
    >
      <div className="flex flex-col items-center">
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </div>
      {badge > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
    </button>
  )
}

function PhoneTab() {
  return (
    <motion.div 
      className="p-4 h-full"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
    >
      <h2 className="text-xl font-bold text-sht-primary-400 mb-4">📞 Faction Directory</h2>
      {/* Phone content */}
    </motion.div>
  )
}

function MessagesTab({ notifications }: { notifications: any[] }) {
  return (
    <motion.div 
      className="p-4 h-full"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
    >
      <h2 className="text-xl font-bold text-sht-primary-400 mb-4">💬 Investigation Alerts</h2>
      {/* Messages content */}
    </motion.div>
  )
}

function MapTab() {
  return (
    <motion.div
      className="h-full overflow-hidden"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
    >
      <WorldMapGrid />
    </motion.div>
  )
}

function TeamTab() {
  return (
    <motion.div 
      className="p-4 h-full"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
    >
      <h2 className="text-xl font-bold text-sht-primary-400 mb-4">👥 Team Management</h2>
      {/* Team content */}
    </motion.div>
  )
}

function SettingsTab() {
  return (
    <motion.div 
      className="p-4 h-full"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
    >
      <h2 className="text-xl font-bold text-sht-primary-400 mb-4">⚙️ Game Settings</h2>
      {/* Settings content */}
    </motion.div>
  )
}

function generateRandomNotification() {
  const notifications = [
    {
      title: 'Gang Violence Escalating',
      message: 'Detroit gang war requires immediate LSW intervention',
      priority: 'critical',
      location: 'Detroit, MI'
    },
    {
      title: 'Corporate Investigation',
      message: 'Pharmaceutical company requests discrete investigation',
      priority: 'medium',
      location: 'New York, NY'
    }
  ]
  
  const notification = notifications[Math.floor(Math.random() * notifications.length)]
  return {
    ...notification,
    time: new Date().toLocaleTimeString(),
    id: Math.random().toString(36)
  }
}