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
$phone = is_string($input['phone'] ?? null) ? trim($input['phone']) : null;
$password = $input['password'] ?? null;

$errors = [];
if (!$phone) {$errors['phone'] = 'Phone is required';}
if (!$password) {$errors['password'] = 'Password is required';}

if ($errors) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => $errors]]);
    exit();
}

$stmt = $pdo->prepare(
    'SELECT id, phone, name, password_hash, role, business_name, business_address
     FROM users WHERE phone = ? LIMIT 1'
);
$stmt->execute([$phone]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => ['code' => 'unauthorized', 'message' => 'Invalid credentials']]);
    exit();
}

$token = Auth::issueToken($pdo, (int)$user['id']);

echo json_encode([
    'data' => [
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'role' => $user['role'],
            'retailer_id' => $user['role'] === 'retailer' ? (int)$user['id'] : null,
        ],
    ],
]);
