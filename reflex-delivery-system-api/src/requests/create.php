<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ 
    . DIRECTORY_SEPARATOR . '..' 
    . DIRECTORY_SEPARATOR . 'classes' 
    . DIRECTORY_SEPARATOR . 'Database.php';

$db = new Database();
$pdo = $db->get_connection();

$input = json_decode(file_get_contents('php://input'), true);

$customer_name   = $input['customer_name']   ?? null;
$customer_phone  = $input['customer_phone']  ?? null;
$address         = $input['address']         ?? null;
$item_description= $input['item_description']?? null;

$errors = [];
if (!$customer_name)   {$errors['customer_name']   = 'Customer name is required';}
if (!$customer_phone)  {$errors['customer_phone']  = 'Customer phone is required';}
if (!$address)         {$errors['address']         = 'Address is required';}
if (!$item_description){$errors['item_description']= 'Item description is required';}

if ($errors) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => $errors]]);
    exit();
}

$tracking_code = bin2hex(random_bytes(8));

$stmt = $pdo->prepare('INSERT INTO deliveries (customer_name, customer_phone, address, item_description, tracking_code, status) VALUES (?, ?, ?, ?, ?, ?)');
$stmt->execute([$customer_name, $customer_phone, $address, $item_description, $tracking_code, 'pending']);

$id = (int)$pdo->lastInsertId();

echo json_encode([
    'data' => [
        'id' => $id,
        'tracking_code' => $tracking_code,
        'status' => 'pending'
    ]
]);
