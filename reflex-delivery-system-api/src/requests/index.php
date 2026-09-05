<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();
$user = Auth::requireUser($pdo);

$status = $_GET['status'] ?? null;

$sql = "SELECT dr.delivery_request_id, dr.retailer_id, dr.assigned_rider_id, dr.created_by,
               dr.dispatcher_id, dr.tracking_code, dr.customer_name, dr.customer_phone,
               dr.customer_address, dr.item_description, dr.current_status,
               dr.created_at, dr.updated_at, dr.weight_kg, dr.priority,
               rider.name AS rider_name, rider.vehicle_type AS rider_vehicle,
               dispatcher.name AS dispatcher_name, retailer.name AS retailer_name
        FROM delivery_requests dr
        LEFT JOIN users rider ON rider.id = dr.assigned_rider_id
        LEFT JOIN users dispatcher ON dispatcher.id = dr.dispatcher_id
        LEFT JOIN users retailer ON retailer.id = dr.retailer_id
        WHERE 1=1";
$params = [];

// Scope by role: retailers see their own requests, riders see what's
// assigned to them, dispatchers see everything (that's the job).
if ($user['role'] === 'retailer') {
    $sql .= ' AND dr.retailer_id = ?';
    $params[] = $user['id'];
} elseif ($user['role'] === 'rider') {
    $sql .= ' AND dr.assigned_rider_id = ?';
    $params[] = $user['id'];
}

if ($status) {
    $sql .= ' AND dr.current_status = ?';
    $params[] = $status;
}

$sql .= ' ORDER BY dr.created_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = array_map(function ($r) {
    return [
        'delivery_request_id' => (int)$r['delivery_request_id'],
        'retailer_id' => $r['retailer_id'] !== null ? (int)$r['retailer_id'] : null,
        'assigned_rider_id' => $r['assigned_rider_id'] !== null ? (int)$r['assigned_rider_id'] : null,
        'created_by' => $r['created_by'] !== null ? (int)$r['created_by'] : null,
        'dispatcher_id' => $r['dispatcher_id'] !== null ? (int)$r['dispatcher_id'] : null,
        'tracking_code' => $r['tracking_code'],
        'customer_name' => $r['customer_name'],
        'customer_phone' => $r['customer_phone'],
        'customer_address' => $r['customer_address'],
        'item_description' => $r['item_description'],
        'current_status' => $r['current_status'],
        'created_at' => $r['created_at'],
        'updated_at' => $r['updated_at'],
        'rider_name' => $r['rider_name'],
        'rider_vehicle' => $r['rider_vehicle'],
        'dispatcher_name' => $r['dispatcher_name'],
        'retailer_name' => $r['retailer_name'],
        'weight_kg' => $r['weight_kg'] !== null ? (float)$r['weight_kg'] : null,
        'priority' => $r['priority'],
    ];
}, $rows);

echo json_encode(['data' => $data]);
