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
    const type = req.query.type || 'http';

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

export async function checkSingleProxy(proxy, type) {
    const test_url = 'https://api.ipify.org?format=json';
    let agent;
    let proxyUrl;

    try {
        if (type === 'socks5') {
            proxyUrl = `socks5://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
            agent = new SocksProxyAgent(proxyUrl);
        } else {
            proxyUrl = `http://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
            agent = new HttpsProxyAgent(proxyUrl);
        }

        const response = await fetch(test_url, { agent, timeout: 8000 });
        if (!response.ok) throw new Error('Bad response');

        return { ...proxy, type, status: 'success' };
    } catch (err) {
        return { ...proxy, type, status: 'fail', error: err.message };
    }
};

export async function checkProxy(req, res) {
    const { proxies, type } = req.body;
        const test_url = 'https://api.ipify.org?format=json';
        if (!proxies) return res.status(400).json({ error: 'No proxies provided' });
        const results = await Promise.all(proxies.map(async (proxy) => {
            let agent;
            let proxyUrl;
            if (type === 'socks5') {
                proxyUrl = `socks5://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
                agent = new SocksProxyAgent(proxyUrl);
            } else {
                proxyUrl = `http://${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@${proxy.ip}:${proxy.port}`;
                agent = new HttpsProxyAgent(proxyUrl);
            }
            try {
                const response = await fetch(test_url, { agent, timeout: 8000 });
                if (!response.ok) throw new Error('Bad response');
                return { ip: proxy.ip, port: proxy.port, username: proxy.username, password: proxy.password, type: type, status: 'success' };
            } catch (err) {
                return { ip: proxy.ip, port: proxy.port, username: proxy.username, password: proxy.password, type: type, status: 'fail', error: err.message };
            }
        }));
        res.json({ results });
}