export interface ProxyItem {
  sid: number
  ip_port: string
  country: string
  type: string
  created: string
  expired: string
  ip_changed?: number
  status: string
  note: string
  is_auto_renew: boolean
  plan_number?: string
  he_dieu_hanh?: string
  price_vnd?: string
  user_pass?: string | null
}

export type ProxyStatusFilter = 'running' | 'off' | 'other' | ''
export type ProxyTimeFilter = 'all' | 'due' | 'expired' | 'using'
export type ProxyCreatedOrder = 'desc' | 'asc' | ''

export interface FetchProxyListParams {
  page?: number
  limit?: number
  by_status?: ProxyStatusFilter
  by_time?: ProxyTimeFilter
  by_created?: ProxyCreatedOrder
  ips?: string
  keyword?: string
  proxy?: boolean | string
}

export interface ProxyListResponse {
  data: ProxyItem[]
  total_vps: number
  total_vps_running: number
  total_vps_off: number
  page: number
  limit: number
}
