import React, { forwardRef } from 'react'
import BaseTable from './BaseTable'
import TableRow from './TableRow'
import type { TableRowContext } from './types'

export interface StandardTableProps extends Record<string, any> {
  data?: any[]
  headers?: string[]
  tableTitle?: string
  selectable?: boolean
}

const StandardTable = forwardRef<HTMLDivElement, StandardTableProps>(
  function StandardTable(props, ref) {
    return (
      <BaseTable
        {...props}
        ref={ref}
        renderBody={({
          filteredData,
          context,
          virtuosoContext,
          fixedHeader,
        }: {
          filteredData: Record<string, any>[]
          context?: TableRowContext
          virtuosoContext: TableRowContext
          fixedHeader: () => React.ReactNode
        }) => {
          if (filteredData.length === 0) return null
          const rowContext = context ?? virtuosoContext

          return (
            <table className="w-full border-collapse text-left">
              <thead>{fixedHeader()}</thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <TableRow
                    key={rowContext.getRowKey(row, index)}
                    row={row}
                    index={index}
                    context={rowContext}
                  />
                ))}
              </tbody>
            </table>
          )
        }}
      />
    )
  }
)

export default StandardTable
