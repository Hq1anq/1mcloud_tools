const elements = {
    table: document.querySelector('table'),
    tbody: document.getElementById('tableBody'),
    totalCount: document.getElementById('totalCount'),
    selectedCount: document.getElementById('selectedCount'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    emptyState: document.getElementById('emptyState'),

    filterInputs: document.querySelectorAll('.filter-input')
}

let allData = [];
let filteredData = [];
let renderedCount = 0;
const chunkSize = 50;

function bindEvents() {
    window.addEventListener('scroll', handleScroll);
    // elements.tbody.addEventListener('change', handleCount);
    elements.tbody.addEventListener('change', handleRowCheckboxChange);
    elements.tbody.addEventListener('click', handleRowClick);
    elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
}

export function initTable() {
    bindEvents();
    updateCounts();
    initFilters();
}

export function setData(data) {
    clearTable();
    allData = data;
    filteredData = [...data];
    renderedCount = 0;
    renderChunk();
}

export function addRows(data, includeActions = false) {
    data.forEach(row => addRow(row, includeActions));
    updateCounts();
}

export function addRow(data, addData = false, includeActions = false) {
    const tr = document.createElement('tr');

    tr.dataset.id = data.sid; // Unique key

    tr.classList.add('hover:bg-dark-750');

    let rowHTML = `
        <td class="px-4 py-2 border-b border-dark-600">
            <input type="checkbox" class="rowCheckbox w-4 h-4 text-blue-600 rounded">
        </td>
    `;

    for (const [key, value] of Object.entries(data)) {
        const alignment = (key === 'ip' || key === 'ip_port' || key === 'note') ? 'text-left' : 'text-center';

        rowHTML += `
        <td class="px-4 py-2 border-b border-dark-600 whitespace-nowrap ${alignment}">
            ${value}
        </td>
        `;
    }

    if (includeActions) {
        rowHTML += `
        <td class="px-4 py-2 border-b border-dark-600 space-x-2">
            <button class="bg-blue-600 py-1 px-4 rounded-lg hover:bg-blue-700" onclick="editRow(this)">Edit</button>
            <button class="bg-red-600 py-1 px-4 rounded-lg hover:bg-red-700" onclick="deleteRow(this)">Delete</button>
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

export function clearTable() {
    elements.tbody.innerHTML = "";
    allData = [];
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
    console.log('AFTER:', JSON.stringify(filteredData[fIndex]));
}

export function updateCounts() {
    const visibleRows = [...elements.tbody.querySelectorAll('tr')].filter(
        row => row.style.display !== 'none'
    );

    const checkboxes = visibleRows
        .map(row => row.querySelector('.rowCheckbox'));
    const selected = [...checkboxes].filter(cb => cb.checked);

    elements.totalCount.textContent = filteredData.length;
    elements.selectedCount.textContent = selected.length;

    showEmptyState(filteredData.length === 0);

    if (checkboxes.length > 0) {
        elements.selectAllCheckbox.checked = selected.length === checkboxes.length;
        elements.selectAllCheckbox.indeterminate = selected.length > 0 && selected.length < checkboxes.length;
    }
}

function handleCount(e) {
    if (e.target.classList.contains('rowCheckbox')) {
        updateCounts();
    }
}

export function getSelectedRows() {
    return [...document.querySelectorAll('.selected-row')];
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

function handleRowClick(e) {
    const tr = e.target.closest('tr');

    // Ignore if clicked a button, link, or the checkbox itself
    if (!tr || e.target.closest('button') || e.target.closest('a') || e.target.classList.contains('rowCheckbox')) {
        return;
    }

    const checkbox = tr.querySelector('.rowCheckbox');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true })); // manually trigger change event
    }
}

function handleRowCheckboxChange(e) {
    if (e.target.classList.contains('rowCheckbox')) {
        const tr = e.target.closest('tr');
        if (e.target.checked) {
            tr.classList.add('selected-row');
        } else {
            tr.classList.remove('selected-row');
        }
        updateCounts();
    }
}

// Initialize filter inputs
function initFilters() {
    elements.filterInputs.forEach(input => {
        // Run filter when ENTER is pressed
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                applyFilter();
            }
        });

        input.addEventListener('blur', applyFilter); // When loss focus on textbox (for mobile)
    });
}

function applyFilter() {
    const activeFilters = Object.entries(elements.filterInputs)
        .map(([_, inputBox]) => [_, inputBox.value.trim()])
        .filter(([_, value]) => value !== '');

    filteredData = activeFilters.length === 0
        ? [...allData]  // no filters, keep all
        : allData.filter(row => {
            return activeFilters.every(([colIndex, filterValue]) => {
                const value = Object.values(row)[colIndex];
                return value?.includes(filterValue);
            });
        });

    renderedCount = 0;
    elements.tbody.innerHTML = "";
    renderChunk();
}

function handleScroll() {
    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
    if (nearBottom && renderedCount < filteredData.length) {
        renderChunk();
    }
}

function renderChunk() {
    const nextChunk = filteredData.slice(renderedCount, renderedCount + chunkSize);
    nextChunk.forEach(row => addRow(row));
    renderedCount += nextChunk.length;
    updateCounts();
    addColumnClass(1, 'hidden lg:table-cell');
    addColumnClass(3, 'hidden md:table-cell');
    addColumnClass(4, 'hidden md:table-cell');
    addColumnClass(5, 'hidden sm:table-cell');
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
