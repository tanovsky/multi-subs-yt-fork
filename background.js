/*
 * By garywill (https://garywill.github.io)
 * https://github.com/garywill/multi-subs-yt
 * 
 * Background service worker for Manifest V3
 */

// Store playerResponse per tab
const playerResponses = {};

// Listen for all messages and relay appropriately
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const tabId = sender.tab.id;
    
    // Store player response from content script
    if (message.playerResponse_json) {
        playerResponses[tabId] = message;
    }
    
    // Relay messages between popup and content script
    if (message.action === "display_sub" || message.action === "remove_subs") {
        chrome.tabs.sendMessage(tabId, message).catch(err => {
            console.error("Error sending message:", err);
        });
    }
});
