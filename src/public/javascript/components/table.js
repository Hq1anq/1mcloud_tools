export function addRow(data, includeActions = false) {
    const tbody = document.getElementById('proxyTableBody');
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
    updateCounts();
}

export function getSelectedRows() {
    const checkboxes = document.querySelectorAll('.rowCheckbox:checked');
    return Array.from(checkboxes).map(cb => cb.closest('tr'));
}

export function selectAllRows(checked) {
    document.querySelectorAll('.rowCheckbox').forEach(cb => {
        cb.checked = checked;
    });
    updateCounts();
}

export function updateCounts() {
    const total = document.querySelectorAll('#proxyTableBody tr').length;
    const selected = document.querySelectorAll('.rowCheckbox:checked').length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('selectedCount').textContent = selected;
}

// Optional: UI callback
window.editRow = function (button) {
    const row = button.closest('tr');
    alert('Edit row: ' + row.innerText);
}

window.deleteRow = function (button) {
    const row = button.closest('tr');
    row.remove();
    updateCounts();
}
