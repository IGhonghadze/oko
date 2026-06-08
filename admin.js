// ==========================================
// Oko Admin Panel (B2B SaaS Pricing)
// ==========================================

const ADMIN_PIN = '4747';

function requirePin(actionName, callback) {
    const enteredPin = prompt(`Для выполнения действия "${actionName}" введите PIN-код (4747):`);
    if (enteredPin === ADMIN_PIN) {
        callback();
    } else if (enteredPin !== null) {
        alert('Неверный PIN-код!');
    }
}

function openAdminPanel() {
    document.getElementById('app').style.display = 'none';
    const archiveScreen = document.getElementById('archive-screen');
    if (archiveScreen) archiveScreen.style.display = 'none';
    document.getElementById('admin-screen').style.display = 'block';
    
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
    
    // Ensure new arrays exist in Oko_User_Prices
    if (!Oko_User_Prices.sandwiches) Oko_User_Prices.sandwiches = [{ name: 'Сендвич 24мм Белый', price: 1500 }];
    if (!Oko_User_Prices.hardware) Oko_User_Prices.hardware = [{ name: 'Roto NX', price: 2500 }];
    if (!Oko_User_Prices.rollers) Oko_User_Prices.rollers = [{ name: 'Alutech 39', price: 3000 }];
    if (!Oko_User_Prices.salinox) Oko_User_Prices.salinox = [{ name: 'Salinox F3', price: 12000 }];
    
    renderAllAdminTabs();
    switchAdminTab('tab-admin-glasses');
}

function closeAdminPanel() {
    document.getElementById('admin-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    if (typeof renderCart === 'function') renderCart();
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-brand-primary', 'text-white', 'shadow-md');
        btn.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-50');
    });

    const activeBtn = document.querySelector(`.admin-tab-btn[data-target="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-slate-600', 'hover:bg-slate-50');
        activeBtn.classList.add('bg-brand-primary', 'text-white', 'shadow-md');
    }
}

// --- RENDERERS ---

function renderAllAdminTabs() {
    renderAdminGlasses();
    renderAdminLayouts();
    renderAdminShapes();
    renderAdminNets();
    renderAdminSills();
    renderAdminSlopes();
    renderAdminHardware();
    renderAdminSandwiches();
    renderAdminMount();
    renderAdminServices();
    if (typeof renderAdminBrand === 'function') renderAdminBrand();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function createRowInput(idPrefix, idx, obj, nameKey = 'name', priceKey = 'price', priceLabel = '₽', deleteAction = '') {
    return `
    <div class="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-3">
        <input type="text" class="flex-1 bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-0 text-sm font-medium px-3 py-2 rounded" id="${idPrefix}-name-${idx}" value="${obj[nameKey]}">
        <div class="flex items-center gap-2">
            <input type="number" class="w-24 p-2 border border-slate-200 rounded text-sm text-right bg-slate-50" id="${idPrefix}-price-${idx}" value="${obj[priceKey]}">
            <span class="text-xs text-slate-500 font-bold">${priceLabel}</span>
            <button onclick="${deleteAction}" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Удалить">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    </div>`;
}

function renderAdminGlasses() {
    const container = document.getElementById('admin-glasses-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    Oko_User_Prices.glasses.forEach((g, idx) => {
        html += createRowInput('adm-glass', idx, g, 'name', 'price', '₽/м²', `deleteAdminGlass(${idx})`);
    });
    html += `</div>
    <button onclick="addAdminGlass()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-slate-200 shadow-sm">
        <i data-lucide="plus" class="w-4 h-4"></i> Добавить стекло
    </button>`;
    container.innerHTML = html;
}

function deleteAdminGlass(idx) {
    requirePin('Удалить стекло', () => {
        Oko_User_Prices.glasses.splice(idx, 1);
        renderAdminGlasses();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function addAdminGlass() {
    requirePin('Добавить стекло', () => {
        Oko_User_Prices.glasses.push({ name: 'Новое стекло', price: 0 });
        renderAdminGlasses();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function renderAdminLayouts() {
    const container = document.getElementById('admin-layouts-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    Oko_User_Prices.layouts.forEach((g, idx) => {
        html += createRowInput('adm-layout', idx, g, 'name', 'price', '₽/м.п.', `deleteAdminLayout(${idx})`);
    });
    html += `</div>
    <button onclick="addAdminLayout()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm">
        <i data-lucide="plus" class="w-4 h-4"></i> Добавить раскладку
    </button>`;
    container.innerHTML = html;
}

function deleteAdminLayout(idx) { requirePin('Удалить раскладку', () => { Oko_User_Prices.layouts.splice(idx, 1); renderAdminLayouts(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminLayout() { requirePin('Добавить раскладку', () => { Oko_User_Prices.layouts.push({ name: 'Новая раскладка', price: 0 }); renderAdminLayouts(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminShapes() {
    const container = document.getElementById('admin-shapes-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    Oko_User_Prices.shapes.forEach((s, idx) => {
        html += createRowInput('adm-shape', idx, s, 'name', 'markup', 'Коэфф.', `deleteAdminShape(${idx})`);
    });
    html += `</div>
    <button onclick="addAdminShape()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm">
        <i data-lucide="plus" class="w-4 h-4"></i> Добавить форму
    </button>`;
    container.innerHTML = html;
}

function deleteAdminShape(idx) { requirePin('Удалить форму', () => { Oko_User_Prices.shapes.splice(idx, 1); renderAdminShapes(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminShape() { requirePin('Добавить форму', () => { Oko_User_Prices.shapes.push({ name: 'Новая форма', markup: 1.0 }); renderAdminShapes(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminNets() {
    const container = document.getElementById('admin-nets-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    Oko_User_Prices.nets.forEach((n, idx) => {
        html += `
        <div class="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2 relative">
            <button onclick="deleteAdminNet(${idx})" class="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Удалить"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            <input type="text" class="w-[85%] bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-0 text-sm font-bold px-3 py-1.5 rounded" id="adm-net-name-${idx}" value="${n.name}">
            <div class="flex items-center justify-between gap-2 mt-1">
                <span class="text-xs text-slate-500">Мин. цена:</span>
                <input type="number" class="w-24 p-1.5 border border-slate-200 rounded text-sm text-right bg-slate-50" id="adm-net-min-${idx}" value="${n.price_min}">
            </div>
            <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-slate-500">Цена м²:</span>
                <input type="number" class="w-24 p-1.5 border border-slate-200 rounded text-sm text-right bg-slate-50" id="adm-net-sqm-${idx}" value="${n.price_sqm}">
            </div>
        </div>`;
    });
    html += `</div>
    <button onclick="addAdminNet()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm">
        <i data-lucide="plus" class="w-4 h-4"></i> Добавить москитную сетку
    </button>`;
    container.innerHTML = html;
}

function deleteAdminNet(idx) { requirePin('Удалить сетку', () => { Oko_User_Prices.nets.splice(idx, 1); renderAdminNets(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminNet() { requirePin('Добавить сетку', () => { Oko_User_Prices.nets.push({ name: 'Новая сетка', price_min: 0, price_sqm: 0 }); renderAdminNets(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminSills() {
    const container = document.getElementById('admin-sills-container');
    if (!container) return;
    let html = `<div class="space-y-6">`;
    Oko_User_Prices.sills.forEach((brand, bIdx) => {
        html += `
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
            <button onclick="deleteAdminSillBrand(${bIdx})" class="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors" title="Удалить бренд"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            <h4 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <i data-lucide="box" class="w-5 h-5 text-brand-primary"></i> Бренд: <input type="text" class="bg-white border border-slate-300 rounded px-3 py-1.5 font-bold" id="adm-sill-bname-${bIdx}" value="${brand.brand}">
            </h4>
            <div class="space-y-4">`;
        brand.groups.forEach((grp, gIdx) => {
            html += `
                <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                    <button onclick="deleteAdminSillGroup(${bIdx}, ${gIdx})" class="absolute top-3 right-3 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Удалить группу"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    <input type="text" class="w-[85%] bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-bold mb-3" id="adm-sill-gname-${bIdx}-${gIdx}" value="${grp.name}">
                    <div class="flex flex-wrap gap-4 mb-3">
                        <div class="flex items-center gap-2"><span class="text-xs text-slate-500 font-bold">Заглушка:</span><input type="number" class="w-20 p-1 border border-slate-300 rounded text-sm bg-slate-50" id="adm-sill-cap-${bIdx}-${gIdx}" value="${grp.cap}"></div>
                        <div class="flex items-center gap-2"><span class="text-xs text-slate-500 font-bold">Соединитель 90°:</span><input type="number" class="w-20 p-1 border border-slate-300 rounded text-sm bg-slate-50" id="adm-sill-c90-${bIdx}-${gIdx}" value="${grp.conn90}"></div>
                        <div class="flex items-center gap-2"><span class="text-xs text-slate-500 font-bold">Соединитель 150°:</span><input type="number" class="w-20 p-1 border border-slate-300 rounded text-sm bg-slate-50" id="adm-sill-c150-${bIdx}-${gIdx}" value="${grp.conn150}"></div>
                    </div>
                    <div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">`;
            Object.keys(grp.widths).sort((a,b)=>a-b).forEach(w => {
                html += `
                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] text-slate-400 font-bold text-center">${w} мм</span>
                            <input type="number" class="w-full p-1 border border-slate-200 rounded text-xs text-center bg-slate-50" id="adm-sill-w-${bIdx}-${gIdx}-${w}" value="${grp.widths[w]}">
                        </div>`;
            });
            html += `</div></div>`;
        });
        html += `
            <button onclick="addAdminSillGroup(${bIdx})" class="mt-2 text-sm text-brand-primary font-bold hover:underline flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i> Добавить группу ширины</button>
        </div></div>`;
    });
    html += `<button onclick="addAdminSillBrand()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm">
        <i data-lucide="plus" class="w-4 h-4"></i> Добавить бренд
    </button></div>`;
    container.innerHTML = html;
}

function deleteAdminSillBrand(bIdx) { requirePin('Удалить бренд подоконников', () => { Oko_User_Prices.sills.splice(bIdx, 1); renderAdminSills(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminSillBrand() { requirePin('Добавить бренд подоконников', () => { Oko_User_Prices.sills.push({ brand: 'Новый бренд', groups: [{ name: 'Стандарт', cap: 0, conn90: 0, conn150: 0, widths: { 100:0, 150:0 } }] }); renderAdminSills(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function deleteAdminSillGroup(bIdx, gIdx) { requirePin('Удалить группу', () => { Oko_User_Prices.sills[bIdx].groups.splice(gIdx, 1); renderAdminSills(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminSillGroup(bIdx) { requirePin('Добавить группу', () => { Oko_User_Prices.sills[bIdx].groups.push({ name: 'Новая группа', cap: 0, conn90: 0, conn150: 0, widths: { 100:0 } }); renderAdminSills(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminSlopes() {
    const container = document.getElementById('admin-slopes-container');
    if (!container) return;
    let html = `<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div><span class="text-xs font-bold text-slate-500">П-Профиль (start)</span><input type="number" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded" id="adm-slope-prof-start" value="${Oko_User_Prices.slopesProf.start}"></div>
        <div><span class="text-xs font-bold text-slate-500">Н-Профиль</span><input type="number" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded" id="adm-slope-prof-h" value="${Oko_User_Prices.slopesProf.h}"></div>
        <div><span class="text-xs font-bold text-slate-500">F-Профиль (28x32)</span><input type="number" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded" id="adm-slope-prof-f28" value="${Oko_User_Prices.slopesProf.f28}"></div>
        <div><span class="text-xs font-bold text-slate-500">F-Профиль (50x30)</span><input type="number" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded" id="adm-slope-prof-f50" value="${Oko_User_Prices.slopesProf.f50}"></div>
    </div>`;
    container.innerHTML = html;
}

function renderAdminHardware() {
    const container = document.getElementById('admin-hardware-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    Oko_User_Prices.hardware.forEach((g, idx) => { html += createRowInput('adm-hardware', idx, g, 'name', 'price', '₽', `deleteAdminHardware(${idx})`); });
    html += `</div><button onclick="addAdminHardware()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i> Добавить фурнитуру</button>`;
    container.innerHTML = html;
}
function deleteAdminHardware(idx) { requirePin('Удалить фурнитуру', () => { Oko_User_Prices.hardware.splice(idx, 1); renderAdminHardware(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminHardware() { requirePin('Добавить фурнитуру', () => { Oko_User_Prices.hardware.push({ name: 'Новая фурнитура', price: 0 }); renderAdminHardware(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminSandwiches() {
    const container = document.getElementById('admin-sandwiches-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    Oko_User_Prices.sandwiches.forEach((g, idx) => { html += createRowInput('adm-sandwich', idx, g, 'name', 'price', '₽/м²', `deleteAdminSandwich(${idx})`); });
    html += `</div><button onclick="addAdminSandwich()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i> Добавить сендвич-панель</button>`;
    container.innerHTML = html;
}
function deleteAdminSandwich(idx) { requirePin('Удалить сендвич', () => { Oko_User_Prices.sandwiches.splice(idx, 1); renderAdminSandwiches(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminSandwich() { requirePin('Добавить сендвич', () => { Oko_User_Prices.sandwiches.push({ name: 'Новый сендвич', price: 0 }); renderAdminSandwiches(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminMount() {
    const container = document.getElementById('admin-mount-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    const keys = Object.keys(Oko_User_Prices.mount);
    const labels = { montaz58: 'Монтаж 58', razdvizh: 'Монтаж Раздвижка', shower: 'Монтаж Душевой', sill: 'Монтаж Подоконник (Кристалит)', sillSimple: 'Монтаж Подоконник (Простой)', net: 'Монтаж Сетки', netPleated: 'Монтаж Сетки Плиссе', lift: 'Подъем', demontazh: 'Демонтаж', util: 'Утилизация' };
    keys.forEach(k => {
        let vals = Oko_User_Prices.mount[k];
        html += `
        <div class="bg-white p-3 rounded-lg border border-slate-200">
            <div class="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">${labels[k] || k}</div>
            <div class="grid grid-cols-3 gap-3">
                <div><span class="text-[10px] text-slate-400 font-bold block mb-1">Офис</span><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs" id="adm-mount-${k}-0" value="${vals[0]}"></div>
                <div><span class="text-[10px] text-slate-400 font-bold block mb-1">Монтажник</span><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs" id="adm-mount-${k}-1" value="${vals[1]}"></div>
                <div><span class="text-[10px] text-slate-400 font-bold block mb-1">Бригада</span><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs" id="adm-mount-${k}-2" value="${vals[2]}"></div>
            </div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderAdminServices() {
    const container = document.getElementById('admin-services-container');
    if (!container) return;
    let html = `<div class="space-y-3">
        <div class="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 pb-2 border-b border-slate-200 px-2">
            <div class="col-span-4">Наименование услуги</div>
            <div class="col-span-1 text-center">Ед.изм.</div>
            <div class="col-span-2 text-center">Офис (₽)</div>
            <div class="col-span-2 text-center">Монтажник (₽)</div>
            <div class="col-span-2 text-center">Бригада (₽)</div>
            <div class="col-span-1 text-center">Удалить</div>
        </div>`;
    Oko_User_Prices.presetServices.forEach((srv, idx) => {
        html += `
        <div class="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-sm hover:border-brand-primary transition-colors">
            <div class="col-span-4"><input type="text" class="w-full p-2 bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-0 text-xs font-bold rounded" id="adm-srv-name-${idx}" value="${srv.name}"></div>
            <div class="col-span-1"><input type="text" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-unit-${idx}" value="${srv.unit}"></div>
            <div class="col-span-2"><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-p0-${idx}" value="${srv.prices[0]}"></div>
            <div class="col-span-2"><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-p1-${idx}" value="${srv.prices[1]}"></div>
            <div class="col-span-2"><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-p2-${idx}" value="${srv.prices[2]}"></div>
            <div class="col-span-1 text-center"><button onclick="deleteAdminService(${idx})" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Удалить"><i data-lucide="trash-2" class="w-4 h-4 mx-auto"></i></button></div>
        </div>`;
    });
    html += `</div><button onclick="addAdminService()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i> Добавить услугу</button>`;
    container.innerHTML = html;
}

function deleteAdminService(idx) { requirePin('Удалить услугу', () => { Oko_User_Prices.presetServices.splice(idx, 1); renderAdminServices(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminService() { requirePin('Добавить услугу', () => { Oko_User_Prices.presetServices.push({ name: 'Новая услуга', unit: 'шт', prices: [0,0,0] }); renderAdminServices(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }


// --- SAVE & RESET ---

function saveAdminPrices() {
    ['glasses', 'layouts', 'hardware', 'sandwiches'].forEach(cat => {
        (Oko_User_Prices[cat] || []).forEach((g, idx) => {
            const elName = document.getElementById(`adm-${cat.replace(/es$|s$/, '')}-name-${idx}`);
            const elPrice = document.getElementById(`adm-${cat.replace(/es$|s$/, '')}-price-${idx}`);
            if(elName) g.name = elName.value;
            if(elPrice) g.price = parseFloat(elPrice.value) || 0;
        });
    });

    (Oko_User_Prices.shapes || []).forEach((s, idx) => {
        const elName = document.getElementById(`adm-shape-name-${idx}`);
        const elPrice = document.getElementById(`adm-shape-price-${idx}`);
        if(elName) s.name = elName.value;
        if(elPrice) s.markup = parseFloat(elPrice.value) || 0;
    });

    (Oko_User_Prices.nets || []).forEach((n, idx) => {
        const elName = document.getElementById(`adm-net-name-${idx}`);
        const elMin = document.getElementById(`adm-net-min-${idx}`);
        const elSqm = document.getElementById(`adm-net-sqm-${idx}`);
        if(elName) n.name = elName.value;
        if(elMin) n.price_min = parseFloat(elMin.value) || 0;
        if(elSqm) n.price_sqm = parseFloat(elSqm.value) || 0;
    });

    (Oko_User_Prices.sills || []).forEach((brand, bIdx) => {
        const elB = document.getElementById(`adm-sill-bname-${bIdx}`);
        if(elB) brand.brand = elB.value;
        (brand.groups || []).forEach((grp, gIdx) => {
            const elG = document.getElementById(`adm-sill-gname-${bIdx}-${gIdx}`);
            if(elG) grp.name = elG.value;
            const elCap = document.getElementById(`adm-sill-cap-${bIdx}-${gIdx}`);
            const elC90 = document.getElementById(`adm-sill-c90-${bIdx}-${gIdx}`);
            const elC150 = document.getElementById(`adm-sill-c150-${bIdx}-${gIdx}`);
            if(elCap) grp.cap = parseFloat(elCap.value)||0;
            if(elC90) grp.conn90 = parseFloat(elC90.value)||0;
            if(elC150) grp.conn150 = parseFloat(elC150.value)||0;
            Object.keys(grp.widths || {}).forEach(w => {
                const elW = document.getElementById(`adm-sill-w-${bIdx}-${gIdx}-${w}`);
                if(elW) grp.widths[w] = parseFloat(elW.value)||0;
            });
        });
    });

    ['start', 'h', 'f28', 'f50'].forEach(k => {
        const el = document.getElementById(`adm-slope-prof-${k}`);
        if(el && Oko_User_Prices.slopesProf) Oko_User_Prices.slopesProf[k] = parseFloat(el.value)||0;
    });

    Object.keys(Oko_User_Prices.mount || {}).forEach(k => {
        for(let i=0; i<3; i++) {
            const el = document.getElementById(`adm-mount-${k}-${i}`);
            if(el) Oko_User_Prices.mount[k][i] = parseFloat(el.value)||0;
        }
    });

    (Oko_User_Prices.presetServices || []).forEach((srv, idx) => {
        const elName = document.getElementById(`adm-srv-name-${idx}`);
        const elUnit = document.getElementById(`adm-srv-unit-${idx}`);
        if(elName) srv.name = elName.value;
        if(elUnit) srv.unit = elUnit.value;
        for(let i=0; i<3; i++) {
            const elP = document.getElementById(`adm-srv-p${i}-${idx}`);
            if(elP) srv.prices[i] = parseFloat(elP.value)||0;
        }
    });

    localStorage.setItem('oko_user_prices', JSON.stringify(Oko_User_Prices));
    
    // Save brand settings too
    if (typeof saveBrandFromAdmin === 'function') saveBrandFromAdmin();
    
    // Sync global arrays from Oko_User_Prices so dropdowns reflect new items
    if (typeof GLASS_TYPES !== 'undefined') GLASS_TYPES = Oko_User_Prices.glasses || [];
    if (typeof SHAPES !== 'undefined') SHAPES = Oko_User_Prices.shapes || [];
    if (typeof LAYOUTS !== 'undefined') LAYOUTS = Oko_User_Prices.layouts || [];
    if (typeof NET_TYPES !== 'undefined') NET_TYPES = Oko_User_Prices.nets || [];
    if (typeof SALINOX_PRICES !== 'undefined') SALINOX_PRICES = Oko_User_Prices.salinox || [];
    if (typeof OPTIONS !== 'undefined') OPTIONS = Oko_User_Prices.options || [];
    if (typeof SILLS_DATA !== 'undefined') SILLS_DATA = Oko_User_Prices.sills || [];
    if (typeof SLOPES_DATA !== 'undefined') SLOPES_DATA = Oko_User_Prices.slopes || [];
    if (typeof SLOPES_PROF_PRICES !== 'undefined') SLOPES_PROF_PRICES = Oko_User_Prices.slopesProf || {};
    if (typeof PARTITION_PRICES !== 'undefined') PARTITION_PRICES = Oko_User_Prices.partition || [];
    if (typeof MOUNT_PRICES !== 'undefined') MOUNT_PRICES = Oko_User_Prices.mount || {};
    if (typeof PRESET_SERVICES_DB !== 'undefined') PRESET_SERVICES_DB = Oko_User_Prices.presetServices || [];
    if (typeof SANDWICH_TYPES !== 'undefined') SANDWICH_TYPES = Oko_User_Prices.sandwiches || [];
    if (typeof HARDWARE_TYPES !== 'undefined') HARDWARE_TYPES = Oko_User_Prices.hardware || [];
    
    alert('Настройки успешно сохранены!');
    
    if (typeof initPresetServices === 'function') initPresetServices();
    if (typeof updateDropdownPrices === 'function') updateDropdownPrices();
    if (typeof initSillsTab === 'function') initSillsTab();
    if (typeof initSlopesTab === 'function') initSlopesTab();
    
    let shapeSelect = document.getElementById('glass-shape');
    if (shapeSelect && typeof SHAPES !== 'undefined') {
        shapeSelect.innerHTML = '';
        SHAPES.forEach((s, i) => shapeSelect.innerHTML += `<option value="${i}">${s.name}</option>`);
    }
    
    if (typeof renderCart === 'function') renderCart();
}

function resetAdminPrices() {
    requirePin('Сбросить все цены', () => {
        if(!confirm('Вы уверены, что хотите сбросить все цены до базовых? Это действие нельзя отменить!')) return;
        localStorage.removeItem('oko_user_prices');
        if(typeof initUserPrices === 'function') initUserPrices();
        renderAllAdminTabs();
        alert('Цены сброшены до базовых!');
        if (typeof initPresetServices === 'function') initPresetServices();
        if (typeof updateDropdownPrices === 'function') updateDropdownPrices();
        if (typeof initSillsTab === 'function') initSillsTab();
        if (typeof initSlopesTab === 'function') initSlopesTab();
        let shapeSelect = document.getElementById('glass-shape');
        if (shapeSelect && typeof SHAPES !== 'undefined') {
            shapeSelect.innerHTML = '';
            SHAPES.forEach((s, i) => shapeSelect.innerHTML += `<option value="${i}">${s.name}</option>`);
        }
        if (typeof renderCart === 'function') renderCart();
    });
}
