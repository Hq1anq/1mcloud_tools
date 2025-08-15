import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

let proxyQueue = []; // Store latest received proxies
let clients = []; // Store active SSE connections

export function receiveProxies(req, res) {
    proxyQueue = req.body.proxies || [];
    res.status(200).json({ status: 'Proxies received' });
};

export async function startProxyCheckStream(req, res) {
    const type = req.query.type || 'HTTPS';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res); // Store client connection

    // Start checking proxies one by one
    for (const proxy of proxyQueue) {
        const result = await checkSingleProxy(proxy, type);
        res.write(`data: ${JSON.stringify(result)}\n\n`);
    }

    // Close after all proxies sent
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
};

async function checkWithType(proxy, type) {
    const test_url = 'https://api.ipify.org?format=json';
    let agent;
    let proxyUrl;

    if (type === 'SOCKS5') {
        proxyUrl = `socks5://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
        agent = new SocksProxyAgent(proxyUrl);
    } else {
        proxyUrl = `http://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
        agent = new HttpsProxyAgent(proxyUrl);
    }

    const response = await fetch(test_url, { agent, timeout: 8000 });
    if (!response.ok) throw new Error('Bad response');
    return { ...proxy, type: type.toUpperCase(), status: 'Active' };
}

export async function checkSingleProxy(proxy, type = 'AUTO DETECT') {
    if (type !== 'AUTO DETECT') {
        try {
            return await checkWithType(proxy, type);
        } catch {
            return { ...proxy, type: type.toUpperCase(), status: 'Inactive' };
        }
    }

    // If auto, run both checks in parallel
    try {
        // Promise.any returns the first fulfilled promise
        return await Promise.any([
            checkWithType(proxy, 'HTTPS'),
            checkWithType(proxy, 'SOCKS5')
        ]);
    } catch {
        // If both failed, Promise.any throws an AggregateError
        return { ...proxy, type: 'AUTO DETECT', status: 'Inactive' };
    }
}