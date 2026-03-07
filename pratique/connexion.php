<?php require_once "./connexion-tra.php" ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="connexion.css">
    <link rel="stylesheet" href="../assets/css/all.min.css">

</head>
<body>
    <!-- <nav>
        <h3><i class="fas fa-utensils"></i> Resto</h3>
        <ul>
            <li><a href="pratique.php"><i class="fas fa-home"></i></a></li>
        </ul>
    </nav> -->

        <div class="container">
            <div class="wrapper">
                <section class="login">
                    <h1>Connexion</h1>
                    <form id="login-form" method="POST">
                         <?php 
                            if($_SESSION["error"]){
                                foreach($_SESSION["error"] as $error)
                                    ?>
                                    <p><?= $error ?></p>
                                    <?php
                                    unset($_SESSION["error"]);
                            }
                        ?>
                        <div class="inputbox" >
                            <i class="fas fa-envelope" id="form-group"></i>
                            <input type="text" id="login-email" name="emailconnex">
                            <label for="login-email">Email</label>
                        </div>
                        <div class="inputbox" id="login-password">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="login-password" name="passwordconnex">
                            <label for="login-password">Mot de passe</label>
                        </div>
                        <!-- <div class="forgot">
                            <input type="checkbox">
                            <a href="">Mot de passe oublié?</a>
                        </div> -->
                        <button type="submit" value="Connexion" name="submitconnex">Se connecter</button>
                        <div class="register-option">
                            <span>Pas de compte ?</span>
                            <a href="" id="switch-to-register">Inscrivez-vous</a>
                        </div>
                    </form>
                </section>

                <section class="register">
                    <h1>Inscription</h1>
                    <form  id="register-form" method="POST">
                        <?php 
                            if($_SESSION["erreur"]){
                                foreach($_SESSION["erreur"] as $message)
                                    ?>
                                    <p><?= $message ?></p>
                                    <?php
                                    unset($_SESSION["erreur"]);
                            }
                        ?>
                        <div class="inputbox">
                            <i class="fas fa-user"></i>
                            <input type="text" id="register-name" name="nominscri">
                            <label for="register-name">Nom</label>
                        </div>
                        <div class="inputbox">
                            <i class="fas fa-user"></i>
                            <input type="text" name="prenominscri" id="register-name">
                            <label for="register-name">Prenom</label>
                        </div>
                        <div class="inputbox">
                            <i class="fas fa-envelope"></i>
                            <input type="text" id="register-email" name="emailinscri">
                            <label for="register-email">Email</label>
                        </div>
                        <div class="inputbox">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="register-password" name="passwordinscri">
                            <label for="register-email">Mot de passe</label>
                        </div>
                        <div class="inputbox">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="register-confirm-pasword" name="passwordinscriConfirm">
                            <label for="register-confirm-password">Confirmer le mot de passe</label>
                        </div>
                        <button type="submit" value="Inscription" name="submitinscri">S'inscrire</button>
                        <div class="register-option">
                            <span>Dejà un compte ?</span>
                            <a href="" id="switch-to-login">Connectez-vous</a>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    <script src="connexion.js"></script>
</body>
</html>
