import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Star } from 'lucide-react'
import Logo from './Logo'

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    // Afficher le loading uniquement sur la page d'accueil
    if (location.pathname === '/') {
      setIsLoading(true)

      // Simuler un temps de chargement minimum pour une meilleure UX
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 2500) // 2.5 secondes de chargement

      return () => clearTimeout(timer)
    } else {
      // Sur les autres pages, ne pas afficher de loading
      setIsLoading(false)
    }
  }, [location.pathname])

  // Afficher uniquement sur la page d'accueil
  if (location.pathname !== '/' || !isLoading) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-[9999] flex items-center justify-center">
      <div className="text-center">
        {/* Logo avec cercles double rotation et étoiles (signaux lumineux) */}
        <div className="mb-12 relative flex justify-center">
          <div className="relative p-1 md:p-1.5 flex items-center justify-center">
            {/* Halo de Lumière Central (Glow source) */}
            <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full animate-pulse-glow"></div>
            
            {/* Signaux Rayonnants (Concentric rings pulsing out) */}
            <div className="absolute w-full h-full border border-primary/30 rounded-full animate-radiate-1"></div>
            <div className="absolute w-full h-full border border-orange-500/20 rounded-full animate-radiate-2"></div>
            
            {/* Anneau extérieur - Rotation horaire (Plus proche) */}
            <div className="absolute -inset-1 border-[3.5px] border-transparent border-t-primary border-l-primary rounded-full animate-spin-slow opacity-80 z-20"></div>
            
            {/* Anneau intérieur - Rotation anti-horaire (Très proche) */}
            <div className="absolute inset-0 border-[2.5px] border-transparent border-b-orange-500 border-r-orange-500 rounded-full animate-spin-reverse opacity-90 z-20"></div>
            
            {/* Étoiles Lumineuses (Orbiting/Blinking stars) */}
            <div className="absolute inset-0 z-30">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-primary animate-signal-blink">
                <Star size={16} fill="currentColor" className="drop-shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="absolute bottom-4 right-4 text-orange-500 animate-signal-blink-delay">
                <Star size={12} fill="currentColor" className="drop-shadow-[0_0_6px_#f97316]" />
              </div>
              <div className="absolute top-1/4 left-0 text-accent animate-signal-blink">
                <Star size={10} fill="currentColor" className="drop-shadow-[0_0_5px_#ff4d4d]" />
              </div>
            </div>

            {/* Logo au centre */}
            <div className="relative z-10">
              <Logo className="w-32 h-32 md:w-36 md:h-36 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" color="#10b981" />
            </div>
          </div>
        </div>

        {/* Nom du restaurant */}
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-orange-500 to-accent bg-clip-text text-transparent mb-4 drop-shadow-lg animate-pulse">
          CuniResto
        </h1>

        {/* Barre de chargement - Effet actif */}
        <div className="w-68 md:w-80 h-1.5 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden mx-auto shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-primary via-orange-500 to-accent rounded-full shadow-lg relative overflow-hidden"
            style={{
              animation: 'progress 2.5s ease-in-out infinite'
            }}
          >
            {/* Effet de brillance (shimmer) qui parcourt la barre */}
            <div 
              className="absolute inset-0 bg-white/20"
              style={{
                width: '30%',
                filter: 'blur(8px)',
                animation: 'shimmer 1.5s infinite linear'
              }}
            ></div>
          </div>
        </div>

        {/* Texte de chargement */}
        <p className="text-gray-600 dark:text-gray-300 mt-6 text-lg animate-pulse font-medium tracking-wide">
          Chargement...
        </p>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 80%; }
          100% { width: 100%; }
        }
        @keyframes shimmer {
          0% { left: -50%; }
          100% { left: 150%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.5; filter: blur(40px); }
          50% { transform: scale(1.2); opacity: 0.8; filter: blur(50px); }
        }
        @keyframes radiate {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes signal-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        .animate-spin-slow {
          animation: spin-slow 2.5s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.8s linear infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .animate-radiate-1 {
          animation: radiate 2s ease-out infinite;
        }
        .animate-radiate-2 {
          animation: radiate 2s ease-out infinite 1s;
        }
        .animate-signal-blink {
          animation: signal-blink 1.5s ease-in-out infinite;
        }
        .animate-signal-blink-delay {
          animation: signal-blink 1.5s ease-in-out infinite 0.7s;
        }
      `}</style>
    </div>
  )
}

