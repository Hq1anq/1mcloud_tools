import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Reader } from "@maxmind/geoip2-node";
import { SocksProxyAgent } from "socks-proxy-agent";
import { parseProxy } from "../utils/formatter.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

//  GeoIP singleton (stored in src/data/)
const MMDB_PATH = path.join(__dirname, "../data/GeoLite2-Country.mmdb");

const CHECK_URL = "http://httpbin.org/ip";
const TIMEOUT = 5000;

let readerPromise = null;

function getReader() {
  if (!readerPromise) {
    readerPromise = Reader.open(MMDB_PATH).catch((err) => {
      console.error("Failed to open GeoIP database:", err.message);
      readerPromise = null;
      return null;
    });
  }
  return readerPromise;
}

// Lookup country
async function lookupCountry(ip) {
  try {
    const reader = await getReader();
    if (!reader) return "Unknown";
    const resp = reader.country(ip);
    return resp.country?.isoCode || "Unknown";
  } catch {
    return "Unknown";
  }
}

// Check a single proxy (HTTP)
function checkHttp(proxy) {
  return new Promise((resolve, reject) => {
    const target = new URL(CHECK_URL);

    const opts = {
      hostname: proxy.ip,
      port: Number(proxy.port),
      path: CHECK_URL,
      method: "GET",
      headers: {
        Host: target.host,
        "User-Agent": "proxy-checker/1.0",
      },
      timeout: TIMEOUT,
    };

    if (proxy.username) {
      const creds = Buffer.from(`${proxy.username}:${proxy.password}`).toString(
        "base64",
      );
      opts.headers["Proxy-Authorization"] = `Basic ${creds}`;
    }

    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve("Active");
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

// Check a single proxy (SOCKS5)
function checkSocks5(proxy) {
  return new Promise((resolve, reject) => {
    const socksUrl = proxy.username
      ? `socks5://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`
      : `socks5://${proxy.ip}:${proxy.port}`;

    const agent = new SocksProxyAgent(socksUrl, { timeout: TIMEOUT });

    const req = http.get(CHECK_URL, { agent, timeout: TIMEOUT }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve("Active");
        } else {
          reject(new Error(`SOCKS5 ${res.statusCode}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
    req.on("error", reject);
  });
}

// Auto-detect: race HTTP and SOCKS5 concurrently
async function checkAuto(proxy) {
  try {
    const result = await Promise.any([
      checkHttp(proxy).then(() => ({ status: "Active", detectedType: "HTTP" })),
      checkSocks5(proxy).then(() => ({
        status: "Active",
        detectedType: "SOCKS5",
      })),
    ]);
    return result;
  } catch {
    // All failed
    return { status: "Inactive", detectedType: "Unknown" };
  }
}

// Check one proxy and return result object
async function checkOne(proxy, raw, proxyType) {
  if (!proxy) {
    return {
      ip: raw,
      port: "",
      username: "",
      password: "",
      type: proxyType.toUpperCase(),
      status: "Inactive",
      country: "Unknown",
    };
  }

  const country = await lookupCountry(proxy.ip);
  let status = "Inactive";
  let resolvedType = proxyType.toUpperCase();

  if (proxyType === "auto") {
    const result = await checkAuto(proxy);
    status = result.status;
    resolvedType = result.detectedType;
  } else if (proxyType === "http") {
    try {
      await checkHttp(proxy);
      status = "Active";
    } catch {
      status = "Inactive";
    }
    resolvedType = "HTTP";
  } else if (proxyType === "socks5") {
    try {
      await checkSocks5(proxy);
      status = "Active";
    } catch {
      status = "Inactive";
    }
    resolvedType = "SOCKS5";
  }

  return {
    ip: proxy.ip,
    port: proxy.port || "",
    username: proxy.username || "",
    password: proxy.password || "",
    type: resolvedType,
    status,
    country,
  };
}

// Concurrency limiter
const MAX_CONCURRENT = 100;

function limitConcurrency(tasks, limit) {
  const results = [];
  let i = 0;

  return new Promise((resolve) => {
    let active = 0;

    function next() {
      while (active < limit && i < tasks.length) {
        const idx = i++;
        active++;
        tasks[idx]().then(
          (val) => {
            results[idx] = { status: "fulfilled", value: val };
            active--;
            if (i >= tasks.length && active === 0) resolve(results);
            else next();
          },
          (err) => {
            results[idx] = { status: "rejected", reason: err };
            active--;
            if (i >= tasks.length && active === 0) resolve(results);
            else next();
          },
        );
      }
    }

    next();
  });
}

// SSE handler — streams each result as it completes
export async function checkProxies(req, res) {
  const { proxies, type = "auto" } = req.body;

  if (!Array.isArray(proxies) || proxies.length === 0)
    return res.status(400).json({ error: "proxies array is required" });

  // Parse all proxies
  const parsed = proxies
    .map((raw) => {
      const proxy = parseProxy(raw);
      if (!proxy) return null;
      return {
        raw,
        proxy,
      };
    })
    .filter(Boolean);

  if (parsed.length === 0)
    return res.status(400).json({ error: "No valid proxies found" });

  const proxyType = type.toLowerCase();

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Check with concurrency limit; each writes to the stream as it finishes
  const tasks = parsed.map(
    ({ raw, proxy }) =>
      () =>
        checkOne(proxy, raw, proxyType).then((result) => {
          res.write(`data: ${JSON.stringify(result)}\n\n`);
        }),
  );

  await limitConcurrency(tasks, MAX_CONCURRENT);
  res.end();
}
