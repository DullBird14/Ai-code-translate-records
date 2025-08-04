// Popup script for Immersive Translation Word Extractor

document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const viewWordsBtn = document.getElementById('viewWordsBtn');
  const settingsBtn = document.getElementById('settingsBtn');
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
      
      // Check if File System Access API is supported
      if ('showOpenFilePicker' in window) {
        // Use File System Access API to select a file and write to it
        selectAndWriteToFile(content);
      } else {
        // Fallback to download approach
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
      }
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
  
  // Open settings page
  settingsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // Clear cache button
  document.getElementById('clearCacheBtn').addEventListener('click', function() {
    if (confirm('确定要清空所有已保存的单词吗？此操作不可恢复。')) {
      // Clear all stored words
      chrome.storage.local.remove(['extractedWords', 'wordsFileContent'], function() {
        if (chrome.runtime.lastError) {
          console.error('Error clearing cache:', chrome.runtime.lastError);
          alert('清空缓存失败: ' + chrome.runtime.lastError.message);
        } else {
          alert('单词缓存已清空！');
          // Also clear the word list display if it's currently shown
          wordList.innerHTML = '<p class="empty-message">没有找到已保存的单词。</p>';
        }
      });
    }
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
  
  // Function to select a file and write content to it using File System Access API
  async function selectAndWriteToFile(content) {
    try {
      // Use showOpenFilePicker to select an existing file or create a new one
      const [fileHandle] = await window.showSaveFilePicker({
        types: [{
          description: 'Text files',
          accept: {
            'text/plain': ['.txt']
          }
        }],
        suggestedName: 'immersive_translate_words.txt'
      });
      
      // Write to the file
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      alert('单词已成功导出到文件！');
    } catch (error) {
      // Handle user cancellation or errors
      if (error.name !== 'AbortError') {
        console.error('Error exporting to file:', error);
        alert('导出文件失败: ' + error.message);
      }
    }
  }
});