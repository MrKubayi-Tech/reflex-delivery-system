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
$rider_id   = $input['rider_id'] ?? null;
$request_id = $_GET['id'] ?? null;

if (!$rider_id || !$request_id) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['rider_id' => 'Required', 'request_id' => 'Required']]]);
    exit();
}

$stmt = $pdo->prepare('UPDATE deliveries SET rider_id = ?, status = ? WHERE id = ?');
$stmt->execute([$rider_id, 'assigned', $request_id]);

echo json_encode([
    'data' => [
        'message' => 'Rider assigned successfully',
        'request_id' => (int)$request_id,
        'rider_id' => (int)$rider_id
    ]
]);
