<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();
$user = Auth::requireUser($pdo, ['retailer']);

$input = json_decode(file_get_contents('php://input'), true);

$customerName     = $input['customer_name'] ?? null;
$customerPhone    = $input['customer_phone'] ?? null;
$customerAddress  = $input['customer_address'] ?? null;
$itemDescription  = $input['item_description'] ?? null;
$weightKg         = $input['weight_kg'] ?? null;
$priority         = $input['priority'] ?? 'standard';

$errors = [];
if (!$customerName)    {$errors['customer_name'] = 'Customer name is required';}
if (!$customerPhone)   {$errors['customer_phone'] = 'Customer phone is required';}
if (!$customerAddress) {$errors['customer_address'] = 'Address is required';}
if (!$itemDescription) {$errors['item_description'] = 'Item description is required';}

if ($errors) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => $errors]]);
    exit();
}

$trackingCode = strtoupper(bin2hex(random_bytes(4)));

$stmt = $pdo->prepare(
    'INSERT INTO delivery_requests
        (retailer_id, created_by, customer_name, customer_phone, customer_address,
         item_description, tracking_code, current_status, weight_kg, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $user['id'], $user['id'], $customerName, $customerPhone, $customerAddress,
    $itemDescription, $trackingCode, 'pending', $weightKg, $priority,
]);

$id = (int)$pdo->lastInsertId();

echo json_encode(['data' => ['id' => $id, 'tracking_code' => $trackingCode]]);
