<?php
declare(strict_types=1);

class Router{
    private $route_path;
    private $form_path;
    private $auth_path;
    private $path;
    
    public function __construct(string $route_path, string $form_path, string $auth_path) {
        $this->route_path = $route_path;
        $this->form_path = $form_path;
        $this->auth_path = $auth_path;
        $this->path = '';
    }
    
    private function request_url(){
        $url = $_SERVER['REQUEST_URI'];
        $clean_url = $this->sanitizeURI($url);

        if($clean_url === 'index.php' || $clean_url === 'public_html'){
            $clean_url = 'home';
        }

        $forbidden = ['config.php','session.config.php', 'config', 'routes', 'db.config.php','authenticator','database','router.php','storage','.env','app'];
        if(in_array($clean_url, $forbidden)){
            $clean_url = '404';
        }
        $this->path = $clean_url;
    }
    
    private function request_route(){
        $nav_routes = ['home','admin','rider','user_profile'];
        $auth_routes = ['register','login'];
        $form_routes = ['send-email'];
        
        if(in_array($this->path, $nav_routes)){
            $logged_pages = ['admin','rider','user_profile'];
            
            if(in_array($this->path, $logged_pages) && isset($_SESSION['logged_in']) == 1 && $_SESSION['logged_in'] === true){
                require_once $this->route_path . $this->path . '.route.php';
                die();
            }else{
                require_once $this->route_path . 'home.route.php';
                die();
            }
        }
        
        if(in_array($this->path, $auth_routes)){
            require_once $this->auth_path . $this->path . '.auth.php';
            die();
        }
            
        if(in_array($this->path, $form_routes)){
            require_once $this->form_path . $this->path .'.form_handler.php';
            die();
        }
        
        require_once $this->route_path . 'home.route.php';
        die();
    }
    
    private function sanitizeURI(string $url):string{
        $url = parse_url($url, PHP_URL_PATH);
        $url = basename($url);
        if($url === ''){
           $url = 'home';
        }
        return $url;
    }
    
    public function getURL(){
        $this->request_url();
    }

    public function getRoute(){
        $this->request_route();
    }
}