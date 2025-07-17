import { addRow } from '/javascript/components/table.js'
// Feature: Get Servers by IPs
document.getElementById('getDataBtn').addEventListener('click', async function() {
    const ipList = document.getElementById('ip-list').value
        .split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);
    const ipString = ipList.join(',');
    const apiKey = document.getElementById('api-key').value.trim();
    try {
        const response = await fetch('/get-data-from-ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ipString, apiKey })
        });

        const result = await response.json();

        if (response.ok) {
            // Optional: render to table instead of pre
            result.data.forEach(row => addRow(row));
        } else {
            output.textContent = `❌ Error: ${result.error}`;
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
});