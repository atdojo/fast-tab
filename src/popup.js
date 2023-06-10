const SEARCH_DEBOUNCE_MILLISECONDS = 50
const LIST_TAB_CLASS = 'list-tab'
const LIST_SEARCH_IGNORE_CLASS = 'list-search-ignore'
const LIST_TAB_VISIBLE_QUERY_SELECOR = '.' + LIST_TAB_CLASS + ':not(.d-none)'
const LIST_WINDOW_CLASS = 'list-window'
const LIST_TAB_SELECTED_CLASS = 'list-tab--selected'
const LIST_TAB_INFO_CLASS = 'list-tab-info'
const LIST_TAB_TIMESTAMP_CLASS = 'list-tab-timestamp'
const KEY_CODE_ENTER = 13
const KEY_CODE_ARROW_LEFT = 37
const KEY_CODE_ARROW_UP = 38
const KEY_CODE_ARROW_RIGHT = 39
const KEY_CODE_ARROW_DOWN = 40
const TAB_TIMESTAMP_UPDATE_INTERVAL_IN_MILLISECONDS = 1000
const TAB_ID_SEARCH_IN_NEW_TAB = 'search-in-new-tab'
const WINDOW_ID_SEARCH_IN_NEW_TAB = TAB_ID_SEARCH_IN_NEW_TAB
const COMMAND_SEARCH_PREFIX = ':'
const COMMANDS = ['close', 'reload', 'mute', 'unmute']

const searchElement = document.getElementById('search')
const tabListRoot = document.getElementById('tabs')
const commandSuggestionsRoot = document.getElementById('command-suggestions')

getTabs().then(tabs => {
    focusSearch()

    sortTabsByWindowId(tabs)
    renderTabs(tabs)

    addSearchEventListener()
    addKeyboardEventListeners()
    addCommandSuggestions()
    setInterval(addUpdateChromeTabTimestamps, TAB_TIMESTAMP_UPDATE_INTERVAL_IN_MILLISECONDS)


    // timeout until it renders tabs
    setTimeout(() => {
        selectFirstElementInTabList()
    }, 10)

    onSearchInput('')
})

function sortTabsByWindowId(tabs) {
    tabs.sort((a, b) => {
        if (a.windowId > b.windowId) {
            return -1
        }
        if (b.windowId < b.windowId) {
            return 1
        }
        return 0
    })
}

function focusSearch() {
    searchElement.focus()
}

async function getTabs(queryOptions = {}) {
    return new Promise(resolve => {
        chrome.tabs.query(queryOptions, resolve)
    })
}

async function renderTabs(tabs) {
    let lastWindowId = null
    tabListRoot.innerHTML = ''
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i]
        if (lastWindowId !== tab.windowId) {
            lastWindowId = tab.windowId
            const windowElement = await getTabWindowElement(tab)
            tabListRoot.appendChild(windowElement)
        }
        tabListRoot.appendChild(getTabElement(tab))
    }
    tabListRoot.appendChild(getTabElementSearchInNewTab())
}

async function getTabWindowElement(tab) {
    const el = document.createElement('div')
    el.classList.add(LIST_WINDOW_CLASS)

    const title = document.createElement('div')
    title.classList.add('list-window-title')

    const currentWindowId = (await getCurrentWindow()).id
    title.innerText = tab.windowId === currentWindowId ? "Current Window" : "Window"

    const info = document.createElement('div')
    info.classList.add('list-window-info')
    info.innerText = tab.windowId

    el.appendChild(title)
    el.appendChild(info)
    return el
}

function getTabElement(tab) {
    const el = document.createElement('div')
    el.classList.add(LIST_TAB_CLASS)
    el.setAttribute('data-tab-id', tab.id)
    el.setAttribute('data-window-id', tab.windowId)
    el.setAttribute('data-url', tab.url)

    const icon = document.createElement('img')
    icon.classList.add('list-tab-icon')
    icon.src = tab.favIconUrl
    el.appendChild(icon)

    const content = document.createElement('div')
    content.classList.add('list-tab-content')

    const title = document.createElement('div')
    title.classList.add('list-tab-title')
    title.innerText = tab.title
    content.appendChild(title)

    const info = document.createElement('div')
    info.classList.add(LIST_TAB_INFO_CLASS)

    const timestamp = document.createElement('div')
    timestamp.classList.add(LIST_TAB_TIMESTAMP_CLASS)

    info.appendChild(timestamp)
    content.appendChild(info)

    el.appendChild(icon)
    el.appendChild(content)
    return el
}

function getTabElementSearchInNewTab() {
    const element = getTabElement({
        favIconUrl: 'https://www.google.com/favicon.ico',
        title: 'Search in new tab...',
        id: TAB_ID_SEARCH_IN_NEW_TAB,
        windowId: TAB_ID_SEARCH_IN_NEW_TAB
    })
    element.classList.add(LIST_SEARCH_IGNORE_CLASS)
    return element
}

async function getCurrentWindow() {
    return new Promise(resolve => {
        chrome.windows.getCurrent(
            null,
            resolve,
        )
    })
}

function addSearchEventListener() {
    let debounceTimeoutId = null
    searchElement.addEventListener('input', (e) => {
        if (debounceTimeoutId) {
            clearTimeout(debounceTimeoutId)
        }
        setTimeout(() => {
            onSearchInput(e.target.value)
        }, SEARCH_DEBOUNCE_MILLISECONDS)
    })
}

function onSearchInput(input) {
    // improve search filter
    const { search, command } = parseSearch(input)

    handleCommandSuggestions(command)

    const tabElements = tabListRoot.children
    for (let i = 0; i < tabElements.length; i++) {
        const tabElement = tabElements[i]
        if (tabElement.classList.contains(LIST_TAB_CLASS)
            && !tabElement.classList.contains(LIST_SEARCH_IGNORE_CLASS)
        ) {
            // is tab item that should be filtered
            if (isTabSearchHit(tabElement, search)) {
                tabElement.classList.remove('d-none')
            } else {
                tabElement.classList.add('d-none')
            }
        }
    }
    selectFirstElementInTabList()
}

function parseSearch(input) {
    const searchSplit = input.split(COMMAND_SEARCH_PREFIX)
    const search = searchSplit[0].trim()
    const command = searchSplit[1]
    return {
        search,
        command,
    }
}

function isTabSearchHit(tabElement, input) {
    const titleLower = tabElement.lastElementChild.firstElementChild.innerText.toLowerCase()
    const url = tabElement.getAttribute('data-url')
    const inputLower = input.toLowerCase()
    return titleLower.includes(inputLower) || url.includes(inputLower)
}

function selectFirstElementInTabList() {
    const selectedTab = getSelectedTabInList()
    if (selectedTab) {
        selectedTab.classList.remove(LIST_TAB_SELECTED_CLASS)
    }
    const firstEleement = tabListRoot.querySelector(LIST_TAB_VISIBLE_QUERY_SELECOR)
    if (firstEleement) {
        selectTabElement(firstEleement)
    }
}

function selectNextElementInTabList() {
    const selectedTab = getSelectedTabInList()
    if (selectedTab) {
        let nextElementSibling = selectedTab.nextElementSibling
        if (nextElementSibling === null) {
            return
        }

        selectedTab.classList.remove(LIST_TAB_SELECTED_CLASS)
        while (
            !nextElementSibling.classList.contains(LIST_TAB_CLASS) ||
            nextElementSibling.classList.contains('d-none')
        ) {
            nextElementSibling = nextElementSibling.nextElementSibling
            if (nextElementSibling === null) {
                nextElementSibling = selectedTab
                break
            }
        }
        selectTabElement(nextElementSibling)
    } else {
        selectFirstElementInTabList()
    }
}

function selectPreviousElementInTabList() {
    const selectedTab = getSelectedTabInList()
    if (selectedTab) {
        let previousElementSibling = selectedTab.previousElementSibling
        if (previousElementSibling === null) {
            return
        }

        selectedTab.classList.remove(LIST_TAB_SELECTED_CLASS)
        while (
            !previousElementSibling.classList.contains(LIST_TAB_CLASS) ||
            previousElementSibling.classList.contains('d-none')
        ) {
            previousElementSibling = previousElementSibling.previousElementSibling
            if (previousElementSibling === null) {
                previousElementSibling = selectedTab
                break
            }
        }
        selectTabElement(previousElementSibling)
    } else {
        selectFirstElementInTabList()
    }
}

function selectTabElement(element) {
    element.classList.add(LIST_TAB_SELECTED_CLASS)
    element.scrollIntoViewIfNeeded()
}

function getSelectedTabInList() {
    return tabListRoot.querySelector('.' + LIST_TAB_SELECTED_CLASS)
}

function addKeyboardEventListeners() {
    window.addEventListener('keydown', onKeydown)
}

function handleCommandOnKeydownEnter(command) {
    const tabIds = getFilteredTabIds()
    if (command === 'close') {
        chrome.tabs.remove(tabIds)
    }
    if (command === 'reload') {
        tabIds.forEach(tabId =>  chrome.tabs.reload(tabId))
    }
    if (command === 'mute') {
        tabIds.forEach(tabId =>  chrome.tabs.update(tabId,  { muted: true }))
    }
    if (command === 'unmute') {
        tabIds.forEach(tabId =>  chrome.tabs.update(tabId,  { muted: false }))
    }
}

function getFilteredTabIds() {
    const tabIds = []
    for (let i = 0; i < tabListRoot.children.length; i++) {
        const tabElement = tabListRoot.children[i]
        if (!tabElement.classList.contains('d-none')) {
            const tabId = tabElement.getAttribute('data-tab-id')
            if (tabId && parseInt(tabId)) {
                tabIds.push(parseInt(tabId))
            }
        }
    }
    return tabIds
}

function handleKeydownEnter(e) {
    e.preventDefault()

    const { command } = parseSearch(searchElement.value)
    if (command !== undefined) {
        handleCommandOnKeydownEnter(command)
        return
    }

    const selectedTab = getSelectedTabInList()
    if (selectedTab === null) {
        return
    }

    const tabId = selectedTab.getAttribute('data-tab-id')
    const windowId = selectedTab.getAttribute('data-window-id')
    if (tabId === TAB_ID_SEARCH_IN_NEW_TAB) {
        chrome.tabs.create({ url: 'https://www.google.com/search?q=' + searchElement.value })
        return
    }

    focusChromeTab(parseInt(tabId), parseInt(windowId))
}

function onKeydown(e) {
    if (e.keyCode === KEY_CODE_ENTER) {
        handleKeydownEnter(e)
    }
    else if (e.keyCode === KEY_CODE_ARROW_UP) {
        e.preventDefault()
        selectPreviousElementInTabList()
    }
    else if (e.keyCode === KEY_CODE_ARROW_DOWN) {
        e.preventDefault()
        selectNextElementInTabList()
    }
}

function focusChromeTab(tabId, windowId) {
    chrome.windows.update(windowId, { focused: true });
    chrome.tabs.update(tabId, { active: true })
}

async function getChromeTabTimestamps() {
    const message = await new Promise(resolve => {
        chrome.runtime.sendMessage(
            chrome.runtime.id,
            { command: "get.tabIdTimestamps" },
            resolve,
        )
    })
    return message.payload
}

function formatTimestampTimeAgo(date) {
    const now = new Date()
    const diffInMilliseconds = now - new Date(date)
    const seconds = Math.floor(diffInMilliseconds / 1000)
    const minutes = Math.floor(diffInMilliseconds / (1000 * 60))
    const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60))
    const days = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24))
    console.log(now, date, diffInMilliseconds, seconds)

    if (days > 0) {
        return days === 1 ? '1 day ago' : days + ' days ago'
    }
    if (hours > 0) {
        return hours === 1 ? '1 hour ago' : hours + ' hours ago'
    }
    if (minutes > 0) {
        return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago'
    }
    return seconds === 1 ? '1 second ago' : seconds + ' seconds ago'
}

async function addUpdateChromeTabTimestamps() {
    const tabTimestamps = await getChromeTabTimestamps()
    Object.keys(tabTimestamps).forEach(tabId => {
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`)
        if (tabElement) {
            const timestampFormatted = formatTimestampTimeAgo(tabTimestamps[tabId])
            tabElement.querySelector("." + LIST_TAB_TIMESTAMP_CLASS).innerText = timestampFormatted
        }
    })
}

function displayCommandSuggestions(display = true) {
    if (display) {
        commandSuggestionsRoot.classList.remove('d-none')
    } else {
        commandSuggestionsRoot.classList.add('d-none')
    }
}

function handleCommandSuggestions(command) {
    if (command === undefined) {
        commandSuggestionsRoot.classList.add('d-none')
        return // no command, not even prefix typed
    }
    if (COMMANDS.includes(command.trim())) {
        commandSuggestionsRoot.classList.add('d-none')
        return // command typed
    }

    commandSuggestionsRoot.classList.remove('d-none')

    const suggestionElements = commandSuggestionsRoot.children
    for (let i = 0; i < suggestionElements.length; i++) {
        const element = suggestionElements[i]
        // is tab item that should be filtered
        if (element.innerText.includes(command)) {
            element.classList.remove('d-none')
        } else {
            element.classList.add('d-none')
        }
    }
}

function addCommandSuggestions() {
    COMMANDS.forEach(command => {
        const commandElement = document.createElement('div')
        commandElement.classList.add('command-suggestion')
        commandElement.innerText = command
        commandSuggestionsRoot.appendChild(commandElement)
    })
}