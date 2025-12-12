import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/workingGameStore'
import { Search, Clock, MapPin, Users, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InvestigationCenter() {
  const { 
    investigations, 
    characters, 
    assignInvestigation
  } = useGameStore()
  
  const [selectedInvestigation, setSelectedInvestigation] = useState<any>(null)
  const [filterPriority, setFilterPriority] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  const filteredInvestigations = investigations.filter(inv => {
    const matchesPriority = !filterPriority || inv.priority === filterPriority
    const matchesLocation = !filterLocation || 
      inv.location.country.toLowerCase().includes(filterLocation.toLowerCase()) ||
      inv.location.city.toLowerCase().includes(filterLocation.toLowerCase())
    return matchesPriority && matchesLocation
  })

  const handleAssignCharacter = (characterId: string, investigationId: string) => {
    assignInvestigation(investigationId)
  }

  return (
    <div className="h-full flex pt-20 pb-20"> {/* Account for HUD */}
      {/* Investigation List */}
      <motion.div 
        className="w-96 bg-gray-900 bg-opacity-95 border-r border-sht-primary-400 p-6 overflow-y-auto"
        initial={{ x: -384 }}
        animate={{ x: 0 }}
      >
        <h2 className="text-2xl font-bold text-sht-primary-400 mb-6">🔍 Investigation Center</h2>
        
        {/* Filters */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Filter by Priority:</label>
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded focus:border-sht-primary-400"
            >
              <option value="">All Priorities</option>
              <option value="critical">🚨 Critical</option>
              <option value="high">⚠️ High</option>
              <option value="medium">📋 Medium</option>
              <option value="low">📝 Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Filter by Location:</label>
            <input 
              type="text"
              placeholder="Search countries or cities..."
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded focus:border-sht-primary-400"
            />
          </div>
        </div>

        {/* Investigation List */}
        <div className="space-y-3">
          {filteredInvestigations.map((investigation, index) => (
            <motion.div
              key={investigation.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedInvestigation?.id === investigation.id 
                  ? 'border-sht-primary-400 bg-sht-primary-400 bg-opacity-10' 
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800'
              }`}
              onClick={() => setSelectedInvestigation(investigation)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white text-sm">{investigation.title}</h3>
                <div className={`priority-${investigation.priority} px-2 py-1 rounded text-xs font-bold`}>
                  {investigation.priority}
                </div>
              </div>
              
              <p className="text-xs text-gray-300 mb-3">{investigation.description}</p>
              
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1 text-blue-400">
                  <MapPin size={12} />
                  {investigation.location.city}, {investigation.location.country}
                </div>
                <div className="flex items-center gap-1 text-orange-400">
                  <Clock size={12} />
                  {investigation.timeLimit}h
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-green-400">{investigation.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${investigation.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Investigation Details */}
      <div className="flex-1 p-6">
        {selectedInvestigation ? (
          <motion.div
            key={selectedInvestigation.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="max-w-4xl mx-auto">
              {/* Investigation Header */}
              <div className="game-panel p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{selectedInvestigation.title}</h1>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-blue-400">
                        <MapPin size={16} />
                        {selectedInvestigation.location.city}, {selectedInvestigation.location.country}
                      </div>
                      <div className="flex items-center gap-1 text-orange-400">
                        <Clock size={16} />
                        {selectedInvestigation.timeLimit} hours remaining
                      </div>
                      <div className="flex items-center gap-1 text-purple-400">
                        <AlertTriangle size={16} />
                        Difficulty: {selectedInvestigation.difficulty}/10
                      </div>
                    </div>
                  </div>
                  <div className={`priority-${selectedInvestigation.priority} px-4 py-2 rounded-lg font-bold`}>
                    {selectedInvestigation.priority.toUpperCase()}
                  </div>
                </div>
                
                <p className="text-gray-300 leading-relaxed">{selectedInvestigation.description}</p>
              </div>

              {/* Character Assignment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Characters */}
                <div className="game-panel p-6">
                  <h2 className="text-xl font-bold text-sht-secondary-400 mb-4">👥 Available Operatives</h2>
                  <div className="space-y-3">
                    {characters.filter(c => c.status === 'ready').map((character) => (
                      <div key={character.id} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-white">{character.name}</h3>
                          <div className="text-xs text-green-400">READY</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div className="text-center">
                            <div className="text-gray-400">STR</div>
                            <div className="font-bold text-red-400">{character.stats.STR}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">INT</div>
                            <div className="font-bold text-purple-400">{character.stats.INT}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-400">AGL</div>
                            <div className="font-bold text-blue-400">{character.stats.AGL}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAssignCharacter(character.id, selectedInvestigation.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-bold transition-colors"
                          >
                            📋 Assign
                          </button>
                          <button 
                            onClick={() => toast.info(`Viewing ${character.name}'s profile`)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold transition-colors"
                          >
                            👤 Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investigation Methods */}
                <div className="game-panel p-6">
                  <h2 className="text-xl font-bold text-sht-accent-400 mb-4">🎯 Investigation Methods</h2>
                  
                  <div className="space-y-3">
                    <InvestigationMethod 
                      name="Covert Operation"
                      description="Single investigator works in secret"
                      successRate={75}
                      riskLevel="Medium"
                      timeRequired="2-4 days"
                      resources="Low"
                    />
                    <InvestigationMethod 
                      name="Official Investigation"
                      description="Work through legal channels"
                      successRate={85}
                      riskLevel="Low" 
                      timeRequired="3-7 days"
                      resources="Medium"
                    />
                    <InvestigationMethod 
                      name="Force Deployment"
                      description="Send full combat team"
                      successRate={95}
                      riskLevel="Very High"
                      timeRequired="1-2 days"
                      resources="High"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      if (selectedInvestigation) {
                        assignInvestigation(selectedInvestigation.id)
                      }
                    }}
                    className="w-full mt-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                  >
                    🚀 INITIATE INVESTIGATION
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Search size={64} className="mx-auto mb-4 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-400 mb-2">Select an Investigation</h2>
              <p className="text-gray-500">Choose an investigation from the list to view details and assign operatives</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InvestigationMethod({ name, description, successRate, riskLevel, timeRequired, resources }: any) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400'
      case 'Medium': return 'text-yellow-400'  
      case 'High': return 'text-orange-400'
      case 'Very High': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white">{name}</h4>
        <div className="text-xs text-green-400 font-bold">{successRate}%</div>
      </div>
      
      <p className="text-xs text-gray-300 mb-3">{description}</p>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-400">Risk:</div>
          <div className={`font-bold ${getRiskColor(riskLevel)}`}>{riskLevel}</div>
        </div>
        <div>
          <div className="text-gray-400">Time:</div>
          <div className="font-bold text-blue-400">{timeRequired}</div>
        </div>
        <div>
          <div className="text-gray-400">Cost:</div>
          <div className="font-bold text-purple-400">{resources}</div>
        </div>
      </div>
    </div>
  )
}