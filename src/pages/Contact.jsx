import React, { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Twitter, Youtube, MessageCircle, Globe, Flag, CheckCircle, AlertCircle, Sparkles, Building2, Users, Award } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { api } from '../utils/api'

export default function Contact() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  // Animation pour la section hero
  const [heroRef, heroVisible, heroClasses, heroStyle] = useScrollReveal({ direction: 'fade', delay: 0, duration: 800 })

  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    sujet: '',
    message: ''
  })

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis'
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis'
    }
    if (!formData.sujet) newErrors.sujet = 'Veuillez sélectionner un sujet'
    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      showNotification({
        id: Date.now(),
        type: 'error',
        title: 'Erreur de validation',
        message: 'Veuillez corriger les erreurs dans le formulaire',
        time: 'maintenant'
      })
      return
    }

    setLoading(true)
    try {
      const result = await api.contactUs(formData)

      if (result.success) {
        setSubmitted(true)
        showNotification({
          id: Date.now(),
          type: 'success',
          title: 'Message envoyé!',
          message: result.message || 'Nous vous répondrons dans les plus brefs délais.',
          time: 'maintenant'
        })

        // Réinitialiser le formulaire après 5 secondes
        setTimeout(() => {
          setSubmitted(false)
          setFormData({
            nom: user?.nom || '',
            prenom: user?.prenom || '',
            email: user?.email || '',
            telephone: user?.telephone || '',
            sujet: '',
            message: ''
          })
          setErrors({})
        }, 5000)
      } else {
        throw new Error(result.message || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      showNotification({
        id: Date.now(),
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue. Veuillez réessayer.',
        time: 'maintenant'
      })
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Adresse',
      content: 'Avenue du 28 Septembre\nKaloum, Conakry\nGuinée',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Phone,
      title: 'Téléphone',
      content: '+224 622 123 456\n+224 664 789 012',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'contact@cuniresto.com\ninfo@cuniresto.com',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: Clock,
      title: 'Horaires',
      content: 'Lun - Dim: 11h00 - 23h00\nService continu',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ]

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#', color: 'hover:bg-blue-600' },
    { icon: Instagram, label: 'Instagram', href: '#', color: 'hover:bg-pink-600' },
    { icon: Twitter, label: 'Twitter', href: '#', color: 'hover:bg-sky-500' },
    { icon: Youtube, label: 'YouTube', href: '#', color: 'hover:bg-red-600' },
    { icon: MessageCircle, label: 'WhatsApp', href: '#', color: 'hover:bg-green-500' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div
        ref={heroRef}
        className={`relative text-white py-12 md:py-16 overflow-hidden transition-all duration-300 ${heroClasses}`}
      >
        {/* Image de fond avec flou */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/images/hero-bg.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(2px)',
            ...heroStyle
          }}
        ></div>

        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl mb-4 transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
              }`}
              style={{ transitionDelay: '100ms' }}>
              <MessageCircle size={28} className="text-white" />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '200ms' }}>
              Contactez-Nous
            </h1>
            <p className={`text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed transform transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: '400ms' }}>
              Nous sommes là pour répondre à toutes vos questions et vous offrir le meilleur service
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information Cards */}
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <div
                  key={index}
                  className={`${info.bgColor} rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  <div className="flex items-start mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${info.color} text-white shadow-lg mr-4`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {info.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {info.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Social Media */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Globe className="mr-2 text-primary" size={24} />
                Suivez-Nous
              </h3>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center transition-all duration-300 ${social.color} text-gray-700 dark:text-gray-300 hover:text-white hover:shadow-lg transform hover:scale-110`}
                      title={social.label}
                    >
                      <Icon size={20} />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-2xl shadow-xl p-6 border border-primary/20 dark:border-primary/30">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Award className="text-primary mr-2" size={24} />
                Pourquoi Nous Choisir
              </h3>
              <ul className="space-y-3">
                {[
                  'Service client exceptionnel',
                  'Réponse rapide sous 24h',
                  'Équipe dédiée et professionnelle',
                  'Satisfaction garantie',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={18} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Message Envoyé!
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    Merci de nous avoir contactés. Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Sujet:</span> {formData.sujet}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mr-3">
                    <Send className="text-white" size={20} />
                  </div>
                  Envoyez-nous un Message
                </h2>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.nom
                        ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Votre nom"
                    />
                    {errors.nom && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.nom}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.prenom
                        ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Votre prénom"
                    />
                    {errors.prenom && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.prenom}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.email
                          ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="votre@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        required
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.telephone
                          ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="+224 XXX XXX XXX"
                      />
                    </div>
                    {errors.telephone && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.telephone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    Sujet <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="sujet"
                    value={formData.sujet}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${errors.sujet
                      ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none`}
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="reservation">Réservation</option>
                    <option value="information">Demande d'information</option>
                    <option value="reclamation">Réclamation</option>
                    <option value="partenariat">Partenariat</option>
                    <option value="emploi">Offre d'emploi</option>
                    <option value="autre">Autre</option>
                  </select>
                  {errors.sujet && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.sujet}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Décrivez votre demande en détail..."
                    rows="6"
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition resize-none ${errors.message
                      ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                  ></textarea>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.message}
                    </p>
                  )}
                  {formData.message && !errors.message && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formData.message.length} caractère(s)
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary via-primary/90 to-accent text-white py-4 px-6 rounded-xl hover:shadow-2xl transition-all duration-300 font-bold text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Envoyer le Message</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* Map Section */}
      <div className="w-full h-[500px] relative group border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        {/* Map Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/0 pointer-events-none z-10 transition-opacity duration-500 group-hover:opacity-0"></div>

        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          title="CuniResto Location"
          className="w-full h-full filter grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
          marginHeight="0"
          marginWidth="0"
          src="https://maps.google.com/maps?q=10.68426,-12.25668&z=15&output=embed"
        ></iframe>

        {/* Location Card Overlay */}
        <div className="absolute top-6 left-6 md:top-12 md:left-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 max-w-xs z-20 transform transition-transform duration-500 hover:scale-105">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">CuniResto Dalaba</h3>
              <p className="text-sm text-primary font-medium">ISSMV Campus</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin size={20} className="text-primary" />
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
            Situé au cœur de l'Institut Supérieur des Sciences et de Médecine Vétérinaire, Quartier Tangama.
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-gray-900 dark:text-white">4.8</span>
              <div className="flex text-yellow-400">
                <Sparkles size={14} fill="currentColor" />
                <Sparkles size={14} fill="currentColor" />
                <Sparkles size={14} fill="currentColor" />
                <Sparkles size={14} fill="currentColor" />
                <Sparkles size={14} fill="currentColor" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-500">(120+ avis)</span>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=10.68426,-12.25668"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            >
              Itinéraire
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
