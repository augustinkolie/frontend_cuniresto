import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Fonction utilitaire pour normaliser l'ID d'un produit (définie avant les hooks)
  const normalizeProductId = (product) => {
    return product.id || product.id || null
  }

  useEffect(() => {
    // Charger le panier depuis localStorage au montage
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        // Vérifier que c'est bien un tableau
        if (Array.isArray(parsedCart)) {
          if (parsedCart.length > 0) {
            // Normaliser les IDs des produits chargés
            const normalizedCart = parsedCart.map(item => {
              const id = normalizeProductId(item)
              if (!id) {
                console.warn('Produit sans ID trouvé dans le panier:', item)
                return null
              }
              // S'assurer que toutes les propriétés nécessaires sont présentes
              return {
                ...item,
                id: String(id), // Toujours utiliser 'id' comme string pour la cohérence
                _id: item.id ? String(item.id) : String(id), // Garder aussi _id si présent
                name: item.name || item.title || 'Produit',
                price: item.price || 0,
                image: item.image || '/placeholder.jpg',
                description: item.description || '',
                quantity: item.quantity || 1,
                category: item.category || 'default'
              }
            }).filter(item => item !== null) // Filtrer les items invalides
            
            if (normalizedCart.length > 0) {
              setItems(normalizedCart)
              console.log('Panier chargé depuis localStorage:', normalizedCart.length, 'produits')
            } else {
              setItems([])
            }
          } else {
            // Si le panier est vide dans localStorage, initialiser avec un tableau vide
            setItems([])
          }
        } else {
          console.warn('Le panier dans localStorage n\'est pas un tableau')
          setItems([])
        }
      } else {
        // Pas de panier dans localStorage, initialiser avec un tableau vide
        setItems([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error)
      // En cas d'erreur, ne pas supprimer le localStorage, juste initialiser avec un tableau vide
      setItems([])
    } finally {
      // Marquer comme initialisé après le chargement
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    // Sauvegarder le panier dans localStorage à chaque changement
    // Mais seulement après l'initialisation pour éviter d'écraser les données au chargement
    if (!isInitialized) return
    
    try {
      if (Array.isArray(items)) {
        // S'assurer que tous les items ont bien leurs IDs normalisés avant la sauvegarde
        const itemsToSave = items.map(item => ({
          ...item,
          id: String(item.id || item.id || ''),
          _id: String(item.id || item.id || '')
        }))
        localStorage.setItem('cart', JSON.stringify(itemsToSave))
        console.log('Panier sauvegardé dans localStorage:', itemsToSave.length, 'produits')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panier:', error)
      // En cas d'erreur de quota (localStorage plein), essayer de sauvegarder quand même
      try {
        // Essayer de sauvegarder avec une liste vide
        localStorage.setItem('cart', JSON.stringify([]))
      } catch (e) {
        console.error('Impossible de sauvegarder le panier:', e)
      }
    }
  }, [items, isInitialized])

  const addItem = (product, quantity = 1) => {
    const productId = normalizeProductId(product)
    if (!productId) {
      console.error('Impossible d\'ajouter le produit au panier: ID manquant')
      return
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => {
        const itemId = item.id || item.id
        return itemId && itemId.toString() === productId.toString()
      })
      
      if (existingItem) {
        return prevItems.map(item => {
          const itemId = item.id || item.id
          if (itemId && itemId.toString() === productId.toString()) {
            return { ...item, quantity: item.quantity + quantity }
          }
          return item
        })
      }
      
      // S'assurer que le produit a toutes les propriétés nécessaires
      const cartItem = {
        id: String(productId), // Toujours utiliser l'ID normalisé comme string
        _id: product.id ? String(product.id) : String(productId), // Garder aussi _id si présent
        name: product.name || product.title || 'Produit',
        price: Number(product.price) || 0,
        image: product.image || product.images || '/placeholder.jpg',
        description: product.description || '',
        quantity: Number(quantity) || 1,
        category: product.category || 'default'
      }
      console.log('Produit ajouté au panier:', cartItem)
      return [...prevItems, cartItem]
    })
  }

  const removeItem = (productId) => {
    if (!productId) return
    
    setItems(prevItems => prevItems.filter(item => {
      const itemId = item.id || item.id
      return itemId && itemId.toString() !== productId.toString()
    }))
  }

  const updateQuantity = (productId, quantity) => {
    if (!productId) return
    
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems(prevItems =>
      prevItems.map(item => {
        const itemId = item.id || item.id
        if (itemId && itemId.toString() === productId.toString()) {
          return { ...item, quantity }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
