import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const HelpCenter = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Centre d'aide</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Foire aux questions (FAQ)</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Comment puis-je passer une commande ?</h3>
              <p className="text-gray-600 dark:text-gray-400">Vous pouvez passer une commande en naviguant dans notre menu, en ajoutant des articles à votre panier, puis en procédant au paiement.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Quels sont les modes de paiement acceptés ?</h3>
              <p className="text-gray-600 dark:text-gray-400">Nous acceptons les paiements par carte de crédit, Orange Money, et le paiement à la livraison.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenter;
