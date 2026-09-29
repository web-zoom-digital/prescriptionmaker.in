// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('PrescriptionMaker Extension Installed')
})

// Example: Listen for clicks on the extension icon to trigger a floating widget on the active page
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_widget" })
  }
})
