import React from 'react'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="mb-8">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Page non trouvée
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Désolé, la page que vous recherchez n'existe pas.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition font-bold"
      >
        <Home size={20} />
        <span>Retour à l'accueil</span>
      </Link>
    </div>
  )
}
