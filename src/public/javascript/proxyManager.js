import { addRow, initTable } from '/javascript/components/table.js';
// DOM elements
const elements = {
    ipList: document.getElementById('ip-list'),
    apiKey: document.getElementById('api-key'),
    amount: document.getElementById('amount'),
    getDataBtn: document.getElementById('getDataBtn')
}

// Initialize
function init() {
    bindEvents();
    initTable();
    // updateSelectedCount();
    // showEmptyState(true);
}

// Bind event listeners
function bindEvents() {
    // elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.getDataBtn.addEventListener('click', getData);
    // elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
    // elements.selectActiveBtn.addEventListener('click', selectActiveProxies);
    // elements.selectErrorBtn.addEventListener('click', selectErrorProxies);
    // elements.copyIpBtn.addEventListener('click', copySelectedIPs);
    // elements.copyFullProxyBtn.addEventListener('click', copyFullProxies);
    // elements.refreshBtn.addEventListener('click', refreshProxies);
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
        const response = await fetch('/getData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ipString, amountString, apiKeyString })
        });

        const result = await response.json();

        if (response.ok) {
            // Optional: render to table instead of pre
            result.data.forEach(row => addRow(row));
        } else {
            output.textContent = `❌ Error: ${result.error}`;
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

init();