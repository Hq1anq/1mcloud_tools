import { normalizeText, parseDateDDMMYYYY } from "./formatter.ts";

export enum StatusFilter {
  Running = "running",
  Off = "off",
  Other = "other",
  All = "",
}

export enum TimeFilter {
  All = "all",
  Due = "due",
  Expired = "expired",
  Using = "using",
}

export enum CreatedOrder {
  Desc = "desc",
  Asc = "asc",
  Default = "",
}

export interface FilterableItem {
  sid: number;
  ip_port: string;
  user_pass?: string | null;
  country?: string;
  type?: string;
  he_dieu_hanh?: string;
  plan_number?: string;
  price_vnd?: string;
  created: string;
  expired: string;
  status: string;
  note: string;
  is_auto_renew?: boolean;
}

export interface RecordFilterOptions {
  by_status?: StatusFilter;
  by_time?: TimeFilter;
  by_created?: CreatedOrder;
  ips?: string;
  keyword?: string;
}

export function matchText(text: string, keyword: string): boolean {
  if (!text || !keyword) return false;
  const kw = keyword.trim().toLowerCase();
  if (!kw) return false;

  const lowerText = text.toLowerCase();
  if (lowerText.includes(kw)) return true;

  const normalizedVal = normalizeText(lowerText);
  const normalizedKw = normalizeText(kw);
  return normalizedVal.includes(normalizedKw);
}

export function filterByKeyword(
  data: FilterableItem[],
  keyword: string,
  targetFields: (keyof FilterableItem)[] = [],
): FilterableItem[] {
  const kw = keyword?.trim();
  if (!kw || !Array.isArray(data)) return data;

  return data.filter((item) =>
    targetFields.some((field) => {
      const val = item[field];
      return typeof val === "string" && matchText(val, kw);
    }),
  );
}

export function applyRecordFilters(
  data: FilterableItem[],
  {
    by_status = StatusFilter.All,
    by_time = TimeFilter.All,
    by_created = CreatedOrder.Default,
    ips = "",
    keyword = "",
  }: RecordFilterOptions,
): FilterableItem[] {
  if (!Array.isArray(data)) return [];

  // 1. Exclude refunded status
  let records = data.filter(
    (item) => item.status?.toLowerCase() !== "refunded",
  );

  // 2. Filter by status using enum values
  const statusLower = by_status.trim().toLowerCase();
  if (statusLower === StatusFilter.Running) {
    records = records.filter(
      (item) => item.status?.toLowerCase() === StatusFilter.Running,
    );
  } else if (statusLower === StatusFilter.Off) {
    records = records.filter(
      (item) => item.status?.toLowerCase() === StatusFilter.Off,
    );
  } else if (statusLower === StatusFilter.Other) {
    records = records.filter((item) => {
      const s = item.status?.toLowerCase();
      return s !== StatusFilter.Running && s !== StatusFilter.Off;
    });
  }

  // 3. Filter by time using enum values
  const timeFilter = by_time.trim().toLowerCase();
  if (timeFilter !== TimeFilter.All) {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    records = records.filter((item) => {
      const expDate = parseDateDDMMYYYY(item.expired);
      if (!expDate) return false;

      const diffInDays = Math.floor(
        (expDate.getTime() - today.getTime()) / 86400000,
      );

      if (timeFilter === TimeFilter.Due) {
        return diffInDays >= 0 && diffInDays <= 2;
      }
      if (timeFilter === TimeFilter.Expired) {
        return diffInDays < 0;
      }
      if (timeFilter === TimeFilter.Using) {
        return diffInDays >= 0;
      }
      return true;
    });
  }

  // 4. Filter by ips: comma-separated IP list
  const trimmedIps = ips.trim();
  if (trimmedIps) {
    const ipList = trimmedIps
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ipList.length > 0) {
      records = records.filter((item) => {
        if (!item.ip_port) return false;
        const rawIp = item.ip_port.split(":")[0].trim();
        return ipList.some(
          (targetIp) => item.ip_port.includes(targetIp) || rawIp === targetIp,
        );
      });
    }
  }

  // 5. Filter by keyword
  const trimmedKw = keyword.trim();
  if (trimmedKw) {
    records = filterByKeyword(records, trimmedKw, [
      "note",
      "ip_port",
      "plan_number",
      "country",
      "type",
      "he_dieu_hanh",
    ]);
  }

  // 6. Sort by created date using CreatedOrder enum
  const createdOrder = by_created.trim().toLowerCase();
  if (createdOrder === CreatedOrder.Asc) {
    records.sort((a, b) => {
      const dateA = parseDateDDMMYYYY(a.created);
      const dateB = parseDateDDMMYYYY(b.created);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeA - timeB;
    });
  } else if (createdOrder === CreatedOrder.Desc) {
    records.sort((a, b) => {
      const dateA = parseDateDDMMYYYY(a.created);
      const dateB = parseDateDDMMYYYY(b.created);
      const timeA = dateA ? dateA.getTime() : 0;
      const timeB = dateB ? dateB.getTime() : 0;
      return timeB - timeA;
    });
  } else {
    records.sort((a, b) => (b.sid || 0) - (a.sid || 0));
  }

  return records;
}
