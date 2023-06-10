const SEARCH_DEBOUNCE_MILLISECONDS = 50
const LIST_TAB_CLASS = 'list-tab'
const LIST_TAB_VISIBLE_QUERY_SELECOR = '.' + LIST_TAB_CLASS + ':not(.d-none)'
const LIST_WINDOW_CLASS = 'list-window'
const LIST_TAB_SELECTED_CLASS = 'list-tab--selected'
const KEY_CODE_ENTER = 13
const KEY_CODE_ARROW_LEFT = 37
const KEY_CODE_ARROW_UP = 38
const KEY_CODE_ARROW_RIGHT = 39
const KEY_CODE_ARROW_DOWN = 40
const searchElement = document.getElementById('search')
const tabListRoot = document.getElementById('tabs')

getTabs().then(tabs => {
    focusSearch()

    sortTabsByWindowId(tabs)
    renderTabs(tabs)

    addSearchEventListener()
    addKeyboardEventListeners()

    // timeout until it renders html
    setTimeout(selectFirstElementInTabList, 10)
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
    for(let i = 0; i < tabs.length; i++) {
        const tab = tabs[i]
        if (lastWindowId !== tab.windowId) {
            lastWindowId = tab.windowId
            const windowElement = await getTabWindowElement(tab)
            tabListRoot.appendChild(windowElement)
        }
        tabListRoot.appendChild(getTabElement(tab))
    }
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
    const tabElements = tabListRoot.children
    for(let i = 0; i < tabElements.length; i++) {
        const tabElement = tabElements[i]
        if (tabElement.classList.contains(LIST_TAB_CLASS)) {
            // is tab item
            if (isTabSearchHit(tabElement, input)) {
                tabElement.classList.remove('d-none')
            } else {
                tabElement.classList.add('d-none')
            }
        }
    }
    selectFirstElementInTabList()
}

function isTabSearchHit(tabElement, input) {
    const titleLower = tabElement.lastElementChild.firstElementChild.innerText.toLowerCase()
    const inputLower = input.toLowerCase()
    return titleLower.includes(inputLower)
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

function onKeydown(e) {
    if (e.keyCode === KEY_CODE_ENTER) {
        e.preventDefault()
        const selectedTab = getSelectedTabInList()
        if (selectedTab === null) {
            return
        }
        const tabId = parseInt(selectedTab.getAttribute('data-tab-id'))
        focusChromeTab(tabId)
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

function focusChromeTab(tabId) {
    chrome.tabs.update(tabId, { active: true })
}

