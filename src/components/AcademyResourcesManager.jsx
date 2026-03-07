import React, { useState, useEffect } from 'react'
import { Upload, Trash2, FileText, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'

export default function AcademyResourcesManager() {
    const [resources, setResources] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fileUrl: '',
        category: 'recette',
        type: 'pdf'
    })
    const [loading, setLoading] = useState(false)
    const [notification, setNotification] = useState(null)

    // Charger les ressources depuis le localStorage au démarrage
    useEffect(() => {
        const storedResources = localStorage.getItem('academy_resources')
        if (storedResources) {
            setResources(JSON.parse(storedResources))
        } else {
            // Données initiales si vide
            const initialData = [
                {
                    id: 1,
                    title: "Guide des Épices Africaines",
                    description: "Un guide complet sur l'utilisation des épices locales.",
                    fileUrl: "https://example.com/guide-epices.pdf",
                    category: "guide",
                    type: "pdf",
                    date: new Date().toISOString()
                }
            ]
            setResources(initialData)
            localStorage.setItem('academy_resources', JSON.stringify(initialData))
        }
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setLoading(true)

        // Simulation d'upload
        setTimeout(() => {
            const newResource = {
                id: Date.now(),
                ...formData,
                date: new Date().toISOString()
            }

            const updatedResources = [newResource, ...resources]
            setResources(updatedResources)
            localStorage.setItem('academy_resources', JSON.stringify(updatedResources))

            setNotification({ type: 'success', message: 'Ressource ajoutée avec succès !' })
            setFormData({
                title: '',
                description: '',
                fileUrl: '',
                category: 'recette',
                type: 'pdf'
            })
            setLoading(false)

            setTimeout(() => setNotification(null), 3000)
        }, 1000)
    }

    const handleDelete = (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
            const updatedResources = resources.filter(r => r.id !== id)
            setResources(updatedResources)
            localStorage.setItem('academy_resources', JSON.stringify(updatedResources))
            setNotification({ type: 'success', message: 'Ressource supprimée.' })
            setTimeout(() => setNotification(null), 3000)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="text-primary" />
                        Gestion des Ressources Académie
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">Ajoutez et gérez les fichiers téléchargeables pour les étudiants.</p>
                </div>
            </div>

            {notification && (
                <div className={`p-4 rounded-xl flex items-center ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.type === 'success' ? <CheckCircle className="mr-2" size={20} /> : <AlertCircle className="mr-2" size={20} />}
                    {notification.message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulaire d'ajout */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ajouter un fichier</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Fiche Recette Yassa"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Brève description du contenu..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="pdf">PDF</option>
                                        <option value="image">Image (JPG/PNG)</option>
                                        <option value="video">Vidéo</option>
                                        <option value="archive">Archive (ZIP)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="recette">Fiche Recette</option>
                                        <option value="guide">Guide</option>
                                        <option value="cours">Support de Cours</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lien du fichier (Simulation)</label>
                                <input
                                    type="url"
                                    name="fileUrl"
                                    required
                                    value={formData.fileUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">Pour cette démo, entrez une URL d'image ou de document valide.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Upload size={20} className="mr-2" />
                                        Publier la Ressource
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Liste des ressources */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fichiers Disponibles ({resources.length})</h3>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {resources.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Aucune ressource publiée pour le moment.</p>
                                </div>
                            ) : (
                                resources.map((resource) => (
                                    <div key={resource.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start justify-between group">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">{resource.title}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{resource.description}</p>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 uppercase font-semibold">{resource.type}</span>
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 capitalize">{resource.category}</span>
                                                    <span className="text-gray-400">{new Date(resource.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(resource.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
