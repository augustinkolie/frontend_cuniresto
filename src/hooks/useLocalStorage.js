import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour gérer localStorage
 * @param {string} key - Clé de stockage
 * @param {*} initialValue - Valeur initiale
 * @returns {[*, function]} - Valeur et fonction de mise à jour
 */
export function useLocalStorage(key, initialValue) {
  // État pour stocker la valeur
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Récupérer depuis localStorage
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error)
      return initialValue
    }
  })

  // Fonction pour mettre à jour la valeur
  const setValue = (value) => {
    try {
      // Permettre une fonction comme valeur
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      // Sauvegarder dans localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key}:`, error)
    }
  }

  return [storedValue, setValue]
}
