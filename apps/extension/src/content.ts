// Content Script for PrescriptionMaker.in Chrome Extension
// Seamlessly extracts EMR patient data and injects a modern, draggable floating prescription canvas.

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

let widgetContainer: HTMLDivElement | null = null
let minimizedBubble: HTMLDivElement | null = null
let isWidgetVisible = false
let isExpanded = false
let currentBaseUrl = 'https://prescriptionmaker.in'
let currentPatientData: ExtractedPatientData = {}

// Initialize baseUrl from storage if customized (e.g. localhost for development)
if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.get(['pm_base_url'], (res) => {
    if (typeof res?.pm_base_url === 'string') {
      currentBaseUrl = res.pm_base_url
    }
  })
}

// ── 1. INTELLIGENT EMR PATIENT DATA EXTRACTOR ─────────────────────────────
function extractPatientData(): ExtractedPatientData {
  const data: ExtractedPatientData = {
    rawSourceUrl: window.location.href,
    pageTitle: document.title || ''
  }

  // 1. Check for highlighted/selected text first (highest doctor intent)
  const selection = window.getSelection()?.toString().trim()
  if (selection && selection.length > 2 && selection.length < 150) {
    // If it looks like a short name
    if (/^[A-Za-z\s.,'-]+$/.test(selection) && selection.length < 35 && selection.split(' ').length <= 4) {
      data.name = selection
    } else {
      data.diagnosis = selection
    }
  }

  // 2. Scan common EMR specific DOM attributes / IDs / Classes
  const nameSelectors = [
    '[data-patient-name]',
    '[data-testid*="patient-name"]',
    '.patient-name',
    '#patient-name',
    '.patient_name',
    '.patientName',
    '[id*="patient_name"]',
    '[class*="patient-name"]',
    '[class*="patientName"]',
    'h1.patient',
    'h2.patient',
    '.patient-header h1',
    '.patient-header h2',
    '.patient-details .name',
    '.patient-info .name'
  ]

  for (const sel of nameSelectors) {
    const el = document.querySelector(sel)
    if (el) {
      const text = (el as HTMLElement).innerText || (el as HTMLInputElement).value || ''
      const cleaned = cleanExtractedName(text)
      if (cleaned) {
        data.name = cleaned
        break
      }
    }
  }

  // 3. Scan body text via regex heuristics if not found via selectors
  const bodyText = document.body?.innerText || ''
  const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 300)

  for (const line of lines) {
    // Name pattern: "Patient Name: Rajesh Kumar" or "Patient: John Doe"
    if (!data.name) {
      const nameMatch = line.match(/(?:Patient(?:\s+Name)?|Pt\.?\s*Name)\s*[:-]\s*([A-Za-z.\s]{2,40})/i)
      if (nameMatch && nameMatch[1]) {
        const cleaned = cleanExtractedName(nameMatch[1])
        if (cleaned) data.name = cleaned
      }
    }

    // Age / Gender pattern: "Age: 32 Y / Male" or "Age / Sex: 45 / F"
    if (!data.age || !data.gender) {
      const ageSexMatch = line.match(/(?:Age\s*(?:\/|&)?\s*(?:Sex|Gender)?)\s*[:-]?\s*(\d{1,3})\s*(?:Y|Yrs?|Years?)?(?:\s*[/|,-]\s*(Male|Female|M|F|Other))?/i)
      if (ageSexMatch) {
        if (!data.age && ageSexMatch[1]) data.age = ageSexMatch[1]
        if (!data.gender && ageSexMatch[2]) {
          data.gender = normalizeGender(ageSexMatch[2])
        }
      }
    }

    // Standalone Gender
    if (!data.gender) {
      const genderMatch = line.match(/(?:Gender|Sex)\s*[:-]\s*(Male|Female|M|F|Other)/i)
      if (genderMatch && genderMatch[1]) {
        data.gender = normalizeGender(genderMatch[1])
      }
    }

    // Standalone Age
    if (!data.age) {
      const ageMatch = line.match(/(?:Age|Age\s*in\s*Years)\s*[:-]\s*(\d{1,3})\s*(?:Y|Yrs?|Years?)?/i)
      if (ageMatch && ageMatch[1]) {
        data.age = ageMatch[1]
      }
    }

    // Phone / Mobile pattern
    if (!data.phone) {
      const phoneMatch = line.match(/(?:Phone|Mobile|Contact(?:\s*No)?)\s*[:-]\s*(\+?\d[\d\s-]{8,14}\d)/i)
      if (phoneMatch && phoneMatch[1]) {
        data.phone = phoneMatch[1].replace(/[\s-]/g, '')
      }
    }

    // UHID / Patient ID / MRN
    if (!data.uhid) {
      const uhidMatch = line.match(/(?:UHID|MRN|Patient\s*ID|Reg\.?\s*No)\s*[:-]\s*([A-Za-z0-9\-_]{3,20})/i)
      if (uhidMatch && uhidMatch[1]) {
        data.uhid = uhidMatch[1].trim()
      }
    }

    // Diagnosis / Chief Complaint
    if (!data.diagnosis) {
      const diagMatch = line.match(/(?:Provisional\s*Diagnosis|Diagnosis|Chief\s*Complaint)\s*[:-]\s*([^\n\r]{3,80})/i)
      if (diagMatch && diagMatch[1]) {
        data.diagnosis = diagMatch[1].trim()
      }
    }
  }

  currentPatientData = data
  return data
}

function cleanExtractedName(raw: string): string {
  let cleaned = raw.replace(/^(Patient\s*Name|Patient|Name|Pt\.?\s*Name)\s*[:-]\s*/i, '').trim()
  cleaned = cleaned.replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Master|Baby)\s+/i, '')
  if (cleaned.length >= 2 && cleaned.length <= 40 && !cleaned.includes('\n')) {
    return cleaned
  }
  return ''
}

function normalizeGender(raw: string): string {
  const g = raw.trim().toUpperCase()
  if (g === 'M' || g.startsWith('MALE')) return 'Male'
  if (g === 'F' || g.startsWith('FEMALE')) return 'Female'
  return 'Other'
}

// ── 2. FLOATING PRESCRIPTION CANVAS WIDGET ────────────────────────────────
function buildEditorUrl(patientData: ExtractedPatientData): string {
  let url: URL
  try {
    url = new URL('/editor', currentBaseUrl || 'https://prescriptionmaker.in')
  } catch {
    url = new URL('https://prescriptionmaker.in/editor')
  }
  url.searchParams.set('embed', 'true')
  url.searchParams.set('source', 'extension')

  if (patientData.name) url.searchParams.set('prefill_name', patientData.name)
  if (patientData.age) url.searchParams.set('prefill_age', patientData.age)
  if (patientData.gender) url.searchParams.set('prefill_gender', patientData.gender)
  if (patientData.phone) url.searchParams.set('prefill_phone', patientData.phone)
  if (patientData.diagnosis) url.searchParams.set('prefill_diagnosis', patientData.diagnosis)
  if (patientData.uhid) url.searchParams.set('prefill_uhid', patientData.uhid)

  return url.toString()
}

function createFloatingWidget(patientData: ExtractedPatientData) {
  if (document.getElementById('prescriptionmaker-widget-root')) {
    widgetContainer = document.getElementById('prescriptionmaker-widget-root') as HTMLDivElement
    updateIframeUrl(patientData)
    return
  }

  // Root container
  widgetContainer = document.createElement('div')
  widgetContainer.id = 'prescriptionmaker-widget-root'
  widgetContainer.style.position = 'fixed'
  widgetContainer.style.bottom = '24px'
  widgetContainer.style.right = '24px'
  widgetContainer.style.width = '560px'
  widgetContainer.style.height = '680px'
  widgetContainer.style.maxWidth = '94vw'
  widgetContainer.style.maxHeight = '92vh'
  widgetContainer.style.backgroundColor = '#ffffff'
  widgetContainer.style.boxShadow = '0 20px 40px -10px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08)'
  widgetContainer.style.borderRadius = '16px'
  widgetContainer.style.zIndex = '2147483647' // Maximum possible z-index
  widgetContainer.style.overflow = 'hidden'
  widgetContainer.style.display = 'flex'
  widgetContainer.style.flexDirection = 'column'
  widgetContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  widgetContainer.style.transition = 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s ease'

  // Header / Drag Handle Bar
  const header = document.createElement('div')
  header.style.display = 'flex'
  header.style.alignItems = 'center'
  header.style.justifyContent = 'space-between'
  header.style.padding = '10px 14px'
  header.style.backgroundColor = '#0f766e' // Medical Teal
  header.style.color = '#ffffff'
  header.style.cursor = 'grab'
  header.style.userSelect = 'none'

  // Header Left (Brand + Live Status)
  const headerLeft = document.createElement('div')
  headerLeft.style.display = 'flex'
  headerLeft.style.alignItems = 'center'
  headerLeft.style.gap = '8px'

  const rxIcon = document.createElement('span')
  rxIcon.innerText = '℞'
  rxIcon.style.fontSize = '18px'
  rxIcon.style.fontWeight = '900'
  rxIcon.style.lineHeight = '1'
  rxIcon.style.color = '#5eead4' // Light cyan

  const titleWrap = document.createElement('div')
  titleWrap.style.display = 'flex'
  titleWrap.style.flexDirection = 'column'

  const brandText = document.createElement('span')
  brandText.innerText = 'PrescriptionMaker.in'
  brandText.style.fontWeight = '700'
  brandText.style.fontSize = '13px'
  brandText.style.letterSpacing = '0.3px'

  const subText = document.createElement('span')
  subText.innerText = patientData.name ? `Patient: ${patientData.name}` : 'EMR Canvas Connected'
  subText.style.fontSize = '10.5px'
  subText.style.color = 'rgba(255, 255, 255, 0.85)'
  subText.style.fontWeight = '400'
  subText.id = 'pm-widget-subtext'

  titleWrap.appendChild(brandText)
  titleWrap.appendChild(subText)
  headerLeft.appendChild(rxIcon)
  headerLeft.appendChild(titleWrap)

  // Header Right Controls (Sync, PopOut, Resize, Minimize, Close)
  const headerControls = document.createElement('div')
  headerControls.style.display = 'flex'
  headerControls.style.alignItems = 'center'
  headerControls.style.gap = '6px'

  // 1. Re-sync EMR Button
  const syncBtn = createHeaderButton('🔄', 'Re-scan page & refresh patient data', () => {
    const refreshed = extractPatientData()
    updateIframeUrl(refreshed)
    const sub = document.getElementById('pm-widget-subtext')
    if (sub) sub.innerText = refreshed.name ? `Synced: ${refreshed.name}` : 'Re-synced with page'
  })

  // 2. Pop-out in new tab
  const popOutBtn = createHeaderButton('🗗', 'Open in dedicated browser tab', () => {
    const currentUrl = buildEditorUrl(currentPatientData)
    window.open(currentUrl, '_blank')
  })

  // 3. Expand / Compact Toggle
  const expandBtn = createHeaderButton('⤢', 'Toggle Full Width', () => {
    if (!widgetContainer) return
    isExpanded = !isExpanded
    if (isExpanded) {
      widgetContainer.style.width = '820px'
      widgetContainer.style.height = '850px'
      expandBtn.innerText = '⤡'
    } else {
      widgetContainer.style.width = '560px'
      widgetContainer.style.height = '680px'
      expandBtn.innerText = '⤢'
    }
  })

  // 4. Minimize to Pill Button
  const minimizeBtn = createHeaderButton('🗕', 'Minimize to floating button', () => {
    minimizeWidget()
  })

  // 5. Close Button
  const closeBtn = createHeaderButton('✕', 'Close Prescription Canvas', () => {
    closeWidget()
  })

  headerControls.appendChild(syncBtn)
  headerControls.appendChild(popOutBtn)
  headerControls.appendChild(expandBtn)
  headerControls.appendChild(minimizeBtn)
  headerControls.appendChild(closeBtn)

  header.appendChild(headerLeft)
  header.appendChild(headerControls)

  // Iframe Canvas Container
  const iframeWrapper = document.createElement('div')
  iframeWrapper.style.flex = '1'
  iframeWrapper.style.position = 'relative'
  iframeWrapper.style.backgroundColor = '#f8fafc'

  const iframe = document.createElement('iframe')
  iframe.id = 'prescriptionmaker-iframe'
  iframe.src = buildEditorUrl(patientData)
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  iframe.style.display = 'block'
  iframe.allow = 'clipboard-write; camera; microphone'

  iframeWrapper.appendChild(iframe)
  widgetContainer.appendChild(header)
  widgetContainer.appendChild(iframeWrapper)
  document.body.appendChild(widgetContainer)

  // Attach Drag behavior to header
  attachDragBehavior(widgetContainer, header)
}

function createHeaderButton(label: string, tooltip: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.innerText = label
  btn.title = tooltip
  btn.style.width = '26px'
  btn.style.height = '26px'
  btn.style.borderRadius = '6px'
  btn.style.border = 'none'
  btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
  btn.style.color = '#ffffff'
  btn.style.fontSize = '12px'
  btn.style.cursor = 'pointer'
  btn.style.display = 'flex'
  btn.style.alignItems = 'center'
  btn.style.justifyContent = 'center'
  btn.style.transition = 'background-color 0.15s'

  btn.onmouseenter = () => { btn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)' }
  btn.onmouseleave = () => { btn.style.backgroundColor = 'rgba(255, 255, 255, 0.15)' }
  btn.onclick = onClick

  return btn
}

function updateIframeUrl(patientData: ExtractedPatientData) {
  const iframe = document.getElementById('prescriptionmaker-iframe') as HTMLIFrameElement | null
  if (iframe) {
    iframe.src = buildEditorUrl(patientData)
  }
}

// Draggable Handler
function attachDragBehavior(container: HTMLDivElement, handle: HTMLDivElement) {
  let isDragging = false
  let startX = 0
  let startY = 0
  let startRight = 24
  let startBottom = 24

  handle.addEventListener('mousedown', (e) => {
    // Ignore clicks on header buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON') return

    isDragging = true
    handle.style.cursor = 'grabbing'
    startX = e.clientX
    startY = e.clientY

    const rect = container.getBoundingClientRect()
    startRight = window.innerWidth - rect.right
    startBottom = window.innerHeight - rect.bottom

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      const newRight = Math.max(8, Math.min(window.innerWidth - 100, startRight - deltaX))
      const newBottom = Math.max(8, Math.min(window.innerHeight - 100, startBottom - deltaY))

      container.style.right = `${newRight}px`
      container.style.bottom = `${newBottom}px`
    }

    const onMouseUp = () => {
      isDragging = false
      handle.style.cursor = 'grab'
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  })
}

// ── 3. MINIMIZE / FLOATING PILL BUTTON ───────────────────────────────────
function createMinimizedBubble() {
  if (minimizedBubble && document.body.contains(minimizedBubble)) return

  minimizedBubble = document.createElement('div')
  minimizedBubble.id = 'prescriptionmaker-minimized-bubble'
  minimizedBubble.title = 'Open PrescriptionMaker Canvas'
  minimizedBubble.style.position = 'fixed'
  minimizedBubble.style.bottom = '24px'
  minimizedBubble.style.right = '24px'
  minimizedBubble.style.width = '48px'
  minimizedBubble.style.height = '48px'
  minimizedBubble.style.borderRadius = '50%'
  minimizedBubble.style.backgroundColor = '#0f766e'
  minimizedBubble.style.boxShadow = '0 10px 25px -5px rgba(15, 118, 110, 0.5), 0 0 0 3px #ffffff'
  minimizedBubble.style.color = '#ffffff'
  minimizedBubble.style.display = 'flex'
  minimizedBubble.style.alignItems = 'center'
  minimizedBubble.style.justifyContent = 'center'
  minimizedBubble.style.fontSize = '22px'
  minimizedBubble.style.fontWeight = '900'
  minimizedBubble.style.cursor = 'pointer'
  minimizedBubble.style.zIndex = '2147483647'
  minimizedBubble.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s'
  minimizedBubble.innerText = '℞'

  minimizedBubble.onmouseenter = () => {
    minimizedBubble!.style.transform = 'scale(1.1)'
  }
  minimizedBubble.onmouseleave = () => {
    minimizedBubble!.style.transform = 'scale(1)'
  }
  minimizedBubble.onclick = () => {
    restoreWidget()
  }

  document.body.appendChild(minimizedBubble)
}

function minimizeWidget() {
  if (widgetContainer) {
    widgetContainer.style.display = 'none'
  }
  createMinimizedBubble()
}

function restoreWidget() {
  if (minimizedBubble) {
    minimizedBubble.remove()
    minimizedBubble = null
  }
  if (widgetContainer) {
    widgetContainer.style.display = 'flex'
    isWidgetVisible = true
  }
}

function closeWidget() {
  if (widgetContainer) {
    widgetContainer.style.display = 'none'
  }
  if (minimizedBubble) {
    minimizedBubble.remove()
    minimizedBubble = null
  }
  isWidgetVisible = false
}

function toggleWidget(customData?: Partial<ExtractedPatientData>) {
  const patientData = extractPatientData()
  if (customData) {
    Object.assign(patientData, customData)
  }

  if (!widgetContainer) {
    createFloatingWidget(patientData)
    isWidgetVisible = true
    return
  }

  if (isWidgetVisible) {
    closeWidget()
  } else {
    updateIframeUrl(patientData)
    widgetContainer.style.display = 'flex'
    isWidgetVisible = true
  }
}

// ── 4. CHROME RUNTIME MESSAGE LISTENER ───────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_widget') {
    toggleWidget()
    sendResponse({ status: 'success', isVisible: isWidgetVisible })
    return true
  }

  if (request.action === 'open_widget_with_data') {
    toggleWidget(request.data)
    sendResponse({ status: 'success', isVisible: true })
    return true
  }

  if (request.action === 'get_patient_data') {
    const data = extractPatientData()
    sendResponse({ status: 'success', data, isWidgetVisible })
    return true
  }

  if (request.action === 'set_base_url') {
    if (request.baseUrl) {
      currentBaseUrl = request.baseUrl
      if (isWidgetVisible) {
        updateIframeUrl(currentPatientData)
      }
      sendResponse({ status: 'success' })
    }
    return true
  }
})
