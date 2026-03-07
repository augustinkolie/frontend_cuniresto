import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCard from './ProductCard'
import { CartProvider } from '../context/CartContext'
import { BrowserRouter } from 'react-router-dom'

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 10000,
  category: 'Test',
  image: '/test.jpg',
  rating: 4.5,
  reviews: 10,
}

const renderProductCard = (product = mockProduct) => {
  return render(
    <BrowserRouter>
      <CartProvider>
        <ProductCard product={product} />
      </CartProvider>
    </BrowserRouter>
  )
}

describe('ProductCard', () => {
  it('renders product information', () => {
    renderProductCard()
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText(/10000/)).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('renders product image', () => {
    renderProductCard()
    
    const image = screen.getByAltText('Test Product')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test.jpg')
  })

  it('renders action buttons', () => {
    renderProductCard()
    
    expect(screen.getByText('Détails')).toBeInTheDocument()
    expect(screen.getByText('Ajouter')).toBeInTheDocument()
  })

  it('has correct link to product detail', () => {
    renderProductCard()
    
    const detailLink = screen.getByText('Détails').closest('a')
    expect(detailLink).toHaveAttribute('href', '/product/1')
  })
})
