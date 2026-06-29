<?php
$token = "8901851039:AAEiUpCXmaMRP9NP0LuNinncT-Twjido7bA";
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$domain = $_SERVER['HTTP_HOST'];
$path = dirname($_SERVER['REQUEST_URI']);
$webhook_url = $protocol . "://" . $domain . $path . "/api_beget.php?action=tg_webhook";

$tg_url = "https://api.telegram.org/bot{$token}/setWebhook?url=" . urlencode($webhook_url);
$res = file_get_contents($tg_url);
echo "Webhook set to: " . $webhook_url . "\nResponse: " . $res;
