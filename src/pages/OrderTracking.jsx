import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, MapPin, Clock, Phone, MessageCircle } from 'lucide-react'
import { api } from '../utils/api'
import DeliveryTracking from '../components/DeliveryTracking'

export default function OrderTracking() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrderAndDelivery()
  }, [orderId])

  const loadOrderAndDelivery = async () => {
    setLoading(true)
    try {
      // Charger la commande
      const orderResponse = await api.getUserOrders()
      if (orderResponse && orderResponse.success) {
        const foundOrder = orderResponse.orders.find(o => o.id === orderId)
        if (foundOrder) {
          setOrder(foundOrder)
          
          // Charger la livraison associée
          try {
            const deliveriesResponse = await api.getDeliveries()
            if (deliveriesResponse && deliveriesResponse.success) {
              const foundDelivery = deliveriesResponse.deliveries.find(d => d.order.id === orderId)
              if (foundDelivery) {
                setDelivery(foundDelivery)
              }
            }
          } catch (deliveryError) {
            console.error('Erreur chargement livraison:', deliveryError)
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement commande:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Commande non trouvée</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Cette commande n'existe pas ou vous n'y avez pas accès.</p>
          <Link to="/profile?tab=orders" className="inline-block bg-primary text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition">
            Voir mes commandes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/profile?tab=orders"
            className="inline-flex items-center text-gray-600 hover:text-primary transition mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Retour aux commandes
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Suivi de Commande #{order.id.slice(-8).toUpperCase()}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Suivi de Livraison */}
          <div className="lg:col-span-2">
            {delivery ? (
              <DeliveryTracking orderId={orderId} deliveryId={delivery.id} />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Informations de livraison en cours de préparation
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Détails de la Commande */}
          <div className="space-y-6">
            {/* Résumé */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Résumé</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                  <span className="font-semibold">
                    {order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('fr-GN')} GNF
                  </span>
                </div>
                {delivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Livraison</span>
                    <span className="font-semibold">
                      {delivery.deliveryFee.toLocaleString('fr-GN')} GNF
                    </span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-primary text-lg">
                    {order.total.toLocaleString('fr-GN')} GNF
                  </span>
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Articles</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {item.price.toLocaleString('fr-GN')} GNF
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informations de Livraison */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Adresse
              </h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p>{order.deliveryInfo.address}</p>
                {order.deliveryInfo.city && <p>{order.deliveryInfo.city}</p>}
                {order.deliveryInfo.phone && (
                  <div className="flex items-center gap-2 mt-3">
                    <Phone size={16} />
                    <span>{order.deliveryInfo.phone}</span>
                  </div>
                )}
                {order.deliveryInfo.instructions && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Instructions:</p>
                    <p className="text-sm">{order.deliveryInfo.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


