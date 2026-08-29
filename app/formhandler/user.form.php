<?php


if($_SERVER['REQUEST_METHOD'] === 'POST'){
    
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'db.config.php';
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'model' . DIRECTORY_SEPARATOR . 'user.model.php';
    require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'control' . DIRECTORY_SEPARATOR . 'input_sanitizer.control.php';

    
    $details = [
        'name' => $_POST['name'],
        'phone' => $_POST['phone'],
        'address' => $_POST['address'],
        'delivery_info' => $_POST['delivery_info']
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


