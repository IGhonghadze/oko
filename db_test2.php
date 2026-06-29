<?php
try {
    $pdo = new PDO("mysql:host=localhost;dbname=w98834km_oko;charset=utf8mb4", "w98834km_oko", "2008Larik1997.");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create table if not exists just in case
    $pdo->exec("CREATE TABLE IF NOT EXISTS `oko_support` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `company_id` int(11) NOT NULL,
        `topic` varchar(100) NOT NULL,
        `message_text` text NOT NULL,
        `sender` enum('user','admin') NOT NULL,
        `telegram_msg_id` varchar(100) DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    echo "OK DB TABLE\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
