import { create } from 'zustand'
import axiosInstance from '../lib/axios'
import { extractIP, mergeProxyData } from '../utils/data'
import useAuthStore from './useAuthStore'

const useProxyStore = create((set, get) => ({
  data: [],
  isLoading: false,

  // --- Core setters ---
  setIsLoading: (isLoading) => set({ isLoading }),

  // Update a single row in data by sid
  updateRowBySid: (sid, updater) =>
    set((state) => ({
      data: state.data.map((r) => (r.sid === sid ? { ...r, ...updater(r) } : r)),
    })),

  // --- DB sync ---
  syncToDb: async (rowsToSync) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated || !rowsToSync || rowsToSync.length === 0) return
    await axiosInstance.post('/proxy', { proxies: rowsToSync })
  },

  // Load from DB on mount
  loadFromDb: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) return

    set({ isLoading: true })
    try {
      const res = await axiosInstance.get('/proxy')
      const dbData = res.data?.data || []

      if (dbData.length > 0) {
        set({ data: dbData })
      } else {
        // First-time user — DB empty, auto-sync from ServerB via backend API
        try {
          const retryRes = await axiosInstance.get('/proxy')
          const retryData = retryRes.data?.data || []
          set({ data: retryData })
        } catch (syncErr) {
          console.error('[DB Sync] Initial sync failed:', syncErr.message)
        }
      }
    } catch (err) {
      console.error('[DB Sync] Load failed:', err.message)
    } finally {
      set({ isLoading: false })
    }
  },

  // --- Synchronize with ServerB via backend sync API ---
  syncData: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) return

    set({ isLoading: true })
    try {
      const res = await axiosInstance.post('/proxy/sync')
      if (res.data?.success) {
        await get().loadFromDb()
      }
      return res.data
    } catch (err) {
      console.error('[Proxy Sync] Sync failed:', err.message)
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  // --- Fetch and sync proxies by designated IPs ---
  fetchByIps: async (ips) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated || !ips) return []

    const parsedIps = ips
      .split('\n')
      .flatMap((line) => line.split(','))
      .map((line) => extractIP(line))
      .filter(Boolean)
      .join(',')

    if (!parsedIps) return []

    set({ isLoading: true })
    try {
      const res = await axiosInstance.get('/server/list', {
        params: {
          proxy: 'true',
          ips: parsedIps,
        },
      })
      const resData = res.data?.data || []

      if (resData.length > 0) {
        set((state) => ({
          data: mergeProxyData(state.data, resData),
        }))
        await get().syncToDb(resData)
      }

      return resData
    } catch (err) {
      console.error('[Proxy FetchByIps] Failed:', err.message)
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  // --- Buy success handler ---
  handleBuySuccess: async (newData, extraConfig) => {
    if (Array.isArray(newData) && newData.length > 0) {
      const enrichedData = newData.map((item) => ({
        ...item,
        ...extraConfig,
      }))
      set((state) => ({
        data: mergeProxyData(state.data, enrichedData),
      }))
      get().syncToDb(enrichedData)
      return enrichedData
    }
    return null
  },
}))

export default useProxyStore
