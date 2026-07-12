import DropDown from '../components/ui/DropDown'
import { PaginatedTable, TableFilterToolbar, useTableSelection } from '../components/ui/Table'
import ControlButton from '../components/ui/ControlButton'
import StatusMetricsMeter from '../components/ui/StatusMetricsMeter'
import ChangeIpDialog from '../components/dialog/proxy/ChangeIpDialog'
import ReinstallDialog from '../components/dialog/proxy/ReinstallDialog'
import axiosInstance from '../lib/axios'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useSafeCopy } from '../context/SafeCopyContext'
import { useConfirm } from '../context/ConfirmContext'
import { useTranslation } from '../i18n'
import useAuthStore from '../store/useAuthStore'
import useProxyStore from '../store/useProxyStore'
import { useQueryClient } from '@tanstack/react-query'
import useManagerActions from '../hooks/useManagerActions'
import { useProxyListQuery, PROXY_QUERY_KEY } from '../hooks/useProxyQuery'
import { extractIP } from '../utils/data'
import useDebounce from '../hooks/useDebounce'

export default function ProxyManager({ onBuySuccessRef }) {
  const navigate = useNavigate()
  const [reinstallType, setReinstallType] = useState('HTTPS')
  const [changeIpType, setChangeIpType] = useState('HTTPS')
  const { addToast, removeToast, updateToast } = useToast()
  const { safeCopy } = useSafeCopy()
  const { confirmAction } = useConfirm()
  const t = useTranslation()

  // Controlled input state
  const [ips, setIps] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [reinstallInput, setReinstallInput] = useState('')

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
  } = useProxyListQuery(
    {
      page,
      limit: Number(pageSize) || 200,
      by_status: '',
      by_time: byTime,
      by_created: '',
      ips: parsedIps,
      keyword: debouncedKeyword,
      proxy: true,
    },
    isAuthenticated
  )

  // Data from Zustand store
  const queryClient = useQueryClient()
  const data = useProxyStore((s) => s.data)
  const rawUpdateRowBySid = useProxyStore((s) => s.updateRowBySid)
  const rawSyncToDb = useProxyStore((s) => s.syncToDb)

  const updateRowBySid = useCallback(
    (sid, updater) => {
      rawUpdateRowBySid(sid, updater)

      queryClient.setQueriesData({ queryKey: [PROXY_QUERY_KEY] }, (old) => {
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
      useProxyStore.setState({
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
  const handleBuySuccessStore = useProxyStore((s) => s.handleBuySuccess)

  const [changeIpState, setChangeIpState] = useState({
    isOpen: false,
    data: { sid: '', ip: '', remote_port: '', password: '', type: '', note: '' },
  })

  const [reinstallState, setReinstallState] = useState({
    isOpen: false,
    data: { sid: '', ip: '', remote_port: '', username: '', password: '', type: '', note: '' },
  })

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
          const proxies = newData.map((item) => `${item.ip_port}:${item.user_pass}`).join('\n')
          safeCopy(proxies).then(
            (ok) =>
              ok &&
              addToast(
                <>
                  {t('manager.copied')}{' '}
                  <span className="text-text-toast-success">{newData.length}</span> Proxy
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

  // --- Change IP handler ---
  const handleChangeIp = useCallback(async () => {
    const rows = selectedRows
    if (rows.length === 0) {
      addToast(t('manager.noRowsSelected'), 'warning')
      return
    }

    const confirmed = await confirmAction({
      title: t('manager.confirmChangeIp'),
      infoText: (
        <>
          {t('type')} <span className="text-highlight font-bold">{changeIpType}</span>
        </>
      ),
      isProxy: true,
      isRenew: false,
      selectedRows: rows,
    })

    if (!confirmed) return

    const type = changeIpType === 'HTTPS' ? 'proxy_https' : 'proxy_sock_5'
    const proxyResults = []
    const updatedRows = []

    await processSequential(
      rows,
      async (row) => {
        const ip = row.ip_port?.split(':')[0]
        const res = await axiosInstance.post('/server/change-ip', {
          ip,
          type,
          random_remote_port: 'on',
          random_username: 'on',
          random_password: 'on',
          isProxy: true,
        })
        if (res.data?.success) {
          const info = res.data.info
          const updates = {
            ip_port: `${info.ip}:${info.port}`,
            user_pass: `${info.username}:${info.password}`,
            type: changeIpType + ' Proxy',
            status: 'Running',
          }
          updateRowBySid(row.sid, () => updates)
          updatedRows.push({ ...row, ...updates })
          proxyResults.push(`${info.ip}:${info.port}:${info.username}:${info.password}`)
        }
        return res
      },
      t('manager.changeIp').toUpperCase()
    )

    // Sync only the updated rows to DB
    if (updatedRows.length > 0) {
      syncToDb(updatedRows)
    }

    if (proxyResults.length > 0) {
      const text = proxyResults.join('\n')
      safeCopy(text).then(
        (ok) =>
          ok &&
          addToast(
            <>
              {t('manager.copied')}{' '}
              <span className="text-text-toast-success">{proxyResults.length}</span> Proxy
            </>,
            'success'
          )
      )
    }
  }, [
    selectedRows,
    changeIpType,
    confirmAction,
    safeCopy,
    addToast,
    processSequential,
    updateRowBySid,
    t,
    syncToDb,
  ])

  // --- Reinstall handler ---
  const handleReinstall = useCallback(async () => {
    const rows = selectedRows
    if (rows.length === 0) {
      addToast(t('manager.noRowsSelected'), 'warning')
      return
    }

    let parsedInfo = null

    if (reinstallInput) {
      const parts = reinstallInput.split(':')
      let ip = '__'
      let port = '__'
      let username
      let password

      if (parts.length >= 4) [ip, port, username, password] = parts
      else if (parts.length === 3) [port, username, password] = parts
      else if (parts.length === 2) [username, password] = parts
      else {
        addToast(t('manager.invalidReinstall'), 'warning')
        return
      }

      // Username validation: lowercase a-z and 0-9
      const usernameRegex = /^[a-z0-9]+$/
      if (username && username !== '__' && !usernameRegex.test(username)) {
        addToast(`Username ${t('buy.invalidUsername')}`, 'warning')
        return
      }

      // Password validation: at least 10 chars, uppercase, lowercase, and number
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/
      if (password && password !== '__' && !passwordRegex.test(password)) {
        addToast(`Password ${t('buy.invalidPassword')}`, 'warning')
        return
      }

      parsedInfo = { ip, port, username, password }
    }

    const infoTextNode = parsedInfo ? (
      <>
        {t('type')} <span className="text-highlight font-bold">{reinstallType} </span>
        <br />
        {t('manager.info')}{' '}
        <span className="text-highlight font-bold break-all">
          {parsedInfo.ip}:{parsedInfo.port}:{parsedInfo.username}:{parsedInfo.password}
        </span>
      </>
    ) : (
      <>
        {t('type')} <span className="text-highlight font-bold">{reinstallType}</span>
      </>
    )

    const confirmed = await confirmAction({
      title: t('manager.confirmReinstall'),
      infoText: infoTextNode,
      isProxy: true,
      isRenew: false,
      selectedRows: rows,
    })

    if (!confirmed) return

    const type = reinstallType === 'HTTPS' ? 'proxy_https' : 'proxy_sock_5'
    const proxyResults = []
    const updatedRows = []

    await processSequential(
      rows,
      async (row) => {
        let remote_port = '',
          username = '',
          password = ''
        let random_remote_port = 'on',
          random_username = 'on',
          random_password = 'on'
        if (reinstallInput) {
          const reinstallInfo = reinstallInput.split(':')
          if (reinstallInfo.length === 4) {
            ;[remote_port, username, password] = reinstallInfo.slice(1)
            random_remote_port = ''
            random_username = ''
            random_password = ''
          } else if (reinstallInfo.length === 3) {
            ;[remote_port, username, password] = reinstallInfo
            random_remote_port = ''
            random_username = ''
            random_password = ''
          } else if (reinstallInfo.length === 2) {
            ;[username, password] = reinstallInfo
            random_username = ''
            random_password = ''
          } else {
            addToast(t('manager.invalidReinstall'), 'warning')
            return
          }
        }

        const res = await axiosInstance.post('/server/reinstall', {
          sid: row.sid.toString(),
          random_remote_port,
          random_username,
          random_password,
          remote_port,
          username,
          password,
          type,
          isProxy: true,
        })
        if (res.data?.success) {
          const info = res.data.info
          const updates = {
            ip_port: `${info.ip}:${info.port}`,
            user_pass: `${info.username}:${info.password}`,
            type: reinstallType + ' Proxy',
            status: 'Running',
          }
          updateRowBySid(row.sid, () => updates)
          updatedRows.push({ ...row, ...updates })
          proxyResults.push(`${info.ip}:${info.port}:${info.username}:${info.password}`)
        }
        return res
      },
      t('manager.reinstall').toUpperCase()
    )

    // Sync only the updated rows to DB
    if (updatedRows.length > 0) {
      syncToDb(updatedRows)
    }

    if (proxyResults.length > 0) {
      const text = proxyResults.join('\n')
      safeCopy(text).then(
        (ok) =>
          ok &&
          addToast(
            <>
              {t('manager.copied')}{' '}
              <span className="text-text-toast-success">{proxyResults.length}</span> Proxy
            </>,
            'success'
          )
      )
    }
  }, [
    selectedRows,
    reinstallType,
    reinstallInput,
    confirmAction,
    processSequential,
    updateRowBySid,
    safeCopy,
    addToast,
    t,
    syncToDb,
  ])

  // --- Change Note handler ---
  const handleChangeNote = useCallback(async () => {
    const rows = selectedRows
    const updatedRows = []

    let isReplaceMode = false
    let replaceFrom = ''
    let replaceTo = ''

    if (noteInput.includes('->')) {
      const arrowIndex = noteInput.indexOf('->')
      replaceFrom = noteInput.substring(0, arrowIndex)
      replaceTo = noteInput.substring(arrowIndex + 2)
      isReplaceMode = true
    }

    const now = new Date()
    await processSequential(
      rows,
      async (row) => {
        let targetNote = noteInput
        if (isReplaceMode) {
          const oldNote = row.note || ''

          let evaluatedFrom = replaceFrom
          let evaluatedTo = replaceTo

          let calculatedBaseDate = null
          let extractedDDMMText = ''

          const needsDateParsing = evaluatedFrom === '' || /\+(1w|2w|1m)/.test(noteInput)

          if (needsDateParsing) {
            const dateMatch = oldNote.match(/^\**(\d{2})(\d{2})/)
            if (!dateMatch) {
              return {
                data: {
                  success: false,
                  error: 'invalid oldNote format for date calculation/extraction',
                },
              }
            }

            const day = parseInt(dateMatch[1], 10)
            const month = parseInt(dateMatch[2], 10) - 1
            const year = now.getFullYear()
            calculatedBaseDate = new Date(year, month, day)
            extractedDDMMText = `${dateMatch[1]}${dateMatch[2]}`

            if (isNaN(calculatedBaseDate.getTime()) || calculatedBaseDate.getMonth() !== month) {
              return { data: { success: false, error: 'invalid date in oldNote' } }
            }
          }

          if (evaluatedFrom === '') {
            evaluatedFrom = `${extractedDDMMText} `
          }

          if (/\+(1[wW]|2[wW]|1[mM])/.test(noteInput)) {
            const keywordReplacer = (match) => {
              let d =
                match === '+1W' || match === '+2W' || match === '+1M'
                  ? new Date(now)
                  : new Date(calculatedBaseDate)

              const m = match.toLowerCase()
              if (m === '+1w') d.setDate(d.getDate() + 7)
              else if (m === '+2w') d.setDate(d.getDate() + 14)
              else if (m === '+1m') d.setDate(d.getDate() + 30)

              const resD = String(d.getDate()).padStart(2, '0')
              const resM = String(d.getMonth() + 1).padStart(2, '0')
              return `${resD}${resM}`
            }

            const kwRegex = /\+(1[wW]|2[wW]|1[mM])/g
            evaluatedFrom = evaluatedFrom.replace(kwRegex, keywordReplacer)
            evaluatedTo = evaluatedTo.replace(kwRegex, keywordReplacer)
          }

          if (!oldNote.includes(evaluatedFrom)) {
            // Fail if the from string is not found in the old note
            return { data: { success: false, error: 'target string not found in old note' } }
          }
          targetNote = oldNote.replace(evaluatedFrom, evaluatedTo)
        }

        const res = await axiosInstance.put('/server/info/note', {
          sid: row.sid.toString(),
          newNote: targetNote,
        })
        if (res.data?.success) {
          updateRowBySid(row.sid, () => ({ note: targetNote }))
          updatedRows.push({ ...row, note: targetNote })
        }
        return res
      },
      t('manager.changeNote').toUpperCase()
    )

    // Sync in background
    if (updatedRows.length > 0) {
      syncToDb(updatedRows)
    }
  }, [selectedRows, noteInput, processSequential, updateRowBySid, t, syncToDb])

  const handlePause = useCallback(
    () =>
      handleBatchAction(selectedRows, '/server/pause', t('manager.pause').toUpperCase(), () => ({
        status: 'Paused',
      })),
    [handleBatchAction, selectedRows, t]
  )

  const handleReboot = useCallback(
    () =>
      handleBatchAction(selectedRows, '/server/reboot', t('manager.reboot').toUpperCase(), () => ({
        status: 'Running',
      })),
    [handleBatchAction, selectedRows, t]
  )

  const handleCheck = useCallback(async () => {
    const rows = selectedRows
    if (rows.length === 0) {
      addToast(t('manager.noRowsSelected'), 'warning')
      return
    }

    const proxies = rows.map((r) => {
      const latestRow = data.find((d) => d.sid === r.sid) || r
      const [ip, port] = (latestRow.ip_port || '').split(':')
      const [username, password] = (latestRow.user_pass || '').split(':')
      return [ip, port, username, password].filter(Boolean).join(':')
    })

    setIsProcessing(true)
    setRowClassMap({}) // Clear previous highlighting if any

    let processed = 0
    let activeCount = 0
    let inactiveCount = 0
    const updatedRows = []
    const classUpdates = {}

    const total = rows.length
    const loadingId = addToast(
      <>
        {t('check')} <span className="text-text-toast-success">1/{total}</span>
      </>,
      'loading'
    )

    try {
      await axiosInstance.post(
        '/check',
        { type: 'auto', proxies },
        {
          timeout: 0,
          responseType: 'text',
          onDownloadProgress: (e) => {
            const text = e.event?.target?.responseText || ''
            const lines = text.split('\n')

            let count = 0
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              count++
              if (count <= processed) continue

              const jsonStr = line.slice(6)
              if (jsonStr === '{}') continue
              try {
                const result = JSON.parse(jsonStr)

                // Find matching row by IP
                const matchedRow = rows.find((r) => {
                  const latestRow = data.find((d) => d.sid === r.sid) || r
                  return (
                    latestRow.ip_port?.startsWith(result.ip + ':') ||
                    latestRow.ip_port === result.ip
                  )
                })

                if (matchedRow) {
                  const newStatus = result.status === 'Active' ? 'Running' : 'Off'
                  updateRowBySid(matchedRow.sid, () => ({ status: newStatus }))
                  updatedRows.push({ ...matchedRow, status: newStatus })
                  classUpdates[matchedRow.sid] = 'bg-success-cell'

                  // Uncheck the row cleanly
                  deselectRows([matchedRow])
                }

                if (result.status === 'Active') activeCount++
                else inactiveCount++
                processed++

                updateToast(
                  loadingId,
                  <>
                    {t('checking')}{' '}
                    <span className="text-text-toast-success">
                      {Math.min(processed + 1, total)}/{total}
                    </span>
                  </>
                )
              } catch {
                // skip malformed JSON
              }
            }

            if (Object.keys(classUpdates).length > 0) {
              setRowClassMap((prev) => ({ ...prev, ...classUpdates }))
            }
          },
        }
      )

      if (updatedRows.length > 0) {
        syncToDb(updatedRows)
      }

      if (processed > 0) {
        if (inactiveCount === 0)
          addToast(
            <>
              {t('checker.checkCompleted')} <br />
              <span className="text-text-toast-success">
                {activeCount} {t('checker.active')}
              </span>
            </>,
            'success'
          )
        else
          addToast(
            <>
              {t('checker.checkCompleted')} <br />
              <span className="text-text-toast-success">
                {activeCount} {t('checker.active')}
              </span>
              ,{' '}
              <span className="text-text-toast-error">
                {inactiveCount} {t('checker.inactive')}
              </span>
            </>,
            'success'
          )
      }
    } catch (err) {
      console.error('Proxy check failed:', err)
      addToast(t('checker.checkFailed'), 'error')
    } finally {
      setIsProcessing(false)
      removeToast(loadingId)
    }
  }, [
    selectedRows,
    data,
    t,
    addToast,
    updateToast,
    removeToast,
    updateRowBySid,
    setRowClassMap,
    deselectRows,
    syncToDb,
    setIsProcessing,
  ])

  const handleRenew = useCallback(async () => {
    const rows = selectedRows
    if (rows.length === 0) {
      addToast(t('manager.noRowsSelected'), 'warning')
      return
    }

    const renewDataOrConfirmed = await confirmAction({
      title: t('manager.confirmRenew'),
      isProxy: true,
      isRenew: true,
      selectedRows: rows,
    })

    if (!renewDataOrConfirmed) return

    // confirmAction resolves with truthy (the renewData payload if successful fetching occurred).
    // If somehow it's just TRUE, we default to whatever we can.
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
      addToast(t('manager.noValidProxyRenew'), 'warning')
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
      const updatedRows = []
      for (const row of validRows) {
        const cleanIp = row.ip_port?.split(':')[0]

        if (resSuccess[cleanIp]) {
          const newExpiredDay = renewData.success[cleanIp].new_expired_day
          const updates = {
            status: 'Running',
            expired: newExpiredDay,
          }
          updateRowBySid(row.sid, () => updates)
          updatedRows.push({ ...row, ...updates })
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
      if (updatedRows.length > 0) syncToDb(updatedRows)
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
      isProxy: true,
      isRefund: true,
      selectedRows: rows,
    })

    if (!refundDataOrConfirmed) return

    // confirmAction resolves with truthy (the refundData payload if successful fetching occurred).
    // If somehow it's just TRUE, we default to whatever we can.
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
      addToast(t('manager.noValidProxyRefund'), 'warning')
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
      const updatedRows = []
      for (const row of validRows) {
        const cleanIp = row.ip_port?.split(':')[0]

        if (resSuccess[cleanIp]) {
          const updates = {
            status: 'Refunded',
          }
          updateRowBySid(row.sid, () => updates)
          updatedRows.push({ ...row, ...updates })
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
      if (updatedRows.length > 0) syncToDb(updatedRows)
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
          <div className="bg-wrapper flex w-full flex-wrap justify-center gap-2 rounded-lg p-4 sm:gap-3">
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

            {/* Check */}
            <button
              className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium"
              style={{ '--action-color': 'var(--green)' }}
              onClick={handleCheck}
              disabled={isProcessing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-6"
              >
                <path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" />
              </svg>
              {t('check')}
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
              onClick={() => {
                const rows = selectedRows
                if (rows.length === 0) return addToast(t('manager.noRowsSelected'), 'warning')
                const text = rows
                  .map((r) => {
                    const latestRow = data.find((d) => d.sid === r.sid) || r
                    return latestRow.ip_port?.split(':')[0]
                  })
                  .filter(Boolean)
                  .join('\n')
                safeCopy(text).then(
                  (ok) =>
                    ok &&
                    addToast(
                      <>
                        {t('manager.copied')}{' '}
                        <span className="text-text-toast-success">{rows.length}</span>{' '}
                        {t('manager.copiedIps')}
                      </>,
                      'success'
                    )
                )
              }}
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
              id="getInfoBtn"
              className="bg-action flex grow items-center justify-center rounded-lg px-3 py-2 font-medium whitespace-nowrap"
              style={{ '--action-color': 'var(--blue)' }}
              disabled={isProcessing}
              onClick={() => {
                const rows = selectedRows
                if (rows.length === 0) return addToast(t('manager.noRowsSelected'), 'warning')
                const text = rows
                  .map((r) => {
                    const latestRow = data.find((d) => d.sid === r.sid) || r
                    const [ip, port] = (latestRow.ip_port || '').split(':')
                    const [username, password] = (latestRow.user_pass || '').split(':')
                    return [ip, port, username, password].filter(Boolean).join(':')
                  })
                  .join('\n')
                safeCopy(text).then(
                  (ok) =>
                    ok &&
                    addToast(
                      <>
                        {t('manager.copied')}{' '}
                        <span className="text-text-toast-success">{rows.length}</span> Proxy
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

            {/* Change Note */}
            <div className="flex grow">
              <input
                type="text"
                placeholder={t('manager.enterNote')}
                value={noteInput}
                onChange={(e) => {
                  const val = e.target.value
                  const now = new Date()
                  const keywordReplacer = (match) => {
                    let d = new Date(now)
                    if (match === '+1W') d.setDate(d.getDate() + 7)
                    else if (match === '+2W') d.setDate(d.getDate() + 14)
                    else if (match === '+1M') d.setDate(d.getDate() + 30)

                    const resD = String(d.getDate()).padStart(2, '0')
                    const resM = String(d.getMonth() + 1).padStart(2, '0')
                    return `${resD}${resM}`
                  }
                  const newVal = val.replace(/\+(1W|2W|1M)/g, keywordReplacer)
                  setNoteInput(newVal)
                }}
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

            {/* Change IP */}
            <div className="flex grow">
              <button
                className="bg-action flex w-full items-center justify-center rounded-l-lg px-3 py-2 font-medium whitespace-nowrap"
                style={{ '--action-color': 'var(--red)' }}
                onClick={handleChangeIp}
                disabled={isProcessing}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-7"
                >
                  <path d="M566.6 214.6L470.6 310.6C461.4 319.8 447.7 322.5 435.7 317.5C423.7 312.5 416 300.9 416 288L416 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L416 160L416 96C416 83.1 423.8 71.4 435.8 66.4C447.8 61.4 461.5 64.2 470.7 73.3L566.7 169.3C579.2 181.8 579.2 202.1 566.7 214.6zM169.3 566.6L73.3 470.6C60.8 458.1 60.8 437.8 73.3 425.3L169.3 329.3C178.5 320.1 192.2 317.4 204.2 322.4C216.2 327.4 224 339.1 224 352L224 416L544 416C561.7 416 576 430.3 576 448C576 465.7 561.7 480 544 480L224 480L224 544C224 556.9 216.2 568.6 204.2 573.6C192.2 578.6 178.5 575.8 169.3 566.7z" />
                </svg>
                {t('manager.changeIp')}
              </button>
              <DropDown
                options={['HTTPS', 'SOCKS5']}
                value={changeIpType}
                onChange={setChangeIpType}
                className="rounded-r-lg"
              />
            </div>

            {/* Reinstall */}
            <div className="w-full">
              <input
                type="text"
                placeholder={t('manager.portUserPass')}
                value={reinstallInput}
                onChange={(e) => setReinstallInput(e.target.value)}
                className="rounded-b-none"
              />
              <div className="flex">
                <button
                  className="bg-action border-border flex flex-1 items-center justify-center rounded-bl-lg border-l-2 px-3 py-2 font-medium"
                  style={{ '--action-color': 'var(--blue)' }}
                  onClick={handleReinstall}
                  disabled={isProcessing}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                    className="mr-1 size-5 shrink-0 fill-current sm:mr-2 sm:size-7"
                  >
                    <path d="M544.1 256L552 256C565.3 256 576 245.3 576 232L576 88C576 78.3 570.2 69.5 561.2 65.8C552.2 62.1 541.9 64.2 535 71L483.3 122.8C439 86.1 382 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6C143.2 199.5 223.3 128 320 128C364.4 128 405.2 143 437.7 168.3L391 215C384.1 221.9 382.1 232.2 385.8 241.2C389.5 250.2 398.3 256 408 256L544.1 256zM573.5 356.5C576 339 563.8 322.8 546.4 320.3C529 317.8 512.7 330 510.2 347.4C496.9 440.4 416.8 511.9 320.1 511.9C275.7 511.9 234.9 496.9 202.4 471.6L249 425C255.9 418.1 257.9 407.8 254.2 398.8C250.5 389.8 241.7 384 232 384L88 384C74.7 384 64 394.7 64 408L64 552C64 561.7 69.8 570.5 78.8 574.2C87.8 577.9 98.1 575.8 105 569L156.8 517.2C201 553.9 258 576 320 576C449 576 555.7 480.6 573.4 356.5z" />
                  </svg>
                  {t('manager.reinstall')}
                </button>
                <DropDown
                  options={['HTTPS', 'SOCKS5']}
                  value={reinstallType}
                  onChange={setReinstallType}
                  className="border-border rounded-br-lg border-r-2"
                />
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

      {/* ========== REUSABLE FILTER TOOLBAR ========== */}
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
        tableTitle={t('manager.proxyManager')}
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
          'ip_port',
          'country',
          'type',
          'created',
          'expired',
          'status',
          'note',
          'is_auto_renew',
        ]}
        controlButton={(row) => (
          <ControlButton
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
                  username: row.user_pass ? row.user_pass.split(':')[0] : '',
                  password: row.user_pass ? row.user_pass.split(':')[1] : '',
                  type: row.type,
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
                  password: row.user_pass ? row.user_pass.split(':')[1] : '',
                  type: row.type,
                  note: row.note,
                },
              })
            }}
            onCheck={async () => {
              const latestRow = data.find((d) => d.sid === row.sid) || row
              const [ip, port] = (latestRow.ip_port || '').split(':')
              const [username, password] = (latestRow.user_pass || '').split(':')
              const proxies = [`${ip}:${port}:${username}:${password}`]
              setIsProcessing(true)
              setRowClassMap({})
              const loadingId = addToast(t('checking'), 'loading')
              let newStatus

              try {
                await axiosInstance.post(
                  '/check',
                  { type: 'auto', proxies },
                  {
                    timeout: 0,
                    responseType: 'text',
                    onDownloadProgress: (e) => {
                      const text = e.event.target.responseText
                      const jsonStr = text.slice(6)
                      const result = JSON.parse(jsonStr)

                      newStatus = result.status === 'Active' ? 'Running' : 'Off'
                      updateRowBySid(row.sid, () => ({ status: newStatus }))
                      setRowClassMap({
                        [row.sid]: 'bg-success-cell',
                      })

                      // Uncheck the checked row
                      deselectRows([row])
                    },
                  }
                )

                syncToDb([{ ...latestRow, status: newStatus }])

                if (newStatus === 'Running')
                  addToast(
                    <>
                      {t('checker.checkCompleted')} <br />
                      <span className="text-text-toast-success">Proxy {t('checker.active')}</span>
                    </>,
                    'success'
                  )
                else
                  addToast(
                    <>
                      {t('checker.checkCompleted')} <br />
                      <span className="text-text-toast-success">Proxy {t('checker.inactive')}</span>
                    </>,
                    'success'
                  )
              } catch (err) {
                console.error('Proxy check failed:', err)
                addToast(t('checker.checkFailed'), 'error')
              } finally {
                setIsProcessing(false)
                removeToast(loadingId)
              }
            }}
          />
        )}
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
            <div className="border-primary/25 bg-primary/10 text-primary mx-auto flex size-24 items-center justify-center rounded-2xl border shadow-inner">
              <svg
                className="size-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="font-headline text-text-primary text-xl font-bold">
              {t('manager.noProxiesFound')}
            </h3>
            <button
              type="button"
              onClick={() => navigate('/price/proxy')}
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
              {t('manager.buyProxy')}
            </button>
          </div>
        }
        onSelectionChange={onSelectionChange}
      />

      <ReinstallDialog
        key={`reinstall-${reinstallState?.sid}-${reinstallState?.isOpen}`}
        isOpen={reinstallState.isOpen}
        onClose={() =>
          setReinstallState({
            isOpen: false,
            data: {
              sid: '',
              ip: '',
              remote_port: '',
              username: '',
              password: '',
              type: '',
              note: '',
            },
          })
        }
        currentData={reinstallState.data}
        onSuccess={(responseData) => {
          const changes = {
            ip_port: `${responseData.ip}:${responseData.port}`,
            user_pass: `${responseData.username}:${responseData.password}`,
            type: responseData.type,
            status: 'Running',
          }
          updateRowBySid(reinstallState.data.sid, () => changes)
          setRowClassMap({ [reinstallState.data.sid]: 'bg-success-cell' })
          const row = data.find((r) => r.sid === reinstallState.data.sid)
          syncToDb([{ ...row, ...changes }])
          safeCopy(
            `${responseData.ip}:${responseData.port}:${responseData.username}:${responseData.password}`
          )
        }}
      />

      <ChangeIpDialog
        key={`change-ip-${changeIpState?.sid}-${changeIpState?.isOpen}`}
        isOpen={changeIpState.isOpen}
        onClose={() =>
          setChangeIpState({
            isOpen: false,
            data: { sid: '', ip: '', remote_port: '', password: '', type: '', note: '' },
          })
        }
        currentData={changeIpState.data}
        onSuccess={(responseData) => {
          const changes = {
            ip_port: `${responseData.ip}:${responseData.port}`,
            user_pass: `${responseData.username}:${responseData.password}`,
            type: responseData.type,
            status: 'Running',
          }
          updateRowBySid(changeIpState.data.sid, () => changes)
          setRowClassMap({ [changeIpState.data.sid]: 'bg-success-cell' })
          const row = data.find((r) => r.sid === changeIpState.data.sid)
          syncToDb([{ ...row, ...changes }])
          safeCopy(
            `${responseData.ip}:${responseData.port}:${responseData.username}:${responseData.password}`
          )
        }}
      />
    </>
  )
}
