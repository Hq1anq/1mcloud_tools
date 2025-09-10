import { displaySorted, showAllData, columnMap, reorderHeader, getSelectedRows, initTable, updateRowData, updateCounts, getStatusChip, setAllData } from './components/table.js';
import { showToast, changeToToast } from './components/toaster.js';
import { showCopyDialog } from './components/copyDialog.js';
import { showChangeIpDialog, closeChangeIpDialog } from './components/changeIpDialog.js';
import { showGetAPIKeyDialog, closeAPIKeyDialog, showViewKeyDialog, setAuthAccount } from './components/getAPIKey.js';
// DOM elements
const elements = {
    table: document.querySelector('table'),

    ipList: document.getElementById('ip-list'),
    amount: document.getElementById('amount'),
    getDataBtn: document.getElementById('getDataBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    textCopyBtn: document.getElementById('textCopyBtn'),

    noteInput: document.getElementById('noteInput'),
    replaceCheckbox: document.getElementById('replaceCheckbox'),
    changeNoteBtn: document.getElementById('changeNoteBtn'),

    reinstallInput: document.getElementById('reinstallInput'),
    reinstallType: document.getElementById('reinstallType-trigger'),
    reinstallBtn: document.getElementById('reinstallBtn'),

    changeIpInput: document.getElementById('changeIpInput'),
    changeIpType: document.getElementById('changeIpType-trigger'),
    changeIpBtn: document.getElementById('changeIpBtn'),
    confirmChangeIp : document.getElementById('confirmChangeIp'),

    copyIpBtn: document.getElementById('copyIpBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    rebootBtn: document.getElementById('rebootBtn'),

    apiKey: document.getElementById('api-key'),
    getAPIKeyBtn: document.getElementById('getAPIKeyBtn'),
    getKeyBtn: document.getElementById('getKey'),
    passwordInput: document.getElementById('passwordInput'),
    eyeIconAPIKey: document.getElementById('eyeIconAPIKey')
}

// Initialize
async function init() {
    bindEvents();
    initTable('proxyManager');

    reorderHeader();

    const apiKey = localStorage.getItem("apiKey");

    if (apiKey) {
        const res = await fetch('/get-text-en', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: apiKey })
        });

        const data = await res.json();
        elements.apiKey.value = data.textEn;
    } else elements.apiKey.value = '';
}

// Bind event listeners
function bindEvents() {
    elements.textCopyBtn.addEventListener('click', () => {
        const textToCopy = elements.ipList.value
            .split('\n')
            .map(ip => ip.trim())
            .filter(ip => ip.length > 0)
            .join('\n');
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showToast('Copied clipboard!', 'success');

                // Save original content
                const originalHTML = elements.textCopyBtn.innerHTML;

                // Smooth transition by adding a class
                elements.textCopyBtn.classList.add('float-out');

                setTimeout(() => {
                    elements.textCopyBtn.innerHTML = 
                    `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
                    </svg>Copied`;
                    elements.textCopyBtn.classList.remove('float-out');
                    elements.textCopyBtn.classList.add('float-in');
                }, 300);

                // Revert back after 2 seconds
                setTimeout(() => {
                    elements.textCopyBtn.classList.add('float-out');
                    setTimeout(() => {
                        elements.textCopyBtn.innerHTML = originalHTML;
                        elements.textCopyBtn.classList.remove('float-out');
                        elements.textCopyBtn.classList.add('float-in');
                    }, 300);
                }, 1000);
            })
            .catch(err => {
                showToast('Fail to copy!', 'error');
                console.error('Failed to copy:', err);
            });
    })

    elements.copyIpBtn.addEventListener('click', copyIp);
    elements.shuffleBtn.addEventListener('click', shuffleListIp);
    elements.amount.addEventListener('keydown', event => {
        if (event.key === 'Enter') getData();
    });
    elements.getDataBtn.addEventListener('click', getData);
    elements.changeNoteBtn.addEventListener('click', changeNote);
    elements.reinstallBtn.addEventListener('click', reinstall);
    elements.pauseBtn.addEventListener('click', pause);
    elements.rebootBtn.addEventListener('click', reboot);

    elements.changeIpBtn.addEventListener('click', () => {
        const proxyType = elements.changeIpType.textContent.trim();
        showChangeIpDialog(proxyType);
    });
    elements.confirmChangeIp.addEventListener('click', changeIp);

    elements.getAPIKeyBtn.addEventListener('click', showGetAPIKeyDialog);
    elements.getKeyBtn.addEventListener('click', getAPIKey);
    elements.passwordInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') getAPIKey();
    });
    elements.eyeIconAPIKey.addEventListener('click', () => {
        showViewKeyDialog(elements.apiKey, localStorage.getItem("apiKey"), elements.eyeIconAPIKey)
    });
}

function copyIp() {
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        showToast('No IP to copy', 'warning');
        return;
    }
    const ipList = selectedRows
        .map(row => row.cells[columnMap.ip_port]?.textContent.split(':')[0].trim())
        .filter(Boolean) // remove null/undefined
        .join('\n'); // multi-line string

    navigator.clipboard.writeText(ipList)
        .then(() => {
            showToast('Copied IP list to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            showCopyDialog('List IP', ipList);
        });
}

function shuffleListIp() {
    let allLines = [];
    const rawBlocks = elements.ipList.value.split(/\n\s*\n/);
    if (rawBlocks.length === 2) {
        const block1 = rawBlocks[0].split('\n').map(ip => ip.trim()).filter(Boolean).map(ip => ({ ip, block: 1 }));
        const block2 = rawBlocks[1].split('\n').map(ip => ip.trim()).filter(Boolean).map(ip => ({ ip: '  ' + ip, block: 2 }));
        allLines = [...block1, ...block2];
    } else {
        allLines = rawBlocks[0]
            .split('\n')
            .filter(ip => ip.length > 0)
            .map(ip => ({ ip, block: 1 }));
    }

    shuffleArray(allLines);

    elements.ipList.value = allLines.map(line => line.ip).join('\n');
}

// Fisher-Yates shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function getAPIKey() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();

    if (!email || !password) {
        showToast('Please enter both email and password', 'warning');
        return;
    }

    closeAPIKeyDialog();

    showToast('Getting API Key...', 'loading');

    try {
        const response = await fetch('/get-api-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            elements.apiKey.value = result.apiKey;
            const res = await fetch('/get-text-en', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: result.apiKey })
            });
            const data = await res.json();
            const apiKeyEn = data.textEn;
            localStorage.setItem("apiKey", apiKeyEn);
            setAuthAccount(email, password);
            changeToToast('Get API Key DONE!', 'success');
        } else {
            console.log(`❌ Error ${response.status}: ${result.error}`);
            changeToToast('Fail to get API Key', 'error');
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

// Feature: Get Servers by IPs
async function getData() {
    showToast("Getting data...", 'loading');
    const ipString = elements.ipList.value
        .split('\n')
        .map(line => extractIP(line))
        .filter(ip => ip != 0)
        .join(',');
    const apiKeyString = elements.apiKey.value.trim();
    const amountString = elements.amount.value.trim();

    try {
        const response = await fetch('/getData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ips: ipString, amount: +amountString, apiKey: apiKeyString })
        });

        if (response.ok && response.status === 200) {
            const result = await response.json();
            const data = result.data;
            if (data.length > 0)
                if (!ipString) {
                    setAllData(data);
                    showAllData();
                    localStorage.setItem("allData", JSON.stringify(data));
                } else {
                    displaySorted(data);
                }
            changeToToast('Get Data DONE!', 'success');
        } else {
            console.log(`❌ Error: ${response.status}`);
            switch (response.status) {
                case 401:
                    changeToToast('Wrong API KEY!', 'error');
                    break;
                case 500:
                    changeToToast('Fail to get data, try again!', 'error');
                    break;
                default:
                    changeToToast(`❌ Error: ${response.status}`, 'error');
                    break;
            }
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

async function changeIp() {
    const selectedRows = getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
        showToast('Select at least one row to CHANGE IP', 'info');
        return;
    }

    closeChangeIpDialog();

    if (rowCount > 1)
        showToast(`Changing IP 1/${rowCount}`, 'loading');
    else
        showToast(`Changing IP...`, 'loading');

    const proxyLines = []; // collect proxies here
    const apiKeyString = elements.apiKey.value.trim();
    const proxyType = elements.changeIpType.textContent.trim() === 'SOCKS5' ? 'proxy_sock_5' : 'proxy_https';
    const customInfo = elements.changeIpInput.value.trim();

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rowCount; i++) {
        const row = selectedRows[i];
        const cells = row.cells;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const ipPort = cells[columnMap.ip_port].innerText.trim();
        const ip = ipPort.split(':')[0]; // take only IP part

        if (i > 0) changeToToast(`Changing IP ${i + 1}/${rowCount}`, 'loading', true);

        try {
            const response = await fetch('/proxy/change-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ip: ip,
                    custom_info: customInfo,
                    apiKey: apiKeyString,
                    type: proxyType
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const proxyString = data.proxyInfo.join(":");
                console.log(`✅ IP changed for ${ip}:`, proxyString);
                proxyLines.push(proxyString);
                updateRowContent(row, data.proxyInfo, 'changeIp');
                successCount++;
            } else {
                failCount++;
                if (response.status === 401) {
                    changeToToast('Wrong API Key!', 'error');
                    return;
                }
                console.error(`❌ Failed to CHANGE IP for ${ip}:`, data.error);
                row.classList.add('bg-error-cell');
                if (rowCount === 1) {
                    changeToToast(`Fail to CHANGE IP ${ip}`, 'error');
                    return;
                };
                showToast(`Fail to CHANGE IP ${ip}`, 'error');
            }
        } catch (err) {
            failCount++;
            console.error(`❌ Error CHANGE IP for ${ip}:`, err);
            row.classList.add('bg-error-cell');
            if (rowCount === 1) {
                changeToToast(`Fail to CHANGE IP ${ip}`, 'error');
                return;
            };
            showToast(`Fail to CHANGE IP ${ip}`, 'error');
        }

        // Delay only between rows, not after the last one
        if (rowCount > 1 && i < rowCount - 1) {
            await delay(2000);
        }
    }

    // Show appropriate toast message based on results
    if (failCount === 0)
        changeToToast(`IP CHANGE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>`, 'success');
    else if (successCount === 0)
        changeToToast(`IP CHANGE failed for <span class="text-text-toast-error">${failCount}</span> servers`, 'error');
    else
        changeToToast(`IP CHANGE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>, <span class="text-text-toast-error">${failCount} failed</span>`, 'warning');

    updateCounts();

    // ✅ Copy to clipboard if there are any successful proxies
    if (proxyLines.length > 0) {
        await delay(1000);
        const textToCopy = proxyLines.join('\n');
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('Proxy list copied to clipboard!', 'success');
        } catch (err) {
            console.error('❌ Failed to copy to clipboard:', err);
            showCopyDialog('Ip changed', textToCopy);
        }
    }
}

async function reinstall() {
    const selectedRows = getSelectedRows();
    const rowCount = selectedRows.length;

    if (rowCount === 0) {
        showToast('Select at least one row to REINSTALL', 'info');
        return;
    }

    if (rowCount > 1)
        showToast(`Reinstalling 1/${rowCount}`, 'loading');
    else
        showToast(`Reinstalling...`, 'loading');

    const proxyLines = []; // collect proxies here
    const apiKeyString = elements.apiKey.value.trim();
    const proxyType = elements.reinstallType.textContent.trim() === 'SOCKS5' ? 'proxy_sock_5' : 'proxy_https';
    const customInfo = elements.reinstallInput.value.trim();

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rowCount; i++) {
        const row = selectedRows[i];
        const cells = row.cells;
        if (cells.length < 2) continue;

        const sid = cells[columnMap.sid].innerText.trim();

        if (i > 0) changeToToast(`Reinstalling ${i + 1}/${rowCount}`, 'loading', true);

        try {
            const response = await fetch('/proxy/reinstall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sid: sid,
                    custom_info: customInfo,
                    apiKey: apiKeyString,
                    type: proxyType
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const proxyString = data.proxyInfo.join(":");
                console.log(`✅ REINSTALL for sid ${sid}:`, proxyString);
                proxyLines.push(proxyString);
                updateRowContent(row, data.proxyInfo, 'reinstall');
                successCount++;
            } else {
                failCount++;
                if (response.status === 401) {
                    changeToToast('Wrong API Key!', 'error');
                    return;
                }
                console.error(`❌ Failed to REINSTALL for sid ${sid}:`, data.error);
                row.classList.add('bg-error-cell');
                if (rowCount === 1) {
                    changeToToast(`Fail to REINSTALL sid ${sid}`, 'error');
                    return;
                };
                showToast(`Fail to REINSTALL sid ${sid}`, 'error');
            }
        } catch (err) {
            failCount++;
            console.error(`❌ Error REINSTALL for sid ${sid}:`, err);
            row.classList.add('bg-error-cell');
            if (rowCount === 1) {
                changeToToast(`Fail to REINSTALL sid ${sid}`, 'error');
                return;
            };
            showToast(`Fail to REINSTALL sid ${sid}`, 'error');
        }

        if (rowCount > 1 && i < rowCount - 1) {
            await delay(2000);
        }
    }

    // Show appropriate toast message based on results
    if (failCount === 0)
        changeToToast(`REINSTALL completed <br>
            <span class="text-text-toast-success">${successCount} success</span>`, 'success');
    else if (successCount === 0)
        changeToToast(`REINSTALL failed for <span class="text-text-toast-error">${failCount}</span> servers`, 'error');
    else
        changeToToast(`REINSTALL completed <br>
            <span class="text-text-toast-success">${successCount} success</span>, <span class="text-text-toast-error">${failCount} failed</span>`, 'warning');

    updateCounts();

    // ✅ Copy to clipboard if there are any successful proxies
    if (proxyLines.length > 0) {
        await delay(1000);
        const textToCopy = proxyLines.join('\n');
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast('Proxy list copied to clipboard!', 'success');
        } catch (err) {
            console.log('❌ Failed to copy to clipboard:', err);
            showCopyDialog('Ip Reinstalled', textToCopy);
        }
    }
}

async function pause() {
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        showToast('Select at least one row to PAUSE', 'info');
        return;
    }

    showToast("Pausing...", 'loading');

    const sids = selectedRows
        .map(row => row.cells[columnMap.sid].innerText.trim())
        .join(',');
    const apiKeyString = elements.apiKey.value.trim();

    try {
        const response = await fetch('/proxy/pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sids: sids, apiKey: apiKeyString })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            // Handle successful and failed pause separately
            const successIds = data.result.success;
            const errorIds = Object.keys(data.result.error);

            selectedRows.forEach(row => {
                const sid = row.cells[columnMap.sid].innerText.trim();
                if (successIds.includes(Number(sid))) {
                    updateRowContent(row, '', 'pause');
                    row.classList.add('bg-success-cell');
                } else if (errorIds.includes(sid)) {
                    showToast(`Fail to PAUSE sid ${sid}`, 'error');
                    row.classList.add('bg-error-cell');
                    console.error(`❌ Failed to PAUSE for sid ${sid}:`, data.result.error[sid]);
                }
            });

            // Show appropriate toast message
            if (errorIds.length === 0)
                changeToToast(`PAUSE completed ${successIds.length} success`, 'success');
            else if (successIds.length === 0)
                changeToToast(`PAUSE failed for <span class="text-text-toast-error">${errorIds.length}</span> servers`, 'error');
            else
                changeToToast(`PAUSE completed: ${successIds.length} success, ${errorIds.length} failed`, 'warning');
        } else {
            if (response.status === 401) {
                changeToToast('Wrong API Key!', 'error');
                return;
            }
            changeToToast(`Fail to PAUSE`, 'error');
            console.error(`❌ Failed to PAUSE for sid ${sid}:`, data.error);
        }
    } catch (err) {
        changeToToast('Fail to PAUSE', 'error');
        console.error(`❌ Error PAUSE for sids ${sids}:`, err);
    }

    updateCounts();
}

async function reboot() {
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        showToast('Select at least one row to REBOOT', 'info');
        return;
    }

    showToast("REBOOT...", 'loading');

    const sids = selectedRows
        .map(row => row.cells[columnMap.sid].innerText.trim())
        .join(',');
    const apiKeyString = elements.apiKey.value.trim();

    try {
        const response = await fetch('/proxy/reboot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sids: sids, apiKey: apiKeyString })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Handle successful and failed reboots separately
            const successIds = data.result.success;
            const errorIds = Object.keys(data.result.error);

            selectedRows.forEach(row => {
                const sid = row.cells[columnMap.sid].innerText.trim();
                if (successIds.includes(Number(sid))) {
                    updateRowContent(row, '', 'reboot');
                    row.classList.add('bg-success-cell');
                } else if (errorIds.includes(sid)) {
                    showToast(`Fail to REBOOT sid: ${sid}`, 'error');
                    row.classList.add('bg-error-cell');
                    console.error(`❌ Failed to REBOOT for sid ${sid}:`, data.result.error[sid]);
                }
            });

            // Show appropriate toast message
            if (errorIds.length === 0)
                changeToToast(`Reboot completed <br>
                    <span class="text-text-toast-success">${successIds.length} success</span>`, 'success');
            else if (successIds.length === 0)
                changeToToast(`Reboot failed for <span class="text-text-toast-error">${errorIds.length}</span> servers`, 'error');
            else
                changeToToast(`Reboot completed <br>
                    <span class="text-text-toast-success">${successIds.length} success</span>, <span class="text-text-toast-error">${errorIds.length} failed</span>`, 'warning');
        } else {
            if (response.status === 401) {
                changeToToast('Wrong API Key!', 'error');
                return;
            }
            changeToToast(`Failed to REBOOT: ${data.error}`, 'error');
            console.error(`❌ Failed to REBOOT:`, data.error);
        }
    } catch (err) {
        changeToToast('Fail to REBOOT', 'error');
        console.error(`❌ Error REBOOT for sids ${sids}:`, err);
    }

    updateCounts();
}

async function changeNote() {
    const noteInput = elements.noteInput.value;
    const isReplace = elements.replaceCheckbox.checked;
    const apiKeyString = elements.apiKey.value.trim();

    const selectedRows = getSelectedRows();
    const rowCount = selectedRows.length;
    if (rowCount === 0) {
        showToast('Select at least one row to CHANGE NOTE', 'info');
        return;
    }

    if (rowCount > 1)
        showToast(`Changing Note 1/${rowCount}`, 'loading');
    else
        showToast(`Changing Note...`, 'loading');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rowCount; i++) {
        const row = selectedRows[i];
        const cells = row.cells;
        let newNote;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const sid = cells[columnMap.sid].innerText.trim();
        const oldNote = cells[columnMap.note].innerText.trim();

        if (isReplace)
            newNote = noteInput;
        else {
            const firstSpaceIndex = oldNote.indexOf(' ');
            const suffix = oldNote.slice(firstSpaceIndex + 1);
            newNote = noteInput + suffix;
        }

        if (i > 0) changeToToast(`Changing Note ${i + 1}/${rowCount}`, 'loading', true);

        try {
            const response = await fetch('/proxy/change-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid: sid, newNote: newNote, apiKey: apiKeyString })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                successCount++;
                console.log(`✅ CHANGE NOTE for ${sid}`);
                updateRowContent(row, newNote, 'changeNote');
            } else {
                failCount++;
                if (response.status === 401) {
                    changeToToast('Wrong API Key!', 'error');
                    return;
                }
                console.error(`❌ Failed to CHANGE NOTE for sid ${sid}:`, data.error);
                row.classList.add('bg-error-cell');
                if (rowCount === 1) {
                    changeToToast(`Fail to CHANGE NOTE for ${sid}`, 'error');
                    return;
                };
                showToast(`Failed to CHANGE NOTE for sid ${sid}`, 'error');
            }
        } catch (err) {
            failCount++;
            console.error(`❌ Error CHANGE NOTE for sid ${sid}:`, err);
            row.classList.add('bg-error-cell');
            if (rowCount === 1) {
                changeToToast(`Fail to CHANGE NOTE for sid ${sid}`, 'error');
                return;
            }
            showToast(`Failed to CHANGE NOTE for sid ${sid}`, 'error');
        }

        if (rowCount > 1 && i < rowCount - 1) {
            await delay(1000);
        }
    }

    // Show appropriate toast message based on results
    if (failCount === 0)
        changeToToast(`CHANGE NOTE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>`, 'success');
    else if (successCount === 0)
        changeToToast(`CHANGE NOTE failed for <span class="text-text-toast-error">${failCount}</span> servers`, 'error');
    else
        changeToToast(`CHANGE NOTE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>, <span class="text-text-toast-error">${failCount} failed</span>`, 'warning');

    updateCounts();
}

function updateRowContent(row, text, action) {
    const cells = row.children;
    const id = row.dataset.id;
    const checkbox = cells[columnMap.checkbox].querySelector('input');
    row.classList.add('bg-success-cell');
    if (action === 'pause') {
        cells[columnMap.status].innerHTML = getStatusChip('Paused');
        updateRowData(id, { status: 'Paused' });
        checkbox.checked = false;
        row.classList.remove('selected-row');
        return;
    }
    if (action === 'reboot') {
        cells[columnMap.status].innerHTML = getStatusChip('Running');
        updateRowData(id, { status: 'Running' });
        return;
    }
    if (action === 'changeNote') {
        const newNote = text;
        cells[columnMap.note].innerText = newNote;
        updateRowData(id, { note: newNote });
        checkbox.checked = false;
        row.classList.remove('selected-row');
        return;
    }
    const newProxy = text;

    // Update ip:port
    cells[columnMap.ip_port].innerText = `${newProxy[0]}:${newProxy[1]}`;

    // Update status to 'Running'
    cells[columnMap.status].innerHTML = getStatusChip('Running');

    // Update 'ip_changed' count if it's changeIp
    if (action === 'changeIp') {
        const changeIpType = elements.changeIpType.textContent.trim() === 'SOCKS5' ? 'SOCKS5 Proxy' : 'HTTPS Proxy'
        cells[columnMap.type].innerText = changeIpType;

        const changedCell = cells[columnMap.ip_changed];
        const currentValue = parseInt(changedCell.innerText.trim()) || 0;
        changedCell.innerText = currentValue + 1;

        updateRowData(id, {
            ip_port: `${newProxy[0]}:${newProxy[1]}`,
            type: changeIpType,
            ip_changed: currentValue + 1,
            status: 'Running'
        });
    } else if (action === 'reinstall') {
        const reinstallType = elements.reinstallType.textContent.trim() === 'SOCKS5' ? 'SOCKS5 Proxy' : 'HTTPS Proxy'
        cells[columnMap.type].innerText = reinstallType;
        updateRowData(id, {
            type: reinstallType,
            status: 'Running'
        });
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function extractIP(str) {
    // Looser regex: grab four groups of digits separated by dots
    const ipv4Candidate = str.match(/\d+\.\d+\.\d+\.\d+/);
    if (!ipv4Candidate) return null;

    const ip = ipv4Candidate[0];

    // Validate each octet (0–255)
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    for (let part of parts) {
        const num = Number(part);
        if (num < 0 || num > 255) return null;
    }

    return ip;
}

init();