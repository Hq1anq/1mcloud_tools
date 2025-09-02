import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export async function getData(req, res) {
    const url = 'https://api.smartserver.vn/api/server/list';
    try {
        const { ips, amount, apiKey } = req.body;

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
            limit: amount || 200,
            by_status: '',
            by_time: 'all',
            by_created: '',
            keyword: '',
            ips: ips || '',
            proxy: 'true',
        });

        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok || response.status !== 200) {
            console.error('❌ Request failed:', response.status);
            return res.status(response.status).json({ error: 'getData Request failed' });;
        }

        const json = await response.json();
        const servers = json.servers || [];

        const data = servers.map(server => ({
            sid: server.server_id,
            ip_port: server.ip_port,
            country: server.country,
            type: server.he_dieu_hanh,
            created: server.ngay_mua,
            expired: server.het_han,
            ip_changed: server.change_ip_time,
            status: server.trang_thai,
            note: server.note
        }));

        return res.json({ data });

    } catch (err) {
        console.error('❌ Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export async function changeIp(req, res) {
    const { ip, custom_info, apiKey, type = 'proxy_https' } = req.body;

    const url = 'https://api.smartserver.vn/api/server/change-ip';

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': `Bearer ${apiKey || process.env.API_KEY}`,
        'content-type': 'application/json',
        'origin': 'https://manage.1mcloud.vn',
        'referer': 'https://manage.1mcloud.vn/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    };

    let data;
    if (custom_info) {
        const list_info = custom_info.split(':');
        if (list_info.length < 4)
            return res.status(400).json({ 
                success: false,
                error: 'Invalid format. Expected: range_ip:remote_port:username:password',
                ip 
            });

        data = {
            ip: ip,
            proxy_type: type,
            range_ip: list_info[0],
            random_password: false,
            random_remote_port: false,
            password: list_info[3],
            remote_port: parseInt(list_info[1]),
            isp: 'Ngẫu nhiên',
        };
    } else {
        data = {
            ip: ip,
            os_id: 0,
            proxy_type: type,
            range_ip: 'Ngẫu nhiên',
            random_password: true,
            random_remote_port: true,
            isp: 'Ngẫu nhiên',
        };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error(`❌ Failed to CHANGE IP for ${ip}:`, response.status);
            return res.status(response.status).json({ 
                success: false,
                error: 'CHANGE IP request failed',
                ip 
            });
        }

        const rawData = await response.json();
        return res.json({ 
            success: true,
            proxyInfo: [
                rawData.new_ip,
                rawData.remote_port,
                rawData.username,
                rawData.password
            ],
            type: type
        });
    } catch (error) {
        console.error(`❌ Failed to CHANGE IP for ${ip}`, error.response?.data || error.message);
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            ip 
        });
    }
};

export async function reinstall(req, res) {
    const { sid, custom_info, apiKey, type = "proxy_https" } = req.body;

    const url = "https://api.smartserver.vn/api/server/reinstall";

    let data;
    if (custom_info) {
        let range_ip, remote_port, username, password;
        const reinstallInfo = custom_info.split(":");
        if (reinstallInfo.length === 4) {
            [range_ip, remote_port, username, password] = reinstallInfo;
        } else if (reinstallInfo.length === 3) {
            [remote_port, username, password] = reinstallInfo;
        } else {
            return res.status(400).json({ error: 'Invalid custom_info format. Expected format: range_ip:remote_port:username:password or remote_port:username:password' });
        }
        data = {
            "random_remote_port": "",
            "remote_port": remote_port,
            "random_username": "",
            "username": username,
            "random_password": "",
            "password": password,
            "type": type,
            "sid": sid
        };
    } else {
        data = {
            random_remote_port: "on",
            remote_port: "",
            random_username: "on",
            username: "",
            random_password: "on",
            password: "",
            type: type,
            sid: sid
        };
    }

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': `Bearer ${apiKey || process.env.API_KEY}`,
        'content-type': 'application/json',
        'origin': 'https://manage.1mcloud.vn',
        'referer': 'https://manage.1mcloud.vn/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error(`❌ Failed to REINSTALL for sid ${sid}:`, response.status);
            return res.status(response.status).json({ 
                success: false,
                error: 'REINSTALL request failed',
                ip 
            });
        }

        const rawData = await response.json();
        return res.json({ 
            success: true,
            proxyInfo: [
                rawData.ip,
                rawData.remote_port,
                rawData.username,
                rawData.password
            ],
            type: type
        });
    } catch (error) {
        console.error(`❌ Failed to REINSTALL for sid: ${sid}`, error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            sid
        });
    }
}

export async function pause(req, res) {
    const { sids, apiKey } = req.body;
    
    const url = "https://api.smartserver.vn/api/server/pause"

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': `Bearer ${apiKey || process.env.API_KEY}`,
        'content-type': 'application/json',
        'origin': 'https://manage.1mcloud.vn',
        'referer': 'https://manage.1mcloud.vn/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ sid: sids })
        });

        if (!response.ok) {
            console.error(`❌ Failed to PAUSE for sids: ${sids}:`, response.status);
            return res.status(response.status).json({ 
                success: false, 
                error: 'Request failed', 
                sids 
            });
        }

        const data = await response.json();
        // Return the actual response data for better client-side handling
        res.json({ 
            success: true,
            result: data.result
        });
    } catch (error) {
        console.error(`❌ Failed to PAUSE for sid: ${sids}`, error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error', 
            sids 
        });
    }
}

export async function reboot(req, res) {
    const { sids, apiKey } = req.body;
    
    const url = "https://api.smartserver.vn/api/server/reboot"

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': `Bearer ${apiKey || process.env.API_KEY}`,
        'content-type': 'application/json',
        'origin': 'https://manage.1mcloud.vn',
        'referer': 'https://manage.1mcloud.vn/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ sid: sids })
        });

        if (!response.ok) {
            console.error(`❌ Failed to REBOOT for sids: ${sids}:`, response.status);
            return res.status(response.status).json({ 
                success: false, 
                error: 'Request failed', 
                sids 
            });
        }

        const data = await response.json();
        // Return the actual response data for better client-side handling
        res.json({ 
            success: true,
            result: data.result
        });
    } catch (error) {
        console.error(`❌ Failed to REBOOT for sid: ${sids}`, error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error', 
            sids 
        });
    }
}

export async function changeNote(req, res) {
    const { sid, newNote, apiKey } = req.body;
    
    const url = "https://api.smartserver.vn/api/server/info/note"

    const headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'authorization': `Bearer ${apiKey || process.env.API_KEY}`,
        'content-type': 'application/json',
        'origin': 'https://manage.1mcloud.vn',
        'referer': 'https://manage.1mcloud.vn/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    };

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                sid: sid,
                note: newNote
            })
        });

        if (!response.ok) {
            console.log(`❌ Failed to CHANGE NOTE for sid: ${sid}: `, response.status);
            return res.status(response.status).json({ 
                success: false, 
                error: 'Request failed', 
                sid 
            });
        }

        const rawData = await response.json();
        res.json({ success: rawData.result === 'success' });
    } catch (error) {
        console.error(`❌ Failed to CHANGE NOTE for sid: ${sid}`, error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error', 
            sid
        });
    }
}