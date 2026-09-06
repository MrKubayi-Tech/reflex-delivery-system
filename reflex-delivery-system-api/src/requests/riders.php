<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();
Auth::requireUser($pdo, ['dispatcher']);

// capacity_pct is a rough estimate (active assigned/picked_up deliveries
// out of an assumed max load of 5) — there's no real capacity model yet,
// this is a placeholder worth flagging as a trade-off.
$stmt = $pdo->prepare(
    "SELECT u.id AS user_id, u.name AS full_name, u.phone AS phone_number,
            u.vehicle_type, u.availability,
            (SELECT COUNT(*) FROM delivery_requests dr
             WHERE dr.assigned_rider_id = u.id AND dr.current_status IN ('assigned','picked_up')) AS active_count
     FROM users u
     WHERE u.role = 'rider'
     ORDER BY u.name ASC"
);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = array_map(function ($r) {
    return [
        'user_id' => (int)$r['user_id'],
        'full_name' => $r['full_name'],
        'phone_number' => $r['phone_number'],
        'vehicle_type' => $r['vehicle_type'],
        'capacity_pct' => min(100, (int)$r['active_count'] * 20),
        'availability' => $r['availability'],
    ];
}, $rows);

echo json_encode(['data' => $data]);
