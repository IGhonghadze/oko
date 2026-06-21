const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');
let issues = [];

// 1. Check MOUNT_PRICES
if (!code.match(/(?:const|let|var)\s+MOUNT_PRICES\b/)) {
    let lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('MOUNT_PRICES') && !lines[i].trim().startsWith('//')) {
            issues.push('Line ' + (i+1) + ': MOUNT_PRICES used but NOT defined: ' + lines[i].trim().substring(0, 80));
        }
    }
}

// 2. Check SERVICES (bare, not PRESET_SERVICES)
if (!code.match(/(?:const|let|var)\s+SERVICES\s*=/)) {
    let lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/PRESET_SERVICES_DB/g, 'XXX').replace(/PRESET_SERVICES/g, 'XXX');
        if (line.match(/\bSERVICES\b/) && !line.trim().startsWith('//')) {
            issues.push('Line ' + (i+1) + ': SERVICES used but NOT defined: ' + lines[i].trim().substring(0, 80));
        }
    }
}

// 3. Check PRESET_SERVICES (old name, without _DB)
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/\bPRESET_SERVICES\b/) && !lines[i].includes('PRESET_SERVICES_DB') && !lines[i].trim().startsWith('//')) {
        issues.push('Line ' + (i+1) + ': Old PRESET_SERVICES (not _DB) reference: ' + lines[i].trim().substring(0, 80));
    }
}

if (issues.length === 0) {
    console.log('✓ No undefined variable issues found');
} else {
    console.log('ISSUES (' + issues.length + '):');
    issues.forEach(i => console.log('  ❌ ' + i));
}
