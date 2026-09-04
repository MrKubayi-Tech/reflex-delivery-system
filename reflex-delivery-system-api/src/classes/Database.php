<?php

class Database {
    private $host;
    private $dbname;
    private $dbuser;
    private $dbpwd;
    private $pdo;

    public function __construct($xmlFile = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '.env' . DIRECTORY_SEPARATOR . 'db_config.xml') {
        if (file_exists($xmlFile)) {
            $xml = simplexml_load_file($xmlFile);
            $this->host = (string)$xml->host;
            $this->dbname = (string)$xml->dbname;
            $this->dbuser = (string)$xml->dbuser;
            $this->dbpwd = (string)$xml->dbpwd;
        }
    }

    private function request_connection() {
        try {
            $this->pdo = new PDO("mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4", $this->dbuser, $this->dbpwd);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $ex) {
            http_response_code(500);
            echo json_encode(['error' => ['code' => 'db_connection_failed', 'message' => $ex->getMessage()]]);
            exit();
        }
    }

    public function get_connection() {
        if (!$this->pdo) {
            $this->request_connection();
        }
        return $this->pdo;
    }

    public function __destruct() {
        $this->pdo = null;
    }
}
