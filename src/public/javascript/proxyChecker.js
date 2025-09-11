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

    tableWrapper: document.getElementById('table-wrapper'),
    captureBtn: document.getElementById('captureBtn')
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
    testData.forEach(data => addRow(data, true, true));
}

// Bind event listeners
function bindEvents() {
    elements.deleteBtn.addEventListener('click', deleteProxies);
    elements.checkProxiesBtn.addEventListener('click', checkProxies);

    elements.selectActiveBtn.addEventListener('click', selectProxies.bind(null, 'Active'));
    elements.selectErrorBtn.addEventListener('click', selectProxies.bind(null, 'Inactive'));

    elements.copyIpBtn.addEventListener('click', copySelectedIPs);
    elements.copyFullProxyBtn.addEventListener('click', copyFullProxies);

    elements.captureBtn.addEventListener('click', captureProxyStatus);
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

    // Send the proxies via POST
    await fetch('/proxy/send-proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxies })
    });

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
        addRow(result, true, true);
    };

    eventSource.onerror = (err) => {
        showToast('Check proxies error', 'error');
        console.error('SSE error:', err);
        eventSource.close();
    };
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

        if (hasAtLeast3Colons(line)) {
            // Format: ip:port or ip:port:username:password
            const parts = line.split(':');
            [ip, port, username, password] = parts;
        } else {
            // Format: username:password@ip:port
            const [authPart, addressPart] = line.split('@');
            [username, password] = authPart.split(':');
            [ip, port] = addressPart.split(':');
            return { ip, port, username, password };
        }

        if (ip && port) {
            return { ip: ip, port: port, username: username || null, password: password || null };
        }
        return null;
    }).filter(proxy => proxy !== null);

    function hasAtLeast3Colons(str) {
        return str.split(':').length - 1 >= 3;
    }
}

function deleteProxies() {
    elements.proxyInput.value = '';
}

async function captureProxyStatus() {
    const originContainer = document.getElementById('table-container')
    const cloneContainer = originContainer.cloneNode(true);
    const containerHeader = cloneContainer.querySelector('#container-header');
    const rows = cloneContainer.querySelectorAll('tr');

    cloneContainer.className = 'fixed bg-body p-3 z-[-10]';

    // Remove filter, button
    containerHeader.innerHTML = `
        <div>
            <h2 class="flex items-center text-lg font-bold sm:text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    class="mr-2 h-10 w-10 flex-shrink-0 fill-none stroke-current stroke-2 ">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4 9L20 9M8 9V20M6.2 20H17.8C18.9201 20 19.4802 20 19.908 19.782C20.2843 19.5903 20.5903 19.2843 20.782 18.908C21 18.4802 21 17.9201 21 16.8V7.2C21 6.0799 21 5.51984 20.782 5.09202C20.5903 4.71569 20.2843 4.40973 19.908 4.21799C19.4802 4 18.9201 4 17.8 4H6.2C5.0799 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.07989 3 7.2V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.07989 20 6.2 20Z" />
                </svg>
                <span class="mb-5">Proxy Status</span>
            </h2>
        </div>`;
    
    // Header rows
    rows[0].innerHTML = `
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            ip
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            port
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            username
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            password
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            type
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            status
        </th>
    `;

    for (let i = 1; i < rows.length; i++) {
        rows[i].firstElementChild.remove(); // Remove first checkbox
        for (let j = 2; j < 11; j += 2) {
            rows[i].childNodes[j].className = 'text-lg bg-surface text-center border-border border-b px-6 py-1 pb-5';
        }
        rows[i].childNodes[12].classList.add('bg-surface');
        rows[i].childNodes[12].firstElementChild.style.padding = '0 1rem 1rem';
        rows[i].childNodes[12].firstElementChild.style.fontSize = '1.125rem';
    }

    document.body.appendChild(cloneContainer);
    // Capture with html2canvas
    const captured = await html2canvas(cloneContainer, { backgroundColor: null });

    // standardize width (e.g. always 1080px wide)
    const canvas = resizeCanvas(captured, 1080);

    canvas.toBlob(async (blob) => {
        const url = URL.createObjectURL(blob);
        const filename = "proxyChecker.png";
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
            ]);

            showToast(
                `Captured proxyStatus<br>
                Saved to clipboard<br>
                <a href="${url}" download="${filename}"
                    class="underline text-blue-600 sm:no-underline sm:hover:underline">
                    Download
                </a>`,
                "success"
            );

            // optional cleanup: revoke object URL after some seconds
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (err) {
            // 2. If clipboard fails → fallback: auto download
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }
    });

    document.body.removeChild(cloneContainer);
}

function resizeCanvas(originalCanvas, targetWidth) {
    const scale = targetWidth / originalCanvas.width;
    const targetHeight = originalCanvas.height * scale;

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;

    const ctx = resizedCanvas.getContext("2d");
    ctx.drawImage(originalCanvas, 0, 0, targetWidth, targetHeight);

    return resizedCanvas;
}

init();