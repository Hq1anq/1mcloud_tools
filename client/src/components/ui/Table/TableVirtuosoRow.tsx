import React from 'react'
import TableCells from './TableCells'
import { getTableRowState } from './TableRow'
import type { VirtuosoTableRowProps, TableRowContext } from './types'

export const VirtuosoTableRow = <T extends Record<string, any>>({
  context,
  ...props
}: VirtuosoTableRowProps<T>) => {
  const index = props['data-index']
  const row = props.item

  const { isSelected, isRefunded, rowStyle, rowClassName, handleClick } = getTableRowState({
    row,
    index,
    context,
    onClick: props.onClick,
  })

  return (
    <tr
      {...props}
      data-selected={isSelected ? 'true' : undefined}
      data-refunded={isRefunded ? 'true' : undefined}
      style={{ ...rowStyle, ...props.style }}
      className={`${rowClassName} ${props.className || ''}`.trim()}
      onClick={handleClick}
    />
  )
}

const TableComponent = (props: React.HTMLAttributes<HTMLTableElement>) => (
  <table {...props} className={`w-full ${props.className || ''}`.trim()} />
)

export const VIRTUOSO_COMPONENTS = {
  TableRow: VirtuosoTableRow,
  Table: TableComponent,
}

// ── Cell renderer for TableVirtuoso ───────────────────────────────────────
export const itemContent = <T extends Record<string, any>>(
  index: number,
  row: T,
  context: TableRowContext<T>
) => <TableCells row={row} index={index} context={context} />

// Backwards compatibility alias for legacy imports
export { VirtuosoTableRow as TableRow }
