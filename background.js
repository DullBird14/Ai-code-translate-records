// Background script for Immersive Translation Word Extractor

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // For now, we don't need to handle any messages in the background script
  // All File System Access API operations must happen in the content script
  // due to user activation requirements
});