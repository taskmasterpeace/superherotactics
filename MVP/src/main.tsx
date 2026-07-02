import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { useGameStore } from './stores/enhancedGameStore'
import './index.css'

// Dev hook: expose the game store on window for debugging / end-to-end verification
;(window as any).__gameStore = useGameStore

// Initialize game data from CSV files
import { initializeGameData } from './utils/gameDataLoader'

// Load game data before rendering
initializeGameData().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #facc15',
            },
          }}
        />
      </BrowserRouter>
    </React.StrictMode>,
  )
})