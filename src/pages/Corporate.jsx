import React, { useState, useEffect } from 'react'
import { Building2, Users, ShoppingBag, FileText, Calendar, DollarSign, Plus, Search, Filter, CheckCircle, XCircle, Clock, TrendingUp, CreditCard, Mail, Phone, MapPin, Settings, UserPlus, Trash2, Edit2, Download } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { useNavigate } from 'react-router-dom'

export default function Corporate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (user) {
      loadCompanyData()
    }
  }, [user])

  const loadCompanyData = async () => {
    setLoading(true)
    try {
      const [companyRes, ordersRes, invoicesRes] = await Promise.all([
        api.getCompanies().catch(() => ({ success: false })),
        user?.companyId ? api.getCompanyOrders(user.companyId).catch(() => ({ success: false })) : Promise.resolve({ success: false }),
        user?.companyId ? api.getCompanyInvoices(user.companyId).catch(() => ({ success: false })) : Promise.resolve({ success: false })
      ])

      if (companyRes.success && companyRes.companies.length > 0) {
        const userCompany = companyRes.companies[0]
        setCompany(userCompany)
        setEmployees(userCompany.employees || [])

        if (ordersRes.success) {
          setOrders(ordersRes.orders || [])
        }
        if (invoicesRes.success) {
          setInvoices(invoicesRes.invoices || [])
        }
      }
    } catch (error) {
      console.error('Erreur chargement données entreprise:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await api.getProducts({ limit: 1000 })
      if (response && response.success) {
        setProducts(response.products || [])
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Aucune entreprise associée
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n'êtes pas associé à une entreprise. Contactez votre administrateur pour obtenir l'accès.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length
  const totalInvoices = invoices.reduce((sum, inv) => inv.status === 'paid' ? sum + inv.total : sum, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="text-primary" size={32} />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {company.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${company.status === 'active' ? 'bg-green-100 text-green-800' :
                  company.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {company.status === 'active' ? 'Actif' :
                    company.status === 'suspended' ? 'Suspendu' :
                      'Inactif'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Mail size={16} />
                  <span>{company.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone size={16} />
                  <span>{company.phone}</span>
                </div>
                {company.corporatePricing?.enabled && company.corporatePricing?.discountPercentage > 0 && (
                  <div className="flex items-center gap-1 text-primary font-semibold">
                    <DollarSign size={16} />
                    <span>{company.corporatePricing.discountPercentage}% de réduction</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Commandes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
              </div>
              <ShoppingBag className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total dépensé</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalSpent.toLocaleString('fr-GN')} GNF
                </p>
              </div>
              <DollarSign className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Factures en attente</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingInvoices}</p>
              </div>
              <FileText className="text-orange-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total payé</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalInvoices.toLocaleString('fr-GN')} GNF
                </p>
              </div>
              <CreditCard className="text-purple-500" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: <TrendingUp size={18} /> },
              { id: 'orders', label: 'Commandes', icon: <ShoppingBag size={18} /> },
              { id: 'invoices', label: 'Factures', icon: <FileText size={18} /> },
              { id: 'employees', label: 'Employés', icon: <Users size={18} /> },
              { id: 'settings', label: 'Paramètres', icon: <Settings size={18} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all duration-300 font-semibold ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Informations de l'entreprise
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Personne de contact</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {company.contactPerson.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {company.contactPerson.position}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Adresse</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {company.address.street}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {company.address.city}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cycle de facturation</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {company.billing.billingCycle === 'monthly' ? 'Mensuel' :
                        company.billing.billingCycle === 'quarterly' ? 'Trimestriel' :
                          'Annuel'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Solde actuel</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {company.billing.currentBalance.toLocaleString('fr-GN')} GNF
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Commandes récentes
                </h3>
                <button
                  onClick={() => {
                    loadProducts()
                    setShowOrderForm(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
                >
                  <Plus size={18} />
                  Nouvelle commande
                </button>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune commande</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Commande #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {order.total.toLocaleString('fr-GN')} GNF
                          </p>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      {order.recurrence?.enabled && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                          <Calendar size={16} />
                          <span>Récurrent: {order.recurrence.frequency}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Factures
              </h3>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune facture</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map(invoice => (
                    <div key={invoice.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(invoice.billingPeriod.startDate).toLocaleDateString('fr-FR')} - {new Date(invoice.billingPeriod.endDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            {invoice.total.toLocaleString('fr-GN')} GNF
                          </p>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {invoice.status === 'paid' ? 'Payée' :
                              invoice.status === 'sent' ? 'Envoyée' :
                                invoice.status === 'overdue' ? 'En retard' :
                                  invoice.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
                        <button className="text-primary hover:text-orange-600 transition flex items-center gap-1">
                          <Download size={16} />
                          Télécharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Employés ({employees.length})
              </h3>
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun employé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="text-primary" size={24} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {employee.user?.prenom} {employee.user?.nom}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {employee.position || employee.department || 'Employé'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Paramètres
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Tarifs Corporate
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Réduction: {company.corporatePricing?.discountPercentage || 0}%
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Facturation
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cycle: {company.billing.billingCycle === 'monthly' ? 'Mensuel' : 'Autre'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Méthode: {company.billing.paymentMethod === 'invoice' ? 'Facture' : 'Autre'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


