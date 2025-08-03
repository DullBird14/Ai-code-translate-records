# Chrome Extension Plan: Immersive Translation Word Extractor

## Objective
Create a Chrome extension that listens for DOM changes in the immersive translation plugin and extracts translated words to a local file.

## Key Elements to Target
- Container: `div` with id `immersive-translate-modal-selection-root`
- Word element: `div` with class `word-original-text`
- Extract the text content from this element when it appears/changes

## Implementation Steps

### 1. Manifest File (manifest.json)
- Declare content script permissions
- Request permissions for activeTab and storage
- Define content script to run on all pages

### 2. Content Script (content.js)
- Set up a MutationObserver to watch for DOM changes
- Target the shadow DOM within `#immersive-translate-modal-selection-root`
- Listen for changes to elements with class `word-original-text`
- Extract the text content when detected
- Store words in an array to prevent duplicates
- Save words to a local file or Chrome storage

### 3. DOM Observation Strategy
- Use MutationObserver to watch for changes in the document
- Access the shadow DOM within the immersive translate modal
- Monitor for additions or modifications to elements with class `word-original-text`
- Extract the innerText when changes are detected

### 4. Data Storage
- Option 1: Save to Chrome storage (simpler, more reliable)
- Option 2: Create and download a text file with the words
- Prevent duplicate entries
- Format words as an array or list

### 5. Technical Considerations
- Handle shadow DOM access (may require specific permissions)
- Ensure the observer is properly disconnected when not needed
- Implement debouncing to prevent excessive processing
- Handle potential race conditions
- Consider memory usage for the words array

## Files to Create
1. manifest.json - Extension configuration
2. content.js - Main logic for DOM observation and word extraction
3. popup.html/js (optional) - For viewing/exporting collected words

## Permissions Required
- "activeTab"
- "storage"
- Possibly "downloads" if saving to a file