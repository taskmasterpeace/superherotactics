import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/enhancedGameStore'
import toast from 'react-hot-toast'

export default function WorkingInvestigationCenter() {
  const { 
    investigations, 
    characters, 
    assignInvestigation,
    setCurrentView
  } = useGameStore()
  
  const [selectedInvestigation, setSelectedInvestigation] = useState<any>(null)

  return (
    <div className="h-full flex">
      {/* Investigation List */}
      <motion.div 
        className="w-96 bg-gray-900 bg-opacity-95 border-r border-sht-primary-400 p-6 overflow-y-auto"
        initial={{ x: -384 }}
        animate={{ x: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-sht-primary-400">🔍 Investigation Center</h2>
          <button 
            onClick={() => {
              setCurrentView('world-map')
              toast.info('Returning to world map')
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            🔙 Back
          </button>
        </div>
        
        <div className="space-y-3">
          {investigations.map((investigation, index) => (
            <motion.div
              key={investigation.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedInvestigation?.id === investigation.id 
                  ? 'border-sht-primary-400 bg-sht-primary-400 bg-opacity-10' 
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800'
              }`}
              onClick={() => {
                setSelectedInvestigation(investigation)
                toast.info(`Selected: ${investigation.title}`)
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white text-sm">{investigation.title}</h3>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  investigation.priority === 'critical' ? 'bg-red-600 text-white' :
                  investigation.priority === 'high' ? 'bg-orange-600 text-white' :
                  'bg-yellow-600 text-black'
                }`}>
                  {investigation.priority}
                </div>
              </div>
              
              <p className="text-xs text-gray-300 mb-3">{investigation.description}</p>
              
              <div className="flex justify-between text-xs">
                <span className="text-blue-400">{investigation.location.city}, {investigation.location.country}</span>
                <span className="text-orange-400">{investigation.timeLimit}h</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-green-400">{investigation.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                    style={{ width: `${investigation.progress}%` }}
                  />
                </div>
              </div>

              {/* Assigned Characters */}
              {investigation.assignedCharacters.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-green-400">
                    Assigned: {investigation.assignedCharacters.length} operative(s)
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Investigation Details */}
      <div className="flex-1 p-6">
        {selectedInvestigation ? (
          <motion.div
            key={selectedInvestigation.id}
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Investigation Header */}
            <div className="game-panel p-6 mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">{selectedInvestigation.title}</h1>
              <p className="text-gray-300 leading-relaxed mb-4">{selectedInvestigation.description}</p>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-400">Location</div>
                  <div className="font-bold text-blue-400">{selectedInvestigation.location.city}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Difficulty</div>
                  <div className="font-bold text-red-400">{selectedInvestigation.difficulty}/10</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Time Limit</div>
                  <div className="font-bold text-orange-400">{selectedInvestigation.timeLimit}h</div>
                </div>
              </div>
            </div>

            {/* Available Characters */}
            <div className="game-panel p-6 mb-6">
              <h2 className="text-xl font-bold text-sht-secondary-400 mb-4">👥 Available Operatives</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characters.filter(c => c.status === 'ready').map((character) => (
                  <div key={character.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-white">{character.name}</h3>
                      <div className="text-xs text-green-400 bg-green-600 bg-opacity-20 px-2 py-1 rounded">
                        READY
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs mb-4">
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

                    <button 
                      onClick={() => {
                        assignInvestigation(selectedInvestigation.id)
                        toast.success(`${character.name} assigned to investigation`)
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold transition-all"
                    >
                      📋 ASSIGN TO CASE
                    </button>
                  </div>
                ))}
              </div>
              
              {characters.filter(c => c.status === 'ready').length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No available operatives</div>
                  <div className="text-sm text-gray-500">All team members are currently assigned to other operations</div>
                </div>
              )}
            </div>

            {/* Investigation Methods */}
            <div className="game-panel p-6">
              <h2 className="text-xl font-bold text-sht-accent-400 mb-4">🎯 Investigation Methods</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InvestigationMethodCard 
                  name="Covert Operation"
                  description="Single investigator works in secret"
                  successRate={75}
                  riskLevel="Medium"
                  apCost={3}
                  onClick={() => {
                    if (selectedInvestigation) {
                      assignInvestigation(selectedInvestigation.id)
                      toast.success('Covert operation initiated')
                    }
                  }}
                />
                
                <InvestigationMethodCard 
                  name="Official Investigation"
                  description="Work through legal channels"
                  successRate={85}
                  riskLevel="Low"
                  apCost={2}
                  onClick={() => {
                    if (selectedInvestigation) {
                      assignInvestigation(selectedInvestigation.id)
                      toast.success('Official investigation launched')
                    }
                  }}
                />
                
                <InvestigationMethodCard 
                  name="Force Deployment"
                  description="Send full combat team"
                  successRate={95}
                  riskLevel="Very High"
                  apCost={5}
                  onClick={() => {
                    if (selectedInvestigation) {
                      assignInvestigation(selectedInvestigation.id)
                      setCurrentView('tactical-combat')
                      toast.success('Force deployment - switching to combat')
                    }
                  }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-400 mb-2">Select an Investigation</h2>
              <p className="text-gray-500">Choose a case from the list to view details and assign operatives</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InvestigationMethodCard({ name, description, successRate, riskLevel, apCost, onClick }: any) {
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
    <div 
      className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-all cursor-pointer"
      onClick={onClick}
    >
      <h4 className="font-bold text-white mb-2">{name}</h4>
      <p className="text-xs text-gray-300 mb-4">{description}</p>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Success Rate:</span>
          <span className="text-green-400 font-bold">{successRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Risk Level:</span>
          <span className={`font-bold ${getRiskColor(riskLevel)}`}>{riskLevel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">AP Cost:</span>
          <span className="text-purple-400 font-bold">{apCost}</span>
        </div>
      </div>
      
      <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-bold transition-all">
        SELECT METHOD
      </button>
    </div>
  )
}