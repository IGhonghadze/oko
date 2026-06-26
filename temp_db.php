<?php
require 'api.php';
$pdo->exec("UPDATE oko_users SET email='oko@ооко.рф' WHERE id=1;");
echo "DONE";
