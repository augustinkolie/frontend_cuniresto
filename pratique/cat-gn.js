const productsGn = [
    {
        id:25,
        images:"../Spaghetti/sp1.jpg",
        price : 20000,
        nom:"Spaghetti 1",
        detail:"detail.html"
    },
    {
        id:26,
        images:"../Spaghetti/sp2.jpg",
        price : 70000,
        nom:"Spaghetti 2",
        detail:"detail.html"
    },  
    {
        id:27,
        images:"../Spaghetti/1760227424207.jpg",
        price : 20000,
        nom:"Spaghetti 3",
        detail:"detail.html"
    },
    {
        id:28,
        images:"../Spaghetti/1760227704218.jpg",
        price : 50000,
        nom:"Spaghetti 4",
        detail:"detail.html"
    },
    {
        id:29,
        images:"../Spaghetti/sp4.jpg",
        price : 63000,
        nom:"Spaghetti 5",
        detail:"detail.html"
    },
    {
        id:6,
        images:"../images/c (5).jpg",
        price : 280000,
        nom:"Spaghetti 6",
        detail:"detail.html"
    },
    {
        id:31,
        images:"../Spaghetti/sp5.jpg",
        price : 78900,
        nom:"Spaghetti 7",
        detail:"detail.html"
    },
    {
        id:32,
        images:"../Spaghetti/sp8.jpg",
        price : 89000,
        nom:"Spaghetti 8",
        detail:"detail.html"
    }
]


//let cart = JSON.parse(localStorage.getItem("cart")) ||[]
let cart = [];

try {
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    if (Array.isArray(storedCart)) {
        cart = storedCart;
    } else {
        localStorage.removeItem("cart"); // Nettoyage si ce n'est pas un tableau
    }
} catch (error) {
    localStorage.removeItem("cart"); // Nettoyage en cas de JSON invalide
}

//localStorage.removeItem("cart")

// Fonction pour affiche la liste de produits
function afficherListeProduits(filterText = "") {
    const container = document.getElementById("container-menu");
    container.innerHTML = ""; // On vide l'ancien contenu

    const filteredProducts = productsGn.filter(produit =>
        produit.nom.toLowerCase().includes(filterText.toLowerCase())
    );

    filteredProducts.forEach(produit => {
        const existingProduct = cart.find(item => item.id === produit.id);
        const card = document.createElement("div");
        card.className = "container-card";

        card.innerHTML = `
            <img src="${produit.images}" alt="${produit.nom}">
            <div class="descriptions">
                <h4 class="name">${produit.nom}</h4>
                <p>Prix : ${produit.price} GNF</p>
                <button class="add-to-cart ${existingProduct ? 'already-in-cart' : ''}" id="btn-${produit.id}" 
                    onclick="${existingProduct ? "window.location='panier.php'" : `ajouterProduitPanier(${produit.id})`}">
                    ${existingProduct ? "Déjà" : "Ajouter"}
                </button>
                <a href="detail-nou.php?id=${produit.id}"><button id="detail">Détail &#8594</button></a>
                
            </div>
        `;

        container.appendChild(card);
    });
}

afficherListeProduits()


// Fonction pour ajouter un produit dans le panier
function ajouterProduitPanier(productId){
    const product = productsGn.find(p=>p.id === productId)
    const existingProduct = cart.find(item=>item.id === productId)
    if(existingProduct){
        alert('Ce produit est déjà dans votre panier')
    }else{
        cart.push({...product,quantity:1})
        updateCart();
    }
    localStorage.setItem("cart",JSON.stringify(cart))

    // Changer le type de boutton
    const addToCartItemBtn = document.getElementById(`btn-${productId}`)
    addToCartItemBtn.classList.add("already-in-cart")
    addToCartItemBtn.innerText="Déjà";
    addToCartItemBtn.setAttribute("onclick",`window.location='panier.php'`)
} 

function updateCart(){
    const cartCount= document.getElementById("cart-count")
    cartCount.textContent = cart.length
}
updateCart();

