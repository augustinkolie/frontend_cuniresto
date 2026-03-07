document.addEventListener('DOMContentLoaded', function() {
    const modal = document.querySelector('.product-modal');
    const modalContent = modal.querySelector('.modal-content');
    const modalClose = modal.querySelector('.modal-close');
    const modalImage = modal.querySelector('.modal-image');
    const modalTitle = modal.querySelector('.modal-title');
    const modalPrice = modal.querySelector('.modal-price');
    const modalDescription = modal.querySelector('.modal-description');

    // Descriptions des produits (à personnaliser selon vos besoins)
    const productDescriptions = {
        'Spécial Salade': 'Une salade fraîche et croquante composée de légumes de saison, accompagnée d\'une vinaigrette maison aux herbes aromatiques.',
        'Frique de Plantin': 'Un délicieux plat traditionnel à base de plantains mûrs, préparé avec des épices locales et servi avec une sauce spéciale.',
        'Gâteau Delicieux': 'Un gâteau moelleux fait maison, avec des ingrédients de qualité supérieure et une touche de vanille naturelle.',
        'Poisson': 'Poisson frais du jour grillé à la perfection, servi avec des légumes de saison et une sauce citronnée.',
        'Riz au gras': 'Un riz savoureux cuit dans un bouillon épicé, accompagné de légumes et de viandes tendres.',
        'Poulet': 'Poulet fermier mariné dans nos épices secrètes et grillé jusqu\'à obtenir une peau croustillante.',
        'Gnouille': 'Une spécialité maison préparée avec soin, mêlant des saveurs traditionnelles et modernes.',
        'Humberguer': 'Un burger gourmand avec un steak haché maison, des légumes frais et notre sauce spéciale.'
    };

    // Ouvrir la modal quand on clique sur l'icône œil
    document.querySelectorAll('.fa-eye').forEach(eye => {
        eye.addEventListener('click', function(e) {
            e.preventDefault();
            const box = this.closest('.box');
            const title = box.querySelector('.text h3').textContent;
            const price = box.querySelector('.text h2').textContent;
            const image = box.querySelector('.imbox img').src;
            
            modalImage.src = image;
            modalImage.alt = title;
            modalTitle.textContent = title;
            modalPrice.textContent = price;
            modalDescription.textContent = productDescriptions[title] || 'Description non disponible';
            
            modal.classList.add('active');
            setTimeout(() => {
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }, 10);
        });
    });

    // Fermer la modal
    function closeModal() {
        modalContent.style.transform = 'scale(0.7)';
        modalContent.style.opacity = '0';
        setTimeout(() => {
            modal.classList.remove('active');
        }, 300);
    }

    modalClose.addEventListener('click', closeModal);

    // Fermer la modal en cliquant en dehors
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Fermer la modal avec la touche Echap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}); 