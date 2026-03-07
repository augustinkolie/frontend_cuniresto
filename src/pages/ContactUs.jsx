import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ContactUs = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nous contacter</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Contactez-nous</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Pour toute question ou assistance, n'hésitez pas à nous contacter via les informations ci-dessous.</p>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Email</h3>
              <a href="mailto:augustinkolie54@gmail.com" className="text-primary dark:text-primary-400">augustinkolie54@gmail.com</a>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Téléphone</h3>
              <p className="text-gray-600 dark:text-gray-400">610 85 00 29</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactUs;
