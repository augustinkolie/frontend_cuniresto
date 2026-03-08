import axios from 'axios'

// Import axios pour les uploads de fichiers
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
})

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api')
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000

// Créer une instance axios
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('📤 Requête API:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => Promise.reject(error)
)

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  response => response.data, // Retourner directement les données
  error => {
    // Erreur réseau (serveur non accessible)
    if (!error.response) {
      return Promise.reject({
        success: false,
        message: 'Erreur de connexion. Vérifiez que le serveur est démarré sur http://localhost:8000'
      })
    }

    if (error.response?.status === 401) {
      // Token expiré, déconnecter l'utilisateur
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // Retourner l'erreur formatée
    return Promise.reject({
      success: false,
      message: error.response?.data?.message || error.message || 'Une erreur est survenue',
      ...error.response?.data
    })
  }
)

export default apiClient

// Fonctions utilitaires API
export const api = {
  // Produits
  getProducts: (params) => apiClient.get('/products', { params }),
  getProduct: (id) => apiClient.get(`/products/${id}`),
  getProductsByCategory: (category) => apiClient.get(`/products/category/${category}`),
  createProduct: (productData) => apiClient.post('/products', productData),
  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),

  // Catégories
  getCategories: () => apiClient.get('/categories'),

  // Authentification
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData)
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (profileData) => apiClient.put('/auth/profile', profileData),
  uploadProfileImage: async (file) => {
    try {
      const formData = new FormData()
      formData.append('profileImage', file)
      const token = localStorage.getItem('authToken')

      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await axiosInstance.post('/auth/profile/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000 // 60 secondes pour les uploads
      })

      return response.data
    } catch (error) {
      console.error('Erreur upload image:', error)

      // Gérer les erreurs réseau
      if (!error.response) {
        throw {
          success: false,
          message: 'Erreur de connexion. Vérifiez que le serveur est démarré.'
        }
      }

      // Gérer les erreurs du serveur
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        throw {
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.'
        }
      }

      // Retourner l'erreur formatée
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'upload de l\'image'
      }
    }
  },
  uploadCoverImage: async (file) => {
    try {
      const formData = new FormData()
      formData.append('coverImage', file)
      const token = localStorage.getItem('authToken')

      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await axiosInstance.post('/auth/profile/upload-cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000
      })

      return response.data
    } catch (error) {
      console.error('Erreur upload couverture:', error)
      if (!error.response) {
        throw { success: false, message: 'Erreur de connexion. Vérifiez que le serveur est démarré.' }
      }
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'upload de la couverture'
      }
    }
  },
  uploadFile: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('authToken')

    // Utiliser axiosInstance pour gérer correctement le multipart/form-data
    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    })
    return response.data
  },
  googleLogin: async (token) => {
    const response = await apiClient.post('/auth/google', { token })
    if (response.success && response.token) {
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  verifyCode: (email, code) => apiClient.post('/auth/verify-code', { email, code }),
  resetPassword: (token, email, password) => apiClient.post('/auth/reset-password', { token, email, password }),
  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },

  // Contact
  contactUs: (data) => apiClient.post('/contact', data),

  // Panier
  getCart: () => apiClient.get('/cart'),
  addToCart: (productId, quantity = 1) => apiClient.post('/cart/items', { productId, quantity }),
  removeFromCart: (itemId) => apiClient.delete(`/cart/items/${itemId}`),
  updateCartItem: (itemId, quantity) => apiClient.put(`/cart/items/${itemId}`, { quantity }),
  clearCart: () => apiClient.delete('/cart'),
  checkout: (orderData) => apiClient.post('/cart/checkout', orderData),
  getUserOrders: () => apiClient.get('/cart/orders'),

  // Commentaires
  getComments: (productId, params = {}) => apiClient.get(`/comments/product/${productId}`, { params }),
  addComment: (productId, commentData) => {
    // Si productId n'est pas un ObjectId valide, on peut quand même essayer
    return apiClient.post(`/comments/product/${productId}`, commentData)
  },
  updateComment: (commentId, commentData) => apiClient.put(`/comments/${commentId}`, commentData),
  deleteComment: (commentId) => apiClient.delete(`/comments/${commentId}`),
  getAdminComments: (params = {}) => apiClient.get('/comments/admin/all', { params }),
  getCommentStatistics: () => apiClient.get('/comments/admin/statistics'),
  likeComment: (commentId) => apiClient.post(`/comments/${commentId}/like`),
  likeReply: (commentId, replyId) => apiClient.post(`/comments/${commentId}/replies/${replyId}/like`),
  replyToComment: (commentId, content) => apiClient.post(`/comments/${commentId}/reply`, { content }),

  // Notifications
  getNotifications: () => apiClient.get('/notifications'),
  markNotificationAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => apiClient.put('/notifications/read-all'),

  // Chef Content (Tutoriels & Lives)
  getChefContents: (params = {}) => apiClient.get('/chef-content', { params }),
  getChefContent: (id) => apiClient.get(`/chef-content/${id}`),
  createChefContent: (formData) => {
    return axiosInstance.post('/chef-content', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateChefContent: (id, formData) => {
    return axiosInstance.put(`/chef-content/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteChefContent: (id) => apiClient.delete(`/chef-content/${id}`),
  likeChefContent: (id) => apiClient.post(`/chef-content/${id}/like`),
  getLiveContents: () => apiClient.get('/chef-content/live/active'),

  // Réservations
  createReservation: (reservationData) => apiClient.post('/reservations', reservationData),
  getReservations: () => apiClient.get('/reservations/my-reservations'),
  getAllReservations: () => apiClient.get('/reservations'),
  updateReservationStatus: (id, status) => apiClient.put(`/reservations/${id}/status`, { status }),

  // Messages
  getConversations: () => apiClient.get('/messages/conversations'),
  createConversation: (participantId) => apiClient.post('/messages/conversations', { participantId }),
  createGroupConversation: (name, participants) => apiClient.post('/messages/conversations/group', { name, participants }),
  
  // Calls
  initiateCall: (conversationId, receiverId, callType) => 
    apiClient.post('/calls/initiate', { conversationId, receiverId, callType }),
  updateCallStatus: (callId, status, duration = null) => 
    apiClient.patch(`/calls/${callId}/status`, { status, duration }),

  getMessages: (conversationId, page = 1, limit = 50) =>
    apiClient.get(`/messages/conversations/${conversationId}/messages`, { params: { page, limit } }),
  sendMessage: (conversationId, content, files, replyTo = null, replyToModel = 'Message') => {
    console.log('📤 API: Envoi message pour conv:', conversationId, 'fichiers:', files?.length, 'replyTo:', replyTo, 'model:', replyToModel)
    const formData = new FormData()
    formData.append('content', content || '')
    if (replyTo) {
      formData.append('replyTo', replyTo)
      formData.append('replyToModel', replyToModel)
    }

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        console.log(`📎 API: Ajout fichier ${index}:`, file.name, file.type, file.size)
        formData.append('attachments', file)
      })
    }
    const token = localStorage.getItem('authToken')
    return axiosInstance.post(`/messages/conversations/${conversationId}/messages`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      console.log('✅ API: Réponse envoi message:', res.data.success ? 'Succès' : 'Échec')
      return res.data
    }).catch(err => {
      console.error('❌ API: Erreur envoi message:', err.response?.data || err.message)
      throw err
    })
  },
  getUsers: () => apiClient.get('/messages/users'),
  markMessageAsRead: (messageId) => apiClient.put(`/messages/messages/${messageId}/read`),
  deleteMessage: (messageId) => apiClient.delete(`/messages/messages/${messageId}`),
  deleteConversation: (conversationId) => apiClient.delete(`/messages/conversations/${conversationId}`),
  starMessage: (messageId) => apiClient.put(`/messages/messages/${messageId}/star`),
  addReaction: (messageId, emoji) => apiClient.put(`/messages/messages/${messageId}/react`, { emoji }),
  togglePinMessage: (conversationId, messageId) => apiClient.put(`/messages/conversations/${conversationId}/messages/${messageId}/pin`),
  deleteCall: (callId) => apiClient.delete(`/calls/${callId}`),
  getConversationMedia: (conversationId) => apiClient.get(`/messages/conversations/${conversationId}/media`),
  updateConversationSettings: (conversationId, settings) => apiClient.put(`/messages/conversations/${conversationId}/settings`, settings),

  // Utilisateurs (Admin uniquement)
  getAllUsers: async () => {
    try {
      console.log('🌐 Appel API getAllUsers...')
      const response = await apiClient.get('/users')
      console.log('📦 Réponse brute getAllUsers:', response)

      // S'assurer que la réponse a le bon format
      if (response && response.success !== undefined) {
        console.log('✅ Format correct avec success:', response.success, 'Utilisateurs:', response.users?.length || 0)
        return response
      }
      // Si la réponse est directement un tableau
      if (Array.isArray(response)) {
        console.log('✅ Format tableau,', response.length, 'utilisateurs')
        return { success: true, users: response }
      }
      // Si la réponse contient users
      if (response.users) {
        console.log('✅ Format avec users,', response.users.length, 'utilisateurs')
        return { success: true, users: response.users }
      }
      console.warn('⚠️ Format de réponse inattendu:', response)
      return { success: false, users: [], message: 'Format de réponse inattendu' }
    } catch (error) {
      console.error('❌ Erreur getAllUsers:', error)
      console.error('Détails erreur:', error.response?.data || error.message)
      return {
        success: false,
        users: [],
        message: error.response?.data?.message || error.message || 'Erreur lors du chargement des utilisateurs'
      }
    }
  },
  getUser: (id) => apiClient.get(`/users/${id}`),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  updateUserRole: (id, role) => apiClient.put(`/users/${id}/role`, { role }),

  // Blocage utilisateurs
  getBlockedUsers: () => apiClient.get('/users/blocked'),
  blockUser: (userId) => apiClient.post(`/users/block/${userId}`),
  unblockUser: (userId) => apiClient.post(`/users/unblock/${userId}`),
  toggleFavorite: (userId) => apiClient.post(`/users/favorites/toggle/${userId}`),
  getFavorites: () => apiClient.get('/users/favorites'),

  // Chat
  getChatWelcome: () => apiClient.get('/chat/welcome'),
  sendChatMessage: (message, conversationHistory = []) =>
    apiClient.post('/chat/message', { message, conversationHistory }),

  // Analytics & Performance
  getPerformanceStats: (period = '30') => apiClient.get(`/analytics/performance?period=${period}`),
  getSalesData: (period = '30') => apiClient.get(`/analytics/sales?period=${period}`),
  getPopularityData: () => apiClient.get('/analytics/popularity'),
  getPeakHours: (period = '30') => apiClient.get(`/analytics/peak-hours?period=${period}`),
  getMenuOptimization: () => apiClient.get('/analytics/menu-optimization'),
  getSalesHistory: (params = {}) => apiClient.get('/analytics/sales-history', { params }),

  // Tables & QR Code
  getTables: () => apiClient.get('/tables'),
  createTable: (tableData) => apiClient.post('/tables', tableData),
  generateTableQRCode: (tableId) => apiClient.post(`/tables/${tableId}/qrcode`),
  getTableByQRCode: (qrCode) => apiClient.get(`/tables/qrcode/${qrCode}`),
  createTableOrder: (qrCode, orderData) => apiClient.post(`/tables/${qrCode}/order`, orderData),
  callWaiter: (qrCode) => apiClient.post(`/tables/${qrCode}/call-waiter`),
  getTableOrders: (tableId) => apiClient.get(`/tables/${tableId}/orders`),
  updateOrderStatus: (orderId, status) => apiClient.put(`/tables/orders/${orderId}/status`, { status }),
  getWaiterCalls: () => apiClient.get('/tables/waiter/calls'),
  acknowledgeWaiterCall: (orderId) => apiClient.put(`/tables/waiter/calls/${orderId}/acknowledge`),
  updateTableStatus: (tableId, status) => apiClient.put(`/tables/${tableId}/status`, { status }),
  deleteTable: (tableId) => apiClient.delete(`/tables/${tableId}`),

  // Loyalty & Fidelity
  getLoyaltyPoints: () => apiClient.get('/loyalty/points'),
  getLoyaltyTransactions: () => apiClient.get('/loyalty/transactions'),
  getRewards: () => apiClient.get('/loyalty/rewards'),
  redeemReward: (rewardId) => apiClient.post(`/loyalty/rewards/${rewardId}/redeem`),
  useReferralCode: (code) => apiClient.post('/loyalty/referral/use', { referralCode: code }),
  getReferralInfo: () => apiClient.get('/loyalty/referral'),
  generateReferralCode: () => apiClient.post('/loyalty/referral/generate'),
  requestCashback: (amount, orangeMoneyNumber) => apiClient.post('/loyalty/cashback/request', { amount, orangeMoneyNumber }),

  // Admin Loyalty
  getLoyaltyStatistics: () => apiClient.get('/loyalty/admin/statistics'),
  createReward: (rewardData) => apiClient.post('/loyalty/admin/rewards', rewardData),
  getAllRewards: () => apiClient.get('/loyalty/admin/rewards'),
  getAllReferrals: () => apiClient.get('/loyalty/admin/referrals'),

  // Livraisons
  getDeliveries: (params = {}) => apiClient.get('/delivery', { params }),
  getDelivery: (id) => apiClient.get(`/delivery/${id}`),
  createDelivery: (deliveryData) => apiClient.post('/delivery', deliveryData),
  updateDeliveryStatus: (id, status, location, message) => apiClient.put(`/delivery/${id}/status`, { status, location, message }),
  assignDeliveryPerson: (id, deliveryPersonId, deliveryPersonDetails = null) => apiClient.put(`/delivery/${id}/assign`, { deliveryPersonId, deliveryPersonDetails }),
  updateDeliveryTracking: (id, lat, lng, address) => apiClient.post(`/delivery/${id}/tracking`, { lat, lng, address }),
  getActiveDeliveries: () => apiClient.get('/delivery/delivery-person/active'),
  estimateDelivery: (deliveryMode, distance, address) => apiClient.post('/delivery/estimate', { deliveryMode, distance, address }),

  // Entreprises (Corporate)
  getCompanies: () => apiClient.get('/company'),
  getCompany: (id) => apiClient.get(`/company/${id}`),
  createCompany: (companyData) => apiClient.post('/company', companyData),
  updateCompany: (id, companyData) => apiClient.put(`/company/${id}`, companyData),
  addEmployee: (companyId, employeeData) => apiClient.post(`/company/${companyId}/employees`, employeeData),
  removeEmployee: (companyId, employeeId) => apiClient.delete(`/company/${companyId}/employees/${employeeId}`),
  getCompanyOrders: (companyId, params = {}) => apiClient.get(`/company/${companyId}/orders`, { params }),
  getCompanyInvoices: (companyId, params = {}) => apiClient.get(`/company/${companyId}/invoices`, { params }),
  createCorporateOrder: (companyId, orderData) => apiClient.post(`/company/${companyId}/orders`, orderData),
  generateInvoice: (companyId, startDate, endDate) => apiClient.post(`/company/${companyId}/invoices/generate`, { startDate, endDate }),

  getCallHistory: (conversationId) => apiClient.get(`/calls/conversation/${conversationId}`),
}

export const getFullImageUrl = (path) => {
  if (!path || typeof path !== 'string') return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'
    return `${baseUrl}${path}`
  }
  return path
}
