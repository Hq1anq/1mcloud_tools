import { getPool } from "../lib/db.js";
import { resolveUser } from "../services/user.service.ts";
import { encrypt, decrypt } from "../services/crypto.service.ts";
import {
  encryptPayload,
  decryptPayload,
  isPayloadEncrypted,
} from "../services/payloadCrypto.service.ts";
import { syncUserData } from "../services/sync.service.ts";

/**
 * GET /api/proxy — Load all proxy rows for the authenticated user
 */
export async function getProxies(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const pool = await getPool();

    const result = await pool
      .request()
      .input("userId", userId)
      .query(
        `SELECT sid, ip_port, user_pass, country, type, created, expired, status, note, is_auto_renew
         FROM Proxy WHERE user_id = @userId`,
      );

    const proxies = result.recordset.map((p) => {
      const plainPass = p.user_pass ? decrypt(p.user_pass) : null;
      return {
        ...p,
        user_pass: plainPass ? encryptPayload(plainPass) : null,
        is_auto_renew: !!p.is_auto_renew,
      };
    });

    return res.json({ success: true, data: proxies });
  } catch (error) {
    console.error("❌ getProxies error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

/**
 * POST /api/proxy — Save/upsert proxy rows for the authenticated user
 * Body: { proxies: [{ sid, ip_port, user_pass, country, type, created, expired, status, note }] }
 */
export async function saveProxies(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const { proxies } = req.body;

    if (!Array.isArray(proxies) || proxies.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "proxies array is required" });
    }

    const pool = await getPool();

    // Use a transaction for batch upsert
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const chunkSize = 100;
      for (let i = 0; i < proxies.length; i += chunkSize) {
        const chunk = proxies.slice(i, i + chunkSize);
        const request = transaction.request();
        request.input("userId", userId);

        let query = "";
        chunk.forEach((proxy, idx) => {
          let plainPass = proxy.user_pass;
          if (plainPass && isPayloadEncrypted(plainPass)) {
            plainPass = decryptPayload(plainPass);
          }
          const dbPass = plainPass ? encrypt(plainPass) : null;

          request.input(`sid_${idx}`, proxy.sid);
          request.input(`ip_port_${idx}`, proxy.ip_port || null);
          request.input(`user_pass_${idx}`, dbPass);
          request.input(`country_${idx}`, proxy.country || null);
          request.input(`type_${idx}`, proxy.type || null);
          request.input(`created_${idx}`, proxy.created || null);
          request.input(`expired_${idx}`, proxy.expired || null);
          request.input(`status_${idx}`, proxy.status || null);
          request.input(`note_${idx}`, proxy.note || null);
          request.input(`is_auto_renew_${idx}`, proxy.is_auto_renew || false);

          query += `
            MERGE Proxy AS target
            USING (SELECT @userId AS user_id, @sid_${idx} AS sid) AS source
            ON target.user_id = source.user_id AND target.sid = source.sid
            WHEN MATCHED THEN
              UPDATE SET
                ip_port = COALESCE(@ip_port_${idx}, target.ip_port),
                user_pass = COALESCE(@user_pass_${idx}, target.user_pass),
                country = COALESCE(@country_${idx}, target.country),
                type = COALESCE(@type_${idx}, target.type),
                created = COALESCE(@created_${idx}, target.created),
                expired = COALESCE(@expired_${idx}, target.expired),
                status = COALESCE(@status_${idx}, target.status),
                note = COALESCE(@note_${idx}, target.note),
                is_auto_renew = COALESCE(@is_auto_renew_${idx}, target.is_auto_renew)
            WHEN NOT MATCHED THEN
              INSERT (user_id, sid, ip_port, user_pass, country, type, created, expired, status, note, is_auto_renew)
              VALUES (@userId, @sid_${idx}, @ip_port_${idx}, @user_pass_${idx}, @country_${idx}, @type_${idx}, @created_${idx}, @expired_${idx}, @status_${idx}, @note_${idx}, @is_auto_renew_${idx});
          `;
        });
        await request.query(query);
      }

      await transaction.commit();
      return res.json({ success: true, count: proxies.length });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("❌ saveProxies error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/proxy — Delete proxy rows by sid for the authenticated user
 * Body: { sids: [123, 456, ...] }
 */
export async function deleteProxies(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const { sids } = req.body;

    if (!Array.isArray(sids) || sids.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "sids array is required" });
    }

    const pool = await getPool();

    // Build parameterized IN clause
    const params = sids.map((_, i) => `@sid${i}`).join(",");
    const request = pool.request().input("userId", userId);
    sids.forEach((sid, i) => request.input(`sid${i}`, sid));

    await request.query(
      `DELETE FROM Proxy WHERE user_id = @userId AND sid IN (${params})`,
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("❌ deleteProxies error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

/**
 * POST /api/proxy/sync — Synchronize user Proxy data from ServerB to local database
 */
export async function syncProxy(req, res) {
  try {
    const userId = await resolveUser(req.token);
    const summary = await syncUserData({
      userId,
      userToken: req.token,
      isProxy: true,
    });

    return res.json({
      success: true,
      message: "Proxy synchronization completed successfully",
      summary,
    });
  } catch (error) {
    console.error("❌ syncProxy error:", error.message);
    return res
      .status(error.status || 500)
      .json({ success: false, error: error.message });
  }
}

