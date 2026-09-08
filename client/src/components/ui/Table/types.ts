import type React from 'react'

export interface TableRowContext<T = Record<string, any>> {
  selectable: boolean
  selectedIds: Set<string | number>
  headers: string[]
  rowClassMap?: Record<string | number, string>
  handleSelectRow: (index: number, shiftKey: boolean, row: T) => void
  getRowKey: (row: T, index: number) => string | number
  showCountryCode: boolean
  onAutoRenewToggle?: (sid: number | string, newState: boolean) => void
  controlButton?: (row: T) => React.ReactNode
  t: (key: string) => string
}

export interface TableCellsProps<T = Record<string, any>> {
  row: T
  index: number
  context: TableRowContext<T>
}

export interface TableRowProps<T = Record<string, any>>
  extends React.HTMLAttributes<HTMLTableRowElement> {
  row: T
  index: number
  context: TableRowContext<T>
}

export interface VirtuosoTableRowProps<T = Record<string, any>>
  extends React.HTMLAttributes<HTMLTableRowElement> {
  context: TableRowContext<T>
  item: T
  'data-index': number
  children?: React.ReactNode
}

export interface RenderBodyParams<T = Record<string, any>> {
  filteredData: T[]
  context: TableRowContext<T>
  virtuosoContext: TableRowContext<T>
  fixedHeader: () => React.ReactNode
  scrollParent?: HTMLElement
  t: (key: string) => string
}

export interface RenderFooterParams<T = Record<string, any>> {
  filteredData: T[]
  t: (key: string) => string
}

export interface BaseTableProps<T = Record<string, any>>
  extends React.HTMLAttributes<HTMLDivElement> {
  data?: T[]
  isLoading?: boolean
  selectable?: boolean
  useFilter?: boolean
  tableTitle?: string
  headers?: string[]
  operatorConfig?: Record<string, string[]>
  controlButton?: (row: T) => React.ReactNode
  onAutoRenewToggle?: (sid: number | string, newState: boolean) => void
  selectedIds?: Set<number | string>
  onSelectionChange?: (rows: T[], ids: Set<number | string>) => void
  getRowKey?: (row: T, index?: number) => number | string
  renderBody?: (params: RenderBodyParams<T>) => React.ReactNode
  renderFooter?: (params: RenderFooterParams<T>) => React.ReactNode
  extraBtn?: React.ReactNode
  emptyState?: React.ReactNode
  isError?: boolean
  errorMessage?: React.ReactNode
  className?: string
  rowClassMap?: Record<number | string, string>
}
