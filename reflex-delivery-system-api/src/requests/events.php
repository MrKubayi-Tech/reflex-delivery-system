<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();
$user = Auth::requireUser($pdo);

$requestId = $_GET['id'] ?? null;
if (!$requestId) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['id' => 'Required']]]);
    exit();
}

$stmt = $pdo->prepare(
    'SELECT se.status_id, se.delivery_request_id, se.changed_by, u.name AS changed_by_name,
            se.previous_status, se.new_status, se.recorded_at, se.scan_reference
     FROM status_events se
     JOIN users u ON u.id = se.changed_by
     WHERE se.delivery_request_id = ?
     ORDER BY se.recorded_at ASC'
);
$stmt->execute([$requestId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = array_map(function ($r) {
    return [
        'status_id' => (int)$r['status_id'],
        'delivery_request_id' => (int)$r['delivery_request_id'],
        'changed_by' => (int)$r['changed_by'],
        'changed_by_name' => $r['changed_by_name'],
        'previous_status' => $r['previous_status'],
        'new_status' => $r['new_status'],
        'recorded_at' => $r['recorded_at'],
        'scan_reference' => $r['scan_reference'],
    ];
}, $rows);

echo json_encode(['data' => $data]);
