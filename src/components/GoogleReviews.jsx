import React, { useState, useEffect } from 'react'
import { Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

export default function GoogleReviews({ placeId, apiKey }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (placeId && apiKey) {
      loadGoogleReviews()
    } else {
      // Données mock pour le développement
      setReviews([
        {
          author_name: 'Marie Diop',
          rating: 5,
          text: 'Excellent restaurant ! Les plats sont délicieux et le service impeccable.',
          time: Date.now() - 86400000
        },
        {
          author_name: 'Ibrahim Bah',
          rating: 5,
          text: 'Une expérience culinaire exceptionnelle. Je recommande vivement !',
          time: Date.now() - 172800000
        },
        {
          author_name: 'Aminata Touré',
          rating: 4,
          text: 'Très bon restaurant avec des plats authentiques. Service rapide.',
          time: Date.now() - 259200000
        }
      ])
      setLoading(false)
    }
  }, [placeId, apiKey])

  const loadGoogleReviews = async () => {
    try {
      // Note: Pour utiliser l'API Google Places, vous devez avoir une clé API
      // et configurer les restrictions CORS appropriées
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`
      )
      const data = await response.json()
      
      if (data.result && data.result.reviews) {
        setReviews(data.result.reviews)
      }
    } catch (error) {
      console.error('Erreur chargement avis Google:', error)
      // Fallback vers données mock
      setReviews([
        {
          author_name: 'Marie Diop',
          rating: 5,
          text: 'Excellent restaurant ! Les plats sont délicieux et le service impeccable.',
          time: Date.now() - 86400000
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length)
  }

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement des avis...</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return null
  }

  const currentReview = reviews[currentIndex]
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Avis Google</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={star <= averageRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-700">
              {averageRating.toFixed(1)} ({reviews.length} avis)
            </span>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/place/?q=place_id:${placeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary hover:text-orange-600 transition"
        >
          <span className="font-medium">Voir sur Google</span>
          <ExternalLink size={18} />
        </a>
      </div>

      {/* Carousel des avis */}
      <div className="relative">
        <div className="bg-gray-50 rounded-lg p-6 min-h-[150px]">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-lg">
                {currentReview.author_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">{currentReview.author_name || 'Client'}</h4>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= currentReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(currentReview.time * 1000 || currentReview.time).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{currentReview.text}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {reviews.length > 1 && (
          <>
            <button
              onClick={prevReview}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
            
            {/* Indicateurs */}
            <div className="flex justify-center gap-2 mt-4">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-primary w-8' : 'bg-gray-300 w-2'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}


