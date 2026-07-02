export const extractIP = (line) => {
  // Looser regex: grab four groups of digits separated by dots
  const ipv4Candidate = line.match(/\d+\.\d+\.\d+\.\d+/)
  if (!ipv4Candidate) return null

  const ip = ipv4Candidate[0]

  // Validate each octet (0–255)
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  for (let part of parts) {
    const num = Number(part)
    if (num < 0 || num > 255) return null
  }

  return ip
}

// Proxy parser
// Supports: ip:port:user:pass | user:pass@ip:port
export const parseProxy = (raw) => {
  const line = raw.trim()
  if (!line) return null

  let ip, port, username, password

  if (line.includes('@')) {
    // user:pass@ip:port
    const [auth, hostPart] = line.split('@')
    ;[username, password] = auth.split(':')
    ;[ip, port] = hostPart.split(':')
  } else {
    const parts = line.split(':')
    if (parts.length === 4) [ip, port, username, password] = parts
    else if (parts.length === 2) [ip, port] = parts
    else if (parts.length === 1) [ip] = parts
    else return null
  }

  if (!ip) return null
  if (!username || !password) return `${ip}${port ? `:${port}` : ''}`
  return `${ip}:${port}:${username}:${password}`
}

export function str2date(str) {
  const [d, m, y] = str.split('-')
  return new Date(y, m - 1, d)
}

/**
 * Parse a date string formatted as DD-MM-YYYY and return a Date at midnight.
 */
export function parseDDMMYYYY(str) {
  if (!str) return null
  const parts = str.split('-')
  if (parts.length !== 3) return null
  const [dd, mm, yyyy] = parts
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  return isNaN(d.getTime()) ? null : d
}

export function formatInputDate(inputValue) {
  const filterVal = inputValue.trim()
  const now = new Date()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentYear = String(now.getFullYear())

  if (filterVal.length <= 2) {
    const day = filterVal.padStart(2, '0')
    return `${day}-${currentMonth}-${currentYear}`
  } else if (filterVal.length <= 4) {
    const day = filterVal.slice(0, 2).padStart(2, '0')
    const month = filterVal.slice(2).padStart(2, '0')
    return `${day}-${month}-${currentYear}`
  } else if (filterVal.length <= 6) {
    const day = filterVal.slice(0, 2)
    const month = filterVal.slice(2, 4)
    const year = filterVal.slice(4).padStart(2, '0')
    return `${day}-${month}-20${year}`
  } else if (filterVal.length <= 8) {
    const day = filterVal.slice(0, 2)
    const month = filterVal.slice(2, 4)
    const year = filterVal.slice(4)
    return `${day}-${month}-${year}`
  }
}

/**
 * Parse a Vietnamese-formatted price string (e.g. "245.000") to a raw integer.
 * Returns 0 if the string is empty, undefined, or unparseable.
 */
export function parseVND(priceStr) {
  if (!priceStr) return 0
  const raw = String(priceStr).replace(/[^0-9]/g, '')
  return parseInt(raw, 10) || 0
}

/** Format a raw integer back to Vietnamese dot-separated string. */
export function formatVND(n) {
  return Math.round(n).toLocaleString('vi-VN')
}

export function mergeVpsData(data, res) {
  const dataMap = new Map(data.map((row) => [row.sid, row]))

  for (const resRow of res) {
    const existingRow = dataMap.get(resRow.sid)

    // Priority: 1. resRow.user_pass, 2. existingRow.user_pass
    let userPass = resRow.user_pass !== undefined ? resRow.user_pass : existingRow?.user_pass

    // Add default user if missing based on OS
    if (!userPass || !userPass.includes('/')) {
      const os = resRow.he_dieu_hanh || existingRow?.he_dieu_hanh || ''
      const defaultUser = os.toLowerCase().includes('ubuntu')
        ? 'root'
        : os.toLowerCase().includes('win')
          ? 'Administrator'
          : ''
      if (defaultUser) {
        userPass = `${defaultUser}/`
      }
    }

    if (existingRow) {
      // Update all columns from res, but keep user_pass based on priority above
      Object.assign(existingRow, resRow)
      if (userPass !== undefined) {
        existingRow.user_pass = userPass
      }
    } else {
      // New row from res — add to data
      const newRow = { ...resRow }
      if (userPass !== undefined) newRow.user_pass = userPass
      dataMap.set(resRow.sid, newRow)
    }
  }

  return Array.from(dataMap.values())
}

export function mergeProxyData(data, res) {
  const dataMap = new Map(data.map((row) => [row.sid, row]))

  for (const resRow of res) {
    const existingRow = dataMap.get(resRow.sid)
    if (existingRow) {
      // Priority: 1. resRow.user_pass, 2. existingRow.user_pass
      const finalUserPass =
        resRow.user_pass !== undefined ? resRow.user_pass : existingRow.user_pass
      Object.assign(existingRow, resRow)
      if (finalUserPass !== undefined) {
        existingRow.user_pass = finalUserPass
      }
    } else {
      // New row from res — add to data
      dataMap.set(resRow.sid, { ...resRow })
    }
  }

  return Array.from(dataMap.values())
}

/**
 * Filter proxy dataset purely in memory on frontend.
 * Evaluates time (due / expired / using), IP list, and keyword across relevant fields.
 */
export function filterProxyData(proxies, { keyword = '', byTime = 'all', ips = '' } = {}) {
  if (!Array.isArray(proxies) || proxies.length === 0) return []

  let filtered = proxies

  // 1. Filter by time
  if (byTime && byTime !== 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

    filtered = filtered.filter((item) => {
      const expDate = parseDDMMYYYY(item.expired)
      if (!expDate) return false

      const diffInDays = Math.floor((expDate.getTime() - today.getTime()) / 86400000)

      if (byTime === 'due') {
        return diffInDays >= 0 && diffInDays <= 2
      }
      if (byTime === 'expired') {
        return diffInDays < 0
      }
      if (byTime === 'using') {
        return diffInDays >= 0
      }
      return true
    })
  }

  // 2. Filter by ips
  const trimmedIps = ips ? ips.trim() : ''
  if (trimmedIps) {
    const targetIps = trimmedIps
      .split('\n')
      .flatMap((line) => line.split(','))
      .map((s) => extractIP(s).trim())
      .filter(Boolean)

    if (targetIps.length > 0) {
      filtered = filtered.filter((item) => {
        if (!item.ip_port) return false
        const rawIp = item.ip_port.split(':')[0].trim()
        return targetIps.some((targetIp) => item.ip_port.includes(targetIp) || rawIp === targetIp)
      })
    }
  }

  // 3. Filter by keyword
  const trimmedKw = keyword ? keyword.trim().toLowerCase() : ''
  if (trimmedKw) {
    filtered = filtered.filter((item) => {
      const fields = [item.ip_port, item.note, item.country, item.type, item.status]
      return fields.some((val) => typeof val === 'string' && val.toLowerCase().includes(trimmedKw))
    })
  }

  return filtered
}
