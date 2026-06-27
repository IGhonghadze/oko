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

function getApiUrl() {
    if (window.location.protocol === 'file:') return 'http://w98834km.beget.tech/api.php';
    return 'api.php';
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
    if (!Oko_User_Prices.raw_glasses) Oko_User_Prices.raw_glasses = [{ name: 'Стекло 4мм', price: 800 }];
    if (!Oko_User_Prices.blinds) Oko_User_Prices.blinds = [{ name: 'Ткань Альфа (категория 1)', price: 1500 }];
    
    renderAllAdminTabs();
    switchAdminTab('tab-admin-glasses');
    
    if (typeof loadAccountEmail === 'function') {
        loadAccountEmail();
    }
    
    if (typeof renderAccountSubscription === 'function') {
        renderAccountSubscription();
    }
    
    // Скрыть вкладку «Пользователи» для не-админов
    const isAdmin = localStorage.getItem('oko_is_admin') === 'true' || localStorage.getItem('oko_username') === 'admin';
    const usersTabBtn = document.querySelector('.admin-tab-btn[data-target="tab-admin-users"]');
    if (usersTabBtn) usersTabBtn.style.display = isAdmin ? '' : 'none';
    const usersTabContent = document.getElementById('tab-admin-users');
    if (usersTabContent && !isAdmin) usersTabContent.classList.add('hidden');
}

function closeAdminPanel() {
    document.getElementById('admin-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    if (typeof renderCart === 'function') renderCart();
}

function renderAccountSubscription() {
    const statusEl = document.getElementById('account-sub-status');
    const blockEl = document.getElementById('account-subscription-block');
    if (!statusEl || !blockEl) return;
    
    const isAdmin = localStorage.getItem('oko_is_admin') === 'true' || localStorage.getItem('oko_username') === 'admin';
    if (isAdmin) {
        blockEl.style.display = 'none';
        return;
    }
    
    const subUntil = localStorage.getItem('oko_subscription_until');
    if (!subUntil) {
        statusEl.innerHTML = '<span class="text-slate-500">Информация не найдена.</span>';
        return;
    }
    
    const until = new Date(subUntil);
    const now = new Date();
    const diffMs = until - now;
    const daysLeft = Math.ceil(diffMs / (1000*60*60*24));
    
    if (diffMs <= 0) {
        statusEl.innerHTML = '<span class="text-red-600 font-bold">❌ Подписка истекла</span><br><span class="text-xs text-slate-500">Доступ был до: ' + subUntil + '</span>';
        statusEl.className = 'mb-4 text-sm font-medium p-3 rounded-lg bg-red-50';
    } else {
        statusEl.innerHTML = '<span class="text-emerald-600 font-bold">✅ Подписка активна</span><br>Осталось дней: <b>' + daysLeft + '</b><br><span class="text-xs text-slate-500">Действует до: ' + subUntil + '</span>';
        statusEl.className = 'mb-4 text-sm font-medium p-3 rounded-lg bg-emerald-50';
    }
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-brand-primary', 'text-white', 'shadow-md', 'border-brand-primary');
        btn.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-50', 'border-slate-200', 'hover:border-slate-300', 'shadow-sm');
    });

    const activeBtn = document.querySelector(`.admin-tab-btn[data-target="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-slate-600', 'hover:bg-slate-50', 'border-slate-200', 'hover:border-slate-300', 'shadow-sm');
        activeBtn.classList.add('bg-brand-primary', 'text-white', 'shadow-md', 'border-brand-primary');
    }

    if (tabId === 'tab-admin-users') {
        loadAdminUsers();
    }
}

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (MVP) ===

const AVAILABLE_MODULES = [
    { id: 'glass', name: 'Стеклопакеты' },
    { id: 'sandwich', name: 'Сендвич-панели' },
    { id: 'glasses', name: 'Стёкла / Резка' },
    { id: 'nets', name: 'Москитные сетки' },
    { id: 'frameless', name: 'Безрамное / Офисное' },
    { id: 'sills', name: 'Подоконники' },
    { id: 'slopes', name: 'Откосы' },
    { id: 'shower', name: 'Душевые' },
    { id: 'rollers', name: 'Рольставни / Ворота' },
    { id: 'blinds', name: 'Жалюзи' },
    { id: 'hardware', name: 'Фурнитура' }
];

async function loadAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = '<tr><td colspan="7" class="p-4 text-center">Загрузка...</td></tr>';
    try {
        const res = await fetch(getApiUrl() + '?action=admin_users', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('oko_token') }
        });
        const data = await res.json();
        if (data.error) {
            list.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">${data.error}</td></tr>`;
            return;
        }
        list.innerHTML = '';
        data.forEach(u => {
            let subText = '';
            let subClass = '';
            if (u.id == 1) {
                subText = '∞ Бессрочно';
                subClass = 'text-emerald-600 bg-emerald-50';
            } else if (!u.subscription_until) {
                subText = 'Не задана';
                subClass = 'text-slate-400 bg-slate-50';
            } else {
                const until = new Date(u.subscription_until);
                const today = new Date(); today.setHours(0,0,0,0);
                const daysLeft = Math.ceil((until - today) / (1000*60*60*24));
                if (daysLeft < 0) {
                    subText = 'Истекла ' + u.subscription_until;
                    subClass = 'text-red-600 bg-red-50';
                } else if (daysLeft <= 3) {
                    subText = u.subscription_until + ' (' + daysLeft + ' дн.)';
                    subClass = 'text-amber-600 bg-amber-50';
                } else {
                    subText = u.subscription_until + ' (' + daysLeft + ' дн.)';
                    subClass = 'text-emerald-600 bg-emerald-50';
                }
            }
            
            // Modules string safely encoded for onclick
            const userModules = u.modules ? JSON.parse(u.modules) : [];
            const userModulesStr = encodeURIComponent(JSON.stringify(userModules));
            
            list.innerHTML += `
                <tr class="hover:bg-slate-50">
                    <td class="p-3 border-b border-slate-100">${u.id}</td>
                    <td class="p-3 border-b border-slate-100 font-bold">${u.username}</td>
                    <td class="p-3 border-b border-slate-100">${u.company_name}</td>
                    <td class="p-3 border-b border-slate-100"><span class="px-2 py-0.5 rounded text-xs font-bold ${subClass}">${subText}</span></td>
                    <td class="p-3 border-b border-slate-100">${u.created_at}</td>
                    <td class="p-3 border-b border-slate-100 text-right">
                        ${u.id != 1 ? `
                            <div class="flex flex-col gap-2">
                                <div class="flex flex-wrap items-center gap-1 justify-end">
                                    <span class="text-xs text-slate-500 mr-1">Дать доступ на:</span>
                                    <input id="sub-amount-${u.id}" type="number" value="1" min="1" class="w-12 text-xs border border-slate-200 rounded px-1 py-0.5 bg-white text-center">
                                    <select id="sub-unit-${u.id}" class="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white">
                                        <option value="days" selected>Дн.</option>
                                        <option value="minutes">Мин.</option>
                                        <option value="seconds">Сек.</option>
                                    </select>
                                    <button onclick="manageSubscription(${u.id}, 'set_relative')" class="text-white hover:bg-blue-600 bg-blue-500 px-2 py-1 rounded transition-colors text-xs font-bold" title="Установить время от текущего момента">Применить</button>
                                    
                                    <span class="text-slate-300 mx-1">|</span>
                                    
                                    <button onclick="manageSubscription(${u.id}, 'infinite')" class="text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors text-xs font-bold" title="Сделать бессрочным">Безлимит</button>
                                    <button onclick="manageSubscription(${u.id}, 'expire')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors text-xs font-bold" title="Заблокировать немедленно">Блок</button>
                                </div>
                                <div class="flex items-center gap-1 justify-end">
                                    <span class="text-xs text-slate-500 mr-1">Или до даты:</span>
                                    <input type="date" id="sub-date-${u.id}" class="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white">
                                    <button onclick="manageSubscription(${u.id}, 'set_date')" class="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors text-xs font-bold">ОК</button>
                                    
                                    <span class="text-slate-300 mx-1">|</span>
                                    <button onclick="openModulesModal(${u.id}, '${userModulesStr}')" class="text-brand-primary hover:text-brand-dark bg-brand-primary/10 hover:bg-brand-primary/20 px-2 py-1 rounded transition-colors text-xs font-bold">Доступ</button>
                                    <button onclick="deleteUser(${u.id})" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors text-xs font-bold">Удалить</button>
                                </div>
                            </div>
                        ` : '<span class="text-xs text-slate-400">Суперадмин</span>'}
                    </td>
                </tr>`;
        });
    } catch (e) {
        list.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-red-500">Ошибка сети</td></tr>';
    }
}

// === МОДУЛИ ДОСТУПА ===
function openModulesModal(userId, modulesEncodedStr) {
    const modules = JSON.parse(decodeURIComponent(modulesEncodedStr));
    document.getElementById('edit-modules-user-id').value = userId;
    
    const container = document.getElementById('modules-checkboxes-container');
    container.innerHTML = '';
    
    AVAILABLE_MODULES.forEach(mod => {
        const isChecked = modules.includes(mod.id);
        container.innerHTML += `
            <label class="flex items-center gap-2 cursor-pointer p-2 border border-slate-100 rounded hover:bg-slate-50 transition-colors">
                <input type="checkbox" value="${mod.id}" class="edit-module-cb w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary" ${isChecked ? 'checked' : ''}>
                <span class="text-slate-700 font-medium">${mod.name}</span>
            </label>
        `;
    });
    
    document.getElementById('modal-user-modules').classList.remove('hidden');
}

function closeModulesModal() {
    document.getElementById('modal-user-modules').classList.add('hidden');
}

async function saveUserModules() {
    const userId = document.getElementById('edit-modules-user-id').value;
    const checkboxes = document.querySelectorAll('.edit-module-cb');
    const modules = [];
    checkboxes.forEach(cb => {
        if (cb.checked) modules.push(cb.value);
    });
    
    try {
        const res = await fetch(getApiUrl() + '?action=admin_update_modules', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, modules: modules }),
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('oko_token'),
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (data.success) {
            closeModulesModal();
            loadAdminUsers();
        } else {
            alert(data.error || 'Ошибка сохранения модулей');
        }
    } catch (e) {
        alert('Ошибка сети при сохранении модулей');
    }
}

function openCreateUserModal() {
    document.getElementById('modal-create-user').classList.remove('hidden');
    document.getElementById('new-user-company').value = '';
    document.getElementById('new-user-login').value = '';
    document.getElementById('new-user-pass').value = '';
    
    const container = document.getElementById('new-user-modules-container');
    container.innerHTML = '';
    AVAILABLE_MODULES.forEach(mod => {
        container.innerHTML += `
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" value="${mod.id}" class="new-user-module-cb w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary">
                <span class="text-slate-700 font-medium">${mod.name}</span>
            </label>
        `;
    });
}

function closeCreateUserModal() {
    document.getElementById('modal-create-user').classList.add('hidden');
}

async function createUser() {
    const company = document.getElementById('new-user-company').value;
    const username = document.getElementById('new-user-login').value;
    const password = document.getElementById('new-user-pass').value;

    if (!company || !username || !password) return alert('Заполните все поля');

    const checkboxes = document.querySelectorAll('.new-user-module-cb');
    const modules = [];
    checkboxes.forEach(cb => {
        if (cb.checked) modules.push(cb.value);
    });

    try {
        const subDays = parseInt(document.getElementById('new-user-sub-days').value) || 30;
        const res = await fetch(getApiUrl() + '?action=admin_users', {
            method: 'POST',
            body: JSON.stringify({ company_name: company, username, password, subscription_days: subDays, modules: modules }),
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('oko_token'),
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (data.success) {
            closeCreateUserModal();
            loadAdminUsers();
        } else {
            alert(data.error || 'Ошибка создания');
        }
    } catch (e) {
        alert('Ошибка сети');
    }
}

async function deleteUser(id) {
    if (!confirm('Точно удалить клиента? Все его данные останутся в базе (но он не сможет войти).')) return;
    try {
        const res = await fetch(getApiUrl() + '?action=admin_users', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('oko_token') }
        });
        const data = await res.json();
        if (data.success) {
            loadAdminUsers();
        } else {
            alert(data.error || 'Ошибка удаления');
        }
    } catch (e) {
        alert('Ошибка сети');
    }
}

async function manageSubscription(userId, actionType) {
    const unitNames = { days: 'дн.', minutes: 'мин.', seconds: 'сек.' };
    let body = { user_id: userId, action_type: actionType };
    
    if (actionType === 'set_relative') {
        const amountEl = document.getElementById('sub-amount-' + userId);
        const unitEl = document.getElementById('sub-unit-' + userId);
        if (!amountEl || !unitEl) return;
        const amount = parseInt(amountEl.value);
        const unit = unitEl.value;
        if (!amount || amount <= 0) { alert('Введите число больше 0'); return; }
        const label = 'Установить доступ ровно на ' + amount + ' ' + unitNames[unit] + ' от текущего момента?';
        if (!confirm(label)) return;
        
        let msToAdd = 0;
        if (unit === 'days') msToAdd = amount * 86400000;
        else if (unit === 'minutes') msToAdd = amount * 60000;
        else if (unit === 'seconds') msToAdd = amount * 1000;
        
        const newDate = new Date(Date.now() + msToAdd);
        
        // Форматируем в YYYY-MM-DD HH:mm:ss для бэкенда
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const day = String(newDate.getDate()).padStart(2, '0');
        const hours = String(newDate.getHours()).padStart(2, '0');
        const minutes = String(newDate.getMinutes()).padStart(2, '0');
        const seconds = String(newDate.getSeconds()).padStart(2, '0');
        
        const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        
        // Меняем действие на set_date, так как мы вычислили точную дату
        body.action_type = 'set_date';
        body.new_date = dateString;
    } else if (actionType === 'set_date') {
        const dateEl = document.getElementById('sub-date-' + userId);
        if (!dateEl || !dateEl.value) { alert('Пожалуйста, выберите дату'); return; }
        if (!confirm('Установить окончание подписки на ' + dateEl.value + '?')) return;
        body.new_date = dateEl.value;
    } else if (actionType === 'expire') {
        if (!confirm('Заблокировать пользователя (обнулить подписку)?')) return;
    } else if (actionType === 'infinite') {
        if (!confirm('Сделать бессрочный доступ?')) return;
    }
    
    try {
        const res = await fetch(getApiUrl() + '?action=admin_subscription', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('oko_token'),
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (data.success) {
            loadAdminUsers();
        } else {
            alert(data.error || 'Ошибка');
        }
    } catch (e) {
        alert('Ошибка сети');
    }
}


// --- RENDERERS ---

function renderAllAdminTabs() {
    renderAdminGlasses();
    renderAdminRawGlasses();
    renderAdminLayouts();
    renderAdminShapes();
    renderAdminNets();
    renderAdminSills();
    renderAdminSlopes();
    renderAdminHardware();
    renderAdminSandwiches();
    renderAdminBlinds();
    renderAdminMount();
    renderAdminServices();
    if (typeof renderAdminBrand === 'function') renderAdminBrand();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function initSortable(wrapperElement, targetArray, renderFunction) {
    if (!wrapperElement || typeof Sortable === 'undefined') return;
    new Sortable(wrapperElement, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'bg-slate-100',
        onEnd: function (evt) {
            const oldIdx = evt.oldIndex;
            const newIdx = evt.newIndex;
            if (oldIdx === newIdx) return;
            
            saveAdminPrices(true);
            
            const item = targetArray.splice(oldIdx, 1)[0];
            targetArray.splice(newIdx, 0, item);
            
            renderFunction();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
}

function createRowInput(idPrefix, idx, obj, nameKey = 'name', priceKey = 'price', priceLabel = '₽', deleteAction = '') {
    return `
    <div class="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center gap-3">
        <div class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 px-1 transition-colors flex items-center gap-2" title="Перетащить">
            <i data-lucide="grip-vertical" class="w-5 h-5"></i>
            <span class="text-xs font-bold text-slate-400 w-4 text-center select-none">${idx + 1}</span>
        </div>
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
    initSortable(container.querySelector('.grid'), Oko_User_Prices.glasses, renderAdminGlasses);
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

function renderAdminRawGlasses() {
    const container = document.getElementById('admin-raw-glasses-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    (Oko_User_Prices.raw_glasses || []).forEach((g, idx) => {
        html += createRowInput('adm-raw_glass', idx, g, 'name', 'price', '₽/м²', `deleteAdminRawGlass(${idx})`);
    });
    html += `</div>
    <button onclick="addAdminRawGlass()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-slate-200 shadow-sm">
        <i data-lucide="plus" class="w-4 h-4"></i> Добавить стекло
    </button>`;
    container.innerHTML = html;
    if (Oko_User_Prices.raw_glasses) initSortable(container.querySelector('.grid'), Oko_User_Prices.raw_glasses, renderAdminRawGlasses);
}

function deleteAdminRawGlass(idx) {
    requirePin('Удалить стекло', () => {
        Oko_User_Prices.raw_glasses.splice(idx, 1);
        renderAdminRawGlasses();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function addAdminRawGlass() {
    requirePin('Добавить стекло', () => {
        if (!Oko_User_Prices.raw_glasses) Oko_User_Prices.raw_glasses = [];
        Oko_User_Prices.raw_glasses.push({ name: 'Новое стекло', price: 0 });
        renderAdminRawGlasses();
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
    initSortable(container.querySelector('.grid'), Oko_User_Prices.layouts, renderAdminLayouts);
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
    initSortable(container.querySelector('.grid'), Oko_User_Prices.shapes, renderAdminShapes);
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
            <div class="drag-handle absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 flex items-center gap-1" title="Перетащить">
                <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                <span class="text-xs font-bold text-slate-400 select-none">${idx + 1}</span>
            </div>
            <button onclick="deleteAdminNet(${idx})" class="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Удалить"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            <input type="text" class="w-[85%] bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-0 text-sm font-bold px-3 py-1.5 ml-6 rounded" id="adm-net-name-${idx}" value="${n.name}">
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
    initSortable(container.querySelector('.grid'), Oko_User_Prices.nets, renderAdminNets);
}

function deleteAdminNet(idx) { requirePin('Удалить сетку', () => { Oko_User_Prices.nets.splice(idx, 1); renderAdminNets(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminNet() { requirePin('Добавить сетку', () => { Oko_User_Prices.nets.push({ name: 'Новая сетка', price_min: 0, price_sqm: 0 }); renderAdminNets(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminSills() {
    const container = document.getElementById('admin-sills-container');
    if (!container) return;
    let html = `<div class="space-y-6 sills-brands-list">`;
    Oko_User_Prices.sills.forEach((brand, bIdx) => {
        html += `
        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 relative sortable-brand">
            <div class="drag-handle absolute top-4 left-4 p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500" title="Перетащить"><i data-lucide="grip-vertical" class="w-5 h-5"></i></div>
            <button onclick="deleteAdminSillBrand(${bIdx})" class="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors" title="Удалить бренд"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            <h4 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 pl-10">
                <i data-lucide="box" class="w-5 h-5 text-brand-primary"></i> Бренд: <input type="text" class="bg-white border border-slate-300 rounded px-3 py-1.5 font-bold" id="adm-sill-bname-${bIdx}" value="${brand.brand}">
            </h4>
            <div class="space-y-4 sills-groups-list-${bIdx}">`;
        brand.groups.forEach((grp, gIdx) => {
            html += `
                <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative sortable-group">
                    <div class="drag-handle absolute top-3 left-2 p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500" title="Перетащить"><i data-lucide="grip-vertical" class="w-4 h-4"></i></div>
                    <button onclick="deleteAdminSillGroup(${bIdx}, ${gIdx})" class="absolute top-3 right-3 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Удалить группу"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    <input type="text" class="w-[85%] bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-bold mb-3 ml-6" id="adm-sill-gname-${bIdx}-${gIdx}" value="${grp.name}">
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
    initSortable(container.querySelector('.sills-brands-list'), Oko_User_Prices.sills, renderAdminSills);
    Oko_User_Prices.sills.forEach((brand, bIdx) => {
        initSortable(container.querySelector(`.sills-groups-list-${bIdx}`), brand.groups, renderAdminSills);
    });
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
    initSortable(container.querySelector('.grid'), Oko_User_Prices.hardware, renderAdminHardware);
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
    initSortable(container.querySelector('.grid'), Oko_User_Prices.sandwiches, renderAdminSandwiches);
}
function deleteAdminSandwich(idx) { requirePin('Удалить сендвич', () => { Oko_User_Prices.sandwiches.splice(idx, 1); renderAdminSandwiches(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminSandwich() { requirePin('Добавить сендвич', () => { Oko_User_Prices.sandwiches.push({ name: 'Новый сендвич', price: 0 }); renderAdminSandwiches(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function renderAdminBlinds() {
    const container = document.getElementById('admin-blinds-container');
    if (!container) return;
    let html = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">`;
    (Oko_User_Prices.blinds || []).forEach((g, idx) => { html += createRowInput('adm-blind', idx, g, 'name', 'price', '₽', `deleteAdminBlind(${idx})`); });
    html += `</div><button onclick="addAdminBlind()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i> Добавить ткань</button>`;
    container.innerHTML = html;
    if (Oko_User_Prices.blinds) initSortable(container.querySelector('.grid'), Oko_User_Prices.blinds, renderAdminBlinds);
}
function deleteAdminBlind(idx) { requirePin('Удалить ткань', () => { Oko_User_Prices.blinds.splice(idx, 1); renderAdminBlinds(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminBlind() { requirePin('Добавить ткань', () => { if(!Oko_User_Prices.blinds) Oko_User_Prices.blinds = []; Oko_User_Prices.blinds.push({ name: 'Новая ткань', price: 0 }); renderAdminBlinds(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

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
    let html = `<div class="space-y-3 services-list">
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
            <div class="col-span-4 flex items-center gap-2">
                <div class="drag-handle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 flex items-center gap-1">
                    <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                    <span class="text-xs font-bold text-slate-400 select-none">${idx + 1}</span>
                </div>
                <input type="text" class="flex-1 p-2 bg-slate-50 border border-slate-200 focus:border-brand-primary focus:ring-0 text-xs font-bold rounded" id="adm-srv-name-${idx}" value="${srv.name}">
            </div>
            <div class="col-span-1"><input type="text" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-unit-${idx}" value="${srv.unit}"></div>
            <div class="col-span-2"><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-p0-${idx}" value="${srv.prices[0]}"></div>
            <div class="col-span-2"><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-p1-${idx}" value="${srv.prices[1]}"></div>
            <div class="col-span-2"><input type="number" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-center" id="adm-srv-p2-${idx}" value="${srv.prices[2]}"></div>
            <div class="col-span-1 text-center"><button onclick="deleteAdminService(${idx})" class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Удалить"><i data-lucide="trash-2" class="w-4 h-4 mx-auto"></i></button></div>
        </div>`;
    });
    html += `</div><button onclick="addAdminService()" class="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200 shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i> Добавить услугу</button>`;
    container.innerHTML = html;
    initSortable(container.querySelector('.services-list'), Oko_User_Prices.presetServices, renderAdminServices);
}

function deleteAdminService(idx) { requirePin('Удалить услугу', () => { Oko_User_Prices.presetServices.splice(idx, 1); renderAdminServices(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }
function addAdminService() { requirePin('Добавить услугу', () => { Oko_User_Prices.presetServices.push({ name: 'Новая услуга', unit: 'шт', prices: [0,0,0] }); renderAdminServices(); if(typeof lucide!=='undefined') lucide.createIcons(); }); }

function handleAdminExcelUpload(event, category) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            
            if (!rows || rows.length < 2) {
                alert("Файл пуст или имеет неверный формат.");
                return;
            }

            requirePin('Загрузить из Excel', () => {
                const parseNum = v => parseFloat(String(v).replace(',', '.').replace(/[^0-9.-]+/g, "")) || 0;
                
                if (['glasses', 'raw_glasses', 'layouts', 'hardware', 'sandwiches', 'blinds'].includes(category)) {
                    let newData = [];
                    for(let i=1; i<rows.length; i++) {
                        if(rows[i][0]) newData.push({ name: String(rows[i][0]).trim(), price: parseNum(rows[i][1]) });
                    }
                    if(newData.length > 0) Oko_User_Prices[category] = newData;
                } else if (category === 'nets') {
                    for(let i=1; i<rows.length; i++) {
                        if(rows[i][0]) {
                            let id = String(rows[i][0]).trim();
                            let exist = (Oko_User_Prices.nets||[]).find(n => n.id === id);
                            if(exist) {
                                exist.name = String(rows[i][1]||"").trim();
                                exist.price_min = parseNum(rows[i][2]);
                                exist.price_sqm = parseNum(rows[i][3]);
                            }
                        }
                    }
                } else if (category === 'services') {
                    let newData = [];
                    for(let i=1; i<rows.length; i++) {
                        if(rows[i][0]) newData.push({ name: String(rows[i][0]).trim(), unit: String(rows[i][1]||"шт").trim(), prices: [parseNum(rows[i][2]), parseNum(rows[i][3]), parseNum(rows[i][4])] });
                    }
                    if(newData.length > 0) Oko_User_Prices.presetServices = newData;
                } else if (category === 'mount') {
                    let m = Oko_User_Prices.mount || {};
                    for(let i=1; i<rows.length; i++) {
                        let name = String(rows[i][0]||"").toLowerCase();
                        let p = parseNum(rows[i][1]);
                        if(name.includes('монтаж окна')) m.window = p;
                        else if(name.includes('монтаж балкона')) m.balcony = p;
                        else if(name.includes('демонтаж окна')) m.demountWindow = p;
                        else if(name.includes('демонтаж балкона')) m.demountBalcony = p;
                    }
                    Oko_User_Prices.mount = m;
                } else if (category === 'sills') {
                    let newData = [];
                    let currentBrand = null;
                    let currentGroup = null;
                    for(let i=1; i<rows.length; i++) {
                        if(rows[i][0]) { // new brand
                            currentBrand = { brand: String(rows[i][0]).trim(), groups: [] };
                            newData.push(currentBrand);
                        }
                        if(rows[i][1] && currentBrand) { // new group
                            currentGroup = { name: String(rows[i][1]).trim(), cap: parseNum(rows[i][2]), conn90: parseNum(rows[i][3]), conn150: parseNum(rows[i][4]), widths: {} };
                            currentBrand.groups.push(currentGroup);
                        }
                        if(rows[i][5] && currentGroup) { // new width
                            currentGroup.widths[String(rows[i][5]).trim()] = parseNum(rows[i][6]);
                        }
                    }
                    if(newData.length > 0) Oko_User_Prices.sills = newData;
                } else if (category === 'slopes') {
                    let newData = [];
                    for(let i=1; i<rows.length; i++) {
                        if(rows[i][1]) newData.push({ name: String(rows[i][1]).trim(), width: rows[i][2] ? String(rows[i][2]).trim() : "", price: parseNum(rows[i][3]) });
                    }
                    if(newData.length > 0) Oko_User_Prices.slopes = newData;
                }

                saveAdminPrices();
                renderAllAdminTabs();
                alert(`Данные успешно загружены из файла ${file.name}`);
            });
        } catch(err) {
            console.error(err);
            alert("Ошибка при чтении файла.");
        }
        event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

// --- SAVE & RESET ---

function saveAdminPrices(silent = false) {
    try {
        ['glasses', 'raw_glasses', 'layouts', 'hardware', 'sandwiches', 'blinds'].forEach(cat => {
            (Oko_User_Prices[cat] || []).forEach((g, idx) => {
                let prefix = cat.replace(/es$|s$/, '');
                if(cat === 'glasses') prefix = 'glass';
                if(cat === 'raw_glasses') prefix = 'raw_glass';
                const elName = document.getElementById(`adm-${prefix}-name-${idx}`);
                const elPrice = document.getElementById(`adm-${prefix}-price-${idx}`);
                if(elName) g.name = elName.value;
                if(elPrice) g.price = parseFloat(elPrice.value) || 0;
            });
        });

        (Oko_User_Prices.shapes || []).forEach((s, idx) => {
            const elName = document.getElementById(`adm-shape-name-${idx}`);
            const elPrice = document.getElementById(`adm-shape-price-${idx}`);
            if(elName) s.name = elName.value;
            if(elPrice) s.multiplier = parseFloat(elPrice.value) || 0;
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

        let username = localStorage.getItem('oko_username') || 'admin';
        localStorage.setItem('oko_user_prices_' + username, JSON.stringify(Oko_User_Prices));
        
        // Save brand settings too
        if (typeof saveBrandFromAdmin === 'function') saveBrandFromAdmin();
        
        // Multi-tenancy: сохраняем бренд и прайсы на сервер
        if (typeof saveBrandToServer === 'function') saveBrandToServer();
        if (typeof savePricesToServer === 'function') savePricesToServer();
        
        // Sync global arrays from Oko_User_Prices so dropdowns reflect new items
        if (typeof GLASS_TYPES !== 'undefined') GLASS_TYPES = Oko_User_Prices.glasses || [];
        if (typeof RAW_GLASS_TYPES !== 'undefined') RAW_GLASS_TYPES = Oko_User_Prices.raw_glasses || [];
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
        if (typeof BLINDS_TYPES !== 'undefined') BLINDS_TYPES = Oko_User_Prices.blinds || [];
        if (typeof BLINDS_FABRICS !== 'undefined') BLINDS_FABRICS = Oko_User_Prices.blinds || [];

        if (!silent) alert('Настройки успешно сохранены!');
        
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
    } catch (err) {
        alert("Ошибка при сохранении: " + err.message);
        console.error("Ошибка при сохранении:", err);
    }
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

// --- EXCEL TEMPLATES ---
function downloadExcelTemplate(category) {
    saveAdminPrices(); // Ensure current UI state is saved before export
    let data = [];
    if (category === 'glasses') {
        data.push(["Название стеклопакета", "Цена (₽)"]);
        (Oko_User_Prices.glasses || []).forEach(item => data.push([item.name, item.price]));
    } else if (category === 'raw_glasses') {
        data.push(["Название стекла", "Цена (₽)"]);
        (Oko_User_Prices.raw_glasses || []).forEach(item => data.push([item.name, item.price]));
    } else if (category === 'layouts') {
        data.push(["Название раскладки", "Цена (₽)"]);
        (Oko_User_Prices.layouts || []).forEach(item => data.push([item.name, item.price]));
    } else if (category === 'hardware') {
        data.push(["Название фурнитуры", "Цена (₽)"]);
        (Oko_User_Prices.hardware || []).forEach(item => data.push([item.name, item.price]));
    } else if (category === 'sandwiches') {
        data.push(["Тип сендвич-панели", "Цена (₽)"]);
        (Oko_User_Prices.sandwiches || []).forEach(item => data.push([item.name, item.price]));
    } else if (category === 'blinds') {
        data.push(["Название ткани/жалюзи", "Цена (₽)"]);
        (Oko_User_Prices.blinds || []).forEach(item => data.push([item.name, item.price]));
    } else if (category === 'nets') {
        data.push(["ID (не менять)", "Название", "Цена (до 1 м2)", "Цена (за 1 м2)"]);
        (Oko_User_Prices.nets || []).forEach(item => {
            data.push([item.id, item.name, item.price_min, item.price_sqm]);
        });
    } else if (category === 'services') {
        data.push(["Название", "Ед. изм.", "Офис (₽)", "Монтажник (₽)", "Бригада (₽)"]);
        (Oko_User_Prices.presetServices || []).forEach(item => {
            data.push([item.name, item.unit, item.prices[0], item.prices[1], item.prices[2]]);
        });
    } else if (category === 'sills') {
        data.push(["Бренд", "Группа/Цвет", "Заглушка", "Соединитель 90", "Соединитель 150", "Ширина", "Цена"]);
        (Oko_User_Prices.sills || []).forEach(brand => {
            (brand.groups || []).forEach(group => {
                let first = true;
                Object.keys(group.widths || {}).forEach(w => {
                    if(first) {
                        data.push([brand.brand, group.name, group.cap, group.conn90, group.conn150, w, group.widths[w]]);
                        first = false;
                    } else {
                        data.push(["", "", "", "", "", w, group.widths[w]]);
                    }
                });
            });
        });
    } else if (category === 'slopes') {
        data.push(["Тип (панель/уголок/профиль)", "Название", "Ширина (если есть)", "Цена"]);
        (Oko_User_Prices.slopes || []).forEach(item => {
            data.push(["панель/уголок", item.name, item.width || "", item.price]);
        });
    } else if (category === 'mount') {
        data.push(["Тип", "Цена"]);
        let m = Oko_User_Prices.mount || {};
        data.push(["Монтаж Окна", m.window || 0]);
        data.push(["Монтаж Балкона", m.balcony || 0]);
        data.push(["Демонтаж Окна", m.demountWindow || 0]);
        data.push(["Демонтаж Балкона", m.demountBalcony || 0]);
    } else {
        alert("Экспорт для этого раздела пока не поддерживается.");
        return;
    }

    if (data.length === 1) { // Only headers
        data.push(["Пример", 100]); // Add dummy row so template isnt empty
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Прайс");
    XLSX.writeFile(wb, `Шаблон_${category}.xlsx`);
}

// ==========================================
// MULTI-TENANCY: Серверная синхронизация цен
// ==========================================

/**
 * Сохраняет прайс-лист текущей компании на сервер.
 * company_id определяется на сервере по токену.
 */
async function savePricesToServer() {
    try {
        const token = localStorage.getItem('oko_token');
        if (!token) return;

        const apiUrl = getApiUrl();
        const resp = await fetch(apiUrl + '?action=save_company_prices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ prices: Oko_User_Prices })
        });
        const result = await resp.json();
        if (result.success) {
            console.log('[Multi-tenancy] Прайс-лист сохранён на сервер');
        } else {
            console.warn('[Multi-tenancy] Ошибка сохранения прайсов:', result.error);
        }
    } catch (e) {
        console.warn('[Multi-tenancy] Не удалось сохранить прайсы на сервер:', e);
    }
}

/**
 * Загружает прайс-лист текущей компании с сервера.
 * Если на сервере есть данные — обновляет Oko_User_Prices и localStorage.
 */
async function loadPricesFromServer() {
    try {
        const token = localStorage.getItem('oko_token');
        if (!token) return;

        const apiUrl = getApiUrl();
        const resp = await fetch(apiUrl + '?action=get_company_prices', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await resp.json();

        if (result.success && result.prices) {
            Oko_User_Prices = result.prices;
            const username = localStorage.getItem('oko_username') || 'admin';
            localStorage.setItem('oko_user_prices_' + username, JSON.stringify(Oko_User_Prices));

            // Синхронизируем глобальные массивы
            if (typeof GLASS_TYPES !== 'undefined') GLASS_TYPES = Oko_User_Prices.glasses || [];
            if (typeof RAW_GLASS_TYPES !== 'undefined') RAW_GLASS_TYPES = Oko_User_Prices.raw_glasses || [];
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
            if (typeof BLINDS_TYPES !== 'undefined') BLINDS_TYPES = Oko_User_Prices.blinds || [];
            if (typeof BLINDS_FABRICS !== 'undefined') BLINDS_FABRICS = Oko_User_Prices.blinds || [];

            console.log('[Multi-tenancy] Прайс-лист загружен с сервера');
            
            // ОБНОВЛЯЕМ ИНТЕРФЕЙС, ЧТОБЫ НОВЫЕ ПОЗИЦИИ ПОЯВИЛИСЬ В ВЫПАДАЮЩИХ СПИСКАХ
            if (typeof initPresetServices === 'function') initPresetServices();
            if (typeof updateDropdownPrices === 'function') updateDropdownPrices();
            if (typeof initSillsTab === 'function') initSillsTab();
            if (typeof initSlopesTab === 'function') initSlopesTab();
            if (typeof updateRollerProfiles === 'function') updateRollerProfiles();
            if (typeof initBlindsTab === 'function') initBlindsTab();
            
            let shapeSelect = document.getElementById('glass-shape');
            if (shapeSelect && typeof SHAPES !== 'undefined') {
                shapeSelect.innerHTML = '';
                SHAPES.forEach((s, i) => shapeSelect.innerHTML += `<option value="${i}">${s.name}</option>`);
            }
        }
    } catch (e) {
        console.warn('[Multi-tenancy] Не удалось загрузить прайсы с сервера:', e);
    }
}

/**
 * Загружает ВСЕ данные компании с сервера (бренд + прайсы).
 * Вызывается после успешного логина.
 */
async function loadCompanyDataFromServer() {
    console.log('[Multi-tenancy] Загружаю данные компании с сервера...');
    
    // Загружаем параллельно — бренд и прайсы
    const promises = [];
    
    if (typeof loadBrandFromServer === 'function') {
        promises.push(loadBrandFromServer());
    }
    promises.push(loadPricesFromServer());
    
    await Promise.all(promises);
    
    console.log('[Multi-tenancy] Все данные компании загружены');
}

// === ACCOUNT MANAGEMENT ===
async function loadAccountEmail() {
    const emailInp = document.getElementById('account-email');
    if (!emailInp) return;
    try {
        const res = await fetch(API_URL_AUTH + '?action=get_account', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('oko_token') }
        });
        const data = await res.json();
        if (data.success && data.email) {
            emailInp.value = data.email;
        }
    } catch (e) {
        console.error('Failed to load account email', e);
    }
}

async function saveAccountEmail() {
    const emailInp = document.getElementById('account-email');
    const msgEl = document.getElementById('account-msg');
    if (!emailInp || !msgEl) return;
    
    msgEl.textContent = 'Сохранение...';
    msgEl.className = 'text-sm font-medium pl-1 text-slate-500 mt-1';
    msgEl.classList.remove('hidden');
    
    try {
        const res = await fetch(API_URL_AUTH + '?action=update_account', {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('oko_token'),
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email: emailInp.value })
        });
        const data = await res.json();
        if (data.success) {
            msgEl.textContent = 'Email успешно сохранен!';
            msgEl.className = 'text-sm font-medium pl-1 text-green-600 mt-1';
        } else {
            msgEl.textContent = data.error || 'Ошибка сохранения';
            msgEl.className = 'text-sm font-medium pl-1 text-red-500 mt-1';
        }
    } catch (e) {
        msgEl.textContent = 'Ошибка сети';
        msgEl.className = 'text-sm font-medium pl-1 text-red-500 mt-1';
    }
}

// ==========================================
// ANALYTICS DASHBOARD
// ==========================================
function renderAnalyticsDashboard() {
    // Ensure archive is loaded
    if (typeof GLOBAL_ARCHIVE_CACHE === 'undefined' || GLOBAL_ARCHIVE_CACHE.length === 0) {
        if (typeof fetchArchive === 'function') {
            fetchArchive().then(() => drawAnalytics());
        } else {
            drawAnalytics();
        }
    } else {
        drawAnalytics();
    }
}

function drawAnalytics() {
    let totalKp = 0;
    let totalRevenue = 0;
    let totalMargin = 0;
    let totalBaseSum = 0;
    
    let recentRows = '';
    
    // Sort archive by date descending
    let archive = (typeof GLOBAL_ARCHIVE_CACHE !== 'undefined') ? [...GLOBAL_ARCHIVE_CACHE] : [];
    archive.sort((a, b) => b.id - a.id);
    
    archive.forEach((kp, idx) => {
        totalKp++;
        let rev = kp.totals ? kp.totals.finalTotal : 0;
        let base = kp.totals ? kp.totals.baseSum : 0;
        let margin = rev - base;
        
        totalRevenue += rev;
        totalBaseSum += base;
        totalMargin += margin;
        
        if (idx < 20) {
            let clientName = kp.client ? `${kp.client.name} (${kp.client.phone || ''})` : 'Без клиента';
            let dateStr = new Date(kp.id).toLocaleDateString('ru-RU');
            
            recentRows += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-medium text-slate-800">${kp.kpId || ('КП-'+kp.id.toString().slice(-4))}</td>
                    <td class="px-4 py-3 text-slate-500">${dateStr}</td>
                    <td class="px-4 py-3 text-slate-600">${clientName}</td>
                    <td class="px-4 py-3 text-right font-bold text-slate-800">${rev.toLocaleString()} ₽</td>
                    <td class="px-4 py-3 text-right font-bold text-emerald-600">+${margin.toLocaleString()} ₽</td>
                </tr>
            `;
        }
    });
    
    let avgCheck = totalKp > 0 ? Math.round(totalRevenue / totalKp) : 0;
    let marginPercent = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 100) : 0;
    
    let summaryHtml = `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div class="text-sm text-slate-500 mb-1 flex items-center gap-1"><i data-lucide="file-text" class="w-4 h-4"></i> Выставлено КП</div>
            <div class="text-2xl font-black text-slate-800">${totalKp}</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div class="text-sm text-slate-500 mb-1 flex items-center gap-1"><i data-lucide="banknote" class="w-4 h-4"></i> Общая выручка</div>
            <div class="text-2xl font-black text-blue-600">${totalRevenue.toLocaleString()} ₽</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div class="text-sm text-slate-500 mb-1 flex items-center gap-1"><i data-lucide="trending-up" class="w-4 h-4"></i> Прибыль (Маржа)</div>
            <div class="text-2xl font-black text-emerald-600">${totalMargin.toLocaleString()} ₽ <span class="text-xs text-slate-400 font-normal ml-1">(${marginPercent}%)</span></div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div class="text-sm text-slate-500 mb-1 flex items-center gap-1"><i data-lucide="shopping-bag" class="w-4 h-4"></i> Средний чек</div>
            <div class="text-2xl font-black text-indigo-600">${avgCheck.toLocaleString()} ₽</div>
        </div>
    `;
    
    document.getElementById('analytics-summary-cards').innerHTML = summaryHtml;
    
    if (recentRows === '') {
        recentRows = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Архив просчетов пока пуст</td></tr>`;
    }
    
    document.getElementById('analytics-recent-table').innerHTML = recentRows;
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}
