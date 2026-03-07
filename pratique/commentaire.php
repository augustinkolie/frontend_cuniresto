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
    <link rel="stylesheet" href="commentaire.css">
    <title>commantaire</title>
</head>
<body>
    <h2 class="title-commentaire">Avis de nos clients</h2>
    <div class="contenu">
        <div class="profile">
            <h4><strong>Nom</strong> : Augustin KOLIE</h4>
            <p><strong>Email</strong> : augustinkolie54@gmail.com</p>
        </div>
        <p class="contenu-savoir">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Fugiat, deserunt laborum, illum placeat, sit repudiandae facere suscipit quod veniam dicta quasi beatae magnam exercitationem! Pariatur et repudiandae commodi laboriosam sequi.</p>
    </div>
    <div class="contenu">
        <div class="profile">
            <h4>Nom : </h4>
            <p>Email : </p>
        </div>
        <p class="contenu-savoir">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Fugiat, deserunt laborum, illum placeat, sit repudiandae facere suscipit quod veniam dicta quasi beatae magnam exercitationem! Pariatur et repudiandae commodi laboriosam sequi.</p>
    </div>
    <div class="contenu">
        <div class="profile">
            <h4>Nom : </h4>
            <p>Email : </p>
        </div>
        <p class="contenu-savoir">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Fugiat, deserunt laborum, illum placeat, sit repudiandae facere suscipit quod veniam dicta quasi beatae magnam exercitationem! Pariatur et repudiandae commodi laboriosam sequi.</p>
    </div>
    
    <div class="commentaire">
        <form  method="get">
            <textarea name="" id="" placeholder="Laissez votre avis ici"></textarea>
            <button type="submit">Envoyer</button>
        </form>
    </div>
</body>
</html>