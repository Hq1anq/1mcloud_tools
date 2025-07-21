import { setData, initTable, updateCounts, getSelectedRows } from '/javascript/components/table.js';
import { showToast } from '/javascript/components/toaster.js';
// DOM elements
const elements = {
    ipList: document.getElementById('ip-list'),
    apiKey: document.getElementById('api-key'),
    amount: document.getElementById('amount'),
    getDataBtn: document.getElementById('getDataBtn'),

    noteInput: document.getElementById('noteInput'),
    replaceCheckbox: document.getElementById('replaceCheckbox'),
    changeNoteBtn: document.getElementById('changeNoteBtn'),

    changeIpBtn: document.getElementById('changeIpBtn'),
    reinstallBtn: document.getElementById('reinstallBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    refundBtn: document.getElementById('refundBtn')
}

// Initialize
function init() {
    setData([
        {"sid": 583192, "ip_port": "103.16.161.159:38927", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583191, "ip_port": "157.66.195.189:35605", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583190, "ip_port": "160.250.62.145:37555", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583189, "ip_port": "103.184.96.105:18460", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583188, "ip_port": "157.66.163.148:54702", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583187, "ip_port": "103.16.214.134:55464", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583186, "ip_port": "103.189.202.6:47104", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583185, "ip_port": "160.250.63.51:24672", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583184, "ip_port": "103.16.225.156:46807", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"},
        {"sid": 583183, "ip_port": "103.190.36.207:21095", "country": "VN", "type": "HTTP Proxy", "from": "19-07-2025", "to": "18-08-2025", "changed_ip": 0,"status": "Running", "note": "0208 tung2"}
    ]);
    bindEvents();
    initTable();
    // updateSelectedCount();
    // showEmptyState(true);
}

// Bind event listeners
function bindEvents() {
    // elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.getDataBtn.addEventListener('click', getData);
    elements.changeNoteBtn.addEventListener('click', changeNote);
    elements.changeIpBtn.addEventListener('click', changeIp);
    elements.reinstallBtn.addEventListener('click', reinstall);
    elements.pauseBtn.addEventListener('click', testToast);
    // elements.refundBtn.addEventListener('click', getTbody);
}

function testToast() {
    showToast('test toast', 'success');
}

// Feature: Get Servers by IPs
async function getData() {
    const ipString = elements.ipList.value
        .split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0)
        .join(',');
    const apiKeyString = elements.apiKey.value.trim();
    const amountString = elements.amount.value.trim();

    try {
        showToast("Getting data...", )
        const response = await fetch('/getData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ipString, amountString, apiKeyString })
        });

        const result = await response.json();

        if (response.ok) {
            setData(result.data || []);  // delegate everything to table.js
            // saveToLocal(allData);
        } else {
            output.textContent = `❌ Error: ${result.error}`;
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

async function changeIp() {
    console.log("Change ip...");
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        alert('Please select at least one row to CHANGE IP.');
        return;
    }

    const proxyLines = []; // collect proxies here

    for (const row of selectedRows) {
        const cells = row.querySelectorAll('td');
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

                updateRowContent(cells, data.proxyInfo, 'changeIp');

                row.classList.add('bg-green-900/40');
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

    updateCounts();

    // ✅ Copy to clipboard if there are any successful proxies
    if (proxyLines.length > 0) {
        const textToCopy = proxyLines.join('\n');
        try {
            await navigator.clipboard.writeText(textToCopy);
            alert('✅ Proxy list copied to clipboard!');
        } catch (err) {
            console.error('❌ Failed to copy to clipboard:', err);
            showCopyDialog(textToCopy);
        }
    }
}

async function reinstall() {
    console.log("Reinstall...");
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        alert('Please select at least one row to REINSTALL.');
        return;
    }

    const proxyLines = []; // collect proxies here

    for (const row of selectedRows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) continue;

        // Extract IP from the 'ip_port' column (assumed to be the second column)
        const sid = cells[1].innerText.trim();

        try {
            const res = await fetch('/proxy/reinstall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sid })
            });

            const data = await res.json();
            if (res.ok && data.proxyInfo) {
                const proxyString = data.proxyInfo.join(":");
                console.log(`✅ REINSTALL for sid ${sid}:`, proxyString);

                proxyLines.push(proxyString);

                updateRowContent(cells, data.proxyInfo, 'reinstall');

                row.classList.add('bg-green-900/40');
            } else {
                console.error(`❌ Failed to REINSTALL for sid ${sid}:`, data.error);
                row.classList.add('bg-red-900/40');
            }
        } catch (err) {
            console.error(`❌ Error REINSTALL for sid ${sid}:`, err);
            row.classList.add('bg-red-900/40');
        }

        await delay(2000);
    }

    updateCounts();

    // ✅ Copy to clipboard if there are any successful proxies
    if (proxyLines.length > 0) {
        const textToCopy = proxyLines.join('\n');
        try {
            await navigator.clipboard.writeText(textToCopy);
            alert('✅ Proxy list copied to clipboard!');
        } catch (err) {
            console.log('❌ Failed to copy to clipboard:', err);
            showCopyDialog(textToCopy);
        }
    }
}

async function changeNote() {
    const noteInput = elements.noteInput.value;
    const isReplace = elements.replaceCheckbox.checked;

    console.log("Change note...");
    const selectedRows = getSelectedRows();
    if (selectedRows.length === 0) {
        alert('Please select at least one row to CHANGE NOTE.');
        return;
    }

    const proxyLines = []; // collect proxies here

    for (const row of selectedRows) {
        let newNote;
        const cells = row.querySelectorAll('td');
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
                body: JSON.stringify({ sid, newNote })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.success) {
                    updateRowContent(cells, newNote, 'changeNote');
                }
                row.classList.add('bg-green-900/40');
            } else {
                console.error(`❌ Failed to REINSTALL for sid ${sid}:`, data.error);
                row.classList.add('bg-red-900/40');
            }
        } catch (err) {
            console.error(`❌ Error REINSTALL for sid ${sid}:`, err);
            row.classList.add('bg-red-900/40');
        }

        await delay(1000);
    }

    updateCounts();

    // ✅ Copy to clipboard if there are any successful proxies
    if (proxyLines.length > 0) {
        const textToCopy = proxyLines.join('\n');
        try {
            await navigator.clipboard.writeText(textToCopy);
            alert('✅ Proxy list copied to clipboard!');
        } catch (err) {
            console.log('❌ Failed to copy to clipboard:', err);
            showCopyDialog(textToCopy);
        }
    }
}

function updateRowContent(cells, text, action) {
    cells[0].firstElementChild.checked = false;
    if (action === 'changeNote') {
        const newNote = text;
        cells[9].innerText = newNote;
    } else {
        const newProxy = text;

        // Column indexes based on header:
        // [checkbox, 'sid', 'ip:port', 'country', 'type', 'from', 'to', 'changed', 'status', 'note']
        const ipPortIndex = 2;
        const changedIndex = 7;
        const statusIndex = 8;

        // Update ip:port
        cells[ipPortIndex].innerText = `${newProxy[0]}:${newProxy[1]}`;

        // Update 'changed' count if it's changeIp
        if (action === 'changeIp') {
            const changedCell = cells[changedIndex];
            const currentValue = parseInt(changedCell.innerText.trim()) || 0;
            changedCell.innerText = currentValue + 1;
        }

        // Update status to 'Running'
        cells[statusIndex].innerText = 'Running';
    }
}

function showCopyDialog(textToCopy) {
    const dialog = document.getElementById('copyDialog');
    const textarea = document.getElementById('proxyTextarea');
    const closeBtn = document.getElementById('closeDialogBtn');

    textarea.value = textToCopy;
    dialog.classList.remove('hidden');

    closeBtn.addEventListener('click', () => {
        dialog.classList.add('hidden');
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

init();