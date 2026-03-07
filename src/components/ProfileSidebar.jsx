import React from 'react';
import { 
  User, ShoppingBag, Calendar, Heart, Settings, 
  ChevronLeft, ChevronRight, LayoutDashboard, LogOut,
  FileText, Activity, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navSections = [
  {
    title: 'MENU',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'info', label: 'Mes Informations', icon: FileText },
    ]
  },
  {
    title: 'ACTIVITÉ',
    items: [
      { id: 'orders', label: 'Mes Commandes', icon: ShoppingBag },
      { id: 'reservations', label: 'Réservations', icon: Calendar },
      { id: 'favorites', label: 'Mes Favoris', icon: Heart },
    ]
  },
  {
    title: 'PRÉFÉRENCES',
    items: [
      { id: 'settings', label: 'Paramètres', icon: Settings },
    ]
  }
];

export default function ProfileSidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Overlay - Only visible when menu is open on mobile */}
      {!isCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div className={`
        ${isCollapsed 
          ? 'w-0 lg:w-20 -translate-x-full lg:translate-x-0 invisible lg:visible' 
          : 'w-64 translate-x-0 visible'
        } 
        h-screen bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-400 flex flex-col border-r border-gray-200 dark:border-gray-800 shrink-0 transition-all duration-300 ease-in-out 
        fixed lg:relative inset-y-0 left-0 z-[100] lg:z-0
      `}>
        {/* Logo Section */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold text-xl uppercase">C</span>
          </div>
          {(!isCollapsed || (isCollapsed && false)) && (
            <span className={`text-gray-900 dark:text-white font-bold text-xl tracking-tight transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              Mon Profil
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`text-gray-400 hover:text-emerald-500 transition-all duration-300 ${isCollapsed ? 'lg:absolute lg:-right-3 lg:bg-white lg:dark:bg-gray-800 lg:rounded-full lg:border lg:border-gray-200 lg:dark:border-gray-700 lg:p-0.5' : 'ml-auto'}`}
          >
             {isCollapsed ? <ChevronRight size={16} className="hidden lg:block" /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">
          {navSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="text-[10px] font-bold text-gray-400 mb-4 px-4 tracking-[0.2em] uppercase whitespace-nowrap opacity-60">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      // On mobile, close sidebar after click
                      if (window.innerWidth < 1024) setIsCollapsed(true);
                    }}
                    title={isCollapsed ? item.label : ''}
                    className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all group ${
                      activeTab === item.id
                        ? 'bg-emerald-500/10 text-emerald-500 shadow-sm'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <item.icon 
                      size={20} 
                      className={`${activeTab === item.id ? 'text-emerald-500' : 'text-gray-400 group-hover:text-emerald-500'} shrink-0 transition-colors`} 
                    />
                    {!isCollapsed && <span className="font-semibold whitespace-nowrap text-sm">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Back link */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800/60 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => navigate('/')}
            className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3 px-4'} py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all text-gray-500 group`}
            title={isCollapsed ? "Retour au site" : ''}
          >
            <Home size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="font-semibold whitespace-nowrap text-sm">Retour au site</span>}
          </button>
        </div>
      </div>
    </>
  );
}
