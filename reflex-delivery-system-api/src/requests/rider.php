<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ 
    . DIRECTORY_SEPARATOR . '..' 
    . DIRECTORY_SEPARATOR . 'classes' 
    . DIRECTORY_SEPARATOR . 'Database.php';

$db = new Database();
$pdo = $db->get_connection();

$rider_id = $_GET['id'] ?? null;

if (!$rider_id) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['rider_id' => 'Required']]]);
    exit();
}

$stmt = $pdo->prepare('SELECT id, customer_name, customer_phone, address, item_description, tracking_code, status FROM deliveries WHERE rider_id = ? ORDER BY created_at DESC');
$stmt->execute([$rider_id]);
$deliveries = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['data' => $deliveries]);
