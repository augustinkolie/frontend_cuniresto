import React, { useState, useEffect } from 'react'
import { Download, Search, FileText, ArrowLeft, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Resources() {
    const [resources, setResources] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        // Charger les ressources (mêmes données que l'admin)
        const storedResources = localStorage.getItem('academy_resources')
        if (storedResources) {
            setResources(JSON.parse(storedResources))
        } else {
            // Fallback si pas de données (pour éviter page vide au premier chargement si admin n'a rien mis)
            const initialData = [
                {
                    id: 1,
                    title: "Guide des Épices Africaines",
                    description: "Un guide complet sur l'utilisation des épices locales.",
                    fileUrl: "#",
                    category: "guide",
                    type: "pdf",
                    date: new Date().toISOString()
                }
            ]
            setResources(initialData)
        }
    }, [])

    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filter === 'all' || resource.category === filter
        return matchesSearch && matchesFilter
    })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <Link to="/academy" className="inline-flex items-center text-gray-500 hover:text-primary mb-6 transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Retour à l'Académie
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Centre de <span className="text-primary">Ressources</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
                        Accédez à notre bibliothèque de fiches techniques, recettes et guides exclusifs pour perfectionner votre art culinaire.
                    </p>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un document..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter size={20} className="text-gray-400 hidden md:block" />
                        {['all', 'recette', 'guide', 'cours'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap transition-all ${filter === cat
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {cat === 'all' ? 'Tout voir' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.length > 0 ? (
                        filteredResources.map((resource) => (
                            <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                                <div className="h-3 bg-primary"></div>
                                <div className="p-8">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <FileText size={32} />
                                        </div>
                                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                                            {resource.type}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                                            {resource.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                            {resource.description}
                                        </p>
                                    </div>

                                    <a
                                        href={resource.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-white dark:group-hover:bg-primary dark:group-hover:text-white transition-all"
                                    >
                                        <Download size={18} className="mr-2" />
                                        Télécharger
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={40} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun résultat trouvé</h3>
                            <p className="text-gray-500">Essayez de modifier votre recherche ou vos filtres.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
