<?php
session_start();
if(isset($_SESSION["user"])){
    header("Location: pratique.php");
    exit;
}
    require_once "./baseconnexion.php";

   if(!empty($_POST["submitinscri"])){
    if
    (
        isset($_POST["nominscri"],$_POST["prenominscri"],$_POST["emailinscri"],$_POST["passwordinscri"],$_POST["passwordinscriConfirm"]) && !empty($_POST["nominscri"]) && !empty($_POST["prenominscri"]) && !empty($_POST["emailinscri"]) && !empty($_POST["passwordinscri"]) && !empty($_POST["passwordinscriConfirm"])
    ){
        $_SESSION["erreur"] = [];
        $nom = strip_tags($_POST["nominscri"]);
        $prenom = strip_tags($_POST["prenominscri"]);
        if(!filter_var($_POST["emailinscri"],FILTER_VALIDATE_EMAIL)){
            $_SESSION["erreur"][]="Email invalide";
        }
        $mail = $_POST["emailinscri"];
        if($_POST["passwordinscri"] !== $_POST["passwordinscriConfirm"]){
            $_SESSION["erreur"][]="Les deux mots de passe ne concordent pas";
        }
        if(strlen($_POST["passwordinscri"]) <=7){
            $_SESSION["erreur"][]="Le mot de pass doit faire aumoins 8 caractères";
        }
        $sqlemail = "SELECT * FROM `users` WHERE `email` ='$mail'";
        $requetemail = $PDO -> query($sqlemail);
        if($requetemail -> rowCount() > 0){
            $_SESSION["erreur"][]="Email déja utilisé";
        }
        if($_SESSION["erreur"] === []){

        $password = password_hash($_POST["passwordinscri"],PASSWORD_ARGON2ID);


        $sql = "INSERT INTO `users`(`nom`,`prenom`,`email`,`password`) VALUES (:nom,:prenom,:email,'$password')";

        $requete = $PDO -> prepare($sql);
        $requete ->bindValue(":nom",$nom,PDO::PARAM_STR);
        $requete ->bindValue(":prenom",$prenom,PDO::PARAM_STR);
        $requete ->bindValue(":email",$_POST["emailinscri"],PDO::PARAM_STR);
        $requete ->execute();

        $id = $PDO -> lastInsertId();
        
        $_SESSION["user"]=
        [
            "id" => $id,
            "email" => $_POST["emailinscri"],
            "nom" => $nom,
            "prenom" => $prenom
         ];

        header("Location: pratique.php");
    }
    }else{
        $_SESSION["erreur"]=["Renseigner tous les champs"];
    }
}

//-----------------------------------------------------------------------------------------------------

    if(!empty($_POST["submitconnex"])){
    if(
        isset($_POST["emailconnex"],$_POST["passwordconnex"]) && !empty($_POST["emailconnex"]) && !empty($_POST["passwordconnex"])
    )
    {
        $_SESSION["error"] = [];
       if(!filter_var($_POST["emailconnex"],FILTER_VALIDATE_EMAIL)){
        $_SESSION["error"][]="Email et/ou mot de passe incorrect";
       }
       if($_SESSION["error"] === []){

     
        $sqls = "SELECT * FROM `users` WHERE `email`=:email";
        $requetes = $PDO -> prepare($sqls);
        $requetes -> bindValue(":email",$_POST["emailconnex"],PDO::PARAM_STR);
        $requetes -> execute();

        $user = $requetes -> fetch();
        if(!$user){
           $_SESSION["error"][]="Aucun utilisateur trouvé";
        }
            if(!password_verify($_POST["passwordconnex"],$user["password"])){
                $_SESSION["error"][]="Email et/ou mot de passe incorrect";
            }
            if($_SESSION["error"] === []){
            $_SESSION["user"]=
            [
                "id" => $user["id"],
                "email" => $user["email"],
                "nom" => $user["nom"],
                "prenom" => $user["prenom"]
            ];
            header("Location: pratique.php");
        }
        }
      }
    }
?>
