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
$phone    = $input['phone']    ?? null;
$password = $input['password'] ?? null;
$name     = $input['name']     ?? null;

$errors = [];
if (!$phone)    {$errors['phone']    = 'Phone is required';}
if (!$password) {$errors['password'] = 'Password is required';}
if (!$name)     {$errors['name']     = 'Name is required';}

if ($errors) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => $errors]]);
    exit();
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE phone = ? LIMIT 1');
$stmt->execute([$phone]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'error' => [
            'code' => 'conflict',
            'message' => 'Phone number already registered'
        ]
    ]);
    exit();
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('INSERT INTO users (phone, name, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$phone, $name, $passwordHash]);

$userId = (int)$pdo->lastInsertId();

$token = bin2hex(random_bytes(16));

echo json_encode([
    'data' => [
        'token' => $token,
        'user' => [
            'id' => $userId,
            'phone' => $phone,
            'name' => $name
        ]
    ]
]);
