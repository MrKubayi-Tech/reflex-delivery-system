<?php

if($_SERVER['REQUEST_METHOD'] === 'POST'){
    
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'db.config.php';
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'model' . DIRECTORY_SEPARATOR . 'admin.model.php';
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'control' . DIRECTORY_SEPARATOR . 'input_sanitizer.control.php';

    
    $details = [
        'user_id' => $_POST['user_id'],
        'rider' => $_POST['rider']
    ];
    
    if(any_empty_fields($details,'user')){
        echo 'all inputs are required';
        die();
    }
    
    $database = new Database();
    $database->requestConnection();
    $pdo = $database->getConnection();
    
    user_request($pdo, $details);
    
}else{
    header('Refresh:1;url=home');
    die();
}


