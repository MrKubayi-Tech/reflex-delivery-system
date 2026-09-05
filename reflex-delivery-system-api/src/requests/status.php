<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();
$user = Auth::requireUser($pdo, ['rider', 'dispatcher']);

$input = json_decode(file_get_contents('php://input'), true);
$newStatus  = $input['status'] ?? null;
$note       = $input['note'] ?? null;
$scanRef    = $input['scan_reference'] ?? null;
$requestId  = $_GET['id'] ?? null;

// Mirrors STATUS_TRANSITIONS in src/types.ts — forward-only.
$TRANSITIONS = [
    'pending' => ['assigned'],
    'assigned' => ['picked_up'],
    'picked_up' => ['delivered'],
    'delivered' => [],
];

if (!$newStatus || !$requestId) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['status' => 'Required']]]);
    exit();
}

$stmt = $pdo->prepare('SELECT current_status, assigned_rider_id, tracking_code FROM delivery_requests WHERE delivery_request_id = ?');
$stmt->execute([$requestId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$existing) {
    http_response_code(404);
    echo json_encode(['error' => ['code' => 'not_found', 'message' => 'Request not found']]);
    exit();
}

if ($user['role'] === 'rider' && (int)$existing['assigned_rider_id'] !== (int)$user['id']) {
    http_response_code(403);
    echo json_encode(['error' => ['code' => 'forbidden', 'message' => 'Not your assigned delivery']]);
    exit();
}

$previousStatus = $existing['current_status'];
if (!in_array($newStatus, $TRANSITIONS[$previousStatus] ?? [], true)) {
    http_response_code(409);
    echo json_encode(['error' => ['code' => 'invalid_transition', 'message' => "Cannot move from {$previousStatus} to {$newStatus}"]]);
    exit();
}

// FR-11: delivered requires a scan_reference matching the tracking code.
if ($newStatus === 'delivered' && $scanRef !== $existing['tracking_code']) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['scan_reference' => 'Must match the delivery tracking code']]]);
    exit();
}

$stmt = $pdo->prepare('UPDATE delivery_requests SET current_status = ?, note = ?, scan_reference = ? WHERE delivery_request_id = ?');
$stmt->execute([$newStatus, $note, $scanRef, $requestId]);

$stmt = $pdo->prepare(
    'INSERT INTO status_events (delivery_request_id, changed_by, previous_status, new_status, scan_reference)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$requestId, $user['id'], $previousStatus, $newStatus, $scanRef]);

echo json_encode([
    'data' => [
        'message' => 'Status updated successfully',
        'request_id' => (int)$requestId,
        'status' => $newStatus,
    ],
]);
