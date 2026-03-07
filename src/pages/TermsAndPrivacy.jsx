import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsAndPrivacy = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Conditions et politique de confidentialité</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Conditions d'utilisation</h2>
            <p className="text-gray-600 dark:text-gray-400">En utilisant notre service, vous acceptez nos conditions d'utilisation. Le contenu fourni est à titre informatif uniquement.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Politique de confidentialité</h2>
            <p className="text-gray-600 dark:text-gray-400">Nous nous engageons à protéger votre vie privée. Vos données ne seront pas partagées avec des tiers sans votre consentement.</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsAndPrivacy;
