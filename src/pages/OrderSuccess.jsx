import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Home, Package } from 'lucide-react'

export default function OrderSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const { orderId, total } = location.state || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
              <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6">
                <CheckCircle className="text-white" size={64} />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Commande confirmée !
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Merci pour votre commande. Nous avons bien reçu votre paiement.
          </p>

          {/* Order Details */}
          {orderId && (
            <div className="bg-gradient-to-br from-primary/10 to-orange-100/50 dark:from-primary/20 dark:to-orange-900/20 rounded-2xl p-6 mb-8 border-2 border-primary/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Package className="text-primary" size={24} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Détails de la commande
                </h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Numéro de commande</span>
                  <span className="font-mono font-bold text-primary">{orderId.slice(-8).toUpperCase()}</span>
                </div>
                {total && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {total.toLocaleString('fr-GN')} GNF
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>📧</strong> Un email de confirmation vous a été envoyé avec tous les détails de votre commande.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
              Votre commande sera préparée et livrée dans les plus brefs délais.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gradient-to-r from-primary to-orange-600 text-white py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/50 transform hover:scale-105 transition-all font-bold flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Retour à l'accueil
            </button>
            <button
              onClick={() => navigate('/profile?tab=orders')}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3.5 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-bold"
            >
              Voir mes commandes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

