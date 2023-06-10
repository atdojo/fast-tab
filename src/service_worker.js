const tabIdTimestamps = {}

chrome.tabs.onCreated.addListener(function (tab) {
    tabIdTimestamps[tab.id] = new Date()
})

chrome.tabs.onRemoved.addListener(function (tabId) {
    delete tabIdTimestamps[tabId]
})

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.command === "get.tabIdTimestamps") {
        sendResponse({ command: "get.tabIdTimestamps", payload: tabIdTimestamps })
    }
    if (request.command === 'execute.command') {
        await executeCommand(request.payload.command, request.payload.tabIds)
        sendResponse({ command: 'execute.command', state: 'success' })
    }
    if (request.command === "log") {
        console.log(request.payload)
    }
})

async function executeCommand(command, tabIds) {
    console.log(`Executing command "${command}" for tabIds: `, tabIds)
    if (command === 'close') {
        await new Promise(resolve => {
            chrome.tabs.remove(tabIds, resolve)
        })
    }
    if (command === 'reload') {
        for (let i = 0; i < tabIds.length; i++) {
            await new Promise(resolve => {
                chrome.tabs.reload(tabIds[i], resolve)
            })
        }
    }
    if (command === 'mute') {
        for (let i = 0; i < tabIds.length; i++) {
            await new Promise(resolve => {
                chrome.tabs.update(tabIds[i], { muted: true }, resolve)
            })
        }
    }
    if (command === 'unmute') {
        for (let i = 0; i < tabIds.length; i++) {
            await new Promise(resolve => {
                chrome.tabs.update(tabIds[i], { muted: false }, resolve)
            })
        }
    }
    if (command === 'detach') {
        const newWindow = await new Promise(resolve => {
            chrome.windows.create({ tabId: tabIds[0], focused: true }, resolve)
        })
        for (let i = 1; i < tabIds.length; i++) {
            await new Promise(resolve => {
                chrome.tabs.move(tabIds[i], { windowId: newWindow.id, index: -1 }, resolve)
            })
        }
    }
    if (command === 'detachsingle') {
        for (let i = 0; i < tabIds.length; i++) {
            await new Promise(resolve => {
                chrome.windows.create({ tabId: tabIds[i], focused: false }, resolve)
            })
        }
    }
    if (command === 'merge') {
        // create new window, move all tabs
        const newWindow = await getCurrentWindow()
        for (let i = 0; i < tabIds.length; i++) {
            await new Promise(resolve => {
                chrome.tabs.move(tabIds[i], { windowId: newWindow.id, index: -1 }, resolve)
            })
        }
    }
}

async function getCurrentWindow() {
    return new Promise(resolve => {
        chrome.windows.getCurrent(
            {},
            resolve
          )
    })
}