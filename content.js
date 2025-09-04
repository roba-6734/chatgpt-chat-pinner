// ChatGPT Chat Pinner Content Script

class ChatPinner {
  constructor() {
    this.pinnedChats = new Set();
    this.observer = null;
    this.chatListContainer = null;
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
    // Watch for DOM changes to catch dynamically loaded chats
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new chat items were added
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
        setTimeout(() => this.processExistingChats(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processExistingChats() {
    // Find chat list container
    this.findChatListContainer();
    
    // Find all chat items
    const chatItems = this.findChatItems();
    
    if (chatItems.length > 0) {
      chatItems.forEach(chatItem => this.processChatItem(chatItem));
      this.reorderChats();
    }
  }

  findChatListContainer() {
    // Try multiple selectors for the chat list container
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

    // Fallback: find container with multiple chat links
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

    // Filter to ensure we have valid chat items
    return chatItems.filter(item => {
      const href = item.getAttribute('href');
      return href && href.includes('/c/');
    });
  }

  processChatItem(chatItem) {
    // Skip if already processed
    if (chatItem.querySelector('.chat-pin-button')) return;

    const chatId = this.extractChatId(chatItem);
    if (!chatId) return;

    // Create pin button
    const pinButton = this.createPinButton(chatId, chatItem);
    
    // Add pin button to chat item
    this.addPinButtonToChat(chatItem, pinButton);
    
    // Update visual state
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

  createPinButton(chatId, chatItem) {
    const button = document.createElement('button');
    button.className = 'chat-pin-button';
    button.innerHTML = this.pinnedChats.has(chatId) ? 
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v1h5.2l.8 3 .8-3H18v-1l-2-2z"/></svg>' : 
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 12V4h1V2H7v2h1v8l-2 2v1h5.2l.8 3 .8-3H18v-1l-2-2z"/></svg>';
    
    button.title = this.pinnedChats.has(chatId) ? 'Unpin chat' : 'Pin chat';
    button.setAttribute('data-chat-id', chatId);
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePin(chatId, button, chatItem);
    });

    return button;
  }

  addPinButtonToChat(chatItem, pinButton) {
    // Find the best place to add the pin button
    const titleElement = chatItem.querySelector('[class*="truncate"]') || 
                        chatItem.querySelector('div:first-child') ||
                        chatItem;

    // Create container for the pin button
    const container = document.createElement('div');
    container.className = 'chat-pin-container';
    container.appendChild(pinButton);

    // Position the button appropriately
    if (titleElement && titleElement !== chatItem) {
      titleElement.style.position = 'relative';
      titleElement.appendChild(container);
    } else {
      chatItem.style.position = 'relative';
      chatItem.appendChild(container);
    }
  }

  async togglePin(chatId, button, chatItem) {
    const wasError = false;
    
    try {
      if (this.pinnedChats.has(chatId)) {
        this.pinnedChats.delete(chatId);
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 12V4h1V2H7v2h1v8l-2 2v1h5.2l.8 3 .8-3H18v-1l-2-2z"/></svg>';
        button.title = 'Pin chat';
        chatItem.classList.remove('pinned-chat');
      } else {
        this.pinnedChats.add(chatId);
        button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v1h5.2l.8 3 .8-3H18v-1l-2-2z"/></svg>';
        button.title = 'Unpin chat';
        chatItem.classList.add('pinned-chat');
      }

      await this.savePinnedChats();
      
      // Add visual feedback
      button.classList.add('pin-button-clicked');
      setTimeout(() => button.classList.remove('pin-button-clicked'), 200);
      
      // Reorder chats after a short delay
      setTimeout(() => this.reorderChats(), 100);
      
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      // Revert changes if there was an error
      if (wasError) {
        this.pinnedChats.has(chatId) ? this.pinnedChats.delete(chatId) : this.pinnedChats.add(chatId);
      }
    }
  }

  updateChatVisualState(chatItem, chatId) {
    if (this.pinnedChats.has(chatId)) {
      chatItem.classList.add('pinned-chat');
    } else {
      chatItem.classList.remove('pinned-chat');
    }
  }

  reorderChats() {
    if (!this.chatListContainer) {
      this.findChatListContainer();
    }
    
    if (!this.chatListContainer) return;

    const chatItems = this.findChatItems();
    if (chatItems.length === 0) return;

    // Separate pinned and unpinned chats
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

    // Find the parent container of chat items
    const parentContainer = chatItems[0]?.parentElement;
    if (!parentContainer) return;

    // Remove all chat items temporarily
    const allChats = [...pinnedChats, ...unpinnedChats];
    const fragments = document.createDocumentFragment();

    // Add pinned chats first
    pinnedChats.forEach(chat => {
      chat.classList.add('pinned-chat-reordered');
      fragments.appendChild(chat);
    });

    // Add unpinned chats
    unpinnedChats.forEach(chat => {
      chat.classList.remove('pinned-chat-reordered');
      fragments.appendChild(chat);
    });

    // Clear and re-append in correct order
    allChats.forEach(chat => {
      if (chat.parentElement) {
        chat.remove();
      }
    });

    parentContainer.appendChild(fragments);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  // Handle messages from background script
  handleMessage(message) {
    if (message.type === 'contextMenuPinToggle') {
      this.handleContextMenuToggle(message.chatId, message.action);
    }
  }

  async handleContextMenuToggle(chatId, action) {
    try {
      // Update local state
      if (action === 'pin-chat') {
        this.pinnedChats.add(chatId);
      } else {
        this.pinnedChats.delete(chatId);
      }

      // Find the chat item and update its visual state
      const chatItems = this.findChatItems();
      const targetChatItem = chatItems.find(item => {
        const itemChatId = this.extractChatId(item);
        return itemChatId === chatId;
      });

      if (targetChatItem) {
        // Update pin button if it exists
        const pinButton = targetChatItem.querySelector('.chat-pin-button');
        if (pinButton) {
          if (action === 'pin-chat') {
            pinButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v1h5.2l.8 3 .8-3H18v-1l-2-2z"/></svg>';
            pinButton.title = 'Unpin chat';
          } else {
            pinButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 12V4h1V2H7v2h1v8l-2 2v1h5.2l.8 3 .8-3H18v-1l-2-2z"/></svg>';
            pinButton.title = 'Pin chat';
          }
          
          // Add visual feedback
          pinButton.classList.add('pin-button-clicked');
          setTimeout(() => pinButton.classList.remove('pin-button-clicked'), 200);
        }

        // Update visual state
        this.updateChatVisualState(targetChatItem, chatId);
      }

      // Reorder chats
      setTimeout(() => this.reorderChats(), 100);

    } catch (error) {
      console.error('Failed to handle context menu toggle:', error);
    }
  }
}

// Initialize the extension
let chatPinner = null;

function initializeChatPinner() {
  if (chatPinner) {
    chatPinner.destroy();
  }
  chatPinner = new ChatPinner();
}

// Wait for the page to load and ChatGPT interface to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeChatPinner, 1000);
  });
} else {
  setTimeout(initializeChatPinner, 1000);
}

// Re-initialize if the page changes (for SPAs like ChatGPT)
let currentUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(initializeChatPinner, 1500);
  }
});

urlObserver.observe(document.body, { childList: true, subtree: true });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (chatPinner) {
    chatPinner.handleMessage(message);
  }
  sendResponse({ received: true });
});