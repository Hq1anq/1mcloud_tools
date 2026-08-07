import React from 'react'
import { getNationFlag } from './filterUtils.jsx'
import Checkbox from '../Checkbox.jsx'
import RenewToggle from '../RenewToggle.jsx'
import { getStatusClasses, handleCopy } from '../../../utils/ui'
import type { TableCellsProps } from './types'

const LEFT_ALIGNED_HEADERS = new Set([
  'ip_port',
  'note',
  'ip',
  'old_ip',
  'new_ip',
  'description',
  'update_balance',
])

export default function TableCells<T extends Record<string, any>>({
  row,
  index,
  context,
}: TableCellsProps<T>) {
  const {
    selectable,
    selectedIds,
    handleSelectRow,
    getRowKey,
    headers,
    showCountryCode,
    onAutoRenewToggle,
    controlButton,
  } = context

  const key = getRowKey(row, index)
  const isSelected = Boolean(selectable && selectedIds.has(key))
  const isRefunded = row?.status === 'Refunded'

  return (
    <>
      {selectable && (
        <td data-capture-ignore className="border-border border-b p-2 text-center sm:px-4">
          <Checkbox
            checked={isSelected}
            indeterminate={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleSelectRow(index, (e.nativeEvent as MouseEvent).shiftKey || false, row)
            }
            disabled={isRefunded}
          />
        </td>
      )}

      {headers.map((header) => {
        const cellValue = row[header]
        const statusClass = header === 'status' ? getStatusClasses(cellValue) : ''
        const nationFlag = header === 'country' && !showCountryCode ? getNationFlag(cellValue) : ''
        const isLeftAligned = LEFT_ALIGNED_HEADERS.has(header)

        return (
          <td
            key={header}
            className={`border-border border-b px-2 whitespace-nowrap sm:px-4 ${
              isLeftAligned ? 'text-left' : 'text-center'
            } ${nationFlag ? '' : 'py-2'}`}
            onClick={(e) => {
              if (e.detail === 3) handleCopy(e, cellValue)
            }}
            title="Triple click to copy"
          >
            {header === 'control' && controlButton ? (
              controlButton(row)
            ) : header === 'is_auto_renew' ? (
              <RenewToggle
                isOn={cellValue}
                onConfirm={(newState: boolean) => onAutoRenewToggle?.(row.sid, newState)}
              />
            ) : statusClass ? (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${statusClass}`}
              >
                {statusClass && <span className="mr-2 size-2 rounded-full bg-current" />}
                {cellValue}
              </span>
            ) : nationFlag ? (
              <div className="mx-auto grid size-10 place-items-center">{nationFlag}</div>
            ) : header === 'trans_type' ? (
              <span
                className={
                  cellValue === 'BUY' ? 'text-green' : cellValue === 'REFUND' ? 'text-red' : ''
                }
              >
                {cellValue}
              </span>
            ) : header === 'amount' ? (
              <span
                className={
                  String(cellValue ?? '').startsWith('-')
                    ? 'text-red'
                    : cellValue === '0' || cellValue === 0
                      ? ''
                      : 'text-green'
                }
              >
                {cellValue}
              </span>
            ) : (
              <span>{cellValue}</span>
            )}
          </td>
        )
      })}
    </>
  )
}
