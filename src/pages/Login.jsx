import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'
import { api } from '../utils/api'
import { Mail, User, Eye, EyeOff, Lock } from 'lucide-react'
import '../styles/animations.css'

// Style pour cacher le footer sur la page login
const hideFooterStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1: email, 2: code, 3: new password
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState({
    password: '',
    confirmPassword: ''
  })
  const navigate = useNavigate()
  const { login, register, loginWithGoogle, updateUser, user } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  // Register form
  const [registerData, setRegisterData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setLoginData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegisterChange = (e) => {
    const { name, value } = e.target
    setRegisterData(prev => ({ ...prev, [name]: value }))
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setErrors([])

    if (!resetEmail) {
      setErrors(['Veuillez entrer votre adresse email'])
      return
    }

    if (!validateEmail(resetEmail)) {
      setErrors(['Email invalide'])
      return
    }

    setLoading(true)

    try {
      const result = await api.forgotPassword(resetEmail)

      if (result.success) {
        setResetStep(2)
        // En développement, afficher le code dans la console
        if (result.resetCode) {
          console.log('🔐 Code de récupération (développement):', result.resetCode)
        }
      } else {
        setErrors([result.message || 'Une erreur est survenue. Veuillez réessayer.'])
      }
    } catch (error) {
      console.error('Erreur forgot password:', error)
      setErrors([error.message || 'Une erreur est survenue. Veuillez réessayer.'])
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    const code = verificationCode.join('')
    if (code.length < 6) {
      setErrors(['Veuillez entrer le code à 6 chiffres'])
      return
    }

    setLoading(true)
    setErrors([])

    try {
      const result = await api.verifyCode(resetEmail, code)
      if (result.success) {
        setResetStep(3)
      } else {
        setErrors([result.message || 'Code invalide'])
      }
    } catch (error) {
      setErrors([error.message || 'Erreur lors de la vérification'])
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setErrors([])

    if (newPassword.password.length < 8) {
      setErrors(['Le mot de passe doit faire au moins 8 caractères'])
      return
    }

    if (newPassword.password !== newPassword.confirmPassword) {
      setErrors(['Les mots de passe ne correspondent pas'])
      return
    }

    setLoading(true)
    try {
      // Pour le nouveau système, on utilise le code comme token
      const code = verificationCode.join('')
      const result = await api.resetPassword(code, resetEmail, newPassword.password)

      if (result.success) {
        setResetSuccess(true)
        setTimeout(() => {
          setShowForgotPassword(false)
          resetResetStates()
        }, 3000)
      } else {
        setErrors([result.message || 'Erreur lors de la réinitialisation'])
      }
    } catch (error) {
      setErrors([error.message || 'Erreur lors de la réinitialisation'])
    } finally {
      setLoading(false)
    }
  }

  const resetResetStates = () => {
    setResetEmail('')
    setResetStep(1)
    setVerificationCode(['', '', '', '', '', ''])
    setNewPassword({ password: '', confirmPassword: '' })
    setResetSuccess(false)
    setErrors([])
  }

  const handleCodeChange = (index, value) => {
    if (isNaN(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value.substring(value.length - 1)
    setVerificationCode(newCode)

    // Focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      if (prevInput) {
        prevInput.focus()
        const newCode = [...verificationCode]
        newCode[index - 1] = ''
        setVerificationCode(newCode)
      }
    }
  }

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrors([])
    const newErrors = []

    if (!loginData.email || !loginData.password) {
      newErrors.push('Renseigner tous les champs')
    } else if (!validateEmail(loginData.email)) {
      newErrors.push('Email invalide')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const result = await login(loginData.email, loginData.password)
      if (result.success) {
        navigate('/')
      } else {
        setErrors([result.message || 'Erreur de connexion'])
      }
    } catch (error) {
      setErrors([error.message || 'Erreur lors de la connexion'])
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setErrors([])
    const newErrors = []

    if (!registerData.nom || !registerData.prenom || !registerData.email || !registerData.password || !registerData.confirmPassword) {
      newErrors.push('Renseigner tous les champs')
    } else if (!validateEmail(registerData.email)) {
      newErrors.push('Email invalide')
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.push('Les deux mots de passe ne concordent pas')
    } else if (registerData.password.length <= 7) {
      newErrors.push('Le mot de passe doit faire au moins 8 caractères')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const result = await register({
        email: registerData.email,
        password: registerData.password,
        nom: registerData.nom,
        prenom: registerData.prenom
      })
      if (result.success) {
        navigate('/')
      } else {
        setErrors([result.message || 'Erreur d\'inscription'])
      }
    } catch (error) {
      setErrors([error.message || 'Erreur lors de l\'inscription'])
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true)
        setErrors([])
        const result = await loginWithGoogle(tokenResponse.access_token)
        if (result.success) {
          navigate(result.user?.role === 'admin' ? '/admin' : '/')
        } else {
          setErrors([result.message])
        }
      } catch (error) {
        setErrors(['Une erreur est survenue lors de la connexion Google'])
      } finally {
        setLoading(false)
      }
    },
    onError: () => setErrors(['Échec de la connexion Google'])
  })

  const handleFacebookLogin = () => {
    setErrors(['La connexion Facebook n\'est pas encore configurée avec notre nouveau système MySQL.'])
  }

  return (
    <div style={hideFooterStyle} className="h-screen w-screen bg-white overflow-hidden">
      <div className={`w-full h-full transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="bg-white h-full w-full overflow-hidden">
          <div className="flex flex-col md:flex-row h-full w-full">
            {/* Left Panel - Image/Branding */}
            <div className="relative w-full md:w-[55%] lg:w-[60%] flex flex-col justify-center items-center text-white hidden md:flex overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop"
                  alt="Restaurant Background"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/80"></div>
              </div>

              {/* Animated Decorative Elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-full -translate-x-16 -translate-y-16 ${mounted ? 'animate-pulse' : ''}`}></div>
                <div className={`absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-white/20 to-white/5 rounded-full translate-x-24 translate-y-24 ${mounted ? 'animate-pulse' : ''}`}></div>
                <div className={`absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full -translate-x-1/2 -translate-y-1/2 ${mounted ? 'animate-spin-slow' : ''}`}></div>
              </div>

              <div className={`relative z-10 text-center transform transition-all duration-700 delay-300 w-full px-4 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 break-words leading-tight premium-title-animated">
                  Bienvenues à CuniResto
                </h1>
                <p className="text-white/90 mb-6 md:mb-8 max-w-md mx-auto text-base sm:text-lg md:text-xl lg:text-2xl px-2 leading-relaxed premium-subtitle-animated">
                  Connectez-vous pour profiter d'une expérience culinaire exceptionnelle
                </p>

                {/* Animated Social Login Icons */}
                <div className={`flex justify-center space-x-4 mt-4`}>
                  <div
                    onClick={() => handleGoogleLogin()}
                    className="premium-icon-animated group w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 cursor-pointer transform hover:scale-110 hover:rotate-12"
                    title="Connexion Google"
                  >
                    <span className="text-sm md:text-base font-bold group-hover:text-primary transition">G</span>
                  </div>
                  <div className="premium-icon-animated group w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 cursor-pointer transform hover:scale-110 hover:rotate-12">
                    <span className="text-sm md:text-base font-bold group-hover:text-primary transition">A</span>
                  </div>
                  <div className="premium-icon-animated group w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 cursor-pointer transform hover:scale-110 hover:rotate-12">
                    <span className="text-sm md:text-base font-bold group-hover:text-primary transition">f</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className={`w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-6 sm:px-8 md:px-10 lg:px-16 py-8 transform transition-all duration-700 delay-500 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'} overflow-y-auto max-h-screen`}>
              {/* Animated Toggle Tabs */}
              <div className="flex mb-6 md:mb-8 border-b border-gray-200 relative">
                <div className={`absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ${isLogin ? 'left-0 w-1/2' : 'left-1/2 w-1/2'}`}></div>
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setErrors([])
                  }}
                  className={`flex-1 pb-3 md:pb-4 font-semibold text-sm sm:text-base transition-all duration-300 relative ${isLogin
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <span className="relative z-10">Se connecter</span>
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setErrors([])
                  }}
                  className={`flex-1 pb-3 md:pb-4 font-semibold text-sm sm:text-base transition-all duration-300 relative ${!isLogin
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <span className="relative z-10">S'inscrire</span>
                </button>
              </div>

              {/* Animated Errors */}
              {errors.length > 0 && (
                <div className="mb-6 space-y-2">
                  {errors.map((error, i) => (
                    <div
                      key={i}
                      className="error-message-animated bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {isLogin ? (
                // Login Form
                <form onSubmit={handleLoginSubmit} className="space-y-4 md:space-y-6">
                  <div className="form-field-animated">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        name="email"
                        value={loginData.email}
                        onChange={handleLoginChange}
                        placeholder="Entrez votre email"
                        className="form-input-animated w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div className="form-field-animated">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        placeholder="Entrez votre mot de passe"
                        className="form-input-animated w-full pl-10 pr-10 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 form-field-animated">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary focus:ring-primary" />
                      <span className="text-xs sm:text-sm text-gray-600">Se souvenir de moi</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs sm:text-sm text-primary hover:underline transition-colors"
                    >
                      Mot de passe oublié?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-animated w-full bg-primary text-white py-2.5 md:py-3 rounded-xl font-semibold disabled:opacity-50 relative overflow-hidden text-sm md:text-base"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Connexion...
                      </span>
                    ) : (
                      'Se connecter'
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-4 md:my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="px-4 bg-white text-gray-500">Ou continuer avec</span>
                    </div>
                  </div>

                  {/* Social Login Buttons */}
                  <div className="space-y-2 md:space-y-3">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-2.5 md:py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="hidden sm:inline">Continuer avec Google</span>
                      <span className="sm:hidden">Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFacebookLogin}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-2.5 md:py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                      <span className="hidden sm:inline">Continuer avec Facebook</span>
                      <span className="sm:hidden">Facebook</span>
                    </button>
                  </div>
                </form>
              ) : (
                // Register Form
                <form onSubmit={handleRegisterSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Nom
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="nom"
                          value={registerData.nom}
                          onChange={handleRegisterChange}
                          placeholder="Votre nom"
                          className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Prénom
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="prenom"
                          value={registerData.prenom}
                          onChange={handleRegisterChange}
                          placeholder="Votre prénom"
                          className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        name="email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        placeholder="Entrez votre email"
                        className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={registerData.password}
                        onChange={handleRegisterChange}
                        placeholder="Entrez votre mot de passe"
                        className="w-full pl-10 pr-10 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={registerData.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="Confirmez votre mot de passe"
                        className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-2 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="text-xs sm:text-sm text-gray-600">J'accepte les conditions d'utilisation</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-2.5 md:py-3 rounded-xl hover:bg-orange-600 transition font-semibold disabled:opacity-50 text-sm md:text-base"
                  >
                    {loading ? 'Inscription...' : "S'inscrire"}
                  </button>
                </form>
              )}

              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 transform transition-all my-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Récupération du compte</h3>
                      <button
                        onClick={() => {
                          setShowForgotPassword(false)
                          resetResetStates()
                        }}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <EyeOff size={20} />
                      </button>
                    </div>

                    {resetSuccess ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lock className="text-green-600" size={32} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Succès!</h4>
                        <p className="text-gray-600 text-sm">
                          Votre mot de passe a été réinitialisé avec succès.
                        </p>
                        <p className="text-gray-400 text-xs mt-4">
                          Retour à la connexion...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Step 1: Email */}
                        {resetStep === 1 && (
                          <form onSubmit={handleForgotPassword} className="space-y-4">
                            <p className="text-gray-600 text-sm">
                              Entrez votre email pour recevoir un code de récupération à 6 chiffres.
                            </p>
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                  type="email"
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  placeholder="nom@exemple.com"
                                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                  required
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                            >
                              {loading ? 'Envoi...' : 'Envoyer le code'}
                            </button>
                          </form>
                        )}

                        {/* Step 2: Code Verification */}
                        {resetStep === 2 && (
                          <form onSubmit={handleVerifyCode} className="space-y-6">
                            <div className="text-center">
                              <p className="text-gray-600 text-sm mb-4">
                                Entrez le code à 6 chiffres envoyé à <br /><strong>{resetEmail}</strong>
                              </p>
                              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                                {verificationCode.map((digit, i) => (
                                  <input
                                    key={i}
                                    id={`code-${i}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleCodeChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                                  />
                                ))}
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={loading || verificationCode.some(d => !d)}
                              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                            >
                              {loading ? 'Vérification...' : 'Vérifier le code'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setResetStep(1)}
                              className="w-full text-gray-500 text-sm hover:underline"
                            >
                              Modifier l'email
                            </button>
                          </form>
                        )}

                        {/* Step 3: New Password */}
                        {resetStep === 3 && (
                          <form onSubmit={handleResetPassword} className="space-y-4">
                            <p className="text-gray-600 text-sm">
                              Créez votre nouveau mot de passe sécurisé.
                            </p>
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">Nouveau mot de passe</label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                  type="password"
                                  value={newPassword.password}
                                  onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-2">Confirmer le mot de passe</label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                  type="password"
                                  value={newPassword.confirmPassword}
                                  onChange={(e) => setNewPassword({ ...newPassword, confirmPassword: e.target.value })}
                                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                  required
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
                            >
                              {loading ? 'Réinitialisation...' : 'Changer le mot de passe'}
                            </button>
                          </form>
                        )}

                        {errors.length > 0 && (
                          <div className="space-y-2">
                            {errors.map((error, i) => (
                              <div key={i} className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                {error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false)
                          resetResetStates()
                        }}
                        className="text-gray-400 hover:text-gray-600 transition text-sm flex items-center"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
