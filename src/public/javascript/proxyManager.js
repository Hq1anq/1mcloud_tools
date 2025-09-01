import { setData, columnMap, reorderHeader, getSelectedRows, initTable, updateRowData, updateCounts, getStatusChip } from '/javascript/components/table.js';
import { showToast, changeToToast } from '/javascript/components/toaster.js';
import { showCopyDialog } from '/javascript/components/copyDialog.js';
import { showChangeIpDialog, closeChangeIpDialog } from '/javascript/components/ChangeIpDialog.js';
// DOM elements
const elements = {
    table: document.querySelector('table'),

    ipList: document.getElementById('ip-list'),
    apiKey: document.getElementById('api-key'),
    amount: document.getElementById('amount'),
    getDataBtn: document.getElementById('getDataBtn'),
    deleteBtn: document.getElementById('deleteBtn'),

    noteInput: document.getElementById('noteInput'),
    changeNoteBtn: document.getElementById('changeNoteBtn'),

    reinstallInput: document.getElementById('reinstallInput'),
    reinstallType: document.getElementById('reinstallType-trigger'),
    reinstallBtn: document.getElementById('reinstallBtn'),

    changeIpType: document.getElementById('changeIpType-trigger'),
    changeIpBtn: document.getElementById('changeIpBtn'),
    confirmChangeIp : document.getElementById('confirmChangeIp'),

    copyIpBtn: document.getElementById('copyIpBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    rebootBtn: document.getElementById('rebootBtn'),
}

// Initialize
function init() {
    bindEvents();
    initTable('proxyManager');

    reorderHeader();
}

// Bind event listeners
function bindEvents() {
    // elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.copyIpBtn.addEventListener('click', copyIp);
    elements.deleteBtn.addEventListener('click', deleteIP);
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

// Feature: Get Servers by IPs
async function getData() {
    showToast("Getting data...", 'loading');
    const ipString = elements.ipList.value
        .split('\n')
        .map(ip => ip.split(':')[0].trim())
        .filter(ip => ip.length > 0)
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
            setData(result.data || []); // delegate everything to table.js
            changeToToast('Get Data DONE!', 'success');
            // saveToLocal(allData);
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
    if (selectedRows.length === 0) {
        showToast('Select at least one row to CHANGE IP.', 'info');
        return;
    }

    closeChangeIpDialog();
    showToast('Change Ip...', 'loading');

    const proxyLines = []; // collect proxies here
    const apiKeyString = elements.apiKey.value.trim();
    const proxyType = elements.changeIpType.textContent.trim() === 'SOCKS5' ? 'proxy_sock_5' : 'proxy_https';

    let successCount = 0;
    let failCount = 0;

    for (const row of selectedRows) {
        const cells = row.cells;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const ipPort = cells[columnMap.ip_port].innerText.trim();
        const ip = ipPort.split(':')[0]; // take only IP part

        try {
            const response = await fetch('/proxy/change-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: ip, apiKey: apiKeyString, type: proxyType })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const proxyString = data.proxyInfo.join(":");
                console.log(`✅ IP changed for ${ip}:`, proxyString);
                proxyLines.push(proxyString);
                updateRowContent(row, data.proxyInfo, 'changeIp');
                successCount++;
            } else {
                showToast(`Fail to CHANGE IP: ${ip}`, 'error');
                console.error(`❌ Failed to CHANGE IP for ${ip}:`, data.error);
                row.classList.add('bg-error-cell');
                failCount++;
            }
        } catch (err) {
            showToast(`Fail to CHANGE IP: ${ip}`, 'error');
            console.error(`❌ Error CHANGE IP for ${ip}:`, err);
            row.classList.add('bg-error-cell');
            failCount++;
        }

        await delay(2000);
    }

    // Show appropriate toast message based on results
    if (failCount === 0) {
        changeToToast('IP CHANGE completed successfully', 'success');
    } else if (successCount === 0) {
        changeToToast('IP CHANGE failed for all servers', 'error');
    } else {
        changeToToast(`IP CHANGE completed: ${successCount} success, ${failCount} failed`, 'warning');
    }

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
    if (selectedRows.length === 0) {
        showToast('Select at least one row to REINSTALL', 'info');
        return;
    }

    showToast("Reinstalling...", 'loading');

    const proxyLines = []; // collect proxies here
    const apiKeyString = elements.apiKey.value.trim();
    const proxyType = elements.reinstallType.textContent.trim() === 'SOCKS5' ? 'proxy_sock_5' : 'proxy_https';
    const customInfo = elements.reinstallInput.value.trim();

    let successCount = 0;
    let failCount = 0;

    for (const row of selectedRows) {
        const cells = row.cells;
        if (cells.length < 2) continue;

        const sid = cells[columnMap.sid].innerText.trim();

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
                showToast(`Fail to REINSTALL sid: ${sid}`, 'error');
                console.error(`❌ Failed to REINSTALL for sid ${sid}:`, data.error);
                row.classList.add('bg-error-cell');
                failCount++;
            }
        } catch (err) {
            showToast(`Fail to REINSTALL sid: ${sid}`, 'error');
            console.error(`❌ Error REINSTALL for sid ${sid}:`, err);
            row.classList.add('bg-error-cell');
            failCount++;
        }

        await delay(2000);
    }

    // Show appropriate toast message based on results
    if (failCount === 0) {
        changeToToast('REINSTALL completed successfully', 'success');
    } else if (successCount === 0) {
        changeToToast('REINSTALL failed for all servers', 'error');
    } else {
        changeToToast(`REINSTALL completed: ${successCount} success, ${failCount} failed`, 'warning');
    }

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
                    showToast(`Fail to PAUSE sid: ${sid}`, 'error');
                    row.classList.add('bg-error-cell');
                    console.error(`❌ Failed to PAUSE for sid ${sid}:`, data.result.error[sid]);
                }
            });

            // Show appropriate toast message
            if (errorIds.length === 0)
                changeToToast(`PAUSE successful for all servers`, 'success');
            else if (successIds.length === 0)
                changeToToast(`PAUSE failed for all servers`, 'error');
            else
                changeToToast(`PAUSE completed with ${successIds.length} success, ${errorIds.length} failed`, 'warning');
        } else {
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
                changeToToast(`Reboot successful for all servers`, 'success');
            else if (successIds.length === 0)
                changeToToast(`Reboot failed for all servers`, 'error');
            else
                changeToToast(`Reboot completed with ${successIds.length} success, ${errorIds.length} failed`, 'warning');
        } else {
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
    const apiKeyString = elements.apiKey.value.trim();

    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        showToast('Select at least one row to CHANGE NOTE', 'info');
        return;
    }

    showToast("Changing note...", 'loading');

    for (const row of selectedRows) {
        const cells = row.cells;
        if (cells.length < 2) continue;

        const sid = cells[columnMap.sid].innerText.trim();

        try {
            const response = await fetch('/proxy/change-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid: sid, newNote: noteInput, apiKey: apiKeyString })
            });

            const data = await response.json();
            if (response.ok && data.success)
                updateRowContent(row, noteInput, 'changeNote');
            else {
                showToast(`Failed to changeNote for sid ${sid}`, 'error');
                console.error(`❌ Failed to CHANGE NOTE for sid ${sid}:`, data.error);
                row.classList.add('bg-error-cell');
            }
        } catch (err) {
            showToast(`Failed to changeNote for sid ${sid}`, 'error');
            console.error(`❌ Error CHANGE NOTE for sid ${sid}:`, err);
            row.classList.add('bg-error-cell');
        }

        await delay(1000);
    }

    updateCounts();
    changeToToast(`Change note DONE`, 'success');
}

function updateRowContent(row, text, action) {
    const cells = row.children;
    const id = row.dataset.id;
    const checkbox = cells[columnMap.checkbox].firstElementChild;
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

    // Update 'changed' count if it's changeIp
    if (action === 'changeIp') {
        const changeIpType = elements.changeIpType.textContent.trim() === 'SOCKS5' ? 'SOCKS5 Proxy' : 'HTTPS Proxy'
        cells[columnMap.type].innerText = changeIpType;

        const changedCell = cells[columnMap.changed];
        const currentValue = parseInt(changedCell.innerText.trim()) || 0;
        changedCell.innerText = currentValue + 1;

        updateRowData(id, {
            ip_port: `${newProxy[0]}:${newProxy[1]}`,
            type: changeIpType,
            changed: currentValue + 1,
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

function deleteIP() {
    elements.ipList.value = '';
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

init();