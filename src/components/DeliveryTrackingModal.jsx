import React, { useState, useEffect } from 'react'
import { X, Phone, MapPin, Navigation, Clock, CheckCircle, User } from 'lucide-react'

export default function DeliveryTrackingModal({ order, delivery, onClose }) {
    const [eta, setEta] = useState('15-20 min')
    const [statusStep, setStatusStep] = useState(1)

    // Simulation de la progression
    useEffect(() => {
        if (!order) return

        // Déterminer l'étape actuelle basée sur le statut
        switch (order.status) {
            case 'confirmed': setStatusStep(1); break;
            case 'preparing': setStatusStep(2); break;
            case 'ready': setStatusStep(3); break;
            case 'out_for_delivery': setStatusStep(4); break;
            case 'delivered': setStatusStep(5); break;
            default: setStatusStep(1);
        }
    }, [order])

    const steps = [
        { label: 'Confirmée', icon: <CheckCircle size={16} /> },
        { label: 'En cuisine', icon: <User size={16} /> },
        { label: 'En route', icon: <Navigation size={16} /> },
        { label: 'Livrée', icon: <MapPin size={16} /> }
    ]

    // Données du livreur (réel ou simulé)
    console.log('🚚 [Modal] Order Prop:', order)
    console.log('🚚 [Modal] Delivery Prop:', delivery)
    console.log('🚚 [Modal] Order DeliveryStatus:', order?.deliveryStatus)
    console.log('🚚 [Modal] Nested DeliveryStatus:', delivery?.order?.deliveryStatus)

    // On cherche d'abord dans l'ordre principal, puis dans l'ordre imbriqué dans la livraison
    const manualDriver = order?.deliveryStatus?.driver || delivery?.order?.deliveryStatus?.driver
    const systemDriver = delivery?.deliveryPerson

    // Priorité au driver manuel s'il a un nom, sinon système
    const assignedDriver = (manualDriver && manualDriver.name) ? manualDriver : systemDriver

    // S'il n'y a pas de livreur assigné, on affiche null pour gérer l'affichage proprement
    const driver = assignedDriver ? {
        name: assignedDriver.name || `${assignedDriver.nom || ''} ${assignedDriver.prenom || ''}`.trim(),
        phone: assignedDriver.phone || assignedDriver.telephone,
        vehicle: assignedDriver.vehicle || 'Véhicule de livraison',
        avatar: assignedDriver.avatar || assignedDriver.profileImage
    } : null // Plus de fallback statique invisible



    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header Map Simulation */}
                <div className="relative h-64 bg-gray-100 dark:bg-gray-700 w-full">
                    {/* Simulation de carte Google Maps */}
                    <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Conakry,Guinea&zoom=13&size=600x300&scale=2&maptype=roadmap&style=feature:poi|visibility:off&key=YOUR_API_KEY_HERE')] bg-cover bg-center opacity-70 grayscale-[20%]"></div>

                    {/* Fallback visuel si pas d'image de carte */}
                    <div className="absolute inset-0 bg-blue-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center z-10 relative border-2 border-blue-500">
                                <Navigation className="text-blue-500 fill-blue-500" size={24} />
                            </div>
                        </div>
                        <p className="mt-2 font-bold text-gray-800 dark:text-white bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full text-xs backdrop-blur-md shadow-sm">
                            En route vers {order?.deliveryInfo?.address || 'votre domicile'}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:scale-105 transition text-gray-800 dark:text-white"
                    >
                        <X size={20} />
                    </button>

                    {/* Badge ETA */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-2 rounded-full shadow-xl flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Arrivée estimée</span>
                            <span className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                {eta}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Driver Info & Status */}
                <div className="p-6 bg-white dark:bg-gray-800 flex-1 overflow-y-auto">
                    {/* Driver Card - Affiché uniquement si un livreur est assigné */}
                    {driver && (
                        <div className="flex items-center gap-4 mb-8 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex items-center justify-center border-2 border-white dark:border-gray-500 shadow-md">
                                    {driver.avatar ? (
                                        <img
                                            src={driver.avatar.startsWith('http') ? driver.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${driver.avatar}`}
                                            alt="Livreur"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={32} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800"></div>
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{driver.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Navigation size={12} /> {driver.vehicle}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">★ 4.9</span>
                                    <span className="text-xs text-gray-400"> • 120+ livraisons</span>
                                </div>
                            </div>

                            <a
                                href={driver.phone ? `tel:${driver.phone.replace(/\s/g, '')}` : '#'}
                                className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors shadow-sm flex items-center justify-center"
                                title="Appeler le livreur"
                            >
                                <Phone size={24} />
                            </a>
                        </div>
                    )}

                    {/* Timeline Status */}
                    <div className="relative pl-4">
                        {/* Ligne verticale */}
                        <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                        <div className="space-y-6">
                            {steps.map((step, index) => {
                                const isCompleted = index + 1 < statusStep;
                                const isCurrent = index + 1 === statusStep;

                                return (
                                    <div key={index} className={`flex items-center gap-4 relative ${isCompleted || isCurrent ? 'opacity-100' : 'opacity-40 grayscale'
                                        }`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white dark:border-gray-800 shadow-sm ${isCompleted ? 'bg-green-500 text-white' :
                                            isCurrent ? 'bg-primary text-white scale-110 ring-4 ring-orange-100 dark:ring-orange-900/30' :
                                                'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                            }`}>
                                            {step.icon}
                                        </div>
                                        <div>
                                            <p className={`font-bold ${isCurrent ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">En cours...</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    )
}
