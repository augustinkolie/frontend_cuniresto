import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api, getFullImageUrl } from '../utils/api'
import { Send, Paperclip, Image, Video, File, X, Search, User, MessageCircle, Check, CheckCheck, Mic, Square, Play, Pause, Phone, Video as VideoCall, MoreVertical, Smile, Users, ChevronLeft, Trash2, Circle, Plus, Volume2, VolumeX, CornerUpLeft, Pin, CheckSquare, Star, Download, Camera } from 'lucide-react'
import VoiceMessagePlayer from '../components/VoiceMessagePlayer'
import socket from '../utils/socket'
import { useWebRTC } from '../hooks/useWebRTC'
import { emojiCategories } from '../data/emojis'

export default function Messages() {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageContent, setMessageContent] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showUsersList, setShowUsersList] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [pressStartX, setPressStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isCancelled, setIsCancelled] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Refs pour éviter les stale closures dans le onstop du MediaRecorder
  const isCancelledRef = useRef(false)
  const isPreviewModeRef = useRef(false)
  const handleSendMessageRef = useRef(null)

  const togglePauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
      } else if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      }
    }
  }
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showConversationsMenu, setShowConversationsMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(emojiCategories[0].id)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null })
  const [replyingTo, setReplyingTo] = useState(null)
  const [selectedMessages, setSelectedMessages] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [messageMenuOpen, setMessageMenuOpen] = useState(null) // ID du message dont le menu est ouvert
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [isPhoneCallActive, setIsPhoneCallActive] = useState(false)
  const [callParticipant, setCallParticipant] = useState(null)
  const [calls, setCalls] = useState([])
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [selectedContactInfo, setSelectedContactInfo] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const optionsMenuRef = useRef(null)
  const conversationsMenuRef = useRef(null)
  const conversationsListRef = useRef(null)
  const attachmentMenuRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const ringtoneRef = useRef(null)
  const [activeCallId, setActiveCallId] = useState(null)
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callState, setCallState] = useState(null) // 'ringing' ou 'connected'
  const [incomingCall, setIncomingCall] = useState(null) // Appel entrant
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [showStarredModal, setShowStarredModal] = useState(false)
  const [mediaAttachments, setMediaAttachments] = useState([])
  const [starredMessages, setStarredMessages] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [disappearingDuration, setDisappearingDuration] = useState(0)

  // Hook WebRTC
  const webRTC = useWebRTC()


  // Fermer le menu des pièces jointes quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false)
      }
    }

    if (showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAttachmentMenu])

  // Initialiser les paramètres de la conversation et du contact
  useEffect(() => {
    if (selectedConversation) {
      setIsMuted(selectedConversation.mutedBy?.includes(user?.id))
      setDisappearingDuration(selectedConversation.disappearingDuration || 0)
    }
  }, [selectedConversation?.id, user?.id])

  useEffect(() => {
    if (selectedContactInfo && user) {
      setIsFavorite(user.favoriteContacts?.includes(selectedContactInfo.id))
    }
  }, [selectedContactInfo?.id, user?.id])

  // Nettoyer les ressources audio lors du démontage
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [audioUrl, isRecording])

  // Mettre à jour le timer de l'appel vocal
  useEffect(() => {
    let interval
    if (isPhoneCallActive && callStartTime && callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPhoneCallActive, callStartTime, callState])

  // Attacher le stream distant aux éléments audio/vidéo
  useEffect(() => {
    if (webRTC.remoteStream) {
      if (isVideoCallActive && remoteVideoRef.current) {
        console.log('📡 Attachement du stream distant à la vidéo...')
        remoteVideoRef.current.srcObject = webRTC.remoteStream
      } else if (remoteAudioRef.current) {
        console.log('📡 Attachement du stream distant à l\'audio...')
        remoteAudioRef.current.srcObject = webRTC.remoteStream
      }
    }
  }, [webRTC.remoteStream, isVideoCallActive])

  // Gérer le basculement vers le haut-parleur (Speaker)
  useEffect(() => {
    const handleSpeakerToggle = async () => {
      if (remoteAudioRef.current && typeof remoteAudioRef.current.setSinkId === 'function') {
        try {
          // Note: Le choix exact du périphérique 'speaker' dépend de l'énumération des devices.
          // Ici on implémente la base technique; en web pur sans API 'selectAudioOutput', 
          // c'est souvent le système qui gère, mais on prépare le terrain.
          console.log(`🔊 Haut-parleur: ${isSpeakerOn ? 'Activé' : 'Désactivé'}`)
          // Si on avait un ID spécifique, on ferait setSinkId(id)
        } catch (error) {
          console.error('Erreur lors du changement de sortie audio:', error)
        }
      }
    }
    handleSpeakerToggle()
  }, [isSpeakerOn])




  const loadConversations = async () => {
    try {
      const response = await api.getConversations()
      if (response.success) {
        setConversations(response.conversations)
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.getUsers()
      if (response.success) {
        setUsers(response.users)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }

  const handleToggleStar = async (message) => {
    try {
      const response = await api.starMessage(message.id)
      if (response.success) {
        setMessages(prev => prev.map(msg =>
          msg.id === message.id ? { ...msg, isStarred: response.isStarred } : msg
        ))
        if (showStarredModal) {
          loadStarredMessages()
        }
      }
    } catch (error) {
      console.error('Erreur star message:', error)
    }
  }

  const loadMediaAttachments = async () => {
    if (!selectedConversation) return
    try {
      const response = await api.getConversationMedia(selectedConversation.id)
      if (response.success) {
        setMediaAttachments(response.media)
      }
    } catch (error) {
      console.error('Erreur chargement médias:', error)
    }
  }

  const loadStarredMessages = async () => {
    if (!selectedConversation) return
    try {
      // Pour l'instant, on filtre les messages chargés localement car on n'a pas de route dédiée GET /starred
      // ou bien on utilise loadMessages et on filtre
      const starred = messages.filter(msg => msg.isStarred)
      setStarredMessages(starred)
    } catch (error) {
      console.error('Erreur filtrage messages importants:', error)
    }
  }

  const handleToggleFavorite = async () => {
    if (!selectedContactInfo) return
    try {
      const response = await api.toggleFavorite(selectedContactInfo.id)
      if (response.success) {
        setIsFavorite(response.isFavorite)
        alert(response.message)
      }
    } catch (error) {
      console.error('Erreur toggle favorite:', error)
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement cette conversation ?`)) {
      return
    }

    try {
      const response = await api.deleteConversation(selectedConversation.id)
      if (response.success) {
        setShowContactInfo(false)
        setSelectedConversation(null)
        loadConversations()
        alert('Conversation supprimée')
      }
    } catch (error) {
      console.error('Erreur suppression conversation:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleUpdateSettings = async (settings) => {
    if (!selectedConversation) return
    try {
      const response = await api.updateConversationSettings(selectedConversation.id, settings)
      if (response.success) {
        if (settings.isMuted !== undefined) setIsMuted(settings.isMuted)
        if (settings.disappearingDuration !== undefined) setDisappearingDuration(settings.disappearingDuration)
        // Mettre à jour la conversation dans la liste
        setConversations(prev => prev.map(c =>
          c.id === selectedConversation.id ? { ...c, ...response.conversation } : c
        ))
      }
    } catch (error) {
      console.error('Erreur mise à jour paramètres:', error)
    }
  }

  const handleBlockContact = async () => {
    if (!selectedContactInfo) return
    const isBlocked = user.blockedUsers?.includes(selectedContactInfo.id)

    if (isBlocked) {
      if (window.confirm(`Débloquer ${selectedContactInfo.nom} ${selectedContactInfo.prenom} ?`)) {
        try {
          const res = await api.unblockUser(selectedContactInfo.id)
          if (res.success) {
            alert('Utilisateur débloqué')
            // Recharger l'utilisateur pour mettre à jour les infos
            window.location.reload() // Solution simple pour rafraîchir le state global user
          }
        } catch (e) { console.error(e) }
      }
    } else {
      if (window.confirm(`Bloquer ${selectedContactInfo.nom} ${selectedContactInfo.prenom} ?`)) {
        try {
          const res = await api.blockUser(selectedContactInfo.id)
          if (res.success) {
            alert('Utilisateur bloqué')
            window.location.reload()
          }
        } catch (e) { console.error(e) }
      }
    }
  }

  const handleReportContact = async () => {
    if (!selectedContactInfo) return
    if (window.confirm(`Signaler ${selectedContactInfo.nom} ${selectedContactInfo.prenom} pour comportement inapproprié ?`)) {
      alert('Signalement envoyé. Nos modérateurs vont examiner votre demande.')
    }
  }

  const loadMessages = async (conversationId, showLoading = true, shouldScrollToBottom = false) => {
    if (showLoading) setLoading(true)
    try {
      // Charger les messages et les appels en parallèle
      const [messagesResponse, callsResponse] = await Promise.all([
        api.getMessages(conversationId),
        api.getCallHistory(conversationId)
      ])

      if (messagesResponse.success) {
        // Sauvegarder la position de scroll avant de mettre à jour les messages
        const scrollPosition = messagesContainerRef.current?.scrollTop
        setMessages(messagesResponse.messages)

        // Le scroll est géré par l'useEffect sur messages.length
        if (!showLoading && scrollPosition !== undefined && messagesContainerRef.current) {
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = scrollPosition
            }
          })
        }
      }

      if (callsResponse.success) {
        setCalls(callsResponse.calls)
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const startConversation = async (participantId) => {
    try {
      const response = await api.createConversation(participantId)
      if (response.success) {
        setSelectedConversation(response.conversation)
        await loadConversations()
      }
    } catch (error) {
      console.error('Erreur création conversation:', error)
    }
  }

  const handleDeleteMessage = async (itemId) => {
    const isCall = contextMenu.message?.callType !== undefined

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer cet ${isCall ? 'appel' : 'message'} ?`)) {
      return
    }

    try {
      const response = isCall ? await api.deleteCall(itemId) : await api.deleteMessage(itemId)
      if (response && response.success) {
        if (isCall) {
          setCalls(prev => prev.filter(c => c.id !== itemId))
        } else {
          setMessages(prev => prev.filter(msg => msg.id !== itemId))
        }
        setMessageMenuOpen(null)
        await loadConversations()
      } else {
        const errorMessage = response?.message || 'Erreur lors de la suppression'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la suppression'
      alert(errorMessage)
    }
  }

  // Mettre à jour la ref à chaque render pour qu'elle pointe vers la version la plus récente de handleSendMessage

  // Gestion du menu contextuel (clic droit)
  const handleContextMenu = (e, message) => {
    e.preventDefault()
    // Ajuster la position pour qu'elle reste dans la vue
    const x = e.pageX
    const y = e.pageY
    setContextMenu({ visible: true, x, y, message })
  }

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) setContextMenu(prev => ({ ...prev, visible: false }))
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [contextMenu.visible])

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await api.addReaction(messageId, emoji)
      if (response.success) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, reactions: response.reactions } : m
        ))
        // Émettre via socket pour mise à jour en temps réel
        socket.emit('message_reaction', { messageId, reactions: response.reactions, conversationId: selectedConversation.id })
      }
    } catch (err) {
      console.error('Erreur réaction:', err)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const togglePin = async (message) => {
    try {
      const response = await api.togglePinMessage(selectedConversation.id, message.id)
      if (response.success) {
        // Mettre à jour la conversation localement pour afficher l'icône immédiatement
        setSelectedConversation(prev => {
          const isPinned = prev.pinnedMessages?.includes(message.id)
          const newPinned = isPinned
            ? prev.pinnedMessages.filter(id => id !== message.id)
            : [...(prev.pinnedMessages || []), message.id]
          return { ...prev, pinnedMessages: newPinned }
        })
      }
    } catch (err) {
      console.error('Erreur pin:', err)
    }
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const toggleSelection = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    )
  }

  const handleSendMessage = async (e, overrideFiles = null) => {
    if (e) e.preventDefault()
    const contentToSend = messageContent
    const filesToSend = overrideFiles || [...selectedFiles]


    if (!contentToSend.trim() && filesToSend.length === 0) {
      return
    }
    if (!selectedConversation || !selectedConversation.id) {
      return
    }


    const conversationId = selectedConversation.id
    const conversationBackup = JSON.parse(JSON.stringify(selectedConversation))

    setLoading(true)
    try {
      const response = await api.sendMessage(
        conversationId,
        contentToSend,
        filesToSend,
        replyingTo?.id,
        replyingTo?.callType !== undefined ? 'Call' : 'Message'
      )

      // La réponse de l'API retourne directement res.data, donc response contient déjà { success, message }
      if (response?.success) {
        // IMPORTANT: S'assurer que la conversation reste sélectionnée IMMÉDIATEMENT
        // Ne jamais laisser selectedConversation devenir null, même pendant le rechargement
        // Mettre à jour la conversation immédiatement pour garantir qu'elle reste visible
        setSelectedConversation(conversationBackup)

        // Réinitialiser les champs immédiatement
        setMessageContent('')
        setSelectedFiles([])
        // Réinitialiser aussi les références audio et états d'enregistrement
        setAudioBlob(null)
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
          setAudioUrl(null)
        }
        setReplyingTo(null) // Reset reply preview after sending
        setIsRecording(false)
        setIsPaused(false)
        setIsPreviewMode(false)
        setRecordingTime(0)

        // Réinitialiser les inputs de fichiers
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (imageInputRef.current) imageInputRef.current.value = ''
        if (videoInputRef.current) videoInputRef.current.value = ''

        // Recharger les messages en premier (plus rapide)
        await loadMessages(conversationId, false, true)

        // Ensuite recharger les conversations pour obtenir la version mise à jour
        // Mais garder toujours la conversation sélectionnée
        const updatedResponse = await api.getConversations()
        if (updatedResponse.success) {
          setConversations(updatedResponse.conversations)

          const updatedConv = updatedResponse.conversations.find(
            c => c.id === conversationId
          )
          if (updatedConv) {
            setSelectedConversation(updatedConv)
          }
        }

        // Le scroll est géré par l'useEffect sur messages.length (isOwn sera true)

        console.log('✨ Message envoyé avec succès !')
      } else {
        // Si l'envoi échoue, garder la conversation
        setSelectedConversation(conversationBackup)
        alert(response?.message || "Erreur lors de l'envoi du message")
      }
    } catch (error) {
      console.error('Erreur envoi message:', error)
      const errorMessage = error.response?.data?.message || error.message || "Erreur lors de l'envoi du message"
      alert(errorMessage)
      // En cas d'erreur, restaurer la conversation sauvegardée
      setSelectedConversation(conversationBackup)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'))
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('video/'))
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image size={16} />
    if (file.type.startsWith('video/')) return <Video size={16} />
    if (file.type.startsWith('audio/')) return <Mic size={16} />
    return <File size={16} />
  }

  // Fonctions pour l'enregistrement vocal style WhatsApp
  const handleVoicePress = async (e) => {
    // Empêcher le comportement par défaut
    e.preventDefault()

    // Enregistrer la position de départ
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
    setPressStartX(clientX)
    setCurrentX(clientX)
    setIsCancelled(false)
    isCancelledRef.current = false
    setIsPreviewMode(false)
    isPreviewModeRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('⏹️ Enregistrement arrêté. isCancelled:', isCancelledRef.current)
        if (!isCancelledRef.current) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

          if (audioBlob.size < 100) {
            console.warn('⚠️ Enregistrement trop court ou vide')
            return
          }

          setAudioBlob(audioBlob)
          const url = URL.createObjectURL(audioBlob)
          setAudioUrl(url)

          // Créer un fichier à partir du blob
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' })
          console.log('🎵 Fichier audio créé:', audioFile.name, audioFile.size)

          if (isPreviewModeRef.current) {
            console.log('👀 Mode aperçu activé')
          } else {
            console.log('📤 Envoi direct du message vocal...')

            const fakeEvent = { preventDefault: () => { } }
            if (handleSendMessageRef.current) {
              // On passe directement le fichier sans attendre le state setSelectedFiles
              handleSendMessageRef.current(fakeEvent, [audioFile])
            } else {
              console.error('❌ handleSendMessageRef.current est null !')
              alert('Erreur interne: impossible d\'envoyer le message.')
            }
          }
        }

        // Arrêter le stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer pour le temps d'enregistrement
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Erreur accès microphone:', error)
      alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.')
    }
  }

  const handleVoiceMove = (e) => {
    if (!isRecording) return

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
    setCurrentX(clientX)

    // Calculer la distance de glissement
    const distance = pressStartX - clientX

    // Si glissement de plus de 100px vers la gauche, marquer comme annulé
    if (distance > 100) {
      setIsCancelled(true)
      isCancelledRef.current = true
    } else {
      setIsCancelled(false)
      isCancelledRef.current = false
    }
  }

  const handleVoiceRelease = () => {
    if (!isRecording) return

    if (mediaRecorderRef.current) {
      if (isPaused) {
        setIsPreviewMode(true)
        isPreviewModeRef.current = true
      } else {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }

    // Réinitialiser les positions
    setPressStartX(0)
    setCurrentX(0)
  }

  const handleFinishAndSend = () => {
    if (mediaRecorderRef.current) {
      setIsPreviewMode(false)
      isPreviewModeRef.current = false
      setIsCancelled(false)
      isCancelledRef.current = false

      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      } else if (audioBlob) {
        // Déjà arrêté (en pause/aperçu), envoyer le blob existant
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' })
        const fakeEvent = { preventDefault: () => { } }
        if (handleSendMessageRef.current) {
          handleSendMessageRef.current(fakeEvent, [audioFile])
        }
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isPreviewMode)) {
      setIsCancelled(true)
      isCancelledRef.current = true
      setIsPreviewMode(false)
      isPreviewModeRef.current = false

      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      setIsPaused(false)
      setIsPreviewMode(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      audioChunksRef.current = []
      setRecordingTime(0)
      setAudioBlob(null)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const scrollToBottom = useCallback((instant = false, force = false) => {
    if (messagesEndRef.current) {
      const container = messagesContainerRef.current
      // Seuil augmenté à 400px pour plus de sécurité sur mobile
      const isNearBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 400) : true

      if (isNearBottom || instant || force) {
        // 1. scrollIntoView pour la fluidité et le support natif
        messagesEndRef.current.scrollIntoView({
          behavior: (instant) ? 'auto' : 'smooth',
          block: 'end'
        })

        // 2. Backup forcé via scrollTop pour garantir le résultat (surtout si instant ou force)
        if (container && (force || instant)) {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight
            // Deuxième passe après un court délai pour gérer les images/layout
            setTimeout(() => {
              container.scrollTop = container.scrollHeight
            }, 50)
          })
        }
      }
    }
  }, [])

  const getOtherParticipant = useCallback((conversation) => {
    if (!user || !conversation?.participants) return null
    const userId = user.id
    return conversation.participants.find(p => {
      const participantId = typeof p === 'object' ? p.id : p
      return participantId && participantId.toString() !== userId.toString()
    })
  }, [user?.id])

  // Fonction pour gérer l'appel vidéo
  const handleVideoCall = async () => {
    if (!selectedConversation) return
    const other = getOtherParticipant(selectedConversation)
    if (!other) {
      alert("Impossible de trouver le destinataire pour l'appel.")
      return
    }

    try {
      // Créer un enregistrement d'appel
      const callResponse = await api.initiateCall(
        selectedConversation.id,
        other.id,
        'video'
      )

      if (!callResponse.success) {
        throw new Error('Impossible de créer l\'enregistrement d\'appel')
      }

      setActiveCallId(callResponse.call.id)
      setCallStartTime(Date.now())

      // Vérifier d'abord si les APIs sont disponibles
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Marquer l'appel comme annulé
        await api.updateCallStatus(callResponse.call.id, 'cancelled')
        alert('❌ Votre navigateur ne supporte pas les appels vidéo.\n\nVeuillez utiliser un navigateur moderne comme Chrome, Firefox, Edge ou Safari.')
        return
      }

      console.log('🎥 Demande d\'accès à la caméra et au microphone...')

      // Arrêter tout stream précédent
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }

      // Demander l'accès à la caméra et au microphone avec des contraintes et repli
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        })
      } catch (err) {
        console.warn('⚠️ Échec des contraintes vidéo idéales, essai avec des contraintes basiques...', err)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
      }

      console.log('✅ Accès autorisé, stream obtenu:', stream)
      console.log('📹 Tracks vidéo:', stream.getVideoTracks())
      console.log('🎤 Tracks audio:', stream.getAudioTracks())

      if (stream.getVideoTracks().length === 0 && stream.getAudioTracks().length === 0) {
        throw new Error('Aucune piste vidéo ou audio disponible dans le stream')
      }

      // Stocker le stream et les infos du participant
      localStreamRef.current = stream
      setCallParticipant(other)

      // Initialiser WebRTC
      webRTC.createPeerConnection()
      webRTC.addLocalStream(stream)

      // Activer l'interface d'appel - le stream sera attaché par useEffect
      setIsVideoCallActive(true)
      setCallState('ringing')

      // Jouer la sonnerie
      playRingtone()

      console.log("📤 Envoi du signal 'call:initiate'...")
      // Notifier le serveur de l'appel EN PREMIER
      socket.emit('call:initiate', {
        callerId: user.id,
        receiverId: other.id,
        callerName: `${user.nom} ${user.prenom}`,
        callId: callResponse.call.id,
        type: 'video'
      })

      // Ensuite créer et envoyer l'offre WebRTC
      await webRTC.createOffer(other.id, callResponse.call.id, { video: true })


    } catch (error) {
      console.error('Erreur accès caméra/microphone:', error)
      if (activeCallId) {
        await api.updateCallStatus(activeCallId, 'cancelled')
      }

      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue'
      alert(`❌ Impossible de démarrer l'appel vidéo.\n\nErreur : ${errorMessage}`)

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        const instructions = `
🔒 Autorisation requise pour l'appel vidéo

Pour autoriser l'accès à la caméra et au microphone :

1. Regardez l'icône de cadenas 🔒 dans la barre d'adresse de votre navigateur
2. Cliquez sur l'icône de cadenas
3. Dans le menu qui s'ouvre, trouvez "Caméra" et "Microphone"
4. Changez les paramètres de "Bloquer" à "Autoriser"
5. Actualisez la page (F5 ou Ctrl+R)
6. Réessayez l'appel vidéo

💡 Astuce : Si vous ne voyez pas l'icône de cadenas, cherchez l'icône de caméra/microphone dans la barre d'adresse.

Alternative : Allez dans les paramètres de votre navigateur > Confidentialité > Autorisations de site > Caméra et Microphone, puis autorisez ce site.
        `
        alert(instructions)
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('❌ Aucune caméra ou microphone trouvé sur votre appareil.\n\nVérifiez que votre caméra et votre microphone sont bien connectés et fonctionnels.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        alert('⚠️ Impossible d\'accéder à la caméra ou au microphone.\n\nIls sont peut-être utilisés par une autre application. Fermez les autres applications qui utilisent la caméra/microphone et réessayez.')
      } else {
        alert(`❌ Impossible de démarrer l'appel vidéo.\n\nErreur : ${error.message || 'Erreur inconnue'}\n\nVeuillez vérifier vos paramètres de confidentialité et réessayer.`)
      }
    }
  }

  // useEffect pour attacher le stream vidéo une fois que le modal est monté
  useEffect(() => {
    if (isVideoCallActive && localStreamRef.current && localVideoRef.current) {
      console.log('📺 Attachement du stream à la vidéo locale...')
      localVideoRef.current.srcObject = localStreamRef.current

      // Forcer la lecture
      localVideoRef.current.play()
        .then(() => {
          console.log('✅ Vidéo locale en lecture')
        })
        .catch(err => {
          console.error('❌ Erreur lecture vidéo locale:', err)
        })
    }
  }, [isVideoCallActive])

  // useEffect pour attacher le stream distant audio (pour entendre l'interlocuteur)
  useEffect(() => {
    if (webRTC.remoteStream && remoteAudioRef.current) {
      console.log('Attachement du stream distant');
      remoteAudioRef.current.srcObject = webRTC.remoteStream
      // Forcer la lecture
      const playPromise = remoteAudioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Erreur autoplay audio distant:', error)
        })
      }
    }
  }, [webRTC.remoteStream])

  // Fonction pour terminer l'appel vidéo
  const endVideoCall = useCallback(async () => {
    // Arrêter la sonnerie si elle joue encore
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current = null
    }

    // Calculer la durée de l'appel
    let duration = 0
    if (callStartTime) {
      duration = Math.floor((Date.now() - callStartTime) / 1000)
    }

    // Mettre à jour le statut de l'appel
    if (activeCallId) {
      try {
        const status = duration > 3 ? 'answered' : 'missed'
        await api.updateCallStatus(activeCallId, status, duration)

        // Notifier l'autre utilisateur via socket
        const other = callParticipant || getOtherParticipant(selectedConversation)
        if (other) {
          socket.emit('call:end', {
            callId: activeCallId,
            recipientId: other.id || other.id
          })
        }
      } catch (error) {
        console.error('Erreur mise à jour statut appel:', error)
      }
    }

    // Nettoyer les ressources
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // Nettoyer les ressources WebRTC
    webRTC.closeConnection()
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }

    setIsVideoCallActive(false)
    setCallParticipant(null)
    setActiveCallId(null)
    setCallStartTime(null)
    setCallDuration(0)
    setCallState(null)
  }, [activeCallId, callStartTime, callParticipant, selectedConversation, webRTC, isVideoCallActive])

  // Fonction pour gérer l'appel vocal (WebRTC - comme WhatsApp)
  const handlePhoneCall = async () => {
    if (!selectedConversation) return
    const other = getOtherParticipant(selectedConversation)
    if (!other) {
      alert("Impossible de trouver le destinataire pour l'appel.")
      return
    }

    try {
      // Créer un enregistrement d'appel
      const callResponse = await api.initiateCall(
        selectedConversation.id,
        other.id,
        'phone'  // Utiliser 'phone' au lieu de 'audio'
      )

      if (!callResponse.success) {
        throw new Error('Impossible de créer l\'enregistrement d\'appel')
      }

      setActiveCallId(callResponse.call.id)

      // Vérifier si les APIs sont disponibles
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        await api.updateCallStatus(callResponse.call.id, 'cancelled')
        alert('❌ Votre navigateur ne supporte pas les appels vocaux.\n\nVeuillez utiliser un navigateur moderne comme Chrome, Firefox, Edge ou Safari.')
        return
      }

      console.log('🎤 Demande d\'accès au microphone...')

      // Arrêter tout stream précédent
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }

      // Demander l'accès au microphone uniquement (pas de vidéo) avec repli
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        })
      } catch (err) {
        console.warn('⚠️ Échec des contraintes audio idéales, essai avec des contraintes basiques...', err)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        })
      }

      console.log('✅ Accès microphone autorisé, stream obtenu:', stream)
      console.log('🎤 Tracks audio:', stream.getAudioTracks())

      if (stream.getAudioTracks().length === 0) {
        throw new Error('Aucune piste audio disponible dans le stream')
      }

      // Stocker le stream et les infos du participant
      localStreamRef.current = stream
      setCallParticipant(other)

      // Démarrer en mode "ringing" (sonnerie)
      setCallState('ringing')
      setIsPhoneCallActive(true)

      // Créer et jouer la sonnerie
      playRingtone()

      console.log("📤 Envoi du signal 'call:initiate'...")
      webRTC.createPeerConnection()
      webRTC.addLocalStream(stream)

      // Notifier le serveur de l'appel EN PREMIER
      socket.emit('call:initiate', {
        callerId: user.id,
        receiverId: other.id,
        callerName: `${user.nom} ${user.prenom}`,
        callId: callResponse.call.id
      })

      // Ensuite envoyer l'offre via Socket.IO
      await webRTC.createOffer(other.id, callResponse.call.id)


    } catch (error) {
      console.error('Erreur accès microphone:', error)
      if (activeCallId) {
        await api.updateCallStatus(activeCallId, 'cancelled')
      }

      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue'
      alert(`❌ Impossible de démarrer l'appel vocal.\n\nErreur : ${errorMessage}`)

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('🔒 Autorisation requise pour l\'appel vocal\n\nPour autoriser l\'accès au microphone :\n1. Cliquez sur l\'icône de cadenas dans la barre d\'adresse\n2. Autorisez le microphone\n3. Actualisez la page et réessayez')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert('❌ Aucun microphone trouvé sur votre appareil.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        alert('⚠️ Impossible d\'accéder au microphone.\n\nIl est peut-être utilisé par une autre application.')
      } else {
        alert(`❌ Impossible de démarrer l'appel vocal.\n\nErreur : ${error.message || 'Erreur inconnue'}`)
      }
    }
  }

  // Fonction pour répondre à un appel
  const answerCall = async () => {
    if (!incomingCall) return

    // Arrêter la sonnerie
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current = null
    }

    try {
      const isVideo = incomingCall.type === 'video'
      console.log(`🎤 Réponse à l'appel ${isVideo ? 'vidéo' : 'vocal'}...`)

      // Arrêter tout stream précédent pour éviter "Device in use"
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }

      // Demander l'accès au microphone (et caméra si vidéo) avec repli vers des contraintes simples
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: isVideo ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } : false
        })
      } catch (err) {
        console.warn('⚠️ Échec des contraintes idéales, essai avec des contraintes basiques...', err)
        // Tentative avec des contraintes minimales
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo
        })
      }

      localStreamRef.current = stream

      // Trouver le participant
      const caller = users.find(u => u.id === incomingCall.callerId)
      setCallParticipant(caller || { nom: incomingCall.callerName, prenom: '' })

      // Activer l'interface
      setCallState('connected')
      if (isVideo) {
        setIsVideoCallActive(true)
      } else {
        setIsPhoneCallActive(true)
      }
      setCallStartTime(Date.now())
      setActiveCallId(incomingCall.callId)

      // WebRTC
      webRTC.createPeerConnection()
      webRTC.addLocalStream(stream)

      // Accepter l'offre si elle est déjà là
      if (incomingCall.offer) {
        await webRTC.acceptOffer(incomingCall.callerId, incomingCall.callId, incomingCall.offer)
      }

      // Notifier l'appelant
      socket.emit('call:accept', {
        callId: incomingCall.callId,
        callerId: incomingCall.callerId
      })

      setIncomingCall(null)
    } catch (error) {
      console.error('❌ Erreur réponse appel:', error)
      
      const isVideo = incomingCall.type === 'video'
      const errorMsg = error.message || 'Erreur inconnue'
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert(`🔒 Autorisation requise\n\nVeuillez autoriser l'accès à la ${isVideo ? 'caméra et au microphone' : 'microphone'} dans votre navigateur pour répondre.`)
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        alert(`⚠️ Appareil déjà utilisé\n\nImpossible d'accéder à la ${isVideo ? 'caméra ou au microphone' : 'microphone'}. Ils sont probablement utilisés par une autre application ou un autre onglet.`)
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert(`❌ Aucun appareil détecté\n\nAucune ${isVideo ? 'caméra ou microphone' : 'microphone'} trouvé.`)
      } else {
        alert(`❌ Erreur lors de la réponse :\n${errorMsg}`)
      }
      
      rejectCall()
    }
  }

  // Fonction pour refuser un appel
  const rejectCall = () => {
    if (incomingCall) {
      // Arrêter la sonnerie
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current = null
      }

      socket.emit('call:reject', {
        callId: incomingCall.callId,
        callerId: incomingCall.callerId
      })
      setIncomingCall(null)
    }
  }

  // Fonction pour jouer la sonnerie d'appel
  const playRingtone = () => {
    // Arrêter toute sonnerie existante avant d'en démarrer une nouvelle
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current = null
    }

    try {
      // Créer un contexte audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Essayer de reprendre le contexte si suspendu (gestion du geste utilisateur)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => console.log('AudioContext resume failed:', err))
      }

      // Créer un oscillateur pour la sonnerie
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configuration du son (similaire à WhatsApp)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)

      // Pattern de sonnerie : 2 bips courts
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.7)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)

      // Répéter la sonnerie toutes les 2 secondes
      const ringtoneInterval = setInterval(() => {
        const newOscillator = audioContext.createOscillator()
        const newGainNode = audioContext.createGain()

        newOscillator.connect(newGainNode)
        newGainNode.connect(audioContext.destination)

        newOscillator.type = 'sine'
        newOscillator.frequency.setValueAtTime(800, audioContext.currentTime)

        newGainNode.gain.setValueAtTime(0, audioContext.currentTime)
        newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1)
        newGainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3)
        newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5)
        newGainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.7)

        newOscillator.start(audioContext.currentTime)
        newOscillator.stop(audioContext.currentTime + 1)
      }, 2000)

      // Stocker la référence pour pouvoir arrêter plus tard
      ringtoneRef.current = {
        audioContext,
        interval: ringtoneInterval,
        pause: () => {
          clearInterval(ringtoneInterval)
          audioContext.close()
        }
      }
    } catch (error) {
      console.error('Erreur création sonnerie:', error)
    }
  }

  // Fonction pour terminer l'appel vocal
  const endPhoneCall = useCallback(async () => {
    // Arrêter la sonnerie si elle joue encore
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current = null
    }

    // Calculer la durée de l'appel
    let duration = 0
    if (callStartTime) {
      duration = Math.floor((Date.now() - callStartTime) / 1000)
    }

    // Mettre à jour le statut de l'appel
    if (activeCallId) {
      try {
        const status = duration > 3 ? 'answered' : 'missed'
        await api.updateCallStatus(activeCallId, status, duration)

        // Notifier l'autre utilisateur via socket
        const other = getOtherParticipant(selectedConversation)
        if (other) {
          socket.emit('call:end', {
            callId: activeCallId,
            recipientId: other.id || other.id
          })
        }
      } catch (error) {
        console.error('Erreur mise à jour statut appel:', error)
      }
    }

    // Nettoyer les ressources WebRTC
    webRTC.closeConnection()

    setIsPhoneCallActive(false)
    setCallParticipant(null)
    setActiveCallId(null)
    setCallStartTime(null)
    setCallDuration(0)
    setCallState(null)
  }, [activeCallId, callStartTime, selectedConversation, webRTC, isPhoneCallActive])

  // Fonction pour formater le contenu du message et détecter les numéros de téléphone
  const formatMessageContent = (content) => {
    if (!content) return null

    // Regex pour détecter les numéros de téléphone (formats variés)
    const phoneRegex = /(\+?\d{1,4}[\s.-]?)?(\(?\d{1,4}\)?[\s.-]?)?(\d{1,4}[\s.-]?)?(\d{1,9}[\s.-]?)(\d{1,9})/g

    const parts = []
    let lastIndex = 0
    let match

    while ((match = phoneRegex.exec(content)) !== null) {
      // Ajouter le texte avant le numéro
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }

      const phoneNumber = match[0].replace(/[\s.-]/g, '') // Nettoyer le numéro
      const displayNumber = match[0] // Garder le format original pour l'affichage

      // Ajouter le numéro avec les boutons d'action
      parts.push(
        <span key={match.index} className="inline-flex items-center gap-1 mx-1">
          <span className="font-mono text-primary font-semibold">{displayNumber}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              window.location.href = `tel:${phoneNumber}`
            }}
            className="inline-flex items-center justify-center w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
            title="Appeler"
          >
            <Phone size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Pour l'appel vidéo, on peut utiliser un lien ou une API
              // Ici on affiche une alerte, mais vous pouvez intégrer votre système d'appel vidéo
              const confirmCall = window.confirm(`Démarrer un appel vidéo vers ${displayNumber} ?`)
              if (confirmCall) {
                // Intégrer votre système d'appel vidéo ici
                alert(`Appel vidéo vers ${displayNumber}\n\nCette fonctionnalité nécessite une intégration avec un service d'appel vidéo (WebRTC, etc.)`)
              }
            }}
            className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            title="Appel vidéo"
          >
            <VideoCall size={12} />
          </button>
        </span>
      )

      lastIndex = match.index + match[0].length
    }

    // Ajouter le texte restant après le dernier numéro
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    // Si aucun numéro n'a été trouvé, retourner le contenu tel quel
    // Sinon, retourner les parties formatées
    if (parts.length === 0) {
      return content
    }

    // Si on a trouvé des numéros, retourner les parties formatées
    return <>{parts}</>
  }

  // Fermer le menu des options quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false)
      }
    }

    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOptionsMenu])

  // Fermer le sélecteur d'emojis quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Fermer le menu de message quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageMenuOpen && !event.target.closest('.message-menu-container')) {
        setMessageMenuOpen(null)
      }
    }

    if (messageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [messageMenuOpen])

  // Fermer le menu des conversations quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (conversationsMenuRef.current && !conversationsMenuRef.current.contains(event.target)) {
        setShowConversationsMenu(false)
      }
    }

    if (showConversationsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showConversationsMenu])

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    const other = getOtherParticipant(conv)
    const search = searchTerm.toLowerCase()
    return (
      other?.nom?.toLowerCase().includes(search) ||
      other?.prenom?.toLowerCase().includes(search) ||
      other?.email?.toLowerCase().includes(search)
    )
  })

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      u.nom?.toLowerCase().includes(search) ||
      u.prenom?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    )
  })

  // Fonction pour formater la date (aujourd'hui, hier, ou date)
  const formatMessageDate = (date) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return messageDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    }
  }

  // Grouper les messages par date
  const groupMessagesByDate = (messages) => {
    const grouped = {}
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(message)
    })
    return grouped
  }

  // Fusionner les messages et les appels dans une timeline chronologique
  const getMergedTimeline = () => {
    const timeline = []

    // Ajouter les messages
    messages.forEach(msg => {
      timeline.push({
        type: 'message',
        data: msg,
        createdAt: msg.createdAt
      })
    })

    // Ajouter les appels
    calls.forEach(call => {
      timeline.push({
        type: 'call',
        data: call,
        createdAt: call.createdAt
      })
    })

    // Trier par date
    timeline.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    return timeline
  }

  // --- EFFETS CONSOLIDÉS (Positionnés après les définitions de fonctions pour éviter ReferenceError) ---

  // 1. Initialisation Authentification
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login')
      return
    }
    loadConversations()
    loadUsers()
  }, [user?.id, authLoading])

  // 2. Gestion des Messages et Polling
  useEffect(() => {
    const conversationId = selectedConversation?.id
    if (conversationId) {
      setIsInitialLoad(true)
      loadMessages(conversationId)
      const interval = setInterval(() => {
        loadMessages(conversationId, false)
      }, 5000)
      return () => clearInterval(interval)
    } else {
      setMessages([])
      setIsInitialLoad(true)
    }
  }, [selectedConversation?.id])

  // 3. Auto-scroll consolidé
  useEffect(() => {
    if (messages.length > 0 && selectedConversation) {
      const lastMessage = messages[messages.length - 1]
      const senderId = lastMessage?.sender?.id || lastMessage?.sender
      const isOwn = senderId && user?.id && senderId.toString() === user.id.toString()

      // Cas 1: Chargement initial de la conversation
      if (isInitialLoad) {
        const timer = setTimeout(() => {
          scrollToBottom(true, true)
          setIsInitialLoad(false)
        }, 100)
        return () => clearTimeout(timer)
      } 
      
      // Cas 2: Réception ou Envoi de message
      // On force le scroll si c'est notre message, sinon on scroll seulement si on est déjà en bas
      const timer = setTimeout(() => {
        scrollToBottom(false, isOwn)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages.length, selectedConversation?.id, user?.id, isInitialLoad, scrollToBottom])

  // 4. Connexion Socket.IO
  useEffect(() => {
    if (!user?.id) return
    if (!socket.connected) {
      socket.connect()
      socket.emit('user:register', user.id)
    } else {
      socket.emit('user:register', user.id)
    }
    socket.on('connect_error', (error) => console.error('❌ WebSocket error:', error))
    return () => console.log("🔌 Maintien Socket")
  }, [user?.id])

  // 5. Écouteurs d'événements Appels (Socket)
  useEffect(() => {
    if (!user?.id) return
    socket.on('call:incoming', ({ callerId, callerName, callId, type }) => {
      alert(`🔔 Appel de ${callerName} !`)
      setIncomingCall({ callerId, callerName, callId, type })
      playRingtone()
    })
    socket.on('call:offer', async ({ callId, offer }) => {
      setIncomingCall(prev => (prev?.callId === callId ? { ...prev, offer } : prev))
    })
    socket.on('call:answer', async ({ answer }) => {
      await webRTC.handleAnswer(answer)
      setCallState('connected')
      setCallStartTime(Date.now())
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current = null
      }
    })
    socket.on('call:ice-candidate', ({ candidate }) => webRTC.addIceCandidate(candidate))
    socket.on('call:rejected', () => {
      alert('Appel refusé')
      if (isVideoCallActive) endVideoCall()
      else endPhoneCall()
    })
    socket.on('call:ended', () => {
      if (isVideoCallActive) endVideoCall()
      else endPhoneCall()
    })
    socket.on('call:user-offline', () => {
      alert('Utilisateur indisponible')
      if (isVideoCallActive) endVideoCall()
      else endPhoneCall()
    })

    return () => {
      socket.off('call:incoming'); socket.off('call:offer'); socket.off('call:answer')
      socket.off('call:ice-candidate'); socket.off('call:rejected'); socket.off('call:ended')
      socket.off('call:user-offline')
    }
  }, [user?.id, webRTC, incomingCall?.callId, isVideoCallActive, isPhoneCallActive, endVideoCall, endPhoneCall, playRingtone])

  // 6. Mise à jour de la Ref du Handler de Message
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage
  })

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] h-[calc(100dvh-4rem)] md:h-[calc(100vh-5rem)] bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col pb-20 md:pb-0">
      {/* Audio Element distant caché pour entendre la voix */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      <div className="flex-1 flex overflow-hidden">
        {/* Liste des conversations - Style WhatsApp */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col`}>
          {/* Header WhatsApp Style */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 flex-1">
              {user && (
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                  {user.profileImage ? (
                    <img src={getFullImageUrl(user.profileImage)} alt={user.prenom} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{user.prenom?.[0]}{user.nom?.[0]}</span>
                  )}
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUsersList(!showUsersList)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                title="Nouvelle conversation"
              >
                <MessageCircle size={22} />
              </button>
              <div className="relative" ref={conversationsMenuRef}>
                <button
                  onClick={() => setShowConversationsMenu(!showConversationsMenu)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <MoreVertical size={22} />
                </button>
                {showConversationsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                      onClick={() => navigate('/new-group')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      Nouveau groupe
                    </button>
                    <button
                      onClick={() => {
                        setShowUsersList(true)
                        setShowConversationsMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      Contacts
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      Paramètres
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barre de recherche WhatsApp Style */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-gray-200 dark:bg-gray-700 rounded-full p-1.5">
                <Search className="text-gray-600 dark:text-gray-300" size={16} />
              </div>
              <input
                type="text"
                placeholder="Rechercher ou démarrer une nouvelle discussion"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/70 transition text-sm border border-gray-200 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Liste des conversations */}
          <div
            ref={conversationsListRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 hide-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            onScroll={(e) => {
              // Empêcher tout scroll automatique non désiré
              e.stopPropagation()
            }}
          >
            {/* Afficher la liste des utilisateurs si activée ou si recherche active */}
            {(showUsersList || searchTerm) && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    {showUsersList ? 'Nouvelle conversation' : 'Résultats'}
                  </h3>
                  {showUsersList && (
                    <button
                      onClick={() => setShowUsersList(false)}
                      className="text-xs text-primary dark:text-primary-400 hover:text-primary/80 dark:hover:text-primary-300 font-medium"
                    >
                      Fermer
                    </button>
                  )}
                </div>
                {filteredUsers.length > 0 ? (
                  <div className="space-y-0.5">
                    {filteredUsers.map(u => {
                      // Vérifier si une conversation existe déjà avec cet utilisateur
                      const existingConv = conversations.find(conv => {
                        const other = getOtherParticipant(conv)
                        return other && (other.id === u.id || other.id === u.id)
                      })

                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            if (existingConv) {
                              setSelectedConversation(existingConv)
                              setShowUsersList(false)
                            } else {
                              startConversation(u.id)
                              setShowUsersList(false)
                            }
                          }}
                          className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center space-x-3"
                        >
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {u.profileImage ? (
                              <img src={getFullImageUrl(u.profileImage)} alt={u.nom} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span>{u.nom?.[0]}{u.prenom?.[0]}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">{u.nom} {u.prenom}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                          </div>
                          {existingConv && (
                            <span className="text-xs text-accent dark:text-accent-400 font-medium">✓</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-6 px-2">
                    {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
                  </div>
                )}
              </div>
            )}

            {/* Liste des conversations */}
            {filteredConversations.length > 0 ? (
              <>
                {filteredConversations.map(conv => {
                  const other = conv.isGroup ? null : getOtherParticipant(conv)
                  const title = conv.isGroup ? conv.name : (other ? `${other.nom} ${other.prenom}` : 'Utilisateur inconnu')
                  const lastMessageTime = conv.lastMessageAt
                    ? new Date(conv.lastMessageAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    : ''
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition border-b border-gray-100 dark:border-gray-700 ${selectedConversation?.id === conv.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-[#075E54] dark:bg-[#0a7c6b] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {conv.isGroup ? (
                              <Users size={24} />
                            ) : other?.profileImage ? (
                              <img src={getFullImageUrl(other.profileImage)} alt={other.nom} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span>{other?.nom?.[0]}{other?.prenom?.[0]}</span>
                            )}
                          </div>
                          {!conv.isGroup && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 dark:bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                              {title}
                            </h3>
                            {lastMessageTime && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {lastMessageTime}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                              {conv.lastMessage?.content || 'Aucun message'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-accent dark:bg-accent-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center flex-shrink-0 ml-2">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              !showUsersList && !searchTerm && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Aucune conversation. Cliquez sur l'icône utilisateur pour voir les utilisateurs disponibles.
                </div>
              )
            )}
          </div>
        </div>

        {/* Zone de messages - Style WhatsApp */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} w-full md:flex-1 flex-col bg-white dark:bg-gray-900 overflow-hidden`}>
          {selectedConversation ? (
            <>
              {/* Header de conversation WhatsApp Style */}
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition mr-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {(() => {
                    const other = !selectedConversation.isGroup ? getOtherParticipant(selectedConversation) : null
                    const title = selectedConversation.isGroup ? selectedConversation.name : (other ? `${other.nom} ${other.prenom}` : 'Utilisateur inconnu')
                    const subtitle = selectedConversation.isGroup ? `${selectedConversation.participants.length} participants` : 'en ligne'

                    return (
                      <div
                        className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-2 -m-2 transition"
                        onClick={() => {
                          if (other) {
                            console.log('📢 Ouverture du profil pour:', other)
                            setSelectedContactInfo(other)
                            setShowContactInfo(true)
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                          {selectedConversation.isGroup ? (
                            <Users size={20} className="text-white" />
                          ) : other?.profileImage ? (
                            <img src={getFullImageUrl(other.profileImage)} alt={other.nom} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-white font-semibold text-sm">{other?.nom?.[0]}{other?.prenom?.[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                            {title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div className="flex items-center space-x-1 relative">
                  {!selectedConversation?.isGroup && (
                    <>
                      <button
                        onClick={handleVideoCall}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        title="Appel vidéo"
                      >
                        <VideoCall size={22} />
                      </button>
                      <button
                        onClick={handlePhoneCall}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                        title="Appel téléphonique"
                      >
                        <Phone size={22} />
                      </button>
                    </>
                  )}
                  <div className="relative" ref={optionsMenuRef}>
                    <button
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                      title="Plus d'options"
                    >
                      <MoreVertical size={22} />
                    </button>
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <button
                          onClick={() => {
                            const other = getOtherParticipant(selectedConversation)
                            if (other) {
                              navigator.clipboard.writeText(`${other.nom} ${other.prenom}`)
                              alert('Nom copié dans le presse-papiers')
                            }
                            setShowOptionsMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          Copier le nom
                        </button>
                        <button
                          onClick={() => {
                            const other = getOtherParticipant(selectedConversation)
                            if (other && other.email) {
                              navigator.clipboard.writeText(other.email)
                              alert('Email copié dans le presse-papiers')
                            } else {
                              alert('Email non disponible')
                            }
                            setShowOptionsMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          Copier l'email
                        </button>
                        <button
                          onClick={() => {
                            if (selectedConversation) {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
                                // Ici vous pouvez ajouter la logique pour supprimer la conversation
                                alert('Fonctionnalité de suppression à venir')
                              }
                            }
                            setShowOptionsMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          Supprimer la conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Zone de messages avec fond */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-2 md:px-6 lg:px-16 py-4 bg-gray-50 dark:bg-gray-900 min-h-0 hide-scrollbar"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  backgroundImage: 'url("/images/chat-bg.png")', // Optionnel: ajouter un motif de fond si disponible
                  backgroundAttachment: 'fixed'
                }}
              >
                {loading && messages.length === 0 && calls.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">Chargement...</div>
                ) : (messages.length > 0 || calls.length > 0) ? (
                  getMergedTimeline().map((item, index) => {
                    if (!user) return null

                    // Afficher un appel
                    if (item.type === 'call') {
                      const call = item.data
                      const userId = user.id || user.id
                      const isOutgoing = call.caller.id === userId || call.caller.id === userId
                      const otherPerson = isOutgoing ? call.receiver : call.caller

                      // Icônes et couleurs selon le type et statut
                      const getCallIcon = () => {
                        if (call.callType === 'video') {
                          return <VideoCall size={16} className={call.status === 'missed' ? 'text-red-500' : 'text-green-500'} />
                        } else {
                          return <Phone size={16} className={call.status === 'missed' ? 'text-red-500' : 'text-green-500'} />
                        }
                      }

                      const getCallText = () => {
                        const callTypeText = call.callType === 'video' ? 'Appel vidéo' : 'Appel téléphonique'
                        if (call.status === 'missed') {
                          return isOutgoing ? `${callTypeText} manqué` : `${callTypeText} manqué`
                        } else if (call.status === 'answered') {
                          const duration = call.duration
                          const minutes = Math.floor(duration / 60)
                          const seconds = duration % 60
                          const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
                          return `${callTypeText} (${durationText})`
                        } else if (call.status === 'rejected') {
                          return `${callTypeText} rejeté`
                        } else {
                          return `${callTypeText} annulé`
                        }
                      }

                      return (
                        <React.Fragment key={`call-${call.id}`}>
                          {/* Vérifier si on doit afficher une séparation de date pour l'appel */}
                          {(() => {
                            const callDate = new Date(call.createdAt)
                            const prevItem = index > 0 ? getMergedTimeline()[index - 1] : null
                            const prevItemDate = prevItem ? new Date(prevItem.data.createdAt) : null
                            const showDateSeparator = !prevItemDate || callDate.toDateString() !== prevItemDate.toDateString()
                            return showDateSeparator && (
                              <div className="flex justify-center my-4">
                                <span className="bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300 shadow-sm">
                                  {formatMessageDate(call.createdAt)}
                                </span>
                              </div>
                            )
                          })()}
                          <div className={`flex w-full mb-3 ${isOutgoing ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
                            <div
                              id={call.id}
                              onContextMenu={(e) => handleContextMenu(e, call)}
                              className={`relative px-3 py-2.5 rounded-xl min-w-[200px] max-w-[85%] md:max-w-[60%] lg:max-w-[45%] shadow-sm flex items-center gap-3 border border-gray-100 dark:border-gray-700 ${isOutgoing
                                ? 'bg-[#dcf8c6] dark:bg-[#056162] text-gray-800 dark:text-gray-100'
                                : 'bg-white dark:bg-[#202c33] text-gray-800 dark:text-gray-100'
                                }`}>

                              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700`}>
                                {call.callType === 'video' ? (
                                  <VideoCall size={20} className={call.status === 'missed' ? 'text-red-500' : 'text-green-500'} />
                                ) : (
                                  <Phone size={20} className={call.status === 'missed' ? 'text-red-500' : 'text-green-500'} />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate block">
                                  {!isOutgoing && call.status === 'missed' ? 'Appel vocal manqué' : 'Appel vocal'}
                                </span>
                                <span className={`text-[13px] ${call.status === 'missed' ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {call.status === 'missed' ? 'Cliquez pour rappeler' : (call.status === 'answered' ? (call.duration >= 60 ? `${Math.floor(call.duration / 60)} minutes` : `${call.duration} secondes`) : 'Sans réponse')}
                                </span>
                              </div>

                              <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                <span className="text-[10px] opacity-60 tabular-nums">
                                  {new Date(call.createdAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {isOutgoing && (
                                  <CheckCheck size={12} className={call.status === 'answered' ? 'text-blue-500' : 'text-gray-500'} />
                                )}
                              </div>

                              {/* Queue WhatsApp haut */}
                              {isOutgoing ? (
                                <div className="absolute -right-1.5 top-0 w-3 h-3 bg-[#dcf8c6] dark:bg-[#056162] [clip-path:polygon(0_0,100%_0,0_100%)]"></div>
                              ) : (
                                <div className="absolute -left-1.5 top-0 w-3 h-3 bg-white dark:bg-[#202c33] [clip-path:polygon(0_0,100%_0,100%_100%)]"></div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      )
                    }

                    // Afficher un message normal
                    const message = item.data
                    const userId = user.id || user.id
                    const senderId = message.sender?.id || message.sender?.id || message.sender
                    const isOwn = senderId && senderId.toString() === userId.toString()

                    // Vérifier si le message précédent est du même expéditeur
                    const prevItem = index > 0 ? getMergedTimeline()[index - 1] : null
                    const prevMessage = prevItem?.type === 'message' ? prevItem.data : null
                    const prevSenderId = prevMessage?.sender?.id || prevMessage?.sender?.id || prevMessage?.sender
                    const isSameSender = prevSenderId && prevSenderId.toString() === senderId.toString()

                    // Vérifier si on doit afficher une séparation de date
                    const messageDate = new Date(message.createdAt)
                    const prevItemDate = prevItem ? new Date(prevItem.data.createdAt) : null
                    const showDateSeparator = !prevItemDate ||
                      messageDate.toDateString() !== prevItemDate.toDateString()

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <span className="bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300 shadow-sm">
                              {formatMessageDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isOwn ? 'justify-end pr-2' : 'justify-start pl-2'} mb-1 ${isSameSender ? 'mt-0.5' : 'mt-2'} group`}
                        >
                          <div className={`max-w-[85%] md:max-w-[60%] lg:max-w-[45%] ${isOwn ? 'order-2' : 'order-1'}`}>
                            {!isOwn && !isSameSender && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 px-2 font-medium">
                                {message.sender.nom} {message.sender.prenom}
                              </p>
                            )}
                            <div
                              id={message.id}
                              onContextMenu={(e) => handleContextMenu(e, message)}
                              className={`relative ${message.attachments && message.attachments.length > 0 && message.attachments.some(a => a.type === 'image')
                                ? 'bg-transparent shadow-none'
                                : (isOwn
                                  ? 'bg-[#dcf8c6] dark:bg-[#056162] text-gray-900 dark:text-gray-100 px-3 py-2 rounded-xl shadow-sm'
                                  : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 px-3 py-2 rounded-xl shadow-sm')
                                }`}
                            >
                              {/* ReplyTo block */}
                              {message.replyTo && (
                                <div
                                  className="mb-2 p-2 bg-black/5 dark:bg-white/5 border-l-4 border-primary rounded-r-lg text-xs cursor-pointer hover:bg-black/10 transition"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const targetElement = document.getElementById(message.replyTo.id);
                                    if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }}
                                >
                                  <p className="font-bold text-primary mb-1">
                                    {(message.replyTo.sender?.nom || message.replyTo.caller?.nom)} {(message.replyTo.sender?.prenom || message.replyTo.caller?.prenom)}
                                  </p>
                                  <p className="truncate opacity-70 italic">
                                    {message.replyTo.callType !== undefined
                                      ? (message.replyTo.callType === 'video' ? 'Appel vidéo' : 'Appel vocal')
                                      : (message.replyTo.content || (message.replyTo.attachments?.length > 0 ? "Média" : "Message supprimé"))}
                                  </p>
                                </div>
                              )}

                              {/* Message Content */}
                              {message.attachments && message.attachments.length > 0 && message.attachments.some(a => a.type === 'image') ? (
                                <div className="whatsapp-image-bubble relative overflow-hidden rounded-xl shadow-sm" style={{ maxWidth: '280px', minWidth: '180px' }}>
                                  {message.attachments.map((att, idx) => (
                                    att.type === 'image' && (
                                      <div key={idx} className="relative">
                                        <img
                                          src={getFullImageUrl(att.url)}
                                          alt={att.filename || 'Image'}
                                          className="w-full h-auto object-cover rounded-xl cursor-pointer hover:brightness-90 transition-all duration-200"
                                          style={{ maxHeight: '320px', minHeight: '120px', display: 'block' }}
                                          onClick={() => window.open(getFullImageUrl(att.url), '_blank')}
                                          onError={(e) => {
                                            e.target.style.display = 'none'
                                            const errorDiv = e.target.nextElementSibling
                                            if (errorDiv) errorDiv.style.display = 'flex'
                                          }}
                                        />
                                        <div className="hidden items-center justify-center p-4 bg-gray-200 rounded-xl text-gray-500 text-sm" style={{ minHeight: '100px' }}>
                                          <Image size={20} className="mr-2" />
                                          <span>Image non disponible</span>
                                        </div>
                                        
                                        {/* Timestamp overlay on image if no content */}
                                        {!message.content && (
                                          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 rounded-full px-1.5 py-0.5">
                                            <span className="text-[10px] text-white tabular-nums">
                                              {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isOwn && (
                                              <span className="ml-0.5">
                                                {message.read ? (
                                                  <CheckCheck size={11} className="text-blue-300" />
                                                ) : (
                                                  <Check size={11} className="text-white/70" />
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  ))}
                                  
                                  {/* Caption below image */}
                                  {message.content && (
                                    <div className={`px-3 py-2 text-sm text-gray-900 ${isOwn ? 'bg-[#dcf8c6] dark:bg-[#056162] dark:text-gray-100' : 'bg-white dark:bg-[#202c33] dark:text-gray-100'}`}>
                                      <p className="break-words">{message.content}</p>
                                      <div className="flex items-center justify-end gap-1 mt-1">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                          {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isOwn && (
                                          <span className="ml-0.5">
                                            {message.read ? (
                                              <CheckCheck size={11} className="text-primary dark:text-primary-400" />
                                            ) : (
                                              <Check size={11} className="text-gray-500" />
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {/* Text Message Layout */}
                                  {message.content && (
                                    <p className="text-sm leading-relaxed break-words">
                                      {formatMessageContent(message.content)}
                                    </p>
                                  )}
                                  
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                      {message.attachments.map((att, idx) => (
                                        <div key={idx}>
                                          {att.type === 'video' && (
                                            <div className="relative overflow-hidden rounded-xl shadow-sm" style={{ maxWidth: '280px', minWidth: '180px' }}>
                                              <video
                                                src={getFullImageUrl(att.url)}
                                                controls
                                                className="w-full h-auto object-cover rounded-xl"
                                                style={{ maxHeight: '320px', minHeight: '120px', display: 'block' }}
                                              />
                                              {/* Video Metadata Overlay - Only if no content */}
                                              {!message.content && (
                                                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 rounded-full px-1.5 py-0.5">
                                                  <span className="text-[10px] text-white tabular-nums">
                                                    {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                  </span>
                                                  {isOwn && (
                                                    <span className="ml-0.5">
                                                      {message.read ? (
                                                        <CheckCheck size={11} className="text-blue-300" />
                                                      ) : (
                                                        <Check size={11} className="text-white/70" />
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          {att.type === 'audio' && (
                                            <VoiceMessagePlayer
                                              audioUrl={getFullImageUrl(att.url)}
                                              isOwn={isOwn}
                                              senderAvatar={getFullImageUrl(message.sender?.profileImage)}
                                            />
                                          )}
                                          {att.type === 'file' && (
                                            <div className={`rounded-lg overflow-hidden border ${isOwn ? 'border-primary/20 bg-primary/5' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`} style={{ minWidth: '240px' }}>
                                              <a
                                                href={getFullImageUrl(att.url)}
                                                download
                                                className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                              >
                                                <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                                                  <File size={24} className="text-red-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {att.filename}
                                                  </p>
                                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase">
                                                    {att.mimeType?.split('/')[1] || 'FILE'} • {(att.size / 1024 / 1024).toFixed(1)} MB
                                                  </p>
                                                </div>
                                                <div className="flex-shrink-0">
                                                  <Download size={18} className="text-gray-400" />
                                                </div>
                                              </a>
                                              {/* File Timestamp Container */}
                                              <div className="px-3 pb-1 flex justify-end items-center gap-1">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                  {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isOwn && (
                                                  <span className="ml-0.5">
                                                    {message.read ? (
                                                      <CheckCheck size={11} className="text-primary dark:text-primary-400" />
                                                    ) : (
                                                      <Check size={11} className="text-gray-500" />
                                                    )}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Bottom timestamp for text, audio, and videos with captions */}
                                  {(message.content || (!message.attachments?.some(att => att.type === 'file') && !message.attachments?.some(att => att.type === 'video'))) && (
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                      <span className="text-[10px] text-gray-600 dark:text-gray-400">
                                        {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      {selectedConversation?.pinnedMessages?.includes(message.id) && (
                                        <Pin size={10} className="text-gray-500 dark:text-gray-400 fill-gray-500 ml-0.5" />
                                      )}
                                      {message.isStarred && (
                                        <Star size={10} className="text-yellow-500 fill-yellow-500 ml-0.5" />
                                      )}
                                      {isOwn && (
                                        <span className="ml-0.5">
                                          {message.read ? (
                                            <CheckCheck size={12} className="text-primary dark:text-primary-400" />
                                          ) : (
                                            <Check size={12} className="text-gray-600 dark:text-gray-400" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Reactions display & Options Menu */}
                              <div className="relative ml-1 message-menu-container">
                                {message.reactions?.length > 0 && (
                                  <div className="absolute top-full right-0 flex -space-x-1 mt-1 z-10">
                                    {message.reactions.map((r, i) => (
                                      <span key={i} title={r.user?.nom} className="bg-white dark:bg-[#202c33] shadow-sm border border-gray-100 dark:border-gray-700 rounded-full px-1.5 py-0.5 text-[10px] hover:scale-110 transition cursor-default">
                                        {r.emoji}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => setMessageMenuOpen(messageMenuOpen === message.id ? null : message.id)}
                                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                  title="Options du message"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                
                                {messageMenuOpen === message.id && (
                                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[150px] message-menu-container">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleToggleStar(message)
                                        setMessageMenuOpen(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center gap-2"
                                    >
                                      <Star size={14} className={message.isStarred ? 'fill-yellow-500 text-yellow-500' : ''} />
                                      {message.isStarred ? 'Retirer l\'importance' : 'Marquer comme important'}
                                    </button>
                                    {isOwn && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-2"
                                      >
                                        <Trash2 size={14} />
                                        Supprimer
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Tails Positioned INSIDE the bubble div since it is relative */}
                              {!message.attachments?.some(a => a.type === 'image') && (
                                isOwn ? (
                                  <div className="absolute -right-1.5 top-0 w-3 h-3 bg-[#dcf8c6] dark:bg-[#056162] [clip-path:polygon(0_0,100%_0,0_100%)]"></div>
                                ) : (
                                  <div className="absolute -left-1.5 top-0 w-3 h-3 bg-white dark:bg-[#202c33] [clip-path:polygon(0_0,100%_0,100%_100%)]"></div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    )
                  })
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun message</div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
              <div className="text-center px-4">
                <div className="w-24 h-24 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={48} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Sélectionnez une conversation pour commencer</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ou recherchez un utilisateur pour démarrer une nouvelle discussion</p>
              </div>
            </div>
          )}

          {/* Barre de saisie - Toujours visible et fixe en bas */}
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 border-t border-gray-300 dark:border-gray-700 flex-shrink-0" style={{ minHeight: '70px' }}>
            {selectedConversation ? (
              <>
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1"
                      >
                        {getFileIcon(file)}
                        <span className="text-xs truncate max-w-[100px] text-gray-900 dark:text-gray-100">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 w-full">
                  {isRecording || isPreviewMode ? (
                    <div className="flex items-center gap-2 w-full bg-white dark:bg-gray-800 rounded-full px-2 py-1 md:py-1.5 border border-gray-200 dark:border-gray-700 shadow-sm animate-in slide-in-from-bottom-2 duration-200">
                      {/* Bouton Corbeille (Annuler) */}
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Annuler"
                      >
                        <Trash2 size={22} className="md:w-6 md:h-6" />
                      </button>

                      {/* Zone centrale (Waveform / Player) */}
                      <div className="flex-1 flex items-center gap-3 px-1 min-w-0">
                        {isPreviewMode ? (
                          <div className="flex-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={togglePauseRecording}
                              className="p-1 text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white transition-colors"
                            >
                              {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                            </button>
                            <div className="flex-1 h-6 flex items-center gap-0.5 overflow-hidden">
                              {[...Array(30)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-[2px] bg-gray-300 dark:bg-gray-600 rounded-full"
                                  style={{ height: `${30 + Math.sin(i * 0.5) * 40}%` }}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 tabular-nums">
                              {formatTime(recordingTime)}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Circle size={10} className="text-red-500 fill-red-500 animate-pulse flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 tabular-nums w-10">
                                {formatTime(recordingTime)}
                              </span>
                            </div>
                            <div className="flex-1 h-6 flex items-center gap-0.5 overflow-hidden opacity-40">
                              {[...Array(30)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-[2px] bg-gray-500 rounded-full animate-bounce"
                                  style={{
                                    height: `${20 + Math.random() * 60}%`,
                                    animationDelay: `${i * 0.05}s`,
                                    animationDuration: '0.5s'
                                  }}
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Mic size={18} />
                              <span className="text-xs hidden md:block italic">Enregistrement...</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Bouton d'envoi circulaire vert */}
                      <button
                        type="button"
                        onClick={handleFinishAndSend}
                        className="w-10 h-10 md:w-11 md:h-11 bg-[#25d366] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#1da851] transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
                        title="Envoyer le message vocal"
                      >
                        <Send size={20} className="ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      {replyingTo && (
                        <div className="absolute bottom-full left-0 right-0 bg-gray-50 dark:bg-gray-800 border-t border-x border-gray-200 dark:border-gray-700 rounded-t-xl p-3 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                          <div className="flex-1 min-w-0 border-l-4 border-primary pl-3 py-1">
                            <p className="text-xs font-bold text-primary truncate">
                              Réponse à {replyingTo.sender?.nom || (replyingTo.caller?.nom)} {replyingTo.sender?.prenom || (replyingTo.caller?.prenom)}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {replyingTo.callType !== undefined
                                ? (replyingTo.callType === 'video' ? 'Appel vidéo' : 'Appel vocal')
                                : (replyingTo.content || (replyingTo.attachments?.length > 0 ? "Média" : ""))}
                            </p>
                          </div>
                          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition ml-2">
                            <X size={18} className="text-gray-500" />
                          </button>
                        </div>
                      )}
                      <form onSubmit={handleSendMessage} className={`flex items-center gap-2 w-full bg-white dark:bg-gray-800 rounded-full px-2 py-1 md:py-1.5 border border-gray-200 dark:border-gray-700 shadow-sm ${replyingTo ? 'rounded-t-none border-t-0' : ''}`}>
                        {/* Bouton Plus (Pièces jointes) */}
                        <div className="relative flex-shrink-0" ref={attachmentMenuRef}>
                          <input
                            ref={imageInputRef}
                            type="file"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                            accept="image/*"
                          />
                          <input
                            ref={videoInputRef}
                            type="file"
                            multiple
                            onChange={handleVideoSelect}
                            className="hidden"
                            accept="video/*"
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                          />

                          <button
                            type="button"
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition flex-shrink-0"
                            title="Plus"
                          >
                            <Plus size={22} className="md:w-6 md:h-6" />
                          </button>

                          {showAttachmentMenu && (
                            <div className="absolute bottom-full mb-3 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2 z-50 flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                              <button
                                type="button"
                                onClick={() => {
                                  imageInputRef.current?.click()
                                  setShowAttachmentMenu(false)
                                }}
                                className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                title="Images"
                              >
                                <Image size={20} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  videoInputRef.current?.click()
                                  setShowAttachmentMenu(false)
                                }}
                                className="p-2.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition"
                                title="Vidéos"
                              >
                                <Video size={20} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  fileInputRef.current?.click()
                                  setShowAttachmentMenu(false)
                                }}
                                className="p-2.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition"
                                title="Documents"
                              >
                                <File size={20} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bouton emoji */}
                        <div className="relative flex-shrink-0 emoji-picker-container">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition flex-shrink-0"
                            title="Emoji"
                          >
                            <Smile size={22} className="md:w-6 md:h-6" />
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-full mb-3 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-0 z-50 w-72 flex flex-col hide-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
                              {/* Onglets de catégories */}
                              <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto no-scrollbar">
                                {emojiCategories.map(cat => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setActiveEmojiCategory(cat.id)}
                                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${activeEmojiCategory === cat.id ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    title={cat.name}
                                  >
                                    <span className="text-lg">{cat.icon}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Grille d'emojis */}
                              <div className="p-3 max-h-56 overflow-y-auto no-scrollbar">
                                <div className="grid grid-cols-7 gap-1 justify-items-center">
                                  {emojiCategories.find(c => c.id === activeEmojiCategory)?.emojis.map((emoji, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      onClick={() => {
                                        setMessageContent(prev => prev + emoji)
                                      }}
                                      className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition flex items-center justify-center w-8 h-8"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Footer / Info */}
                              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 text-[10px] text-gray-400 rounded-b-xl border-t border-gray-100 dark:border-gray-700 uppercase tracking-wider font-bold">
                                {emojiCategories.find(c => c.id === activeEmojiCategory)?.name}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Input de message */}
                        <input
                          type="text"
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="Entrez un message"
                          className="flex-1 outline-none text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 min-w-0 bg-transparent py-2"
                          disabled={loading}
                          onFocus={(e) => {
                            e.stopPropagation()
                            setIsInitialLoad(false)
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              if (messageContent.trim() || selectedFiles.length > 0) {
                                handleSendMessage(e)
                              }
                            }
                          }}
                        />

                        {/* Bouton vocal/envoi - Noir/Gris comme sur l'image */}
                        {messageContent.trim() || selectedFiles.length > 0 || audioBlob ? (
                          <button
                            type="submit"
                            disabled={loading}
                            className="p-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition disabled:opacity-50 flex-shrink-0"
                            title="Envoyer"
                          >
                            <Send size={22} className="md:w-6 md:h-6" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onMouseDown={handleVoicePress}
                            onMouseMove={handleVoiceMove}
                            onMouseUp={handleVoiceRelease}
                            onMouseLeave={handleVoiceRelease}
                            onTouchStart={handleVoicePress}
                            onTouchMove={handleVoiceMove}
                            onTouchEnd={handleVoiceRelease}
                            className={`p-2 transition flex-shrink-0 select-none ${isRecording ? 'text-red-500 scale-125 animate-pulse' : 'text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white'}`}
                            title="Maintenir pour enregistrer"
                          >
                            <Mic size={22} className="md:w-6 md:h-6" />
                          </button>
                        )}
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">Sélectionnez une conversation pour envoyer un message</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'appel vidéo */}
      {
        isVideoCallActive && callParticipant && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
              {/* Vidéo distante (grande) */}
              <div className="flex-1 bg-gray-900 rounded-t-lg overflow-hidden relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {(!webRTC.remoteStream || !webRTC.isConnected) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <VideoCall size={48} className="text-primary" />
                      </div>
                      <p className="text-white text-xl font-semibold">
                        {callParticipant.nom} {callParticipant.prenom}
                      </p>
                      <p className="text-gray-400 mt-2">
                        {!webRTC.isConnected ? 'Connexion en cours...' : 'En attente du flux vidéo...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vidéo locale (petite, en bas à droite) */}
              <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log('✅ Métadonnées vidéo locale chargées')
                    if (localVideoRef.current) {
                      localVideoRef.current.play().catch(err => {
                        console.error('Erreur play vidéo locale:', err)
                      })
                    }
                  }}
                  onError={(e) => {
                    console.error('❌ Erreur vidéo locale:', e)
                  }}
                />
                {(!localVideoRef.current?.srcObject || localVideoRef.current?.readyState === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white text-xs">
                      <VideoCall size={24} className="mx-auto mb-2" />
                      <p>Votre caméra</p>
                      <p className="text-gray-400 text-[10px] mt-1">Chargement...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contrôles d'appel */}
              <div className="bg-gray-900 px-6 py-4 flex items-center justify-center gap-4 rounded-b-lg">
                <button
                  onClick={() => {
                    // Toggle microphone
                    if (localStreamRef.current) {
                      const audioTrack = localStreamRef.current.getAudioTracks()[0]
                      if (audioTrack) {
                        audioTrack.enabled = !audioTrack.enabled
                      }
                    }
                  }}
                  className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition"
                  title="Muet/Microphone"
                >
                  <Mic size={20} />
                </button>
                <button
                  onClick={endVideoCall}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition shadow-lg"
                  title="Raccrocher"
                >
                  <Phone size={24} className="rotate-135" />
                </button>
                <button
                  onClick={() => {
                    // Toggle caméra
                    if (localStreamRef.current) {
                      const videoTrack = localStreamRef.current.getVideoTracks()[0]
                      if (videoTrack) {
                        videoTrack.enabled = !videoTrack.enabled
                      }
                    }
                  }}
                  className="w-12 h-12 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition"
                  title="Caméra On/Off"
                >
                  <VideoCall size={20} />
                </button>
              </div>

              {/* Informations de l'appel */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg">
                <p className="text-sm font-semibold">
                  Appel vidéo avec {callParticipant.nom} {callParticipant.prenom}
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal d'appel entrant */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/5">
                {incomingCall.type === 'video' ? (
                  <VideoCall size={40} className="text-primary animate-pulse" />
                ) : (
                  <Phone size={40} className="text-primary animate-bounce" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Appel {incomingCall.type === 'video' ? 'vidéo' : 'vocal'} entrant
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-center text-lg">
                {incomingCall.callerName} vous appelle
              </p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={rejectCall}
                  className="flex-1 py-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                >
                  <X size={20} /> Refuser
                </button>
                <button
                  onClick={answerCall}
                  className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                >
                  <Phone size={20} /> Répondre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'appel vocal - Style WhatsApp */}
      {
        isPhoneCallActive && callParticipant && (
          <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-900 z-50 flex items-center justify-center">
            {/* Audio distant invisible */}
            <audio ref={remoteAudioRef} autoPlay />
            <div className="relative w-full max-w-md p-8 flex flex-col items-center">
              {/* Avatar et info du contact */}
              <div className="text-center mb-8">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 ring-4 ring-white/30">
                  {callParticipant.profileImage ? (
                    <img
                      src={getFullImageUrl(callParticipant.profileImage)}
                      alt={callParticipant.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-5xl">
                      {callParticipant.nom?.[0]}{callParticipant.prenom?.[0]}
                    </span>
                  )}
                </div>
                <h2 className="text-white text-3xl font-semibold mb-2">
                  {callParticipant.nom} {callParticipant.prenom}
                </h2>
                <p className="text-white/80 text-lg">
                  {callState === 'ringing' ? 'Appel en cours...' : 'En communication'}
                </p>
              </div>

              {/* Animation d'onde sonore */}
              <div className="flex items-center justify-center gap-1 mb-12 h-16">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-white/80 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 40 + 20}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>

              {/* Timer de l'appel - Seulement quand connecté */}
              <div className="text-white/60 text-sm mb-8 font-mono">
                {callState === 'connected' ? (
                  (() => {
                    const minutes = Math.floor(callDuration / 60)
                    const seconds = callDuration % 60
                    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                  })()
                ) : (
                  '⋯'
                )}
              </div>

              {/* Contrôles d'appel vocal */}
              <div className="flex items-center justify-center gap-6">
                {/* Bouton Micro On/OffToggle microphone */}
                <button
                  onClick={() => {
                    if (localStreamRef.current) {
                      const audioTrack = localStreamRef.current.getAudioTracks()[0]
                      if (audioTrack) {
                        audioTrack.enabled = !audioTrack.enabled
                        // Forcer le re-render pour mettre à jour l'icône
                        setIsPhoneCallActive(prev => prev)
                      }
                    }
                  }}
                  className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition shadow-lg border border-white/30"
                  title="Activer/Désactiver le microphone"
                >
                  {localStreamRef.current?.getAudioTracks()[0]?.enabled ? (
                    <Mic size={24} />
                  ) : (
                    <div className="relative">
                      <Mic size={24} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-0.5 bg-white rotate-45 transform origin-center" />
                      </div>
                    </div>
                  )}
                </button>

                {/* Bouton Raccrocher */}
                <button
                  onClick={endPhoneCall}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition shadow-xl transform hover:scale-105"
                  title="Raccrocher"
                >
                  <Phone size={28} className="rotate-135" />
                </button>

                {/* Bouton Haut-parleur */}
                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-14 h-14 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition shadow-lg border ${isSpeakerOn ? 'bg-white/40 border-white/60' : 'bg-white/20 border-white/30 hover:bg-white/30'}`}
                  title={isSpeakerOn ? "Désactiver le haut-parleur" : "Activer le haut-parleur"}
                >
                  {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>
              </div>

              {/* Indicateur de qualité de connexion */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full">
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-green-400 rounded-full" />
                  <div className="w-1 h-4 bg-green-400 rounded-full" />
                  <div className="w-1 h-5 bg-green-400 rounded-full" />
                </div>
                <span className="text-white text-xs">Excellente</span>
              </div>
            </div>
          </div>
        )
      }

      {/* Panneau d'informations du contact */}
      {showContactInfo && selectedContactInfo && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowContactInfo(false)}
          />

          {/* Panneau latéral */}
          <div className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white dark:bg-gray-800 z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowContactInfo(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Infos du contact</h2>
              </div>
            </div>

            {/* Photo de profil et nom */}
            <div className="flex flex-col items-center py-10 px-4 bg-white dark:bg-gray-800">
              <label
                className="w-32 h-32 rounded-full overflow-hidden bg-primary flex items-center justify-center mb-6 relative group cursor-pointer shadow-lg"
                htmlFor="messages-profile-upload"
              >
                {selectedContactInfo.profileImage ? (
                  <img
                    src={getFullImageUrl(selectedContactInfo.profileImage)}
                    alt={selectedContactInfo.nom}
                    className="w-full h-full object-cover transition group-hover:opacity-75"
                  />
                ) : (
                  <span className="text-white font-bold text-4xl">
                    {selectedContactInfo.nom?.[0]}{selectedContactInfo.prenom?.[0]}
                  </span>
                )}
                {selectedContactInfo.id === user?.id && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Camera size={32} className="text-white" />
                  </div>
                )}
              </label>    {selectedContactInfo.id === user?.id && (
                    <input
                      id="messages-profile-upload"
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      try {
                        const res = await api.uploadProfileImage(file)
                        if (res.success) {
                          const updatedUser = { ...user, profileImage: res.profileImage }
                          localStorage.setItem('user', JSON.stringify(updatedUser))
                          alert('Photo de profil mise à jour !')
                          window.location.reload()
                        }
                      } catch (err) {
                        alert(err.message || "Erreur lors de l'upload")
                      }
                    }
                  }}
                    />
                  )}
              <h3 className="text-[#111b21] dark:text-[#e9edef] text-2xl font-normal text-center">
                {selectedContactInfo.id === user?.id ? `${user.nom} ${user.prenom}` : `${selectedContactInfo.nom} ${selectedContactInfo.prenom}`}
              </h3>
              <p className="text-[#54656f] dark:text-[#8696a0] text-lg font-normal mb-8 text-center">
                {selectedContactInfo.id === user?.id
                  ? (user.telephone || 'Non renseigné')
                  : (selectedContactInfo.telephone || 'Non renseigné')}
              </p>
            </div>

            {/* Boutons d'action rapide - Style WhatsApp Premium */}
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <button className="flex-1 flex flex-col items-center justify-center py-4 px-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition shadow-sm">
                <Search size={22} className="text-green-600 dark:text-green-500 mb-2" />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Rechercher</span>
              </button>
              {!selectedConversation?.isGroup && (
                <>
                  <button
                    onClick={() => {
                      setShowContactInfo(false)
                      handleVideoCall()
                    }}
                    className="flex-1 flex flex-col items-center justify-center py-4 px-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition shadow-sm"
                  >
                    <VideoCall size={22} className="text-green-600 dark:text-green-500 mb-2" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Vidéo</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowContactInfo(false)
                      handlePhoneCall()
                    }}
                    className="flex-1 flex flex-col items-center justify-center py-4 px-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition shadow-sm"
                  >
                    <Phone size={22} className="text-green-600 dark:text-green-500 mb-2" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Vocal</span>
                  </button>
                </>
              )}
            </div>

            {/* Section Infos */}
            <div className="px-4 py-2">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Infos</h4>
            </div>

            {/* Liste des options */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <button
                onClick={() => {
                  loadMediaAttachments()
                  setShowMediaModal(true)
                }}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <Image size={20} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">Médias, liens et documents</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {messages.filter(m => m.attachments?.length > 0).length}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => {
                  loadStarredMessages()
                  setShowStarredModal(true)
                }}
                className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="text-gray-900 dark:text-gray-100">Messages importants</span>
              </button>

              <button
                onClick={() => handleUpdateSettings({ isMuted: !isMuted })}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="text-gray-900 dark:text-gray-100">Paramètres de notification</span>
                </div>
                <span className="text-xs text-gray-500">{isMuted ? 'Muting ON' : 'Muting OFF'}</span>
              </button>

              <button
                onClick={() => {
                  const durations = [0, 86400, 604800, 7776000] // Off, 24h, 7d, 90d
                  const currentIdx = durations.indexOf(disappearingDuration)
                  const nextIdx = (currentIdx + 1) % durations.length
                  handleUpdateSettings({ disappearingDuration: durations[nextIdx] })
                }}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <div className="flex items-center space-x-3 text-left">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-gray-900 dark:text-gray-100">Messages éphémères</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {disappearingDuration === 0 ? 'Non' : disappearingDuration === 86400 ? '24 heures' : disappearingDuration === 604800 ? '7 jours' : '90 jours'}
                    </p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-gray-900 dark:text-gray-100">Chiffrement</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Les messages sont chiffrés de bout en bout. Cliquez pour confirmer.</p>
                </div>
              </button>

              <button
                onClick={handleToggleFavorite}
                className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <svg className={`w-5 h-5 ${isFavorite ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-gray-900 dark:text-gray-100">{isFavorite ? 'Retirer des Favoris' : 'Ajouter aux Favoris'}</span>
              </button>

              <button
                onClick={handleBlockContact}
                className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="text-red-600 dark:text-red-400">
                  {user.blockedUsers?.includes(selectedContactInfo?.id) ? 'Débloquer' : 'Bloquer'} {selectedContactInfo?.nom} {selectedContactInfo?.prenom}
                </span>
              </button>

              <button
                onClick={handleReportContact}
                className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="text-red-600 dark:text-red-400">Signaler {selectedContactInfo?.nom} {selectedContactInfo?.prenom}</span>
              </button>

              <button
                onClick={handleDeleteConversation}
                className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-red-600 dark:text-red-400">Supprimer la discussion</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal des Médias, liens et documents */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Médias, liens et documents</h3>
              <button onClick={() => setShowMediaModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {mediaAttachments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Image size={48} className="mb-4 opacity-20" />
                  <p>Aucun média pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {mediaAttachments.map((att, idx) => (
                    <div key={idx} className="aspect-square relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {att.type === 'image' ? (
                        <img src={att.url} alt={att.filename} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition" />
                      ) : att.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center cursor-pointer">
                          <Video size={32} className="text-gray-400" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 text-center cursor-pointer">
                          <File size={32} className="text-gray-400 mb-1" />
                          <p className="text-[10px] break-all truncate">{att.filename}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal des Messages Importants */}
      {showStarredModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Messages importants</h3>
              <button onClick={() => setShowStarredModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {starredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p>Aucun message important</p>
                </div>
              ) : (
                starredMessages.map((msg, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-primary">{msg.sender?.nom} {msg.sender?.prenom}</span>
                      <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200">{msg.content}</p>
                    <button
                      onClick={() => handleToggleStar(msg)}
                      className="absolute top-2 right-2 p-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <Check size={14} />
                    </button>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="text-xs text-blue-500 underline truncate max-w-[150px]">{att.filename}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[100] bg-white dark:bg-[#233138] shadow-2xl rounded-xl border border-gray-100 dark:border-gray-700 w-64 py-2 animate-in fade-in zoom-in duration-150"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 400), left: Math.min(contextMenu.x, window.innerWidth - 270) }}
          onClick={e => e.stopPropagation()}
        >
          {/* Reactions - Hidden for calls */}
          {contextMenu.message?.callType === undefined && (
            <div className="flex items-center justify-around px-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(contextMenu.message.id, emoji)}
                  className="text-2xl hover:scale-125 transition p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {[
            { label: 'Répondre', icon: CornerUpLeft, action: () => { setReplyingTo(contextMenu.message); setContextMenu({ ...contextMenu, visible: false }) } },
            { label: 'Épingler', icon: Pin, action: () => { togglePin(contextMenu.message); setContextMenu({ ...contextMenu, visible: false }) }, hideForCall: true },
            { label: 'Marquer comme important', icon: Star, action: () => { handleToggleStar(contextMenu.message); setContextMenu({ ...contextMenu, visible: false }) }, hideForCall: true },
            { label: 'Sélectionner', icon: CheckSquare, action: () => { setIsSelectionMode(true); setSelectedMessages([contextMenu.message.id]); setContextMenu({ ...contextMenu, visible: false }) } },
          ].filter(item => !item.hideForCall || contextMenu.message?.callType === undefined).map((item, idx) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-sm text-gray-700 dark:text-gray-300"
            >
              <item.icon size={18} className="text-gray-400" />
              <span>{item.label}</span>
            </button>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
            <button
              onClick={() => { handleDeleteMessage(contextMenu.message.id); setContextMenu({ ...contextMenu, visible: false }) }}
              className="w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-900/10 transition text-sm text-red-600 dark:text-red-400"
            >
              <Trash2 size={18} />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
