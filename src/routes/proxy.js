import express from 'express';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

const router = express.Router();

router.post('/proxy/check', async (req, res) => {
    const { proxies, type } = req.body;
    const test_url = 'https://api.ipify.org?format=json';
    if (!proxies) return res.status(400).json({ error: 'No proxies provided' });
    const results = await Promise.all(proxies.map(async (proxy) => {
        let agent;
        let proxyUrl;
        // Parse ip:port:user:pass
        const parts = proxy.split(':');
        if (parts.length < 4) {
            return { proxy, status: 'fail', error: 'Invalid format (should be ip:port:user:pass)' };
        }
        const [ip, port, username, password] = parts;
        if (type === 'socks5') {
            proxyUrl = `socks5://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${ip}:${port}`;
            agent = new SocksProxyAgent(proxyUrl);
        } else {
            proxyUrl = `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${ip}:${port}`;
            agent = new HttpsProxyAgent(proxyUrl);
        }
        try {
            const response = await fetch(test_url, { agent, timeout: 8000 });
            if (!response.ok) throw new Error('Bad response');
            return { proxy, status: 'success' };
        } catch (err) {
            return { proxy, status: 'fail', error: err.message };
        }
    }));
    res.json({ results });
});

export default router;
