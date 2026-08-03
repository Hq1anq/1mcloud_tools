import type React from 'react'

export const handleCopy = (e: React.MouseEvent<HTMLElement>, text: string): void => {
  e.stopPropagation() // Prevent event bubbling to its parent (<tr>)
  navigator.clipboard.writeText(text).catch((err: unknown) => {
    console.error('Failed to copy: ', err)
  })
}

export const getStatusClasses = (status?: string): string => {
  switch (status) {
    case 'Running':
    case 'Active':
      return 'bg-status-green/20 border border-status-green/30 text-status-green'
    case 'Off':
    case 'Inactive':
    case 'Stopped':
      return 'bg-status-red/20 border border-status-red/30 text-status-red'
    case 'Paused':
      return 'bg-status-yellow/20 border border-status-yellow/30 text-status-yellow'
    case 'Refunded':
      return 'bg-status-gray/20 border border-status-gray/30 text-status-gray'
    case 'Unknown':
      return 'bg-purple/20 border border-purple/30 text-purple'
    default:
      return ''
  }
}

const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
export const randomDelay = (): Promise<void> => delay(700 + Math.random() * 400)

export const maskProductKey = (key?: string): string => {
  if (!key) return ''
  const cleaned = key.trim().toUpperCase()
  const pattern = /^([A-Z0-9]{5})-([A-Z0-9]{5})-([A-Z0-9]{5})-([A-Z0-9]{5})-([A-Z0-9]{5})$/
  if (pattern.test(cleaned)) {
    return cleaned.replace(pattern, '$1-•••••-•••••-•••••-$5')
  }
  return key
}

export const formatWindowsProductKey = (val?: string): string => {
  if (!val) return ''
  const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const groups: string[] = []
  for (let i = 0; i < cleaned.length && i < 25; i += 5) {
    groups.push(cleaned.slice(i, i + 5))
  }
  return groups.join('-')
}

export const isValidLicense = (licenseKey: string): boolean =>
  /^[a-zA-Z0-9]{5}-[a-zA-Z0-9]{5}-[a-zA-Z0-9]{5}-[a-zA-Z0-9]{5}-[a-zA-Z0-9]{5}$/.test(licenseKey)
