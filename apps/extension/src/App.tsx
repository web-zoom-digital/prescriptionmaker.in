import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [isActive, setIsActive] = useState(false)

  // This talks to the background script to toggle the widget on the active tab
  const handleToggleWidget = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError)
          alert('Please refresh the page to inject the PrescriptionMaker widget.')
          return
        }
        if (response?.status === 'success') {
          setIsActive(!isActive)
        }
      })
    }
  }

  return (
    <div style={{ padding: '20px', width: '300px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f766e', margin: '0 0 10px 0' }}>
        PrescriptionMaker.in
      </h1>
      <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
        Click the button below to inject the digital prescription canvas into this EMR page.
      </p>
      
      <button 
        onClick={handleToggleWidget}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: isActive ? '#f43f5e' : '#0f766e',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {isActive ? 'Close Prescription Canvas' : 'Open Prescription Canvas'}
      </button>

      <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
        <a 
          href="https://prescriptionmaker.in/dashboard" 
          target="_blank" 
          rel="noreferrer"
          style={{ fontSize: '12px', color: '#0f766e', textDecoration: 'none' }}
        >
          Go to full Dashboard →
        </a>
      </div>
    </div>
  )
}

export default App
