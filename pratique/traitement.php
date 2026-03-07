<?php

  $nom=$telephone=$email=$adresse=$nomplat=$quantite=$date=$adresseplat="";
  $nomE=$telephoneE=$emailE=$adresseE=$nomplatE=$quantiteE=$dateE=$adresseplatE="";
  $isSucces = false;

  if($_SERVER["REQUEST_METHOD"] === "POST"){
    $nom = secureInput($_POST["nom"]);
    $email = secureInput($_POST["email"]);
    $telephone = secureInput($_POST["telephone"]);
    $adresse = secureInput($_POST["adresse"]);
    $nomplat = secureInput($_POST["nomplat"]);
    $quantite = secureInput($_POST["quantite"]);
    $date = secureInput($_POST["date"]);
    $adresseplat = secureInput($_POST["adresseplat"]);
    $isSucces =true;

     if(empty($nom)){
      $nomE = "Entrer votre nom stp...";
      $isSucces=false;
     }

    if(empty($adresse)){
      $adresseE = "Decrire votre lieu d'habitation";
      $isSucces=false;
    }

    if(empty($nomplat)){
      $nomplatE = "Quel plat voulez-vous ?";
      $isSucces=false;
    }

    if(empty($quantite)){
      $quantiteE = "Préciser la quantité que vous voulez";
      $isSucces=false;
    }

    if(empty($date)){
      $dateE ="Nous voulons la date de commande";
      $isSucces=false;
    }

    if(empty($adresseplat)){
      $adresseplatE = "Comment voulez-vous que les plats soient ?";
      $isSucces =false;
    }
    if(!isEmail($email)){
      $emailE = "Votre email est important pour la suite de la communication";
      $isSucces=false;
    }
    if(!isPhone($telephone)){
      $telephoneE = "Que des chiffres et des espaces stp...";
      $isSucces=false;
    }

    if($isSucces){

      require_once "./basedonnee.php";

      $sql = "INSERT INTO `commandes`(`nom`,`email`,`telephone`,`adresse`,`nomplat`,`quantite`,`date`,`adresseplat`) VALUES (:nom,:email,:telephone,:adresse,:nomplat,:quantite,:dateplat,:adresseplat)";

      $requete = $PDO -> prepare($sql);
      $requete->bindValue(":nom",$nom,PDO::PARAM_STR);
      $requete->bindValue(":email",$email,PDO::PARAM_STR);
      $requete->bindValue(":telephone",$telephone,PDO::PARAM_STR);
      $requete->bindValue(":adresse",$adresse,PDO::PARAM_STR);
      $requete->bindValue(":nomplat",$nomplat,PDO::PARAM_STR);
      $requete->bindValue(":quantite",$quantite,PDO::PARAM_INT);
      $requete->bindValue(":dateplat",$date,PDO::PARAM_STR);
      $requete->bindValue(":adresseplat",$adresseplat,PDO::PARAM_STR);

      $requete -> execute();
      
      $nom=$telephone=$email=$adresse=$nomplat=$quantite=$date=$adresseplat="";
    }
  }


  function isPhone($var){
    return preg_match("/^[0-9 ]*$/",$var);
  }

  function isEmail($var){
    return filter_var($var,FILTER_VALIDATE_EMAIL);
  }
  
  function secureInput($var){
    $var = trim($var);
    $var = stripslashes($var);
    $var = htmlspecialchars($var);
    $var = strip_tags($var);
    return $var;
  }
?>