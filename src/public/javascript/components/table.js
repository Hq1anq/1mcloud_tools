const elements = {
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

export function addRow(data, includeActions = false) {
    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');

    let rowHTML = `
        <td class="px-4 py-2 border-b border-dark-600">
            <input type="checkbox" class="rowCheckbox w-4 h-4 text-blue-600 rounded">
        </td>
        ${Object.values(data).map(v => `
        <td class="px-4 py-2 border-b border-dark-600">${v}</td>
        `).join('')}
    `;

    if (includeActions) {
        rowHTML += `
        <td class="px-4 py-2 border-b border-dark-600 space-x-2">
            <button class="bg-blue-600 py-1 px-4 rounded-lg hover:bg-blue-700" onclick="editRow(this)">Edit</button>
            <button class="bg-red-600 py-1 px-4 rounded-lg hover:bg-red-700" onclick="deleteRow(this)">Delete</button>
        </td>
        `;
    }

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
}

function updateCounts() {
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
}

export function getSelectedRows() {
    const checkboxes = document.querySelectorAll('.rowCheckbox:checked');
    return Array.from(checkboxes).map(cb => cb.closest('tr'));
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
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updateCounts();
    }
}

function showEmptyState(show) {
    elements.emptyState.style.display = show ? 'block' : 'none';
}