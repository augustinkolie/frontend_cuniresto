import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    // Fonction pour gérer le scroll
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Écouter l'événement de scroll
    window.addEventListener('scroll', toggleVisibility)

    // Nettoyer l'écouteur d'événement
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Fonction pour remonter en haut
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Afficher uniquement sur la page d'accueil
  if (!isHome) {
    return null
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-110 group"
          aria-label="Remonter en haut de la page"
        >
          <ArrowUp 
            size={24} 
            className="transform transition-transform duration-300 group-hover:-translate-y-1"
          />
          <span className="absolute -top-12 left-0 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Haut de page
          </span>
        </button>
      )}
    </>
  )
}
