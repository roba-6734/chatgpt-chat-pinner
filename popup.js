// ChatGPT Chat Pinner Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  try {
    
    const result = await chrome.storage.sync.get(['pinnedChats']);
    const pinnedChats = result.pinnedChats || [];
    
    
    const countElement = document.getElementById('pinnedCount');
    countElement.textContent = pinnedChats.length.toString();
    
    
  
    
  } catch (error) {
    console.error('Failed to load popup data:', error);
    const countElement = document.getElementById('pinnedCount');
    countElement.textContent = '0';
  }
});


chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.pinnedChats) {
    const countElement = document.getElementById('pinnedCount');
    const newCount = changes.pinnedChats.newValue?.length || 0;
    countElement.textContent = newCount.toString();
  }
});