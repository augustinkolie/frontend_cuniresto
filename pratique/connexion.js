document.getElementById("switch-to-register").addEventListener('click',(event)=>{
    event.preventDefault()
    document.querySelector(".wrapper").classList.add("hidden");
})
document.getElementById("switch-to-login").addEventListener('click',(event)=>{
    event.preventDefault()
    document.querySelector(".wrapper").classList.remove("hidden");
})


const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async (e) => {
    // e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    /* try {
        const response = await login(email, password);
        if (response.success) {
            // Rediriger vers la page précédente ou l'accueil
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');
            window.location.href = redirect ? `${redirect}.html` : 'index.html';
        }
    } catch (error) {
        showError(loginForm, error.message);
    }  */
});

// Gestion du formulaire d'inscription
const registerForm = document.getElementById('register-form');
registerForm.addEventListener('submit', async (e) => {
    // e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
        showError(registerForm, 'Les mots de passe ne correspondent pas');
        return;
    }
    
    try {
        // Ici, vous devriez implémenter la vraie logique d'inscription
        // Pour l'exemple, nous simulons une inscription réussie
        localStorage.setItem('user', JSON.stringify({ name, email }));
        
        // Rediriger vers la page précédente ou l'accueil
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        window.location.href = redirect ? `${redirect}.html` : 'index.html';
    } catch (error) {
        showError(registerForm, error.message);
    }
});

// Fonction pour afficher les messages d'erreur
function showError(form, message) {
    // Supprimer les messages d'erreur existants
    const existingError = form.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Créer et afficher le nouveau message d'erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show';
    errorDiv.textContent = message;
    form.insertBefore(errorDiv, form.querySelector('button'));
    
    // Supprimer le message après 3 secondes
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Vérifier si l'utilisateur est déjà connecté
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        // Rediriger vers la page précédente ou l'accueil
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        window.location.href = redirect ? `${redirect}.html` : 'index.html';
    }
}); 
