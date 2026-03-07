import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Package, CheckCircle, Truck, Home, AlertCircle, Phone, MessageCircle } from 'lucide-react'
import { api } from '../utils/api'

export default function DeliveryTracking({ orderId, deliveryId }) {
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (deliveryId) {
      loadDelivery()
      // Recharger toutes les 10 secondes pour le suivi en temps réel
      const interval = setInterval(loadDelivery, 10000)
      return () => clearInterval(interval)
    }
  }, [deliveryId])

  const loadDelivery = async () => {
    try {
      const response = await api.getDelivery(deliveryId)
      if (response && response.success) {
        setDelivery(response.delivery)
        setError(null)
      } else {
        setError('Livraison non trouvée')
      }
    } catch (err) {
      console.error('Erreur chargement livraison:', err)
      setError('Erreur lors du chargement de la livraison')
    } finally {
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    const steps = [
      { id: 'pending', label: 'En attente', icon: <Package size={20} /> },
      { id: 'preparing', label: 'En préparation', icon: <Clock size={20} /> },
      { id: 'ready', label: 'Prête', icon: <CheckCircle size={20} /> },
      { id: 'assigned', label: 'Livreur assigné', icon: <Truck size={20} /> },
      { id: 'picked_up', label: 'Récupérée', icon: <Truck size={20} /> },
      { id: 'in_transit', label: 'En route', icon: <Truck size={20} /> },
      { id: 'arrived', label: 'Arrivée', icon: <MapPin size={20} /> },
      { id: 'delivered', label: 'Livrée', icon: <CheckCircle size={20} /> }
    ]
    return steps
  }

  const getStatusIndex = (status) => {
    const statusOrder = ['pending', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'arrived', 'delivered']
    return statusOrder.indexOf(status)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-400',
      preparing: 'bg-yellow-500',
      ready: 'bg-blue-500',
      assigned: 'bg-purple-500',
      picked_up: 'bg-indigo-500',
      in_transit: 'bg-cyan-500',
      arrived: 'bg-orange-500',
      delivered: 'bg-green-500'
    }
    return colors[status] || 'bg-gray-400'
  }

  const getDeliveryModeLabel = (mode) => {
    const labels = {
      express: 'Express (15-20 min)',
      standard: 'Standard (30-45 min)',
      click_collect: 'Click & Collect (20 min)'
    }
    return labels[mode] || mode
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500">Chargement du suivi...</p>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <p className="text-red-600 dark:text-red-400">{error || 'Livraison non trouvée'}</p>
      </div>
    )
  }

  const steps = getStatusSteps()
  const currentStatusIndex = getStatusIndex(delivery.status)
  const lastTrackingPoint = delivery.trackingHistory?.[delivery.trackingHistory.length - 1]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Suivi de Livraison
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Commande #{delivery.order?.id?.slice(-8) || 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Mode de livraison</p>
          <p className="font-semibold text-primary">{getDeliveryModeLabel(delivery.deliveryMode)}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mb-8">
        {steps.map((step, index) => {
          const stepIndex = getStatusIndex(step.id)
          const isCompleted = stepIndex <= currentStatusIndex
          const isCurrent = stepIndex === currentStatusIndex
          
          return (
            <div key={step.id} className="flex items-start gap-4 mb-6">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isCompleted 
                  ? `${getStatusColor(step.id)} text-white` 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              } ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}`}>
                {step.icon}
              </div>
              <div className="flex-1 pt-2">
                <p className={`font-semibold ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {isCurrent && lastTrackingPoint && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {lastTrackingPoint.message || 'En cours...'}
                  </p>
                )}
                {isCurrent && lastTrackingPoint?.timestamp && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(lastTrackingPoint.timestamp).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-primary" size={20} />
            <span className="font-semibold text-gray-900 dark:text-white">Temps estimé</span>
          </div>
          <p className="text-2xl font-bold text-primary">{delivery.estimatedTime} min</p>
          {delivery.actualTime && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Temps réel: {delivery.actualTime} min
            </p>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-primary" size={20} />
            <span className="font-semibold text-gray-900 dark:text-white">Adresse</span>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {delivery.deliveryAddress?.street}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {delivery.deliveryAddress?.city}
          </p>
        </div>
      </div>

      {/* Livreur */}
      {delivery.deliveryPerson && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Livreur assigné</p>
              <p className="text-gray-700 dark:text-gray-300">
                {delivery.deliveryPerson.nom} {delivery.deliveryPerson.prenom}
              </p>
              {delivery.deliveryPerson.telephone && (
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={`tel:${delivery.deliveryPerson.telephone}`}
                    className="flex items-center gap-1 text-primary hover:text-orange-600 transition"
                  >
                    <Phone size={16} />
                    <span className="text-sm">{delivery.deliveryPerson.telephone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historique de suivi */}
      {delivery.trackingHistory && delivery.trackingHistory.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Historique</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {delivery.trackingHistory.slice().reverse().map((point, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(point.status)}`}></div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300">{point.message || point.status}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(point.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


