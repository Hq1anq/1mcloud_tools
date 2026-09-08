import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { animate } from 'motion/react'
import { proxyNations } from '../data/proxyNations.jsx'
import { EarthIcon } from '../assets/icons'
import axiosInstance from '../lib/axios.js'
import ProxyCard from '../components/price/ProxyCard.jsx'
import { useTranslation } from '../i18n'

// Build initial prices map: { [symbol]: { price, loading, error } }
const buildInitialPrices = () => {
  const map = {}
  proxyNations.forEach(({ symbol }) => {
    map[symbol] = { price: '', loading: true, error: false }
  })
  return map
}

export default function ProxyPrice() {
  const t = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [prices, setPrices] = useState(buildInitialPrices)

  // Strictly use 'nation' query parameter
  const nationParam = searchParams.get('nation')
  const [dismissedNation, setDismissedNation] = useState(null)

  const highlightedNation = nationParam && nationParam !== dismissedNation ? nationParam : null

  // 5-second timer to automatically dismiss the highlight effect
  useEffect(() => {
    if (!highlightedNation) return

    // Scroll smoothly into view using Motion animate()
    const timerScroll = setTimeout(() => {
      const cardElement = document.getElementById(`proxy-card-${highlightedNation}`)
      const container = document.getElementById('main-scroll-container')
      if (cardElement && container) {
        const targetTop = Math.max(
          0,
          cardElement.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop -
            24
        )
        animate(container.scrollTop, targetTop, {
          duration: 0.75,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (latest) => {
            container.scrollTop = latest
          },
        })
      }
    }, 120)

    const timerDismiss = setTimeout(() => {
      setDismissedNation(highlightedNation)
    }, 5000)

    return () => {
      clearTimeout(timerScroll)
      clearTimeout(timerDismiss)
    }
  }, [highlightedNation])

  // Batch fetch – one parallel POST per nation on mount
  useEffect(() => {
    let isMounted = true

    proxyNations.forEach(({ symbol }) => {
      axiosInstance
        .post('/server/create/calculate', {
          plan_id: 0,
          is_proxy: true,
          quantity: 1,
          nation: symbol,
          duration: 1,
          coupon: '',
        })
        .then((res) => {
          if (!isMounted) return
          if (res.data?.success && res.data.info?.original_price) {
            const displayPrice = res.data.info.original_price.split(' ')[0]
            setPrices((prev) => ({
              ...prev,
              [symbol]: { price: displayPrice, loading: false, error: false },
            }))
          } else {
            setPrices((prev) => ({
              ...prev,
              [symbol]: { price: '', loading: false, error: true },
            }))
          }
        })
        .catch(() => {
          if (!isMounted) return
          setPrices((prev) => ({
            ...prev,
            [symbol]: { price: '', loading: false, error: true },
          }))
        })
    })

    return () => {
      isMounted = false
    }
  }, [])

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

          {/* Glowing Globe Icon Badge */}
          <div className="border-primary/30 bg-primary/10 absolute top-1/2 right-10 hidden size-24 -translate-y-1/2 items-center justify-center rounded-2xl border shadow-[0_0_35px_rgba(74,163,255,0.25)] md:flex">
            <EarthIcon className="text-primary size-12" />
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

          <span className="from-primary/20 text-primary border-primary/30 mb-3 inline-flex items-center gap-2 rounded-full border bg-linear-to-r to-purple-500/20 px-3.5 py-1 text-xs font-bold tracking-wide">
            <span className="relative flex size-2">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-primary relative inline-flex size-2 rounded-full" />
            </span>
            {t('proxyPrice.bannerBadge')}
          </span>

          <h1 className="font-headline text-text-primary text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
            {t('proxyPrice.title')}
          </h1>
          <p className="text-text-muted mt-2 max-w-2xl text-sm leading-relaxed md:text-base">
            {t('proxyPrice.subtitle')}
          </p>

          {/* Feature pills row */}
          <div className="text-text-primary mt-4 flex flex-col gap-2 text-xs font-medium sm:flex-row">
            <span className="bg-body/60 border-border/60 inline-flex max-w-68 items-center gap-1.5 rounded-lg border px-3 py-1.5 max-sm:grow">
              <svg
                className="text-primary size-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              {t('proxyPrice.pillProtocols')}
            </span>
            <span className="bg-body/60 border-border/60 inline-flex max-w-68 items-center gap-1.5 rounded-lg border px-3 py-1.5 max-sm:grow">
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
              {t('proxyPrice.pillDedicatedIp')}
            </span>
            <span className="bg-body/60 border-border/60 inline-flex max-w-68 items-center gap-1.5 rounded-lg border px-3 py-1.5 max-sm:grow">
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
              {t('proxyPrice.pillUnlimited')}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-380 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* Card Grid */}
        <section>
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary size-5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
              </svg>
              <h2 className="font-headline text-text-primary text-lg font-bold">
                {t('proxyPrice.sectionTitle')}
              </h2>
            </div>
            <span className="text-text-muted text-xs font-medium">
              {proxyNations.length} {t('proxyPrice.countriesUnit')} &bull;{' '}
              {t('proxyPrice.durationUnit')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {proxyNations.map((nation, idx) => {
              const { price, loading, error } = prices[nation.symbol] || {
                loading: true,
                error: false,
                price: '',
              }
              return (
                <ProxyCard
                  key={nation.symbol}
                  nation={nation}
                  price={price}
                  loading={loading}
                  error={error}
                  animDelay={idx * 45}
                  isHighlighted={nation.symbol === highlightedNation}
                  onBuy={() =>
                    navigate(`/price/proxy/buy?nation=${nation.symbol}`, {
                      state: {
                        nation: {
                          symbol: nation.symbol,
                          name: nation.name,
                          shortName: nation.shortName,
                        },
                        price,
                      },
                    })
                  }
                />
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
