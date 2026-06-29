<?php require 'api.php'; if(sendSmtpEmail('test@example.com', 'Test', 'Hello')) { echo 'OK'; } else { echo 'FAIL'; }
