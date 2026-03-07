import React, { createContext, useContext, useState, useEffect } from 'react'

const FavoriteContext = createContext()

export const useFavorite = () => {
  const context = useContext(FavoriteContext)
  if (!context) {
    throw new Error('useFavorite must be used within a FavoriteProvider')
  }
  return context
}

// Fonction utilitaire pour normaliser l'ID d'un produit
const normalizeProductId = (product) => {
  return product.id || product.id || null
}

// Fonction utilitaire pour normaliser un produit (s'assurer qu'il a un id)
const normalizeProduct = (product) => {
  const id = normalizeProductId(product)
  if (!id) return null
  return {
    ...product,
    id: id, // Toujours utiliser 'id' pour la cohérence
    _id: product.id || id // Garder aussi _id si présent
  }
}

// Fonction pour charger les favoris depuis localStorage de manière synchrone
const loadFavoritesFromStorage = () => {
  try {
    if (typeof window !== 'undefined') {
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites)
        // Normaliser les favoris chargés
        const normalized = parsed
          .map(normalizeProduct)
          .filter(p => p !== null) // Filtrer les produits invalides
        // Si on a réussi à normaliser, sauvegarder la version normalisée
        if (normalized.length > 0) {
          localStorage.setItem('favorites', JSON.stringify(normalized))
        }
        return normalized
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des favoris:', error)
  }
  return []
}

export const FavoriteProvider = ({ children }) => {
  // Initialiser directement depuis localStorage pour éviter le délai
  const [favorites, setFavorites] = useState(() => loadFavoritesFromStorage())

  useEffect(() => {
    // Vérifier et synchroniser avec localStorage au montage (au cas où il y aurait eu des changements)
    try {
      const savedFavorites = localStorage.getItem('favorites')
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites)
        const normalized = parsed
          .map(normalizeProduct)
          .filter(p => p !== null)
        
        // Vérifier si les favoris ont changé (par exemple, depuis un autre onglet)
        setFavorites(prev => {
          const prevIds = prev.map(f => normalizeProductId(f)).sort()
          const newIds = normalized.map(f => normalizeProductId(f)).sort()
          if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
            return normalized
          }
          return prev
        })
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation des favoris:', error)
    }
  }, [])

  useEffect(() => {
    // Save favorites to localStorage whenever they change
    // Toujours sauvegarder, même si la liste est vide, pour maintenir la persistance
    try {
      if (Array.isArray(favorites)) {
        localStorage.setItem('favorites', JSON.stringify(favorites))
        console.log('Favoris sauvegardés dans localStorage:', favorites.length, 'produits')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error)
      // En cas d'erreur de quota (localStorage plein), essayer de nettoyer d'autres données
      try {
        // Essayer de sauvegarder quand même avec une liste vide
        localStorage.setItem('favorites', JSON.stringify([]))
      } catch (e) {
        console.error('Impossible de sauvegarder les favoris:', e)
      }
    }
  }, [favorites])

  const addToFavorites = (product) => {
    const normalized = normalizeProduct(product)
    if (!normalized) {
      console.error('Impossible d\'ajouter le produit aux favoris: ID manquant')
      return
    }

    setFavorites(prev => {
      const productId = normalized.id
      const exists = prev.some(fav => {
        const favId = normalizeProductId(fav)
        return favId && favId.toString() === productId.toString()
      })
      if (!exists) {
        const newFavorites = [...prev, normalized]
        console.log('Produit ajouté aux favoris:', normalized.name, 'Total:', newFavorites.length)
        return newFavorites
      }
      return prev
    })
  }

  const removeFromFavorites = (productId) => {
    if (!productId) return
    
    setFavorites(prev => prev.filter(fav => {
      const favId = normalizeProductId(fav)
      return favId && favId.toString() !== productId.toString()
    }))
  }

  const toggleFavorite = (product) => {
    const productId = normalizeProductId(product)
    if (!productId) {
      console.error('Impossible de basculer le favori: ID manquant')
      return
    }

    const isFavorite = favorites.some(fav => {
      const favId = normalizeProductId(fav)
      return favId && favId.toString() === productId.toString()
    })
    
    if (isFavorite) {
      removeFromFavorites(productId)
    } else {
      addToFavorites(product)
    }
  }

  const isFavorite = (productId) => {
    if (!productId) return false
    
    // Normaliser l'ID du produit pour la comparaison
    const normalizedId = String(productId)
    
    const result = favorites.some(fav => {
      const favId = normalizeProductId(fav)
      return favId && String(favId) === normalizedId
    })
    
    return result
  }

  const getFavoriteCount = () => {
    return favorites.length
  }

  const clearFavorites = () => {
    setFavorites([])
  }

  return (
    <FavoriteContext.Provider value={{
      favorites,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
      isFavorite,
      getFavoriteCount,
      clearFavorites
    }}>
      {children}
    </FavoriteContext.Provider>
  )
}
