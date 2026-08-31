<?php

session_start();

if(!isset($_SESSION['last_regenerate'])){
    $_SESSION['last_regenerate'] = time();
    
}else{
    $interval = 1800;
    $current_time = time();
    if($current_time - $_SESSION['last_regenerate'] >= $interval){
        regenerateID();
    }
}

function regenerateID(){
    if(session_status() === PHP_SESSION_ACTIVE){
        $_SESSION['last_regenerate'] = time();
        session_regenerate_id(true);
    }
}