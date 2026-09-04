<?php

define('AUTH_PATH', __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'auth' . DIRECTORY_SEPARATOR);
define('REQUEST_PATH', __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'requests' . DIRECTORY_SEPARATOR);


require_once __DIR__ . DIRECTORY_SEPARATOR . 'router.config.php';


if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


