const fs = require('fs');

try {
    let content = fs.readFileSync('script.js', 'utf8');

    // 1. Find and replace the showProposal lines where sketchHtml is generated.
    // In original code:
    // let sketchHtml = it.customSvg || (it.category === 'slope_profile' ? '<div class="text-3xl text-slate-300 text-center">—</div>' : `<canvas id="${canvasId}" class="sketch-container mx-auto" width="200" height="200" style="width: 100px; height: 100px;"></canvas>`);
    
    // We will use a regex to match it.
    let regexSketchHtml = /let sketchHtml = it\.customSvg \|\|.*?<\/canvas>\`\);/g;
    content = content.replace(regexSketchHtml, "let sketchHtml = it.customSvg || generateSvgSketch(it);");

    // 2. Remove the setTimeout that calls drawSketch inside showProposal
    // setTimeout(() => { ITEMS.forEach(it => drawSketch(`sketch-${it.id}`, it)); }, 50);
    let regexTimeout = /setTimeout\(\(\) => \{ ITEMS\.forEach\(it => drawSketch\(\`sketch-\$\{it\.id\}\`, it\)\); \}, 50\);/g;
    content = content.replace(regexTimeout, "// (sketches are now SVG)");

    // 3. Remove the entire drawSketch function
    // It starts with // --- SKETCH SVG GENERATOR --- and ends before // --- SETTINGS AND PRICING LOGIC ---
    let startIdx = content.indexOf('// --- SKETCH SVG GENERATOR ---');
    let endIdx = content.indexOf('// --- SETTINGS AND PRICING LOGIC ---');
    
    if (startIdx !== -1 && endIdx !== -1) {
        const svgFunction = `
// --- SKETCH SVG GENERATOR ---
function generateSvgSketch(item) {
    if (!item) return '';

    // Fixed viewBox for all items to guarantee consistent text sizes
    const VB_SIZE = 300;
    const padding = 50; 
    const maxDrawSize = VB_SIZE - padding * 2; 

    let innerSvg = '';
    let w = parseFloat(item.w) || 0;
    let h = parseFloat(item.h) || 0;
    if (item.category === 'sill') { w = parseFloat(item.h) || 0; h = parseFloat(item.w) || 0; }
    
    // Services and specific icons (no dimensions needed usually)
    let typeStr = (item.type || '').toLowerCase();
    let isIcon = false;
    let iconPath = '';
    let iconColor = '#475569';

    if (item.category === 'custom' || item.category === 'slope_profile' || item.category === 'services') {
        if (typeStr.includes('сварка') || typeStr.includes('свароч') || typeStr.includes('усилен')) {
            isIcon = true; iconColor = '#f59e0b';
            // Welding Mask / Spark
            iconPath = \`<path d="M12 2L2 22h20L12 2z" fill="\${iconColor}"/><path d="M12 8l-4 10h8l-4-10z" fill="#fff"/>\`;
        } else if (typeStr.includes('вынос') || typeStr.includes('балкон')) {
            isIcon = true; iconColor = '#3b82f6';
            // Balcony
            iconPath = \`<rect x="4" y="10" width="16" height="10" stroke="\${iconColor}" stroke-width="2" fill="none"/><path d="M4 10 L8 4 L16 4 L20 10" stroke="\${iconColor}" stroke-width="2" fill="none"/>\`;
        } else if (typeStr.includes('крыша') || typeStr.includes('кровл') || typeStr.includes('козырек')) {
            isIcon = true; iconColor = '#ef4444';
            // Roof
            iconPath = \`<path d="M2 12L12 3l10 9M5 12v8h14v-8" stroke="\${iconColor}" stroke-width="2" fill="none"/>\`;
        } else if (typeStr.includes('фурнитур') || typeStr.includes('ручк') || typeStr.includes('замок') || typeStr.includes('петл')) {
            isIcon = true; iconColor = '#8b5cf6';
            // Lock / Hardware
            iconPath = \`<rect x="6" y="10" width="12" height="10" rx="2" stroke="\${iconColor}" stroke-width="2" fill="none"/><path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="\${iconColor}" stroke-width="2" fill="none"/><circle cx="12" cy="15" r="1.5" fill="\${iconColor}"/>\`;
        } else if (typeStr.includes('резин') || typeStr.includes('уплотн')) {
            isIcon = true; iconColor = '#10b981';
            // Seal cross section
            iconPath = \`<circle cx="12" cy="12" r="8" stroke="\${iconColor}" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="\${iconColor}"/>\`;
        } else if (w === 0 && h === 0) {
            isIcon = true; iconColor = '#94a3b8';
            // Generic Service / Custom Box
            iconPath = \`<rect x="3" y="3" width="18" height="18" rx="2" stroke="\${iconColor}" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="\${iconColor}" stroke-width="2"/><line x1="9" y1="21" x2="9" y2="9" stroke="\${iconColor}" stroke-width="2"/>\`;
        }
    }

    if (isIcon) {
        return \`<svg viewBox="0 0 24 24" style="width: 100%; max-width: 60px; height: auto; display: block; margin: 0 auto;">\${iconPath}</svg>\`;
    }

    // Default dimensions to draw something
    let drawW = w || 1000;
    let drawH = h || 1000;

    let ratio = drawW / drawH;
    let svgW = maxDrawSize;
    let svgH = maxDrawSize;
    if (ratio > 1) {
        svgH = maxDrawSize / ratio;
    } else {
        svgW = maxDrawSize * ratio;
    }
    // Prevent squishing completely
    if (svgW < 40) svgW = 40;
    if (svgH < 40) svgH = 40;

    let x = (VB_SIZE - svgW) / 2 - 15; // Shift left a bit to make room for right text
    let y = (VB_SIZE - svgH) / 2 - 15;

    // Draw geometries based on category
    if (item.category === 'glass') {
        innerSvg += \`<rect x="\${x}" y="\${y}" width="\${svgW}" height="\${svgH}" fill="#f0f9ff" stroke="#1e293b" stroke-width="4"/>\`;
        innerSvg += \`<rect x="\${x+6}" y="\${y+6}" width="\${svgW-12}" height="\${svgH-12}" fill="none" stroke="#475569" stroke-width="2"/>\`;
        // Light glare
        innerSvg += \`<path d="M\${x + svgW*0.2} \${y + svgH - 10} L\${x + svgW - 10} \${y + svgH*0.2}" stroke="#ffffff" stroke-width="\${svgW/5}" stroke-opacity="0.6" fill="none"/>\`;
        
        let totalCross = (item.layoutCross || 0) + (item.layoutEnd || 0);
        if (totalCross > 0) {
            let cols = item.layoutCross + 1;
            let rows = item.layoutCross + 1;
            let layoutColor = '#c8a84e';
            if (item.layoutName) {
                let ln = item.layoutName.toLowerCase();
                if (ln.includes('коричнев')) layoutColor = '#6b4226';
                else if (ln.includes('бел')) layoutColor = '#e2e8f0';
            }
            let innerX = x + 8, innerY = y + 8, innerW = svgW - 16, innerH = svgH - 16;
            for (let i = 1; i < cols; i++) {
                let lx = innerX + (innerW / cols) * i;
                innerSvg += \`<line x1="\${lx}" y1="\${innerY}" x2="\${lx}" y2="\${innerY+innerH}" stroke="\${layoutColor}" stroke-width="3"/>\`;
            }
            for (let j = 1; j < rows; j++) {
                let ly = innerY + (innerH / rows) * j;
                innerSvg += \`<line x1="\${innerX}" y1="\${ly}" x2="\${innerX+innerW}" y2="\${ly}" stroke="\${layoutColor}" stroke-width="3"/>\`;
            }
        }
    } else if (item.category === 'frameless') {
        innerSvg += \`<rect x="\${x}" y="\${y}" width="\${svgW}" height="\${svgH}" fill="#f8fafc" stroke="#1e293b" stroke-width="4"/>\`;
        let match = (item.shape||'').match(/Панелей: (\\d+)/);
        let panels = match ? parseInt(match[1]) : 1;
        let pWidth = svgW / panels;
        
        if (panels > 1) {
            if (item.doorPanel && item.doorPanel !== 'none') {
                let doorIdx = parseInt(item.doorPanel) - 1;
                let dLeft = x + doorIdx * pWidth;
                innerSvg += \`<rect x="\${dLeft}" y="\${y}" width="\${pWidth}" height="\${svgH}" fill="#e2e8f0" />\`;
                let dir = item.doorDir === 'right' ? 'right' : 'left';
                if (dir === 'right') {
                    innerSvg += \`<path d="M\${dLeft} \${y} L\${dLeft+pWidth} \${y+svgH/2} L\${dLeft} \${y+svgH}" stroke="#64748b" stroke-width="1.5" fill="none"/>\`;
                } else {
                    innerSvg += \`<path d="M\${dLeft+pWidth} \${y} L\${dLeft} \${y+svgH/2} L\${dLeft+pWidth} \${y+svgH}" stroke="#64748b" stroke-width="1.5" fill="none"/>\`;
                }
            }
            for (let i = 1; i < panels; i++) {
                let lx = x + i * pWidth;
                innerSvg += \`<line x1="\${lx}" y1="\${y}" x2="\${lx}" y2="\${y+svgH}" stroke="#1e293b" stroke-width="2"/>\`;
            }
        }
    } else if (item.category === 'net') {
        innerSvg += \`<rect x="\${x}" y="\${y}" width="\${svgW}" height="\${svgH}" fill="#fff9f0" stroke="#92400e" stroke-width="6"/>\`;
        let isPleated = (item.type || '').toLowerCase().includes('плисс');
        if (isPleated) {
            let plStep = 8;
            for (let i = x + plStep; i < x + svgW; i += plStep) {
                innerSvg += \`<line x1="\${i}" y1="\${y+3}" x2="\${i}" y2="\${y+svgH-3}" stroke="#d6d3d1" stroke-width="1"/>\`;
            }
            for (let j = y + plStep; j < y + svgH; j += plStep) {
                innerSvg += \`<line x1="\${x+3}" y1="\${j}" x2="\${x+svgW-3}" y2="\${j}" stroke="#d6d3d1" stroke-width="1"/>\`;
            }
            let dirText = '→';
            if (item.optionsDesc) {
                let dirEntry = item.optionsDesc.find(d => d && d.includes('Створка:'));
                if (dirEntry) {
                    if (dirEntry.includes('Влево')) dirText = '←';
                    else if (dirEntry.includes('центр')) dirText = '←→';
                }
            }
            let handleX = dirText === '←' ? x + 15 : x + svgW - 15;
            innerSvg += \`<line x1="\${handleX}" y1="\${y+svgH*0.25}" x2="\${handleX}" y2="\${y+svgH*0.75}" stroke="#7c3aed" stroke-width="5"/>\`;
            innerSvg += \`<circle cx="\${handleX}" cy="\${y+svgH*0.5}" r="6" fill="#7c3aed"/>\`;
            innerSvg += \`<text x="\${x+svgW/2}" y="\${y+svgH/2+8}" font-family="Arial" font-size="28" font-weight="bold" fill="#1d4ed8" text-anchor="middle">\${dirText}</text>\`;
            innerSvg += \`<text x="\${x+svgW/2}" y="\${y-10}" font-family="Arial" font-size="14" font-weight="bold" fill="#92400e" text-anchor="middle">ПЛИССЕ</text>\`;
        } else {
            innerSvg += \`<rect x="\${x+6}" y="\${y+6}" width="\${svgW-12}" height="\${svgH-12}" fill="#ffffff" stroke="none"/>\`;
            let step = 12;
            for (let i = x + step; i < x + svgW; i += step) { innerSvg += \`<line x1="\${i}" y1="\${y}" x2="\${i}" y2="\${y+svgH}" stroke="#e5e7eb" stroke-width="1.5"/>\`; }
            for (let j = y + step; j < y + svgH; j += step) { innerSvg += \`<line x1="\${x}" y1="\${j}" x2="\${x+svgW}" y2="\${j}" stroke="#e5e7eb" stroke-width="1.5"/>\`; }
            if (h >= 1000) {
                innerSvg += \`<line x1="\${x}" y1="\${y+svgH/2}" x2="\${x+svgW}" y2="\${y+svgH/2}" stroke="#1e293b" stroke-width="6"/>\`;
            }
        }
    } else if (item.category === 'sill') {
        innerSvg += \`<rect x="\${x}" y="\${y}" width="\${svgW}" height="\${svgH}" fill="#fef3c7" stroke="#1e293b" stroke-width="4"/>\`;
        let grainStep = 16;
        for (let j = y + grainStep; j < y + svgH; j += grainStep) {
            innerSvg += \`<line x1="\${x+4}" y1="\${j}" x2="\${x+svgW-4}" y2="\${j}" stroke="#d4a574" stroke-width="1.5"/>\`;
        }
    } else if (item.category === 'shower') {
        let cfg = item.showerConfig || 'partition';
        innerSvg += \`<rect x="\${x}" y="\${y}" width="\${svgW}" height="\${svgH}" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" fill-opacity="0.5"/>\`;
        innerSvg += \`<line x1="\${x}" y1="\${y}" x2="\${x+svgW}" y2="\${y}" stroke="#64748b" stroke-width="6"/>\`; // Wall
        if (cfg.includes('corner') || cfg.includes('u_shape')) {
            innerSvg += \`<line x1="\${x}" y1="\${y}" x2="\${x}" y2="\${y+svgH}" stroke="#64748b" stroke-width="6"/>\`; // Corner wall
        }
        if (cfg.includes('door') || cfg.includes('sliding')) {
            innerSvg += \`<circle cx="\${x+svgW/2}" cy="\${y+svgH/2}" r="8" fill="#1e293b"/>\`; // Handle
            innerSvg += \`<path d="M\${x+svgW*0.4} \${y+svgH*0.4} L\${x+svgW*0.6} \${y+svgH*0.6}" stroke="#1e293b" stroke-width="3" fill="none"/>\`; // Door indication
        }
        innerSvg += \`<text x="\${x+svgW/2}" y="\${y+svgH/2+30}" font-family="Arial" font-size="16" font-weight="bold" fill="#0284c7" text-anchor="middle">ДУШЕВАЯ</text>\`;
    } else {
        // Custom with dimensions
        innerSvg += \`<rect x="\${x}" y="\${y}" width="\${svgW}" height="\${svgH}" fill="#f1f5f9" stroke="#475569" stroke-width="4"/>\`;
        let dStep = 20;
        for (let d = -(svgW + svgH); d < svgW + svgH; d += dStep) {
            let x1 = x + Math.max(0, d);
            let y1 = y + Math.max(0, -d);
            let x2 = x + Math.min(svgW, d + svgH);
            let y2 = y + Math.max(0, d + svgH - svgW);
            innerSvg += \`<line x1="\${x1}" y1="\${y1}" x2="\${x2}" y2="\${y2}" stroke="#cbd5e1" stroke-width="1.5"/>\`;
        }
        innerSvg += \`<text x="\${x+svgW/2}" y="\${y+svgH/2+10}" font-family="sans-serif" font-size="32" fill="#94a3b8" text-anchor="middle">⚙</text>\`;
    }

    // Dimensions labels (Very large & readable)
    let bottomLabel = w + ' мм';
    let rightLabel = h + ' мм';
    if (w > 0 && h > 0) {
        let fSize = 24; // Very large fixed font size!
        innerSvg += \`
            <text x="\${x + svgW/2}" y="\${y + svgH + 32}" font-family="Arial, sans-serif" font-size="\${fSize}" font-weight="900" fill="#0f172a" text-anchor="middle">\${bottomLabel}</text>
            <text x="\${x + svgW + 16}" y="\${y + svgH/2 + 8}" font-family="Arial, sans-serif" font-size="\${fSize}" font-weight="900" fill="#0f172a" text-anchor="start">\${rightLabel}</text>
            <path d="M\${x+svgW+4} \${y} L\${x+svgW+10} \${y} M\${x+svgW+4} \${y+svgH} L\${x+svgW+10} \${y+svgH} M\${x+svgW+7} \${y} L\${x+svgW+7} \${y+svgH}" stroke="#64748b" stroke-width="2" fill="none"/>
        \`;
    }

    return \`
    <svg viewBox="0 0 \${VB_SIZE} \${VB_SIZE}" style="width: 100%; max-width: 120px; height: auto; display: block; margin: 0 auto;">
        \${innerSvg}
    </svg>\`;
}
`;
        content = content.substring(0, startIdx) + svgFunction + '\n\n' + content.substring(endIdx);
    } else {
        console.log("Could not find drawSketch bounds!");
    }

    fs.writeFileSync('script.js', content, 'utf8');
    console.log("SUCCESS!");

} catch (e) {
    console.error(e);
}
