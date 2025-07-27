import { addRow, updateCounts, initTable, clearTable } from '/javascript/components/table.js';
import { showToast, changeToToast } from '/javascript/components/toaster.js';
// DOM elements
const elements = {
    proxyInput: document.getElementById('proxyInput'),
    deleteBtn: document.getElementById('deleteBtn'),
    proxyTypeSelect: document.getElementById('proxyTypeSelect'),
    checkProxiesBtn: document.getElementById('checkProxiesBtn'),
    selectActiveBtn: document.getElementById('selectActiveBtn'),
    selectErrorBtn: document.getElementById('selectErrorBtn'),
    copyIpBtn: document.getElementById('copyIpBtn'),
    copyFullProxyBtn: document.getElementById('copyFullProxyBtn'),
    tableBody: document.getElementById('tableBody'),
    emptyState: document.getElementById('emptyState'),
    selectionButtons: document.getElementById('selectionButtons'),
    selectedCount: document.getElementById('selectedCount'),
    totalCount: document.getElementById('totalCount'),
    refreshBtn: document.getElementById('refreshBtn'),
    statusDisplay: document.getElementById('statusDisplay'),
    statusMessage: document.getElementById('statusMessage')
};

// Initialize
function init() {
    bindEvents();
    initTable('proxyChecker');
    // updateSelectedCount();
    // showEmptyState(true);
}

// Bind event listeners
function bindEvents() {
    // elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.checkProxiesBtn.addEventListener('click', checkProxies);
    // elements.selectActiveBtn.addEventListener('click', selectActiveProxies);
    // elements.selectErrorBtn.addEventListener('click', selectErrorProxies);
    // elements.copyIpBtn.addEventListener('click', copySelectedIPs);
    // elements.copyFullProxyBtn.addEventListener('click', copyFullProxies);
    // elements.refreshBtn.addEventListener('click', refreshProxies);
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
    const proxyType = proxyTypeSelect.value.trim()

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

// Parse proxy list from text
function parseProxyList(text) {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const parts = line.split(':');
        if (parts.length >= 4) {
            return {
                ip: parts[0],
                port: parts[1],
                username: parts[2],
                password: parts[3]
            };
        }
        return null;
    }).filter(proxy => proxy !== null);
}

init();
