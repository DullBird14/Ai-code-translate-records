// Popup script for Immersive Translation Word Extractor

document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const viewWordsBtn = document.getElementById('viewWordsBtn');
  const wordList = document.getElementById('wordList');
  
  // Export words to a text file
  exportBtn.addEventListener('click', function() {
    // Get both the extracted words and the file content
    chrome.storage.local.get(['extractedWords', 'wordsFileContent'], function(result) {
      const words = result.extractedWords || [];
      const fileContent = result.wordsFileContent || '';
      
      if (words.length === 0 && !fileContent) {
        alert('没有找到已保存的单词！');
        return;
      }
      
      // Create file content (prefer the file content if available, otherwise use the words array)
      const content = fileContent || words.join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'immersive_translate_words.txt';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
  });
  
  // View saved words in the popup
  viewWordsBtn.addEventListener('click', function() {
    chrome.storage.local.get(['extractedWords'], function(result) {
      const words = result.extractedWords || [];
      
      if (words.length === 0) {
        wordList.innerHTML = '<p>没有找到已保存的单词。</p>';
        return;
      }
      
      // Display words with delete buttons
      wordList.innerHTML = '<h3>已保存的单词:</h3>';
      const wordListElement = document.createElement('div');
      
      words.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        const wordText = document.createElement('span');
        wordText.className = 'word-text';
        wordText.textContent = word;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = function() {
          deleteWord(index, wordItem);
        };
        
        wordItem.appendChild(wordText);
        wordItem.appendChild(deleteBtn);
        wordListElement.appendChild(wordItem);
      });
      
      wordList.innerHTML = '<h3>已保存的单词:</h3>';
      wordList.appendChild(wordListElement);
    });
  });
  
  // Delete a word from storage
  function deleteWord(index, element) {
    chrome.storage.local.get(['extractedWords'], function(result) {
      const words = result.extractedWords || [];
      
      // Remove the word at the specified index
      words.splice(index, 1);
      
      // Update storage
      chrome.storage.local.set({ extractedWords: words }, function() {
        // Remove the element from the UI
        element.remove();
        
        // If no words left, show empty message
        if (words.length === 0) {
          wordList.innerHTML = '<p class="empty-message">没有找到已保存的单词。</p>';
        }
      });
    });
  }
});