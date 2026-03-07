import React, { useState, useEffect } from 'react'
import { Play, Video, Clock, Eye, Heart, Radio, AlertCircle } from 'lucide-react'
import { api } from '../utils/api'
import ChefVideo from './ChefVideo'

export default function ChefContentSection() {
  const [contents, setContents] = useState([])
  const [liveContents, setLiveContents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('all') // all, tutorial, live, video

  useEffect(() => {
    loadContents()
    loadLiveContents()

    // Recharger les lives toutes les 30 secondes
    const interval = setInterval(() => {
      loadLiveContents()
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedType])

  const loadContents = async () => {
    setLoading(true)
    try {
      const params = { status: 'published', limit: 12 }
      if (selectedType !== 'all') {
        params.type = selectedType
      }

      const response = await api.getChefContents(params)
      if (response && response.success) {
        setContents(response.contents || [])
      }
    } catch (error) {
      console.error('Erreur chargement contenus:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLiveContents = async () => {
    try {
      const response = await api.getLiveContents()
      if (response && response.success) {
        setLiveContents(response.contents || [])
      }
    } catch (error) {
      console.error('Erreur chargement lives:', error)
    }
  }

  const handleLike = async (contentId) => {
    try {
      await api.likeChefContent(contentId)
      loadContents()
    } catch (error) {
      console.error('Erreur like:', error)
    }
  }

  const filteredContents = selectedType === 'all'
    ? contents
    : contents.filter(c => c.type === selectedType)

  return (
    <section className="py-20 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mb-5 shadow-lg">
            <Video className="text-white" size={28} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Expérience <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Immersive</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-normal">
            Découvrez nos chefs en action, préparant vos plats préférés avec passion et expertise
          </p>
        </div>

        {/* Lives Actifs */}
        {liveContents.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Radio className="text-red-500 animate-pulse" size={24} />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Directs en Cours</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveContents.map((content) => (
                <div key={content.id} className="relative">
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                    <Radio size={16} />
                    <span className="font-bold">EN DIRECT</span>
                  </div>
                  <ChefVideo
                    videoUrl={content.streamUrl || content.videoUrl}
                    title={content.title}
                    description={content.description}
                    thumbnail={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${content.thumbnail}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'tutorial', label: 'Tutoriels' },
            { id: 'live', label: 'Directs' },
            { id: 'video', label: 'Vidéos' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedType(filter.id)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${selectedType === filter.id
                ? 'bg-primary text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Liste des Contenus */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-300">Chargement...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <Video size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun contenu disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredContents.map((content) => {
              const thumbnailUrl = content.thumbnail
                ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${content.thumbnail}`
                : null

              return (
                <div key={content.id} className="space-y-4">
                  <ChefVideo
                    videoUrl={content.videoUrl}
                    title={content.title}
                    description={content.description}
                    thumbnail={thumbnailUrl}
                  />
                  <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {content.chefImage && (
                          <img
                            src={content.chefImage}
                            alt={content.chef}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{content.chef}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{content.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {content.views || 0}
                        </span>
                        <button
                          onClick={() => handleLike(content.id)}
                          className="flex items-center gap-1 hover:text-primary transition"
                        >
                          <Heart size={16} />
                          {content.likes?.length || 0}
                        </button>
                      </div>
                    </div>
                    {content.duration && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={14} />
                        {Math.floor(content.duration / 60)}:{(content.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}


