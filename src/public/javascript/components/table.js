import { showToast } from '/javascript/components/toaster.js';

const elements = {
    table: document.querySelector('table'),
    tbody: document.getElementById('tableBody'),
    totalCount: document.getElementById('totalCount'),
    selectedCount: document.getElementById('selectedCount'),
    reloadBtn: document.getElementById('reloadBtn'),
    captureBtn: document.getElementById('captureBtn'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    emptyState: document.getElementById('emptyState'),

    filterInputs: document.querySelectorAll('.filter-input')
}

const desktopOrder = ['sid', 'ip_port', 'country', 'type', 'created', 'expired', 'ip_changed', 'status', 'note'];
const mobileOrder  = ['ip_port', 'status', 'note', 'expired', 'country', 'type', 'created', 'ip_changed', 'sid'];
export let order;
export let columnMap = { checkbox: 0 };

export function reorderHeader() {
    const headerCells = elements.table.tHead.rows[0].cells;

    if (isMobile()) {
        order = mobileOrder;
        headerCells[1].firstElementChild.querySelector('input').classList.remove('text-center');
        headerCells[1].firstElementChild.classList.add('items-start');
        headerCells[3].firstElementChild.querySelector('input').classList.remove('text-center');
        headerCells[3].firstElementChild.classList.add('items-start');
    } else {
        order = desktopOrder;
        headerCells[2].firstElementChild.querySelector('input').classList.remove('text-center');
        headerCells[2].firstElementChild.classList.add('items-start');
        headerCells[9].firstElementChild.querySelector('input').classList.remove('text-center');
        headerCells[9].firstElementChild.classList.add('items-start');
    }

    order.forEach((col, idx) => {
        columnMap[col] = idx + 1; // +1 because 0 is reserved for checkbox
    });

    order.forEach((col, idx) => {
        const headerCell = headerCells[idx + 1]; // +1 because first <th> is checkbox
        headerCell.firstElementChild.firstChild.nodeValue = col;
    });
}

function renderChunk() {
    const nextChunk = filteredData.slice(renderedCount, renderedCount + chunkSize);

    nextChunk.forEach(row => {
        const orderedRow = reorderRowData(row, order);
        addRow(orderedRow);
    });
    renderedCount += nextChunk.length;
    updateCounts();
}

function isMobile() {
    return window.matchMedia("(max-width: 640px)").matches; // Tailwind `sm:` breakpoint
}

function reorderRowData(row, order) {
    // build a new object with reordered keys
    const reordered = {};
    order.forEach(key => {
        if (row.hasOwnProperty(key)) {
            reordered[key] = row[key];
        }
    });

    return reordered; // still an object
}

let allData = [];
let filteredData = [];
let renderedCount = 0;
let sortedData = []; // for display when getData with ips !== ''
let isSorted = false; // for not filter allData
const chunkSize = 50;

function bindEvents(page) {
    window.addEventListener('scroll', () => handleScroll(page));
    elements.tbody.addEventListener('change', handleRowCheckboxChange);
    elements.tbody.addEventListener('click', handleRowClick);
    elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
    if ('ontouchstart' in window) {
        // Mobile → only touch
        elements.tbody.addEventListener("touchend", handleTableTap);
    } else {
        // Desktop → only click
        elements.tbody.addEventListener("click", handleTableTap);
    }
    
    elements.reloadBtn.addEventListener('click', showAllData);
    
    if (page === 'proxyManager')
        window.addEventListener("beforeunload", () => {
            try {
                localStorage.setItem("allData", JSON.stringify(allData));
            } catch (e) {
                console.error("Failed to save allData before unload", e);
            }
        });
}

export function initTable(page) {
    bindEvents(page);
    initFilters(page);
    if (page === 'proxyChecker') {
        elements.reloadBtn.classList.add('hidden');
        elements.captureBtn.classList.remove('hidden');
    } else {
        elements.reloadBtn.classList.remove('hidden');
        elements.captureBtn.classList.add('hidden');

        const allDataStr = localStorage.getItem("allData");
        if (allDataStr) {
            try {
                allData = JSON.parse(allDataStr);
                if (allData.length > 0) showEmptyState(false);
            } catch (e) {
                console.error('Failed to parse stored data', e);
                allData = [];
            }
        }
    }
    updateCounts();
}

export function displaySorted(data) {
    clearTable();
    sortedData = data.map(row => {
        const reordered = {};
        order.forEach(key => {
            if (row.hasOwnProperty(key)) {
                reordered[key] = row[key];
            }
        });
        return reordered;
    });
    filteredData = [...sortedData];
    renderedCount = 0;
    isSorted = true;
    renderChunk();
}

export function addRows(data, includeActions = false) {
    data.forEach(row => addRow(row, includeActions));
    updateCounts();
}

export function addRow(data, addData = false, includeActions = false) {
    const tr = document.createElement('tr');

    tr.dataset.id = data.sid; // Unique key

    tr.classList.add('hover:bg-bg-hover', 'group');

    let rowHTML = `
        <td class="px-2 sm:px-4 py-2 border-b border-border">
            <label class="inline-flex items-center cursor-pointer select-none">
                <!-- Hidden native checkbox -->
                <input type="checkbox" class="rowCheckbox sr-only" />

                <!-- Custom box -->
                <span class="w-5 h-5 text-text-secondary flex items-center justify-center checkbox-transition
                            rounded-md border border-border bg-checkbox
                            group-hover:border-border-checkbox-hover group-hover:brightness-125 relative overflow-visible">
                    <!-- Big check -->
                    <svg class="w-5 h-5 opacity-0 scale-0 checkbox-transition
                                group-has-[input:checked]:opacity-100 group-has-[input:checked]:scale-100 absolute"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                </span>
            </label>
        </td>
    `;

    for (const [key, value] of Object.entries(data)) {
        const alignment = (key === 'ip' || key === 'ip_port' || key === 'note') ? 'text-left' : 'text-center';
        const content = key === 'status' ? getStatusChip(value) : value;

        rowHTML += `
        <td class="px-2 sm:px-4 py-2 border-b border-border whitespace-nowrap ${alignment}">
            ${content}
        </td>
        `;
    }

    if (includeActions) {
        rowHTML += `
        <td class="px-2 sm:px-4 py-2 border-b border-border space-x-2">
            <button class="bg-blue-600 py-1 px-2 sm:px-4 rounded-lg hover:bg-blue-700" onclick="editRow(this)">Edit</button>
            <button class="bg-red-600 py-1 px-2 sm:px-4 rounded-lg hover:bg-red-700" onclick="deleteRow(this)">Delete</button>
        </td>
        `;
    }

    tr.innerHTML = rowHTML;
    elements.tbody.appendChild(tr);
    if (addData) {
        allData.push(data);
        filteredData.push(data);
        updateCounts();
        showEmptyState(false);
    }
}

export function getStatusChip(status) {
    const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-semibold inline-block';
    switch (status) {
        case 'Running':
        case 'Active':
            return `<span class="${baseClasses} bg-bg-success text-text-success">${status}</span>`;
        case 'Paused':
        case 'Stopped':
            return `<span class="${baseClasses} bg-bg-warning text-text-warning">${status}</span>`;
        case 'Off':
        case 'Inactive':
            return `<span class="${baseClasses} bg-bg-error text-text-error">${status}</span>`;
        case 'Unknow':
        default:
            return `<span class="${baseClasses} bg-bg-unknowed text-text-unknowed">${status}</span>`;
    }
}

export function clearTable() {
    elements.tbody.innerHTML = "";
    filteredData = [];
}

export function updateRowData(id, newData) {
    const numericId = Number(id); // Convert to number

    const index = allData.findIndex(item => item.sid === numericId);
    if (index !== -1) {
        allData[index] = { ...allData[index], ...newData };
    }

    const fIndex = filteredData.findIndex(item => item.sid === numericId);
    if (fIndex !== -1) {
        filteredData[fIndex] = { ...filteredData[fIndex], ...newData };
    }
}

export function updateCounts() {
    const visibleRows = [...elements.tbody.querySelectorAll('tr')].filter(
        row => row.style.display !== 'none'
    );

    const checkboxes = visibleRows
        .map(row => row.querySelector('input'));
    const selected = [...checkboxes].filter(cb => cb.checked);

    elements.totalCount.textContent = filteredData.length;
    elements.selectedCount.textContent = selected.length;

    showEmptyState(allData.length === 0);

    if (checkboxes.length > 0) {
        elements.selectAllCheckbox.checked = selected.length === checkboxes.length;
        elements.selectAllCheckbox.indeterminate = selected.length > 0 && selected.length < checkboxes.length;
    }
}

export function getSelectedRows() {
    const selectedRows = [];
    const rows = elements.tbody.rows;
    for (let i = 0; i < rows.length; i++) {
        const checkbox = rows[i].cells[0].querySelector('input');
        if (checkbox && checkbox.checked) {
            selectedRows.push(rows[i]);
        }
    }
    return selectedRows;
}

function handleSelectAll(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.rowCheckbox').forEach(checkbox => {
        if (isChecked) {
            checkbox.checked = true;
            checkbox.closest('tr').classList.add('selected-row');
        } else {
            checkbox.checked = false;
            checkbox.closest('tr').classList.remove('selected-row');
        }
    });
    updateCounts();
}

let lastSelectedIndex = null;

function handleRowClick(e) {
    const tr = e.target.closest('tr');

    // Ignore if clicked a button, link, or the checkbox itself
    if (!tr || e.target.closest('button') || e.target.closest('a') || e.target.classList.contains('rowCheckbox')) {
        return;
    }

    const rows = Array.from(elements.tbody.querySelectorAll('tr'));
    const clickedIndex = rows.indexOf(tr);

    if (clickedIndex === -1) return;

    const checkbox = tr.querySelector('.rowCheckbox');
    if (!checkbox) return;

    // SHIFT key logic
    if (e.shiftKey && lastSelectedIndex !== null) {
        const [start, end] = [lastSelectedIndex, clickedIndex].sort((a, b) => a - b);

        // Determine the action (check or uncheck) based on the last selected row's checkbox state
        const lastRow = rows[lastSelectedIndex];
        const lastCheckbox = lastRow.querySelector('.rowCheckbox');
        const shouldCheck = lastCheckbox?.checked ?? false;
        
        for (let i = start; i <= end; i++) {
            const row = rows[i];
            const rowCheckbox = row.querySelector('.rowCheckbox');
            if (rowCheckbox) {
                rowCheckbox.checked = shouldCheck;
                rowCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    } else {
        // Regular toggle
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true })); // manually trigger change event
    }

    lastSelectedIndex = clickedIndex;
}

let lastTapTime = 0;
let lastCell = null;

function handleTableTap(e) {
    const target = e.target.closest('td');
    if (!target) return;

    const currentTime = Date.now();
    const tapGap = currentTime - lastTapTime;

    if (tapGap < 300 && target === lastCell) {
        // ✅ It's a "double tap" on the same cell
        const text = target.textContent.trim();
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`Copied: ${text}`, 'info');
            }).catch(err => {
                console.error('Clipboard copy failed', err);
            });
        }
    }

    lastTapTime = currentTime;
    lastCell = target;
}

function handleRowCheckboxChange(e) {
    if (e.target.classList.contains('rowCheckbox')) {
        const tr = e.target.closest('tr');
        if (e.target.checked) {
            tr.classList.remove('bg-success-cell');
            tr.classList.remove('bg-error-cell')
            tr.classList.add('selected-row');
        } else {
            tr.classList.remove('selected-row');
        }
        updateCounts();
    }
}

// Initialize filter inputs
function initFilters(page) {
    elements.filterInputs.forEach(input => {
        // Run filter when ENTER is pressed
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                applyFilter(page);
            }
        });

        input.addEventListener('blur', () => applyFilter(page)); // When loss focus on textbox (for mobile)
    });
}

function applyFilter(page) {
    const activeFilters = Array.from(elements.filterInputs)
        .map((inputBox, idx) => [order[idx], inputBox.value.trim()])
        .filter(([_, value]) => value !== '');

    const targetData = isSorted ? sortedData : allData;
    filteredData = activeFilters.length === 0
        ? [...targetData]  // no filters, keep all
        : targetData.filter(row => {
            return activeFilters.every(([colKey, keyword]) => {
                const cellValue = String(row[colKey]);
                return cellValue.includes(keyword);
            });
        });

    renderedCount = 0;
    elements.tbody.innerHTML = "";
    if (page !== 'proxyChecker') renderChunk();
    else filteredData.forEach(row => addRow(row));
}

export function showAllData() {
    filteredData = [...allData];
    isSorted = false;
    renderedCount = 0;
    elements.tbody.innerHTML = "";
    renderChunk();
    updateCounts();
    showEmptyState(allData.length === 0);
}

function handleScroll(page) {
    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
    if (nearBottom && renderedCount < filteredData.length) {
        if (page !== 'proxyChecker') renderChunk();
    }
}

export function addColumnClass(colIndex, className) {
    if (!elements.table) return;

    // Modify header cell
    const headerCell = elements.table.tHead?.rows[0]?.cells[colIndex];
    if (headerCell) {
        headerCell.classList.add(...className.split(' '));
    }

    // Modify all body cells in the same column
    const rows = elements.table.tBodies[0]?.rows;
    if (!rows) return;

    for (const row of rows) {
        const cell = row.cells[colIndex];
        if (cell) {
        cell.classList.add(...className.split(' '));
        }
    }
}

function showEmptyState(show) {
    elements.emptyState.style.display = show ? 'block' : 'none';
}

export function setAllData(data) {
    allData = data;
}