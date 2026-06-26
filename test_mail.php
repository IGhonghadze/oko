<?php require 'api.php'; if(sendSmtpEmail('test@example.com', 'Test Mail', 'This is a test using native mail()')) { echo 'OK'; } else { echo 'FAIL'; }
