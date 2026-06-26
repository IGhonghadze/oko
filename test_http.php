<?php
$_GET['action'] = 'forgot_request';
$_SERVER['REQUEST_METHOD'] = 'POST';
$input = json_encode(['email' => 'oko@ооко.рф']);
// We need to mock php://input
// However, it's easier to just call the API directly through HTTP using cURL inside Beget
$ch = curl_init('http://127.0.0.1/api.php?action=forgot_request');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json', 'Host: ооко.рф'));
$response = curl_exec($ch);
curl_close($ch);
echo "RESPONSE: " . $response . "\n";
