let cart = JSON.parse(localStorage.getItem("cart")) || []
function updateCart(){
    const cartCount= document.getElementById("cart-count")
    cartCount.textContent = cart.length
}
updateCart();

// fonction pour afficher la liste des produit dans le panier 
function displayCart(){
    const cartItemsContainer = document.getElementById("cart-items")
    // Vider le conteneur avant d'afficher les éléments
    cartItemsContainer.innerHTML="";
    let total = 0;
    cart.forEach((item,index)=>{
        const cartItem = document.createElement("div");
        cartItem.classList.add("card-item");
        cartItem.innerHTML=`
             <div class="image">
                <img src="../${item.images}" style=" margin-bottom:10px" id="img">
            </div>
            <div class="quantity-controls">
                <h5 id="nameProPan">${item.nom}</h5>
                <p>Prix: ${item.price} GNF</p>
                <button onclick="updateQuantity(${item.id},-1)">-</button>
                <input type="text" value="${item.quantity}" readonly>
                <button onclick="updateQuantity(${item.id},1)">+</button>
            </div>
            
        <button onclick="removeItemFromCart(${item.id})" id="retirer"><i class="fas fa-trash" ></i></button>
        `
        cartItemsContainer.appendChild(cartItem)
        total +=item.price * item.quantity
    })
    document.getElementById("total-price").textContent=`Total : ${total.toFixed(2)} GNF`
}
displayCart()

// fonction pour changer la quantité de l'article

function updateQuantity(productId,change){
    const cartItem = cart.find(item => item.id === productId);
    if(cartItem){
        // modifier la quantité
        cartItem.quantity += change

        // si la quantité est inféreur à 0 , je retire l'article du panier
        if(cartItem.quantity <= 0){
            removeItemFromCart(cartItem.id)
        }else{
            localStorage.setItem("cart",JSON.stringify("cart"))
            displayCart()
        }
    }
}
// Fonction pour retire l'article du panier

function removeItemFromCart(productId){
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem("cart",JSON.stringify(cart));
    displayCart();
    updateCart();
}

contenairePanier = document.getElementById('cart-section');
contenairePanier.style.marginTop = '3rem'

