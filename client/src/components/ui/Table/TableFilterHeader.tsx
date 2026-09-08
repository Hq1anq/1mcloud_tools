import React from 'react'
import Checkbox from '../Checkbox.jsx'
import { operatorIcons } from './filterUtils.jsx'

export interface TableFilterHeaderProps {
  headers: string[]
  tableTitle?: string
  useFilter?: boolean
  operatorConfig?: Record<string, string[]>
  selectable?: boolean
  selectedIds: Set<any>
  filteredData: any[]
  getRowKey: (row: any, index?: number) => any
  filters: Record<string, any>
  filterInputs: Record<string, string>
  showCountryCode: boolean
  onToggleCountryCode: () => void
  onOperatorToggle: (header: string) => void
  onFilterInputChange: (header: string, value: string) => void
  onFilterKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, header: string) => void
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void
  t: (key: string) => string
}

// Fixed header + per-column filter inputs
export default function TableFilterHeader({
  headers,
  tableTitle,
  useFilter = false,
  operatorConfig,
  selectable = true,
  selectedIds,
  filteredData,
  getRowKey,
  filters,
  filterInputs,
  showCountryCode,
  onToggleCountryCode,
  onOperatorToggle,
  onFilterInputChange,
  onFilterKeyDown,
  onSelectAll,
  t,
}: TableFilterHeaderProps) {
  const selectableRows = filteredData.filter((row) => row?.status?.toLowerCase() !== 'refunded')
  const pageSelectedCount = selectableRows.filter((row, i) => {
    const key = getRowKey(row, i)
    return Boolean(selectedIds?.has(key))
  }).length

  const isAllSelected = selectableRows.length > 0 && pageSelectedCount === selectableRows.length
  const isIndeterminate = pageSelectedCount > 0 && pageSelectedCount < selectableRows.length

  const isHistoryTitle =
    tableTitle === 'Transaction History' || tableTitle === 'Change-IP History'

  return (
    <tr className="bg-thead border-wrapper border-t-4 border-b-2">
      {/* Select-all checkbox */}
      {selectable && (
        <th data-capture-ignore className="px-2 sm:px-4">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            disabled={false}
            onChange={onSelectAll}
          />
        </th>
      )}

      {headers.map((header) => {
        const defaultOperator = operatorConfig?.[header]?.[0] || 'contain'
        const currentFilter = filters[header] || { value: '', operator: defaultOperator }
        const operator = currentFilter.operator
        const OperatorIcon = operatorIcons[operator as keyof typeof operatorIcons]
        const showOperator = operatorConfig ? !!operatorConfig[header] : true
        const inputValue =
          filterInputs[header] !== undefined ? filterInputs[header] : currentFilter.value

        return (
          <th key={header} className="px-2 py-3 font-medium tracking-wider uppercase sm:px-4">
            <div
              className={`flex min-w-15 flex-col gap-1 font-bold whitespace-nowrap ${
                tableTitle === 'Proxy Status' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}
            >
              {/* Column label */}
              <span
                className={
                  [
                    'ip_port',
                    'note',
                    'ip',
                    'old_ip',
                    'new_ip',
                    'description',
                    'update_balance',
                  ].includes(header)
                    ? 'text-left'
                    : 'text-center'
                }
              >
                {header === 'country' ? (
                  <div
                    className="group inline-flex cursor-pointer items-center justify-center gap-1"
                    onClick={onToggleCountryCode}
                    title="Toggle country display (Flag / Code)"
                  >
                    <span>{t('table.' + header) || header.replace(/_/g, ' ')}</span>
                    {!showCountryCode ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        className="text-text-muted group-hover:text-text-primary size-3 shrink-0 fill-current"
                      >
                        <path d="M144 88C144 74.7 133.3 64 120 64C106.7 64 96 74.7 96 88L96 552C96 565.3 106.7 576 120 576C133.3 576 144 565.3 144 552L144 452L224.3 431.9C265.4 421.6 308.9 426.4 346.8 445.3C391 467.4 442.3 470.1 488.5 452.7L523.2 439.7C535.7 435 544 423.1 544 409.7L544 130C544 107 519.8 92 499.2 102.3L489.6 107.1C443.3 130.3 388.8 130.3 342.5 107.1C307.4 89.5 267.1 85.1 229 94.6L144 116L144 88zM144 165.5L240.6 141.3C267.6 134.6 296.1 137.7 321 150.1C375.9 177.5 439.7 179.8 496 156.9L496 398.7L471.6 407.8C437.9 420.4 400.4 418.5 368.2 402.4C320 378.3 264.9 372.3 212.6 385.3L144 402.5L144 165.5z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        className="text-text-muted group-hover:text-text-primary size-3 shrink-0 fill-current"
                      >
                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <>
                    {isHistoryTitle && header === 'created'
                      ? t('table.date')
                      : t('table.' + header) || header.replace(/_/g, ' ')}
                  </>
                )}
              </span>

              {/* Filter input + operator toggle */}
              {useFilter && !['control', 'is_auto_renew'].includes(header) && (
                <div className="relative">
                  {showOperator && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="bg-blue filter-operator fill-text-secondary absolute -top-0.5 -right-1.5 size-4 cursor-pointer rounded-full p-0.5"
                      onClick={() => onOperatorToggle(header)}
                    >
                      <title>{`Filter: ${operator}`}</title>
                      {OperatorIcon}
                    </svg>
                  )}
                  <input
                    type="text"
                    placeholder={t('filter')}
                    className={`filter-input bg-dropdown mt-1 w-full px-2 py-1 ${
                      [
                        'ip_port',
                        'note',
                        'ip',
                        'old_ip',
                        'new_ip',
                        'description',
                        'update_balance',
                      ].includes(header)
                        ? 'text-left'
                        : 'text-center'
                    }`}
                    value={inputValue}
                    onChange={(e) => onFilterInputChange(header, e.target.value)}
                    onKeyDown={(e) => onFilterKeyDown(e, header)}
                  />
                </div>
              )}
            </div>
          </th>
        )
      })}
    </tr>
  )
}
