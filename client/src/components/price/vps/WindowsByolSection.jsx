import { useState, useEffect, useMemo } from 'react'
import DropDown from '../../ui/DropDown.jsx'
import Checkbox from '../../ui/Checkbox.jsx'
import Skeleton from '../../ui/Skeleton.jsx'
import WindowsKeyInput from '../../ui/WindowsKeyInput.jsx'
import { useTranslation } from '../../../i18n/index.js'
import { maskProductKey, isValidLicense } from '../../../utils/ui'

export default function WindowsByolSection({
  userLicenses = [],
  licensesLoading = false,
  agreeBYOL = false,
  setAgreeBYOL,
  onChange,
}) {
  const t = useTranslation()
  const newKeyOption = t('buyVps.enterNewKeyOption')
  const unusedLabel = t('buyVps.unusedLicense')


  // 1. Group raw licenses by license_key and collect unique server IPs
  const groupedLicenses = useMemo(() => {
    if (!userLicenses || userLicenses.length === 0) return []
    const groupMap = new Map()
    for (const lic of userLicenses) {
      if (!lic.license_key) continue
      if (!groupMap.has(lic.license_key)) {
        groupMap.set(lic.license_key, {
          license_key: lic.license_key,
          servers: [],
        })
      }
      const item = groupMap.get(lic.license_key)
      if (lic.server && lic.server.ip && !item.servers.includes(lic.server.ip)) {
        item.servers.push(lic.server.ip)
      }
    }
    return Array.from(groupMap.values()).sort((a, b) => a.license_key.localeCompare(b.license_key))
  }, [userLicenses])

  // 2. Format options for DropDown (convention: value === '' signifies New Key option)
  const dropdownOptions = useMemo(() => {
    const newKeyObj = {
      value: '',
      label: newKeyOption,
      subLabel: null,
      servers: [],
    }

    if (!groupedLicenses || groupedLicenses.length === 0) return [newKeyObj]

    const licenseOpts = groupedLicenses.map((lic) => {
      const hasServers = lic.servers && lic.servers.length > 0
      return {
        value: lic.license_key,
        label: maskProductKey(lic.license_key),
        subLabel: hasServers ? `IP: ${lic.servers.join(', ')}` : unusedLabel,
        servers: lic.servers,
      }
    })

    return [...licenseOpts, newKeyObj]
  }, [groupedLicenses, newKeyOption, unusedLabel])

  const [userSelectedOption, setUserSelectedOption] = useState(null)
  const [customKey, setCustomKey] = useState('')

  // 3. Derive active selected option:
  // Uses user's manual selection if set, otherwise defaults to first option
  const selectedOption = useMemo(() => {
    if (userSelectedOption) {
      const match = dropdownOptions.find((opt) => opt.value === userSelectedOption.value)
      if (match) return match
    }
    return dropdownOptions[0] || null
  }, [dropdownOptions, userSelectedOption])

  const handleSelectOption = (opt) => {
    setUserSelectedOption(opt)
  }

  // 4. Derive effective license key & validity
  const isNewKeySelected = !selectedOption?.value || groupedLicenses.length === 0
  const effectiveLicenseKey = isNewKeySelected ? customKey : selectedOption?.value || customKey
  const isValidWindowsKey = isValidLicense(effectiveLicenseKey)

  // 5. Notify parent component when key or validity changes
  useEffect(() => {
    if (onChange) {
      onChange({
        licenseKey: effectiveLicenseKey,
        isValid: isValidWindowsKey,
      })
    }
  }, [effectiveLicenseKey, isValidWindowsKey, onChange])

  // 6. Custom renderer for license options
  const renderLicenseItem = (option) => {
    if (!option) return null
    if (typeof option === 'string') return option
    if (!option.value) {
      return (
        <div className="flex items-center gap-2 py-0.5">
          <span className="font-mono text-sm font-medium">{option.label}</span>
        </div>
      )
    }
    const hasServers = option.servers && option.servers.length > 0
    return (
      <div className="flex flex-col gap-0.5 py-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-mono text-sm font-medium tracking-wide">
            {option.label}
          </span>
        </div>
        {option.subLabel && (
          <div className="text-text-muted flex items-center gap-1.5 truncate text-xs font-normal">
            <span
              className={`block size-2 shrink-0 rounded-full ${
                hasServers ? 'bg-primary' : 'bg-emerald-400'
              }`}
            />
            <span>{option.subLabel}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border-border bg-terminal my-2 flex w-full flex-col gap-3 rounded-xl border p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          className="text-primary size-5 shrink-0 fill-current"
        >
          <path d="M64 128L288 96V304H64V128ZM64 336H288V544L64 512V336ZM320 91.5L576 56V304H320V91.5ZM320 336H576V584L320 548.5V336Z" />
        </svg>
        <span className="text-text-primary text-base font-bold">{t('buyVps.winLicenseTitle')}</span>
      </div>

      {/* Existing license dropdown */}
      {(licensesLoading || groupedLicenses.length > 0) && (
        <div className="flex flex-col gap-1.5 text-lg">
          <span className="text-text-muted text-sm font-medium">
            {t('buyVps.selectExistingLicense')}
          </span>
          <Skeleton
            isLoading={licensesLoading}
            element={
              <DropDown
                options={dropdownOptions}
                value={selectedOption}
                onChange={handleSelectOption}
                renderItem={renderLicenseItem}
                isEqual={(a, b) => a?.value === b?.value}
                className="bg-wrapper rounded-lg text-xs sm:text-lg"
                menuClassName="text-xs sm:text-lg"
              />
            }
            className="bg-text-muted h-10 w-full rounded-lg"
          />
        </div>
      )}

      {/* Key input if "Sử dụng key mới" or no licenses */}
      {isNewKeySelected && (
        <div className="flex flex-col gap-1 text-lg">
          <span className="text-text-muted text-sm font-medium">
            {t('buyVps.enterWinProductKey')}
          </span>
          <WindowsKeyInput
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className={`rounded-lg px-3 py-2 font-mono text-base tracking-wider uppercase ${
              customKey && !isValidWindowsKey ? 'border-orange focus:border-orange' : ''
            }`}
          />
          {customKey && !isValidWindowsKey && (
            <span className="text-orange text-xs font-medium">
              {t('buyVps.invalidWinKeyFormat')}
            </span>
          )}
        </div>
      )}

      {/* BYOL Checkbox Disclaimer */}
      <label className="hover:text-text-primary flex cursor-pointer items-start gap-2.5 pt-1 transition-colors">
        <div className="shrink-0 pt-0.5">
          <Checkbox checked={agreeBYOL} onChange={(e) => setAgreeBYOL(e.target.checked)} />
        </div>
        <span className="text-orange text-sm leading-relaxed select-none">
          {t('buyVps.byolDisclaimerLine1')}
          <br />
          {t('buyVps.byolDisclaimerLine2')}
        </span>
      </label>
    </div>
  )
}
