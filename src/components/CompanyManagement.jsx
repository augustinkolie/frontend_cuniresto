import React, { useState, useEffect } from 'react'
import { Building2, Plus, Search, Edit2, Trash2, Users, DollarSign, FileText, Settings, Mail, Phone, MapPin, UserPlus, X, Save, CheckCircle } from 'lucide-react'
import { api } from '../utils/api'

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', postalCode: '', country: 'Guinée' },
    contactPerson: { name: '', position: '', email: '', phone: '' },
    adminId: '',
    corporatePricing: { enabled: true, discountPercentage: 0 },
    billing: { billingCycle: 'monthly', paymentMethod: 'invoice' }
  })
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadCompanies()
    loadUsers()
  }, [])

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const response = await api.getCompanies()
      if (response && response.success) {
        setCompanies(response.companies || [])
      }
    } catch (error) {
      console.error('Erreur chargement entreprises:', error)
      alert('Erreur lors du chargement des entreprises')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.getAllUsers()
      if (response && response.success) {
        setUsers(response.users || [])
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedCompany) {
        // Mise à jour
        const response = await api.updateCompany(selectedCompany.id, formData)
        if (response && response.success) {
          alert('Entreprise mise à jour avec succès')
          setShowForm(false)
          setSelectedCompany(null)
          loadCompanies()
        }
      } else {
        // Création
        const response = await api.createCompany(formData)
        if (response && response.success) {
          alert('Entreprise créée avec succès')
          setShowForm(false)
          resetForm()
          loadCompanies()
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde entreprise:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: { street: '', city: '', postalCode: '', country: 'Guinée' },
      contactPerson: { name: '', position: '', email: '', phone: '' },
      adminId: '',
      corporatePricing: { enabled: true, discountPercentage: 0 },
      billing: { billingCycle: 'monthly', paymentMethod: 'invoice' }
    })
    setSelectedCompany(null)
  }

  const handleEdit = (company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      contactPerson: company.contactPerson,
      adminId: company.admin.id,
      corporatePricing: company.corporatePricing,
      billing: company.billing
    })
    setShowForm(true)
  }

  const handleDelete = async (companyId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      return
    }
    // TODO: Implémenter la suppression
    alert('Fonctionnalité de suppression à implémenter')
  }

  const filteredCompanies = companies.filter(company => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        company.name.toLowerCase().includes(search) ||
        company.email.toLowerCase().includes(search) ||
        company.contactPerson.name.toLowerCase().includes(search)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Entreprises</h2>
          <p className="text-gray-600 dark:text-gray-400">Gérez les comptes corporate et leurs tarifs</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition"
        >
          <Plus size={20} />
          Nouvelle entreprise
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin *
                </label>
                <select
                  required
                  value={formData.adminId}
                  onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                placeholder="Rue"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white mb-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  placeholder="Ville"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                  placeholder="Code postal"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Personne de contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={formData.contactPerson.name}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, name: e.target.value } })}
                  placeholder="Nom complet *"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="text"
                  value={formData.contactPerson.position}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, position: e.target.value } })}
                  placeholder="Poste"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="email"
                  required
                  value={formData.contactPerson.email}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, email: e.target.value } })}
                  placeholder="Email *"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="tel"
                  required
                  value={formData.contactPerson.phone}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, phone: e.target.value } })}
                  placeholder="Téléphone *"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tarifs Corporate</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.corporatePricing.enabled}
                    onChange={(e) => setFormData({ ...formData, corporatePricing: { ...formData.corporatePricing, enabled: e.target.checked } })}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Activer les tarifs corporate
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pourcentage de réduction (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.corporatePricing.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, corporatePricing: { ...formData.corporatePricing, discountPercentage: parseFloat(e.target.value) || 0 } })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Facturation</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cycle de facturation
                  </label>
                  <select
                    value={formData.billing.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billing: { ...formData.billing, billingCycle: e.target.value } })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="monthly">Mensuel</option>
                    <option value="quarterly">Trimestriel</option>
                    <option value="yearly">Annuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Méthode de paiement
                  </label>
                  <select
                    value={formData.billing.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, billing: { ...formData.billing, paymentMethod: e.target.value } })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="invoice">Facture</option>
                    <option value="credit_card">Carte bancaire</option>
                    <option value="bank_transfer">Virement bancaire</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
              >
                <Save size={18} />
                {selectedCompany ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher une entreprise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Liste des entreprises */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucune entreprise trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map(company => (
            <div key={company.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="text-primary" size={32} />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{company.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{company.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  company.status === 'active' ? 'bg-green-100 text-green-800' :
                  company.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {company.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users size={16} />
                  <span>{company.employees?.length || 0} employés</span>
                </div>
                {company.corporatePricing?.enabled && (
                  <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                    <DollarSign size={16} />
                    <span>{company.corporatePricing.discountPercentage}% de réduction</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText size={16} />
                  <span>Facturation: {company.billing.billingCycle === 'monthly' ? 'Mensuelle' : 'Autre'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(company)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

