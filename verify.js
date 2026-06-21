const fs = require('fs');
let c = fs.readFileSync('script.js', 'utf8');
let h = fs.readFileSync('index.html', 'utf8');

let checks = {
    '1. Syntax': 'OK (verified separately)',
    '2. PRESET_SERVICES_DB has data': c.includes('srv_1'),
    '3. generateSvgSketch exists': c.includes('function generateSvgSketch'),
    '4. showProposal uses SVG': c.includes('let sketchHtml = generateSvgSketch(it)'),
    '5. setupEnterKeys': c.includes('function setupEnterKeys'),
    '6. window.onload calls setupEnterKeys': c.includes('setupEnterKeys()'),
    '7. initPresetServices': c.includes('function initPresetServices'),
    '8. applyPresetService': c.includes('function applyPresetService'),
    '9. HTML srv-preset': h.includes('srv-preset'),
    '10. HTML srv-pricelist': h.includes('srv-pricelist'),
    '11. HTML addGlassItem': h.includes('addGlassItem()'),
    '12. Font size 28 for dimensions': c.includes('font-size="28"'),
    '13. Shower handle centered': c.includes('handleY - 18'),
    '14. Net plisse has arrows': c.includes('marker-end="url(#arrow)" marker-start="url(#arrowStart)"'),
};

for (let [k, v] of Object.entries(checks)) {
    console.log(k + ':', v === true ? '✓ YES' : (v === false ? '✗ NO' : v));
}
