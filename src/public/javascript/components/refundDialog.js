import { getSelectedRows, columnMap } from '/javascript/components/table.js';
import { showToast } from '/javascript/components/toaster.js';

const elements = {
    container: document.getElementById('refundContainer'),
    dialog : document.getElementById('refundDialog'),
    selectedProxiesRefund : document.getElementById('selectedProxiesRefund'),
    selectedCountRefund : document.getElementById('selectedCountRefund'),
    cancelRefund : document.getElementById('cancelRefund'),

    apiKey: document.getElementById("api-key")
}

export async function showRefundDialog() {
    const selectedRows = getSelectedRows();
    const apiKeyString = elements.apiKey.value.trim();

    if (selectedRows.length === 0) {
        showToast('Select at least one row to REFUND.', 'info');
        return;
    }
    
    // Show dialog
    elements.container.classList.remove("hidden");
    setTimeout(() => {
        elements.dialog.classList.remove("scale-90", "opacity-0");
        elements.dialog.classList.add("scale-100", "opacity-100");
    }, 10);

    elements.cancelRefund.addEventListener("click", closeRefundDialog);

    const sids = selectedRows
        .map((row) => row.cells[columnMap.sid].innerText.trim())
        .join(",");

    const res = await fetch('/proxy/refund-calc', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
			sid: sids,
			apiKey: apiKeyString
		})
    });

    const data = await res.json();
    const refundInfo = data.result?.success;

    selectedRows.forEach(row => {
        // Build row
        const tr = document.createElement("tr");
        tr.classList.add('hover:bg-bg-hover');
        
        const indexes = [columnMap.ip_port, columnMap.country, columnMap.type, columnMap.created, columnMap.expired, columnMap.status, columnMap.note];
        const ip = row.cells[columnMap.ip_port].innerText.split(":")[0];

        indexes.forEach(i => {
            const td = row.cells[i].cloneNode(true); // clone existing cell
            if (i === columnMap.type) td.innerText = td.innerText.split('Proxy')[0].trim();
            if (i === columnMap.created) td.innerText = refundInfo[ip] || "ERROR";
            td.classList.remove('hidden');
            tr.appendChild(td);
        });

        elements.selectedProxiesRefund.appendChild(tr);
    });

    // Update count
    elements.selectedCountRefund.innerText = selectedRows.length;
};

export function closeRefundDialog() {
    elements.dialog.classList.remove("scale-100", "opacity-100");
    elements.dialog.classList.add("scale-90", "opacity-0");
    setTimeout(() => {
        elements.container.classList.add("hidden");
        elements.selectedProxiesRefund.innerHTML = "";
    }, 300);
}