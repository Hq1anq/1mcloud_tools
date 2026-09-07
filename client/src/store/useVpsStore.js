import { create } from 'zustand'
import axiosInstance from '../lib/axios'
import { extractIP, mergeVpsData } from '../utils/data'
import useAuthStore from './useAuthStore'

const useVpsStore = create((set, get) => ({
  data: [],
  receivedData: [],
  renderingReceived: false,
  isLoading: false,

  // --- Core setters ---
  setIsLoading: (isLoading) => set({ isLoading }),
  setRenderingReceived: (renderingReceived) => set({ renderingReceived }),

  // Update a single row in both data and receivedData by sid
  updateRowBySid: (sid, updater) =>
    set((state) => ({
      data: state.data.map((r) => (r.sid === sid ? { ...r, ...updater(r) } : r)),
      receivedData: state.receivedData.map((r) => (r.sid === sid ? { ...r, ...updater(r) } : r)),
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
          receivedData: dbData,
          renderingReceived: true,
        }))
      } else {
        // First-time user — DB empty, auto-fetch from API
        try {
          const listRes = await axiosInstance.get('/server/list', {
            params: { proxy: 'false' },
          })
          const listData = listRes.data?.data || []
          if (listData.length > 0) {
            set(() => ({
              data: listData,
              receivedData: listData,
              renderingReceived: true,
            }))
            get().syncToDb(listData)
          }
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

  // --- Data fetch ---
  fetchData: async ({ ips = '', amount = '', byTime = '', keyword = '' } = {}) => {
    const parsedIps = ips
      .split('\n')
      .map((line) => extractIP(line))
      .filter(Boolean)
      .join(',')

    const params = { proxy: 'false' }
    if (parsedIps) params.ips = parsedIps
    params.amount = amount ? +amount : 200
    if (byTime && byTime !== 'all') params.by_time = byTime
    if (keyword && keyword.trim()) params.keyword = keyword.trim()

    set({ isLoading: true })
    try {
      const res = await axiosInstance.get('/server/list', { params })
      const resData = res.data?.data || []

      set((state) => {
        // Always preserve allData by merging incoming resData into master dataset
        const mergedData = mergeVpsData(state.data, resData)

        // Only run cleanup if this was an unfiltered full fetch of all VPS
        const isFiltered = Boolean(
          parsedIps ||
          (keyword && keyword.trim()) ||
          (byTime && byTime !== 'all') ||
          (params.amount && resData.length <= params.amount)
        )

        let finalData = mergedData
        if (!isFiltered && resData.length > 0) {
          const trashSids = state.data
            .filter(
              (row) =>
                !resData.some((r) => r.sid === row.sid) && row.status?.toLowerCase() !== 'refunded'
            )
            .map((row) => row.sid)

          if (trashSids.length > 0) {
            get().deleteFromDb(trashSids)
            finalData = resData.filter((row) => !trashSids.includes(row.sid))
          }
        }

        return {
          data: finalData,
          receivedData: resData,
          renderingReceived: true,
        }
      })

      // Sync updated data to DB in background
      get().syncToDb(resData)

      return resData
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
        receivedData: enrichedData,
        renderingReceived: true,
      }))
      get().syncToDb(enrichedData)
      return enrichedData
    }
    return null
  },
}))

export default useVpsStore
