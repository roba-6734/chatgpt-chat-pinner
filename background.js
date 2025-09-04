// ChatGPT Chat Pinner Background Script

// Context menu setup
chrome.runtime.onInstalled.addListener((details) => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'pin-chat',
    title: 'Pin Chat',
    contexts: ['link'],
    targetUrlPatterns: [
      'https://chatgpt.com/c/*',
      'https://chat.openai.com/c/*'
    ]
  });

  chrome.contextMenus.create({
    id: 'unpin-chat',
    title: 'Unpin Chat',
    contexts: ['link'],
    targetUrlPatterns: [
      'https://chatgpt.com/c/*',
      'https://chat.openai.com/c/*'
    ]
  });

  if (details.reason === 'install') {
    console.log('ChatGPT Chat Pinner extension installed');
    
    // Initialize storage with empty pinned chats array
    chrome.storage.sync.set({ pinnedChats: [] });
    
    // Show welcome message
    chrome.tabs.create({
      url: 'https://chatgpt.com'
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'pin-chat' || info.menuItemId === 'unpin-chat') {
    const chatId = extractChatIdFromUrl(info.linkUrl);
    if (!chatId) return;

    try {
      const result = await chrome.storage.sync.get(['pinnedChats']);
      const pinnedChats = new Set(result.pinnedChats || []);

      if (info.menuItemId === 'pin-chat') {
        pinnedChats.add(chatId);
      } else {
        pinnedChats.delete(chatId);
      }

      await chrome.storage.sync.set({ 
        pinnedChats: Array.from(pinnedChats) 
      });

      // Notify the content script to update the UI
      chrome.tabs.sendMessage(tab.id, {
        type: 'contextMenuPinToggle',
        chatId: chatId,
        action: info.menuItemId
      }).catch(() => {
        // Content script might not be loaded, ignore error
      });

    } catch (error) {
      console.error('Failed to handle context menu action:', error);
    }
  }
});

// Update context menu visibility based on pin status
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && changes.pinnedChats) {
    // Update context menu items visibility
    updateContextMenus(changes.pinnedChats.newValue || []);
  }
});

function extractChatIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/c\/([^/?]+)/);
  return match ? match[1] : null;
}

function updateContextMenus(pinnedChats) {
  // This function could be enhanced to show/hide menu items based on current context
  // For now, both options are always available
}

// Handle storage changes and sync across tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.pinnedChats) {
    // Notify all ChatGPT tabs about the change
    chrome.tabs.query({
      url: ['https://chatgpt.com/*', 'https://chat.openai.com/*']
    }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'pinnedChatsUpdated',
          pinnedChats: changes.pinnedChats.newValue
        }).catch(() => {
          // Tab might not have content script loaded yet, ignore error
        });
      });
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getPinnedChats') {
    chrome.storage.sync.get(['pinnedChats']).then((result) => {
      sendResponse(result.pinnedChats || []);
    });
    return true; // Will respond asynchronously
  }
  
  if (message.type === 'setPinnedChats') {
    chrome.storage.sync.set({ pinnedChats: message.pinnedChats }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }
});