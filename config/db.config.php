<?php
declare(strict_types=1);

class Database{
    
    private $dbhost;
    private $dbname;
    private $dbuser;
    private $dbuserpwd;
    private $pdo;
    
    public function __construct($xmlFile = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '.env' . DIRECTORY_SEPARATOR . 'database.env.xml') {
       
        if(!file_exists($xmlFile)){
            header('Refresh: 1; url=internal-error');
            exit();
        }
        
        $xml_content = simplexml_load_file($xmlFile);
            
        $this->dbhost = (string) $xml_content->dbhost;
        $this->dbname = (string) $xml_content->dbname;
        $this->dbuser = (string) $xml_content->dbuser;
        $this->dbuserpwd = (string) $xml_content->dbuserpwd;
    }
    
    private function PDO_Connection(){
        try{
            $pdo = new PDO("mysql:host=$this->dbhost;dbname=$this->dbname", $this->dbuser,$this->dbuserpwd);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo = $pdo;
            $pdo = null;
        } catch (PDOException $ex) {
            header('Refresh: 1; url=internal-error');
            exit();
        }
    }
    
    public function requestConnection(){
        $this->PDO_Connection();
    }
    public function getConnection(){
        return $this->pdo;
        
    }
    public function __destruct() {
        $this->dbhost = null;
        $this->dbname = null;
        $this->dbuser = null;
        $this->dbuserpwd = null;
        $this->pdo = null;
    }
}

