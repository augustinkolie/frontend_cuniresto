import Navbar from './Navbar'
import Footer from './Footer'

import { useLocation } from 'react-router-dom'

export default function Layout({ children, hideFooter = false }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      <main className={`flex-grow ${isHome ? '' : 'pt-16 md:pt-20'}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}


