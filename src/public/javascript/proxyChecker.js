import {
  addRow,
  updateCounts,
  initTable,
  clearTable,
  getSelectedRows,
} from "/javascript/components/table.js";
import { showToast, changeToToast } from "/javascript/components/toaster.js";
import { showCopyDialog } from "/javascript/components/copyDialog.js";
// DOM elements
const elements = {
  proxyInput: document.getElementById("proxyInput"),
  deleteBtn: document.getElementById("deleteBtn"),

  proxyType: document.getElementById("proxyTypeSelect-trigger"),
  checkProxiesBtn: document.getElementById("checkProxiesBtn"),

  selectActiveBtn: document.getElementById("selectActiveBtn"),
  selectErrorBtn: document.getElementById("selectErrorBtn"),

  copyIpBtn: document.getElementById("copyIpBtn"),
  copyFullProxyBtn: document.getElementById("copyFullProxyBtn"),

  tableBody: document.getElementById("tableBody"),

  tableWrapper: document.getElementById("table-wrapper"),
  captureBtn: document.getElementById("captureBtn"),
};

// Initialize
function init() {
  bindEvents();
  initTable("proxyChecker");
  insertTestData();
}

function insertTestData() {
  const testData = [
    {
      ip: "192.168.1.1",
      port: "8080",
      username: "user1",
      password: "pass1",
      type: "HTTPS",
      status: "Active",
    },
    {
      ip: "192.168.1.2",
      port: "3128",
      username: "user2",
      password: "pass2",
      type: "SOCKS5",
      status: "Inactive",
    },
    {
      ip: "192.168.1.3",
      port: "80",
      username: "user3",
      password: "pass3",
      type: "HTTPS",
      status: "Active",
    },
    {
      ip: "192.168.1.4",
      port: "1080",
      username: "user4",
      password: "pass4",
      type: "SOCKS5",
      status: "Inactive",
    },
    {
      ip: "192.168.1.5",
      port: "8888",
      username: "user5",
      password: "pass5",
      type: "HTTPS",
      status: "Active",
    },
  ];

  clearTable();
  testData.forEach((data) => addRow(data, true, true));
}

// Bind event listeners
function bindEvents() {
  elements.deleteBtn.addEventListener("click", deleteProxies);
  elements.checkProxiesBtn.addEventListener("click", checkProxies);

  elements.selectActiveBtn.addEventListener(
    "click",
    selectProxies.bind(null, "Active"),
  );
  elements.selectErrorBtn.addEventListener(
    "click",
    selectProxies.bind(null, "Inactive"),
  );

  elements.copyIpBtn.addEventListener("click", copySelectedIPs);
  elements.copyFullProxyBtn.addEventListener("click", copyFullProxies);

  elements.captureBtn.addEventListener("click", captureProxyStatus);
}

// Check proxies
async function checkProxies() {
  clearTable();
  const proxyText = elements.proxyInput.value.trim();

  if (!proxyText) {
    showToast("Enter at least one proxy", "warning");
    return;
  }

  showToast("Checking proxies...", "loading");

  // Parse proxy list
  const proxies = parseProxyList(proxyText);
  const proxyType = elements.proxyType.textContent.trim();

  // Send the proxies via POST
  try {
    await fetch("/proxy/send-proxies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proxies }),
    });
  } catch (err) {
    showToast("Failed to send proxies to server", "error");
    console.error("❌ Failed to send proxies:", err);
    return;
  }

  // Start the stream
  const eventSource = new EventSource(`/proxy/check-stream?type=${proxyType}`, {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    const result = JSON.parse(event.data);
    if (result.done) {
      updateCounts();
      changeToToast("Check proxies DONE", "Checking", "success");
      console.log("✅ All proxies checked. Closing SSE.");
      eventSource.close();
      return;
    }
    addRow(result, true, true);
  };

  eventSource.onerror = (err) => {
    showToast("Check proxies error", "error");
    console.error("SSE error:", err);
    eventSource.close();
  };
}

function selectProxies(status = "Active") {
  const rows = elements.tableBody.rows;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const statusCell = row.cells[6]; // Status is at index 6
    const checkbox = row.cells[0].querySelector("input");
    if (statusCell && checkbox) {
      const statusText = statusCell.textContent.trim();
      checkbox.checked = statusText === status;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

async function copySelectedIPs() {
  const selectedRows = getSelectedRows();

  if (selectedRows.length === 0) {
    showToast("Select at least 1 proxy to COPY", "info");
    return;
  }

  const ips = selectedRows.map((row) => row.cells[1].textContent.trim());
  const ipsText = ips.join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText)
    try {
      await navigator.clipboard.writeText(ipsText);
      showToast(`Copied ${ips.length} IPs to clipboard`, "success");
    } catch (err) {
      console.log("❌ Failed to copy:", err);
      showCopyDialog("List IP", ipsText);
    }
  else {
    console.log("❌ Failed to access clipboard");
    showCopyDialog("List IP", ipsText);
  }
}

async function copyFullProxies() {
  const selectedRows = getSelectedRows();

  if (selectedRows.length === 0) {
    showToast("Select at least 1 proxy to COPY", "info");
    return;
  }

  const proxies = selectedRows.map((row) => {
    const ip = row.cells[1].textContent.trim();
    const port = row.cells[2].textContent.trim();
    const username = row.cells[3].textContent.trim();
    const password = row.cells[4].textContent.trim();
    return `${ip}:${port}:${username}:${password}`;
  });
  const proxiesText = proxies.join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText)
    try {
      await navigator.clipboard.writeText(proxiesText);
      showToast(`Copied ${proxies.length} proxies to clipboard`, "success");
    } catch (err) {
      console.log("❌ Failed to copy:", err);
      showCopyDialog("List Porxy", proxiesText);
    }
  else {
    console.log("❌ Failed to access clipboard");
    showCopyDialog("List Porxy", proxiesText);
  }
}

// Parse proxy list from text
function parseProxyList(text) {
  const lines = text
    .split("\n")
    .filter((line) => line.trim())
    .filter(Boolean);

  const proxies = [];

  for (const line of lines) {
    // Extract possible proxy substrings
    const candidates = extractCandidates(line);

    let parsed = null;
    for (const c of candidates) {
      parsed = parseSingleProxy(c);
      if (parsed) break;
    }

    if (parsed) proxies.push(parsed);
  }

  return proxies;

  function extractCandidates(line) {
    const parts = line.split(/\s+/); // split by whitespace
    return parts.filter((p) => p.includes(":") || p.includes("@"));
  }

  function parseSingleProxy(str) {
    // Format 1: ip:port:username:password
    if (isIPPortUserPass(str)) {
      const [ip, port, username, password] = str.split(":");
      return finalize(ip, port, username, password);
    }

    // Format 2: username:password@ip:port
    if (str.includes("@")) {
      const [auth, addr] = str.split("@");

      if (!auth || !addr) return null;

      const authParts = auth.split(":");
      const addrParts = addr.split(":");

      if (authParts.length !== 2 || addrParts.length !== 2) return null;

      const [username, password] = authParts;
      const [ip, port] = addrParts;

      return finalize(ip, port, username, password);
    }

    return null;
  }

  function isIPPortUserPass(str) {
    return str.split(":").length === 4;
  }

  function finalize(ip, port, username, password) {
    if (!ip || !port || !username || !password) return null;
    if (!/^\d+$/.test(port)) return null;

    return {
      ip,
      port,
      username,
      password,
    };
  }
}

function deleteProxies() {
  elements.proxyInput.value = "";
}

async function captureProxyStatus() {
  const originContainer = document.getElementById("table-container");
  const cloneContainer = originContainer.cloneNode(true);
  const containerHeader = cloneContainer.querySelector("#container-header");
  const rows = cloneContainer.querySelectorAll("tr");

  cloneContainer.className = "fixed bg-body p-3 z-[-10]";

  // Remove filter, button
  containerHeader.innerHTML = `
        <div>
            <h2 class="flex items-center text-lg font-bold sm:text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    class="mr-2 h-10 w-10 flex-shrink-0 fill-none stroke-current stroke-2 ">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4 9L20 9M8 9V20M6.2 20H17.8C18.9201 20 19.4802 20 19.908 19.782C20.2843 19.5903 20.5903 19.2843 20.782 18.908C21 18.4802 21 17.9201 21 16.8V7.2C21 6.0799 21 5.51984 20.782 5.09202C20.5903 4.71569 20.2843 4.40973 19.908 4.21799C19.4802 4 18.9201 4 17.8 4H6.2C5.0799 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.07989 3 7.2V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.07989 20 6.2 20Z" />
                </svg>
                <span class="mb-5">Proxy Status</span>
            </h2>
        </div>`;

  // Header rows
  rows[0].innerHTML = `
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            ip
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            port
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            username
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            password
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            type
        </th>
        <th class="px-6 pt-1 pb-5 text-lg font-bold uppercase">
            status
        </th>
    `;

  for (let i = 1; i < rows.length; i++) {
    rows[i].firstElementChild.remove(); // Remove first checkbox
    for (let j = 2; j < 11; j += 2) {
      rows[i].childNodes[j].className =
        "text-[var(--text-secondary)] text-lg bg-surface text-center border-border border-b px-6 py-1 pb-5";
    }
    rows[i].childNodes[12].classList.add("bg-surface");
    rows[i].childNodes[12].firstElementChild.style.padding = "0 1rem 1rem";
    rows[i].childNodes[12].firstElementChild.style.fontSize = "1.125rem";
  }

  document.body.appendChild(cloneContainer);

  // === Animation: Flash effect ===
  const flash = document.createElement("div");
  flash.className = "flash";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 500);

  // === Animation: Pulse effect on table-container ===
  const originRect = originContainer.getBoundingClientRect();
  originContainer.classList.add("opacity-90");
  originContainer.style.width = "76%";

  setTimeout(() => {
    originContainer.classList.remove("opacity-90");
    originContainer.style.width = "";
  }, 500);

  // Capture with html2canvas
  const captured = await html2canvas(cloneContainer, {
    backgroundColor: window.getComputedStyle(cloneContainer).backgroundColor,
  });

  // standardize width (e.g. always 1080px wide)
  const canvas = resizeCanvas(captured, 1080);

  canvas.toBlob(async (blob) => {
    const url = URL.createObjectURL(blob);
    const filename = "proxyChecker.png";

    // === Animation: Show thumbnail preview of the real captured canvas ===
    const toaster = document.getElementById("toaster");
    const toasterRect = toaster.getBoundingClientRect();
    // Calculate final thumbnail size

    const thumb = document.createElement("div");
    thumb.className =
      "fixed overflow-hidden z-9999 opacity-50 flex justify-center";
    thumb.style.top = originRect.top - 11 + "px";
    thumb.style.right = window.innerWidth - originRect.right - 14 + "px";
    thumb.style.width = originRect.width + 12 + "px";
    thumb.style.transition = "all 0.7s cubic-bezier(0.25, 0.25, 0.25, 1)";
    thumb.innerHTML = `<img src="${url}">`;

    toaster.appendChild(thumb);

    // Force reflow to make sure transition applies
    thumb.getBoundingClientRect();

    requestAnimationFrame(() => {
      thumb.style.top = toasterRect.top + "px";
      thumb.style.right = window.innerWidth - toasterRect.right - 8 + "px";
      thumb.style.width = 20 + "rem";
      thumb.style.opacity = "0.95";
    });

    // After transition ends → move inside toaster
    setTimeout(() => {
      thumb.style.position = "static"; // reset styles for flex layout inside toaster
      thumb.style.top = "";
      thumb.style.right = "";
      thumb.style.transition = "";

      // Convert into toast-like item
      thumb.classList.add("flex", "items-center", "cursor-pointer");

      // Attach click to open full image
      thumb.addEventListener("click", () => window.open(url, "_blank"));

      showToast(
        `Captured proxyStatus<br>
                Saved to clipboard<br>
                <a href="${url}" download="${filename}"
                    class="underline text-blue-300 sm:no-underline sm:hover:underline">
                    Download
                </a>`,
        "success",
      );

      // Auto-hide after 10s like a toast
      setTimeout(() => {
        thumb.classList.add("float-out");
        setTimeout(() => thumb.remove(), 300);
      }, 3000);
    }, 700);

    if (navigator.clipboard && navigator.clipboard.write)
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);

        // optional cleanup: revoke object URL after some seconds
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } catch (err) {
        // 2. If clipboard fails → fallback: auto download
        console.log("❌ Failed to copy image:", err);
        downloadFile(url, filename);
      }
    else {
      console.log("❌ Failed to access clipboard");
      downloadFile(url, filename);
    }
  });

  document.body.removeChild(cloneContainer);
}

function downloadFile(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function resizeCanvas(originalCanvas, targetWidth) {
  const scale = targetWidth / originalCanvas.width;
  const targetHeight = originalCanvas.height * scale;

  const resizedCanvas = document.createElement("canvas");
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;

  const ctx = resizedCanvas.getContext("2d");
  ctx.drawImage(originalCanvas, 0, 0, targetWidth, targetHeight);

  return resizedCanvas;
}

init();
