import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Play, Video, Clock, Eye, Heart, Upload, X, Save, AlertCircle, ChefHat } from 'lucide-react'
import { api } from '../utils/api'

export default function ChefContentManager() {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingContent, setEditingContent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    chef: '',
    chefImage: '',
    thumbnail: null,
    videoUrl: '',
    streamUrl: '',
    isLive: false,
    liveStartTime: '',
    liveEndTime: '',
    duration: '',
    category: 'preparation',
    product: '',
    status: 'draft',
    featured: false
  })
  const [thumbnailPreview, setThumbnailPreview] = useState(null)

  useEffect(() => {
    loadContents()
  }, [])

  const loadContents = async () => {
    setLoading(true)
    try {
      const response = await api.getChefContents({ limit: 100 })
      if (response && response.success) {
        setContents(response.contents || [])
      }
    } catch (error) {
      console.error('Erreur chargement contenus:', error)
      alert('Erreur lors du chargement des contenus')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        if (key !== 'thumbnail' || formData.thumbnail) {
          if (formData[key] !== null && formData[key] !== '') {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      let response
      if (editingContent) {
        response = await api.updateChefContent(editingContent.id, formDataToSend)
      } else {
        response = await api.createChefContent(formDataToSend)
      }

      if (response && response.success) {
        alert(editingContent ? 'Contenu mis à jour avec succès' : 'Contenu créé avec succès')
        setShowModal(false)
        resetForm()
        loadContents()
      } else {
        alert(response?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde contenu:', error)
      alert('Erreur lors de la sauvegarde du contenu')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (content) => {
    setEditingContent(content)
    setFormData({
      title: content.title || '',
      description: content.description || '',
      type: content.type || 'video',
      chef: content.chef || '',
      chefImage: content.chefImage || '',
      thumbnail: null,
      videoUrl: content.videoUrl || '',
      streamUrl: content.streamUrl || '',
      isLive: content.isLive || false,
      liveStartTime: content.liveStartTime ? new Date(content.liveStartTime).toISOString().slice(0, 16) : '',
      liveEndTime: content.liveEndTime ? new Date(content.liveEndTime).toISOString().slice(0, 16) : '',
      duration: content.duration || '',
      category: content.category || 'preparation',
      product: content.product?.id || '',
      status: content.status || 'draft',
      featured: content.featured || false
    })
    setThumbnailPreview(content.thumbnail ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${content.thumbnail}` : null)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      return
    }

    try {
      const response = await api.deleteChefContent(id)
      if (response && response.success) {
        alert('Contenu supprimé avec succès')
        loadContents()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'video',
      chef: '',
      chefImage: '',
      thumbnail: null,
      videoUrl: '',
      streamUrl: '',
      isLive: false,
      liveStartTime: '',
      liveEndTime: '',
      duration: '',
      category: 'preparation',
      product: '',
      status: 'draft',
      featured: false
    })
    setThumbnailPreview(null)
    setEditingContent(null)
  }

  const getTypeLabel = (type) => {
    const labels = {
      tutorial: 'Tutoriel',
      live: 'Direct',
      video: 'Vidéo'
    }
    return labels[type] || type
  }

  const getStatusBadge = (status, isLive) => {
    if (isLive) {
      return <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">🔴 EN DIRECT</span>
    }
    const badges = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || badges.draft}`}>{status}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contenus des Chefs</h2>
          <p className="text-gray-600 dark:text-gray-400">Gérez les tutoriels et directs des chefs</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          <Plus size={20} />
          Nouveau Contenu
        </button>
      </div>

      {loading && !contents.length ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Video size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun contenu pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <div
              key={content.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {content.thumbnail ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}${content.thumbnail}`}
                    alt={content.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={48} className="text-gray-400" />
                  </div>
                )}
                {content.featured && (
                  <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-bold">
                    Vedette
                  </div>
                )}
                {getStatusBadge(content.status, content.isLive)}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{content.title}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {getTypeLabel(content.type)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {content.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <ChefHat size={14} />
                    {content.chef}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={14} />
                    {content.views || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(content)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    <Edit2 size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary to-accent p-6 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {editingContent ? 'Modifier le Contenu' : 'Nouveau Contenu'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-white hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="video">Vidéo</option>
                    <option value="tutorial">Tutoriel</option>
                    <option value="live">Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nom du Chef *
                  </label>
                  <input
                    type="text"
                    name="chef"
                    value={formData.chef}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="preparation">Préparation</option>
                    <option value="cooking">Cuisson</option>
                    <option value="plating">Présentation</option>
                    <option value="technique">Technique</option>
                    <option value="recipe">Recette</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    URL Vidéo *
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    required
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {formData.type === 'live' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        URL Stream (RTMP/HLS)
                      </label>
                      <input
                        type="url"
                        name="streamUrl"
                        value={formData.streamUrl}
                        onChange={handleInputChange}
                        placeholder="rtmp://... ou https://..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Début du Direct
                      </label>
                      <input
                        type="datetime-local"
                        name="liveStartTime"
                        value={formData.liveStartTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Fin du Direct
                      </label>
                      <input
                        type="datetime-local"
                        name="liveEndTime"
                        value={formData.liveEndTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Durée (secondes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Miniature *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700"
                  />
                  {thumbnailPreview && (
                    <img src={thumbnailPreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isLive"
                    checked={formData.isLive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">En Direct</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mettre en vedette</span>
                </label>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  <Save size={20} />
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


