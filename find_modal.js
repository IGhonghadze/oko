const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We will find the modal and replace it with a full screen div.
let modalStart = html.indexOf('<!-- SETTINGS MODAL -->');
let modalEndStr = '<!-- END SETTINGS MODAL -->'; // Doesn't exist, we need to find where to stop.
// The modal ends exactly before <!-- PROPOSAL SCREEN --> or script tag
let modalEnd = html.indexOf('<!-- PROPOSAL SCREEN -->');
if(modalEnd === -1) modalEnd = html.indexOf('<script', modalStart);

console.log("Modal start:", modalStart);
console.log("Modal end:", modalEnd);
