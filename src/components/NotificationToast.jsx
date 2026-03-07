import React, { useState, useEffect } from 'react'
import { X, Bell, Sparkles, ChefHat, TrendingUp } from 'lucide-react'
import '../styles/animations.css'

export default function NotificationToast({ notification, onClose, isVisible }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setMounted(true)
      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new-menu':
        return <ChefHat className="text-primary" size={24} />
      case 'promotion':
        return <TrendingUp className="text-accent" size={24} />
      default:
        return <Bell className="text-primary" size={24} />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new-menu':
        return 'bg-gradient-to-r from-primary to-secondary'
      case 'promotion':
        return 'bg-gradient-to-r from-accent to-yellow-500'
      default:
        return 'bg-gradient-to-r from-primary to-secondary'
    }
  }

  return (
    <div className={`fixed top-20 right-4 z-50 transform transition-all duration-500 ${
      mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm border border-gray-100">
        {/* Header */}
        <div className={`${getNotificationColor(notification.type)} p-4 text-white relative`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                {getNotificationIcon(notification.type)}
              </div>
              <div>
                <h4 className="font-bold text-lg">{notification.title}</h4>
                <p className="text-white/90 text-sm">Il y a {notification.time}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Animated Sparkle */}
          <div className="absolute top-2 right-2 animate-spin-slow">
            <Sparkles size={16} className="text-white/60" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 mb-3">{notification.message}</p>
          
          {notification.image && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img 
                src={notification.image} 
                alt={notification.title}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {notification.actionUrl && (
              <a
                href={notification.actionUrl}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-center font-semibold hover:bg-primary/90 transition-colors"
              >
                {notification.actionText || 'Voir'}
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary animate-progress-bar"
            style={{ animationDuration: '8s' }}
          ></div>
        </div>
      </div>
    </div>
  )
}
