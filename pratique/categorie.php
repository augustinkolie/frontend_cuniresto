<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/assets/css/all.min.css">
    <link rel="stylesheet" href="pratique.css">
    <link rel="stylesheet" href="categorie.css">
    <title>Categorie</title>
</head>
<body>
    <nav>
        <h3><i class="fas fa-utensils" id="u-icon"></i>Resto</h3>
        <ul>
            <li><a href="pratique.php">Accueil</a></li>
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
    <h2>Catégories</h2>
    <div class="container-categorie">
        <div class="container-card">
            <img src="/Lapins braisés/lap1.jpg" alt="image generale">
            <div class="img-description">
                <h5>Lapin</h5>
                <a href="./cat-lap.php"><button>Explorer &#8594</button></a>
            </div>
        </div>
        <div class="container-card">
            <img src="/Atiéké/at1.jpg" alt="image generale">
            <div class="img-description">
                  <h5>Atiéké</h5>
                <a href="./cat-at.php"><button>Explorer &#8594</button></a>
            </div>
        </div>
        <div class="container-card">
            <img src="/Spaghetti/sp1.jpg" alt="image generale">
            <div class="img-description">
                  <h5>Nouille</h5>
                <a href="./cat-gn.php"><button>Explorer &#8594</button></a>
            </div>
        </div>
        <div class="container-card">
            <img src="/Sandwice/san1.jpg" alt="image genearale">
            <div class="img-description">
                   <h5>Sandwich</h5>
                <a href="./cat-san.php"><button>Explorer &#8594</button></a>
            </div>
        </div>
    </div>
    <?php require_once "./bases/footer.php" ?>
    <script src="hum.js"></script>
    <script src="/assets/js/search.js"></script>
</body>
</html>