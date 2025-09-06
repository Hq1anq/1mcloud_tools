import { getSelectedRows, columnMap } from '/javascript/components/table.js';
import { showToast } from '/javascript/components/toaster.js';
import { str2date, date2str } from './table.js'; 

const elements = {
    container: document.getElementById('renewContainer'),
    dialog : document.getElementById('renewDialog'),
    selectedProxiesRenew : document.getElementById('selectedProxiesRenew'),
    selectedCountRenew : document.getElementById('selectedCountRenew'),
    cancelRenew : document.getElementById('cancelRenew')
}

export function showRenewDialog() {
    const selectedRows = getSelectedRows();

    if (selectedRows.length === 0) {
        showToast('Select at least one row to Renew.', 'info');
        return;
    }

    selectedRows.forEach(row => {
        // Build row
        const tr = document.createElement("tr");
        tr.classList.add('hover:bg-bg-hover');
        
        const indexes = [columnMap.ip_port, columnMap.country, columnMap.type, columnMap.expired, columnMap.status, columnMap.note];

        indexes.forEach(i => {
            const td = row.cells[i].cloneNode(true); // clone existing cell
            if (i === columnMap.type) td.innerText = td.innerText.split('Proxy')[0].trim(); // type
            if (i === columnMap.expired) {
                const date = str2date(td.innerText);
                date.setDate(date.getDate() + 30);
                const newExpired = date2str(date);
                td.innerText = newExpired; // new expiry date
            }
            td.classList.remove('hidden');
            tr.appendChild(td);
        });

        elements.selectedProxiesRenew.appendChild(tr);
    });

    // Update count
    elements.selectedCountRenew.innerText = selectedRows.length;

    // Show dialog
    elements.container.classList.remove("hidden");
    setTimeout(() => {
        elements.dialog.classList.remove("scale-90", "opacity-0");
        elements.dialog.classList.add("scale-100", "opacity-100");
    }, 10);

    elements.cancelRenew.addEventListener("click", closeRenewDialog);
};

export function closeRenewDialog() {
    elements.dialog.classList.remove("scale-100", "opacity-100");
    elements.dialog.classList.add("scale-90", "opacity-0");
    setTimeout(() => {
        elements.container.classList.add("hidden");
        elements.selectedProxiesRenew.innerHTML = "";
    }, 300);
}