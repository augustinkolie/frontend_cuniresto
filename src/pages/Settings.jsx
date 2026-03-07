import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Lock, HelpCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getFullImageUrl } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const settingsOptions = [
    { icon: User, text: 'Compte', description: 'Confidentialité, sécurité, changer de numéro', path: '/profile' },
    { icon: Bell, text: 'Notifications', description: 'Messages, groupes, appels', path: '/settings/notifications' },
    { icon: Lock, text: 'Confidentialité', description: 'Bloquer des contacts, messages éphémères', path: '/settings/privacy' },
    { icon: HelpCircle, text: 'Aide', description: 'Centre d\'aide, nous contacter, politique de confidentialité', path: '/settings/help' },
  ];

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Paramètres</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div 
          className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition mb-6"
          onClick={() => navigate('/profile')}
        >
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl">
            {user?.profileImage ? (
              <img src={getFullImageUrl(user.profileImage)} alt={user.prenom} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{user?.prenom?.[0]}{user?.nom?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{user?.prenom} {user?.nom}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Statut</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg">
          {settingsOptions.map((option, index) => (
            <div 
              key={index} 
              className={`flex items-center space-x-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${index < settingsOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
              onClick={() => option.path !== '#' && navigate(option.path)}
            >
              <option.icon className="text-primary dark:text-primary-400" size={24} />
              <div>
                <p className="text-gray-900 dark:text-gray-100">{option.text}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            </div>
          ))}
           <div className="flex items-center justify-between p-4">
             <div className="flex items-center space-x-4">
                <div className="text-primary dark:text-primary-400"> 
                    {darkMode ? <Moon size={24}/> : <Sun size={24}/>}
                </div>
                <div>
                    <p className="text-gray-900 dark:text-gray-100">Thème</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{darkMode ? 'Sombre' : 'Clair'}</p>
                </div>
             </div>
            <button onClick={toggleDarkMode} className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white">
              Changer
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
