import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosInstance from '../lib/axios'
import useProfileStore from './useProfileStore'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axiosInstance.post('/auth/login', {
            email,
            password,
          })

          const { success, token, user, error } = response.data

          if (success && token) {
            set({
              token,
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            // Background fetch profile info
            get().fetchUserProfile()

            return true
          } else {
            console.error('Login failed:', error)
            set({
              isLoading: false,
              error: error || 'Login failed',
              isAuthenticated: false,
            })
            return false
          }
        } catch (err) {
          console.error('Login error:', err)
          const errorMessage = err.response?.data?.error || 'Internal Server Error'
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
          })
          return false
        }
      },

      fetchUserProfile: async () => {
        try {
          const response = await axiosInstance.get('/user/profile')
          if (response.data.success) {
            const profile = response.data.user
            const normalizedProfile = {
              ...profile,
              username: profile.get_full_name,
            }
            set((state) => ({
              user: state.user ? { ...state.user, ...normalizedProfile } : normalizedProfile,
            }))
            localStorage.setItem('account-profile', JSON.stringify(normalizedProfile))
          }
        } catch (err) {
          console.error('Failed to fetch profile in background:', err)
        }
      },

      setVerified: () => {
        set((state) => ({
          user: state.user ? { ...state.user, is_verified: true } : { is_verified: true },
        }))
        get().fetchUserProfile()
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
        localStorage.removeItem('account-profile')
        useProfileStore.getState().clearBalance()
      },

      // Helper to check if token exists and is valid (basic check)
      checkAuth: () => {
        const token = get().token
        if (token) {
          set({ isAuthenticated: true })
        } else {
          set({ isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // only persist these fields
    }
  )
)

export default useAuthStore
