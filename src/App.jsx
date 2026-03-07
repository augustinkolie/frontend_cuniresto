import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NotificationProvider } from './context/NotificationContext'
import { FavoriteProvider } from './context/FavoriteContext'
import Layout from './components/Layout'
import NotificationManager from './components/NotificationManager'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import Products from './pages/Products'
import CategoryProducts from './pages/CategoryProducts'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Login from './pages/Login'
import GoogleCallback from './pages/GoogleCallback'
import ResetPassword from './pages/ResetPassword'
import Reservation from './pages/Reservation'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './pages/Profile'
import Messages from './pages/Messages'
import Admin from './pages/Admin'
import TableMenu from './pages/TableMenu'
import Loyalty from './pages/Loyalty'
import OrderSuccess from './pages/OrderSuccess'
import OrderTracking from './pages/OrderTracking'
import Corporate from './pages/Corporate'
import Settings from './pages/Settings'
import NewGroup from './pages/NewGroup'
import PrivacySettings from './pages/PrivacySettings'
import HelpSettings from './pages/HelpSettings'
import HelpCenter from './pages/HelpCenter'
import Contact from './pages/Contact'
import ContactUs from './pages/ContactUs'
import TermsAndPrivacy from './pages/TermsAndPrivacy'
import Academy from './pages/Academy'
import Resources from './pages/Resources'
import Studio from './pages/Studio'
import NotFound from './pages/NotFound'
import { ThemeProvider } from './context/ThemeContext'
import LoadingScreen from './components/LoadingScreen'

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <FavoriteProvider>
                <div className="overflow-x-hidden">
                  <LoadingScreen />
                  <Routes>
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/menu" element={<Layout><Menu /></Layout>} />
                    <Route path="/about" element={<Layout><About /></Layout>} />
                    <Route path="/products" element={<Layout><Products /></Layout>} />
                    <Route path="/category/:category" element={<Layout><CategoryProducts /></Layout>} />
                    <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
                    <Route path="/cart" element={<Layout hideFooter><Cart /></Layout>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/google/callback" element={<GoogleCallback />} />
                    <Route path="/auth/google/success" element={<GoogleCallback />} />
                    <Route path="/reservation" element={<Layout><Reservation /></Layout>} />
                    <Route path="/contact" element={<Layout><Contact /></Layout>} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/messages" element={<Layout hideFooter><Messages /></Layout>} />
                    <Route path="/loyalty" element={<Layout><Loyalty /></Layout>} />
                    <Route path="/table/:qrCode" element={<TableMenu />} />
                    <Route path="/order-success" element={<Layout><OrderSuccess /></Layout>} />
                    <Route path="/order/:orderId/tracking" element={<Layout><OrderTracking /></Layout>} />
                    <Route path="/corporate" element={<Layout><Corporate /></Layout>} />
                    <Route path="/settings" element={<Layout hideFooter><Settings /></Layout>} />
                    <Route path="/new-group" element={<Layout hideFooter><NewGroup /></Layout>} />
                    <Route path="/settings/privacy" element={<Layout hideFooter><PrivacySettings /></Layout>} />
                    <Route path="/settings/help" element={<Layout hideFooter><HelpSettings /></Layout>} />
                    <Route path="/help-center" element={<Layout hideFooter><HelpCenter /></Layout>} />
                    <Route path="/contact-us" element={<Layout hideFooter><ContactUs /></Layout>} />
                    <Route path="/academy" element={<Layout><Academy /></Layout>} />
                    <Route path="/resources" element={<Layout><Resources /></Layout>} />
                    <Route path="/studio" element={<Layout><Studio /></Layout>} />
                    <Route path="/terms-and-privacy" element={<Layout hideFooter><TermsAndPrivacy /></Layout>} />
                    <Route path="*" element={<Layout><NotFound /></Layout>} />
                    <Route path="/reservations" element={
                      <ProtectedRoute>
                        <Reservation />
                      </ProtectedRoute>
                    } />
                  </Routes>
                  <NotificationManager />
                  <ScrollToTop />
                </div>
              </FavoriteProvider>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
    </GoogleOAuthProvider>
  )
}

export default App
