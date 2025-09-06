import { addRow, updateCounts, initTable, clearTable, getSelectedRows } from '/javascript/components/table.js';
import { showToast, changeToToast } from '/javascript/components/toaster.js';
import { showCopyDialog } from '/javascript/components/copyDialog.js';
// DOM elements
const elements = {
    proxyInput: document.getElementById('proxyInput'),
    deleteBtn: document.getElementById('deleteBtn'),

    proxyType: document.getElementById('proxyTypeSelect-trigger'),
    checkProxiesBtn: document.getElementById('checkProxiesBtn'),

    selectActiveBtn: document.getElementById('selectActiveBtn'),
    selectErrorBtn: document.getElementById('selectErrorBtn'),

    copyIpBtn: document.getElementById('copyIpBtn'),
    copyFullProxyBtn: document.getElementById('copyFullProxyBtn'),

    tableBody: document.getElementById('tableBody'),
};

// Initialize
function init() {
    bindEvents();
    initTable('proxyChecker');
    insertTestData();
}

function insertTestData() {
    const testData = [
        {
            ip: '192.168.1.1',
            port: '8080',
            username: 'user1',
            password: 'pass1',
            type: 'HTTPS',
            status: 'Active'
        },
        {
            ip: '192.168.1.2',
            port: '3128',
            username: 'user2',
            password: 'pass2',
            type: 'SOCKS5',
            status: 'Inactive'
        },
        {
            ip: '192.168.1.3',
            port: '80',
            username: 'user3',
            password: 'pass3',
            type: 'HTTPS',
            status: 'Active'
        },
        {
            ip: '192.168.1.4',
            port: '1080',
            username: 'user4',
            password: 'pass4',
            type: 'SOCKS5',
            status: 'Inactive'
        },
        {
            ip: '192.168.1.5',
            port: '8888',
            username: 'user5',
            password: 'pass5',
            type: 'HTTPS',
            status: 'Active'
        }
    ];

    clearTable();
    testData.forEach(data => addRow(data, true));
}

// Bind event listeners
function bindEvents() {
    elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.checkProxiesBtn.addEventListener('click', checkProxies);

    elements.selectActiveBtn.addEventListener('click', selectProxies.bind(null, 'Active'));
    elements.selectErrorBtn.addEventListener('click', selectProxies.bind(null, 'Inactive'));

    elements.copyIpBtn.addEventListener('click', copySelectedIPs);
    elements.copyFullProxyBtn.addEventListener('click', copyFullProxies);
}

// Check proxies
async function checkProxies() {
    clearTable();
    const proxyText = elements.proxyInput.value.trim();
    
    if (!proxyText) {
        showToast('Enter at least one proxy', 'warning');
        return;
    }

    showToast('Checking proxies...', 'loading');

    // Parse proxy list
    const proxies = parseProxyList(proxyText);
    const proxyType = elements.proxyType.textContent.trim();

    // Start the stream
    const eventSource = new EventSource(`/proxy/check-stream?type=${proxyType}`);

    eventSource.onmessage = (event) => {
        const result = JSON.parse(event.data);
        if (result.done) {
            updateCounts();
            changeToToast('Check proxies DONE', 'success');
            console.log("✅ All proxies checked. Closing SSE.");
            eventSource.close();
            return;
        }
        addRow(result, true);
    };

    eventSource.onerror = (err) => {
        showToast('Check proxies error', 'error');
        console.error('SSE error:', err);
        eventSource.close();
    };

    // Send the proxies via POST
    await fetch('/proxy/send-proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxies })
    });
}

function selectProxies(status='Active') {
    const rows = elements.tableBody.rows;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const statusCell = row.cells[6]; // Status is at index 6
        const checkbox = row.cells[0].querySelector('input');
        if (statusCell && checkbox) {
            const statusText = statusCell.textContent.trim();
            checkbox.checked = (statusText === status);
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

function copySelectedIPs() {
    const selectedRows = getSelectedRows();

    if (selectedRows.length === 0) {
        showToast('Select at least 1 proxy to COPY', 'info');
        return;
    }

    const ips = selectedRows
        .map(row => row.cells[1].textContent.trim());
    const ipsText = ips.join('\n');
    navigator.clipboard.writeText(ipsText)
        .then(() => showToast(`Copied ${ips.length} IPs to clipboard`, 'success'))
        .catch(err => {
            console.error('Failed to copy:', err);
            showCopyDialog('List IP', ipsText);
        });
}

function copyFullProxies() {
    const selectedRows = getSelectedRows();

    if (selectedRows.length === 0) {
        showToast('Select at least 1 proxy to COPY', 'info');
        return;
    }

    const proxies = selectedRows
        .map(row => {
            const ip = row.cells[1].textContent.trim();
            const port = row.cells[2].textContent.trim();
            const username = row.cells[3].textContent.trim();
            const password = row.cells[4].textContent.trim();
            return `${ip}:${port}:${username}:${password}`;
        });
    const proxiesText = proxies.join('\n');
    navigator.clipboard.writeText(proxiesText)
        .then(() => showToast(`Copied ${proxies.length} proxies to clipboard`, 'success'))
        .catch(err => {
            console.error('Failed to copy:', err);
            showCopyDialog('List Porxy', proxiesText);
        });
}

// Parse proxy list from text
function parseProxyList(text) {
    const lines = text.split('\n').filter(line => line.trim()).filter(Boolean);;

    return lines.map(line => {
        let ip, port, username, password;

        if (line.includes('@')) {
            // Format: username:password@ip:port
            const [authPart, addressPart] = line.split('@');
            [username, password] = authPart.split(':');
            [ip, port] = addressPart.split(':');
            return { ip, port, username, password };
        } else {
            // Format: ip:port or ip:port:username:password
            const parts = line.split(':');
            if (parts.length >= 4) {
                [ip, port, username, password] = parts;
            }
        }

        if (ip && port) {
            return { ip: ip, port: port, username: username || null, password: password || null };
        }
        return null;
    }).filter(proxy => proxy !== null);
}

function deleteProxies() {
    elements.proxyInput.value = '';
}

init();
