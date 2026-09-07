export interface ServerBRawItem {
  server_id: number;
  plan_number?: string;
  ip_port: string;
  country?: string;
  he_dieu_hanh?: string;
  price_vnd?: number | string;
  ngay_mua?: string;
  het_han?: string;
  trang_thai?: string;
  note?: string;
  is_auto_renew?: boolean;
}

export interface ServerBListResponse {
  servers?: ServerBRawItem[];
  total_vps?: number;
  total_vps_running?: number;
  total_vps_off?: number;
}

export interface NormalizedSyncItem {
  sid: number;
  plan_number?: string | null;
  ip_port: string | null;
  country: string | null;
  he_dieu_hanh?: string | null;
  type?: string | null;
  price_vnd?: string | number | null;
  created: string | null;
  expired: string | null;
  status: string | null;
  note: string | null;
  is_auto_renew: boolean;
}

export interface SyncResultSummary {
  fetchedFromServerB: number;
  upsertedToDb: number;
  deletedFromDb: number;
}

export interface SyncUserDataOptions {
  userId: number;
  userToken: string;
  isProxy: boolean;
}
