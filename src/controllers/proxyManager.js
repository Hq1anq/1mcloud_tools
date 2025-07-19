import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export async function getData(req, res) {
    const url = 'https://api.smartserver.vn/api/server/list';
    try {
        const { ipString, amountString, apiKey } = req.body;

        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
            'authorization': `Bearer ${apiKey || process.env.API_KEY}`,
            'content-type': 'application/json',
            'origin': 'https://manage.1mcloud.vn',
            'referer': 'https://manage.1mcloud.vn/',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        };

        const params = new URLSearchParams({
            page: 1,
            limit: +amountString || 200,
            by_status: '',
            by_time: 'using',
            by_created: '',
            keyword: '',
            ips: ipString || '',
            proxy: 'true',
        });

        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            console.error('❌ Request failed:', response.status);
            return res.status(response.status).json({ error: 'Request failed' });
        }

        const json = await response.json();
        const servers = json.servers || [];

        const data = servers.map(server => ({
            sid: server.server_id,
            ip_port: server.ip_port,
            country: server.country,
            type: server.plan_number,
            from: server.ngay_mua,
            to: server.het_han,
            changed_ip: server.change_ip_time,
            status: server.trang_thai,
            note: server.note
        }));

        // Optional save to file
        // if (save === true || save === 'true') {
        //     const fs = require('fs');
        //     fs.writeFileSync('data.json', JSON.stringify(data, null, 4), 'utf8');
        //     console.log('✅ Data saved to data.json');
        // }

        return res.json({ data });

    } catch (err) {
        console.error('❌ Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export async function changeIp(req, res) {
    const url = 'https://api.smartserver.vn/api/server/change-ip';
    const { ip, apiKey, type = 'proxy_https' } = req.body;

    // const proxyInfo = [
    //     ip,
    //     apiKey,
    //     type
    // ];

    // await delay(2000);
    
    // return res.status(500).json({ error: 'Internal server error' });
    // return res.json({ proxyInfo });

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': `Bearer ${apiKey || process.env.API_KEY}`,
        'content-type': 'application/json',
        'origin': 'https://manage.1mcloud.vn',
        'referer': 'https://manage.1mcloud.vn/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    };

    let data = {
        ip: ip,
        os_id: 0,
        proxy_type: type,
        range_ip: 'Ngẫu nhiên',
        random_password: true,
        random_remote_port: true,
        isp: 'Ngẫu nhiên',
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const rawData = await response.json();
            const proxyInfo = [
                rawData.new_ip,
                rawData.remote_port,
                rawData.username,
                rawData.password
            ];
            return res.json({ proxyInfo });
        } else {
            console.error('❌ Failed to change IP:', response.status);
            return res.status(response.status).json({ error: 'Failed to change IP' });
        }
    } catch (error) {
        console.error('❌ Error while changing IP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

