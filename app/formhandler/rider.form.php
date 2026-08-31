<?php

if($_SERVER['REQUEST_METHOD'] === 'POST'){
    
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'db.config.php';
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'model' . DIRECTORY_SEPARATOR . 'rider.model.php';
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'control' . DIRECTORY_SEPARATOR . 'input_sanitizer.control.php';

    

    
    $details = [
        'name' => $_POST['name'],
        'status' => $_POST['status']
    ];
    
    if(any_empty_fields($details,'user')){
        echo 'all inputs are required';
        die();
    }
    
    $database = new Database();
    $database->requestConnection();
    $pdo = $database->getConnection();
    
    rider_report($pdo, $details);
    
}else{
    header('Refresh:1;url=home');
    die();
}


