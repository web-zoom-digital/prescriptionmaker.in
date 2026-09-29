// Content script injected into every page
console.log('PrescriptionMaker Content Script Loaded')

let widgetContainer: HTMLDivElement | null = null
let isWidgetVisible = false

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_widget') {
    toggleWidget()
    sendResponse({ status: 'success' })
  }
})

function toggleWidget() {
  if (!widgetContainer) {
    createWidget()
  }
  
  if (isWidgetVisible) {
    widgetContainer!.style.display = 'none'
  } else {
    widgetContainer!.style.display = 'block'
  }
  isWidgetVisible = !isWidgetVisible
}

function createWidget() {
  widgetContainer = document.createElement('div')
  widgetContainer.id = 'prescriptionmaker-widget-root'
  widgetContainer.style.position = 'fixed'
  widgetContainer.style.bottom = '20px'
  widgetContainer.style.right = '20px'
  widgetContainer.style.width = '350px'
  widgetContainer.style.height = '500px'
  widgetContainer.style.backgroundColor = '#fff'
  widgetContainer.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
  widgetContainer.style.borderRadius = '12px'
  widgetContainer.style.zIndex = '999999'
  widgetContainer.style.overflow = 'hidden'
  widgetContainer.style.border = '1px solid #e2e8f0'

  // Embed the web app via iframe for now to avoid duplicating the entire editor UI in the extension
  const iframe = document.createElement('iframe')
  // Depending on environment, this will be localhost or the production URL
  iframe.src = 'https://prescriptionmaker.in/editor'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  
  // Close button
  const closeBtn = document.createElement('button')
  closeBtn.innerText = '✕'
  closeBtn.style.position = 'absolute'
  closeBtn.style.top = '10px'
  closeBtn.style.right = '10px'
  closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
  closeBtn.style.border = 'none'
  closeBtn.style.borderRadius = '50%'
  closeBtn.style.width = '24px'
  closeBtn.style.height = '24px'
  closeBtn.style.cursor = 'pointer'
  closeBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
  closeBtn.style.zIndex = '10'
  
  closeBtn.onclick = () => {
    toggleWidget()
  }

  widgetContainer.appendChild(iframe)
  widgetContainer.appendChild(closeBtn)
  document.body.appendChild(widgetContainer)
}
