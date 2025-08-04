// Background script for Immersive Translation Word Extractor

let fileHandle = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFileHandle') {
    // Return the current file handle
    sendResponse({ fileHandle: fileHandle });
  } else if (request.action === 'setFileHandle') {
    // Set the file handle
    fileHandle = request.fileHandle;
    sendResponse({ success: true });
  } else if (request.action === 'clearFileHandle') {
    // Clear the file handle
    fileHandle = null;
    sendResponse({ success: true });
  }
});