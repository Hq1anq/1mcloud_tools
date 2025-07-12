// Feature: Get Servers by IPs
document.getElementById('get-servers').addEventListener('click', async function() {
    const listIp = document.getElementById('ip-list').value
        .split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);
    const apiKey = document.getElementById('api-key').value.trim();
    const params = new URLSearchParams({
        listIp: listIp.join(','),
        apiKey: apiKey
    });
    try {
        const res = await fetch('/server/list?' + params.toString());
        const data = await res.json();
        document.getElementById('response').textContent = JSON.stringify(data.servers || data, null, 2);
    } catch (err) {
        document.getElementById('response').textContent = 'Request failed: ' + err;
    }
});