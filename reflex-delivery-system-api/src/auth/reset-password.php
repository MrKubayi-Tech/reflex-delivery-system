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
$token    = $input['reset_token'] ?? null;
$password = $input['password'] ?? null;


$errors = [];
if (!$token)    {$errors['reset_token'] = 'Reset token is required';}
if (!$password) {$errors['password']    = 'New password is required';}

if ($errors) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => $errors]]);
    exit();
}

$stmt = $pdo->prepare('SELECT id, phone, name FROM users WHERE reset_token = ? LIMIT 1');
$stmt->execute([$token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(400);
    echo json_encode([
        'error' => [
            'code' => 'invalid_token',
            'message' => 'Reset token is invalid or expired'
        ]
    ]);
    exit();
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare('UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?');
$stmt->execute([$passwordHash, $user['id']]);

echo json_encode([
    'data' => [
        'message' => 'Password reset successful',
        'user' => [
            'id' => $user['id'],
            'phone' => $user['phone'],
            'name' => $user['name']
        ]
    ]
]);
