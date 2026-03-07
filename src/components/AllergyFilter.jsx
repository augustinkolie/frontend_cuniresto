import React, { useState } from 'react'
import { AlertCircle, X, CheckCircle } from 'lucide-react'

const ALLERGIES = [
  { id: 'gluten', name: 'Gluten', icon: '🌾' },
  { id: 'lactose', name: 'Lactose', icon: '🥛' },
  { id: 'nuts', name: 'Noix', icon: '🥜' },
  { id: 'seafood', name: 'Fruits de mer', icon: '🦐' },
  { id: 'eggs', name: 'Œufs', icon: '🥚' },
  { id: 'soy', name: 'Soja', icon: '🫘' },
  { id: 'peanuts', name: 'Arachides', icon: '🥜' },
  { id: 'fish', name: 'Poisson', icon: '🐟' }
]

export default function AllergyFilter({ selectedAllergies = [], onAllergiesChange, products = [] }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleAllergy = (allergyId) => {
    const newAllergies = selectedAllergies.includes(allergyId)
      ? selectedAllergies.filter(id => id !== allergyId)
      : [...selectedAllergies, allergyId]
    onAllergiesChange(newAllergies)
  }

  const getFilteredProducts = () => {
    if (selectedAllergies.length === 0) return products

    return products.filter(product => {
      // Vérifier si le produit contient des allergènes sélectionnés
      const productAllergens = product.allergens || []
      return !selectedAllergies.some(allergy => productAllergens.includes(allergy))
    })
  }

  const filteredCount = getFilteredProducts().length
  const hasActiveFilters = selectedAllergies.length > 0

  return (
    <div className="relative">
      {/* Bouton pour ouvrir le filtre */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
          hasActiveFilters
            ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200'
            : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:bg-gray-200'
        }`}
      >
        <AlertCircle size={20} />
        <span>Mode Allergies</span>
        {hasActiveFilters && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {selectedAllergies.length}
          </span>
        )}
      </button>

      {/* Panel de filtres */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Allergies & Restrictions</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez vos allergies pour masquer les plats contenant ces ingrédients
          </p>

          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {ALLERGIES.map(allergy => {
              const isSelected = selectedAllergies.includes(allergy.id)
              return (
                <button
                  key={allergy.id}
                  onClick={() => toggleAllergy(allergy.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-red-50 border-2 border-red-300'
                      : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{allergy.icon}</span>
                    <span className={`font-medium ${isSelected ? 'text-red-700' : 'text-gray-700'}`}>
                      {allergy.name}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle size={20} className="text-red-500" fill="currentColor" />
                  )}
                </button>
              )
            })}
          </div>

          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Plats disponibles :</span>
                <span className="font-bold text-primary">{filteredCount}</span>
              </div>
              <button
                onClick={() => {
                  onAllergiesChange([])
                  setIsOpen(false)
                }}
                className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


