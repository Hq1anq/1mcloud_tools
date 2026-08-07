import React from 'react'
import { getExpiryStyle } from '../../../utils/ui'
import TableCells from './TableCells'
import type { TableRowProps, TableRowContext } from './types'

export interface TableRowStateOptions<T> {
  row: T
  index: number
  context: TableRowContext<T>
  onClick?: React.MouseEventHandler<HTMLTableRowElement>
}

export function getTableRowState<T extends Record<string, any>>({
  row,
  index,
  context,
  onClick,
}: TableRowStateOptions<T>) {
  const { selectable, selectedIds, handleSelectRow, getRowKey, rowClassMap } = context

  const key = getRowKey(row, index)
  const isSelected = Boolean(selectable && selectedIds.has(key))
  const overrideClass = row && rowClassMap ? rowClassMap[row.sid] : undefined
  const isRefunded = row?.status === 'Refunded'

  // Expiry style is only applied when no action-override class is present.
  const expiryStyle = !overrideClass ? getExpiryStyle(row?.expired) : null
  const bgClass = overrideClass ? overrideClass : isSelected ? 'bg-bg-selected' : ''
  const rowClassName = `transition-colors ${isRefunded ? 'cursor-not-allowed opacity-50 select-none' : 'hover:bg-bg-hover'} ${bgClass}`

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (isRefunded || !selectable) return
    const target = e.target as HTMLElement | null
    if (target?.closest('input') || target?.closest('button') || target?.closest('label')) return

    handleSelectRow(index, e.shiftKey, row)
    onClick?.(e)
  }

  return {
    key,
    isSelected,
    isRefunded,
    selectable,
    expiryStyle,
    rowClassName,
    handleClick,
  }
}

export default function TableRow<T extends Record<string, any>>({
  row,
  index,
  context,
  className = '',
  onClick,
  style,
  children,
  ...props
}: TableRowProps<T>) {
  const { expiryStyle, rowClassName, handleClick } = getTableRowState({
    row,
    index,
    context,
    onClick,
  })

  return (
    <tr
      {...props}
      style={{ ...expiryStyle, ...style }}
      className={`${rowClassName} ${className}`.trim()}
      onClick={handleClick}
    >
      {children ?? <TableCells row={row} index={index} context={context} />}
    </tr>
  )
}
