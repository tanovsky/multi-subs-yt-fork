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
    const tabId = sender.tab?.id;
    
    // Store player response from content script
    if (message.playerResponse_json && tabId) {
        playerResponses[tabId] = message;
        console.log("Stored player response for tab", tabId);
    }
    
    // Handle request for player info from popup
    if (message.action === "get_player_info" && !sender.tab) {
        // Message from popup - find active tab and relay
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const activeTabId = tabs[0].id;
                chrome.tabs.sendMessage(activeTabId, message).catch(err => {
                    console.error("Error sending to content script:", err);
                });
            }
        });
    }
    
    // Relay display_sub and remove_subs to content script
    if ((message.action === "display_sub" || message.action === "remove_subs") && tabId) {
        chrome.tabs.sendMessage(tabId, message).catch(err => {
            console.error("Error sending to content script:", err);
        });
    }
});
