import React, { useState } from 'react'
import { Play, Download, Star, Clock, Users, CheckCircle, Lock, CreditCard, ChevronRight, BookOpen, Smartphone } from 'lucide-react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { academyData } from '../data/academyData'
import { Link, useNavigate } from 'react-router-dom'

export default function Academy() {
    const navigate = useNavigate()
    const [selectedCourse, setSelectedCourse] = useState(null)
    const [showAllCourses, setShowAllCourses] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState('')
    const [registrationStep, setRegistrationStep] = useState(1) // 1: Form, 2: Payment
    const [formData, setFormData] = useState({
        institutionName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: ''
    })

    const [heroRef, heroVisible, heroClasses] = useScrollReveal({ direction: 'fade' })

    const displayedCourses = showAllCourses ? academyData.courses : academyData.courses.slice(0, 3)

    const handleEnroll = (course) => {
        setSelectedCourse(course)
        setRegistrationStep(1) // Always start at form
        setShowPaymentModal(true)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleNextStep = (e) => {
        e.preventDefault()
        // Basic validation
        if (!formData.institutionName || !formData.contactPerson || !formData.phone) {
            alert("Veuillez remplir les champs obligatoires.")
            return
        }
        setRegistrationStep(2)
    }

    const handlePayment = () => {
        // Simulation du paiement et inscription
        // alert(`Inscription réussie pour ${formData.institutionName} !\nCours : ${selectedCourse.title}\nPaiement validé via ${paymentMethod}`)
        setShowPaymentModal(false)
        navigate('/studio', { state: { course: selectedCourse } })

        setFormData({
            institutionName: '',
            contactPerson: '',
            email: '',
            phone: '',
            address: '',
            city: ''
        })
        setPaymentMethod('')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="/images/academy/hero-academy.png"
                        alt="Culinary Academy"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                </div>

                <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
                    <div ref={heroRef} className={`${heroClasses} max-w-3xl`}>
                        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/20">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-white text-sm font-medium">Académie Culinaire Professionnelle</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                            L'Excellence Gastronomique <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">à Portée de Main</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-2xl">
                            Rejoignez l'élite culinaire avec nos formations vidéo exclusives. Des techniques de base aux secrets des grands chefs, apprenez à votre rythme.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="px-8 py-4 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all transform hover:scale-105 flex items-center justify-center">
                                Commencer Maintenant
                                <ChevronRight className="ml-2" />
                            </button>
                            <button className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold text-lg transition-all flex items-center justify-center">
                                Voir le Catalogue
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white dark:bg-gray-800 shadow-xl relative z-20 -mt-10 mx-4 md:mx-auto max-w-6xl rounded-2xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
                {Object.entries(academyData.stats).map(([key, value], idx) => (
                    <div key={idx} className="text-center group">
                        <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">{value}</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider text-xs md:text-sm">{key}</p>
                    </div>
                ))}
            </div>

            {/* Courses Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Nos Formations à la Une</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">Découvrez nos modules les plus populaires, conçus par des experts pour transformer votre passion en talent.</p>
                    </div>
                    <button
                        onClick={() => setShowAllCourses(!showAllCourses)}
                        className="hidden md:flex items-center text-primary font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                    >
                        {showAllCourses ? "Voir moins" : "Voir tout"}
                        <ChevronRight size={20} className={`transform transition-transform ${showAllCourses ? 'rotate-90' : ''}`} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedCourses.map((course) => (
                        <div key={course.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 group">
                            <div className="relative h-56 overflow-hidden">
                                <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                                    {course.category}
                                </div>
                                <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/50 hover:bg-primary/80 hover:border-primary transition-all">
                                        <Play className="text-white fill-current ml-1" size={32} />
                                    </div>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center"><Clock size={16} className="mr-1" /> {course.duration}</div>
                                    <div className="flex items-center"><BookOpen size={16} className="mr-1" /> {course.lessons} Leçons</div>
                                    <div className="flex items-center text-yellow-500"><Star size={16} className="mr-1 fill-current" /> {course.rating}</div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                    {course.description}
                                </p>

                                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Prix</span>
                                        <div className="text-2xl font-bold text-primary">{course.price.toLocaleString()} GNF</div>
                                    </div>
                                    <button
                                        onClick={() => handleEnroll(course)}
                                        className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all transform hover:-translate-y-1 shadow-lg"
                                    >
                                        S'inscrire
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Stripe */}
            <div className="bg-gray-900 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                            <Smartphone size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Accessible Partout</h3>
                        <p className="text-gray-400">Suivez vos cours sur mobile, tablette ou ordinateur, où que vous soyez.</p>
                    </div>
                    <Link to="/resources" className="p-6 block hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform">
                            <Download size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Ressources Téléchargeables</h3>
                        <p className="text-gray-400">Fiches recettes, guides PDF et listes d'ingrédients disponibles hors ligne.</p>
                    </Link>
                    <div className="p-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Certificat de Réussite</h3>
                        <p className="text-gray-400">Obtenez un certificat professionnel après la validation de chaque module.</p>
                    </div>
                </div>
            </div>

            {/* Registration/Payment Modal */}
            {showPaymentModal && selectedCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl transform transition-all animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="absolute top-4 right-4 text-white/60 hover:text-white"
                            >
                                ✕
                            </button>
                            <h3 className="text-2xl font-bold mb-1">
                                {registrationStep === 1 ? 'Formulaire d\'Inscription' : 'Finaliser le Paiement'}
                            </h3>
                            <p className="text-white/70 text-sm">
                                {registrationStep === 1 ? 'Étape 1/2 : Informations' : 'Étape 2/2 : Paiement sécurisé'}
                            </p>
                        </div>

                        <div className="p-8">
                            <div className="flex items-start mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                                <img src={selectedCourse.image} alt="" className="w-20 h-20 rounded-lg object-cover mr-4" />
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 pr-4">{selectedCourse.title}</h4>
                                    <p className="text-primary font-bold text-lg">{selectedCourse.price.toLocaleString()} GNF</p>
                                </div>
                            </div>

                            {registrationStep === 1 ? (
                                <form onSubmit={handleNextStep} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'Institution / Organisation *</label>
                                        <input
                                            type="text"
                                            name="institutionName"
                                            required
                                            value={formData.institutionName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Ex: Restaurant Le Gourmet"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du Responsable *</label>
                                        <input
                                            type="text"
                                            name="contactPerson"
                                            required
                                            value={formData.contactPerson}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="M. Diallo"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="620..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="contact@..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="Quartier, Ville"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full mt-6 py-4 bg-primary hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 transition-all flex items-center justify-center"
                                    >
                                        Continuer vers le Paiement
                                        <ChevronRight size={20} className="ml-2" />
                                    </button>
                                </form>
                            ) : (
                                <div className="animate-fade-in">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Moyen de Paiement</h4>

                                    <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2">
                                        {['Orange Money', 'Mobile Money', 'Carte Bancaire', 'PayPal'].map((method) => (
                                            <div key={method} className={`rounded-xl border-2 transition-all ${paymentMethod === method ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                                                <label className="flex items-center p-4 cursor-pointer w-full">
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value={method}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                                                    />
                                                    <span className="ml-3 font-semibold text-gray-900 dark:text-white">{method}</span>
                                                    {method === 'Orange Money' && <span className="ml-auto text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded">OM</span>}
                                                </label>

                                                {paymentMethod === method && (
                                                    <div className="px-4 pb-4 animate-fade-in pl-12">
                                                        {(method === 'Orange Money' || method === 'Mobile Money') && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Numéro de téléphone</label>
                                                                <input
                                                                    type="tel"
                                                                    placeholder="62..."
                                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary"
                                                                />
                                                            </div>
                                                        )}
                                                        {method === 'Carte Bancaire' && (
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Numéro de Carte</label>
                                                                    <div className="relative">
                                                                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="0000 0000 0000 0000"
                                                                            className="w-full pl-10 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Expiration</label>
                                                                        <input type="text" placeholder="MM/AA" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">CVC</label>
                                                                        <input type="text" placeholder="123" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {method === 'PayPal' && (
                                                            <p className="text-sm text-gray-500 italic">Vous serez redirigé vers PayPal pour finaliser votre paiement de manière sécurisée.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setRegistrationStep(1)}
                                            className="px-6 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                        >
                                            Retour
                                        </button>
                                        <button
                                            onClick={handlePayment}
                                            disabled={!paymentMethod}
                                            className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${paymentMethod
                                                ? 'bg-primary text-white hover:bg-orange-600 shadow-lg shadow-primary/30 transform hover:scale-[1.02]'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Lock size={18} className="mr-2" />
                                            Payer {selectedCourse.price.toLocaleString()} GNF
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                                <CheckCircle size={12} className="mr-1 text-green-500" /> Paiement Sécurisé et Crypté
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
