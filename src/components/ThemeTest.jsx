import React, { useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeTest() {
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    console.log('ThemeTest - Dark mode:', darkMode)
    console.log('ThemeTest - Document classes:', document.documentElement.className)
    
    // Test direct styling
    if (darkMode) {
      document.body.style.backgroundColor = '#111827'
      document.body.style.color = '#f9fafb'
    } else {
      document.body.style.backgroundColor = '#f8f9fa'
      document.body.style.color = '#333'
    }
  }, [darkMode])

  return (
    <div 
      className="fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg"
      style={{
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        color: darkMode ? '#f9fafb' : '#1f2937'
      }}
    >
      <p className="mb-2">
        Mode: {darkMode ? 'Sombre' : 'Clair'}
      </p>
      <p className="text-xs mb-2">
        Classes: {document.documentElement.className}
      </p>
      <button
        onClick={toggleDarkMode}
        className="px-4 py-2 rounded text-white"
        style={{
          backgroundColor: '#FF6B35'
        }}
      >
        Toggle Theme
      </button>
    </div>
  )
}
