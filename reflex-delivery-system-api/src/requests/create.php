<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();
$user = Auth::requireUser($pdo, ['retailer']);

$input = json_decode(file_get_contents('php://input'), true);

$customerName     = is_string($input['customer_name'] ?? null) ? trim($input['customer_name']) : null;
$customerPhone    = is_string($input['customer_phone'] ?? null) ? trim($input['customer_phone']) : null;
$customerAddress  = is_string($input['customer_address'] ?? null) ? trim($input['customer_address']) : null;
$itemDescription  = is_string($input['item_description'] ?? null) ? trim($input['item_description']) : null;
$weightKgRaw      = $input['weight_kg'] ?? null;
$priority         = $input['priority'] ?? 'standard';

$ALLOWED_PRIORITIES = ['standard', 'high'];
$PHONE_PATTERN = '/^\+?[0-9]{9,15}$/';

$errors = [];
if (!$customerName)    {$errors['customer_name'] = 'Customer name is required';}
if (!$customerPhone) {
    $errors['customer_phone'] = 'Customer phone is required';
} elseif (!preg_match($PHONE_PATTERN, str_replace([' ', '-'], '', $customerPhone))) {
    $errors['customer_phone'] = 'Enter a valid phone number, e.g. +254712345678';
}
if (!$customerAddress) {$errors['customer_address'] = 'Address is required';}
if (!$itemDescription) {$errors['item_description'] = 'Item description is required';}

$weightKg = null;
if ($weightKgRaw !== null && $weightKgRaw !== '') {
    if (!is_numeric($weightKgRaw) || (float)$weightKgRaw <= 0) {
        $errors['weight_kg'] = 'Weight must be a positive number';
    } else {
        $weightKg = (float)$weightKgRaw;
    }
}

if (!in_array($priority, $ALLOWED_PRIORITIES, true)) {
    $errors['priority'] = 'Priority must be standard or high';
}

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
