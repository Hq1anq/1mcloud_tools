import { getPool } from "../lib/db.js";
import {
  NormalizedSyncItem,
  ServerBListResponse,
  ServerBRawItem,
  SyncResultSummary,
  SyncUserDataOptions,
} from "../types/sync.types.ts";

const HEADERS = {
  accept: "application/json, text/plain, */*",
  "content-type": "application/json",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

/**
 * Fetch raw ServerB data with pagination offset logic.
 */
async function fetchServerBData(
  userToken: string,
  isProxy: boolean,
  amount: number,
): Promise<NormalizedSyncItem[]> {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL environment variable is not defined");
  }

  const url = `${baseUrl}/server/list`;
  const params = new URLSearchParams({
    page: "1",
    limit: String(amount),
    by_status: "",
    by_time: "all",
    by_created: "",
    keyword: "",
    ips: "",
  });

  if (isProxy) {
    params.set("proxy", "true");
  }

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "GET",
    headers: {
      ...HEADERS,
      authorization: `Bearer ${userToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ServerB list data (status: ${response.status})`,
    );
  }

  const json: ServerBListResponse = await response.json();
  const servers: ServerBRawItem[] = json.servers || [];

  return servers.map((server) => {
    return {
      sid: server.server_id,
      plan_number: !isProxy ? server.plan_number || null : undefined,
      ip_port: server.ip_port || null,
      country: server.country || null,
      he_dieu_hanh: !isProxy ? server.he_dieu_hanh || null : undefined,
      type: isProxy ? server.he_dieu_hanh || null : undefined,
      price_vnd: !isProxy ? server.price_vnd || null : undefined,
      created: server.ngay_mua || null,
      expired: server.het_han || null,
      status: server.trang_thai || null,
      note: server.note || null,
      is_auto_renew: !!server.is_auto_renew,
    };
  });
}

/**
 * Main service function to synchronize VPS or Proxy data between ServerB and MSSQL Database.
 */
export async function syncUserData({
  userId,
  userToken,
  isProxy,
}: SyncUserDataOptions): Promise<SyncResultSummary> {
  const pool = await getPool();
  const tableName = isProxy ? "Proxy" : "Vps";

  // 1. Fetch active (non-refunded) records for this user from local DB in 1 single query
  const dbRowsResult = await pool
    .request()
    .input("userId", userId)
    .query(
      `SELECT sid FROM ${tableName} WHERE user_id = @userId AND (status IS NULL OR LOWER(status) <> 'refunded')`,
    );

  const dbRows: Array<{ sid: number }> = dbRowsResult.recordset || [];

  // 2. Total active count is simply the length of dbRows
  const dbActiveCount = dbRows.length;

  // 3. Determine initial amount with offset of 50
  let currentAmount = dbActiveCount + 50;
  let dataB: NormalizedSyncItem[] = [];

  // 4. Paginate from ServerB until returned data length is less than amount
  while (true) {
    dataB = await fetchServerBData(userToken, isProxy, currentAmount);
    if (dataB.length < currentAmount) {
      break;
    }
    currentAmount += 50;
  }

  // 5. Clean up stale non-refunded records in local DB using pre-filtered dbRows
  const serverBSids = new Set(dataB.map((item) => item.sid));
  const trashSids = dbRows
    .filter((row) => !serverBSids.has(row.sid))
    .map((row) => row.sid);

  if (trashSids.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < trashSids.length; i += chunkSize) {
      const chunk = trashSids.slice(i, i + chunkSize);
      const deleteRequest = pool.request().input("userId", userId);
      const sidParams = chunk
        .map((sid, idx) => {
          deleteRequest.input(`sid${idx}`, sid);
          return `@sid${idx}`;
        })
        .join(",");

      await deleteRequest.query(
        `DELETE FROM ${tableName} WHERE user_id = @userId AND sid IN (${sidParams})`,
      );
    }
  }

  // 5. Upsert dataB into local DB (user_pass is strictly excluded from UPDATE SET)
  if (dataB.length > 0) {
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      const chunkSize = 100;
      for (let i = 0; i < dataB.length; i += chunkSize) {
        const chunk = dataB.slice(i, i + chunkSize);
        const request = transaction.request();
        request.input("userId", userId);

        let query = "";
        chunk.forEach((item, idx) => {
          request.input(`sid_${idx}`, item.sid);
          request.input(`ip_port_${idx}`, item.ip_port);
          request.input(`country_${idx}`, item.country);
          request.input(`created_${idx}`, item.created);
          request.input(`expired_${idx}`, item.expired);
          request.input(`status_${idx}`, item.status);
          request.input(`note_${idx}`, item.note);
          request.input(`is_auto_renew_${idx}`, item.is_auto_renew);

          if (isProxy) {
            request.input(`type_${idx}`, item.type);

            query += `
              MERGE Proxy AS target
              USING (SELECT @userId AS user_id, @sid_${idx} AS sid) AS source
              ON target.user_id = source.user_id AND target.sid = source.sid
              WHEN MATCHED THEN
                UPDATE SET
                  ip_port = COALESCE(@ip_port_${idx}, target.ip_port),
                  country = COALESCE(@country_${idx}, target.country),
                  type = COALESCE(@type_${idx}, target.type),
                  created = COALESCE(@created_${idx}, target.created),
                  expired = COALESCE(@expired_${idx}, target.expired),
                  status = COALESCE(@status_${idx}, target.status),
                  note = COALESCE(@note_${idx}, target.note),
                  is_auto_renew = COALESCE(@is_auto_renew_${idx}, target.is_auto_renew)
              WHEN NOT MATCHED THEN
                INSERT (user_id, sid, ip_port, user_pass, country, type, created, expired, status, note, is_auto_renew)
                VALUES (@userId, @sid_${idx}, @ip_port_${idx}, NULL, @country_${idx}, @type_${idx}, @created_${idx}, @expired_${idx}, @status_${idx}, @note_${idx}, @is_auto_renew_${idx});
            `;
          } else {
            request.input(`plan_number_${idx}`, item.plan_number);
            request.input(`he_dieu_hanh_${idx}`, item.he_dieu_hanh);
            request.input(`price_vnd_${idx}`, item.price_vnd);

            query += `
              MERGE Vps AS target
              USING (SELECT @userId AS user_id, @sid_${idx} AS sid) AS source
              ON target.user_id = source.user_id AND target.sid = source.sid
              WHEN MATCHED THEN
                UPDATE SET
                  plan_number = COALESCE(@plan_number_${idx}, target.plan_number),
                  ip_port = COALESCE(@ip_port_${idx}, target.ip_port),
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
                VALUES (@userId, @sid_${idx}, @plan_number_${idx}, @ip_port_${idx}, NULL, @country_${idx}, @he_dieu_hanh_${idx}, @price_vnd_${idx}, @created_${idx}, @expired_${idx}, @status_${idx}, @note_${idx}, @is_auto_renew_${idx});
            `;
          }
        });

        await request.query(query);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  return {
    fetchedFromServerB: dataB.length,
    upsertedToDb: dataB.length,
    deletedFromDb: trashSids.length,
  };
}

/**
 * Automatically triggers syncUserData if 24 hours have passed since last sync or if never synced before.
 */
export async function triggerAutoSyncIfNeeded({
  userId,
  userToken,
  isProxy,
}: SyncUserDataOptions): Promise<SyncResultSummary | null> {
  const pool = await getPool();
  const columnName = isProxy ? "last_proxy_synced_at" : "last_vps_synced_at";

  const userResult = await pool
    .request()
    .input("userId", userId)
    .query(
      `SELECT ${columnName} AS last_synced FROM Users WHERE user_id = @userId`,
    );

  const lastSynced = userResult.recordset[0]?.last_synced;

  if (!process.env.SYNC_COOLDOWN_MS) {
    throw new Error("SYNC_COOLDOWN_MS is not defined in environment variables");
  }

  const COOLDOWN_MS = parseInt(process.env.SYNC_COOLDOWN_MS, 10);
  if (isNaN(COOLDOWN_MS)) {
    throw new Error("SYNC_COOLDOWN_MS environment variable must be a valid number");
  }

  if (lastSynced) {
    const elapsed = Date.now() - new Date(lastSynced).getTime();
    if (elapsed < COOLDOWN_MS) {
      return null;
    }
  }

  // Record sync timestamp to prevent concurrent execution
  await pool
    .request()
    .input("userId", userId)
    .query(
      `UPDATE Users SET ${columnName} = GETDATE() WHERE user_id = @userId`,
    );

  try {
    const summary = await syncUserData({ userId, userToken, isProxy });
    console.log(
      `[AutoSync] ${isProxy ? "Proxy" : "VPS"} sync completed for userId ${userId}:`,
      summary,
    );
    return summary;
  } catch (error: any) {
    console.error(
      `[AutoSync] ${isProxy ? "Proxy" : "VPS"} sync failed for userId ${userId}:`,
      error.message,
    );
    return null;
  }
}
