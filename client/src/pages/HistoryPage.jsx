import { useCallback, useEffect, useMemo, useState } from 'react'
import Table from '../components/ui/Table'
import HistoryMetricsCards from '../components/ui/HistoryMetricsCards'
import axiosInstance from '../lib/axios'
import { useTranslation } from '../i18n'

const parseAmount = (value) => {
  if (typeof value === 'number') return value
  if (!value) return 0

  const normalized = String(value).replace(/,/g, '').trim()
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

const getRows = (res) => (Array.isArray(res?.data?.info) ? res.data.info : [])

export default function HistoryPage() {
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState('transaction')
  const [transactionRows, setTransactionRows] = useState([])
  const [changeIpRows, setChangeIpRows] = useState([])
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [changeIpLoading, setChangeIpLoading] = useState(false)
  const [transactionError, setTransactionError] = useState('')
  const [changeIpError, setChangeIpError] = useState('')
  const [changeIpLoaded, setChangeIpLoaded] = useState(false)

  const fetchTransactions = useCallback(async () => {
    setTransactionLoading(true)
    setTransactionError('')

    try {
      const res = await axiosInstance.get('/logs/transaction')
      if (!res.data?.success) setTransactionError(t('history.errorTransaction'))
      else setTransactionRows(getRows(res))
    } catch {
      setTransactionError(t('history.errorTransaction'))
    } finally {
      setTransactionLoading(false)
    }
  }, [t])

  const fetchChangeIp = useCallback(async () => {
    setChangeIpLoading(true)
    setChangeIpError('')

    try {
      const res = await axiosInstance.get('/logs/change-ip')
      if (!res.data?.success) setChangeIpError(t('history.errorChangeIp'))
      else {
        setChangeIpRows(getRows(res))
        setChangeIpLoaded(true)
      }
    } catch {
      setChangeIpError(t('history.errorChangeIp'))
    } finally {
      setChangeIpLoading(false)
    }
  }, [t])

  useEffect(() => {
    const id = requestAnimationFrame(() => fetchTransactions())
    return () => cancelAnimationFrame(id)
  }, [fetchTransactions])

  const handleTabChange = (tab) => {
    setActiveTab(tab)

    if (tab === 'change_ip' && !changeIpLoaded && !changeIpLoading) {
      fetchChangeIp()
    }
  }

  const metrics = useMemo(() => {
    const numRefund = transactionRows.filter((row) => row.trans_type === 'REFUND').length
    const numRenew = transactionRows.filter((row) => row.trans_type === 'RENEWAL').length
    const totalPrice = transactionRows.reduce((sum, row) => sum + parseAmount(row.amount), 0)

    return {
      numRenew,
      numRefund,
      numTransaction: transactionRows.length,
      totalPrice,
    }
  }, [transactionRows])

  const transactionData = useMemo(
    () =>
      transactionRows.map((row) => ({
        trans_type: row.trans_type,
        amount: row.amount,
        update_balance: row.update_balance,
        ip: row.ip,
        created: row.created,
        description: row.description,
      })),
    [transactionRows]
  )

  const changeIpData = useMemo(
    () =>
      changeIpRows.map((row) => ({
        server_name: row.server_name,
        old_ip: row.old_ip,
        new_ip: row.new_ip,
        created: row.created,
      })),
    [changeIpRows]
  )

  const transactionHeaders = [
    'trans_type',
    'amount',
    'update_balance',
    'ip',
    'created',
    'description',
  ]
  const transactionOperatorConfig = {
    amount: ['equal', 'greater-equal', 'less-equal'],
    update_balance: ['equal', 'greater-equal', 'less-equal'],
    created: ['equal', 'greater-equal', 'less-equal'],
  }

  const changeIpHeaders = ['server_name', 'old_ip', 'new_ip', 'created']
  const changeIpOperatorConfig = {
    created: ['equal', 'greater-equal', 'less-equal'],
  }

  const currentData = activeTab === 'transaction' ? transactionData : changeIpData
  const currentHeaders = activeTab === 'transaction' ? transactionHeaders : changeIpHeaders
  const currentOperatorConfig =
    activeTab === 'transaction' ? transactionOperatorConfig : changeIpOperatorConfig
  const isLoading = activeTab === 'transaction' ? transactionLoading : changeIpLoading
  const error = activeTab === 'transaction' ? transactionError : changeIpError

  return (
    <>
      <div className="bg-surface border-border border-b">
        <div className="mx-auto max-w-380 px-2 py-4 sm:px-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleTabChange('transaction')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'transaction'
                  ? 'bg-blue text-text-secondary'
                  : 'border-border bg-thead text-text-primary border'
              }`}
            >
              {t('history.transaction')}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('change_ip')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'change_ip'
                  ? 'bg-blue text-text-secondary'
                  : 'border-border bg-thead text-text-primary border'
              }`}
            >
              {t('history.changeIp')}
            </button>
          </div>

          {activeTab === 'transaction' && (
            <HistoryMetricsCards
              numRenew={metrics.numRenew}
              numRefund={metrics.numRefund}
              numTransaction={metrics.numTransaction}
              totalPrice={metrics.totalPrice}
              className="mt-4"
            />
          )}
        </div>
      </div>

      <Table
        tableTitle="History"
        className="mt-4 px-4 text-base sm:text-lg"
        data={currentData}
        headers={currentHeaders}
        isLoading={isLoading}
        useFilter={true}
        operatorConfig={currentOperatorConfig}
        selectable={false}
        isError={!!error}
        extraBtn={
          <button
            id="reloadBtn"
            className="bg-action group rounded-lg p-2"
            style={{ '--action-color': 'var(--orange)' }}
            onClick={() => {
              if (activeTab === 'transaction') fetchTransactions()
              else fetchChangeIp()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="fill-text-secondary size-5 shrink-0 group-hover:rotate-15 sm:size-7"
            >
              <path d="M544.1 256L552 256C565.3 256 576 245.3 576 232L576 88C576 78.3 570.2 69.5 561.2 65.8C552.2 62.1 541.9 64.2 535 71L483.3 122.8C439 86.1 382 64 320 64C191 64 84.3 159.4 66.6 283.5C64.1 301 76.2 317.2 93.7 319.7C111.2 322.2 127.4 310 129.9 292.6C143.2 199.5 223.3 128 320 128C364.4 128 405.2 143 437.7 168.3L391 215C384.1 221.9 382.1 232.2 385.8 241.2C389.5 250.2 398.3 256 408 256L544.1 256zM573.5 356.5C576 339 563.8 322.8 546.4 320.3C529 317.8 512.7 330 510.2 347.4C496.9 440.4 416.8 511.9 320.1 511.9C275.7 511.9 234.9 496.9 202.4 471.6L249 425C255.9 418.1 257.9 407.8 254.2 398.8C250.5 389.8 241.7 384 232 384L88 384C74.7 384 64 394.7 64 408L64 552C64 561.7 69.8 570.5 78.8 574.2C87.8 577.9 98.1 575.8 105 569L156.8 517.2C201 553.9 258 576 320 576C449 576 555.7 480.6 573.4 356.5z" />
            </svg>
          </button>
        }
        errorMessage={
          <div id="errorState" className="py-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="fill-text-muted mx-auto size-16 shrink-0 sm:size-18"
            >
              <path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
            </svg>
            <p className="text-text-muted text-base select-none sm:text-xl">{error}</p>
          </div>
        }
      />
    </>
  )
}
