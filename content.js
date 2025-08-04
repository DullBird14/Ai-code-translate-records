// Content script for Immersive Translation Word Extractor

// Set to store unique words in memory to prevent duplicates in the same session
const extractedWords = new Set();

// Function to extract word from the target element
function extractWord() {
  console.log('extractWord function called');
  try {
    // Get the immersive translate modal root
    const modalRoot = document.getElementById('immersive-translate-modal-selection-root');
    console.log('Modal root found:', !!modalRoot);
    
    if (modalRoot) {
      // Try different approaches to access the content
      let wordElement = null;
      
      // Approach 1: Direct shadowRoot access
      if (modalRoot.shadowRoot) {
        wordElement = modalRoot.shadowRoot.querySelector('.word-original-text');
        console.log('Word element found in shadowRoot:', !!wordElement);
        
        // Try alternative selectors if not found
        if (!wordElement) {
          wordElement = modalRoot.shadowRoot.querySelector('[class*="word-original"]');
          console.log('Alternative word element found in shadowRoot:', !!wordElement);
        }
      }
      
      // Approach 2: If no shadowRoot or no element found, try direct query
      if (!wordElement) {
        wordElement = modalRoot.querySelector('.word-original-text');
        console.log('Word element found in direct query:', !!wordElement);
      }
      
      if (wordElement) {
        const word = wordElement.textContent.trim();
        console.log('Word extracted:', word);
        
        // Only save non-empty words that haven't been saved before
        if (word && !extractedWords.has(word)) {
          console.log('Saving new word:', word);
          extractedWords.add(word);
          saveWord(word);
        } else {
          console.log('Word already exists or is empty:', word);
        }
      } else {
        console.log('No word element found');
      }
    } else {
      console.log('No modal root found');
    }
  } catch (error) {
    console.error('Error extracting word:', error);
  }
}

// Function to save word to Chrome storage and append to local file
async function saveWord(word) {
  console.log('Saving word to storage:', word);
  try {
    // Get existing words from storage
    chrome.storage.local.get(['extractedWords'], function(result) {
      const words = result.extractedWords || [];
      console.log('Existing words in storage:', words);
      
      // Add new word if it doesn't already exist
      if (!words.includes(word)) {
        words.push(word);
        console.log('Adding new word to storage:', word);
        
        // Save updated words array to storage
        chrome.storage.local.set({ extractedWords: words }, function() {
          console.log('Word saved successfully:', word);
        });
        
        // Append word to local file
        appendWordToFile(word);
      } else {
        console.log('Word already exists in storage:', word);
      }
    });
  } catch (error) {
    console.error('Error saving word:', error);
  }
}

// Function to append word to a local file using File System Access API
async function appendWordToFile(word) {
  console.log('Appending word to local file:', word);
  try {
    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      try {
        // Try to get previously selected file handle from storage
        const result = await chrome.storage.local.get(['fileHandle']);
        let fileHandle = result.fileHandle;
        
        // If no file handle exists, prompt user to select a file
        if (!fileHandle) {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: 'immersive_translate_words.txt',
            types: [{
              description: 'Text files',
              accept: {
                'text/plain': ['.txt']
              }
            }]
          });
          
          // Store the file handle for future use
          await chrome.storage.local.set({ fileHandle });
        }
        
        // Get the file writer
        const writable = await fileHandle.createWritable();
        
        // Read existing content to append to it
        const file = await fileHandle.getFile();
        const existingContent = await file.text();
        
        // Append the new word to the file
        const newContent = existingContent + word + '\n';
        await writable.write(newContent);
        await writable.close();
        
        console.log('Word appended to file successfully:', word);
      } catch (error) {
        // User cancelled the file picker or there was an error
        console.error('Error appending word to file:', error);
        
        // Clear the stored file handle if there was an error
        await chrome.storage.local.remove(['fileHandle']);
      }
    } else {
      // Fallback to chrome.storage if File System Access API is not supported
      console.log('File System Access API not supported, falling back to storage');
      
      // Get existing words from the dedicated file storage
      chrome.storage.local.get(['wordsFileContent'], function(result) {
        let fileContent = result.wordsFileContent || '';
        
        // Append the new word to the file content
        fileContent += word + '\n';
        
        // Save the updated file content
        chrome.storage.local.set({ wordsFileContent: fileContent }, function() {
          if (chrome.runtime.lastError) {
            console.error('Error saving file content:', chrome.runtime.lastError);
          } else {
            console.log('Word appended to file content successfully:', word);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error appending word to file:', error);
  }
}

// Function to periodically check for the modal (fallback approach)
// REMOVED: Periodic check was causing issues and is no longer needed
// function startPeriodicCheck() {
//   setInterval(() => {
//     const modalRoot = document.getElementById('immersive-translate-modal-selection-root');
//     if (modalRoot) {
//       extractWord();
//     }
//   }, 3000); // Check every 3 seconds
// }

// Function to observe DOM changes
function observeDOM() {
  console.log('DOM Observer initialized');
  
  // Create a MutationObserver to watch for changes
  const observer = new MutationObserver(function(mutations) {
    console.log('DOM mutations detected:', mutations.length);
    let shouldExtract = false;
    
    mutations.forEach(function(mutation) {
      console.log('Mutation type:', mutation.type);
      
      // Check for any additions or changes that might be related to our modal
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            console.log('Added node:', node);
            // Check if this is the modal root or contains it
            if (node.id === 'immersive-translate-modal-selection-root' || 
                (node.querySelector && node.querySelector('#immersive-translate-modal-selection-root'))) {
              console.log('Modal root detected in added node');
              shouldExtract = true;
            }
            // Also check for elements with similar IDs
            else if (node.id && node.id.includes('immersive-translate')) {
              console.log('Immersive translate element detected:', node.id);
              shouldExtract = true;
            }
          }
        });
      }
      
      // Check for attribute changes on elements that might be our modal
      if (mutation.type === 'attributes') {
        console.log('Attribute mutation on:', mutation.target, 'attribute:', mutation.attributeName);
        if (mutation.target.id === 'immersive-translate-modal-selection-root') {
          console.log('Attribute change detected on modal root');
          shouldExtract = true;
        }
        // Also check for class changes which might indicate the modal is shown
        else if (mutation.attributeName === 'class' && 
                 mutation.target.id && 
                 mutation.target.id.includes('immersive-translate')) {
          console.log('Class change detected on immersive translate element:', mutation.target.id);
          shouldExtract = true;
        }
      }
      
      // Check for character data changes (text content)
      if (mutation.type === 'characterData') {
        console.log('Character data mutation:', mutation.target);
        // Check if this is within our target element
        const parent = mutation.target.parentElement;
        if (parent && parent.classList && 
            (parent.classList.contains('word-original-text') || 
             (parent.className && parent.className.includes('word-original')))) {
          console.log('Text content change detected in word element');
          shouldExtract = true;
        }
      }
    });
    
    // Extract word if we detected relevant changes
    if (shouldExtract) {
      console.log('Triggering word extraction due to DOM changes');
      // Wait 3 seconds for async content to load before extracting word
      setTimeout(extractWord, 3000);
    }
  });
  
  // Start observing the document with more comprehensive options
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true
  });
  
  return observer;
}

// Initialize the observers when the page loads
// startPeriodicCheck(); // REMOVED: Periodic check is no longer needed

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeDOM);
} else {
  observeDOM();
}

// Also start observing immediately
setTimeout(observeDOM, 1000);