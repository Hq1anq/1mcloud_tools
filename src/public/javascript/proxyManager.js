import { setData, initTable, updateRowData, updateCounts, getSelectedRows, getStatusChip } from '/javascript/components/table.js';
import { showToast, changeToToast } from '/javascript/components/toaster.js';
import { showCopyDialog } from '/javascript/components/copyDialog.js';
// DOM elements
const elements = {
    ipList: document.getElementById('ip-list'),
    apiKey: document.getElementById('api-key'),
    amount: document.getElementById('amount'),
    getDataBtn: document.getElementById('getDataBtn'),
    deleteBtn: document.getElementById('deleteBtn'),

    noteInput: document.getElementById('noteInput'),
    changeNoteBtn: document.getElementById('changeNoteBtn'),

    reinstallInput: document.getElementById('reinstallInput'),
    reinstallBtn: document.getElementById('reinstallBtn'),

    changeIpBtn: document.getElementById('changeIpBtn'),
    copyIpBtn: document.getElementById('copyIpBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
}

// Initialize
function init() {
    setData([
        {"sid": 583192, "ip_port": "103.16.161.159:38927", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583191, "ip_port": "157.66.195.189:35605", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Paused", "note": "0208 tung2"},
        {"sid": 583190, "ip_port": "160.250.62.145:37555", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Stopped", "note": "0208 tung2"},
        {"sid": 583189, "ip_port": "103.184.96.105:18460", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Unknowed", "note": "0208 tung2"},
        {"sid": 583188, "ip_port": "157.66.163.148:54702", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583187, "ip_port": "103.16.214.134:55464", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583186, "ip_port": "103.189.202.6:47104", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583185, "ip_port": "160.250.63.51:24672", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583184, "ip_port": "103.16.225.156:46807", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        
        {"sid": 583192, "ip_port": "103.16.161.159:38927", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583191, "ip_port": "157.66.195.189:35605", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Paused", "note": "0208 tung2"},
        {"sid": 583190, "ip_port": "160.250.62.145:37555", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Stopped", "note": "0208 tung2"},
        {"sid": 583189, "ip_port": "103.184.96.105:18460", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Unknowed", "note": "0208 tung2"},
        {"sid": 583188, "ip_port": "157.66.163.148:54702", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583187, "ip_port": "103.16.214.134:55464", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583186, "ip_port": "103.189.202.6:47104", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583185, "ip_port": "160.250.63.51:24672", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583184, "ip_port": "103.16.225.156:46807", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},

        {"sid": 583192, "ip_port": "103.16.161.159:38927", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583191, "ip_port": "157.66.195.189:35605", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Paused", "note": "0208 tung2"},
        {"sid": 583190, "ip_port": "160.250.62.145:37555", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Stopped", "note": "0208 tung2"},
        {"sid": 583189, "ip_port": "103.184.96.105:18460", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Unknowed", "note": "0208 tung2"},
        {"sid": 583188, "ip_port": "157.66.163.148:54702", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583187, "ip_port": "103.16.214.134:55464", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583186, "ip_port": "103.189.202.6:47104", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583185, "ip_port": "160.250.63.51:24672", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583184, "ip_port": "103.16.225.156:46807", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        
        {"sid": 583183, "ip_port": "103.190.36.207:21095", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"}
    ]);
    bindEvents();
    initTable('proxyManager');
}

// Bind event listeners
function bindEvents() {
    // elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.copyIpBtn.addEventListener('click', copyIp);
    elements.deleteBtn.addEventListener('click', deleteIP);
    elements.getDataBtn.addEventListener('click', getData);
    elements.changeNoteBtn.addEventListener('click', changeNote);
    elements.reinstallBtn.addEventListener('click', reinstall);
    elements.pauseBtn.addEventListener('click', pause);
    elements.changeIpBtn.addEventListener('click', changeIp);
}

function copyIp() {
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        showToast('No IP to copy', 'warning');
        return;
    }
    const ipList = selectedRows
        .map(row => row.cells[2]?.textContent.split(':')[0].trim())
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
            body: JSON.stringify({ ipString, amountString, apiKeyString })
        });

        const result = await response.json();

        if (response.ok) {
            setData(result.data || []); // delegate everything to table.js
            changeToToast('Get Data DONE!', 'success');
            // saveToLocal(allData);
        } else {
            console.log(`❌ Error: ${result.error}`);
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

    showToast('Change Ip...', 'loading');

    const proxyLines = []; // collect proxies here

    for (const row of selectedRows) {
        const cells = row.cells;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const ipPort = cells[2].innerText.trim();
        const ip = ipPort.split(':')[0]; // take only IP part

        try {
            const res = await fetch('/proxy/change-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip })
            });

            const data = await res.json();
            if (res.ok && data.proxyInfo) {
                const proxyString = data.proxyInfo.join(":");
                console.log(`✅ IP changed for ${ip}:`, proxyString);

                proxyLines.push(proxyString);

                updateRowContent(row, data.proxyInfo, 'changeIp');
            } else {
                console.error(`❌ Failed to CHANGE IP for ${ip}:`, data.error);
                row.classList.add('bg-red-900/40');
            }
        } catch (err) {
            console.error(`❌ Error CHANGE IP for ${ip}:`, err);
            row.classList.add('bg-red-900/40');
        }

        await delay(2000);
    }

    changeToToast('Change Ip DONE', 'success');

    updateCounts();

    // ✅ Copy to clipboard if there are any successful proxies
    if (proxyLines.length > 0) {
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

    for (const row of selectedRows) {
        const cells = row.cells;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const sid = cells[1].innerText.trim();

        try {
            const res = await fetch('/proxy/reinstall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid: sid, custom_info: elements.reinstallInput.value.trim() })
            });

            const data = await res.json();
            if (res.ok && data.proxyInfo) {
                const proxyString = data.proxyInfo.join(":");
                console.log(`✅ REINSTALL for sid ${sid}:`, proxyString);

                proxyLines.push(proxyString);

                updateRowContent(row, data.proxyInfo, 'reinstall');
            } else {
                showToast(`Failed to REINSTALL for sid ${sid}`, 'error');
                console.error(`❌ Failed to REINSTALL for sid ${sid}:`, data.error);
                row.classList.add('bg-red-900/40');
            }
        } catch (err) {
            showToast(`Failed to REINSTALL for sid ${sid}`, 'error');
            console.error(`❌ Error REINSTALL for sid ${sid}:`, err);
            row.classList.add('bg-red-900/40');
        }

        await delay(2000);
    }

    changeToToast('Reinstall DONE', 'success');

    updateCounts();

    // ✅ Copy to clipboard if there are any successful proxies
    if (proxyLines.length > 0) {
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
        .map(row => row.cells[1].innerText.trim())
        .join(',');

    try {
        const res = await fetch('/proxy/pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sids })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            for (const row of selectedRows)
                updateRowContent(row, '', 'pause');
            changeToToast(`Pause DONE`, 'success');
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

async function changeNote() {
    const noteInput = elements.noteInput.value;

    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        showToast('Select at least one row to CHANGE NOTE', 'info');
        return;
    }

    showToast("Changing note...", 'loading');

    for (const row of selectedRows) {
        const cells = row.cells;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const sid = cells[1].innerText.trim();

        try {
            const res = await fetch('/proxy/change-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid, noteInput })
            });

            const data = await res.json();
            if (res.ok && data.success)
                updateRowContent(row, noteInput, 'changeNote');
            else {
                showToast(`Failed to changeNote for sid ${sid}`, 'error');
                console.error(`❌ Failed to CHANGE NOTE for sid ${sid}:`, data.error);
                row.classList.add('bg-red-900/40');
            }
        } catch (err) {
            showToast(`Failed to changeNote for sid ${sid}`, 'error');
            console.error(`❌ Error CHANGE NOTE for sid ${sid}:`, err);
            row.classList.add('bg-red-900/40');
        }

        await delay(1000);
    }

    updateCounts();
    changeToToast(`Change note DONE`, 'success');
}

function updateRowContent(row, text, action) {
    const cells = row.children;
    const id = row.dataset.id;
    const checkbox = cells[0].firstElementChild;
    row.classList.add('bg-green-900/40');
    if (action === 'pause') {
        cells[8].innerHTML = getStatusChip('Paused');
        updateRowData(id, { status: 'Paused' });
        checkbox.checked = false;
        row.classList.remove('selected-row');
        return;
    }
    if (action === 'changeNote') {
        const newNote = text;
        cells[9].innerText = newNote;
        updateRowData(id, { note: newNote });
        checkbox.checked = false;
        row.classList.remove('selected-row');
        return;
    }
    const newProxy = text;

    // Column indexes based on header:
    // [checkbox, 'sid', 'ip:port', 'country', 'type', 'from', 'to', 'changed', 'status', 'note']
    const ipPortIndex = 2;
    const changedIndex = 7;
    const statusIndex = 8;

    // Update ip:port
    cells[ipPortIndex].innerText = `${newProxy[0]}:${newProxy[1]}`;

    // Update status to 'Running'
    cells[statusIndex].innerHTML = getStatusChip('Running');

    // Update 'changed' count if it's changeIp
    if (action === 'changeIp') {
        const changedCell = cells[changedIndex];
        const currentValue = parseInt(changedCell.innerText.trim()) || 0;
        changedCell.innerText = currentValue + 1;

        updateRowData(id, {
            ip_port: `${newProxy[0]}:${newProxy[1]}`,
            changed: currentValue + 1,
            status: 'Running'
        });
    } else {
        updateRowData(id, {
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
