import { create } from 'zustand'
import axiosInstance from '../lib/axios'
import { extractIP, mergeVpsData } from '../utils/data'
import useAuthStore from './useAuthStore'

const useVpsStore = create((set, get) => ({
  data: [],
  isLoading: false,

  // --- Core setters ---
  setIsLoading: (isLoading) => set({ isLoading }),

  // Update a single row
  updateRowBySid: (sid, updater) =>
    set((state) => ({
      data: state.data.map((r) => (r.sid === sid ? { ...r, ...updater(r) } : r)),
    })),

  // --- DB sync ---
  syncToDb: async (rowsToSync) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated || !rowsToSync || rowsToSync.length === 0) return
    await axiosInstance.post('/vps', { vpsList: rowsToSync })
  },

  deleteFromDb: async (sids) => {
    try {
      await axiosInstance.delete('/vps', { data: { sids } })
    } catch (err) {
      console.error('[Cleanup] Delete failed:', err.message)
    }
  },

  // Load from DB on mount
  loadFromDb: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) return

    set({ isLoading: true })
    try {
      const res = await axiosInstance.get('/vps')
      const dbData = res.data?.data || []

      if (dbData.length > 0) {
        set(() => ({
          data: dbData,
        }))
      } else {
        // First-time user — DB empty, auto-fetch from API
        try {
          const retryRes = await axiosInstance.get('/vps')
          const retryData = retryRes.data?.data || []
          set({ data: retryData })
        } catch (listErr) {
          console.error('[DB Sync] Initial fetch failed:', listErr.message)
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
      const res = await axiosInstance.post('/vps/sync')
      if (res.data?.success) {
        await get().loadFromDb()
      }
      return res.data
    } catch (err) {
      console.error('[Vps Sync] Sync failed:', err.message)
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  // --- Fetch and sync Vps by designated IPs ---
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
          proxy: 'false',
          ips: parsedIps,
        },
      })
      const resData = res.data?.data || []

      if (resData.length > 0) {
        set((state) => ({
          data: mergeVpsData(state.data, resData),
        }))
        await get().syncToDb(resData)
      }

      return resData
    } catch (err) {
      console.error('[Vps FetchByIps] Failed:', err.message)
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
        data: mergeVpsData(state.data, enrichedData),
      }))
      get().syncToDb(enrichedData)
      return enrichedData
    }
    return null
  },
}))

export default useVpsStore
