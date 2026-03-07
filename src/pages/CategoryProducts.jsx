import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { mockProducts, mockCategories } from '../data/mockData'

export default function CategoryProducts() {
  const { category } = useParams()
  const [products, setProducts] = useState([])
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    const categoryData = mockCategories.find(c => c.slug === category)
    if (categoryData) {
      setCategoryName(categoryData.name)

      // Mapping des catégories parentes vers les catégories de produits
      const categoryMapping = {
        'plats': ['plats', 'lapin', 'atieke', 'spaghetti'],
        'sandwichs': ['sandwichs'],
        'boissons': ['boissons'],
        'desserts': ['desserts']
      }

      const targetCategories = categoryMapping[categoryData.slug] || [categoryData.slug]

      const filtered = mockProducts.filter(p =>
        targetCategories.includes(p.category.toLowerCase())
      )

      setProducts(filtered)
    }
  }, [category])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          {categoryName}
        </h1>
        <p className="text-gray-600 text-lg">
          Découvrez notre sélection de {categoryName.toLowerCase()}
        </p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            Aucun produit trouvé dans cette catégorie
          </p>
        </div>
      )}
    </div>
  )
}
