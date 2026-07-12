import CardBody from './CardBody.jsx'
import CountUp from '../ui/CountUp.jsx'
import { parseVND, formatVND } from '../../utils/data'
import { useTranslation } from '../../i18n'
import {
  CpuIcon,
  RamIcon,
  StorageIcon,
  GpuIcon,
  EarthIcon,
  RouterIcon,
  SpeedIcon,
  CartIcon,
  EmptyIcon,
  ErrorIcon,
} from '../../assets/icons'

// ── Component ───────────────────────────────────────────────────

/**
 * Props:
 *   card      – { name, price, cpu, ram, ssd, vRAM?, status, ipv4?, bandwidth?, ethernet_port? }
 *   animDelay – number (ms)
 *   onBuy     – optional callback
 */
export default function VpsCard({ card, animDelay, onBuy }) {
  const t = useTranslation()
  const isAvailable = card.status === 'available'
  const isError = card.status === 'error'
  const isSoldOut = card.status === 'sold_out'
  const hasVRAM = Boolean(card.vRAM)

  const isPTU = card.region === 'EU'

  // Build primary items dynamically (vRAM conditional, highlight SSD for PTU, vRAM for GPU)
  const primaryItems = [
    { icon: <CpuIcon />, label: 'CPU', value: card.cpu || 'N/A' },
    { icon: <RamIcon />, label: 'RAM', value: card.ram || 'N/A' },
    { icon: <StorageIcon />, label: 'SSD', value: card.ssd || 'N/A', highlight: isPTU },
    ...(hasVRAM
      ? [
          {
            icon: <GpuIcon />,
            label: 'vRAM',
            value: card.vRAM.trim().split(' ')[0],
            highlight: true,
          },
        ]
      : []),
  ]

  // Other details: prefer API values, fall back to translated static labels
  const otherItems = [
    { icon: <EarthIcon />, text: `${card.ipv4?.split(' ')[0] || 1} ${t('priceCard.ipv4Text')}` },
    { icon: <RouterIcon />, text: t('priceCard.bandwidthText') },
    { icon: <SpeedIcon />, text: `${card.ethernet_port || '1 Gbps'} Ethernet port` },
  ]

  const canBuy = isAvailable && typeof card.id === 'number'

  const action = (
    <button
      type="button"
      disabled={!canBuy}
      onClick={(e) => {
        if (!canBuy) {
          e.preventDefault()
          return
        }
        onBuy?.()
      }}
      className="btn-primary flex w-full items-center justify-center gap-2 enabled:active:scale-[0.98]"
    >
      {isAvailable ? (
        <>
          <span>{t('priceCard.buyNow')}</span>
          <CartIcon className="size-8" />
        </>
      ) : isSoldOut ? (
        <>
          <span>{t('priceCard.soldOut')}</span>
          <EmptyIcon className="size-7" />
        </>
      ) : (
        <>
          <span>{t('priceCard.error')}</span>
          <ErrorIcon className="size-7" />
        </>
      )}
    </button>
  )

  return (
    <div
      className={`vps-plan-card animate-vps-float-in border-border bg-surface flex flex-col overflow-hidden rounded-2xl border shadow-sm ${
        !isAvailable ? 'vps-plan-card--disabled opacity-60 grayscale-30' : ''
      }`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* ── Card Header ── */}
      <div className="bg-navbar border-border border-b p-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-headline text-text-primary text-2xl font-bold tracking-tight">
            {card.name}
          </h4>

          {/* Status dot */}
          <div className="flex items-center gap-1.5">
            {isAvailable && (
              <>
                <span className="bg-green h-2 w-2 animate-pulse rounded-full" />
                <span className="text-green font-mono text-[11px] font-bold tracking-wider uppercase">
                  {t('priceCard.available')}
                </span>
              </>
            )}
            {isSoldOut && (
              <>
                <span className="bg-red h-2 w-2 rounded-full" />
                <span className="text-red font-mono text-[11px] font-bold tracking-wider uppercase">
                  {t('priceCard.soldOut')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          {isError ? (
            <span className="font-headline text-primary text-3xl font-extrabold tracking-tight">
              --
            </span>
          ) : (
            <CountUp
              value={parseVND(card.price)}
              format={formatVND}
              duration={0.5}
              middle={100000}
              className="font-headline text-primary text-3xl font-extrabold tracking-tight"
            />
          )}
          <span className="text-text-muted text-xs font-medium">{t('priceCard.perMonth')}</span>
        </div>
      </div>

      {/* ── Card Body (shared) ── */}
      <CardBody primaryItems={primaryItems} otherItems={otherItems} action={action} />
    </div>
  )
}
