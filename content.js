// ChatGPT Chat Pinner Content Script

class ChatPinner {
  constructor() {
    this.pinnedChats = new Set();
    this.observer = null;
    this.chatListContainer = null;
    this.isReordering = false;
    this.reorderTimeout = null;
    this.init();
  }

  async init() {
    await this.loadPinnedChats();
    this.setupObserver();
    this.processExistingChats();
  }

  async loadPinnedChats() {
    try {
      const result = await chrome.storage.sync.get(['pinnedChats']);
      this.pinnedChats = new Set(result.pinnedChats || []);
    } catch (error) {
      console.error('Failed to load pinned chats:', error);
      this.pinnedChats = new Set();
    }
  }

  async savePinnedChats() {
    try {
      await chrome.storage.sync.set({ 
        pinnedChats: Array.from(this.pinnedChats) 
      });
    } catch (error) {
      console.error('Failed to save pinned chats:', error);
    }
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      if (this.isReordering) return;
      
      if (document.hidden || !document.hasFocus()) return;
      
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector && (
                node.querySelector('[data-testid*="conversation"]') ||
                node.matches && node.matches('[data-testid*="conversation"]') ||
                node.querySelector && node.querySelector('a[href^="/c/"]') ||
                node.matches && node.matches('a[href^="/c/"]')
              )) {
                shouldProcess = true;
              }
            }
          });
        }
      });
      
      if (shouldProcess) {
        this.debouncedProcessChats();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  debouncedProcessChats() {
    clearTimeout(this.reorderTimeout);
    this.reorderTimeout = setTimeout(() => {
      if (!this.isReordering) {
        this.processExistingChats();
      }
    }, 200);
  }

  processExistingChats() {
    if (this.isReordering) return;
    
    if (document.hidden || !document.hasFocus()) {
      return;
    }
    
    this.findChatListContainer();
    
    const chatItems = this.findChatItems();
    
    if (chatItems.length > 0) {
      const validChatItems = chatItems.filter(item => 
        item && item.parentNode && document.contains(item)
      );
      
      validChatItems.forEach(chatItem => this.processChatItem(chatItem));
      this.debouncedReorderChats();
    }
  }

  findChatListContainer() {
    const selectors = [
      '[data-testid="conversation-list"]',
      '.flex.flex-col.gap-2.pb-2.text-token-text-primary',
      'nav[aria-label="Chat history"] > div',
      'nav > div > div:first-child'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        this.chatListContainer = container;
        break;
      }
    }

    if (!this.chatListContainer) {
      const chatLinks = document.querySelectorAll('a[href^="/c/"]');
      if (chatLinks.length > 0) {
        this.chatListContainer = chatLinks[0].closest('div').parentElement;
      }
    }
  }

  findChatItems() {
    const selectors = [
      'a[href^="/c/"]',
      '[data-testid*="conversation"]',
      'li > a',
      '.group.relative.rounded-lg.hover\\:bg-token-sidebar-surface-secondary'
    ];

    let chatItems = [];
    
    for (const selector of selectors) {
      chatItems = Array.from(document.querySelectorAll(selector));
      if (chatItems.length > 0) break;
    }

    return chatItems.filter(item => {
      const href = item.getAttribute('href');
      return href && href.includes('/c/');
    });
  }

  processChatItem(chatItem) {
    const chatId = this.extractChatId(chatItem);
    if (!chatId) return;

    this.updateChatVisualState(chatItem, chatId);
  }

  extractChatId(chatItem) {
    const href = chatItem.getAttribute('href');
    if (href && href.includes('/c/')) {
      const match = href.match(/\/c\/([^/?]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  updateChatVisualState(chatItem, chatId) {
    if (this.pinnedChats.has(chatId)) {
      chatItem.classList.add('pinned-chat');
    } else {
      chatItem.classList.remove('pinned-chat');
    }
  }

  debouncedReorderChats() {
    clearTimeout(this.reorderTimeout);
    this.reorderTimeout = setTimeout(() => {
      this.reorderChats();
    }, 150);
  }

  reorderChats() {
    if (this.isReordering) return;
    
    if (document.hidden || !document.hasFocus()) {
      return;
    }
    
    this.isReordering = true;
    
    try {
      this.performReorder();
    } catch (error) {
      console.error('Error during chat reordering:', error);
    } finally {
      setTimeout(() => {
        this.isReordering = false;
      }, 300);
    }
  }

  performReorder() {
    if (!this.chatListContainer) {
      this.findChatListContainer();
    }
    
    if (!this.chatListContainer) return;

    const chatItems = this.findChatItems();
    if (chatItems.length === 0) return;

    const currentOrder = chatItems.map(item => this.extractChatId(item));
    const pinnedIds = Array.from(this.pinnedChats);
    const unpinnedIds = currentOrder.filter(id => !this.pinnedChats.has(id));
    const expectedOrder = [...pinnedIds, ...unpinnedIds];
    
    if (JSON.stringify(currentOrder) === JSON.stringify(expectedOrder)) {
      return;
    }

    const pinnedChats = [];
    const unpinnedChats = [];

    chatItems.forEach(chatItem => {
      const chatId = this.extractChatId(chatItem);
      if (chatId && this.pinnedChats.has(chatId)) {
        pinnedChats.push(chatItem);
      } else {
        unpinnedChats.push(chatItem);
      }
    });

    const parentContainer = chatItems[0]?.parentElement;
    if (!parentContainer) return;

    try {
      pinnedChats.forEach((chat) => {
        if (chat.parentNode === parentContainer) {
          parentContainer.insertBefore(chat, parentContainer.firstChild);
        }
      });

      unpinnedChats.forEach((chat) => {
        if (chat.parentNode === parentContainer) {
          parentContainer.appendChild(chat);
        }
      });

      const allChats = [...pinnedChats, ...unpinnedChats];
      allChats.forEach(chatItem => {
        const chatId = this.extractChatId(chatItem);
        if (chatId) {
          this.updateChatVisualState(chatItem, chatId);
        }
      });

    } catch (error) {
      console.error('Error during reordering:', error);
      const allChats = [...pinnedChats, ...unpinnedChats];
      allChats.forEach(chatItem => {
        const chatId = this.extractChatId(chatItem);
        if (chatId) {
          this.updateChatVisualState(chatItem, chatId);
        }
      });
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  handleMessage(message) {
    if (message.type === 'contextMenuPinToggle') {
      this.handleContextMenuToggle(message.chatId, message.action);
    }
  }

  async handleContextMenuToggle(chatId, action) {
    if (this.isReordering) return;
    
    try {
      if (action === 'pin-chat') {
        this.pinnedChats.add(chatId);
      } else {
        this.pinnedChats.delete(chatId);
      }

      const chatItems = this.findChatItems();
      const targetChatItem = chatItems.find(item => {
        const itemChatId = this.extractChatId(item);
        return itemChatId === chatId;
      });

      if (targetChatItem) {
        this.updateChatVisualState(targetChatItem, chatId);
      }

      this.debouncedReorderChats();

    } catch (error) {
      console.error('Failed to handle context menu toggle:', error);
    }
  }
}

let chatPinner = null;

function initializeChatPinner() {
  if (chatPinner) {
    chatPinner.destroy();
  }
  chatPinner = new ChatPinner();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeChatPinner, 1500);
  });
} else {
  setTimeout(initializeChatPinner, 1500);
}

let currentUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(initializeChatPinner, 2000);
  }
});

urlObserver.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (chatPinner) {
    chatPinner.handleMessage(message);
  }
  sendResponse({ received: true });
});