<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'ssl://smtp.beget.com';
$port = 465;
$user = 'oko@ооко.рф';
$pass = '2008Larik1997!';
$from = 'oko@xn--j1aabe.xn--p1ai';
$to = 'oko@ооко.рф';

echo "Connecting to $host:$port...\n";
$socket = fsockopen($host, $port, $errno, $errstr, 10);
if (!$socket) die("Connection failed: $errno - $errstr\n");

function serverParse($socket, $expected) {
    $serverResponse = '';
    while (substr($serverResponse, 3, 1) != ' ') {
        $line = fgets($socket, 256);
        if (!$line) return "EOF";
        $serverResponse = $line;
        echo "S: $line";
    }
    if (!(substr($serverResponse, 0, 3) == $expected)) {
        return "EXPECTED $expected BUT GOT $serverResponse";
    }
    return "OK";
}

echo serverParse($socket, '220') . "\n";
fwrite($socket, "EHLO smtp.beget.com\r\n");
echo serverParse($socket, '250') . "\n";

fwrite($socket, "AUTH LOGIN\r\n");
echo serverParse($socket, '334') . "\n";

fwrite($socket, base64_encode($user) . "\r\n");
echo serverParse($socket, '334') . "\n";

fwrite($socket, base64_encode($pass) . "\r\n");
$res = serverParse($socket, '235');
echo "AUTH RESULT: $res\n";

if ($res !== "OK") die("Auth failed\n");

echo "C: MAIL FROM: <$from>\n";
fwrite($socket, "MAIL FROM: <$from>\r\n");
echo serverParse($socket, '250') . "\n";

echo "C: RCPT TO: <oko@xn--j1aabe.xn--p1ai>\n";
fwrite($socket, "RCPT TO: <oko@xn--j1aabe.xn--p1ai>\r\n");
echo serverParse($socket, '250') . "\n";

echo "C: DATA\n";
fwrite($socket, "DATA\r\n");
echo serverParse($socket, '354') . "\n";

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "From: Test <$from>\r\n";
$headers .= "Subject: Test SMTP\r\n";
$headers .= "To: <oko@xn--j1aabe.xn--p1ai>\r\n";

fwrite($socket, $headers . "\r\nTest message\r\n.\r\n");
echo serverParse($socket, '250') . "\n";

fwrite($socket, "QUIT\r\n");
fclose($socket);
echo "Done.\n";
