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
$status      = $input['status'] ?? null;
$note        = $input['note'] ?? null;
$scan_ref    = $input['scan_reference'] ?? null;
$request_id  = $_GET['id'] ?? null;

if (!$status || !$request_id) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['status' => 'Required', 'request_id' => 'Required']]]);
    exit();
}

$stmt = $pdo->prepare('UPDATE deliveries SET status = ?, note = ?, scan_reference = ? WHERE id = ?');
$stmt->execute([$status, $note, $scan_ref, $request_id]);

echo json_encode([
    'data' => [
        'message' => 'Status updated successfully',
        'request_id' => (int)$request_id,
        'status' => $status
    ]
]);
