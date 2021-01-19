// HTML Elements
const tabSites = document.getElementById('tabSites');
const sitesToggle = document.getElementById('sitesToggle');
const addSiteButton = document.getElementById('addSiteButton');
const siteInput = document.getElementById('newSite');
const sitesTable = document.getElementById('sitesTable');
const sitesErrorText = document.getElementById('sitesErrorText');

const tabReddit = document.getElementById('tabReddit');
const redditToggle = document.getElementById('redditToggle');
const addRedditButton = document.getElementById('addRedditButton');
const redditInput = document.getElementById('newReddit');
const redditTable = document.getElementById('redditTable');
const redditErrorText = document.getElementById('redditErrorText');

const tabSettings = document.getElementById('tabSettings');
const settingsToggle = document.getElementById('settingsToggle');
const settingsLockedTable = document.getElementById('settingsLockedTable');
const settingsLockedDropdown = document.getElementById('settingsLockedDropdown');
const settingsLockedCount = document.getElementById('settingsLockedCount');
const settingsHiddenTable = document.getElementById('settingsHiddenTable');
const settingsHiddenDropdown = document.getElementById('settingsHiddenDropdown');
const settingsHiddenCount = document.getElementById('settingsHiddenCount');
const settingsTutorialDropdown = document.getElementById('settingsTutorialDropdown');
const settingsTutorial = document.getElementById('settingsTutorial');

let activeTab = 'Sites';

// Create an Icon Button (table)
function createIconButton(id, iconClass, text) {
    if (text == null) {
        return `<button class="btn btn-transparent btn-sm" id="${id}"><i class="${iconClass}"></i></button>`;
    } else {
        return `
        <button class="btn btn-transparent btn-sm" id="${id}">
               <span class="text-light">${text}</span>
               <i class="${iconClass}"></i>
        </button>
        `;
    }
}

// Add Input Error
function addInputError(input, errorText, value) {
    errorText.innerHTML = value;
    errorText.hidden = false;
    input.classList.add('input-error');
}

// Remove Input Error
function removeInputError(input, errorText) {
    errorText.hidden = true;
    input.classList.remove('input-error');
}

// add a site to the blocked sites
function addSite(site) {
    if (site.url === '' || site.url == null) {
        if (site.isReddit) {
            addInputError(redditInput, redditErrorText, 'Please enter a Reddit first.');
        } else {
            addInputError(siteInput, sitesErrorText, 'Please enter a site first.');
        }
        return;
    } else if (!site.isReddit && !/.*\..*/.test(site.url)) {
        addInputError(siteInput, sitesErrorText, 'Sites need to contain a Top-Level-Domain (e.g. ".com").');
        return;
    }
    chrome.runtime.sendMessage({site: site}, function (response) {
        if (response.error != null) {
            console.error(response.error);
        } else if (response.sites != null) {
            siteInput.value = '';
            setTable(response.sites.filter(s => s.isReddit === site.isReddit && !s.isHidden), site.isReddit ? redditTable : sitesTable);
        }
    });
}

// Load all blocked sites
function loadSites(table, filter = (site => true)) {
    chrome.storage.sync.get('blockedSites', function (data) {
        if (data.blockedSites != null) {
            const sites = data.blockedSites.split(',').map(site => new Site(site)).filter(filter);
            setTable(sites, table);
        } else {
            settingsLockedDropdown.disabled = true;
        }
    });
}

// Add Site Button
addSiteButton.onclick = function () {
    addSite(new Site(siteInput.value));
};

// Add Reddit Button
addRedditButton.onclick = function () {
    addSite(new Site(redditInput.value, true));
};

// hide 'Please enter a site to block first.'
siteInput.oninput = function (event) {
    if (sitesErrorText.hidden === false && event.data != null && event.data.length > 0) {
        removeInputError(siteInput, sitesErrorText);
    }
}

// hide 'Please enter a Reddit to block first.'
redditInput.oninput = function (event) {
    if (redditErrorText.hidden === false && event.data != null && event.data.length > 0) {
        removeInputError(redditInput, redditErrorText);
    }
}

// Tab toggle
function toggleTab(tab, button, tabName) {
    [tabSites, tabReddit, tabSettings].filter(t => t !== tab).forEach(t => t.hidden = true);
    [sitesToggle, redditToggle, settingsToggle].filter(t => t !== button).forEach(t => {
        t.disabled = false;
        t.classList.add('nav-button-inactive');
    });
    tab.hidden = false;
    button.disabled = true;
    button.classList.remove('nav-button-inactive');
    activeTab = tabName;
}

// Sites Tab Toggle
sitesToggle.onclick = function () {
    toggleTab(tabSites, sitesToggle, 'Sites');
    loadSites(sitesTable, (site => !site.isReddit && !site.isHidden));
};

// Reddit Tab toggle
redditToggle.onclick = function () {
    toggleTab(tabReddit, redditToggle, 'Reddit');
    loadSites(redditTable, (site => site.isReddit && !site.isHidden));
};

// Settings Tab toggle
settingsToggle.onclick = function () {
    toggleTab(tabSettings, settingsToggle, 'Settings');
    loadSites(settingsHiddenTable, (site => site.isHidden));
    loadSites(settingsLockedTable, (site => site.isLocked && !site.isHidden));
}

// Dropdown toggle
function toggleDropdown(dropdown, content, isOpen) {
    const icon = dropdown.getElementsByTagName('i')[0];
    if (isOpen) {
        icon.classList.remove('fa-caret-up');
        icon.classList.add('fa-caret-down');
        content.hidden = true;
        return false;
    } else {
        icon.classList.remove('fa-caret-down');
        icon.classList.add('fa-caret-up');
        content.hidden = false;
        return true;
    }
}

// Locked sites dropdown toggle
let settingsLockedOpen = false;
settingsLockedTable.hidden = true;
settingsLockedDropdown.onclick = function () {
    settingsLockedOpen = toggleDropdown(settingsLockedDropdown, settingsLockedTable, settingsLockedOpen);
}

// hidden sites dropdown toggle
let settingsHiddenOpen = false;
settingsHiddenTable.hidden = true;
settingsHiddenDropdown.onclick = function () {
    settingsHiddenOpen = toggleDropdown(settingsHiddenDropdown, settingsHiddenTable, settingsHiddenOpen);
}

// Tutorial dropdown toggle
let settingsTutorialOpen = false;
settingsTutorial.hidden = true;
settingsTutorialDropdown.onclick = function () {
    settingsTutorialOpen = toggleDropdown(settingsTutorialDropdown, settingsTutorial, settingsTutorialOpen);
}

// lock a site
function lock(site) {
    chrome.runtime.sendMessage({lock: site}, function (response) {
        if (response.error != null) {
            console.error(response.error);
        } else if (response.sites != null) {
            if (activeTab === 'Settings') {
                setTable(response.sites.filter(s => s.isLocked && !s.isHidden), settingsLockedTable);
            } else {
                setTable(response.sites.filter(s => s.isReddit === site.isReddit && !s.isHidden), site.isReddit ? redditTable : sitesTable);
            }
        }
    })
}

// disable a site
function disable(site) {
    chrome.runtime.sendMessage({disable: site}, function (response) {
        if (response.error != null) {
            console.error(response.error);
        } else if (response.sites != null) {
            setTable(response.sites.filter(s => s.isReddit === site.isReddit && !s.isHidden), site.isReddit ? redditTable : sitesTable);
        }
    })
}

// remove a site
function remove(site) {
    chrome.runtime.sendMessage({delete: site}, function (response) {
        if (response.error != null) {
            console.error(response.error);
        } else if (response.sites != null) {
            setTable(response.sites.filter(s => s.isReddit === site.isReddit && !s.isHidden), site.isReddit ? redditTable : sitesTable);
        }
    })
}

// hide a site
function hide(site) {
    chrome.runtime.sendMessage({hide: site}, function (response) {
        if (response.error != null) {
            console.error(response.error);
        } else if (response.sites != null) {
            if (activeTab === 'Settings') {
                setTable(response.sites.filter(s => s.isHidden), settingsHiddenTable);
                setTable(response.sites.filter(s => s.isLocked && !s.isHidden), settingsLockedTable);
            } else {
                setTable(response.sites.filter(s => s.isReddit === site.isReddit && !s.isHidden), site.isReddit ? redditTable : sitesTable);
            }
        }
    })
}

// Fill the table
function setTable(items, table) {
    // empty the table
    for (let j = table.rows.length - 1; j >= 0; j--) {
        table.deleteRow(j);
    }

    if (table === settingsLockedTable) {
        settingsLockedDropdown.disabled = items.length === 0;
        settingsLockedCount.innerHTML = items.length.toString();
    } else if (table === settingsHiddenTable) {
        settingsHiddenDropdown.disabled = items.length === 0;
        settingsHiddenCount.innerHTML = items.length.toString();
    }

    for (let i = 0; i < items.length; i++) {
        const row = table.insertRow(i);

        const contentCell = row.insertCell(0);
        contentCell.style.lineHeight = '1.6';
        const lockCell = row.insertCell(1);

        contentCell.innerHTML = items[i].url;

        // Settings Tab
        if (activeTab === 'Settings') {
            const iconCell = row.insertCell(0);
            iconCell.innerHTML = `<i class="${items[i].isReddit ? 'fab fa-reddit-alien text-white' : 'fas fa-external-link-alt text-white'}"></i>`;
            iconCell.style.lineHeight = '1.6';

            lockCell.innerHTML = createIconButton(
                'lock' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url,
                `fas ${items[i].isHidden ? 'fa-lock' : 'fa-lock-open'} text-white`
            )

            const lockButton = document.getElementById('lock' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url)
            lockButton.disabled = items[i].isHidden;
            lockButton.onclick = function () {
                lock(items[i]);
            };

            if (items[i].isHidden) {
                const hideCell = row.insertCell(2);
                hideCell.innerHTML = createIconButton(
                    'hide' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url, 'fas fa-eye text-white'
                );
                hideCell.style.width = '40px';
                document.getElementById('hide' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url).onclick = function () {
                    hide(items[i]);
                };
            }

            iconCell.style.width = '40px';
            contentCell.style.width = items[i].isHidden ? '280px' : '320px';
            lockCell.style.width = '40px';
            // not Settings Tab
        } else {
            lockCell.innerHTML = createIconButton(
                'lock' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url, 'fas fa-lock text-white'
            );

            const hideCell = row.insertCell(1);
            hideCell.innerHTML = createIconButton('hide' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url, 'fas fa-eye-slash text-white')

            if (items[i].isLocked) {
                const fill1 = row.insertCell(2);
                const fill2 = row.insertCell(2);
                contentCell.style.width = '320px';
                hideCell.style.width = '40px';
                lockCell.style.width = '40px';
                fill1.style.width = '0';
                fill2.style.width = '0';
                document.getElementById('lock' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url).disabled = true;
            } else {
                const disableCell = row.insertCell(2);
                const deleteCell = row.insertCell(3);

                disableCell.innerHTML = createIconButton('disable' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url, items[i].isDisabled ? 'fas fa-check text-primary' : 'fas fa-ban text-warning');
                deleteCell.innerHTML = createIconButton('delete' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url, 'fas fa-trash text-danger');

                contentCell.style.width = '240px';
                hideCell.style.width = '40px';
                lockCell.style.width = '40px';
                disableCell.style.width = '40px';
                deleteCell.style.width = '40px';

                document.getElementById('disable' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url).onclick = function () {
                    disable(items[i]);
                };
                document.getElementById('delete' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url).onclick = function () {
                    remove(items[i]);
                };
                document.getElementById('lock' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url).onclick = function () {
                    lock(items[i]);
                };
            }
            document.getElementById('hide' + (items[i].isReddit ? 'Reddit' : 'Sites') + items[i].url).onclick = function () {
                hide(items[i]);
            };
        }
    }
}

// Load sites at init of popup
loadSites(sitesTable, (site => !site.isReddit && !site.isHidden));

class Site {
    url;
    isLocked = false;
    isDisabled = false;
    isReddit = false;
    isHidden = false;

    constructor(url, isReddit = false) {
        this.url = url;
        this.isReddit = isReddit;
        if (this.url.startsWith('^h')) {
            this.isHidden = true;
            this.url = this.url.substr(2);
        }
        if (this.url.startsWith('^l')) {
            this.isLocked = true;
            this.url = this.url.substr(2);
        }
        if (this.url.startsWith('^d')) {
            this.isDisabled = true;
            this.url = this.url.substr(2);
        }
        if (this.url.startsWith('^r')) {
            this.isReddit = true;
            this.url = this.url.substr(2);
        }
    }
}

class Settings {
    blockedSites;
    blockedReddits;
}
