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

$token = Auth::extractToken();
if ($token) {
    Auth::revokeToken($pdo, $token);
}

// Always report success: whether the token was still valid or had already
// expired/was missing, the client's goal — not being authenticated anymore
// — holds either way. The frontend clears its local session unconditionally
// too, so this only needs to be best-effort.
echo json_encode(['data' => ['success' => true]]);
