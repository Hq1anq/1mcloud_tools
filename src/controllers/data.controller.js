import Proxy from '../models/proxy.model.js'
import User from '../models/user.model.js'

export async function saveToDb(req, res) {
  try {
    const { proxies: clientData, apiKey } = req.body

    if (!Array.isArray(clientData))
      return res.status(400).json({ error: 'Invalid proxies format' })

    // ----- AUTH -----
    const user = await checkUserApiKey(apiKey)
    if (!user) return res.status(401).json({ error: 'Invalid API key' })

    // ----- Get only this user's proxies -----
    const dbData = await Proxy.find({ owner: user._id }).lean()

    // Convert for fast lookup
    const dbMap = new Map(dbData.map((p) => [p.sid, p]))
    const clientMap = new Map(clientData.map((p) => [p.sid, p]))

    const ops = [] // bulkWrite operations

    let insertCount = 0
    let updateCount = 0
    let deleteCount = 0

    // ------- A. UPDATE OR INSERT -------
    for (const rawClientProxy of clientData) {
      const clientProxy = sanitizeProxy(rawClientProxy)
      const sid = clientProxy.sid
      const dbProxy = dbMap.get(sid)

      if (!dbProxy) {
        // INSERT
        ops.push({
          insertOne: {
            document: { ...clientProxy, owner: user._id },
          },
        })
        insertCount++
      } else {
        // Exists → need merge
        const merged = { ...dbProxy, ...clientProxy }

        delete merged._id // <-- prevent overwriting _id
        delete merged.__v // prevent version overwrite
        delete merged.owner // <-- owner MUST NOT be overwritten

        // Special rule for user_pass
        const hasClientUserPass = !!clientProxy.user_pass
        const hasDbUserPass = !!dbProxy.user_pass

        if (hasClientUserPass && hasDbUserPass)
          // Keep from allData (client)
          merged.user_pass = clientProxy.user_pass
        else if (hasClientUserPass && !hasDbUserPass)
          merged.user_pass = clientProxy.user_pass
        else if (!hasClientUserPass && hasDbUserPass)
          merged.user_pass = dbProxy.user_pass

        // skip update if unchanged
        if (!isEqualObject(merged, dbProxy)) {
          ops.push({
            updateOne: {
              filter: { sid, owner: user._id },
              update: merged,
            },
          })
          updateCount++
        }
      }
    }

    // ------- B. DELETE missing entries -------
    for (const dbProxy of dbData) {
      if (!clientMap.has(dbProxy.sid)) {
        ops.push({
          deleteOne: {
            filter: { sid: dbProxy.sid, owner: user._id },
          },
        })
        deleteCount++
      }
    }

    // ---------- C. RUN BULK WRITE ----------
    if (ops.length > 0) await Proxy.bulkWrite(ops)

    res.json({
      message: 'Database synced successfully',
      inserted: insertCount,
      updated: updateCount,
      deleted: deleteCount,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error during sync' })
  }
}

export async function getFromDb(req, res) {
  try {
    const { apiKey } = req.body

    // ----- AUTH -----
    const user = await checkUserApiKey(apiKey)
    if (!user) return res.status(401).json({ error: 'Invalid API key' })

    const allProxies = await Proxy.find({ owner: user._id })
      .lean()
      .select('-_id -__v -owner') // <--- remove all server-side fields (_owner, _id, __v)
    res.json({ proxies: allProxies })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get proxies' })
  }
}

function sanitizeProxy(proxy) {
  const clean = { ...proxy }
  delete clean._id // <-- REMOVE this
  delete clean.__v
  delete clean.owner // <-- REMOVE this too, only server controls owner
  return clean
}

function isEqualObject(a, b) {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (a[key] !== b[key]) return false
  }
  return true
}

async function checkUserApiKey(apiKey) {
  const checkResponse = await fetch(
    'https://api.smartserver.vn/api/server/list?page=1&limit=1&by_time=all&proxy=true',
    {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        origin: 'https://manage.1mcloud.vn',
        referer: 'https://manage.1mcloud.vn/',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      },
    }
  )

  if (!checkResponse.ok || checkResponse.status !== 200) return null
  const rawData = await checkResponse.json()
  // servers must exist & be non-empty
  if (!rawData.servers || rawData.servers.length === 0) {
    return null
  }
  const checkEmail = rawData.servers[0].client
  if (!checkEmail) return null

  const user = await User.findOne({ email: checkEmail })
  return user
}
