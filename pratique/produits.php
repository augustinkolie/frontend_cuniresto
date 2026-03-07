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
    <link rel="stylesheet" href="../assets/css/all.min.css">
    <link rel="stylesheet" href="pratique.css">
    <title>Tous les produits</title>
</head>
<body>
    <nav>
        <h3><i class="fas fa-utensils" id="u-icon"></i>Resto</h3>
        <ul>
            <li><a href="pratique.php">Accueil</a></li>
            <li class="dropdown">
                <a href="categorie.php" class="nav-categorie">Catégorie <i>&#8595</i></a>
                <ul class="dropdown-menu">
                    <li><a href="cat-lap.php">Lapins braisés</a></li>
                    <li><a href="cat-at.php">L'Atiéké</a></li>
                    <li><a href="cat-gn.php">Gnouilles</a></li>
                    <li><a href="cat-san.php">Sandwichs</a></li>
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
                <i class="fas fa-search" id="search-icon"></i>
                <a href="panier.php"><i class="fas fa-cart-plus"></i>(<span id="cart-count">0</span>)</a>
            </div>
    </nav>

    <form action="" id="search-form">
      <input type="search" placeholder="Rechercher votre produit..." name="" id="search-box">
      <label for="search-box" class="fas fa-search"></label>
      <i class="fas fa-times" id="close"></i>
    </form>

    <section id="menu">
        <h4 class="title-menu">Produits Disponibles</h4><br>
        <div class="container-menu" id="container-menu">
           
        </div>
    </section>
    
    <?php require_once "./bases/footer.php" ?>

     <script src="hum.js"></script>
    <script src="pratique.js"></script>
    <script src="produits.js"></script>
    <script src="../assets/js/search.js"></script>
</body>
</html>