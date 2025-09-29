import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

let proxyQueue = []; // Store latest received proxies

export function receiveProxies(req, res) {
    proxyQueue = req.body.proxies || [];
    res.status(200).json({ status: 'Proxies received' });
};

export async function startProxyCheckStream(req, res) {
    const type = req.query.type || 'HTTPS';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    // Keep connection alive with a ping every 30 seconds
    const keepAlive = setInterval(() => {
        res.write(':\n\n'); // SSE comment to keep connection alive
    }, 30000);

    // Start checking proxies one by one
    try {
        for (const proxy of proxyQueue) {
            const result = await checkSingleProxy(proxy, type);
            res.write(`data: ${JSON.stringify(result)}\n\n`);
        }

        // Close after all proxies sent
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
        console.error('Error during proxy check:', error);
    } finally {
        clearInterval(keepAlive);
        res.end();
    }
};

async function checkWithType(proxy, type) {
    const test_url = 'https://api.ipify.org?format=json';
    let agent, proxyUrl;

    if (type === 'SOCKS5') {
        proxyUrl = `socks5://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
        agent = new SocksProxyAgent(proxyUrl);
    } else {
        proxyUrl = `http://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
        agent = new HttpsProxyAgent(proxyUrl);
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    
    try {
        const response = await fetch(test_url, { agent, signal: controller.signal });
        if (!response.ok) throw new Error('Bad response');
        return { ...proxy, type: type.toUpperCase(), status: 'Active' };
    } finally {
        clearTimeout(id);
    }
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