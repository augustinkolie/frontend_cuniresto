import React from 'react';

const Logo = ({ className = "w-12 h-12", color = "#10b981" }) => (
  <svg 
    viewBox="0 0 120 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Forme de coeur en arrière-plan (lignes fines) */}
    <path 
      d="M60 45C55 35 40 30 30 45C22 57 35 75 60 95C85 75 98 57 90 45C80 30 65 35 60 45Z" 
      stroke="#94a3b8" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      opacity="0.4"
    />
    
    {/* Fourchette (Verte - Gauche) */}
    <g transform="rotate(-20 60 70)">
      {/* Manche */}
      <path 
        d="M50 30V85C50 95 65 105 50 110" 
        stroke={color} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none"
      />
      {/* Tête de la fourchette */}
      <path 
        d="M42 35C42 30 58 30 58 35V45H42V35Z" 
        fill={color} 
        fillOpacity="0.1" 
      />
      <path d="M42 45C42 45 42 45 42 45C42 38 42 32 42 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M47 45C47 45 47 45 47 45C47 38 47 32 47 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M53 45C53 45 53 45 53 45C53 38 53 32 53 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M58 45C58 45 58 45 58 45C58 38 58 32 58 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 45Q42 52 50 52Q58 52 58 45" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Cuillère (Argent/Gris - Droite) */}
    <g transform="rotate(20 60 70)">
      {/* Manche */}
      <path 
        d="M70 45V85C70 95 55 105 70 110" 
        stroke="#94a3b8" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none"
      />
      {/* Tête de la cuillère */}
      <ellipse 
        cx="70" cy="35" rx="10" ry="14" 
        stroke="#94a3b8" 
        strokeWidth="2.5" 
        fill="#94a3b8" 
        fillOpacity="0.1" 
      />
    </g>

    {/* Accent émeraude au centre du "C" / croisement */}
    <circle cx="60" cy="75" r="3.5" fill={color} />
  </svg>
);

export default Logo;
