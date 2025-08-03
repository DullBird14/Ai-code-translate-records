// Content script for Immersive Translation Word Extractor

// Set to store unique words in memory to prevent duplicates in the same session
const extractedWords = new Set();

// Function to extract word from the target element
function extractWord() {
  try {
    // Get the immersive translate modal root
    const modalRoot = document.getElementById('immersive-translate-modal-selection-root');
    
    if (modalRoot) {
      // Try different approaches to access the content
      let wordElement = null;
      
      // Approach 1: Direct shadowRoot access
      if (modalRoot.shadowRoot) {
        wordElement = modalRoot.shadowRoot.querySelector('.word-original-text');
        
        // Try alternative selectors if not found
        if (!wordElement) {
          wordElement = modalRoot.shadowRoot.querySelector('[class*="word-original"]');
        }
      }
      
      // Approach 2: If no shadowRoot or no element found, try direct query
      if (!wordElement) {
        wordElement = modalRoot.querySelector('.word-original-text');
      }
      
      if (wordElement) {
        const word = wordElement.textContent.trim();
        
        // Only save non-empty words that haven't been saved before
        if (word && !extractedWords.has(word)) {
          extractedWords.add(word);
          saveWord(word);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting word:', error);
  }
}

// Function to save word to Chrome storage
function saveWord(word) {
  try {
    // Get existing words from storage
    chrome.storage.local.get(['extractedWords'], function(result) {
      const words = result.extractedWords || [];
      
      // Add new word if it doesn't already exist
      if (!words.includes(word)) {
        words.push(word);
        
        // Save updated words array to storage
        chrome.storage.local.set({ extractedWords: words });
      }
    });
  } catch (error) {
    console.error('Error saving word:', error);
  }
}

// Function to periodically check for the modal (fallback approach)
function startPeriodicCheck() {
  setInterval(() => {
    const modalRoot = document.getElementById('immersive-translate-modal-selection-root');
    if (modalRoot) {
      extractWord();
    }
  }, 3000); // Check every 3 seconds
}

// Function to observe DOM changes
function observeDOM() {
  // Create a MutationObserver to watch for changes
  const observer = new MutationObserver(function(mutations) {
    let shouldExtract = false;
    
    mutations.forEach(function(mutation) {
      // Check for any additions or changes that might be related to our modal
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this is the modal root or contains it
            if (node.id === 'immersive-translate-modal-selection-root' || 
                (node.querySelector && node.querySelector('#immersive-translate-modal-selection-root'))) {
              shouldExtract = true;
            }
          }
        });
      }
      
      // Check for attribute changes on elements that might be our modal
      if (mutation.type === 'attributes') {
        if (mutation.target.id === 'immersive-translate-modal-selection-root') {
          shouldExtract = true;
        }
      }
    });
    
    // Extract word if we detected relevant changes
    if (shouldExtract) {
      setTimeout(extractWord, 100);
    }
  });
  
  // Start observing the document
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true
  });
  
  return observer;
}

// Initialize the observers when the page loads
startPeriodicCheck(); // Start periodic checking as a fallback

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeDOM);
} else {
  observeDOM();
}

// Also start observing immediately
setTimeout(observeDOM, 1000);