import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard, Map, Swords, Users, Settings, Command, Info } from 'lucide-react'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

// Keyboard shortcut data
const shortcuts = {
  global: {
    title: 'Global',
    icon: <Command size={18} />,
    items: [
      { keys: ['?'], description: 'Show/hide this shortcuts guide' },
      { keys: ['Escape'], description: 'Close modals or go back' },
      { keys: ['F2'], description: 'Toggle dev mode (requires ?dev=true)' },
      { keys: ['F4'], description: 'Open Asset Manager' },
    ]
  },
  navigation: {
    title: 'Navigation',
    icon: <Map size={18} />,
    items: [
      { keys: ['M'], description: 'Open World Map' },
      { keys: ['C'], description: 'Open Character Screen' },
      { keys: ['I'], description: 'Open Investigations' },
      { keys: ['N'], description: 'Open News Browser' },
      { keys: ['H'], description: 'Open Hospital' },
      { keys: ['E'], description: 'Open Equipment Shop' },
    ]
  },
  combat: {
    title: 'Combat',
    icon: <Swords size={18} />,
    items: [
      { keys: ['Space'], description: 'End turn / Confirm action' },
      { keys: ['Tab'], description: 'Cycle through units' },
      { keys: ['1-9'], description: 'Select action / weapon slot' },
      { keys: ['R'], description: 'Reload weapon' },
      { keys: ['O'], description: 'Toggle overwatch mode' },
      { keys: ['G'], description: 'Toggle grenade mode' },
    ]
  },
  worldMap: {
    title: 'World Map',
    icon: <Map size={18} />,
    items: [
      { keys: ['Arrow keys'], description: 'Pan the map' },
      { keys: ['+', '-'], description: 'Zoom in/out' },
      { keys: ['D'], description: 'Deploy to selected sector' },
      { keys: ['T'], description: 'Open time controls' },
    ]
  },
  squad: {
    title: 'Squad Management',
    icon: <Users size={18} />,
    items: [
      { keys: ['1-4'], description: 'Select squad member' },
      { keys: ['Shift', '+', 'Click'], description: 'Multi-select characters' },
      { keys: ['A'], description: 'Select all squad members' },
    ]
  }
}

function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-200 shadow-sm">
      {children}
    </kbd>
  )
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="bg-gray-900 border-2 border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-full overflow-hidden pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Keyboard className="text-yellow-400" size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                    <p className="text-sm text-gray-400">Press ? to toggle this guide</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(shortcuts).map(([key, section]) => (
                    <motion.div
                      key={key}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * Object.keys(shortcuts).indexOf(key) }}
                    >
                      <div className="flex items-center gap-2 mb-3 text-yellow-400">
                        {section.icon}
                        <h3 className="font-semibold">{section.title}</h3>
                      </div>
                      <div className="space-y-2">
                        {section.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{item.description}</span>
                            <div className="flex items-center gap-1">
                              {item.keys.map((k, ki) => (
                                <React.Fragment key={ki}>
                                  {ki > 0 && <span className="text-gray-600 text-xs">+</span>}
                                  <KeyboardKey>{k}</KeyboardKey>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer note */}
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 justify-center">
                  <Info size={14} />
                  <span>Some shortcuts may be context-specific and only work in certain views</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
