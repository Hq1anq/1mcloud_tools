import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../lib/axios'
import useAuthStore from '../store/useAuthStore'
import { useTranslation } from '../i18n'
import AddFundsDialog from '../components/dialog/AddFundsDialog'

const PROFILE_KEY = 'account-profile'

function getCachedProfile() {
  try {
    const cached = localStorage.getItem(PROFILE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function setCachedProfile(data) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota errors */
  }
}

const DEFAULT_PROFILE = {
  amount: '0',
  phone: '',
  is_verified: true,
  discount_vps: '0%',
  discount_proxy: '0%',
  discount_gpu: '0%',
}

export default function AccountPage() {
  const t = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const username = user?.username || 'User'
  const avatarLetter = username.charAt(0).toUpperCase()

  const [profile, setProfile] = useState(getCachedProfile() || DEFAULT_PROFILE)
  const profileRef = useRef(profile)
  const [showAddFunds, setShowAddFunds] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/user/profile')
        if (res.data.success) {
          const fresh = res.data.user
          const prev = profileRef.current

          // Only re-render if something actually changed
          if (JSON.stringify(prev) !== JSON.stringify(fresh)) {
            setProfile(fresh)
            profileRef.current = fresh
            setCachedProfile(fresh)
          }
        }
      } catch {
        // Silently fail — page already shows cached or default data
      }
    }
    fetchProfile()
  }, [])

  const parseDiscount = (val) => {
    if (!val) return 0
    return parseFloat(val.replace('%', ''))
  }

  const discountVps = parseDiscount(profile.discount_vps)
  const discountProxy = parseDiscount(profile.discount_proxy)
  const discountGpu = parseDiscount(profile.discount_gpu)

  return (
    <div className="flex flex-1 justify-center px-4 py-5 md:px-6 lg:px-40">
      <div className="flex w-full max-w-240 flex-1 flex-col gap-6">
        {/* Page Title */}
        <div className="border-border flex flex-wrap items-end justify-between gap-3 border-b pb-2">
          <div className="flex min-w-72 flex-col gap-2">
            <h1 className="text-primary text-3xl leading-tight font-black tracking-[-0.033em] md:text-4xl">
              {t('account.title')}
            </h1>
            <p className="text-text-muted text-base leading-normal font-normal">
              {t('account.subtitle')}
            </p>
          </div>
        </div>
        {/* Profile Header Card */}
        <div
          className="bg-surface float-in w-full rounded-xl p-6 shadow-sm transition-shadow hover:shadow-md"
          style={{ animationFillMode: 'both', animationDelay: '0ms' }}
        >
          <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="border-border relative size-24 shrink-0 overflow-hidden rounded-full border-4 shadow-inner">
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-500 to-blue-800 text-3xl font-bold text-white">
                  {avatarLetter}
                </div>
                <div className="bg-green absolute right-0 bottom-0 size-6 rounded-full border-2 border-green-700" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-text-primary text-2xl leading-tight font-bold tracking-tight">
                  {username}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Phone badge */}
                  <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-blue-700/10 ring-inset">
                    {profile?.phone || '—'}
                  </span>
                  {/* Verification badge */}
                  {profile?.is_verified ? (
                    <span className="bg-green/15 text-green inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-green-600/20 ring-inset">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('account.verified')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/verify-user')}
                      className="bg-red/15 text-red hover:bg-red/25 ring-red/30 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 transition-all ring-inset hover:scale-105 focus:outline-none"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="bg-red/75 absolute inline-flex h-full w-full animate-ping rounded-full"></span>
                        <span className="bg-red relative inline-flex h-2 w-2 rounded-full"></span>
                      </span>
                      <span>{t('account.unverified')}</span>
                      <span className="ml-0.5 underline">{t('verify.btnVerify')}</span>
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Balance Card */}
        <div
          className="group float-in relative overflow-hidden rounded-xl bg-linear-to-r from-blue-600 to-blue-400 p-6 text-white shadow-lg transition-transform hover:scale-[1.02] md:p-8"
          style={{ animationFillMode: 'both', animationDelay: '100ms' }}
        >
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 size-64 rounded-full bg-white/15 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-blue-100">
              <svg
                className="size-6 fill-none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3"
                />
              </svg>
              <span className="text-sm font-medium tracking-wider uppercase">
                {t('account.availableBalance')}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-4xl font-black tracking-tight md:text-5xl">
                {profile?.amount || '0'}
                <span className="ml-2 text-2xl font-bold opacity-80 md:text-3xl">VNĐ</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddFunds(true)}
                className="text-blue bg-text-secondary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold shadow-sm transition-transform hover:scale-105"
              >
                <svg
                  className="size-5 fill-none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('account.addfunds')}
              </button>
              <button
                className="text-text-secondary hover:border-primary flex items-center gap-2 rounded-lg border border-white/20 bg-blue-700 px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition-colors"
                onClick={() => navigate('/history')}
              >
                <svg
                  className="size-5 fill-none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t('account.history')}
              </button>
            </div>
          </div>
        </div>
        {/* Discount Section Heading */}
        <div
          className="float-in mt-4 flex items-center gap-2 px-1"
          style={{ animationFillMode: 'both', animationDelay: '200ms' }}
        >
          <svg
            className="text-primary size-6 fill-none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <h3 className="text-text-primary text-lg leading-tight font-bold tracking-tight">
            {t('account.discountHeading')}
          </h3>
        </div>
        {/* Discount Cards Grid */}
        <div
          className="float-in grid grid-cols-1 gap-4 lg:grid-cols-3"
          style={{ animationFillMode: 'both', animationDelay: '300ms' }}
        >
          {/* VPS Discount */}
          <DiscountCard
            icon={
              <svg
                className="size-6 fill-none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
                />
              </svg>
            }
            colorVar="var(--color-primary)"
            label={t('account.discountVps')}
            value={discountVps}
          />
          {/* Proxy Discount */}
          <DiscountCard
            icon={
              <svg
                className="size-6 fill-none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            }
            colorVar="var(--purple)"
            label={t('account.discountProxy')}
            value={discountProxy}
          />
          {/* Gpu Discount */}
          <DiscountCard
            icon={
              <svg
                className="size-6 fill-none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
                />
              </svg>
            }
            colorVar="var(--orange)"
            label={t('account.discountGpu')}
            value={discountGpu}
          />
        </div>
      </div>
      <AddFundsDialog isOpen={showAddFunds} onClose={() => setShowAddFunds(false)} />
    </div>
  )
}

function DiscountCard({ icon, colorVar, label, value }) {
  return (
    <div
      className="border-border bg-surface group flex flex-col justify-between gap-4 rounded-xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-(--card-accent-border) hover:shadow-md"
      style={{
        '--card-accent': colorVar,
        '--card-accent-bg': `color-mix(in srgb, ${colorVar} 15%, transparent)`,
        '--card-accent-border': `color-mix(in srgb, ${colorVar} 70%, transparent)`,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: 'var(--card-accent-bg)', color: 'var(--card-accent)' }}
        >
          {icon}
        </div>
        <svg
          className="text-text-muted size-5 fill-none transition-colors group-hover:text-(--card-accent)"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <div>
        <p className="text-text-muted mb-1 text-sm font-medium">{label}</p>
        <p className="text-text-primary text-3xl font-bold tracking-tight">{value}%</p>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-surface)_80%,var(--border))]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: 'var(--card-accent)' }}
        />
      </div>
    </div>
  )
}
