import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion as M, AnimatePresence } from 'motion/react'
import { useTranslation } from '../i18n'
import useAuthStore from '../store/useAuthStore'
import { useRequestVerifyEmailMutation, useSendVerifyTokenMutation } from '../hooks/useVerifyUser'

export default function VerifyUserPage() {
  const t = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const logout = useAuthStore((state) => state.logout)
  const setVerified = useAuthStore((state) => state.setVerified)

  const token = searchParams.get('token')
  // const [demoVerifying, setDemoVerifying] = useState<boolean>(false)
  // const isVerifyingToken = Boolean(token) || demoVerifying
  const isVerifyingToken = Boolean(token)

  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [redirectTimer, setRedirectTimer] = useState<number>(3)
  const [cooldown, setCooldown] = useState<number>(0)
  const [toastMsg, setToastMsg] = useState<string>('')
  const [apiError, setApiError] = useState<string>('')

  const requestEmailMutation = useRequestVerifyEmailMutation()
  const sendTokenMutation = useSendVerifyTokenMutation()
  const hasTriggeredRef = useRef(false)

  // =========================================================================
  // TEMP DEMO PLAYBACK (Will automatically play demo flow on page mount)
  // =========================================================================
  // useEffect(() => {
  //   if (token) return // Skip demo playback if actual token is present

  //   // Step 1: Simulate clicking "Xác thực" (after 1.5s)
  //   const t1 = setTimeout(() => {
  //     setToastMsg(t('verify.emailSentToast'))
  //     setCooldown(60)
  //   }, 1500)

  //   // Step 2: Simulate clicking email link -> Verifying spinner (after 3.8s)
  //   const t2 = setTimeout(() => {
  //     setToastMsg('')
  //     setDemoVerifying(true)
  //   }, 3800)

  //   // Step 3: Simulate success verification response & trigger morph (after 6.2s)
  //   const t3 = setTimeout(() => {
  //     setDemoVerifying(false)
  //     setVerified()
  //     setIsSuccess(true)
  //   }, 6200)

  //   return () => {
  //     clearTimeout(t1)
  //     clearTimeout(t2)
  //     clearTimeout(t3)
  //   }
  // }, [token, t, setVerified])
  // =========================================================================

  // Cooldown timer for email resend
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Redirect countdown timer on verification success
  useEffect(() => {
    if (!isSuccess) return
    if (redirectTimer <= 0) {
      navigate('/manager', { replace: true })
      return
    }
    const timer = setInterval(() => {
      setRedirectTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isSuccess, redirectTimer, navigate])

  // Automatically execute verification if token is present in URL
  useEffect(() => {
    if (!token || hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    const decodedToken = token.replaceAll(' ', '+')
    sendTokenMutation.mutate(
      { token: decodedToken },
      {
        onSuccess: (data) => {
          if (data.success) {
            setVerified()
            setIsSuccess(true)
          } else {
            setApiError(data.error || t('verify.failedToast'))
          }
        },
        onError: (err) => {
          const message =
            (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            err.message ||
            t('verify.failedToast')
          setApiError(message)
        },
      }
    )
  }, [token, sendTokenMutation, setVerified, t])

  const handleRequestVerify = () => {
    if (cooldown > 0 || requestEmailMutation.isPending) return
    setApiError('')
    setToastMsg('')

    requestEmailMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          setToastMsg(t('verify.emailSentToast'))
          setCooldown(60)
        } else {
          setApiError(data.error || t('signup.failed'))
        }
      },
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          err.message ||
          t('signup.tryAgain')
        setApiError(message)
      },
    })
  }

  const handleBackToLogin = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleGoManagerNow = () => {
    navigate('/manager', { replace: true })
  }

  return (
    <div className="relative flex min-h-[calc(100vh-130px)] flex-col items-center justify-center p-4">
      {/* Dynamic Grid Background Overlay */}
      <div className="bg-body pointer-events-none absolute inset-0 opacity-15" />

      <main className="relative z-10">
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
                  ) : isVerifyingToken || sendTokenMutation.isPending ? (
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
              : isVerifyingToken
                ? t('verify.eyebrowVerifying')
                : t('verify.eyebrowPending')}
          </p>

          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">
            {isSuccess
              ? t('verify.titleSuccess')
              : isVerifyingToken
                ? t('verify.titleVerifying')
                : t('verify.titlePending')}
          </h1>

          <p className="text-text-muted mx-auto mt-3">
            {isSuccess
              ? t('verify.subtitleSuccess')
              : isVerifyingToken
                ? t('verify.subtitleVerifying')
                : t('verify.subtitlePending')}
          </p>

          {/* Feedback Banners */}
          {apiError && !isSuccess && (
            <div className="border-red/30 text-red bg-red/10 mt-4 rounded-lg border p-3 text-center text-sm font-medium">
              {apiError}
            </div>
          )}

          {toastMsg && !apiError && !isSuccess && (
            <div className="border-blue/30 text-blue bg-blue/10 mt-4 rounded-lg border p-3 text-center text-sm font-medium">
              {toastMsg}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8">
            {isSuccess ? (
              <M.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleGoManagerNow}
                className="bg-green flex min-h-11 w-full items-center justify-center rounded-lg px-6 py-2.5 font-bold text-white shadow-lg transition-colors focus:outline-none"
              >
                {t('verify.btnGoManager')} ({redirectTimer}s)
              </M.button>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {!isVerifyingToken && (
                  <button
                    type="button"
                    onClick={handleRequestVerify}
                    disabled={cooldown > 0 || requestEmailMutation.isPending}
                    className={`flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none ${
                      cooldown > 0 || requestEmailMutation.isPending
                        ? 'cursor-not-allowed opacity-60'
                        : ''
                    }`}
                  >
                    {requestEmailMutation.isPending
                      ? t('verify.btnVerifying')
                      : cooldown > 0
                        ? `${t('verify.btnSent')} (${cooldown}s)`
                        : t('verify.btnVerify')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className={`border-border text-text-primary hover:bg-bg-hover flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 font-semibold transition-colors focus:outline-none ${
                    isVerifyingToken ? 'col-span-full' : ''
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
                !isVerifyingToken && !isSuccess ? 'bg-blue' : 'bg-text-muted/40'
              }`}
            />
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isVerifyingToken && !isSuccess ? 'bg-blue' : 'bg-text-muted/40'
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
