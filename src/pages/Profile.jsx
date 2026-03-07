import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Calendar, Camera, Edit2, Save, X,
  ShoppingBag, Heart, Clock, Settings, LogOut, Award, Star,
  TrendingUp, Package, CheckCircle, XCircle, AlertCircle,
  CreditCard, Truck, FileText, Bell, Gift, Home as HomeIcon,
  ChevronRight, ArrowUp
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorite } from '../context/FavoriteContext'
import { api, getFullImageUrl } from '../utils/api'
import { Link } from 'react-router-dom'
import DeliveryTrackingModal from '../components/DeliveryTrackingModal'
import ProfileSidebar from '../components/ProfileSidebar'
import AdminHeader from '../components/AdminHeader'
import '../styles/animations.css'

export default function Profile() {
  const { user, updateUser, logout } = useAuth()
  const { getTotalItems } = useCart()
  const { favorites, getFavoriteCount } = useFavorite()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const coverFileInputRef = useRef(null)

  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [profileImage, setProfileImage] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [reservations, setReservations] = useState([])
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [deliveries, setDeliveries] = useState({}) // Stocker les livraisons par orderId
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
    dateNaissance: user?.dateNaissance || '',
    avis: user?.avis || ''
  })

  useEffect(() => {
    setMounted(true)
    if (user) {
      loadReservations()
      loadOrders()
    }

    // Vérifier si on doit ouvrir l'onglet commandes depuis la redirection
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab === 'orders') {
      setActiveTab('orders')
    }
  }, [user])

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        email: user?.email || '',
        telephone: user?.telephone || '',
        adresse: user?.adresse || '',
        dateNaissance: user?.dateNaissance || '',
        avis: user?.avis || ''
      })
      // Toujours charger l'image depuis user.profileImage pour garantir la persistance
      if (user?.profileImage) {
        // Construire l'URL complète si c'est un chemin relatif
        const imageUrl = user.profileImage.startsWith('http') || user.profileImage.startsWith('/uploads')
          ? user.profileImage.startsWith('http')
            ? user.profileImage
            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${user.profileImage}`
          : user.profileImage
        setProfileImage(imageUrl)
      } else {
        setProfileImage(null)
      }

      // Charger l'image de couverture
      if (user?.coverImage) {
        const imageUrl = user.coverImage.startsWith('http') || user.coverImage.startsWith('/uploads')
          ? user.coverImage.startsWith('http')
            ? user.coverImage
            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${user.coverImage}`
          : user.coverImage
        setCoverImage(imageUrl)
      } else {
        setCoverImage(null)
      }
    }
  }, [user])

  // Recharger les commandes quand on change d'onglet vers "orders"
  useEffect(() => {
    if (activeTab === 'orders' && user && !ordersLoading) {
      console.log('🔄 Onglet commandes activé, chargement des commandes...')
      loadOrders()
    }
  }, [activeTab, user])

  const loadReservations = async () => {
    try {
      const response = await api.getReservations()
      if (response.success) {
        setReservations(response.reservations || [])
      }
    } catch (error) {
      console.error('Erreur chargement réservations:', error)
    }
  }

  const loadOrders = async () => {
    if (!user) {
      console.log('⚠️ Utilisateur non connecté, impossible de charger les commandes')
      setOrders([])
      return
    }

    setOrdersLoading(true)
    try {
      console.log('📦 Chargement des commandes pour l\'utilisateur:', user.email)
      console.log('📦 User ID:', user.id)

      const response = await api.getUserOrders()
      console.log('📥 Réponse complète API:', response)

      // Gérer différents formats de réponse
      let ordersList = []
      if (response) {
        // Si response.success existe et est true
        if (response.success === true) {
          ordersList = response.orders || []
          console.log('✅ Commandes chargées (success=true):', ordersList.length)
        }
        // Si response.success n'existe pas mais response.orders existe
        else if (response.orders && Array.isArray(response.orders)) {
          ordersList = response.orders
          console.log('✅ Commandes chargées (format orders):', ordersList.length)
        }
        // Si response est directement un tableau
        else if (Array.isArray(response)) {
          ordersList = response
          console.log('✅ Commandes chargées (tableau direct):', ordersList.length)
        }
        // Si response.success est false
        else if (response.success === false) {
          console.warn('⚠️ API retourne success: false', response.message)
          ordersList = []
        }
        // Format inattendu
        else {
          console.warn('⚠️ Format de réponse inattendu:', response)
          ordersList = []
        }
      } else {
        console.warn('⚠️ Réponse vide ou null')
        ordersList = []
      }

      setOrders(Array.isArray(ordersList) ? ordersList : [])

      // Charger les livraisons pour chaque commande
      if (ordersList.length > 0) {
        loadDeliveriesForOrders(ordersList)
      }
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error)
      console.error('Détails:', error.message)
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadDeliveriesForOrders = async (ordersList) => {
    try {
      console.log('🔄 Chargement des livraisons pour', ordersList.length, 'commandes')
      const deliveriesResponse = await api.getDeliveries()
      console.log('📥 Réponse API livraisons:', deliveriesResponse)

      if (deliveriesResponse && deliveriesResponse.success) {
        const deliveriesList = deliveriesResponse.deliveries || []
        const deliveriesMap = {}

        console.log('📦 Nombre de livraisons reçues:', deliveriesList.length)

        deliveriesList.forEach(delivery => {
          // Gérer différents formats : delivery.order peut être un ObjectId ou un objet
          const orderId = delivery.order?.id || delivery.order

          if (orderId) {
            const orderIdStr = orderId.toString()
            deliveriesMap[orderIdStr] = delivery
            console.log('✅ Livraison associée à la commande:', orderIdStr)
          } else {
            console.warn('⚠️ Livraison sans order ID:', delivery)
          }
        })

        setDeliveries(deliveriesMap)
        console.log('✅ Livraisons chargées:', Object.keys(deliveriesMap).length)
        console.log('📋 Map des livraisons:', deliveriesMap)
      } else {
        console.warn('⚠️ Pas de livraisons trouvées ou réponse invalide')
      }
    } catch (error) {
      console.error('❌ Erreur chargement livraisons:', error)
      console.error('Détails:', error.message)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop grande. Veuillez choisir une image de moins de 5MB.')
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Type d\'image non supporté. Veuillez sélectionner une image JPEG, PNG, GIF ou WebP.')
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setLoading(true)
    try {
      // Uploader l'image sur le serveur
      const response = await api.uploadProfileImage(file)

      if (response && response.success) {
        // Mettre à jour l'image avec l'URL complète du serveur
        const imageUrl = response.profileImage && (response.profileImage.startsWith('http') || response.profileImage.startsWith('/uploads'))
          ? response.profileImage.startsWith('http')
            ? response.profileImage
            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${response.profileImage}`
          : response.profileImage || null
        setProfileImage(imageUrl)

        // Mettre à jour le contexte utilisateur
        if (response.user) {
          updateUser(response.user)
        }

        // Afficher un message de succès
        console.log('Image uploadée avec succès')
      } else {
        const errorMessage = response?.message || 'Erreur lors de l\'upload de l\'image'
        console.error('Erreur upload:', errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Erreur upload image:', error)
      // Extraire le message d'erreur
      const errorMessage = error?.message || error?.response?.data?.message || 'Erreur lors de l\'upload de l\'image. Veuillez réessayer.'
      alert(errorMessage)
    } finally {
      setLoading(false)
      // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop grande. Veuillez choisir une image de moins de 5MB.')
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = ''
      }
      return
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Type d\'image non supporté. Veuillez sélectionner une image JPEG, PNG, GIF ou WebP.')
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = ''
      }
      return
    }

    setLoading(true)
    try {
      const response = await api.uploadCoverImage(file)

      if (response && response.success) {
        const imageUrl = response.coverImage && (response.coverImage.startsWith('http') || response.coverImage.startsWith('/uploads'))
          ? response.coverImage.startsWith('http')
            ? response.coverImage
            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${response.coverImage}`
          : response.coverImage || null
        setCoverImage(imageUrl)

        if (response.user) {
          updateUser(response.user)
        }
      } else {
        const errorMessage = response?.message || 'Erreur lors de l\'upload de l\'image'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Erreur upload couverture:', error)
      const errorMessage = error?.message || 'Erreur lors de l\'upload de l\'image'
      alert(errorMessage)
    } finally {
      setLoading(false)
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    console.log('💾 Tentative de sauvegarde du profil...', formData)
    setLoading(true)
    try {
      // Préparer les données à envoyer au serveur (sans l'image, elle est déjà uploadée)
      const profileData = {
        ...formData
        // profileImage n'est pas inclus car il est déjà uploadé via handleImageUpload
      }

      // Appeler l'API pour sauvegarder sur le serveur
      const response = await api.updateProfile(profileData)
      console.log('📥 Réponse du serveur après sauvegarde:', response)

      if (response.success) {
        // Mettre à jour le contexte avec les données du serveur
        updateUser(response.user)
        setIsEditing(false)
        setShowProfileModal(false)
        alert('Profil mis à jour avec succès !')
        window.location.reload()
      } else {
        console.error('Erreur sauvegarde:', response.message)
        alert(response.message || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert(error.message || 'Erreur lors de la sauvegarde du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
      adresse: user?.adresse || '',
      dateNaissance: user?.dateNaissance || '',
      avis: user?.avis || ''
    })
    // Restaurer l'image depuis user.profileImage pour garantir la persistance
    if (user?.profileImage) {
      setProfileImage(user.profileImage)
    } else {
      setProfileImage(null)
    }
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getMemberSince = () => {
    let dateToUse = null

    // Essayer de récupérer la date depuis createdAt
    if (user?.createdAt) {
      try {
        const date = new Date(user.createdAt)
        // Vérifier que la date est valide et n'est pas dans le futur
        if (!isNaN(date.getTime()) && date <= new Date()) {
          dateToUse = date
        }
      } catch (error) {
        console.error('Erreur formatage date:', error)
      }
    }

    // Si pas de date valide, utiliser la date actuelle comme fallback
    if (!dateToUse) {
      dateToUse = new Date()
    }

    // Formater la date en français
    const month = dateToUse.toLocaleDateString('fr-FR', { month: 'short' })
    const year = dateToUse.getFullYear()

    // S'assurer que l'année n'est pas dans le futur (sécurité supplémentaire)
    const currentYear = new Date().getFullYear()
    const displayYear = year > currentYear ? currentYear : year

    return `${month} ${displayYear}`
  }

  const stats = [
    {
      label: 'Commandes',
      value: reservations.length,
      icon: <ShoppingBag size={20} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Favoris',
      value: getFavoriteCount(),
      icon: <Heart size={20} />,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      label: 'Panier',
      value: getTotalItems(),
      icon: <Package size={20} />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Membre depuis',
      value: getMemberSince(),
      icon: <Calendar size={20} />,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ]

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock size={14} /> },
      confirmed: { label: 'Confirmée', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle size={14} /> },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle size={14} /> },
      completed: { label: 'Terminée', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <CheckCircle size={14} /> }
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color} `}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#111827] overflow-hidden">
      {/* Sidebar */}
      <ProfileSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <AdminHeader 
          activeTab={activeTab} 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onMenuClick={() => setIsSidebarCollapsed(false)}
        />

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {/* Header Section (LinkedIn-Style) - Only visible on Dashboard tab */}
            {activeTab === 'dashboard' && (
              <div className={`relative bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl mb-8 overflow-hidden transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} `}>
                {/* Banner Background */}
                <div className="h-48 md:h-64 relative overflow-hidden group/banner">
                  {coverImage ? (
                    <img 
                      src={coverImage} 
                      alt="Banner" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200')] bg-cover bg-center"></div>
                  )}
                  <div className="absolute inset-0 bg-black/20"></div>
                  
                  {/* Change Cover Button */}
                  <button
                    onClick={() => coverFileInputRef.current?.click()}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/30 flex items-center gap-2 opacity-0 group-hover/banner:opacity-100"
                  >
                    <Camera size={14} />
                    Changer la couverture
                  </button>
                  <input
                    type="file"
                    ref={coverFileInputRef}
                    onChange={handleCoverImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Profile Information Section */}
                <div className="px-8 pb-8 flex flex-col md:flex-row items-end md:items-center justify-between gap-6 -mt-12 md:-mt-14 relative z-10">
                  <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full md:w-auto">
                    {/* Overlapping Profile Image */}
                    <div className="relative group">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-white dark:ring-[#1a222c] shadow-2xl transform transition-transform duration-300 group-hover:scale-105 cursor-pointer bg-gray-200 dark:bg-gray-700"
                      >
                        {profileImage ? (
                          <img
                            src={profileImage.startsWith('http') ? profileImage : getFullImageUrl(profileImage)}
                            alt={user?.prenom || "Profile"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <User size={48} md:size={64} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={24} className="text-white" />
                        </div>
                      </button>
                    </div>

                    {/* User Details (Lower section) */}
                    <div className="text-center md:text-left mb-2">
                      <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                        {user?.prenom} {user?.nom}
                      </h1>
                      <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Mail size={14} />
                          {user?.email}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 hidden md:block"></span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Phone size={14} />
                          {user?.telephone || 'Non renseigné'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Award size={12} />
                          Client Privilégié
                        </span>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle size={12} />
                          Compte Vérifié
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="flex-1 md:flex-none bg-primary hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl transition shadow-lg hover:shadow-primary/30 flex items-center justify-center space-x-2 font-bold text-sm tracking-wide"
                    >
                      <Edit2 size={18} />
                      <span>Modifier le profil</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-[#1a222c] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group pointer-events-none"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`text-2xl ${stat.textColor} transition-transform group-hover:scale-110`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white dark:bg-[#1a222c] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 min-h-[600px] animate-in fade-in duration-700">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bienvenue, {user?.prenom} !</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Gérez vos informations personnelles, suivez vos commandes et réservations, et explorez vos favoris.
                    </p>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700 cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('orders')}>
                      <div className="flex items-center justify-between mb-2">
                        <ShoppingBag className="text-green-600 dark:text-green-400" size={24} />
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">{orders.length}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Commandes</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">Cliquez pour voir →</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('reservations')}>
                      <div className="flex items-center justify-between mb-2">
                        <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{reservations.length}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Réservations</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Cliquez pour voir →</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 rounded-xl p-6 border border-red-200 dark:border-red-700 cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('favorites')}>
                      <div className="flex items-center justify-between mb-2">
                        <Heart className="text-red-600 dark:text-red-400" size={24} />
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">{getFavoriteCount()}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Favoris</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Cliquez pour voir →</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center justify-between mb-2">
                        <Package className="text-purple-600 dark:text-purple-400" size={24} />
                        <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{getTotalItems()}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Articles au panier</p>
                    </div>
                  </div>

                  {/* User Details Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Vos informations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{user?.telephone || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rôle</p>
                        <p className="font-semibold text-primary capitalize">{user?.role === 'admin' ? 'Administrateur' : 'Client'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab === 'info' || activeTab === 'settings') && (
                <div className="max-w-3xl">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Informations personnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border transition ${isEditing
                          ? 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          } focus: outline-none text-gray-900 dark: text-white`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border transition ${isEditing
                          ? 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          } focus: outline-none text-gray-900 dark: text-white`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border transition ${isEditing
                          ? 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          } focus: outline-none text-gray-900 dark: text-white`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border transition ${isEditing
                          ? 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          } focus: outline-none text-gray-900 dark: text-white`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Adresse</label>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border transition ${isEditing
                          ? 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          } focus: outline-none text-gray-900 dark: text-white`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date de naissance</label>
                      <input
                        type="date"
                        name="dateNaissance"
                        value={formData.dateNaissance}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 rounded-xl border transition ${isEditing
                          ? 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                          } focus: outline-none text-gray-900 dark: text-white`}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-xl hover:shadow-lg transition flex items-center space-x-2 font-semibold disabled:opacity-50"
                      >
                        <Save size={20} />
                        <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center space-x-2 font-semibold"
                      >
                        <X size={20} />
                        <span>Annuler</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Mes commandes
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Suivez l'état de vos commandes et consultez l'historique
                      </p>
                    </div>
                    <button
                      onClick={loadOrders}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
                    >
                      <Clock size={18} />
                      Actualiser
                    </button>
                  </div>

                  {/* Debug Panel-Temporaire */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                    <p className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">🔍 Informations de débogage :</p>
                    <div className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
                      <p>• Utilisateur connecté : {user ? '✅ Oui' : '❌ Non'}</p>
                      <p>• User ID : {user?.id || 'N/A'}</p>
                      <p>• Email : {user?.email || 'N/A'}</p>
                      <p>• Nombre de commandes : <strong>{orders.length}</strong></p>
                      <p>• Chargement : {ordersLoading ? '⏳ En cours...' : '✅ Terminé'}</p>
                      <p>• Onglet actif : <strong>{activeTab}</strong></p>
                    </div>
                  </div>

                  {ordersLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Chargement des commandes...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingBag size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Aucune commande pour le moment</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                        {user ? 'Vous n\'avez pas encore passé de commande.' : 'Connectez-vous pour voir vos commandes.'}
                      </p>
                      <Link to="/menu" className="inline-block bg-primary text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition font-semibold">
                        Découvrir notre menu
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                  Commande #{order.id.slice(-8).toUpperCase()}
                                </h4>
                                <button
                                  onClick={() => setSelectedOrderForTracking(order)}
                                  className="text-primary hover:text-orange-600 transition text-sm font-semibold flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-lg hover:bg-primary/20"
                                >
                                  <Truck size={16} />
                                  Suivre la commande
                                </button>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                    order.status === 'preparing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                                      order.status === 'ready' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                        order.status === 'out_for_delivery' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                          order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  } `}>
                                  {order.status === 'pending' ? 'En attente' :
                                    order.status === 'confirmed' ? 'Confirmée' :
                                      order.status === 'preparing' ? 'En préparation' :
                                        order.status === 'ready' ? 'Prête' :
                                          order.status === 'out_for_delivery' ? 'En livraison' :
                                            order.status === 'delivered' ? 'Livrée' :
                                              'Annulée'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>

                              {/* Informations de livraison */}
                              {(() => {
                                const delivery = deliveries[order.id] || deliveries[order.id?.toString()]
                                if (!delivery) return null

                                return (
                                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Truck className="text-blue-600 dark:text-blue-400" size={18} />
                                      <span className="font-semibold text-blue-900 dark:text-blue-300">Informations de livraison</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                          Temps estimé: <strong>{delivery.estimatedTime} min</strong>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Package size={14} className="text-gray-500" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                          Mode: <strong>
                                            {delivery.deliveryMode === 'express' ? 'Express' :
                                              delivery.deliveryMode === 'click_collect' ? 'Click & Collect' :
                                                'Standard'}
                                          </strong>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-500" />
                                        <span className="text-gray-700 dark:text-gray-300 text-xs">
                                          {delivery.deliveryAddress?.street || 'Adresse non disponible'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          delivery.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                            delivery.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                              delivery.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                                                delivery.status === 'picked_up' ? 'bg-indigo-100 text-indigo-800' :
                                                  delivery.status === 'in_transit' ? 'bg-cyan-100 text-cyan-800' :
                                                    delivery.status === 'arrived' ? 'bg-orange-100 text-orange-800' :
                                                      delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                          } `}>
                                          {delivery.status === 'pending' ? 'En attente' :
                                            delivery.status === 'preparing' ? 'En préparation' :
                                              delivery.status === 'ready' ? 'Prête' :
                                                delivery.status === 'assigned' ? 'Livreur assigné' :
                                                  delivery.status === 'picked_up' ? 'Récupérée' :
                                                    delivery.status === 'in_transit' ? 'En route' :
                                                      delivery.status === 'arrived' ? 'Arrivée' :
                                                        delivery.status === 'delivered' ? 'Livrée' :
                                                          delivery.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* Livreur assigné (Manuel ou Système) */}
                              {(() => {
                                const delivery = deliveries[order.id] || deliveries[order.id?.toString()]
                                const manualDriver = order.deliveryStatus?.driver
                                const systemDriver = delivery?.deliveryPerson

                                // Priorité au driver manuel s'il a un nom, sinon système
                                const driver = (manualDriver && manualDriver.name) ? manualDriver : systemDriver

                                if (!driver) return null

                                const driverName = driver.name || `${driver.nom || ''} ${driver.prenom || ''}`.trim()
                                const driverPhone = driver.phone || driver.telephone
                                const driverVehicle = driver.vehicle || 'Véhicule de livraison'
                                const driverAvatar = driver.avatar || driver.profileImage // profileImage pour systemDriver

                                return (
                                  <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-3">
                                      <User className="text-purple-600 dark:text-purple-400" size={18} />
                                      <span className="font-semibold text-purple-900 dark:text-purple-300">Livreur assigné</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-200 flex items-center justify-center">
                                          {driverAvatar ? (
                                            <img
                                              src={driverAvatar.startsWith('http') ? driverAvatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${driverAvatar}`}
                                              alt="Livreur"
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <User className="text-gray-500" size={24} />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-bold text-gray-900 dark:text-white text-sm">
                                            {driverName}
                                          </p>
                                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                            <Truck size={12} />
                                            <span>{driverVehicle}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {driverPhone && (
                                        <a
                                          href={`tel:${driverPhone}`}
                                          className="flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition transform hover:scale-110"
                                          title="Appeler le livreur"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Phone size={20} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {order.total.toLocaleString('fr-GN')} GNF
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {order.items.length} {order.items.length > 1 ? 'articles' : 'article'}
                              </p>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Articles commandés :</h5>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-16 h-16 object-cover rounded-lg"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Quantité: {item.quantity} × {item.price.toLocaleString('fr-GN')} GNF
                                    </p>
                                  </div>
                                  <p className="font-bold text-gray-900 dark:text-white">
                                    {(item.price * item.quantity).toLocaleString('fr-GN')} GNF
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery Info */}
                          {order.deliveryInfo && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <MapPin size={18} />
                                Adresse de livraison
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.deliveryInfo.address}
                                {order.deliveryInfo.city && `, ${order.deliveryInfo.city} `}
                              </p>
                              {order.deliveryInfo.phone && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                                  <Phone size={14} />
                                  {order.deliveryInfo.phone}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Payment Info */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <CreditCard size={16} />
                              <span className="font-semibold">Paiement :</span>
                              <span className="capitalize">
                                {order.paymentMethod === 'orange' ? 'Orange Money' :
                                  order.paymentMethod === 'carte' ? 'Carte bancaire' :
                                    'PayPal'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reservations' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mes réservations</h3>
                  {reservations.length > 0 ? (
                    <div className="space-y-4">
                      {reservations.map((reservation) => (
                        <div key={reservation.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Calendar className="text-primary" size={20} />
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {new Date(reservation.date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mb-2">
                                <Clock className="text-gray-500 dark:text-gray-400" size={18} />
                                <span className="text-gray-700 dark:text-gray-300">{reservation.time}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <User className="text-gray-500 dark:text-gray-400" size={18} />
                                <span className="text-gray-700 dark:text-gray-300">{reservation.guests} personne(s)</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(reservation.status)}
                              {reservation.message && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs text-right">
                                  {reservation.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Calendar size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">Aucune réservation pour le moment</p>
                      <Link to="/reservation" className="mt-4 inline-block bg-primary text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition font-semibold">
                        Faire une réservation
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mes favoris</h3>
                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-xl transition transform hover:scale-105"
                        >
                          <div className="relative h-48 bg-gray-200 dark:bg-gray-600">
                            <img
                              src={product.image || '/placeholder.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{product.name}</h4>
                            <p className="text-primary font-bold text-lg">
                              {product.price?.toLocaleString('fr-GN')} GNF
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Heart size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">Aucun favori pour le moment</p>
                      <Link to="/products" className="inline-block bg-primary text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition font-semibold">
                        Découvrir nos produits
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-primary via-orange-500 to-accent p-8 rounded-t-3xl">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition backdrop-blur-sm"
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-bold text-white mb-2">Modifier le profil</h2>
              <p className="text-white/90">Mettez à jour vos informations personnelles</p>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Large Profile Image */}
                <div className="flex-shrink-0">
                  <div className="relative group mb-6">
                    <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-2xl">
                      {profileImage ? (
                        <img
                          src={profileImage.startsWith('http')
                            ? profileImage
                            : getFullImageUrl(profileImage)
                          }
                          alt={user?.prenom || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <User size={120} className="text-primary" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-4 right-4 bg-primary text-white p-4 rounded-full hover:bg-orange-600 transition shadow-xl hover:scale-110 transform flex items-center gap-2"
                    >
                      <Camera size={20} />
                      <span className="font-semibold">Changer</span>
                    </button>

                  </div>

                  {/* Zone d'avis sous l'image */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Star size={18} className="text-primary" />
                      Votre avis
                    </label>
                    <textarea
                      name="avis"
                      value={formData.avis}
                      onChange={handleInputChange}
                      placeholder="Partagez votre expérience avec nous, vos suggestions ou vos commentaires..."
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none transition resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formData.avis?.length || 0} caractères
                    </p>
                  </div>
                </div>

                {/* User Info Form */}
                <div className="flex-1">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {user?.prenom} {user?.nom}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Mail size={18} />
                      {user?.email}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Nom
                        </label>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Prénom
                        </label>
                        <input
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        placeholder="+224 XX XXX XX XX"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Adresse
                      </label>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleInputChange}
                        placeholder="Votre adresse complète"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        name="dateNaissance"
                        value={formData.dateNaissance}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={async () => {
                        await handleSave()
                        setShowProfileModal(false)
                      }}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center space-x-2 font-semibold disabled:opacity-50"
                    >
                      <Save size={20} />
                      <span>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                    </button>
                    <button
                      onClick={() => {
                        handleCancel()
                        setShowProfileModal(false)
                      }}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de suivi de livraison */}
      {selectedOrderForTracking && (
        <DeliveryTrackingModal
          order={selectedOrderForTracking}
          delivery={deliveries[selectedOrderForTracking.id] || deliveries[selectedOrderForTracking.id?.toString()]}
          onClose={() => setSelectedOrderForTracking(null)}
        />
      )}
      <input
        id="profile-upload-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )
}
