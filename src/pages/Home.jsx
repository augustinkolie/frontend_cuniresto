import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MessageCircle, Send, X, Bot, User, Clock, Shield, Star, Users, Award, Crown, Sparkles, Target, Globe, Diamond, Medal, Gem, Rocket, Trophy, Flame, Zap, Utensils, Heart, ArrowRight, CheckCircle, TrendingUp, ChefHat, Play, Video } from 'lucide-react'
import Carousel from '../components/Carousel'
import ProductCard from '../components/ProductCard'
import Stories from '../components/Stories'
import ChefVideo from '../components/ChefVideo'
import ChefContentSection from '../components/ChefContentSection'
import SEOHead from '../components/SEOHead'
import { mockProducts } from '../data/mockData'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { api } from '../utils/api'
import { generateBotResponse, getWelcomeMessage } from '../utils/chatbot'
import '../styles/animations.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isStoriesOpen, setIsStoriesOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [counters, setCounters] = useState({
    clients: 0,
    experience: 0,
    rating: 0,
    awards: 0
  })

  // Scroll reveal hooks pour chaque section

  const [statsRef, statsVisible, statsClasses, statsStyle] = useScrollReveal({ direction: 'up', delay: 200, duration: 800 })
  const [productsRef, productsVisible, productsClasses, productsStyle] = useScrollReveal({ direction: 'up', delay: 0, duration: 800 })

  const [valuesRef, valuesVisible, valuesClasses, valuesStyle] = useScrollReveal({ direction: 'up', delay: 0, duration: 800 })
  const [featuresRef, featuresVisible, featuresClasses, featuresStyle] = useScrollReveal({ direction: 'up', delay: 0, duration: 800 })
  const [testimonialsRef, testimonialsVisible, testimonialsClasses, testimonialsStyle] = useScrollReveal({ direction: 'up', delay: 0, duration: 800 })


  useEffect(() => {
    setMounted(true)

    // Animation des compteurs
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setCounters(prev => ({
          clients: Math.min(prev.clients + 150, 10000),
          experience: Math.min(prev.experience + 1, 15),
          rating: Math.min(prev.rating + 0.1, 4.9),
          awards: Math.min(prev.awards + 1, 25)
        }))
      }, 50)

      return () => clearInterval(interval)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setProducts(mockProducts.filter(p => p.featured).slice(0, 6))
  }, [])

  const stats = [
    {
      icon: <Users size={28} />,
      value: counters.clients.toLocaleString() + '+',
      label: 'Clients Satisfaits',
      color: 'text-blue-600',
      description: 'Fidèles depuis 2009'
    },
    {
      icon: <Award size={28} />,
      value: counters.experience + '+',
      label: 'Excellence culinaire',
      color: 'text-orange-600',
      description: 'Ans d\'Expérience'
    },
    {
      icon: <Star size={28} />,
      value: counters.rating.toFixed(1),
      label: 'Note Moyenne',
      color: 'text-yellow-500',
      description: 'Sur 5 étoiles'
    },
    {
      icon: <Trophy size={28} />,
      value: counters.awards + '+',
      label: 'Prix Gagnés',
      color: 'text-emerald-600',
      description: 'Reconnaissance internationale'
    }
  ]





  const testimonials = [
    {
      name: 'Marie Diop',
      role: 'Entrepreneuse',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654d0b?w=500&h=600&fit=crop',
      rating: 5,
      text: 'Une expérience culinaire exceptionnelle ! Les plats sont toujours parfaits et le service impeccable. CuniResto est devenu mon restaurant de référence.',
      verified: true
    },
    {
      name: 'Ibrahim Bah',
      role: 'PDG - Groupe Bah',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop',
      rating: 5,
      text: 'La qualité des ingrédients se ressent dans chaque bouchée. Un véritable voyage gustatif qui honore les traditions culinaires africaines.',
      verified: true
    },
    {
      name: 'Aminata Touré',
      role: 'Directrice Marketing',
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=600&fit=crop',
      rating: 5,
      text: 'Service client au top et livraison toujours ponctuelle. L\'attention portée aux détails fait toute la différence. Je recommande vivement !',
      verified: true
    },
    {
      name: 'Moussa Koné',
      role: 'Investisseur',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=600&fit=crop',
      rating: 5,
      text: 'En tant que professionnel, je reconnais la maîtrise technique et la créativité. Des saveurs authentiques parfaitement équilibrées.',
      verified: true
    },
    {
      name: 'Fatou Sall',
      role: 'Fondatrice - TechStart',
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=600&fit=crop',
      rating: 5,
      text: 'J\'ai testé de nombreux restaurants, mais CuniResto se démarque par son authenticité et sa qualité. Chaque plat est une découverte !',
      verified: true
    },
    {
      name: 'Koffi Adou',
      role: 'CEO - Adou Group',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&fit=crop',
      rating: 5,
      text: 'Parfait pour les déjeuners d\'affaires. L\'ambiance est chaleureuse et les plats sont toujours excellents. Un must à Abidjan !',
      verified: true
    }
  ]

  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [selectedTestimonial, setSelectedTestimonial] = useState(null)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000) // Change toutes les 5 secondes

    return () => clearInterval(interval)
  }, [isAutoPlaying, testimonials.length])

  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Initialiser avec le message de bienvenue depuis l'API ou fallback local
  useEffect(() => {
    const loadWelcomeMessage = async () => {
      try {
        const response = await api.getChatWelcome()
        if (response && response.success && response.message) {
          setMessages([{
            id: 1,
            text: response.message.text,
            sender: 'bot',
            suggestions: response.message.suggestions || []
          }])
        } else {
          // Fallback vers la fonction locale
          const welcomeMsg = getWelcomeMessage()
          setMessages([{
            id: 1,
            text: welcomeMsg.text,
            sender: 'bot',
            suggestions: welcomeMsg.suggestions || []
          }])
        }
      } catch (error) {
        console.error('Erreur chargement message bienvenue, utilisation du fallback local:', error)
        // Fallback vers la fonction locale en cas d'erreur
        const welcomeMsg = getWelcomeMessage()
        setMessages([{
          id: 1,
          text: welcomeMsg.text,
          sender: 'bot',
          suggestions: welcomeMsg.suggestions || []
        }])
      }
    }
    loadWelcomeMessage()
  }, [])

  const handleSendMessage = async () => {
    if (inputMessage.trim() && !isTyping) {
      const userMessage = inputMessage.trim()
      const newMessage = {
        id: Date.now(),
        text: userMessage,
        sender: 'user',
        timestamp: new Date()
      }

      // Ajouter le message utilisateur immédiatement
      setMessages(prev => [...prev, newMessage])
      setInputMessage('')
      setIsTyping(true)

      // Préparer l'historique de conversation pour l'API
      // Format: [{ role: 'user', content: '...' }, { role: 'assistant', content: '...' }]
      const conversationHistory = messages
        .slice(-10) // Garder seulement les 10 derniers messages pour le contexte
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text || m.content || ''
        }))

      // Appeler l'API de chat avec l'historique
      api.sendChatMessage(userMessage, conversationHistory)
        .then(response => {
          if (response && response.success && response.response) {
            const botResponse = {
              id: Date.now() + 1,
              text: response.response.text,
              sender: 'bot',
              suggestions: response.response.suggestions || [],
              timestamp: new Date()
            }

            setMessages(prevMsgs => [...prevMsgs, botResponse])
          } else {
            // Si l'API ne répond pas correctement, utiliser le fallback local
            throw new Error('Réponse API invalide')
          }
        })
        .catch(error => {
          console.error('Erreur envoi message chat, utilisation du fallback local:', error)
          // Fallback vers la fonction locale si l'API ne répond pas
          try {
            const allMessages = messages.filter(m => m.sender === 'user').map(m => m.text)
            allMessages.push(userMessage)
            const botResponseData = generateBotResponse(userMessage, allMessages)
            const botResponse = {
              id: Date.now() + 1,
              text: botResponseData.text,
              sender: 'bot',
              suggestions: botResponseData.suggestions || [],
              timestamp: new Date()
            }
            setMessages(prevMsgs => [...prevMsgs, botResponse])
          } catch (fallbackError) {
            console.error('Erreur fallback local:', fallbackError)
            const errorResponse = {
              id: Date.now() + 1,
              text: "Désolé, je rencontre une difficulté technique. Veuillez réessayer dans un instant.",
              sender: 'bot',
              suggestions: ['Réessayer', 'Voir le menu', 'Nous contacter'],
              timestamp: new Date()
            }
            setMessages(prevMsgs => [...prevMsgs, errorResponse])
          }
        })
        .finally(() => {
          setIsTyping(false)
        })
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion)
    // Envoyer automatiquement après un court délai
    setTimeout(() => {
      handleSendMessage()
    }, 100)
  }

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

  return (
    <div className={`min-h-screen bg-white ${isChatOpen ? 'overflow-hidden' : ''}`}>
      <SEOHead
        title="CuniResto - Restaurant 3.0 | Cuisine Traditionnelle & Moderne"
        description="Découvrez CuniResto, votre restaurant de référence. Plats traditionnels et modernes préparés avec passion par nos chefs étoilés. Livraison rapide et réservation en ligne."
        keywords="restaurant, cuisine africaine, livraison, réservation, plats traditionnels, Abidjan"
      />

      {/* Stories Component */}
      <Stories
        isOpen={isStoriesOpen}
        onClose={() => setIsStoriesOpen(false)}
        stories={[
          {
            id: 1,
            type: 'image',
            url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1080&h=1920&fit=crop',
            title: 'Notre Chef en Action',
            description: 'Découvrez nos plats préparés avec passion'
          },
          {
            id: 2,
            type: 'video',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            title: 'Préparation des Nouilles',
            description: 'Voyez comment nos chefs préparent nos délicieuses nouilles'
          },
          {
            id: 3,
            type: 'image',
            url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1080&h=1920&fit=crop',
            title: 'Atiéké Traditionnel',
            description: 'Un plat préparé selon les traditions'
          }
        ]}
      />

      {/* Carousel Section - CONSERVÉ TEL QUEL */}
      <div className={`transition-all duration-300 ${isChatOpen ? 'blur-sm' : ''}`} style={{ marginBottom: 0 }}>
        <Carousel />
      </div>

      {/* Hero Stats Section - Premium Design */}
      <section className={`relative py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300 ${isChatOpen ? 'blur-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


          {/* Premium Stats Grid */}
          <div ref={statsRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${statsClasses}`} style={statsStyle}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl transform transition-all duration-500 hover:-translate-y-1 border border-gray-100 dark:border-gray-700 flex items-center gap-4"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`shrink-0 w-14 h-14 flex items-center justify-center rounded-xl transform group-hover:scale-110 transition-transform duration-500 ${stat.color} bg-gray-50 dark:bg-gray-700/50 shadow-inner`}>
                    {stat.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-gray-900 dark:text-gray-200 font-bold text-xs uppercase tracking-wider mb-1 truncate">
                      {stat.label}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-[10px] leading-tight line-clamp-2">
                      {stat.description}
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none shrink-0">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section - Premium */}
      <section ref={productsRef} className={`py-20 bg-white dark:bg-gray-900 transition-all duration-300 ${isChatOpen ? 'blur-sm' : ''} ${productsClasses}`} style={productsStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 transform">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mb-5 shadow-lg">
              <Utensils className="text-white" size={28} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Nos <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Spécialités</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto font-normal">
              Découvrez nos plats vedettes, préparés avec passion par nos chefs étoilés
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="transform transition-all duration-700 opacity-0 translate-y-10"
                style={{
                  transitionDelay: `${index * 100}ms`,
                  animation: productsVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none',
                  animationDelay: `${index * 100}ms`
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
            >
              <span>Voir Tous les Produits</span>
              <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </section>







      {/* Testimonials Section - Premium Slider - Style Notre Vision */}
      <section ref={testimonialsRef} className={`py-20 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-all duration-300 ${isChatOpen ? 'blur-sm' : ''} ${testimonialsClasses}`} style={testimonialsStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 transform">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Témoignages <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Clients</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-normal">
              Découvrez les expériences authentiques de nos clients satisfaits
            </p>
          </div>

          {/* Slider Container - Style Notre Vision */}
          <div
            className="relative overflow-hidden rounded-2xl"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Slider Wrapper */}
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="min-w-full"
                >
                  <div className={`max-w-6xl mx-auto transform transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                    }`}>
                    <div className="relative overflow-hidden rounded-2xl">
                      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-12 shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                          {/* Image à gauche - Grande taille, sans border-radius */}
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <img
                                src={testimonial.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop'}
                                alt={testimonial.name}
                                className="w-64 h-80 object-cover shadow-2xl"
                                style={{ borderRadius: '0' }}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop'
                                }}
                              />
                              {testimonial.verified && (
                                <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 shadow-lg">
                                  <CheckCircle size={24} className="text-white" fill="currentColor" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Contenu à droite */}
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{testimonial.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-base mb-4">{testimonial.role}</p>
                            <div className="flex justify-center md:justify-start text-yellow-400 mb-6">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} size={20} fill="currentColor" />
                              ))}
                            </div>
                            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-normal mb-6">
                              "{testimonial.text}"
                            </p>
                            <button
                              onClick={() => setSelectedTestimonial(testimonial)}
                              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
                            >
                              <span>En savoir plus</span>
                              <ArrowRight size={20} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Arrows - Style Notre Vision */}
                      <button
                        onClick={() => {
                          setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
                          setIsAutoPlaying(false)
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white dark:bg-gray-700/90 dark:hover:bg-gray-600 text-primary dark:text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                        aria-label="Témoignage précédent"
                      >
                        <ChevronRight size={24} className="rotate-180" />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
                          setIsAutoPlaying(false)
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white dark:bg-gray-700/90 dark:hover:bg-gray-600 text-primary dark:text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
                        aria-label="Témoignage suivant"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentTestimonial(index)
                    setIsAutoPlaying(false)
                  }}
                  className={`transition-all duration-300 rounded-full ${index === currentTestimonial
                    ? 'bg-primary w-8 h-2'
                    : 'bg-gray-600 w-2 h-2 hover:bg-gray-500'
                    }`}
                  aria-label={`Aller au témoignage ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Detail Modal */}
      {selectedTestimonial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTestimonial(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="relative">
              <button
                onClick={() => setSelectedTestimonial(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-700/90 rounded-full hover:bg-white dark:hover:bg-gray-600 transition z-10"
              >
                <X size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Image */}
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-xl">
                    <img
                      src={selectedTestimonial.image}
                      alt={selectedTestimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedTestimonial.name}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {selectedTestimonial.role}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex text-yellow-400">
                      {[...Array(selectedTestimonial.rating)].map((_, i) => (
                        <Star key={i} size={24} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-semibold">
                      {selectedTestimonial.rating}/5
                    </span>
                  </div>

                  {/* Testimonial Text */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border-l-4 border-primary">
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{selectedTestimonial.text}"
                    </p>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-primary" />
                      <span>Client vérifié</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      <span>Membre depuis 2020</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expérience Immersive - Contenus des Chefs (Dynamique) */}
      <div className={`transition-all duration-300 ${isChatOpen ? 'blur-sm' : ''}`}>
        <ChefContentSection />
      </div>



      {/* Chatbot IA - Premium */}
      <div className="fixed right-4 bottom-24 md:right-6 md:bottom-6 z-50">
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative bg-primary/80 backdrop-blur-md text-white p-2.5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 transform group border border-white/20"
          >
            {/* Icône du chatbot avec image */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img
                src="/images/chatbot/chatbot-icon.png"
                alt="Chatbot"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback vers l'icône Bot si l'image ne charge pas
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <Bot
                size={32}
                className="hidden"
                style={{ display: 'none' }}
              />
            </div>
            {/* Indicateur de statut en ligne */}
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white shadow-lg animate-pulse"></span>
          </button>
        )}

        {isChatOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
            onClick={() => setIsChatOpen(false)}
          ></div>
        )}

        {isChatOpen && (
          <div className="bg-white rounded-3xl shadow-2xl w-96 h-[600px] flex flex-col relative z-50 border border-gray-200">
            <div className="bg-gradient-to-r from-primary to-accent text-white p-6 rounded-t-3xl flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    src="/images/chatbot/chatbot-icon.png"
                    alt="Chatbot"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <Bot
                    size={24}
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Assistant Culinaire IA</h3>
                  <p className="text-xs text-white/80">En ligne pour vous aider</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${message.sender === 'user'
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md'
                      }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === 'bot' && (
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={14} className="text-primary" />
                        </div>
                      )}
                      {message.sender === 'user' && (
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User size={14} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={`block w-full text-left text-xs rounded-lg px-3 py-2 transition-all duration-200 hover:scale-105 ${message.sender === 'bot'
                                  ? 'bg-white/30 hover:bg-white/40 text-gray-800 dark:text-gray-200'
                                  : 'bg-white/20 hover:bg-white/30 text-white'
                                  }`}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-4 rounded-2xl shadow-md">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                        <Bot size={14} className="text-primary" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                  placeholder={isTyping ? "L'assistant tape..." : "Tapez votre message..."}
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isTyping || !inputMessage.trim()}
                  className="bg-gradient-to-r from-primary to-accent text-white p-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
