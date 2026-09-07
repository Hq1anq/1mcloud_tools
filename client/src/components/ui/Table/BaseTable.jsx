import { useState, useMemo, useCallback, forwardRef, useEffect, useRef } from 'react'
import { formatInputDate } from '../../../utils/data'
import { useTranslation } from '../../../i18n'
import { applyFilters, operatorCycle } from './filterUtils.jsx'
import TableFilterHeader from './TableFilterHeader.jsx'
import TableSkeleton from './TableSkeleton.jsx'

const DEFAULT_DATA = []

const BaseTable = forwardRef(function BaseTable(
  {
    // Data
    data,
    receivedData = DEFAULT_DATA,
    renderingReceived,
    setRenderingReceived,
    isLoading = false,

    // Config
    selectable = true,
    useFilter = false,

    // Column config
    title,
    headers,
    operatorConfig,
    controlButton,
    onAutoRenewToggle,

    // Selection
    selectedIds = new Set(),
    onSelectionChange,
    getRowKey: propsGetRowKey,

    // Render slots
    renderBody,
    renderFooter,

    // UI
    extraBtn,
    emptyState,
    isError,
    errorMessage,
    className = '',
    rowClassMap,
  },
  tableRef
) {
  const t = useTranslation()

  // ── Scroll parent ──────────────────────────────────────────────────────
  const [scrollParent, setScrollParent] = useState(undefined)
  useEffect(() => {
    const parent = document.getElementById('main-scroll-container')
    if (parent) setScrollParent(parent)
  }, [])

  // ── Rendering-received sync ────────────────────────────────────────────
  useEffect(() => {
    if (renderingReceived && setRenderingReceived) {
      setRenderingReceived(false)
    }
  }, [renderingReceived, setRenderingReceived])

  // ── Filter state ───────────────────────────────────────────────────────
  const [filters, setFilters] = useState({})
  const [filterInputs, setFilterInputs] = useState({})
  const [filterVersion, setFilterVersion] = useState(0)
  const [showCountryCode, setShowCountryCode] = useState(false)

  // Snapshot of matched SIDs — only recomputed on Enter, not on every data change
  const matchedSidsRef = useRef(null)
  const lastFilterVersionRef = useRef(0)

  // ── Selection state ───────────────────────────────────────────────────
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null)
  const [lastSelectionAction, setLastSelectionAction] = useState('add')

  // ── Filtered + sorted data ─────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let resultData = data || DEFAULT_DATA

    const getRowKey = (r) => r.sid
    const hasKey = resultData.length > 0 && getRowKey(resultData[0]) !== undefined

    if (!useFilter) {
      return [...resultData].sort((a, b) => {
        if (a.sid !== undefined && b.sid !== undefined) return b.sid - a.sid
        return 0
      })
    }

    const isIpPortFilterActive = !!filters['ip_port']?.value
    const isStatusFilterActive = !!filters['status']?.value
    const shouldHideRefunded = !isIpPortFilterActive && !isStatusFilterActive

    if (renderingReceived) {
      lastFilterVersionRef.current = filterVersion
      let initialData = receivedData
      if (shouldHideRefunded)
        initialData = initialData.filter((row) => row?.status?.toLowerCase() !== 'refunded')

      if (hasKey) matchedSidsRef.current = new Set(initialData.map(getRowKey))
      else matchedSidsRef.current = initialData

      resultData = initialData
    } else {
      if (filterVersion !== lastFilterVersionRef.current || !hasKey) {
        lastFilterVersionRef.current = filterVersion

        let result = applyFilters(data, filters)
        if (shouldHideRefunded)
          result = result.filter((row) => row?.status?.toLowerCase() !== 'refunded')

        if (hasKey) matchedSidsRef.current = new Set(result.map(getRowKey))
        else matchedSidsRef.current = result
      }

      if (!hasKey) {
        resultData = matchedSidsRef.current
      } else if (matchedSidsRef.current) {
        resultData = data.filter((row) => matchedSidsRef.current.has(getRowKey(row)))
      } else {
        resultData = data
      }
    }

    return [...resultData].sort((a, b) => {
      if (a.sid !== undefined && b.sid !== undefined) return b.sid - a.sid
      return 0
    })
  }, [data, receivedData, renderingReceived, filters, useFilter, filterVersion])

  const getRowKey = useCallback(
    (row, index) => {
      if (propsGetRowKey) return propsGetRowKey(row, index)
      return row?.sid ?? index
    },
    [propsGetRowKey]
  )

  // ── Selection handlers ─────────────────────────────────────────────────
  const handleSelectRow = useCallback(
    (index, shiftKey, clickedRow) => {
      if (!selectable) return

      const row = clickedRow || filteredData[index]
      if (!row || row?.status?.toLowerCase() === 'refunded') return

      const key = getRowKey(row, index)
      const newSelected = new Set(selectedIds)

      if (shiftKey && lastSelectedIndex !== null && index !== undefined) {
        const start = Math.min(lastSelectedIndex, index)
        const end = Math.max(lastSelectedIndex, index)
        for (let i = start; i <= end; i++) {
          const r = filteredData[i]
          if (!r || r?.status?.toLowerCase() === 'refunded') continue
          const k = getRowKey(r, i)
          if (lastSelectionAction === 'add') {
            newSelected.add(k)
          } else {
            newSelected.delete(k)
          }
        }
      } else {
        const isCurrentlySelected = newSelected.has(key)
        if (isCurrentlySelected) {
          newSelected.delete(key)
          setLastSelectionAction('delete')
        } else {
          newSelected.add(key)
          setLastSelectionAction('add')
        }
        setLastSelectedIndex(index)
      }

      const finalSelectedRows = filteredData.filter(
        (r, i) => newSelected.has(getRowKey(r, i)) && r?.status?.toLowerCase() !== 'refunded'
      )

      onSelectionChange?.(finalSelectedRows, newSelected)
    },
    [
      selectable,
      selectedIds,
      lastSelectedIndex,
      lastSelectionAction,
      filteredData,
      getRowKey,
      onSelectionChange,
    ]
  )

  const handleSelectAll = useCallback(
    (e) => {
      if (!selectable) return
      const newSelected = new Set(selectedIds)

      if (e.target.checked) {
        for (let i = 0; i < filteredData.length; i++) {
          const row = filteredData[i]
          if (row?.status?.toLowerCase() === 'refunded') continue
          newSelected.add(getRowKey(row, i))
        }
      } else {
        newSelected.clear()
      }

      const finalSelectedRows = filteredData.filter(
        (r, i) => newSelected.has(getRowKey(r, i)) && r?.status?.toLowerCase() !== 'refunded'
      )

      onSelectionChange?.(finalSelectedRows, newSelected)
    },
    [selectable, selectedIds, filteredData, getRowKey, onSelectionChange]
  )

  // ── Filter handlers ────────────────────────────────────────────────────
  const handleOperatorToggle = useCallback(
    (header) => {
      const inputValue =
        filterInputs[header] !== undefined ? filterInputs[header] : filters[header]?.value || ''

      setFilters((prev) => {
        const cycle = operatorConfig ? operatorConfig[header] || operatorCycle : operatorCycle
        const defaultOperator = cycle[0]
        const current = prev[header] || { value: '', operator: defaultOperator }
        if (cycle.length <= 1) return prev

        let currentIndex = cycle.indexOf(current.operator)
        if (currentIndex === -1) currentIndex = 0
        const nextIndex = (currentIndex + 1) % cycle.length

        return { ...prev, [header]: { value: inputValue, operator: cycle[nextIndex] } }
      })
    },
    [filterInputs, filters, operatorConfig]
  )

  const handleFilterInputChange = useCallback((header, value) => {
    setFilterInputs((prev) => ({ ...prev, [header]: value }))
  }, [])

  const handleFilterKeyDown = useCallback(
    (e, header) => {
      if (e.key !== 'Enter') return

      const inputValue =
        filterInputs[header] !== undefined ? filterInputs[header] : filters[header]?.value || ''

      let finalValue = inputValue

      if (['created', 'expired'].includes(header) && /^\d+$/.test(inputValue.trim())) {
        finalValue = formatInputDate(inputValue)
        setFilterInputs((prev) => ({ ...prev, [header]: finalValue }))
      }

      const defaultOperator = operatorConfig?.[header]?.[0] || 'contain'
      setFilters((prev) => ({
        ...prev,
        [header]: { ...(prev[header] || { operator: defaultOperator }), value: finalValue },
      }))
      setFilterVersion((v) => v + 1)

      if (selectable) {
        onSelectionChange?.([], new Set())
        setLastSelectedIndex(null)
      }
      if (setRenderingReceived) setRenderingReceived(false)
    },
    [filterInputs, filters, selectable, operatorConfig, onSelectionChange, setRenderingReceived]
  )

  // ── Context for rows ─────────────────────────────────────────────────
  const virtuosoContext = useMemo(
    () => ({
      selectable,
      selectedIds,
      headers,
      rowClassMap,
      handleSelectRow,
      getRowKey,
      showCountryCode,
      onAutoRenewToggle,
      controlButton,
      t,
    }),
    [
      selectable,
      selectedIds,
      headers,
      rowClassMap,
      handleSelectRow,
      getRowKey,
      showCountryCode,
      onAutoRenewToggle,
      controlButton,
      t,
    ]
  )

  // ── Fixed header ─────────────────────────────────────────────────────
  const fixedHeader = useCallback(
    () => (
      <TableFilterHeader
        headers={headers}
        title={title}
        useFilter={useFilter}
        operatorConfig={operatorConfig}
        selectable={selectable}
        selectedIds={selectedIds}
        filteredData={filteredData}
        getRowKey={getRowKey}
        filters={filters}
        filterInputs={filterInputs}
        showCountryCode={showCountryCode}
        onToggleCountryCode={() => setShowCountryCode((prev) => !prev)}
        onOperatorToggle={handleOperatorToggle}
        onFilterInputChange={handleFilterInputChange}
        onFilterKeyDown={handleFilterKeyDown}
        onSelectAll={handleSelectAll}
        t={t}
      />
    ),
    [
      headers,
      title,
      useFilter,
      operatorConfig,
      selectable,
      selectedIds,
      filteredData,
      getRowKey,
      filters,
      filterInputs,
      showCountryCode,
      handleOperatorToggle,
      handleFilterInputChange,
      handleFilterKeyDown,
      handleSelectAll,
      t,
    ]
  )

  return (
    <div className={`text-text-primary mx-auto max-w-380 ${className}`}>
      <div
        id="table-container"
        ref={tableRef}
        className="bg-surface border-border mx-auto w-full rounded-lg border-2 shadow-lg select-none"
      >
        {/* Container header */}
        <div
          id="container-header"
          className="bg-thead border-border z-30 flex items-center justify-between rounded-t-lg px-4 py-3"
        >
          <h2 className="flex items-center text-lg font-semibold sm:text-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="mr-2 size-7 shrink-0 fill-none stroke-current stroke-2 sm:size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 9L20 9M8 9V20M6.2 20H17.8C18.9201 20 19.4802 20 19.908 19.782C20.2843 19.5903 20.5903 19.2843 20.782 18.908C21 18.4802 21 17.9201 21 16.8V7.2C21 6.0799 21 5.51984 20.782 5.09202C20.5903 4.71569 20.2843 4.40973 19.908 4.21799C19.4802 4 18.9201 4 17.8 4H6.2C5.0799 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.07989 3 7.2V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.07989 20 6.2 20Z"
              />
            </svg>
            <span>{title}</span>
          </h2>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-5">
              {selectable && (
                <span className="text-right whitespace-nowrap">
                  {t('table.selected')}:{' '}
                  <span className="text-highlight font-semibold">{selectedIds.size}</span>{' '}
                  {t('table.rows')}
                </span>
              )}
              <span className="text-right whitespace-nowrap">
                {t('table.total')}:{' '}
                <span className="text-highlight font-semibold">{filteredData.length}</span>{' '}
                {t('table.rows')}
              </span>
            </div>
            {extraBtn && <span data-capture-ignore>{extraBtn}</span>}
          </div>
        </div>

        {/* Table Body Container */}
        <div className="scroll-container overflow-x-auto overflow-y-hidden rounded-b-lg">
          {isLoading ? (
            <TableSkeleton headers={headers} selectable={selectable} fixedHeader={fixedHeader} />
          ) : (
            renderBody?.({ filteredData, virtuosoContext, fixedHeader, scrollParent, t })
          )}
        </div>

        {!isLoading && isError && errorMessage}
        {!isLoading && !isError && filteredData.length === 0 && emptyState}
      </div>

      {renderFooter?.({ filteredData, t })}
    </div>
  )
})

export default BaseTable
