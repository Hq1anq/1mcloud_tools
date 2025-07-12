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
        const res = await fetch('/proxy/check', {
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