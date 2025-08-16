import { setData, initTable, updateRowData, updateCounts, getSelectedRows, getStatusChip } from '/javascript/components/table.js';
import { showToast, changeToToast } from '/javascript/components/toaster.js';
import { showCopyDialog } from '/javascript/components/copyDialog.js';
// DOM elements
const elements = {
    ipList: document.getElementById('ip-list'),
    apiKey: document.getElementById('api-key'),
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

    copyIpBtn: document.getElementById('copyIpBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    refundBtn: document.getElementById('refundBtn')
}

// Initialize
function init() {
    setData([
        {"sid": 583192, "ip_port": "103.16.161.159:38927", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583191, "ip_port": "157.66.195.189:35605", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Paused", "note": "0208 tung2"},
        {"sid": 583190, "ip_port": "160.250.62.145:37555", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Stopped", "note": "0208 tung2"},
        {"sid": 583189, "ip_port": "103.184.96.105:18460", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Unknowed", "note": "0208 tung2"},
        {"sid": 583188, "ip_port": "157.66.163.148:54702", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583187, "ip_port": "103.16.214.134:55464", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583186, "ip_port": "103.189.202.6:47104", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583185, "ip_port": "160.250.63.51:24672", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583184, "ip_port": "103.16.225.156:46807", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        
        {"sid": 583192, "ip_port": "103.16.161.159:38927", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583191, "ip_port": "157.66.195.189:35605", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Paused", "note": "0208 tung2"},
        {"sid": 583190, "ip_port": "160.250.62.145:37555", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Stopped", "note": "0208 tung2"},
        {"sid": 583189, "ip_port": "103.184.96.105:18460", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Unknowed", "note": "0208 tung2"},
        {"sid": 583188, "ip_port": "157.66.163.148:54702", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583187, "ip_port": "103.16.214.134:55464", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583186, "ip_port": "103.189.202.6:47104", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583185, "ip_port": "160.250.63.51:24672", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583184, "ip_port": "103.16.225.156:46807", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},

        {"sid": 583192, "ip_port": "103.16.161.159:38927", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583191, "ip_port": "157.66.195.189:35605", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Paused", "note": "0208 tung2"},
        {"sid": 583190, "ip_port": "160.250.62.145:37555", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Stopped", "note": "0208 tung2"},
        {"sid": 583189, "ip_port": "103.184.96.105:18460", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Unknowed", "note": "0208 tung2"},
        {"sid": 583188, "ip_port": "157.66.163.148:54702", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583187, "ip_port": "103.16.214.134:55464", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583186, "ip_port": "103.189.202.6:47104", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583185, "ip_port": "160.250.63.51:24672", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583184, "ip_port": "103.16.225.156:46807", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"},
        
        {"sid": 583183, "ip_port": "103.190.36.207:21095", "country": "VN", "type": "HTTPS Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed": 0,"status": "Running", "note": "0208 tung2"}
    ]);
    bindEvents();
    initTable('proxyManager');
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
                }, 2000);
            })
            .catch(err => {
                showToast('Fail to copy!', 'error');
                console.error('Failed to copy:', err);
            });
    })
    // elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.copyIpBtn.addEventListener('click', copyIp);
    elements.shuffleBtn.addEventListener('click', shuffleListIp);
    elements.amount.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            getData();
        }
    });
    elements.getDataBtn.addEventListener('click', getData);
    elements.changeNoteBtn.addEventListener('click', changeNote);
    elements.reinstallBtn.addEventListener('click', reinstall);
    elements.pauseBtn.addEventListener('click', pause);
    elements.changeIpBtn.addEventListener('click', changeIp);
    // elements.pauseBtn.addEventListener('click', testToast);
    // elements.refundBtn.addEventListener('click', test);
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

function shuffleListIp() {
    let allLines = [];
    const rawBlocks = elements.ipList.value.trim().split(/\n\s*\n/);
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
    const apiKeyString = elements.apiKey.value.trim();
    const proxyType = elements.changeIpType.textContent.trim() === 'SOCKS5' ? 'proxy_sock_5' : 'proxy_https';

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
                body: JSON.stringify({ ip: ip, custom_info: elements.changeIpInput.value.trim(), apiKey: apiKeyString, type: proxyType })
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
    const apiKeyString = elements.apiKey.value.trim();
    const proxyType = elements.reinstallType.textContent.trim() === 'SOCKS5' ? 'proxy_sock_5' : 'proxy_https';

    for (const row of selectedRows) {
        const cells = row.cells;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const sid = cells[1].innerText.trim();

        try {
            const res = await fetch('/proxy/reinstall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid: sid, custom_info: elements.reinstallInput.value.trim(), apiKey: apiKeyString, type: proxyType })
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
    const apiKeyString = elements.apiKey.value.trim();

    try {
        const res = await fetch('/proxy/pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sids: sids, apiKey: apiKeyString })
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
    const isReplace = elements.replaceCheckbox.checked;
    const apiKeyString = elements.apiKey.value.trim();

    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        showToast('Select at least one row to CHANGE NOTE', 'info');
        return;
    }

    showToast("Changing note...", 'loading');

    for (const row of selectedRows) {
        let newNote;
        const cells = row.cells;
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const sid = cells[1].innerText.trim();
        // const oldNote = cells[9].innerText.trim();
        const oldNote = cells[9].innerText.trim();

        if (isReplace) {
            newNote = noteInput;
        } else {
            const firstSpaceIndex = oldNote.indexOf(' ');
            const suffix = oldNote.slice(firstSpaceIndex + 1);
            newNote = noteInput + suffix;
        }

        try {
            const res = await fetch('/proxy/change-note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid: sid, newNote: newNote, apiKey: apiKeyString })
            });

            const data = await res.json();
            if (res.ok && data.success)
                updateRowContent(row, newNote, 'changeNote');
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
    const typeIndex = 4;
    const changedIndex = 7;
    const statusIndex = 8;

    // Update ip:port
    cells[ipPortIndex].innerText = `${newProxy[0]}:${newProxy[1]}`;

    // Update status to 'Running'
    cells[statusIndex].innerHTML = getStatusChip('Running');

    // Update 'changed' count if it's changeIp
    if (action === 'changeIp') {
        const changeIpType = elements.changeIpType.textContent.trim() === 'SOCKS5' ? 'SOCKS5 Proxy' : 'HTTPS Proxy'
        cells[typeIndex].innerText = changeIpType;

        const changedCell = cells[changedIndex];
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
        cells[typeIndex].innerText = reinstallType;
        updateRowData(id, {
            type: reinstallType,
            status: 'Running'
        });
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

init();
