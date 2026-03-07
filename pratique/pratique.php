<?php
    session_start()
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../assets/css/all.min.css">
    <link rel="stylesheet" href="pratique.css">
    <title>site restaurant</title>
</head>
<body>
  
  <?php require_once "./bases/liens.php" ?>

  <?php require_once "./bases/baniere.php" ?>

  <?php require_once "./bases/carrossel.php" ?> 

  <!-- la partie quelques produits -->

    <section id="menu">
        <h2 id="title-menu">Echantillons Des Plats</h2>
        <div class="flex-bas">&#8595</div>
        <div class="container-menu" id="container-menu">
           <!-- ici les produits -->
        </div>
        <div id="ancre-plus">
          <a id="voir-plus" href="produits.php">Voir Plus &#8594</a>
        </div>
    </section>
  

  <?php
     require_once "./fonction/compteur.php";
     ajouter_vue();
     $vue = nombre_vue()
  ?>
 
  <?php require_once "./bases/experts.php" ?>

  <?php require_once "./bases/footer.php" ?>

    <script src="detail.js"></script>
    <script src="hum.js"></script>
    <script src="pratique.js"></script>
    <script src="pratique-ajout.js"></script>
</body>
</html>