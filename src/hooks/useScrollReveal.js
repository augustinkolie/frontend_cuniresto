import { useState, useEffect, useRef } from 'react'

export const useScrollReveal = (options = {}) => {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -100px 0px',
    direction = 'up', // 'up', 'down', 'left', 'right', 'fade', 'scale'
    delay = 0,
    duration = 800
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
        } else {
          // Réinitialiser l'animation si l'élément sort de la vue (scroll vers le haut)
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, delay])

  // Classes CSS basées sur la direction
  const getAnimationClasses = () => {
    const baseTransition = 'transition-all ease-out'
    
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `opacity-0 translate-y-10 ${baseTransition}`
        case 'down':
          return `opacity-0 -translate-y-10 ${baseTransition}`
        case 'left':
          return `opacity-0 translate-x-10 ${baseTransition}`
        case 'right':
          return `opacity-0 -translate-x-10 ${baseTransition}`
        case 'fade':
          return `opacity-0 ${baseTransition}`
        case 'scale':
          return `opacity-0 scale-95 ${baseTransition}`
        default:
          return `opacity-0 translate-y-10 ${baseTransition}`
      }
    }
    return `opacity-100 translate-y-0 translate-x-0 scale-100 ${baseTransition}`
  }

  // Style inline pour la durée
  const getStyle = () => {
    return {
      transitionDuration: `${duration}ms`
    }
  }

  return [ref, isVisible, getAnimationClasses(), getStyle()]
}
