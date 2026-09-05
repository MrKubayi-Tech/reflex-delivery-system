<?php

/**
 * Reads the Authorization: Bearer <token> header (or an access_token query
 * param, for EventSource which can't set headers) and resolves it to a
 * user row via auth_tokens. Previously nothing on the server checked
 * tokens at all — every "authenticated" endpoint trusted the client.
 */
class Auth {
    /** Default session lifetime for newly issued tokens (24h). */
    const TOKEN_TTL_SECONDS = 86400;

    /** Pulls the bearer token out of the request, or null if there isn't one. */
    public static function extractToken(): ?string {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        foreach ($headers as $name => $value) {
            if (strtolower($name) === 'authorization' && stripos($value, 'Bearer ') === 0) {
                return substr($value, 7);
            }
        }
        if (isset($_GET['access_token'])) {
            return $_GET['access_token'];
        }
        return null;
    }

    public static function currentUser(PDO $pdo): ?array {
        $token = self::extractToken();
        if (!$token) {
            return null;
        }

        // expires_at IS NULL covers tokens issued before the expiry column
        // existed (see migration.sql #5) — they're treated as non-expiring
        // rather than silently invalidated.
        $stmt = $pdo->prepare(
            'SELECT u.id, u.name, u.phone, u.role, u.business_name, u.business_address, u.vehicle_type, u.availability
             FROM auth_tokens t JOIN users u ON u.id = t.user_id
             WHERE t.token = ? AND (t.expires_at IS NULL OR t.expires_at > NOW()) LIMIT 1'
        );
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?: null;
    }

    /** Exits with 401 JSON if there's no valid token. Optionally restrict to specific roles. */
    public static function requireUser(PDO $pdo, array $allowedRoles = []): array {
        $user = self::currentUser($pdo);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => ['code' => 'unauthorized', 'message' => 'Missing or invalid token']]);
            exit();
        }
        if ($allowedRoles && !in_array($user['role'], $allowedRoles, true)) {
            http_response_code(403);
            echo json_encode(['error' => ['code' => 'forbidden', 'message' => 'Your role cannot perform this action']]);
            exit();
        }
        return $user;
    }

    public static function issueToken(PDO $pdo, int $userId, int $ttlSeconds = self::TOKEN_TTL_SECONDS): string {
        $token = bin2hex(random_bytes(16));
        $expiresAt = date('Y-m-d H:i:s', time() + $ttlSeconds);
        $stmt = $pdo->prepare('INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$token, $userId, $expiresAt]);
        return $token;
    }

    /** Deletes a token so it can no longer authenticate anything. Used by POST /auth/logout. */
    public static function revokeToken(PDO $pdo, string $token): void {
        $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE token = ?');
        $stmt->execute([$token]);
    }
}
