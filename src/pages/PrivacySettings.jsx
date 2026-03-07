import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX, X as XIcon } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PrivacySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const response = await api.getBlockedUsers();
      if (response.success) {
        setBlockedContacts(response.blockedUsers);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs bloqués:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  useEffect(() => {
    if (showUserList) {
      const loadUsers = async () => {
        try {
          const response = await api.getUsers();
          if (response.success) {
            const blockedIds = blockedContacts.map(c => c.id);
            setUsers(response.users.filter(u => u.id !== user.id && !blockedIds.includes(u.id)));
          }
        } catch (error) {
          console.error('Erreur chargement utilisateurs:', error);
        }
      };
      loadUsers();
    }
  }, [showUserList, user, blockedContacts]);

  const handleBlockUser = async (userId) => {
    try {
      await api.blockUser(userId);
      fetchBlockedUsers();
      setShowUserList(false);
    } catch (error) {
      console.error('Erreur blocage utilisateur:', error);
      alert('Impossible de bloquer l\'utilisateur.');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await api.unblockUser(userId);
      fetchBlockedUsers();
    } catch (error) {
      console.error('Erreur déblocage utilisateur:', error);
      alert('Impossible de débloquer l\'utilisateur.');
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Confidentialité</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Contacts bloqués</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Les contacts bloqués ne pourront plus vous appeler ni vous envoyer de messages.</p>
          {loading ? (
            <p>Chargement...</p>
          ) : blockedContacts.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="mx-auto text-gray-400 dark:text-gray-500" size={48} />
              <p className="mt-2 text-gray-600 dark:text-gray-400">Aucun contact bloqué</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <p className="text-gray-900 dark:text-gray-100">{contact.prenom} {contact.nom}</p>
                  <button onClick={() => handleUnblockUser(contact.id)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Débloquer</button>
                </div>
              ))}
            </div>
          )}
           <button onClick={() => setShowUserList(true)} className="w-full mt-4 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition">
            Ajouter un contact à bloquer
          </button>
        </div>
      </main>

      {showUserList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bloquer un contact</h3>
              <button onClick={() => setShowUserList(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <XIcon className="text-gray-800 dark:text-gray-200" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <p className="text-gray-900 dark:text-gray-100">{u.prenom} {u.nom}</p>
                  <button onClick={() => handleBlockUser(u.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Bloquer</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacySettings;
