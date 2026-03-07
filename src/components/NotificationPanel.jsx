import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { X, Bell, ChefHat, TrendingUp, Clock, Check, Trash2 } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'
import '../styles/animations.css'

export default function NotificationPanel({ isOpen, onClose }) {
  const { notifications, userNotifications, markAsRead, clearAllNotifications, getUnreadCount } = useNotification()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // Mark all as read when panel opens
      notifications.forEach(notification => {
        if (!notification.read) {
          markAsRead(notification.id)
        }
      })
      // Prevent scrolling when panel is open
      document.body.style.overflow = 'hidden'
    } else {
      setTimeout(() => setMounted(false), 300)
      // Restore scrolling
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, notifications, markAsRead])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new-menu':
        return <ChefHat className="text-primary" size={20} />
      case 'promotion':
        return <TrendingUp className="text-accent" size={20} />
      default:
        return <Bell className="text-gray-500" size={20} />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new-menu':
        return 'bg-primary/10 text-primary'
      case 'promotion':
        return 'bg-accent/10 text-accent'
      default:
        return 'bg-gray-100 text-gray-500'
    }
  }

  const formatTime = (time) => {
    if (time === 'quelques instants') return 'À l\'instant'
    return time
  }

  // Merge and sort notifications
  const allNotifications = [
    ...notifications.map(n => ({ ...n, source: 'marketing' })),
    ...userNotifications.map(n => ({
      ...n,
      id: n.id,
      title: n.type === 'reply' ? 'Nouvelle réponse' : 'Notification',
      message: n.content,
      time: n.createdAt,
      source: 'user',
      actionUrl: n.link
    }))
  ].sort((a, b) => new Date(b.createdAt || b.time) - new Date(a.createdAt || b.time))

  if (!isOpen && !mounted) return null

  const handleNotificationClick = (notification) => {
    if (notification.source === 'user' && !notification.read) {
      markAsRead(notification.id)
    }

    if (notification.actionUrl) {
      onClose()
      navigate(notification.actionUrl)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${mounted && isOpen ? 'opacity-100' : 'opacity-0'
        }`} onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md sm:top-16 sm:right-4 sm:left-auto sm:translate-x-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 ${mounted && isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
          }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Notifications</h3>
                <p className="text-white/80 text-sm">
                  {allNotifications.length > 0 ? `${allNotifications.length} notification${allNotifications.length > 1 ? 's' : ''}` : 'Aucune notification'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="text-gray-400" size={24} />
              </div>
              <p>Aucune notification</p>
              <p className="text-sm mt-1">Vous serez notifié des nouveautés ici</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {allNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                    }`}
                  style={{
                    animation: mounted ? `slide-in-right 0.3s ease-out ${index * 50}ms forwards` : 'none'
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 dark:text-white truncate">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">{notification.message}</p>

                      {notification.image && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <img
                            src={notification.image}
                            alt={notification.title}
                            className="w-full h-20 object-cover"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-xs">
                          <Clock size={12} />
                          <span>{notification.source === 'user'
                            ? new Date(notification.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            : formatTime(notification.time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Les notifications plus anciennes sont automatiquement supprimées</span>
              <button
                onClick={clearAllNotifications}
                className="text-red-500 hover:text-red-600 transition-colors font-semibold"
              >
                Tout effacer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
