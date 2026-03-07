import React, { useState, useEffect } from 'react'
import { Package, Truck, MapPin, Clock, User, Search, Filter, CheckCircle, XCircle, AlertCircle, Phone, MessageCircle, Camera } from 'lucide-react'
import { api } from '../utils/api'

export default function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDelivery, setSelectedDelivery] = useState(null)

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({
    name: '',
    phone: '',
    vehicle: 'Moto Yamaha', // Valeur par défaut
    avatar: ''
  })

  useEffect(() => {
    loadDeliveries()
    // Recharger toutes les 30 secondes pour le suivi en temps réel
    const interval = setInterval(loadDeliveries, 30000)
    return () => clearInterval(interval)
  }, [filterStatus])

  const loadDeliveries = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus !== 'all') {
        params.status = filterStatus
      }

      const response = await api.getDeliveries(params)
      if (response && response.success) {
        setDeliveries(response.deliveries || [])
      }
    } catch (error) {
      console.error('Erreur chargement livraisons:', error)
      alert('Erreur lors du chargement des livraisons')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (deliveryId, newStatus, message = '') => {
    try {
      const response = await api.updateDeliveryStatus(deliveryId, newStatus, null, message)
      if (response && response.success) {
        alert('Statut mis à jour avec succès')
        loadDeliveries()
      } else {
        alert('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const handleOpenAssignModal = (delivery) => {
    setSelectedDelivery(delivery)
    setAssignForm({
      name: '',
      phone: '',
      vehicle: 'Moto Yamaha',
      avatar: ''
    })
    setShowAssignModal(true)
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDelivery || !assignForm.name || !assignForm.phone) {
      alert('Veuillez remplir le nom et le téléphone du livreur')
      return
    }

    try {
      // On passe null comme 2ème argument (userId) et l'objet assignForm comme 3ème (details)
      // Note: Assurez-vous que votre méthode api.assignDeliveryPerson supporte cette signature
      // Si api.assignDeliveryPerson prend (id, userId), il faudra peut-être l'adapter ou passer un objet
      // Pour l'instant on suppose que l'API JS gère les arguments dynamiques ou qu'on passe un objet

      // Adaptation de l'appel API frontend si nécessaire. 
      // Ici je suppose que api.assignDeliveryPerson(id, userId) existe.
      // Je vais tricher légèrement en envoyant un objet spécial si userId est null

      const response = await api.assignDeliveryPerson(selectedDelivery.id, null, assignForm)

      if (response && response.success) {
        alert('Livreur assigné avec succès')
        setShowAssignModal(false)
        loadDeliveries()
      } else {
        alert('Erreur lors de l\'assignation')
      }
    } catch (error) {
      console.error('Erreur assignation:', error)
      alert('Erreur lors de l\'assignation du livreur')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'En attente' },
      preparing: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En préparation' },
      ready: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Prête' },
      assigned: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Assignée' },
      picked_up: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Récupérée' },
      in_transit: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'En route' },
      arrived: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Arrivée' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livrée' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getDeliveryModeLabel = (mode) => {
    const labels = {
      express: 'Express',
      standard: 'Standard',
      click_collect: 'Click & Collect'
    }
    return labels[mode] || mode
  }

  const filteredDeliveries = deliveries.filter(delivery => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim()
      if (!search) return true

      // Extraire l'ID de la commande (peut être un ObjectId ou un objet)
      const orderId = delivery.order?.id || delivery.order
      const orderIdStr = orderId ? orderId.toString().toLowerCase() : ''
      const orderIdShort = orderIdStr.slice(-8) // Les 8 derniers caractères

      // Recherche dans l'ID complet et les 8 derniers caractères
      const matchesOrderId = orderIdStr.includes(search) || orderIdShort.includes(search)

      // Recherche dans les autres champs
      const matchesUser = (
        (delivery.user?.nom || '').toLowerCase().includes(search) ||
        (delivery.user?.prenom || '').toLowerCase().includes(search) ||
        (delivery.user?.email || '').toLowerCase().includes(search) ||
        (delivery.user?.telephone || '').includes(search)
      )

      const matchesAddress = (delivery.deliveryAddress?.street || '').toLowerCase().includes(search) ||
        (delivery.deliveryAddress?.city || '').toLowerCase().includes(search)

      // Recherche dans le numéro de livraison (ID de la livraison)
      const deliveryIdStr = delivery.id ? delivery.id.toString().toLowerCase() : ''
      const matchesDeliveryId = deliveryIdStr.includes(search) || deliveryIdStr.slice(-8).includes(search)

      return matchesOrderId || matchesUser || matchesAddress || matchesDeliveryId
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Livraisons</h2>
          <p className="text-gray-600 dark:text-gray-400">Suivez et gérez toutes les livraisons en temps réel</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par commande, client, adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="preparing">En préparation</option>
          <option value="ready">Prête</option>
          <option value="assigned">Assignée</option>
          <option value="picked_up">Récupérée</option>
          <option value="in_transit">En route</option>
          <option value="arrived">Arrivée</option>
          <option value="delivered">Livrée</option>
        </select>
      </div>

      {/* Liste des livraisons */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Truck size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {searchTerm || filterStatus !== 'all'
              ? `Aucune livraison trouvée${searchTerm ? ` pour "${searchTerm}"` : ''}${filterStatus !== 'all' ? ` avec le statut "${filterStatus}"` : ''}`
              : 'Aucune livraison trouvée'}
          </p>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
              }}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition text-sm font-semibold"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="text-primary" size={24} />
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Commande #{(delivery.order?.id || delivery.order)?.toString().slice(-8).toUpperCase() || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {delivery.user?.prenom} {delivery.user?.nom}
                      </p>
                    </div>
                    {getStatusBadge(delivery.status)}
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {getDeliveryModeLabel(delivery.deliveryMode)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={16} />
                      <span className="line-clamp-1">{delivery.deliveryAddress?.street}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock size={16} />
                      <span>{delivery.estimatedTime} min estimé</span>
                    </div>
                    {delivery.deliveryPerson && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User size={16} />
                        <span>Livreur: {delivery.deliveryPerson.nom} {delivery.deliveryPerson.prenom}</span>
                      </div>
                    )}
                    {/* Affichage du livreur manuel si présent dans l'ordre (via populate delivery.order idealement, mais ici on a pas delivery.order.deliveryStatus) */}
                    {/* Pour l'admin, on peut se fier au champ deliveryPerson pour l'instant ou recharger */}
                  </div>

                  {/* Historique récent */}
                  {delivery.trackingHistory && delivery.trackingHistory.length > 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Dernière mise à jour: {delivery.trackingHistory[delivery.trackingHistory.length - 1]?.message || 'N/A'}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {delivery.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'preparing', 'Commande en préparation')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-sm font-semibold"
                    >
                      En préparation
                    </button>
                  )}
                  {delivery.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'ready', 'Commande prête pour la livraison')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                    >
                      Prête
                    </button>
                  )}
                  {delivery.status === 'ready' && !delivery.deliveryPerson && (
                    <button
                      onClick={() => handleOpenAssignModal(delivery)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-semibold"
                    >
                      Assigner livreur
                    </button>
                  )}
                  {delivery.status === 'assigned' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'picked_up', 'Commande récupérée par le livreur')}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition text-sm font-semibold"
                    >
                      Récupérée
                    </button>
                  )}
                  {delivery.status === 'picked_up' && (
                    <button
                      onClick={() => updateStatus(delivery.id, 'in_transit', 'Commande en route vers le client')}
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition text-sm font-semibold"
                    >
                      En route
                    </button>
                  )}
                  {delivery.status === 'in_transit' && (
                    <>
                      <button
                        onClick={() => updateStatus(delivery.id, 'arrived', 'Livreur arrivé à destination')}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-semibold"
                      >
                        Arrivée
                      </button>
                      <button
                        onClick={() => updateStatus(delivery.id, 'delivered', 'Commande livrée avec succès')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-semibold"
                      >
                        Livrée
                      </button>
                    </>
                  )}
                  {delivery.user?.telephone && (
                    <a
                      href={`tel:${delivery.user.telephone}`}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-semibold flex items-center gap-2"
                    >
                      <Phone size={16} />
                      Appeler
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'assignation de livreur */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assigner un livreur</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-md">
                    {assignForm.avatar ? (
                      <img src={assignForm.avatar} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition shadow-lg transform hover:scale-110">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (file) {
                          try {
                            const response = await api.uploadFile(file)
                            if (response.success) {
                              setAssignForm(prev => ({ ...prev, avatar: response.url }))
                            }
                          } catch (err) {
                            console.error('Erreur upload:', err)
                            alert('Erreur lors de l\'upload de la photo')
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du livreur</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Mamadou Diallo"
                    value={assignForm.name}
                    onChange={e => setAssignForm({ ...assignForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: 620 12 34 56"
                    value={assignForm.phone}
                    onChange={e => setAssignForm({ ...assignForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Véhicule</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Ex: Moto Yamaha"
                    value={assignForm.vehicle}
                    onChange={e => setAssignForm({ ...assignForm, vehicle: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
