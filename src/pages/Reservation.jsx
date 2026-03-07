import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Phone, Mail, User, MapPin, CheckCircle, AlertCircle, Sparkles, Star, UtensilsCrossed } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { useNotification } from '../context/NotificationContext'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Reservation() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // Animation pour la section hero
  const [heroRef, heroVisible, heroClasses, heroStyle] = useScrollReveal({ direction: 'fade', delay: 0, duration: 800 })
  
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    phone: user?.telephone || '',
    date: '',
    time: '',
    guests: '2',
    message: '',
  })

  const [errors, setErrors] = useState({})
  const [minDate, setMinDate] = useState('')

  useEffect(() => {
    // Définir la date minimale (aujourd'hui)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setMinDate(today.toISOString().split('T')[0])
    
    // Pré-remplir avec les données utilisateur si connecté
    if (user) {
      setFormData(prev => ({
        ...prev,
        nom: user.nom || prev.nom,
        prenom: user.prenom || prev.prenom,
        email: user.email || prev.email,
        phone: user.telephone || prev.phone,
      }))
    }
  }, [user])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis'
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis'
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide'
    }
    if (!formData.date) {
      newErrors.date = 'La date est requise'
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = 'La date ne peut pas être dans le passé'
      }
    }
    if (!formData.time) {
      newErrors.time = 'L\'heure est requise'
    } else {
      const [hours, minutes] = formData.time.split(':').map(Number)
      const selectedDateTime = new Date(formData.date)
      selectedDateTime.setHours(hours, minutes)
      const now = new Date()
      
      if (selectedDateTime < now) {
        newErrors.time = 'L\'heure ne peut pas être dans le passé'
      }
      
      // Vérifier les horaires d'ouverture (11h - 23h)
      if (hours < 11 || hours >= 23) {
        newErrors.time = 'Les réservations sont disponibles de 11h à 23h'
      }
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
      // Préparer les données en s'assurant qu'elles ne sont pas vides
      const reservationData = {
        nom: (formData.nom || '').trim(),
        prenom: (formData.prenom || '').trim(),
        email: (formData.email || '').trim(),
        telephone: (formData.phone || '').trim(),
        date: formData.date || '',
        time: formData.time || '',
        guests: formData.guests ? parseInt(formData.guests) : 2,
        ...(formData.message && formData.message.trim() ? { message: formData.message.trim() } : {})
      }

      // Vérifier que tous les champs requis sont remplis avant l'envoi
      const requiredFields = ['nom', 'prenom', 'email', 'telephone', 'date', 'time', 'guests']
      const missingFields = requiredFields.filter(field => {
        if (field === 'guests') {
          return !reservationData[field] || isNaN(reservationData[field])
        }
        return !reservationData[field] || reservationData[field].trim() === ''
      })

      if (missingFields.length > 0) {
        setErrors(prev => {
          const newErrors = {}
          missingFields.forEach(field => {
            newErrors[field] = 'Ce champ est requis'
          })
          return newErrors
        })
        showNotification({
          id: Date.now(),
          type: 'error',
          title: 'Champs manquants',
          message: `Veuillez remplir: ${missingFields.join(', ')}`,
          time: 'maintenant'
        })
        setLoading(false)
        return
      }

      console.log('📤 Envoi des données de réservation:', JSON.stringify(reservationData, null, 2))

      const response = await api.createReservation(reservationData)
      
      if (response.success) {
        setSubmitted(true)
        showNotification({
          id: Date.now(),
          type: 'success',
          title: 'Réservation confirmée!',
          message: 'Votre réservation a été enregistrée avec succès. Vous recevrez une confirmation par email.',
          time: 'maintenant'
        })
        
        // Réinitialiser le formulaire après 3 secondes
        setTimeout(() => {
          setSubmitted(false)
          setFormData({
            nom: user?.nom || '',
            prenom: user?.prenom || '',
            email: user?.email || '',
            phone: user?.telephone || '',
            date: '',
            time: '',
            guests: '2',
            message: '',
          })
          setErrors({})
        }, 5000)
      } else {
        let errorMessage = response.message || 'Erreur lors de la réservation'
        if (response.missingFields && response.missingFields.length > 0) {
          errorMessage = `Champs manquants: ${response.missingFields.join(', ')}`
        }
        console.error('❌ Erreur réservation:', response)
        showNotification({
          id: Date.now(),
          type: 'error',
          title: 'Erreur de réservation',
          message: errorMessage,
          time: 'maintenant'
        })
      }
    } catch (error) {
      console.error('❌ Erreur réservation:', error)
      let errorMessage = 'Erreur lors de la création de la réservation. Veuillez réessayer.'
      
      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.missingFields && errorData.missingFields.length > 0) {
          errorMessage = `Veuillez remplir tous les champs requis: ${errorData.missingFields.join(', ')}`
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      showNotification({
        id: Date.now(),
        type: 'error',
        title: 'Erreur',
        message: errorMessage,
        time: 'maintenant'
      })
    } finally {
      setLoading(false)
    }
  }

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
            <div className={`inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl mb-4 transform transition-all duration-1000 ease-out ${
              heroVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
            }`}
            style={{ transitionDelay: '100ms' }}>
              <UtensilsCrossed size={28} className="text-white" />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-4 transform transition-all duration-1000 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '200ms' }}>
              Réservez Votre Table
            </h1>
            <p className={`text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed transform transition-all duration-1000 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: '400ms' }}>
              Offrez-vous une expérience culinaire exceptionnelle dans un cadre raffiné et chaleureux
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Informations */}
          <div className="lg:col-span-1 space-y-6">
            {/* Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="text-primary mr-2" size={24} />
                Informations
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Clock className="text-primary mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Horaires</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Lun - Dim: 11h00 - 23h00</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="text-primary mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Téléphone</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">+224 XXX XXX XXX</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="text-primary mt-1 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">contact@cuniresto.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Card */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-2xl shadow-xl p-6 border border-primary/20 dark:border-primary/30">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Star className="text-primary mr-2" size={24} />
                Pourquoi Nous Choisir
              </h3>
              <ul className="space-y-3">
                {[
                  'Service de qualité exceptionnelle',
                  'Ambiance chaleureuse et raffinée',
                  'Cuisine authentique et savoureuse',
                  'Réservation simple et rapide',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={18} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                    <CheckCircle className="text-green-600 dark:text-green-400" size={48} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Réservation Confirmée!
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    Votre réservation a été enregistrée avec succès. Nous vous enverrons une confirmation par email dans les plus brefs délais.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-semibold">Date:</span> {new Date(formData.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-semibold">Heure:</span> {formData.time}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Nombre de personnes:</span> {formData.guests}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Vous pouvez fermer cette page ou faire une nouvelle réservation.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
                {/* Personal Info Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mr-3">
                      <User className="text-white" size={20} />
                    </div>
                    Informations Personnelles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                          errors.nom
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
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                          errors.prenom
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                            errors.email
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
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                            errors.phone
                              ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="+224 XXX XXX XXX"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reservation Details Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mr-3">
                      <Calendar className="text-white" size={20} />
                    </div>
                    Détails de la Réservation
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          min={minDate}
                          required
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                            errors.date
                              ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        />
                      </div>
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          {errors.date}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                        Heure <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          min="11:00"
                          max="23:00"
                          required
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition ${
                            errors.time
                              ? 'border-red-500 focus:ring-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-primary focus:border-transparent'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        />
                      </div>
                      {errors.time && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle size={14} className="mr-1" />
                          {errors.time}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                        Nombre de personnes <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                        <select
                          name="guests"
                          value={formData.guests}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? 'personne' : 'personnes'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Section */}
                <div className="mb-8">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                    Message Spécial (Optionnel)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Allergies, préférences alimentaires, occasions spéciales, demandes particulières..."
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  ></textarea>
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
                      <span>Traitement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={20} />
                      <span>Confirmer la Réservation</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
