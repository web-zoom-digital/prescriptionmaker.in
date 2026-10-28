import { useState, useEffect } from 'react'
import './App.css'

interface ExtractedPatientData {
  name?: string
  age?: string
  gender?: string
  phone?: string
  uhid?: string
  diagnosis?: string
  rawSourceUrl?: string
  pageTitle?: string
}

function App() {
  const [isActive, setIsActive] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [activeTabDomain, setActiveTabDomain] = useState<string>('Active Web Page')
  const [baseUrl, setBaseUrl] = useState<string>('https://prescriptionmaker.in')
  const [patientData, setPatientData] = useState<ExtractedPatientData>({
    name: '',
    age: '',
    gender: '',
    phone: '',
    diagnosis: ''
  })
  const [copied, setCopied] = useState(false)

  // 1. Scan patient data from active tab
  const scanActiveTab = async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return
    setIsScanning(true)

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) {
        setIsScanning(false)
        return
      }

      if (tab.url) {
        try {
          const u = new URL(tab.url)
          setActiveTabDomain(u.hostname.replace('www.', ''))
        } catch {
          setActiveTabDomain('Active Tab')
        }
      }

      chrome.tabs.sendMessage(tab.id, { action: 'get_patient_data' }, (response) => {
        setIsScanning(false)
        if (chrome.runtime.lastError) {
          console.log('[PrescriptionMaker] Content script not ready on this tab yet')
          return
        }

        if (response?.status === 'success') {
          if (response.data) {
            setPatientData({
              name: response.data.name || '',
              age: response.data.age || '',
              gender: response.data.gender || '',
              phone: response.data.phone || '',
              diagnosis: response.data.diagnosis || '',
              uhid: response.data.uhid || ''
            })
          }
          if (typeof response.isWidgetVisible === 'boolean') {
            setIsActive(response.isWidgetVisible)
          }
        }
      })
    } catch (e) {
      console.error(e)
      setIsScanning(false)
    }
  }

  // 2. On Mount: Get stored base URL & request patient data from active tab
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['pm_base_url'], (res) => {
        if (typeof res?.pm_base_url === 'string') {
          setBaseUrl(res.pm_base_url)
        }
      })
    }

    // Decouple scanning from initial mount render
    const timer = setTimeout(() => {
      scanActiveTab()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // 3. Toggle floating canvas on the page
  const handleToggleWidget = async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    // If opening, pass current edited patient data
    const message = isActive
      ? { action: 'toggle_widget' }
      : { action: 'open_widget_with_data', data: patientData }

    chrome.tabs.sendMessage(tab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        alert('Please refresh the active webpage to enable PrescriptionMaker.')
        return
      }
      if (response?.status === 'success') {
        setIsActive(!isActive)
      }
    })
  }

  // 4. Open in dedicated new browser tab
  const handleOpenStudioInNewTab = () => {
    const url = new URL('/editor', baseUrl)
    url.searchParams.set('source', 'extension_popup')
    if (patientData.name) url.searchParams.set('prefill_name', patientData.name)
    if (patientData.age) url.searchParams.set('prefill_age', patientData.age)
    if (patientData.gender) url.searchParams.set('prefill_gender', patientData.gender)
    if (patientData.phone) url.searchParams.set('prefill_phone', patientData.phone)
    if (patientData.diagnosis) url.searchParams.set('prefill_diagnosis', patientData.diagnosis)

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: url.toString() })
    } else {
      window.open(url.toString(), '_blank')
    }
  }

  // 5. Copy captured data to clipboard
  const handleCopyPatientData = () => {
    const summary = [
      patientData.name ? `Patient: ${patientData.name}` : '',
      patientData.age ? `Age: ${patientData.age} Y` : '',
      patientData.gender ? `Gender: ${patientData.gender}` : '',
      patientData.phone ? `Phone: ${patientData.phone}` : '',
      patientData.diagnosis ? `Diagnosis: ${patientData.diagnosis}` : ''
    ].filter(Boolean).join(' | ')

    if (summary) {
      navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 6. Base URL switch (Production vs Localhost)
  const handleBaseUrlChange = (nextUrl: string) => {
    setBaseUrl(nextUrl)
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ pm_base_url: nextUrl })
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'set_base_url', baseUrl: nextUrl })
        }
      })
    }
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="brand-wrap">
          <div className="brand-icon">℞</div>
          <div>
            <div className="brand-title">PrescriptionMaker</div>
            <span className="brand-badge">EMR Companion</span>
          </div>
        </div>
        <div className="context-pill">
          <span className="status-dot"></span>
          <span className="context-domain" title={activeTabDomain}>
            {activeTabDomain.length > 18 ? activeTabDomain.slice(0, 16) + '…' : activeTabDomain}
          </span>
        </div>
      </header>

      {/* Patient Capture Card */}
      <section className="capture-card">
        <div className="capture-header">
          <div className="capture-title">
            <span>📋</span>
            <span>Captured Patient Data</span>
            {patientData.name && <span className="detected-badge">● Detected</span>}
          </div>
          <button
            className="rescan-btn"
            onClick={scanActiveTab}
            disabled={isScanning}
            title="Scan active page for patient info"
          >
            {isScanning ? 'Scanning…' : '🔄 Re-scan'}
          </button>
        </div>

        <div className="patient-fields">
          <div className="field-group">
            <label className="field-label">Patient Name</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g. Rajesh Kumar"
              value={patientData.name || ''}
              onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
            />
          </div>

          <div className="field-row">
            <div className="field-group" style={{ flex: 1 }}>
              <label className="field-label">Age</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. 34"
                value={patientData.age || ''}
                onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
              />
            </div>
            <div className="field-group" style={{ flex: 1 }}>
              <label className="field-label">Gender</label>
              <select
                className="field-input"
                value={patientData.gender || ''}
                onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Phone Number</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g. +91 9876543210"
              value={patientData.phone || ''}
              onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Diagnosis / Chief Complaint</label>
            <input
              type="text"
              className="field-input"
              placeholder="e.g. Viral Fever, Headache"
              value={patientData.diagnosis || ''}
              onChange={(e) => setPatientData({ ...patientData, diagnosis: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <section className="action-buttons">
        <button
          className={`btn-primary ${isActive ? 'btn-active' : ''}`}
          onClick={handleToggleWidget}
        >
          <span>{isActive ? '✕' : '✨'}</span>
          <span>{isActive ? 'Close Prescription Canvas' : 'Open Prescription Canvas'}</span>
        </button>

        <button className="btn-secondary" onClick={handleOpenStudioInNewTab}>
          <span>🗗</span>
          <span>Open Full Studio in New Tab</span>
        </button>

        {patientData.name && (
          <button className="btn-secondary" onClick={handleCopyPatientData} style={{ fontSize: '11px' }}>
            <span>{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Patient Info Copied!' : 'Copy Patient Summary'}</span>
          </button>
        )}
      </section>

      {/* Quick Shortcuts */}
      <nav className="shortcuts-row">
        <a
          href={`${baseUrl}/templates`}
          target="_blank"
          rel="noreferrer"
          className="shortcut-link"
        >
          <span>📄</span>
          <span>Templates</span>
        </a>
        <a
          href={`${baseUrl}/dashboard`}
          target="_blank"
          rel="noreferrer"
          className="shortcut-link"
        >
          <span>📊</span>
          <span>Dashboard</span>
        </a>
      </nav>

      {/* Footer & Shortcut Hint */}
      <footer className="popup-footer">
        <div className="keyboard-hint">
          <span className="kbd-badge">Alt + P</span>
          <span>toggle on any tab</span>
        </div>

        <select
          className="env-select"
          value={baseUrl}
          onChange={(e) => handleBaseUrlChange(e.target.value)}
          title="Switch environment"
        >
          <option value="https://prescriptionmaker.in">Production</option>
          <option value="http://localhost:3000">Localhost (3000)</option>
          <option value="http://localhost:3003">Localhost (3003)</option>
        </select>
      </footer>
    </div>
  )
}

export default App
