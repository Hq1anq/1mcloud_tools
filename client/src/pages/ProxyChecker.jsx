import DropDown from '../components/ui/DropDown'
import { StandardTable } from '../components/ui/Table'
import { useSafeCopy } from '../context/SafeCopyContext'
import useCapture from '../hooks/useCapture'
import axiosInstance from '../lib/axios'
import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { parseProxy } from '../utils/data'
import { useTranslation } from '../i18n'

export default function ProxyChecker() {
  const navigate = useNavigate()
  const tableRef = useRef(null)
  const [proxyType, setProxyType] = useState('AUTO')
  const [proxyInput, setProxyInput] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [results, setResults] = useState([])
  const [isChecking, setIsChecking] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const { addToast, removeToast } = useToast()
  const { safeCopy } = useSafeCopy()
  const { handleCapture, captureUI } = useCapture(tableRef)
  const t = useTranslation()

  const handleCheck = useCallback(async () => {
    const trimmed = proxyInput.trim()
    if (!trimmed || isChecking) {
      addToast(t('checker.enterProxy'), 'warning')
      return
    }

    const proxies = trimmed.split('\n').map(parseProxy).filter(Boolean)
    if (proxies.length === 0) {
      addToast(t('checker.noProxyFound'), 'warning')
      return
    }

    setResults([])
    setIsChecking(true)

    let processed = 0
    let activeCount = 0
    let inactiveCount = 0

    const loadingId = addToast(t('checker.checkingProxies'), 'loading')
    try {
      await axiosInstance.post(
        '/check',
        { type: proxyType.toLowerCase(), proxies },
        {
          timeout: 0,
          responseType: 'text',
          onDownloadProgress: (e) => {
            const text = e.event?.target?.responseText || ''
            const lines = text.split('\n')

            // Only process newly received lines
            let count = 0
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              count++
              if (count <= processed) continue

              const jsonStr = line.slice(6)
              if (jsonStr === '{}') continue
              try {
                const result = JSON.parse(jsonStr)
                setResults((prev) => [...prev, result])
                if (result.status === 'Active') activeCount++
                else inactiveCount++
                processed++
              } catch {
                // skip malformed JSON
              }
            }
          },
        }
      )
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
      setIsChecking(false)
      removeToast(loadingId)
    }
  }, [proxyType, proxyInput, isChecking, addToast, removeToast, t])

  const handleSelectByStatus = useCallback(
    (status) => {
      const indices = new Set(
        results.map((row, i) => (row.status === status ? i : -1)).filter((i) => i !== -1)
      )
      setSelectedIds(indices)
      setSelectedRows(Array.from(indices).map((i) => results[i]))
    },
    [results]
  )

  const handleCopyIp = useCallback(() => {
    if (selectedRows.length === 0) return
    const text = selectedRows
      .map((r) => r.ip)
      .filter(Boolean)
      .join('\n')
    safeCopy(text).then(
      (ok) =>
        ok &&
        addToast(
          <>
            {t('manager.copied')}{' '}
            <span className="text-text-toast-success">{selectedRows.length}</span>{' '}
            {t('checker.copiedIp')}
          </>,
          'success'
        )
    )
  }, [selectedRows, safeCopy, addToast, t])

  const handleCopyFullProxy = useCallback(() => {
    if (selectedRows.length === 0) return
    const text = selectedRows
      .map((r) => [r.ip, r.port, r.username, r.password].filter(Boolean).join(':'))
      .join('\n')
    safeCopy(text).then(
      (ok) =>
        ok &&
        addToast(
          <>
            {t('manager.copied')}{' '}
            <span className="text-text-toast-success">{selectedRows.length}</span> Proxy
          </>,
          'success'
        )
    )
  }, [selectedRows, safeCopy, addToast, t])

  return (
    <div>
      <div className="bg-surface border-border z-40 border-b select-none">
        <div className="mx-auto max-w-380 px-2 py-4 sm:px-4">
          {/* Top Controls Area */}
          <div className="bg-wrapper rounded-lg p-4">
            <div className="flex flex-wrap items-stretch gap-3">
              {/* Left Side - Proxy Input */}
              <div className="flex grow flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-text-primary flex items-center font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-2 size-7 shrink-0 fill-current"
                    >
                      <path d="M160 96C124.7 96 96 124.7 96 160L96 224C96 259.3 124.7 288 160 288L480 288C515.3 288 544 259.3 544 224L544 160C544 124.7 515.3 96 480 96L160 96zM376 168C389.3 168 400 178.7 400 192C400 205.3 389.3 216 376 216C362.7 216 352 205.3 352 192C352 178.7 362.7 168 376 168zM432 192C432 178.7 442.7 168 456 168C469.3 168 480 178.7 480 192C480 205.3 469.3 216 456 216C442.7 216 432 205.3 432 192zM160 352C124.7 352 96 380.7 96 416L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 416C544 380.7 515.3 352 480 352L160 352zM376 424C389.3 424 400 434.7 400 448C400 461.3 389.3 472 376 472C362.7 472 352 461.3 352 448C352 434.7 362.7 424 376 424zM432 448C432 434.7 442.7 424 456 424C469.3 424 480 434.7 480 448C480 461.3 469.3 472 456 472C442.7 472 432 461.3 432 448z" />
                    </svg>
                    <label className="flex flex-wrap">
                      <span className="whitespace-pre">{t('checker.proxyList')} </span>
                      <span>{t('manager.onePerLine')}</span>
                    </label>
                  </label>
                  <button
                    onClick={async () => {
                      if (!proxyInput.trim()) {
                        try {
                          const text = await navigator.clipboard.readText()
                          setProxyInput(text)
                        } catch (err) {
                          console.error('Failed to read clipboard contents: ', err)
                        }
                      } else setProxyInput('')
                    }}
                    className="bg-action static right-0 flex items-center justify-center rounded-lg px-3 py-1 text-sm font-medium transition-colors md:absolute lg:static"
                    style={{ '--action-color': !proxyInput.trim() ? 'var(--blue)' : 'var(--red)' }}
                  >
                    {!proxyInput.trim() ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        className="mr-1 size-6 shrink-0 fill-current"
                      >
                        <g>
                          <path d="m26 8v19a3.009 3.009 0 0 1 -3 3h-14a3.009 3.009 0 0 1 -3-3v-19a3.009 3.009 0 0 1 3-3v2a3.009 3.009 0 0 0 3 3h8a3.009 3.009 0 0 0 3-3v-2a3.009 3.009 0 0 1 3 3z" />
                          <path d="m12 8a1 1 0 0 1 -1-1v-2a1 1 0 0 1 1-1h1.125l.29-.5a2.959 2.959 0 0 1 2.185-1.459 1.9 1.9 0 0 1 .384-.041 2.139 2.139 0 0 1 .418.037 2.963 2.963 0 0 1 2.184 1.463l.289.5h1.125a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1z" />
                        </g>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        className="mr-1 size-6 shrink-0 fill-current"
                      >
                        <path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" />
                      </svg>
                    )}
                    {!proxyInput.trim() ? t('paste') : t('delete')}
                  </button>
                </div>
                <textarea
                  value={proxyInput}
                  onChange={(e) => setProxyInput(e.target.value)}
                  placeholder="192.168.1.1:8080:user:pass&#10;user:pass@10.0.0.1:8080"
                  className="min-h-24 grow whitespace-pre"
                ></textarea>
              </div>

              {/* Right Side - Action Controls */}
              <div className="flex grow flex-col justify-center gap-2">
                {/* Top Row - Proxy Type and Check Button */}
                <div className="grid grid-cols-[2fr_1fr] grid-rows-2">
                  <label className="text-text-primary flex items-center font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-2 size-7 shrink-0 fill-current"
                    >
                      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
                    </svg>
                    {t('check')} Proxy
                  </label>
                  <label className="text-text-primary flex items-center font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-2 size-7 shrink-0 fill-current"
                    >
                      <path d="M96 128C83.1 128 71.4 135.8 66.4 147.8C61.4 159.8 64.2 173.5 73.4 182.6L256 365.3L256 480C256 488.5 259.4 496.6 265.4 502.6L329.4 566.6C338.6 575.8 352.3 578.5 364.3 573.5C376.3 568.5 384 556.9 384 544L384 365.3L566.6 182.7C575.8 173.5 578.5 159.8 573.5 147.8C568.5 135.8 556.9 128 544 128L96 128z" />
                    </svg>
                    {t('type')}
                  </label>
                  <button
                    onClick={handleCheck}
                    disabled={isChecking}
                    className="bg-action flex w-full items-center justify-center rounded-l-lg px-4 py-2 font-bold disabled:opacity-50"
                    style={{ '--action-color': 'var(--purple)' }}
                  >
                    {isChecking ? (
                      <svg
                        className="mr-1 size-7 shrink-0 animate-spin fill-none sm:mr-2"
                        viewBox="0 0 50 50"
                      >
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="5"
                          className="text-border"
                        />
                        <circle
                          cx="25"
                          cy="25"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray="90"
                          strokeDashoffset="60"
                        ></circle>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        className="mr-1 size-7 shrink-0 fill-current sm:mr-2"
                      >
                        <path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z" />
                      </svg>
                    )}
                    {isChecking ? t('checking') : t('check')}
                  </button>
                  <DropDown
                    options={['AUTO', 'HTTP', 'SOCKS5']}
                    value={proxyType}
                    onChange={setProxyType}
                    className="rounded-r-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-y-2">
                  {/* Copy Buttons */}
                  <button
                    onClick={handleCopyIp}
                    className="bg-action flex flex-1 items-center justify-center rounded-l-xl px-4 py-2 font-medium"
                    style={{ '--action-color': 'var(--primary)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-1 size-7 shrink-0 fill-current sm:mr-2"
                    >
                      <path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z" />
                    </svg>
                    {t('checker.copyIp')}
                  </button>

                  <button
                    onClick={handleCopyFullProxy}
                    className="bg-action flex flex-1 items-center justify-center rounded-r-xl px-4 py-2 font-medium"
                    style={{ '--action-color': 'var(--orange)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-1 size-7 shrink-0 fill-current sm:mr-2"
                    >
                      <path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z" />
                    </svg>
                    {t('checker.copyFullProxy')}
                  </button>

                  {/* Selection buttons*/}
                  <button
                    onClick={() => handleSelectByStatus('Active')}
                    className="bg-action flex items-center justify-center rounded-l-xl px-4 py-2 font-medium"
                    style={{ '--action-color': 'var(--green)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-1 size-7 shrink-0 fill-current sm:mr-2"
                    >
                      <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM438 209.7C427.3 201.9 412.3 204.3 404.5 215L285.1 379.2L233 327.1C223.6 317.7 208.4 317.7 199.1 327.1C189.8 336.5 189.7 351.7 199.1 361L271.1 433C276.1 438 282.9 440.5 289.9 440C296.9 439.5 303.3 435.9 307.4 430.2L443.3 243.2C451.1 232.5 448.7 217.5 438 209.7z" />
                    </svg>
                    {t('checker.selectActive')}
                  </button>

                  <button
                    onClick={() => handleSelectByStatus('Inactive')}
                    className="bg-action flex items-center justify-center rounded-r-xl px-4 py-2 font-medium"
                    style={{ '--action-color': 'var(--red)' }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 640 640"
                      className="mr-1 size-7 shrink-0 fill-current sm:mr-2"
                    >
                      <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C240.4 221.6 255.6 221.6 264.9 231L319.9 286L374.9 231C384.3 221.6 399.5 221.6 408.8 231C418.1 240.4 418.2 255.6 408.8 264.9L353.8 319.9L408.8 374.9C418.2 384.3 418.2 399.5 408.8 408.8C399.4 418.1 384.2 418.2 374.9 408.8L319.9 353.8L264.9 408.8C255.5 418.2 240.3 418.2 231 408.8C221.7 399.4 221.6 384.2 231 374.9L286 319.9L231 264.9C221.6 255.5 221.6 240.3 231 231z" />
                    </svg>
                    {t('checker.selectInactive')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StandardTable
        data={results}
        tableTitle={t('checker.proxyStatus')}
        useFilter={false}
        className="mt-4 px-4 text-base sm:text-lg"
        headers={['ip', 'port', 'username', 'password', 'type', 'country', 'status']}
        selectedIds={selectedIds}
        ref={tableRef}
        extraBtn={
          <button
            id="captureBtn"
            onClick={handleCapture}
            className="bg-action group rounded-lg p-2"
            style={{ '--action-color': 'var(--orange)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="fill-text-secondary size-5 shrink-0 transition-transform group-hover:scale-105 sm:size-7"
            >
              <path d="M384 320V192C384 174.326 369.674 160 352 160H316L309.812 143.562C306.312 134.188 297.375 128 287.375 128H224.625C214.625 128 205.625 134.188 202.125 143.562L196 160H160C142.326 160 128 174.326 128 192V320C128 337.672 142.326 352 160 352H352C369.674 352 384 337.672 384 320ZM256 304C229.5 304 208 282.5 208 256S229.5 208 256 208S304 229.5 304 256S282.5 304 256 304ZM144 432H48V336C48 327.162 40.836 320 32 320H16C7.164 320 0 327.162 0 336V448C0 465.672 14.326 480 32 480H144C152.836 480 160 472.836 160 464V448C160 439.162 152.836 432 144 432ZM16 192H32C40.836 192 48 184.836 48 176V80H144C152.836 80 160 72.836 160 64V48C160 39.162 152.836 32 144 32H32C14.326 32 0 46.326 0 64V176C0 184.836 7.164 192 16 192ZM480 32H368C359.164 32 352 39.162 352 48V64C352 72.836 359.164 80 368 80H464V176C464 184.836 471.164 192 480 192H496C504.836 192 512 184.836 512 176V64C512 46.326 497.674 32 480 32ZM496 320H480C471.164 320 464 327.162 464 336V432H368C359.164 432 352 439.162 352 448V464C352 472.836 359.164 480 368 480H480C497.674 480 512 465.672 512 448V336C512 327.162 504.836 320 496 320Z" />
            </svg>
          </button>
        }
        emptyState={
          !isChecking && (
            <div
              id="emptyState"
              className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-10 select-none"
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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="space-y-1 text-center">
                <h3 className="font-headline text-text-primary text-xl font-bold">
                  {t('checker.emptyTitle')}
                </h3>
                <p className="text-text-muted text-sm">
                  {t('checker.emptyDescPrefix')}{' '}
                  <span className="text-primary font-medium">{t('check')}</span>
                  {t('checker.emptyDescSuffix')}
                </p>
              </div>
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
          )
        }
        onSelectionChange={(rows, ids) => {
          setSelectedRows(rows)
          setSelectedIds(ids)
        }}
      />

      {captureUI}
    </div>
  )
}
