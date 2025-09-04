# ChatGPT Chat Pinner Chrome Extension

A Chrome extension that allows you to pin your favorite ChatGPT chats and keeps them at the top of your chat list for easy access.

## Features

- 📌 **Pin/Unpin Chats**: Right-click any chat to pin or unpin via context menu
- 🔝 **Top Positioning**: Pinned chats automatically appear at the top of your chat list
- 💾 **Persistent Storage**: Your pinned chats are saved and restored across browser sessions
- ✨ **Smooth Animations**: Elegant transitions and visual feedback
- 🎨 **Seamless Integration**: Blends perfectly with ChatGPT's existing design
- 📱 **Responsive**: Works on all screen sizes

## Installation

### From Chrome Web Store (Recommended)

1. **Visit the Chrome Web Store** and search for "ChatGPT Chat Pinner"
2. **Click "Add to Chrome"** to install the extension
3. **Start Using**: Navigate to [ChatGPT](https://chatgpt.com) and right-click any chat to pin/unpin

### From Source (Developer Mode)

1. **Download or Clone** this repository to your local machine

2. **Open Chrome Extensions**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**:
   - Click "Load unpacked"
   - Select the folder containing this extension

4. **Start Using**:
   - Navigate to [ChatGPT](https://chatgpt.com)
   - Right-click any chat in your list to pin/unpin

## How to Use

1. **Navigate to ChatGPT**: Open [chatgpt.com](https://chatgpt.com) in your browser

2. **Pin a Chat**:
   - Right-click on any chat in your chat list
   - Select "Pin Chat" from the context menu

3. **Unpin a Chat**:
   - Right-click on a pinned chat
   - Select "Unpin Chat" from the context menu

4. **View Pinned Chats**: Pinned chats will automatically appear at the top of your list with a golden highlight

## Features in Detail

### Pin Management
- **Context Menu Support**: Right-click any chat for quick pin/unpin access
- **Visual Feedback**: Pinned chats have a golden border and distinctive styling
- **Instant Reordering**: Chats are immediately moved to the top when pinned

### Visual Design
- **Golden Highlights**: Pinned chats have a distinctive golden accent
- **Smooth Animations**: All interactions include smooth transitions
- **Clean Integration**: Seamlessly blends with ChatGPT's interface

### Data Persistence
- **Cross-Session Storage**: Your pinned chats are saved using Chrome's sync storage
- **Multi-Device Sync**: If Chrome sync is enabled, pinned chats sync across devices
- **Reliable Storage**: Uses Chrome's built-in storage APIs for reliability

## Technical Details

- **Content Script Injection**: Monitors ChatGPT's DOM for chat list changes
- **Storage API**: Uses Chrome's storage.sync for persistent data
- **Mutation Observer**: Watches for dynamically loaded chats
- **CSS Integration**: Seamlessly styled to match ChatGPT's interface

## Privacy

This extension:
- ✅ Only works on ChatGPT domains
- ✅ Stores data locally in your browser
- ✅ Does not collect or transmit any personal data
- ✅ Does not access chat content, only chat IDs for pinning
- ✅ Minimal permissions required for functionality

## Troubleshooting

**Extension not working?**
- Refresh the ChatGPT page
- Make sure you're on chatgpt.com or chat.openai.com
- Check that the extension is enabled in chrome://extensions/

**Pinned chats not persisting?**
- Check that Chrome sync is working
- The extension needs storage permissions (granted automatically)

**Context menu not appearing?**
- Right-click on any chat item in the sidebar
- Make sure the extension is enabled
- Try refreshing the ChatGPT page

## Support

If you encounter any issues or have suggestions for improvements, please feel free to create an issue in this repository.

---

**Enjoy a more organized ChatGPT experience! 🚀**