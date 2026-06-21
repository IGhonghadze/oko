function drawSketch(canvasId, item) {
    let canvas = document.getElementById(canvasId); if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let cSize = 200, padding = 40, mw = cSize - padding * 2, mh = cSize - padding * 2;
    let drawW = item.category === 'sill' ? item.h : item.w;
    let drawH = item.category === 'sill' ? item.w : item.h;
    let ratio = drawW / drawH, w = 0, h = 0;
    if (ratio > 1) { w = mw; h = mw / ratio; } else { h = mh; w = mh * ratio; }
    if (w < 40) w = 40; if (h < 40) h = 40;
    let x = (cSize - w) / 2, y = (cSize - h) / 2;
    ctx.clearRect(0, 0, cSize, cSize);
    ctx.lineWidth = 4; ctx.strokeStyle = '#000000';

    if (item.category === 'glass') {
        ctx.fillStyle = '#f0f9ff'; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
        ctx.lineWidth = 2; ctx.strokeStyle = '#000000'; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
        ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = w / 4;
        ctx.moveTo(x + w * 0.2, y + h - 10); ctx.lineTo(x + w - 10, y + h * 0.2); ctx.stroke();
        let totalCross = (item.layoutCross || 0) + (item.layoutEnd || 0);
        if (totalCross > 0) {
            ctx.lineWidth = 2;
            let layoutColor = '#c8a84e';
            if (item.layoutName) { let ln = item.layoutName.toLowerCase(); if (ln.includes('╨║╨╛╤А╨╕╤З╨╜╨╡╨▓')) layoutColor = '#6b4226'; else if (ln.includes('╨▒╨╡╨╗')) layoutColor = '#b0b0b0'; else if (ln.includes('╨╖╨╛╨╗╨╛╤В')) layoutColor = '#c8a84e'; }
            ctx.strokeStyle = layoutColor;
            let innerX = x + 8, innerY = y + 8, innerW = w - 16, innerH = h - 16;
            let cols = item.layoutCross + 1, rows = item.layoutCross + 1;
            for (let i = 1; i < cols; i++) { ctx.beginPath(); ctx.moveTo(innerX + (innerW / cols) * i, innerY); ctx.lineTo(innerX + (innerW / cols) * i, innerY + innerH); ctx.stroke(); }
            for (let j = 1; j < rows; j++) { ctx.beginPath(); ctx.moveTo(innerX, innerY + (innerH / rows) * j); ctx.lineTo(innerX + innerW, innerY + (innerH / rows) * j); ctx.stroke(); }
        }
    } else if (item.category === 'frameless') {
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(x, y, w, h);
        ctx.lineWidth = 4; ctx.strokeStyle = '#000000'; ctx.strokeRect(x, y, w, h);
        let match = item.shape.match(/╨Я╨░╨╜╨╡╨╗╨╡╨╣: (\d+)/); let pCount = match ? parseInt(match[1]) : 1;
        if (pCount > 1) {
            let pWidth = w / pCount;
            if (item.doorPanel && item.doorPanel !== 'none') {
                let doorIdx = parseInt(item.doorPanel) - 1; let dLeft = x + doorIdx * pWidth;
                ctx.fillStyle = '#e2e8f0'; ctx.fillRect(dLeft, y, pWidth, h);
                ctx.beginPath(); ctx.lineWidth = 1; ctx.strokeStyle = '#475569';
                if (item.doorDir === 'right') { ctx.moveTo(dLeft, y); ctx.lineTo(dLeft + pWidth, y + h / 2); ctx.lineTo(dLeft, y + h); }
                else { ctx.moveTo(dLeft + pWidth, y); ctx.lineTo(dLeft, y + h / 2); ctx.lineTo(dLeft + pWidth, y + h); }
                ctx.stroke();
            }
            ctx.lineWidth = 2; ctx.strokeStyle = '#000000';
            for (let i = 1; i < pCount; i++) { ctx.beginPath(); ctx.moveTo(x + i * pWidth, y); ctx.lineTo(x + i * pWidth, y + h); ctx.stroke(); }
        }
    } else if (item.category === 'net') {
        let isPleated = item.type && item.type.toLowerCase().includes('╨┐╨╗╨╕╤Б╤Б');
        if (isPleated) {
            // ╨а╨╕╤Б╤Г╨╡╨╝ ╤А╨░╨╖╨┤╨▓╨╕╨╢╨╜╤Г╤О ╨┐╨╗╨╕╤Б╤Б╨╡-╤Б╨╡╤В╨║╤Г
            ctx.fillStyle = '#fff9f0'; ctx.fillRect(x, y, w, h);
            ctx.lineWidth = 5; ctx.strokeStyle = '#92400e'; ctx.strokeRect(x, y, w, h);
            // ╨Т╨╡╤А╤Е╨╜╤П╤П ╨╜╨░╨┐╤А╨░╨▓╨╗╤П╤О╤Й╨░╤П ╤И╨╕╨╜╨░
            ctx.lineWidth = 6; ctx.strokeStyle = '#92400e';
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
            ctx.lineWidth = 6; ctx.strokeStyle = '#92400e';
            ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
            // ╨Я╨╛╨╗╨╛╤В╨╜╨╛ ╤Б╨╡╤В╨║╨╕ (╨│╨╛╤Д╤А╨╡)
            ctx.lineWidth = 0.8; ctx.strokeStyle = '#b45309';
            let plStep = 6;
            for (let i = x + plStep; i < x + w; i += plStep) { ctx.beginPath(); ctx.moveTo(i, y + 4); ctx.lineTo(i, y + h - 4); ctx.stroke(); }
            for (let j = y + plStep; j < y + h; j += plStep) { ctx.beginPath(); ctx.moveTo(x + 4, j); ctx.lineTo(x + w - 4, j); ctx.stroke(); }
            // ╨Ю╨┐╤А╨╡╨┤╨╡╨╗╤П╨╡╨╝ ╨╜╨░╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╨╡ ╨╕╨╖ optionsDesc
            let dirText = 'тЖТ'; // default ╨▓╨┐╤А╨░╨▓╨╛
            if (item.optionsDesc) {
                let dirEntry = item.optionsDesc.find(d => d && d.includes('╨б╤В╨▓╨╛╤А╨║╨░:'));
                if (dirEntry) {
                    if (dirEntry.includes('╨Т╨╗╨╡╨▓╨╛')) dirText = 'тЖР';
                    else if (dirEntry.includes('╤Ж╨╡╨╜╤В╤А')) dirText = 'тЖРтЖТ';
                    else dirText = 'тЖТ';
                }
            }
            // ╨Я╨╛╨╗╨╛╤Б╨░ ╤Б ╤Е╨╛╨╝╤Г╤В╨╛╨╝
            let handleX = dirText === 'тЖР' ? x + 10 : x + w - 10;
            ctx.lineWidth = 4; ctx.strokeStyle = '#7c3aed';
            ctx.beginPath(); ctx.moveTo(handleX, y + h * 0.25); ctx.lineTo(handleX, y + h * 0.75); ctx.stroke();
            ctx.beginPath(); ctx.arc(handleX, y + h * 0.5, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#7c3aed'; ctx.fill();
            // ╨б╤В╤А╨╡╨╗╨║╨░ ╨╜╨░╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╤П
            let arrowY = y + h / 2;
            ctx.lineWidth = 2.5; ctx.strokeStyle = '#1d4ed8'; ctx.font = 'bold 22px sans-serif';
            ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'center';
            ctx.fillText(dirText, x + w / 2, arrowY + 8);
            // ╨Э╨░╨┤╨┐╨╕╤Б╤М
            ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = '#92400e'; ctx.textAlign = 'center';
            ctx.fillText('╨Я╨Ы╨Ш╨б╨б╨Х', x + w / 2, y - 6);
        } else {
            ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
            ctx.lineWidth = 6; ctx.strokeStyle = '#000000'; ctx.strokeRect(x, y, w, h);
            ctx.lineWidth = 1; ctx.strokeStyle = '#000000'; let step = 8;
            for (let i = x + step; i < x + w; i += step) { ctx.beginPath(); ctx.moveTo(i, y); ctx.lineTo(i, y + h); ctx.stroke(); }
            for (let j = y + step; j < y + h; j += step) { ctx.beginPath(); ctx.moveTo(x, j); ctx.lineTo(x + w, j); ctx.stroke(); }
            if (item.h >= 1000) { ctx.beginPath(); ctx.lineWidth = 6; ctx.strokeStyle = '#000000'; ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke(); }
        }
    } else if (item.category === 'sill') {
        ctx.fillStyle = '#fef3c7'; ctx.fillRect(x, y, w, h);
        ctx.lineWidth = 4; ctx.strokeStyle = '#000000'; ctx.strokeRect(x, y, w, h);
        ctx.lineWidth = 1; ctx.strokeStyle = '#d4a574'; let grainStep = 12;
        for (let j = y + grainStep; j < y + h; j += grainStep) { ctx.beginPath(); ctx.moveTo(x + 4, j); ctx.lineTo(x + w - 4, j); ctx.stroke(); }
    } else if (item.category === 'custom') {
        if (item.w > 0 && item.h > 0) {
            // ╨а╨╕╤Б╤Г╨╡╨╝ ╨┐╤А╨╛╨┐╨╛╤А╤Ж╨╕╨╛╨╜╨░╨╗╤М╨╜╤Л╨╣ ╨┐╤А╤П╨╝╨╛╤Г╨│╨╛╨╗╤М╨╜╨╕╨║ ╨┤╨╗╤П ╨┐╤А╨╛╨╕╨╖╨▓╨╛╨╗╤М╨╜╨╛╨╣ ╨┐╨╛╨╖╨╕╤Ж╨╕╨╕
            ctx.fillStyle = '#f1f5f9'; ctx.fillRect(x, y, w, h);
            ctx.lineWidth = 4; ctx.strokeStyle = '#475569'; ctx.strokeRect(x, y, w, h);
            // ╨и╤В╤А╨╕╤Е╨╛╨▓╨║╨░ (╨║╨╛╤Б╤Л╨╡ ╨╗╨╕╨╜╨╕╨╕)
            ctx.lineWidth = 0.7; ctx.strokeStyle = '#cbd5e1';
            let dStep = 14;
            for (let d = -(w + h); d < w + h; d += dStep) {
                ctx.beginPath();
                ctx.moveTo(x + Math.max(0, d), y + Math.max(0, -d));
                ctx.lineTo(x + Math.min(w, d + h), y + Math.max(0, d + h - w));
                ctx.stroke();
            }
            // ╨Ш╨║╨╛╨╜╨║╨░ тАФ ╤И╨╡╤Б╤В╨╡╤А╤С╨╜╨║╨░ ╨║╨░╨║ ╤Б╨╕╨╝╨▓╨╛╨╗ ┬л╨╕╨╖╨┤╨╡╨╗╨╕╨╡┬╗
            ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center';
            ctx.fillText('тЪЩ', x + w / 2, y + h / 2 + 8);
        } else {
            // ╨Э╨╡╤В ╤А╨░╨╖╨╝╨╡╤А╨╛╨▓ тАФ ╤А╨╕╤Б╤Г╨╡╨╝ ╨╖╨░╨│╨╗╤Г╤И╨║╤Г
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(x, y, w, h);
            ctx.lineWidth = 2; ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([4, 4]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
            ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#cbd5e1'; ctx.textAlign = 'center';
            ctx.fillText('?', x + w / 2, y + h / 2 + 10);
            ctx.font = '9px sans-serif'; ctx.fillStyle = '#94a3b8';
            ctx.fillText('╨╜╨╡╤В ╤А╨░╨╖╨╝╨╡╤А╨╛╨▓', x + w / 2, y + h - 6);
        }
    } else if (item.category === 'shower') {
        ctx.clearRect(0, 0, cSize, cSize);
        let pad = 30, drawArea = cSize - pad * 2, cfg = item.showerConfig, panels = item.showerPanels || [], totalH = item.h || 2000;
        let wallColor = '#64748b', glassColor = '#93c5fd', glassFill = '#dbeafe', doorColor = '#60a5fa', handleColor = '#1e293b';
        ctx.lineWidth = 2;
        if (cfg === 'partition') {
            let gw = panels[0] ? panels[0].w : 800;
            ctx.fillStyle = wallColor; ctx.fillRect(pad, pad, 8, drawArea);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad, drawArea * 0.5, drawArea);
            ctx.strokeStyle = glassColor; ctx.lineWidth = 3; ctx.strokeRect(pad + 8, pad, drawArea * 0.5, drawArea);
            ctx.fillStyle = '#334155'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(gw + ' ╨╝╨╝', pad + 8 + drawArea * 0.25, cSize - 10);
            ctx.save(); ctx.translate(cSize - 12, pad + drawArea / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(totalH + ' ╨╝╨╝', 0, 0); ctx.restore();
        } else if (cfg === 'partition_door') {
            let pw1 = panels[0] ? panels[0].w : 500, pw2 = panels[1] ? panels[1].w : 600, totalPW = pw1 + pw2;
            let glassW1 = (pw1 / totalPW) * drawArea * 0.6, doorW = (pw2 / totalPW) * drawArea * 0.6;
            ctx.fillStyle = wallColor; ctx.fillRect(pad, pad, 8, drawArea);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad, glassW1, drawArea);
            ctx.strokeStyle = glassColor; ctx.lineWidth = 3; ctx.strokeRect(pad + 8, pad, glassW1, drawArea);
            let doorX = pad + 8 + glassW1;
            ctx.fillStyle = '#eff6ff'; ctx.fillRect(doorX, pad, doorW, drawArea);
            ctx.strokeStyle = doorColor; ctx.lineWidth = 2; ctx.strokeRect(doorX, pad, doorW, drawArea);
            ctx.beginPath(); ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
            ctx.arc(doorX, pad + drawArea, doorW, -Math.PI / 2, 0); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = handleColor; ctx.beginPath(); ctx.arc(doorX + doorW - 8, pad + drawArea / 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#334155'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(pw1 + '', pad + 8 + glassW1 / 2, cSize - 8); ctx.fillText(pw2 + '', doorX + doorW / 2, cSize - 8);
        } else if (cfg === 'corner') {
            let pw1 = panels[0] ? panels[0].w : 800, pw2 = panels[1] ? panels[1].w : 800, total = pw1 + pw2;
            let frontW = (pw1 / total) * drawArea * 0.8, sideH = (pw2 / total) * drawArea * 0.8;
            ctx.fillStyle = wallColor; ctx.fillRect(pad, pad, 8, drawArea); ctx.fillRect(pad, pad + drawArea - 8, drawArea, 8);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad, frontW, drawArea - 8);
            ctx.strokeStyle = glassColor; ctx.lineWidth = 3; ctx.strokeRect(pad + 8, pad, frontW, drawArea - 8);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8 + frontW, pad + drawArea - 8 - sideH, drawArea - 8 - frontW, sideH);
            ctx.strokeStyle = glassColor; ctx.strokeRect(pad + 8 + frontW, pad + drawArea - 8 - sideH, drawArea - 8 - frontW, sideH);
            ctx.fillStyle = '#334155'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(pw1 + '', pad + 8 + frontW / 2, pad - 5);
            ctx.save(); ctx.translate(cSize - 8, pad + drawArea - sideH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(pw2 + '', 0, 0); ctx.restore();
        } else if (cfg === 'corner_door') {
            let pw1 = panels[0] ? panels[0].w : 400, pw2 = panels[1] ? panels[1].w : 600, pw3 = panels[2] ? panels[2].w : 800;
            ctx.fillStyle = wallColor; ctx.fillRect(pad, pad, 8, drawArea); ctx.fillRect(pad, pad + drawArea - 8, drawArea, 8);
            let frontTotal = drawArea * 0.7, f1W = (pw1 / (pw1 + pw2)) * frontTotal, dW = (pw2 / (pw1 + pw2)) * frontTotal;
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad, f1W, drawArea - 8);
            ctx.strokeStyle = glassColor; ctx.lineWidth = 3; ctx.strokeRect(pad + 8, pad, f1W, drawArea - 8);
            let doorX = pad + 8 + f1W;
            ctx.fillStyle = '#eff6ff'; ctx.fillRect(doorX, pad, dW, drawArea - 8);
            ctx.strokeStyle = doorColor; ctx.lineWidth = 2; ctx.strokeRect(doorX, pad, dW, drawArea - 8);
            ctx.fillStyle = handleColor; ctx.beginPath(); ctx.arc(doorX + dW - 6, pad + (drawArea - 8) / 2, 3, 0, Math.PI * 2); ctx.fill();
            let sideW = drawArea * 0.25;
            ctx.fillStyle = glassFill; ctx.fillRect(doorX + dW, pad + drawArea - 8 - sideW, drawArea - 8 - f1W - dW, sideW);
            ctx.strokeStyle = glassColor; ctx.lineWidth = 3; ctx.strokeRect(doorX + dW, pad + drawArea - 8 - sideW, drawArea - 8 - f1W - dW, sideW);
            ctx.fillStyle = '#334155'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(pw1 + '', pad + 8 + f1W / 2, pad - 4); ctx.fillText(pw2 + 'ЁЯЪк', doorX + dW / 2, pad - 4);
        } else if (cfg === 'u_shape') {
            let pw1 = panels[0] ? panels[0].w : 600, pw2 = panels[1] ? panels[1].w : 1200, pw3 = panels[2] ? panels[2].w : 600;
            ctx.fillStyle = wallColor; ctx.fillRect(pad, pad, 8, drawArea); ctx.fillRect(pad + drawArea - 8, pad, 8, drawArea); ctx.fillRect(pad, pad, drawArea, 8);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad + 8, drawArea * 0.15, drawArea - 8);
            ctx.strokeStyle = glassColor; ctx.lineWidth = 3; ctx.strokeRect(pad + 8, pad + 8, drawArea * 0.15, drawArea - 8);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad + 8, drawArea - 16, drawArea * 0.12);
            ctx.strokeStyle = glassColor; ctx.strokeRect(pad + 8, pad + 8, drawArea - 16, drawArea * 0.12);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + drawArea - 8 - drawArea * 0.15, pad + 8, drawArea * 0.15, drawArea - 8);
            ctx.strokeStyle = glassColor; ctx.strokeRect(pad + drawArea - 8 - drawArea * 0.15, pad + 8, drawArea * 0.15, drawArea - 8);
            ctx.fillStyle = '#334155'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(pw1, pad + 8 + drawArea * 0.075, cSize - 8); ctx.fillText(pw2, pad + drawArea / 2, pad + 8 + drawArea * 0.06 + 12); ctx.fillText(pw3, pad + drawArea - 8 - drawArea * 0.075, cSize - 8);
        } else if (cfg === 'u_shape_door') {
            let pw1 = panels[0] ? panels[0].w : 600, pw2 = panels[1] ? panels[1].w : 1200, pw3 = panels[2] ? panels[2].w : 400, pw4 = panels[3] ? panels[3].w : 500;
            ctx.fillStyle = wallColor; ctx.fillRect(pad, pad, 8, drawArea); ctx.fillRect(pad + drawArea - 8, pad, 8, drawArea); ctx.fillRect(pad, pad, drawArea, 8);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad + 8, drawArea * 0.15, drawArea - 8);
            ctx.strokeStyle = glassColor; ctx.lineWidth = 3; ctx.strokeRect(pad + 8, pad + 8, drawArea * 0.15, drawArea - 8);
            ctx.fillStyle = glassFill; ctx.fillRect(pad + 8, pad + 8, drawArea - 16, drawArea * 0.12);
            ctx.strokeStyle = glassColor; ctx.strokeRect(pad + 8, pad + 8, drawArea - 16, drawArea * 0.12);
            let rightGlassH = drawArea * 0.4;
            ctx.fillStyle = glassFill; ctx.fillRect(pad + drawArea - 8 - drawArea * 0.15, pad + 8, drawArea * 0.15, rightGlassH);
            ctx.strokeStyle = glassColor; ctx.strokeRect(pad + drawArea - 8 - drawArea * 0.15, pad + 8, drawArea * 0.15, rightGlassH);
            let doorY = pad + 8 + rightGlassH, doorH = drawArea - 8 - rightGlassH;
            ctx.fillStyle = '#eff6ff'; ctx.fillRect(pad + drawArea - 8 - drawArea * 0.15, doorY, drawArea * 0.15, doorH);
            ctx.strokeStyle = doorColor; ctx.lineWidth = 2; ctx.strokeRect(pad + drawArea - 8 - drawArea * 0.15, doorY, drawArea * 0.15, doorH);
            ctx.fillStyle = handleColor; ctx.beginPath(); ctx.arc(pad + drawArea - 8 - drawArea * 0.075, doorY + doorH / 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#334155'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(pw1, pad + 8 + drawArea * 0.075, cSize - 6); ctx.fillText(pw2, pad + drawArea / 2, pad + 8 + drawArea * 0.06 + 11);
        }
        return; // Skip standard dimensions for shower
    }

    // Draw Dimensions (Bottom = W, Right = H)
    ctx.fillStyle = '#000000'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    let bottomLabel = item.category === 'sill' ? item.h + ' ╨╝╨╝' : item.w + ' ╨╝╨╝';
    ctx.fillText(bottomLabel, x + w / 2, y + h + 28);
    let rightLabel = item.category === 'sill' ? item.w + ' ╨╝╨╝' : item.h + ' ╨╝╨╝';
    ctx.save(); ctx.translate(x + w + 22, y + h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(rightLabel, 0, 0); ctx.restore();
    ctx.beginPath(); ctx.lineWidth = 1; ctx.strokeStyle = '#000000';
    ctx.moveTo(x + w + 4, y); ctx.lineTo(x + w + 16, y);
    ctx.moveTo(x + w + 4, y + h); ctx.lineTo(x + w + 16, y + h);
    ctx.moveTo(x + w + 10, y); ctx.lineTo(x + w + 10, y + h);
    ctx.stroke();
}