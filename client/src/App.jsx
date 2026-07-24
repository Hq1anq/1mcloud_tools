import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ToastProvider } from './context/ToastContext.jsx'
import { SafeCopyProvider } from './context/SafeCopyContext.jsx'
import { ConfirmProvider } from './context/ConfirmContext.jsx'
import { PopConfirmProvider } from './context/PopConfirmContext.jsx'
import { PopMenuProvider } from './context/PopMenuContext.jsx'
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'
import ScrollToTop from './components/layout/ScrollToTop.jsx'
import useAuthStore from './store/useAuthStore'
import Home from './pages/Home.jsx'
import ManagerPage from './pages/ManagerPage.jsx'
import ProxyChecker from './pages/ProxyChecker.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage'
import VerifyUserPage from './pages/VerifyUserPage'
import Contact from './pages/Contact.jsx'
import AccountPage from './pages/AccountPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LicensePage from './pages/LicensePage.jsx'
import VpsPrice from './pages/VpsPrice.jsx'
import BuyVpsPage from './pages/BuyVpsPage.jsx'
import ProxyPrice from './pages/ProxyPrice.jsx'
import BuyProxyPage from './pages/BuyProxyPage.jsx'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import { AppProvider } from './context/AppProvider'

function App() {
  const { checkAuth, isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <AppProvider>
      <div className="bg-body text-text-secondary flex h-full flex-col overflow-hidden font-sans text-base sm:text-lg">
        <BrowserRouter>
          <ScrollToTop />
          <Navbar />
          <div
            id="main-scroll-container"
            className="scroll-container w-full flex-1 overflow-y-auto"
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/account"
                element={isAuthenticated ? <AccountPage /> : <Navigate to="/login" replace />}
              />

              <Route
                path="/manager"
                element={
                  isAuthenticated ? (
                    <ToastProvider>
                      <SafeCopyProvider>
                        <ConfirmProvider>
                          <PopConfirmProvider>
                            <PopMenuProvider>
                              <ManagerPage />
                            </PopMenuProvider>
                          </PopConfirmProvider>
                        </ConfirmProvider>
                      </SafeCopyProvider>
                    </ToastProvider>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="/proxyManager" element={<Navigate to="/manager" replace />} />
              <Route path="/vpsManager" element={<Navigate to="/manager" replace />} />

              <Route
                path="/proxyChecker"
                element={
                  <ToastProvider>
                    <SafeCopyProvider>
                      <ProxyChecker />
                    </SafeCopyProvider>
                  </ToastProvider>
                }
              />

              <Route
                path="/history"
                element={
                  <ToastProvider>
                    <SafeCopyProvider>
                      <HistoryPage />
                    </SafeCopyProvider>
                  </ToastProvider>
                }
              />

              <Route
                path="/licenses"
                element={
                  isAuthenticated ? (
                    <ToastProvider>
                      <SafeCopyProvider>
                        <ConfirmProvider>
                          <PopConfirmProvider>
                            <LicensePage />
                          </PopConfirmProvider>
                        </ConfirmProvider>
                      </SafeCopyProvider>
                    </ToastProvider>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route path="/price" element={<Navigate to="/price/vps" replace />} />
              <Route path="/price/vps" element={<VpsPrice />} />
              <Route
                path="/price/vps/buy"
                element={
                  isAuthenticated ? (
                    <ToastProvider>
                      <SafeCopyProvider>
                        <BuyVpsPage />
                      </SafeCopyProvider>
                    </ToastProvider>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="/price/proxy" element={<ProxyPrice />} />
              <Route
                path="/price/proxy/buy"
                element={
                  isAuthenticated ? (
                    <ToastProvider>
                      <SafeCopyProvider>
                        <BuyProxyPage />
                      </SafeCopyProvider>
                    </ToastProvider>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
              />

              <Route
                path="/signup"
                element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
              />

              <Route
                path="/verify-user"
                element={
                  !isAuthenticated ? (
                    <Navigate to="/login" replace />
                  ) : user?.is_verified ? (
                    <Navigate to="/manager" replace />
                  ) : (
                    <VerifyUserPage />
                  )
                }
              />

              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </div>
    </AppProvider>
  )
}

export default App
