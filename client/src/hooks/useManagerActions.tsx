import { useState, useCallback, ReactNode } from 'react'
import axiosInstance from '../lib/axios'
import { randomDelay } from '../utils/ui'
import { useToast } from '../context/ToastContext'
import { useTranslation } from '../i18n'
import useProfileStore from '../store/useProfileStore'

export interface ManagerRowItem {
  sid: number
  [key: string]: unknown
}

export interface ManagerStore<T extends ManagerRowItem> {
  updateRowBySid: (sid: number, updater: (prev: T) => Partial<T>) => void
  syncToDb: (rows: T[]) => Promise<void>
  onDeselect?: (rows: T[]) => void
}

export interface BatchActionConfig<T extends ManagerRowItem> {
  endpoint: string
  actionName: string
  statusUpdater?: (row: T) => Partial<T>
  extraData?: Record<string, unknown>
  onDeselect?: (rows: T[]) => void
}

export interface SingleActionConfig<T extends ManagerRowItem> {
  endpoint: string
  data: unknown
  actionName: string
  statusUpdater?: (row: T) => Partial<T>
}

export interface SequentialActionResponse {
  data?: {
    success?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface SequentialActionConfig<T extends ManagerRowItem> {
  apiCallFn: (row: T) => Promise<SequentialActionResponse>
  actionName: string
  onRowCompleted?: (row: T, success: boolean, res?: SequentialActionResponse) => void
  onDeselect?: (rows: T[]) => void
}

export interface ActionResult<T extends ManagerRowItem> {
  success: boolean
  rows?: T[]
}

/**
 * Action runner hook for batch, single, and sequential operations.
 * Separated cleanly from table selection logic.
 */
export default function useManagerActions<T extends ManagerRowItem>(store: ManagerStore<T>) {
  const { updateRowBySid, syncToDb, onDeselect: defaultOnDeselect } = store

  const { addToast, updateToast, removeToast } = useToast()
  const t = useTranslation()
  const fetchBalance = useProfileStore((s) => s.fetchBalance)

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [rowClassMap, setRowClassMap] = useState<Record<string | number, string>>({})

  // --- Batch handler: single API call for given rows ---
  const handleBatchAction = useCallback(
    async (
      rows: T[],
      configOrEndpoint: BatchActionConfig<T> | string,
      actionNameParam?: string,
      statusUpdaterParam?: (row: T) => Partial<T>
    ): Promise<ActionResult<T>> => {
      const config: BatchActionConfig<T> =
        typeof configOrEndpoint === 'string'
          ? {
              endpoint: configOrEndpoint,
              actionName: actionNameParam || '',
              statusUpdater: statusUpdaterParam,
            }
          : configOrEndpoint

      const { endpoint, actionName, statusUpdater, extraData, onDeselect } = config
      const deselectFn = onDeselect || defaultOnDeselect

      if (!rows || rows.length === 0) {
        addToast(t('manager.noRowsSelected'), 'warning')
        return { success: false }
      }

      const loadingId = addToast(`${actionName}...`, 'loading')
      setIsProcessing(true)
      const sids = rows.map((r) => r.sid).join(',')

      try {
        const payload = { sids, ...(extraData || {}) }
        const res = await axiosInstance.post(endpoint, payload)

        if (res.data?.success) {
          const classUpdates: Record<string | number, string> = {}
          const updatedRows: T[] = []

          for (const row of rows) {
            if (statusUpdater) {
              const updates = statusUpdater(row)
              updateRowBySid(row.sid, () => updates)
              updatedRows.push({ ...row, ...updates })
            }
            classUpdates[row.sid] = 'bg-success-cell'
          }

          setRowClassMap((prev) => ({ ...prev, ...classUpdates }))
          deselectFn?.(rows)
          fetchBalance()

          addToast(
            (
              <>
                {actionName} {t('manager.completed')} <br />
                <span className="text-text-toast-success">
                  {rows.length} {t('manager.success')}
                </span>
              </>
            ) as ReactNode,
            'success'
          )

          if (updatedRows.length > 0) {
            syncToDb(updatedRows)
          }

          removeToast(loadingId)
          setIsProcessing(false)
          return { success: true, rows }
        } else {
          const classUpdates: Record<string | number, string> = {}
          for (const row of rows) {
            classUpdates[row.sid] = 'bg-error-cell'
          }
          setRowClassMap((prev) => ({ ...prev, ...classUpdates }))
          deselectFn?.(rows)

          addToast(
            (
              <>
                {actionName} {t('manager.completed')} <br />
                <span className="text-text-toast-error">
                  {rows.length} {t('manager.failed')}
                </span>
              </>
            ) as ReactNode,
            'error'
          )

          removeToast(loadingId)
          setIsProcessing(false)
          return { success: false, rows }
        }
      } catch {
        const classUpdates: Record<string | number, string> = {}
        for (const row of rows) {
          classUpdates[row.sid] = 'bg-error-cell'
        }
        setRowClassMap((prev) => ({ ...prev, ...classUpdates }))
        deselectFn?.(rows)

        addToast(
          (
            <>
              {actionName} {t('manager.completed')} <br />
              <span className="text-text-toast-error">
                {rows.length} {t('manager.failed')}
              </span>
            </>
          ) as ReactNode,
          'error'
        )

        removeToast(loadingId)
        setIsProcessing(false)
        return { success: false, rows }
      }
    },
    [addToast, removeToast, syncToDb, updateRowBySid, t, fetchBalance, defaultOnDeselect]
  )

  // --- Single handler: single API call for one row ---
  const handleSingleAction = useCallback(
    async (
      row: T,
      configOrEndpoint: SingleActionConfig<T> | string,
      dataParam?: unknown,
      actionNameParam?: string,
      statusUpdaterParam?: (row: T) => Partial<T>
    ): Promise<ActionResult<T>> => {
      const config: SingleActionConfig<T> =
        typeof configOrEndpoint === 'string'
          ? {
              endpoint: configOrEndpoint,
              data: dataParam,
              actionName: actionNameParam || '',
              statusUpdater: statusUpdaterParam,
            }
          : configOrEndpoint

      const { endpoint, data, actionName, statusUpdater } = config
      const loadingId = addToast(`${actionName}...`, 'loading')
      setIsProcessing(true)

      try {
        const res = await axiosInstance.post(endpoint, data)
        if (res.data?.success) {
          let updates: Partial<T> = {}
          if (statusUpdater) {
            updates = statusUpdater(row)
            updateRowBySid(row.sid, () => updates)
          }

          setRowClassMap((prev) => ({ ...prev, [row.sid]: 'bg-success-cell' }))
          fetchBalance()

          addToast(
            (
              <>
                {actionName} {t('manager.completed')} <br />
                <span className="text-text-toast-success">1 {t('manager.success')}</span>
              </>
            ) as ReactNode,
            'success'
          )

          if (statusUpdater) {
            syncToDb([{ ...row, ...updates }])
          }

          removeToast(loadingId)
          setIsProcessing(false)
          return { success: true, rows: [row] }
        } else {
          setRowClassMap((prev) => ({ ...prev, [row.sid]: 'bg-error-cell' }))

          addToast(
            (
              <>
                {actionName} {t('manager.completed')} <br />
                <span className="text-text-toast-error">1 {t('manager.failed')}</span>
              </>
            ) as ReactNode,
            'error'
          )

          removeToast(loadingId)
          setIsProcessing(false)
          return { success: false, rows: [row] }
        }
      } catch {
        setRowClassMap((prev) => ({ ...prev, [row.sid]: 'bg-error-cell' }))

        addToast(
          (
            <>
              {actionName} {t('manager.completed')} <br />
              <span className="text-text-toast-error">1 {t('manager.failed')}</span>
            </>
          ) as ReactNode,
          'error'
        )

        removeToast(loadingId)
        setIsProcessing(false)
        return { success: false, rows: [row] }
      }
    },
    [addToast, removeToast, syncToDb, updateRowBySid, t, fetchBalance]
  )

  // --- Sequential processor: one API call per row with per-row feedback ---
  const processSequential = useCallback(
    async (
      rows: T[],
      configOrApiCallFn:
        SequentialActionConfig<T> | ((row: T) => Promise<SequentialActionResponse>),
      actionNameParam?: string
    ): Promise<ActionResult<T>> => {
      const config: SequentialActionConfig<T> =
        typeof configOrApiCallFn === 'function'
          ? {
              apiCallFn: configOrApiCallFn,
              actionName: actionNameParam || '',
            }
          : configOrApiCallFn

      const { apiCallFn, actionName, onRowCompleted, onDeselect } = config
      const deselectFn = onDeselect || defaultOnDeselect

      if (!rows || rows.length === 0) {
        addToast(t('manager.noRowsSelected'), 'warning')
        return { success: false }
      }

      setIsProcessing(true)
      setRowClassMap({})
      let successCount = 0
      let failCount = 0

      const total = rows.length
      const loadingId = addToast(
        (
          <>
            {actionName} <span className="text-text-toast-success">1/{total}</span>
          </>
        ) as ReactNode,
        'loading'
      )

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        let isSuccess = false
        let res: SequentialActionResponse | undefined

        try {
          res = await apiCallFn(row)
          if (res?.data?.success) {
            successCount++
            isSuccess = true
            setRowClassMap((prev) => ({ ...prev, [row.sid]: 'bg-success-cell' }))
          } else {
            failCount++
            setRowClassMap((prev) => ({ ...prev, [row.sid]: 'bg-error-cell' }))
          }
        } catch {
          failCount++
          setRowClassMap((prev) => ({ ...prev, [row.sid]: 'bg-error-cell' }))
        }

        const isReinstallOrChangeIp = [
          t('manager.reinstall').toUpperCase(),
          t('manager.changeIp').toUpperCase(),
          t('manager.reset').toUpperCase(),
        ].includes(actionName.toUpperCase())

        const shouldUncheck = isReinstallOrChangeIp ? !isSuccess : isSuccess

        if (shouldUncheck) {
          deselectFn?.([row])
        }

        onRowCompleted?.(row, isSuccess, res)

        updateToast(
          loadingId,
          (
            <>
              {actionName}{' '}
              <span className="text-text-toast-success">
                {i + 2}/{total}
              </span>
            </>
          ) as ReactNode
        )

        if (i < rows.length - 1) {
          await randomDelay()
        }
      }

      removeToast(loadingId)
      setIsProcessing(false)

      if (successCount > 0) {
        fetchBalance()
      }

      if (failCount === 0) {
        addToast(
          (
            <>
              {actionName} {t('manager.completed')} <br />
              <span className="text-text-toast-success">
                {successCount} {t('manager.success')}
              </span>
            </>
          ) as ReactNode,
          'success'
        )
      } else if (successCount === 0) {
        addToast(
          (
            <>
              {actionName} {t('manager.completed')} <br />
              <span className="text-text-toast-error">
                {failCount} {t('manager.failed')}
              </span>
            </>
          ) as ReactNode,
          'error'
        )
      } else {
        addToast(
          (
            <>
              {actionName} {t('manager.completed')} <br />
              <span className="text-text-toast-success">
                {successCount} {t('manager.success')}
              </span>
              ,{' '}
              <span className="text-text-toast-error">
                {failCount} {t('manager.failed')}
              </span>
            </>
          ) as ReactNode,
          'error'
        )
      }

      return { success: failCount === 0, rows }
    },
    [addToast, updateToast, removeToast, t, fetchBalance, defaultOnDeselect]
  )

  return {
    isProcessing,
    setIsProcessing,
    rowClassMap,
    setRowClassMap,
    handleBatchAction,
    handleSingleAction,
    processSequential,
  }
}
