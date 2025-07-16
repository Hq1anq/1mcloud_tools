import { addRow, getSelectedRows, selectAllRows, updateCounts } from '/javascript/components/table.js';
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
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    proxyTableBody: document.getElementById('proxyTableBody'),
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
    // updateSelectedCount();
    // showEmptyState(true);
}

// Bind event listeners
function bindEvents() {
    // elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.checkProxiesBtn.addEventListener('click', checkProxies);
    // elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
    // elements.selectActiveBtn.addEventListener('click', selectActiveProxies);
    // elements.selectErrorBtn.addEventListener('click', selectErrorProxies);
    // elements.copyIpBtn.addEventListener('click', copySelectedIPs);
    // elements.copyFullProxyBtn.addEventListener('click', copyFullProxies);
    // elements.refreshBtn.addEventListener('click', refreshProxies);
}

// Check proxies
async function checkProxies() {
    const proxyText = elements.proxyInput.value.trim();
    
    if (!proxyText) {
        showStatus('Please enter at least one proxy', 'error');
        return;
    }

    showStatus('Checking proxies...', 'loading');

    // Parse proxy list
    const proxyList = parseProxyList(proxyText);
    const proxyType = proxyTypeSelect.value.trim()
    
    console.log('Parsed Proxies:', proxyList);
    console.log(proxyType);
    // Simulate API call with random status
    try {
        const res = await fetch('/proxy/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proxies: proxyList, type: proxyType })
        });
        const data = await res.json();
        if (data.results) {
            data.results.forEach(row => addRow(row));
        } else {
            console.log("CheckProxies: ERROR!");
        }
    } catch (err) {
        document.getElementById('response').textContent = 'Request failed: ' + err;
    }
    // setTimeout(() => {
    //     proxyData = proxyList.map(proxy => {
    //         // Add random status for demonstration
    //         const statuses = ['Active', 'Inactive', 'Checking', 'Error'];
    //         const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
    //         return {
    //             ...proxy,
    //             status: randomStatus
    //         };
    //     });
        
    //     renderProxyTable();
    //     showStatus('Proxy check completed!', 'success');
    // }, 1500);
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

function showStatus(message, type = 'success') {
    elements.statusMessage.textContent = message;
    elements.statusDisplay.className = `fixed top-16 right-4 z-50 ${type === 'error' ? 'bg-red-500' : type === 'loading' ? 'bg-blue-500' : 'bg-green-500'} text-white px-4 py-2 rounded-lg shadow-lg`;
    elements.statusDisplay.classList.remove('hidden');

    setTimeout(() => {
        elements.statusDisplay.classList.add('hidden');
    }, 3000);
}

// document.getElementById('checkProxiesBtn').addEventListener('click', async function() {
//     const proxies = document.getElementById('proxy-list').value
//         .split('\n')
//         .map(line => line.trim())
//         .filter(line => line.length > 0);
//     const proxyType = document.getElementById('proxy-type').value;
//     if (!proxies) {
//         document.getElementById('response').textContent = 'Please enter at least one proxy.';
//         return;
//     }
//     document.getElementById('response').textContent = 'Checking proxies...';
//     try {
//         const res = await fetch('/proxy/check', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ proxies: proxies, type: proxyType })
//         });
//         const data = await res.json();
//         if (data.results) {
//             document.getElementById('response').textContent = data.results.map(r => `${r.proxy}: ${r.status}${r.error ? ' (' + r.error + ')' : ''}`).join('\n');
//         } else {
//             document.getElementById('response').textContent = JSON.stringify(data, null, 2);
//         }
//     } catch (err) {
//         document.getElementById('response').textContent = 'Request failed: ' + err;
//     }
// });

init();