let ITEMS = [];
let currentKpId = '';

function generateKpId() {
    let date = new Date();
    let d = String(date.getDate()).padStart(2, '0');
    let m = String(date.getMonth() + 1).padStart(2, '0');
    let y = String(date.getFullYear()).slice(-2);
    let rand = Math.floor(1000 + Math.random() * 9000);
    return `КП-${d}${m}${y}-${rand}`;
}

// EDIT MODE SYSTEM (КП Редактирование)
// ==========================================
window.editingGroupId = null;

function commitItemsToCart(itemsToPush, tabId, rawData) {
    let groupId = Date.now();
    let insertIndex = ITEMS.length;

    if (window.editingGroupId) {
        insertIndex = ITEMS.findIndex(i => (i.groupId || i.id) === window.editingGroupId);
        if (insertIndex === -1) insertIndex = ITEMS.length;
        ITEMS = ITEMS.filter(i => (i.groupId || i.id) !== window.editingGroupId);
        window.editingGroupId = null;
        resetAddButton(tabId);
    }

    itemsToPush.forEach((item, idx) => {
        if (!item.id) item.id = groupId + idx;
        item.groupId = groupId;
        item.tabId = tabId;
        if (idx === 0) item.rawData = rawData; 
    });

    ITEMS.splice(insertIndex, 0, ...itemsToPush);
    renderCart();
}

function captureRawData(tabId) {
    let data = {};
    let tab = document.getElementById(tabId);
    if (!tab) return data;
    let inputs = tab.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        if (el.id) {
            if (el.type === 'checkbox' || el.type === 'radio') data[el.id] = el.checked;
            else data[el.id] = el.value;
        }
    });
    return data;
}

function restoreRawData(data) {
    if (!data) return;
    for (let id in data) {
        let el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = data[id];
            } else {
                el.value = data[id];
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

function editItemFull(groupId, tabId) {
    let item = ITEMS.find(i => (i.groupId || i.id) === groupId);
    if (!item || !item.rawData) {
        alert("Редактирование этой позиции невозможно (добавлена до обновления).");
        return;
    }
    
    window.editingGroupId = groupId;
    let cleanTabId = tabId.replace('tab-', '');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.querySelector(`button[onclick="switchTab('${cleanTabId}')"]`);
    if(activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.category-content').forEach(c => c.classList.remove('active'));
    let targetTab = document.getElementById(tabId);
    if(targetTab) targetTab.classList.add('active');
    
    if (tabId === 'tab-shower' && typeof generateShowerFields === 'function') {
        let layoutEl = document.getElementById('shower-layout');
        if (layoutEl) {
            layoutEl.value = item.rawData['shower-layout'];
            generateShowerFields();
        }
    }

    restoreRawData(item.rawData);
    
    let btn = document.querySelector(`#${tabId} button[onclick^="add"]`);
    if (btn) {
        if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Сохранить изменения`;
        btn.classList.remove('from-brand-primary', 'to-brand-secondary');
        btn.classList.add('from-emerald-500', 'to-emerald-600');
        btn.setAttribute('data-editing', 'true');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetAddButton(tabId) {
    let btn = document.querySelector(`#${tabId} button[onclick^="add"]`);
    if (btn && btn.getAttribute('data-editing') === 'true') {
        btn.innerHTML = btn.dataset.originalHtml || `<i data-lucide="plus-circle" class="w-5 h-5"></i> Добавить в смету`;
        btn.classList.remove('from-emerald-500', 'to-emerald-600');
        btn.classList.add('from-brand-primary', 'to-brand-secondary');
        btn.removeAttribute('data-editing');
    }
}

// Close dropdowns globally
document.addEventListener('click', function(evt) {
    if(!evt.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(d => d.classList.add('hidden'));
    }
});








let Oko_User_Prices = {};
const DEFAULT_OKO_PRICES = {};

function initUserPrices() {
    DEFAULT_OKO_PRICES.glasses = JSON.parse(JSON.stringify(typeof GLASS_TYPES !== 'undefined' ? GLASS_TYPES : []));
    DEFAULT_OKO_PRICES.shapes = JSON.parse(JSON.stringify(typeof SHAPES !== 'undefined' ? SHAPES : []));
    DEFAULT_OKO_PRICES.layouts = JSON.parse(JSON.stringify(typeof LAYOUTS !== 'undefined' ? LAYOUTS : []));
    DEFAULT_OKO_PRICES.nets = JSON.parse(JSON.stringify(typeof NET_TYPES !== 'undefined' ? NET_TYPES : []));
    DEFAULT_OKO_PRICES.salinox = JSON.parse(JSON.stringify(typeof SALINOX_PRICES !== 'undefined' ? SALINOX_PRICES : []));
    DEFAULT_OKO_PRICES.options = JSON.parse(JSON.stringify(typeof OPTIONS !== 'undefined' ? OPTIONS : []));
    DEFAULT_OKO_PRICES.sills = JSON.parse(JSON.stringify(typeof SILLS_DATA !== 'undefined' ? SILLS_DATA : []));
    DEFAULT_OKO_PRICES.slopes = JSON.parse(JSON.stringify(typeof SLOPES_DATA !== 'undefined' ? SLOPES_DATA : []));
    DEFAULT_OKO_PRICES.slopesProf = JSON.parse(JSON.stringify(typeof SLOPES_PROF_PRICES !== 'undefined' ? SLOPES_PROF_PRICES : {}));
    DEFAULT_OKO_PRICES.partition = JSON.parse(JSON.stringify(typeof PARTITION_PRICES !== 'undefined' ? PARTITION_PRICES : []));
    DEFAULT_OKO_PRICES.mount = JSON.parse(JSON.stringify(typeof MOUNT_PRICES !== 'undefined' ? MOUNT_PRICES : {}));
    DEFAULT_OKO_PRICES.presetServices = JSON.parse(JSON.stringify(typeof PRESET_SERVICES_DB !== 'undefined' ? PRESET_SERVICES_DB : []));
    DEFAULT_OKO_PRICES.raw_glasses = JSON.parse(JSON.stringify(typeof RAW_GLASS_TYPES !== 'undefined' ? RAW_GLASS_TYPES : []));
    DEFAULT_OKO_PRICES.sandwiches = JSON.parse(JSON.stringify(typeof SANDWICH_TYPES !== 'undefined' ? SANDWICH_TYPES : []));
    DEFAULT_OKO_PRICES.hardware = JSON.parse(JSON.stringify(typeof HARDWARE_TYPES !== 'undefined' ? HARDWARE_TYPES : []));
    DEFAULT_OKO_PRICES.blinds = JSON.parse(JSON.stringify(typeof BLINDS_TYPES !== 'undefined' ? BLINDS_TYPES : []));

    let username = localStorage.getItem('oko_username') || 'admin';
    let saved = localStorage.getItem('oko_user_prices_' + username);
    let hasSaved = false;
    if (saved) {
        try { 
            Oko_User_Prices = JSON.parse(saved); 
            if (Object.keys(Oko_User_Prices).length > 0) hasSaved = true;
        } catch(e) { Oko_User_Prices = null; }
    }
    
    if (!hasSaved) {
        if (username === 'admin') {
            Oko_User_Prices = JSON.parse(JSON.stringify(DEFAULT_OKO_PRICES));
        } else {
            Oko_User_Prices = {
                glasses: [], shapes: [], layouts: [], nets: [], salinox: [], options: [],
                sills: [], slopes: [], slopesProf: {}, partition: [], mount: {}, presetServices: [],
                raw_glasses: [], sandwiches: [], hardware: [], blinds: []
            };
        }
    } else {
        // Ensure all keys exist in case of old localStorage saves
        let fallback = username === 'admin' ? DEFAULT_OKO_PRICES : {
            glasses: [], shapes: [], layouts: [], nets: [], salinox: [], options: [],
            sills: [], slopes: [], slopesProf: {}, partition: [], mount: {}, presetServices: [],
            raw_glasses: [], sandwiches: [], hardware: [], blinds: []
        };
        for (let key in fallback) {
            if (Oko_User_Prices[key] === undefined) {
                Oko_User_Prices[key] = JSON.parse(JSON.stringify(fallback[key]));
            }
        }
    }

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
    if (typeof RAW_GLASS_TYPES !== 'undefined') RAW_GLASS_TYPES = Oko_User_Prices.raw_glasses || [];
    if (typeof BLINDS_TYPES !== 'undefined') BLINDS_TYPES = Oko_User_Prices.blinds || [];
    if (typeof BLINDS_FABRICS !== 'undefined') BLINDS_FABRICS = Oko_User_Prices.blinds || [];
}

initUserPrices();

// Запускаем периодическую проверку пробного периода