import React, { useState, useEffect } from 'react'
import { Star, Send, ThumbsUp, ThumbsDown, MessageCircle, User, Reply } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { api, getFullImageUrl } from '../utils/api'

export default function CommentSection({ productId, productName, productData }) {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [likingComment, setLikingComment] = useState(null)

  useEffect(() => {
    if (productId) {
      loadComments()
    }
  }, [productId])

  // Fonction pour obtenir l'ID du produit depuis l'API si c'est un ID numérique
  const getProductApiId = async (id) => {
    if (!id) return null

    // Si l'ID est déjà un ObjectId MongoDB, le retourner tel quel
    const idString = id.toString()
    if (idString.length === 24 && /^[0-9a-fA-F]{24}$/.test(idString)) {
      return idString
    }

    // Si c'est un ID numérique (mock), on ne peut pas l'utiliser avec l'API
    // Retourner null pour indiquer qu'on ne peut pas utiliser l'API
    return null
  }

  const loadComments = async () => {
    if (!productId) return
    setLoading(true)
    try {
      // Obtenir l'ID API du produit
      const apiProductId = await getProductApiId(productId)

      // Si on ne peut pas obtenir un ObjectId valide, essayer de charger par nom
      if (!apiProductId) {
        // Si on a le nom du produit, essayer de charger les commentaires par nom
        if (productName) {
          try {
            const response = await api.getComments(productId, { productName })
            if (response && response.success) {
              setComments(response.comments || [])
              return
            }
          } catch (error) {
            console.log('Commentaires non disponibles pour ce produit mock')
          }
        }
        setComments([])
        return
      }

      const response = await api.getComments(apiProductId)
      if (response && response.success) {
        setComments(response.comments || [])
      }
    } catch (error) {
      console.error('Erreur chargement commentaires:', error)
      // En cas d'erreur, ne pas afficher d'erreur à l'utilisateur si c'est un produit mock
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Connexion requise',
        message: 'Veuillez vous connecter pour laisser un commentaire'
      })
      return
    }

    if (!content.trim()) {
      showNotification({
        type: 'warning',
        title: 'Champ vide',
        message: 'Veuillez saisir un commentaire'
      })
      return
    }

    setSubmitting(true)
    try {
      // Obtenir l'ID API du produit
      const apiProductId = await getProductApiId(productId)

      // Si on ne peut pas obtenir un ObjectId valide, utiliser l'ID numérique
      // La route serveur va créer automatiquement le produit si nécessaire
      const finalProductId = apiProductId || productId

      const response = await api.addComment(finalProductId, {
        content: content.trim(),
        rating,
        productName: productName || `Produit #${productId}`,
        productData: productData || null
      })

      if (response && response.success) {
        setContent('')
        setRating(5)

        showNotification({
          type: 'success',
          title: 'Commentaire publié',
          message: 'Votre avis a été ajouté avec succès.'
        })

        // Recharger les commentaires
        await loadComments()
      } else {
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: response?.message || "Erreur lors de l'ajout du commentaire"
        })
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error)
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: error?.message || "Erreur lors de l'ajout du commentaire"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId) => {
    if (!user) {
      showNotification({
        type: 'info',
        title: 'Connexion requise',
        message: 'Veuillez vous connecter pour aimer un commentaire'
      })
      return
    }

    setLikingComment(commentId)
    try {
      const response = await api.likeComment(commentId)
      if (response && response.success) {
        // Mettre à jour le commentaire dans la liste
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? {
                ...comment,
                likes: response.comment.likes,
                likesCount: response.comment.likesCount
              }
              : comment
          )
        )
      }
    } catch (error) {
      console.error('Erreur like commentaire:', error)
      alert('Erreur lors du like du commentaire')
    } finally {
      setLikingComment(null)
    }
  }

  const handleLikeReply = async (commentId, replyId) => {
    if (!user) {
      showNotification({
        type: 'info',
        title: 'Connexion requise',
        message: 'Veuillez vous connecter pour aimer une réponse'
      })
      return
    }

    // On utilise le même état de loading mais avec un ID composite
    setLikingComment(`${commentId}-${replyId}`)
    try {
      const response = await api.likeReply(commentId, replyId)
      if (response && response.success) {
        // Mettre à jour la réponse dans la liste
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === replyId
                    ? { ...reply, likes: response.likes }
                    : reply
                )
              }
            }
            return comment
          })
        )
      }
    } catch (error) {
      console.error('Erreur like réponse:', error)
      alert('Erreur lors du like de la réponse')
    } finally {
      setLikingComment(null)
    }
  }

  const handleReplySubmit = async (commentId) => {
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Connexion requise',
        message: 'Veuillez vous connecter pour répondre'
      })
      return
    }

    if (!replyContent.trim()) {
      showNotification({
        type: 'warning',
        title: 'Champ vide',
        message: 'Veuillez saisir une réponse'
      })
      return
    }

    setSubmittingReply(true)
    try {
      const response = await api.replyToComment(commentId, replyContent.trim())
      if (response && response.success) {
        setReplyContent('')
        setReplyingTo(null)

        showNotification({
          type: 'success',
          title: 'Réponse envoyée',
          message: 'Votre réponse a été publiée.'
        })

        // Recharger les commentaires pour afficher la nouvelle réponse
        await loadComments()
      } else {
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: response?.message || "Erreur lors de l'ajout de la réponse"
        })
      }
    } catch (error) {
      console.error('Erreur ajout réponse:', error)
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: error?.message || "Erreur lors de l'ajout de la réponse"
      })
    } finally {
      setSubmittingReply(false)
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp size={16} className="text-green-500" />
      case 'negative':
        return <ThumbsDown size={16} className="text-red-500" />
      default:
        return null
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      case 'negative':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
    }
  }

  const getProfileImageUrl = (profileImage) => {
    return getFullImageUrl(profileImage)
  }

  const isLiked = (comment) => {
    if (!user || !comment.likes) return false
    return comment.likes.some(like =>
      (typeof like === 'object' && like.id ? like.id.toString() : like.toString()) === user.id.toString()
    )
  }

  const isReplyLiked = (reply) => {
    if (!user || !reply.likes) return false
    return reply.likes.some(like =>
      (typeof like === 'object' && like.id ? like.id.toString() : like.toString()) === user.id.toString()
    )
  }

  return (
    <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle size={24} className="text-primary" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Commentaires ({comments.length})
        </h3>
      </div>

      {/* Formulaire d'ajout de commentaire */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Votre note
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                      } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating === 5 && 'Excellent'}
              {rating === 4 && 'Très bon'}
              {rating === 3 && 'Bon'}
              {rating === 2 && 'Moyen'}
              {rating === 1 && 'Mauvais'}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Votre commentaire sur le goût du plat
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez votre avis sur le goût, la texture, l'assaisonnement..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {content.length}/500 caractères
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
            {submitting ? 'Envoi...' : 'Publier le commentaire'}
          </button>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-blue-800 dark:text-blue-200">
            Veuillez vous connecter pour laisser un commentaire sur ce plat.
          </p>
        </div>
      )}

      {/* Liste des commentaires */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Chargement des commentaires...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun commentaire pour le moment. Soyez le premier à partager votre avis !
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const userLiked = isLiked(comment)
            const likesCount = comment.likes?.length || 0
            const profileImageUrl = getProfileImageUrl(comment.user?.profileImage)

            const isOwnComment = user && comment.user && (
              (comment.user.id && comment.user.id.toString() === user.id?.toString()) ||
              (comment.user.id && comment.user.id.toString() === user.id?.toString())
            )

            return (
              <div
                key={comment.id || comment.id}
                className={`p-6 rounded-xl border-2 ${getSentimentColor(comment.sentiment)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Photo de profil */}
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt={`${comment.user?.prenom} ${comment.user?.nom}`}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center ${profileImageUrl ? 'hidden' : ''}`}
                    >
                      <User size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {comment.user?.prenom} {comment.user?.nom || 'Utilisateur'}
                        {isOwnComment && (
                          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            Vous
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(comment.sentiment)}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= comment.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {comment.content}
                </p>

                {/* Actions: J'aime et Répondre (Masquées si c'est notre propre commentaire) */}
                {!isOwnComment && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleLike(comment.id)}
                      disabled={likingComment === comment.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${userLiked
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        } ${likingComment === comment.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <ThumbsUp
                        size={18}
                        className={userLiked ? 'fill-current' : ''}
                      />
                      <span className="font-medium">J'aime</span>
                      {likesCount > 0 && (
                        <span className="text-sm">({likesCount})</span>
                      )}
                    </button>

                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      <Reply size={18} />
                      <span className="font-medium">Répondre</span>
                      {comment.replies?.length > 0 && (
                        <span className="text-sm">({comment.replies.length})</span>
                      )}
                    </button>
                  </div>
                )}

                {/* Formulaire de réponse */}
                {replyingTo === comment.id && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Écrivez votre réponse..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white resize-none mb-3"
                      maxLength={500}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={submittingReply || !replyContent.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                        {submittingReply ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des réponses */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    {comment.replies.map((reply, index) => {
                      const replyProfileImageUrl = getProfileImageUrl(reply.user?.profileImage)
                      return (
                        <div
                          key={index}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {replyProfileImageUrl ? (
                              <img
                                src={replyProfileImageUrl}
                                alt={`${reply.user?.prenom} ${reply.user?.nom}`}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center ${replyProfileImageUrl ? 'hidden' : ''}`}
                            >
                              <User size={16} className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                {reply.user?.prenom} {reply.user?.nom || 'Utilisateur'}
                                {user && reply.user && (
                                  (reply.user.id && reply.user.id.toString() === user.id?.toString()) ||
                                  (reply.user.id && reply.user.id.toString() === user.id?.toString())
                                ) && (
                                    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                      Vous
                                    </span>
                                  )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(reply.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                            {reply.content}
                          </p>

                          {/* Actions pour les réponses */}
                          {user && !(user && reply.user && (
                            (reply.user.id && reply.user.id.toString() === user.id?.toString()) ||
                            (reply.user.id && reply.user.id.toString() === user.id?.toString())
                          )) && (
                              <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                <button
                                  onClick={() => handleLikeReply(comment.id, reply.id)}
                                  disabled={likingComment === `${comment.id}-${reply.id}`}
                                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg transition-all ${isReplyLiked(reply)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                  <ThumbsUp size={14} className={isReplyLiked(reply) ? 'fill-current' : ''} />
                                  <span className="font-medium">J'aime</span>
                                  {reply.likes?.length > 0 && <span>({reply.likes.length})</span>}
                                </button>

                                <button
                                  onClick={() => {
                                    setReplyingTo(comment.id)
                                    setReplyContent(`@${reply.user?.prenom} ${reply.user?.nom} `)
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                >
                                  <Reply size={14} />
                                  <span className="font-medium">Répondre</span>
                                </button>
                              </div>
                            )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
