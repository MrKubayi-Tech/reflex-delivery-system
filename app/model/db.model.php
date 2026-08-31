<?php
declare(strict_types=1);


//user
function add_user_request(object $pdo, array $details){
    $query = 'INSERT INTO users (name,phone,address,delivery_info,status) VALUES(:name,:phone,:address,:delivery_info,:status);';
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'name' => $details['name'],
        'phone' => $details['phone'],
        'address' => $details['address'],
        'delivery_info' => $details['delivery_info'],
        'status' => 'pending'
    ]);
    $stmt = null;
}

//admin
function log_user(object $pdo, array $details){
    $query = 'UPDATE users SET driver=:driver, status=:status WHERE user_id=:user_id;';
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'rider' => $details['rider'],
        'status' => 'sent driver'
    ]);
    $stmt = null;
}

//rider
function driver_report(object $pdo, array $details){
    $query = 'UPDATE users SET status=:status WHERE user_id=:user_id;';
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        'status' => $details['status']
    ]);
    $stmt = null;
}