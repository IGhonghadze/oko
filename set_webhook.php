<?php
$token = "8901851039:AAEiUpCXmaMRP9NP0LuNinncT-Twjido7bA";
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
// Some servers run behind proxy, checking HTTP_X_FORWARDED_PROTO
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $protocol = 'https';
}

$domain = $_SERVER['HTTP_HOST'];
$path = str_replace('set_webhook.php', 'api_beget.php?action=tg_webhook', $_SERVER['REQUEST_URI']);
$webhook_url = $protocol . "://" . $domain . $path;

$tg_url = "https://api.telegram.org/bot{$token}/setWebhook?url=" . urlencode($webhook_url);

$ch = curl_init($tg_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);

echo "<h2>Webhook Setup</h2>";
echo "<p>We tried to set the webhook to: <b>$webhook_url</b></p>";
echo "<p>Telegram Response: <b>$res</b></p>";
echo "<p>Если в ответе написано <code>\"ok\":true</code>, то всё настроено правильно! Можете закрыть эту страницу.</p>";
