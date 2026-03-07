import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react'

export default function Stories({ isOpen, onClose, stories = [] }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef(null)
  const progressIntervalRef = useRef(null)

  // Stories par défaut si aucune n'est fournie
  const defaultStories = [
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
  ]

  const activeStories = stories.length > 0 ? stories : defaultStories
  const currentStory = activeStories[currentStoryIndex]

  useEffect(() => {
    if (!isOpen) {
      setCurrentStoryIndex(0)
      setProgress(0)
      setIsPlaying(true)
      return
    }

    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext()
            return 0
          }
          return prev + 2 // 5 secondes pour compléter (100 / 2 = 50 intervalles de 100ms)
        })
      }, 100)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isOpen, isPlaying, currentStoryIndex])

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
      videoRef.current.muted = isMuted
    }
  }, [isPlaying, isMuted, currentStoryIndex])

  const handleNext = () => {
    if (currentStoryIndex < activeStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
      setProgress(0)
    }
  }

  const handleProgressClick = (index) => {
    setCurrentStoryIndex(index)
    setProgress(0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Barre de progression */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
        {activeStories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
            onClick={() => handleProgressClick(index)}
          >
            <div
              className={`h-full bg-white transition-all duration-100 ${
                index === currentStoryIndex ? 'w-full' : index < currentStoryIndex ? 'w-full' : 'w-0'
              }`}
              style={{
                width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 text-white p-2 rounded-full hover:bg-white/20 transition"
      >
        <X size={24} />
      </button>

      {/* Contenu de la story */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentStory.url}
            className="w-full h-full object-contain"
            loop={false}
            onEnded={handleNext}
            playsInline
          />
        ) : (
          <img
            src={currentStory.url}
            alt={currentStory.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay avec informations */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
          <h3 className="text-white text-2xl font-bold mb-2">{currentStory.title}</h3>
          <p className="text-white/90 text-lg">{currentStory.description}</p>
        </div>

        {/* Contrôles vidéo */}
        {currentStory.type === 'video' && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white p-3 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white p-3 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        )}

        {/* Navigation */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-3 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm z-20"
          disabled={currentStoryIndex === 0}
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-3 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm z-20"
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  )
}


