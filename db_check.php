<?php
try {
    $pdo = new PDO("mysql:host=localhost;dbname=w98834km_oko;charset=utf8mb4", "w98834km_oko", "2008Larik1997.");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT company_id, LENGTH(prices_json) as json_size FROM oko_company_prices");
    $prices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $pdo->query("SELECT company_id, logo_path FROM oko_company_settings");
    $settings = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["prices" => $prices, "settings" => $settings]);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
