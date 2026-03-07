import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Charger le thème depuis localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    
    // Appliquer la classe au document
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      console.log('Dark mode activated')
    } else {
      document.documentElement.classList.remove('dark')
      console.log('Light mode activated')
    }
    
    console.log('Theme toggled to:', newDarkMode ? 'dark' : 'light')
    console.log('Document classes:', document.documentElement.className)
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
