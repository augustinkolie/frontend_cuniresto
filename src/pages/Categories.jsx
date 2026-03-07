import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Clock, Star, Utensils, Coffee, Cake, Salad, Beef } from 'lucide-react'
import { mockCategories } from '../data/mockData'
import '../styles/animations.css'

export default function Categories() {
  const [mounted, setMounted] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const categoryIcons = {
    plats: <ChefHat size={32} />,
    sandwichs: <Utensils size={32} />,
    boissons: <Coffee size={32} />,
    desserts: <Cake size={32} />,
    salades: <Salad size={32} />,
    viandes: <Beef size={32} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=800&fit=crop"
            alt="Restaurant Menu Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/70"></div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className={`text-center transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6 animate-float">
              <ChefHat className="text-white" size={40} />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Notre Menu
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Découvrez une expérience culinaire exceptionnelle avec notre sélection de plats préparés 
              avec passion et savoir-faire par nos chefs talentueux
            </p>

            {/* Stats Bar */}
            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="text-center animate-fade-in-up delay-200">
                <div className="text-3xl font-bold text-white mb-2">50+</div>
                <div className="text-white/80">Plats Uniques</div>
              </div>
              <div className="text-center animate-fade-in-up delay-400">
                <div className="text-3xl font-bold text-white mb-2">6</div>
                <div className="text-white/80">Catégories</div>
              </div>
              <div className="text-center animate-fade-in-up delay-600">
                <div className="text-3xl font-bold text-white mb-2">4.9</div>
                <div className="text-white/80">Note Moyenne</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockCategories.map((category, index) => (
            <div
              key={category.id}
              className={`transform transition-all duration-700 ${
                mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Link to={`/category/${category.slug}`}>
                <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white">
                  {/* Image Container */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-500 group-hover:from-black/80"></div>
                    
                    {/* Floating Icon */}
                    <div className={`absolute top-4 right-4 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transition-all duration-500 ${
                      hoveredCategory === category.id ? 'scale-110 rotate-12' : 'scale-100'
                    }`}>
                      <div className="text-primary">
                        {categoryIcons[category.slug] || <Utensils size={24} />}
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-accent text-gray-900 px-3 py-1 rounded-full text-sm font-bold animate-glow">
                        Populaire
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <div className="flex items-center space-x-1 text-accent">
                        <Star size={16} fill="currentColor" />
                        <span className="text-sm font-bold">4.8</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {category.description || 'Découvrez notre sélection de plats délicieux dans cette catégorie'}
                    </p>

                    {/* Features */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>15-30 min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-primary">{category.productCount || 12}</span>
                        <span>plats</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-semibold group-hover:text-secondary transition-colors">
                        Explorer la catégorie
                      </span>
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-all duration-300 group-hover:scale-110">
                        <svg className="w-5 h-5 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl transition-opacity duration-500 ${
                    hoveredCategory === category.id ? 'opacity-100' : 'opacity-0'
                  }`}></div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className={`bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 text-white text-center transform transition-all duration-1000 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à commander ?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Explorez notre menu complet et laissez-vous tenter par nos créations culinaires uniques
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="btn-animated bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all"
            >
              Voir tout le menu
            </Link>
            <Link
              to="/reservation"
              className="btn-animated bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all"
            >
              Réserver une table
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
