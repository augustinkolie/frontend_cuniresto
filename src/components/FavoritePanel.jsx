import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, Heart, ShoppingCart, Clock, Star, Trash2 } from 'lucide-react'
import { useFavorite } from '../context/FavoriteContext'
import { useCart } from '../context/CartContext'
import '../styles/animations.css'

export default function FavoritePanel({ isOpen, onClose }) {
  const { favorites, removeFromFavorites, clearFavorites } = useFavorite()
  const { addItem } = useCart()
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
    } else {
      setTimeout(() => setMounted(false), 300)
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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

  const handleAddToCart = (product) => {
    addItem(product)
    // You could add a notification here
  }

  const handleRemoveFavorite = (productId) => {
    removeFromFavorites(productId)
  }

  if (!isOpen && !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${mounted && isOpen ? 'opacity-100' : 'opacity-0'
        }`} onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md sm:top-16 sm:right-4 sm:left-auto sm:translate-x-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${mounted && isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
          }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Mes Favoris</h3>
                <p className="text-white/80 text-sm">
                  {favorites.length > 0 ? `${favorites.length} produit${favorites.length > 1 ? 's' : ''} favori${favorites.length > 1 ? 's' : ''}` : 'Aucun favori'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {favorites.length > 0 && (
                <button
                  onClick={clearFavorites}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  title="Tout supprimer"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Favorites List */}
        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
          {favorites.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Aucun favori</p>
              <p className="text-gray-400 text-sm mt-1">Ajoutez des produits à vos favoris pour les retrouver ici</p>
              <Link
                to="/menu"
                onClick={onClose}
                className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Voir le menu
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {favorites.map((product, index) => {
                // Normaliser l'ID du produit
                const productId = product.id || product.id
                return (
                  <div
                    key={productId}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-transparent transition-colors"
                    style={{
                      animation: mounted ? `slide-in-right 0.3s ease-out ${index * 50}ms forwards` : 'none'
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.image || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder.jpg'
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-800 dark:text-white truncate">{product.name}</h4>
                          <button
                            onClick={() => handleRemoveFavorite(productId)}
                            className="w-6 h-6 text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
                            title="Retirer des favoris"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">{product.description || 'Description non disponible'}</p>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {product.rating && (
                              <div className="flex items-center space-x-1 bg-accent/10 px-2 py-1 rounded-full">
                                <Star size={12} className="fill-accent text-accent" />
                                <span className="text-xs font-semibold text-accent">{product.rating}</span>
                              </div>
                            )}
                            {product.prepTime && (
                              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                <Clock size={12} />
                                <span className="text-xs">{product.prepTime}</span>
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-primary">
                            {product.price ? `${product.price.toLocaleString('fr-FR')} FCFA` : 'Prix non disponible'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center space-x-1"
                          >
                            <ShoppingCart size={14} />
                            <span>Ajouter</span>
                          </button>
                          <Link
                            to={`/product/${productId}`}
                            onClick={onClose}
                            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            Détails
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Total: {favorites.reduce((sum, item) => {
                  const price = typeof item.price === 'number' ? item.price : 0
                  return sum + price
                }, 0).toLocaleString('fr-FR')} FCFA
              </span>
              <button
                onClick={clearFavorites}
                className="text-red-500 hover:text-red-600 transition-colors font-semibold"
              >
                Vider les favoris
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
