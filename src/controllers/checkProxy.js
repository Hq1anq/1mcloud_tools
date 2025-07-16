import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

const checkProxy = async (req, res) => {
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

export default checkProxy;