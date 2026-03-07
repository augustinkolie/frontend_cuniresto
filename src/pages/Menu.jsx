import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Star, ShoppingCart, Filter, ChefHat, Utensils, Coffee, Cake, Sparkles, Heart } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useFavorite } from '../context/FavoriteContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import '../styles/animations.css'
import { mockProducts } from '../data/mockData'

export default function Menu() {
  const { addItem } = useCart()
  const { toggleFavorite, isFavorite } = useFavorite()
  const [selectedCategory, setSelectedCategory] = useState('tous')
  const [mounted, setMounted] = useState(false)
  const [animatingProducts, setAnimatingProducts] = useState(false)
  const [imageErrors, setImageErrors] = useState({})
  const [animatingProductId, setAnimatingProductId] = useState(null)
  const [products, setProducts] = useState(mockProducts)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 6

  // Animation pour la section hero
  const [heroRef, heroVisible, heroClasses, heroStyle] = useScrollReveal({ direction: 'fade', delay: 0, duration: 800 })

  const categories = ['tous', 'spaghetti', 'lapin', 'atieke', 'sandwichs', 'boissons', 'desserts']

  // Logique de filtrage simple et directe
  const filteredProducts = selectedCategory === 'tous'
    ? products
    : products.filter(product => product.category && product.category.toLowerCase() === selectedCategory)

  // Logique de pagination
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  const categoryIcons = {
    tous: <Utensils size={20} />,
    spaghetti: <ChefHat size={20} />,
    lapin: <ChefHat size={20} />,
    atieke: <ChefHat size={20} />,
    sandwichs: <Utensils size={20} />,
    boissons: <Coffee size={20} />,
    desserts: <Cake size={20} />
  }

  useEffect(() => {
    setMounted(true)
    // On utilise mockProducts directement pour garantir l'affichage
    if (Array.isArray(mockProducts)) {
      setProducts(mockProducts)
    } else {
      console.error("mockProducts n'est pas un tableau:", mockProducts)
      setProducts([])
    }
    setLoading(false)
  }, [])



  const handleCategoryChange = (category) => {
    setAnimatingProducts(true)
    setTimeout(() => {
      setSelectedCategory(category)
      setCurrentPage(1) // Réinitialiser à la page 1 lors du changement de catégorie
      setAnimatingProducts(false)
    }, 300)
  }

  const handleAddToCart = (product, e) => {
    if (animatingProductId) return // Éviter les animations multiples

    setAnimatingProductId(product.id)

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
      addItem(product, 1)

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

  const handleImageError = (productId) => {
    setImageErrors(prev => ({ ...prev, [productId]: true }))
  }

  const getFallbackImage = (category) => {
    const fallbacks = {
      spaghetti: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
      lapin: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
      atieke: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
      plats: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
      sandwichs: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop',
      boissons: 'https://images.unsplash.com/photo-1600271886742-f049be45f9aa?w=400&h=300&fit=crop',
      desserts: 'https://images.unsplash.com/photo-1574296637938-59a04845b826?w=400&h=300&fit=crop'
    }
    return fallbacks[category] || fallbacks.plats
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div
        ref={heroRef}
        className={`relative text-white py-12 md:py-16 overflow-hidden transition-all duration-300 ${heroClasses}`}
      >
        {/* Image de fond avec flou */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(2px)',
            ...heroStyle
          }}
        ></div>

        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl mb-4 transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
              }`}
              style={{ transitionDelay: '100ms' }}>
              <Utensils size={28} className="text-white" />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '200ms' }}>
              Notre Menu
            </h1>
            <p className={`text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '400ms' }}>
              Découvrez notre sélection de plats préparés avec passion et savoir-faire
            </p>
          </div>
        </div>
      </div>

      {/* Animated Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12 transform transition-all duration-1000 translate-y-0 opacity-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 animate-float">
            <Filter className="text-primary" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Filtrer par catégorie</h2>
          <p className="text-gray-600 dark:text-gray-300">Choisissez parmi nos spécialités</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`group relative px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md hover:shadow-lg dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-700'
                }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`transition-transform duration-300 ${selectedCategory === category ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                  {categoryIcons[category]}
                </span>
                <span>
                  {category === 'atieke' ? 'Atiéké' :
                    category === 'tous' ? 'Tous' :
                      category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </div>

              {/* Animated underline for selected category */}
              {selectedCategory === category && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 animate-pulse"></div>
              )}

              {/* Sparkle effect on hover */}
              <div className={`absolute -top-1 -right-1 transition-opacity duration-300 ${selectedCategory === category ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                <Sparkles className="text-accent" size={16} />
              </div>
            </button>
          ))}
        </div>

        {/* Category info */}
        <div className="text-center mb-8 transform transition-all duration-500 translate-y-0 opacity-100">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedCategory === 'tous'
              ? `Affichage de tous les ${filteredProducts.length} produits`
              : `${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''} dans cette catégorie`
            }
          </p>
        </div>
      </div>

      {/* Animated Menu Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500 scale-100 opacity-100 mb-12">
          {currentProducts.map((product, index) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group border border-gray-200 dark:border-gray-700"
            >
              {/* Image */}
              <div className="h-56 bg-gray-200 relative overflow-hidden rounded-t-xl group">
                <img
                  src={imageErrors[product.id] ? getFallbackImage(product.category) : product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                  onError={() => handleImageError(product.id)}
                  loading="lazy"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-between p-4">
                  {/* Top actions */}
                  <div className="flex justify-between items-start">
                    {/* Featured badge */}
                    {product.featured && (
                      <div className="bg-accent text-gray-900 px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                        <Sparkles size={12} />
                        <span>Populaire</span>
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleFavorite(product)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isFavorite(product.id || product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
                          }`}
                      >
                        <Heart size={16} className={isFavorite(product.id || product.id) ? 'fill-current' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom detail button */}
                  <div className="flex justify-center">
                    <Link
                      to={`/product/${product.id}`}
                      className="bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>Voir Détails</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {product.name}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  {product.description}
                </p>

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{product.price.toLocaleString()} GNF</span>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={animatingProductId === product.id}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 font-medium ${animatingProductId === product.id
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-orange-600'
                      }`}
                  >
                    <ShoppingCart size={18} />
                    <span className="text-sm">
                      {animatingProductId === product.id ? 'Ajout...' : 'Ajouter au panier'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun produit trouvé dans cette catégorie</p>
          </div>
        )}

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${currentPage === 1 
                ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'text-gray-700 border-gray-300 hover:bg-primary hover:text-white transition-all'
              }`}
            >
              Précédent
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === number 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border ${currentPage === totalPages 
                ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'text-gray-700 border-gray-300 hover:bg-primary hover:text-white transition-all'
              }`}
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Envie de quelque chose de spécifique?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour des commandes personnalisées ou des événements spéciaux
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/reservation"
              className="inline-flex items-center justify-center space-x-2 bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition"
            >
              <span>Réserver une table</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center space-x-2 border border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-gray-900 transition"
            >
              <span>Nous contacter</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
