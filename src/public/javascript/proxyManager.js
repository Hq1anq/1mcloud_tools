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
	setAllData,
	str2date, date2str
} from "./components/table.js";
import { showToast, changeToToast } from "./components/toaster.js";
import { showCopyDialog } from "./components/copyDialog.js";
import { showChangeIpDialog, closeChangeIpDialog } from "./components/changeIpDialog.js";
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
	deleteBtn: document.getElementById("deleteBtn"),

	noteInput: document.getElementById("noteInput"),
	changeNoteBtn: document.getElementById("changeNoteBtn"),

	reinstallInput: document.getElementById("reinstallInput"),
	reinstallType: document.getElementById("reinstallType-trigger"),
	reinstallBtn: document.getElementById("reinstallBtn"),

    changeIpType: document.getElementById("changeIpType-trigger"),
    changeIpBtn: document.getElementById("changeIpBtn"),
    confirmChangeIp : document.getElementById("confirmChangeIp"),

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

	renewBtn: document.getElementById("renewBtn"),
	confirmRenew: document.getElementById("confirmRenew")
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
			[lines[currentLine - 1], lines[currentLine]] = [lines[currentLine], lines[currentLine - 1]];
			setNewPosition(currentLine - 1, column);
		} else if (e.key === "ArrowDown" && currentLine < lines.length - 1) {
			[lines[currentLine], lines[currentLine + 1]] = [lines[currentLine + 1], lines[currentLine]];
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
    elements.copyIpBtn.addEventListener("click", copyIp);
    elements.deleteBtn.addEventListener("click", deleteIP);
    elements.amount.addEventListener("keydown", event => {
        if (event.key === "Enter") getData();
    });
    elements.getDataBtn.addEventListener("click", getData);
    elements.changeNoteBtn.addEventListener("click", changeNote);
    elements.reinstallBtn.addEventListener("click", reinstall);
    elements.pauseBtn.addEventListener("click", pause);
    elements.rebootBtn.addEventListener("click", reboot);

	elements.pauseBtn.addEventListener("click", pause);
	elements.rebootBtn.addEventListener("click", reboot);

	elements.changeIpBtn.addEventListener("click", () => {
		const proxyType = elements.changeIpType.textContent.trim();
		showChangeIpDialog(proxyType);
	});
	elements.confirmChangeIp.addEventListener("click", changeIp);

	elements.renewBtn.addEventListener("click", showRenewDialog);
	elements.confirmRenew.addEventListener("click", renew);

	elements.getAPIKeyBtn.addEventListener("click", showGetAPIKeyDialog);
	elements.getKeyBtn.addEventListener("click", getAPIKey);
	elements.passwordInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter")
			if (elements.getKeyBtn.classList.contains("hidden"))
				handleViewKey();
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
    const apiKeyString = elements.apiKey.value.trim();
    if (!apiKeyString) {
        showToast("Please enter your API Key", "warning");
        return;
    }

    showToast("Getting data...", "loading");

    const ipString = elements.ipList.value
        .split("\n")
        .map(line => extractIP(line))
        .filter(ip => ip != 0)
        .join(",");

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
			if (data.length > 0)
				if (!ipString) {
					setAllData(data);
					showAllData();
					localStorage.setItem("allData", JSON.stringify(data));
				} else {
					displaySorted(data);
				}
			changeToToast("Get Data DONE!", "Getting data", "success");
		} else {
			console.log(`❌ Error: ${response.status}`);
			switch (response.status) {
				case 401:
					changeToToast("Wrong API KEY!", "Getting data", "error");
					break;
				case 500:
					changeToToast("Fail to get data, try again!", "Getting data", "error");
					break;
				default:
					changeToToast(`❌ Error: ${response.status}`, "Getting data", "error");
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
	const nationCode = elements.buyNation.textContent.trim()
		.match(/\((.*)\)/)[1];
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
				type: proxyType
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
			changeToToast(`Created <span class="text-text-toast-success">${data.length}</span> proxies`, "Buying proxies", "success");
		} else {
			console.log(`❌ Error: ${response.status}`);
			switch (response.status) {
				case 401:
					changeToToast("Wrong API KEY!", "Buying proxies", "error");
					break;
				case 500:
					changeToToast("Fail to created proxy, try again!", "Buying proxies", "error");
					break;
				default:
					changeToToast(`❌ Error: ${response.status}`, "Buying proxies", "error");
					break;
			}
		}
	} catch (err) {
		changeToToast("Fail to created proxy, try again!", "Buying proxies", "error");
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

    const apiKeyString = elements.apiKey.value.trim();
    if (!apiKeyString) {
        showToast("Please enter your API Key", "warning");
        return;
    }

    closeChangeIpDialog();

	if (rowCount > 1) showToast(`Changing IP 1/${rowCount}`, "loading");
	else showToast(`Changing IP...`, "loading");

	const proxyLines = []; // collect proxies here
	const proxyType =
		elements.changeIpType.textContent.trim() === "SOCKS5"
			? "proxy_sock_5"
			: "proxy_https";

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
			changeToToast(`Changing IP ${i + 1}/${rowCount}`, "Changing IP", "loading", true);

		try {
			const response = await fetch("/proxy/change-ip", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ip: ip,
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
    
    const apiKeyString = elements.apiKey.value.trim();
    if (!apiKeyString) {
        showToast("Please enter your API Key", "warning");
        return;
    }

	if (rowCount > 1) showToast(`Reinstalling 1/${rowCount}`, "loading");
	else showToast(`Reinstalling...`, "loading");

	const proxyLines = []; // collect proxies here
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
			changeToToast(`Reinstalling ${i + 1}/${rowCount}`, "Reinstalling", "loading", true);

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
				console.error(
					`Failed to REINSTALL for sid ${sid}:`,
					data.error,
				);
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

    const apiKeyString = elements.apiKey.value.trim();
    if (!apiKeyString) {
        showToast("Please enter your API Key", "warning");
        return;
    }

    showToast("Pausing...", "loading");

    const sids = selectedRows
        .map(row => row.cells[columnMap.sid].innerText.trim())
        .join(",");

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

    const apiKeyString = elements.apiKey.value.trim();
    if (!apiKeyString) {
        showToast("Please enter your API Key", "warning");
        return;
    }

    showToast("REBOOT...", "loading");

    const sids = selectedRows
        .map(row => row.cells[columnMap.sid].innerText.trim())
        .join(",");

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
			body: JSON.stringify({ sids: sids, month: 1, apiKey: apiKeyString }),
		});

		const data = await response.json();
		if (response.ok && data.success) {
			const successIPs = Object.keys(data.result.success);
			const errorIPs = Object.keys(data.result.error);

			selectedRows.forEach((row) => {
				const ip = row.cells[columnMap.ip_port].textContent.split(":")[0].trim();
				if (successIPs.includes(ip)) {
					updateRowContent(row, "", "renew");
				} else if (errorIPs.includes(ip)) {
					showToast(`Fail to REFUND ${ip}`, "error");
					row.classList.add("bg-error-cell");
					console.error(
						`Failed to REFUND ${ip}:`,
						data.result.error[ip],
					);
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
    const selectedRows = getSelectedRows();
    const rowCount = selectedRows.length;
    if (rowCount === 0) {
        showToast("Select at least one row to CHANGE NOTE", "info");
        return;
    }

    const apiKeyString = elements.apiKey.value.trim();
    if (!apiKeyString) {
        showToast("Please enter your API Key", "warning");
        return;
    }
    
    if (rowCount > 1)
        showToast(`Changing Note 1/${rowCount}`, "loading");
    else
        showToast(`Changing Note...`, "loading");
    
    const noteInput = elements.noteInput.value;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rowCount; i++) {
        const row = selectedRows[i];
        const cells = row.cells;
        if (cells.length < 2) continue;

        const sid = cells[columnMap.sid].innerText.trim();

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
                    newNote: noteInput,
                    apiKey: apiKeyString
                })
            });

			const data = await response.json();

            if (response.ok && data.success) {
                successCount++;
                console.log(`✅ CHANGE NOTE for ${sid}`);
                updateRowContent(row, noteInput, "changeNote");
            } else {
                failCount++;
                if (response.status === 401) {
                    changeToToast("Wrong API Key!", "Changing Note", "error");
                    return;
                }
                console.error(`Failed to CHANGE NOTE for sid ${sid}:`, data.error);
                row.classList.add("bg-error-cell");
                if (rowCount === 1) {
                    changeToToast(`Fail to CHANGE NOTE for ${sid}`, "Changing Note", "error");
                    return;
                };
                showToast(`Failed to CHANGE NOTE for sid ${sid}`, "error");
            }
        } catch (err) {
            failCount++;
            console.error(`Error CHANGE NOTE for sid ${sid}:`, err);
            row.classList.add("bg-error-cell");
            if (rowCount === 1) {
                changeToToast(`Fail to CHANGE NOTE for sid ${sid}`, "Changing Note", "error");
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
	if (action === "renew") {
		const date = str2date(cells[columnMap.expired].innerHTML);
		date.setDate(date.getDate() + 30);
		const newExpired = date2str(date);
		cells[columnMap.expired].innerHTML = newExpired;
		cells[columnMap.status].innerHTML = getStatusChip("Running");
		updateRowData(id, {
			expired: newExpired,
			status: "Running"
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
		});
	} else if (action === "reinstall") {
		const reinstallType =
			elements.reinstallType.textContent.trim() === "SOCKS5"
				? "SOCKS5 Proxy"
				: "HTTPS Proxy";
		cells[columnMap.type].innerText = reinstallType;
		updateRowData(id, {
			type: reinstallType,
			status: "Running",
		});
	}
}

function deleteIP() {
    elements.ipList.value = '';
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
