import { getSelectedRows, columnMap } from '/javascript/components/table.js';
import { showToast } from '/javascript/components/toaster.js';

const elements = {
    dialog : document.getElementById('changeIpDialog'),
    selectedProxiesList : document.getElementById('selectedProxiesList'),
    typeProxyChanged: document.getElementById('typeProxyChanged'),
    selectedCountInDialog : document.getElementById('selectedCountInDialog'),
    cancelChangeIp : document.getElementById('cancelChangeIp')
}

export function showChangeIpDialog(proxyType) {
    const selectedRows = getSelectedRows();

    if (selectedRows.length === 0) {
        showToast('Select at least one row to CHANGE IP.', 'info');
        return;
    }

    selectedRows.forEach(row => {
        // Build row
        const tr = document.createElement("tr");
        tr.classList.add('hover:bg-bg-hover');
        
        const indexes = [columnMap.ip_port, columnMap.country, columnMap.type, columnMap.status, columnMap.note];

        indexes.forEach(i => {
            const td = row.cells[i].cloneNode(true); // clone existing cell
            if (i === 4) td.innerText = td.innerText.split('Proxy')[0].trim();
            td.classList.remove('hidden');
            tr.appendChild(td);
        });

        elements.selectedProxiesList.appendChild(tr);
    });

    // Update count
    elements.selectedCountInDialog.innerText = selectedRows.length;
    elements.typeProxyChanged.innerText = proxyType;

    // Show dialog
    elements.dialog.classList.remove("hidden");
    elements.dialog.classList.add("flex");

    elements.cancelChangeIp.addEventListener("click", closeChangeIpDialog);
};

export function closeChangeIpDialog() {
    elements.dialog.classList.add("hidden");
    elements.dialog.classList.remove("flex");
    elements.selectedProxiesList.innerHTML = "";
}