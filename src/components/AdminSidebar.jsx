import React from 'react';
import { 
  BarChart3, Video, BookOpen, Table as TableIcon, 
  Package, Users, Calendar, Mail, Award, 
  Truck, Building2, TrendingUp, Activity,
  ChevronLeft, ChevronRight, LayoutDashboard, LogOut,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const navSections = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: Activity },
      { id: 'performance', label: 'Performance', icon: BarChart3 },
    ]
  },
  {
    title: 'CONTENU',
    items: [
      { id: 'chefs', label: 'Chefs & Contenus', icon: ChefHat },
      { id: 'academy', label: 'Académie', icon: BookOpen },
      { id: 'live', label: 'Live Studio (Direct)', icon: Video },
    ]
  },
  {
    title: 'GESTION',
    items: [
      { id: 'products', label: 'Produits', icon: Package },
      { id: 'reservations', label: 'Réservations', icon: Calendar },
      { id: 'tables', label: 'Tables & QR', icon: TableIcon },
      { id: 'deliveries', label: 'Livraisons', icon: Truck },
      { id: 'companies', label: 'Entreprises', icon: Building2 },
    ]
  },
  {
    title: 'COMMUNAUTÉ',
    items: [
      { id: 'users', label: 'Utilisateurs', icon: Users },
      { id: 'comments', label: 'Commentaires', icon: Mail },
      { id: 'referrals', label: 'Parrainages', icon: Award },
    ]
  },
  {
    title: 'ANALYTIQUE',
    items: [
      { id: 'salesHistory', label: 'Historique & Rapports', icon: DollarSign },
    ]
  }
];

// Helper for ChefHat as it wasn't in the initial import list for the sidebar
import { ChefHat } from 'lucide-react';

export default function AdminSidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <div className={`
        ${isCollapsed 
          ? 'w-0 lg:w-20 -translate-x-full lg:translate-x-0 invisible lg:visible' 
          : 'w-64 translate-x-0 visible'
        } 
        h-screen bg-[#1a222c] text-gray-400 flex flex-col border-r border-gray-800 shrink-0 transition-all duration-300 ease-in-out 
        fixed lg:relative inset-y-0 left-0 z-[100] lg:z-0
      `}>
        {/* Logo Section */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
          <div className="shrink-0">
            <Logo className="w-10 h-10" color="#10b981" />
          </div>
          {(!isCollapsed || (isCollapsed && false)) && (
            <span className={`text-white font-bold text-xl tracking-tight transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              Cuni<span className="text-emerald-500">Resto</span>
            </span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`text-gray-500 hover:text-white transition-all duration-300 ${isCollapsed ? 'lg:absolute lg:-right-3 lg:bg-gray-800 lg:rounded-full lg:border lg:border-gray-700 lg:p-0.5' : 'ml-auto'}`}
          >
             {isCollapsed ? <ChevronRight size={16} className="hidden lg:block" /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">
          {navSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="text-[10px] font-bold text-gray-500 mb-4 px-4 tracking-[0.2em] uppercase whitespace-nowrap opacity-60">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      // On mobile, close sidebar after selection
                      if (window.innerWidth < 1024) setIsCollapsed(true);
                    }}
                    title={isCollapsed ? item.label : ''}
                    className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl transition-all group ${
                      activeTab === item.id
                        ? 'bg-gray-800/50 text-emerald-500 shadow-sm'
                        : 'hover:bg-gray-800/30 hover:text-gray-200'
                    }`}
                  >
                    <item.icon 
                      size={20} 
                      className={`${activeTab === item.id ? 'text-emerald-500' : 'text-gray-500 group-hover:text-gray-300'} shrink-0 transition-colors`} 
                    />
                    {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Back link */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => navigate('/')}
            className={`w-full flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-gray-500 group`}
            title={isCollapsed ? "Retour au site" : ''}
          >
            <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="font-medium whitespace-nowrap text-sm">Retour au site</span>}
          </button>
        </div>
      </div>
    </>
  );
}
