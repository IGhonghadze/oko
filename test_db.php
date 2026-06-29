<?php
$db_host = 'localhost';
$db_user = 'w98834km_oko';
$db_pass = '2008Larik1997.';
$db_name = 'w98834km_oko';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check columns
    $stmt = $pdo->query('SHOW COLUMNS FROM oko_company_settings');
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Check actual data
    $stmt2 = $pdo->query('SELECT company_id, cp_layout FROM oko_company_settings LIMIT 5');
    $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'columns' => $cols,
        'has_cp_layout_column' => in_array('cp_layout', $cols),
        'data_rows' => $rows
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
