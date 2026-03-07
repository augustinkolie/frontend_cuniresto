import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Clock, ChefHat, Sparkles, ArrowLeft, Plus, Minus, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useFavorite } from '../context/FavoriteContext'
import { mockProducts } from '../data/mockData'
import { api } from '../utils/api'
import CommentSection from '../components/CommentSection'
import ChefVideo from '../components/ChefVideo'
import SEOHead from '../components/SEOHead'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [animatingProductId, setAnimatingProductId] = useState(null)
  const { addItem } = useCart()
  const { toggleFavorite, isFavorite: checkIsFavorite } = useFavorite()

  useEffect(() => {
    setMounted(true)
    loadProduct()
    window.scrollTo(0, 0)
  }, [id])

  const loadProduct = async () => {
    setLoading(true)
    try {
      // Vérifier si l'ID est un ObjectId MongoDB (24 caractères hexadécimaux)
      const isObjectId = typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)

      if (isObjectId) {
        // Charger depuis l'API
        try {
          const response = await api.getProduct(id)
          if (response && response.success && response.product) {
            setProduct(response.product)
            return
          }
        } catch (error) {
          // Si erreur 400 (ID invalide) ou 404 (non trouvé), utiliser mockProducts
          console.log('Produit non trouvé dans l\'API, utilisation des données mock')
        }
      }

      // ID numérique ou produit non trouvé dans l'API, utiliser mockProducts
      const foundProduct = mockProducts.find(p => p.id === parseInt(id))
      if (foundProduct) {
        setProduct(foundProduct)
      } else {
        console.error('Produit non trouvé dans mockProducts avec ID:', id)
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error)
      // Fallback vers mockProducts
      const foundProduct = mockProducts.find(p => p.id === parseInt(id))
      setProduct(foundProduct)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity)
      setQuantity(1)
    }
  }

  const handleAddToCartWithAnimation = (similarProduct, e) => {
    if (animatingProductId) return // Éviter les animations multiples

    setAnimatingProductId(similarProduct.id || similarProduct.id)

    // Créer l'élément animé
    const button = e.currentTarget
    const productCard = button.closest('.bg-white')
    const productImg = productCard.querySelector('img')
    const productRect = productImg.getBoundingClientRect()

    // Créer une copie flottante de l'image
    const flyingImg = document.createElement('div')
    flyingImg.style.backgroundImage = `url(${productImg.src})`
    flyingImg.style.backgroundSize = 'cover'
    flyingImg.style.backgroundPosition = 'center'

    // Style de l'image volante
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

    // Démarrer l'animation après un petit délai
    setTimeout(() => {
      flyingImg.style.left = targetX + 'px'
      flyingImg.style.top = targetY + 'px'
      flyingImg.style.transform = 'scale(0.5) rotate(720deg)'
      flyingImg.style.opacity = '0.3'
    }, 50)

    // Nettoyer et ajouter au panier
    setTimeout(() => {
      if (flyingImg.parentNode) {
        flyingImg.remove()
      }
      addItem(similarProduct, 1)

      // Animation du panier
      if (cartIcon) {
        cartIcon.style.transform = 'scale(1.3)'
        cartIcon.style.transition = 'transform 0.3s'
        setTimeout(() => {
          cartIcon.style.transform = 'scale(1)'
        }, 300)
      }

      setAnimatingProductId(null)
    }, 1000)
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600 text-lg">Produit non trouvé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <SEOHead
        title={`${product.name} - CuniResto`}
        description={product.description}
        image={product.image}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          to="/menu"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary transition-colors duration-300"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour au menu
        </Link>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Image Section */}
          <div className={`transform transition-all duration-1000 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'} h-full`}>
            {/* Main Image */}
            <div className="relative overflow-hidden rounded-xl shadow-xl group h-full">
              <div className="h-full bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
              </div>

              {/* Featured Badge */}
              {product.featured && (
                <div className="absolute top-4 left-4 bg-accent text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 animate-pulse">
                  <Sparkles size={12} />
                  <span>Populaire</span>
                </div>
              )}

              {/* Overlay Pattern */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

          </div>

          {/* Info Section */}
          <div className={`space-y-8 transform transition-all duration-1000 delay-300 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>

            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={`${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-gray-300'} transition-colors duration-300`}
                    />
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {product.rating} ({product.reviews} avis)
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="prose">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Vidéo du Chef */}
            {product.chefVideo && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ChefHat className="text-primary" size={24} />
                  Vidéo du Chef
                </h3>
                <ChefVideo
                  videoUrl={product.chefVideo}
                  title={`Préparation de ${product.name}`}
                  description="Découvrez comment notre chef prépare ce plat avec passion"
                  thumbnail={product.image}
                />
              </div>
            )}

            {/* Product Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 bg-primary/10 p-3 rounded-lg">
                <Clock className="text-primary" size={20} />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Temps de préparation</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{product.prepTime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-accent/10 p-3 rounded-lg">
                <ChefHat className="text-accent" size={20} />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Catégorie</p>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">{product.category}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-xl border border-primary/20">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-primary">
                  {product.price.toLocaleString()} GNF
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">TTC</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="font-semibold text-gray-900 dark:text-white">Quantité</label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="px-4 py-2 font-semibold text-center text-gray-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
              >
                <ShoppingCart size={20} />
                <span>Ajouter au panier</span>
              </button>
              <button
                onClick={() => product && toggleFavorite(product)}
                className={`px-4 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300 flex items-center justify-center ${product && checkIsFavorite(product.id || product.id)
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                <Heart size={20} fill={product && checkIsFavorite(product.id || product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      <div className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-8 transform transition-all duration-1000 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Vous pourriez aussi aimer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Découvrez d'autres plats qui pourraient vous plaire
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              // Obtenir les produits similaires basés sur la catégorie
              const getSimilarProducts = () => {
                const currentProductId = product.id || product.id
                const currentCategory = product.category

                // 1. D'abord, prendre les produits de la même catégorie (sauf le produit actuel)
                const sameCategoryProducts = mockProducts.filter(
                  p => (p.id !== currentProductId && p.id !== currentProductId) && 
                       p.category === currentCategory
                )

                // 2. Si on n'a pas assez (moins de 4), compléter avec des produits populaires d'autres catégories
                let similarProducts = [...sameCategoryProducts]
                
                if (similarProducts.length < 4) {
                  const otherCategoryProducts = mockProducts.filter(
                    p => (p.id !== currentProductId && p.id !== currentProductId) && 
                         p.category !== currentCategory &&
                         !similarProducts.some(sp => (sp.id === p.id || sp.id === p.id))
                  )
                  
                  // Prioriser les produits populaires (featured)
                  const featuredOthers = otherCategoryProducts.filter(p => p.featured)
                  const regularOthers = otherCategoryProducts.filter(p => !p.featured)
                  
                  // Mélanger: d'abord les featured, puis les autres
                  const remaining = [...featuredOthers, ...regularOthers].slice(0, 4 - similarProducts.length)
                  similarProducts = [...similarProducts, ...remaining]
                }

                // 3. Limiter à 4 produits maximum
                return similarProducts.slice(0, 4)
              }

              const similarProducts = getSimilarProducts()

              return similarProducts.map((similarProduct, index) => (
                <div
                  key={similarProduct.id || similarProduct.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group border border-gray-200 dark:border-gray-700 ${mounted ? 'animate-fade-in-up' : ''
                    }`}
                  style={{
                    animationDelay: mounted ? `${600 + index * 100}ms` : '0ms'
                  }}
                >
                  {/* Image */}
                  <div className="h-40 bg-gray-100 relative overflow-hidden">
                    <img
                      src={similarProduct.image}
                      alt={similarProduct.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Featured Badge */}
                    {similarProduct.featured && (
                      <div className="absolute top-3 left-3 bg-accent text-gray-900 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <Sparkles size={10} />
                        <span>Populaire</span>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Link
                        to={`/product/${similarProduct.id || similarProduct.id}`}
                        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center transform translate-x-2 group-hover:translate-x-0 transition-transform duration-300"
                      >
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg group-hover:text-primary transition-colors duration-300">
                      {similarProduct.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{similarProduct.description}</p>

                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(similarProduct.rating) ? 'fill-accent text-accent' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{similarProduct.rating}</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-primary">{similarProduct.price.toLocaleString()} GNF</span>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-sm">
                        <Clock size={14} />
                        <span>{similarProduct.prepTime}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleAddToCartWithAnimation(similarProduct, e)}
                      disabled={animatingProductId === (similarProduct.id || similarProduct.id)}
                      className={`w-full py-3 rounded-xl font-semibold transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 ${animatingProductId === (similarProduct.id || similarProduct.id)
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-orange-600'
                        }`}
                    >
                      <ShoppingCart size={18} />
                      <span>{animatingProductId === similarProduct.id ? 'Ajout...' : 'Ajouter au panier'}</span>
                    </button>
                  </div>
                </div>
              ))
            })()}
          </div>

          {(() => {
            const currentProductId = product.id || product.id
            const currentCategory = product.category
            const sameCategoryProducts = mockProducts.filter(
              p => (p.id !== currentProductId && p.id !== currentProductId) && 
                   p.category === currentCategory
            )
            const otherProducts = mockProducts.filter(
              p => (p.id !== currentProductId && p.id !== currentProductId) && 
                   p.category !== currentCategory
            )
            
            return (sameCategoryProducts.length === 0 && otherProducts.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">Aucun produit similaire trouvé</p>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Section Commentaires */}
      {product && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <CommentSection
            productId={product.id || product.id?.toString()}
            productName={product.name}
            productData={product ? {
              name: product.name || '',
              description: product.description || '',
              price: product.price || 0,
              category: product.category || 'plats',
              image: product.image || '/images/placeholder.jpg',
              prepTime: product.prepTime || '15 min',
              featured: product.featured || false,
              stock: product.stock || 100
            } : null}
          />
        </div>
      )}
    </div>
  )
}
