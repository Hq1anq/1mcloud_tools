export interface VpsItem {
  sid: number
  ip_port: string
  country: string
  type?: string
  created: string
  expired: string
  ip_changed?: number
  status: string
  note: string
  is_auto_renew?: boolean
  plan_number?: string
  he_dieu_hanh?: string
  price_vnd?: string
  user_pass?: string | null
}

export type VpsStatusFilter = 'running' | 'off' | 'other' | ''
export type VpsTimeFilter = 'all' | 'due' | 'expired' | 'using'
export type VpsCreatedOrder = 'desc' | 'asc' | ''

export interface FetchVpsListParams {
  page?: number
  limit?: number
  by_status?: VpsStatusFilter
  by_time?: VpsTimeFilter
  by_created?: VpsCreatedOrder
  ips?: string
  keyword?: string
  proxy?: boolean | string
}

export interface VpsListResponse {
  data: VpsItem[]
  total_vps: number
  total_vps_running: number
  total_vps_off: number
  page: number
  limit: number
}
