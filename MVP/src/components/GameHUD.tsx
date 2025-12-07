import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import {
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  Settings,
  MessageSquare,
  Map,
  Sword,
  Search,
  FlaskConical
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function GameHUD() {
  const { 
    day,
    budget, 
    characters, 
    investigations,
    currentView,
    setCurrentView,
    selectedFaction,
    deployTeam,
    contactNetwork,
    emergencyPowers,
    startCombat
  } = useGameStore()
  
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Real-time countdown and events
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate world events and notifications
      if (Math.random() < 0.2) {
        const notification = generateNotification()
        setNotifications(prev => [notification, ...prev.slice(0, 4)])
        toast.success(notification.message)
      }
    }, 8000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Top HUD Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm border-b border-sht-primary-400"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center justify-between p-4">
          {/* Left Side - Game Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-red-400" />
              <div>
                <div className="text-sm font-bold text-red-400">
                  {day} DAYS LEFT
                </div>
                <div className="text-xs text-gray-400">Until Invasion</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-green-400" />
              <div>
                <div className="text-sm font-bold text-green-400">
                  ${budget.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">Budget</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              <div>
                <div className="text-sm font-bold text-blue-400">
                  {characters.filter(c => c.status === 'ready').length}/{characters.length}
                </div>
                <div className="text-xs text-gray-400">Ready</div>
              </div>
            </div>
          </div>

          {/* Center - Navigation */}
          <div className="flex items-center gap-2">
            <NavButton 
              icon={<Map size={18} />}
              label="World Map"
              active={currentView === 'world-map'}
              onClick={() => setCurrentView('world-map')}
            />
            <NavButton 
              icon={<Search size={18} />}
              label="Investigations"
              active={currentView === 'investigation'}
              onClick={() => setCurrentView('investigation')}
              badge={investigations.length}
            />
            <NavButton
              icon={<Sword size={18} />}
              label="Combat"
              active={currentView === 'tactical-combat'}
              onClick={() => setCurrentView('tactical-combat')}
            />
            <NavButton
              icon={<FlaskConical size={18} />}
              label="Combat Lab"
              active={currentView === 'combat-lab'}
              onClick={() => setCurrentView('combat-lab')}
            />
            <NavButton
              icon={<Users size={18} />}
              label="Characters"
              active={currentView === 'characters'}
              onClick={() => setCurrentView('characters')}
            />
          </div>

          {/* Right Side - Alerts */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MessageSquare size={20} className="text-yellow-400" />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </div>
              )}
            </button>
            
            <div className="text-right">
              <div className="text-sm font-bold text-sht-primary-400">{selectedFaction} Faction</div>
              <div className="text-xs text-gray-400">Global Authority</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            className="fixed top-16 right-4 z-40 w-96 max-h-96 overflow-y-auto"
            initial={{ opacity: 0, x: 100, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 100, y: -20 }}
          >
            <div className="game-panel p-4 space-y-3">
              <h3 className="font-bold text-sht-primary-400 mb-4">🚨 Active Alerts</h3>
              {notifications.map((notification, index) => (
                <motion.div 
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    notification.priority === 'critical' ? 'bg-red-900 bg-opacity-50 border-red-400' :
                    notification.priority === 'high' ? 'bg-orange-900 bg-opacity-50 border-orange-400' :
                    'bg-blue-900 bg-opacity-50 border-blue-400'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                    <div className="text-xs text-gray-400">{notification.time}</div>
                  </div>
                  <p className="text-xs text-gray-300 mb-3">{notification.message}</p>
                  <div className="flex gap-2">
                    <button className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                      Accept
                    </button>
                    <button className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
                      Later
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom HUD - Quick Actions */}
      <motion.div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="game-panel px-6 py-3">
          <div className="flex items-center gap-4">
            <QuickActionButton 
              icon="🚨" 
              label="Crisis Response" 
              onClick={() => startCombat()}
            />
            <QuickActionButton 
              icon="👥" 
              label="Deploy Team" 
              onClick={() => deployTeam()}
            />
            <QuickActionButton 
              icon="💬" 
              label="Contact Network" 
              onClick={() => contactNetwork()}
            />
            <QuickActionButton 
              icon="⚡" 
              label="Emergency Powers" 
              onClick={() => emergencyPowers()}
            />
          </div>
        </div>
      </motion.div>
    </>
  )
}

function NavButton({ icon, label, active, onClick, badge = 0 }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
        active 
          ? 'bg-sht-primary-500 text-black font-bold' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="hidden sm:block text-sm">{label}</span>
      {badge > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
    </button>
  )
}

function QuickActionButton({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 hover:bg-gray-700 rounded-lg transition-colors group"
      title={label}
    >
      <div className="text-lg group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-xs text-gray-400 group-hover:text-white">{label}</div>
    </button>
  )
}

function generateNotification() {
  const notifications = [
    {
      title: 'LSW Terrorist Attack',
      message: 'Psychic terrorist threatens downtown Miami - immediate response required',
      priority: 'critical',
      location: 'Miami, FL'
    },
    {
      title: 'Corporate Investigation',
      message: 'Pharmaceutical company requests discrete investigation of competitor',
      priority: 'medium',
      location: 'New York, NY'  
    },
    {
      title: 'International Incident',
      message: 'Chinese LSW detected in restricted US airspace over military base',
      priority: 'high',
      location: 'Nevada, USA'
    },
    {
      title: 'Ancient Discovery',
      message: 'Archaeological team in Greece reports mysterious energy readings',
      priority: 'high',
      location: 'Athens, Greece'
    }
  ]
  
  const notification = notifications[Math.floor(Math.random() * notifications.length)]
  return {
    ...notification,
    time: new Date().toLocaleTimeString(),
    id: Math.random().toString(36)
  }
}