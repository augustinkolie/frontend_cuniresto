import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, User, LogOut, Heart, Bell, Moon, Sun, MessageSquare, LayoutDashboard, ChevronDown, Home, UtensilsCrossed, Package, Mail, Gift, Building2, Users, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'
import { useFavorite } from '../context/FavoriteContext'
import { useTheme } from '../context/ThemeContext'
import { api, getFullImageUrl } from '../utils/api'
import NotificationPanel from './NotificationPanel'
import FavoritePanel from './FavoritePanel'
import Logo from './Logo'
import '../styles/navbar-mobile.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [favoritePanelOpen, setFavoritePanelOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const userMenuRef = useRef(null)
  const navRef = useRef(null)
  const { user, logout } = useAuth()
  const { getTotalItems } = useCart()
  const { getUnreadCount } = useNotification()
  const { getFavoriteCount } = useFavorite()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const unreadNotifications = getUnreadCount()
  const favoriteCount = getFavoriteCount()

  // Éviter le flou blanc initial en attendant que le contenu soit chargé
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 500) // Délai pour laisser le carousel charger

    return () => clearTimeout(timer)
  }, [])

  // Charger le nombre de messages non lus
  useEffect(() => {
    if (user) {
      const loadUnreadMessagesCount = async () => {
        try {
          const response = await api.getConversations()
          if (response && response.success && response.conversations) {
            const totalUnread = response.conversations.reduce((sum, conv) => {
              return sum + (conv.unreadCount || 0)
            }, 0)
            setUnreadMessagesCount(totalUnread)
          }
        } catch (error) {
          console.error('Erreur chargement messages non lus:', error)
        }
      }

      loadUnreadMessagesCount()

      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(loadUnreadMessagesCount, 30000)
      return () => clearInterval(interval)
    } else {
      setUnreadMessagesCount(0)
    }
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      const threshold = window.innerWidth < 768 ? 140 : 25
      if (window.scrollY > threshold) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer le menu utilisateur quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  // Fermer le menu mobile en cliquant hors de la navbar
  useEffect(() => {
    const handleClickOutsideMobile = (event) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutsideMobile)
      document.addEventListener('touchstart', handleClickOutsideMobile)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMobile)
      document.removeEventListener('touchstart', handleClickOutsideMobile)
    }
  }, [isOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const toggleNotificationPanel = () => {
    setNotificationPanelOpen(!notificationPanelOpen)
  }

  const toggleFavoritePanel = () => {
    setFavoritePanelOpen(!favoritePanelOpen)
  }

  // Fonction pour obtenir l'initiale de l'utilisateur
  const getUserInitial = () => {
    if (user?.prenom) {
      return user.prenom.charAt(0).toUpperCase()
    } else if (user?.nom) {
      return user.nom.charAt(0).toUpperCase()
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  // Fonction pour vérifier si un lien est actif
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      ref={navRef}
      className={`${isHome && !scrolled
        ? 'bg-transparent'
        : 'bg-white shadow-md dark:bg-gray-900 dark:shadow-lg'
        } fixed top-0 z-50 transition-all duration-300 ease-in-out w-full`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 md:py-3 min-h-[4rem] md:min-h-[5rem]">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative flex items-center justify-center">
              <Logo 
                className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" 
                color={isHome && !scrolled ? "#ffffff" : "#10b981"} 
              />
            </div>
            <span className={`text-2xl font-bold tracking-tight ${isHome && !scrolled ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              Cuni<span className="text-primary">Resto</span>
            </span>
          </Link>

          {/* Desktop Menu - Icônes au-dessus du texte avec indicateur actif */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              to="/"
              className={`relative flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-300 ${isActive('/')
                ? 'text-blue-600 dark:text-blue-400'
                : isHome && !scrolled
                  ? 'text-white hover:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
            >
              <Home size={22} className={isActive('/') ? 'text-blue-600 dark:text-blue-400' : ''} />
              <span className="text-sm font-medium">Accueil</span>
              {isActive('/') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/menu"
              className={`relative flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-300 ${isActive('/menu')
                ? 'text-orange-600 dark:text-orange-400'
                : isHome && !scrolled
                  ? 'text-white hover:text-orange-300'
                  : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
                }`}
            >
              <UtensilsCrossed size={22} className={isActive('/menu') ? 'text-orange-600 dark:text-orange-400' : ''} />
              <span className="text-sm font-medium">Menu</span>
              {isActive('/menu') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/products"
              className={`relative flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-300 ${isActive('/products')
                ? 'text-green-600 dark:text-green-400'
                : isHome && !scrolled
                  ? 'text-white hover:text-green-300'
                  : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'
                }`}
            >
              <Package size={22} className={isActive('/products') ? 'text-green-600 dark:text-green-400' : ''} />
              <span className="text-sm font-medium">Produits</span>
              {isActive('/products') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-600 dark:bg-green-400 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/about"
              className={`relative flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-300 ${isActive('/about')
                ? 'text-primary'
                : isHome && !scrolled
                  ? 'text-white hover:text-primary/70'
                  : 'text-gray-700 dark:text-gray-300 hover:text-primary'
                }`}
            >
              <Users size={22} className={isActive('/about') ? 'text-primary' : ''} />
              <span className="text-sm font-medium">À Propos</span>
              {isActive('/about') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>
              )}
            </Link>

            <Link
              to="/contact"
              className={`relative flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-300 ${isActive('/contact')
                ? 'text-purple-600 dark:text-purple-400'
                : isHome && !scrolled
                  ? 'text-white hover:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
            >
              <Mail size={22} className={isActive('/contact') ? 'text-purple-600 dark:text-purple-400' : ''} />
              <span className="text-sm font-medium">Contact</span>
              {isActive('/contact') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full"></span>
              )}
            </Link>

            <Link
              to="/academy"
              className={`relative flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-all duration-300 ${isActive('/academy')
                ? 'text-red-600 dark:text-red-400'
                : isHome && !scrolled
                  ? 'text-white hover:text-red-300'
                  : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
                }`}
            >
              <BookOpen size={22} className={isActive('/academy') ? 'text-red-600 dark:text-red-400' : ''} />
              <span className="text-sm font-medium">Formation</span>
              {isActive('/academy') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 dark:bg-red-400 rounded-full"></span>
              )}
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`relative group p-2.5 rounded-xl transition-all duration-300 ${isHome && !scrolled
                ? 'text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20 hover:shadow-md hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/30'
                }`}
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              <div className="relative z-10">
                {darkMode ? (
                  <Sun size={26} className={`transition-transform group-hover:rotate-180 duration-500 ${isHome && !scrolled ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`} />
                ) : (
                  <Moon size={26} className={`transition-transform group-hover:-rotate-12 duration-300 ${isHome && !scrolled ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`} />
                )}
              </div>
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isHome && !scrolled ? 'bg-gradient-to-br from-white/20 to-white/5' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800'
                }`}></div>
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className={`relative group p-2.5 rounded-xl transition-all duration-300 ${isHome && !scrolled
                ? 'text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50'
                }`}
              title="Panier"
              data-cart-icon
            >
              <ShoppingCart size={26} className={`relative z-10 transition-transform group-hover:scale-110 duration-300 ${isHome && !scrolled ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-red-500/50 ring-2 ring-white dark:ring-gray-900 animate-pulse z-20">
                  {getTotalItems()}
                </span>
              )}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isHome && !scrolled ? 'bg-gradient-to-br from-white/20 to-white/5' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800'
                } z-0`}></div>
            </Link>

            {/* Admin Link - Si admin */}
            {user && user.role === 'admin' && (
              <Link
                to="/admin"
                className={`relative group hidden md:block p-2.5 rounded-xl transition-all duration-300 ${isHome && !scrolled
                  ? 'text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/20'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 dark:hover:from-purple-900/20 dark:hover:to-violet-900/20 hover:shadow-md hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30'
                  }`}
                title="Administration"
              >
                <LayoutDashboard size={26} className="relative z-10 transition-transform group-hover:scale-110 duration-300 text-purple-600 dark:text-purple-400" />
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isHome && !scrolled ? 'bg-gradient-to-br from-white/20 to-white/5' : 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
                  }`}></div>
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`group flex items-center space-x-2.5 px-3.5 py-2 rounded-xl transition-all duration-300 ${isHome && !scrolled
                    ? 'text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50'
                    }`}
                >
                  {/* Avatar avec initiale */}
                  <div className={`relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ring-2 transition-all duration-300 ${isHome && !scrolled
                    ? 'bg-gradient-to-br from-white/40 to-white/20 ring-white/40 group-hover:ring-white/60 shadow-lg shadow-white/20'
                    : 'bg-gradient-to-br from-primary via-orange-500 to-accent ring-primary/40 dark:ring-primary/50 group-hover:ring-primary/60 dark:group-hover:ring-primary/70 shadow-lg shadow-primary/30 dark:shadow-primary/20'
                    }`}>
                    {user.profileImage ? (
                      <img
                        src={getFullImageUrl(user.profileImage)}
                        alt={`${user.prenom} ${user.nom}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`text-lg font-bold ${isHome && !scrolled
                        ? 'text-white'
                        : 'text-white dark:text-white'
                        }`}>
                        {getUserInitial()}
                      </span>
                    )}
                    <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isHome && !scrolled ? 'bg-white/20' : 'bg-white/10 dark:bg-white/5'
                      }`}></div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transition-all duration-300 ${userMenuOpen ? 'rotate-180' : ''} group-hover:scale-110 ${isHome && !scrolled ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}
                  />
                </button>

                {/* Menu déroulant */}
                {userMenuOpen && (
                  <div className={`absolute right-0 mt-3 w-56 rounded-xl shadow-2xl border z-50 overflow-hidden backdrop-blur-xl ${isHome && !scrolled
                    ? 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/30 dark:border-gray-700/50 shadow-white/20 dark:shadow-black/20'
                    : 'bg-white/95 dark:bg-gray-800/95 border-gray-200/50 dark:border-gray-700/50 shadow-gray-900/10 dark:shadow-gray-900/30'
                    }`}>
                    <div className="py-1.5">
                      {/* Profil */}
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className={`group flex items-center space-x-3 px-4 py-2.5 mx-1.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 ${isHome && !scrolled ? 'text-gray-800 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <User size={18} className="text-primary" />
                        </div>
                        <span className="font-medium">Profil</span>
                      </Link>

                      {/* Fidélité */}
                      <Link
                        to="/loyalty"
                        onClick={() => setUserMenuOpen(false)}
                        className={`group flex items-center space-x-3 px-4 py-2.5 mx-1.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 ${isHome && !scrolled ? 'text-gray-800 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Gift size={18} className="text-primary" />
                        </div>
                        <span className="font-medium">Fidélité</span>
                      </Link>

                      {/* Messages */}
                      <Link
                        to="/messages"
                        onClick={() => setUserMenuOpen(false)}
                        className={`group flex items-center space-x-3 px-4 py-2.5 mx-1.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 relative ${isHome && !scrolled ? 'text-gray-800 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                          <MessageSquare size={18} className="text-blue-500" />
                        </div>
                        <span className="font-medium">Messages</span>
                        {unreadMessagesCount > 0 && (
                          <span className="ml-auto bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md shadow-blue-500/30">
                            {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                          </span>
                        )}
                      </Link>

                      {/* Favoris */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          toggleFavoritePanel()
                        }}
                        className={`group w-full flex items-center space-x-3 px-4 py-2.5 mx-1.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 relative ${isHome && !scrolled ? 'text-gray-800 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        <div className="p-1.5 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                          <Heart size={18} className="text-pink-500" />
                        </div>
                        <span className="font-medium">Favoris</span>
                        {favoriteCount > 0 && (
                          <span className="ml-auto bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md shadow-pink-500/30">
                            {favoriteCount}
                          </span>
                        )}
                      </button>

                      {/* Espace Entreprise */}
                      <Link
                        to="/corporate"
                        onClick={() => setUserMenuOpen(false)}
                        className={`group flex items-center space-x-3 px-4 py-2.5 mx-1.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 ${isHome && !scrolled ? 'text-gray-800 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                          <Building2 size={18} className="text-blue-500" />
                        </div>
                        <span className="font-medium">Espace Entreprise</span>
                      </Link>

                      {/* Notifications */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          toggleNotificationPanel()
                        }}
                        className={`group w-full flex items-center space-x-3 px-4 py-2.5 mx-1.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 relative ${isHome && !scrolled ? 'text-gray-800 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        <div className="p-1.5 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                          <Bell size={18} className="text-accent" />
                        </div>
                        <span className="font-medium">Notifications</span>
                        {unreadNotifications > 0 && (
                          <span className="ml-auto bg-gradient-to-br from-accent to-accent/80 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md shadow-accent/30">
                            {unreadNotifications}
                          </span>
                        )}
                      </button>

                      {/* Séparateur */}
                      <div className="my-1.5 mx-2 border-t border-gray-200/50 dark:border-gray-700/50"></div>

                      {/* Déconnexion */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          handleLogout()
                        }}
                        className={`group w-full flex items-center space-x-3 px-4 py-2.5 mx-1.5 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20 transition-all duration-200 text-red-600 dark:text-red-400`}
                      >
                        <div className="p-1.5 rounded-lg bg-red-100/50 dark:bg-red-900/30 group-hover:bg-red-200/50 dark:group-hover:bg-red-800/40 transition-colors">
                          <LogOut size={18} className="text-red-600 dark:text-red-400" />
                        </div>
                        <span className="font-medium">Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg transition ${isHome && !scrolled
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                <User size={24} />
              </Link>
            )}

            {/* Mobile Profile Toggle (replaces hamburger) */}
            <div className="md:hidden">
              {user ? (
                <button
                  onClick={toggleMenu}
                  aria-label="Ouvrir le menu profil"
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${isHome && !scrolled
                    ? 'border-white/60 bg-white/10 hover:bg-white/20'
                    : 'border-primary/40 bg-white dark:bg-gray-800 hover:border-primary/70 shadow-sm dark:shadow-none'
                    } ${isOpen ? 'ring-2 ring-primary/50' : ''}`}
                >
                  {user.profileImage ? (
                    <img
                      src={getFullImageUrl(user.profileImage)}
                      alt={`${user.prenom} ${user.nom}`}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span
                      className={`text-lg font-bold ${isHome && !scrolled ? 'text-white' : 'text-primary dark:text-white'
                        }`}
                    >
                      {getUserInitial()}
                    </span>
                  )}
                  {isOpen && <div className="absolute inset-0 rounded-full border border-primary/60 shadow-inner" />}
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  aria-label="Connexion"
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${isHome && !scrolled
                    ? 'text-white border border-white/50 hover:bg-white/10'
                    : 'text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <User size={22} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={`md:hidden pb-4 space-y-2 ${isHome && !scrolled ? 'bg-black/50 backdrop-blur' : 'bg-white dark:bg-gray-800'}`}>
            {user ? (
              <>
                {/* Info utilisateur */}
                <div className={`flex items-center space-x-3 px-4 py-3 border-b ${isHome && !scrolled ? 'border-white/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ring-2 ${isHome && !scrolled
                    ? 'bg-gradient-to-br from-white/40 to-white/20 ring-white/40'
                    : 'bg-gradient-to-br from-primary via-orange-500 to-accent ring-primary/40 dark:ring-primary/50 shadow-lg shadow-primary/30'
                    }`}>
                    {user.profileImage ? (
                      <img
                        src={getFullImageUrl(user.profileImage)}
                        alt={`${user.prenom} ${user.nom}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`text-xl font-bold ${isHome && !scrolled
                        ? 'text-white'
                        : 'text-white dark:text-white'
                        }`}>
                        {getUserInitial()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${isHome && !scrolled ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {user.prenom} {user.nom}
                    </p>
                    <p className={`text-sm ${isHome && !scrolled ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {user.email}
                    </p>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className={`flex items-center space-x-2 px-4 py-2 ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} rounded`}
                  onClick={() => setIsOpen(false)}
                >
                  <User size={20} />
                  <span>Profil</span>
                </Link>
                <Link
                  to="/loyalty"
                  className={`flex items-center space-x-2 px-4 py-2 ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} rounded`}
                  onClick={() => setIsOpen(false)}
                >
                  <Gift size={20} />
                  <span>Fidélité</span>
                </Link>
                <Link
                  to="/messages"
                  className={`flex items-center space-x-2 px-4 py-2 relative ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} rounded`}
                  onClick={() => setIsOpen(false)}
                >
                  <MessageSquare size={20} />
                  <span>Messages</span>
                  {unreadMessagesCount > 0 && (
                    <span className="ml-auto bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md shadow-blue-500/50">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    toggleFavoritePanel()
                  }}
                  className={`w-full text-left flex items-center space-x-2 px-4 py-2 relative ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} rounded`}
                >
                  <Heart size={20} />
                  <span>Favoris</span>
                  {favoriteCount > 0 && (
                    <span className="ml-auto bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md shadow-pink-500/30">
                      {favoriteCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    toggleNotificationPanel()
                  }}
                  className={`w-full text-left flex items-center space-x-2 px-4 py-2 relative ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} rounded`}
                >
                  <Bell size={20} />
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="ml-auto bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-2 px-4 py-2 ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20'} rounded transition-colors`}
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard size={20} />
                    <span className="font-bold">Administration</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    handleLogout()
                  }}
                  className={`w-full text-left px-4 py-2 ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} rounded`}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`flex items-center space-x-2 px-4 py-2 ${isHome && !scrolled ? 'text-white hover:text-accent' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'} rounded`}
                onClick={() => setIsOpen(false)}
              >
                <User size={20} />
                <span>Connexion</span>
              </Link>
            )}
          </div>
        )}

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={notificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
        />

        {/* Favorite Panel */}
        <FavoritePanel
          isOpen={favoritePanelOpen}
          onClose={() => setFavoritePanelOpen(false)}
        />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Accueil */}
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 flex-1 ${isActive('/')
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Home size={22} className={isActive('/') ? 'text-blue-600 dark:text-blue-400' : ''} />
            <span className="text-xs font-medium">Accueil</span>
            {isActive('/') && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full"></span>
            )}
          </Link>

          {/* Menu */}
          <Link
            to="/menu"
            onClick={() => setIsOpen(false)}
            className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 flex-1 relative ${isActive('/menu')
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <UtensilsCrossed size={22} className={isActive('/menu') ? 'text-orange-600 dark:text-orange-400' : ''} />
            <span className="text-xs font-medium">Menu</span>
            {isActive('/menu') && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-600 dark:bg-orange-400 rounded-t-full"></span>
            )}
          </Link>

          {/* Produits */}
          <Link
            to="/products"
            onClick={() => setIsOpen(false)}
            className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 flex-1 relative ${isActive('/products')
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Package size={22} className={isActive('/products') ? 'text-green-600 dark:text-green-400' : ''} />
            <span className="text-xs font-medium">Produits</span>
            {isActive('/products') && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-green-600 dark:text-green-400 rounded-t-full"></span>
            )}
          </Link>

          {/* Contact */}
          <Link
            to="/contact"
            onClick={() => setIsOpen(false)}
            className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 flex-1 relative ${isActive('/contact')
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Mail size={22} className={isActive('/contact') ? 'text-purple-600 dark:text-purple-400' : ''} />
            <span className="text-xs font-medium">Contact</span>
            {isActive('/contact') && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-600 dark:bg-purple-400 rounded-t-full"></span>
            )}
          </Link>

          {/* À Propos */}
          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 flex-1 relative ${isActive('/about')
              ? 'text-primary'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Users size={22} className={isActive('/about') ? 'text-primary' : ''} />
            <span className="text-xs font-medium">À Propos</span>
            {isActive('/about') && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"></span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
