import { useNavigate } from 'react-router-dom'
import { motion as M } from 'motion/react'
import { useTranslation } from '../i18n'
import useAuthStore from '../store/useAuthStore'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const t = useTranslation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <div className="relative flex min-h-[calc(100vh-130px)] flex-col items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Grid Overlay */}
      <div className="bg-body pointer-events-none absolute inset-0 opacity-15" />

      <main className="relative z-10">
        <article className="bg-surface border-border relative overflow-hidden rounded-2xl border p-8 text-center shadow-2xl md:p-12">
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-blue-500/0 via-blue-500 to-blue-500/0" />

          {/* 4 [Icon Badge] 4 Creative Layout */}
          <M.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center justify-center gap-2 select-none sm:gap-4"
          >
            <span className="text-blue text-6xl font-black tracking-tight sm:text-8xl">4</span>

            {/* Middle Floating Icon Badge as the '0' */}
            <M.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="border-blue/30 bg-blue/10 text-blue flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md sm:h-20 sm:w-20"
            >
              <svg
                className="size-8 fill-none sm:size-10"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </M.div>

            <span className="text-blue text-6xl font-black tracking-tight sm:text-8xl">4</span>
          </M.div>

          {/* Eyebrow / Error Code */}
          <p className="text-blue mb-2 text-sm font-bold tracking-widest uppercase sm:text-base">
            {t('notFound.code')}
          </p>

          {/* Main Title */}
          <h1 className="text-text-primary text-2xl font-bold tracking-tight sm:text-3xl">
            {t('notFound.title')}
          </h1>

          {/* Description */}
          <p className="text-text-muted mx-auto mt-3 text-base leading-relaxed sm:text-lg">
            {t('notFound.desc')}
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <M.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate('/')}
              className="bg-blue text-text-secondary flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-bold shadow-md transition-colors hover:brightness-110 sm:w-auto"
            >
              <svg className="size-5 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <span>{t('notFound.btnHome')}</span>
            </M.button>

            {isAuthenticated && (
              <M.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigate('/manager')}
                className="border-border text-text-primary hover:bg-bg-hover flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-6 py-2.5 font-semibold transition-colors sm:w-auto"
              >
                <svg className="size-5 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                </svg>
                <span>{t('notFound.btnManager')}</span>
              </M.button>
            )}
          </div>
        </article>
      </main>
    </div>
  )
}
