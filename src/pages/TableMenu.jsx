import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Plus, Minus, Bell, ChefHat, Star, Clock,
  CheckCircle, X, Loader, AlertCircle, Sparkles
} from 'lucide-react'
import { api } from '../utils/api'

export default function TableMenu() {
  const { qrCode } = useParams()
  const navigate = useNavigate()
  const [table, setTable] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showCart, setShowCart] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [waiterCalled, setWaiterCalled] = useState(false)

  useEffect(() => {
    loadData()
  }, [qrCode])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tableRes, productsRes] = await Promise.all([
        api.getTableByQRCode(qrCode).catch(() => ({ success: false })),
        api.getProducts({ limit: 1000 }).catch(() => ({ success: false }))
      ])

      if (tableRes.success) {
        setTable(tableRes.table)
      } else {
        alert('Table non trouvée. Veuillez scanner un QR Code valide.')
        navigate('/')
        return
      }

      if (productsRes.success) {
        const productsList = productsRes.products || []
        setProducts(productsList)

        // Extraire les catégories uniques
        const uniqueCategories = [...new Set(productsList.map(p => p.category).filter(Boolean))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      alert('Erreur lors du chargement du menu')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        notes: ''
      }])
    }
    setShowCart(true)
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ))
  }

  const updateNotes = (productId, notes) => {
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, notes }
        : item
    ))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Votre panier est vide')
      return
    }

    setSubmitting(true)
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes
        })),
        customerName,
        customerPhone,
        specialRequests
      }

      const response = await api.createTableOrder(qrCode, orderData)

      if (response.success) {
        setOrderPlaced(true)
        setCart([])
        setCustomerName('')
        setCustomerPhone('')
        setSpecialRequests('')
        setShowCart(false)
      } else {
        alert(response.message || 'Erreur lors de la commande')
      }
    } catch (error) {
      console.error('Erreur commande:', error)
      alert('Erreur lors de la commande. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCallWaiter = async () => {
    if (waiterCalled) return

    try {
      const response = await api.callWaiter(qrCode)
      if (response.success) {
        setWaiterCalled(true)
        setTimeout(() => setWaiterCalled(false), 30000) // Réinitialiser après 30 secondes
      }
    } catch (error) {
      console.error('Erreur appel serveur:', error)
      alert('Erreur lors de l\'appel. Veuillez réessayer.')
    }
  }

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-primary mx-auto mb-4" size={48} />
          <p className="text-gray-600 text-lg">Chargement du menu...</p>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-white" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Commande confirmée !</h2>
          <p className="text-gray-600 mb-6">
            Votre commande a été envoyée avec succès. Notre équipe la prépare maintenant.
          </p>
          <button
            onClick={() => {
              setOrderPlaced(false)
              loadData()
            }}
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            Commander à nouveau
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent dark:from-gray-800 dark:to-gray-900 text-white shadow-lg sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <ChefHat size={32} />
                Menu Digital
              </h1>
              {table && (
                <p className="text-orange-100 mt-1">Table {table.tableNumber}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCallWaiter}
                disabled={waiterCalled}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${waiterCalled
                  ? 'bg-green-500 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
              >
                <Bell size={20} />
                {waiterCalled ? 'Appelé !' : 'Appeler serveur'}
              </button>
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative bg-white/20 hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 text-white px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2"
              >
                <ShoppingCart size={20} />
                Panier
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 shadow-md sticky top-[88px] z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-2 rounded-xl font-semibold whitespace-nowrap transition ${activeCategory === 'all'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              Tout
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-xl font-semibold whitespace-nowrap transition capitalize ${activeCategory === category
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-transparent dark:border-gray-700"
            >
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <ChefHat size={48} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Sparkles size={12} />
                    Populaire
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{product.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-gray-600">{product.rating || 0}</span>
                    {product.prepTime && (
                      <>
                        <span className="text-gray-400">•</span>
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{product.prepTime}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xl font-bold text-primary">
                    {product.price?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-300">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart size={28} />
                  Panier
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-orange-100 mt-1">{cart.length} article(s)</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Votre panier est vide</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.productId} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                          <p className="text-primary font-bold">
                            {item.price.toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Notes spéciales..."
                        value={item.notes}
                        onChange={(e) => updateNotes(item.productId, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}

                  {/* Customer Info */}
                  <div className="space-y-3 pt-4 border-t">
                    <input
                      type="text"
                      placeholder="Votre nom (optionnel)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone (optionnel)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      placeholder="Demandes spéciales..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {getTotal().toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Commander
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


