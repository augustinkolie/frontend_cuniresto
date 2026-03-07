import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login?error=' + error)
      return
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        
        // Sauvegarder le token et l'utilisateur
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Mettre à jour le contexte
        updateUser(user)
        
        // Rediriger vers la page d'accueil
        navigate('/')
      } catch (error) {
        console.error('Erreur parsing user:', error)
        navigate('/login?error=parse_error')
      }
    } else {
      navigate('/login?error=missing_params')
    }
  }, [searchParams, navigate, updateUser])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  )
}




