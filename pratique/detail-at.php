<?php
    require_once "./basedonnee.php";
    $id =$_GET["id"];
    $sql = "SELECT * FROM `atieke` WHERE `id` = :id";
    $requete = $PDO ->prepare($sql);
    $requete -> bindValue(":id",$id,PDO::PARAM_INT);
    $requete ->execute();
    $produit = $requete -> fetch();
    if(!$produit){
       header("Location: produits.php");
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="detail.css">
    <title>Details</title>
</head>
<body>
    <section class="detail" id="detail">
        <div class="produit-card">
                <img src="../Atiéké/<?= $produit["image"] ?>" alt="image-produit">
            <div class="description">
                <h4 class="price">Nom : <?= $produit["nom"] ?></h4>
                <h3 class="price">Prix : <?= $produit["price"] ?> GNF</h3>
                <p><?= $produit["description"] ?></p>
                <a href=""><button class="add-card" onclick="ajouterProduitPanier(produit.id)">Ajouter</button></a>
                <a href="commentaire.php">&#8594 Laissez votre avis</a>
            </div>
        </div>
    </section>
    <script src="produits.js"></script>
    <script src="detail.js"></script>
    <script src="cat-at.js"></script>
</body>
</html>