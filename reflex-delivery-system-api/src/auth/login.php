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
$phone = $input['phone'] ?? null;
$password = $input['password'] ?? null;


$errors = [];
if (!$phone) {$errors['phone'] = 'Phone is required';}
if (!$password) {$errors['password'] = 'Password is required';}

if ($errors) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => $errors]]);
    exit();
}

$stmt = $pdo->prepare('SELECT id, phone, name, password_hash FROM users WHERE phone = ? LIMIT 1');
$stmt->execute([$phone]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);


if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode([
        'error' => [
            'code' => 'unauthorized',
            'message' => 'Invalid credentials'
        ]
    ]);
    exit();
}

$token = bin2hex(random_bytes(16));


echo json_encode([
    'data' => [
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'phone' => $user['phone'],
            'name' => $user['name']
        ]
    ]
]);
