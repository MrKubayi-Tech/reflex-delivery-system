<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__
    . DIRECTORY_SEPARATOR . '..'
    . DIRECTORY_SEPARATOR . 'classes'
    . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__
    . DIRECTORY_SEPARATOR . '..'
    . DIRECTORY_SEPARATOR . 'classes'
    . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();

$input = json_decode(file_get_contents('php://input'), true);

$role                 = $input['role'] ?? null;
$fullName             = $input['full_name'] ?? null;
$phoneNumber          = $input['phone_number'] ?? null;
$password             = $input['password'] ?? null;
$passwordConfirmation = $input['password_confirmation'] ?? null;
$businessName         = $input['business_name'] ?? null;
$businessAddress      = $input['business_address'] ?? null;
$vehicleType          = $input['vehicle_type'] ?? null;

$ALLOWED_ROLES = ['retailer', 'dispatcher', 'rider'];

$errors = [];
if (!$role || !in_array($role, $ALLOWED_ROLES, true)) {
    $errors['role'] = 'A valid role is required';
}
if (!$fullName)    {$errors['full_name'] = 'Full name is required';}
if (!$phoneNumber) {$errors['phone_number'] = 'Phone number is required';}
if (!$password)    {$errors['password'] = 'Password is required';}
if ($password && $password !== $passwordConfirmation) {
    $errors['password_confirmation'] = 'Passwords do not match';
}
if ($role === 'retailer') {
    if (!$businessName)    {$errors['business_name'] = 'Business name is required for retailers';}
    if (!$businessAddress) {$errors['business_address'] = 'Business address is required for retailers';}
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => $errors]]);
    exit();
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE phone = ? LIMIT 1');
$stmt->execute([$phoneNumber]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => ['code' => 'conflict', 'message' => 'Phone number already registered']]);
    exit();
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    'INSERT INTO users (phone, name, password_hash, role, business_name, business_address, vehicle_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $phoneNumber,
    $fullName,
    $passwordHash,
    $role,
    $role === 'retailer' ? $businessName : null,
    $role === 'retailer' ? $businessAddress : null,
    $role === 'rider' ? $vehicleType : null,
]);

$userId = (int)$pdo->lastInsertId();
$token = Auth::issueToken($pdo, $userId);

echo json_encode([
    'data' => [
        'token' => $token,
        'user' => [
            'id' => $userId,
            'name' => $fullName,
            'role' => $role,
            'retailer_id' => $role === 'retailer' ? $userId : null,
        ],
    ],
]);
