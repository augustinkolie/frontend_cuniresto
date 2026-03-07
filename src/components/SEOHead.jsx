import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function SEOHead({ 
  title = "CuniResto - Restaurant 3.0",
  description = "Découvrez CuniResto, votre restaurant de référence. Plats traditionnels et modernes préparés avec passion par nos chefs étoilés.",
  keywords = "restaurant, cuisine, plats traditionnels, livraison, réservation",
  image = "/images/og-image.jpg",
  type = "website"
}) {
  const location = useLocation()

  useEffect(() => {
    // Mettre à jour le titre
    document.title = title

    // Meta tags de base
    updateMetaTag('description', description)
    updateMetaTag('keywords', keywords)
    
    // Open Graph
    updateMetaTag('og:title', title, 'property')
    updateMetaTag('og:description', description, 'property')
    updateMetaTag('og:image', image, 'property')
    updateMetaTag('og:type', type, 'property')
    updateMetaTag('og:url', window.location.href, 'property')
    
    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', image)

    // Structured Data (JSON-LD) pour Restaurant
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": "CuniResto",
      "image": image,
      "description": description,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Rue de la Gastronomie",
        "addressLocality": "Abidjan",
        "addressCountry": "CI"
      },
      "servesCuisine": "Cuisine Africaine, Internationale",
      "priceRange": "$$",
      "telephone": "+225 XX XX XX XX",
      "url": window.location.origin
    }

    // Ajouter les avis Google si disponibles
    if (window.googleReviews) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": window.googleReviews.averageRating || "4.9",
        "reviewCount": window.googleReviews.totalReviews || "150"
      }
    }

    // Supprimer l'ancien script s'il existe
    const existingScript = document.getElementById('structured-data')
    if (existingScript) {
      existingScript.remove()
    }

    // Ajouter le nouveau script
    const script = document.createElement('script')
    script.id = 'structured-data'
    script.type = 'application/ld+json'
    script.text = JSON.stringify(structuredData)
    document.head.appendChild(script)

    // Google Reviews Widget (si disponible)
    if (window.googleReviewsWidget) {
      loadGoogleReviewsWidget()
    }
  }, [location, title, description, keywords, image, type])

  const updateMetaTag = (name, content, attribute = 'name') => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`)
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(attribute, name)
      document.head.appendChild(element)
    }
    element.setAttribute('content', content)
  }

  const loadGoogleReviewsWidget = () => {
    // Script pour charger les avis Google
    if (!document.getElementById('google-reviews-script')) {
      const script = document.createElement('script')
      script.id = 'google-reviews-script'
      script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places'
      script.async = true
      document.body.appendChild(script)
    }
  }

  return null
}


