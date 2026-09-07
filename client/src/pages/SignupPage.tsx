import { useState, useEffect, ChangeEvent, SyntheticEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Input from '../components/ui/Input'
import { useTranslation } from '../i18n'
import { useSignupMutation } from '../hooks/useSignup'
import type { SignupPayload } from '../types/auth'

export default function SignupPage() {
  const t = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const signupMutation = useSignupMutation()

  const [formData, setFormData] = useState<SignupPayload & { confirmPassword: string }>({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    ref_code: '',
  })

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')

  useEffect(() => {
    const refFromUrl =
      searchParams.get('ref') || searchParams.get('ref_code') || searchParams.get('partner')
    if (refFromUrl) {
      localStorage.setItem('ref_code', refFromUrl)
      setFormData((prev) => ({ ...prev, ref_code: refFromUrl }))
    } else {
      const savedRef = localStorage.getItem('ref_code') || ''
      if (savedRef) {
        setFormData((prev) => ({ ...prev, ref_code: savedRef }))
      }
    }
  }, [searchParams])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))

    if (fieldErrors[id]) {
      setFieldErrors((prev) => ({ ...prev, [id]: '' }))
    }
    if (apiError) {
      setApiError('')
    }
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.fullname.trim()) {
      errors.fullname = t('signup.fullnameRequired')
    }
    if (!formData.email.trim()) {
      errors.email = t('signup.emailRequired')
    }
    if (!formData.phone.trim()) {
      errors.phone = t('signup.phoneRequired')
    }
    if (!formData.password) {
      errors.password = t('signup.passwordRequired')
    } else if (formData.password.length < 8) {
      errors.password = t('signup.passwordLength')
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('signup.passwordMismatch')
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setApiError('')
    setSuccessMsg('')

    if (!validate()) return

    const payload: SignupPayload = {
      fullname: formData.fullname.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
      ref_code: formData.ref_code,
      partner: window.location.hostname,
    }

    signupMutation.mutate(payload, {
      onSuccess: (data) => {
        if (data.success) {
          setSuccessMsg(t('signup.successRedirect'))
          setTimeout(() => {
            navigate('/login')
          }, 1200)
        } else {
          setApiError(data.error || t('signup.failed'))
        }
      },
      onError: (err: any) => {
        const msg =
          err.response?.data?.error || err.message || t('signup.tryAgain')
        setApiError(msg)
      },
    })
  }

  const isLoading = signupMutation.isPending

  return (
    <div className="flex min-h-[calc(100vh-130px)] items-center justify-center p-4">
      <div className="bg-surface w-full max-w-xl rounded-xl p-8 shadow-2xl">
        <h2 className="text-primary mb-6 text-center text-2xl font-bold">{t('signup.title')}</h2>

        {apiError && (
          <div className="border-red/30 text-red bg-red/10 mb-4 rounded-lg border p-3 text-center text-sm">
            {apiError}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center text-sm font-medium text-green-400">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="fullname"
            label={t('signup.fullname')}
            type="text"
            placeholder="Nguyen Van A"
            value={formData.fullname}
            onChange={handleChange}
            error={fieldErrors.fullname}
            disabled={isLoading}
            required
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              id="email"
              label={t('signup.email')}
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
              disabled={isLoading}
              required
            />
            <Input
              id="phone"
              label={t('signup.phone')}
              type="tel"
              placeholder="0912345678"
              value={formData.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              id="password"
              label={t('signup.password')}
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              disabled={isLoading}
              required
            />
            <Input
              id="confirmPassword"
              label={t('signup.confirmPassword')}
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={fieldErrors.confirmPassword}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`focus:ring-opacity-75 mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              isLoading ? 'cursor-not-allowed opacity-70' : ''
            }`}
          >
            {isLoading ? 'Đang xử lý...' : t('signup.submit')}
          </button>

          <div className="text-text-primary mt-4 text-center text-sm">
            {t('signup.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-blue-500 hover:text-blue-400 focus:outline-none"
            >
              {t('signup.login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
