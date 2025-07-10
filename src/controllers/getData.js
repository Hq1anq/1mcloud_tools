import fetch from 'node-fetch';

const getData = async (req, res) => {
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
}

export default getData;