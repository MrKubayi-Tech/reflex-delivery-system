<?php
// Never show PHP errors/warnings in the response body
ini_set('display_errors', 0);
error_reporting(E_ALL);

// But DO log them to a file so you can debug
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . DIRECTORY_SEPARATOR . 'php_errors.log');

header('Content-Type: application/json');

// Catch fatal errors and return valid JSON instead of raw PHP output
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
        }
        echo json_encode([
            'success' => false,
            'error' => 'Internal server error'
        ]);
    }
});

require_once __DIR__ . DIRECTORY_SEPARATOR .'..'. DIRECTORY_SEPARATOR .'src'. DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'config.php';

$router = new Router(AUTH_PATH, REQUEST_PATH);
$router->set_path($_SERVER['REQUEST_URI']);