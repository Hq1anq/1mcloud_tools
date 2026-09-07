import { getCachedProxyPrice } from "../services/cache.service.js";
import { getPool } from "../lib/db.js";
import { resolveUser } from "../services/user.service.ts";
import { mergeProxyData, mergeVpsData } from "../services/merge.service.ts";
import { applyRecordFilters } from "../utils/filter.ts";
import { decrypt } from "../services/crypto.service.ts";
import { encryptPayload } from "../services/payloadCrypto.service.ts";
import { triggerAutoSyncIfNeeded } from "../services/sync.service.ts";

const HEADERS = {
  accept: "application/json, text/plain, */*",
  "content-type": "application/json",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

export async function list(req, res) {
  const url = `${process.env.BASE_URL}/server/list`;
  const {
    ips,
    amount,
    limit,
    page,
    by_status,
    by_time,
    by_created,
    proxy,
    keyword,
  } = req.query;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit || amount) || 200;
  const isProxy = proxy === "true";
  const hasKeyword =
    keyword && typeof keyword === "string" && keyword.trim() !== "";

  // Non-blocking background 24-hour auto sync trigger
  if (req.token) {
    resolveUser(req.token)
      .then((userId) =>
        triggerAutoSyncIfNeeded({ userId, userToken: req.token, isProxy }),
      )
      .catch((err) =>
        console.error("[Manager Controller] AutoSync error:", err.message),
      );
  }

  try {
    // ── BRANCH 2: SEARCHING (Database-only search across all user records) ──
    if (hasKeyword) {
      const userId = await resolveUser(req.token);
      const pool = await getPool();
      let dbRows = [];

      if (isProxy) {
        const dbResult = await pool
          .request()
          .input("userId", userId)
          .query(
            `SELECT sid, ip_port, user_pass, country, type, created, expired, status, note, is_auto_renew FROM Proxy WHERE user_id = @userId`,
          );
        dbRows = dbResult.recordset || [];
      } else {
        const dbResult = await pool
          .request()
          .input("userId", userId)
          .query(
            `SELECT sid, plan_number, ip_port, user_pass, country, he_dieu_hanh, price_vnd, created, expired, status, note, is_auto_renew FROM Vps WHERE user_id = @userId`,
          );
        dbRows = dbResult.recordset || [];
      }

      // 1. Get data2 from database (all data formatted)
      const data2 = dbRows.map((item) => ({
        ...item,
        user_pass: item.user_pass ? decrypt(item.user_pass) : null,
        ...(!isProxy && { type: item.he_dieu_hanh }),
        is_auto_renew: !!item.is_auto_renew,
      }));

      // 2. Filter data2 by by_status, by_time, by_created, ips, keyword, excluding refunded -> data3
      const data3 = applyRecordFilters(data2, {
        by_status,
        by_time,
        by_created,
        ips,
        keyword,
      });

      const totalCount = data3.length;
      const totalRunning = data3.filter(
        (item) => item.status && item.status.toLowerCase() === "running",
      ).length;
      const totalOff = data3.filter(
        (item) => item.status && item.status.toLowerCase() === "off",
      ).length;

      // 3. Paginate data3 using pageNum & limitNum
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedData = data3.slice(startIndex, startIndex + limitNum);

      const payloadData = paginatedData.map((item) => ({
        ...item,
        user_pass: item.user_pass ? encryptPayload(item.user_pass) : null,
      }));

      return res.json({
        data: payloadData,
        total_vps: totalCount,
        total_vps_running: totalRunning,
        total_vps_off: totalOff,
        page: pageNum,
        limit: limitNum,
      });
    }

    // ── BRANCH 1: NO SEARCHING (Current flow: fetch serverA + merge DB user_pass) ──
    const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };
    const params = new URLSearchParams({
      page: String(pageNum),
      limit: String(limitNum),
      by_status: by_status || "",
      by_time: by_time || "all",
      by_created: by_created || "",
      keyword: "",
      ips: ips || "",
    });

    if (isProxy) {
      params.set("proxy", "true");
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok || response.status !== 200) {
      console.error("Request failed:", response.status);
      return res
        .status(response.status)
        .json({ error: "getData Request failed" });
    }

    const json = await response.json();
    const servers = json.servers || [];

    const data = servers.map((server) => ({
      sid: server.server_id,
      ...(!isProxy && { plan_number: server.plan_number }),
      ip_port: server.ip_port,
      country: server.country,
      type: server.he_dieu_hanh,
      ...(!isProxy && { he_dieu_hanh: server.he_dieu_hanh }),
      ...(!isProxy && { price_vnd: server.price_vnd }),
      created: server.ngay_mua,
      expired: server.het_han,
      ip_changed: server.change_ip_time,
      status: server.trang_thai
        ? server.trang_thai.charAt(0).toUpperCase() +
          server.trang_thai.slice(1).toLowerCase()
        : server.trang_thai,
      note: server.note,
      is_auto_renew: !!server.is_auto_renew,
    }));

    let dbRows = [];
    try {
      const userId = await resolveUser(req.token);
      const pool = await getPool();
      if (isProxy) {
        const dbResult = await pool
          .request()
          .input("userId", userId)
          .query(`SELECT sid, user_pass FROM Proxy WHERE user_id = @userId`);
        dbRows = (dbResult.recordset || []).map((row) => ({
          ...row,
          user_pass: row.user_pass ? decrypt(row.user_pass) : null,
        }));
      } else {
        const dbResult = await pool
          .request()
          .input("userId", userId)
          .query(
            `SELECT sid, user_pass, he_dieu_hanh FROM Vps WHERE user_id = @userId`,
          );
        dbRows = (dbResult.recordset || []).map((row) => ({
          ...row,
          user_pass: row.user_pass ? decrypt(row.user_pass) : null,
        }));
      }
    } catch (dbErr) {
      console.error(
        "[Manager Controller] DB lookup skipped/error:",
        dbErr.message,
      );
    }

    const mergedData = isProxy
      ? mergeProxyData(data, dbRows)
      : mergeVpsData(data, dbRows);

    const payloadData = mergedData.map((row) => ({
      ...row,
      user_pass: row.user_pass ? encryptPayload(row.user_pass) : null,
    }));

    return res.json({
      data: payloadData,
      total_vps: json.total_vps,
      total_vps_running: json.total_vps_running,
      total_vps_off: json.total_vps_off,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function support(req, res) {
  const url = `${process.env.BASE_URL}/server/proxy/support`;
  const { nation } = req.query;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  const params = new URLSearchParams({
    nation: nation,
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to GET SUPPORT:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "GET SUPPORT request failed",
      });
    }

    const data = await response.json();
    return res.json({ success: true, info: data });
  } catch (error) {
    console.error("Failed to GET SUPPORT", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

export async function create(req, res) {
  const {
    plan_id,
    duration,
    quantity,
    os_id,
    nation,
    proxy_type,
    random_username,
    random_password,
    random_remote_port,
    username,
    password,
    remote_port,
    range_ip,
    note,
    install_chrome,
    install_firefox,
    isp,
    state,
    coupon,
    auto_renew,
    is_proxy,
    windows_license_key,
  } = req.body;

  const url = `${process.env.BASE_URL}/server/create`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  const payload = {
    plan_id: Number(plan_id),
    duration: Number(duration) || 1,
    quantity: Number(quantity) || 1,
    auto_renew: Boolean(auto_renew),
    os_id: Number(os_id) || 1,
    random_username: Boolean(random_username),
    random_password: Boolean(random_password),
    random_remote_port: Boolean(random_remote_port),
    install_chrome: Boolean(install_chrome),
    install_firefox: Boolean(install_firefox),
    note: note || undefined,
    range_ip: range_ip || "Ngẫu nhiên",
    nation: nation || "VN",
    coupon: coupon || undefined,
    remote_port: random_remote_port ? undefined : remote_port,
    username: random_username ? undefined : username,
    password: random_password ? undefined : password,
    state: state || undefined,
    provider: isp || undefined,
    proxy_type: proxy_type || "proxy_https",
    is_proxy: is_proxy,
    windows_license_key: is_proxy ? undefined : windows_license_key,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to BUY:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "BUY request failed",
      });
    }

    const json = await response.json();
    const servers = json.servers || [];
    const serverType =
      proxy_type === "proxy_https" ? "HTTPS Proxy" : "SOCKS5 Proxy";

    const today = new Date();
    const expiredDate = new Date(today);
    expiredDate.setDate(today.getDate() + Number(duration) * 30);

    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const tableData = servers.map((server) => {
      const rawUserPass = is_proxy
        ? `${server.username}:${server.password}`
        : `${server.username}/${server.password}`;
      return {
        sid: server.id,
        ip_port: `${server.ip}:${server.remote_port}`,
        ...(is_proxy && { country: nation }),
        ...(is_proxy && { type: serverType }),
        created: formatDate(today),
        expired: formatDate(expiredDate),
        ip_changed: 0,
        status: "Running",
        note: note,
        is_auto_renew: auto_renew,
        user_pass: rawUserPass ? encryptPayload(rawUserPass) : null,
      };
    });

    return res.json({
      success: true,
      data: tableData,
    });
  } catch (error) {
    console.error("Failed to BUY PROXY", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function calculate(req, res) {
  const { plan_id, is_proxy, quantity, duration, nation, coupon } = req.body;

  if (!req.token) {
    if (is_proxy && nation) {
      const cached = getCachedProxyPrice(nation);
      if (cached) {
        return res.json({ success: true, info: cached });
      }
    }
    return res.status(401).json({
      success: false,
      error: "Access denied. No token provided.",
    });
  }

  const url = `${process.env.BASE_URL}/server/create/calculate`;

  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        plan_id: plan_id,
        nation: is_proxy ? nation : undefined,
        quantity: quantity,
        duration: duration,
        is_proxy: is_proxy || false,
        coupon: coupon,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to CALC BUY:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "CALC BUY request failed",
      });
    }

    const data = await response.json();
    return res.json({ success: true, info: data });
  } catch (error) {
    console.error("Failed to CALC BUY", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

export async function changeIp(req, res) {
  const url = `${process.env.BASE_URL}/server/change-ip`;
  const {
    ip,
    type,
    random_remote_port,
    random_username,
    random_password,
    remote_port,
    username,
    password,
    isProxy,
    install_chrome,
    install_firefox,
    os_id,
    range_ip,
    isp,
    not_remove_data,
  } = req.body;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  let data = {};

  if (isProxy) {
    data = {
      ip: ip,
      os_id: 0,
      proxy_type: type,
      random_remote_port: random_remote_port,
      random_username: random_username,
      random_password: random_password,
      remote_port: random_remote_port ? undefined : remote_port,
      username: random_username ? undefined : username,
      password: random_password ? undefined : password,
      range_ip: range_ip || "Ngẫu nhiên",
      isp: isp || "Ngẫu nhiên",
    };
  } else {
    data = {
      ip: ip,
      install_chrome: install_chrome,
      install_firefox: install_firefox,
      random_remote_port: random_remote_port,
      random_password: random_password,
      remote_port: random_remote_port ? undefined : remote_port,
      password: random_password ? undefined : password,
      range_ip: range_ip || "Ngẫu nhiên",
      isp: isp || "Ngẫu nhiên",
      not_remove_data: not_remove_data,
    };
    if (os_id !== undefined && os_id !== null && os_id !== "" && !isNaN(Number(os_id))) {
      data.os_id = Number(os_id);
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`Failed to CHANGE IP for ${ip}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "CHANGE IP request failed",
        ip,
      });
    }

    const rawData = await response.json();
    return res.json({
      success: true,
      info: {
        ip: rawData.new_ip,
        port: rawData.remote_port,
        username: rawData.username,
        password: rawData.password,
      },
    });
  } catch (error) {
    console.error(`Failed to CHANGE IP for ${ip}`, error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      ip,
    });
  }
}

export async function reinstall(req, res) {
  const {
    sid,
    type,
    isProxy,
    install_chrome,
    install_firefox,
    os,
    random_remote_port,
    random_username,
    random_password,
    remote_port,
    username,
    password,
  } = req.body;
  const url = `${process.env.BASE_URL}/server/reinstall`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  let data = {};

  if (isProxy) {
    data = {
      random_remote_port: random_remote_port ? "on" : "",
      random_username: random_username ? "on" : "",
      random_password: random_password ? "on" : "",
      remote_port: random_remote_port ? "" : remote_port,
      password: random_password ? "" : password,
      username: random_username ? "" : username,
      type,
      sid,
    };
  } else {
    data = {
      install_chrome,
      install_firefox,
      random_remote_port: random_remote_port ? "on" : "",
      random_password: random_password ? "on" : "",
      remote_port: random_remote_port ? "" : remote_port,
      password: random_password ? "" : password,
      sid: String(sid),
    };
    if (os !== undefined && os !== null && os !== "" && !isNaN(Number(os))) {
      data.os = Number(os);
    }
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`Failed to REINSTALL for sid ${sid}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "REINSTALL request failed",
      });
    }

    const rawData = await response.json();
    return res.json({
      success: true,
      info: {
        ip: rawData.ip,
        port: rawData.remote_port,
        username: rawData.username,
        password: rawData.password,
      },
    });
  } catch (error) {
    console.error(`Failed to REINSTALL for sid: ${sid}`, error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      sid,
    });
  }
}

export async function pause(req, res) {
  const { sids } = req.body;
  const url = `${process.env.BASE_URL}/server/pause`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sids }),
    });

    if (!response.ok) {
      console.error(`Failed to PAUSE for sids: ${sids}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sids,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to PAUSE for sid: ${sids}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sids });
  }
}

export async function reboot(req, res) {
  const { sids } = req.body;
  const url = `${process.env.BASE_URL}/server/reboot`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sids }),
    });

    if (!response.ok) {
      console.error(`Failed to REBOOT for sids: ${sids}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sids,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to REBOOT for sid: ${sids}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sids });
  }
}

export async function renew(req, res) {
  const { sids, month = 1 } = req.body;
  const url = `${process.env.BASE_URL}/server/renew`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sids, month: month }),
    });

    if (!response.ok) {
      console.error(`Failed to RENEW for sids: ${sids}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sids,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to RENEW for sid: ${sids}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sids });
  }
}

export async function renewCalculate(req, res) {
  const { sids, month = 1 } = req.body;
  const url = `${process.env.BASE_URL}/server/renew/calculate`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sids, month: month }),
    });

    if (!response.ok) {
      console.error(
        `Failed to RENEW CALCULATE for sids: ${sids}:`,
        response.status,
      );
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sids,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to RENEW CALCULATE for sid: ${sids}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sids });
  }
}

export async function refund(req, res) {
  const { sid } = req.body;
  const url = `${process.env.BASE_URL}/server/refund`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sid }),
    });

    if (!response.ok) {
      console.error(`Failed to REFUND for sids: ${sid}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sid,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to REFUND for sids: ${sid}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sid });
  }
}

export async function refundCalculate(req, res) {
  const { sid } = req.body;
  const url = `${process.env.BASE_URL}/server/refund/calculate`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sid }),
    });

    if (!response.ok) {
      console.error(
        `Failed to REFUND CALCULATE for sids: ${sid}:`,
        response.status,
      );
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sid,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to REFUND CALCULATE for sids: ${sid}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sids });
  }
}

export async function updateNote(req, res) {
  const { sid, newNote } = req.body;
  const url = `${process.env.BASE_URL}/server/info/note`;
  const headers = {
    ...HEADERS,
    authorization: `Bearer ${req.token}`,
  };

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        sid: sid,
        note: newNote,
      }),
    });

    if (!response.ok) {
      console.log(
        `❌ Failed to CHANGE NOTE for sid: ${sid}: `,
        response.status,
      );
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sid,
      });
    }

    const rawData = await response.json();
    res.json({ success: rawData.result === "success" });
  } catch (error) {
    console.log(error);
    console.error(`Failed to CHANGE NOTE for sid: ${sid}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sid });
  }
}

export async function resetPassword(req, res) {
  const { sids } = req.body;
  const url = `${process.env.BASE_URL}/server/reset-password`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sids }),
    });

    if (!response.ok) {
      console.error(
        `Failed to RESET PASSWORD for sids: ${sids}:`,
        response.status,
      );
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sids,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to RESET PASSWORD for sid: ${sids}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sids });
  }
}

export async function autoFix(req, res) {
  const { sids } = req.body;
  const url = `${process.env.BASE_URL}/server/auto-fix`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sids }),
    });

    if (!response.ok) {
      console.error(`Failed to AUTO FIX for sids: ${sids}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sids,
      });
    }

    const data = await response.json();
    res.json({ success: true, result: data.result });
  } catch (error) {
    console.error(`Failed to AUTO FIX for sid: ${sids}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sids });
  }
}

export async function toggleAutoRenew(req, res) {
  const { sid } = req.body;
  const url = `${process.env.BASE_URL}/server/auto-renew`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid: sid }),
    });

    if (!response.ok) {
      console.error(`Failed to AUTO RENEW for sid: ${sid}:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "Request failed",
        sid,
      });
    }

    const data = await response.json();
    res.json({ success: true, ...data });
  } catch (error) {
    console.error(`Failed to AUTO RENEW for sid: ${sid}`, error.message);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", sid });
  }
}
