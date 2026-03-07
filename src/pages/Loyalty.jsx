import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import {
  Award, Star, Gift, Users, TrendingUp, Copy, CheckCircle,
  Clock, ShoppingBag, Sparkles, Coins, Phone, ArrowRight, X, Loader
} from 'lucide-react'

export default function Loyalty() {
  const { user } = useAuth()
  const [loyalty, setLoyalty] = useState(null)
  const [rewards, setRewards] = useState([])
  const [referralInfo, setReferralInfo] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [referralCodeCopied, setReferralCodeCopied] = useState(false)
  const [cashbackAmount, setCashbackAmount] = useState('')
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState('')
  const [showCashbackModal, setShowCashbackModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Chargement des données de fidélité...')
      
      // Charger les informations de parrainage
      let referralRes = null
      let referralCode = null
      
      // Essayer plusieurs fois pour obtenir le code
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          referralRes = await api.getReferralInfo()
          console.log(`📥 Tentative ${attempt + 1} - Réponse API:`, referralRes)
          
          // Extraire le code de la réponse
          if (referralRes) {
            referralCode = referralRes.referralCode || referralRes.data?.referralCode || null
            
            // Si on a un code valide, arrêter les tentatives
            if (referralCode && String(referralCode).trim() !== '') {
              console.log('✅ Code trouvé:', referralCode)
              break
            }
          }
          
          // Si pas de code, forcer la génération
          if (!referralCode || String(referralCode).trim() === '') {
            console.log(`⚠️ Tentative ${attempt + 1} - Code manquant, génération...`)
            try {
              const generateRes = await api.generateReferralCode()
              console.log('📥 Réponse génération:', generateRes)
              
              if (generateRes?.referralCode) {
                referralCode = generateRes.referralCode
                break
              } else if (generateRes?.success) {
                // Attendre un peu puis réessayer
                await new Promise(resolve => setTimeout(resolve, 500))
                continue
              }
            } catch (genError) {
              console.error('❌ Erreur génération:', genError)
            }
          }
        } catch (err) {
          console.error(`❌ Erreur tentative ${attempt + 1}:`, err)
          if (attempt === 2) {
            // Dernière tentative échouée, utiliser un code de secours
            if (user?.id) {
              referralCode = `U${user.id.toString().slice(-8).toUpperCase()}`
              console.log('✅ Code de secours généré:', referralCode)
            }
          }
        }
      }
      
      // Charger les autres données en parallèle
      const [loyaltyRes, rewardsRes, transactionsRes] = await Promise.all([
        api.getLoyaltyPoints().catch(() => ({ success: false })),
        api.getRewards().catch(() => ({ success: false })),
        api.getLoyaltyTransactions().catch(() => ({ success: false }))
      ])

      if (loyaltyRes?.success) setLoyalty(loyaltyRes.loyalty)
      if (rewardsRes?.success) setRewards(rewardsRes.rewards || [])
      
      // TOUJOURS définir referralInfo avec un code (même si c'est un code de secours)
      const finalCode = referralCode || (user?.id ? `U${user.id.toString().slice(-8).toUpperCase()}` : 'U00000000')
      
      console.log('✅ Code final à afficher:', finalCode)
      
      setReferralInfo({
        referralCode: finalCode,
        referralsAsReferrer: referralRes?.referralsAsReferrer || referralRes?.data?.referralsAsReferrer || [],
        referralAsReferred: referralRes?.referralAsReferred || referralRes?.data?.referralAsReferred || null,
        totalReferrals: referralRes?.totalReferrals || referralRes?.data?.totalReferrals || 0,
        completedReferrals: referralRes?.completedReferrals || referralRes?.data?.completedReferrals || 0
      })
      
      if (transactionsRes?.success) setTransactions(transactionsRes.transactions || [])
    } catch (error) {
      console.error('❌ Erreur chargement données fidélité:', error)
      console.error('Stack:', error.stack)
      
      // Même en cas d'erreur, créer un code de secours
      const fallbackCode = user?.id ? `U${user.id.toString().slice(-8).toUpperCase()}` : 'U00000000'
      
      setReferralInfo({
        referralCode: fallbackCode,
        referralsAsReferrer: [],
        referralAsReferred: null,
        totalReferrals: 0,
        completedReferrals: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (referralInfo?.referralCode) {
      navigator.clipboard.writeText(referralInfo.referralCode)
      setReferralCodeCopied(true)
      setTimeout(() => setReferralCodeCopied(false), 2000)
    }
  }

  const handleRedeemReward = async (rewardId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir échanger cette récompense ?')) return

    try {
      const response = await api.redeemReward(rewardId)
      if (response.success) {
        alert('Récompense échangée avec succès !')
        await loadData()
      } else {
        alert(response.message || 'Erreur lors de l\'échange')
      }
    } catch (error) {
      console.error('Erreur échange récompense:', error)
      alert('Erreur lors de l\'échange de la récompense')
    }
  }

  const handleRequestCashback = async () => {
    if (!cashbackAmount || !orangeMoneyNumber) {
      alert('Veuillez remplir tous les champs')
      return
    }

    const amount = parseInt(cashbackAmount)
    if (amount <= 0) {
      alert('Montant invalide')
      return
    }

    // 1 point = 10 FCFA
    const pointsNeeded = Math.ceil(amount / 10)
    if (loyalty.availablePoints < pointsNeeded) {
      alert(`Points insuffisants. Nécessaire: ${pointsNeeded} points`)
      return
    }

    try {
      const response = await api.requestCashback(amount, orangeMoneyNumber)
      if (response.success) {
        alert(`Demande de cashback de ${amount} FCFA envoyée !`)
        setShowCashbackModal(false)
        setCashbackAmount('')
        setOrangeMoneyNumber('')
        await loadData()
      } else {
        alert(response.message || 'Erreur lors de la demande')
      }
    } catch (error) {
      console.error('Erreur demande cashback:', error)
      alert('Erreur lors de la demande de cashback')
    }
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'platinum': return 'from-purple-500 to-indigo-600'
      case 'gold': return 'from-yellow-400 to-orange-500'
      case 'silver': return 'from-gray-300 to-gray-400'
      default: return 'from-orange-600 to-red-600'
    }
  }

  const getLevelIcon = (level) => {
    switch (level) {
      case 'platinum': return '💎'
      case 'gold': return '🥇'
      case 'silver': return '🥈'
      default: return '🥉'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Award className="text-primary" size={40} />
            Programme de Fidélité
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gagnez des points, échangez des récompenses et profitez de cashback
          </p>
        </div>

        {/* Points Card */}
        {loyalty && (
          <div className={`bg-gradient-to-br ${getLevelColor(loyalty.level)} rounded-3xl shadow-2xl p-8 mb-8 text-white`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-5xl">{getLevelIcon(loyalty.level)}</span>
                  <div>
                    <p className="text-white/80 text-sm uppercase tracking-wide">Niveau</p>
                    <p className="text-3xl font-bold capitalize">{loyalty.level}</p>
                  </div>
                </div>
                {loyalty.nextLevelPoints && (
                  <p className="text-white/90 text-sm mt-2">
                    {loyalty.nextLevelPoints - loyalty.totalPoints} points jusqu'au niveau suivant
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">Points disponibles</p>
                <p className="text-5xl font-bold">{loyalty.availablePoints}</p>
                <p className="text-white/70 text-sm mt-1">
                  Total: {loyalty.totalPoints} • Utilisés: {loyalty.usedPoints}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            {loyalty.nextLevelPoints && (
              <div className="mt-6">
                <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((loyalty.totalPoints / loyalty.nextLevelPoints) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 p-4">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: <Star size={18} /> },
                { id: 'rewards', label: 'Récompenses', icon: <Gift size={18} /> },
                { id: 'referral', label: 'Parrainage', icon: <Users size={18} /> },
                { id: 'history', label: 'Historique', icon: <Clock size={18} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-semibold ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-4">
                      <Coins className="text-blue-600 dark:text-blue-400" size={32} />
                      <TrendingUp className="text-blue-500" size={24} />
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Points gagnés</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {loyalty?.totalPoints || 0}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-2">
                      {loyalty?.availablePoints || 0} disponibles
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                      <Gift className="text-green-600 dark:text-green-400" size={32} />
                      <Sparkles className="text-green-500" size={24} />
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Récompenses</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {rewards.length}
                    </p>
                    <p className="text-green-700 dark:text-green-300 text-xs mt-2">
                      Disponibles maintenant
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="text-purple-600 dark:text-purple-400" size={32} />
                      <TrendingUp className="text-purple-500" size={24} />
                    </div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">Parrainages</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {referralInfo?.totalReferrals || 0}
                    </p>
                    <p className="text-purple-700 dark:text-purple-300 text-xs mt-2">
                      {referralInfo?.completedReferrals || 0} complétés
                    </p>
                  </div>
                </div>

                {/* How it works */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="text-primary" size={24} />
                    Comment ça marche ?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Commandez</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Gagnez 10 points par commande + 1 point pour chaque 1000 FCFA dépensés
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Parrainez</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Partagez votre code et gagnez 500 points quand votre filleul commande
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Échangez</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Utilisez vos points pour obtenir des réductions et récompenses
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">Cashback</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Convertissez vos points en cashback Orange Money (1 point = 10 FCFA)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cashback Button */}
                {loyalty && loyalty.availablePoints >= 10 && (
                  <button
                    onClick={() => setShowCashbackModal(true)}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                  >
                    <Phone size={24} />
                    Demander un cashback Orange Money
                  </button>
                )}
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Récompenses disponibles
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {rewards.length} récompense(s)
                  </span>
                </div>
                {rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune récompense disponible</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map(reward => (
                      <div
                        key={reward.id}
                        className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-primary transition"
                      >
                        {reward.image && (
                          <img
                            src={reward.image}
                            alt={reward.name}
                            className="w-full h-32 object-cover rounded-lg mb-4"
                          />
                        )}
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                          {reward.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Coins className="text-yellow-500" size={20} />
                            <span className="font-bold text-gray-900 dark:text-white">
                              {reward.pointsCost} points
                            </span>
                          </div>
                          {reward.valueType === 'percentage' ? (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                              -{reward.value}%
                            </span>
                          ) : (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                              {reward.value} FCFA
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={!loyalty || loyalty.availablePoints < reward.pointsCost}
                          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {!loyalty || loyalty.availablePoints < reward.pointsCost
                            ? 'Points insuffisants'
                            : 'Échanger'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Referral Tab */}
            {activeTab === 'referral' && (
              <div className="space-y-6">
                {/* My Referral Code */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Votre code de parrainage
                    </h3>
                    <button
                      onClick={async () => {
                        console.log('🔄 Génération manuelle du code...')
                        setLoading(true)
                        try {
                          const generateRes = await api.generateReferralCode()
                          console.log('📥 Réponse génération:', generateRes)
                          if (generateRes?.success) {
                            await loadData()
                          }
                        } catch (error) {
                          console.error('❌ Erreur génération:', error)
                        } finally {
                          setLoading(false)
                        }
                      }}
                      className="text-sm text-primary hover:text-primary/80 flex items-center gap-2"
                      title="Générer un nouveau code"
                    >
                      <Loader className="animate-spin" size={16} />
                      Régénérer
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white dark:bg-gray-700 rounded-xl p-4 border-2 border-primary">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Code</p>
                      {loading && !referralInfo?.referralCode ? (
                        <div className="flex items-center gap-2">
                          <Loader className="animate-spin text-primary" size={24} />
                          <p className="text-3xl font-bold text-primary font-mono">Chargement...</p>
                        </div>
                      ) : referralInfo?.referralCode ? (
                        <p className="text-3xl font-bold text-primary font-mono break-all">
                          {String(referralInfo.referralCode).trim()}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                            Génération du code...
                          </p>
                          <button
                            onClick={async () => {
                              console.log('🔄 Rechargement manuel...')
                              setLoading(true)
                              await loadData()
                              setLoading(false)
                            }}
                            className="text-sm text-primary hover:underline flex items-center gap-2"
                          >
                            <Loader className="animate-spin" size={16} />
                            Cliquez pour générer
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={copyReferralCode}
                      disabled={!referralInfo?.referralCode || loading}
                      className="bg-primary text-white px-6 py-4 rounded-xl font-semibold hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {referralCodeCopied ? (
                        <>
                          <CheckCircle size={20} />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy size={20} />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Partagez ce code avec vos amis. Vous gagnerez 500 points quand ils effectueront leur première commande !
                  </p>
                </div>

                {/* Use Referral Code */}
                {!referralInfo?.referralAsReferred && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Utiliser un code de parrainage
                    </h3>
                    <ReferralCodeInput onSuccess={loadData} userReferralCode={referralInfo?.referralCode} />
                  </div>
                )}

                {/* Referral Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total parrainages</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {referralInfo?.totalReferrals || 0}
                    </p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                      Personnes qui ont utilisé votre code
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">Complétés</p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {referralInfo?.completedReferrals || 0}
                    </p>
                    <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                      Premières commandes effectuées
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Points gagnés</p>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {(referralInfo?.completedReferrals || 0) * 500}
                    </p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                      {referralInfo?.completedReferrals || 0} × 500 points
                    </p>
                  </div>
                </div>
                
                {/* Info sur les récompenses */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award className="text-purple-600 dark:text-purple-400" size={24} />
                    Comment fonctionnent les récompenses ?
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold">Vous parrainez un ami</p>
                        <p className="text-gray-600 dark:text-gray-400">Votre ami utilise votre code de parrainage</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold">Votre ami effectue sa première commande</p>
                        <p className="text-gray-600 dark:text-gray-400">Les points sont automatiquement attribués</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold">Récompenses automatiques</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-bold text-purple-600 dark:text-purple-400">Vous gagnez 500 points</span> et{' '}
                          <span className="font-bold text-blue-600 dark:text-blue-400">votre ami gagne 300 points</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referrals List */}
                {referralInfo?.referralsAsReferrer && referralInfo.referralsAsReferrer.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Vos filleuls
                    </h3>
                    <div className="space-y-3">
                      {referralInfo.referralsAsReferrer.map(referral => (
                        <div
                          key={referral.id}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {referral.referred?.prenom} {referral.referred?.nom}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(referral.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-lg font-semibold ${
                            referral.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {referral.status === 'completed' ? 'Complété' : 'En attente'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Historique des transactions
                  </h3>
                  <button
                    onClick={loadData}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-2"
                  >
                    <Loader className="animate-spin" size={16} />
                    Actualiser
                  </button>
                </div>
                
                {/* Filtres */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm"
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Parrainage
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Commandes
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune transaction</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Vos points de parrainage apparaîtront ici après votre première commande
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction, index) => {
                      const isReferral = transaction.source === 'referral'
                      const isReferrer = transaction.description?.includes('Parrainage:')
                      const isReferred = transaction.description?.includes('Bonus parrainage')
                      
                      return (
                        <div
                          key={index}
                          className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 shadow-sm ${
                            transaction.type === 'earned'
                              ? isReferral
                                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800'
                                : 'border-green-500'
                              : transaction.type === 'used'
                              ? 'border-red-500'
                              : 'border-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {isReferral && (
                                <div className={`p-2 rounded-lg ${
                                  isReferrer
                                    ? 'bg-purple-100 dark:bg-purple-900/30'
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                }`}>
                                  {isReferrer ? (
                                    <Users className="text-purple-600 dark:text-purple-400" size={20} />
                                  ) : (
                                    <Award className="text-blue-600 dark:text-blue-400" size={20} />
                                  )}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {transaction.description || 'Transaction'}
                                  </p>
                                  {isReferral && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      isReferrer
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                      {isReferrer ? 'Parrain' : 'Filleul'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {isReferral && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {isReferrer 
                                      ? '🎁 Points gagnés grâce au parrainage d\'un ami'
                                      : '🎉 Bonus de bienvenue pour votre première commande'
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className={`text-xl font-bold ${
                                transaction.type === 'earned'
                                  ? isReferral
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                                {transaction.source === 'referral' 
                                  ? 'Parrainage' 
                                  : transaction.source === 'order'
                                  ? 'Commande'
                                  : transaction.source
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cashback Modal */}
      {showCashbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Phone className="text-primary" size={28} />
                Cashback Orange Money
              </h3>
              <button
                onClick={() => setShowCashbackModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={cashbackAmount}
                  onChange={(e) => setCashbackAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Ex: 1000"
                  min="100"
                />
                {cashbackAmount && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Points nécessaires: {Math.ceil(parseInt(cashbackAmount) / 10)} points
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Numéro Orange Money
                </label>
                <input
                  type="tel"
                  value={orangeMoneyNumber}
                  onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Ex: +224 XXX XXX XXX"
                />
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  💡 <strong>Note:</strong> 1 point = 10 FCFA de cashback. Le cashback sera envoyé dans les 24-48h.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCashbackModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequestCashback}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Demander
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour utiliser un code de parrainage
function ReferralCodeInput({ onSuccess, userReferralCode }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) {
      alert('Veuillez entrer un code de parrainage')
      return
    }

    // Vérifier si l'utilisateur essaie d'utiliser son propre code
    if (userReferralCode && code.trim().toUpperCase() === String(userReferralCode).trim().toUpperCase()) {
      alert('⚠️ Vous ne pouvez pas utiliser votre propre code de parrainage.\n\nPour bénéficier des points de parrainage, vous devez utiliser le code d\'un autre utilisateur.\n\nVotre code est : ' + userReferralCode + '\n\n💡 Partagez-le avec vos amis pour qu\'ils l\'utilisent et gagnez 500 points quand ils effectueront leur première commande !')
      setCode('')
      return
    }

    setLoading(true)
    try {
      console.log('🔄 Utilisation du code:', code.trim().toUpperCase())
      const response = await api.useReferralCode(code.trim().toUpperCase())
      console.log('📥 Réponse API:', response)
      
      if (response && response.success) {
        alert(response.message || 'Code de parrainage enregistré avec succès ! Vous gagnerez 300 points après votre première commande.')
        setCode('')
        if (onSuccess) onSuccess()
      } else {
        // L'API a retourné success: false
        const errorMessage = response?.message || 'Erreur lors de l\'enregistrement du code'
        console.error('❌ Erreur API (success: false):', errorMessage)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erreur utilisation code (catch):', error)
      console.error('Type:', typeof error)
      console.error('Keys:', Object.keys(error || {}))
      
      // Extraire le message d'erreur
      // L'intercepteur retourne déjà error.response.data dans le reject
      let errorMessage = 'Erreur lors de l\'utilisation du code'
      
      // L'intercepteur formate l'erreur avec success: false et message
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.error?.message) {
          errorMessage = error.error.message
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      console.error('📤 Message d\'erreur à afficher:', errorMessage)
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Entrez le code de parrainage"
        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none uppercase"
        maxLength={10}
      />
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={18} />
            Envoi...
          </>
        ) : (
          <>
            <CheckCircle size={18} />
            Utiliser
          </>
        )}
      </button>
    </form>
  )
}

