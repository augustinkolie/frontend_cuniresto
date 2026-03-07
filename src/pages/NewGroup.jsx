import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { api, getFullImageUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const NewGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.getUsers();
        if (response.success) {
          // Exclude the current user from the list
          setUsers(response.users.filter(u => u.id !== user.id));
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      }
    };
    loadUsers();
  }, [user]);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 1) {
      alert('Veuillez sélectionner au moins un participant.');
      return;
    }
    if (!groupName.trim()) {
      alert('Veuillez donner un nom au groupe.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.createGroupConversation(groupName, selectedUsers);
      if (response.success) {
        navigate('/messages');
      } else {
        alert(response.message || 'Erreur lors de la création du groupe.');
      }
    } catch (error) {
      console.error('Erreur création groupe:', error);
      alert('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    `${u.prenom} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="text-gray-800 dark:text-gray-200" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nouveau groupe</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUsers.length} participants sélectionnés</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nom du groupe (obligatoire)"
            className="w-full p-2 border-b-2 border-primary focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher des participants..."
            className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 focus:outline-none text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map(u => (
            <div 
              key={u.id} 
              className="flex items-center space-x-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition border-b border-gray-200 dark:border-gray-700"
              onClick={() => handleUserSelect(u.id)}
            >
              <div className="relative w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {u.profileImage ? (
                  <img src={getFullImageUrl(u.profileImage)} alt={u.prenom} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span>{u.prenom?.[0]}{u.nom?.[0]}</span>
                )}
                {selectedUsers.includes(u.id) && (
                  <div className='absolute bottom-0 right-0 bg-green-500 rounded-full p-0.5'>
                    <Check size={12} className='text-white' />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{u.prenom} {u.nom}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleCreateGroup}
            disabled={loading || selectedUsers.length === 0 || !groupName.trim()}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Création...' : 'Créer le groupe'}
          </button>
        </footer>
      </main>
    </div>
  );
};

export default NewGroup;
