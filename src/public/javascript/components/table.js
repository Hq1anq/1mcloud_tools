import { showToast } from "/javascript/components/toaster.js";

const elements = {
  table: document.querySelector("table"),
  tbody: document.getElementById("tableBody"),
  totalCount: document.getElementById("totalCount"),
  selectedCount: document.getElementById("selectedCount"),
  reloadBtn: document.getElementById("reloadBtn"),
  captureBtn: document.getElementById("captureBtn"),
  selectAllCheckbox: document.getElementById("selectAllCheckbox"),
  emptyState: document.getElementById("emptyState"),
};

const desktopOrder = [
  "sid",
  "ip_port",
  "country",
  "type",
  "created",
  "expired",
  "ip_changed",
  "status",
  "note",
];
const mobileOrder = [
  "ip_port",
  "status",
  "expired",
  "note",
  "country",
  "type",
  "created",
  "ip_changed",
  "sid",
];
export let order;
export let columnMap = { checkbox: 0 };

function setupOrder() {
  order = isMobile() ? mobileOrder : desktopOrder;

  order.forEach((col, idx) => {
    columnMap[col] = idx + 1; // +1 because 0 is reserved for checkbox
  });
}

function reorderHeader() {
  const headerCells = elements.table.tHead.rows[0].cells;

  headerCells[columnMap.ip_port].firstElementChild
    .querySelector("input")
    .classList.remove("text-center");
  headerCells[columnMap.ip_port].firstElementChild.classList.add("items-start");
  headerCells[columnMap.note].firstElementChild
    .querySelector("input")
    .classList.remove("text-center");
  headerCells[columnMap.note].firstElementChild.classList.add("items-start");

  order.forEach((col, idx) => {
    const headerCell = headerCells[idx + 1]; // +1 because first <th> is checkbox
    headerCell.firstElementChild.firstChild.nodeValue = col;
  });
}

function renderChunk() {
  const nextChunk = filteredData.slice(
    renderedCount,
    renderedCount + chunkSize,
  );

  nextChunk.forEach((row) => {
    const orderedRow = reorderRowData(row, order);
    addRow(orderedRow);
  });
  renderedCount += nextChunk.length;
  updateCounts();
}

function isMobile() {
  return window.matchMedia("(max-width: 640px)").matches; // Tailwind `sm:` breakpoint
}

function reorderRowData(row, order) {
  // build a new object with reordered keys
  const reordered = {};
  order.forEach((key) => {
    if (row.hasOwnProperty(key)) {
      reordered[key] = row[key];
    }
  });

  return reordered; // still an object
}

let allData = [];
let filteredData = [];
let renderedCount = 0;
let sortedData = []; // for display when getData with ips !== ''
let isSorted = false; // for not filter allData
const chunkSize = 50;

function bindEvents(page) {
  window.addEventListener("scroll", () => handleScroll(page));
  elements.tbody.addEventListener("change", handleRowCheckboxChange);
  elements.tbody.addEventListener("click", handleRowClick);
  elements.selectAllCheckbox.addEventListener("change", handleSelectAll);

  if (navigator.clipboard && navigator.clipboard.writeText)
    if ("ontouchstart" in window)
      // Mobile → only touch
      elements.tbody.addEventListener("touchend", handleTableTap);
    else
      // Desktop → only click
      elements.tbody.addEventListener("click", handleTableTap);

  elements.reloadBtn.addEventListener("click", showAllData);

  if (page === "proxyManager")
    window.addEventListener("beforeunload", () => {
      try {
        localStorage.setItem("allData", JSON.stringify(allData));
      } catch (e) {
        console.error("Failed to save allData before unload", e);
      }
    });
}

export function initTable(page) {
  bindEvents(page);
  if (page === "proxyChecker") {
    elements.reloadBtn.classList.add("hidden");
    elements.captureBtn.classList.remove("hidden");
  } else {
    setupOrder();
    initFilters();
    reorderHeader();
    elements.reloadBtn.classList.remove("hidden");
    elements.captureBtn.classList.add("hidden");

    const allDataStr = localStorage.getItem("allData");
    if (allDataStr) {
      try {
        allData = JSON.parse(allDataStr);
        if (allData.length > 0) {
          showEmptyState(true);
          elements.emptyState.querySelector("p").innerHTML =
            'Click <span class="text-text-toast-success">Reload button</span> to <span class="text-text-toast-success">restore data</span> from previous session';
        }
      } catch (e) {
        console.log("❌ Failed to parse stored data", e);
        allData = [];
      }
    }
  }
  updateCounts();
}

export function displaySorted(data) {
  clearTable();
  sortedData = data.map((row) => {
    const reordered = {};
    order.forEach((key) => {
      if (row.hasOwnProperty(key)) {
        reordered[key] = row[key];
      }
    });
    return reordered;
  });
  filteredData = sortedData;
  renderedCount = 0;
  isSorted = true;
  renderChunk();
  showEmptyState(sortedData.length === 0);
}

export function addRows(data, includeActions = false) {
  data.forEach((row) => addRow(row, includeActions));
  updateCounts();
}

export function addRow(
  data,
  addData = false,
  bigText = false,
  includeActions = false,
) {
  const tr = document.createElement("tr");

  tr.dataset.id = data.sid; // Unique key

  tr.classList.add("hover:bg-bg-hover", "group");

  let rowHTML = `
        <td class="px-2 sm:px-4 py-2 border-b border-border">
            <label class="inline-flex items-center cursor-pointer select-none">
                <!-- Hidden native checkbox -->
                <input type="checkbox" class="rowCheckbox sr-only" />

                <!-- Custom box -->
                <span class="w-5 h-5 text-text-secondary flex items-center justify-center checkbox-transition
                            rounded-md border border-border bg-checkbox
                            group-hover:border-border-checkbox-hover group-hover:brightness-125 relative overflow-visible">
                    <!-- Big check -->
                    <svg class="w-5 h-5 opacity-0 scale-0 checkbox-transition
                                group-has-[input:checked]:opacity-100 group-has-[input:checked]:scale-100 absolute"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                </span>
            </label>
        </td>
    `;

  let textSize = bigText ? "text-base sm:text-lg" : "";

  for (const [key, value] of Object.entries(data)) {
    const alignment =
      key === "ip_port" || key === "note" ? "text-left" : "text-center";
    const content = key === "status" ? getStatusChip(value, bigText) : value;

    rowHTML += `
        <td class="${textSize} px-2 sm:px-4 py-2 border-b border-border whitespace-nowrap ${alignment}">
            ${content}
        </td>
        `;
  }

  if (includeActions) {
    rowHTML += `
        <td class="px-2 sm:px-4 py-2 border-b border-border space-x-2">
            <button class="bg-blue-600 py-1 px-2 sm:px-4 rounded-lg hover:bg-blue-700" onclick="editRow(this)">Edit</button>
            <button class="bg-red-600 py-1 px-2 sm:px-4 rounded-lg hover:bg-red-700" onclick="deleteRow(this)">Delete</button>
        </td>
        `;
  }

  tr.innerHTML = rowHTML;
  elements.tbody.appendChild(tr);
  if (addData) {
    allData.push(data);
    filteredData.push(data);
    updateCounts();
    showEmptyState(false);
  }
}

export function getStatusChip(status, bigText = false) {
  const baseClasses =
    "px-3 py-1 rounded-full text-xs font-semibold inline-block";
  let textSize = bigText ? "text-base sm:text-lg" : "";
  switch (status) {
    case "Running":
    case "Active":
      return `<span class="${baseClasses} ${textSize} bg-bg-success text-text-success">${status}</span>`;
    case "Paused":
    case "Stopped":
      return `<span class="${baseClasses} ${textSize} bg-bg-warning text-text-warning">${status}</span>`;
    case "Off":
    case "Inactive":
      return `<span class="${baseClasses} ${textSize} bg-bg-error text-text-error">${status}</span>`;
    case "Unknow":
    default:
      return `<span class="${baseClasses} ${textSize} bg-bg-unknowed text-text-unknowed">${status}</span>`;
  }
}

export function clearTable() {
  elements.tbody.innerHTML = "";
  filteredData = [];
}

export function updateRowData(id, newData) {
  const numericId = Number(id); // Convert to number

  const index = allData.findIndex((item) => item.sid === numericId);
  if (index !== -1) allData[index] = { ...allData[index], ...newData };

  const fIndex = filteredData.findIndex((item) => item.sid === numericId);
  if (fIndex !== -1)
    filteredData[fIndex] = { ...filteredData[fIndex], ...newData };

  if (sortedData) {
    const sIndex = sortedData.findIndex((item) => item.sid === numericId);
    if (sIndex !== -1)
      sortedData[sIndex] = { ...sortedData[sIndex], ...newData };
  }
}

export function updateCounts() {
  const visibleRows = [...elements.tbody.querySelectorAll("tr")].filter(
    (row) => row.style.display !== "none",
  );

  const checkboxes = visibleRows.map((row) => row.querySelector("input"));
  const selected = [...checkboxes].filter((cb) => cb.checked);

  elements.totalCount.textContent = filteredData.length;
  elements.selectedCount.textContent = selected.length;

  if (checkboxes.length > 0) {
    elements.selectAllCheckbox.checked = selected.length === checkboxes.length;
    elements.selectAllCheckbox.indeterminate =
      selected.length > 0 && selected.length < checkboxes.length;
  }
}

export function getSelectedRows() {
  const selectedRows = [];
  const rows = elements.tbody.rows;
  for (let i = 0; i < rows.length; i++) {
    const checkbox = rows[i].cells[0].querySelector("input");
    if (checkbox && checkbox.checked) {
      selectedRows.push(rows[i]);
    }
  }
  return selectedRows;
}

function handleSelectAll(e) {
  const isChecked = e.target.checked;
  document.querySelectorAll(".rowCheckbox").forEach((checkbox) => {
    if (isChecked) {
      checkbox.checked = true;
      checkbox.closest("tr").classList.add("selected-row");
    } else {
      checkbox.checked = false;
      checkbox.closest("tr").classList.remove("selected-row");
    }
  });
  updateCounts();
}

let lastSelectedIndex = null;

function handleRowClick(e) {
  const tr = e.target.closest("tr");

  // Ignore if clicked a button, link, or the checkbox itself
  if (
    !tr ||
    e.target.closest("button") ||
    e.target.closest("a") ||
    e.target.classList.contains("rowCheckbox")
  ) {
    return;
  }

  const rows = Array.from(elements.tbody.querySelectorAll("tr"));
  const clickedIndex = rows.indexOf(tr);

  if (clickedIndex === -1) return;

  const checkbox = tr.querySelector(".rowCheckbox");
  if (!checkbox) return;

  // SHIFT key logic
  if (e.shiftKey && lastSelectedIndex !== null) {
    const [start, end] = [lastSelectedIndex, clickedIndex].sort(
      (a, b) => a - b,
    );

    // Determine the action (check or uncheck) based on the last selected row's checkbox state
    const lastRow = rows[lastSelectedIndex];
    const lastCheckbox = lastRow.querySelector(".rowCheckbox");
    const shouldCheck = lastCheckbox?.checked ?? false;

    for (let i = start; i <= end; i++) {
      const row = rows[i];
      const rowCheckbox = row.querySelector(".rowCheckbox");
      if (rowCheckbox) {
        rowCheckbox.checked = shouldCheck;
        rowCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  } else {
    // Regular toggle
    checkbox.checked = !checkbox.checked;
    checkbox.dispatchEvent(new Event("change", { bubbles: true })); // manually trigger change event
  }

  lastSelectedIndex = clickedIndex;
}

let lastTapTime = 0;
let lastCell = null;

function handleTableTap(e) {
  const target = e.target.closest("td");
  if (!target) return;

  const currentTime = Date.now();
  const tapGap = currentTime - lastTapTime;

  if (tapGap < 300 && target === lastCell) {
    // ✅ It's a "double tap" on the same cell
    const text = target.textContent.trim();
    if (text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showToast(`Copied: ${text}`, "info");
        })
        .catch((err) => {
          console.log("❌ Failed to copy table cell", err);
          showToast("Failed to copy table cell", "error");
        });
    }
  }

  lastTapTime = currentTime;
  lastCell = target;
}

function handleRowCheckboxChange(e) {
  if (e.target.classList.contains("rowCheckbox")) {
    const tr = e.target.closest("tr");
    if (e.target.checked) {
      tr.classList.remove("bg-success-cell");
      tr.classList.remove("bg-error-cell");
      tr.classList.add("selected-row");
    } else {
      tr.classList.remove("selected-row");
    }
    updateCounts();
  }
}

// Initialize filter inputs
function initFilters() {
  const filterGroup = `
        <div class="relative">
            <!-- Operator icon -->
            <svg xmlns="http://www.w3.org/2000/svg" data-operator="contain" viewBox="0 0 640 640"
                class="bg-border-input rounded-full p-0.5 filter-operator absolute top-[-2px] right-[-6px] cursor-pointer fill-text-primary hover:brightness-[var(--highlight-brightness)] w-4 h-4">
                <path d="M136,128h216c105.9,0,192,86.1,192,192s-86.1,192-192,192H136c-22.1,0-40-17.9-40-40s17.9-40,40-40h216c61.8,0,112-50.2,112-112s-50.2-112-112-112H136c-22.1,0-40-17.9-40-40S113.9,128,136,128z"/>
            </svg>
            <input type="text" placeholder="Filter"
                class="filter-input bg-dropdown mt-1 px-2 py-1 text-center" />
        </div>`;
  elements.table.querySelectorAll("th").forEach((headerCell, idx) => {
    if (idx > 0) headerCell.firstElementChild.innerHTML += filterGroup;
  });
  ((elements.filterInputs = document.querySelectorAll(".filter-input")),
    (elements.filterOperator = document.querySelectorAll(".filter-operator")));

  elements.filterInputs.forEach((input) => {
    // Run filter when ENTER is pressed
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        applyFilter();
      }
    });

    input.addEventListener("blur", applyFilter); // When loss focus on textbox (for mobile)
  });

  const operatorCycle = ["greater-equal", "equal", "less-equal", "contain"];
  const operatorIcons = {
    "greater-equal": `<path d="M117.9 158.4C101.1 152.8 92.1 134.6 97.7 117.9C103.3 101.2 121.4 92.1 138.1 97.6L522.1 225.6C535.2 230 544 242.2 544 256C544 269.8 535.2 282 522.1 286.4L138.1 414.4C121.3 420 103.2 410.9 97.6 394.2C92 377.5 101.1 359.3 117.8 353.7L410.8 256L117.9 158.4zM512 480C529.7 480 544 494.3 544 512C544 529.7 529.7 544 512 544L128 544C110.3 544 96 529.7 96 512C96 494.3 110.3 480 128 480L512 480z"/>`,
    equal: `<path d="M128 192C110.3 192 96 206.3 96 224C96 241.7 110.3 256 128 256L512 256C529.7 256 544 241.7 544 224C544 206.3 529.7 192 512 192L128 192zM128 384C110.3 384 96 398.3 96 416C96 433.7 110.3 448 128 448L512 448C529.7 448 544 433.7 544 416C544 398.3 529.7 384 512 384L128 384z"/>`,
    "less-equal": `<path d="M522.1 158.4C538.9 152.8 547.9 134.7 542.3 117.9C536.7 101.1 518.6 92.1 501.8 97.7L117.8 225.7C104.8 230 96 242.2 96 256C96 269.8 104.8 282 117.9 286.4L501.9 414.4C518.7 420 536.8 410.9 542.4 394.2C548 377.5 538.9 359.3 522.2 353.7L229.2 256L522.1 158.4zM128 480C110.3 480 96 494.3 96 512C96 529.7 110.3 544 128 544L512 544C529.7 544 544 529.7 544 512C544 494.3 529.7 480 512 480L128 480z"/>`,
    contain: `<path d="M136,128h216c105.9,0,192,86.1,192,192s-86.1,192-192,192H136c-22.1,0-40-17.9-40-40s17.9-40,40-40h216c61.8,0,112-50.2,112-112s-50.2-112-112-112H136c-22.1,0-40-17.9-40-40S113.9,128,136,128z"/>`,
  };

  document.querySelectorAll(".filter-operator").forEach((el) => {
    el.addEventListener("click", () => {
      let current = el.dataset.operator;
      let next =
        operatorCycle[
          (operatorCycle.indexOf(current) + 1) % operatorCycle.length
        ];
      el.dataset.operator = next;
      el.innerHTML = operatorIcons[next];
    });
  });
}

function applyFilter() {
  const inputs = Array.from(elements.filterInputs);
  const operators = Array.from(elements.filterOperator);

  const activeFilters = inputs
    .map((inputBox, idx) => ({
      colKey: order[idx],
      value: inputBox.value.trim(),
      operator: operators[idx].dataset.operator,
    }))
    .filter((f) => f.value !== "");

  const targetData = isSorted ? sortedData : allData;
  filteredData =
    activeFilters.length === 0
      ? targetData // no filters, keep all
      : targetData.filter((row) => {
          return activeFilters.every((f) => {
            const cellValue = String(row[f.colKey]);
            let filterVal = f.value;

            if (["created", "expired"].includes(f.colKey)) {
              const today = new Date();
              const currentMonth = String(today.getMonth() + 1).padStart(
                2,
                "0",
              );
              const currentYear = today.getFullYear();

              let formatted = "";
              let day, month, year;

              switch (filterVal.length) {
                case 0:
                  formatted = "";
                  break;
                case 2:
                  // DD -> DD-MM-YYYY
                  day = filterVal.padStart(2, "0");
                  formatted = `${day}-${currentMonth}-${currentYear}`;
                  break;
                case 4:
                  // DDMM -> DD-MM-YYYY
                  day = filterVal.slice(0, 2).padStart(2, "0");
                  month =
                    filterVal.slice(2, 4).padStart(2, "0") || currentMonth;
                  formatted = `${day}-${month}-${currentYear}`;
                  break;
                case 6:
                  // Full DDMMYYYY -> format to DD-MM-YYYY
                  day = filterVal.slice(0, 2);
                  month = filterVal.slice(2, 4);
                  year = filterVal.slice(4, 6);
                  formatted = `${day}-${month}-20${year}`;
                  break;
                case 8:
                  // Full DDMMYYYY -> format to DD-MM-YYYY
                  day = filterVal.slice(0, 2);
                  month = filterVal.slice(2, 4);
                  year = filterVal.slice(4, 8);
                  formatted = `${day}-${month}-${year}`;
                  break;
                default:
                  break;
              }

              if (formatted) {
                inputs[columnMap[f.colKey] - 1].value = formatted; // columnMap also count checkbox
                filterVal = formatted;
              }
            }

            if (f.operator === "contain") return cellValue.includes(filterVal);

            // Detect if values are dates (dd-mm-yyyy format)
            const isDateFormat = (str) => /^\d{2}-\d{2}-\d{4}$/.test(str);
            const isDate = isDateFormat(cellValue) && isDateFormat(filterVal);

            let left, right;
            if (isDate) {
              left = +str2date(cellValue);
              right = +str2date(filterVal);
            } else if (f.colKey === "sid" || f.colKey === "ip_changed") {
              left = parseInt(cellValue);
              right = parseInt(filterVal);
            } else if (
              f.colKey === "note" &&
              isValidDDMM(filterVal) &&
              isValidDDMM(cellValue.replace(/^\*+/, "").slice(0, 4))
            ) {
              const DDMMcellValue = cellValue.replace(/^\*+/, "").slice(0, 4);
              left = +str2date(
                `${DDMMcellValue.slice(0, 2)}-${DDMMcellValue.slice(2, 4)}-2025`,
              );
              right = +str2date(
                `${filterVal.slice(0, 2)}-${filterVal.slice(2, 4)}-2025`,
              );
            } else {
              left = cellValue;
              right = filterVal;
            }
            switch (f.operator) {
              case "greater-equal":
                return left >= right;
              case "less-equal":
                return left <= right;
              case "equal":
              default:
                return left === right;
            }
          });
        });

  renderedCount = 0;
  elements.tbody.innerHTML = "";
  renderChunk();
  showEmptyState(filteredData.length === 0);
}

function isValidDDMM(str) {
  str = str.trim();

  // Must be exactly 4 digits only — no letters, no extra characters
  if (!/^\d{4}$/.test(str)) return false;

  const day = parseInt(str.slice(0, 2), 10);
  const month = parseInt(str.slice(2, 4), 10);

  return day >= 1 && day <= 31 && month >= 1 && month <= 12;
}

export function showAllData() {
  filteredData = allData;
  isSorted = false;
  renderedCount = 0;
  elements.tbody.innerHTML = "";
  renderChunk();
  updateCounts();
  showEmptyState(allData.length === 0);
}

function handleScroll(page) {
  const nearBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 100;
  if (nearBottom && renderedCount < filteredData.length) {
    if (page === "proxyManager") renderChunk();
  }
}

function showEmptyState(show) {
  elements.emptyState.style.display = show ? "block" : "none";
}

export function syncAllData(newData) {
  const sidToItem = new Map(allData.map((item) => [item.sid, item]));

  newData.forEach((newItem) => {
    const existingItem = sidToItem.get(newItem.sid);
    if (existingItem) {
      const mergedItem = {
        ...existingItem,
        ...newItem,
      };
      sidToItem.set(newItem.sid, mergedItem);
    } else sidToItem.set(newItem.sid, newItem);
  });

  const syncedData = Array.from(sidToItem.values());
  allData = syncedData;
  return syncedData;
}

export function addData(extraData) {
  allData.push(...extraData);
}

export function str2date(str) {
  const [d, m, y] = str.split("-");
  return new Date(y, m - 1, d);
}

export function date2str(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}

export function getAllData() {
  return allData;
}
