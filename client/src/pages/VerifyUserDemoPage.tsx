import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion as M, AnimatePresence } from 'motion/react'
import { useTranslation } from '../i18n'

type DemoState = 'pending' | 'verifying' | 'emailSent' | 'success' | 'error'

export default function VerifyUserDemoPage() {
  const t = useTranslation()
  const navigate = useNavigate()

  const [demoState, setDemoState] = useState<DemoState>('pending')
  const [cooldown, setCooldown] = useState<number>(0)
  const [redirectTimer, setRedirectTimer] = useState<number>(3)

  // Timer simulation for resending email cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Timer simulation for success redirect countdown
  useEffect(() => {
    if (demoState !== 'success') {
      setRedirectTimer(3)
      return
    }
    if (redirectTimer <= 0) {
      navigate('/manager')
      return
    }
    const timer = setInterval(() => {
      setRedirectTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [demoState, redirectTimer, navigate])

  const handleRequestVerifyMock = () => {
    setDemoState('emailSent')
    setCooldown(60)
  }

  const isVerifying = demoState === 'verifying'
  const isSuccess = demoState === 'success'

  return (
    <div className="relative flex min-h-[calc(100vh-130px)] flex-col items-center justify-center p-4">
      {/* Dynamic Grid Background Overlay */}
      <div className="bg-body pointer-events-none absolute inset-0 opacity-15" />

      {/* Demo State Switcher Toolbar for Visual Testing */}
      <div className="border-border bg-surface relative z-20 mb-6 flex flex-wrap items-center justify-center gap-2 rounded-xl border p-2 shadow-lg">
        <span className="text-text-muted px-2 text-sm font-bold uppercase">Demo UI State:</span>
        <button
          type="button"
          onClick={() => setDemoState('pending')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            demoState === 'pending'
              ? 'bg-blue text-white'
              : 'border-border text-text-primary hover:bg-bg-hover border'
          }`}
        >
          1. Chưa xác thực (Pending)
        </button>
        <button
          type="button"
          onClick={() => setDemoState('verifying')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            demoState === 'verifying'
              ? 'bg-blue text-white'
              : 'border-border text-text-primary hover:bg-bg-hover border'
          }`}
        >
          2. Đang xác thực (Verifying Spinner)
        </button>
        <button
          type="button"
          onClick={() => {
            setDemoState('emailSent')
            setCooldown(60)
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            demoState === 'emailSent'
              ? 'bg-blue text-white'
              : 'border-border text-text-primary hover:bg-bg-hover border'
          }`}
        >
          3. Đã gửi Email (Toast)
        </button>
        <button
          type="button"
          onClick={() => setDemoState('success')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            demoState === 'success'
              ? 'bg-green text-white'
              : 'border-border text-text-primary hover:bg-bg-hover border'
          }`}
        >
          4. Thành công (Morphing SVG & Burst)
        </button>
        <button
          type="button"
          onClick={() => setDemoState('error')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            demoState === 'error'
              ? 'bg-red-600 text-white'
              : 'border-border text-text-primary hover:bg-bg-hover border'
          }`}
        >
          5. Lỗi Token (Error)
        </button>
      </div>

      <main className="max-w relative z-10">
        <article className="bg-surface border-border rounded-xl border p-6 text-center shadow-2xl sm:p-10">
          {/* Icon Container with Extraordinary Morphing & Transform Burst */}
          <M.div
            layout
            animate={
              isSuccess
                ? { scale: [0.85, 1.15, 0.95, 1.03, 1], rotate: [0, -6, 3, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border transition-colors duration-700 ${
              isSuccess
                ? 'border-green/50 bg-green/15 text-green shadow-[0_0_35px_rgba(34,197,94,0.35)]'
                : 'border-border bg-surface text-blue'
            }`}
          >
            <div className="relative flex h-12 w-12 items-center justify-center">
              {/* Ripple Glow Burst Ring on Morph */}
              <AnimatePresence>
                {isSuccess && (
                  <M.span
                    key="ripple-glow"
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.85, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className="border-green/60 pointer-events-none absolute inset-0 rounded-full border-2"
                  />
                )}
              </AnimatePresence>

              {/* Morphing SVG Icon */}
              <svg className="size-12 overflow-visible" viewBox="0 0 48 48" fill="none">
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <M.g key="success-g">
                      {/* Background Solid Check Circle */}
                      <M.circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="3"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                      {/* Spring Checkmark Draw */}
                      <M.path
                        d="M14 24.5L21 31.5L34 16.5"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.15 }}
                      />
                    </M.g>
                  ) : isVerifying ? (
                    <M.g key="spinner-g">
                      <M.circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="75 120"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        style={{ transformOrigin: 'center' }}
                      />
                    </M.g>
                  ) : (
                    <M.g
                      key="mail-g"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <path d="M8 13h32v22H8V13Z" stroke="currentColor" strokeWidth="3" />
                      <path d="M9 15l15 12 15-12" stroke="currentColor" strokeWidth="3" />
                    </M.g>
                  )}
                </AnimatePresence>
              </svg>
            </div>
          </M.div>

          {/* Header Texts */}
          <p
            className={`mb-2 text-sm font-bold tracking-wider uppercase transition-colors ${
              isSuccess ? 'text-green' : 'text-blue'
            }`}
          >
            {isSuccess
              ? t('verify.eyebrowSuccess')
              : isVerifying
                ? t('verify.eyebrowVerifying')
                : t('verify.eyebrowPending')}
          </p>

          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">
            {isSuccess
              ? t('verify.titleSuccess')
              : isVerifying
                ? t('verify.titleVerifying')
                : t('verify.titlePending')}
          </h1>

          <p className="text-text-muted text mx-auto mt-3">
            {isSuccess
              ? t('verify.subtitleSuccess')
              : isVerifying
                ? t('verify.subtitleVerifying')
                : t('verify.subtitlePending')}
          </p>

          {/* Feedback Banners depending on Demo State */}
          {demoState === 'error' && (
            <div className="border-red/30 text-red bg-red/10 mt-4 rounded-lg border p-3 text-center text-sm font-medium">
              {t('verify.failedToast')}
            </div>
          )}

          {demoState === 'emailSent' && (
            <div className="border-blue/30 text-blue bg-blue/10 mt-4 rounded-lg border p-3 text-center text-sm font-medium">
              {t('verify.emailSentToast')}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8">
            {isSuccess ? (
              <M.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/manager')}
                className="bg-green flex min-h-11 w-full items-center justify-center rounded-lg px-6 py-2.5 font-bold text-white shadow-lg transition-colors focus:outline-none"
              >
                {t('verify.btnGoManager')} ({redirectTimer}s)
              </M.button>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {!isVerifying && (
                  <button
                    type="button"
                    onClick={handleRequestVerifyMock}
                    disabled={cooldown > 0}
                    className={`flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none ${
                      cooldown > 0 ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                  >
                    {cooldown > 0 ? `${t('verify.btnSent')} (${cooldown}s)` : t('verify.btnVerify')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className={`border-border text-text-primary hover:bg-bg-hover flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 font-semibold transition-colors focus:outline-none ${
                    isVerifying ? 'col-span-full' : ''
                  }`}
                >
                  {t('verify.btnBackLogin')}
                </button>
              </div>
            )}
          </div>

          {/* Micro Flow Progress Indicator */}
          <div className="mt-6 flex justify-center space-x-2" aria-label="Progress">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                !isVerifying && !isSuccess ? 'bg-blue' : 'bg-text-muted/40'
              }`}
            />
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isVerifying && !isSuccess ? 'bg-blue' : 'bg-text-muted/40'
              }`}
            />
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isSuccess ? 'bg-green' : 'bg-text-muted/40'
              }`}
            />
          </div>
        </article>
      </main>
    </div>
  )
}
