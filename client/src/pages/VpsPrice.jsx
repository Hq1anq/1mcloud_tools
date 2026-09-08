import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { vpsNations, vpsSpecialOptions, getDefaultPlans } from '../data/vpsNations.jsx'
import { ServerIcon, HubIcon } from '../assets/icons'
import axiosInstance from '../lib/axios.js'
import VpsCard from '../components/price/VpsCard.jsx'
import { useTranslation } from '../i18n'

export default function VpsPrice() {
  const t = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = searchParams.get('plan') || 'VN'
  const [selectedNation, setSelectedNation] = useState(initialType)
  const [plans, setPlans] = useState(() => getDefaultPlans(initialType))

  // Sync state if URL query param changes (e.g. clicking Footer link while already on /price/vps)
  useEffect(() => {
    const typeFromUrl = searchParams.get('plan')
    if (typeFromUrl && typeFromUrl !== selectedNation) {
      setSelectedNation(typeFromUrl)
      setPlans(getDefaultPlans(typeFromUrl))
    }
  }, [searchParams])

  const handleSelectNation = (nationSymbol) => {
    setSelectedNation(nationSymbol)
    setPlans(getDefaultPlans(nationSymbol))
    setSearchParams({ type: nationSymbol }, { replace: true })
  }

  // Fetch plans dynamically from API when selectedNation changes
  useEffect(() => {
    let isMounted = true

    axiosInstance
      .get(`/vps/plan?plan=${selectedNation}`)
      .then((res) => {
        if (isMounted && res.data?.success && Array.isArray(res.data.info)) {
          const sortedPlans = [...res.data.info].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          )
          setPlans(sortedPlans)
        } else if (isMounted) {
          setPlans((prev) => prev.map((plan) => ({ ...plan, status: 'error' })))
        }
      })
      .catch((err) => {
        console.error('Failed to fetch VPS plans:', err)
        if (isMounted) {
          setPlans((prev) => prev.map((plan) => ({ ...plan, status: 'error' })))
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedNation])

  // Get current category/nation display title
  const currentSpecial = vpsSpecialOptions.find((s) => s.symbol === selectedNation)

  const sectionTitle = currentSpecial
    ? `${t('vpsPrice.listTitle')} ${currentSpecial.name}`
    : `${t('vpsPrice.listTitle')} (${selectedNation})`

  return (
    <main className="bg-body text-text-primary min-h-screen">
      {/* Hero Banner (Aurora Glow & Radar Rings) */}
      <section className="from-surface via-surface to-body border-border/40 relative overflow-hidden border-b bg-linear-to-b px-6 py-10 md:px-8 md:py-12">
        {/* Aurora glow layers */}
        <div className="from-primary/25 pointer-events-none absolute -top-24 right-10 h-64 w-80 rounded-full bg-linear-to-tr via-purple-500/20 to-sky-400/25 blur-3xl" />
        <div className="pointer-events-none absolute right-60 -bottom-10 size-48 rounded-full bg-cyan-400/15 blur-2xl" />

        {/* Concentric radar rings anchored on the right */}
        <div className="relative z-10 mx-auto max-w-380">
          <div className="border-primary/15 pointer-events-none absolute top-1/2 -right-10 size-64 -translate-y-1/2 rounded-full border" />
          <div className="border-primary/10 pointer-events-none absolute top-1/2 -right-20 size-84 -translate-y-1/2 rounded-full border" />
          <div className="border-primary/5 pointer-events-none absolute top-1/2 -right-32 size-108 -translate-y-1/2 rounded-full border" />

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3">
                <span className="from-primary/20 text-primary border-primary/30 inline-flex items-center gap-2 rounded-full border bg-linear-to-r to-purple-500/20 px-3.5 py-1 text-xs font-bold tracking-wide">
                  <span className="relative flex size-2">
                    <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                    <span className="bg-primary relative inline-flex size-2 rounded-full" />
                  </span>
                  {t('vpsPrice.bannerBadge')}
                </span>
              </div>

              <h1 className="font-headline text-text-primary text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                {t('vpsPrice.title')}
              </h1>
              <p className="text-text-muted mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
                {t('vpsPrice.subtitle')}
              </p>

              {/* Feature pills row */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="bg-body/60 border-border/60 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium">
                  <svg
                    className="text-primary size-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {t('vpsPrice.pillDDoS')}
                </span>
                <span className="bg-body/60 border-border/60 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium">
                  <svg
                    className="text-primary size-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  {t('vpsPrice.pillStorage')}
                </span>
                <span className="bg-body/60 border-border/60 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium">
                  <svg
                    className="text-primary size-3.5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  {t('vpsPrice.pillBandwidth')}
                </span>
              </div>
            </div>

            {/* Glowing Server Icon Badge */}
            <div className="border-primary/30 bg-primary/10 relative hidden size-24 items-center justify-center rounded-2xl border shadow-[0_0_35px_rgba(74,163,255,0.25)] backdrop-blur-md md:flex">
              <ServerIcon className="text-primary size-12" />
              <span className="bg-primary absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-white shadow-xs">
                <svg
                  className="size-2.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-380 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* Selector Section: Standard Nations & Specialized VPS Lines */}
        <section className="mb-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-2">
              <HubIcon className="text-primary size-6" />
              <h2 className="font-headline text-text-primary text-base font-bold tracking-wider uppercase">
                {t('vpsPrice.categoriesTitle')}
              </h2>
            </div>
            <span className="text-text-muted text-xs font-medium">
              {vpsNations.length} {t('vpsPrice.categoriesSummary')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Standard Nations Grid (Left 8 cols) */}
            <div className="space-y-3 lg:col-span-8">
              <div className="text-text-muted flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary size-4"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                </svg>
                {t('vpsPrice.locations')}
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {vpsNations.map((nation) => {
                  const isActive = nation.symbol === selectedNation
                  return (
                    <button
                      key={nation.symbol}
                      onClick={() => handleSelectNation(nation.symbol)}
                      className={`nation-btn border-border flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left ${
                        isActive ? 'nation-btn-active' : 'bg-surface'
                      }`}
                    >
                      <div className="flex h-5 w-7 shrink-0 items-center overflow-hidden rounded-sm shadow-xs">
                        {nation.flag}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs font-bold ${
                            isActive ? 'text-primary' : 'text-text-primary'
                          }`}
                        >
                          {t(`nation.${nation.symbol}`) || nation.name}
                        </p>
                        <p className="text-text-muted font-mono text-[10px] font-medium uppercase">
                          {nation.symbol}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Specialized Server Types (Right 4 cols: PTU & GPU) */}
            <div className="space-y-3 lg:col-span-4">
              <div className="text-text-muted flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary size-4"
                >
                  <rect width="12" height="12" x="6" y="6" rx="2" />
                  <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
                </svg>
                {t('vpsPrice.specializedServers')}
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {vpsSpecialOptions.map((opt) => {
                  const isActive = opt.symbol === selectedNation
                  const badgeText =
                    opt.symbol === 'gpu' ? t('vpsPrice.badgeGpu') : t('vpsPrice.badgePtu')
                  const descText =
                    opt.symbol === 'gpu' ? t('vpsPrice.descGpu') : t('vpsPrice.descPtu')

                  return (
                    <button
                      key={opt.symbol}
                      onClick={() => handleSelectNation(opt.symbol)}
                      className={`nation-btn border-border flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left ${
                        isActive ? 'nation-btn-active' : 'bg-surface'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg p-1.5 ${
                            isActive ? 'bg-primary/20 text-primary' : 'bg-navbar text-text-muted'
                          }`}
                        >
                          {opt.flag}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`truncate text-xs font-bold ${
                              isActive ? 'text-primary' : 'text-text-primary'
                            }`}
                          >
                            {opt.name}
                          </p>
                          <p className="text-text-muted truncate text-[10px] font-medium">
                            {descText}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-24 shrink-0 rounded py-1 text-center text-[9px] font-bold tracking-wider uppercase ${
                          isActive
                            ? 'bg-blue text-white'
                            : 'bg-navbar text-text-muted border-border/40 border'
                        }`}
                      >
                        {badgeText}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* List of VPS Cards Grid */}
        <section>
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <ServerIcon className="text-primary size-8" />
              <h3 className="font-headline text-text-primary text-lg font-bold">{sectionTitle}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((card, idx) => (
              <VpsCard
                key={`${selectedNation}-${idx}`}
                card={card}
                animDelay={idx * 120}
                onBuy={() => {
                  if (!card?.id) return
                  navigate(`/price/vps/buy?nation=${selectedNation}&planId=${card.id}`, {
                    state: { card },
                  })
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
