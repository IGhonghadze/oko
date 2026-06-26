// ==========================================
// АРХИВ ПРОСЧЁТОВ (localStorage)
// ==========================================
const API_URL = typeof getApiUrl === 'function' ? getApiUrl() : 'api.php';
let GLOBAL_ARCHIVE_CACHE = [];

async function fetchArchive() {
    let localArchive = [];
    try {
        let saved = localStorage.getItem('oko_archive');
        if (saved) {
            let parsed = JSON.parse(saved);
            localArchive = Array.isArray(parsed) ? parsed : [];
        }
    } catch(e) { console.error('Local archive error', e); }

    let begetArchive = [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        let res = await fetch(API_URL + '?action=list', { 
            signal: controller.signal,
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('oko_token') }
        });
        clearTimeout(timeoutId);
        if (res.ok) begetArchive = await res.json();
    } catch(e) {
        console.warn('Ошибка загрузки архива из облака (скорее всего сервер недоступен):', e.message);
    }
    
    let merged = new Map();
    localArchive.forEach(item => merged.set(item.id, item));
    begetArchive.forEach(item => merged.set(item.id, item));
    
    GLOBAL_ARCHIVE_CACHE = Array.from(merged.values());
    GLOBAL_ARCHIVE_CACHE.sort((a, b) => b.id - a.id);

    // Если мы запущены локально (через file://) и есть авторизационный токен, проверим необходимость переноса локальных расчетов в облако Beget
    if (window.location.protocol === 'file:') {
        let token = localStorage.getItem('oko_token');
        if (token && localArchive.length > 0) {
            setTimeout(() => checkAndSyncLocalArchive(localArchive, begetArchive, token), 500);
        }
    }
}

async function checkAndSyncLocalArchive(localArchive, begetArchive, token) {
    if (window.IS_SYNCING_ARCHIVE) return;
    
    let begetIds = new Set(begetArchive.map(item => item.id));
    let toUpload = localArchive.filter(item => !begetIds.has(item.id));
    
    if (toUpload.length === 0) return;
    
    window.IS_SYNCING_ARCHIVE = true;
    let message = `Найдено ${toUpload.length} сохраненных расчетов на вашем компьютере, которых еще нет в облаке Beget.\n\nПеренести их на сервер Beget, чтобы они стали доступны на всех устройствах (включая мобильные и основной сайт)?`;
    if (confirm(message)) {
        let successCount = 0;
        for (let entry of toUpload) {
            try {
                let res = await fetch(API_URL + '?action=save', {
                    method: 'POST',
                    body: JSON.stringify(entry),
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) successCount++;
            } catch(e) {
                console.error('Ошибка синхронизации расчета:', e);
            }
        }
        alert(`Перенос завершен!\nУспешно сохранено в облако Beget: ${successCount} из ${toUpload.length} расчетов.`);
        window.IS_SYNCING_ARCHIVE = false;
        await fetchArchive();
        if (typeof renderArchiveList === 'function') renderArchiveList();
        return;
    }
    window.IS_SYNCING_ARCHIVE = false;
}

function collectState() {
    let getVal = (id) => { let el = document.getElementById(id); return el ? el.value : ''; };
    return {
        items: JSON.parse(JSON.stringify(ITEMS)),
        services: JSON.parse(JSON.stringify(SERVICES)),
        markup: getVal('select-global-markup'), company: getVal('select-company'),
        manualRub: getVal('manual-markup-rub'), manualPct: getVal('manual-markup-pct'),
        discountRub: getVal('manual-discount-rub'), discountPct: getVal('manual-discount-pct'),
        clientName: getVal('client-name'),
        kpNumber: getVal('kp-number-input'),
        currentKpId: currentKpId || ''
    };
}

function applyState(state) {
    let setVal = (id, v) => { let el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
    ITEMS = state.items || [];
    SERVICES = state.services || [];
    if (state.markup) setVal('select-global-markup', state.markup);
    if (state.company) setVal('select-company', state.company);
    setVal('manual-markup-rub', state.manualRub || ''); 
    setVal('manual-markup-pct', state.manualPct || '');
    setVal('manual-discount-rub', state.discountRub || state.discount || '');
    setVal('manual-discount-pct', state.discountPct || '');
    setVal('client-name', state.clientName || state.kpClient || ''); 
    setVal('kp-number-input', state.kpNumber || state.kpObject || '');
    
    if (state.currentKpId) {
        currentKpId = state.currentKpId;
        let display = document.getElementById('kp-id-display');
        if(display) display.innerText = 'ID: ' + currentKpId;
    }
    
    handleSettingsChange(); updateDropdownPrices(); renderServicesList(); renderCart();
}

async function saveCalculation(btn) {
    if (ITEMS.length === 0) { alert('Смета пуста — нечего сохранять!'); return; }
    let client = (document.getElementById('client-name') || {}).value || '';
    let obj = (document.getElementById('kp-number-input') || {}).value || '';
    let suggestion = [client.trim(), obj.trim()].filter(Boolean).join(' — ') || 'Просчёт';
    let name = prompt('Имя просчёта (клиент / номер):', suggestion);
    if (name === null) return;
    if (!name.trim()) name = suggestion;
    
    let tSumText = document.getElementById('cart-total-display') ? document.getElementById('cart-total-display').innerText.replace(/[^\d.-]/g, '') : '0';
    let tSum = parseFloat(tSumText) || 0;
    
    let targetId = Date.now();
    if (window.CURRENT_LOADED_ARCHIVE_ID) {
        if (confirm(`Обновить расчет в архиве?\n\n[ОК] - Обновить существующий (перезаписать)\n[Отмена] - Сохранить как новую копию`)) {
            targetId = window.CURRENT_LOADED_ARCHIVE_ID;
        } else {
            window.CURRENT_LOADED_ARCHIVE_ID = null; // Create new copy
        }
    }
    
    let entry = { 
        id: targetId, 
        name: name.trim(), 
        date: new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'}), 
        itemCount: ITEMS.length, 
        totalSum: tSum, 
        state: collectState() 
    };
    
    let origBtnContent = btn ? btn.innerHTML : '';
    try {
        if(btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Сохраняем...'; lucide.createIcons(); }
        
        let saved = localStorage.getItem('oko_archive');
        let parsed = saved ? JSON.parse(saved) : [];
        let localArchive = Array.isArray(parsed) ? parsed : [];
        let existingIdx = localArchive.findIndex(e => e.id == entry.id);
        if (existingIdx !== -1) localArchive[existingIdx] = entry;
        else localArchive.push(entry);
        localStorage.setItem('oko_archive', JSON.stringify(localArchive));
        
        let entryStr = JSON.stringify(entry);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            let res = await fetch(API_URL + '?action=save', { 
                method:'POST', 
                body: entryStr, 
                signal: controller.signal,
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('oko_token') }
            });
            clearTimeout(timeoutId);
            if(!res.ok) throw new Error('Network error');
            alert(`\u2705 Просчёт "${name.trim()}" сохранён в архив!`);
        } catch(cloudErr) {
            alert(`\u26A0 Просчёт "${name.trim()}" сохранён ТОЛЬКО ЛОКАЛЬНО (облако недоступно)`);
        }
    } catch(e) {
        alert('Ошибка при сохранении: ' + e.message);
    } finally {
        if(btn) { btn.disabled = false; btn.innerHTML = origBtnContent; lucide.createIcons(); }
        fetchArchive();
    }
}

function loadCalculation(id) {
    let entry = GLOBAL_ARCHIVE_CACHE.find(e => e.id == id);
    if (!entry) return;
    if (!confirm(`Загрузить "${entry.name}"?\n\nТекущая смета будет заменена.`)) return;
    applyState(entry.state);
    window.CURRENT_LOADED_ARCHIVE_ID = id;
    closeArchive();
}

async function deleteCalculation(id) {
    let entry = GLOBAL_ARCHIVE_CACHE.find(e => e.id == id);
    if (!entry || !confirm(`Удалить "${entry.name}" навсегда?`)) return;
    
    try {
        let saved = localStorage.getItem('oko_archive');
        if (saved) {
            let parsed = JSON.parse(saved);
            let localArchive = Array.isArray(parsed) ? parsed : [];
            localArchive = localArchive.filter(e => e.id != id);
            localStorage.setItem('oko_archive', JSON.stringify(localArchive));
        }
    } catch(e) {}
    
    try {
        await fetch(API_URL + '?action=delete', { 
            method:'POST', 
            body: JSON.stringify({id}),
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('oko_token') }
        });
    } catch(e) { console.error('Ошибка удаления в облаке'); }
    
    await fetchArchive();
    renderArchiveList();
}

async function renameCalculation(id) {
    let entry = GLOBAL_ARCHIVE_CACHE.find(e => e.id == id);
    if (!entry) return;
    let newName = prompt('Новое имя:', entry.name);
    if (!newName || !newName.trim()) return;
    
    try {
        let saved = localStorage.getItem('oko_archive');
        if (saved) {
            let parsed = JSON.parse(saved);
            let localArchive = Array.isArray(parsed) ? parsed : [];
            let locEntry = localArchive.find(e => e.id == id);
            if (locEntry) {
                locEntry.name = newName.trim();
                localStorage.setItem('oko_archive', JSON.stringify(localArchive));
            }
        }
    } catch(e) {}

    try {
        await fetch(API_URL + '?action=rename', { 
            method:'POST', 
            body: JSON.stringify({id, name: newName.trim()}),
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('oko_token') }
        });
    } catch(e) { console.error('Ошибка переименования в облаке'); }
    
    await fetchArchive();
    renderArchiveList();
}

let archiveViewMode = localStorage.getItem('oko_archive_view') || 'grid';

function setArchiveView(mode) {
    archiveViewMode = mode;
    localStorage.setItem('oko_archive_view', mode);
    
    let btnGrid = document.getElementById('btn-view-grid');
    let btnList = document.getElementById('btn-view-list');
    if(btnGrid && btnList) {
        if(mode === 'grid') {
            btnGrid.className = 'p-3 sm:p-4 bg-white text-brand-primary shadow-sm rounded-lg transition-all';
            btnList.className = 'p-3 sm:p-4 text-slate-400 hover:text-slate-700 rounded-lg transition-all';
        } else {
            btnList.className = 'p-3 sm:p-4 bg-white text-brand-primary shadow-sm rounded-lg transition-all';
            btnGrid.className = 'p-3 sm:p-4 text-slate-400 hover:text-slate-700 rounded-lg transition-all';
        }
    }
    renderArchiveList();
}

function calcArchivedTotal(state) {
    if (!state || !state.items) return 0;
    let baseSum = state.items.reduce((sum, it) => sum + (it.baseTotal || 0) * (it.qty || 1), 0);
    let markup = parseFloat(state.markup) || 1.3;
    let itemsTotal = 0;
    state.items.forEach(it => {
        let costMult = (it.category === 'custom' || it.category === 'slope_profile' || it.category === 'roller') ? 1 : markup;
        itemsTotal += Math.ceil((it.baseTotal || 0) * costMult) * (it.qty || 1);
    });
    
    let srvSum = (state.services || []).reduce((sum, s) => sum + (parseFloat(s.price) || 0) * (parseFloat(s.qty) || 1), 0);
    
    let mRub = parseFloat(state.manualRub) || 0;
    let mPct = parseFloat(state.manualPct) || 0;
    let dRub = parseFloat(state.discountRub || state.discount) || 0;
    let dPct = parseFloat(state.discountPct) || 0;
    
    let sub = itemsTotal + srvSum;
    let totalManualMarkup = mRub + (sub * (mPct / 100));
    sub += totalManualMarkup;
    let totalDiscount = dRub + (sub * (dPct / 100));
    return Math.max(0, Math.round(sub - totalDiscount));
}

function renderArchiveList() {
    let archive = GLOBAL_ARCHIVE_CACHE || []; 
    let container = document.getElementById('archive-list'); 
    if (!container) return;
    
    // Ensure container grid class matches mode
    container.className = archiveViewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20"
        : "flex flex-col gap-3 pb-20";
    
    let searchQ = (document.getElementById('archive-search') ? document.getElementById('archive-search').value.toLowerCase().trim() : '');
    
    if (searchQ) {
        archive = archive.filter(e => {
            let str = (e.name + ' ' + e.date + ' ' + (e.state?.clientName || '') + ' ' + (e.state?.kpNumber || '')).toLowerCase();
            return str.includes(searchQ);
        });
    }

    if (archive.length === 0) {
        container.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 py-20 px-6 text-center shadow-sm">
            <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <i data-lucide="${searchQ ? 'search-x' : 'archive'}" class="w-12 h-12 text-slate-300"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-2">${searchQ ? 'Ничего не найдено' : 'Архив пуст'}</h3>
            <p class="text-slate-500 max-w-sm">${searchQ ? 'Попробуйте изменить поисковой запрос.' : 'Сохраняйте просчёты в архив, чтобы иметь к ним быстрый доступ в будущем.'}</p>
        </div>`; 
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }
    
    let headerHtml = '';
    if (archiveViewMode === 'list') {
        headerHtml = `<div class="hidden sm:flex flex-row items-center gap-4 sm:gap-6 px-4 py-3 mb-1 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
            <div class="flex flex-row items-center gap-4 w-full sm:w-auto shrink-0">
                <div class="w-16 sm:w-20 shrink-0 text-center sm:text-left">№ КП</div>
                <div class="w-32 shrink-0">Дата создания</div>
            </div>
            <div class="min-w-0 flex flex-col justify-center border-l-0 sm:border-l border-slate-200 pl-0 sm:pl-6 w-full sm:w-auto flex-1">
                Заказчик / Объект
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 pr-2">
                <div class="text-right flex-shrink-0 w-24">Стоимость</div>
                <div class="w-12"></div>
            </div>
        </div>`;
    }
    
    container.innerHTML = headerHtml + archive.map(e => {
        let firstItem = e.state?.items?.[0];
        let sketchHtml = '<div class="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 rounded-xl"><i data-lucide="image" class="w-8 h-8 opacity-50"></i></div>';
        if (firstItem && typeof generateSvgSketch === 'function') {
            sketchHtml = generateSvgSketch(firstItem) || sketchHtml;
        }
        
        let client = e.state?.clientName || 'Не указан';
        let kpNumber = e.state?.kpNumber || 'БЕЗ НОМЕРА';
        let sysId = e.id;
        let idBadge = `<span class="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 tracking-wider" title="Системный ID: ${sysId}">#${sysId} | ${kpNumber}</span>`;
        
        // Calculate total dynamically if missing
        let totalVal = e.totalSum || calcArchivedTotal(e.state);
        let tSum = totalVal ? `<span class="text-xl font-black text-slate-900">${totalVal.toLocaleString()} ₽</span>` : `<span class="text-sm font-medium text-slate-400">Сумма не сохранена</span>`;
        
        if (archiveViewMode === 'grid') {
            return `<div class="bg-white border-2 border-slate-100 rounded-2xl hover:border-brand-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group relative">
                <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div class="flex items-center gap-2">
                        ${idBadge}
                        <span class="text-xs font-medium text-slate-400 flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${e.date}</span>
                    </div>
                    <div class="dropdown relative">
                        <button onclick="event.stopPropagation(); document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden')); this.nextElementSibling.classList.toggle('hidden');" class="p-1 text-slate-400 hover:text-slate-800 transition-colors">
                            <i data-lucide="more-vertical" class="w-5 h-5"></i>
                        </button>
                        <div class="dropdown-menu hidden absolute right-0 top-full mt-1 w-40 bg-white border border-slate-100 rounded-xl shadow-lg z-30 py-1">
                            <button onclick="renameCalculation(${e.id}); event.stopPropagation();" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><i data-lucide="edit-3" class="w-4 h-4 text-slate-400"></i> Переименовать</button>
                            <button onclick="deleteCalculation(${e.id}); event.stopPropagation();" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i> Удалить</button>
                        </div>
                    </div>
                </div>
                
                <div class="p-5 flex flex-col h-full cursor-pointer" onclick="loadCalculation(${e.id})">
                    <div class="flex gap-5 mb-4">
                        <div class="w-24 h-24 flex-shrink-0 flex items-center justify-center p-2 border border-slate-100 rounded-xl bg-white shadow-inner group-hover:scale-105 transition-transform duration-300">
                            ${sketchHtml}
                        </div>
                        <div class="flex-1 flex flex-col justify-center min-w-0">
                            <h3 class="text-lg font-bold text-slate-800 mb-1 truncate" title="${e.name}">${e.name}</h3>
                            <div class="text-sm font-medium text-slate-500 flex items-center gap-1.5 truncate">
                                <i data-lucide="user" class="w-4 h-4 text-slate-400"></i> ${client}
                            </div>
                        </div>
                    </div>
                    <div class="mt-auto flex items-end justify-between pt-4 border-t border-dashed border-slate-200">
                        <div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Сумма заказа</div>
                            ${tSum}
                        </div>
                        <div class="text-xs font-bold text-brand-primary bg-brand-light px-2.5 py-1 rounded-lg">
                            ${e.itemCount} поз.
                        </div>
                    </div>
                </div>
            </div>`;
        } else {
            // List View
            return `<div class="bg-white border-2 border-slate-100 rounded-xl hover:border-brand-primary/50 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center p-4 gap-6 group cursor-pointer" onclick="loadCalculation(${e.id})">
                <div class="flex-shrink-0 flex items-center gap-3 w-full sm:w-64">
                    ${idBadge}
                    <span class="text-xs font-medium text-slate-400 whitespace-nowrap">${e.date}</span>
                </div>
                
                <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full pl-2 sm:pl-4 border-l border-transparent sm:border-slate-100">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-base font-bold text-slate-800 truncate" title="${e.name}">${e.name}</h3>
                        <div class="text-xs font-medium text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                            <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i> ${client}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                        <div class="text-right">
                            ${totalVal ? `<span class="text-lg font-black text-slate-900">${totalVal.toLocaleString()} ₽</span>` : `<span class="text-xs text-slate-400">Сумма неизвестна</span>`}
                        </div>
                        <div class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
                            ${e.itemCount} поз.
                        </div>
                        
                        <div class="dropdown relative ml-auto sm:ml-0">
                            <button onclick="event.stopPropagation(); document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden')); this.nextElementSibling.classList.toggle('hidden');" class="p-1 text-slate-400 hover:text-slate-800 transition-colors">
                                <i data-lucide="more-vertical" class="w-5 h-5"></i>
                            </button>
                            <div class="dropdown-menu hidden absolute right-0 top-full mt-1 w-40 bg-white border border-slate-100 rounded-xl shadow-lg z-30 py-1">
                                <button onclick="renameCalculation(${e.id}); event.stopPropagation();" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><i data-lucide="edit-3" class="w-4 h-4 text-slate-400"></i> Переименовать</button>
                                <button onclick="deleteCalculation(${e.id}); event.stopPropagation();" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i> Удалить</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}



async function showArchive() { 
    document.getElementById('calculator-screen').style.display = 'none';
    document.getElementById('archive-screen').classList.remove('hidden');
    document.getElementById('archive-screen').style.display = 'block';
    
    let container = document.getElementById('archive-list');
    if(container) {
        container.innerHTML = '<div class="col-span-full flex flex-col items-center py-20 text-slate-400"><i data-lucide="loader-2" class="w-12 h-12 animate-spin mb-4 text-brand-primary"></i> Загрузка из облака...</div>';
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    await fetchArchive();
    
    let searchEl = document.getElementById('archive-search');
    if(searchEl) { searchEl.value = ''; searchEl.focus(); }
    
    renderArchiveList(); 
    window.scrollTo(0,0);
}

function closeArchive() { 
    document.getElementById('archive-screen').classList.add('hidden');
    document.getElementById('archive-screen').style.display = 'none';
    document.getElementById('calculator-screen').style.display = 'block';
}

// --- Export to Factory Logic ---
function exportFactoryExcel() {
    let glassItems = ITEMS.filter(it => it.category === 'glass');
    if (glassItems.length === 0) {
        alert('Нет стеклопакетов для выгрузки на завод!');
        return;
    }
    try {
        const wb = XLSX.utils.book_new();
        let wsData = [
            ["№", "Наименование", "Ширина (мм)", "Высота (мм)", "Кол-во (шт)", "Площадь (м²)", "Форма / Раскладка", "Комментарий/Опции"]
        ];
        
        glassItems.forEach((it, idx) => {
            let totalArea = it.area * (it.qty || 1);
            let opts = it.optionsDesc.join("; ");
            wsData.push([
                idx + 1,
                it.type,
                it.w,
                it.h,
                it.qty || 1,
                parseFloat(totalArea.toFixed(3)),
                it.shape !== 'Прямоугольник' ? it.shape : (it.layoutName ? it.layoutName : 'Прямоугольник'),
                opts
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch: 5}, {wch: 40}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 50}];
        XLSX.utils.book_append_sheet(wb, ws, "Стеклопакеты (Завод)");
        
        let clientNameEl = document.getElementById('client-name');
        let clientName = clientNameEl && clientNameEl.value ? clientNameEl.value.trim().replace(/[^a-zа-я0-9\s]/gi, '') : 'Без_имени';
        let fileName = `Завод_${clientName}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    } catch (e) {
        console.error('Ошибка выгрузки', e);
        alert('Техническая ошибка при выгрузке: ' + e.message);
    }
}

