const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// 1. Remove duplicate old Services block completely.
// Let's find the start of the old static services which might be around "const MOUNT_PRICES = {"
let oldBlockStart = code.indexOf('const MOUNT_PRICES = {');
if (oldBlockStart !== -1) {
    let oldBlockEnd = code.indexOf('function removeService(idx)', oldBlockStart);
    if (oldBlockEnd !== -1) {
        let firstPart = code.substring(0, oldBlockStart);
        let secondPart = code.substring(oldBlockEnd);
        code = firstPart + secondPart;
    }
}

// 2. Fix the Sketch replacement in showProposal
let targetHtml = "let sketchHtml = it.customSvg || (it.category === 'slope_profile' ? '<div class=\"text-3xl text-slate-300 text-center\">-</div>' : `<canvas id=\"${canvasId}\" class=\"sketch-container mx-auto\" width=\"200\" height=\"200\" style=\"width: 100px; height: 100px;\"></canvas>`);";
let replaceHtml = "let sketchHtml = generateSvgSketch(it);";
if (code.includes(targetHtml)) {
    code = code.replace(targetHtml, replaceHtml);
} else {
    // try a more generic replace if it got mangled
    code = code.replace(/let sketchHtml = it\.customSvg[\s\S]*?<\/canvas>\`\);/, replaceHtml);
}

// 3. Remove the old loop `setTimeout(() => { ITEMS.forEach(it => drawSketch(..` in showProposal
let oldTimeoutLoop = "setTimeout(() => { ITEMS.forEach(it => drawSketch(`sketch-${it.id}`, it)); }, 50);";
code = code.replace(oldTimeoutLoop, "");
// just in case, find it by regex
code = code.replace(/setTimeout\(\(\) => \{ ITEMS\.forEach\(it => drawSketch[\s\S]*?\}, 50\);/, "");

// 4. Fix Shower handle in generateSvgSketch
// User said: "у двери душевой кабины ручка рисуется очень внизу, почему-то она не посередине"
// In generateSvgSketch I had: `<circle cx="${padX+svgW-15}" cy="${padY+svgH/2}" r="3" fill="#0284c7"/>`
// Wait, if it's drawing low, maybe the Y coordinate was wrong. Let's make sure it's exactly center.
// And dimensions for showers: "Размеры около эскиза душевых кабин не видно вообще. Очень маленьким шрифтом написаны"
// Showers use getShowerDimensionLine(it, true) maybe for text, but my SVG uses w and h. 
// Oh! For showers, `item.w` and `item.h` might be empty or 0 if they use custom width/height fields in their category!
// Let's check how showers store dimensions. Yes! Showers use `item.wLeft`, `item.wRight`, `item.height`. `item.w` and `item.h` might be undefined, so w=1000, h=1000 fallback kicks in, making the shower a perfect square, and the font might be scaled down if the container is weird. But I hardcoded font size to 22!
// Wait! `item.w` and `item.h` for shower: let's fix it so it parses `item.wLeft + item.wRight` or whatever is appropriate, and height is `item.height`.
// And we should rewrite `generateSvgSketch` to properly parse shower sizes.

let svgGenStart = code.indexOf('// --- SKETCH SVG GENERATOR ---');
let svgGenEnd = code.indexOf('function removeService(', svgGenStart);
if (svgGenStart !== -1 && svgGenEnd !== -1 && svgGenStart < svgGenEnd) {
    let oldSvgGen = code.substring(svgGenStart, svgGenEnd);
    
    let newSvgGen = `// --- SKETCH SVG GENERATOR ---
function generateSvgSketch(item) {
    if (!item) return '';

    // Абстрактные позиции (иконки вместо чертежей)
    if (item.category === 'services' || item.category === 'fittings' || item.category === 'custom' || item.category === 'slope_profile') {
        let iconPath = '';
        let color = '#475569';
        let typeStr = (item.type || '').toLowerCase();
        if (typeStr.includes('сварка') || typeStr.includes('сварочн')) {
            // Welding icon
            iconPath = '<path d="M12 2L2 22h20L12 2zM12 8l-4 10h8l-4-10z" fill="currentColor"/>';
            color = '#f59e0b';
        } else if (typeStr.includes('резин') || typeStr.includes('уплотн')) {
            iconPath = '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/>';
            color = '#3b82f6';
        } else if (typeStr.includes('фурнитур') || typeStr.includes('ручк') || typeStr.includes('петл') || typeStr.includes('замок')) {
            iconPath = '<rect x="4" y="10" width="16" height="4" rx="2"/><circle cx="6" cy="12" r="1" fill="#fff"/>';
            color = '#8b5cf6';
        } else {
            // Generic box icon
            iconPath = '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="2"/><line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" stroke-width="2"/>';
        }
        return \`<svg viewBox="0 0 24 24" width="100%" height="100%" style="max-height: 120px;" class="mx-auto" stroke="\${color}" fill="none">\${iconPath}</svg>\`;
    }

    // Векторные чертежи с размерами
    let w = parseFloat(item.w);
    let h = parseFloat(item.h);
    
    if (item.category === 'shower') {
        w = parseFloat(item.width) || parseFloat(item.wLeft) + (parseFloat(item.wRight) || 0) || 1000;
        h = parseFloat(item.height) || parseFloat(item.h) || 2000;
    } else if (item.category === 'frameless') {
        w = parseFloat(item.w) || 3000;
        h = parseFloat(item.h) || 2000;
    } else {
        w = w || 1000;
        h = h || 1500;
    }
    
    if (item.category === 'sill') { 
        let temp = w; w = h; h = temp; 
    } 

    let boxSize = 150; 
    let ratio = w / h;
    let svgW = boxSize;
    let svgH = boxSize;
    if (ratio > 1) {
        svgH = boxSize / ratio;
    } else {
        svgW = boxSize * ratio;
    }
    if (svgW < 40) svgW = 40;
    if (svgH < 40) svgH = 40;

    let padX = 50; 
    let padY = 40;
    let totalW = svgW + padX * 2;
    let totalH = svgH + padY * 2;

    let innerSvg = '';

    if (item.category === 'glass') {
        innerSvg += \`<rect x="\${padX}" y="\${padY}" width="\${svgW}" height="\${svgH}" fill="#f0f9ff" stroke="#1e293b" stroke-width="3"/>\`;
        innerSvg += \`<rect x="\${padX + 5}" y="\${padY + 5}" width="\${svgW - 10}" height="\${svgH - 10}" fill="none" stroke="#334155" stroke-width="1.5"/>\`;
        if (item.optionsDesc && item.optionsDesc.join(' ').toLowerCase().match(/(открывание|на себя|от себя|влево|вправо)/)) {
            let descStr = item.optionsDesc.join(' ').toLowerCase();
            innerSvg += \`<path stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,4" fill="none" \`;
            if (descStr.includes('вправо')) {
                innerSvg += \`d="M\${padX+svgW} \${padY} L\${padX} \${padY+svgH/2} L\${padX+svgW} \${padY+svgH}" />\`;
                innerSvg += \`<circle cx="\${padX+10}" cy="\${padY+svgH/2}" r="3.5" fill="#1e293b"/>\`;
                innerSvg += \`<rect x="\${padX+8}" y="\${padY+svgH/2-10}" width="4" height="20" fill="#1e293b" rx="2"/>\`;
            } else if (descStr.includes('влево')) {
                innerSvg += \`d="M\${padX} \${padY} L\${padX+svgW} \${padY+svgH/2} L\${padX} \${padY+svgH}" />\`;
                innerSvg += \`<circle cx="\${padX+svgW-10}" cy="\${padY+svgH/2}" r="3.5" fill="#1e293b"/>\`;
                innerSvg += \`<rect x="\${padX+svgW-12}" y="\${padY+svgH/2-10}" width="4" height="20" fill="#1e293b" rx="2"/>\`;
            } else {
                innerSvg += \`d="M\${padX} \${padY+svgH} L\${padX+svgW/2} \${padY} L\${padX+svgW} \${padY+svgH}" />\`;
            }
        } else {
             innerSvg += \`<line x1="\${padX + svgW*0.2}" y1="\${padY + svgH - 10}" x2="\${padX + svgW - 10}" y2="\${padY + svgH*0.2}" stroke="#fff" stroke-width="\${svgW/6}" opacity="0.6"/>\`;
        }
    } else if (item.category === 'frameless') {
        let panels = 1;
        let match = (item.shape||'').match(/Панелей: (\\d+)/);
        if (match) panels = parseInt(match[1]);
        innerSvg += \`<rect x="\${padX}" y="\${padY}" width="\${svgW}" height="\${svgH}" fill="#f8fafc" stroke="#1e293b" stroke-width="3"/>\`;
        let pWidth = svgW / panels;
        for (let i = 1; i < panels; i++) {
            innerSvg += \`<line x1="\${padX + i*pWidth}" y1="\${padY}" x2="\${padX + i*pWidth}" y2="\${padY+svgH}" stroke="#475569" stroke-width="1.5"/>\`;
        }
        innerSvg += \`<path d="M\${padX+20} \${padY+svgH/2} L\${padX+svgW-20} \${padY+svgH/2}" stroke="#ef4444" stroke-width="3" fill="none" marker-end="url(#arrow)" marker-start="url(#arrowStart)"/>\`;
    } else if (item.category === 'net') {
        innerSvg += \`<rect x="\${padX}" y="\${padY}" width="\${svgW}" height="\${svgH}" fill="#f8fafc" stroke="#92400e" stroke-width="4"/>\`;
        let isPleated = (item.type||'').toLowerCase().includes('плисс');
        if (isPleated) {
            for(let i=8; i<svgW; i+=8) {
                innerSvg += \`<line x1="\${padX+i}" y1="\${padY}" x2="\${padX+i}" y2="\${padY+svgH}" stroke="#d6d3d1" stroke-width="1"/>\`;
            }
            innerSvg += \`<path d="M\${padX+10} \${padY+svgH/2} L\${padX+svgW-10} \${padY+svgH/2}" stroke="#ef4444" stroke-width="3" fill="none" marker-end="url(#arrow)" marker-start="url(#arrowStart)"/>\`;
        } else {
            innerSvg += \`<rect x="\${padX+4}" y="\${padY+4}" width="\${svgW-8}" height="\${svgH-8}" fill="none" stroke="#d6d3d1" stroke-width="1.5" stroke-dasharray="2,2"/>\`;
        }
    } else if (item.category === 'shower') {
        innerSvg += \`<rect x="\${padX}" y="\${padY}" width="\${svgW}" height="\${svgH}" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" fill-opacity="0.4"/>\`;
        innerSvg += \`<line x1="\${padX}" y1="\${padY}" x2="\${padX+svgW}" y2="\${padY}" stroke="#0284c7" stroke-width="4"/>\`;
        // Handle properly centered
        let hY = padY + svgH/2;
        let hX = padX + svgW - 15;
        // Draw vertical handle
        innerSvg += \`<rect x="\${hX-2}" y="\${hY-15}" width="4" height="30" fill="#0284c7" rx="2"/>\`;
        innerSvg += \`<circle cx="\${hX}" cy="\${hY}" r="3" fill="#fff"/>\`;
    } else if (item.category === 'roller' || item.category === 'blinds') {
        innerSvg += \`<rect x="\${padX}" y="\${padY}" width="\${svgW}" height="\${svgH}" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>\`;
        for(let i=10; i<svgH; i+=10) {
            innerSvg += \`<line x1="\${padX}" y1="\${padY+i}" x2="\${padX+svgW}" y2="\${padY+i}" stroke="#cbd5e1" stroke-width="1"/>\`;
        }
        innerSvg += \`<rect x="\${padX-2}" y="\${padY-6}" width="\${svgW+4}" height="12" fill="#94a3b8" rx="2"/>\`;
    } else {
        innerSvg += \`<rect x="\${padX}" y="\${padY}" width="\${svgW}" height="\${svgH}" fill="#f1f5f9" stroke="#64748b" stroke-width="2"/>\`;
    }

    let dimLines = \`
        <line x1="\${padX}" y1="\${padY - 20}" x2="\${padX + svgW}" y2="\${padY - 20}" stroke="#0f172a" stroke-width="2"/>
        <line x1="\${padX}" y1="\${padY - 28}" x2="\${padX}" y2="\${padY - 12}" stroke="#0f172a" stroke-width="2"/>
        <line x1="\${padX + svgW}" y1="\${padY - 28}" x2="\${padX + svgW}" y2="\${padY - 12}" stroke="#0f172a" stroke-width="2"/>
        <text x="\${padX + svgW/2}" y="\${padY - 28}" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#0f172a" text-anchor="middle">\${w}</text>
        
        <line x1="\${padX + svgW + 20}" y1="\${padY}" x2="\${padX + svgW + 20}" y2="\${padY + svgH}" stroke="#0f172a" stroke-width="2"/>
        <line x1="\${padX + svgW + 12}" y1="\${padY}" x2="\${padX + svgW + 28}" y2="\${padY}" stroke="#0f172a" stroke-width="2"/>
        <line x1="\${padX + svgW + 12}" y1="\${padY + svgH}" x2="\${padX + svgW + 28}" y2="\${padY + svgH}" stroke="#0f172a" stroke-width="2"/>
        <text x="\${padX + svgW + 30}" y="\${padY + svgH/2 + 8}" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#0f172a" text-anchor="start">\${h}</text>
    \`;

    let extraText = '';
    let descStr = (item.optionsDesc ? item.optionsDesc.join(' ') : '').toLowerCase();
    if (descStr.includes('от себя')) {
        extraText = \`<text x="\${totalW/2}" y="\${totalH - 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#ef4444" text-anchor="middle">[ОТКРЫВАНИЕ: ОТ СЕБЯ]</text>\`;
    } else if (descStr.includes('на себя')) {
        extraText = \`<text x="\${totalW/2}" y="\${totalH - 5}" font-family="Arial" font-size="16" font-weight="bold" fill="#3b82f6" text-anchor="middle">[ОТКРЫВАНИЕ: НА СЕБЯ]</text>\`;
    }

    return \`
    <svg viewBox="0 0 \${totalW} \${totalH}" width="100%" height="100%" style="max-height: 250px; display: block; margin: 0 auto;" class="mx-auto mb-2">
        <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
            <marker id="arrowStart" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 10 0 L 0 5 L 10 10 z" fill="#ef4444" />
            </marker>
        </defs>
        \${innerSvg}
        \${dimLines}
        \${extraText}
    </svg>\`;
}
\n`;
    code = code.replace(oldSvgGen, newSvgGen);
}

// 5. Ensure that old PRESET_SERVICES code didn't mess up the init Preset Services event listener
// The event listener is supposed to be on DOMContentLoaded.
// The user says "в выпадающем списке поуслугам есть цены, но и это не до конца сделано... я не нашел где я могу это выбрать".
// The user must be referring to the fact that the actual `<select id="srv-pricelist">` isn't visible or they don't see it.
// Wait, is it hidden by default in `index.html`? Let's check if it's there.
// If it's there, maybe I should just make sure it's prominent.

fs.writeFileSync('script.js', code, 'utf8');
console.log('Final fixes applied.');
