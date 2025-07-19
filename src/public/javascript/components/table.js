const elements = {
    table: document.getElementById('table'),
    tbody: document.getElementById('tableBody'),
    totalCount: document.getElementById('totalCount'),
    selectedCount: document.getElementById('selectedCount'),
    selectAllCheckbox: document.getElementById('selectAllCheckbox'),
    emptyState: document.getElementById('emptyState')
}

function bindEvents() {
    elements.tbody.addEventListener('change', handleCount);
    elements.tbody.addEventListener('click', handleRowClick);
    elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
}

export function addRows(data, includeActions) {
    data.forEach(row => addRow(row));
    updateCounts();
}

export function clearTable() {
    elements.tbody.innerHTML = "";
}

export function addRow(data, includeActions = false) {
    const tr = document.createElement('tr');

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
}

export function updateCounts() {
    const rows = elements.tbody.querySelectorAll('tr');
    const checkboxes = elements.tbody.querySelectorAll('.rowCheckbox');
    const selected = [...checkboxes].filter(cb => cb.checked);

    elements.totalCount.textContent = rows.length;
    elements.selectedCount.textContent = selected.length;

    showEmptyState(rows.length === 0);

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

export function initTable() {
    bindEvents();
    updateCounts();
    initFilters();
}

export function getSelectedRows() {
    return document.querySelectorAll('.selected-row');
}

function handleSelectAll(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.rowCheckbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    updateCounts();
}

function handleRowClick(e) {
    const tr = e.target.closest('tr');
    if (!tr || tr.querySelector('button')?.contains(e.target) || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
        return; // Ignore if clicked a button or link
    }

    const checkbox = tr.querySelector('.rowCheckbox');
    if (checkbox?.checked) {
        checkbox.checked = false;
        tr.classList.remove('selected-row');
    } else {
        checkbox.checked = true;
        tr.classList.add('selected-row');
    }

    updateCounts();
}

let filterData = {};

// Initialize filter inputs
function initFilters() {
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        // Run filter when ENTER is pressed
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                handleFilterChange(event);
            }
        });
    });
}

// Handle filter change
function handleFilterChange(e) {
    const input = e.target;
    const value = input.value.toLowerCase();
    const th = input.closest('th');

    const allThs = [...th.parentElement.children]; // Get all <th> in the same row
    const column = allThs.indexOf(th);
    
    filterData[column] = value;
    filterTable();
}

// Filter table based on filter inputs
function filterTable() {
    const rows = elements.tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let visible = true;

        for (const [colIndex, filterValue] of Object.entries(filterData)) {
            if (!filterValue) continue;

            const cell = cells[colIndex];
            const cellText = (cell?.innerText || '').toLowerCase();

            if (!cellText.includes(filterValue.toLowerCase())) {
                visible = false;
                break;
            }
        }
        row.style.display = visible ? '' : 'none';
    });
}

function showEmptyState(show) {
    elements.emptyState.style.display = show ? 'block' : 'none';
}
