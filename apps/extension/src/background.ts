// Background service worker for PrescriptionMaker.in Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('[PrescriptionMaker] Extension Installed / Updated')

  // Setup right-click Context Menus
  try {
    chrome.contextMenus.create({
      id: 'pm-capture-selection',
      title: "Prescribe for '%s' in PrescriptionMaker",
      contexts: ['selection']
    })

    chrome.contextMenus.create({
      id: 'pm-toggle-widget',
      title: 'Open Prescription Canvas on this page (Alt+P)',
      contexts: ['page', 'frame']
    })

    chrome.contextMenus.create({
      id: 'pm-open-studio',
      title: 'Open PrescriptionMaker Studio in new tab',
      contexts: ['page', 'frame']
    })
  } catch (err) {
    console.warn('[PrescriptionMaker] Context menu setup:', err)
  }
})

// Handle Context Menu Actions
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return

  if (info.menuItemId === 'pm-capture-selection') {
    const selectedText = (info.selectionText || '').trim()
    chrome.tabs.sendMessage(tab.id, {
      action: 'open_widget_with_data',
      data: {
        diagnosis: selectedText,
        name: selectedText.length <= 40 ? selectedText : undefined
      }
    })
  } else if (info.menuItemId === 'pm-toggle-widget') {
    chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' })
  } else if (info.menuItemId === 'pm-open-studio') {
    chrome.storage.local.get(['pm_base_url'], (res) => {
      const base = (typeof res?.pm_base_url === 'string' && res.pm_base_url) ? res.pm_base_url.replace(/\/$/, '') : 'https://prescriptionmaker.in'
      chrome.tabs.create({ url: `${base}/editor` })
    })
  }
})

// Handle Keyboard Shortcuts (Alt+P)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-rx-widget') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' })
    }
  }
})

// Global message listener for internal communications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ status: 'alive' })
    return true
  }
})
