const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

let modalStart = html.indexOf('<!-- SETTINGS MODAL -->');
let modalEnd = html.indexOf('<script', modalStart);

let newSettingsHTML = fs.readFileSync('settings_template.html', 'utf8');

let beforeModal = html.substring(0, modalStart);
let afterModal = html.substring(modalEnd);

fs.writeFileSync('index.html', beforeModal + newSettingsHTML + "\n" + afterModal, 'utf8');
