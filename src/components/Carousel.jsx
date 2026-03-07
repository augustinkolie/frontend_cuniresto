import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  // Images du carousel
  const slides = [
    {
      id: 1,
      image: '/images/hero-bg-professional.png',
      title: 'Bienvenue à CuniResto',
      description: 'Découvrez nos délicieux plats préparés avec passion par nos meilleurs chefs',
      buttonText: 'Commencer',
    },
    {
      id: 2,
      image: '/images/lapin/lap1.jpg',
      title: 'Lapins Braisés',
      description: 'Nos lapins braisés sont préparés selon une recette traditionnelle',
      buttonText: 'Découvrir',
    },
    {
      id: 3,
      image: '/images/atieke/at1.jpg',
      title: 'Atiéké Savoureux',
      description: 'L\'atiéké, un plat traditionnel préparé avec soin',
      buttonText: 'Goûter',
    },
    {
      id: 4,
      image: '/images/spaghetti/sp1.jpg',
      title: 'Nouilles Délicieuses',
      description: 'Nos nouilles fraîches cuisinées à la perfection',
      buttonText: 'Explorer',
    },
    {
      id: 5,
      image: '/images/sandwiches/san1.jpg',
      title: 'Sandwichs Gourmands',
      description: 'Des sandwichs savoureux pour tous les goûts',
      buttonText: 'Savourer',
    },
  ]

  // Préchargement des images pour éviter le flash blanc initial
  useEffect(() => {
    const imagePromises = slides.map((slide) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = resolve // On continue même si une image échoue
        img.src = slide.image
      })
    })

    Promise.all(imagePromises).then(() => {
      setImagesLoaded(true)
    }).catch(() => {
      // En cas d'erreur, on affiche quand même après un délai
      setTimeout(() => setImagesLoaded(true), 1000)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-play
  useEffect(() => {
    if (!autoPlay || !imagesLoaded) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide toutes les 5 secondes

    return () => clearInterval(interval)
  }, [autoPlay, slides.length, imagesLoaded])

  // Navigation
  const goToSlide = (index) => {
    setCurrentSlide(index)
    setAutoPlay(false)
    // Reprendre l'auto-play après 10 secondes
    setTimeout(() => setAutoPlay(true), 10000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setAutoPlay(false)
    setTimeout(() => setAutoPlay(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setAutoPlay(false)
    setTimeout(() => setAutoPlay(true), 10000)
  }

  const getButtonLink = (buttonText) => {
    const links = {
      'Commencer': '/menu',
      'Découvrir': '/products',
      'Goûter': '/products',
      'Explorer': '/products',
      'Savourer': '/products'
    }
    return links[buttonText] || '/menu'
  }

  return (
    <div className="relative overflow-hidden bg-gray-900" style={{ height: '100vh', minHeight: '100vh' }}>
      {/* Slides */}
      <div className="relative w-full" style={{ height: '100vh', minHeight: '100vh' }}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide && imagesLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Image de fond */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                display: imagesLoaded ? 'block' : 'none',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                minHeight: '100vh'
              }}
            />

            {/* Overlay gradient */}
            {imagesLoaded && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
            )}

            {/* Contenu */}
            {imagesLoaded && (
              <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8 md:px-16 pt-16">
                <div className="max-w-5xl text-center w-full">
                  <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight sm:whitespace-nowrap px-2">
                    {slide.title}
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 leading-relaxed break-words px-2">
                    {slide.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                      to={getButtonLink(slide.buttonText)}
                      className="border-2 border-white text-white font-bold py-4 px-10 text-lg rounded-lg transition-all duration-300 hover:bg-white hover:text-black transform hover:scale-105 backdrop-blur-sm inline-flex items-center"
                    >
                      {slide.buttonText}
                      <ArrowRight size={20} className="ml-2" />
                    </Link>
                    <Link
                      to="/reservation"
                      className="bg-primary text-white font-bold py-4 px-10 text-lg rounded-lg transition-all duration-300 hover:bg-orange-600 transform hover:scale-105 inline-flex items-center"
                    >
                      Réservation
                      <ArrowRight size={20} className="ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Flèche Gauche */}
      {imagesLoaded && (
        <button
          onClick={prevSlide}
          className="absolute left-8 md:left-16 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition backdrop-blur-sm"
          aria-label="Slide précédent"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {/* Flèche Droite */}
      {imagesLoaded && (
        <button
          onClick={nextSlide}
          className="absolute right-8 md:right-16 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition backdrop-blur-sm"
          aria-label="Slide suivant"
        >
          <ChevronRight size={36} />
        </button>
      )}

      {/* Points de Navigation */}
      {imagesLoaded && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${index === currentSlide
                  ? 'bg-white w-8 h-2.5'
                  : 'bg-white/60 hover:bg-white/80 w-2.5 h-2.5'
                }`}
              aria-label={`Aller au slide ${index + 1}`}
            ></button>
          ))}
        </div>
      )}

      {/* Flèche animée vers le bas */}
      {imagesLoaded && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce" style={{ animationDuration: '1s' }}>
          <ChevronDown size={32} className="text-white" />
        </div>
      )}

    </div>
  )
}
