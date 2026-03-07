import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, FileText, Users } from 'lucide-react';

const HelpSettings = () => {
  const navigate = useNavigate();

  const helpOptions = [
    { icon: HelpCircle, text: 'Centre d\'aide', path: '/help-center' },
    { icon: Users, text: 'Nous contacter', path: '/contact-us' },
    { icon: FileText, text: 'Conditions et politique de confidentialité', path: '/terms-and-privacy' },
  ];

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="text-gray-800 dark:text-gray-200" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Aide</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg">
          {helpOptions.map((option, index) => (
            <div 
              key={index} 
              className={`flex items-center space-x-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${index < helpOptions.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
              onClick={() => option.path && navigate(option.path)}>
              <option.icon className="text-primary dark:text-primary-400" size={24} />
              <p className="text-gray-900 dark:text-gray-100">{option.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HelpSettings;
