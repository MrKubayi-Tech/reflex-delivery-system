<?php
header('Content-Type: application/json');
require_once __DIR__ . DIRECTORY_SEPARATOR .'..'. DIRECTORY_SEPARATOR .'src'. DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'config.php';

$router = new Router(AUTH_PATH, REQUEST_PATH);
$router->set_path($_SERVER['REQUEST_URI']);