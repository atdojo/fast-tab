const SEARCH_DEBOUNCE_MILLISECONDS = 50

getTabs().then(tabs => {
    focusSearch()

    sortTabsByWindowId(tabs)
    renderTabs(tabs)

    addSearchEventListener()
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
    document.getElementById('search').focus()
}

async function getTabs(queryOptions = {}) {
    return new Promise(resolve => {
        chrome.tabs.query(queryOptions, resolve)
    })
}

async function renderTabs(tabs) {
    let lastWindowId = null
    const tabsContainer = document.getElementById('tabs')
    for(let i = 0; i < tabs.length; i++) {
        const tab = tabs[i]
        if (lastWindowId !== tab.windowId) {
            lastWindowId = tab.windowId
            const windowElement = await getTabWindowElement(tab)
            tabsContainer.appendChild(windowElement)
        }
        tabsContainer.appendChild(getTabElement(tab))
    }
}

async function getTabWindowElement(tab) {
    const el = document.createElement('div')
    el.classList.add('list-window')

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
    el.classList.add('list-tab')
    
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
    info.classList.add('list-tab-info')
    info.innerText = "info"
    content.appendChild(info)

    el.appendChild(icon)
    el.appendChild(content)
    return el
}

function getCurrentBadgeElement() {
    const el = document.createElement('div')
    el.classList.add('badge-active')
    el.innerText = "active"
    return el
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
    const searchElement = document.getElementById('search')

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
    const tabElements = document.getElementById('tabs').children
    for(let i = 0; i < tabElements.length; i++) {
        const tabElement = tabElements[i]
        if (tabElement.classList.contains('list-tab')) {
            // is tab item
            if (isTabSearchHit(tabElement, input)) {
                tabElement.classList.remove('d-none')
            } else {
                tabElement.classList.add('d-none')
            }
        }
    }
}

function isTabSearchHit(tabElement, input) {
    const titleLower = tabElement.lastElementChild.firstElementChild.innerText.toLowerCase()
    const inputLower = input.toLowerCase()
    return titleLower.includes(inputLower)
}