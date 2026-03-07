<?php
    $DNS ="mysql:host=localhost;dbname=pratique";
    $DB_USER = "AUGUST";
    $DB_PASSWORD ="WEYA-SUD";

    try {
        $option = [
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8",
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ];

        $PDO = new PDO($DNS,$DB_USER,$DB_PASSWORD,$option);
    } catch (PDOException $e) {
        echo "ERREUR".$e->getMessage();
    }
?>