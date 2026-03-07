import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination component
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when a page is clicked
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-12 mb-8 animate-fade-in">
      {/* Précédent Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all duration-300 flex items-center gap-1.5 ${
          currentPage === 1
            ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-white/50'
            : 'text-gray-500 border-gray-100 bg-white hover:border-primary/30 hover:text-primary hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:border-primary/50'
        }`}
      >
        <ChevronLeft size={20} />
        <span className="hidden sm:inline">Précédent</span>
      </button>

      {/* Page Numbers */}
      <div className="flex gap-2">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`w-12 h-12 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center transform ${
              currentPage === number
                ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110 z-10'
                : 'text-gray-600 bg-white hover:bg-white border-2 border-transparent hover:border-primary/20 hover:text-primary hover:shadow-md dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {number}
          </button>
        ))}
      </div>

      {/* Suivant Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2.5 rounded-xl border-2 font-medium transition-all duration-300 flex items-center gap-1.5 ${
          currentPage === totalPages
            ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-white/50'
            : 'text-gray-500 border-gray-100 bg-white hover:border-primary/30 hover:text-primary hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:border-primary/50'
        }`}
      >
        <span className="hidden sm:inline">Suivant</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Pagination;
