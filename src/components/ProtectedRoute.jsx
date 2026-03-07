import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) {
        // Rediriger vers la page de connexion tout en sauvegardant l'URL demandée
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />
    }

    return children
}
