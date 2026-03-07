const productsLap = [
    {
        id:1,
        images:"../Lapins braisés/lap1.jpg",
        price : 120000,
        nom:"Lapin 1",
        detail:"detail.html"
    },
    {
        id:10,
        images:"../Lapins braisés/lap2.jpg",
        price : 58000,
        nom:"Lapin 2",
        detail:"detail.html"
    },
    {
        id:11,
        images:"../Lapins braisés/lap3.jpg",
        price : 60000,
        nom:"Lapin 3",
        detail:"detail.html"
    },
    {
        id:12,
        images:"../Lapins braisés/lap4.jpg",
        price : 50000,
        nom:"Lapin 4",
        detail:"detail.html"
    },
    {
        id:7,
        images:"../Lapins braisés/lap5.jpg",
        price : 63000,
        nom:"Lapin 5",
        detail:"detail.html"
    },
    {
        id:14,
        images:"../Lapins braisés/lap6.jpg",
        price : 100000,
        nom:"Lapin 6",
        detail:"detail.html"
    },
    {
        id:15,
        images:"../Lapins braisés/lap7.jpg",
        price : 75000,
        nom:"Lapin 7",
        detail:"detail.html"
    },
    {
        id:16,
        images:"../Lapins braisés/lap8.jpg",
        price : 89000,
        nom:"Lapin 8",
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

    const filteredProducts = productsLap.filter(produit =>
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
                <a href="detail-lap.php?id=${produit.id}"><button id="detail">Détail &#8594</button></a>
                
            </div>
        `;

        container.appendChild(card);
    });
}

afficherListeProduits()

// Fonction pour ajouter un produit dans le panier
function ajouterProduitPanier(productId){
    const product = productsLap.find(p=>p.id === productId)
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

