import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour débouncer une valeur
 * @param {*} value - Valeur à débouncer
 * @param {number} delay - Délai en ms
 * @returns {*} - Valeur débounced
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Créer un timer
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Nettoyer le timer si la valeur change avant le délai
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
