import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Checkbox from '../components/ui/Checkbox'
import useAuthStore from '../store/useAuthStore'
import { useTranslation } from '../i18n'

export default function LoginPage() {
  const [formData, setFormData] = useState(() => {
    const savedPasswordEncoded = localStorage.getItem('rememberedPassword')
    if (savedPasswordEncoded) {
      try {
        const savedPassword = atob(savedPasswordEncoded)
        return { email: '', password: savedPassword, remember: true }
      } catch (e) {
        console.error(e)
      }
    }
    return { email: '', password: '', remember: false }
  })
  const [error, setError] = useState('')
  const [isLoadedPassword, setIsLoadedPassword] = useState(() => {
    return !!localStorage.getItem('rememberedPassword')
  })
  const navigate = useNavigate()
  const t = useTranslation()

  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }))

    if (id === 'password') {
      setIsLoadedPassword(false)
    }

    // Clear error when user types
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const success = await login(formData.email, formData.password)

    if (success) {
      if (formData.remember) {
        localStorage.setItem('rememberedPassword', btoa(formData.password))
      } else {
        localStorage.removeItem('rememberedPassword')
      }
      const currentUser = useAuthStore.getState().user
      if (currentUser && currentUser.is_verified === false) {
        navigate('/verify-user')
      } else {
        navigate('/manager')
      }
    } else {
      const storeError = useAuthStore.getState().error
      setError(storeError || 'Login failed. Please check your credentials.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-130px)] items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-xl p-8 shadow-2xl">
        <h2 className="text-primary mb-6 text-center text-2xl font-bold">{t('login.title')}</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label={t('login.email')}
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          <Input
            id="password"
            label={t('login.password')}
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            hideEyeIcon={isLoadedPassword}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.remember}
                onChange={(e) => setFormData((prev) => ({ ...prev, remember: e.target.checked }))}
                disabled={isLoading}
              />
              <span
                className="text-text-primary cursor-pointer text-sm"
                onClick={() =>
                  !isLoading && setFormData((prev) => ({ ...prev, remember: !prev.remember }))
                }
              >
                {t('login.remember')}
              </span>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-500 hover:text-blue-400"
            >
              {t('login.forgot')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`focus:ring-opacity-75 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              isLoading ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            {isLoading ? t('login.loading') : t('login.submit')}
          </button>

          <div className="text-text-primary mt-4 text-center text-sm">
            {t('login.noAccount')}{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-500 hover:text-blue-400 focus:outline-none"
            >
              {t('login.signup')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
