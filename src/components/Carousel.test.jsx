import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Carousel from './Carousel'

describe('Carousel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('renders carousel with 5 slides', () => {
    render(<Carousel />)
    
    // Vérifier que le premier slide est visible
    expect(screen.getByText('Bienvenue au Restaurant 3.0')).toBeInTheDocument()
  })

  it('displays slide counter', () => {
    render(<Carousel />)
    
    expect(screen.getByText('1 / 5')).toBeInTheDocument()
  })

  it('renders navigation dots', () => {
    render(<Carousel />)
    
    const dots = screen.getAllByRole('button', { name: /Aller au slide/ })
    expect(dots).toHaveLength(5)
  })

  it('renders navigation arrows', () => {
    render(<Carousel />)
    
    expect(screen.getByLabelText('Slide suivant')).toBeInTheDocument()
    expect(screen.getByLabelText('Slide précédent')).toBeInTheDocument()
  })

  it('navigates to next slide on right arrow click', async () => {
    render(<Carousel />)
    
    const nextButton = screen.getByLabelText('Slide suivant')
    fireEvent.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('2 / 5')).toBeInTheDocument()
    })
  })

  it('navigates to previous slide on left arrow click', async () => {
    render(<Carousel />)
    
    const nextButton = screen.getByLabelText('Slide suivant')
    fireEvent.click(nextButton)
    
    const prevButton = screen.getByLabelText('Slide précédent')
    fireEvent.click(prevButton)
    
    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument()
    })
  })

  it('navigates to specific slide on dot click', async () => {
    render(<Carousel />)
    
    const dots = screen.getAllByRole('button', { name: /Aller au slide/ })
    fireEvent.click(dots[2]) // Click on 3rd dot
    
    await waitFor(() => {
      expect(screen.getByText('3 / 5')).toBeInTheDocument()
    })
  })

  it('auto-plays slides', async () => {
    render(<Carousel />)
    
    expect(screen.getByText('1 / 5')).toBeInTheDocument()
    
    // Avancer le temps de 5 secondes
    vi.advanceTimersByTime(5000)
    
    await waitFor(() => {
      expect(screen.getByText('2 / 5')).toBeInTheDocument()
    })
  })

  it('loops back to first slide after last slide', async () => {
    render(<Carousel />)
    
    // Naviguer jusqu'au dernier slide
    const nextButton = screen.getByLabelText('Slide suivant')
    for (let i = 0; i < 5; i++) {
      fireEvent.click(nextButton)
    }
    
    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument()
    })
  })
})
