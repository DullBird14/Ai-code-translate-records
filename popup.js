// Popup script for Immersive Translation Word Extractor

document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const viewWordsBtn = document.getElementById('viewWordsBtn');
  const wordList = document.getElementById('wordList');
  
  // Export words to a text file
  exportBtn.addEventListener('click', function() {
    chrome.storage.local.get(['extractedWords'], function(result) {
      const words = result.extractedWords || [];
      
      if (words.length === 0) {
        alert('没有找到已保存的单词！');
        return;
      }
      
      // Create file content
      const content = words.join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted_words.txt';
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
      
      // Display words
      wordList.innerHTML = '<h3>已保存的单词:</h3>';
      const wordListElement = document.createElement('div');
      
      words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word;
        wordListElement.appendChild(wordElement);
      });
      
      wordList.innerHTML = '<h3>已保存的单词:</h3>';
      wordList.appendChild(wordListElement);
    });
  });
});