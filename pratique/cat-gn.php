<?php
    session_start()
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="pratique.css">
    <link rel="stylesheet" href="../assets/css/all.min.css">
    <script src="../assets/js/search.js"></script>
    <title>Lapin braisé</title>
</head>
<body>
    <?php require_once "./bases/base_cat.php" ?>
    <section id="menu">
        <h2 id="title-menu">Qualités de Nouille</h2>
        <div class="flex-bas">&#8595</div>
        <a href="produits.php" style="text-decoration: none; font-style:italic;font-weight: 500;">&#8594 Afficher tout </a>
        <div class="container-menu" id="container-menu">
           <!-- ici les produits -->
        </div>
    </section>
    <?php require_once "./bases/footer.php" ?>
    <script src="pratique.js"></script>
    <script src="hum.js"></script>
    <script src="cat-gn.js"></script>
</body>
</html>