
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
        const res = await fetch('http://localhost:3001/api/server/list?' + params.toString());
        const data = await res.json();
        document.getElementById('response').textContent = JSON.stringify(data.servers || data, null, 2);
    } catch (err) {
        document.getElementById('response').textContent = 'Request failed: ' + err;
    }
});

// Feature: Proxy Checker
document.getElementById('check-proxies').addEventListener('click', async function() {
    const proxies = document.getElementById('proxy-list').value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    const proxyType = document.getElementById('proxy-type').value;
    if (!proxies) {
        document.getElementById('response').textContent = 'Please enter at least one proxy.';
        return;
    }
    document.getElementById('response').textContent = 'Checking proxies...';
    try {
        const res = await fetch('http://localhost:3001/api/proxy/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proxies: proxies, type: proxyType })
        });
        const data = await res.json();
        if (data.results) {
            document.getElementById('response').textContent = data.results.map(r => `${r.proxy}: ${r.status}${r.error ? ' (' + r.error + ')' : ''}`).join('\n');
        } else {
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
        }
    } catch (err) {
        document.getElementById('response').textContent = 'Request failed: ' + err;
    }
});