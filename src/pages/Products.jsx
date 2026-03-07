import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart, Star, Clock, Filter, Grid, List, Heart, Sparkles, Package } from 'lucide-react'
import { mockProducts } from '../data/mockData'
import { useCart } from '../context/CartContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import AllergyFilter from '../components/AllergyFilter'
import SEOHead from '../components/SEOHead'
import Pagination from '../components/Pagination'

export default function Products() {
  const { addItem } = useCart()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('tous')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid')
  const [filteredProducts, setFilteredProducts] = useState(mockProducts)
  const [selectedAllergies, setSelectedAllergies] = useState([])
  const [animatingProductId, setAnimatingProductId] = useState(null)
  const [hideFiltersBar, setHideFiltersBar] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 9
  const lastScrollY = useRef(0)

  // Animation pour la section hero
  const [heroRef, heroVisible, heroClasses, heroStyle] = useScrollReveal({ direction: 'fade', delay: 0, duration: 800 })

  const categories = ['tous', 'plats', 'sandwichs', 'boissons', 'desserts']
  const sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'rating', label: 'Note' }
  ]

  useEffect(() => {
    let filtered = mockProducts

    // Filtrer par catégorie
    if (selectedCategory !== 'tous') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrer par allergies
    if (selectedAllergies.length > 0) {
      filtered = filtered.filter(product => {
        const productAllergens = product.allergens || []
        return !selectedAllergies.some(allergy => productAllergens.includes(allergy))
      })
    }

    // Trier
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1) // Réinitialiser à la page 1 lors du changement de filtres
  }, [searchTerm, selectedCategory, sortBy, selectedAllergies])

  // Logique de pagination
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  // Masquer la barre de filtres en défilement descendant, ré-afficher en remontant
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      const goingDown = current > lastScrollY.current + 8
      const goingUp = current < lastScrollY.current - 8

      if (goingDown && current > 120) {
        setHideFiltersBar(true)
      } else if (goingUp) {
        setHideFiltersBar(false)
      }

      lastScrollY.current = current
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Nos Produits - CuniResto"
        description="Découvrez notre sélection de plats délicieux, préparés avec passion par nos chefs. Livraison rapide disponible."
        keywords="produits, plats, menu, livraison, restaurant"
      />
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
              <Package size={28} className="text-white" />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '200ms' }}>
              Tous nos Produits
            </h1>
            <p className={`text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '400ms' }}>
              Explorez notre catalogue complet et trouvez votre plat préféré
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section - Design Professionnel */}
      <div className={`bg-white dark:bg-gray-800 shadow-md border-b border-gray-100 dark:border-gray-700 sticky top-16 z-40 transition-transform duration-300 ease-out ${hideFiltersBar ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Barre de recherche principale */}
          <div className="mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors duration-300" size={22} />
                <input
                  type="text"
                  placeholder="Rechercher un produit, une catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-4 py-3.5 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-900/80"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filtres et options */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Filtres de gauche */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Allergies */}
              <AllergyFilter
                selectedAllergies={selectedAllergies}
                onAllergiesChange={setSelectedAllergies}
                products={mockProducts}
              />

              {/* Filtre par catégorie */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-700 hover:border-primary/50 transition-all duration-300 group">
                <Filter size={18} className="text-gray-700 dark:text-gray-500 group-hover:text-primary transition-colors" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-900 dark:text-gray-200 font-medium cursor-pointer focus:ring-0 pr-6 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right"
                  style={{ backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200">
                      {cat === 'tous' ? '\u00A0\u00A0Toutes les catégories' : `\u00A0\u00A0${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-700 hover:border-primary/50 transition-all duration-300 group">
                <svg className="w-4 h-4 text-gray-700 dark:text-gray-500 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-900 dark:text-gray-200 font-medium cursor-pointer focus:ring-0 pr-6 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] dark:bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right"
                  style={{ backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200">
                      {`\u00A0\u00A0${option.label}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Options de droite */}
            <div className="flex items-center gap-4">
              {/* Compteur de résultats */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
                <Package size={18} className="text-primary" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <span className="text-primary font-bold">{filteredProducts.length}</span> produit{filteredProducts.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Séparateur */}
              <div className="hidden sm:block w-px h-8 bg-gray-300"></div>

              {/* Toggle de vue */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === 'grid'
                    ? 'bg-white text-primary shadow-md scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    }`}
                  title="Vue en grille"
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === 'list'
                    ? 'bg-white text-primary shadow-md scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    }`}
                  title="Vue en liste"
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Badges de filtres actifs (si des filtres sont appliqués) */}
          {(searchTerm || selectedCategory !== 'tous') && (
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtres actifs:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                  <span>"{searchTerm}"</span>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {selectedCategory !== 'tous' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-gray-800 rounded-full text-sm font-medium border border-accent/20">
                  <span>{selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</span>
                  <button
                    onClick={() => setSelectedCategory('tous')}
                    className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {(searchTerm || selectedCategory !== 'tous') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('tous')
                  }}
                  className="text-xs text-gray-500 hover:text-primary font-medium transition-colors ml-2"
                >
                  Tout effacer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProducts.map((product, index) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group border border-gray-200 dark:border-gray-700 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Image */}
                <div className="h-56 bg-gray-200 relative overflow-hidden rounded-t-xl group">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
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
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white"
                        >
                          <Heart size={16} />
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
                        : 'bg-primary text-white hover:bg-primary/90'
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
        ) : (
          <div className="space-y-6">
            {currentProducts.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-64 h-48 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.featured && (
                      <div className="absolute top-4 left-4 bg-accent text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                        Populaire
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{product.name}</h3>
                      <span className="text-3xl font-bold text-primary">{product.price.toLocaleString()} GNF</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">{product.description}</p>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Star size={20} className="fill-accent text-accent" />
                          <span className="text-lg text-gray-600 dark:text-gray-400">{product.rating}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                          <Clock size={20} />
                          <span className="text-lg">{product.prepTime}</span>
                        </div>
                      </div>
                      <div className="flex space-x-4">
                        <Link
                          to={`/product/${product.id}`}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                        >
                          Détails
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={animatingProductId === product.id}
                          className={`px-6 py-3 rounded-lg transition font-semibold flex items-center space-x-2 ${animatingProductId === product.id
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                        >
                          <ShoppingCart size={20} />
                          <span>{animatingProductId === product.id ? 'Ajout...' : 'Ajouter'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Aucun produit trouvé</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
