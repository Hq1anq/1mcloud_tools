import React from 'react'
import { resolveRowBaseColor, buildTableRowStyle } from './tableRowStyles'
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

  // Resolve base background color systematically (Refunded -> Override -> Expiry -> Surface)
  const baseBgColor = resolveRowBaseColor({
    isRefunded,
    overrideClass,
    expired: row?.expired,
  })
  const rowStyle = buildTableRowStyle(baseBgColor)

  // Pass any custom override class if it is not an action-cell class handled by baseBgColor
  const customOverrideClass =
    overrideClass && overrideClass !== 'bg-success-cell' && overrideClass !== 'bg-error-cell'
      ? overrideClass
      : ''

  const rowClassName = `table-row-system ${customOverrideClass}`.trim()

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
    baseBgColor,
    rowStyle,
    expiryStyle: rowStyle,
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
  const { isSelected, isRefunded, rowStyle, rowClassName, handleClick } = getTableRowState({
    row,
    index,
    context,
    onClick,
  })

  return (
    <tr
      {...props}
      data-selected={isSelected ? 'true' : undefined}
      data-refunded={isRefunded ? 'true' : undefined}
      style={{ ...rowStyle, ...style }}
      className={`${rowClassName} ${className}`.trim()}
      onClick={handleClick}
    >
      {children ?? <TableCells row={row} index={index} context={context} />}
    </tr>
  )
}
