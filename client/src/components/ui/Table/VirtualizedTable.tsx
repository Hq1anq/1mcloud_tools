import React, { forwardRef } from 'react'
import { TableVirtuoso } from 'react-virtuoso'
import BaseTable from './BaseTable'
import { VIRTUOSO_COMPONENTS, itemContent } from './TableVirtuosoRow'
import type { TableRowContext } from './types'

export interface VirtualizedTableProps extends Record<string, any> {
  data?: any[]
  headers?: string[]
  tableTitle?: string
  selectable?: boolean
}

const VirtualizedTable = forwardRef<HTMLDivElement, VirtualizedTableProps>(
  function VirtualizedTable(props, ref) {
    return (
      <BaseTable
        {...props}
        ref={ref}
        renderBody={({
          filteredData,
          context,
          virtuosoContext,
          fixedHeader,
          scrollParent,
        }: {
          filteredData: Record<string, any>[]
          context?: TableRowContext
          virtuosoContext: TableRowContext
          fixedHeader: () => React.ReactNode
          scrollParent?: HTMLElement
        }) => {
          if (scrollParent === undefined) return null
          const rowContext = context ?? virtuosoContext

          return (
            <TableVirtuoso
              data={filteredData}
              customScrollParent={scrollParent}
              context={rowContext}
              components={VIRTUOSO_COMPONENTS}
              fixedHeaderContent={fixedHeader}
              itemContent={itemContent}
              overscan={150}
              increaseViewportBy={{ top: 80, bottom: 80 }}
            />
          )
        }}
      />
    )
  }
)

export default VirtualizedTable
