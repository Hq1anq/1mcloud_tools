import type React from 'react'
import { parseDDMMYYYY } from '../../../utils/data'

export interface ResolveRowBaseColorOptions {
  isRefunded: boolean
  overrideClass?: string
  expired?: string
}

/**
 * Returns the CSS variable token representing the expiry base background color
 * based on the number of days until expiration.
 *
 * - daysLeft < 1: Already expired (purple tint)
 * - daysLeft === 1: Expiring tomorrow (urgent red tint)
 * - daysLeft === 2: Expiring in 2 days (warning red tint)
 * - daysLeft === 3: Expiring in 3 days (subtle red tint)
 * - Otherwise: null (default row surface)
 */
export function getExpiryBaseColor(expiredStr?: string): string | null {
  if (!expiredStr) return null

  const expiry = parseDDMMYYYY(expiredStr)
  if (!expiry) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)

  const msPerDay = 1000 * 60 * 60 * 24
  const daysLeft = Math.round((expiry.getTime() - today.getTime()) / msPerDay)

  if (daysLeft < 1) {
    return 'var(--table-row-bg-expired)'
  }
  if (daysLeft === 1) {
    return 'var(--table-row-bg-expiring-1)'
  }
  if (daysLeft === 2) {
    return 'var(--table-row-bg-expiring-2)'
  }
  if (daysLeft === 3) {
    return 'var(--table-row-bg-expiring-3)'
  }

  return null
}

/**
 * Resolves the effective base background color for a table row based on
 * priority: Refunded -> Action Override -> Expiry Urgency -> Default.
 */
export function resolveRowBaseColor({
  isRefunded,
  overrideClass,
  expired,
}: ResolveRowBaseColorOptions): string | null {
  if (isRefunded) {
    return null
  }

  if (overrideClass === 'bg-success-cell') {
    return 'var(--color-success-cell)'
  }

  if (overrideClass === 'bg-error-cell') {
    return 'var(--color-error-cell)'
  }

  return getExpiryBaseColor(expired)
}

/**
 * Builds the inline CSS custom property object for the table row element.
 */
export function buildTableRowStyle(baseBg: string | null): React.CSSProperties {
  if (!baseBg) return {}
  return {
    '--table-row-base': baseBg,
  } as React.CSSProperties
}
