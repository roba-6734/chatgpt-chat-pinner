

chrome.runtime.onInstalled.addListener((details) => {
  
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
   
    chrome.storage.sync.set({ pinnedChats: [] });
    console.log('ChatGPT Chat Pinner extension installed');

    chrome.tabs.create({
      url: 'https://chatgpt.com'
    }); 

    }
});


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
 
      chrome.tabs.sendMessage(tab.id, {
        type: 'contextMenuPinToggle',
        chatId: chatId,
        action: info.menuItemId
      }).catch(() => {
        
      });

    } catch (error) {
      console.error('Failed to handle context menu action:', error);
    }
  }
});


chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'sync' && changes.pinnedChats) {
    updateContextMenus(changes.pinnedChats.newValue || []);
  }
});

function extractChatIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/c\/([^/?]+)/);
  return match ? match[1] : null;
}

function updateContextMenus(pinnedChats) {
 
}


chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.pinnedChats) {
   
    chrome.tabs.query({
      url: ['https://chatgpt.com/*', 'https://chat.openai.com/*']
    }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'pinnedChatsUpdated',
          pinnedChats: changes.pinnedChats.newValue
        }).catch(() => {
          
        });
      });
    });
  }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getPinnedChats') {
    chrome.storage.sync.get(['pinnedChats']).then((result) => {
      sendResponse(result.pinnedChats || []);
    });
    return true; 
  }
  
  if (message.type === 'setPinnedChats') {
    chrome.storage.sync.set({ pinnedChats: message.pinnedChats }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; 
  }
});