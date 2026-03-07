 <nav>
        <h3><i class="fas fa-utensils" id="u-icon"></i>Resto</h3>
        <ul>
            
            <li><a href="produits.php">Menu</a></li>
            <li><a href="reservation.php">Reservation</a></li>
            <li class="dropdown">
                <a href="categorie.php" class="nav-categorie">Catégorie<i>&#8595</i></a>
                <ul class="dropdown-menu">
                    <li><a href="cat-lap.php">Lapins braisés</a></li>
                    <li><a href="cat-at.php">L'Atiéké</a></li>
                    <li><a href="cat-gn.php">Nouilles</a></li>
                    <li><a href="cat-san.php">Sandwichs</a></li>
                </ul>
            </li>
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