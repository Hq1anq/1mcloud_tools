// Proxy parser
// Supports: ip:port:user:pass | user:pass@ip:port
export function parseProxy(raw: string) {
  const line = raw.trim();
  let ip, port, username, password;

  if (line.includes("@")) {
    // user:pass@ip:port
    const [auth, hostPart] = line.split("@");
    [username, password] = auth.split(":");
    [ip, port] = hostPart.split(":");
  } else {
    const parts = line.split(":");
    if (parts.length === 4) [ip, port, username, password] = parts;
    else if (parts.length === 2) [ip, port] = parts;
    else if (parts.length === 1) [ip] = parts;
    else return null;
  }

  if (!ip || !port || !username || !password) return null;

  return {
    ip,
    port: port || undefined,
    username: username || undefined,
    password: password || undefined,
  };
}

/**
 * Parse a single proxy line formatted as `ip:port:username:password`
 */
export function parseProxyLine(line: string) {
  const parts = line.trim().split(":");
  if (parts.length < 4) return null;

  const ip = parts[0].trim();
  const port = parts[1].trim();
  const username = parts[2].trim();
  const password = parts.slice(3).join(":").trim();

  if (!ip || !port || !username || !password) return null;

  return {
    ip,
    port,
    ip_port: `${ip}:${port}`,
    user_pass: `${username}:${password}`,
    username,
    password,
  };
}

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function parseDateDDMMYYYY(dateStr: string): Date | null {
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const fullYear = year < 100 ? 2000 + year : year;
      return new Date(fullYear, month, day, 0, 0, 0, 0);
    }
  }
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
