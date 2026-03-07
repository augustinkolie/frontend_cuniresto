import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([]) // Notifications marketing (local)
  const [userNotifications, setUserNotifications] = useState([]) // Notifications utilisateur (API)
  const [currentNotification, setCurrentNotification] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  // Charger les notifications depuis localStorage au montage
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications')
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(parsed)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    }
  }, [])

  // Vérifier les nouvelles notifs marketing
  useEffect(() => {
    checkForNewProducts()
    const interval = setInterval(checkForNewProducts, 120000)
    return () => clearInterval(interval)
  }, [])

  // Charger les notifications utilisateur depuis l'API
  useEffect(() => {
    if (user) {
      loadUserNotifications()
      // Polling toutes les 30 secondes pour les nouvelles réponses
      const interval = setInterval(loadUserNotifications, 30000)
      return () => clearInterval(interval)
    } else {
      setUserNotifications([])
    }
  }, [user])

  const loadUserNotifications = async () => {
    try {
      const response = await api.getNotifications()
      if (response && response.success) {
        setUserNotifications(response.notifications || [])
      }
    } catch (error) {
      console.error('Erreur chargement notifications utilisateur:', error)
    }
  }

  const checkForNewProducts = async () => {
    try {
      // Récupérer les produits depuis l'API
      const response = await api.getProducts()
      if (!response.success || !response.products) {
        return
      }

      const currentProducts = response.products

      // Récupérer les produits précédents depuis localStorage
      const previousProductsData = localStorage.getItem('previousProducts')
      const previousProducts = previousProductsData ? JSON.parse(previousProductsData) : []

      // Créer un map des produits précédents pour faciliter la comparaison
      const previousProductsMap = new Map()
      previousProducts.forEach(product => {
        const id = product.id
        if (id) {
          previousProductsMap.set(String(id), {
            id: String(id),
            name: product.name,
            price: product.price,
            image: product.image
          })
        }
      })

      // Vérifier les nouveaux produits
      const newProducts = currentProducts.filter(product => {
        const id = String(product.id)
        return !previousProductsMap.has(id)
      })

      // Vérifier les réductions de prix
      const priceReductions = currentProducts.filter(product => {
        const id = String(product.id)
        const previousProduct = previousProductsMap.get(id)
        if (!previousProduct) return false

        // Vérifier si le prix a diminué (réduction d'au moins 5%)
        const currentPrice = product.price || 0
        const previousPrice = previousProduct.price || 0
        if (previousPrice > 0 && currentPrice < previousPrice) {
          const reductionPercent = ((previousPrice - currentPrice) / previousPrice) * 100
          return reductionPercent >= 5 // Au moins 5% de réduction
        }
        return false
      })

      // Notifier pour les nouveaux produits
      newProducts.forEach(product => {
        const notification = {
          id: Date.now() + Math.random(),
          type: 'new-menu',
          title: 'Nouveau Plat Disponible!',
          message: `Découvrez "${product.name}" - une nouvelle spécialité ajoutée au menu!`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          image: product.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=200&fit=crop',
          actionUrl: `/product/${product.id}`,
          actionText: 'Voir le plat',
          priority: 'high',
          read: false,
          createdAt: new Date().toISOString()
        }
        addNotification(notification)
      })

      // Notifier pour les réductions de prix
      priceReductions.forEach(product => {
        const previousProduct = previousProductsMap.get(String(product.id))
        const reductionPercent = Math.round(((previousProduct.price - product.price) / previousProduct.price) * 100)

        const notification = {
          id: Date.now() + Math.random(),
          type: 'promotion',
          title: 'Réduction de Prix!',
          message: `${product.name} est maintenant à -${reductionPercent}%! Profitez de cette offre spéciale.`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          image: product.image || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=200&fit=crop',
          actionUrl: `/product/${product.id}`,
          actionText: 'Voir l\'offre',
          priority: 'medium',
          read: false,
          createdAt: new Date().toISOString()
        }
        addNotification(notification)
      })

      // Sauvegarder les produits actuels pour la prochaine vérification
      // Seulement si on a détecté des changements ou si c'est la première fois
      if (newProducts.length > 0 || priceReductions.length > 0 || previousProducts.length === 0) {
        const productsToSave = currentProducts.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image
        }))
        localStorage.setItem('previousProducts', JSON.stringify(productsToSave))
      }

    } catch (error) {
      console.error('Erreur lors de la vérification des nouveaux produits:', error)
      // En cas d'erreur, ne pas notifier
    }
  }

  const addNotification = (notification) => {
    // Vérifier si cette notification n'existe pas déjà (éviter les doublons)
    setNotifications(prev => {
      const exists = prev.some(n =>
        n.type === notification.type &&
        n.actionUrl === notification.actionUrl &&
        Math.abs(new Date(n.createdAt || n.time).getTime() - new Date(notification.createdAt || notification.time).getTime()) < 60000 // Moins d'1 minute de différence
      )

      if (exists) {
        return prev // Ne pas ajouter si déjà présente
      }

      const newNotifications = [notification, ...prev.slice(0, 49)] // Keep last 50

      // Sauvegarder dans localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(newNotifications))
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des notifications:', error)
      }

      return newNotifications
    })

    // Show current notification
    setCurrentNotification(notification)
    setIsVisible(true)
  }

  const showNotification = (notification) => {
    addNotification(notification)
  }

  const closeNotification = () => {
    setIsVisible(false)
    setTimeout(() => {
      setCurrentNotification(null)
    }, 500)
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setCurrentNotification(null)
    setIsVisible(false)

    // Supprimer aussi de localStorage
    try {
      localStorage.removeItem('notifications')
    } catch (error) {
      console.error('Erreur lors de la suppression des notifications:', error)
    }
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )

      // Sauvegarder dans localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify(updated))
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des notifications:', error)
      }

      return updated
    })
  }

  const getUnreadCount = () => {
    const localUnread = notifications.filter(n => !n.read).length
    const userUnread = userNotifications.filter(n => !n.read).length
    return localUnread + userUnread
  }

  const value = React.useMemo(() => ({
    notifications,
    userNotifications,
    currentNotification,
    isVisible,
    showNotification,
    closeNotification,
    clearAllNotifications,
    markAsRead,
    getUnreadCount,
    checkForNewProducts,
    loadUserNotifications
  }), [notifications, userNotifications, currentNotification, isVisible])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
