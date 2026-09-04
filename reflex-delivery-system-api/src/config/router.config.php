<?php

class Router {
    private $uri_path;
    private $auth_path;
    private $requests_path;
    private $method;

    public function __construct($auth_path, $request_path) {
        $this->auth_path = $auth_path;
        $this->requests_path = $request_path;
        $this->uri_path = '';
        $this->method = $_SERVER['REQUEST_METHOD'];
    }

    private function request_api() {
        $segments = explode('/', trim($this->uri_path, '/'));
        $section = $segments[0] ?? '';
        $endpoint = $segments[1] ?? '';
        $id = $segments[1] ?? null;
        $sub = $segments[2] ?? null;

        switch ($section) {
            case 'auth':
                $this->handleAuth($endpoint);
                break;

            case 'requests':
                $this->handleRequests($id, $sub);
                break;

            case 'riders':
                require_once $this->requests_path . 'riders.php';
                break;

            default:
                http_response_code(404);
                echo json_encode(['error' => ['code' => 'not_found', 'message' => 'Route not found']]);
        }
    }

    private function handleAuth($endpoint) {
        $auth_api = ['login', 'register', 'forgot-password','reset-password'];
        if (in_array($endpoint, $auth_api)) {
           
            if ($this->method === 'POST') {
                require_once $this->auth_path . $endpoint . '.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => ['code' => 'method_not_allowed', 'message' => 'Use POST for auth routes']]);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => ['code' => 'not_found', 'message' => 'Auth route not found']]);
        }
    }

    private function handleRequests($id, $sub) {
        if (!$id) {
            
            if ($this->method === 'GET') {
                require_once $this->requests_path . 'index.php';
            } elseif ($this->method === 'POST') {
                require_once $this->requests_path . 'create.php';
            } else {
                http_response_code(405);
                echo json_encode(['error' => ['code' => 'method_not_allowed', 'message' => 'Unsupported method for /requests']]);
            }
            return;
        }

        switch ($sub) {
            case 'events':
                require_once $this->requests_path . 'events.php';
                break;
            case 'assign':
                if ($this->method === 'POST') {
                    require_once $this->requests_path . 'assign.php';
                } else {
                    http_response_code(405);
                    echo json_encode(['error' => ['code' => 'method_not_allowed', 'message' => 'Use POST for assign']]);
                }
                break;
            case 'status':
                if ($this->method === 'PATCH') {
                    require_once $this->requests_path . 'status.php';
                } else {
                    http_response_code(405);
                    echo json_encode(['error' => ['code' => 'method_not_allowed', 'message' => 'Use PATCH for status updates']]);
                }
                break;
            default:
                http_response_code(404);
                echo json_encode(['error' => ['code' => 'not_found', 'message' => 'Request sub-route not found']]);
        }
    }

    private function clean_ur($path) {
        $path = parse_url($path, PHP_URL_PATH);
        $path = preg_replace('#^/reflex-delivery-system-api/public#', '', $path);
        $path = preg_replace('#^/api/#', '', $path);

        $forbidden = ['config.php','session.config.php','db.config.php','router.php','.env'];
        if (in_array($path, $forbidden)) {
            http_response_code(403);
            echo json_encode(['error' => ['code' => 'forbidden', 'message' => 'Access denied']]);
            exit();
        }
        return $path;
    }

    public function set_path($path) {
        $this->uri_path = $this->clean_ur($path);
        $this->request_api();
    }
}
