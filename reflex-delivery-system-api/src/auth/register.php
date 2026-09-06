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
$fullName             = is_string($input['full_name'] ?? null) ? trim($input['full_name']) : null;
$phoneNumber          = is_string($input['phone_number'] ?? null) ? trim($input['phone_number']) : null;
$password             = $input['password'] ?? null;
$passwordConfirmation = $input['password_confirmation'] ?? null;
$businessName         = is_string($input['business_name'] ?? null) ? trim($input['business_name']) : null;
$businessAddress      = is_string($input['business_address'] ?? null) ? trim($input['business_address']) : null;
$vehicleType          = $input['vehicle_type'] ?? null;

$ALLOWED_ROLES = ['retailer', 'dispatcher', 'rider'];
$ALLOWED_VEHICLE_TYPES = ['motorbike', 'light_truck', 'heavy_van'];
// Mirrors src/lib/validation.ts's PHONE_PATTERN on the frontend — kept in
// sync deliberately, since the server is the actual source of truth and
// the client check is only a UX shortcut in front of this one.
$PHONE_PATTERN = '/^\+?[0-9]{9,15}$/';

$errors = [];
if (!$role || !in_array($role, $ALLOWED_ROLES, true)) {
    $errors['role'] = 'A valid role is required';
}
if (!$fullName)    {$errors['full_name'] = 'Full name is required';}
if (!$phoneNumber) {
    $errors['phone_number'] = 'Phone number is required';
} elseif (!preg_match($PHONE_PATTERN, str_replace([' ', '-'], '', $phoneNumber))) {
    $errors['phone_number'] = 'Enter a valid phone number, e.g. +254712345678';
}
if (!$password) {
    $errors['password'] = 'Password is required';
} elseif (strlen($password) < 8) {
    $errors['password'] = 'Password must be at least 8 characters';
}
if ($password && $password !== $passwordConfirmation) {
    $errors['password_confirmation'] = 'Passwords do not match';
}
if ($role === 'retailer') {
    if (!$businessName)    {$errors['business_name'] = 'Business name is required for retailers';}
    if (!$businessAddress) {$errors['business_address'] = 'Business address is required for retailers';}
}
if ($role === 'rider' && $vehicleType !== null && !in_array($vehicleType, $ALLOWED_VEHICLE_TYPES, true)) {
    $errors['vehicle_type'] = 'Select a valid vehicle type';
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
