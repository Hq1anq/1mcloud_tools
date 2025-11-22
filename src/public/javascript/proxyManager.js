import {
  displaySorted,
  showAllData,
  addData,
  columnMap,
  getSelectedRows,
  initTable,
  updateRowData,
  updateCounts,
  getStatusChip,
  str2date,
  date2str,
  syncAllData,
  getAllData,
} from "./components/table.js";
import { showToast, changeToToast } from "./components/toaster.js";
import { showCopyDialog } from "./components/copyDialog.js";
import {
  showChangeIpDialog,
  closeChangeIpDialog,
} from "./components/changeIpDialog.js";
import {
  showRefundDialog,
  closeRefundDialog,
} from "./components/refundDialog.js";
import { showBuyDialog, closeBuyDialog } from "./components/buyProxy.js";
import { showRenewDialog, closeRenewDialog } from "./components/renewDialog.js";
import {
  showGetAPIKeyDialog,
  closeAPIKeyDialog,
  showViewKeyDialog,
  setAuthAccount,
  handleViewKey,
} from "./components/getAPIKey.js";
// DOM elements
const elements = {
  table: document.querySelector("table"),

  ipList: document.getElementById("ip-list"),
  amount: document.getElementById("amount"),
  getDataBtn: document.getElementById("getDataBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  textCopyBtn: document.getElementById("textCopyBtn"),

  noteInput: document.getElementById("noteInput"),
  replaceCheckbox: document.getElementById("replaceCheckbox"),
  changeNoteBtn: document.getElementById("changeNoteBtn"),

  reinstallInput: document.getElementById("reinstallInput"),
  reinstallType: document.getElementById("reinstallType-trigger"),
  reinstallBtn: document.getElementById("reinstallBtn"),

  changeIpInput: document.getElementById("changeIpInput"),
  changeIpType: document.getElementById("changeIpType-trigger"),
  changeIpBtn: document.getElementById("changeIpBtn"),
  confirmChangeIp: document.getElementById("confirmChangeIp"),

  buyQuantity: document.getElementById("buyQuantity"),
  buyNote: document.getElementById("buyNote"),
  buyNation: document.getElementById("buyNation-trigger"),
  buyType: document.getElementById("buyType-trigger"),
  buyBtn: document.getElementById("buyBtn"),
  confirmBuy: document.getElementById("confirmBuy"),

  copyIpBtn: document.getElementById("copyIpBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  rebootBtn: document.getElementById("rebootBtn"),

  apiKey: document.getElementById("api-key"),
  getAPIKeyBtn: document.getElementById("getAPIKeyBtn"),
  getKeyBtn: document.getElementById("getKey"),
  passwordInput: document.getElementById("passwordInput"),
  eyeIconAPIKey: document.getElementById("eyeIconAPIKey"),

  refundBtn: document.getElementById("refundBtn"),
  confirmRefund: document.getElementById("confirmRefund"),
  renewBtn: document.getElementById("renewBtn"),
  confirmRenew: document.getElementById("confirmRenew"),
  getInfoBtn: document.getElementById("getInfoBtn"),

  giaHanContainer: document.getElementById("giaHan-container"),
  giaHan1: document.getElementById("giaHan1"),
  giaHan: document.getElementById("giaHan"),
  giaHan2: document.getElementById("giaHan2"),
};

// Initialize
async function init() {
  bindEvents();
  initTable("proxyManager");

  const apiKey = localStorage.getItem("apiKey");

  if (apiKey) {
    const res = await fetch("/get-text-en", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: apiKey }),
    });

    const data = await res.json();
    elements.apiKey.value = data.textEn;
  } else elements.apiKey.value = "";

  elements.ipList.addEventListener("keydown", function (e) {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;

    e.preventDefault();

    const { selectionStart, selectionEnd, value } = elements.ipList;
    const lines = value.split("\n");

    let lineStart = 0;
    let currentLine = 0;

    // Find the current line index
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length + 1; // +1 for '\n'
      if (selectionStart < lineStart + lineLength) {
        currentLine = i;
        break;
      }
      lineStart += lineLength;
    }

    const column = selectionStart - lineStart;

    if (e.key === "ArrowUp" && currentLine > 0) {
      [lines[currentLine - 1], lines[currentLine]] = [
        lines[currentLine],
        lines[currentLine - 1],
      ];
      setNewPosition(currentLine - 1, column);
    } else if (e.key === "ArrowDown" && currentLine < lines.length - 1) {
      [lines[currentLine], lines[currentLine + 1]] = [
        lines[currentLine + 1],
        lines[currentLine],
      ];
      setNewPosition(currentLine + 1, column);
    }

    function setNewPosition(targetLine, column) {
      elements.ipList.value = lines.join("\n");

      let newCursor = 0;
      for (let i = 0; i < targetLine; i++) {
        newCursor += lines[i].length + 1;
      }

      // Clamp column to new line's length
      newCursor += Math.min(column, lines[targetLine].length);

      elements.ipList.selectionStart = elements.ipList.selectionEnd = newCursor;
    }
  });
}

// Bind event listeners
function bindEvents() {
  elements.textCopyBtn.addEventListener("click", async () => {
    const listIp = elements.ipList.value
      .split("\n")
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);
    const numIp = listIp.length;
    const textToCopy = listIp.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText)
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast(
          `Copied <span class='text-text-toast-success'>${numIp}</span> IP to clipboard!`,
          "success",
        );

        // Save original content
        const originalHTML = elements.textCopyBtn.innerHTML;

        // Smooth transition by adding a class
        elements.textCopyBtn.classList.add("float-out");

        setTimeout(() => {
          elements.textCopyBtn.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5"/>
                    </svg>Copied`;
          elements.textCopyBtn.classList.remove("float-out");
          elements.textCopyBtn.classList.add("float-in");
        }, 300);

        // Revert back after 2 seconds
        setTimeout(() => {
          elements.textCopyBtn.classList.add("float-out");
          setTimeout(() => {
            elements.textCopyBtn.innerHTML = originalHTML;
            elements.textCopyBtn.classList.remove("float-out");
            elements.textCopyBtn.classList.add("float-in");
          }, 300);
        }, 1000);
      } catch (err) {
        console.log("❌ Failed to copy:", err);
        showCopyDialog("List IP", textToCopy);
      }
    else {
      console.log("❌ Failed to access clipboard");
      showCopyDialog("List IP", textToCopy);
    }
  });

  elements.copyIpBtn.addEventListener("click", copyIp);
  elements.shuffleBtn.addEventListener("click", shuffleListIp);
  elements.amount.addEventListener("keydown", (event) => {
    if (event.key === "Enter") getData();
  });
  elements.getDataBtn.addEventListener("click", getData);

  elements.changeNoteBtn.addEventListener("click", changeNote);
  elements.reinstallBtn.addEventListener("click", reinstall);

  elements.pauseBtn.addEventListener("click", pause);
  elements.rebootBtn.addEventListener("click", reboot);

  elements.changeIpBtn.addEventListener("click", () => {
    const proxyType = elements.changeIpType.textContent.trim();
    showChangeIpDialog(proxyType);
  });
  elements.confirmChangeIp.addEventListener("click", changeIp);

  elements.refundBtn.addEventListener("click", showRefundDialog);
  elements.confirmRefund.addEventListener("click", refund);

  elements.renewBtn.addEventListener("click", showRenewDialog);
  elements.confirmRenew.addEventListener("click", renew);

  elements.getAPIKeyBtn.addEventListener("click", showGetAPIKeyDialog);
  elements.getKeyBtn.addEventListener("click", getAPIKey);
  elements.passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter")
      if (elements.getKeyBtn.classList.contains("hidden")) handleViewKey();
      else getAPIKey();
  });
  elements.eyeIconAPIKey.addEventListener("click", () => {
    showViewKeyDialog(
      elements.apiKey,
      localStorage.getItem("apiKey"),
      elements.eyeIconAPIKey,
    );
  });

  elements.buyBtn.addEventListener("click", showBuyDialog);
  elements.confirmBuy.addEventListener("click", buyProxy);
  elements.getInfoBtn.addEventListener("click", getInfo);

  elements.giaHan1.addEventListener("click", () => giaHan("tuan"));
  elements.giaHan.addEventListener("click", () => giaHan("auto"));
  elements.giaHan2.addEventListener("click", () => giaHan("2tuan"));
}

async function copyIp() {
  const selectedRows = getSelectedRows();
  if (selectedRows.length === 0) {
    showToast("No IP to copy", "warning");
    return;
  }
  const ipList = selectedRows
    .map((row) =>
      row.cells[columnMap.ip_port]?.textContent.split(":")[0].trim(),
    )
    .filter(Boolean) // remove null/undefined
    .join("\n"); // multi-line string

  if (navigator.clipboard && navigator.clipboard.writeText)
    try {
      await navigator.clipboard.writeText(ipList);
      showToast("Copied IP list to clipboard!", "success");
    } catch (err) {
      console.log("❌ Failed to copy:", err);
      showCopyDialog("List IP", ipList);
    }
  else {
    console.log("❌ Failed to access clipboard");
    showCopyDialog("List IP", ipList);
  }
}

function shuffleListIp() {
  let allLines = [];
  const rawBlocks = elements.ipList.value.split(/\n\s*\n/);
  if (rawBlocks.length === 2) {
    const block1 = rawBlocks[0]
      .split("\n")
      .map((ip) => ip.trim())
      .filter(Boolean)
      .map((ip) => ({ ip, block: 1 }));
    const block2 = rawBlocks[1]
      .split("\n")
      .map((ip) => ip.trim())
      .filter(Boolean)
      .map((ip) => ({ ip: "  " + ip, block: 2 }));
    allLines = [...block1, ...block2];
  } else {
    allLines = rawBlocks[0]
      .split("\n")
      .filter((ip) => ip.length > 0)
      .map((ip) => ({ ip, block: 1 }));
  }

  shuffleArray(allLines);

  elements.ipList.value = allLines.map((line) => line.ip).join("\n");
}

// Fisher-Yates shuffle
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function getAPIKey() {
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  if (!email || !password) {
    showToast("Please enter both email and password", "warning");
    return;
  }

  closeAPIKeyDialog();

  showToast("Getting API Key...", "loading");

  try {
    const response = await fetch("/get-api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      elements.apiKey.value = result.apiKey;
      const res = await fetch("/get-text-en", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.apiKey }),
      });
      const data = await res.json();
      const apiKeyEn = data.textEn;
      localStorage.setItem("apiKey", apiKeyEn);
      setAuthAccount(email, password);
      changeToToast("Get API Key DONE!", "Getting API", "success");
    } else {
      console.log(`❌ Error ${response.status}: ${result.error}`);
      changeToToast("Fail to get API Key", "Getting API", "error");
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Feature: Get Servers by IPs
async function getData() {
  showToast("Getting data...", "loading");
  const ipString = elements.ipList.value
    .split("\n")
    .map((line) => extractIP(line))
    .filter((ip) => ip != 0)
    .join(",");
  const apiKeyString = elements.apiKey.value.trim();
  const amountString = elements.amount.value.trim();

  try {
    const response = await fetch("/getData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ips: ipString,
        amount: +amountString,
        apiKey: apiKeyString,
      }),
    });

    if (response.ok && response.status === 200) {
      const result = await response.json();
      const data = result.data;
      if (data.length > 0) {
        const newData = syncAllData(data);
        if (!ipString) {
          showAllData();
          localStorage.setItem("allData", JSON.stringify(newData));
        } else displaySorted(data);
      }
      changeToToast("Get Data DONE!", "Getting data", "success");
    } else {
      console.log(`❌ Error: ${response.status}`);
      switch (response.status) {
        case 401:
          changeToToast("Wrong API KEY!", "Getting data", "error");
          break;
        case 500:
          changeToToast(
            "Fail to get data, try again!",
            "Getting data",
            "error",
          );
          break;
        default:
          changeToToast(
            `❌ Error: ${response.status}`,
            "Getting data",
            "error",
          );
          break;
      }
    }
  } catch (err) {
    changeToToast("Fail to get data, try again!", "Getting data", "error");
    console.error("Fetch error:", err);
  }
}

async function buyProxy() {
  closeBuyDialog();

  showToast("Buying proxies...", "loading");

  const apiKeyString = elements.apiKey.value.trim();
  const quantityString = elements.buyQuantity.value.trim();
  const nationCode = elements.buyNation.textContent.trim().match(/\((.*)\)/)[1];
  const proxyType =
    elements.buyType.textContent.trim() === "SOCKS5"
      ? "proxy_sock_5"
      : "proxy_https";
  const buyNote = elements.buyNote.value;
  let proxyInfo = [];

  try {
    const response = await fetch("/proxy/buy-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: +quantityString,
        note: buyNote,
        rangeIp: "Ngẫu nhiên",
        nation: nationCode,
        apiKey: apiKeyString,
        type: proxyType,
      }),
    });

    if (response.ok && response.status === 200) {
      const result = await response.json();
      const data = result.data;
      if (data.length > 0) {
        proxyInfo = result.info;
        addData(data);
        showAllData();
      }
      changeToToast(
        `Created <span class="text-text-toast-success">${data.length}</span> proxies`,
        "Buying proxies",
        "success",
      );
    } else {
      console.log(`❌ Error: ${response.status}`);
      switch (response.status) {
        case 401:
          changeToToast("Wrong API KEY!", "Buying proxies", "error");
          break;
        case 500:
          changeToToast(
            "Fail to created proxy, try again!",
            "Buying proxies",
            "error",
          );
          break;
        default:
          changeToToast(
            `❌ Error: ${response.status}`,
            "Buying proxies",
            "error",
          );
          break;
      }
    }
  } catch (err) {
    changeToToast(
      "Fail to created proxy, try again!",
      "Buying proxies",
      "error",
    );
    console.error("Buy proxy, fetch error:", err);
  }

  // ✅ Copy to clipboard if there are any successful proxies
  if (proxyInfo.length > 0) {
    await delay(1000);
    const textToCopy = proxyInfo.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText)
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast("Proxy list copied to clipboard!", "success");
      } catch (err) {
        console.log("❌ Failed to copy to clipboard:", err);
        showCopyDialog("Proxy information", textToCopy);
      }
    else {
      console.log("❌ Failed to access clipboard");
      showCopyDialog("Proxy information", textToCopy);
    }
  }
}

async function changeIp() {
  const selectedRows = getSelectedRows();
  const rowCount = selectedRows.length;

  if (rowCount === 0) {
    showToast("Select at least one row to CHANGE IP", "info");
    return;
  }

  closeChangeIpDialog();

  if (rowCount > 1) showToast(`Changing IP 1/${rowCount}`, "loading");
  else showToast(`Changing IP...`, "loading");

  const proxyLines = []; // collect proxies here
  const apiKeyString = elements.apiKey.value.trim();
  const proxyType =
    elements.changeIpType.textContent.trim() === "SOCKS5"
      ? "proxy_sock_5"
      : "proxy_https";
  const customInfo = elements.changeIpInput.value.trim();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rowCount; i++) {
    const row = selectedRows[i];
    const cells = row.cells;
    if (cells.length < 2) continue;

    // Extract IP from the 'ip_port' column (assumed to be the second column)
    const ipPort = cells[columnMap.ip_port].innerText.trim();
    const ip = ipPort.split(":")[0]; // take only IP part

    if (i > 0)
      changeToToast(
        `Changing IP ${i + 1}/${rowCount}`,
        "Changing IP",
        "loading",
        true,
      );

    try {
      const response = await fetch("/proxy/change-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: ip,
          custom_info: customInfo,
          apiKey: apiKeyString,
          type: proxyType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const proxyString = data.proxyInfo.join(":");
        console.log(`✅ IP changed for ${ip}:`, proxyString);
        proxyLines.push(proxyString);
        updateRowContent(row, data.proxyInfo, "changeIp");
        successCount++;
      } else {
        failCount++;
        if (response.status === 401) {
          changeToToast("Wrong API Key!", "Changing IP", "error");
          return;
        }
        console.error(`Failed to CHANGE IP for ${ip}:`, data.error);
        const checkbox =
          row.children[columnMap.checkbox].querySelector("input");
        checkbox.checked = false;
        row.classList.remove("selected-row");
        row.classList.add("bg-error-cell");
        if (rowCount === 1) {
          changeToToast(`Fail to CHANGE IP ${ip}`, "Changing IP", "error");
          return;
        }
        showToast(`Fail to CHANGE IP ${ip}`, "error");
      }
    } catch (err) {
      failCount++;
      console.error(`Error CHANGE IP for ${ip}:`, err);
      const checkbox = row.children[columnMap.checkbox].querySelector("input");
      checkbox.checked = false;
      row.classList.remove("selected-row");
      row.classList.add("bg-error-cell");
      if (rowCount === 1) {
        changeToToast(`Fail to CHANGE IP ${ip}`, "Changing IP", "error");
        return;
      }
      showToast(`Fail to CHANGE IP ${ip}`, "error");
    }

    // Delay only between rows, not after the last one
    if (rowCount > 1 && i < rowCount - 1) {
      await delay(2000);
    }
  }

  // Show appropriate toast message based on results
  if (failCount === 0)
    changeToToast(
      `IP CHANGE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>`,
      "Changing IP",
      "success",
    );
  else if (successCount === 0)
    changeToToast(
      `IP CHANGE failed for <span class="text-text-toast-error">${failCount}</span> servers`,
      "Changing IP",
      "error",
    );
  else
    changeToToast(
      `IP CHANGE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>, <span class="text-text-toast-error">${failCount} failed</span>`,
      "Changing IP",
      "warning",
    );

  updateCounts();

  // ✅ Copy to clipboard if there are any successful proxies
  if (proxyLines.length > 0) {
    await delay(1000);
    const textToCopy = proxyLines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText)
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast("Proxy list copied to clipboard!", "success");
      } catch (err) {
        console.log("❌ Failed to copy to clipboard:", err);
        showCopyDialog("Ip changed", textToCopy);
      }
    else {
      console.log("❌ Failed to access clipboard");
      showCopyDialog("Ip changed", textToCopy);
    }
  }
}

async function reinstall() {
  const selectedRows = getSelectedRows();
  const rowCount = selectedRows.length;

  if (rowCount === 0) {
    showToast("Select at least one row to REINSTALL", "info");
    return;
  }

  if (rowCount > 1) showToast(`Reinstalling 1/${rowCount}`, "loading");
  else showToast(`Reinstalling...`, "loading");

  const proxyLines = []; // collect proxies here
  const apiKeyString = elements.apiKey.value.trim();
  const proxyType =
    elements.reinstallType.textContent.trim() === "SOCKS5"
      ? "proxy_sock_5"
      : "proxy_https";
  const customInfo = elements.reinstallInput.value.trim();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rowCount; i++) {
    const row = selectedRows[i];
    const cells = row.cells;
    if (cells.length < 2) continue;

    const sid = cells[columnMap.sid].innerText.trim();

    if (i > 0)
      changeToToast(
        `Reinstalling ${i + 1}/${rowCount}`,
        "Reinstalling",
        "loading",
        true,
      );

    try {
      const response = await fetch("/proxy/reinstall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid: sid,
          custom_info: customInfo,
          apiKey: apiKeyString,
          type: proxyType,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const proxyString = data.proxyInfo.join(":");
        console.log(`✅ REINSTALL for sid ${sid}:`, proxyString);
        proxyLines.push(proxyString);
        updateRowContent(row, data.proxyInfo, "reinstall");
        successCount++;
      } else {
        failCount++;
        if (response.status === 401) {
          changeToToast("Wrong API Key!", "Reinstalling", "error");
          return;
        }
        console.error(`Failed to REINSTALL for sid ${sid}:`, data.error);
        const checkbox =
          row.children[columnMap.checkbox].querySelector("input");
        checkbox.checked = false;
        row.classList.remove("selected-row");
        row.classList.add("bg-error-cell");
        if (rowCount === 1) {
          changeToToast(
            `Fail to REINSTALL sid ${sid}`,
            "Reinstalling",
            "error",
          );
          return;
        }
        showToast(`Fail to REINSTALL sid ${sid}`, "error");
      }
    } catch (err) {
      failCount++;
      console.error(`Error REINSTALL for sid ${sid}:`, err);
      const checkbox = row.children[columnMap.checkbox].querySelector("input");
      checkbox.checked = false;
      row.classList.remove("selected-row");
      row.classList.add("bg-error-cell");
      if (rowCount === 1) {
        changeToToast(`Fail to REINSTALL sid ${sid}`, "Reinstalling", "error");
        return;
      }
      showToast(`Fail to REINSTALL sid ${sid}`, "error");
    }

    if (rowCount > 1 && i < rowCount - 1) {
      await delay(2000);
    }
  }

  // Show appropriate toast message based on results
  if (failCount === 0)
    changeToToast(
      `REINSTALL completed <br>
            <span class="text-text-toast-success">${successCount} success</span>`,
      "Reinstalling",
      "success",
    );
  else if (successCount === 0)
    changeToToast(
      `REINSTALL failed for <span class="text-text-toast-error">${failCount}</span> servers`,
      "Reinstalling",
      "error",
    );
  else
    changeToToast(
      `REINSTALL completed <br>
            <span class="text-text-toast-success">${successCount} success</span>, <span class="text-text-toast-error">${failCount} failed</span>`,
      "Reinstalling",
      "warning",
    );

  updateCounts();

  // ✅ Copy to clipboard if there are any successful proxies
  if (proxyLines.length > 0) {
    await delay(1000);
    const textToCopy = proxyLines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText)
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast("Proxy list copied to clipboard!", "success");
      } catch (err) {
        console.log("❌ Failed to copy to clipboard:", err);
        showCopyDialog("Ip Reinstalled", textToCopy);
      }
    else {
      console.log("❌ Failed to access clipboard");
      showCopyDialog("Ip Reinstalled", textToCopy);
    }
  }
}

async function pause() {
  const selectedRows = getSelectedRows();
  if (selectedRows.length === 0) {
    showToast("Select at least one row to PAUSE", "info");
    return;
  }

  showToast("Pausing...", "loading");

  const sids = selectedRows
    .map((row) => row.cells[columnMap.sid].innerText.trim())
    .join(",");
  const apiKeyString = elements.apiKey.value.trim();

  try {
    const response = await fetch("/proxy/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sids: sids, apiKey: apiKeyString }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      // Handle successful and failed pause separately
      const successIds = data.result.success;
      const errorIds = Object.keys(data.result.error);

      selectedRows.forEach((row) => {
        const sid = row.cells[columnMap.sid].innerText.trim();
        if (successIds.includes(Number(sid))) {
          updateRowContent(row, "", "pause");
          row.classList.add("bg-success-cell");
        } else if (errorIds.includes(sid)) {
          showToast(`Fail to PAUSE sid ${sid}`, "error");
          row.classList.add("bg-error-cell");
          console.error(
            `Failed to PAUSE for sid ${sid}:`,
            data.result.error[sid],
          );
        }
      });

      // Show appropriate toast message
      if (errorIds.length === 0)
        changeToToast(
          `PAUSE completed <br> 
					<span class="text-text-toast-success">${successIds.length} success</span>`,
          "Pausing",
          "success",
        );
      else if (successIds.length === 0)
        changeToToast(
          `PAUSE completed <br>
					<span class="text-text-toast-error">${errorIds.length} failed</span>`,
          "Pausing",
          "error",
        );
      else
        changeToToast(
          `PAUSE completed <br>
					<span class="text-text-toast-success">${successIds.length} success</span>, <span class="text-text-toast-error">${errorIds.length} failed</span>`,
          "Pausing",
          "warning",
        );
    } else {
      if (response.status === 401) {
        changeToToast("Wrong API Key!", "Pausing", "error");
        return;
      }
      changeToToast(`Fail to PAUSE`, "Pausing", "error");
      console.error(`Failed to PAUSE for sid ${sid}:`, data.error);
    }
  } catch (err) {
    changeToToast("Fail to PAUSE", "Pausing", "error");
    console.error(`Error PAUSE for sids ${sids}:`, err);
  }

  updateCounts();
}

async function reboot() {
  const selectedRows = getSelectedRows();
  if (selectedRows.length === 0) {
    showToast("Select at least one row to REBOOT", "info");
    return;
  }

  showToast("REBOOT...", "loading");

  const sids = selectedRows
    .map((row) => row.cells[columnMap.sid].innerText.trim())
    .join(",");
  const apiKeyString = elements.apiKey.value.trim();

  try {
    const response = await fetch("/proxy/reboot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sids: sids, apiKey: apiKeyString }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Handle successful and failed reboots separately
      const successIds = data.result.success;
      const errorIds = Object.keys(data.result.error);

      selectedRows.forEach((row) => {
        const sid = row.cells[columnMap.sid].innerText.trim();
        if (successIds.includes(Number(sid))) {
          updateRowContent(row, "", "reboot");
          row.classList.add("bg-success-cell");
        } else if (errorIds.includes(sid)) {
          showToast(`Fail to REBOOT sid: ${sid}`, "error");
          row.classList.add("bg-error-cell");
          console.error(
            `Failed to REBOOT for sid ${sid}:`,
            data.result.error[sid],
          );
        }
      });

      // Show appropriate toast message
      if (errorIds.length === 0)
        changeToToast(
          `Reboot completed <br>
                    <span class="text-text-toast-success">${successIds.length} success</span>`,
          "REBOOT...",
          "success",
        );
      else if (successIds.length === 0)
        changeToToast(
          `Reboot completed <br>
					<span class="text-text-toast-error">${errorIds.length} failed</span>`,
          "REBOOT...",
          "error",
        );
      else
        changeToToast(
          `Reboot completed <br>
                    <span class="text-text-toast-success">${successIds.length} success</span>, <span class="text-text-toast-error">${errorIds.length} failed</span>`,
          "REBOOT...",
          "warning",
        );
    } else {
      if (response.status === 401) {
        changeToToast("Wrong API Key!", "REBOOT...", "error");
        return;
      }
      changeToToast(`Failed to REBOOT: ${data.error}`, "REBOOT...", "error");
      console.error(`Failed to REBOOT:`, data.error);
    }
  } catch (err) {
    changeToToast("Fail to REBOOT", "REBOOT...", "error");
    console.error(`Error REBOOT for sids ${sids}:`, err);
  }

  updateCounts();
}

async function refund() {
  const selectedRows = getSelectedRows();
  if (selectedRows.length === 0) {
    showToast("Select at least one row to REFUND", "info");
    return;
  }

  closeRefundDialog();

  showToast("REFUND...", "loading");

  const sids = selectedRows
    .map((row) => row.cells[columnMap.sid].innerText.trim())
    .join(",");
  const apiKeyString = elements.apiKey.value.trim();

  try {
    const response = await fetch("/proxy/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sids: sids, apiKey: apiKeyString }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      const successIPs = Object.keys(data.result.success);
      const errorIPs = Object.keys(data.result.error);

      selectedRows.forEach((row) => {
        const ip = row.cells[columnMap.ip_port].textContent
          .split(":")[0]
          .trim();
        if (successIPs.includes(ip)) {
          updateRowContent(row, "", "refund");
        } else if (errorIPs.includes(ip)) {
          showToast(`Fail to REFUND ${ip}`, "error");
          row.classList.add("bg-error-cell");
          console.error(`Failed to REFUND ${ip}:`, data.result.error[ip]);
        }
      });

      // Show appropriate toast message
      if (errorIPs.length === 0)
        changeToToast(
          `REFUND completed <br>
					<span class="text-text-toast-success">${successIPs.length} success</span>`,
          "REFUND...",
          "success",
        );
      else if (successIPs.length === 0)
        changeToToast(
          `REFUND completed <br>
					<span class="text-text-toast-error">${errorIPs.length} failed</span>`,
          "REFUND...",
          "error",
        );
      else
        changeToToast(
          `REFUND completed <br>
					<span class="text-text-toast-success">${successIPs.length} success</span>, <span class="text-text-toast-error">${errorIPs.length} failed</span>`,
          "REFUND...",
          "warning",
        );
    } else {
      if (response.status === 401) {
        changeToToast("Wrong API Key!", "REFUND...", "error");
        return;
      }
      changeToToast(`Fail to REFUND`, "REFUND...", "error");
      console.error(`Failed to REFUND for sids ${sids}:`, data.error);
    }
  } catch (err) {
    changeToToast("Fail to REFUND", "REFUND...", "error");
    console.error(`Error REFUND for sids ${sids}:`, err);
  }

  updateCounts();
}

async function renew() {
  const selectedRows = getSelectedRows();
  if (selectedRows.length === 0) {
    showToast("Select at least one row to RENEW", "info");
    return;
  }

  closeRenewDialog();

  showToast("RENEW...", "loading");

  const sids = selectedRows
    .map((row) => row.cells[columnMap.sid].innerText.trim())
    .join(",");
  const apiKeyString = elements.apiKey.value.trim();

  try {
    const response = await fetch("/proxy/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sids: sids,
        month: 1,
        apiKey: apiKeyString,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      const successIPs = Object.keys(data.result.success);
      const errorIPs = Object.keys(data.result.error);

      selectedRows.forEach((row) => {
        const ip = row.cells[columnMap.ip_port].textContent
          .split(":")[0]
          .trim();
        if (successIPs.includes(ip)) {
          updateRowContent(row, "", "renew");
        } else if (errorIPs.includes(ip)) {
          showToast(`Fail to REFUND ${ip}`, "error");
          row.classList.add("bg-error-cell");
          console.error(`Failed to REFUND ${ip}:`, data.result.error[ip]);
        }
      });

      // Show appropriate toast message
      if (errorIPs.length === 0)
        changeToToast(
          `RENEW completed <br>
					<span class="text-text-toast-success">${successIPs.length} success</span>`,
          "RENEW...",
          "success",
        );
      else if (successIPs.length === 0)
        changeToToast(
          `RENEW completed <br>
					<span class="text-text-toast-error">${errorIPs.length} failed</span>`,
          "RENEW...",
          "error",
        );
      else
        changeToToast(
          `RENEW completed <br>
					<span class="text-text-toast-success">${successIPs.length} success</span>, <span class="text-text-toast-error">${errorIPs.length} failed</span>`,
          "RENEW...",
          "warning",
        );
    } else {
      if (response.status === 401) {
        changeToToast("Wrong API Key!", "RENEW...", "error");
        return;
      }
      changeToToast(`Fail to RENEW`, "RENEW...", "error");
      console.error(`Failed to RENEW for sids ${sids}:`, data.error);
    }
  } catch (err) {
    changeToToast("Fail to RENEW", "RENEW...", "error");
    console.error(`Error RENEW for sids ${sids}:`, err);
  }

  updateCounts();
}

async function changeNote() {
  const noteInput = elements.noteInput.value;
  const isReplace = elements.replaceCheckbox.checked;
  const apiKeyString = elements.apiKey.value.trim();

  const selectedRows = getSelectedRows();
  const rowCount = selectedRows.length;
  if (rowCount === 0) {
    showToast("Select at least one row to CHANGE NOTE", "info");
    return;
  }

  if (rowCount > 1) showToast(`Changing Note 1/${rowCount}`, "loading");
  else showToast(`Changing Note...`, "loading");

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rowCount; i++) {
    const row = selectedRows[i];
    const cells = row.cells;
    let newNote;
    if (cells.length < 2) continue;

    // Extract IP from the 'ip_port' column (assumed to be the second column)
    const sid = cells[columnMap.sid].innerText.trim();
    const oldNote = cells[columnMap.note].innerText.trim();

    if (isReplace) newNote = noteInput;
    else {
      const firstSpaceIndex = oldNote.indexOf(" ");
      const suffix = oldNote.slice(firstSpaceIndex + 1);
      newNote = noteInput + suffix;
    }

    if (i > 0)
      changeToToast(
        `Changing Note ${i + 1}/${rowCount}`,
        "Changing Note",
        "loading",
        true,
      );

    try {
      const response = await fetch("/proxy/change-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid: sid,
          newNote: newNote,
          apiKey: apiKeyString,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        successCount++;
        console.log(`✅ CHANGE NOTE for ${sid}`);
        updateRowContent(row, newNote, "changeNote");
      } else {
        failCount++;
        if (response.status === 401) {
          changeToToast("Wrong API Key!", "Changing Note", "error");
          return;
        }
        console.error(`Failed to CHANGE NOTE for sid ${sid}:`, data.error);
        row.classList.add("bg-error-cell");
        if (rowCount === 1) {
          changeToToast(
            `Fail to CHANGE NOTE for ${sid}`,
            "Changing Note",
            "error",
          );
          return;
        }
        showToast(`Failed to CHANGE NOTE for sid ${sid}`, "error");
      }
    } catch (err) {
      failCount++;
      console.error(`Error CHANGE NOTE for sid ${sid}:`, err);
      row.classList.add("bg-error-cell");
      if (rowCount === 1) {
        changeToToast(
          `Fail to CHANGE NOTE for sid ${sid}`,
          "Changing Note",
          "error",
        );
        return;
      }
      showToast(`Failed to CHANGE NOTE for sid ${sid}`, "error");
    }

    if (rowCount > 1 && i < rowCount - 1) {
      await delay(1000);
    }
  }

  // Show appropriate toast message based on results
  if (failCount === 0)
    changeToToast(
      `CHANGE NOTE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>`,
      "Changing Note",
      "success",
    );
  else if (successCount === 0)
    changeToToast(
      `CHANGE NOTE completed <br>
			<span class="text-text-toast-error">${failCount} failed</span>`,
      "Changing Note",
      "error",
    );
  else
    changeToToast(
      `CHANGE NOTE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>, <span class="text-text-toast-error">${failCount} failed</span>`,
      "Changing Note",
      "warning",
    );

  updateCounts();
}

async function giaHan(type = "tuan") {
  const apiKeyString = elements.apiKey.value.trim();

  const selectedRows = getSelectedRows();
  const rowCount = selectedRows.length;
  if (rowCount === 0) {
    showToast("Select at least one row", "info");
    return;
  }

  if (rowCount > 1) showToast(`Changing Note 1/${rowCount}`, "loading");
  else showToast(`Changing Note...`, "loading");

  function calcNewNote(oldNote, addingDate) {
    // Split at the first space to extract the date part
    const [targetStr, ...rest] = oldNote.split(" ");

    // Extract the DDMM part (last 4 characters of targetStr)
    const ddmm = targetStr.slice(-4);
    const day = parseInt(ddmm.slice(0, 2), 10);
    const month = parseInt(ddmm.slice(2, 4), 10);

    // Construct a date assuming current year
    const baseDate = new Date();
    baseDate.setDate(1); // Reset to day 1 to avoid overflow on months
    baseDate.setMonth(month - 1);
    baseDate.setDate(day);

    // Add the days
    baseDate.setDate(baseDate.getDate() + addingDate);

    // Format new date back to DDMM
    const newDay = String(baseDate.getDate()).padStart(2, "0");
    const newMonth = String(baseDate.getMonth() + 1).padStart(2, "0");
    const newDDMM = newDay + newMonth;

    // Count how many * are before the date
    const prefixStars = targetStr.length - 4;

    // Construct new date string with one more '*' and updated DDMM
    const newPrefix = "*".repeat(prefixStars + 1);
    const updatedNote = `${newPrefix}${newDDMM} ${rest.join(" ")}`;

    return updatedNote;
  }

  function getGiaHanType(note) {
    const match = note.match(/([a-zA-Z]+)([12])/);
    return match ? parseInt(match[2], 10) : null;
  }

  let successCount = 0;
  let failCount = 0;
  const logArr = [];

  for (let i = 0; i < rowCount; i++) {
    const row = selectedRows[i];
    const cells = row.cells;
    if (cells.length < 2) continue;

    // Extract IP from the 'ip_port' column (assumed to be the second column)
    const sid = cells[columnMap.sid].innerText.trim();
    const ip = cells[columnMap.ip_port].innerText.split(":")[0].trim();
    const oldNote = cells[columnMap.note].innerText.trim();

    let newNote;
    let typeNum;

    try {
      if (type == "tuan") {
        newNote = calcNewNote(oldNote, 7);
        typeNum = 1;
      } else if (type == "2tuan") {
        newNote = calcNewNote(oldNote, 14);
        typeNum = 2;
      } else if (type == "auto") {
        typeNum = getGiaHanType(oldNote);
        if (typeNum == 2) newNote = calcNewNote(oldNote, 14);
        else if (typeNum == 1) newNote = calcNewNote(oldNote, 7);
        else {
          throw new Error("note not match format");
        }
      } else throw new Error("note not match format");
    } catch (err) {
      console.error(err);
      failCount++;
      row.classList.add("bg-error-cell");
      showToast(`Failed to CHANGE NOTE for sid ${sid}`, "error");
      continue;
    }

    if (i > 0)
      changeToToast(
        `Changing Note ${i + 1}/${rowCount}`,
        "Changing Note",
        "loading",
        true,
      );

    try {
      const response = await fetch("/proxy/change-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sid: sid,
          newNote: newNote,
          apiKey: apiKeyString,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        logArr.push(`${ip} - đã gia hạn ${typeNum == 2 ? "2 " : ""}tuần`);
        successCount++;
        console.log(`✅ CHANGE NOTE for ${sid}`);
        updateRowContent(row, newNote, "changeNote");
      } else {
        failCount++;
        if (response.status === 401) {
          changeToToast("Wrong API Key!", "Changing Note", "error");
          return;
        }
        console.error(`Failed to CHANGE NOTE for sid ${sid}:`, data.error);
        row.classList.add("bg-error-cell");
        if (rowCount === 1) {
          changeToToast(
            `Fail to CHANGE NOTE for ${sid}`,
            "Changing Note",
            "error",
          );
          return;
        }
        showToast(`Failed to CHANGE NOTE for sid ${sid}`, "error");
      }
    } catch (err) {
      failCount++;
      console.error(`Error CHANGE NOTE for sid ${sid}:`, err);
      row.classList.add("bg-error-cell");
      if (rowCount === 1) {
        changeToToast(
          `Fail to CHANGE NOTE for sid ${sid}`,
          "Changing Note",
          "error",
        );
        return;
      }
      showToast(`Failed to CHANGE NOTE for sid ${sid}`, "error");
    }

    if (rowCount > 1 && i < rowCount - 1) {
      await delay(1000);
    }
  }

  // Show appropriate toast message based on results
  if (failCount === 0)
    changeToToast(
      `CHANGE NOTE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>`,
      "Changing Note",
      "success",
    );
  else if (successCount === 0)
    changeToToast(
      `CHANGE NOTE completed <br>
			<span class="text-text-toast-error">${failCount} failed</span>`,
      "Changing Note",
      "error",
    );
  else
    changeToToast(
      `CHANGE NOTE completed <br>
            <span class="text-text-toast-success">${successCount} success</span>, <span class="text-text-toast-error">${failCount} failed</span>`,
      "Changing Note",
      "warning",
    );

  updateCounts();

  if (logArr.length > 0) {
    await delay(1000);

    // Separate logs by type number
    const log2Weeks = logArr.filter((log) => log.includes("2 tuần"));
    const log1Week = logArr.filter((log) => !log.includes("2 tuần"));

    // Build final text conditionally (avoid extra newlines)
    let textToCopy = "";
    if (log2Weeks.length && log1Week.length)
      textToCopy = log2Weeks.join("\n") + "\n\n" + log1Week.join("\n");
    else if (log2Weeks.length) textToCopy = log2Weeks.join("\n");
    else textToCopy = log1Week.join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText)
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast("Gia han logs copied to clipboard!", "success");
      } catch (err) {
        console.log("❌ Failed to copy to clipboard:", err);
        showCopyDialog("Ip Reinstalled", textToCopy);
      }
    else {
      console.log("❌ Failed to access clipboard");
      showCopyDialog("Ip Reinstalled", textToCopy);
    }
  }
}

async function getInfo() {
  const selectedRows = getSelectedRows();
  if (selectedRows.length === 0) {
    showToast("Select at least one row to GET INFO", "info");
    return;
  }

  const allData = getAllData();
  const infoLines = [];

  selectedRows.forEach((row) => {
    const cells = row.cells;
    if (cells.length < 2) return;
    const sid = parseInt(cells[columnMap.sid].innerText.trim(), 10);

    const item = allData.find((obj) => obj.sid === sid);
    if (!item) return;

    const ipPort = item.ip_port;
    const userPass = item.user_pass;

    if (userPass) infoLines.push(`${ipPort}:${userPass}`);
    else infoLines.push(ipPort);
  });

  const nbProxies = infoLines.length;
  if (nbProxies > 0) {
    const textToCopy = infoLines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText)
      try {
        await navigator.clipboard.writeText(textToCopy);
        showToast(
          `<span class="text-text-toast-success">${nbProxies}</span> proxies copied to clipboard!`,
          "success",
        );
      } catch (err) {
        console.log("❌ Failed to copy to clipboard:", err);
        showCopyDialog("Ip Reinstalled", textToCopy);
      }
    else {
      console.log("❌ Failed to access clipboard");
      showCopyDialog("Ip Reinstalled", textToCopy);
    }
  }
}

function updateRowContent(row, text, action) {
  const cells = row.children;
  const id = row.dataset.id;
  const checkbox = cells[columnMap.checkbox].querySelector("input");
  row.classList.add("bg-success-cell");
  if (action === "pause") {
    cells[columnMap.status].innerHTML = getStatusChip("Paused");
    updateRowData(id, { status: "Paused" });
    checkbox.checked = false;
    row.classList.remove("selected-row");
    return;
  }
  if (action === "refund") {
    cells[columnMap.status].innerHTML = getStatusChip("Refunded");
    updateRowData(id, { status: "Refunded" });
    checkbox.checked = false;
    row.classList.remove("selected-row");
    return;
  }
  if (action === "renew") {
    const date = str2date(cells[columnMap.expired].innerHTML);
    date.setDate(date.getDate() + 30);
    const newExpired = date2str(date);
    cells[columnMap.expired].innerHTML = newExpired;
    cells[columnMap.status].innerHTML = getStatusChip("Running");
    updateRowData(id, {
      expired: newExpired,
      status: "Running",
    });
    return;
  }
  if (action === "reboot") {
    cells[columnMap.status].innerHTML = getStatusChip("Running");
    updateRowData(id, { status: "Running" });
    return;
  }
  if (action === "changeNote") {
    const newNote = text;
    cells[columnMap.note].innerText = newNote;
    updateRowData(id, { note: newNote });
    checkbox.checked = false;
    row.classList.remove("selected-row");
    return;
  }
  const newProxy = text;

  // Update ip:port
  cells[columnMap.ip_port].innerText = `${newProxy[0]}:${newProxy[1]}`;

  // Update status to 'Running'
  cells[columnMap.status].innerHTML = getStatusChip("Running");

  // Update 'ip_changed' count if it's changeIp
  if (action === "changeIp") {
    const changeIpType =
      elements.changeIpType.textContent.trim() === "SOCKS5"
        ? "SOCKS5 Proxy"
        : "HTTPS Proxy";
    cells[columnMap.type].innerText = changeIpType;

    const changedCell = cells[columnMap.ip_changed];
    const currentValue = parseInt(changedCell.innerText.trim()) || 0;
    changedCell.innerText = currentValue + 1;

    updateRowData(id, {
      ip_port: `${newProxy[0]}:${newProxy[1]}`,
      type: changeIpType,
      ip_changed: currentValue + 1,
      status: "Running",
      user_pass: `${newProxy[2]}:${newProxy[3]}`,
    });
  } else if (action === "reinstall") {
    const reinstallType =
      elements.reinstallType.textContent.trim() === "SOCKS5"
        ? "SOCKS5 Proxy"
        : "HTTPS Proxy";
    cells[columnMap.type].innerText = reinstallType;
    updateRowData(id, {
      ip_port: `${newProxy[0]}:${newProxy[1]}`,
      type: reinstallType,
      status: "Running",
      user_pass: `${newProxy[2]}:${newProxy[3]}`,
    });
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractIP(str) {
  // Looser regex: grab four groups of digits separated by dots
  const ipv4Candidate = str.match(/\d+\.\d+\.\d+\.\d+/);
  if (!ipv4Candidate) return null;

  const ip = ipv4Candidate[0];

  // Validate each octet (0–255)
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  for (let part of parts) {
    const num = Number(part);
    if (num < 0 || num > 255) return null;
  }

  return ip;
}

init();
