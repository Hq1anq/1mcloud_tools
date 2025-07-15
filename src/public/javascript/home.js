import { addRow, getSelectedRows, selectAllRows, updateCounts } from '/javascript/components/table.js';
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('selectAllCheckbox').addEventListener('change', (e) => {
        selectAllRows(e.target.checked);
    });

    // Example data load
    const sample = [
        { id: 1, email: 'mail', name: 'John Doe', password: 'password123' },
        { id: 2, email: 'example', name: 'Jane Smith', password: 'securepass' }
    ];

    sample.forEach(data => addRow(data));
});