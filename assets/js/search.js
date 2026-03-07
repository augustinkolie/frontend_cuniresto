document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('#search-form');
    const searchIcon = document.querySelector('#search-icon');
    const closeBtn = document.querySelector('#close');
    const searchBox = document.querySelector('#search-box');
    
    // Ouvrir la barre de recherche avec animation
    searchIcon.addEventListener('click', function() {
        searchForm.classList.add('active');
        setTimeout(() => {
            searchBox.focus();
        }, 300);
    });

    // Fermer la barre de recherche
    closeBtn.addEventListener('click', function() {
        searchForm.classList.remove('active');
        searchBox.value = '';
    });

    // Fermer la barre de recherche quand on clique en dehors
    document.addEventListener('click', function(e) {
        if (!searchForm.contains(e.target) && !searchIcon.contains(e.target)) {
            searchForm.classList.remove('active');
        }
    });

    // Gérer la recherche
    searchBox.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const menuItems = document.querySelectorAll('.container-card');
        
        menuItems.forEach(item => {
            const productName = item.querySelector('.descriptions h4').textContent.toLowerCase();
            if (productName.includes(searchTerm)) {
                item.style.display = '';
                // Animation d'apparition
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            }
            else {
                item.style.display = 'none';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
            }
        });
    });
}); 