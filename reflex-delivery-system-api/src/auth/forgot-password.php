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

if (!$phone) {
    http_response_code(422);
    echo json_encode([
        'data' => [
            'errors' => ['phone' => 'Phone is required']
        ]
    ]);
    exit();
}

$stmt = $pdo->prepare('SELECT id, name FROM users WHERE phone = ? LIMIT 1');
$stmt->execute([$phone]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode([
        'error' => [
            'code' => 'not_found',
            'message' => 'No account found with that phone number'
        ]
    ]);
    exit();
}

$resetToken = bin2hex(random_bytes(16));

$stmt = $pdo->prepare('UPDATE users SET reset_token = ? WHERE id = ?');
$stmt->execute([$resetToken, $user['id']]);

echo json_encode([
    'data' => [
        'message' => 'Password reset initiated',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'phone' => $phone
        ],
        'reset_token' => $resetToken
    ]
]);


