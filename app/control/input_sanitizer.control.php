<?php

function any_empty_fields($inputs, $type){
    if($type === 'user'){
        if(strlen($inputs) < 4){
            return true;
        }
    }
    
    if($type === 'admin'){
        if(strlen($inputs) < 5){
            return true;
        }
    }
    
    if($type === 'user'){
        if(strlen($inputs) < 2){
            return true;
        }
    }
}

function sanitize($inputs){
    $clean_fields = [];
    foreach($inputs as $key => $value){
        $clean_fields = [
            $key => sanitizer($value)
        ];
    }
    return $clean_fields;
}

function sanitizer($value){
    $value = trim($value);
    $value = stripcslashes($string);
    return $value;
}

function user_request(object $pdo, array $details){
    add_user_request($pdo, $details);
}

function dispatch_rider(object $pdo, array $details){
    log_user($pdo, $details);
}

function rider_report(object $pdo, array $details){
    driver_report($pdo, $details);
}