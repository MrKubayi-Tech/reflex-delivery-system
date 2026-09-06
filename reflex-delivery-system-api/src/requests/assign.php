<?php
declare(strict_types=1);
header('Content-Type: application/json');

require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Database.php';
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'Auth.php';

$db = new Database();
$pdo = $db->get_connection();
$user = Auth::requireUser($pdo, ['dispatcher']);

$input = json_decode(file_get_contents('php://input'), true);
$riderId   = $input['rider_id'] ?? null;
$requestId = $_GET['id'] ?? null;

if (!$riderId || !$requestId) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['rider_id' => 'Required']]]);
    exit();
}

$stmt = $pdo->prepare('SELECT current_status FROM delivery_requests WHERE delivery_request_id = ?');
$stmt->execute([$requestId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$existing) {
    http_response_code(404);
    echo json_encode(['error' => ['code' => 'not_found', 'message' => 'Request not found']]);
    exit();
}
if ($existing['current_status'] !== 'pending') {
    http_response_code(409);
    echo json_encode(['error' => ['code' => 'invalid_transition', 'message' => 'Only pending requests can be assigned']]);
    exit();
}

// The rider_id came from the client — confirm it actually names a rider
// before writing it as a foreign key. Without this, a stale or forged
// id silently attaches a non-rider (or nonexistent) user to a delivery.
$stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? AND role = ? LIMIT 1');
$stmt->execute([$riderId, 'rider']);
if (!$stmt->fetch()) {
    http_response_code(422);
    echo json_encode(['data' => ['errors' => ['rider_id' => 'Selected rider does not exist']]]);
    exit();
}

$pdo->beginTransaction();
try {
    // Two dispatchers can both load this page while the request is still
    // "pending" and both click Assign a moment apart — the SELECT above
    // doesn't stop that. Re-checking current_status inside the UPDATE's
    // WHERE clause, atomically, closes that race: only the first write
    // wins, and rowCount() tells the loser it lost.
    $stmt = $pdo->prepare(
        "UPDATE delivery_requests
         SET assigned_rider_id = ?, dispatcher_id = ?, current_status = 'assigned'
         WHERE delivery_request_id = ? AND current_status = 'pending'"
    );
    $stmt->execute([$riderId, $user['id'], $requestId]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        http_response_code(409);
        echo json_encode(['error' => ['code' => 'invalid_transition', 'message' => 'Only pending requests can be assigned']]);
        exit();
    }

    $stmt = $pdo->prepare(
        'INSERT INTO status_events (delivery_request_id, changed_by, previous_status, new_status)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$requestId, $user['id'], 'pending', 'assigned']);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => ['code' => 'server_error', 'message' => 'Could not assign rider. Please try again.']]);
    exit();
}

echo json_encode([
    'data' => [
        'message' => 'Rider assigned successfully',
        'request_id' => (int)$requestId,
        'rider_id' => (int)$riderId,
    ],
]);
