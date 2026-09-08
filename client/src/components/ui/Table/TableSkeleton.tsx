import React from 'react'

const SKELETON_WIDTHS = [
  ['w-20', 'w-32', 'w-24', 'w-16', 'w-24', 'w-24', 'w-24', 'w-20', 'w-32'],
  ['w-24', 'w-28', 'w-20', 'w-16', 'w-20', 'w-24', 'w-24', 'w-16', 'w-28'],
  ['w-16', 'w-32', 'w-24', 'w-20', 'w-24', 'w-24', 'w-24', 'w-20', 'w-24'],
  ['w-20', 'w-28', 'w-28', 'w-16', 'w-20', 'w-24', 'w-24', 'w-16', 'w-32'],
  ['w-24', 'w-32', 'w-20', 'w-20', 'w-24', 'w-24', 'w-24', 'w-20', 'w-24'],
  ['w-16', 'w-28', 'w-24', 'w-16', 'w-20', 'w-24', 'w-24', 'w-16', 'w-32'],
]

export interface TableSkeletonProps {
  headers: string[]
  selectable: boolean
  fixedHeader: () => React.ReactNode
}

/**
 * Animated skeleton shown while `isLoading` is true.
 */
export default function TableSkeleton({ headers, selectable, fixedHeader }: TableSkeletonProps) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>{fixedHeader()}</thead>
      <tbody>
        {SKELETON_WIDTHS.map((rowWidths, rowIndex) => (
          <tr key={rowIndex} className="border-border/50 border-b">
            {selectable && (
              <td className="w-12 p-4 text-center align-middle">
                <div className="shimmer-bg mx-auto size-4 animate-pulse rounded"></div>
              </td>
            )}
            {headers.map((header, colIndex) => {
              const widthClass = rowWidths[colIndex % rowWidths.length]
              const isRoundedFull = header === 'status' || header === 'is_auto_renew'
              return (
                <td key={header} className="p-4 align-middle">
                  <div
                    className={`shimmer-bg h-4 ${widthClass} animate-pulse ${
                      isRoundedFull ? 'h-6! rounded-full' : 'rounded'
                    }`}
                  ></div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
