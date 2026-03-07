import React from 'react';
import { useNavigate } from 'react-router-dom';

const SignInButton = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        // Rediriger vers la page de login classique since social logic is being migrated
        navigate('/login');
    };

    return (
        <button
            onClick={handleClick}
            style={{
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#FF6B35', // Couleur Primaire
                color: 'white',
                border: 'none',
                borderRadius: '5px'
            }}
        >
            Se connecter
        </button>
    );
};

export default SignInButton;            
