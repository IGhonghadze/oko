// ==========================================
// Oko Calculator — Основной скрипт
// ==========================================

function getApiUrl() {
    if (window.location.protocol === 'file:') {
        return 'http://w98834km.beget.tech/api.php';
    }
    return 'api.php';
}
const API_URL_AUTH = getApiUrl();

async function doLogin() {
    const userInp = document.getElementById('login-username');
    const passInp = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    
    if (!userInp.value || !passInp.value) return;

    try {
        const res = await fetch(API_URL_AUTH + '?action=login_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userInp.value, password: passInp.value })
        });
        const data = await res.json();
        
        if (data.success) {
            localStorage.setItem('oko_token', data.session_token || data.token);
            localStorage.setItem('oko_company', data.company_name);
            localStorage.setItem('oko_username', userInp.value);
            localStorage.setItem('oko_is_admin', data.is_admin ? 'true' : 'false');
            localStorage.setItem('oko_role', data.role || 'owner');
            if (data.subscription_until) {
                localStorage.setItem('oko_subscription_until', data.subscription_until);
            } else {
                localStorage.removeItem('oko_subscription_until');
            }
            
            localStorage.setItem('oko_modules', JSON.stringify(data.modules || []));
            document.getElementById('pwd-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            document.getElementById('current-company-name').textContent = data.company_name;
            updateTrialCounter();
            errorEl.classList.add('hidden');
            
            applyModules();
            
            // Multi-tenancy: сохраняем company_id и загружаем данные компании с сервера
            if (data.company_id) {
                localStorage.setItem('oko_company_id', data.company_id);
            }
            if (typeof loadCompanyDataFromServer === 'function') {
                loadCompanyDataFromServer();
            }
            
            // Перезагрузим архив, если он есть
            if (typeof fetchArchive === 'function') fetchArchive();
        } else {
            if (data.error) {
                errorEl.textContent = data.error;
            } else {
                errorEl.textContent = 'Неверный email или пароль';
            }
            showLoginError(errorEl, userInp, passInp);
        }
    } catch (e) {
        console.error(e);
        errorEl.textContent = 'Ошибка сети: ' + e.message;
        showLoginError(errorEl, userInp, passInp);
    }
}

function showLoginError(errorEl, userInp, passInp) {
    errorEl.classList.remove('hidden');
    userInp.classList.add('border-red-500');
    passInp.classList.add('border-red-500');
    setTimeout(() => { 
        userInp.classList.remove('border-red-500'); 
        passInp.classList.remove('border-red-500'); 
        errorEl.classList.add('hidden');
    }, 1500);
}

function togglePasswordVisibility(inputIds, iconId) {
    const ids = inputIds.split(',');
    let isPassword = false;
    
    ids.forEach(id => {
        const input = document.getElementById(id.trim());
        if (input) {
            if (input.type === 'password') {
                input.type = 'text';
                isPassword = true; // Was password, now text
            } else {
                input.type = 'password';
            }
        }
    });

    const icon = document.getElementById(iconId);
    if (icon) {
        if (isPassword) {
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            icon.setAttribute('data-lucide', 'eye');
        }
    }
    if (window.lucide) window.lucide.createIcons();
}

function doLogout() {
    localStorage.removeItem('oko_token');
    localStorage.removeItem('oko_company');
    localStorage.removeItem('oko_username');
    localStorage.removeItem('oko_is_admin');
    localStorage.removeItem('oko_modules');
    localStorage.removeItem('oko_role');
    location.reload();
}

// === RBAC: Переключение форм вход/регистрация ===
function showRegisterForm() {
    document.getElementById('login-card').style.display = 'none';
    const regCard = document.getElementById('register-card');
    regCard.style.display = 'block';
    regCard.classList.add('animate-[fadeInUp_0.4s_ease-out_forwards]');
    if (window.lucide) window.lucide.createIcons();
}
function showLoginForm() {
    document.getElementById('register-card').style.display = 'none';
    const forgotCard = document.getElementById('forgot-card');
    if (forgotCard) forgotCard.style.display = 'none';
    document.getElementById('login-card').style.display = 'block';
    if (window.lucide) window.lucide.createIcons();
}

// === RBAC: Глобальный обработчик 401 (Strict Single Session) ===
const _originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await _originalFetch.apply(this, args);
    if (response.status === 401) {
        try {
            const clone = response.clone();
            const body = await clone.json();
            if (body.kicked) {
                alert('Выполнен вход с другого устройства. Вы будете разлогинены.');
                doLogout();
                return response;
            }
        } catch(e) { /* ignore parse errors */ }
    }
    return response;
};

// === RBAC: Таймер для кнопок отправки кода ===
function startOtpTimer(btnId, textId, defaultText) {
    const btn = document.getElementById(btnId);
    const textSpan = document.getElementById(textId);
    if (!btn || !textSpan) return;
    
    let timeLeft = 60;
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    
    const interval = setInterval(() => {
        timeLeft--;
        textSpan.textContent = `Повторить через ${timeLeft} сек`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            textSpan.textContent = defaultText;
        }
    }, 1000);
}

// === RBAC: Регистрация (шаг 1) ===
let _regEmail = '';
async function doRegisterRequest() {
    const emailInp = document.getElementById('reg-email');
    const companyInp = document.getElementById('reg-company');
    const errorEl = document.getElementById('reg-error-1');
    const btn = document.querySelector('#reg-step-1 button');
    
    if (btn.disabled) return;
    if (!emailInp.value || !companyInp.value) { errorEl.textContent = 'Заполните все поля'; errorEl.classList.remove('hidden'); return; }
    
    // Запускаем таймер
    startOtpTimer(btn.id || 'reg-btn-1', 'reg-btn-text' || btn.querySelector('span > span').id, 'Получить код');
    if (!btn.id) {
        btn.id = 'reg-btn-1';
        btn.querySelector('span > span') ? btn.querySelector('span > span').id = 'reg-btn-text' : btn.querySelector('span').innerHTML = '<span id="reg-btn-text">Получить код</span>' + btn.querySelector('span').innerHTML.replace('Получить код', '');
        startOtpTimer('reg-btn-1', 'reg-btn-text', 'Получить код');
    }
    
    try {
        const res = await fetch(API_URL_AUTH + '?action=register_request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInp.value, company_name: companyInp.value })
        });
        const data = await res.json();
        if (data.success) {
            _regEmail = emailInp.value;
            document.getElementById('reg-step-1').style.display = 'none';
            document.getElementById('reg-step-2').style.display = 'block';
            document.getElementById('reg-email-display').textContent = _regEmail;
            errorEl.classList.add('hidden');
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => document.getElementById('reg-otp').focus(), 100);
        } else {
            errorEl.textContent = data.error || 'Ошибка';
            errorEl.classList.remove('hidden');
        }
    } catch(e) {
        errorEl.textContent = 'Ошибка сети: ' + e.message;
        errorEl.classList.remove('hidden');
    }
}

// === RBAC: Регистрация (шаг 2) ===
async function doRegisterVerify() {
    const otpInp = document.getElementById('reg-otp');
    const errorEl = document.getElementById('reg-error-2');
    if (!otpInp.value || otpInp.value.length < 4) return;
    try {
        const res = await fetch(API_URL_AUTH + '?action=register_verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: _regEmail, otp_code: otpInp.value })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('reg-step-2').style.display = 'none';
            document.getElementById('reg-step-3').style.display = 'block';
            errorEl.classList.add('hidden');
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => document.getElementById('reg-password').focus(), 100);
        } else {
            errorEl.textContent = data.error || 'Неверный код';
            errorEl.classList.remove('hidden');
        }
    } catch(e) {
        errorEl.textContent = 'Ошибка сети: ' + e.message;
        errorEl.classList.remove('hidden');
    }
}

// === RBAC: Регистрация (шаг 3) ===
async function doRegisterSetPassword() {
    const passInp = document.getElementById('reg-password');
    const confirmInp = document.getElementById('reg-password-confirm');
    const errorEl = document.getElementById('reg-error-3');
    if (!passInp.value || passInp.value.length < 6) {
        errorEl.textContent = 'Пароль должен быть не менее 6 символов';
        errorEl.classList.remove('hidden'); return;
    }
    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(passInp.value)) {
        errorEl.textContent = 'Пароль может содержать только латинские буквы, цифры и спецсимволы';
        errorEl.classList.remove('hidden'); return;
    }
    if (passInp.value !== confirmInp.value) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.classList.remove('hidden'); return;
    }
    try {
        const res = await fetch(API_URL_AUTH + '?action=register_set_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: _regEmail, password: passInp.value })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('oko_token', data.session_token);
            localStorage.setItem('oko_company', data.company_name);
            localStorage.setItem('oko_username', _regEmail);
            localStorage.setItem('oko_is_admin', data.is_admin ? 'true' : 'false');
            localStorage.setItem('oko_role', data.role || 'owner');
            localStorage.setItem('oko_modules', JSON.stringify(data.modules || []));
            if (data.company_id) localStorage.setItem('oko_company_id', data.company_id);
            document.getElementById('pwd-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            document.getElementById('current-company-name').textContent = data.company_name;
            applyModules();
            if (typeof loadCompanyDataFromServer === 'function') loadCompanyDataFromServer();
            if (typeof fetchArchive === 'function') fetchArchive();
        } else {
            errorEl.textContent = data.error || 'Ошибка';
            errorEl.classList.remove('hidden');
        }
    } catch(e) {
        errorEl.textContent = 'Ошибка сети: ' + e.message;
        errorEl.classList.remove('hidden');
    }
}

// === RBAC: Восстановление пароля ===
function showForgotPasswordForm() {
    document.getElementById('login-card').style.display = 'none';
    document.getElementById('register-card').style.display = 'none';
    const forgotCard = document.getElementById('forgot-card');
    forgotCard.style.display = 'block';
    forgotCard.classList.add('animate-[fadeInUp_0.4s_ease-out_forwards]');
    if (window.lucide) window.lucide.createIcons();
}

let _forgotEmail = '';
async function doForgotRequest() {
    const emailInp = document.getElementById('forgot-email');
    const errorEl = document.getElementById('forgot-error-1');
    const btn = document.getElementById('forgot-btn-1');
    
    if (btn.disabled) return;
    if (!emailInp.value) { errorEl.textContent = 'Укажите email'; errorEl.classList.remove('hidden'); return; }
    
    startOtpTimer('forgot-btn-1', 'forgot-btn-text', 'Получить код');
    
    try {
        const res = await fetch(API_URL_AUTH + '?action=forgot_request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInp.value })
        });
        const data = await res.json();
        if (data.success) {
            _forgotEmail = emailInp.value;
            document.getElementById('forgot-step-1').style.display = 'none';
            document.getElementById('forgot-step-2').style.display = 'block';
            document.getElementById('forgot-email-display').textContent = _forgotEmail;
            errorEl.classList.add('hidden');
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => document.getElementById('forgot-otp').focus(), 100);
        } else {
            errorEl.textContent = data.error || 'Ошибка';
            errorEl.classList.remove('hidden');
        }
    } catch(e) {
        errorEl.textContent = 'Ошибка сети: ' + e.message;
        errorEl.classList.remove('hidden');
    }
}

async function doForgotVerify() {
    const otpInp = document.getElementById('forgot-otp');
    const errorEl = document.getElementById('forgot-error-2');
    if (!otpInp.value || otpInp.value.length < 4) return;
    try {
        const res = await fetch(API_URL_AUTH + '?action=forgot_verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: _forgotEmail, otp_code: otpInp.value })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('forgot-step-2').style.display = 'none';
            document.getElementById('forgot-step-3').style.display = 'block';
            errorEl.classList.add('hidden');
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => document.getElementById('forgot-password').focus(), 100);
        } else {
            errorEl.textContent = data.error || 'Неверный код';
            errorEl.classList.remove('hidden');
        }
    } catch(e) {
        errorEl.textContent = 'Ошибка сети: ' + e.message;
        errorEl.classList.remove('hidden');
    }
}

async function doForgotSetPassword() {
    const passInp = document.getElementById('forgot-password');
    const confirmInp = document.getElementById('forgot-password-confirm');
    const errorEl = document.getElementById('forgot-error-3');
    if (!passInp.value || passInp.value.length < 6) {
        errorEl.textContent = 'Пароль должен быть не менее 6 символов';
        errorEl.classList.remove('hidden'); return;
    }
    if (!/^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(passInp.value)) {
        errorEl.textContent = 'Пароль может содержать только латинские буквы, цифры и спецсимволы';
        errorEl.classList.remove('hidden'); return;
    }
    if (passInp.value !== confirmInp.value) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.classList.remove('hidden'); return;
    }
    try {
        const res = await fetch(API_URL_AUTH + '?action=forgot_set_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: _forgotEmail, password: passInp.value })
        });
        const data = await res.json();
        if (data.success) {
            // Автовход
            localStorage.setItem('oko_token', data.session_token);
            localStorage.setItem('oko_company', data.company_name);
            localStorage.setItem('oko_username', _forgotEmail);
            localStorage.setItem('oko_is_admin', data.is_admin ? 'true' : 'false');
            localStorage.setItem('oko_role', data.role || 'owner');
            localStorage.setItem('oko_modules', JSON.stringify(data.modules || []));
            if (data.company_id) localStorage.setItem('oko_company_id', data.company_id);
            document.getElementById('pwd-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            document.getElementById('current-company-name').textContent = data.company_name;
            applyModules();
            if (typeof loadCompanyDataFromServer === 'function') loadCompanyDataFromServer();
            if (typeof fetchArchive === 'function') fetchArchive();
        } else {
            errorEl.textContent = data.error || 'Ошибка';
            errorEl.classList.remove('hidden');
        }
    } catch(e) {
        errorEl.textContent = 'Ошибка сети: ' + e.message;
        errorEl.classList.remove('hidden');
    }
}

// Проверяем статус при загрузке скрипта
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('oko_token');
    const comp = localStorage.getItem('oko_company');
    if (token && comp) {
        document.getElementById('pwd-screen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        const el = document.getElementById('current-company-name');
        if (el) el.textContent = comp;
        updateTrialCounter();
        applyModules();
        loadTabsOrder();
        
        // Multi-tenancy: загружаем данные компании с сервера при восстановлении сессии
        if (typeof loadCompanyDataFromServer === 'function') {
            loadCompanyDataFromServer();
        }
    } else {
        document.getElementById('pwd-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        setTimeout(() => document.getElementById('login-username').focus(), 100);
    }
});

function updateTrialCounter() {
    const el = document.getElementById('trial-counter');
    if (!el) return;
    
    let isAdmin = localStorage.getItem('oko_is_admin') === 'true' || localStorage.getItem('oko_is_admin') === '1' || localStorage.getItem('oko_username') === 'admin';
    if (isAdmin) {
        el.style.display = 'none';
        return;
    }
    
    const subUntil = localStorage.getItem('oko_subscription_until');
    if (!subUntil) {
        el.style.display = 'none';
        return;
    }
    
    const until = new Date(subUntil);
    const now = new Date();
    const diffMs = until - now;
    const diffSec = Math.floor(diffMs / 1000);
    
    el.style.display = 'inline-block';
    
    if (diffMs <= 0) {
        el.textContent = 'Подписка истекла';
        el.className = 'px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md ml-2';
    } else if (diffSec < 60) {
        el.textContent = 'Осталось: ' + diffSec + ' сек.';
        el.className = 'px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md ml-2';
    } else if (diffSec < 3600) {
        const min = Math.floor(diffSec / 60);
        el.textContent = 'Осталось: ' + min + ' мин.';
        el.className = 'px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md ml-2';
    } else if (diffSec < 86400) {
        const hours = Math.floor(diffSec / 3600);
        const min = Math.floor((diffSec % 3600) / 60);
        el.textContent = 'Осталось: ' + hours + ' ч. ' + min + ' мин.';
        el.className = 'px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md ml-2';
    } else {
        const daysLeft = Math.ceil(diffMs / (1000*60*60*24));
        if (daysLeft <= 3) {
            el.textContent = 'Осталось: ' + daysLeft + ' дн.';
            el.className = 'px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md ml-2';
        } else {
            el.textContent = 'Пробный период: ' + daysLeft + ' дн.';
            el.className = 'px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md ml-2';
        }
    }
}

function applyModules() {
    let isAdmin = localStorage.getItem('oko_is_admin') === 'true' || localStorage.getItem('oko_is_admin') === '1' || localStorage.getItem('oko_username') === 'admin';
    
    const warehouseBtn = document.getElementById('warehouse-btn');
    if (warehouseBtn) {
        warehouseBtn.style.display = isAdmin ? '' : 'none';
    }

    // Если токен есть, но oko_modules вообще нет в localStorage (старая сессия до обновления), 
    // давайте по умолчанию покажем все вкладки или вызовем /api.php?action=me
    const storedModules = localStorage.getItem('oko_modules');
    if (storedModules === null && !isAdmin) {
        // Fallback for old sessions that haven't re-logged in: show everything until they log out
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.style.display = '';
            btn.classList.remove('tab-locked');
        });
        clearAllLockOverlays();
        return;
    }
    
    if (isAdmin) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.style.display = '';
            btn.classList.remove('tab-locked');
        });
        clearAllLockOverlays();
        return;
    }
    
    let modules = [];
    try {
        modules = JSON.parse(storedModules || '[]');
    } catch (e) {}
    
    // Always allow custom
    if (!modules.includes('custom')) modules.push('custom');
    
    let firstUnlockedTab = null;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        const match = onclickAttr.match(/switchTab\('([^']+)'\)/);
        if (match) {
            const tabId = match[1];
            btn.style.display = ''; // Всегда показываем все вкладки
            if (modules.includes(tabId)) {
                btn.classList.remove('tab-locked');
                if (!firstUnlockedTab) firstUnlockedTab = tabId;
            } else {
                btn.classList.add('tab-locked');
            }
        }
    });
    
    // Расставляем замочки на контент-блоках
    applyLockedOverlays(modules);
    
    // Auto-switch to the first available tab if current is hidden
    if (firstUnlockedTab && typeof switchTab === 'function') {
        switchTab(firstUnlockedTab);
    }
}

// --- Locked Modules: вспомогательные функции ---

const MODULE_NAMES = {
    glass: 'Стеклопакеты',
    sandwich: 'Сендвич-панели',
    glasses: 'Стёкла / Резка',
    nets: 'Москитные сетки',
    frameless: 'Безрамное остекление',
    sills: 'Подоконники',
    slopes: 'Откосы',
    shower: 'Душевые',
    rollers: 'Рольставни / Ворота',
    blinds: 'Жалюзи',
    hardware: 'Фурнитура',
    custom: 'Прочее'
};

function applyLockedOverlays(modules) {
    document.querySelectorAll('.category-content').forEach(content => {
        const tabId = content.id.replace('tab-', '');
        const existingOverlay = content.querySelector('.locked-overlay');
        
        if (modules.includes(tabId)) {
            // Модуль доступен — убираем замочек
            content.classList.remove('module-locked');
            if (existingOverlay) existingOverlay.remove();
        } else {
            // Модуль заблокирован — ставим замочек
            content.classList.add('module-locked');
            if (!existingOverlay) {
                content.appendChild(createLockOverlay(tabId));
            }
        }
    });
}

function createLockOverlay(tabId) {
    const moduleName = MODULE_NAMES[tabId] || tabId;
    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';
    overlay.innerHTML = 
        '<div class="locked-overlay-center">' +
            '<div class="lock-icon-wrap">' +
                '<svg class="lock-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
                    'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                    '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
                    '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
                '</svg>' +
                '<div class="lock-text">Раздел заблокирован</div>' +
            '</div>' +
            '<div class="lock-buy-wrap">' +
                '<a href="#" class="buy-section-btn" onclick="event.stopPropagation();">' +
                    '<span class="buy-section-btn-icon">🔓</span>' +
                    'Запросить доступ' +
                '</a>' +
                '<div class="lock-sub-text">Нажмите, чтобы запросить тестовый<br>период для раздела «' + moduleName + '»</div>' +
            '</div>' +
        '</div>';
    return overlay;
}

function clearAllLockOverlays() {
    document.querySelectorAll('.module-locked').forEach(el => {
        el.classList.remove('module-locked');
    });
    document.querySelectorAll('.locked-overlay').forEach(el => {
        el.remove();
    });
}

// ==========================================
// GLOBALS & STATE — Все цены ДИЛЕРСКИЕ
// ==========================================
let GLASS_TYPES = [
    { name: 'Ст/п 24мм (4/16/4)', price: 2000 },
    { name: 'Ст/п 32мм (4/24/4)', price: 2100 },
    { name: 'Ст/п 24-26мм (6/14/4)', price: 2500 },
    { name: 'Ст/п 24-26мм (6/12/6)', price: 3000 },
    { name: 'Ст/п 24мм (4/16/4 Энерго)', price: 2300 },
    { name: 'Ст/п 32мм (4/10/4/10/4) двухкамерный', price: 2500 },
    { name: 'Ст/п 24мм (4/16/4 Бронза Евро)', price: 2900 },
    { name: 'Ст/п 32мм (4/10/4/10/4 Solar)', price: 3000 },
    { name: 'Ст/п 32мм (6 Solar/22/4)', price: 3000 },
    { name: 'Ст/п 24мм (4/16/4) SOLAR', price: 2400 },
    { name: 'Ст/п 24мм Сатинат/Кризет/Диамант б/цв', price: 2800 },
    { name: 'Ст/п 24мм SOLAR Light Bronze/Silver/Blue/Sky Grey', price: 3000 }
];

let RAW_GLASS_TYPES = [];
let SANDWICH_TYPES = [];
let HARDWARE_TYPES = [];
let BLINDS_TYPES = [];

let SHAPES = [
    { name: 'Прямоугольник', multiplier: 0 },
    { name: 'Треугольник / Трапеция', multiplier: 0.25 },
    { name: 'Арка / Круг', multiplier: 0.50 },
    { name: 'По шаблону', multiplier: 0.50 }
];
let LAYOUTS = [
    { name: 'Раскладка 8мм белая', price: 450 },
    { name: 'Раскладка 10мм золотая', price: 450 },
    { name: 'Раскладка 18мм белая', price: 450 },
    { name: 'Раскладка 18мм коричневая', price: 450 }
];
let NET_TYPES = [
    { id: 'window_white', name: 'Оконная москитная сетка (Белая)', price_min: 650, price_sqm: 800 },
    { id: 'window_brown', name: 'Оконная москитная сетка (Коричневая)', price_min: 650, price_sqm: 800 },
    { id: 'window_ant', name: 'Оконная москитная сетка (Антрацит)', price_min: 650, price_sqm: 1100 },
    { id: 'door_32', name: 'Москитная дверь (Профиль 32мм)', price_min: 0, price_sqm: 2000 },
    { id: 'door_42', name: 'Москитная дверь (42мм Антрацит/Белый)', price_min: 0, price_sqm: 2200 },
    { id: 'door_52', name: 'Москитная дверь (Профиль 52мм)', price_min: 4500, price_sqm: 5000 },
    { id: 'vsn', name: 'Москитная сетка VSN (вставная)', price_min: 1600, price_sqm: 2000 },
    { id: 'rollet', name: 'Москитная сетка под роллет', price_min: 0, price_sqm: 1200 },
    { id: 'pleated', name: 'Москитная сетка Плиссе', price_min: 0, price_sqm: 5200 }
];
let SALINOX_PRICES = {
    'F1_F2': [{ max: 34, p: 34104 }, { max: 40, p: 35280 }, { max: 45, p: 35520 }, { max: 50, p: 35880 }, { max: 55, p: 36360 }, { max: 60, p: 37080 }, { max: 65, p: 37680 }, { max: 70, p: 38280 }, { max: 75, p: 38800 }, { max: 80, p: 39480 }, { max: 85, p: 40080 }, { max: 90, p: 40560 }, { max: 95, p: 41160 }, { max: 100, p: 41760 }, { max: 105, p: 42360 }, { max: 110, p: 42960 }],
    'F4': [{ max: 34, p: 0 }, { max: 40, p: 40020 }, { max: 45, p: 41880 }, { max: 50, p: 42504 }, { max: 55, p: 42996 }, { max: 60, p: 43332 }, { max: 65, p: 44280 }, { max: 70, p: 45300 }, { max: 75, p: 46250 }, { max: 80, p: 47210 }, { max: 85, p: 48170 }, { max: 90, p: 49150 }, { max: 95, p: 50100 }, { max: 100, p: 51050 }, { max: 105, p: 52010 }, { max: 110, p: 52970 }, { max: 115, p: 53930 }],
    'F5': [{ max: 34, p: 0 }, { max: 40, p: 0 }, { max: 45, p: 30000 }, { max: 50, p: 30360 }, { max: 55, p: 30720 }, { max: 60, p: 31100 }, { max: 65, p: 31440 }, { max: 70, p: 31800 }, { max: 75, p: 32160 }, { max: 80, p: 32520 }, { max: 85, p: 33880 }, { max: 90, p: 33240 }, { max: 95, p: 33600 }, { max: 100, p: 33960 }],
    'F6': [{ max: 34, p: 0 }, { max: 40, p: 32160 }, { max: 45, p: 32760 }, { max: 50, p: 33360 }, { max: 55, p: 34000 }, { max: 60, p: 34560 }, { max: 65, p: 35160 }, { max: 70, p: 35760 }, { max: 75, p: 37440 }, { max: 80, p: 38050 }, { max: 85, p: 38760 }, { max: 90, p: 39360 }, { max: 95, p: 39840 }, { max: 100, p: 40440 }, { max: 105, p: 41010 }, { max: 110, p: 41640 }, { max: 115, p: 42240 }, { max: 120, p: 42840 }],
    'FB_cr': [{ max: 34, p: 0 }, { max: 40, p: 23160 }, { max: 45, p: 23520 }, { max: 50, p: 23880 }, { max: 55, p: 24240 }, { max: 60, p: 24600 }, { max: 65, p: 24840 }, { max: 70, p: 25200 }, { max: 75, p: 25560 }]
};
let OPTIONS = {
    fl_mech: 36800,
    fl_handle: 3500,
    fl_closer: 12500,
    fl_park: 15000,
    net_pet_sqm: 800,
    net_corners: 150,
    glass_cross: 400,
    glass_end: 70,
    glass_oversize_pct: 25,
    glass_min_area: 0.35
};
const SALINOX_DISCOUNT = 0.28;

// --- SILLS (Подоконники) DATA ---
let SILLS_DATA = [
    {
        brand: 'Crystallit',
        groups: [
            {
                name: 'Белый (глянц./мат./сатин)',
                widths: { 100: 810, 150: 1215, 200: 1620, 250: 2025, 300: 2430, 350: 2835, 400: 3240, 450: 3645, 500: 4050, 550: 4860, 600: 4860 },
                cap: 210, conn90: 286, conn150: 286
            },
            {
                name: 'Цветной (антрацит, бетон, дуб и др.)',
                widths: { 100: 850, 150: 1275, 200: 1700, 250: 2125, 300: 2550, 350: 2975, 400: 3400, 450: 3825, 500: 4250, 550: 5100, 600: 5100 },
                cap: 210, conn90: 286, conn150: 286
            },
            {
                name: 'Премиум (венге, орех, золотой дуб и др.)',
                widths: { 100: 1730, 150: 1730, 200: 1730, 250: 2163, 300: 2595, 350: 3028, 400: 3460, 450: 3893, 500: 4325, 550: 5190, 600: 5190 },
                cap: 210, conn90: 286, conn150: 286
            }
        ]
    },
    {
        brand: 'Витраж Дизайн',
        groups: [
            {
                name: 'Белый',
                widths: { 100: 1240, 150: 1240, 200: 1240, 250: 1550, 300: 1860, 350: 2170, 400: 2790, 450: 2790 },
                cap: 300, conn90: 475, conn150: 475
            },
            {
                name: 'Цветной (серый, чёрный, синий, мокко)',
                widths: { 100: 1380, 150: 1380, 200: 1380, 250: 1725, 300: 2070, 350: 2415, 400: 3105, 450: 3105 },
                cap: 330, conn90: 500, conn150: 500
            }
        ]
    },
    {
        brand: 'Витраж+',
        groups: [
            {
                name: 'Белый сатин',
                widths: { 100: 620, 150: 620, 200: 620, 250: 775, 300: 930, 350: 1085, 400: 1395, 450: 1395, 500: 1550, 550: 1860, 600: 1860 },
                cap: 133, conn90: 245, conn150: 245
            }
        ]
    },
    {
        brand: 'Простые',
        groups: [
            {
                name: 'Белый',
                widths: { 100: 139, 150: 205, 200: 255, 250: 319, 300: 383, 350: 447, 400: 554, 450: 624, 500: 693, 600: 832 },
                cap: 100, conn90: 200, conn150: 200
            },
            {
                name: 'Антрацит (3000 ₽/м²)',
                widths: { 100: 300, 150: 450, 200: 600, 250: 750, 300: 900, 350: 1050, 400: 1200, 450: 1350, 500: 1500, 600: 1800 },
                cap: 120, conn90: 220, conn150: 220
            },
            {
                name: 'Коричневый (3000 ₽/м²)',
                widths: { 100: 300, 150: 450, 200: 600, 250: 750, 300: 900, 350: 1050, 400: 1200, 450: 1350, 500: 1500, 600: 1800 },
                cap: 120, conn90: 220, conn150: 220
            },
            {
                name: 'Другой цвет (3000 ₽/м²)',
                widths: { 100: 300, 150: 450, 200: 600, 250: 750, 300: 900, 350: 1050, 400: 1200, 450: 1350, 500: 1500, 600: 1800 },
                cap: 120, conn90: 220, conn150: 220
            }
        ]
    }
];

// --- SLOPES (Откосы) DATA ---
let SLOPES_DATA = [
    {
        brand: 'Кристаллит/Эстера',
        groups: ['Белый глянцевый', 'Белый матовый', 'Дуб натуральный матовый', 'Золотой дуб матовый', 'Орех матовый', 'Венге матовый', 'Антрацит матовый'],
        table: [
            // [ширина, 1.0, 1.3, 1.5, 1.7, 2.0, 2.5(м)]
            [100, 632, 822, 948, 1074, 1264, 1580],
            [150, 948, 1232, 1422, 1612, 1896, 2370],
            [200, 1264, 1643, 1896, 2149, 2528, 3160],
            [250, 1580, 2054, 2370, 2686, 3160, 3950],
            [300, 1896, 2465, 2844, 3223, 3792, 4740],
            [350, 2212, 2876, 3318, 3760, 4424, 5530],
            [400, 2528, 3286, 3792, 4298, 5056, 6320],
            [450, 2844, 3697, 4266, 4835, 5688, 7110],
            [500, 3160, 4108, 4740, 5372, 6320, 7900],
            [550, 3476, 4519, 5214, 5909, 6952, 8690],
            [600, 3792, 4930, 5688, 6446, 7584, 9480],
            [650, 4108, 5340, 6162, 6984, 8216, 10270],
            [700, 4424, 5751, 6636, 7521, 8848, 11060]
        ]
    },
    {
        brand: 'Витраж Дизайн',
        groups: ['Сэндвич-панель (белый Дизайн)', 'Сэндвич-панель (антрацит Дизайн)', 'Сэндвич-панель (светло серый Дизайн)', 'Сэндвич-панель (серый Дизайн)', 'Сэндвич-панель (скандинавский синий Дизайн)', 'Сэндвич-панель (черный Дизайн)', 'Сэндвич-панель (Сияющий белый)'],
        table: [
            [100, 600, 780, 900, 1020, 1200, 1500],
            [150, 900, 1170, 1350, 1530, 1800, 2250],
            [200, 1200, 1560, 1800, 2040, 2400, 3000],
            [250, 1500, 1950, 2250, 2550, 3000, 3750],
            [300, 1800, 2340, 2700, 3060, 3600, 4500],
            [350, 2100, 2730, 3150, 3570, 4200, 5250],
            [400, 2400, 3120, 3600, 4080, 4800, 6000],
            [450, 2700, 3510, 4050, 4590, 5400, 6750],
            [500, 3000, 3900, 4500, 5100, 6000, 7500],
            [550, 3300, 4290, 4950, 5610, 6600, 8250],
            [600, 3600, 4680, 5400, 6120, 7200, 9000],
            [650, 3900, 5070, 5850, 6630, 7800, 9750],
            [700, 4200, 5460, 6300, 7140, 8400, 10500]
        ]
    }
];
const SLOPES_LENGTHS = [1.0, 1.3, 1.5, 1.7, 2.0, 2.5]; // Метры
let SLOPES_PROF_PRICES = {
    start: 1380, // П Профиль
    h: 2160,     // Н Профиль
    f28: 2040,   // Ф 28x32
    f50: 2640    // Ф 50x30
};

let PARTITION_PRICES = {
    '8_clear': 3050,
    '8_tinted': 4400,
    '10_clear': 3550,
    '10_tinted': 5350,
    profile_lm: 1200,
    door_fittings: 1500,
    install_sqm: 2000
};

function toggleFlOptions() {
    const sys = document.getElementById('fl-system').value;
    const isPartition = sys === 'partition';
    const partSet = document.getElementById('fl-partition-settings');
    const salSet = document.getElementById('fl-salinox-settings');
    if (partSet) partSet.classList.toggle('hidden', !isPartition);
    if (salSet) salSet.classList.toggle('hidden', isPartition);
    if (isPartition && typeof updatePartitionDoorsConfig === 'function') {
        updatePartitionDoorsConfig();
    }
}

// --- ROLLERS (Роллеты) DATA ---
const ROLLERS_DATA = {
    'Alutech': ['38 (PD/39)', '45 (PD/45)', '55 (PD/55)', '60 (AER/60)', '70 (AER/70)'],
    'DoorHan': ['45 (RH45)', '58 (RH58)', '60 (RHE60)', '70 (RHE70)']
};

// --- BLINDS (Жалюзи) DATA ---
const BLINDS_UNI1_WIDTHS = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]; // см
const BLINDS_UNI1_HEIGHTS = [40, 60, 80, 100, 120, 140, 160, 180]; // см
const BLINDS_UNI1_GRID = [
    // Высота 40
    [660, 760, 840, 920, 1010, 1080, 1200, 1270, 1330, 1430, 1530, 1620, 1660],
    // Высота 60
    [740, 830, 920, 980, 1100, 1170, 1250, 1330, 1430, 1500, 1580, 1660, 1750],
    // Высота 80
    [830, 880, 980, 1080, 1110, 1230, 1330, 1430, 1500, 1540, 1660, 1750, 1820],
    // Высота 100
    [910, 950, 1080, 1130, 1230, 1290, 1400, 1500, 1540, 1620, 1750, 1820, 1890],
    // Высота 120
    [950, 1050, 1130, 1230, 1290, 1360, 1460, 1540, 1620, 1670, 1820, 1890, 1950],
    // Высота 140
    [1050, 1130, 1200, 1290, 1360, 1430, 1540, 1620, 1670, 1760, 1890, 1950, 2050],
    // Высота 160
    [1130, 1200, 1230, 1360, 1430, 1530, 1620, 1670, 1760, 1890, 1950, 2050, 2130],
    // Высота 180
    [1200, 1230, 1360, 1430, 1530, 1600, 1670, 1760, 1890, 1950, 2050, 2130, 2210]
];

let BLINDS_FABRICS = [
    { id: 1,  name: 'Респект',                        width: 210, price: 1440, isZebra: false },
    { id: 1.1,name: 'Респект алю',                     width: 250, price: 1500, isZebra: false },
    { id: 2,  name: 'Жемчуг',                          width: 210, price: 1900, isZebra: false },
    { id: 3,  name: 'Лен',                             width: 210, price: 1900, isZebra: false },
    { id: 4,  name: 'Шелк',                            width: 210, price: 1590, isZebra: false },
    { id: 5,  name: 'Сириус',                          width: 210, price: 1590, isZebra: false },
    { id: 6,  name: 'Респект в/о',                     width: 200, price: 2530, isZebra: false },
    { id: 7,  name: 'Софит в/о',                       width: 240, price: 3170, isZebra: false },
    { id: 8,  name: 'Венеция в/о',                     width: 190, price: 3340, isZebra: false },
    { id: 9,  name: 'Лайт (1000,171)',                 width: 205, price: 1130, isZebra: false },
    { id: 10, name: 'Лайт (1130,1150,1080,1020)',      width: 180, price: 1130, isZebra: false },
    { id: 11, name: 'Зебра',                           width: 320, price: 2860, isZebra: true },
    { id: 12, name: 'Зебра в/о',                       width: 320, price: 3170, isZebra: true },
    { id: 13, name: 'Зебра лен V1 (только для рулонных)', width: 320, price: 2860, isZebra: true },
    { id: 14, name: 'Зебра 603 V1',                    width: 320, price: 2860, isZebra: true },
    { id: 15, name: 'Кофе',                            width: 320, price: 3800, isZebra: true },
    { id: 16, name: 'Классик',                         width: 320, price: 3050, isZebra: true },
    { id: 17, name: 'Стиль',                           width: 320, price: 3170, isZebra: true },
    { id: 18, name: 'Ромб 3D',                         width: 320, price: 3970, isZebra: true },
    { id: 19, name: 'Ария 3D',                         width: 320, price: 3970, isZebra: true }
];

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

document.addEventListener('DOMContentLoaded', () => {
    currentKpId = generateKpId();
    let headerDiv = document.getElementById('select-company')?.parentElement?.parentElement;
    if (headerDiv) {
        let kpDisplay = document.createElement('div');
        kpDisplay.id = 'kp-id-display';
        kpDisplay.className = 'text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm ml-auto sm:ml-0';
        kpDisplay.innerText = 'ID: ' + currentKpId;
        headerDiv.appendChild(kpDisplay);
    }
});


const COMPANIES = {
    daneliya: {
        name_short: "ИП Данелия Д.Т.",
        name_full: "ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДАНЕЛИЯ ДМИТРИЙ ТЕЗИКОВИЧ",
        inn: "230410343285",
        ogrnip: "317237500425682",
        account: "40802810430000046903",
        bank_name: "КРАСНОДАРСКОЕ ОТДЕЛЕНИЕ N8619 ПАО СБЕРБАНК",
        bik: "040349602",
        corr_account: "30101810100000000602",
        inn_bank: "7707083893",
        kpp_bank: "231043001",
        req: "ИНН: 230410343285<br>ОГРНИП: 317237500425682<br>Расчётный счёт: 40802810430000046903<br>Банк: КРАСНОДАРСКОЕ ОТДЕЛЕНИЕ N8619 ПАО СБЕРБАНК<br>БИК: 040349602<br>Корр. счёт: 30101810100000000602<br>ИНН банка: 7707083893<br>КПП банка: 231043001",
        sign_name: "ИП Данелия Д.Т.",
        contacts: "<p>📞 +7 (918) 370-47-47</p><p>✉️ oknazavod-gel@yandex.ru</p>"
    },
    alex: {
        name_short: "ООО Алексстрой",
        name_full: "ООО \"АЛЕКССТРОЙ\"",
        inn: "2312328954",
        kpp: "231201001",
        ogrn: "1242300041785",
        account: "40702810947900000107",
        bank_name: "ФИЛИАЛ \"ЮЖНЫЙ\" ПАО \"БАНК УРАЛСИБ\"",
        bik: "040349700",
        corr_account: "30101810400000000700",
        req: "ИНН: 2312328954 | КПП: 231201001<br>ОГРН: 1242300041785<br>Расчётный счёт: 40702810947900000107<br>Банк: ФИЛИАЛ \"ЮЖНЫЙ\" ПАО \"БАНК УРАЛСИБ\"<br>БИК: 040349700<br>Корр. счёт: 30101810400000000700<br>Юр. адрес: 350065, Краснодарский край, г. Краснодар, ул им. Валерия Гассия, д. 26, кв. 19",
        sign_name: "Ген. директор Крюков А.А.",
        contacts: "<p>📞 +7 (918) 370-47-47</p><p>✉️ oknazavod-gel@yandex.ru</p>"
    }
};

const DEFAULT_GLASS_TYPES = JSON.parse(JSON.stringify(GLASS_TYPES));
const DEFAULT_SHAPES = JSON.parse(JSON.stringify(SHAPES));
const DEFAULT_LAYOUTS = JSON.parse(JSON.stringify(LAYOUTS));
const DEFAULT_NET_TYPES = JSON.parse(JSON.stringify(NET_TYPES));
const DEFAULT_SALINOX_PRICES = JSON.parse(JSON.stringify(SALINOX_PRICES));
const DEFAULT_OPTIONS = JSON.parse(JSON.stringify(OPTIONS));

// Settings State
let currentPricesSource = 'built-in';
let currentPricesDate = null;
let googleSheetsUrl = localStorage.getItem('oko_gsheets_url') || '';

// --- INIT ---
window.onload = function () {
    lucide.createIcons();
    document.getElementById('kp-date').innerText = new Date().toLocaleDateString('ru-RU');
    initPresetServices();

    document.getElementById('g-sheets-url').value = googleSheetsUrl;
    loadPricesFromStorage();
    initUserPrices();

    let shapeSelect = document.getElementById('glass-shape');
    shapeSelect.innerHTML = '';
    SHAPES.forEach((s, i) => shapeSelect.innerHTML += `<option value="${i}">${s.name}</option>`);

    updateDropdownPrices();
    initSillsTab();
    initSlopesTab();
    updateRollerProfiles();
    initBlindsTab();
    toggleFlOptions(); // Initialize Partition/Salinox visibility
    handleSettingsChange();
    setupEnterKeys();
};

function setupEnterKeys() {
    document.getElementById('glass-w').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('glass-h').focus();
    });
    document.getElementById('glass-h').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('glass-qty').focus();
    });
    document.getElementById('glass-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addGlassItem();
    });
    document.getElementById('net-w').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('net-h').focus();
    });
    document.getElementById('net-h').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('net-qty').focus();
    });
    document.getElementById('net-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('net-w').focus();
            addNetItem();
        }
    });
    document.getElementById('fl-w').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('fl-h').focus();
    });
    document.getElementById('fl-h').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('fl-panels').focus();
    });
    document.getElementById('fl-panels').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('fl-w').focus();
            addFramelessItem();
        }
    });
    document.getElementById('sill-length').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('sill-qty').focus();
    });
    document.getElementById('sill-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('sill-cap').focus();
    });
    document.getElementById('sill-cap').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('sill-conn90').focus();
    });
    document.getElementById('sill-conn90').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('sill-conn150').focus();
    });
    document.getElementById('sill-conn150').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('sill-length').focus();
            addSillItem();
        }
    });
    // Slopes
    document.getElementById('slope-width').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('slope-length').focus();
    });
    document.getElementById('slope-length').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('slope-qty').focus();
    });
    document.getElementById('slope-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addSlopeItem();
    });
    // Rollers
    document.getElementById('roller-w').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('roller-h').focus();
    });
    document.getElementById('roller-h').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('roller-qty').focus();
    });
    document.getElementById('roller-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('roller-price').focus();
    });
    document.getElementById('roller-price').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('roller-w').focus();
            addRollerItem();
        }
    });
    // Blinds
    document.getElementById('blinds-w').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('blinds-h').focus();
    });
    document.getElementById('blinds-h').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('blinds-qty').focus();
    });
    document.getElementById('blinds-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('blinds-w').focus();
            addBlindsItem();
        }
    });
    // Sandwich panels
    document.getElementById('sandwich-w').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('sandwich-h').focus();
    });
    document.getElementById('sandwich-h').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('sandwich-qty').focus();
    });
    document.getElementById('sandwich-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addSandwichItem();
    });
    // Glasses
    document.getElementById('glasses-w').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('glasses-h').focus();
    });
    document.getElementById('glasses-h').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('glasses-qty').focus();
    });
    document.getElementById('glasses-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') addGlassesItem();
    });
    // Hardware
    document.getElementById('hardware-name').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('hardware-price').focus();
    });
    document.getElementById('hardware-price').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') document.getElementById('hardware-qty').focus();
    });
    document.getElementById('hardware-qty').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('hardware-name').focus();
            addHardwareItem();
        }
    });
}

// --- UI & TAB LOGIC ---
let isTabsEditMode = false;
let tabsSortable = null;

function toggleTabsEditMode() {
    const container = document.getElementById('calc-tabs-container');
    const btn = document.getElementById('edit-tabs-btn');
    if(!container || !btn) return;
    
    isTabsEditMode = !isTabsEditMode;
    
    if (isTabsEditMode) {
        btn.classList.add('text-brand-primary', 'opacity-100');
        btn.classList.remove('text-slate-400', 'opacity-50');
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
        
        container.classList.add('cursor-move');
        
        document.querySelectorAll('.tab-btn').forEach(tb => {
            tb.classList.add('ring-2', 'ring-brand-primary/50', 'bg-white');
        });

        if (!tabsSortable) {
            tabsSortable = new Sortable(container, {
                animation: 150,
                ghostClass: 'opacity-50',
                onEnd: function() {
                    saveTabsOrder();
                }
            });
        }
        tabsSortable.option("disabled", false);
    } else {
        btn.classList.remove('text-brand-primary', 'opacity-100');
        btn.classList.add('text-slate-400', 'opacity-50');
        btn.innerHTML = '<i data-lucide="arrow-left-right" class="w-4 h-4"></i>';
        
        container.classList.remove('cursor-move');
        document.querySelectorAll('.tab-btn').forEach(tb => {
            tb.classList.remove('ring-2', 'ring-brand-primary/50', 'bg-white');
        });
        
        if (tabsSortable) {
            tabsSortable.option("disabled", true);
        }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function saveTabsOrder() {
    const container = document.getElementById('calc-tabs-container');
    if(!container) return;
    const tabs = container.querySelectorAll('.tab-btn');
    const order = Array.from(tabs).map(t => t.getAttribute('data-id'));
    localStorage.setItem('oko_tabs_order', JSON.stringify(order));
}

function loadTabsOrder() {
    const saved = localStorage.getItem('oko_tabs_order');
    if (!saved) return;
    try {
        const order = JSON.parse(saved);
        const container = document.getElementById('calc-tabs-container');
        if (!container) return;
        
        order.forEach(tabId => {
            const btn = container.querySelector(`.tab-btn[data-id="${tabId}"]`);
            if (btn) {
                container.appendChild(btn);
            }
        });
    } catch (e) {
        console.error('Ошибка загрузки порядка вкладок:', e);
    }
}

function switchTab(tabId) {
    if (isTabsEditMode) return;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Попробуем найти кнопку для этого таба и сделать её активной
    const targetBtn = document.querySelector(`.tab-btn[onclick*="switchTab('${tabId}')"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    document.querySelectorAll('.category-content').forEach(c => c.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

function handleSettingsChange() {
    updateDropdownPrices();
    updateSillWidths();
    renderCart();
    
    const companySelect = document.getElementById('select-company');
    if (companySelect) {
        const comp = COMPANIES[companySelect.value];
        if (comp) {
            const reqEl = document.getElementById('company-requisites');
            if (reqEl) reqEl.innerHTML = `<p class="font-bold text-slate-800 text-xs">${comp.name_full}</p><p>${comp.req}</p>`;
            
            const signEl = document.getElementById('company-sign-name');
            if (signEl) signEl.innerText = comp.sign_name + " (подпись)";
            
            const contEl = document.getElementById('company-contacts');
            if (contEl) contEl.innerHTML = comp.contacts;
        }
    }
}

function getGlobalMarkup() { return parseFloat(document.getElementById('select-global-markup').value); }

function updateDropdownPrices() {
    const markup = getGlobalMarkup();
    
    let gSel = document.getElementById('glass-type'); let prevG = gSel.value; gSel.innerHTML = '';
    if (!GLASS_TYPES || GLASS_TYPES.length === 0) {
        gSel.innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
    } else {
        GLASS_TYPES.forEach((g, i) => gSel.innerHTML += `<option value="${i}">${g.name} — ${Math.ceil(g.price * markup)} ₽/м²</option>`);
        if (prevG && prevG !== 'loading' && prevG !== 'none') gSel.value = prevG;
    }

    let hwSel = document.getElementById('hardware-select');
    if (hwSel) {
        let prevHw = hwSel.value; hwSel.innerHTML = '<option value="custom">Свой вариант (ввести вручную)</option>';
        if (typeof HARDWARE_TYPES !== 'undefined' && HARDWARE_TYPES.length > 0) {
            HARDWARE_TYPES.forEach((h, i) => hwSel.innerHTML += `<option value="${i}">${h.name} — ${Math.ceil(h.price * markup)} ₽</option>`);
        }
        if (prevHw) hwSel.value = prevHw;
        if (typeof handleHardwareSelectChange === 'function') handleHardwareSelectChange();
    }

    let swSel = document.getElementById('sandwich-type');
    if (swSel) {
        let prevSw = swSel.value; swSel.innerHTML = '';
        if (typeof SANDWICH_TYPES !== 'undefined' && SANDWICH_TYPES.length > 0) {
            SANDWICH_TYPES.forEach((s, i) => swSel.innerHTML += `<option value="${i}">${s.name} — ${Math.ceil(s.price * markup)} ₽/м²</option>`);
        } else {
            swSel.innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
        }
        if (prevSw) swSel.value = prevSw;
    }

    let rawGSel = document.getElementById('glasses-item');
    if (rawGSel) {
        let prevRG = rawGSel.value; rawGSel.innerHTML = '';
        if (typeof RAW_GLASS_TYPES !== 'undefined' && RAW_GLASS_TYPES.length > 0) {
            RAW_GLASS_TYPES.forEach((g, i) => rawGSel.innerHTML += `<option value="${i}">${g.name} — ${Math.ceil(g.price * markup)} ₽/м²</option>`);
        } else {
            rawGSel.innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
        }
        if (prevRG) rawGSel.value = prevRG;
    }

    if (typeof initBlindsTab === 'function') initBlindsTab();

    let lSel = document.getElementById('glass-layout'); let prevL = lSel.value; lSel.innerHTML = '<option value="none">Без раскладки</option>';
    if (LAYOUTS && LAYOUTS.length > 0) {
        LAYOUTS.forEach((l, i) => lSel.innerHTML += `<option value="${i}">${l.name} ${l.price > 0 ? `(+${Math.ceil(l.price * markup)} ₽/м)` : ''}</option>`);
        if (prevL) lSel.value = prevL;
    }

    let nSel = document.getElementById('net-type'); let prevN = nSel.value; nSel.innerHTML = '';
    if (!NET_TYPES || NET_TYPES.length === 0) {
        nSel.innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
    } else {
        NET_TYPES.forEach((n, i) => {
            let priceText = '';
            let minP = Math.ceil(n.price_min * markup);
            let sqmP = Math.ceil(n.price_sqm * markup);
            if (n.price_min > 0 && n.price_sqm > 0) priceText = `мин. ${minP}₽, далее ${sqmP}₽/м²`;
            else if (n.price_min > 0) priceText = `${minP}₽ за шт.`;
            else priceText = `${sqmP}₽/м²`;
            nSel.innerHTML += `<option value="${i}">${n.name} — ${priceText}</option>`;
        });
        if (prevN && prevN !== 'loading' && prevN !== 'none') nSel.value = prevN;
    }
}

function toggleGlassLayoutInputs() {
    const inputs = document.getElementById('glass-layout-inputs');
    if (document.getElementById('glass-layout').value === 'none') inputs.classList.add('hidden');
    else inputs.classList.remove('hidden');
}

// --- GLASS LOGIC ---
function addGlassItem() {
    let _capturedData = captureRawData("tab-glass");
    let _commitItems = [];
    let w = parseFloat(document.getElementById('glass-w').value);
    let h = parseFloat(document.getElementById('glass-h').value);
    if (!w || !h) { alert('Введите ширину и высоту!'); return; }

    let glass = GLASS_TYPES[document.getElementById('glass-type').value];
    let shape = SHAPES[document.getElementById('glass-shape').value];
    let qty = parseInt(document.getElementById('glass-qty').value) || 1;
    let hasArgon = document.getElementById('glass-argon').checked;
    let comment = document.getElementById('glass-comment').value.trim();

    let area = (w * h) / 1000000;
    let calcArea = area < OPTIONS.glass_min_area ? OPTIONS.glass_min_area : area;

    let baseCost = (glass.price + (hasArgon ? 52 : 0)) * calcArea;
    let markupAdd = 0;
    if (shape.multiplier > 0) markupAdd += baseCost * shape.multiplier;

    let isLarge = false;
    if (area > 3) { markupAdd += baseCost * (OPTIONS.glass_oversize_pct / 100); isLarge = true; }

    let lVal = document.getElementById('glass-layout').value;
    let layoutCost = 0; let layoutDesc = null;
    if (lVal !== 'none') {
        let layout = LAYOUTS[lVal];
        let lenMm = parseFloat(document.getElementById('glass-layout-len').value) || 0;
        let lenM = lenMm / 1000;
        let cr = parseFloat(document.getElementById('glass-layout-cross').value) || 0;
        let en = parseFloat(document.getElementById('glass-layout-end').value) || 0;
        layoutCost = (lenM * layout.price) + (cr * OPTIONS.glass_cross) + (en * OPTIONS.glass_end);
        layoutDesc = `${layout.name} (${lenMm}мм)`;
    }

    let unitCost = baseCost + markupAdd + layoutCost;
    let optDesc = [
        shape.name !== 'Прямоугольник' ? `Сложная форма: ${shape.name}` : null,
        isLarge ? `Негабарит (>3м²)` : null,
        hasArgon ? 'Заполнение аргоном' : null,
        layoutDesc ? `Шпросы: ${layoutDesc}` : null,
        comment ? `📝 ${comment}` : null
    ].filter(Boolean);

    _commitItems.push({
        id: Date.now(),
        category: 'glass',
        type: hasArgon ? glass.name + ' + Аргон' : glass.name,
        qty: qty,
        w: w, h: h, area: area, calcArea: calcArea,
        shape: shape.name,
        isLarge: isLarge,
        layoutCross: lVal !== 'none' ? (parseFloat(document.getElementById('glass-layout-cross').value) || 0) : 0,
        layoutEnd: lVal !== 'none' ? (parseFloat(document.getElementById('glass-layout-end').value) || 0) : 0,
        layoutName: lVal !== 'none' ? LAYOUTS[lVal].name : null,
        unitCost: unitCost,
        optionsDesc: optDesc,
        baseTotal: unitCost * qty
    });

    document.getElementById('glass-w').value = '';
    document.getElementById('glass-h').value = '';
    document.getElementById('glass-qty').value = '1';
    // glass-argon: НЕ сбрасываем — удобнее когда много позиций с аргоном
    document.getElementById('glass-comment').value = '';
    document.getElementById('glass-w').focus();
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-glass', _capturedData);
    else renderCart();
}

// --- SANDWICH LOGIC ---
function addSandwichItem() {
    let _capturedData = captureRawData("tab-sandwich");
    let _commitItems = [];
    let w = parseFloat(document.getElementById('sandwich-w').value);
    let h = parseFloat(document.getElementById('sandwich-h').value);
    if (!w || !h) { alert('Введите ширину и высоту!'); return; }

    let qty = parseInt(document.getElementById('sandwich-qty').value) || 1;
    let typeIdx = document.getElementById('sandwich-type').value;
    let colorOut = document.getElementById('sandwich-color-out').value;
    let colorIn = document.getElementById('sandwich-color-in').value;
    let comment = document.getElementById('sandwich-comment').value.trim();

    if (!SANDWICH_TYPES || SANDWICH_TYPES.length === 0 || typeIdx === "none") {
        alert("Цены на сендвич-панели не заданы!"); return;
    }

    let sType = SANDWICH_TYPES[parseInt(typeIdx)];
    if (!sType) return;

    let area = (w * h) / 1000000;
    
    let basePricePerSqM = sType.price * getGlobalMarkup(); 
    let unitCost = basePricePerSqM * area;

    let optionsDesc = [
        `Тип: ${sType.name}`,
        `Снаружи: ${colorOut}`,
        `Внутри: ${colorIn}`,
        comment ? `📝 ${comment}` : null
    ].filter(Boolean);

    _commitItems.push({
        id: Date.now(),
        category: 'sandwich',
        type: sType.name,
        qty: qty,
        w: w, h: h, area: area, calcArea: area,
        shape: 'Прямоугольник',
        isLarge: false,
        unitCost: unitCost,
        optionsDesc: optionsDesc,
        baseTotal: unitCost * qty,
        colorOut: colorOut,
        colorIn: colorIn
    });

    document.getElementById('sandwich-w').value = '';
    document.getElementById('sandwich-h').value = '';
    document.getElementById('sandwich-qty').value = '1';
    document.getElementById('sandwich-comment').value = '';
    document.getElementById('sandwich-w').focus();
    
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-sandwich', _capturedData);
    else renderCart();
}

// --- GLASSES LOGIC ---
function addGlassesItem() {
    let _capturedData = captureRawData("tab-glasses");
    let _commitItems = [];
    let w = parseFloat(document.getElementById('glasses-w').value);
    let h = parseFloat(document.getElementById('glasses-h').value);
    if (!w || !h) { alert('Введите ширину и высоту!'); return; }

    let qty = parseInt(document.getElementById('glasses-qty').value) || 1;
    let itemIdx = document.getElementById('glasses-item').value;
    let comment = document.getElementById('glasses-comment').value.trim();

    if (!RAW_GLASS_TYPES || RAW_GLASS_TYPES.length === 0 || itemIdx === "none") {
        alert("Цены на стёкла не заданы!"); return;
    }

    let gType = RAW_GLASS_TYPES[parseInt(itemIdx)];
    if (!gType) return;

    let area = (w * h) / 1000000;
    
    let basePricePerSqM = gType.price * getGlobalMarkup();
    let unitCost = basePricePerSqM * area;

    let optionsDesc = [
        `Стекло: ${gType.name}`,
        comment ? `📝 ${comment}` : null
    ].filter(Boolean);

    _commitItems.push({
        id: Date.now(),
        category: 'glasses',
        type: `Стекло ${gType.name}`,
        qty: qty,
        w: w, h: h, area: area, calcArea: area,
        shape: 'Прямоугольник',
        isLarge: false,
        unitCost: unitCost,
        optionsDesc: optionsDesc,
        baseTotal: unitCost * qty,
        thickness: '',
        glassType: gType.name
    });

    document.getElementById('glasses-w').value = '';
    document.getElementById('glasses-h').value = '';
    document.getElementById('glasses-qty').value = '1';
    document.getElementById('glasses-comment').value = '';
    document.getElementById('glasses-w').focus();
    
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-glasses', _capturedData);
    else renderCart();
}

// --- NETS LOGIC ---
function toggleNetOptions() {
    let typeIdx = document.getElementById('net-type').value;
    let netType = NET_TYPES[typeIdx];
    if (!netType) return;
    let isWindow = netType.id.startsWith('window_');
    let isPleated = netType.id === 'pleated';
    let corners = document.getElementById('net-opt-corners-wrapper');
    corners.style.opacity = isWindow ? '1' : '0.4';
    document.getElementById('net-opt-corners').disabled = !isWindow;
    if (!isWindow) document.getElementById('net-opt-corners').checked = false;
    document.getElementById('pleated-config').classList.toggle('hidden', !isPleated);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function togglePleatedRal() {
    let color = document.getElementById('pleated-color').value;
    document.getElementById('pleated-ral-wrap').classList.toggle('hidden', color !== 'RAL (свой цвет)');
}

function calcNetPreview() {
    let isLumen = document.getElementById('net-is-lumen').checked;
    document.getElementById('net-lumen-hint').style.display = isLumen ? 'block' : 'none';
}

function addNetItem() {
    let _capturedData = captureRawData("tab-nets");
    let _commitItems = [];
    let wIn = parseFloat(document.getElementById('net-w').value);
    let hIn = parseFloat(document.getElementById('net-h').value);
    let qty = parseInt(document.getElementById('net-qty').value) || 1;
    if (!wIn || !hIn) { alert('Введите размеры сетки!'); return; }

    let isLumen = document.getElementById('net-is-lumen').checked;
    let typeIdx = document.getElementById('net-type').value;
    let netDef = NET_TYPES[typeIdx];
    if (!netDef) return;
    let type = netDef.id;
    let comment = document.getElementById('net-comment').value.trim();

    let isPet = document.getElementById('net-opt-pet').checked;
    let isCorners = document.getElementById('net-opt-corners').checked;

    let w = wIn, h = hIn;
    if (isLumen) {
        if (type.startsWith('window_') || type === 'vsn' || type === 'pleated' || type === 'pleated_20') { w += 50; h += 50; }
        else if (type === 'door_32') { w += 64; h += 64; }
        else if (type === 'door_42') { w += 84; h += 84; }
        else if (type === 'door_52') { w += 84; h += 84; }
    }

    let area = (w * h) / 1000000;
    let itemName = netDef.name;
    let baseRetailCost = 0;

    if (type === 'door_52') {
        baseRetailCost = netDef.price_min;
        if (area > 1.68 && netDef.price_sqm > netDef.price_min) baseRetailCost = netDef.price_sqm;
    } else if (netDef.price_min > 0 && netDef.price_sqm > 0) {
        let calcByArea = area * netDef.price_sqm;
        baseRetailCost = calcByArea > netDef.price_min ? calcByArea : netDef.price_min;
    } else if (netDef.price_min > 0) {
        baseRetailCost = netDef.price_min;
    } else {
        baseRetailCost = area * netDef.price_sqm;
    }

    let optionsDesc = [];
    if (isLumen) optionsDesc.push(`Световой проем (${wIn}x${hIn}мм)`);
    if (isPet) { baseRetailCost += (OPTIONS.net_pet_sqm * area); optionsDesc.push('Антикошка/Антипыль'); }
    if (isCorners) { baseRetailCost += OPTIONS.net_corners; optionsDesc.push('Металлические углы'); }

    // Плиссе опции
    if (type === 'pleated') {
        let series = document.getElementById('pleated-series').value;
        let color = document.getElementById('pleated-color').value;
        if (color === 'RAL (свой цвет)') {
            let ral = document.getElementById('pleated-ral-input').value.trim();
            color = ral ? `RAL: ${ral}` : 'RAL (не указан)';
        }
        let dir = document.getElementById('pleated-dir').value;
        let mesh = document.getElementById('pleated-mesh').value;
        let threshold = document.getElementById('pleated-threshold').value;
        let seal = document.getElementById('pleated-seal').value;
        optionsDesc.push(`Серия: ${series}`);
        optionsDesc.push(`Цвет: ${color}`);
        optionsDesc.push(`Створка: ${dir}`);
        optionsDesc.push(`Полотно: ${mesh}`);
        optionsDesc.push(`Порог: ${threshold}`);
        optionsDesc.push(`Уплотнитель: ${seal}`);
    }
    if (comment) optionsDesc.push(`📝 ${comment}`);

    _commitItems.push({
        id: Date.now(),
        category: 'net',
        type: itemName,
        qty: qty,
        w: w, h: h, area: area, calcArea: area,
        shape: 'Прямоугольник',
        isLarge: false,
        unitCost: baseRetailCost,
        optionsDesc: optionsDesc,
        baseTotal: baseRetailCost * qty
    });

    if(document.getElementById('net-qty')) document.getElementById('net-qty').value = '1';
    document.getElementById('net-w').value = '';
    document.getElementById('net-h').value = '';
    document.getElementById('net-comment').value = '';
    document.getElementById('net-w').focus();
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-nets', _capturedData);
    else renderCart();
}

// --- FRAMELESS LOGIC ---
function updateDoorSelectionOptions() {
    let panelsInput = document.getElementById('fl-panels');
    let doorSelect = document.getElementById('fl-door-panel');
    let panels = parseInt(panelsInput.value) || 0;
    let currentVal = doorSelect.value;
    doorSelect.innerHTML = '<option value="none">Без двери</option>';
    for (let i = 1; i <= panels; i++) {
        doorSelect.innerHTML += `<option value="${i}">Панель ${i} (дверь)</option>`;
    }
    if (currentVal !== 'none' && parseInt(currentVal) <= panels) doorSelect.value = currentVal;
}

function updatePartitionDoorsConfig() {
    let doors = parseInt(document.getElementById('fl-partition-doors').value) || 0;
    let panels = parseInt(document.getElementById('fl-panels').value) || 1;
    let container = document.getElementById('fl-partition-doors-config');
    if (!container) return;
    if (doors === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');
    let html = '<label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Настройка дверей</label><div class="grid grid-cols-1 gap-2">';
    for(let i=1; i<=doors; i++) {
        let panelOptions = '';
        for(let p=1; p<=panels; p++) panelOptions += `<option value="${p}">Панель ${p}</option>`;
        html += `<div class="p-2 bg-white border border-slate-200 rounded-lg flex gap-2 items-center">
            <span class="text-xs font-bold text-slate-700 whitespace-nowrap">Дверь ${i}:</span>
            <select id="part-door-panel-${i}" class="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs flex-1 outline-none focus:ring-1 focus:ring-brand-primary">
                ${panelOptions}
            </select>
            <select id="part-door-dir-${i}" class="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs flex-1 outline-none focus:ring-1 focus:ring-brand-primary">
                <option value="right">Откр. вправо</option>
                <option value="left">Откр. влево</option>
            </select>
        </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

function addFramelessItem() {
    let _capturedData = captureRawData("tab-frameless");
    let _commitItems = [];
    let totalW = parseFloat(document.getElementById('fl-w').value);
    let h = parseFloat(document.getElementById('fl-h').value);
    let panels = parseInt(document.getElementById('fl-panels').value) || 1;
    if (!totalW || !h) { alert('Введите корректные размеры!'); return; }

    let system = document.getElementById('fl-system').value;
    let comment = document.getElementById('fl-comment').value.trim();
    let area = (totalW * h) / 1000000;
    
    let flTotal = 0;
    let optionsDesc = [];
    let customSvg = null;
    let typeName = "";
    let itemShape = `Панелей: ${panels} шт.`;

    if (system === 'partition') {
        let glassKey = document.getElementById('fl-partition-glass').value;
        let doors = parseInt(document.getElementById('fl-partition-doors').value) || 0;
        
        let glassPrice = PARTITION_PRICES[glassKey];
        let glassCost = glassPrice * area;
        
        let perimeterM = ((totalW + h) * 2) / 1000;
        let profileCost = perimeterM * PARTITION_PRICES.profile_lm;
        
        let fittingsCost = doors * PARTITION_PRICES.door_fittings;
        
        flTotal = glassCost + profileCost + fittingsCost;
        
        let glassNames = {
            '8_clear': '8мм прозр.', '8_tinted': '8мм тонир.',
            '10_clear': '10мм прозр.', '10_tinted': '10мм тонир.'
        };
        typeName = `Безрамная перегородка (${glassNames[glassKey]})`;
        optionsDesc.push(`Стекло: ${glassNames[glassKey]}`);
        let doorsConfig = [];
        for(let i=1; i<=doors; i++) {
            let panelEl = document.getElementById(`part-door-panel-${i}`);
            let dirEl = document.getElementById(`part-door-dir-${i}`);
            if(panelEl && dirEl) {
                doorsConfig.push({ panel: parseInt(panelEl.value) || 1, dir: dirEl.value });
                optionsDesc.push(`Дверь ${i}: Панель ${panelEl.value}, Откр. ${dirEl.value === 'left' ? 'влево' : 'вправо'}`);
            }
        }
        
        if (doors > 0) optionsDesc.push(`Фурнитура: ${doors} дв.`);
        if (comment) optionsDesc.push(`📝 ${comment}`);

        // SVG sketch
        let panelLines = '';
        let panelW = 100 / panels;
        for (let i = 1; i < panels; i++) {
            panelLines += `<line x1="${i * panelW}" y1="0" x2="${i * panelW}" y2="100" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3" />`;
        }
        
        let doorsSvg = '';
        doorsConfig.forEach(d => {
            let pIdx = d.panel - 1;
            let x = pIdx * panelW;
            let handleX = d.dir === 'left' ? x + panelW - (panelW * 0.15) : x + (panelW * 0.15);
            doorsSvg += `
                <rect x="${x + 2}" y="20" width="${panelW - 4}" height="78" fill="none" stroke="#475569" stroke-width="1" />
                <circle cx="${handleX}" cy="60" r="1.5" fill="#475569" />
            `;
        });

        customSvg = `
            <svg viewBox="0 0 100 100" class="w-16 h-16 mx-auto mb-1">
                <rect x="2" y="2" width="96" height="96" fill="#f1f5f9" stroke="#475569" stroke-width="2" />
                ${panelLines}
                ${doorsSvg}
            </svg>
        `;
    } else {
        let isPainting = document.getElementById('fl-painting').checked;
        let panelWidthCm = (totalW / panels) / 10;
        let priceTable = SALINOX_PRICES[system] || [];
        let basePricePerPanel = 0;

        if (system === 'Elroz') { basePricePerPanel = 0; }
        else {
            for (let i = 0; i < priceTable.length; i++) {
                if (panelWidthCm <= priceTable[i].max) { basePricePerPanel = priceTable[i].p; break; }
            }
            if (basePricePerPanel === 0) { alert(`Ширина панели (${panelWidthCm.toFixed(1)} см) превышает макс. для системы ${system}!`); return; }
        }

        let discountedPricePerPanel = system === 'Elroz' ? basePricePerPanel : basePricePerPanel * (1 - SALINOX_DISCOUNT);
        let paintingPricePerPanel = (isPainting && system !== 'F4') ? discountedPricePerPanel * 0.15 : 0;
        let totalSystemPrice = (discountedPricePerPanel + paintingPricePerPanel) * panels;

        let optMech = document.getElementById('fl-opt-mech').checked;
        let optHandle = document.getElementById('fl-opt-handle').checked;
        let optCloser = document.getElementById('fl-opt-closer').checked;
        let optPark = document.getElementById('fl-opt-park').checked;
        let doorPanel = document.getElementById('fl-door-panel').value;
        let doorDir = document.getElementById('fl-door-dir').value;
        let ralColor = document.getElementById('fl-ral').value;
        if (ralColor === 'custom') ralColor = document.getElementById('fl-ral-custom').value || 'Свой цвет (не указан)';

        let optionsCost = 0;
        optionsDesc.push(`Цвет профиля: ${ralColor}`);
        if (doorPanel !== 'none') optionsDesc.push(`Дверь: Панель ${doorPanel} (откр. ${doorDir === 'right' ? 'Вправо' : 'Влево'})`);
        if (isPainting && system !== 'F4') optionsDesc.push('Покраска профиля (+15%)');
        if (optMech) { optionsCost += OPTIONS.fl_mech * (1 - SALINOX_DISCOUNT); optionsDesc.push('Механизм откр. двери F2'); }
        if (optHandle) { optionsCost += OPTIONS.fl_handle * (1 - SALINOX_DISCOUNT); optionsDesc.push('Шестигранная ручка'); }
        if (optCloser) { optionsCost += OPTIONS.fl_closer * (1 - SALINOX_DISCOUNT); optionsDesc.push('Доводчик Usaf 600A'); }
        if (optPark) { optionsCost += OPTIONS.fl_park * (1 - SALINOX_DISCOUNT); optionsDesc.push('Доп. парковка'); }

        let glassType = document.getElementById('fl-glass-type').value;
        let glassCost = 0;
        if (glassType !== 'none') {
            let glassPricePerM2 = glassType === 'clear10' ? 4500 : 6000;
            glassCost = glassPricePerM2 * area;
            optionsDesc.push(`Стекло: ${glassType === 'clear10' ? '10мм прозр.' : '10мм тонир.'} (${glassPricePerM2} ₽/м²)`);
        }

        let systemDisplayNames = { 'F1_F2': 'Salinox F1-F2', 'F4': 'Salinox F4', 'F5': 'Salinox F5', 'F6': 'Salinox F6', 'FB_cr': 'Salinox FB-cr', 'Elroz': 'Elroz' };
        typeName = `Безрамное остекление (${systemDisplayNames[system]})`;
        flTotal = totalSystemPrice + optionsCost + glassCost;
        itemShape = `Панелей: ${panels} шт. по ${panelWidthCm.toFixed(1)} см`;
        if (comment) optionsDesc.push(`📝 ${comment}`);
    }

    _commitItems.push({
        id: Date.now(), category: 'frameless',
        type: typeName,
        qty: 1,
        w: totalW, h: h, area: area, calcArea: area,
        shape: itemShape,
        isLarge: false,
        unitCost: flTotal,
        optionsDesc: optionsDesc, baseTotal: flTotal,
        customSvg: customSvg,
        isPartition: system === 'partition'
    });

    // Reset common fields
    document.getElementById('fl-w').value = ''; 
    document.getElementById('fl-h').value = '';
    document.getElementById('fl-panels').value = ''; 
    document.getElementById('fl-comment').value = '';
    document.getElementById('fl-w').focus();
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-frameless', _capturedData);
    else renderCart();
}

// --- SLOPES (ОТКОСЫ) LOGIC ---
function initSlopesTab() {
    let sel = document.getElementById('slope-brand');
    sel.innerHTML = '';
    if (!SLOPES_DATA || SLOPES_DATA.length === 0) {
        sel.innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
        document.getElementById('slope-color').innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
        return;
    }
    SLOPES_DATA.forEach((b, i) => sel.innerHTML += `<option value="${i}">${b.brand}</option>`);
    updateSlopeColors();
}

function updateSlopeColors() {
    let brandIdx = parseInt(document.getElementById('slope-brand').value) || 0;
    let brand = SLOPES_DATA[brandIdx];
    if (!brand) return;
    let sel = document.getElementById('slope-color');
    sel.innerHTML = '';
    brand.groups.forEach((g, i) => sel.innerHTML += `<option value="${i}">${g}</option>`);
}

function autoFillSlopeProfiles() {
    let lenIn = parseFloat(document.getElementById('slope-length').value) || 0;
    if (lenIn <= 0) {
        alert('Для авторасчета сначала укажите длину откоса!');
        return;
    }
    // Автоматические рекомендации: П-профиль и Ф-профиль = длине откоса (в метрах) НА ОДНУ ПАНЕЛЬ
    let totalM = lenIn / 1000;
    document.getElementById('slope-prof-start').value = totalM;
    document.getElementById('slope-prof-f50').value = totalM;
    document.getElementById('slope-prof-h').value = ''; // Н-профиль обычно используется для стыковки
    document.getElementById('slope-prof-f28').value = ''; // Ф28 реже используется базово
}

function addSlopeItem() {
    let _capturedData = captureRawData("tab-slopes");
    let _commitItems = [];
    let wIn = parseFloat(document.getElementById('slope-width').value);
    let lenIn = parseFloat(document.getElementById('slope-length').value);
    let qty = parseInt(document.getElementById('slope-qty').value) || 1;
    
    if (!wIn || !lenIn || wIn <= 0 || lenIn <= 0) {
        alert('Введите корректные глубину (ширину) и длину откоса в мм!');
        return;
    }

    let brandIdx = parseInt(document.getElementById('slope-brand').value) || 0;
    let colorIdx = parseInt(document.getElementById('slope-color').value) || 0;
    let brand = SLOPES_DATA[brandIdx];
    let colorName = brand.groups[colorIdx];

    // Округление ширины до шага 50мм (от 100 до 700)
    let calcW = Math.ceil(wIn / 50) * 50;
    if (calcW < 100) calcW = 100;
    if (calcW > 700) {
        alert('Максимальная ширина панели по прайсу - 700 мм!');
        return;
    }

    // Округление длины до ближайшего большего из (1.0, 1.3, 1.5, 1.7, 2.0, 2.5)
    let lenM = lenIn / 1000;
    let calcLenM = 2.5;
    for (let i = 0; i < SLOPES_LENGTHS.length; i++) {
        if (lenM <= SLOPES_LENGTHS[i]) {
            calcLenM = SLOPES_LENGTHS[i];
            break;
        }
    }
    if (lenM > 2.5) {
        alert('Максимальная длина цельной панели по прайсу - 2500 мм (2.5 м)! Разбейте на части.');
        return;
    }

    // Ищем цену в таблице
    let widthRowIdx = (calcW - 100) / 50; 
    let lenColIdx = SLOPES_LENGTHS.indexOf(calcLenM) + 1;
    let basePricePerPiece = brand.table[widthRowIdx][lenColIdx];

    let isProfStart = false, isProfF28 = false, isProfF50 = false;
    let valProfStart = parseFloat(document.getElementById('slope-prof-start').value) || 0;
    let valProfH = parseFloat(document.getElementById('slope-prof-h').value) || 0;
    let valProfF28 = parseFloat(document.getElementById('slope-prof-f28').value) || 0;
    let valProfF50 = parseFloat(document.getElementById('slope-prof-f50').value) || 0;
    isProfStart = valProfStart > 0;
    isProfF28 = valProfF28 > 0;
    isProfF50 = valProfF50 > 0;

    let slopeComment = document.getElementById('slope-comment').value.trim();

    // SVG эскиз для панели
    let svgWidth = 100;
    let svgHeight = Math.max(30, (wIn / lenIn) * 100);
    if (svgHeight > 60) { svgHeight = 60; svgWidth = (lenIn / wIn) * 60; }
    let slopeSvg = `
        <svg viewBox="-20 -25 ${svgWidth + 60} ${svgHeight + 50}" class="w-32 h-32 mx-auto mb-1 overflow-visible">
            <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5" />
            ${isProfStart ? `<line x1="0" y1="0" x2="${svgWidth}" y2="0" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>` : ''}
            ${(isProfF28 || isProfF50) ? `<line x1="0" y1="${svgHeight}" x2="${svgWidth}" y2="${svgHeight}" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>` : ''}
            <text x="${svgWidth/2}" y="-15" font-family="Arial, sans-serif" font-size="18" fill="#334155" text-anchor="middle">${wIn} мм</text>
            <text x="${svgWidth+22}" y="${svgHeight/2}" font-family="Arial, sans-serif" font-size="18" fill="#334155" text-anchor="middle" transform="rotate(-90, ${svgWidth+22}, ${svgHeight/2})">${lenIn} мм</text>
        </svg>
    `;

    // === 1. Панель откоса (основная позиция) ===
    let panelOptDesc = [`Размер: ${wIn}×${lenIn} мм (расчёт ${calcW}×${calcLenM * 1000} мм)`];
    if (slopeComment) panelOptDesc.push(`📝 ${slopeComment}`);

    _commitItems.push({
        id: Date.now(), 
        category: 'slope', 
        type: `Откосы ${brand.brand} ${colorName} ${calcW}*${calcLenM * 1000} мм`, 
        qty: qty,
        w: wIn, h: lenIn, area: 0, calcArea: 0,
        shape: colorName, isLarge: false, 
        unitCost: basePricePerPiece,
        optionsDesc: panelOptDesc, 
        baseTotal: basePricePerPiece * qty,
        customSvg: slopeSvg
    });

    // === 2. Профили — каждый как отдельная позиция ===
    let timestamp = Date.now();
    if (valProfF50 > 0) {
        let f50PricePerM = SLOPES_PROF_PRICES.f50 / 6; // дилерская цена за пог.м
        _commitItems.push({
            id: timestamp + 1,
            category: 'slope_profile',
            type: `Ф-профиль 50×30 (${colorName})`,
            qty: valProfF50,
            w: 0, h: 0, area: 0, calcArea: 0,
            shape: '', isLarge: false,
            unit: 'пог.м',
            unitCost: f50PricePerM,
            optionsDesc: [],
            baseTotal: f50PricePerM * valProfF50
        });
    }
    if (valProfF28 > 0) {
        let f28PricePerM = SLOPES_PROF_PRICES.f28 / 6;
        _commitItems.push({
            id: timestamp + 2,
            category: 'slope_profile',
            type: `Ф-профиль 28×32 (${colorName})`,
            qty: valProfF28,
            w: 0, h: 0, area: 0, calcArea: 0,
            shape: '', isLarge: false,
            unit: 'пог.м',
            unitCost: f28PricePerM,
            optionsDesc: [],
            baseTotal: f28PricePerM * valProfF28
        });
    }
    if (valProfStart > 0) {
        let startPricePerM = SLOPES_PROF_PRICES.start / 6;
        _commitItems.push({
            id: timestamp + 3,
            category: 'slope_profile',
            type: `П-профиль (${colorName})`,
            qty: valProfStart,
            w: 0, h: 0, area: 0, calcArea: 0,
            shape: '', isLarge: false,
            unit: 'пог.м',
            unitCost: startPricePerM,
            optionsDesc: [],
            baseTotal: startPricePerM * valProfStart
        });
    }
    if (valProfH > 0) {
        let hPricePerM = SLOPES_PROF_PRICES.h / 6;
        _commitItems.push({
            id: timestamp + 4,
            category: 'slope_profile',
            type: `Н-профиль (${colorName})`,
            qty: valProfH,
            w: 0, h: 0, area: 0, calcArea: 0,
            shape: '', isLarge: false,
            unit: 'пог.м',
            unitCost: hPricePerM,
            optionsDesc: [],
            baseTotal: hPricePerM * valProfH
        });
    }

    document.getElementById('slope-width').value = ''; 
    document.getElementById('slope-length').value = ''; 
    document.getElementById('slope-qty').value = '1';
    document.getElementById('slope-comment').value = '';
    document.getElementById('slope-prof-start').value = '';
    document.getElementById('slope-prof-h').value = '';
    document.getElementById('slope-prof-f28').value = '';
    document.getElementById('slope-prof-f50').value = '';
    
    document.getElementById('slope-width').focus();
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-slopes', _capturedData);
    else renderCart();
}

// --- SILLS LOGIC ---
function initSillsTab() {
    let bSel = document.getElementById('sill-brand');
    if (!bSel) return;
    bSel.innerHTML = '';
    if (!SILLS_DATA || SILLS_DATA.length === 0) {
        bSel.innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
        document.getElementById('sill-color').innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
        document.getElementById('sill-width').innerHTML = '<option value="none" disabled selected>Задайте цены в админке</option>';
        return;
    }
    SILLS_DATA.forEach((b, i) => {
        bSel.innerHTML += `<option value="${i}">${b.brand}</option>`;
    });
    updateSillColors();
}

function updateSillColors() {
    let brandIdx = parseInt(document.getElementById('sill-brand').value) || 0;
    let brand = SILLS_DATA[brandIdx];
    if (!brand) return;
    let cSel = document.getElementById('sill-color');
    cSel.innerHTML = '';
    brand.groups.forEach((g, i) => {
        cSel.innerHTML += `<option value="${i}">${g.name}</option>`;
    });
    updateSillWidths();
}

function updateSillWidths() {
    let brandIdx = parseInt(document.getElementById('sill-brand').value) || 0;
    let colorIdx = parseInt(document.getElementById('sill-color').value) || 0;
    let brand = SILLS_DATA[brandIdx];
    if (!brand) return;
    let group = brand.groups[colorIdx];
    if (!group) return;
    
    let wSel = document.getElementById('sill-width');
    wSel.innerHTML = '';
    let markup = getGlobalMarkup();
    
    // Сортировка по ширине подоконника
    let widths = Object.keys(group.widths).map(Number).sort((a,b) => a - b);
    widths.forEach(w => {
        let p = Math.ceil(group.widths[w] * markup);
        wSel.innerHTML += `<option value="${w}">${w} мм — ${p} ₽/п.м.</option>`;
    });
}

function addSillItem() {
    let _capturedData = captureRawData("tab-sills");
    let _commitItems = [];
    let lenIn = parseFloat(document.getElementById('sill-length').value);
    let qty = parseInt(document.getElementById('sill-qty').value) || 1;
    if (!lenIn || lenIn <= 0) { alert('Введите длину подоконника!'); return; }

    let brandIdx = parseInt(document.getElementById('sill-brand').value) || 0;
    let colorIdx = parseInt(document.getElementById('sill-color').value) || 0;
    let w = parseInt(document.getElementById('sill-width').value) || 0;
    
    let brand = SILLS_DATA[brandIdx];
    if (!brand) return;
    let group = brand.groups[colorIdx];
    if (!group) return;

    let markup = getGlobalMarkup();
    let basePricePerM_dealer = group.widths[w] || 0;
    
    let lenM = lenIn / 1000;
    let panelCost_dealer = basePricePerM_dealer * lenM * qty;
    
    let optCap = parseInt(document.getElementById('sill-cap').value) || 0;
    let optConn90 = parseInt(document.getElementById('sill-conn90').value) || 0;
    let optConn150 = parseInt(document.getElementById('sill-conn150').value) || 0;
    
    let compCost_dealer = 0;
    let optionsDesc = [];
    optionsDesc.push(`Размер: ${w} × ${lenIn} мм (Расчет как ${w} мм шириной)`);
    
    if (optCap > 0) {
        let p_dealer = group.cap;
        let p_markup = Math.ceil(p_dealer * markup);
        compCost_dealer += p_dealer * optCap;
        optionsDesc.push(`Заглушка: ${optCap} шт. (${p_markup} ₽/шт)`);
    }
    if (optConn90 > 0) {
        let p_dealer = group.conn90;
        let p_markup = Math.ceil(p_dealer * markup);
        compCost_dealer += p_dealer * optConn90;
        optionsDesc.push(`Соединитель 90°: ${optConn90} шт. (${p_markup} ₽/шт)`);
    }
    if (optConn150 > 0) {
        let p_dealer = group.conn150;
        let p_markup = Math.ceil(p_dealer * markup);
        compCost_dealer += p_dealer * optConn150;
        optionsDesc.push(`Соединитель 150°/180°: ${optConn150} шт. (${p_markup} ₽/шт)`);
    }
    
    let comment = document.getElementById('sill-comment').value.trim();
    if (comment) optionsDesc.push(`📝 ${comment}`);
    
    let totalCost_dealer = panelCost_dealer + compCost_dealer;
    let unitCost_dealer = totalCost_dealer / qty;
    
    _commitItems.push({
        id: Date.now(),
        category: 'sill',
        type: `Подоконник ${brand.brand} (${group.name})`,
        qty: qty,
        w: w, h: lenIn, area: 0, calcArea: 0,
        shape: '',
        isLarge: false,
        unitCost: unitCost_dealer,
        optionsDesc: optionsDesc,
        baseTotal: totalCost_dealer
    });
    
    document.getElementById('sill-length').value = '';
    document.getElementById('sill-qty').value = '1';
    document.getElementById('sill-cap').value = '';
    document.getElementById('sill-conn90').value = '';
    document.getElementById('sill-conn150').value = '';
    document.getElementById('sill-comment').value = '';
    document.getElementById('sill-length').focus();
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-sills', _capturedData);
    else renderCart();
}
let SHOWER_GLASS_TYPES = {
    '8_clear': { name: 'Прозрачное (8мм)', price_sqm: 4500 },
    '8_graphite': { name: 'Тонированное Графит (8мм)', price_sqm: 6000 },
    '8_bronze': { name: 'Тонированное Бронза (8мм)', price_sqm: 6000 },
    '8_extra_clear': { name: 'Осветленное (8мм)', price_sqm: 5500 },
    '8_frosted': { name: 'Матовое (8мм)', price_sqm: 6500 },
    '8_sandblast': { name: 'Пескоструй (8мм)', price_sqm: 7000 },
    '10_clear': { name: 'Прозрачное (10мм)', price_sqm: 6000 },
    '10_graphite': { name: 'Тонированное Графит (10мм)', price_sqm: 7500 },
    '10_bronze': { name: 'Тонированное Бронза (10мм)', price_sqm: 7500 },
    '10_extra_clear': { name: 'Осветленное (10мм)', price_sqm: 7000 },
    '10_frosted': { name: 'Матовое (10мм)', price_sqm: 8000 },
    '10_sandblast': { name: 'Пескоструй (10мм)', price_sqm: 8500 }
};
let SHOWER_CONFIGS = {
    partition: { name: 'Перегородка', panels: [{ id: 'w1', label: 'Ширина стенки', type: 'fixed' }] },
    partition_door: { name: 'Перегородка + дверь', panels: [{ id: 'w1', label: 'Ширина стенки', type: 'fixed' }, { id: 'w2', label: 'Ширина двери', type: 'door' }] },
    corner: { name: 'Угловая (90°)', panels: [{ id: 'w1', label: 'Фронтальная стенка', type: 'fixed' }, { id: 'w2', label: 'Боковая стенка', type: 'fixed' }] },
    corner_door: { name: 'Угловая + дверь', panels: [{ id: 'w1', label: 'Стенка (фронт)', type: 'fixed' }, { id: 'w2', label: 'Дверь', type: 'door' }, { id: 'w3', label: 'Боковая стенка', type: 'fixed' }] },
    u_shape: { name: 'П-образная', panels: [{ id: 'w1', label: 'Левая стенка', type: 'fixed' }, { id: 'w2', label: 'Задняя стенка', type: 'fixed' }, { id: 'w3', label: 'Правая стенка', type: 'fixed' }] },
    u_shape_door: { name: 'П-образная + дверь', panels: [{ id: 'w1', label: 'Левая стенка', type: 'fixed' }, { id: 'w2', label: 'Задняя стенка', type: 'fixed' }, { id: 'w3', label: 'Правая стенка', type: 'fixed' }, { id: 'w4', label: 'Дверь', type: 'door' }] },
    sliding_door: { name: 'Раздвижная дверь', panels: [{ id: 'w1', label: 'Неподвижная панель', type: 'fixed' }, { id: 'w2', label: 'Раздвижная дверь', type: 'sliding' }] }
};

// --- ROLLERS LOGIC ---
function updateRollerProfiles() {
    let brand = document.getElementById('roller-brand').value;
    let profiles = ROLLERS_DATA[brand] || [];
    let pSel = document.getElementById('roller-profile');
    if (!pSel) return;
    pSel.innerHTML = '';
    profiles.forEach(p => {
        pSel.innerHTML += `<option value="${p}">${p}</option>`;
    });
}

function addRollerItem() {
    let _capturedData = captureRawData("tab-rollers");
    let _commitItems = [];
    let w = parseFloat(document.getElementById('roller-w').value);
    let h = parseFloat(document.getElementById('roller-h').value);
    let qty = parseInt(document.getElementById('roller-qty').value) || 1;
    let priceMan = parseFloat(document.getElementById('roller-price').value);

    if (!w || !h) { alert('Введите ширину и высоту!'); return; }
    if (isNaN(priceMan) || priceMan < 0) { alert('Введите цену за единицу!'); return; }

    let brand = document.getElementById('roller-brand').value;
    let profile = document.getElementById('roller-profile').value;
    let control = document.getElementById('roller-control').value;
    let color = document.getElementById('roller-color').value;
    let comment = document.getElementById('roller-comment').value.trim();
    let rType = document.getElementById('roller-type') ? document.getElementById('roller-type').value : 'roller';

    let controlText = control === 'auto' ? 'Автоматика (электропривод)' : 'Ручное (пружина/инерция)';
    
    let optionsDesc = [
        `Профиль: ${profile}`,
        `Управление: ${controlText}`,
        `Цвет: ${color}`,
        comment ? `📝 ${comment}` : null
    ].filter(Boolean);

    let typeStr = rType === 'gate' ? `Секционные ворота ${brand} (${w}×${h}мм)` : `Защитная роллета ${brand} (${w}×${h}мм)`;

    // SVG эскиз для роллеты
    
    let gatePanelDir = 'horizontal';
    if (rType === 'gate') {
        let dirEl = document.getElementById('gate-panel-dir');
        if (dirEl) gatePanelDir = dirEl.value;
    }

_commitItems.push({
        id: Date.now(),
        category: 'roller',
        type: typeStr,
        qty: qty,
        w: w, h: h, area: (w * h) / 1000000, calcArea: (w * h) / 1000000,
        shape: profile,
        isLarge: false,
        unitCost: priceMan,
        optionsDesc: optionsDesc,
        baseTotal: priceMan * qty, customSvg: null,
        gatePanelDir: gatePanelDir
    });

    // Очистка полей
    document.getElementById('roller-w').value = '';
    document.getElementById('roller-h').value = '';
    document.getElementById('roller-qty').value = '1';
    document.getElementById('roller-price').value = '';
    document.getElementById('roller-comment').value = '';
    document.getElementById('roller-w').focus();
    
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-rollers', _capturedData);
    else renderCart();
}
let currentShowerConfig = 'partition';

function selectShowerConfig(el) {
    document.querySelectorAll('.shower-config-card').forEach(c => { c.classList.remove('selected', 'border-brand-primary', 'bg-brand-light'); c.classList.add('border-slate-200', 'bg-white'); });
    el.classList.add('selected', 'border-brand-primary', 'bg-brand-light'); el.classList.remove('border-slate-200', 'bg-white');
    currentShowerConfig = el.getAttribute('data-config');
    updateShowerDimensions();
}
function updateShowerDimensions() {
    let config = SHOWER_CONFIGS[currentShowerConfig];
    let container = document.getElementById('shower-dimensions'); 
    
    let html = '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">';
    config.panels.forEach((p) => {
        html += `<div><label class="text-xs text-slate-500 block mb-1">${p.label}${p.type === 'door' ? ' 🚪' : ''}</label><input type="number" id="shower-${p.id}" placeholder="800" class="shower-input-field w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:outline-none"></div>`;
    });
    html += `<div><label class="text-xs text-slate-500 block mb-1">Высота</label><input type="number" id="shower-h" placeholder="2000" class="shower-input-field w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:outline-none"></div>`;
    html += '</div>';
    
    container.innerHTML = html;
    
    // Поддержка клавиши Enter для удобного ввода
    let inputs = container.querySelectorAll('.shower-input-field');
    inputs.forEach((input, i) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (i < inputs.length - 1) inputs[i+1].focus();
                else addShowerItem();
            }
        });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function parseShowerOpeningDirection(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return {
        toRight: normalized ? normalized.includes('вправо') : true,
        outward: normalized ? normalized.includes('от себя') : true
    };
}
function getShowerMetrics(configKey, panels) {
    const panelW = index => panels[index] ? Number(panels[index].w) || 0 : 0;
    const totalRawWidth = panels.reduce((sum, panel) => sum + (Number(panel.w) || 0), 0);
    const metrics = {
        totalRawWidth,
        areaWidthSum: totalRawWidth,
        displayW: totalRawWidth,
        sideW: 0,
        frontTotalW: 0,
        fixedFrontW: 0,
        doorW: 0,
        sidePanelW: 0
    };

    switch (configKey) {
        case 'partition':
            metrics.displayW = panelW(0);
            metrics.areaWidthSum = panelW(0);
            break;
        case 'partition_door':
            metrics.frontTotalW = panelW(0);
            metrics.doorW = panelW(1);
            if (metrics.doorW < metrics.frontTotalW) {
                metrics.fixedFrontW = metrics.frontTotalW - metrics.doorW;
                metrics.displayW = metrics.frontTotalW;
                metrics.areaWidthSum = metrics.frontTotalW;
            } else {
                metrics.fixedFrontW = metrics.frontTotalW;
                metrics.displayW = metrics.frontTotalW + metrics.doorW;
                metrics.areaWidthSum = metrics.frontTotalW + metrics.doorW;
            }
            break;
        case 'corner':
            metrics.frontTotalW = panelW(0);
            metrics.sidePanelW = panelW(1);
            metrics.displayW = metrics.frontTotalW;
            metrics.sideW = metrics.sidePanelW;
            metrics.areaWidthSum = metrics.frontTotalW + metrics.sidePanelW;
            break;
        case 'corner_door':
            metrics.frontTotalW = panelW(0);
            metrics.doorW = panelW(1);
            if (metrics.doorW < metrics.frontTotalW) {
                metrics.fixedFrontW = metrics.frontTotalW - metrics.doorW;
                metrics.displayW = metrics.frontTotalW;
            } else {
                metrics.fixedFrontW = metrics.frontTotalW;
                metrics.displayW = metrics.frontTotalW + metrics.doorW;
            }
            metrics.sidePanelW = panelW(2);
            metrics.sideW = metrics.sidePanelW;
            metrics.areaWidthSum = metrics.displayW + metrics.sidePanelW;
            break;
        case 'u_shape':
            metrics.displayW = panelW(1) || totalRawWidth;
            metrics.sideW = panelW(0);
            break;
        case 'u_shape_door':
            metrics.displayW = panelW(1) || totalRawWidth;
            metrics.sideW = panelW(0);
            break;
        default:
            break;
    }

    return metrics;
}
function getShowerDimensionLine(item, includeArea = true) {
    const panels = item.showerPanels || [];
    const h = item.h || 0;
    const area = (item.area || 0) * (item.qty || 1);
    const areaText = includeArea ? ` | S стекла: ${area.toFixed(2)} м²` : '';
    const panelW = index => panels[index] ? panels[index].w : 0;
    const metrics = getShowerMetrics(item.showerConfig, panels);

    switch (item.showerConfig) {
        case 'partition':
            return `Ширина: ${panelW(0)} мм | H: ${h} мм${areaText}`;
        case 'partition_door':
            return `Стенка: ${metrics.frontTotalW} мм (глухая ${metrics.fixedFrontW} + дверь ${metrics.doorW}) | H: ${h} мм${areaText}`;
        case 'corner':
            return `Фронт: ${panelW(0)} мм | Бок: ${panelW(1)} мм | H: ${h} мм${areaText}`;
        case 'corner_door':
            return `Фронт: ${metrics.frontTotalW} мм (глухая ${metrics.fixedFrontW} + дверь ${metrics.doorW}) | Бок: ${metrics.sidePanelW} мм | H: ${h} мм${areaText}`;
        case 'u_shape':
            return `Левая: ${panelW(0)} мм | Задняя: ${panelW(1)} мм | Правая: ${panelW(2)} мм | H: ${h} мм${areaText}`;
        case 'u_shape_door':
            return `Левая: ${panelW(0)} мм | Задняя: ${panelW(1)} мм | Правая: ${panelW(2)} мм | Дверь: ${panelW(3)} мм | H: ${h} мм${areaText}`;
        case 'sliding_door':
            return `Проём: ${panelW(0) + panelW(1)} мм (стекло ${panelW(0)} + створка ${panelW(1)}) | H: ${h} мм${areaText}`;
        default:
            return `${item.w} × ${h} мм${areaText}`;
    }
}
function addShowerItem() {
    let _capturedData = captureRawData("tab-shower");
    let _commitItems = [];
    let config = SHOWER_CONFIGS[currentShowerConfig];
    let thickness = document.getElementById('shower-thickness') ? document.getElementById('shower-thickness').value : '8';
    let type = document.getElementById('shower-glass-type') ? document.getElementById('shower-glass-type').value : 'clear';
    let glassKey = `${thickness}_${type}`;
    let glass = SHOWER_GLASS_TYPES[glassKey] || { name: 'Неизвестное стекло', price_sqm: 0 };
    
    let h = parseFloat(document.getElementById('shower-h').value);
    if (!h) { alert('Введите высоту!'); return; }
    let panelWidths = [], panelDescs = [];
    for (let p of config.panels) {
        let pw = parseFloat(document.getElementById('shower-' + p.id).value);
        if (!pw) { alert(`Введите ширину: ${p.label}!`); return; }
        panelWidths.push({ id: p.id, w: pw, type: p.type, label: p.label });
        let typeStr = p.type === 'door' ? ' (дверь)' : (p.type === 'sliding' ? ' (раздвижная)' : '');
        panelDescs.push(`${p.label}: ${pw}мм${typeStr}`);
    }
    const metrics = getShowerMetrics(currentShowerConfig, panelWidths);
    const totalArea = (metrics.areaWidthSum * h) / 1000000;
    let showerComment = document.getElementById('shower-comment').value.trim();
    let hardware = document.getElementById('shower-hardware') ? document.getElementById('shower-hardware').value : 'Нержавеющая сталь';
    let openingDirection = document.getElementById('shower-opening') ? document.getElementById('shower-opening').value : '';
    let hasSwingDoor = panelWidths.some(p => p.type === 'door');
    
    let optionsDesc = [`Конфигурация: ${config.name}`, `Стекло: ${glass.name}`, `Фурнитура: ${hardware}`, ...panelDescs];
    if (hasSwingDoor && openingDirection) optionsDesc.push(`Открывание: ${openingDirection}`);
    if (showerComment) optionsDesc.push(`📝 ${showerComment}`);
    let showerTotal = totalArea * glass.price_sqm;
    _commitItems.push({
        id: Date.now(), category: 'shower', type: `Душевая: ${config.name}`,
        qty: 1,
        w: metrics.displayW, h: h, sideW: metrics.sideW, area: totalArea, calcArea: totalArea, shape: config.name,
        isLarge: false, showerConfig: currentShowerConfig, showerPanels: panelWidths, showerGlass: glassKey,
        openingDirection: openingDirection,
        unitCost: showerTotal,
        optionsDesc: optionsDesc, baseTotal: showerTotal
    });
    config.panels.forEach(p => { let el = document.getElementById('shower-' + p.id); if (el) el.value = ''; });
    document.getElementById('shower-h').value = '';
    document.getElementById('shower-comment').value = '';
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-shower', _capturedData);
    else renderCart();
}

// --- CUSTOM ITEMS LOGIC ---
// --- HARDWARE LOGIC ---
function handleHardwareSelectChange() {
    let sel = document.getElementById('hardware-select');
    let nameInput = document.getElementById('hardware-name');
    let priceInput = document.getElementById('hardware-price');
    
    if (!sel || !nameInput || !priceInput) return;
    
    if (sel.value === 'custom') {
        nameInput.style.display = 'block';
        nameInput.value = '';
        priceInput.value = '';
    } else {
        nameInput.style.display = 'none';
        let idx = parseInt(sel.value);
        if (HARDWARE_TYPES && HARDWARE_TYPES[idx]) {
            nameInput.value = HARDWARE_TYPES[idx].name;
            priceInput.value = Math.ceil(HARDWARE_TYPES[idx].price * getGlobalMarkup());
        }
    }
}

function addHardwareItem() {
    let _capturedData = captureRawData("tab-hardware");
    let _commitItems = [];
    let name = document.getElementById('hardware-name').value.trim();
    let price = parseFloat(document.getElementById('hardware-price').value) || 0;
    let qty = parseInt(document.getElementById('hardware-qty').value) || 1;
    let comment = document.getElementById('hardware-comment').value.trim();
    
    if (!name) { alert('Введите наименование!'); return; }

    let optionsDesc = [];
    if (comment) optionsDesc.push(`📝 ${comment}`);

    _commitItems.push({
        id: Date.now(), category: 'hardware', type: name,
        qty: qty, w: 0, h: 0, l: 0, area: 0, calcArea: 0,
        shape: '', isLarge: false,
        unit: 'шт.', unitCost: price,
        optionsDesc: optionsDesc, baseTotal: price * qty
    });

    document.getElementById('hardware-select').value = 'custom';
    handleHardwareSelectChange();
    document.getElementById('hardware-name').value = '';
    document.getElementById('hardware-price').value = '';
    document.getElementById('hardware-qty').value = '1';
    document.getElementById('hardware-comment').value = '';
    document.getElementById('hardware-name').focus();
    
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-hardware', _capturedData);
    else renderCart();
}

// --- CUSTOM ITEMS LOGIC ---
function addCustomItem() {
    let _capturedData = captureRawData("tab-custom");
    let _commitItems = [];
    let name = document.getElementById('custom-name').value.trim();
    let price = parseFloat(document.getElementById('custom-price').value) || 0;
    let qty = parseInt(document.getElementById('custom-qty').value) || 1;
    let unit = document.getElementById('custom-unit').value || 'шт.';
    
    let isSized = false;
    let typeRadio = document.querySelector('input[name="custom-type"]:checked');
    if (typeRadio && typeRadio.value === 'sized') isSized = true;

    let w = 0, h = 0, area = 0;
    if (isSized) {
        w = parseFloat(document.getElementById('custom-w').value) || 0;
        h = parseFloat(document.getElementById('custom-h').value) || 0;
        area = (w > 0 && h > 0) ? (w * h / 1000000) : 0;
    }

    let desc = document.getElementById('custom-desc').value.trim();
    if (!name) { alert('Введите наименование!'); return; }

    let optionsDesc = [];

    if (isSized && w > 0 && h > 0) {
        optionsDesc.push(`Размер: ${w} × ${h} мм (${area.toFixed(3)} м²)`);
    }
    
    if (desc) optionsDesc.push(desc);

    // Расчет итоговой цены
    let effectiveTotal = price * qty;
    if (unit === 'м²' && area > 0) {
        effectiveTotal = price * area * qty;
    } else if (unit === 'м.п.' && w > 0) {
        let lengthM = w / 1000;
        if (lengthM > 0) effectiveTotal = price * lengthM * qty;
    }

    _commitItems.push({
        id: Date.now(), category: 'custom', type: name,
        qty: qty, w: w, h: h, l: 0, area: area, calcArea: area,
        shape: '', isLarge: false,
        unit: unit, unitCost: price,
        optionsDesc: optionsDesc, baseTotal: effectiveTotal,
        isSized: isSized
    });
    
    document.getElementById('custom-name').value = '';
    document.getElementById('custom-price').value = '';
    document.getElementById('custom-qty').value = '1';
    if (isSized) {
        document.getElementById('custom-w').value = '';
        document.getElementById('custom-h').value = '';
        document.getElementById('custom-area-display').value = '';
    }
    document.getElementById('custom-desc').value = '';
    
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-custom', _capturedData);
    else renderCart();
}


// --- BLINDS (ЖАЛЮЗИ) LOGIC ---
function initBlindsTab() {
    let fabricSel = document.getElementById('blinds-fabric');
    if (!fabricSel) return;
    fabricSel.innerHTML = '';
    BLINDS_FABRICS.forEach((f, i) => {
        let zebraTag = f.isZebra ? ' 🔲 Зебра' : '';
        fabricSel.innerHTML += `<option value="${i}">${f.name} — ${f.price} ₽/м.п.${zebraTag}</option>`;
    });
}

function toggleBlindsSystem() {
    let sys = document.getElementById('blinds-system').value;
    let fabricContainer = document.getElementById('blinds-fabric-container');
    let priceContainer = document.getElementById('blinds-price-container');
    if (!fabricContainer || !priceContainer) return;
    
    if (sys === 'HORIZ') {
        fabricContainer.classList.add('hidden');
        priceContainer.classList.remove('hidden');
    } else {
        fabricContainer.classList.remove('hidden');
        priceContainer.classList.add('hidden');
    }
}

function addBlindsItem() {
    let _capturedData = captureRawData("tab-blinds");
    let _commitItems = [];
    let widthMm = parseFloat(document.getElementById('blinds-w').value);
    let heightMm = parseFloat(document.getElementById('blinds-h').value);
    let qty = parseInt(document.getElementById('blinds-qty').value) || 1;
    let system = document.getElementById('blinds-system').value;
    let fabricIdx = parseInt(document.getElementById('blinds-fabric').value);
    let controlSide = document.getElementById('blinds-control').value;
    let comment = document.getElementById('blinds-comment').value.trim();

    let isHoriz = system === 'HORIZ';

    if (!widthMm || !heightMm || widthMm <= 0 || heightMm <= 0) {
        alert('Введите ширину и высоту изделия в миллиметрах!');
        return;
    }
    
    // Для расчётов сетки цен и площади используем сантиметры
    let widthCm = widthMm / 10;
    let heightCm = heightMm / 10;
    let area = (widthCm * heightCm) / 10000; // м²

    let fabric = null;
    if (!isHoriz) {
        fabric = BLINDS_FABRICS[fabricIdx];
        if (!fabric) { alert('Выберите ткань!'); return; }
    }

    let widthM = widthCm / 100;
    let systemCost = 0;
    let systemDesc = '';

    // 1. Расчёт стоимости системы
    if (system === 'UNI1') {
        // Округление ВВЕРХ до ближайшего значения в сетке
        let gridW = BLINDS_UNI1_WIDTHS[BLINDS_UNI1_WIDTHS.length - 1]; // макс по умолчанию
        for (let i = 0; i < BLINDS_UNI1_WIDTHS.length; i++) {
            if (widthCm <= BLINDS_UNI1_WIDTHS[i]) { gridW = BLINDS_UNI1_WIDTHS[i]; break; }
        }
        let gridH = BLINDS_UNI1_HEIGHTS[BLINDS_UNI1_HEIGHTS.length - 1];
        for (let i = 0; i < BLINDS_UNI1_HEIGHTS.length; i++) {
            if (heightCm <= BLINDS_UNI1_HEIGHTS[i]) { gridH = BLINDS_UNI1_HEIGHTS[i]; break; }
        }

        let wIdx = BLINDS_UNI1_WIDTHS.indexOf(gridW);
        let hIdx = BLINDS_UNI1_HEIGHTS.indexOf(gridH);

        if (wIdx === -1 || hIdx === -1) {
            alert(`Размеры выходят за пределы сетки UNI 1!\nМакс. ширина: ${BLINDS_UNI1_WIDTHS[BLINDS_UNI1_WIDTHS.length-1]} см, макс. высота: ${BLINDS_UNI1_HEIGHTS[BLINDS_UNI1_HEIGHTS.length-1]} см`);
            return;
        }

        systemCost = BLINDS_UNI1_GRID[hIdx][wIdx];
        systemDesc = `UNI 1 (по сетке ${gridW}×${gridH})`;

    } else if (system === 'MINI_D19') {
        systemCost = widthM * 500;
        systemDesc = `MINI (D 19)`;

    } else if (system === 'D25') {
        systemCost = widthM * 800;
        systemDesc = `D 25`;
        
    } else if (system === 'HORIZ') {
        systemCost = area * 2100;
        systemDesc = `Горизонтальные алюминиевые`;
    }

    // 2. Расчёт стоимости ткани
    let fabricCost = 0;
    let fabricDesc = '';
    let zebraSurcharge = 0;
    let zebraDesc = '';

    if (!isHoriz) {
        fabricCost = widthM * fabric.price;
        fabricDesc = `${fabric.name}`;

        // 3. Наценка за Зебру при высоте > 150 см
        if (fabric.isZebra && heightCm > 150) {
            let excess = heightCm - 150;
            let steps = Math.ceil(excess / 10);
            zebraSurcharge = steps * 200;
            zebraDesc = `Наценка за высоту "Зебры" (> 150 см)`;
        }
    } else {
        fabricDesc = 'Алюминиевые ламели';
    }

    // Итого за 1 шт
    let unitTotal = systemCost + fabricCost + zebraSurcharge;

    let optionsDesc = [
        `Система: ${systemDesc}`,
        `Ткань/Материал: ${fabricDesc}`,
        `Управление: ${controlSide === 'left' ? 'Слева' : 'Справа'}`
    ];
    if (zebraDesc) optionsDesc.push(zebraDesc);
    if (comment) optionsDesc.push(`📝 ${comment}`);

    // Сборка SVG эскиза
    let svgWidth = 60;
    let svgHeight = Math.max(30, (heightCm / widthCm) * 60);
    if (svgHeight > 80) { svgHeight = 80; svgWidth = (widthCm / heightCm) * 80; }
    let vbPad = 25;
    
    let topHtml = '';
    let stripesHtml = '';
    
    if (isHoriz) {
        let numSlats = Math.floor(svgHeight / 4);
        for (let i = 0; i < numSlats; i++) {
            let y1 = i * 4;
            stripesHtml += `<rect x="0" y="${y1}" width="${svgWidth}" height="2" fill="#cbd5e1" />`;
        }
        topHtml = `<rect x="-1" y="-5" width="${svgWidth+2}" height="6" fill="#94a3b8" rx="1" />`;
    } else {
        if (fabric && fabric.isZebra) {
            let numStripes = Math.floor(svgHeight / 6);
            for (let i = 0; i < numStripes; i += 2) {
                let y1 = i * 6;
                stripesHtml += `<rect x="0" y="${y1}" width="${svgWidth}" height="6" fill="#cbd5e1" opacity="0.4" />`;
            }
        }
        topHtml = system === 'UNI1' 
            ? `<rect x="-3" y="-6" width="${svgWidth+6}" height="8" fill="#94a3b8" rx="2" />` 
            : `<circle cx="-2" cy="-2" r="3" fill="#94a3b8"/><circle cx="${svgWidth+2}" cy="-2" r="3" fill="#94a3b8"/><rect x="0" y="-4" width="${svgWidth}" height="4" fill="#cbd5e1"/>`;
    }

    // Цепочка управления
    let chainHtml = '';
    if (controlSide === 'left') {
        chainHtml = `<path d="M -2 -2 L -2 ${svgHeight*0.6} L -5 ${svgHeight*0.6} L -5 -2" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5,1.5"/>`;
        if (isHoriz) chainHtml += `<path d="M -5 -2 L -5 ${svgHeight*0.4}" fill="none" stroke="#64748b" stroke-width="1.5"/>`;
    } else {
        chainHtml = `<path d="M ${svgWidth+2} -2 L ${svgWidth+2} ${svgHeight*0.6} L ${svgWidth+5} ${svgHeight*0.6} L ${svgWidth+5} -2" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="1.5,1.5"/>`;
        if (isHoriz) chainHtml += `<path d="M ${svgWidth+5} -2 L ${svgWidth+5} ${svgHeight*0.4}" fill="none" stroke="#64748b" stroke-width="1.5"/>`;
    }
        
    let typeDisplay = isHoriz ? 'Жалюзи Горизонтальные алюминиевые' : `Жалюзи ${system === 'UNI1' ? 'UNI 1' : system === 'MINI_D19' ? 'MINI (D 19)' : 'D 25'} + ${fabric.name}`;

    let blindsSvg = `
        <svg viewBox="-20 -25 ${svgWidth + 60} ${svgHeight + 50}" class="w-32 h-32 mx-auto mb-1 overflow-visible">
            <!-- Полотно -->
            <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${isHoriz ? 'none' : '#f8fafc'}" stroke="#64748b" stroke-width="1.5" />
            ${stripesHtml}
            <!-- Нижний отвес -->
            <rect x="-1" y="${svgHeight-2}" width="${svgWidth+2}" height="4" fill="#cbd5e1" stroke="#64748b" stroke-width="1" />
            <!-- Короб/вал -->
            ${topHtml}
            <!-- Цепочка управления -->
            ${chainHtml}
            <!-- Размеры -->
            <text x="${svgWidth/2}" y="-12" font-family="Arial, sans-serif" font-size="15" fill="#334155" text-anchor="middle">${widthMm} мм</text>
            <text x="${svgWidth+18}" y="${svgHeight/2}" font-family="Arial, sans-serif" font-size="15" fill="#334155" text-anchor="middle" transform="rotate(-90, ${svgWidth+18}, ${svgHeight/2})">${heightMm} мм</text>
        </svg>
    `;

    _commitItems.push({
        id: Date.now(),
        category: 'blinds',
        type: typeDisplay,
        qty: qty,
        w: widthMm, // сохраняем в мм
        h: heightMm,
        area: area,
        calcArea: area,
        shape: `${widthMm} × ${heightMm} мм`,
        isLarge: false,
        unitCost: unitTotal,
        optionsDesc: optionsDesc,
        baseTotal: unitTotal * qty,
        customSvg: blindsSvg
    });

    document.getElementById('blinds-w').value = '';
    document.getElementById('blinds-h').value = '';
    document.getElementById('blinds-qty').value = '1';
    document.getElementById('blinds-comment').value = '';
    document.getElementById('blinds-w').focus();
    if(_commitItems.length > 0) commitItemsToCart(_commitItems, 'tab-blinds', _capturedData);
    else renderCart();
}

// --- SERVICES AUTO-FILL ---
// Цены из Прайса по монтажу: [Офис, Монтажник, Бригада]
let MOUNT_PRICES = {
    montaz58:   [1300, 1200, 1000],
    razdvizh:   [2000, 1600, 1400],
    shower:     [8000, 6500, 5500],
    sill:       [1000, 850, 700],
    sillSimple: [700, 600, 500],
    net:        [700, 600, 500],
    netPleated: [1500, 1200, 1000],
    lift:       [200, 170, 150],
    demontazh:  [1200, 1050, 900],
    util:       [200, 170, 150]
};

// --- SERVICES ARRAY (dynamic) ---
let SERVICES = [];

function addService(name, amount) {
    name = name || '';
    amount = parseFloat(amount) || 0;
    if (!name && !amount) {
        name = '';
        amount = 0;
    }
    SERVICES.push({ name: name, amount: amount });
    renderServicesList();
    renderCart();
}

// --- PRESET SERVICES FROM CSV ---
let PRESET_SERVICES_DB = [{"id":"srv_1","name":"Вывоз","unit":"м2","prices":[800,650,500]},{"id":"srv_2","name":"Демонтаж вагончик","unit":"м2","prices":[1500,1350,1200]},{"id":"srv_3","name":"Демонтаж дерево","unit":"м2","prices":[900,800,700]},{"id":"srv_4","name":"Демонтаж перил ровные до 3 метров","unit":"шт","prices":[4000,3500,3000]},{"id":"srv_5","name":"Демонтаж перил ровные свыше 3 метров","unit":"шт","prices":[5000,4500,4000]},{"id":"srv_6","name":"Демонтаж пластик","unit":"м2","prices":[1200,1050,900]},{"id":"srv_7","name":"Демонтаж разбитого СП","unit":"м2","prices":[800,700,600]},{"id":"srv_8","name":"Демонтаж стены пеноблок","unit":"м2","prices":[3500,3000,2700]},{"id":"srv_9","name":"Демонтаж стены шлакоблок","unit":"м2","prices":[4000,3500,3000]},{"id":"srv_10","name":"Доставка","unit":"","prices":[0,70,0]},{"id":"srv_11","name":"Минимальный выезд","unit":"","prices":[2000,1700,1500]},{"id":"srv_12","name":"Монтаж 58","unit":"м2","prices":[1300,1200,1000]},{"id":"srv_13","name":"Монтаж 70","unit":"м2","prices":[1500,1400,1200]},{"id":"srv_14","name":"Монтаж 80","unit":"м2","prices":[1800,1600,1400]},{"id":"srv_15","name":"Монтаж Алюминий 60","unit":"м2","prices":[2000,1700,1500]},{"id":"srv_16","name":"Монтаж Алюминий 70","unit":"м2","prices":[2200,1900,1700]},{"id":"srv_17","name":"Монтаж ворот подьемных","unit":"шт","prices":[25000,20000,15000]},{"id":"srv_18","name":"Монтаж двери дерево","unit":"шт","prices":[6500,6000,5500]},{"id":"srv_19","name":"Монтаж двери металл","unit":"шт","prices":[3500,3000,2500]},{"id":"srv_20","name":"Монтаж двери пластик","unit":"шт","prices":[3500,3000,2500]},{"id":"srv_21","name":"Монтаж доводчика","unit":"шт","prices":[1500,1200,1000]},{"id":"srv_22","name":"Монтаж душевой","unit":"шт","prices":[8000,6500,5500]},{"id":"srv_23","name":"Монтаж композита","unit":"м2","prices":[3500,3000,2500]},{"id":"srv_24","name":"Монтаж Обналички паянная","unit":"шт","prices":[1000,700,500]},{"id":"srv_25","name":"Монтаж Откосов с материалом","unit":"метр","prices":[2000,1000,800]},{"id":"srv_26","name":"Монтаж пирил","unit":"метр","prices":[2700,2300,2000]},{"id":"srv_27","name":"Монтаж поликорбоната","unit":"м2","prices":[2000,1500,1200]},{"id":"srv_28","name":"Монтаж Раздвижка Алюминий","unit":"м2","prices":[3000,2700,2500]},{"id":"srv_29","name":"Монтаж Раздвижки безрамное","unit":"м2","prices":[2000,1600,1400]},{"id":"srv_30","name":"Монтаж роллет 58,45","unit":"м2","prices":[1500,1200,1000]},{"id":"srv_31","name":"Монтаж роллет 70","unit":"м2","prices":[2000,1700,1500]},{"id":"srv_32","name":"Монтаж ручки дверной","unit":"шт","prices":[500,400,300]},{"id":"srv_33","name":"Монтаж ручки дверной офисная","unit":"шт","prices":[1500,1200,1000]},{"id":"srv_34","name":"Монтаж ручки оконная","unit":"шт","prices":[300,230,150]},{"id":"srv_35","name":"Монтаж сендвич","unit":"м2","prices":[700,600,500]},{"id":"srv_36","name":"Монтаж Слайд Пластик","unit":"м2","prices":[1300,1200,1000]},{"id":"srv_37","name":"Монтаж Сп пластик","unit":"м2","prices":[2000,1600,1300]},{"id":"srv_38","name":"Монтаж Сп Фасадка","unit":"м2","prices":[3000,2500,2000]},{"id":"srv_39","name":"Монтаж уголка с материалом внутри","unit":"метр","prices":[350,150,100]},{"id":"srv_40","name":"Монтаж уголка с материалом улица","unit":"метр","prices":[500,250,200]},{"id":"srv_41","name":"Монтаж Фасадка с примыканием (Уголок) объем","unit":"м2","prices":[2500,2250,2000]},{"id":"srv_42","name":"Монтаж Фасадка с примыканием (Уголок)еденичные","unit":"","prices":[3000,2500,2250]},{"id":"srv_43","name":"Монтаж фурнитура","unit":"шт","prices":[2000,1700,1500]},{"id":"srv_44","name":"Монтажи не стандартных позиций договорная","unit":"","prices":[0,0,0]},{"id":"srv_45","name":"Отлив","unit":"метр","prices":[700,600,500]},{"id":"srv_46","name":"Погрузка разгрузка","unit":"час","prices":[1300,1150,1000]},{"id":"srv_47","name":"Подоконик кристалит","unit":"метр","prices":[1000,850,700]},{"id":"srv_48","name":"Подоконик обычный","unit":"метр","prices":[700,600,500]},{"id":"srv_49","name":"Подъем","unit":"м2","prices":[200,170,150]},{"id":"srv_50","name":"Распакечивание Алюминий","unit":"шт","prices":[1700,1500,1300]},{"id":"srv_51","name":"Распакечивание пластик","unit":"шт","prices":[1500,1200,1000]},{"id":"srv_52","name":"Регулировка ключом дверь Алюминий","unit":"шт","prices":[1100,950,800]},{"id":"srv_53","name":"Регулировка ключом дверь пластик","unit":"шт","prices":[1000,850,700]},{"id":"srv_54","name":"Регулировка ключом окно Алюминий","unit":"шт","prices":[800,700,600]},{"id":"srv_55","name":"Регулировка ключом окно пластик","unit":"шт","prices":[600,500,400]},{"id":"srv_56","name":"Резина работа материал","unit":"метр","prices":[150,70,50]},{"id":"srv_57","name":"Сварка балкона","unit":"шт","prices":[50000,40000,35000]},{"id":"srv_58","name":"Сетка обычная","unit":"шт","prices":[700,600,500]},{"id":"srv_59","name":"Сетка плиссе","unit":"шт","prices":[1500,1200,1000]},{"id":"srv_60","name":"Смазка фурнитуры","unit":"шт","prices":[200,150,100]},{"id":"srv_61","name":"Стиз","unit":"м2","prices":[600,500,400]},{"id":"srv_62","name":"Монтаж противопожарных дверей","unit":"шт","prices":[4500,4000,3500]}];

function initPresetServices() {
    let select = document.getElementById('srv-preset');
    let priceTierEl = document.getElementById('srv-pricelist');
    if (!select || !priceTierEl) return;
    
    let priceTier = priceTierEl.value;
    let tierIdx = { office: 0, vitalik: 1, brigade: 2 }[priceTier] || 0;
    
    // Save current selection to restore after re-render
    let currentVal = select.value;
    
    select.innerHTML = '<option value="">-- Выбрать услугу из прайса --</option>';
    PRESET_SERVICES_DB.forEach(srv => {
        let price = srv.prices[tierIdx];
        select.innerHTML += `<option value="${srv.id}">${srv.name} — ${price} ₽/${srv.unit}</option>`;
    });
    
    select.value = currentVal;
}

function applyPresetService() {
    let select = document.getElementById('srv-preset');
    let srvId = select.value;
    if (!srvId) return;

    let srv = PRESET_SERVICES_DB.find(s => s.id === srvId);
    if (!srv) return;

    let priceTier = document.getElementById('srv-pricelist').value;
    let tierIdx = { office: 0, vitalik: 1, brigade: 2 }[priceTier] || 0;

    let basePrice = srv.prices[tierIdx];
    let amount = basePrice;
    
    // Auto-calc from cart if unit is m2 or metr or sht
    let glassArea = 0, framelessArea = 0, showerCount = 0;
    let sillLengthM = 0;
    let netCount = 0;

    ITEMS.forEach(it => {
        if (it.category === 'glass') glassArea += (it.area || 0) * (it.qty || 1);
        else if (it.category === 'frameless') framelessArea += (it.area || 0);
        else if (it.category === 'shower') showerCount += 1;
        else if (it.category === 'sill') sillLengthM += ((it.h || 0) / 1000) * (it.qty || 1);
        else if (it.category === 'net') netCount += (it.qty || 1);
        else if (it.category === 'slope') glassArea += (it.area || 0) * (it.qty || 1);
    });

    let totalArea = glassArea + framelessArea;

    if (srv.unit.includes('м2')) {
        amount = Math.ceil(totalArea * basePrice);
        if (amount === 0) amount = basePrice; // fallback if cart empty
    } else if (srv.unit.includes('м.п') || srv.unit.includes('метр')) {
        amount = Math.ceil(sillLengthM * basePrice);
        if (amount === 0) amount = basePrice; 
    } else if (srv.unit.includes('шт')) {
        let maxQty = Math.max(showerCount, netCount, 1);
        amount = Math.ceil(maxQty * basePrice);
    }

    document.getElementById('srv-new-name').value = srv.name;
    document.getElementById('srv-new-amount').value = amount || 0;
    
    // Reset selection so user can pick again
    select.value = '';
}

// Attach event listener to pricelist to update dropdown automatically
window.addEventListener('DOMContentLoaded', () => {
    let priceTierEl = document.getElementById('srv-pricelist');
    if (priceTierEl) {
        priceTierEl.addEventListener('change', () => {
            initPresetServices();
            if (typeof autoFillServices === 'function') autoFillServices();
        });
    }
});

function removeService(idx) {
    SERVICES.splice(idx, 1);
    renderServicesList();
    renderCart();
}

function editService(idx) {
    let srv = SERVICES[idx];
    document.getElementById('srv-new-name').value = srv.name;
    document.getElementById('srv-new-amount').value = srv.amount;
    SERVICES.splice(idx, 1);
    renderServicesList();
    renderCart();
}


document.addEventListener('DOMContentLoaded', () => {
    let srvName = document.getElementById('srv-new-name');
    let srvAmount = document.getElementById('srv-new-amount');
    if (srvName && srvAmount) {
        srvName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') srvAmount.focus();
        });
        srvAmount.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addServiceFromInput();
                srvName.focus();
            }
        });
    }
});

function addServiceFromInput() {
    let nameEl = document.getElementById('srv-new-name');
    let amountEl = document.getElementById('srv-new-amount');
    let name = (nameEl.value || '').trim();
    let amount = parseFloat(amountEl.value) || 0;
    if (!name) { alert('Введите название услуги!'); return; }
    if (amount <= 0) { alert('Введите сумму!'); return; }
    SERVICES.push({ name: name, amount: amount });
    nameEl.value = '';
    amountEl.value = '';
    renderServicesList();
    renderCart();
}

function renderServicesList() {
    let container = document.getElementById('services-list');
    if (!container) return;
    if (SERVICES.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 text-xs py-3">Нет услуг</div>';
        return;
    }
    container.innerHTML = SERVICES.map((srv, i) => `
        <div class="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0" ondblclick="editService(${i})">
            <span class="flex-1 text-xs text-slate-700 font-medium truncate cursor-pointer">${srv.name}</span>
            <span class="text-xs font-bold text-slate-800 whitespace-nowrap">${srv.amount.toLocaleString()} ₽</span>
            <button onclick="editService(${i})" class="text-slate-300 hover:text-blue-500 p-0.5 flex-shrink-0" title="Редактировать"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
            <button onclick="removeService(${i})" class="text-slate-300 hover:text-red-500 p-0.5 flex-shrink-0" title="Удалить"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
        </div>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function autoFillServices() {
    let priceTier = document.getElementById('srv-pricelist').value;
    let tierIdx = { office: 0, vitalik: 1, brigade: 2 }[priceTier] || 0;
    let P = (key) => MOUNT_PRICES[key][tierIdx];

    let glassArea = 0, framelessArea = 0, showerCount = 0;
    let sillLengthCrystallitM = 0, sillLengthSimpleM = 0;
    let netCount = 0, netPleatedCount = 0;

    ITEMS.forEach(it => {
        if (it.category === 'glass') {
            glassArea += (it.area || 0) * (it.qty || 1);
        } else if (it.category === 'frameless') {
            framelessArea += (it.area || 0);
        } else if (it.category === 'shower') {
            showerCount += 1;
        } else if (it.category === 'sill') {
            let lenM = (it.h || 0) / 1000;
            let qty = it.qty || 1;
            if (it.type && it.type.includes('Crystallit')) sillLengthCrystallitM += lenM * qty;
            else sillLengthSimpleM += lenM * qty;
        } else if (it.category === 'net') {
            let isPleated = it.type && it.type.toLowerCase().includes('\u043f\u043b\u0438\u0441\u0441');
            if (isPleated) netPleatedCount += (it.qty || 1); else netCount += (it.qty || 1);
        }
    });

    let totalArea = glassArea + framelessArea;
    if (totalArea === 0 && showerCount === 0 && sillLengthCrystallitM === 0 && sillLengthSimpleM === 0 && netCount === 0 && netPleatedCount === 0) {
        alert('\u041a\u043e\u0440\u0437\u0438\u043d\u0430 \u043f\u0443\u0441\u0442\u0430\u044f \u2014 \u0434\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0438\u0437\u0434\u0435\u043b\u0438\u044f \u043f\u0435\u0440\u0435\u0434 \u0430\u0432\u0442\u043e\u0440\u0430\u0441\u0447\u0451\u0442\u043e\u043c!'); return;
    }

    let installTotal = Math.ceil((glassArea * P('montaz58')) + (framelessArea * P('razdvizh')) + (showerCount * P('shower')));
    let sillMount = Math.ceil((sillLengthCrystallitM * P('sill')) + (sillLengthSimpleM * P('sillSimple')));
    let netMount = Math.ceil((netCount * P('net')) + (netPleatedCount * P('netPleated')));
    let liftTotal = totalArea > 0 ? Math.ceil(totalArea * P('lift')) : 0;
    let utilTotal = totalArea > 0 ? Math.ceil(totalArea * P('util')) : 0;

    // Заполняем массив SERVICES
    SERVICES = [];
    if (installTotal > 0) SERVICES.push({ name: 'Монтаж изделий', amount: installTotal });
    if (liftTotal > 0) SERVICES.push({ name: 'Подъём', amount: liftTotal });
    if (utilTotal > 0) SERVICES.push({ name: 'Утилизация', amount: utilTotal });
    if (sillMount + netMount > 0) SERVICES.push({ name: 'Штапики / Сетки', amount: sillMount + netMount });

    let tierName = priceTier === 'office' ? '\u041e\u0444\u0438\u0441' : priceTier === 'vitalik' ? '\u041c\u043e\u043d\u0442\u0430\u0436\u043d\u0438\u043a' : '\u0411\u0440\u0438\u0433\u0430\u0434\u0430';
    let total = SERVICES.reduce((s, srv) => s + srv.amount, 0);
    alert(`\u2705 \u0410\u0432\u0442\u043e\u0440\u0430\u0441\u0447\u0451\u0442 (\u041f\u0440\u0430\u0439\u0441: ${tierName})\n\n\u0418\u0442\u043e\u0433 \u0443\u0441\u043b\u0443\u0433: ${total.toLocaleString()} \u20bd`);
    renderServicesList();
    renderCart();
}

function clearServices() {
    SERVICES = [];
    renderServicesList();
    renderCart();
}

// --- CART & PROPOSAL LOGIC ---
function remove(id) { ITEMS = ITEMS.filter(i => i.id !== id); renderCart(); }

// --- EDIT ITEM LOGIC ---
let editingItemId = null;
function editItem(id) {
    let item = ITEMS.find(i => i.id === id);
    if (!item) return;
    editingItemId = id;
    document.getElementById('edit-item-type').value = item.type || '';
    document.getElementById('edit-item-qty').value = item.qty || 1;
    document.getElementById('edit-item-cost').value = Math.round(item.unitCost) || 0;
    document.getElementById('edit-item-modal').classList.remove('hidden');
}
function closeEditModal() {
    document.getElementById('edit-item-modal').classList.add('hidden');
    editingItemId = null;
}
function saveEditItem() {
    let item = ITEMS.find(i => i.id === editingItemId);
    if (!item) return;
    let newType = document.getElementById('edit-item-type').value.trim();
    let newQty = parseInt(document.getElementById('edit-item-qty').value) || 1;
    let newCost = parseFloat(document.getElementById('edit-item-cost').value) || 0;
    if (newType) item.type = newType;
    item.qty = newQty;
    item.unitCost = newCost;
    item.baseTotal = newCost * newQty;
    closeEditModal();
    renderCart();
}

function calculateTotals() {
    let markup = getGlobalMarkup();
    let baseSum = 0;
    ITEMS.forEach(it => {
        let costMult = (it.category === 'custom' || it.category === 'slope_profile' || it.category === 'roller') ? 1 : markup;
        baseSum += Math.ceil(it.baseTotal * costMult);
    });

    let manMarkupRub = parseFloat(document.getElementById('manual-markup-rub').value) || 0;
    let manMarkupPct = parseFloat(document.getElementById('manual-markup-pct').value) || 0;
    let totalManualMarkup = manMarkupRub + (baseSum * (manMarkupPct / 100));
    
    let manDiscRub = parseFloat(document.getElementById('manual-discount-rub').value) || 0;
    let manDiscPct = parseFloat(document.getElementById('manual-discount-pct').value) || 0;
    let totalDiscount = manDiscRub + (baseSum * (manDiscPct / 100));
    
    let servSum = SERVICES.reduce((s, srv) => s + (srv.amount || 0), 0);
    
    let sumWithMarkup = baseSum + totalManualMarkup;
    let finalTotal = sumWithMarkup + servSum - totalDiscount;
    
    return {
        baseSum: baseSum,
        totalManualMarkup: totalManualMarkup,
        totalDiscount: totalDiscount,
        servSum: servSum,
        sumWithMarkup: sumWithMarkup,
        finalTotal: Math.ceil(finalTotal)
    };
}

function clearCart() {
    if (confirm("Вы действительно хотите полностью очистить смету? Это действие нельзя отменить.")) {
        ITEMS = [];
        SERVICES = [];
        if(document.getElementById("client-name")) document.getElementById("client-name").value = "";
        if(document.getElementById("kp-number-input")) document.getElementById("kp-number-input").value = "";
        if(document.getElementById("manual-markup-rub")) document.getElementById("manual-markup-rub").value = "";
        if(document.getElementById("manual-markup-pct")) document.getElementById("manual-markup-pct").value = "";
        if(document.getElementById("manual-discount-rub")) document.getElementById("manual-discount-rub").value = "";
        if(document.getElementById("manual-discount-pct")) document.getElementById("manual-discount-pct").value = "";
        if(document.getElementById("srv-new-name")) document.getElementById("srv-new-name").value = "";
        if(document.getElementById("srv-new-amount")) document.getElementById("srv-new-amount").value = "";
        if(typeof renderServicesList === 'function') renderServicesList();
        renderCart();
    }
}

function renderCart() {
    let list = document.getElementById('cart-items'); list.innerHTML = '';
    let totals = calculateTotals();
    let markup = getGlobalMarkup();
    if (ITEMS.length === 0) {
        list.innerHTML = '<div class="text-center text-slate-400 py-12 flex flex-col items-center gap-3"><i data-lucide="package-open" class="w-10 h-10 text-slate-200"></i><span class="text-sm">Смета пуста.<br>Добавьте изделия обойдя категории.</span></div>';
    } else {
        ITEMS.forEach((it, idx) => {
            let costMult = (it.category === 'custom' || it.category === 'slope_profile' || it.category === 'roller') ? 1 : markup;
            let cost = Math.ceil(it.baseTotal * costMult);
            let icon = { glass: 'layout-grid', net: 'grid-3x3', frameless: 'blinds', sill: 'align-horizontal-justify-end', slope: 'square-split-horizontal', slope_profile: 'frame', shower: 'droplets', custom: 'package-plus', roller: 'archive', blinds: 'app-window' }[it.category] || 'box';
            let col = { glass: 'brand-primary', net: 'brand-secondary', frameless: 'slate-800', sill: 'amber-700', slope: 'slate-600', slope_profile: 'slate-500', shower: 'blue-500', custom: 'slate-600', roller: 'brand-primary', blinds: 'indigo-500' }[it.category] || 'slate-600';
            let opts = it.optionsDesc.length > 0 ? `<div class="mt-1.5 space-y-0.5">${it.optionsDesc.map(o => `<p class="text-[11px] text-slate-500">• ${o}</p>`).join('')}</div>` : '';
            let qtyBadge = (it.qty && it.qty > 1) ? `<span class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold ml-1">×${it.qty}</span>` : '';
            let totalArea = it.area * (it.qty || 1);
            let dimLine;
            if (it.category === 'custom' || it.category === 'slope_profile' || it.category === 'hardware') {
                dimLine = `${it.qty || 1} ${it.unit || 'шт.'}`;
            } else if (it.category === 'shower') {
                dimLine = getShowerDimensionLine(it, true);
            } else {
                dimLine = `${it.w} × ${it.h} мм | ${totalArea.toFixed(2)} м²`;
            }
            list.innerHTML += `<div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group"><div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">${it.tabId ? `<button onclick="editItemFull(${it.groupId || it.id}, '${it.tabId}')" class="text-brand-primary hover:text-brand-dark p-1 bg-brand-light hover:bg-blue-100 rounded-lg transition-colors mr-1" title="Полное редактирование">
        <i data-lucide="pencil" class="w-4 h-4"></i>
    </button>` : `<button onclick="editItem(${it.id})" class="text-slate-300 hover:text-blue-500 p-1" title="Базовое редактирование"><i data-lucide="pencil" class="w-4 h-4"></i></button>`}<button onclick="remove(${it.id})" class="text-slate-300 hover:text-red-500 p-1" title="Удалить"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div><div class="flex gap-3"><div class="w-8 h-8 rounded-lg bg-${col}/10 flex items-center justify-center flex-shrink-0 text-${col}"><i data-lucide="${icon}" class="w-4 h-4"></i></div><div><div class="font-bold text-sm text-slate-800 pr-14">${idx + 1}. ${it.type}${qtyBadge}</div><div class="text-xs text-slate-500 font-medium">${dimLine}</div>${opts}</div></div><div class="mt-2 text-right font-black text-${col}">${cost.toLocaleString()} ₽</div></div>`;
        });
    }
    document.getElementById('items-count-badge').innerText = ITEMS.reduce((s, it) => s + (it.qty || 1), 0);
    document.getElementById('cart-total-display').innerText = totals.finalTotal.toLocaleString() + ' ₽';
    lucide.createIcons();
}

function showProposal() {
    if (ITEMS.length === 0) { document.getElementById('print-error').classList.remove('hidden'); setTimeout(() => document.getElementById('print-error').classList.add('hidden'), 3000); return; }
    
    let totals = calculateTotals();
    let kpNum = document.getElementById('kp-number-input').value;
    document.getElementById('kp-number-display-right').innerText = kpNum ? `№ ${kpNum}` : '';
    document.getElementById('kp-client-display').innerText = document.getElementById('client-name').value || 'Не указан';
    
    let tbody = document.getElementById('kp-table-body'); tbody.innerHTML = '';
    let markup = getGlobalMarkup();
    
    // Для распределения наценки по строкам таблицы
    let targetSumWithManualMarkup = Math.round(totals.baseSum + totals.totalManualMarkup);
    let markupFactor = totals.baseSum > 0 ? (targetSumWithManualMarkup / totals.baseSum) : 1;
    let sumWithManualMarkup = 0; // Будем накапливать точную сумму строк

    let totalArea = 0;
    ITEMS.forEach((it, idx) => {
        let costMult = (it.category === 'custom' || it.category === 'slope_profile' || it.category === 'roller') ? 1 : markup;
        let baseWithMarkup = Math.ceil(it.baseTotal * costMult);
        
        let qty = it.qty || 1;
        let area = it.area || 0;
        let cost = 0;
        let unitCostDisplay = '';
        let uLabel = (it.category === 'custom' || it.category === 'slope_profile') ? (it.unit || 'шт.') : 'шт.';
        
        // 1. Вычисляем итоговую стоимость строки с наценкой
        let rawCost = baseWithMarkup * markupFactor;
        cost = Math.round(rawCost);

        // 2. Из итоговой стоимости строго выводим цену за единицу
        if (area > 0 && qty === 1 && it.category !== 'hardware' && it.category !== 'custom' && it.category !== 'slope_profile') {
            // Для окон/сеток — цена за м²
            let unitCost = Math.round(cost / area);
            cost = Math.round(unitCost * area); // пересчёт обратно, чтобы cost == unitCost × area
            unitCostDisplay = `${unitCost.toLocaleString()} ₽/м²`;
        } else if (qty > 1) {
            // Для штучных товаров с qty > 1
            let unitCost = Math.round(cost / qty);
            cost = unitCost * qty; // пересчёт обратно, чтобы cost == unitCost × qty
            unitCostDisplay = unitCost > 0 ? `${unitCost.toLocaleString()} ₽/${uLabel}` : '—';
        } else if (cost > 0) {
            // Одна штука — цена за ед. = стоимость строки
            unitCostDisplay = `${cost.toLocaleString()} ₽/${uLabel}`;
        } else {
            unitCostDisplay = '—';
        }

        sumWithManualMarkup += cost;
        totalArea += area * qty;

        let opts = it.optionsDesc.length > 0 ? `<div class="mt-1 space-y-[2px]">${it.optionsDesc.map(o => `<div class="text-[10px] text-slate-500">• ${o}</div>`).join('')}</div>` : '';
        let canvasId = `sketch-${it.id}`;
        
        let itemTotalArea = area * qty;
        let dimLine = '';
        if (it.category === 'hardware') {
            dimLine = '';
        } else if (it.category === 'custom' || it.category === 'slope_profile' || it.category === 'roller' || it.category === 'blinds') {
            if (it.w > 0 && it.h > 0) dimLine = `Размеры: ${it.w} × ${it.h} мм`;
            if (it.category === 'roller' || it.category === 'blinds') dimLine += ` (S = ${itemTotalArea.toFixed(2)} м²)`;
        } else if (it.category === 'shower') {
            dimLine = getShowerDimensionLine(it, true);
        } else {
            dimLine = `${it.w} × ${it.h} мм (S = ${itemTotalArea.toFixed(2)} м²)`;
        }
        
        let unitLabel = (it.category === 'custom' || it.category === 'slope_profile') ? (it.unit || 'шт.') : 'шт.';
        canvasId = `sketch-${it.id}`;
        let sketchHtml = it.customSvg || generateSvgSketch(it);
        
        tbody.innerHTML += `<tr class="border-b border-slate-200 hover:bg-slate-50"><td class="p-3 text-slate-500 align-middle">${idx + 1}</td><td class="p-3 align-middle text-center">${sketchHtml}</td><td class="p-3 align-middle"><div class="font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-primary rounded px-1" contenteditable="true">${it.type}</div><div class="text-xs text-slate-500 font-medium opacity-80 mt-0.5 outline-none focus:ring-2 focus:ring-brand-primary rounded px-1" contenteditable="true">${dimLine}</div>${opts}</td><td class="p-3 align-middle text-center font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-primary rounded px-1" contenteditable="true">${qty} ${unitLabel}</td><td class="p-3 align-middle text-right text-xs text-slate-500 whitespace-nowrap outline-none focus:ring-2 focus:ring-brand-primary rounded px-1" contenteditable="true">${unitCostDisplay}</td><td class="p-3 align-middle text-right font-bold text-slate-800 whitespace-nowrap outline-none focus:ring-2 focus:ring-brand-primary rounded px-1" contenteditable="true">${cost.toLocaleString()} ₽</td></tr>`;
    });
    
    // (sketches are now SVG)
    
    
    
    let sList = document.getElementById('kp-services-list');
    sList.innerHTML = `<div class="flex justify-between text-sm mb-2 pb-2 border-b border-slate-100"><span class="text-slate-500">Общая площадь изделий:</span><span class="font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-primary rounded px-1" contenteditable="true">${totalArea.toFixed(2)} м²</span></div>`;
    sList.innerHTML += `<div class="flex justify-between text-base mb-1"><span class="text-slate-700 font-bold uppercase tracking-wide">Стоимость изделий:</span><span class="font-black text-slate-900">${sumWithManualMarkup.toLocaleString()} ₽</span></div>`;
    
    let roundedDiscount = Math.round(totals.totalDiscount);
    if (roundedDiscount > 0) sList.innerHTML += `<div class="flex justify-between text-sm mb-2 text-emerald-700"><span class="font-bold uppercase tracking-wider">Скидка на изделия:</span><span class="font-bold">-${roundedDiscount.toLocaleString()} ₽</span></div>`;
    
    let discountedSumItems = sumWithManualMarkup - roundedDiscount;
    if (roundedDiscount > 0) sList.innerHTML += `<div class="flex justify-between text-sm mb-3 pb-3 border-b border-b-slate-300"><span class="text-slate-600 font-medium tracking-wide">Итого за изделия:</span><span class="font-bold text-slate-800"><span class="line-through text-slate-400 mr-2 text-xs">${sumWithManualMarkup.toLocaleString()} ₽</span>${discountedSumItems.toLocaleString()} ₽</span></div>`;
    else sList.innerHTML += `<div class="w-full mb-3 pb-3 border-b border-slate-300"></div>`;
    
    if (totals.servSum > 0) {
        SERVICES.forEach(srv => {
            if (srv.amount > 0) {
                sList.innerHTML += `<div class="flex justify-between text-sm mb-1"><span class="text-slate-600">${srv.name}:</span><span class="font-medium text-slate-800">${srv.amount.toLocaleString()} ₽</span></div>`;
            }
        });
    }

    document.getElementById('kp-total-sum').innerText = totals.finalTotal.toLocaleString() + ' ₽';
    
    let selectedCompany = document.getElementById('select-company').value;
    let comp = COMPANIES[selectedCompany];
    
    let paymentBlock = document.getElementById('kp-payment-block');
    if (paymentBlock) {
        paymentBlock.style.display = (selectedCompany === 'alex') ? 'none' : 'block';
    }

    if (selectedCompany === 'alex') {
        let ndsAmount = totals.finalTotal * 22 / 122;
        sList.innerHTML += `<div class="flex justify-between text-xs mt-3 text-slate-500 font-medium"><span>В том числе НДС (22%):</span><span>${Math.ceil(ndsAmount).toLocaleString()} ₽</span></div>`;
    }
    
    // --- Заполняем блок реквизитов для оплаты ---
    let bankReqContainer = document.getElementById('kp-bank-requisites');
    if (bankReqContainer && comp) {
        let rows = [
            ['Получатель:', comp.name_full],
            ['ИНН:', comp.inn || '—'],
            ['Расч. счёт:', comp.account || '—'],
            ['Банк:', comp.bank_name || '—'],
            ['БИК:', comp.bik || '—'],
            ['Корр. счёт:', comp.corr_account || '—']
        ];
        if (comp.inn_bank) rows.push(['ИНН банка:', comp.inn_bank]);
        if (comp.kpp_bank) rows.push(['КПП банка:', comp.kpp_bank]);
        if (comp.kpp) rows.push(['КПП:', comp.kpp]);
        if (comp.ogrnip) rows.push(['ОГРНИП:', comp.ogrnip]);
        if (comp.ogrn) rows.push(['ОГРН:', comp.ogrn]);
        
        bankReqContainer.innerHTML = rows.map(([label, val]) => 
            `<span class="text-slate-500 font-medium whitespace-nowrap">${label}</span><span class="font-bold text-slate-800 break-all">${val}</span>`
        ).join('');
    }
    
    document.getElementById('calculator-screen').style.display = 'none';
    document.getElementById('proposal-screen').style.display = 'block';
    window.scrollTo(0, 0);
}


function hideProposal() {
    document.getElementById('calculator-screen').style.display = 'block';
    document.getElementById('proposal-screen').style.display = 'none';
}










// --- SKETCH SVG GENERATOR ---
function generateSvgSketch(item) {
    if (!item) return '';

    const VB_SIZE = 500;
    
    let typeStr = (item.type || '').toLowerCase();
    let isIcon = false;
    let iconPath = '';
    let iconColor = '#475569';
    let w = parseFloat(item.w) || 0;
    let h = parseFloat(item.h) || 0;
    if (item.category === 'sill') { w = parseFloat(item.h) || 0; h = parseFloat(item.w) || 0; }

    if (item.category === 'custom' || item.category === 'slope_profile' || item.category === 'services') {
        if (typeStr.includes('сварка') || typeStr.includes('свароч') || typeStr.includes('усилен')) {
            isIcon = true; iconColor = '#f59e0b';
            iconPath = `<path d="M2 22 L2 2 L6 2 L6 22 Z" fill="#94a3b8"/><path d="M6 18 L16 18 L20 10 L20 6 L16 6 L6 6" stroke="${iconColor}" stroke-width="2" fill="none"/><path d="M12 6 L16 18" stroke="${iconColor}" stroke-width="1" stroke-dasharray="2,2"/><circle cx="18" cy="8" r="2" fill="#ef4444"/>`;
        } else if (typeStr.includes('вынос') || typeStr.includes('балкон')) {
            isIcon = true; iconColor = '#3b82f6';
            iconPath = `<path d="M4 22 L4 10 L12 4 L12 10 L10 10 L10 22 Z" stroke="${iconColor}" stroke-width="2" fill="none"/>`;
        } else if (typeStr.includes('крыша') || typeStr.includes('кровл') || typeStr.includes('козырек')) {
            isIcon = true; iconColor = '#ef4444';
            iconPath = `<path d="M2 12L12 3l10 9M5 12v8h14v-8" stroke="${iconColor}" stroke-width="2" fill="none"/>`;
        } else if (typeStr.includes('фурнитур') || typeStr.includes('ручк') || typeStr.includes('замок') || typeStr.includes('петл')) {
            isIcon = true; iconColor = '#8b5cf6';
            iconPath = `<rect x="6" y="10" width="12" height="10" rx="2" stroke="${iconColor}" stroke-width="2" fill="none"/><path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="${iconColor}" stroke-width="2" fill="none"/><circle cx="12" cy="15" r="1.5" fill="${iconColor}"/>`;
        } else if (typeStr.includes('резин') || typeStr.includes('уплотн')) {
            isIcon = true; iconColor = '#10b981';
            iconPath = `<circle cx="12" cy="12" r="8" stroke="${iconColor}" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="${iconColor}"/>`;
        } 
    }

    if (isIcon) {
        return `<svg viewBox="0 0 24 24" style="width: 100%; max-width: 80px; height: auto; display: block; margin: 0 auto;">${iconPath}</svg>`;
    }

    let innerSvg = '';
    let drawW = w || 1000;
    let drawH = h || 1000;
    let ratio = drawW / drawH;
    
    let maxDrawW = 320; 
    let maxDrawH = 320;
    if (item.category === 'roller' || typeStr.includes('ворот')) {
        maxDrawW = 400; 
        maxDrawH = 400;
    }

    let svgW = maxDrawW;
    let svgH = maxDrawH;
    
    if (ratio > 1) {
        svgH = maxDrawW / ratio;
    } else {
        svgW = maxDrawH * ratio;
    }
    
    let minW = 80;
    let minH = 80;
    if (item.category === 'net') {
        minW = 160; 
        minH = 160;
    }
    
    if (svgW < minW) svgW = minW;
    if (svgH < minH) svgH = minH;

    let x = (VB_SIZE - svgW) / 2 - 40; 
    let y = (VB_SIZE - svgH) / 2 + 40; 

    let getFrameColor = () => {
        let allText = (typeStr + ' ' + (item.optionsDesc||[]).join(' ')).toLowerCase();
        if (allText.includes('антрацит') || allText.includes('серый') || allText.includes('7016')) return '#334155';
        if (allText.includes('коричн') || allText.includes('8017') || allText.includes('8014') || allText.includes('шоколад')) return '#78350f';
        if (allText.includes('черн') || allText.includes('9005')) return '#0f172a';
        if (allText.includes('золот') || allText.includes('дуб') || allText.includes('орех')) return '#b45309';
        if (allText.includes('бел') || allText.includes('9016')) return '#e2e8f0'; 
        return '#78350f'; 
    };

    let swFrame = 8;
    let swInner = 4;

    if (item.category === 'glass') {
        innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#f0f9ff" stroke="#1e293b" stroke-width="${swFrame}"/>`;
        innerSvg += `<rect x="${x+12}" y="${y+12}" width="${svgW-24}" height="${svgH-24}" fill="none" stroke="#475569" stroke-width="${swInner}"/>`;
        innerSvg += `<path d="M${x + svgW*0.2} ${y + svgH - 20} L${x + svgW - 20} ${y + svgH*0.2}" stroke="#ffffff" stroke-width="${svgW/5}" stroke-opacity="0.6" fill="none"/>`;
        
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
            let innerX = x + 16, innerY = y + 16, innerW = svgW - 32, innerH = svgH - 32;
            for (let i = 1; i < cols; i++) {
                let lx = innerX + (innerW / cols) * i;
                innerSvg += `<line x1="${lx}" y1="${innerY}" x2="${lx}" y2="${innerY+innerH}" stroke="${layoutColor}" stroke-width="${swInner+2}"/>`;
            }
            for (let j = 1; j < rows; j++) {
                let ly = innerY + (innerH / rows) * j;
                innerSvg += `<line x1="${innerX}" y1="${ly}" x2="${innerX+innerW}" y2="${ly}" stroke="${layoutColor}" stroke-width="${swInner+2}"/>`;
            }
        }
    } else if (item.category === 'frameless') {
        innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#f8fafc" stroke="#1e293b" stroke-width="${swFrame}"/>`;
        let match = (item.shape||'').match(/Панелей: (\d+)/);
        let panels = match ? parseInt(match[1]) : 1;
        let pWidth = svgW / panels;
        
        if (panels > 1) {
            let doorPanel = null;
            let doorDirStr = 'right';
            if (item.optionsDesc) {
                let dDesc = item.optionsDesc.find(d => d.includes('Дверь: Панель'));
                if (dDesc) {
                    let m = dDesc.match(/Панель (\d+)/);
                    if (m) doorPanel = parseInt(m[1]);
                    if (dDesc.includes('Влево')) doorDirStr = 'left';
                }
            }

            if (doorPanel) {
                let doorIdx = doorPanel - 1;
                let dLeft = x + doorIdx * pWidth;
                innerSvg += `<rect x="${dLeft}" y="${y}" width="${pWidth}" height="${svgH}" fill="#e2e8f0" />`;
                let cx = dLeft + pWidth/2;
                let cy = y + svgH/2;
                innerSvg += `<text x="${cx}" y="${cy+20}" font-family="Arial" font-size="64" font-weight="bold" fill="#0f172a" text-anchor="middle">${doorDirStr === 'right' ? '<' : '>'}</text>`;
            }
            for (let i = 1; i < panels; i++) {
                let lx = x + i * pWidth;
                innerSvg += `<line x1="${lx}" y1="${y}" x2="${lx}" y2="${y+svgH}" stroke="#1e293b" stroke-width="${swInner}"/>`;
            }
        }
    } else if (item.category === 'net') {
        let frameColor = getFrameColor();
        let isPleated = typeStr.includes('плисс');
        
        if (isPleated) {
            innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#fff9f0" stroke="${frameColor}" stroke-width="12"/>`;
            
            let dirText = '→'; 
            if (item.optionsDesc) {
                let dirEntry = item.optionsDesc.find(d => d && d.includes('Створка:'));
                if (dirEntry) {
                    if (dirEntry.includes('Влево')) dirText = '←';
                    else if (dirEntry.includes('центр')) dirText = '←→';
                }
            }
            
            let handleX = x + svgW / 2; 
            if (dirText === '←→') {
                let plStep = 16;
                for (let i = x + plStep; i < x + svgW*0.3; i += plStep) {
                    innerSvg += `<line x1="${i}" y1="${y+6}" x2="${i}" y2="${y+svgH-6}" stroke="#64748b" stroke-width="3"/>`;
                }
                for (let i = x + svgW - plStep; i > x + svgW*0.7; i -= plStep) {
                    innerSvg += `<line x1="${i}" y1="${y+6}" x2="${i}" y2="${y+svgH-6}" stroke="#64748b" stroke-width="3"/>`;
                }
                innerSvg += `<rect x="${x+svgW*0.3}" y="${y+6}" width="16" height="${svgH-12}" fill="${frameColor}" rx="4" />`;
                innerSvg += `<rect x="${x+svgW*0.7-16}" y="${y+6}" width="16" height="${svgH-12}" fill="${frameColor}" rx="4" />`;
                innerSvg += `<text x="${x+svgW/2}" y="${y+svgH/2+20}" font-family="Arial" font-size="64" font-weight="bold" fill="#1d4ed8" text-anchor="middle">←→</text>`;
            } else {
                let plStep = 16;
                if (dirText === '→') {
                    for (let i = x + plStep; i < handleX; i += plStep) {
                        innerSvg += `<line x1="${i}" y1="${y+6}" x2="${i}" y2="${y+svgH-6}" stroke="#64748b" stroke-width="3"/>`;
                    }
                    innerSvg += `<rect x="${handleX-8}" y="${y+6}" width="20" height="${svgH-12}" fill="${frameColor}" rx="5" />`;
                    innerSvg += `<text x="${handleX + 45}" y="${y+svgH/2+20}" font-family="Arial" font-size="70" font-weight="bold" fill="#1d4ed8" text-anchor="middle">→</text>`;
                } else {
                    for (let i = x + svgW - plStep; i > handleX; i -= plStep) {
                        innerSvg += `<line x1="${i}" y1="${y+6}" x2="${i}" y2="${y+svgH-6}" stroke="#64748b" stroke-width="3"/>`;
                    }
                    innerSvg += `<rect x="${handleX-12}" y="${y+6}" width="20" height="${svgH-12}" fill="${frameColor}" rx="5" />`;
                    innerSvg += `<text x="${handleX - 45}" y="${y+svgH/2+20}" font-family="Arial" font-size="70" font-weight="bold" fill="#1d4ed8" text-anchor="middle">←</text>`;
                }
            }
        } else {
            innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#ffffff" stroke="${frameColor}" stroke-width="12"/>`;
            let step = 18;
            for (let i = x + step; i < x + svgW; i += step) { innerSvg += `<line x1="${i}" y1="${y}" x2="${i}" y2="${y+svgH}" stroke="#64748b" stroke-width="3"/>`; }
            for (let j = y + step; j < y + svgH; j += step) { innerSvg += `<line x1="${x}" y1="${j}" x2="${x+svgW}" y2="${j}" stroke="#64748b" stroke-width="3"/>`; }
            if (h >= 1000) {
                innerSvg += `<line x1="${x}" y1="${y+svgH/2}" x2="${x+svgW}" y2="${y+svgH/2}" stroke="${frameColor}" stroke-width="10"/>`;
            }
        }
    } else if (item.category === 'sill') {
        innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#fef3c7" stroke="#1e293b" stroke-width="6"/>`;
        innerSvg += `<rect x="${x}" y="${y+svgH-26}" width="${svgW}" height="26" fill="#fde68a" stroke="#1e293b" stroke-width="6"/>`; 
        innerSvg += `<line x1="${x}" y1="${y+svgH-26}" x2="${x+svgW}" y2="${y+svgH-26}" stroke="#1e293b" stroke-width="4"/>`;
        innerSvg += `<path d="M${x+20} ${y+svgH-13} L${x+svgW-20} ${y+svgH-13}" stroke="#d97706" stroke-width="3" stroke-dasharray="8,8" fill="none"/>`;
    } else if (item.category === 'roller' || typeStr.includes('ворот')) {
        let isGate = typeStr.includes('ворот');
        let rColor = getFrameColor();
        innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#f8fafc" stroke="${rColor}" stroke-width="8"/>`;
            if (isGate) {
                let panelDir = item.gatePanelDir || 'horizontal';
                if (panelDir === 'vertical') {
                    let panelW = 50;
                    for(let i=x+panelW; i<x+svgW; i+=panelW) {
                        innerSvg += `<line x1="${i}" y1="${y}" x2="${i}" y2="${y+svgH}" stroke="${rColor}" stroke-width="6"/>`;
                        innerSvg += `<rect x="${i-panelW+8}" y="${y+16}" width="${panelW-16}" height="${svgH-32}" fill="#f1f5f9" stroke="${rColor}" stroke-width="2"/>`;
                    }
                } else {
                    let panelH = 50;
                    for(let i=y+panelH; i<y+svgH; i+=panelH) {
                        innerSvg += `<line x1="${x}" y1="${i}" x2="${x+svgW}" y2="${i}" stroke="${rColor}" stroke-width="6"/>`;
                        innerSvg += `<rect x="${x+16}" y="${i-panelH+8}" width="${svgW-32}" height="${panelH-16}" fill="#f1f5f9" stroke="${rColor}" stroke-width="2"/>`;
                    }
                }
        } else {
            for(let i=16; i<svgH; i+=16) {
                innerSvg += `<line x1="${x}" y1="${y+i}" x2="${x+svgW}" y2="${y+i}" stroke="${rColor}" stroke-width="3"/>`;
            }
            innerSvg += `<rect x="${x-8}" y="${y-12}" width="${svgW+16}" height="24" fill="${rColor}" stroke="${rColor}" stroke-width="4" rx="6"/>`; 
        }
    } else if (item.category === 'shower') {
        let swColor = '#0369a1';
        let glColor = '#e0f2fe';
        
        let panels = item.showerPanels || [];
        let totalW = 0;
        
        if (panels.length === 0) {
            panels = [{ w: svgW, type: 'fixed' }]; 
            totalW = svgW;
        } else {
            totalW = panels.reduce((sum, p) => sum + p.w, 0);
        }
        
        let currX = x;
        for (let idx = 0; idx < panels.length; idx++) {
            let p = panels[idx];
            let pw = (p.w / totalW) * svgW;
            if (pw < 10) pw = 10; 
            
            innerSvg += `<rect x="${currX}" y="${y}" width="${pw}" height="${svgH}" fill="${glColor}" stroke="${swColor}" stroke-width="6" fill-opacity="0.6"/>`;
            
            // Пишем ширину КОНКРЕТНОЙ ПАНЕЛИ СНИЗУ эскиза
            if (p.w > 0) {
                // Выводим все размеры строго в ряд
                let subY = y + svgH + 20;
                let fontSize = pw < 40 ? 24 : 32; // Уменьшаем шрифт, если панель узкая
                
                // Рисуем пунктирную выноску
                innerSvg += `<line x1="${currX + pw/2}" y1="${y + svgH + 2}" x2="${currX + pw/2}" y2="${subY - 15}" stroke="#0369a1" stroke-width="2" stroke-dasharray="4,4" opacity="0.5"/>`;
                
                innerSvg += `<text x="${currX + pw/2}" y="${subY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="normal" fill="#0369a1" text-anchor="middle">${p.w}</text>`;
            }

            if (p.type === 'door' || p.type === 'sliding') {
                innerSvg += `<rect x="${currX+3}" y="${y+3}" width="${pw-6}" height="${svgH-6}" fill="#bae6fd" opacity="0.5"/>`;
                let cx = currX + pw/2;
                let cy = y + svgH/2;
                
                if (p.type === 'sliding') {
                    innerSvg += `<text x="${cx}" y="${cy+15}" font-family="Arial" font-size="48" font-weight="bold" fill="#0c4a6e" text-anchor="middle">↔</text>`;
                } else {
                    let isRight = item.openingDirection && item.openingDirection.toLowerCase().includes('вправо');
                    innerSvg += `<text x="${cx}" y="${cy+15}" font-family="Arial" font-size="56" font-weight="bold" fill="#0c4a6e" text-anchor="middle">${isRight ? '<' : '>'}</text>`;
                }
            }
            
            if (currX + pw < x + svgW - 5) {
                innerSvg += `<line x1="${currX+pw}" y1="${y}" x2="${currX+pw}" y2="${y+svgH}" stroke="${swColor}" stroke-width="6"/>`;
            }
            currX += pw;
        }
        
        // Верхняя штанга
        innerSvg += `<line x1="${x-10}" y1="${y}" x2="${x+svgW+10}" y2="${y}" stroke="#334155" stroke-width="12" stroke-linecap="round"/>`;
    } else if (item.category === 'hardware') {
        innerSvg += `<text x="${x+svgW/2}" y="${y+svgH/2+70}" font-family="Arial" font-size="200" fill="#94a3b8" text-anchor="middle">🔧</text>`;
    } else if (item.category === 'glasses') {
        innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#e0f2fe" stroke="#0284c7" stroke-width="8"/>`;
        innerSvg += `<rect x="${x+16}" y="${y+16}" width="${svgW-32}" height="${svgH-32}" fill="none" stroke="#0284c7" stroke-width="4"/>`;
        innerSvg += `<path d="M${x + svgW*0.1} ${y + svgH - 20} L${x + svgW - 20} ${y + svgH*0.1}" stroke="#ffffff" stroke-width="${svgW/3}" stroke-opacity="0.8" fill="none"/>`;
        innerSvg += `<text x="${x+svgW/2}" y="${y+svgH/2+15}" font-family="Arial" font-size="42" font-weight="bold" fill="#0f172a" text-anchor="middle">${item.thickness}мм</text>`;
    } else if (item.category === 'sandwich') {
        let getColorHex = (c) => {
            if (c === 'Белый') return '#ffffff';
            if (c === 'Антрацит-серый') return '#475569';
            if (c === 'Золотой дуб') return '#b45309';
            if (c === 'Тёмный дуб') return '#78350f';
            return '#f1f5f9';
        };
        let cOut = getColorHex(item.colorOut);
        let cIn = getColorHex(item.colorIn);
        
        innerSvg += `<path d="M${x} ${y} L${x+svgW} ${y} L${x} ${y+svgH} Z" fill="${cOut}"/>`;
        innerSvg += `<path d="M${x+svgW} ${y} L${x+svgW} ${y+svgH} L${x} ${y+svgH} Z" fill="${cIn}"/>`;
        innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="none" stroke="#1e293b" stroke-width="8"/>`;
        innerSvg += `<line x1="${x}" y1="${y+svgH}" x2="${x+svgW}" y2="${y}" stroke="#94a3b8" stroke-width="2"/>`;
    } else {
        innerSvg += `<rect x="${x}" y="${y}" width="${svgW}" height="${svgH}" fill="#f8fafc" stroke="#94a3b8" stroke-width="6" stroke-dasharray="10,10" rx="8"/>`;
        innerSvg += `<text x="${x+svgW/2}" y="${y+svgH/2-10}" font-family="Arial" font-size="56" fill="#cbd5e1" text-anchor="middle">✦</text>`;
        innerSvg += `<text x="${x+svgW/2}" y="${y+svgH/2+30}" font-family="Arial" font-size="28" font-weight="bold" fill="#64748b" text-anchor="middle">ДОП. ОПЦИЯ</text>`;
    }

    let bottomLabel = w > 0 ? (w + ' мм') : '';
    let rightLabel = h > 0 ? (h + ' мм') : '';
    
    // Пишем общую ширину сверху для ВСЕХ изделий (включая душевые)
    if (w > 0) {
        let fSize = 56;
        innerSvg += `<text x="${x + svgW/2}" y="${y - 35}" font-family="Arial, sans-serif" font-size="${fSize}" fill="#334155" text-anchor="middle">${bottomLabel}</text>`;
        innerSvg += `<path d="M${x} ${y-10} L${x} ${y-20} L${x+svgW} ${y-20} L${x+svgW} ${y-10}" stroke="#94a3b8" stroke-width="3" fill="none"/>`;
    }
    
    // Пишем высоту справа для ВСЕХ изделий
    if (h > 0) {
        let fSize = 56;
        let textX = x + svgW + 90; 
        let textY = y + svgH/2;
        innerSvg += `<text x="${textX}" y="${textY}" font-family="Arial, sans-serif" font-size="${fSize}" fill="#334155" text-anchor="middle" transform="rotate(-90, ${textX}, ${textY})">${rightLabel}</text>`;
        innerSvg += `<path d="M${x+svgW+10} ${y} L${x+svgW+20} ${y} L${x+svgW+20} ${y+svgH} L${x+svgW+10} ${y+svgH}" stroke="#94a3b8" stroke-width="3" fill="none"/>`;
    }

    
    return `<svg viewBox="0 0 500 500" style="width: 100%; height: 100%; max-height: 280px; min-height: 100px; object-fit: contain; display: block; margin: 0 auto;">${innerSvg.replace(/[\r\n]/g, '')}</svg>`;

}


// --- SETTINGS AND PRICING LOGIC ---
function toggleSettingsModal() { document.getElementById('settings-modal').classList.toggle('hidden'); }
function updateSettingsUI() {
    let srcText = "Встроенные (по-умолчанию)";
    if (currentPricesSource === 'excel') srcText = "Из файла Excel";
    if (currentPricesSource === 'google') srcText = "Google Таблицы";
    document.getElementById('current-prices-source').innerText = srcText;
    document.getElementById('current-prices-date').innerText = currentPricesDate ? `Обновлено: ${currentPricesDate}` : '';
}
function setStatus(id, msg, isError = false) {
    const el = document.getElementById(id); el.innerHTML = msg;
    el.className = `mt-2 text-xs font-medium ${isError ? 'text-red-500' : 'text-emerald-600'}`;
    el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 5000);
}
const PRICES_VERSION = 'v2_dealer';
function loadPricesFromStorage() {
    try {
        let username = localStorage.getItem('oko_username') || 'admin';
        const saved = localStorage.getItem('oko_prices_data_' + username);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.version !== PRICES_VERSION) { localStorage.removeItem('oko_prices_data_' + username); return; }
            applyPrices(data.glass, data.shapes, data.layouts, data.nets, data.salinox, data.options);
            currentPricesSource = data.source; currentPricesDate = data.date; updateSettingsUI();
        }
    } catch (e) { console.error("Error loading prices", e); }
}
function savePricesToStorage() {
    const data = { version: PRICES_VERSION, glass: GLASS_TYPES, shapes: SHAPES, layouts: LAYOUTS, nets: NET_TYPES, salinox: SALINOX_PRICES, options: OPTIONS, source: currentPricesSource, date: new Date().toLocaleString('ru-RU') };
    let username = localStorage.getItem('oko_username') || 'admin';
    localStorage.setItem('oko_prices_data_' + username, JSON.stringify(data));
    currentPricesDate = data.date; updateSettingsUI();
    
    if (typeof Oko_User_Prices !== 'undefined') {
        Oko_User_Prices.glasses = JSON.parse(JSON.stringify(GLASS_TYPES));
        Oko_User_Prices.shapes = JSON.parse(JSON.stringify(SHAPES));
        Oko_User_Prices.layouts = JSON.parse(JSON.stringify(LAYOUTS));
        Oko_User_Prices.nets = JSON.parse(JSON.stringify(NET_TYPES));
        Oko_User_Prices.salinox = JSON.parse(JSON.stringify(SALINOX_PRICES));
        Oko_User_Prices.options = JSON.parse(JSON.stringify(OPTIONS));
        let username = localStorage.getItem('oko_username') || 'admin';
        localStorage.setItem('oko_user_prices_' + username, JSON.stringify(Oko_User_Prices));
    }
}
function applyPrices(glassData, shapesData, layoutsData, netsData, salinoxData, optionsData) {
    if (glassData) GLASS_TYPES = glassData; if (shapesData) SHAPES = shapesData;
    if (layoutsData) LAYOUTS = layoutsData; if (netsData) NET_TYPES = netsData;
    if (salinoxData) SALINOX_PRICES = salinoxData; if (optionsData) OPTIONS = optionsData;
    const glassShape = document.getElementById('glass-shape');
    if (glassShape) { glassShape.innerHTML = ''; SHAPES.forEach((s, i) => glassShape.innerHTML += `<option value="${i}">${s.name}</option>`); }
    updateDropdownPrices(); renderCart();
}

// --- Google Sheets Sync ---
async function syncGoogleSheets() {
    let urlInp = document.getElementById('g-sheets-url').value.trim();
    if (!urlInp) return setStatus('gsheets-status', 'Введите ссылку.', true);
    if (urlInp.includes('/pub') || urlInp.includes('output=csv')) {
        const match = urlInp.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) { urlInp = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=xlsx`; document.getElementById('g-sheets-url').value = urlInp; }
    }
    localStorage.setItem('oko_gsheets_url', urlInp);
    const btnIcon = document.getElementById('icon-sync-gsheets'); btnIcon.classList.add('animate-spin');
    try {
        const response = await fetch(urlInp); if (!response.ok) throw new Error("Network response was not ok");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        if (parseWorkbook(workbook)) { currentPricesSource = 'google'; savePricesToStorage(); setStatus('gsheets-status', 'Цены успешно обновлены из Google!'); updateDropdownPrices(); handleSettingsChange(); }
        else { setStatus('gsheets-status', 'Ошибка формата таблицы. Проверьте шаблон.', true); }
    } catch (e) { console.error(e); setStatus('gsheets-status', 'Ошибка загрузки. Проверьте ссылку и доступ.', true); }
    finally { btnIcon.classList.remove('animate-spin'); }
}

// --- Excel Upload ---
function handleExcelUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            if (parseWorkbook(workbook)) { currentPricesSource = 'excel'; savePricesToStorage(); setStatus('excel-status', `Успешно загружено из ${file.name}`); updateDropdownPrices(); handleSettingsChange(); }
            else { setStatus('excel-status', 'Неверный формат шаблона.', true); }
        } catch (error) { console.error(error); setStatus('excel-status', 'Произошла ошибка при чтении файла.', true); }
    };
    reader.readAsArrayBuffer(file); event.target.value = '';
}

// --- Parser Logic ---
function parseWorkbook(workbook) {
    const parseNum = v => parseFloat(String(v).replace(',', '.').replace(/[^0-9.-]+/g, ""));
    let hasValidData = false;
    let newGlass = [], newLayouts = [];
    let newShapes = JSON.parse(JSON.stringify(SHAPES));
    let newNets = JSON.parse(JSON.stringify(NET_TYPES));
    let newSalinox = { 'F1_F2': [], 'F4': [], 'F5': [], 'F6': [], 'FB_cr': [] };
    let newOptions = JSON.parse(JSON.stringify(OPTIONS));
    workbook.SheetNames.forEach(sheetName => {
        let sheet = workbook.Sheets[sheetName];
        let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rows || rows.length < 2) return;
        let sn = sheetName.toLowerCase();
        if (sn.includes('стеклопакет')) {
            for (let i = 1; i < rows.length; i++) { if (!rows[i][0]) continue; let val = parseNum(rows[i][1]); if (!isNaN(val)) { newGlass.push({ name: String(rows[i][0]).trim(), price: val }); hasValidData = true; } }
        } else if (sn.includes('раскладк') || sn.includes('шпрос')) {
            for (let i = 1; i < rows.length; i++) { if (!rows[i][0]) continue; let val = parseNum(rows[i][1]); if (!isNaN(val)) { newLayouts.push({ name: String(rows[i][0]).trim(), price: val }); hasValidData = true; } }
        } else if (sn.includes('безрам') || sn.includes('salinox')) {
            for (let i = 1; i < rows.length; i++) { if (!rows[i][0] || !rows[i][1]) continue; let sys = String(rows[i][0]).trim(); let maxW = parseNum(rows[i][1]); let val = parseNum(rows[i][2]); if (!isNaN(maxW) && !isNaN(val) && newSalinox[sys]) { newSalinox[sys].push({ max: maxW, p: val }); hasValidData = true; } }
        } else if (sn.includes('сетк')) {
            for (let i = 1; i < rows.length; i++) { if (!rows[i][0]) continue; let id = String(rows[i][0]).trim(); let name = String(rows[i][1]).trim(); let p1 = parseNum(rows[i][2] || "0"); let p2 = parseNum(rows[i][3] || "0"); let existing = newNets.find(n => n.id === id); if (existing) { existing.name = name; if (!isNaN(p1)) existing.price_min = p1; if (!isNaN(p2)) existing.price_sqm = p2; hasValidData = true; } }
        } else if (sn.includes('опци') || sn.includes('услуг')) {
            for (let i = 1; i < rows.length; i++) { if (!rows[i][0]) continue; let key = String(rows[i][0]).trim(); let val = parseNum(rows[i][1]); if (!isNaN(val) && newOptions[key] !== undefined) { newOptions[key] = val; hasValidData = true; } }
        } else if (sn.includes('форм')) {
            for (let i = 1; i < rows.length; i++) { if (!rows[i][0]) continue; let name = String(rows[i][0]).trim(); let val = parseNum(rows[i][1]); if (!isNaN(val)) { let existing = newShapes.find(s => s.name === name); if (existing) existing.multiplier = val; else newShapes.push({ name: name, multiplier: val }); hasValidData = true; } }
        }
    });
    if (!hasValidData) return false;
    if (newGlass.length > 0) GLASS_TYPES = newGlass;
    if (newLayouts.length > 0) LAYOUTS = newLayouts;
    SHAPES = newShapes; NET_TYPES = newNets; OPTIONS = newOptions;
    for (let sys in newSalinox) { if (newSalinox[sys].length > 0) { newSalinox[sys].sort((a, b) => a.max - b.max); SALINOX_PRICES[sys] = newSalinox[sys]; } }
    return true;
}

// --- Template Generator ---
function downloadExcelTemplate() {
    try {
        const wb = XLSX.utils.book_new();
        const addSheet = (name, rows, colWidths) => { let ws = XLSX.utils.aoa_to_sheet(rows); if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name); };
        let ws1 = [["Наименование стеклопакета", "Цена за м² (₽)"]]; GLASS_TYPES.forEach(g => ws1.push([g.name, g.price])); addSheet("Стеклопакеты", ws1, [40, 20]);
        let ws2 = [["Тип раскладки (Шпросы)", "Цена за пог.м. (₽)"]]; LAYOUTS.forEach(g => ws2.push([g.name, g.price])); addSheet("Раскладка_Шпросы", ws2, [40, 20]);
        let ws3 = [["Сложность формы", "Коэффициент наценки (0.5 = +50%)"]]; SHAPES.forEach(g => ws3.push([g.name, g.multiplier])); addSheet("Формы_окон", ws3, [30, 30]);
        let ws4 = [["Идентификатор (не менять!)", "Наименование", "Мин. цена / Базовая (₽)", "Цена за м² / Большая (₽)"]]; NET_TYPES.forEach(n => ws4.push([n.id, n.name, n.price_min, n.price_sqm])); addSheet("Москитные_сетки", ws4, [25, 45, 25, 25]);
        let ws5 = [["Система", "Макс. Ширина Панели (см)", "Базовая Цена (₽)"]]; for (let sys in SALINOX_PRICES) { SALINOX_PRICES[sys].forEach(p => ws5.push([sys, p.max, p.p])); } addSheet("Безрамное_Salinox", ws5, [20, 30, 20]);
        let ws6 = [["Системный ключ (не менять!)", "Значение (₽)"]]; for (let k in OPTIONS) { ws6.push([k, OPTIONS[k]]); } addSheet("Опции_и_Услуги", ws6, [30, 20]);
        XLSX.writeFile(wb, 'oko_prices.xlsx');
    } catch (e) {
        console.error('Ошибка при скачивании шаблона Excel', e);
        alert('Техническая ошибка: ' + e.message + '\nСкриншот этого окна поможет разработчику!');
    }
}

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



// ==========================================
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
