import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, X, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { api } from '../utils/api'

export default function VoiceAssistant({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' | 'error' | 'info'
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [products, setProducts] = useState([])
  const recognitionRef = useRef(null)
  const { addItem } = useCart()

  // Charger les produits au montage
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await api.getProducts({ limit: 1000 })
      if (response && response.success) {
        setProducts(response.products || [])
      } else {
        // Fallback sur mockProducts si l'API ne fonctionne pas
        const { mockProducts } = await import('../data/mockData')
        setProducts(mockProducts || [])
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error)
      // Fallback sur mockProducts
      try {
        const { mockProducts } = await import('../data/mockData')
        setProducts(mockProducts || [])
      } catch (e) {
        console.error('Erreur chargement mockProducts:', e)
      }
    }
  }

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if (isOpen) {
      // Réinitialiser les états quand on ouvre le modal
      setMessage('')
      setShowRetryButton(false)
      setTranscript('')
      setIsListening(false)
      initializeSpeechRecognition()
    } else {
      stopListening()
    }

    return () => {
      stopListening()
    }
  }, [isOpen])

  const initializeSpeechRecognition = () => {
    // Vérifier si l'API est disponible
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setMessage('La reconnaissance vocale n\'est pas supportée par votre navigateur. Veuillez utiliser Chrome, Edge ou Safari.')
      setMessageType('error')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'fr-FR' // Français

    recognition.onstart = () => {
      setIsListening(true)
      setMessage('🎤 Écoute en cours... Parlez maintenant !')
      setMessageType('info')
      setTranscript('')
    }

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1]
      const text = lastResult[0].transcript
      setTranscript(text)
      processVoiceCommand(text)
    }

    recognition.onerror = (event) => {
      console.error('Erreur reconnaissance vocale:', event.error)
      setIsListening(false)

      let errorMessage = 'Erreur de reconnaissance vocale'
      let showRetryButton = false

      if (event.error === 'no-speech') {
        errorMessage = 'Aucune parole détectée. Réessayez en parlant plus fort.'
        showRetryButton = true
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone non disponible. Vérifiez vos permissions dans les paramètres du navigateur.'
        showRetryButton = true
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Permission microphone refusée.\n\nPour autoriser :\n1. Cliquez sur l\'icône 🔒 dans la barre d\'adresse\n2. Sélectionnez "Autoriser" pour le microphone\n3. Cliquez sur "Réessayer" ci-dessous'
        showRetryButton = true
      } else if (event.error === 'aborted') {
        errorMessage = 'Reconnaissance vocale interrompue. Réessayez.'
        showRetryButton = true
      } else if (event.error === 'network') {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.'
        showRetryButton = true
      }

      setMessage(errorMessage)
      setMessageType('error')
      setShowRetryButton(showRetryButton)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
  }

  const startListening = async () => {
    // Vérifier si l'API de reconnaissance vocale est disponible
    if (!recognitionRef.current) {
      setMessage('La reconnaissance vocale n\'est pas initialisée. Veuillez rafraîchir la page.')
      setMessageType('error')
      setShowRetryButton(false)
      return
    }

    // Vérifier les permissions du microphone d'abord
    try {
      // Vérifier si l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMessage('Votre navigateur ne supporte pas l\'accès au microphone. Veuillez utiliser Chrome, Edge ou Safari.')
        setMessageType('error')
        setShowRetryButton(false)
        return
      }

      // Vérifier le statut de la permission si l'API est disponible
      let permissionStatus = 'prompt'
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // Note: 'microphone' n'est pas supporté partout, utiliser un fallback
          const result = await navigator.permissions.query({ name: 'microphone' }).catch(() => {
            // Si 'microphone' n'est pas supporté, essayer sans vérification
            return { state: 'prompt' }
          })
          permissionStatus = result.state
          console.log('Statut permission microphone:', permissionStatus)
        } catch (permError) {
          console.log('Impossible de vérifier le statut de la permission:', permError)
          // Continuer même si on ne peut pas vérifier le statut
        }
      }

      // Si la permission est déjà refusée, afficher un message spécifique
      if (permissionStatus === 'denied') {
        setMessage('Permission microphone refusée.\n\nPour autoriser :\n1. Cliquez sur l\'icône 🔒 dans la barre d\'adresse\n2. Sélectionnez "Autoriser" pour le microphone\n3. Actualisez la page puis réessayez')
        setMessageType('error')
        setShowRetryButton(true)
        return
      }

      // Demander la permission explicitement
      setMessage('Demande d\'accès au microphone...')
      setMessageType('info')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Si on arrive ici, la permission est accordée, on peut fermer le stream
      stream.getTracks().forEach(track => track.stop())

      // Réinitialiser les messages d'erreur
      setMessage('')
      setShowRetryButton(false)

      // Démarrer la reconnaissance vocale
      if (!isListening) {
        try {
          recognitionRef.current.start()
        } catch (error) {
          console.error('Erreur démarrage reconnaissance:', error)
          setMessage('Erreur lors du démarrage de l\'écoute. Réessayez.')
          setMessageType('error')
          setShowRetryButton(true)
        }
      }
    } catch (permissionError) {
      console.error('Erreur permission microphone:', permissionError)

      let errorMsg = 'Permission microphone requise.\n\nPour autoriser :\n1. Cliquez sur l\'icône 🔒 dans la barre d\'adresse\n2. Sélectionnez "Autoriser" pour le microphone\n3. Cliquez sur "Réessayer" ci-dessous'

      // Message plus spécifique selon le type d'erreur
      if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
        errorMsg = 'Permission microphone refusée.\n\nPour autoriser :\n1. Cliquez sur l\'icône 🔒 dans la barre d\'adresse\n2. Sélectionnez "Autoriser" pour le microphone\n3. Cliquez sur "Réessayer" ci-dessous'
      } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
        errorMsg = 'Aucun microphone détecté. Vérifiez que votre microphone est connecté et fonctionne.'
      } else if (permissionError.name === 'NotReadableError' || permissionError.name === 'TrackStartError') {
        errorMsg = 'Le microphone est utilisé par une autre application. Fermez les autres applications utilisant le microphone et réessayez.'
      }

      setMessage(errorMsg)
      setMessageType('error')
      setShowRetryButton(true)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Parser la commande vocale pour extraire les produits
  const parseVoiceCommand = (text) => {
    const lowerText = text.toLowerCase()
    const items = []

    // Mots-clés pour les quantités
    const quantityKeywords = {
      'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
      'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10
    }

    // Mots-clés pour les produits (synonymes et variations)
    const productKeywords = {
      'burger': ['burger', 'hamburger', 'hamburgers'],
      'poulet': ['poulet', 'chicken'],
      'boeuf': ['boeuf', 'beef', 'viande'],
      'pizza': ['pizza', 'pizzas'],
      'pasta': ['pasta', 'pâtes', 'nouilles', 'spaghetti'],
      'salade': ['salade', 'salades'],
      'jus': ['jus', 'juice'],
      'orange': ['orange', 'oranges'],
      'coca': ['coca', 'coca-cola', 'coke'],
      'eau': ['eau', 'water'],
      'frites': ['frites', 'frite', 'french fries'],
      'sandwich': ['sandwich', 'sandwiches'],
      'tacos': ['tacos', 'taco'],
      'sushi': ['sushi', 'sushis'],
      'riz': ['riz', 'rice'],
      'poisson': ['poisson', 'fish'],
      'soupe': ['soupe', 'soupes', 'soup']
    }

    // Extraire les quantités et produits
    const words = lowerText.split(/\s+/)
    let currentQuantity = 1
    let currentProduct = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[.,!?]/g, '')

      // Vérifier si c'est une quantité
      if (quantityKeywords[word] !== undefined) {
        currentQuantity = quantityKeywords[word]
        continue
      }

      // Chercher des produits
      for (const [productType, keywords] of Object.entries(productKeywords)) {
        if (keywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
          // Construire le nom du produit recherché
          const productName = buildProductName(words, i, productType)
          items.push({
            quantity: currentQuantity,
            searchTerm: productName,
            productType: productType
          })
          currentQuantity = 1 // Réinitialiser pour le prochain produit
          break
        }
      }
    }

    // Si aucun produit trouvé mais qu'il y a du texte, essayer de chercher directement
    if (items.length === 0 && lowerText.length > 3) {
      // Essayer de trouver des produits par mots-clés simples
      const simpleSearch = lowerText.replace(/je veux|j'aimerais|donnez-moi|apportez-moi/gi, '').trim()
      if (simpleSearch) {
        items.push({
          quantity: 1,
          searchTerm: simpleSearch,
          productType: 'any'
        })
      }
    }

    return items
  }

  const buildProductName = (words, startIndex, productType) => {
    // Construire un nom de produit à partir des mots autour de l'index
    const relevantWords = []
    for (let i = Math.max(0, startIndex - 2); i < Math.min(words.length, startIndex + 3); i++) {
      relevantWords.push(words[i])
    }
    return relevantWords.join(' ')
  }

  // Rechercher un produit dans la liste
  const findProduct = (searchTerm, productType) => {
    const lowerSearch = searchTerm.toLowerCase()

    // Score de correspondance pour chaque produit
    const scoredProducts = products.map(product => {
      const productName = (product.name || '').toLowerCase()
      const productCategory = (product.category || '').toLowerCase()
      const productDescription = (product.description || '').toLowerCase()

      let score = 0

      // Correspondance exacte du nom
      if (productName === lowerSearch) {
        score += 100
      }

      // Le nom contient le terme de recherche
      if (productName.includes(lowerSearch)) {
        score += 50
      }

      // Le terme de recherche contient le nom
      if (lowerSearch.includes(productName)) {
        score += 40
      }

      // Correspondance par mots-clés
      const searchWords = lowerSearch.split(/\s+/)
      searchWords.forEach(word => {
        if (productName.includes(word)) score += 20
        if (productCategory.includes(word)) score += 15
        if (productDescription.includes(word)) score += 10
      })

      // Correspondance par type de produit
      if (productType !== 'any') {
        const typeKeywords = {
          'burger': ['burger', 'hamburger'],
          'poulet': ['poulet', 'chicken'],
          'pizza': ['pizza'],
          'pasta': ['pasta', 'pâtes', 'nouilles', 'spaghetti'],
          'salade': ['salade'],
          'jus': ['jus', 'juice'],
          'orange': ['orange'],
          'coca': ['coca', 'cola'],
          'eau': ['eau', 'water'],
          'frites': ['frites', 'frite'],
          'sandwich': ['sandwich'],
          'tacos': ['tacos', 'taco'],
          'sushi': ['sushi'],
          'riz': ['riz', 'rice'],
          'poisson': ['poisson', 'fish'],
          'soupe': ['soupe', 'soup']
        }

        const keywords = typeKeywords[productType] || []
        keywords.forEach(keyword => {
          if (productName.includes(keyword) || productCategory.includes(keyword)) {
            score += 30
          }
        })
      }

      return { product, score }
    })

    // Trier par score et retourner le meilleur
    scoredProducts.sort((a, b) => b.score - a.score)

    // Retourner le produit si le score est suffisant (au moins 20 points)
    if (scoredProducts.length > 0 && scoredProducts[0].score >= 20) {
      return scoredProducts[0].product
    }

    return null
  }

  // Traiter la commande vocale
  const processVoiceCommand = async (text) => {
    setIsProcessing(true)
    setMessage('🔄 Traitement de votre commande...')
    setMessageType('info')

    try {
      const items = parseVoiceCommand(text)

      if (items.length === 0) {
        setMessage('❌ Aucun produit détecté dans votre commande. Essayez de dire "Je veux un burger poulet" par exemple.')
        setMessageType('error')
        setIsProcessing(false)
        return
      }

      let addedCount = 0
      let notFoundItems = []

      for (const item of items) {
        const product = findProduct(item.searchTerm, item.productType)

        if (product) {
          // Ajouter au panier
          addItem({
            id: product.id || product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: item.quantity
          })
          addedCount++
        } else {
          notFoundItems.push(item.searchTerm)
        }
      }

      // Message de résultat
      if (addedCount > 0) {
        const successMessage = addedCount === 1
          ? `✅ ${addedCount} produit ajouté au panier !`
          : `✅ ${addedCount} produits ajoutés au panier !`

        if (notFoundItems.length > 0) {
          setMessage(`${successMessage}\n⚠️ Produits non trouvés: ${notFoundItems.join(', ')}`)
        } else {
          setMessage(successMessage)
        }
        setMessageType('success')
      } else {
        setMessage(`❌ Aucun produit trouvé pour: ${notFoundItems.join(', ')}\nEssayez avec des noms de produits plus précis.`)
        setMessageType('error')
      }

    } catch (error) {
      console.error('Erreur traitement commande vocale:', error)
      setMessage('❌ Erreur lors du traitement de votre commande')
      setMessageType('error')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Assistant Vocal
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Commandez en parlant en français
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Exemples de commandes :</strong>
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-1 list-disc list-inside">
            <li>"Je veux un burger poulet et un jus d'orange"</li>
            <li>"Donnez-moi deux pizzas et une salade"</li>
            <li>"J'aimerais trois coca et des frites"</li>
          </ul>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vous avez dit :</p>
            <p className="text-gray-900 dark:text-white font-medium">{transcript}</p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${messageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
              ssageType === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                'bblue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            }`}>
            {messageType === 'success' && <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />}
            {messageType === 'error' && <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />}
            {messageType === 'info' && <Loader size={20} className="flex-shrink-0 mt-0.5 animate-spin" />}
            <p className="text-sm whitespace-pre-line">{message}</p>
          </div>
        )}

        {/* Microphone Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform ${isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                : 'bg-primary hover:bg-orange-600 scale-100'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} shadow-lg`}
          >
            {isListening ? (
              <MicOff size={32} className="text-white" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {isListening
              ? '🎤 Parlez maintenant...'
              : isProcessing
                ? 'Traitement en cours...'
                : 'Cliquez pour commencer à parler'}
          </p>

          {/* Bouton Réessayer si erreur de permission */}
          {showRetryButton && messageType === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={async () => {
                  setMessage('Vérification des permissions...')
                  setMessageType('info')
                  setShowRetryButton(false)
                  // Petit délai pour permettre à l'utilisateur de voir le message
                  await new Promise(resolve => setTimeout(resolve, 500))
                  await startListening()
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition text-sm font-semibold shadow-md transform hover:scale-105"
              >
                Réessayer
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                💡 Si la permission est toujours refusée, actualisez la page après avoir autorisé le microphone
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Parlez clairement et mentionnez les quantités (un, deux, trois...)
          </p>
        </div>
      </div>
    </div>
  )
}

