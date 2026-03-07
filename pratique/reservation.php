<?php
  session_start();
  if(!isset($_SESSION["user"])){
    header("Location: connexion.php");
    exit;
}
  require_once "./traitement.php";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../assets/css/all.min.css">
    <link rel="stylesheet" href="pratique.css">
    <title>Reservation</title>
</head>
<body>
    <nav>
        <h3><i class="fas fa-utensils" id="u-icon"></i>Resto</h3>
        <ul>
            <li><a href="pratique.php">Accueil</a></li>
            <li><a href="produits.php">Menu</a></li>
            <li class="dropdown">
                <a href="" class="nav-categorie">Catégorie <i>&#8595</i></a>
                <ul class="dropdown-menu">
                    <li><a href="cat-lap.php">Lapin braisé</a></li>
                    <li><a href="cat-at.php">L'Atiéké</a></li>
                    <li><a href="cat-gn.php">Gnouilles</a></li>
                    <li><a href="cat-san.php">Sandwith</a></li>
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
        </div>
    </nav>

    <!-- RESERVATION -->
        <form  method="POST" action="<?= strip_tags($_SERVER["PHP_SELF"]) ?>">
        <h4 class="title-reservation" id="titre-reserve">Reservez votre Commande</h4>
        <div class="form-contaire">
          <div class="partie12">
            <div class="info-perso">
                    <label for="name">Nom</label>
                    <input type="text" id="name" placeholder="Entrer votre nom" id="ipname" name="nom" value="<?= $nom ?>">
                    <p class="erreur"><?= $nomE ?></p>

                    <label for="email">Email</label>
                    <input type="text" id="email" placeholder="Entrer votre email" name="email" value="<?= $email ?>">
                    <p class="erreur"><?= $emailE ?></p>
                    <label for="number">Telephone</label>
                    <input type="text" id="number" placeholder="Entrer votre telephone" name="telephone" value="<?= $telephone ?>">
                    <p class="erreur"><?= $telephoneE ?></p>
                  
                    <label for="adresse">Adresse</label>
                    <textarea name="adresse" id="adresse" placeholder="Situez votre lieu d'habitation" rows="9" value="<?= $adresse ?>"></textarea>
                    <p class="erreur"><?= $adresseE ?></p>
            </div>
            <div class="info-plat">
                    <label for="nomN">Nom Nourriture</label>
                    <input type="text" id="nomN" placeholder="Entrer le nom de la nourriture" name="nomplat" value="<?= $nomplat ?>">
                    <p class="erreur"><?= $nomplatE ?></p>

                    <label for="quantite">Quantite</label>
                    <input type="number" id="quantite" placeholder="Combien de quantité ?" name="quantite" value="<?= $quantite ?>">
                    <p class="erreur"><?= $quantiteE ?></p>
                
                    <label for="dessert">Date Commande</label>
                    <input type="datetime-local" id="dessert" placeholder="Entrer la date de commande?" name="date" value="<?= $date ?>">
                    <p class="erreur"><?= $dateE ?></p>
                    <label for="avis">Preférence</label>
                    <textarea id="avis" placeholder="Comment voulez-vous que la nourriture soit ?" rows="9" name="adresseplat" value="<?= $adresseplat ?>"></textarea>
                    <p class="erreur"><?= $adresseplatE ?></p>
            </div>
          </div class="div-submit">
          <button type="submit" id="btn-submit">Commander</button>
          <p class="isSucces" style="display:<?php if($isSucces === true) echo 'block'; echo 'none';?>">Merci d'avoir commandé chez nous. Bonne journée :)</p>
        </div>
    </form>

  <!-- la partie footer de la page html -->

   <?php require_once "./bases/footer.php" ?>

    <script src="hum.js"></script>
    <script src="pratique.js"></script>
</body>
</html>