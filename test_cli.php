<?php
$_GET['action'] = 'forgot_request';
$_SERVER['REQUEST_METHOD'] = 'POST';
$input = json_encode(['email' => 'oko@ооко.рф']);
// Mock php://input
file_put_contents('php://memory', $input);
// We can't easily mock php://input for require. 
// Let's just create a wrapper that overwrites file_get_contents
