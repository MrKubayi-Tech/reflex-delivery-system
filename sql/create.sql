-- For backend, database, make sure the xampp is running  and then u start the server
-- Initialize the database with the below query to create a database tables

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(64) DEFAULT NULL
);

CREATE TABLE deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    tracking_code VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    rider_id INT DEFAULT NULL,
    note VARCHAR(255) DEFAULT NULL,
    scan_reference VARCHAR(64) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);