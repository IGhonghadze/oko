const fs = require('fs');

// Read CSV
const csv = fs.readFileSync('Прайс по монтажу.csv', 'utf8');
const lines = csv.split(/\r?\n/).filter(l => l.trim());

let db = [];
for (let i = 1; i < lines.length; i++) {
    let p = lines[i].split(';');
    if (p.length >= 5 && p[0].trim()) {
        db.push({
            id: 'srv_' + i,
            name: p[0].trim(),
            unit: p[1].trim(),
            prices: [
                parseInt(p[2].replace(/[^0-9]/g, ''), 10) || 0,
                parseInt(p[3].replace(/[^0-9]/g, ''), 10) || 0,
                parseInt(p[4].replace(/[^0-9]/g, ''), 10) || 0
            ]
        });
    }
}

console.log('Parsed', db.length, 'services from CSV');
console.log('First 3:', JSON.stringify(db.slice(0, 3)));

// Read script.js
let content = fs.readFileSync('script.js', 'utf8');

// Replace empty array with real data
const oldDeclaration = 'const PRESET_SERVICES_DB = [];';
const newDeclaration = 'const PRESET_SERVICES_DB = ' + JSON.stringify(db) + ';';

if (content.includes(oldDeclaration)) {
    content = content.replace(oldDeclaration, newDeclaration);
    fs.writeFileSync('script.js', content, 'utf8');
    console.log('Successfully replaced PRESET_SERVICES_DB with', db.length, 'entries');
} else {
    console.error('ERROR: Could not find empty PRESET_SERVICES_DB declaration');
}
