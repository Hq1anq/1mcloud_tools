import { getPool } from "../lib/db.js";
import { getCachedVpsPlans } from "../services/cache.service.js";
import { resolveUser } from "../services/user.service.ts";
import { encrypt, decrypt } from "../services/crypto.service.ts";
import {
  encryptPayload,
  decryptPayload,
  isPayloadEncrypted,
} from "../services/payloadCrypto.service.ts";
import { syncUserData } from "../services/sync.service.ts";

const HEADERS = {
  accept: "application/json, text/plain, */*",
  "content-type": "application/json",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

export async function getVpsPlan(req, res) {
  const { plan } = req.query;
  if (!plan) {
    return res.status(400).json({
      success: false,
      error: "Plan is required",
    });
  }

  if (!req.token) {
    const cachedPlans = getCachedVpsPlans(plan);
    return res.json({ success: true, info: cachedPlans || [] });
  }

  const url = `${process.env.BASE_URL}/plan/vps`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  const params = new URLSearchParams({
    region: plan,
  });

  try {
    const response = await fetch(
      `${plan === "gpu" ? `${process.env.BASE_URL}/plan/gpu` : url + "?" + params.toString()}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      console.error(`Failed to GET VPS PLAN:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "GET VPS PLAN request failed",
      });
    }

    const data = await response.json();
    return res.json({ success: true, info: data });
  } catch (error) {
    console.error("Failed to GET VPS PLAN", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

export async function support(req, res) {
  const url = `${process.env.BASE_URL}/server/vps/support`;
  const { plan_id } = req.query;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  const params = new URLSearchParams({
    plan_id: plan_id,
  });

  try {
    const response = await fetch(
      `${plan_id === "gpu" ? `${process.env.BASE_URL}/server/gpu/support` : url + "?" + params.toString()}`,
      {
        method: "GET",
        headers,
      },
    );

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

export async function supportOs(req, res) {
  const url = `${process.env.BASE_URL}/server/vps/support/os`;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
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

/**
 * GET /api/vps — Load all VPS rows for the authenticated user
 */
export async function getVpsList(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const pool = await getPool();

    const result = await pool
      .request()
      .input("userId", userId)
      .query(
        `SELECT sid, plan_number, ip_port, user_pass, country, he_dieu_hanh, price_vnd, created, expired, status, note, is_auto_renew
         FROM Vps WHERE user_id = @userId`,
      );

    const vpsList = result.recordset.map((v) => {
      const plainPass = v.user_pass ? decrypt(v.user_pass) : null;
      return {
        ...v,
        user_pass: plainPass ? encryptPayload(plainPass) : null,
        is_auto_renew: !!v.is_auto_renew,
      };
    });

    return res.json({ success: true, data: vpsList });
  } catch (error) {
    console.error("❌ getVpsList error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

/**
 * POST /api/vps — Save/upsert VPS rows for the authenticated user
 * Body: { vpsList: [{ sid, plan_number, ip_port, user_pass, country, he_dieu_hanh, price_vnd, created, expired, status, note, is_auto_renew }] }
 */
export async function saveVpsList(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const { vpsList } = req.body;

    if (!Array.isArray(vpsList) || vpsList.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "vpsList array is required" });
    }

    const pool = await getPool();

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const chunkSize = 100;
      for (let i = 0; i < vpsList.length; i += chunkSize) {
        const chunk = vpsList.slice(i, i + chunkSize);
        const request = transaction.request();
        request.input("userId", userId);

        let query = "";
        chunk.forEach((vps, idx) => {
          let plainPass = vps.user_pass;
          if (plainPass && isPayloadEncrypted(plainPass)) {
            plainPass = decryptPayload(plainPass);
          }
          const dbPass = plainPass ? encrypt(plainPass) : null;

          request.input(`sid_${idx}`, vps.sid);
          request.input(`plan_number_${idx}`, vps.plan_number || null);
          request.input(`ip_port_${idx}`, vps.ip_port || null);
          request.input(`user_pass_${idx}`, dbPass);
          request.input(`country_${idx}`, vps.country || null);
          request.input(`he_dieu_hanh_${idx}`, vps.he_dieu_hanh || null);
          request.input(`price_vnd_${idx}`, vps.price_vnd || null);
          request.input(`created_${idx}`, vps.created || null);
          request.input(`expired_${idx}`, vps.expired || null);
          request.input(`status_${idx}`, vps.status || null);
          request.input(`note_${idx}`, vps.note || null);
          request.input(`is_auto_renew_${idx}`, vps.is_auto_renew || false);

          query += `
            MERGE Vps AS target
            USING (SELECT @userId AS user_id, @sid_${idx} AS sid) AS source
            ON target.user_id = source.user_id AND target.sid = source.sid
            WHEN MATCHED THEN
              UPDATE SET
                plan_number = COALESCE(@plan_number_${idx}, target.plan_number),
                ip_port = COALESCE(@ip_port_${idx}, target.ip_port),
                user_pass = COALESCE(@user_pass_${idx}, target.user_pass),
                country = COALESCE(@country_${idx}, target.country),
                he_dieu_hanh = COALESCE(@he_dieu_hanh_${idx}, target.he_dieu_hanh),
                price_vnd = COALESCE(@price_vnd_${idx}, target.price_vnd),
                created = COALESCE(@created_${idx}, target.created),
                expired = COALESCE(@expired_${idx}, target.expired),
                status = COALESCE(@status_${idx}, target.status),
                note = COALESCE(@note_${idx}, target.note),
                is_auto_renew = COALESCE(@is_auto_renew_${idx}, target.is_auto_renew)
            WHEN NOT MATCHED THEN
              INSERT (user_id, sid, plan_number, ip_port, user_pass, country, he_dieu_hanh, price_vnd, created, expired, status, note, is_auto_renew)
              VALUES (@userId, @sid_${idx}, @plan_number_${idx}, @ip_port_${idx}, @user_pass_${idx}, @country_${idx}, @he_dieu_hanh_${idx}, @price_vnd_${idx}, @created_${idx}, @expired_${idx}, @status_${idx}, @note_${idx}, @is_auto_renew_${idx});
          `;
        });
        await request.query(query);
      }

      await transaction.commit();
      return res.json({ success: true, count: vpsList.length });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("❌ saveVpsList error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/vps — Delete VPS rows by sid for the authenticated user
 * Body: { sids: [123, 456, ...] }
 */
export async function deleteVpsList(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const { sids } = req.body;

    if (!Array.isArray(sids) || sids.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "sids array is required" });
    }

    const pool = await getPool();

    const params = sids.map((_, i) => `@sid${i}`).join(",");
    const request = pool.request().input("userId", userId);
    sids.forEach((sid, i) => request.input(`sid${i}`, sid));

    await request.query(
      `DELETE FROM Vps WHERE user_id = @userId AND sid IN (${params})`,
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ deleteVpsList error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

/**
 * POST /api/vps/sync — Synchronize user VPS data from ServerB to local database
 */
export async function syncVps(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const summary = await syncUserData({
      userId,
      userToken: req.token,
      isProxy: false,
    });

    return res.json({
      success: true,
      message: "VPS synchronization completed successfully",
      summary,
    });
  } catch (error) {
    console.error("❌ syncVps error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

export async function upgradePlans(req, res) {
  const url = `${process.env.BASE_URL}/server/upgrade/plans`;
  const { sid } = req.body;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid }),
    });

    if (!response.ok) {
      console.error(`Failed to GET UPGRADE PLANS:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "GET UPGRADE PLANS request failed",
      });
    }

    const data = await response.json();
    return res.json({ success: true, info: data });
  } catch (error) {
    console.error("Failed to GET UPGRADE PLANS", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

export async function upgradeCalculate(req, res) {
  const url = `${process.env.BASE_URL}/server/upgrade/calculate`;
  const { sid, plan_id } = req.body;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid, plan_id }),
    });

    if (!response.ok) {
      console.error(`Failed to UPGRADE CALCULATE:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "UPGRADE CALCULATE request failed",
      });
    }

    const data = await response.json();
    return res.json({ success: true, info: data });
  } catch (error) {
    console.error("Failed to UPGRADE CALCULATE", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

export async function upgrade(req, res) {
  const url = `${process.env.BASE_URL}/server/upgrade`;
  const { sid, plan_id } = req.body;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sid, plan_id }),
    });

    if (!response.ok) {
      console.error(`Failed to UPGRADE:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "UPGRADE request failed",
      });
    }

    const data = await response.json();
    return res.json({ success: true, info: data });
  } catch (error) {
    console.error("Failed to UPGRADE", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}

export async function supportChangeIp(req, res) {
  const url = `${process.env.BASE_URL}/server/change-ip-params`;
  const { ip, isp } = req.query;
  const headers = { ...HEADERS, authorization: `Bearer ${req.token}` };

  const params = new URLSearchParams({
    ip: ip,
  });

  if (isp) params.append("isp", isp);

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to GET CHANGE IP SUPPORT:`, response.status);
      return res.status(response.status).json({
        success: false,
        error: "GET CHANGE IP SUPPORT request failed",
      });
    }

    const data = await response.json();
    return res.json({ success: true, info: data });
  } catch (error) {
    console.error("Failed to GET CHANGE IP SUPPORT", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
}
