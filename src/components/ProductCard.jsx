import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Star, Heart, Eye } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useFavorite } from '../context/FavoriteContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const { toggleFavorite, isFavorite } = useFavorite()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)
  const imgRef = useRef(null)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isAnimating) return // Éviter les animations multiples

    setIsAnimating(true)

    // Utiliser les refs pour trouver l'image directement
    const productImg = imgRef.current

    if (!productImg || !productImg.src) {
      // Si pas d'image, ajouter directement au panier sans animation
      setIsAnimating(false)
      addItem(product, 1)
      return
    }

    const productRect = productImg.getBoundingClientRect()

    // Créer une copie flottante de l'image
    const flyingImg = document.createElement('div')
    flyingImg.style.backgroundImage = `url(${productImg.src})`
    flyingImg.style.backgroundSize = 'cover'
    flyingImg.style.backgroundPosition = 'center'

    // Style de l'image volante - Identique à Menu.jsx
    flyingImg.style.position = 'fixed'
    flyingImg.style.zIndex = '9999'
    flyingImg.style.width = '80px'
    flyingImg.style.height = '80px'
    flyingImg.style.borderRadius = '50%'
    flyingImg.style.pointerEvents = 'none'
    flyingImg.style.transition = 'all 1s ease-in-out'
    flyingImg.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.5)'
    flyingImg.style.border = '3px solid #FF6B35'

    // Position initiale (centre de l'image du produit)
    flyingImg.style.left = (productRect.left + productRect.width / 2 - 40) + 'px'
    flyingImg.style.top = (productRect.top + productRect.height / 2 - 40) + 'px'

    // Ajouter au DOM
    document.body.appendChild(flyingImg)

    // Trouver l'icône du panier
    const cartIcon = document.querySelector('[data-cart-icon]')
    let targetX, targetY

    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect()
      targetX = cartRect.left + cartRect.width / 2 - 40
      targetY = cartRect.top + cartRect.height / 2 - 40
    } else {
      // Fallback: coin supérieur droit
      targetX = window.innerWidth - 120
      targetY = 80
    }

    // Démarrer l'animation après un petit délai - Identique à Menu.jsx
    setTimeout(() => {
      flyingImg.style.left = targetX + 'px'
      flyingImg.style.top = targetY + 'px'
      flyingImg.style.transform = 'scale(0.5) rotate(720deg)'
      flyingImg.style.opacity = '0.3'
    }, 50)

    // Nettoyer et ajouter au panier - Identique à Menu.jsx
    setTimeout(() => {
      if (flyingImg.parentNode) {
        flyingImg.remove()
      }
      addItem(product, 1)

      // Animation du panier
      if (cartIcon) {
        cartIcon.style.transform = 'scale(1.3)'
        cartIcon.style.transition = 'transform 0.3s'
        setTimeout(() => {
          cartIcon.style.transform = 'scale(1)'
        }, 300)
      }

      setIsAnimating(false)
    }, 1000)
  }

  // Normaliser l'ID du produit (gérer à la fois id et _id)
  const productId = product.id || product.id
  const favorite = isFavorite(productId)

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-xl transition overflow-hidden group border border-gray-200 dark:border-gray-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative overflow-hidden bg-gray-200 h-48">
        <img
          ref={imgRef}
          src={product.image || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
        />

        {/* Favorite Button - Top Left (visible on hover) */}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(product)
          }}
          className={`absolute top-2 left-2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-10 border border-gray-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          aria-label="Ajouter aux favoris"
        >
          <Heart
            size={18}
            className={favorite ? 'fill-primary text-primary' : 'text-gray-700'}
          />
        </button>

        {/* View Details Button - Centered on Image (visible on hover) */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
          <Link
            to={`/product/${productId}`}
            className="bg-gradient-to-r from-primary to-accent text-white rounded-lg px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye size={18} />
            <span>Voir Détails</span>
          </Link>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 bg-white dark:bg-gray-900">
        {/* Title */}
        <Link to={`/product/${productId}`}>
          <h3 className="font-bold text-lg text-gray-800 dark:text-white hover:text-primary transition mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {product.description || `${product.name} - Un plat délicieux préparé avec soin par nos chefs`}
        </p>

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          {/* Price - Left */}
          <p className="text-2xl font-bold text-primary">
            {product.price.toLocaleString('fr-GN')} GNF
          </p>

          {/* Add to Cart Button - Right */}
          <button
            onClick={handleAddToCart}
            disabled={isAnimating}
            className={`px-4 py-2 rounded-lg transition flex items-center space-x-2 font-semibold ${isAnimating
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-primary text-white hover:bg-orange-600'
              }`}
          >
            <ShoppingCart size={18} />
            <span>{isAnimating ? 'Ajout...' : 'Ajouter au panier'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
