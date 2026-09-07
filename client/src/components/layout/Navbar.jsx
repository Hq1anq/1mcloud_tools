import { useState, useEffect, useRef } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from '../../i18n'
import { CircleDollarIcon, ServerIcon, EarthIcon } from '../../assets/icons'
import UserMenu from './UserMenu'
import ThemeToggle from '../ui/ThemeToggle'
import LanguageToggle from '../ui/LanguageToggle'
import useAuthStore from '../../store/useAuthStore'
import useProfileStore from '../../store/useProfileStore'

export default function Navbar() {
  const t = useTranslation()
  const { isAuthenticated, user } = useAuthStore()
  const { balance, fetchBalance } = useProfileStore()
  const username = user?.username || user?.email || 'User'
  const linkBase =
    'text-text-primary py-2 px-3 rounded-sm md:p-0 flex items-center whitespace-nowrap'
  const active = 'bg-wrapper md:bg-transparent md:text-primary font-semibold'
  const inactive = 'md:hover:text-primary hover:bg-bg-hover md:hover:bg-transparent'

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isPriceOpen, setIsPriceOpen] = useState(false)

  const menuRef = useRef(null)
  const priceRef = useRef(null)
  const priceTimeoutRef = useRef(null)

  // Fetch balance once on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) fetchBalance()
  }, [isAuthenticated, fetchBalance])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
      if (priceRef.current && !priceRef.current.contains(e.target)) {
        setIsPriceOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handlePriceMouseEnter = () => {
    if (priceTimeoutRef.current) clearTimeout(priceTimeoutRef.current)
    setIsPriceOpen(true)
  }

  const handlePriceMouseLeave = () => {
    priceTimeoutRef.current = setTimeout(() => {
      setIsPriceOpen(false)
    }, 150)
  }

  const togglePrice = (e) => {
    e?.stopPropagation()
    setIsPriceOpen((prev) => !prev)
  }

  const navLinkClass = ({ isActive }) => `${linkBase} ${isActive ? active : inactive}`

  const MenuButton = (
    <button
      id="menu-toggle"
      type="button"
      className="hover:bg-bg-hover text-text-muted inline-flex size-10 items-center justify-center rounded-lg p-2 md:hidden"
      onClick={toggleMenu}
    >
      <svg className="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M1 1h15M1 7h15M1 13h15"
        />
      </svg>
    </button>
  )

  const Logo = (
    <Link to="/" className="flex items-center space-x-4">
      <svg
        id="1mcloud-icon"
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2.5 h-12.5 w-12.5"
      >
        <path
          fill="var(--logo-ring)"
          d="M512,95A417.14,417.14,0,0,1,674.29,896.27,417.14,417.14,0,0,1,349.71,127.73,414.29,414.29,0,0,1,512,95m0-95C229.23,0,0,229.23,0,512s229.23,512,512,512,512-229.23,512-512S794.77,0,512,0Z"
        />
        <polygon
          fill="var(--logo-inner)"
          points="278.19 279.12 204.29 369.27 204.29 416.09 254.9 416.09 254.9 745.08 362.99 745.08 362.99 279.12 278.19 279.12"
        />
        <path
          fill="var(--logo-inner)"
          d="M819.7,443.62c-.9-90.84-75.12-164.24-166.74-164.69a166,166,0,0,0-115.89,47.65,175.87,175.87,0,0,0-119.31-47.64l-1.06,0a116.39,116.39,0,0,0-34.61,5.28V397.11h0a52.2,52.2,0,0,1,38-16.73,64.38,64.38,0,0,1,16.37,2.31A62.84,62.84,0,0,1,469,404.09l.16.2a52.23,52.23,0,0,1,10.93,32.34V745H588.19V442.25a58,58,0,0,1,12.92-36.44,64.34,64.34,0,0,1,99.42,0l.16.19a51.38,51.38,0,0,1,10.94,32V745H819.71V443.62Z"
        />
      </svg>
      <h1 className="font-bold">1MCLOUD</h1>
    </Link>
  )

  return (
    <nav
      className={`bg-navbar border-b-card-border z-50 flex items-center gap-1 border-b-2 px-3 py-1 shadow-md select-none md:px-5 md:py-3 ${isAuthenticated ? 'flex-row flex-wrap' : 'flex-col md:flex-row'}`}
    >
      {isAuthenticated ? (
        <>
          <div className="flex grow items-center justify-between md:w-auto md:grow-0">
            {Logo}
            {MenuButton}
          </div>
          <div className="mx-auto flex items-center gap-3 md:order-2 md:mx-0 md:ml-auto">
            {/* Balance + Username pill */}
            <div
              className="border-border bg-surface relative flex items-center gap-1 rounded-lg border p-1 text-base shadow-sm"
              ref={menuRef}
            >
              {/* Balance */}
              <div className="text-green px-3 py-1 font-mono font-semibold whitespace-nowrap">
                {balance != null ? balance + ' VND' : '--'}
              </div>
              <div className="bg-border h-6 w-px" />
              {/* Username trigger */}
              <button
                onClick={() => setIsUserMenuOpen((o) => !o)}
                className="hover:bg-bg-hover flex items-center gap-1.5 rounded-md px-3 py-1 transition-colors focus:outline-none"
              >
                <span className="text-text-primary font-bold">{username}</span>
                <svg
                  className={`text-text-muted size-3 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="5 5 10 10"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <UserMenu isOpen={isUserMenuOpen} setIsOpen={setIsUserMenuOpen} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Row 1: Logo + Login button (mobile) */}
          <div className="flex w-full items-center justify-between md:w-auto md:flex-none">
            {Logo}
            <div className="flex items-center gap-3 md:hidden">
              <Link
                to="/login"
                className="w-28 rounded-lg bg-blue-600 px-4 py-2 text-center font-medium whitespace-nowrap text-white shadow-sm hover:bg-blue-700"
              >
                {t('menu.login')}
              </Link>
            </div>
          </div>

          {/* Row 2 (mobile only): Menu button left, toggles right */}
          <div className="flex w-full items-center justify-between md:hidden">
            {MenuButton}
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Desktop: all controls on one line */}
          <div className="hidden items-center gap-4 md:order-2 md:flex">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              to="/login"
              className="w-32 rounded-lg bg-blue-600 px-4 py-2 text-center font-medium whitespace-nowrap text-white shadow-sm hover:bg-blue-700"
            >
              {t('menu.login')}
            </Link>
          </div>
        </>
      )}

      {/* Menu Items */}
      <ul
        className={`bg-surface flex w-full flex-col justify-end rounded-lg font-medium transition-all md:mr-4 md:ml-6 md:max-h-none md:w-auto md:flex-1 md:flex-row md:items-center md:space-x-6 md:overflow-visible md:bg-transparent ${isMenuOpen ? 'mt-4 max-h-125 overflow-hidden p-4' : 'max-h-0 overflow-hidden md:max-h-none'}`}
      >
        <li>
          <NavLink to="/" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-2 size-7 shrink-0 fill-current"
            >
              <path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z" />
            </svg>
            {t('nav.home')}
          </NavLink>
        </li>

        {/* Mobile Direct NavLinks */}
        <li className="md:hidden">
          <NavLink to="/price/vps" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            <ServerIcon className="mr-2 size-7 shrink-0 fill-current" />
            {t('nav.vpsPrice')}
          </NavLink>
        </li>
        <li className="md:hidden">
          <NavLink to="/price/proxy" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            <EarthIcon className="mr-2 size-7 shrink-0 fill-current" />
            {t('nav.proxyPrice')}
          </NavLink>
        </li>

        {/* Desktop Pricing Dropdown */}
        <li
          ref={priceRef}
          className="relative hidden md:block"
          onMouseEnter={handlePriceMouseEnter}
          onMouseLeave={handlePriceMouseLeave}
        >
          <NavLink
            to="/price"
            onClick={(e) => {
              e.preventDefault()
              togglePrice(e)
            }}
            className={navLinkClass}
            aria-expanded={isPriceOpen}
          >
            <CircleDollarIcon className="mr-2 size-6" />
            <span>{t('nav.price')}</span>
            <svg
              viewBox="0 0 20 20"
              className={`text-text-muted ml-0.5 size-4 transition-transform duration-300 ${
                isPriceOpen ? 'text-primary rotate-180' : ''
              }`}
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </NavLink>

          {/* Desktop Floating Dropdown Menu */}
          <div
            className={`bg-surface absolute top-full left-0 mt-1 hidden origin-top-left flex-col rounded-xl p-1 whitespace-nowrap shadow-xl backdrop-blur-xl transition-all duration-200 md:flex ${
              isPriceOpen
                ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none -translate-y-2 scale-95 opacity-0'
            }`}
          >
            <NavLink
              to="/price/vps"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-wrapper/40 text-primary font-semibold'
                    : 'text-text-primary hover:bg-bg-hover hover:text-primary'
                }`
              }
              onClick={() => {
                setIsPriceOpen(false)
                setIsMenuOpen(false)
              }}
            >
              {t('nav.vpsPrice')}
            </NavLink>

            <NavLink
              to="/price/proxy"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-wrapper/40 text-primary font-semibold'
                    : 'text-text-primary hover:bg-bg-hover hover:text-primary'
                }`
              }
              onClick={() => {
                setIsPriceOpen(false)
                setIsMenuOpen(false)
              }}
            >
              {t('nav.proxyPrice')}
            </NavLink>
          </div>
        </li>

        <li>
          <NavLink to="/proxyChecker" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-2 size-7 shrink-0 fill-current"
            >
              <path d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM438 209.7C427.3 201.9 412.3 204.3 404.5 215L285.1 379.2L233 327.1C223.6 317.7 208.4 317.7 199.1 327.1C189.8 336.5 189.7 351.7 199.1 361L271.1 433C276.1 438 282.9 440.5 289.9 440C296.9 439.5 303.3 435.9 307.4 430.2L443.3 243.2C451.1 232.5 448.7 217.5 438 209.7z" />
            </svg>
            {t('nav.proxyChecker')}
          </NavLink>
        </li>
        <li>
          <NavLink to="/manager" className={navLinkClass} onClick={() => setIsMenuOpen(false)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
              className="mr-2 size-7 shrink-0 fill-current"
            >
              <path d="M380.8 96C372.7 110.1 368 126.5 368 144L368 160L96 160L96 384L368 384L368 448L96 448C60.7 448 32 419.3 32 384L32 160C32 124.7 60.7 96 96 96L380.8 96zM368 496C368 513.5 372.7 529.9 380.8 544L152 544C138.7 544 128 533.3 128 520C128 506.7 138.7 496 152 496L368 496zM464 96L560 96C586.5 96 608 117.5 608 144L608 496C608 522.5 586.5 544 560 544L464 544C437.5 544 416 522.5 416 496L416 144C416 117.5 437.5 96 464 96zM488 160C474.7 160 464 170.7 464 184C464 197.3 474.7 208 488 208L536 208C549.3 208 560 197.3 560 184C560 170.7 549.3 160 536 160L488 160zM488 256C474.7 256 464 266.7 464 280C464 293.3 474.7 304 488 304L536 304C549.3 304 560 293.3 560 280C560 266.7 549.3 256 536 256L488 256zM544 400C544 382.3 529.7 368 512 368C494.3 368 480 382.3 480 400C480 417.7 494.3 432 512 432C529.7 432 544 417.7 544 400z" />
            </svg>
            {t('nav.manager')}
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
