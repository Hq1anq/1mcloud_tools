import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Proxy endpoint for /api/server/list
app.get('/api/server/list', async (req, res) => {
    const { listIp = '', apiKey = '' } = req.query;
    const ipString = listIp;

    const params = {
        page: 1,
        limit: 200,
        by_status: '',
        by_time: 'using',
        by_created: '',
        keyword: '',
        ips: ipString,
        proxy: 'true'
    };

    const url = `https://api.smartserver.vn/api/server/list?${new URLSearchParams(params).toString()}`;
    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': `Bearer ${apiKey || process.env.API_KEY || ''}`,
        'content-type': 'application/json',
        'origin': 'https://manage.1mcloud.vn',
        'referer': 'https://manage.1mcloud.vn/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    };

    try {
        const response = await fetch(url, { method: 'GET', headers });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Proxy authentication check endpoint
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

app.post('/api/proxy/check', async (req, res) => {
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

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
