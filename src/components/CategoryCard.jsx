import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CategoryCard({ category, image }) {
  return (
    <Link to={`/category/${category.slug}`}>
      <div className="relative rounded-lg overflow-hidden h-64 group cursor-pointer">
        {/* Image */}
        <img
          src={image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h3 className="text-3xl font-bold mb-4">{category.name}</h3>
          <div className="flex items-center space-x-2 bg-primary px-4 py-2 rounded-lg group-hover:bg-orange-600 transition">
            <span>Explorer</span>
            <ArrowRight size={20} />
          </div>
        </div>
      </div>
    </Link>
  )
}
