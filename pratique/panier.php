<?php
    session_start();
    if(!isset($_SESSION["user"])){
    header("Location: connexion.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="panier.css">
    <link rel="stylesheet" href="pratique.css">
    <link rel="stylesheet" href="../assets/css/all.min.css">
    <title>Panier</title>
</head>
<body>
    <nav>
        <h3><i class="fas fa-utensils" id="u-icon"></i>Resto</h3>
        <ul>
            <li><a href="pratique.php">Accueil</a></li>
            <li><a href="produits.php">Menu</a></li>
            <li class="dropdown">
                <a href="categorie.php" class="nav-categorie">Catégorie <i>&#8595</i></a>
                <ul class="dropdown-menu">
                    <li><a href="cat-lap.php">Lapin braisé</a></li>
                    <li><a href="cat-at.php">L'Atiéké</a></li>
                    <li><a href="cat-gn.php">Gnouilles</a></li>
                    <li><a href="cat-san.php">Sandwith</a></li>
                </ul>
            </li>
            <li><a href="reservation.php">Reservation</a></li>
        </ul>
        <div class="icon">
            <i class="fas fa-bars" id="menu-bars"></i>
            <?php if(!isset($_SESSION["user"])): ?>
                <a href="connexion.php"><i class="fas fa-user-circle"></i></a>
            <?php else: ?>
                <a href="deconnexion.php"><i class="fas fa-sign-out-alt"></i></a>
            <?php endif; ?>
            <a href="panier.php"><i class="fas fa-cart-plus"></i> (<span id="cart-count">0</span>)</a>
        </div>
    </nav>
    <main>
        <section class="cart-section" id="cart-section">
            <h2 id="title-cmd">Vos Commandes</h2>
            <div id="cart-items">

            </div>
            <p id="total-price"></p>
            <button class="checkout">Payer <i>&#8594</i></button>
        </section>
    </main>
    
    <script src="hum.js"></script>
    <script src="pratique.js"></script>
    <script src="panier.js"></script>
</body>
</html>