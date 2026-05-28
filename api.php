<?php
/**
 * Oko SaaS API for Beget
 * Handles syncing calculations to MySQL
 */

// Enable CORS for testing from localhost or other domains
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database Credentials
$db_host = 'localhost';
$db_user = 'w98834km_oko';
$db_pass = '2008Larik1997.';
$db_name = 'w98834km_oko';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Auto-create table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS oko_archive (
        id BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date_str VARCHAR(50) NOT NULL,
        item_count INT NOT NULL,
        total_sum DECIMAL(15,2) NOT NULL DEFAULT 0,
        state_json LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

} catch (PDOException $e) {
    echo json_encode(['error' => 'Ошибка подключения к БД: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    // Fetch all records, ordered by created_at DESC
    $stmt = $pdo->query("SELECT id, name, date_str as date, item_count as itemCount, total_sum as totalSum, state_json FROM oko_archive ORDER BY created_at DESC LIMIT 200");
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Decode JSON states
    foreach ($records as &$rec) {
        $rec['state'] = json_decode($rec['state_json'], true);
        unset($rec['state_json']);
        // Parse numbers
        $rec['itemCount'] = (int)$rec['itemCount'];
        $rec['totalSum'] = (float)$rec['totalSum'];
    }
    
    echo json_encode($records);
    exit;
}

if ($action === 'save') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['id'])) {
        echo json_encode(['error' => 'Неверные данные']);
        exit;
    }
    
    $stmt = $pdo->prepare("INSERT INTO oko_archive (id, name, date_str, item_count, total_sum, state_json) VALUES (?, ?, ?, ?, ?, ?)
                           ON DUPLICATE KEY UPDATE name=VALUES(name), date_str=VALUES(date_str), item_count=VALUES(item_count), total_sum=VALUES(total_sum), state_json=VALUES(state_json)");
                           
    $state_json = json_encode($data['state'], JSON_UNESCAPED_UNICODE);
    
    $stmt->execute([
        $data['id'],
        $data['name'],
        $data['date'],
        $data['itemCount'],
        $data['totalSum'] ?? 0,
        $state_json
    ]);
    
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'rename') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['id']) || !isset($data['name'])) {
        echo json_encode(['error' => 'Неверные данные']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE oko_archive SET name = ? WHERE id = ?");
    $stmt->execute([$data['name'], $data['id']]);
    
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['id'])) {
        echo json_encode(['error' => 'Неверные данные']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM oko_archive WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Неизвестное действие']);
