import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, User, ChevronDown, LogOut, Settings, BellOff, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, getFullImageUrl } from '../utils/api';

const tabTitles = {
  dashboard: 'Tableau de bord',
  performance: 'Performance',
  chefs: 'Chefs & Contenus',
  academy: 'Académie',
  live: 'Live Studio',
  products: 'Gestion des Produits',
  reservations: 'Réservations',
  tables: 'Tables & QR',
  deliveries: 'Livraisons',
  companies: 'Entreprises',
  users: 'Utilisateurs',
  comments: 'Commentaires',
  referrals: 'Parrainages',
  analytics: 'Analytiques',
  info: 'Mes Informations',
  favorites: 'Mes Favoris',
  settings: 'Paramètres'
};

export default function AdminHeader({ activeTab, searchTerm, setSearchTerm, onMenuClick }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, title: 'Nouvelle réservation', time: 'Il y a 5 min', unread: true },
    { id: 2, title: 'Stock faible : Burger King', time: 'Il y a 15 min', unread: true },
    { id: 3, title: 'Nouvel utilisateur inscrit', time: 'Il y a 1h', unread: false },
  ];

  return (
    <header className="h-20 bg-white dark:bg-[#1a222c] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3 md:gap-8">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-500 hover:text-emerald-500 transition-colors"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
          {tabTitles[activeTab] || 'Administration'}
        </h2>
        
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm focus:ring-2 focus:ring-emerald-500 w-64 text-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 px-1 md:px-0">
        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-emerald-500 transition relative"
            >
              <Bell size={20} />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1a222c] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">Notifications</span>
                  <span className="text-xs text-emerald-500 cursor-pointer hover:underline">Tout marquer comme lu</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-none">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm ${n.unread ? "font-bold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                          {n.title}
                        </span>
                        {n.unread && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></div>}
                      </div>
                      <span className="text-xs text-gray-400">{n.time}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-center">
                  <span className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">Voir toutes les notifications</span>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleDarkMode}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition"
            title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800"></div>

        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 group"
          >
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase">
                {user?.prenom} {user?.nom}
              </div>
              <div className="text-xs text-gray-500">Administrateur</div>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-emerald-500/20 shadow-lg group-hover:border-emerald-500 transition-all">
                {user?.profileImage ? (
                  <img src={getFullImageUrl(user.profileImage)} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.prenom?.charAt(0) || 'A'
                )}
              </div>
            </div>
            <ChevronDown size={16} className={`text-gray-400 group-hover:text-emerald-500 transition-all ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a222c] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 sm:hidden">
                <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">{user?.prenom} {user?.nom}</div>
                <div className="text-xs text-gray-500">Administrateur</div>
              </div>
              <button 
                onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-emerald-500 transition-all"
              >
                <User size={16} />
                <span>Mon Profil</span>
              </button>
              <button 
                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-emerald-500 transition-all"
              >
                <Settings size={16} />
                <span>Paramètres</span>
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
