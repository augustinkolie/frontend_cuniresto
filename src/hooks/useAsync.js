import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour gérer les appels asynchrones
 * @param {function} asyncFunction - Fonction asynchrone à exécuter
 * @param {boolean} immediate - Exécuter immédiatement
 * @returns {object} - État de la requête
 */
export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  // Fonction pour exécuter la requête
  const execute = async () => {
    setStatus('pending')
    setData(null)
    setError(null)

    try {
      const response = await asyncFunction()
      setData(response)
      setStatus('success')
      return response
    } catch (err) {
      setError(err)
      setStatus('error')
      throw err
    }
  }

  // Exécuter au montage si immediate est true
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [])

  return { execute, status, data, error }
}
