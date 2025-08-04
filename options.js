// Options script for Immersive Translation Word Extractor

document.addEventListener('DOMContentLoaded', function() {
  const defaultFilePathInput = document.getElementById('defaultFilePath');
  const saveBtn = document.getElementById('saveBtn');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const statusDiv = document.getElementById('status');
  
  // Load saved settings
  chrome.storage.local.get(['defaultFilePath'], function(result) {
    if (result.defaultFilePath) {
      defaultFilePathInput.value = result.defaultFilePath;
    }
  });
  
  // Save settings
  saveBtn.addEventListener('click', function() {
    const defaultFilePath = defaultFilePathInput.value;
    
    chrome.storage.local.set({ defaultFilePath: defaultFilePath }, function() {
      showStatus('设置已保存', 'success');
    });
  });
  
  // Select file using File System Access API
  selectFileBtn.addEventListener('click', async function() {
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'Text files',
            accept: {
              'text/plain': ['.txt']
            }
          }]
        });
        
        // Get the file name for display
        const file = await fileHandle.getFile();
        defaultFilePathInput.value = file.name;
        
        showStatus('文件选择成功', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          showStatus('文件选择失败: ' + error.message, 'error');
        }
      }
    } else {
      showStatus('您的浏览器不支持File System Access API', 'error');
    }
  });
  
  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});