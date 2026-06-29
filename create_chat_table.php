<?php
require 'db.php';
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS oko_support (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        topic VARCHAR(50),
        message_text TEXT,
        sender VARCHAR(20),
        telegram_msg_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo 'Table created successfully!';
} catch(PDOException $e) {
    echo 'Error: ' . $e->getMessage();
}
