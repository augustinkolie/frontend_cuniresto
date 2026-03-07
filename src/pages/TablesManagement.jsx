import React, { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  Plus, Trash2, Download, QrCode, Table as TableIcon, 
  CheckCircle, X, AlertCircle, RefreshCw, Bell
} from 'lucide-react'
import { api } from '../utils/api'

export default function TablesManagement() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [waiterCalls, setWaiterCalls] = useState([])
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    location: 'indoor'
  })

  useEffect(() => {
    loadTables()
    loadWaiterCalls()
    // Rafraîchir les appels toutes les 10 secondes
    const interval = setInterval(loadWaiterCalls, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadTables = async () => {
    setLoading(true)
    try {
      const response = await api.getTables()
      if (response.success) {
        setTables(response.tables || [])
      }
    } catch (error) {
      console.error('Erreur chargement tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWaiterCalls = async () => {
    try {
      const response = await api.getWaiterCalls()
      if (response.success) {
        setWaiterCalls(response.calls || [])
      }
    } catch (error) {
      console.error('Erreur chargement appels:', error)
    }
  }

  const handleCreateTable = async () => {
    if (!formData.tableNumber) {
      alert('Veuillez entrer un numéro de table')
      return
    }

    setLoading(true)
    try {
      const response = await api.createTable(formData)
      if (response.success) {
        await loadTables()
        setShowAddModal(false)
        setFormData({ tableNumber: '', capacity: 4, location: 'indoor' })
        alert('Table créée avec succès')
      } else {
        alert(response.message || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('Erreur création table:', error)
      alert('Erreur lors de la création de la table')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQR = async (table) => {
    setLoading(true)
    try {
      const response = await api.generateTableQRCode(table.id)
      if (response.success) {
        await loadTables()
        const updatedTable = tables.find(t => t.id === table.id)
        setSelectedTable({ ...updatedTable, qrCode: response.qrCode, qrCodeUrl: response.qrCodeUrl })
        setShowQRModal(true)
      }
    } catch (error) {
      console.error('Erreur génération QR:', error)
      alert('Erreur lors de la génération du QR Code')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette table ?')) return

    setLoading(true)
    try {
      const response = await api.deleteTable(tableId)
      if (response.success) {
        await loadTables()
        alert('Table supprimée avec succès')
      }
    } catch (error) {
      console.error('Erreur suppression table:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledgeCall = async (orderId) => {
    try {
      const response = await api.acknowledgeWaiterCall(orderId)
      if (response.success) {
        await loadWaiterCalls()
      }
    } catch (error) {
      console.error('Erreur traitement appel:', error)
    }
  }

  const downloadQRCode = (table) => {
    // Pour télécharger le QR code, on peut utiliser une approche différente
    const svg = document.querySelector(`#qrcode-${table.id} svg`)
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          const link = document.createElement('a')
          link.download = `QR-Table-${table.tableNumber}.png`
          link.href = URL.createObjectURL(blob)
          link.click()
          URL.revokeObjectURL(url)
        })
      }
      img.src = url
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-300'
      case 'occupied': return 'bg-red-100 text-red-800 border-red-300'
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'cleaning': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Occupée'
      case 'reserved': return 'Réservée'
      case 'cleaning': return 'Nettoyage'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <TableIcon className="text-primary" size={32} />
            Gestion des Tables
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos tables et générez des QR Codes pour le menu digital
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
        >
          <Plus size={20} />
          Nouvelle table
        </button>
      </div>

      {/* Appels serveur */}
      {waiterCalls.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-900 dark:text-red-300 flex items-center gap-2">
              <Bell className="text-red-500 animate-pulse" size={24} />
              Appels Serveur ({waiterCalls.length})
            </h3>
            <button
              onClick={loadWaiterCalls}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
            >
              <RefreshCw size={20} className="text-red-600" />
            </button>
          </div>
          <div className="space-y-2">
            {waiterCalls.map(call => (
              <div
                key={call.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between border border-red-200"
              >
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    Table {call.tableNumber || call.table?.tableNumber}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(call.waiterCallTime).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => handleAcknowledgeCall(call.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Traité
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Grid */}
      {loading && tables.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map(table => (
            <div
              key={table.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition"
            >
              <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <TableIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Table {table.tableNumber}</h3>
                      <p className="text-orange-100 text-sm">Capacité: {table.capacity} personnes</p>
                    </div>
                  </div>
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(table.status)}`}>
                  {getStatusLabel(table.status)}
                </div>
              </div>

              <div className="p-6">
                {table.qrCode ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center">
                      <QRCodeSVG
                        value={table.qrCodeUrl || `${window.location.origin}/table/${table.qrCode}`}
                        size={150}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedTable(table)
                          setShowQRModal(true)
                        }}
                        className="w-full bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
                      >
                        <QrCode size={18} />
                        Voir QR Code
                      </button>
                      <button
                        onClick={() => handleGenerateQR(table)}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} />
                        Régénérer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <QrCode size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun QR Code</p>
                    <button
                      onClick={() => handleGenerateQR(table)}
                      className="w-full bg-primary text-white py-2 rounded-xl font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
                    >
                      <QrCode size={18} />
                      Générer QR Code
                    </button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle table</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Numéro de table *
                </label>
                <input
                  type="number"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="Ex: 1, 2, 3..."
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Capacité
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Emplacement
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="indoor">Intérieur</option>
                  <option value="outdoor">Extérieur</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateTable}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                QR Code - Table {selectedTable.tableNumber}
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            <div className="text-center space-y-6">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                <QRCodeSVG
                  value={selectedTable.qrCodeUrl || `${window.location.origin}/table/${selectedTable.qrCode}`}
                  size={250}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Scannez ce code pour accéder au menu digital
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono break-all">
                  {selectedTable.qrCodeUrl || `${window.location.origin}/table/${selectedTable.qrCode}`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const url = selectedTable.qrCodeUrl || `${window.location.origin}/table/${selectedTable.qrCode}`
                    navigator.clipboard.writeText(url)
                    alert('URL copiée dans le presse-papier !')
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                >
                  Copier URL
                </button>
                <a
                  href={selectedTable.qrCodeUrl || `${window.location.origin}/table/${selectedTable.qrCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition text-center"
                >
                  Tester
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

