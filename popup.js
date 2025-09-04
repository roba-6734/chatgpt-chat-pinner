// ChatGPT Chat Pinner Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get pinned chats count
    const result = await chrome.storage.sync.get(['pinnedChats']);
    const pinnedChats = result.pinnedChats || [];
    
    // Update the count display
    const countElement = document.getElementById('pinnedCount');
    countElement.textContent = pinnedChats.length.toString();
    
    // Add click handler to open ChatGPT if clicked
 
    
  } catch (error) {
    console.error('Failed to load popup data:', error);
    const countElement = document.getElementById('pinnedCount');
    countElement.textContent = '0';
  }
});

// Listen for storage changes to update the count in real-time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.pinnedChats) {
    const countElement = document.getElementById('pinnedCount');
    const newCount = changes.pinnedChats.newValue?.length || 0;
    countElement.textContent = newCount.toString();
  }
});