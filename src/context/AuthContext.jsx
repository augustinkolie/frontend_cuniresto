import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      const savedUser = localStorage.getItem('user')

      if (token && savedUser) {
        try {
          // Restaurer l'utilisateur depuis localStorage immédiatement
          // pour éviter la déconnexion pendant le chargement
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)

          // Vérifier que le token est toujours valide en arrière-plan
          try {
            const response = await api.getMe()
            if (response.success && response.user) {
              // Mettre à jour avec les données fraîches du serveur
              setUser(response.user)
              localStorage.setItem('user', JSON.stringify(response.user))
            }
          } catch (error) {
            // Si c'est une erreur 401 (token invalide/expiré), déconnecter
            const isTokenError = error.response?.status === 401 ||
              error.response?.data?.message?.includes('Token') ||
              error.response?.data?.message?.includes('expiré') ||
              error.response?.data?.message?.includes('invalide')

            if (isTokenError) {
              api.logout()
              setUser(null)
            }
          }
        } catch (error) {
          // Erreur de parsing JSON, nettoyer
          console.error('Erreur parsing user:', error)
          api.logout()
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password)
      if (response.success) {
        setUser(response.user)
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Erreur de connexion' }
    } catch (error) {
      console.error('Erreur login:', error)
      return {
        success: false,
        message: error.message || error.response?.data?.message || 'Erreur lors de l\'connexion. Vérifiez que le serveur est démarré.'
      }
    }
  }

  const loginWithGoogle = async (token) => {
    try {
      const response = await api.googleLogin(token)
      if (response.success) {
        setUser(response.user)
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Erreur d\'authentification Google' }
    } catch (error) {
      console.error('Erreur Google login:', error)
      return {
        success: false,
        message: error.message || error.response?.data?.message || 'Erreur lors de l\'authentification Google.'
      }
    }
  }

  const logout = () => {
    api.logout()
    setUser(null)
  }

  const register = async (userData) => {
    try {
      const response = await api.register(userData)
      if (response.success) {
        setUser(response.user)
        return { success: true, message: response.message }
      }
      return { success: false, message: response.message || 'Erreur d\'inscription' }
    } catch (error) {
      console.error('Erreur register:', error)
      return {
        success: false,
        message: error.message || error.response?.data?.message || 'Erreur lors de l\'inscription. Vérifiez que le serveur est démarré.'
      }
    }
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const value = React.useMemo(() => ({
    user, loading, login, loginWithGoogle, logout, register, updateUser
  }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
