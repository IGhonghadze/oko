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
            
            // Инициализация интерфейса прямо из ответа сервера (без вторичных запросов)
            if (data.prices) {
                if (typeof applyServerPrices === 'function') applyServerPrices(data.prices);
            }
            if (data.tabs_order) {
                localStorage.setItem('oko_tabs_order', JSON.stringify(data.tabs_order));
                if (typeof applyTabsOrder === 'function') applyTabsOrder(data.tabs_order);
            }
            
            // Жестко перерисовываем UI сразу после получения данных
            if (typeof forceRenderUI === 'function') forceRenderUI();
            
            // Если нужно подтянуть другие данные, делаем это асинхронно
            if (typeof loadCompanyDataFromServer === 'function') {
                loadCompanyDataFromServer(false).then(() => {
                    if (typeof forceRenderUI === 'function') forceRenderUI();
                    setTimeout(initOkoTour, 500);
                });
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
    let tourCompleted = localStorage.getItem('oko_tour_completed');
    localStorage.clear();
    if (tourCompleted) {
        localStorage.setItem('oko_tour_completed', tourCompleted);
    }
    
    // Сброс состояния бренда в памяти, чтобы не было утечки между аккаунтами
    if (typeof initBrand === 'function') initBrand();
    
    // SPA-логика: скрываем приложение и показываем экран входа (без перезагрузки)
    document.getElementById('app').style.display = 'none';
    document.getElementById('pwd-screen').style.display = 'flex';
    // Очищаем поля ввода
    var loginUser = document.getElementById('login-username');
    var loginPass = document.getElementById('login-password');
    if (loginUser) loginUser.value = '';
    if (loginPass) loginPass.value = '';
    var loginErr = document.getElementById('login-error');
    if (loginErr) loginErr.classList.add('hidden');
    // Показываем форму логина (скрываем регистрацию и восстановление)
    if (typeof showLoginForm === 'function') showLoginForm();
    setTimeout(function() { if (loginUser) loginUser.focus(); }, 100);
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
    
    const agreeInp = document.getElementById('reg-agree-tos');
    
    if (btn.disabled) return;
    if (!emailInp.value || !companyInp.value) { errorEl.textContent = 'Заполните все поля'; errorEl.classList.remove('hidden'); return; }
    if (agreeInp && !agreeInp.checked) { errorEl.textContent = 'Необходимо согласие с Пользовательским соглашением'; errorEl.classList.remove('hidden'); return; }
    
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
            // Инициализация интерфейса прямо из ответа сервера
            if (data.prices) {
                if (typeof applyServerPrices === 'function') applyServerPrices(data.prices);
            }
            if (data.tabs_order) {
                if (typeof applyTabsOrder === 'function') applyTabsOrder(data.tabs_order);
            }
            
            if (typeof loadCompanyDataFromServer === 'function') loadCompanyDataFromServer(true);
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
            // Инициализация интерфейса прямо из ответа сервера
            if (data.prices) {
                if (typeof applyServerPrices === 'function') applyServerPrices(data.prices);
            }
            if (data.tabs_order) {
                if (typeof applyTabsOrder === 'function') applyTabsOrder(data.tabs_order);
            }
            
            if (typeof loadCompanyDataFromServer === 'function') loadCompanyDataFromServer(true);
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
        
        // ФИКС: data объявлена ДО try, чтобы быть доступной ниже
        let data = null;
        try {
            const res = await fetch(API_URL_AUTH + '?action=me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            data = await res.json();
            if (data && !data.error) {
                localStorage.setItem('oko_modules', JSON.stringify(data.modules || []));
                if (data.subscription_until) {
                    localStorage.setItem('oko_subscription_until', data.subscription_until);
                } else {
                    localStorage.removeItem('oko_subscription_until');
                }
            }
        } catch (e) {
            console.error('Ошибка проверки сессии:', e);
        }
        
        updateTrialCounter();
        applyModules();
        
        // Применяем цены и порядок вкладок из ответа сервера (data теперь доступна)
        if (data && data.prices) {
            if (typeof applyServerPrices === 'function') applyServerPrices(data.prices);
        }
        if (data && data.tabs_order) {
            localStorage.setItem('oko_tabs_order', JSON.stringify(data.tabs_order));
            if (typeof applyTabsOrder === 'function') applyTabsOrder(data.tabs_order);
        }
        
        // Жестко перерисовываем UI после применения данных
        if (typeof forceRenderUI === 'function') forceRenderUI();
        
        // Загружаем ВСЕ данные компании с сервера (skipPrices=false — загрузить и цены тоже)
        if (typeof loadCompanyDataFromServer === 'function') {
            loadCompanyDataFromServer(false).then(() => {
                if (typeof forceRenderUI === 'function') forceRenderUI();
                setTimeout(initOkoTour, 500);
            });
        } else {
            setTimeout(initOkoTour, 500);
        }
    } else {
        document.getElementById('pwd-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        setTimeout(() => document.getElementById('login-username').focus(), 100);
    }
});

function updateTrialCounter() {
    const el = document.getElementById('trial-counter');
    const extendBtn = document.getElementById('extend-access-btn');
    if (!el) return;
    
    let isAdmin = localStorage.getItem('oko_is_admin') === 'true' || localStorage.getItem('oko_is_admin') === '1' || localStorage.getItem('oko_username') === 'admin';
    if (isAdmin) {
        el.style.display = 'none';
        if (extendBtn) extendBtn.style.display = 'none';
        return;
    }
    
    const subUntil = localStorage.getItem('oko_subscription_until');
    if (!subUntil) {
        el.style.display = 'none';
        if (extendBtn) extendBtn.style.display = 'none';
        return;
    }
    
    const until = new Date(subUntil);
    const now = new Date();
    const diffMs = until - now;
    const diffSec = Math.floor(diffMs / 1000);
    
    el.style.display = 'inline-block';
    if (extendBtn) extendBtn.style.display = 'inline-block';
    
    if (diffMs <= 0) {
        el.textContent = 'Подписка истекла';
        el.className = 'px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md ml-2';
        
        // Trigger module lock re-evaluation
        if (!window._hasLockedModulesForExpiry) {
            window._hasLockedModulesForExpiry = true;
            applyModules();
        }
    } else {
        window._hasLockedModulesForExpiry = false;
        
        if (diffSec < 60) {
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
    
    // Check trial expiration
    const subUntil = localStorage.getItem('oko_subscription_until');
    if (subUntil) {
        const diffMs = new Date(subUntil) - new Date();
        if (diffMs <= 0) {
            // Если подписка истекла, оставляем только раздел "Прочее"
            modules = [];
        }
    }
    
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
