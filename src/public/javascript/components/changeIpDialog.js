import { getSelectedRows, columnMap } from '/javascript/components/table.js';
import { showToast } from '/javascript/components/toaster.js';

const elements = {
    container: document.getElementById('changeIpContainer'),
    dialog : document.getElementById('changeIpDialog'),
    selectedProxiesChangeIP : document.getElementById('selectedProxiesChangeIP'),
    typeProxyChanged: document.getElementById('typeProxyChanged'),
    selectedCountChangeIp : document.getElementById('selectedCountChangeIp'),
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
            if (i === columnMap.type) td.innerText = td.innerText.split('Proxy')[0].trim();
            td.classList.remove('hidden');
            tr.appendChild(td);
        });

        elements.selectedProxiesChangeIP.appendChild(tr);
    });

    // Update count
    elements.selectedCountChangeIp.innerText = selectedRows.length;
    elements.typeProxyChanged.innerText = proxyType;

    // Show dialog
    elements.container.classList.remove("hidden");
    setTimeout(() => {
        elements.dialog.classList.remove("scale-90", "opacity-0");
        elements.dialog.classList.add("scale-100", "opacity-100");
    }, 10);

    elements.cancelChangeIp.addEventListener("click", closeChangeIpDialog);
};

export function closeChangeIpDialog() {
    elements.dialog.classList.remove("scale-100", "opacity-100");
    elements.dialog.classList.add("scale-90", "opacity-0");
    setTimeout(() => {
        elements.container.classList.add("hidden");
        elements.selectedProxiesChangeIP.innerHTML = "";
    }, 300);
}