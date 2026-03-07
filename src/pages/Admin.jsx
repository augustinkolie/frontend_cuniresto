import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { academyData } from '../data/academyData'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'
import TablesManagement from './TablesManagement'
import ChefContentManager from '../components/ChefContentManager'
import DeliveryManagement from '../components/DeliveryManagement'
import CompanyManagement from '../components/CompanyManagement'
import AcademyResourcesManager from '../components/AcademyResourcesManager'
import {
  BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area
} from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Package, ShoppingBag, Users, TrendingUp, Edit2, Trash2, Plus,
  Search, Filter, Download, Eye, Star, DollarSign, Calendar, FileText,
  ArrowUp, ArrowDown, Activity, Award, AlertCircle, CheckCircle, Mail,
  Clock, BarChart3, TrendingDown, Target, Zap, Lightbulb, ChefHat, MessageCircle, BookOpen,
  Table as TableIcon, Video, Truck, Building2, Settings, Coins, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react'

const COLORS = ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [reservations, setReservations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 1024)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalReservations: 0,
    totalUsers: 0,
    totalRevenue: 0,
    todayReservations: 0,
    lowStock: 0
  })

  // Performance Dashboard States
  const [performanceStats, setPerformanceStats] = useState(null)
  const [salesData, setSalesData] = useState(null)
  const [popularityData, setPopularityData] = useState(null)
  const [peakHoursData, setPeakHoursData] = useState(null)
  const [menuOptimization, setMenuOptimization] = useState(null)
  const [performancePeriod, setPerformancePeriod] = useState('30')
  const [performanceLoading, setPerformanceLoading] = useState(false)

  // Comment States
  const [commentStats, setCommentStats] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [positiveComments, setPositiveComments] = useState([])
  const [productStats, setProductStats] = useState([])
  const [allComments, setAllComments] = useState([])
  const [commentsPagination, setCommentsPagination] = useState({ total: 0, page: 1, totalPages: 1 })
  const [commentsSearch, setCommentsSearch] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsPage, setCommentsPage] = useState(1)
  const [commentsLimit] = useState(10)

  // Referral States
  const [referrals, setReferrals] = useState([])
  const [referralStats, setReferralStats] = useState(null)

  // Sales History States
  const [salesHistory, setSalesHistory] = useState(null)
  const [salesHistoryLoading, setSalesHistoryLoading] = useState(false)
  const [salesHistoryFilters, setSalesHistoryFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  })

  // Live Stream State
  const [liveStatus, setLiveStatus] = useState(() => {
    const saved = localStorage.getItem('academy_live_status')
    return saved ? JSON.parse(saved) : { isLive: false, title: '', description: '', viewers: 0, roomId: '', targetCourseId: '' }
  })


  // Start/Stop Live Logic
  const toggleLiveStream = () => {
    if (!liveStatus.isLive) {
      // Validate inputs before starting
      if (!liveStatus.targetCourseId) {
        alert("Veuillez sélectionner un cours pour ce direct.")
        return
      }

      // Generate a unique Room ID for the session
      const roomId = `ISSMV_LIVE_${liveStatus.targetCourseId}_${Date.now()}`

      const newStatus = {
        ...liveStatus,
        isLive: true,
        roomId: roomId,
        viewers: 0
      }
      setLiveStatus(newStatus)
      localStorage.setItem('academy_live_status', JSON.stringify(newStatus))
      window.dispatchEvent(new Event('storage'))
      alert("La salle de classe virtuelle est ouverte ! Votre caméra va s'activer.")
    } else {
      // Stop
      const newStatus = {
        ...liveStatus,
        isLive: false,
        roomId: null,
        viewers: 0
      }
      setLiveStatus(newStatus)
      localStorage.setItem('academy_live_status', JSON.stringify(newStatus))
      window.dispatchEvent(new Event('storage'))
      alert("Le direct est terminé.")
    }
  }

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'plats',
    image: '',
    prepTime: '15 min',
    featured: false,
    stock: 100,
    rating: 0
  })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
      return
    }
    loadData()
    if (activeTab === 'performance') {
      loadPerformanceData()
    }
    if (activeTab === 'salesHistory') {
      loadSalesHistory()
    }
    if (activeTab === 'comments') {
      loadAdminComments()
    }
  }, [user, navigate, activeTab, salesHistoryFilters, commentsPage, commentsSearch])

  const loadAdminComments = async () => {
    setCommentsLoading(true)
    try {
      const response = await api.getAdminComments({
        page: commentsPage,
        limit: commentsLimit,
        search: commentsSearch
      })
      if (response.success) {
        setAllComments(response.comments)
        setCommentsPagination(response.pagination)
      }
    } catch (error) {
      console.error('Erreur chargement admin commentaires:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const loadSalesHistory = async () => {
    setSalesHistoryLoading(true)
    try {
      const response = await api.getSalesHistory(salesHistoryFilters)
      if (response.success) {
        setSalesHistory(response.data)
      }
    } catch (error) {
      console.error('Erreur chargement historique ventes:', error)
    } finally {
      setSalesHistoryLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!salesHistory || !salesHistory.orders.length) {
      alert("Aucune donnée à exporter")
      return
    }

    // Préparer le contenu CSV
    const headers = [
      'ID Commande',
      'Client',
      'Email',
      'Date',
      'Total (GNF)',
      'Statut',
      'Méthode de Paiement',
      'Articles'
    ]

    const csvRows = salesHistory.orders.map(o => {
      const clientName = `${o.User?.prenom || ''} ${o.User?.nom || ''}`.trim() || 'Client inconnu'
      const items = o.items ? o.items.map(i => `${i.name} (x${i.quantity})`).join('; ') : ''
      
      return [
        o.id,
        `"${clientName}"`,
        o.User?.email || 'N/A',
        new Date(o.createdAt).toLocaleDateString('fr-FR'),
        o.total,
        o.status,
        o.paymentMethod || 'N/A',
        `"${items}"`
      ].join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport_ventes_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = () => {
    if (!salesHistory || !salesHistory.orders.length) {
      alert("Aucune donnée à exporter")
      return
    }

    const doc = new jsPDF()
    
    // Titre
    doc.setFontSize(20)
    doc.setTextColor(16, 185, 129) // Emerald-500
    doc.text('Rapport des Ventes - CuniResto', 14, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 30)

    // Résumé statistiques
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`Chiffre d'Affaires Total: ${salesHistory?.summary?.totalRevenue?.toLocaleString('fr-GN')} GNF`, 14, 40)
    doc.text(`Nombre de Commandes: ${salesHistory?.summary?.orderCount || 0}`, 14, 47)
    doc.text(`Panier Moyen: ${salesHistory?.summary?.averageOrderValue?.toLocaleString('fr-GN')} GNF`, 14, 54)

    // Tableau
    const tableColumn = ["ID", "Client", "Date", "Items", "Montant (GNF)", "Statut"]
    const tableRows = salesHistory.orders.map(o => {
      const clientName = `${o.User?.prenom || ''} ${o.User?.nom || ''}`.trim() || 'Client inconnu'
      const itemsCount = o.items?.length || 0
      return [
        o.id.toString().substring(0, 8),
        clientName,
        new Date(o.createdAt).toLocaleDateString('fr-FR'),
        `${itemsCount} article(s)`,
        o.total?.toLocaleString('fr-GN'),
        o.status === 'completed' ? 'Terminé' : o.status === 'pending' ? 'En attente' : 'Annulé'
      ]
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    doc.save(`rapport_ventes_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const loadPerformanceData = async () => {
    setPerformanceLoading(true)
    try {
      const [performanceRes, salesRes, popularityRes, peakHoursRes, optimizationRes] = await Promise.all([
        api.getPerformanceStats(performancePeriod).catch(() => ({ success: false })),
        api.getSalesData(performancePeriod).catch(() => ({ success: false })),
        api.getPopularityData().catch(() => ({ success: false })),
        api.getPeakHours(performancePeriod).catch(() => ({ success: false })),
        api.getMenuOptimization().catch(() => ({ success: false }))
      ])

      if (performanceRes.success) setPerformanceStats(performanceRes.statistics)
      if (salesRes.success) setSalesData(salesRes.sales)
      if (popularityRes.success) setPopularityData(popularityRes.popularity)
      if (peakHoursRes.success) setPeakHoursData(peakHoursRes.peakHours)
      if (optimizationRes.success) setMenuOptimization(optimizationRes.optimization)
    } catch (error) {
      console.error('Erreur chargement données performance:', error)
    } finally {
      setPerformanceLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, reservationsRes, usersRes, commentsRes, referralsRes] = await Promise.all([
        api.getProducts({ limit: 1000 }).catch(err => { console.error('Erreur produits:', err); return { success: false } }),
        api.getAllReservations().catch(err => { console.error('Erreur réservations:', err); return { success: false } }),
        api.getAllUsers().catch(err => { console.error('Erreur utilisateurs:', err); return { success: false } }),
        api.getCommentStatistics().catch(err => { console.error('Erreur com-stats:', err); return { success: false } }),
        api.getAllReferrals().catch(err => { console.error('Erreur parrainages:', err); return { success: false } })
      ])

      if (productsRes.success) {
        const productsList = productsRes.products || []
        setProducts(productsList)
        setStats(prev => ({
          ...prev,
          totalProducts: productsList.length,
          lowStock: productsList.filter(p => p && p.stock < 10).length
        }))
        console.log('✅ Produits chargés (Admin):', productsList.length)
      } else {
        console.error('❌ Échec chargement produits:', productsRes)
      }

      if (reservationsRes.success) {
        const reservationsList = reservationsRes.reservations || []
        setReservations(reservationsList)
        const today = new Date().toDateString()
        const todayRes = reservationsList.filter(r =>
          new Date(r.date).toDateString() === today
        ).length
        setStats(prev => ({
          ...prev,
          totalReservations: reservationsList.length,
          todayReservations: todayRes
        }))
        console.log('✅ Réservations chargées:', reservationsList.length, reservationsList)
      } else {
        console.error('❌ Échec chargement réservations:', reservationsRes)
      }

      console.log('📥 Réponse API utilisateurs:', usersRes)

      if (usersRes && usersRes.success) {
        const usersList = usersRes.users || []
        setUsers(usersList)
        setStats(prev => ({
          ...prev,
          totalUsers: usersList.length
        }))
        console.log('✅ Utilisateurs chargés:', usersList.length, usersList)
      } else if (Array.isArray(usersRes)) {
        // Si l'API retourne directement un tableau
        setUsers(usersRes)
        setStats(prev => ({
          ...prev,
          totalUsers: usersRes.length
        }))
        console.log('✅ Utilisateurs chargés (format tableau):', usersRes.length)
      } else {
        console.error('❌ Erreur chargement utilisateurs:', usersRes)
        console.error('Type de réponse:', typeof usersRes)
        console.error('Contenu:', JSON.stringify(usersRes, null, 2))
        // Afficher un message d'erreur à l'utilisateur
        setUsers([])
        setStats(prev => ({
          ...prev,
          totalUsers: 0
        }))
      }

      // Charger les statistiques de commentaires
      if (commentsRes && commentsRes.success) {
        setCommentStats(commentsRes.statistics)
        setComplaints(commentsRes.complaints || [])
        setPositiveComments(commentsRes.positiveComments || [])
        setProductStats(commentsRes.productStats || [])
      }

      // Charger les parrainages
      if (referralsRes && referralsRes.success) {
        setReferrals(referralsRes.referrals || [])
        setReferralStats(referralsRes.stats)
        console.log('✅ Parrainages chargés:', referralsRes.referrals?.length || 0)
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price === 0 ? '0' : (product.price || ''),
      category: (product.category || 'plats').toLowerCase(),
      image: product.image || '',
      prepTime: product.prepTime || '15 min',
      featured: product.featured || false,
      stock: product.stock === 0 ? '0' : (product.stock || 100),
      rating: product.rating || 0
    })
    setShowProductModal(true)
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'plats',
      image: '',
      prepTime: '15 min',
      featured: false,
      stock: 100,
      rating: 0
    })
    setShowProductModal(true)
  }

  const handleSaveProduct = async () => {
    setLoading(true)
    try {
      const price = parseFloat(productForm.price)
      const stock = parseInt(productForm.stock)

      if (isNaN(price)) {
        alert('Le prix doit être un nombre valide')
        setLoading(false)
        return
      }

      const productData = {
        ...productForm,
        price: price,
        stock: isNaN(stock) ? 0 : stock,
        rating: parseFloat(productForm.rating) || 0,
        category: productForm.category.toLowerCase()
      }

      console.log('Produit à sauvegarder:', productData)

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData)
      } else {
        await api.createProduct(productData)
      }

      await loadData()
      setShowProductModal(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Erreur sauvegarde produit:', error)
      alert(error.message || 'Erreur lors de la sauvegarde du produit')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return

    setCommentsLoading(true)
    try {
      await api.deleteComment(commentId)
      await Promise.all([loadAdminComments(), loadData()])
    } catch (error) {
      console.error('Erreur suppression commentaire:', error)
      alert('Erreur lors de la suppression du commentaire')
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    setLoading(true)
    try {
      await api.deleteProduct(productId)
      await loadData()
    } catch (error) {
      console.error('Erreur suppression produit:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return

    setLoading(true)
    try {
      await api.deleteUser(userId)
      await loadData()
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error)
      alert(error.response?.data?.message || error.message || 'Erreur lors de la suppression de l\'utilisateur')
    } finally {
      setLoading(false)
    }
  }

  // Données pour les graphiques
  const categoryData = products.reduce((acc, product) => {
    if (product && product.category) {
      const category = product.category.toLowerCase().trim()
      if (category) {
        acc[category] = (acc[category] || 0) + 1
      }
    }
    return acc
  }, {})

  const chartData = Object.entries(categoryData)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Number(value)
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  // Debug: afficher les données du graphique
  useEffect(() => {
    if (products.length > 0) {
      console.log('Produits:', products.length)
      console.log('Données catégories:', categoryData)
      console.log('Données graphique:', chartData)
    }
  }, [products.length])

  const ALL_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

  const monthlyReservations = reservations.reduce((acc, res) => {
    const month = new Date(res.date).toLocaleDateString('fr-FR', { month: 'short' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})

  const monthlyData = ALL_MONTHS.map(month => ({
    month,
    reservations: monthlyReservations[month] || 0
  }))

  const topProducts = [...products]
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 5)

  const filteredProducts = products.filter(product => {
    if (!product) return false
    const search = (searchTerm || '').toLowerCase()
    const name = (product.name || '').toLowerCase()
    const category = (product.category || '').toLowerCase()
    return name.includes(search) || category.includes(search)
  })

  console.log('🔍 Debug Products:', { 
    total: products.length, 
    filtered: filteredProducts.length, 
    searchTerm 
  })

  const filteredUsers = users.filter(user => {
    if (!user) return false
    const searchLower = userSearchTerm.toLowerCase()
    return (
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.nom && user.nom.toLowerCase().includes(searchLower)) ||
      (user.prenom && user.prenom.toLowerCase().includes(searchLower))
    )
  })

  const filteredReservations = reservations.filter(res => {
    if (!res) return false
    const searchLower = searchTerm.toLowerCase()
    return (
      (res.prenom && res.prenom.toLowerCase().includes(searchLower)) ||
      (res.nom && res.nom.toLowerCase().includes(searchLower)) ||
      (res.email && res.email.toLowerCase().includes(searchLower)) ||
      (res.telephone && res.telephone.includes(searchLower))
    )
  })

  console.log('🔍 Debug Reservations:', {
    total: reservations.length,
    filtered: filteredReservations.length,
    searchTerm
  })

  const statCards = [
    {
      title: 'Produits',
      value: stats.totalProducts,
      icon: <Package size={24} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%'
    },
    {
      title: 'Réservations',
      value: stats.totalReservations,
      icon: <ShoppingBag size={24} />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: '+8%'
    },
    {
      title: 'Aujourd\'hui',
      value: stats.todayReservations,
      icon: <Calendar size={24} />,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: '+5%'
    },
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      icon: <Users size={24} />,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      change: '+15%'
    },
    {
      title: 'Stock faible',
      value: stats.lowStock,
      icon: <AlertCircle size={24} />,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      change: '-3%'
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#111827] overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
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
          searchTerm={activeTab === 'users' ? userSearchTerm : searchTerm}
          setSearchTerm={activeTab === 'users' ? setUserSearchTerm : setSearchTerm}
          onMenuClick={() => setIsSidebarCollapsed(false)}
        />

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {/* Stats Cards */}
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                {statCards.map((stat, index) => (
                  <div
                    key={index}
                    className="relative bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-row items-center justify-between gap-4"
                  >
                    {/* Badge pourcentage en haut à droite */}
                    <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${stat.change.startsWith('-') ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                      {stat.change.startsWith('-') ? <ArrowDown size={11} strokeWidth={3} /> : <ArrowUp size={11} strokeWidth={3} />}
                      {stat.change}
                    </span>
                    {/* Icône ronde à gauche */}
                    <div className={`w-14 h-14 ${stat.bgColor} rounded-full flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`${stat.color.split(' ')[0].replace('from-', 'text-')}`}>
                        {stat.icon}
                      </div>
                    </div>
                    {/* Label au centre */}
                    <div className="flex-1 text-center">
                      <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {stat.title}
                      </div>
                    </div>
                    {/* Valeur à droite */}
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight text-right">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Content Body */}
            <div className="bg-white dark:bg-[#1a222c] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[600px]">
              {/* Tab Content */}
              <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Chart */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Produits par catégorie
                    </h3>
                    {loading ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      </div>
                    ) : chartData && chartData.length > 0 ? (
                      <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => `${value} produit(s)`}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '8px'
                              }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={36}
                              formatter={(value) => value}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        <Package size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium">Aucun produit disponible</p>
                        <p className="text-sm mt-2">Créez des produits pour voir les statistiques</p>
                      </div>
                    )}
                  </div>

                  {/* Monthly Reservations */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Réservations mensuelles
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar
                          dataKey="reservations"
                          fill="#3B82F6"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={20}
                          name="Réservations"
                        />
                        <Line
                          type="monotone"
                          dataKey="reservations"
                          stroke="#3B82F6"
                          strokeWidth={2.5}
                          dot={{ fill: '#3B82F6', r: 3, strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: '#2563EB' }}
                          name="Tendance"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Star className="text-yellow-500" size={24} />
                    Produits les plus populaires
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {topProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition"
                      >
                        <div className="relative h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={32} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                            #{index + 1}
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {product.rating || 0}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-primary">
                            {product.reviews || 0} avis
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chefs' && (
              <ChefContentManager />
            )}

            {activeTab === 'academy' && (
              <AcademyResourcesManager />
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                {/* Header avec sélecteur de période */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <BarChart3 className="text-primary" size={32} />
                      Tableau de bord des performances
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Analyse complète de vos performances et recommandations d'optimisation
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Période:</label>
                    <select
                      value={performancePeriod}
                      onChange={(e) => {
                        setPerformancePeriod(e.target.value)
                        setTimeout(() => loadPerformanceData(), 100)
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="7">7 derniers jours</option>
                      <option value="30">30 derniers jours</option>
                      <option value="90">90 derniers jours</option>
                      <option value="365">1 an</option>
                    </select>
                  </div>
                </div>

                {performanceLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Cartes de statistiques principales */}
                    {performanceStats && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <ShoppingBag size={32} className="opacity-80" />
                            <ArrowUp size={20} />
                          </div>
                          <div className="text-3xl font-bold mb-1">{performanceStats.reservations?.total || 0}</div>
                          <div className="text-blue-100 text-sm">Réservations totales</div>
                          <div className="mt-2 text-xs opacity-90">
                            Taux de confirmation: {performanceStats.reservations?.confirmationRate || 0}%
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <Star size={32} className="opacity-80" />
                            <TrendingUp size={20} />
                          </div>
                          <div className="text-3xl font-bold mb-1">{performanceStats.comments?.satisfactionRate || 0}%</div>
                          <div className="text-green-100 text-sm">Taux de satisfaction</div>
                          <div className="mt-2 text-xs opacity-90">
                            {performanceStats.comments?.positive || 0} avis positifs
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <Users size={32} className="opacity-80" />
                            <Activity size={20} />
                          </div>
                          <div className="text-3xl font-bold mb-1">{performanceStats.users?.active || 0}</div>
                          <div className="text-purple-100 text-sm">Utilisateurs actifs</div>
                          <div className="mt-2 text-xs opacity-90">
                            {performanceStats.users?.total || 0} nouveaux utilisateurs
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
                          <div className="flex items-center justify-between mb-4">
                            <Package size={32} className="opacity-80" />
                            <AlertCircle size={20} />
                          </div>
                          <div className="text-3xl font-bold mb-1">{performanceStats.products?.lowStock || 0}</div>
                          <div className="text-orange-100 text-sm">Stock faible</div>
                          <div className="mt-2 text-xs opacity-90">
                            {performanceStats.products?.total || 0} produits au total
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Suivi des ventes */}
                    {salesData && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <TrendingUp className="text-primary" size={24} />
                              Suivi des ventes
                              {(!salesData.byDay || salesData.byDay.length === 0) && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-tighter animate-pulse">
                                  Mode Démo
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Évolution des réservations sur {performancePeriod} jours
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-black text-primary">
                              {(!salesData.byDay || salesData.byDay.length === 0) ? "12" : (salesData.totalReservations || 0)}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                              Réservations confirmées
                            </div>
                          </div>
                        </div>
                        <div className="h-[350px] w-full">
                          {(() => {
                            let displayData = salesData.byDay || [];
                            // Fallback mock data if empty
                            if (displayData.length === 0) {
                              const now = new Date();
                              displayData = Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date();
                                d.setDate(now.getDate() - (6 - i));
                                return {
                                  _id: d.toISOString().split('T')[0],
                                  count: [2, 5, 3, 8, 4, 6, 9][i],
                                  totalGuests: [4, 12, 8, 16, 10, 14, 20][i]
                                };
                              });
                            }

                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={displayData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorGuests" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} vertical={false} />
                                  <XAxis
                                    dataKey="_id"
                                    stroke="#6b7280"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    tickFormatter={(val) => {
                                      if (!val) return ''
                                      const d = new Date(val)
                                      return `${d.getDate()}/${d.getMonth() + 1}`
                                    }}
                                  />
                                  <YAxis
                                    stroke="#6b7280"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    allowDecimals={false}
                                  />
                                  <Tooltip
                                    cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    contentStyle={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '12px',
                                      padding: '12px',
                                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    labelFormatter={(val) => val ? new Date(val).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : val}
                                  />
                                  <Legend verticalAlign="top" height={36}/>
                                  <Bar
                                    dataKey="totalGuests"
                                    fill="#3B82F6"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={25}
                                    name="Nombre d'invités"
                                    opacity={0.4}
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="totalGuests"
                                    stroke="none"
                                    fillOpacity={1}
                                    fill="url(#colorGuests)"
                                    name="Volume Invités"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="totalGuests"
                                    stroke="#FF6B35"
                                    strokeWidth={4}
                                    dot={{ fill: '#FF6B35', r: 5, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                    name="Tendance Invités"
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Popularité des plats */}
                    {popularityData && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <ChefHat className="text-primary" size={28} />
                          Popularité des plats
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Top produits par commentaires */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Top 10 par commentaires
                            </h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                              {(() => {
                                let displayComments = popularityData.byComments || [];
                                if (displayComments.length === 0) {
                                  displayComments = [
                                    { productName: "Burger Gourmet Maison", avgRating: 4.9, totalComments: 128, productImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop" },
                                    { productName: "Pizza Truffe & Burrata", avgRating: 4.8, totalComments: 95, productImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop" },
                                    { productName: "Salade César Royale", avgRating: 4.7, totalComments: 84, productImage: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200&h=200&fit=crop" },
                                    { productName: "Tartare de Saumon", avgRating: 4.6, totalComments: 72, productImage: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=200&h=200&fit=crop" },
                                    { productName: "Pâtes Carbonara Originales", avgRating: 4.9, totalComments: 65, productImage: "https://images.unsplash.com/photo-1612459284970-e8f027596582?w=200&h=200&fit=crop" }
                                  ];
                                }
                                return displayComments.slice(0, 10).map((product, index) => (
                                  <div
                                    key={index}
                                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 rounded-2xl border border-gray-100/50 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                                  >
                                    <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-sm">
                                      {product.productImage ? (
                                        <img src={product.productImage} alt={product.productName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                                          <ChefHat size={24} className="text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-black text-gray-900 dark:text-white truncate text-base mb-0.5">
                                        {product.productName}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-sm font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                                          <Star size={12} className="fill-yellow-500" />
                                          {product.avgRating}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                          {product.totalComments} avis
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded">Rank</span>
                                      <div className="text-2xl font-black text-gray-900 dark:text-white">
                                        #{index + 1}
                                      </div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          {/* Produits les mieux notés */}
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Produits les mieux notés
                            </h4>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                              {(() => {
                                let displayRated = popularityData.topRated || [];
                                if (displayRated.length === 0) {
                                  displayRated = [
                                    { name: "Entrecôte Maturée", rating: 5.0, reviews: 45, image: "https://images.unsplash.com/photo-1546248136-2473c7788b95?w=200&h=200&fit=crop" },
                                    { name: "Risotto aux Cèpes", rating: 4.9, reviews: 38, image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200&h=200&fit=crop" },
                                    { name: "Tiramisu Maison", rating: 4.9, reviews: 52, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&h=200&fit=crop" }
                                  ];
                                }
                                return displayRated.slice(0, 10).map((product, index) => (
                                  <div
                                    key={index}
                                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 rounded-2xl border border-gray-100/50 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
                                  >
                                    <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-sm">
                                      {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                                          <ChefHat size={24} className="text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-black text-gray-900 dark:text-white truncate text-base mb-0.5">
                                        {product.name}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-sm font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                          <Award size={12} className="text-emerald-500" />
                                          {product.rating || 0}
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                          {product.reviews || 0} avis
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <Star className="text-yellow-500 fill-yellow-500" size={20} />
                                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">Haut rang</div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Heures de forte affluence */}
                    {peakHoursData && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <Clock className="text-primary" size={28} />
                          Heures de forte affluence
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                              Répartition par heure
                              {(!peakHoursData.byHour || peakHoursData.byHour.length === 0) && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                                  Démo
                                </span>
                              )}
                            </h4>
                            <ResponsiveContainer width="100%" height={300}>
                              {(() => {
                                let displayData = peakHoursData.byHour || [];
                                if (displayData.length === 0) {
                                  // Mock peak hours: peaks at 12h-14h and 19h-22h
                                  displayData = Array.from({ length: 15 }).map((_, i) => {
                                    const hour = 9 + i;
                                    let val = 0;
                                    if (hour >= 12 && hour <= 14) val = [15, 25, 18][hour - 12];
                                    else if (hour >= 19 && hour <= 22) val = [20, 35, 30, 15][hour - 19];
                                    else val = Math.floor(Math.random() * 5);
                                    return { _id: hour, totalReservations: val };
                                  });
                                }
                                return (
                                  <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                                    <XAxis
                                      dataKey="_id"
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                                      tickFormatter={(val) => `${val}h`}
                                      dy={10}
                                    />
                                    <YAxis
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fill: '#6b7280', fontSize: 11 }}
                                      allowDecimals={false}
                                    />
                                    <Tooltip
                                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                      labelFormatter={(val) => `${val}:00`}
                                    />
                                    <Bar
                                      dataKey="totalReservations"
                                      fill="#3B82F6"
                                      radius={[6, 6, 0, 0]}
                                      maxBarSize={16}
                                      name="Réservations"
                                      opacity={0.8}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="totalReservations"
                                      stroke="#3B82F6"
                                      strokeWidth={2}
                                      dot={{ fill: '#3B82F6', r: 3, strokeWidth: 0 }}
                                      name="Tendance"
                                    />
                                  </ComposedChart>
                                );
                              })()}
                            </ResponsiveContainer>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
                              Heures de pointe
                            </h4>
                            <div className="space-y-4">
                              {(() => {
                                let displayPeaks = peakHoursData.topPeakHours || [];
                                if (displayPeaks.length === 0) {
                                  displayPeaks = [
                                    { hour: 20, reservations: 35, guests: 72 },
                                    { hour: 21, reservations: 30, guests: 58 },
                                    { hour: 13, reservations: 25, guests: 45 }
                                  ];
                                }
                                return displayPeaks.map((peak, index) => (
                                  <div
                                    key={index}
                                    className="group bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                        #{index + 1}
                                      </div>
                                      <div>
                                        <div className="text-xl font-black text-gray-900 dark:text-white">
                                          {peak.hour}:00
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                          {peak.reservations} réservations • {peak.guests} invités
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <div className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                                        <Target size={14} /> Peak
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-medium">Affluence max</div>
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Analyse automatique pour optimiser le menu */}
                    {menuOptimization && (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                          <Lightbulb className="text-primary" size={28} />
                          Analyse automatique - Optimisation du menu
                        </h3>
                        <div className="space-y-6">
                          {(() => {
                            let displayRecs = menuOptimization.recommendations || [];
                            if (displayRecs.length === 0) {
                              displayRecs = [
                                { type: 'promote', title: "Promotion suggérée", message: "Le 'Burger Gourmet Maison' a un taux de conversion exceptionnel.", action: "Mettre en avant sur la page d'accueil ou proposer en suggestion du jour." },
                                { type: 'review', title: "Révision stratégique", message: "Le 'Risotto aux Cèpes' est très apprécié mais sa marge brute est à optimiser.", action: "Une légère révision de prix ou une optimisation des coûts de revient est conseillée." },
                                { type: 'remove', title: "Rotation du menu", message: "Certains articles comme la 'Soupe de Saison' présentent une baisse d'intérêt.", action: "Envisagez de les remplacer par de nouvelles créations pour dynamiser la carte." }
                              ];
                            }
                            return displayRecs.map((rec, index) => (
                              <div
                                key={index}
                                className={`rounded-xl p-6 border-2 shadow-sm hover:shadow-md transition-all duration-300 ${rec.type === 'promote'
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : rec.type === 'review'
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                  }`}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`p-3 rounded-lg ${rec.type === 'promote'
                                    ? 'bg-green-500 text-white'
                                    : rec.type === 'review'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-red-500 text-white'
                                    }`}>
                                    {rec.type === 'promote' ? (
                                      <TrendingUp size={24} />
                                    ) : rec.type === 'review' ? (
                                      <AlertCircle size={24} />
                                    ) : (
                                      <Package size={24} />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                      {rec.title}
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">
                                      {rec.message}
                                    </p>
                                    <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                        <Lightbulb size={16} className="text-yellow-500" /> Action recommandée:
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {rec.action}
                                      </p>
                                    </div>
                                  {rec.products && rec.products.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {rec.products.slice(0, 6).map((product, pIndex) => (
                                        <div
                                          key={pIndex}
                                          className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                                              {product.productImage || product.image ? (
                                                <img
                                                  src={product.productImage || product.image}
                                                  alt={product.productName || product.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                  <ChefHat size={16} className="text-gray-400" />
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                {product.productName || product.name}
                                              </div>
                                              {product.avgRating && (
                                                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                  {product.avgRating}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'salesHistory' && (
              <div className="space-y-6">
                {/* Summary View */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                        <DollarSign size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Chiffre d'Affaires
                      </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">
                      {salesHistory?.summary?.totalRevenue?.toLocaleString('fr-GN')} GNF
                    </div>
                    <div className="text-gray-500 text-[10px] font-medium uppercase tracking-tight">Période sélectionnée</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <ShoppingBag size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Ventes Totales
                      </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">
                      {salesHistory?.summary?.orderCount || 0}
                    </div>
                    <div className="text-gray-500 text-[10px] font-medium uppercase tracking-tight">Commandes validées</div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        Panier Moyen
                      </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">
                      {salesHistory?.summary?.averageOrderValue?.toLocaleString('fr-GN')} GNF
                    </div>
                    <div className="text-gray-500 text-[10px] font-medium uppercase tracking-tight">Par commande</div>
                  </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between items-end gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Date Début</label>
                        <input
                          type="date"
                          value={salesHistoryFilters.startDate}
                          onChange={(e) => setSalesHistoryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Date Fin</label>
                        <input
                          type="date"
                          value={salesHistoryFilters.endDate}
                          onChange={(e) => setSalesHistoryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Statut</label>
                        <select
                          value={salesHistoryFilters.status}
                          onChange={(e) => setSalesHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="all">Tous les statuts</option>
                          <option value="pending">En attente</option>
                          <option value="completed">Terminé</option>
                          <option value="cancelled">Annulé</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadReport}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition flex items-center gap-2 font-bold shrink-0"
                        title="Exporter en CSV"
                      >
                        <Download size={18} />
                        CSV
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition flex items-center gap-2 font-bold shrink-0"
                        title="Exporter en PDF"
                      >
                        <FileText size={18} />
                        PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* History Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText size={18} className="text-primary" />
                      Détails de l'historique
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50">
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Client</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Articles</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Montant</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {salesHistoryLoading ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                              Chargement de l'historique...
                            </td>
                          </tr>
                        ) : salesHistory?.orders?.length > 0 ? (
                          salesHistory.orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-gray-400">
                                #{order.id.toString().substring(0, 8)}...
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-gray-900 dark:text-white">
                                  {order.User?.prenom} {order.User?.nom}
                                </div>
                                <div className="text-xs text-gray-500">{order.User?.email}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                  {order.items?.length || 0} article(s)
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="font-black text-gray-900 dark:text-white">
                                  {order.total?.toLocaleString('fr-GN')}
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">GNF</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                                    : order.status === 'pending'
                                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                                      : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                  }`}>
                                  {order.status === 'completed' ? 'Terminé' : order.status === 'pending' ? 'En attente' : 'Annulé'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              Aucune commande trouvée sur cette période.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'products' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex-1">
                    {/* Header search is used instead */}
                  </div>
                  <button
                    onClick={handleCreateProduct}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition flex items-center gap-2 font-semibold"
                  >
                    <Plus size={20} />
                    Nouveau produit
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Image</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Nom</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Catégorie</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Prix</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Stock</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                        >
                          <td className="py-3 px-4">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package size={20} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900 dark:text-white">{product.name}</div>
                            {product.featured && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                En vedette
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 capitalize">
                            {product.category}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-primary">
                              {product.price?.toLocaleString('fr-GN')} GNF
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stock < 10
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : product.stock < 50
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                              {product.stock} unités
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h3>
                    <button
                      onClick={loadData}
                      disabled={loading}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Activity size={18} className={loading ? 'animate-spin' : ''} />
                      {loading ? 'Chargement...' : 'Actualiser'}
                    </button>
                  </div>
                  <div className="flex-1">
                    {/* Header search used instead */}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total: <span className="font-bold text-gray-900 dark:text-white">{users.length}</span> utilisateur(s)
                        {users.length === 0 && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                            (Vérifiez la console pour les détails)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Admins: <span className="font-bold text-primary">{users.filter(u => u.role === 'admin').length}</span> |
                        Clients: <span className="font-bold text-green-600">{users.filter(u => u.role === 'user').length}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Utilisateur</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Téléphone</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Rôle</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Date d'inscription</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement des utilisateurs...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((userItem) => (
                          <tr
                            key={userItem.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                                  {userItem.prenom?.[0]}{userItem.nom?.[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">
                                    {userItem.prenom} {userItem.nom}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-700 dark:text-gray-300">{userItem.email}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-gray-700 dark:text-gray-300">{userItem.telephone || '-'}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${userItem.role === 'admin'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}>
                                {userItem.role === 'admin' ? 'Administrateur' : 'Client'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 text-sm">
                              {userItem.createdAt
                                ? new Date(userItem.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                                : 'N/A'}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                {(userItem.id) !== (user?.id || user?.id) && (
                                  <button
                                    onClick={() => handleDeleteUser(userItem.id)}
                                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                                    title="Supprimer l'utilisateur"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                                {(userItem.id) === (user?.id || user?.id) && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    Vous
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-12 text-center text-gray-500 dark:text-gray-400">
                            <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p>Aucun utilisateur trouvé</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reservations' && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Toutes les réservations</h3>
                <div className="space-y-4">
                  {filteredReservations.length > 0 ? (
                    filteredReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition"
                      >
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
                              <Users className="text-gray-500 dark:text-gray-400" size={18} />
                              <span className="text-gray-700 dark:text-gray-300">
                                {reservation.prenom} {reservation.nom} - {reservation.guests} personne(s)
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="text-gray-500 dark:text-gray-400" size={18} />
                              <span className="text-gray-700 dark:text-gray-300">{reservation.email}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${reservation.status === 'confirmed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : reservation.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                              {reservation.status === 'confirmed' ? 'Confirmée' :
                                reservation.status === 'pending' ? 'En attente' : 'Annulée'}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{reservation.time}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                      <Calendar size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium">Aucune réservation trouvée</p>
                      <p className="text-sm">Les réservations apparaîtront ici une fois créées.</p>
                    </div>
                  )}
                </div>
              </div>
            )
            }

            {
              activeTab === 'tables' && (
                <TablesManagement />
              )
            }

            {
              activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Header Actions */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Rechercher par auteur, produit ou contenu..."
                        value={commentsSearch}
                        onChange={(e) => {
                          setCommentsSearch(e.target.value)
                          setCommentsPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadData}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        title="Actualiser les stats"
                      >
                        <Activity size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Statistiques globales (Mini) */}
                  {commentStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-lg">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Positifs</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{commentStats.positive}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Négatifs</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{commentStats.negative}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-500 rounded-lg">
                          <Star size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Moyen</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">
                            {(allComments.reduce((acc, c) => acc + c.rating, 0) / (allComments.length || 1)).toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                          <Mail size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{commentsPagination.total}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Table des commentaires */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/50">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Auteur</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Commentaire</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase tracking-widest text-center">Statut</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 border-none uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {commentsLoading ? (
                            <tr>
                              <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                                Chargement des commentaires...
                              </td>
                            </tr>
                          ) : allComments.length > 0 ? (
                            allComments.map((comment) => (
                              <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white dark:border-gray-800">
                                      {comment.user?.profileImage ? (
                                        <img src={comment.user.profileImage} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase">
                                          {comment.user?.prenom?.[0]}{comment.user?.nom?.[0]}
                                        </span>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-gray-900 dark:text-white truncate">
                                        {comment.user?.prenom} {comment.user?.nom}
                                      </div>
                                      <div className="text-xs text-gray-500 truncate">{comment.user?.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                  <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 italic">
                                    "{comment.content}"
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tighter bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">
                                    {comment.Product?.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    comment.rating >= 4 
                                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                                      : comment.rating === 3
                                        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                                        : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                  }`}>
                                    {comment.rating >= 4 ? 'Approuvé' : comment.rating === 3 ? 'En attente' : 'Spam'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                                    {new Date(comment.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                  <div className="text-[10px] text-gray-500 uppercase">
                                    {new Date(comment.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button 
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                Aucun commentaire trouvé.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-tight">
                        Affichage de <span className="font-bold text-gray-900 dark:text-white">{(commentsPage - 1) * commentsLimit + 1}</span> à <span className="font-bold text-gray-900 dark:text-white">{Math.min(commentsPage * commentsLimit, commentsPagination.total)}</span> sur <span className="font-bold text-gray-900 dark:text-white">{commentsPagination.total}</span> entrées
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCommentsPage(prev => Math.max(1, prev - 1))}
                          disabled={commentsPage === 1 || commentsLoading}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-400 transition"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        
                        {Array.from({ length: Math.min(5, commentsPagination.totalPages) }).map((_, i) => {
                          let pageNum = i + 1;
                          // Basic pagination logic to show current page around middle if totalPages > 5
                          if (commentsPagination.totalPages > 5 && commentsPage > 3) {
                            pageNum = commentsPage - 2 + i;
                            if (pageNum + (4 - i) > commentsPagination.totalPages) {
                              pageNum = commentsPagination.totalPages - 4 + i;
                            }
                          }
                          
                          if (pageNum > 0 && pageNum <= commentsPagination.totalPages) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCommentsPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                  commentsPage === pageNum
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          return null;
                        })}

                        <button
                          onClick={() => setCommentsPage(prev => Math.min(commentsPagination.totalPages, prev + 1))}
                          disabled={commentsPage === commentsPagination.totalPages || commentsLoading}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-400 transition"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {
              activeTab === 'deliveries' && (
                <DeliveryManagement />
              )
            }

            {
              activeTab === 'companies' && (
                <CompanyManagement />
              )
            }

            {
              activeTab === 'referrals' && (
                <div className="space-y-6">
                  {/* Statistiques des parrainages */}
                  {referralStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total parrainages</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{referralStats.total}</p>
                          </div>
                          <Users size={32} className="text-blue-500" />
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">En attente</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{referralStats.pending}</p>
                          </div>
                          <Clock size={32} className="text-yellow-500" />
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Complétés</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{referralStats.completed}</p>
                          </div>
                          <CheckCircle size={32} className="text-green-500" />
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Points attribués</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{referralStats.totalPointsGiven}</p>
                          </div>
                          <Award size={32} className="text-purple-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Liste des parrainages */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award className="text-primary" size={24} />
                        Liste des parrainages
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Suivi de tous les parrainages et récompenses attribuées
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Parrain
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Filleul
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Points Parrain
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Points Filleul
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {loading ? (
                            <tr>
                              <td colSpan="7" className="px-6 py-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                              </td>
                            </tr>
                          ) : referrals.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                <Award size={48} className="mx-auto mb-4 text-gray-400" />
                                <p>Aucun parrainage enregistré pour le moment</p>
                              </td>
                            </tr>
                          ) : (
                            referrals.map((referral) => (
                              <tr key={referral.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Users className="text-primary" size={20} />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {referral.referrer?.prenom} {referral.referrer?.nom}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {referral.referrer?.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                                      <Users className="text-accent" size={20} />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {referral.referred?.prenom} {referral.referred?.nom}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {referral.referred?.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary font-mono">
                                    {referral.referralCode}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {referral.status === 'pending' && (
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                      <Clock size={12} className="mr-1" />
                                      En attente
                                    </span>
                                  )}
                                  {referral.status === 'completed' && (
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                      <CheckCircle size={12} className="mr-1" />
                                      Complété
                                    </span>
                                  )}
                                  {referral.status === 'rewarded' && (
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                      <Award size={12} className="mr-1" />
                                      Récompensé
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {referral.referrerReward.points > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                        +{referral.referrerReward.points}
                                      </span>
                                      <Coins className="text-yellow-500" size={16} />
                                      {referral.referrerReward.rewardedAt && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(referral.referrerReward.rewardedAt).toLocaleDateString('fr-FR')}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {referral.referredReward.points > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                        +{referral.referredReward.points}
                                      </span>
                                      <Coins className="text-yellow-500" size={16} />
                                      {referral.referredReward.rewardedAt && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(referral.referredReward.rewardedAt).toLocaleDateString('fr-FR')}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(referral.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Détails des récompenses */}
                  {referralStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Award className="text-green-600 dark:text-green-400" size={24} />
                          Points Parrains
                        </h4>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300 mb-2">
                          {referralStats.totalReferrerPoints} points
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total des points attribués aux parrains ({referralStats.completed} parrainages complétés × 500 points)
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Award className="text-blue-600 dark:text-blue-400" size={24} />
                          Points Filleuls
                        </h4>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                          {referralStats.totalReferredPoints} points
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total des points attribués aux filleuls ({referralStats.completed} parrainages complétés × 300 points)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            }



            {activeTab === 'live' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold dark:text-white">Studio de Direction - Live Academy</h2>
                  <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${liveStatus.isLive ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-gray-100 text-gray-500'
                    }`}>
                    <div className={`w-3 h-3 rounded-full ${liveStatus.isLive ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                    {liveStatus.isLive ? 'EN DIRECT' : 'HORS LIGNE'}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Control Panel */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                      <Settings size={20} className="text-primary" />
                      Configuration du Live
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cours concerné *</label>
                        <select
                          value={liveStatus.targetCourseId || ''}
                          onChange={(e) => setLiveStatus({ ...liveStatus, targetCourseId: parseInt(e.target.value) })}
                          className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={liveStatus.isLive}
                        >
                          <option value="">Sélectionner un cours...</option>
                          {academyData.courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Le direct sera visible uniquement pour les élèves de ce cours.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre de la session</label>
                        <input
                          type="text"
                          value={liveStatus.title}
                          onChange={(e) => setLiveStatus({ ...liveStatus, title: e.target.value })}
                          placeholder="Ex: Masterclass Lapin Braisé"
                          className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={liveStatus.isLive}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optionnel)</label>
                        <textarea
                          value={liveStatus.description}
                          onChange={(e) => setLiveStatus({ ...liveStatus, description: e.target.value })}
                          placeholder="Détails sur ce que les élèves vont apprendre..."
                          className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white h-24 resize-none"
                          disabled={liveStatus.isLive}
                        />
                      </div>

                      <div className="pt-4">
                        {liveStatus.isLive && (
                          <div className="mb-4 aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-red-500">
                            <iframe
                              src={`https://meet.jit.si/${liveStatus.roomId}`}
                              allow="camera; microphone; fullscreen; display-capture; autoplay"
                              className="w-full h-full"
                              title="Broadcaster View"
                            ></iframe>
                          </div>
                        )}

                        <button
                          onClick={toggleLiveStream}
                          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] ${liveStatus.isLive
                            ? 'bg-gray-900 text-white hover:bg-black'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30'
                            }`}
                        >
                          {liveStatus.isLive ? (
                            <>
                              <Video size={24} className="text-gray-400" />
                              ARRÊTER LE DIRECT
                            </>
                          ) : (
                            <>
                              <Video size={24} />
                              LANCER LE DIRECT
                            </>
                          )}
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-2">
                          {liveStatus.isLive
                            ? "Le direct est en cours. Les élèves peuvent le voir dans leur Studio."
                            : "En cliquant sur Lancer, une notification sera envoyée aux élèves."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview / Instructions */}
                  <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2 text-red-500 font-bold tracking-widest text-sm">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          APERÇU STUDIO
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{liveStatus.title || "Titre de la session..."}</h3>
                        <p className="text-gray-300 text-sm line-clamp-3">{liveStatus.description || "Aucune description définie."}</p>
                      </div>

                      <div className="mt-8 flex gap-4">
                        <div className="flex-1 bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                          <div className="text-xl font-bold">{liveStatus.viewers}</div>
                          <div className="text-xs text-gray-400">SPECTATEURS</div>
                        </div>
                        <div className="flex-1 bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                          <div className="text-xl font-bold">00:00:00</div>
                          <div className="text-xs text-gray-400">DURÉE</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
    </div>

      {/* Product Modal */}
      {showProductModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowProductModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-primary to-accent p-6 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-white">
                {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Nom du produit"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none resize-none"
                  placeholder="Description du produit"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Prix (GNF) *
                  </label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="plats">Plats</option>
                    <option value="lapin">Lapin</option>
                    <option value="atieke">Atiéké</option>
                    <option value="nouille">Nouille</option>
                    <option value="sandwich">Sandwich</option>
                    <option value="boissons">Boissons</option>
                    <option value="desserts">Desserts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Temps de préparation
                  </label>
                  <input
                    type="text"
                    value={productForm.prepTime}
                    onChange={(e) => setProductForm({ ...productForm, prepTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                    placeholder="15 min"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  URL de l'image
                </label>
                <input
                  type="url"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="featured" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Produit en vedette
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveProduct}
                  disabled={loading || !productForm.name || !productForm.price}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-xl hover:shadow-lg transition font-semibold disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : editingProduct ? 'Modifier' : 'Créer'}
                </button>
                <button
                  onClick={() => {
                    setShowProductModal(false)
                    setEditingProduct(null)
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
