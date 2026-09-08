import { PaginatedTable, TableFilterToolbar, useTableSelection } from '../components/ui/Table'
import ControlButton from '../components/ui/ControlButton'
import UpgradePlanDialog from '../components/dialog/vps/UpgradePlanDialog'
import ReinstallDialog from '../components/dialog/vps/ReinstallDialog'
import ChangeIpDialog from '../components/dialog/vps/ChangeIpDialog'
import StatusMetricsMeter from '../components/ui/StatusMetricsMeter'
import axiosInstance from '../lib/axios'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useSafeCopy } from '../context/SafeCopyContext'
import { useConfirm } from '../context/ConfirmContext'
import { useTranslation } from '../i18n'
import useAuthStore from '../store/useAuthStore'
import useVpsStore from '../store/useVpsStore'
import { useQueryClient } from '@tanstack/react-query'
import useManagerActions from '../hooks/useManagerActions'
import { useVpsListQuery, VPS_QUERY_KEY } from '../hooks/useVpsQuery'
import { extractIP } from '../utils/data'
import useDebounce from '../hooks/useDebounce'
import getOS from '../data/osMap'

const OPERATOR_CONFIG = {
  expired: ['equal', 'greater-equal', 'less-equal'],
}

export default function VpsManager({ onBuySuccessRef }) {
  const navigate = useNavigate()
  const { addToast, removeToast } = useToast()
  const { safeCopy } = useSafeCopy()
  const { confirmAction } = useConfirm()
  const t = useTranslation()

  // Controlled input state (ephemeral form state stays local)
  const [ips, setIps] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [upgradeDialogState, setUpgradeDialogState] = useState({ isOpen: false, sid: null })
  const [reinstallState, setReinstallState] = useState({
    isOpen: false,
    data: { sid: '', ip: '', remote_port: '', password: '', os: '', note: '' },
  })
  const [changeIpState, setChangeIpState] = useState({
    isOpen: false,
    data: { sid: '', ip: '', remote_port: '', password: '', os: '', note: '' },
  })

  // TanStack Query Pagination & Filter States
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [byTime, setByTime] = useState('all')
  const [keyword, setKeyword] = useState('')

  // Debounced input states (400ms delay to prevent per-keystroke API calls)
  const debouncedKeyword = useDebounce(keyword, 400)
  const debouncedIps = useDebounce(ips, 400)

  // Reset page to 1 whenever debounced keyword or IPs filter changes without cascading effect renders
  const [prevSearch, setPrevSearch] = useState({ keyword: debouncedKeyword, ips: debouncedIps })
  if (prevSearch.keyword !== debouncedKeyword || prevSearch.ips !== debouncedIps) {
    setPrevSearch({ keyword: debouncedKeyword, ips: debouncedIps })
    setPage(1)
  }

  const parsedIps = useMemo(() => {
    if (!debouncedIps.trim()) return ''
    return debouncedIps
      .split('\n')
      .map((line) => extractIP(line))
      .filter(Boolean)
      .join(',')
  }, [debouncedIps])

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const {
    data: queryResponse,
    isLoading: isQueryLoading,
    isFetching,
    refetch,
  } = useVpsListQuery(
    {
      page,
      limit: Number(pageSize) || 200,
      by_status: '',
      by_time: byTime,
      by_created: '',
      ips: parsedIps,
      keyword: debouncedKeyword,
      proxy: false,
    },
    isAuthenticated
  )

  // Data from Zustand store
  const queryClient = useQueryClient()
  const data = useVpsStore((s) => s.data)
  const rawUpdateRowBySid = useVpsStore((s) => s.updateRowBySid)
  const handleBuySuccessStore = useVpsStore((s) => s.handleBuySuccess)
  const rawSyncToDb = useVpsStore((s) => s.syncToDb)

  const updateRowBySid = useCallback(
    (sid, updater) => {
      rawUpdateRowBySid(sid, updater)

      queryClient.setQueriesData({ queryKey: [VPS_QUERY_KEY] }, (old) => {
        if (!old?.data) return old
        let hasMatch = false
        const nextData = old.data.map((r) => {
          if (r.sid === sid) {
            hasMatch = true
            return { ...r, ...updater(r) }
          }
          return r
        })
        return hasMatch ? { ...old, data: nextData } : old
      })
    },
    [rawUpdateRowBySid, queryClient]
  )

  useEffect(() => {
    if (queryResponse?.data) {
      useVpsStore.setState({
        data: queryResponse.data,
        isLoading: isQueryLoading,
      })
    }
  }, [queryResponse, isQueryLoading])

  const syncToDb = useCallback(
    async (rows, attempt = 1) => {
      async function doSync(r, att) {
        try {
          await rawSyncToDb(r)
        } catch (err) {
          console.error(`[DB Sync] Save failed (attempt ${att}):`, err.message)
          if (att === 1) {
            return doSync(r, 2)
          } else {
            let toastId = null
            const handleRetry = () => {
              if (toastId) removeToast(toastId)
              doSync(r, 2)
            }
            toastId = addToast(
              <>
                <div>{t('syncFailed')}</div>
                <button
                  onClick={handleRetry}
                  className="bg-bg-warning/20 border-bg-warning/30 hover:bg-bg-warning/40 mt-1 rounded border px-3 py-1"
                >
                  {t('retry')}
                </button>
              </>,
              'warning',
              { keepAlive: true }
            )
          }
        }
      }
      return doSync(rows, attempt)
    },
    [rawSyncToDb, addToast, removeToast, t]
  )

  // Table selection logic handled cleanly by table selection hook
  const { selectedIds, selectedRows, clearSelection, deselectRows, onSelectionChange } =
    useTableSelection({ data })

  // Action runner for batch, single, and sequential operations
  const {
    isProcessing,
    rowClassMap,
    setRowClassMap,
    setIsProcessing,
    handleBatchAction,
    handleSingleAction,
    processSequential,
  } = useManagerActions({ updateRowBySid, syncToDb, onDeselect: deselectRows })

  const profile = useMemo(() => {
    try {
      const cached = localStorage.getItem('account-profile')
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  }, [])

  // handleGetData — thin wrapper around TanStack Query refetch with toast feedback
  const handleGetData = useCallback(async () => {
    setPage(1)
    const loadingId = addToast(t('manager.fetchingData'), 'loading')
    try {
      const res = await refetch()
      clearSelection()
      removeToast(loadingId)
      const finalResData = res.data?.data || []
      addToast(
        <>
          {t('manager.loadedRows')}{' '}
          <span className="text-text-toast-success">{finalResData.length}</span> {t('manager.rows')}
        </>,
        'success'
      )
    } catch (err) {
      console.error('[GetData] Error:', err.message)
      removeToast(loadingId)
      addToast(`${t('manager.failedGetData')}: ${err.message}`, 'error')
    }
  }, [refetch, clearSelection, addToast, removeToast, t])

  // Register buy success handler on parent ref
  useEffect(() => {
    if (onBuySuccessRef) {
      onBuySuccessRef.current = (newData, extraConfig) => {
        const enriched = handleBuySuccessStore(newData, extraConfig)
        if (enriched) {
          clearSelection()
          const vps = newData.map((item) => `${item.ip_port}/${item.user_pass}`).join('\n')
          safeCopy(vps).then(
            (ok) =>
              ok &&
              addToast(
                <>
                  {t('manager.copied')}{' '}
                  <span className="text-text-toast-success">{newData.length}</span> VPS
                </>,
                'success'
              )
          )
        } else {
          handleGetData()
        }
      }
    }
    return () => {
      if (onBuySuccessRef) onBuySuccessRef.current = null
    }
  }, [onBuySuccessRef, handleBuySuccessStore, clearSelection, safeCopy, addToast, t, handleGetData])

  // --- Handlers ---
  const handleCopyIp = useCallback(() => {
    const rows = selectedRows
    if (rows.length === 0) {
      addToast(t('manager.noRowsSelected'), 'warning')
      return
    }

    const ipsToCopy = rows
      .map((r) => {
        const latestRow = data.find((d) => d.sid === r.sid) || r
        return latestRow.ip_port?.split(':')[0]
      })
      .filter(Boolean)
      .join('\n')

    safeCopy(ipsToCopy).then((ok) => {
      if (ok) {
        addToast(
          <>
            {t('manager.copied')} <span className="text-text-toast-success">{rows.length}</span>{' '}
            {t('manager.copiedIps')}
          </>,
          'success'
        )
      }
    })
  }, [data, selectedRows, addToast, safeCopy, t])

  const handleReboot = useCallback(
    () =>
      handleBatchAction(selectedRows, '/server/reboot', t('manager.reboot').toUpperCase(), () => ({
        status: 'Running',
      })),
    [handleBatchAction, selectedRows, t]
  )

  const handlePause = useCallback(
    () =>
      handleBatchAction(selectedRows, '/server/pause', t('manager.pause').toUpperCase(), () => ({
        status: 'Paused',
      })),
    [handleBatchAction, selectedRows, t]
  )

  const handleResetPassword = useCallback(async () => {
    const rows = selectedRows
    const confirmed = await confirmAction({
      title: t('confirm'),
      infoText: (
        <>
          {t('vpsManager.resetPassword')} {t('to')}{' '}
          <span className="text-highlight font-bold">Httv1234</span>
        </>
      ),
      isProxy: false,
      isRenew: false,
      selectedRows: rows,
    })

    if (!confirmed) return
    handleBatchAction(
      rows,
      '/server/reset-password',
      t('vpsManager.resetPassword').toUpperCase(),
      (row) => {
        const [username] = (row.user_pass || '').split('/')
        const newUserPass = username ? `${username}/Httv1234` : `/Httv1234`
        return { user_pass: newUserPass }
      }
    )
  }, [handleBatchAction, t, confirmAction, selectedRows])

  const handleAutoFix = useCallback(async () => {
    const rows = selectedRows
    const confirmed = await confirmAction({
      title: `${t('confirm')} ${t('vpsManager.autoFix')}`,
      isProxy: false,
      isRenew: false,
      selectedRows: rows,
    })

    if (!confirmed) return
    handleBatchAction(rows, '/server/auto-fix', t('vpsManager.autoFix').toUpperCase())
  }, [handleBatchAction, t, confirmAction, selectedRows])

  // --- Change Note handler ---
  const handleChangeNote = useCallback(async () => {
    const rows = selectedRows
    const updatedRowsToSync = []

    await processSequential(
      rows,
      async (row) => {
        const res = await axiosInstance.put('/server/info/note', {
          sid: row.sid.toString(),
          newNote: noteInput,
        })
        if (res.data?.success) {
          updateRowBySid(row.sid, () => ({ note: noteInput }))
          updatedRowsToSync.push({ ...row, note: noteInput })
        }
        return res
      },
      t('manager.changeNote').toUpperCase()
    )
    if (updatedRowsToSync.length > 0) syncToDb(updatedRowsToSync)
  }, [selectedRows, noteInput, processSequential, updateRowBySid, t, syncToDb])

  // --- Renew handler ---
  const handleRenew = useCallback(async () => {
    const rows = selectedRows
    if (rows.length === 0) {
      addToast(t('manager.noRowsSelected'), 'warning')
      return
    }

    const renewDataOrConfirmed = await confirmAction({
      title: t('manager.confirmRenew'),
      isProxy: false,
      isRenew: true,
      selectedRows: rows,
    })

    if (!renewDataOrConfirmed) return

    const renewData = typeof renewDataOrConfirmed === 'object' ? renewDataOrConfirmed : null

    const validRows = []
    const invalidRows = []

    rows.forEach((row) => {
      const cleanIp = row.ip_port?.split(':')[0]
      if (
        renewData &&
        renewData.success &&
        renewData.success[cleanIp] &&
        renewData.success[cleanIp].new_expired_day &&
        renewData.success[cleanIp].new_expired_day !== '-'
      ) {
        validRows.push(row)
      } else {
        invalidRows.push(row)
      }
    })

    setRowClassMap((prev) => {
      const updates = { ...prev }
      invalidRows.forEach((r) => {
        updates[r.sid] = 'bg-error-cell'
      })
      return updates
    })

    if (validRows.length === 0) {
      addToast(t('manager.noValidVpsRenew'), 'warning')
      return
    }

    const sids = validRows.map((r) => r.sid).join(',')
    setIsProcessing(true)
    const toastId = addToast(t('manager.renewing'), 'loading')

    try {
      const res = await axiosInstance.post('/server/renew', { sids: sids, month: 1 })

      const resSuccess = res.data?.result?.success || {}

      let successCount = 0
      let failCount = invalidRows.length

      const classUpdates = {}
      const validRowsToSync = []
      for (const row of validRows) {
        const cleanIp = row.ip_port?.split(':')[0]

        if (resSuccess[cleanIp]) {
          const newExpiredDay = renewData.success[cleanIp].new_expired_day
          const updates = {
            status: 'Running',
            expired: newExpiredDay,
          }
          updateRowBySid(row.sid, () => updates)
          validRowsToSync.push({ ...row, ...updates })
          classUpdates[row.sid] = 'bg-success-cell'
          successCount++
        } else {
          classUpdates[row.sid] = 'bg-error-cell'
          failCount++
        }
      }

      setRowClassMap((prev) => ({ ...prev, ...classUpdates }))
      deselectRows(rows)

      if (successCount > 0 && failCount === 0) {
        addToast(
          <>
            {t('manager.renew').toUpperCase()} {t('manager.completed')} <br />
            <span className="text-text-toast-success">
              {successCount} {t('manager.success')}
            </span>
          </>,
          'success'
        )
      } else if (successCount === 0 && failCount > 0) {
        addToast(
          <>
            {t('manager.renew').toUpperCase()} {t('manager.completed')} <br />
            <span className="text-text-toast-error">
              {failCount} {t('manager.failed')}
            </span>
          </>,
          'error'
        )
      } else {
        addToast(
          <>
            {t('manager.renew').toUpperCase()} {t('manager.completed')} <br />
            <span className="text-text-toast-success">
              {successCount} {t('manager.success')}
            </span>
            ,{' '}
            <span className="text-text-toast-error">
              {failCount} {t('manager.failed')}
            </span>
          </>,
          'warning'
        )
      }
      // Sync in background after feedback
      if (validRowsToSync.length > 0) syncToDb(validRowsToSync)
    } catch {
      const classUpdates = {}
      for (const row of validRows) classUpdates[row.sid] = 'bg-error-cell'
      setRowClassMap((prev) => ({ ...prev, ...classUpdates }))
      deselectRows(rows)
      addToast(t('manager.renewError'), 'error')
    } finally {
      setIsProcessing(false)
      removeToast(toastId)
    }
  }, [
    selectedRows,
    confirmAction,
    addToast,
    removeToast,
    updateRowBySid,
    deselectRows,
    setIsProcessing,
    setRowClassMap,
    t,
    syncToDb,
  ])

  const handleRefund = useCallback(async () => {
    const rows = selectedRows
    if (rows.length === 0) {
      addToast(t('manager.noRowsSelected'), 'warning')
      return
    }

    const refundDataOrConfirmed = await confirmAction({
      title: t('manager.confirmRefund'),
      isProxy: false,
      isRefund: true,
      selectedRows: rows,
    })

    if (!refundDataOrConfirmed) return

    const refundData = typeof refundDataOrConfirmed === 'object' ? refundDataOrConfirmed : null

    const validRows = []
    const invalidRows = []

    rows.forEach((row) => {
      const cleanIp = row.ip_port?.split(':')[0]
      if (refundData && refundData.success && refundData.success[cleanIp]) {
        validRows.push(row)
      } else invalidRows.push(row)
    })

    setRowClassMap((prev) => {
      const updates = { ...prev }
      invalidRows.forEach((r) => {
        updates[r.sid] = 'bg-error-cell'
      })
      return updates
    })

    if (validRows.length === 0) {
      addToast(t('manager.noValidVpsRefund'), 'warning')
      return
    }

    const sids = validRows.map((r) => r.sid).join(',')
    setIsProcessing(true)
    const toastId = addToast(t('manager.refunding'), 'loading')

    try {
      const res = await axiosInstance.post('/server/refund', { sid: sids })

      const resSuccess = res.data?.result?.success || {}

      let successCount = 0
      let failCount = invalidRows.length

      const classUpdates = {}
      const validRowsToSync = []
      for (const row of validRows) {
        const cleanIp = row.ip_port?.split(':')[0]

        if (resSuccess[cleanIp]) {
          const updates = {
            status: 'Refunded',
          }
          updateRowBySid(row.sid, () => updates)
          validRowsToSync.push({ ...row, ...updates })
          classUpdates[row.sid] = 'bg-success-cell'
          successCount++
        } else {
          classUpdates[row.sid] = 'bg-error-cell'
          failCount++
        }
      }

      setRowClassMap((prev) => ({ ...prev, ...classUpdates }))

      deselectRows(rows)

      if (successCount > 0 && failCount === 0) {
        addToast(
          <>
            {t('manager.refund').toUpperCase()} {t('manager.completed')} <br />
            <span className="text-text-toast-success">
              {successCount} {t('manager.success')}
            </span>
          </>,
          'success'
        )
      } else if (successCount === 0 && failCount > 0) {
        addToast(
          <>
            {t('manager.refund').toUpperCase()} {t('manager.completed')} <br />
            <span className="text-text-toast-error">
              {failCount} {t('manager.failed')}
            </span>
          </>,
          'error'
        )
      } else {
        addToast(
          <>
            {t('manager.refund').toUpperCase()} {t('manager.completed')} <br />
            <span className="text-text-toast-success">
              {successCount} {t('manager.success')}
            </span>
            ,{' '}
            <span className="text-text-toast-error">
              {failCount} {t('manager.failed')}
            </span>
          </>,
          'warning'
        )
      }
      // Sync in background after feedback
      if (validRowsToSync.length > 0) syncToDb(validRowsToSync)
    } catch {
      const classUpdates = {}
      for (const row of validRows) classUpdates[row.sid] = 'bg-error-cell'
      setRowClassMap((prev) => ({ ...prev, ...classUpdates }))
      deselectRows(rows)
      addToast(t('manager.refundError'), 'error')
    } finally {
      setIsProcessing(false)
      removeToast(toastId)
    }
  }, [
    selectedRows,
    confirmAction,
    addToast,
    removeToast,
    updateRowBySid,
    deselectRows,
    setIsProcessing,
    setRowClassMap,
    t,
    syncToDb,
  ])

  return (
    <>
      {/* ========== TOP CONTROLS ========== */}
      <div className="bg-surface border-border z-40 border-b pb-4 select-none">
        <div className="mx-auto max-w-380 px-4">
          {/* ========== FEATURE CONTROLS ========== */}
          <div className="bg-wrapper rounded-lg p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Action Buttons */}
              <div className="flex w-full flex-wrap justify-center gap-2 sm:gap-3">
                {/* Pause */}
                <button
                  className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                  style={{ '--action-color': 'var(--red)' }}
                  onClick={handlePause}
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
                  >
                    <path d="M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z" />
                  </svg>
                  {t('manager.pause')}
                </button>

                {/* Reboot */}
                <button
                  className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                  style={{ '--action-color': 'var(--orange)' }}
                  onClick={handleReboot}
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    className="mr-1 h-4.5 w-4.5 shrink-0 fill-current sm:mr-2 sm:size-6"
                  >
                    <path d="m 8 0 c -0.550781 0 -1 0.449219 -1 1 v 5 c 0 0.550781 0.449219 1 1 1 s 1 -0.449219 1 -1 v -5 c 0 -0.550781 -0.449219 -1 -1 -1 z m -7 1 l 2.050781 2.050781 c -2.117187 2.117188 -2.652343 5.355469 -1.332031 8.039063 c 1.324219 2.683594 4.214844 4.238281 7.179688 3.851562 c 2.96875 -0.386718 5.367187 -2.625 5.960937 -5.554687 c 0.59375 -2.933594 -0.75 -5.929688 -3.335937 -7.433594 c -0.476563 -0.28125 -1.089844 -0.117187 -1.367188 0.359375 s -0.117188 1.089844 0.359375 1.367188 c 1.851563 1.078124 2.808594 3.207031 2.382813 5.3125 c -0.421876 2.101562 -2.128907 3.691406 -4.253907 3.96875 c -2.128906 0.273437 -4.183593 -0.828126 -5.128906 -2.753907 s -0.566406 -4.226562 0.949219 -5.742187 l 1.535156 1.535156 v -4.003906 c 0 -0.519532 -0.449219 -0.996094 -1 -0.996094 z m 0 0" />
                  </svg>
                  {t('manager.reboot')}
                </button>

                {/* Renew */}
                <button
                  className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                  style={{ '--action-color': 'var(--purple)' }}
                  onClick={handleRenew}
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
                  >
                    <path d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z" />
                  </svg>
                  {t('manager.renew')}
                </button>

                {/* Refund */}
                {profile?.is_refund && (
                  <button
                    className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                    style={{ '--action-color': 'var(--pink)' }}
                    onClick={handleRefund}
                    disabled={isProcessing}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 448 512"
                      className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
                    >
                      <path d="M384 32H64C28.654 32 0 60.652 0 96V416C0 451.346 28.654 480 64 480H384C419.346 480 448 451.346 448 416V96C448 60.652 419.346 32 384 32ZM310.764 314.281C305.451 342.701 281.738 361.422 248.045 366.818V384C248.045 397.25 237.295 408 224.045 408S200.045 397.25 200.045 384V365.939C185.955 363.51 171.59 359 158.795 354.734L152.514 352.656C139.92 348.531 133.045 334.969 137.17 322.375S154.92 302.922 167.451 307.031L173.951 309.187C186.076 313.219 199.795 317.781 210.951 319.344C238.826 323.359 261.326 317.359 263.576 305.437C265.389 295.828 261.732 290.766 217.795 279.156L209.201 276.875C184.482 270.156 126.576 254.469 137.201 197.719C142.523 169.283 166.266 150.521 200.045 145.156V128C200.045 114.75 210.795 104 224.045 104S248.045 114.75 248.045 128V146.002C256.998 147.568 266.891 149.984 279.264 153.937C291.889 157.953 298.889 171.469 294.857 184.094C290.857 196.719 277.326 203.75 264.701 199.656C253.139 195.969 244.014 193.672 236.857 192.641C209.295 188.703 186.607 194.625 184.389 206.562C183.045 213.625 181.92 219.734 221.764 230.547L230.045 232.75C264.264 241.781 321.514 256.906 310.764 314.281Z" />
                    </svg>
                    {t('manager.refund')}
                  </button>
                )}

                {/* Copy IP */}
                <button
                  onClick={handleCopyIp}
                  className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                  style={{ '--action-color': 'var(--green)' }}
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-7"
                  >
                    <path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z" />
                  </svg>
                  {t('manager.copyIp')}
                </button>

                {/* Get Info */}
                <button
                  className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                  style={{ '--action-color': 'var(--blue)' }}
                  disabled={isProcessing}
                  onClick={() => {
                    const rows = selectedRows
                    if (rows.length === 0) return addToast(t('manager.noRowsSelected'), 'warning')
                    const text = rows
                      .map((r) => {
                        const latestRow = data.find((d) => d.sid === r.sid) || r
                        const [username, password] = (latestRow.user_pass || '').split('/')
                        return [latestRow.ip_port, username, password].join('/')
                      })
                      .join('\n')
                    safeCopy(text).then(
                      (ok) =>
                        ok &&
                        addToast(
                          <>
                            {t('manager.copied')}{' '}
                            <span className="text-text-toast-success">{rows.length}</span> VPS
                          </>,
                          'success'
                        )
                    )
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
                  >
                    <path d="M384 32H64C28.654 32 0 60.652 0 96V416C0 451.344 28.654 480 64 480H384C419.346 480 448 451.344 448 416V96C448 60.652 419.346 32 384 32ZM224 128C241.674 128 256 142.326 256 160C256 177.672 241.674 192 224 192S192 177.672 192 160C192 142.326 206.326 128 224 128ZM264 384H184C170.75 384 160 373.25 160 360S170.75 336 184 336H200V272H192C178.75 272 168 261.25 168 248S178.75 224 192 224H224C237.25 224 248 234.75 248 248V336H264C277.25 336 288 346.75 288 360S277.25 384 264 384Z" />
                  </svg>
                  {t('manager.getInfo')}
                </button>

                {/* Auto Fix */}
                <button
                  className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                  style={{ '--action-color': 'var(--green)' }}
                  onClick={handleAutoFix}
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 231.233 231.233"
                    className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-7"
                  >
                    <path d="M230.505,102.78c-0.365-3.25-4.156-5.695-7.434-5.695c-10.594,0-19.996-6.218-23.939-15.842  c-4.025-9.855-1.428-21.346,6.465-28.587c2.486-2.273,2.789-6.079,0.705-8.721c-5.424-6.886-11.586-13.107-18.316-18.498  c-2.633-2.112-6.502-1.818-8.787,0.711c-6.891,7.632-19.27,10.468-28.836,6.477c-9.951-4.187-16.232-14.274-15.615-25.101  c0.203-3.403-2.285-6.36-5.676-6.755c-8.637-1-17.35-1.029-26.012-0.068c-3.348,0.37-5.834,3.257-5.723,6.617  c0.375,10.721-5.977,20.63-15.832,24.667c-9.451,3.861-21.744,1.046-28.621-6.519c-2.273-2.492-6.074-2.798-8.725-0.731  c-6.928,5.437-13.229,11.662-18.703,18.492c-2.133,2.655-1.818,6.503,0.689,8.784c8.049,7.289,10.644,18.879,6.465,28.849  c-3.99,9.505-13.859,15.628-25.156,15.628c-3.666-0.118-6.275,2.345-6.68,5.679c-1.016,8.683-1.027,17.535-0.049,26.289  c0.365,3.264,4.268,5.688,7.582,5.688c10.07-0.256,19.732,5.974,23.791,15.841c4.039,9.855,1.439,21.341-6.467,28.592  c-2.473,2.273-2.789,6.07-0.701,8.709c5.369,6.843,11.537,13.068,18.287,18.505c2.65,2.134,6.504,1.835,8.801-0.697  c6.918-7.65,19.295-10.481,28.822-6.482c9.98,4.176,16.258,14.262,15.645,25.092c-0.201,3.403,2.293,6.369,5.672,6.755  c4.42,0.517,8.863,0.773,13.32,0.773c4.23,0,8.461-0.231,12.692-0.702c3.352-0.37,5.834-3.26,5.721-6.621  c-0.387-10.716,5.979-20.626,15.822-24.655c9.514-3.886,21.752-1.042,28.633,6.512c2.285,2.487,6.063,2.789,8.725,0.73  c6.916-5.423,13.205-11.645,18.703-18.493c2.135-2.65,1.832-6.503-0.689-8.788c-8.047-7.284-10.656-18.879-6.477-28.839  c3.928-9.377,13.43-15.673,23.65-15.673l1.43,0.038c3.318,0.269,6.367-2.286,6.768-5.671  C231.476,120.379,231.487,111.537,230.505,102.78z M115.616,182.27c-36.813,0-66.654-29.841-66.654-66.653  s29.842-66.653,66.654-66.653s66.654,29.841,66.654,66.653c0,12.495-3.445,24.182-9.428,34.176l-29.186-29.187  c2.113-4.982,3.229-10.383,3.228-15.957c0-10.915-4.251-21.176-11.97-28.893c-7.717-7.717-17.978-11.967-28.891-11.967  c-3.642,0-7.267,0.484-10.774,1.439c-1.536,0.419-2.792,1.685-3.201,3.224c-0.418,1.574,0.053,3.187,1.283,4.418  c0,0,14.409,14.52,19.23,19.34c0.505,0.505,0.504,1.71,0.433,2.144l-0.045,0.317c-0.486,5.3-1.423,11.662-2.196,14.107  c-0.104,0.103-0.202,0.19-0.308,0.296c-0.111,0.111-0.213,0.218-0.32,0.328c-2.477,0.795-8.937,1.743-14.321,2.225l0.001-0.029  l-0.242,0.061c-0.043,0.005-0.123,0.011-0.229,0.011c-0.582,0-1.438-0.163-2.216-0.94c-5.018-5.018-18.862-18.763-18.862-18.763  c-1.242-1.238-2.516-1.498-3.365-1.498c-1.979,0-3.751,1.43-4.309,3.481c-3.811,14.103,0.229,29.273,10.546,39.591  c7.719,7.718,17.981,11.968,28.896,11.968c5.574,0,10.975-1.115,15.956-3.228l29.503,29.503  C141.125,178.412,128.825,182.27,115.616,182.27z" />
                  </svg>
                  {t('vpsManager.autoFix')}
                </button>

                {/* Reset Password */}
                {profile?.is_reset_pass && (
                  <button
                    className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
                    style={{ '--action-color': 'var(--blue)' }}
                    onClick={handleResetPassword}
                    disabled={isProcessing}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 512 512"
                      className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
                    >
                      <path d="M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0S160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17l0 80c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24l0-40 40 0c13.3 0 24-10.7 24-24l0-40 40 0c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z" />
                    </svg>
                    {t('vpsManager.resetPassword')}
                  </button>
                )}

                {/* Change Note */}
                <div className="flex grow">
                  <input
                    type="text"
                    placeholder={t('manager.enterNote')}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="rounded-r-none border-r-0 py-1"
                  />
                  <button
                    className="bg-action flex w-full items-center justify-center rounded-lg rounded-l-none px-3 py-2 font-medium"
                    style={{ '--action-color': 'var(--orange)' }}
                    onClick={handleChangeNote}
                    disabled={isProcessing}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-7"
                    >
                      <path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z" />
                    </svg>
                    {t('manager.changeNote')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusMetricsMeter
        total={
          queryResponse?.total_vps !== undefined
            ? queryResponse.total_vps
            : data.filter((row) => row.status !== 'Refunded').length
        }
        running={
          queryResponse?.total_vps_running !== undefined
            ? queryResponse.total_vps_running
            : data.filter((row) => row.status === 'Running').length
        }
        off={
          queryResponse?.total_vps_off !== undefined
            ? queryResponse.total_vps_off
            : data.filter((row) => row.status === 'Off').length
        }
        className="mt-4"
      />

      <TableFilterToolbar
        keyword={keyword}
        onKeywordChange={setKeyword}
        byTime={byTime}
        onByTimeChange={setByTime}
        ips={ips}
        onIpsChange={setIps}
        onResetPage={() => setPage(1)}
      />

      <PaginatedTable
        title={t('vpsManager.title')}
        className="mt-2 px-4 text-xs sm:text-sm"
        data={data}
        pagination={true}
        serverSide={true}
        page={page - 1}
        pageSize={pageSize}
        totalCount={queryResponse?.total_vps ?? data.length}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        onPageChange={(zeroBasedPage) => {
          setPage(zeroBasedPage + 1)
          clearSelection()
        }}
        onPageSizeChange={(newPageSize) => {
          setPageSize(newPageSize)
          setPage(1)
          clearSelection()
        }}
        onAutoRenewToggle={async (sid, newState) => {
          // Optimistic Update
          updateRowBySid(sid, () => ({ is_auto_renew: newState }))

          try {
            const res = await axiosInstance.post('/server/auto-renew', {
              sid: sid.toString(),
            })
            if (res.data?.success) {
              const finalState = res.data.changes.is_on
              // Refine state if the server result differs
              updateRowBySid(sid, () => ({ is_auto_renew: finalState }))

              const row = data.find((r) => r.sid === sid)
              if (row) {
                syncToDb([{ ...row, is_auto_renew: finalState }])
              }

              addToast(t('dialog.success'), 'success')
            } else {
              throw new Error('API reported failure')
            }
          } catch (err) {
            console.error('[AutoRenew] Error:', err.message)
            addToast(t('dialog.failed'), 'error')
            // Rollback parent state
            updateRowBySid(sid, () => ({ is_auto_renew: !newState }))
            throw err // Re-throw for PopConfirmToggle rollback
          }
        }}
        isLoading={isFetching}
        useFilter={true}
        headers={[
          'control',
          'plan_number',
          'ip_port',
          'country',
          'he_dieu_hanh',
          'price_vnd',
          'created',
          'expired',
          'status',
          'note',
          'is_auto_renew',
        ]}
        controlButton={(row) => (
          <ControlButton
            onUpgrade={
              row.country === 'GPU'
                ? undefined
                : () => {
                    setUpgradeDialogState({ isOpen: true, sid: row.sid })
                  }
            }
            onPause={() =>
              handleSingleAction(
                row,
                '/server/pause',
                { sids: row.sid.toString() },
                t('manager.pause').toUpperCase(),
                () => ({
                  status: 'Paused',
                })
              )
            }
            onReboot={() =>
              handleSingleAction(
                row,
                '/server/reboot',
                { sids: row.sid.toString() },
                t('manager.reboot').toUpperCase(),
                () => ({
                  status: 'Running',
                })
              )
            }
            onRefund={
              profile?.is_refund
                ? () =>
                    handleSingleAction(
                      row,
                      '/server/refund',
                      { sid: row.sid.toString() },
                      t('manager.refund').toUpperCase(),
                      () => ({
                        status: 'Refunded',
                      })
                    )
                : undefined
            }
            onReinstall={() => {
              setReinstallState({
                isOpen: true,
                data: {
                  sid: row.sid,
                  ip: row.ip_port.split(':')[0],
                  remote_port: row.ip_port.split(':')[1],
                  password: row.user_pass ? row.user_pass.split('/')[1] : '',
                  os: row.he_dieu_hanh,
                  note: row.note,
                },
              })
            }}
            onChangeIp={() => {
              setChangeIpState({
                isOpen: true,
                data: {
                  sid: row.sid,
                  ip: row.ip_port.split(':')[0],
                  remote_port: row.ip_port.split(':')[1],
                  password: row.user_pass ? row.user_pass.split('/')[1] : '',
                  os: row.he_dieu_hanh,
                  note: row.note,
                },
              })
            }}
          />
        )}
        operatorConfig={OPERATOR_CONFIG}
        rowClassMap={rowClassMap}
        selectedIds={selectedIds}
        selectedRows={selectedRows}
        extraBtn={
          <button
            id="reloadBtn"
            className="bg-action group rounded-lg p-2"
            style={{ '--action-color': 'var(--orange)' }}
            disabled={isFetching}
            onClick={async () => {
              const loadingId = addToast(t('manager.fetchingData'), 'loading')
              try {
                const res = await refetch()
                clearSelection()
                setRowClassMap({})
                removeToast(loadingId)
                const finalResData = res.data?.data || []
                addToast(
                  <>
                    {t('manager.loadedRows')}{' '}
                    <span className="text-text-toast-success">{finalResData.length}</span>{' '}
                    {t('manager.rows')}
                  </>,
                  'success'
                )
              } catch (err) {
                console.error('[Refresh] Error:', err.message)
                removeToast(loadingId)
                addToast(`${t('manager.failedGetData')}: ${err.message}`, 'error')
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="fill-text-secondary size-5 shrink-0 transition-transform group-hover:rotate-30 sm:size-7"
            >
              <path d="M544.1 256L552 256C565.3 256 576 245.3 576 232L576 88C576 78.3 570.2 69.5 561.2 65.8C552.2 62.1 541.9 64.2 535 71L483.3 122.8C439 86.1 382 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6C143.2 199.5 223.3 128 320 128C364.4 128 405.2 143 437.7 168.3L391 215C384.1 221.9 382.1 232.2 385.8 241.2C389.5 250.2 398.3 256 408 256L544.1 256zM573.5 356.5C576 339 563.8 322.8 546.4 320.3C529 317.8 512.7 330 510.2 347.4C496.9 440.4 416.8 511.9 320.1 511.9C275.7 511.9 234.9 496.9 202.4 471.6L249 425C255.9 418.1 257.9 407.8 254.2 398.8C250.5 389.8 241.7 384 232 384L88 384C74.7 384 64 394.7 64 408L64 552C64 561.7 69.8 570.5 78.8 574.2C87.8 577.9 98.1 575.8 105 569L156.8 517.2C201 553.9 258 576 320 576C449 576 555.7 480.6 573.4 356.5z" />
            </svg>
          </button>
        }
        emptyState={
          <div
            id="emptyState"
            className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-10 select-none"
          >
            <div className="border-primary/25 bg-primary/10 text-primary flex size-24 items-center justify-center rounded-2xl border shadow-inner">
              <svg
                className="size-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
            <h3 className="font-headline text-text-primary text-xl font-bold">
              {t('manager.noVpsFound')}
            </h3>
            <button
              type="button"
              onClick={() => navigate('/price/vps')}
              className="bg-primary hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('manager.buyVps')}
            </button>
          </div>
        }
        onSelectionChange={onSelectionChange}
      />

      <UpgradePlanDialog
        key={`upgrade-${upgradeDialogState?.sid}-${upgradeDialogState?.isOpen}`}
        isOpen={upgradeDialogState.isOpen}
        onClose={() => setUpgradeDialogState({ isOpen: false, sid: null })}
        sid={upgradeDialogState.sid}
        onSuccess={(responseData) => {
          try {
            const info = responseData.info || responseData

            if (info && info.to_plan) {
              const toPlan = info.to_plan || ''
              const plan_number = toPlan.split(':')[0].trim()

              const parseNum = (str) =>
                parseFloat(
                  (str || '0')
                    .toString()
                    .replace(/,/g, '')
                    .replace(/[^\d.-]/g, '')
                ) || 0

              const expense = parseNum(info.expense)
              const discount = parseNum(info.discount)
              const toPlanPriceParts = toPlan.split(':')
              const toPlanPrice = toPlanPriceParts.length > 1 ? parseNum(toPlanPriceParts[1]) : 0

              let calculatedPrice = toPlanPrice
              calculatedPrice = (expense / (expense + discount)) * toPlanPrice

              const price_vnd = Math.round(calculatedPrice).toLocaleString('en-US')
              const changes = { plan_number, price_vnd, status: 'Running' }
              updateRowBySid(upgradeDialogState.sid, () => changes)
              setRowClassMap({ [upgradeDialogState.sid]: 'bg-success-cell' })
              const row = data.find((r) => r.sid === upgradeDialogState.sid)
              if (row) syncToDb([{ ...row, ...changes }])
            } else {
              handleGetData()
            }
          } catch (err) {
            console.error('Failed to parse upgrade response:', err)
            handleGetData()
          }
        }}
      />

      <ReinstallDialog
        key={`reinstall-${reinstallState?.sid}-${reinstallState?.isOpen}`}
        isOpen={reinstallState.isOpen}
        onClose={() =>
          setReinstallState({
            isOpen: false,
            data: { sid: '', ip: '', remote_port: '', password: '', os: '', note: '' },
          })
        }
        currentData={reinstallState.data}
        onSuccess={(responseData) => {
          const changes = {
            ip_port: `${responseData.ip}:${responseData.port}`,
            user_pass: `${responseData.username}/${responseData.password}`,
            he_dieu_hanh: getOS(responseData.os),
            status: 'Running',
          }
          updateRowBySid(reinstallState.data.sid, () => changes)
          setRowClassMap({ [reinstallState.data.sid]: 'bg-success-cell' })
          const row = data.find((r) => r.sid === reinstallState.data.sid)
          syncToDb([{ ...row, ...changes }])
          safeCopy(
            `${responseData.ip}:${responseData.port}/${responseData.username}/${responseData.password}`
          )
        }}
      />

      <ChangeIpDialog
        key={`change-ip-${changeIpState?.sid}-${changeIpState?.isOpen}`}
        isOpen={changeIpState.isOpen}
        onClose={() =>
          setChangeIpState({
            isOpen: false,
            data: { sid: '', ip: '', remote_port: '', password: '', os: '', note: '' },
          })
        }
        currentData={changeIpState.data}
        onSuccess={(responseData) => {
          const changes = {
            ip_port: `${responseData.ip}:${responseData.port}`,
            user_pass: `${responseData.username}/${responseData.password}`,
            he_dieu_hanh: getOS(responseData.os),
            status: 'Running',
          }
          updateRowBySid(changeIpState.data.sid, () => changes)
          setRowClassMap({ [changeIpState.data.sid]: 'bg-success-cell' })
          const row = data.find((r) => r.sid === changeIpState.data.sid)
          syncToDb([{ ...row, ...changes }])
          safeCopy(
            `${responseData.ip}:${responseData.port}/${responseData.username}/${responseData.password}`
          )
        }}
      />
    </>
  )
}
