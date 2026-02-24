/*
 * By garywill (https://garywill.github.io)
 * https://github.com/garywill/multi-subs-yt
 * 
 * Background service worker for Manifest V3
 */

// Listen for messages from popup and inject.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Just relay messages between popup and content script
    if (message.action === "display_sub" || message.action === "remove_subs") {
        chrome.tabs.sendMessage(sender.tab.id, message);
    }
});
