const tabIdTimestamps = {}

chrome.tabs.onCreated.addListener(function (tab) {
    tabIdTimestamps[tab.id] = new Date()
})

chrome.tabs.onRemoved.addListener(function (tabId) {
    delete tabIdTimestamps[tabId]
})

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.command === "get.tabIdTimestamps") {
        sendResponse({ command: "get.tabIdTimestamps", payload: tabIdTimestamps })
    }
})