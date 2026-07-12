import { getFlagIcon } from '../../../data/flags.jsx'

// Nation flag helper
export function getNationFlag(nation: string): any {
  if (['GPU', 'EU'].includes(nation)) return nation
  return getFlagIcon(nation) || ''
}

// Core filter logic: check contain keyword
export function matchesFilter(cellValue: unknown, filterValue: string): boolean {
  if (cellValue === undefined || cellValue === null) return false
  const strCell = String(cellValue).toLowerCase()
  const strFilter = filterValue.toLowerCase().trim()
  return strCell.includes(strFilter)
}

/**
 * Filters `data` against `filters` map (Record<string, string>).
 * Evaluates keyword containment for each active filter.
 */
export function applyFilters<T extends Record<string, any>>(
  data: T[],
  filters: Record<string, string>
): T[] {
  if (!data || data.length === 0) return data

  const activeFilters = Object.entries(filters)
    .map(([key, val]) => [key, (val ?? '').trim()] as const)
    .filter(([, val]) => val.length > 0)

  if (activeFilters.length === 0) return data

  return data.filter((row) =>
    activeFilters.every(([key, filterVal]) => matchesFilter(row[key], filterVal))
  )
}
