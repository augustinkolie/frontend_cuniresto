import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart, X, CreditCard, Smartphone, Wallet, Lock, CheckCircle, Shield, Loader } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import DeliveryModeSelector from '../components/DeliveryModeSelector'
import '../styles/cart-mobile.css'

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showCheckoutPanel, setShowCheckoutPanel] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deliveryMode, setDeliveryMode] = useState('standard')
  const [deliveryEstimate, setDeliveryEstimate] = useState(null)
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '',
    phone: '',
    city: '',
    instructions: '',
    tastePreferences: ''
  })
  const [paymentInfo, setPaymentInfo] = useState({
    orangeMoney: {
      phoneNumber: ''
    },
    carte: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardName: ''
    },
    paypal: {
      email: ''
    }
  })

  const [pendingOrder, setPendingOrder] = useState(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const pollingIntervalRef = useRef(null)

  // Nettoyage du polling au démontage
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [])

  // Fonction de validation
  const validateForm = () => {
    if (!deliveryInfo.address.trim()) {
      setError('L\'adresse de livraison est requise')
      return false
    }
    if (!deliveryInfo.phone.trim()) {
      setError('Le numéro de téléphone est requis')
      return false
    }
    if (!selectedPayment) {
      setError('Veuillez sélectionner un moyen de paiement')
      return false
    }

    if (selectedPayment === 'orange') {
      if (!paymentInfo.orangeMoney.phoneNumber.trim() || paymentInfo.orangeMoney.phoneNumber.trim().length < 9) {
        setError('Veuillez entrer un numéro Orange Money valide')
        return false
      }
    } else if (selectedPayment === 'carte') {
      const cardNumber = paymentInfo.carte.cardNumber.replace(/\s/g, '')
      if (cardNumber.length !== 16) {
        setError('Le numéro de carte doit contenir 16 chiffres')
        return false
      }
      if (!paymentInfo.carte.expiryDate || paymentInfo.carte.expiryDate.length !== 5) {
        setError('Veuillez entrer une date d\'expiration valide (MM/AA)')
        return false
      }
      if (!paymentInfo.carte.cvv || paymentInfo.carte.cvv.length !== 3) {
        setError('Le CVV doit contenir 3 chiffres')
        return false
      }
      if (!paymentInfo.carte.cardName.trim()) {
        setError('Le nom sur la carte est requis')
        return false
      }
    } else if (selectedPayment === 'paypal') {
      if (!paymentInfo.paypal.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentInfo.paypal.email)) {
        setError('Veuillez entrer un email PayPal valide')
        return false
      }
    }

    setError('')
    return true
  }

  // Fonction de succès extraite pour réutilisation
  const handleSuccess = (order) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    clearCart()
    setShowCheckoutPanel(false)
    setShowValidationModal(false)
    navigate('/order-success', {
      state: {
        orderId: order.id,
        total: order.total
      }
    })
  }

  // Polling pour vérifier le statut du paiement
  const startPolling = (orderId) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await api.getOrder(orderId)
        // La structure de réponse dépend de l'API, supposons qu'elle renvoie l'objet commande directement ou dans une propriété
        const order = response.order || response

        if (order.status === 'confirmed' || (order.paymentInfo?.orangeMoney?.orangeMoneyStatus === 'SUCCESS')) {
          clearInterval(pollingIntervalRef.current)
          handleSuccess(order)
        } else if (order.status === 'cancelled' || order.paymentInfo?.orangeMoney?.orangeMoneyStatus === 'FAILED') {
          clearInterval(pollingIntervalRef.current)
          setShowValidationModal(false)
          setError('Le paiement a été annulé ou a échoué. Veuillez réessayer.')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000) // Vérifier toutes les 3 secondes

    // Arrêter le polling après 2 minutes (timeout)
    setTimeout(() => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      if (showValidationModal) {
        setShowValidationModal(false)
        setError('Le délai de validation est dépassé. Veuillez vérifier votre téléphone ou réessayer.')
      }
    }, 120000)
  }

  // Fonction de soumission
  const handleCheckout = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Préparer les items du panier pour l'envoi
      const cartItemsForCheckout = items.map(item => ({
        productId: item.id || item.id,
        id: item.id || item.id,
        _id: item.id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))

      const orderData = {
        items: cartItemsForCheckout,
        deliveryInfo,
        paymentMethod: selectedPayment,
        paymentInfo
      }

      // Mode réel - Créer la commande dans la base de données
      console.log('💳 Mode réel - Création de la commande dans la base de données')
      const response = await api.checkout(orderData)

      if (response.success) {
        // Cas 1: Redirection Web Payment (URL)
        if (response.payment_url) {
          console.log('🔗 Redirection vers Orange Money:', response.payment_url)
          window.location.href = response.payment_url
          return
        }

        // Cas 2: Paiement Direct (Push USSD) - En attente de validation
        // On vérifie si le statut OM est PENDING ou si on a un message de confirmation
        if (selectedPayment === 'orange' && (response.order?.paymentInfo?.orangeMoney?.orangeMoneyStatus === 'PENDING' || response.message?.includes('envoyé'))) {
          console.log('⏳ Paiement en attente de validation sur le téléphone...')
          setPendingOrder(response.order)
          setShowValidationModal(true)
          startPolling(response.order.id)
          return
        }

        // Cas 3: Succès immédiat (Autre méthode ou simulation)
        handleSuccess(response.order)
      } else {
        setError(response.message || 'Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error('Erreur checkout:', error)
      setError(error.message || 'Une erreur est survenue lors de la finalisation de la commande. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Votre panier est vide
        </h1>
        <p className="text-gray-600 mb-8">
          Commencez vos achats en explorant nos catégories
        </p>
        <Link
          to="/menu"
          className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition font-bold"
        >
          Continuer les achats
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-800 mb-12">Votre Panier</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`cart-item-container flex items-center gap-4 p-6 border-b last:border-b-0 transition ${index === 0 ? 'mt-8 mb-6' : 'mt-10 mb-6'
                  }`}
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-item-image w-24 h-24 object-cover rounded-lg"
                />

                {/* Details */}
                <div className="cart-item-details flex-1">
                  <h3 className="cart-item-name font-bold text-lg text-gray-800">
                    {item.name}
                  </h3>
                  <p className="cart-item-price text-primary font-semibold">
                    {item.price.toLocaleString('fr-GN')} GNF
                  </p>
                </div>

                {/* Quantity */}
                <div className="cart-item-footer flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="cart-quantity-btn px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="cart-quantity-value px-4 py-2 font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="cart-quantity-btn px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <p className="cart-item-total font-bold text-lg text-gray-800">
                    {(item.price * item.quantity).toLocaleString('fr-GN')} GNF
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="cart-remove-btn text-red-600 hover:text-red-800 transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 font-semibold transition"
            >
              Vider le panier
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Résumé
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{getTotalPrice().toLocaleString('fr-GN')} GNF</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>Gratuite</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes</span>
                <span>Incluses</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-2xl font-bold text-gray-800">
                <span>Total</span>
                <span className="text-primary">
                  {(getTotalPrice() + (deliveryEstimate?.deliveryFee || 0)).toLocaleString('fr-GN')} GNF
                </span>
              </div>
              {deliveryEstimate?.estimatedTime && (
                <p className="text-sm text-gray-500 mt-2 text-right">
                  Temps estimé: {deliveryEstimate.estimatedTime} min
                </p>
              )}
            </div>

            <button
              onClick={() => setShowCheckoutPanel(true)}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-orange-600 transition font-bold mb-3"
            >
              Passer la commande
            </button>

            <Link
              to="/menu"
              className="block w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-bold text-center"
            >
              Continuer les achats
            </Link>
          </div>
        </div>
      </div>

      {/* Checkout Panel */}
      {showCheckoutPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Finaliser la commande</h2>
              <button
                onClick={() => setShowCheckoutPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Mode de Livraison */}
              <div>
                <DeliveryModeSelector
                  selectedMode={deliveryMode}
                  onModeChange={setDeliveryMode}
                  deliveryAddress={deliveryInfo.address}
                  onEstimateChange={setDeliveryEstimate}
                />
              </div>

              {/* Delivery Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations de livraison</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                    <textarea
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={3}
                      placeholder="Entrez votre adresse complète"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={deliveryInfo.phone}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="+224 XXX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                      <input
                        type="text"
                        value={deliveryInfo.city}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Conakry"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instructions de livraison (optionnel)</label>
                    <textarea
                      value={deliveryInfo.instructions}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, instructions: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={2}
                      placeholder="Ex: Appeler à la porte, code d'accès, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Préférences de goût (optionnel)</label>
                    <textarea
                      value={deliveryInfo.tastePreferences}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, tastePreferences: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={2}
                      placeholder="Ex: Moins d'épices, plus piment, sans oignons, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Méthode de paiement</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock size={14} />
                    <span>Paiement sécurisé</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => setSelectedPayment('orange')}
                    className={`group relative p-5 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${selectedPayment === 'orange'
                      ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg shadow-orange-200/50'
                      : 'border-gray-200 hover:border-orange-300 bg-white hover:bg-orange-50/30'
                      }`}
                  >
                    {selectedPayment === 'orange' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="text-orange-500" size={20} />
                      </div>
                    )}
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${selectedPayment === 'orange' ? 'bg-white shadow-md' : 'bg-orange-50'
                        }`}>
                        <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
                          <rect width="64" height="64" rx="12" fill="#FF6600" />
                          <path d="M16 20C16 18.8955 16.8954 18 18 18H46C47.1046 18 48 18.8955 48 20V44C48 45.1045 47.1046 46 46 46H18C16.8954 46 16 45.1045 16 44V20Z" fill="white" />
                          <path d="M20 24H44V28H20V24Z" fill="#FF6600" />
                          <path d="M20 32H30V36H20V32Z" fill="#FF6600" />
                          <path d="M34 32H44V36H34V32Z" fill="#FF6600" />
                          <path d="M20 40H28V42H20V40Z" fill="#FF6600" />
                          <path d="M32 40H44V42H32V40Z" fill="#FF6600" />
                          <circle cx="24" cy="26" r="2" fill="white" />
                          <circle cx="40" cy="26" r="2" fill="white" />
                        </svg>
                      </div>
                      <span className={`font-semibold ${selectedPayment === 'orange' ? 'text-orange-700' : 'text-gray-700'
                        }`}>Orange Money</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('carte')}
                    className={`group relative p-5 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${selectedPayment === 'carte'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200/50'
                      : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50/30'
                      }`}
                  >
                    {selectedPayment === 'carte' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="text-blue-500" size={20} />
                      </div>
                    )}
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${selectedPayment === 'carte' ? 'bg-white shadow-md' : 'bg-blue-50'
                        }`}>
                        <CreditCard className={selectedPayment === 'carte' ? 'text-blue-600' : 'text-blue-500'} size={32} />
                      </div>
                      <span className={`font-semibold ${selectedPayment === 'carte' ? 'text-blue-700' : 'text-gray-700'
                        }`}>Carte bancaire</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedPayment('paypal')}
                    className={`group relative p-5 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${selectedPayment === 'paypal'
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-lg shadow-indigo-200/50'
                      : 'border-gray-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/30'
                      }`}
                  >
                    {selectedPayment === 'paypal' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="text-indigo-500" size={20} />
                      </div>
                    )}
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${selectedPayment === 'paypal' ? 'bg-white shadow-md' : 'bg-indigo-50'
                        }`}>
                        <Wallet className={selectedPayment === 'paypal' ? 'text-indigo-600' : 'text-indigo-500'} size={32} />
                      </div>
                      <span className={`font-semibold ${selectedPayment === 'paypal' ? 'text-indigo-700' : 'text-gray-700'
                        }`}>PayPal</span>
                    </div>
                  </button>
                </div>

                {/* Payment Details Form - Dynamic based on selection */}
                {selectedPayment && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="text-primary" size={20} />
                      <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                        {selectedPayment === 'orange' && 'Informations Orange Money'}
                        {selectedPayment === 'carte' && 'Informations de carte bancaire'}
                        {selectedPayment === 'paypal' && 'Informations PayPal'}
                      </h4>
                    </div>

                    {/* Orange Money Form */}
                    {selectedPayment === 'orange' && (
                      <div className="space-y-4 fade-in">
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-xl p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <Smartphone className="text-orange-600 dark:text-orange-500 mt-0.5" size={20} />
                            <div>
                              <p className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Paiement via Orange Money</p>
                              <p className="text-sm text-orange-700 dark:text-orange-200">Entrez votre numéro Orange Money pour recevoir la demande de paiement</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Numéro Orange Money <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Smartphone className="text-gray-400" size={20} />
                            </div>
                            <input
                              type="tel"
                              value={paymentInfo.orangeMoney.phoneNumber}
                              onChange={(e) => setPaymentInfo({
                                ...paymentInfo,
                                orangeMoney: { ...paymentInfo.orangeMoney, phoneNumber: e.target.value }
                              })}
                              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-500 font-medium"
                              placeholder="+224 XXX XXX XXX"
                              maxLength="15"
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Format: +224 XXX XXX XXX</p>
                        </div>
                      </div>
                    )}

                    {/* Carte Bancaire Form */}
                    {selectedPayment === 'carte' && (
                      <div className="space-y-4 fade-in">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <Shield className="text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Paiement sécurisé par carte</p>
                              <p className="text-sm text-blue-700 dark:text-blue-200">Vos informations sont cryptées et sécurisées</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Numéro de carte <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <CreditCard className="text-gray-400" size={20} />
                            </div>
                            <input
                              type="text"
                              value={paymentInfo.carte.cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                                const formatted = value.match(/.{1,4}/g)?.join(' ') || value
                                setPaymentInfo({
                                  ...paymentInfo,
                                  carte: { ...paymentInfo.carte, cardNumber: formatted }
                                })
                              }}
                              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-500 font-mono text-lg tracking-wider"
                              placeholder="1234 5678 9012 3456"
                              maxLength="19"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Date d'expiration <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={paymentInfo.carte.expiryDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '')
                                if (value.length >= 2) {
                                  value = value.substring(0, 2) + '/' + value.substring(2, 4)
                                }
                                setPaymentInfo({
                                  ...paymentInfo,
                                  carte: { ...paymentInfo.carte, expiryDate: value }
                                })
                              }}
                              className="w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-500 font-mono"
                              placeholder="MM/AA"
                              maxLength="5"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              CVV <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={paymentInfo.carte.cvv}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').substring(0, 3)
                                  setPaymentInfo({
                                    ...paymentInfo,
                                    carte: { ...paymentInfo.carte, cvv: value }
                                  })
                                }}
                                className="w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-500 font-mono"
                                placeholder="123"
                                maxLength="3"
                                required
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Lock className="text-gray-400" size={16} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Nom sur la carte <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={paymentInfo.carte.cardName}
                            onChange={(e) => setPaymentInfo({
                              ...paymentInfo,
                              carte: { ...paymentInfo.carte, cardName: e.target.value.toUpperCase() }
                            })}
                            className="w-full px-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-500 font-medium uppercase"
                            placeholder="JEAN DUPONT"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2">
                          <Lock size={14} />
                          <span>Vos données sont protégées par un cryptage SSL 256 bits</span>
                        </div>
                      </div>
                    )}

                    {/* PayPal Form */}
                    {selectedPayment === 'paypal' && (
                      <div className="space-y-4 fade-in">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-xl p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <Wallet className="text-indigo-600 dark:text-indigo-400 mt-0.5" size={20} />
                            <div>
                              <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">Paiement via PayPal</p>
                              <p className="text-sm text-indigo-700 dark:text-indigo-200">Vous serez redirigé vers PayPal pour finaliser le paiement</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Email PayPal <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              value={paymentInfo.paypal.email}
                              onChange={(e) => setPaymentInfo({
                                ...paymentInfo,
                                paypal: { ...paymentInfo.paypal, email: e.target.value }
                              })}
                              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder-gray-500"
                              placeholder="votre.email@exemple.com"
                              required
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">L'email associé à votre compte PayPal</p>
                        </div>
                        <div className="bg-indigo-100/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/30 rounded-lg p-3 mt-4">
                          <p className="text-sm text-indigo-800 dark:text-indigo-300">
                            <strong>Note :</strong> Après confirmation, vous serez redirigé vers PayPal pour finaliser votre paiement de manière sécurisée.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Récapitulatif</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Sous-total</span>
                    <span>{getTotalPrice().toLocaleString('fr-GN')} GNF</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Livraison</span>
                    <span>Gratuite</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-xl font-bold text-gray-800 dark:text-white">
                    <span>Total</span>
                    <span className="text-primary">{getTotalPrice().toLocaleString('fr-GN')} GNF</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 fade-in">
                  <div className="flex-shrink-0">
                    <X className="text-red-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-semibold">Erreur</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="flex-shrink-0 text-red-600 hover:text-red-800 transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowCheckoutPanel(false)
                    setError('')
                    setSelectedPayment('')
                    setPaymentInfo({
                      orangeMoney: { phoneNumber: '' },
                      carte: { cardNumber: '', expiryDate: '', cvv: '', cardName: '' },
                      paypal: { email: '' }
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3.5 rounded-xl hover:bg-gray-300 transition font-bold"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCheckout}
                  className={`flex-1 py-3.5 rounded-xl transition-all font-bold flex items-center justify-center gap-2 ${isSubmitting
                    ? 'bg-gray-400 text-white cursor-wait'
                    : selectedPayment && deliveryInfo.address && deliveryInfo.phone
                      ? 'bg-gradient-to-r from-primary to-orange-600 text-white hover:shadow-lg hover:shadow-primary/50 transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  disabled={isSubmitting || !selectedPayment || !deliveryInfo.address || !deliveryInfo.phone}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      <span>Confirmer et payer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal for Direct Push */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <Smartphone className="text-orange-600 dark:text-orange-500 w-10 h-10 animate-pulse" />
              <div className="absolute top-0 right-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-xs font-bold">1</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Vérifiez votre téléphone
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Veuillez saisir votre code PIN Orange Money sur votre téléphone pour valider le paiement de <span className="font-bold text-gray-900 dark:text-white">{pendingOrder?.total?.toLocaleString('fr-GN')} GNF</span>.
            </p>

            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <Loader className="animate-spin w-4 h-4" />
              <span>En attente de validation...</span>
            </div>

            <button
              onClick={() => setShowValidationModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium transition"
            >
              Annuler ou essayer une autre méthode
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
