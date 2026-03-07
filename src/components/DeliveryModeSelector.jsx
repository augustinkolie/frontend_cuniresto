import React, { useState, useEffect } from 'react'
import { Zap, Clock, Store, MapPin, AlertCircle } from 'lucide-react'
import { api } from '../utils/api'

export default function DeliveryModeSelector({ 
  selectedMode, 
  onModeChange, 
  deliveryAddress,
  onEstimateChange 
}) {
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(false)

  const deliveryModes = [
    {
      id: 'express',
      label: 'Express',
      description: 'Livraison rapide en 15-20 minutes',
      icon: <Zap size={24} />,
      color: 'from-red-500 to-orange-500',
      fee: 5000
    },
    {
      id: 'standard',
      label: 'Standard',
      description: 'Livraison classique en 30-45 minutes',
      icon: <Clock size={24} />,
      color: 'from-blue-500 to-cyan-500',
      fee: 3000
    },
    {
      id: 'click_collect',
      label: 'Click & Collect',
      description: 'Récupérez votre commande au restaurant en 20 minutes',
      icon: <Store size={24} />,
      color: 'from-green-500 to-emerald-500',
      fee: 0
    }
  ]

  useEffect(() => {
    if (selectedMode && deliveryAddress) {
      calculateEstimate()
    }
  }, [selectedMode, deliveryAddress])

  const calculateEstimate = async () => {
    if (!selectedMode || !deliveryAddress) return

    setLoading(true)
    try {
      // Calculer la distance (simulation - à remplacer par un vrai service de géolocalisation)
      const distance = calculateDistance(deliveryAddress)
      
      const response = await api.estimateDelivery(selectedMode, distance, deliveryAddress)
      if (response && response.success) {
        setEstimate(response.estimate)
        if (onEstimateChange) {
          onEstimateChange(response.estimate)
        }
      }
    } catch (error) {
      console.error('Erreur estimation:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction de calcul de distance (simulation)
  const calculateDistance = (address) => {
    // TODO: Intégrer Google Maps Distance Matrix API ou similaire
    // Pour l'instant, on simule une distance aléatoire entre 2 et 15 km
    return Math.random() * 13 + 2
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Mode de livraison *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deliveryModes.map((mode) => {
            const isSelected = selectedMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onModeChange(mode.id)}
                className={`relative p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  isSelected
                    ? `border-primary bg-gradient-to-br ${mode.color} text-white shadow-lg`
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-white text-primary rounded-full p-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                )}
                <div className={`mb-3 ${isSelected ? 'text-white' : 'text-primary'}`}>
                  {mode.icon}
                </div>
                <h4 className={`font-bold text-lg mb-2 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {mode.label}
                </h4>
                <p className={`text-sm mb-3 ${isSelected ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
                  {mode.description}
                </p>
                <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-primary'}`}>
                  {mode.fee === 0 ? 'Gratuit' : `${mode.fee.toLocaleString('fr-GN')} GNF`}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Estimation */}
      {estimate && selectedMode && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimation</p>
              <p className="text-2xl font-bold text-primary">
                {estimate.estimatedTime} minutes
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Frais de livraison</p>
              <p className="text-xl font-bold text-primary">
                {estimate.deliveryFee.toLocaleString('fr-GN')} GNF
              </p>
            </div>
          </div>
          {selectedMode === 'click_collect' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin size={16} />
              <span>Récupération au restaurant : 123 Rue de la Gastronomie, Abidjan</span>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Calcul de l'estimation...</p>
        </div>
      )}
    </div>
  )
}


