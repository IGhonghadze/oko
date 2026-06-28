// ==========================================
// Oko White Label / Brand Configuration
// ==========================================

// --- DEFAULT BRAND CONFIG ---
const DEFAULT_BRAND = {
    // Визуал
    primaryColor: '#2568a9',
    secondaryColors: ['#4bd3f8', '#4cffb4', '#18c366', '#21c59e'],
    logoUrl: '',
    qrUrl: '',
    slogan: '',
    customText: '',

    // Реквизиты компании
    companyName: '',
    companyNameFull: '',
    inn: '',
    ogrnip: '',
    ogrn: '',
    kpp: '',
    account: '',
    bankName: '',
    bik: '',
    corrAccount: '',
    innBank: '',
    kppBank: '',
    signName: '',
    phone: '',
    email: '',

    // Структура КП (порядок и видимость блоков)
    cpLayout: [
        { id: 'header',           name: 'Шапка (логотип, реквизиты, дата)', visible: true },
        { id: 'products_table',   name: 'Таблица изделий',                  visible: true },
        { id: 'services_table',   name: 'Услуги и итого',                   visible: true },
        { id: 'legal_text',       name: 'Юридический текст (оферта)',       visible: true },
        { id: 'qr_block',         name: 'QR-код и реквизиты для оплаты',    visible: true },
        { id: 'custom_text',      name: 'Пользовательский блок / Слоган',   visible: false },
        { id: 'footer_signatures',name: 'Подписи (Исполнитель / Заказчик)', visible: true }
    ]
};

// --- INIT ---
let Oko_User_Brand = {};

function initBrand() {
    try {
        const saved = localStorage.getItem('Oko_User_Brand');
        if (saved) {
            Oko_User_Brand = JSON.parse(saved);
            // Ensure cpLayout has all required blocks (in case new ones were added)
            const defaultIds = DEFAULT_BRAND.cpLayout.map(b => b.id);
            const savedIds = (Oko_User_Brand.cpLayout || []).map(b => b.id);
            defaultIds.forEach(id => {
                if (!savedIds.includes(id)) {
                    const def = DEFAULT_BRAND.cpLayout.find(b => b.id === id);
                    Oko_User_Brand.cpLayout.push({ ...def });
                }
            });
        } else {
            Oko_User_Brand = JSON.parse(JSON.stringify(DEFAULT_BRAND));
        }
    } catch (e) {
        Oko_User_Brand = JSON.parse(JSON.stringify(DEFAULT_BRAND));
    }
}

function saveBrand() {
    localStorage.setItem('Oko_User_Brand', JSON.stringify(Oko_User_Brand));
}

// --- BRAND ADMIN TAB RENDERER ---

function renderAdminBrand() {
    const container = document.getElementById('admin-brand-container');
    if (!container) return;
    const b = Oko_User_Brand;

    let html = `
    <!-- Визуальные настройки -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h4 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i data-lucide="palette" class="w-4 h-4 text-brand-primary"></i> Визуал бренда
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Левая колонка (Файлы) -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Логотип</label>
                    <input type="file" id="brand-logo-file" accept="image/*" style="display:none"
                        onchange="handleBrandFileUpload('upload_logo', this, 'brand-logo-preview')">
                    <div class="flex items-center gap-2 mb-2">
                        <button type="button" onclick="document.getElementById('brand-logo-file').click()"
                            class="w-full py-1.5 bg-brand-primary text-white text-xs font-bold rounded hover:opacity-90 transition-opacity flex justify-center items-center gap-1">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i> Загрузить
                        </button>
                    </div>
                    <div class="p-1 bg-white rounded border border-slate-200 flex items-center justify-center h-16 relative group">
                        <img id="brand-logo-preview" src="${b.logoUrl || ''}" class="max-h-14 max-w-full object-contain" onerror="this.style.display='none'" onload="this.style.display=''">
                        <span id="brand-logo-filename" class="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity">${b.logoUrl ? 'Файл загружен' : 'Нет файла'}</span>
                    </div>
                    <input type="hidden" id="brand-logo-url" value="${b.logoUrl || ''}">
                </div>
                
                <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">QR-код оплаты</label>
                    <input type="file" id="brand-qr-file" accept="image/*" style="display:none"
                        onchange="handleBrandFileUpload('upload_qr', this, 'brand-qr-preview')">
                    <div class="flex items-center gap-2 mb-2">
                        <button type="button" onclick="document.getElementById('brand-qr-file').click()"
                            class="w-full py-1.5 bg-slate-700 text-white text-xs font-bold rounded hover:opacity-90 transition-opacity flex justify-center items-center gap-1">
                            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> Загрузить
                        </button>
                    </div>
                    <div class="p-1 bg-white rounded border border-slate-200 flex items-center justify-center h-16 relative group">
                        <img id="brand-qr-preview" src="${b.qrUrl || ''}" class="max-h-14 max-w-full object-contain" onerror="this.style.display='none'" onload="this.style.display=''">
                        <span id="brand-qr-filename" class="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity">${b.qrUrl ? 'Файл загружен' : 'Нет файла'}</span>
                    </div>
                    <input type="hidden" id="brand-qr-url" value="${b.qrUrl || ''}">
                </div>
            </div>

            <!-- Правая колонка (Тексты) -->
            <div class="space-y-3">
                <div class="flex items-center gap-3">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Цвет бренда (Hex)</label>
                        <input type="text" id="brand-primary-color-hex" value="${b.primaryColor || '#2568a9'}" 
                            class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-brand-primary focus:outline-none"
                            oninput="document.getElementById('brand-primary-color').value = this.value">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 opacity-0">Цвет</label>
                        <input type="color" id="brand-primary-color" value="${b.primaryColor || '#2568a9'}" class="w-10 h-8 rounded border border-slate-200 cursor-pointer p-0" oninput="document.getElementById('brand-primary-color-hex').value = this.value">
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Слоган / подпись</label>
                    <input type="text" id="brand-slogan" value="${(b.slogan || '').replace(/\n/g, '\\n')}" 
                        class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none"
                        placeholder="Комплексные решения...">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Телефон</label>
                        <input type="text" id="brand-phone" value="${b.phone || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</label>
                        <input type="text" id="brand-email" value="${b.email || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h4 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i data-lucide="building-2" class="w-4 h-4 text-brand-primary"></i> Реквизиты компании
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Краткое название</label>
                <input type="text" id="brand-company-name" value="${b.companyName || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Полное наименование</label>
                <input type="text" id="brand-company-name-full" value="${b.companyNameFull || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ИНН</label>
                <input type="text" id="brand-inn" value="${b.inn || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ОГРНИП / ОГРН</label>
                <input type="text" id="brand-ogrnip" value="${b.ogrnip || b.ogrn || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">КПП (если есть)</label>
                <input type="text" id="brand-kpp" value="${b.kpp || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none" placeholder="Для ИП - пусто">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Расчётный счёт</label>
                <input type="text" id="brand-account" value="${b.account || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Банк</label>
                <input type="text" id="brand-bank-name" value="${b.bankName || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">БИК</label>
                <input type="text" id="brand-bik" value="${b.bik || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Корр. счёт</label>
                <input type="text" id="brand-corr-account" value="${b.corrAccount || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ИНН банка</label>
                <input type="text" id="brand-inn-bank" value="${b.innBank || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">КПП банка</label>
                <input type="text" id="brand-kpp-bank" value="${b.kppBank || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Подпись в КП</label>
                <input type="text" id="brand-sign-name" value="${b.signName || ''}" class="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:outline-none" placeholder="ИП Данелия Д.Т.">
            </div>
        </div>
    </div>

    <!-- Пользовательский текст -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h4 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i data-lucide="text" class="w-4 h-4 text-brand-primary"></i> Пользовательский блок
        </h4>
        <textarea id="brand-custom-text" rows="3" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y"
            placeholder="Введите текст, который будет выводиться в КП (слоган, гарантия, условия и т.д.)">${b.customText || ''}</textarea>
        <p class="text-[10px] text-slate-400 mt-1">Чтобы этот блок отображался в КП, включите его в конструкторе ниже.</p>
    </div>

    <!-- Конструктор КП -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h4 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i data-lucide="layout-list" class="w-4 h-4 text-brand-primary"></i> Конструктор КП (порядок блоков)
        </h4>
        <p class="text-xs text-slate-500 mb-4">Настройте порядок и видимость блоков в Коммерческом Предложении. Используйте стрелки для перемещения.</p>
        <div id="brand-layout-list" class="space-y-2"></div>
    </div>
    `;

    container.innerHTML = html;
    renderLayoutBuilder();
    
    // Sync color picker
    const colorPicker = document.getElementById('brand-primary-color');
    const colorHex = document.getElementById('brand-primary-color-hex');
    if (colorPicker && colorHex) {
        colorPicker.addEventListener('input', () => { colorHex.value = colorPicker.value; });
    }
}

function renderLayoutBuilder() {
    const list = document.getElementById('brand-layout-list');
    if (!list) return;
    const layout = Oko_User_Brand.cpLayout || DEFAULT_BRAND.cpLayout;

    let html = '';
    layout.forEach((block, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === layout.length - 1;
        html += `
        <div class="flex items-center gap-3 p-3 rounded-lg border ${block.visible ? 'border-brand-primary bg-blue-50/50' : 'border-slate-200 bg-slate-50 opacity-60'} transition-all">
            <label class="flex items-center cursor-pointer shrink-0">
                <input type="checkbox" ${block.visible ? 'checked' : ''} onchange="toggleLayoutBlock(${idx})" 
                    class="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary">
            </label>
            <span class="flex-1 text-sm font-medium text-slate-700">${block.name}</span>
            <div class="flex gap-1 shrink-0">
                <button onclick="moveLayoutBlock(${idx}, -1)" ${isFirst ? 'disabled' : ''} 
                    class="p-1.5 rounded ${isFirst ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'} transition-colors" title="Вверх">
                    <i data-lucide="chevron-up" class="w-4 h-4"></i>
                </button>
                <button onclick="moveLayoutBlock(${idx}, 1)" ${isLast ? 'disabled' : ''} 
                    class="p-1.5 rounded ${isLast ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'} transition-colors" title="Вниз">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleLayoutBlock(idx) {
    if (Oko_User_Brand.cpLayout && Oko_User_Brand.cpLayout[idx]) {
        Oko_User_Brand.cpLayout[idx].visible = !Oko_User_Brand.cpLayout[idx].visible;
        renderLayoutBuilder();
        saveBrand();
        saveCpLayoutToServer();
    }
}

function moveLayoutBlock(idx, direction) {
    const layout = Oko_User_Brand.cpLayout;
    if (!layout) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= layout.length) return;
    [layout[idx], layout[newIdx]] = [layout[newIdx], layout[idx]];
    renderLayoutBuilder();
    saveBrand();
    saveCpLayoutToServer();
}

/**
 * Сохраняет ТОЛЬКО порядок разделов КП на сервер (лёгкий отдельный endpoint).
 */
async function saveCpLayoutToServer() {
    try {
        const token = localStorage.getItem('oko_token');
        if (!token) { console.warn('[cpLayout] Нет токена, не сохраняю'); return; }

        const apiUrl = (typeof getApiUrl === 'function') ? getApiUrl() : 'api.php';
        const payload = { cp_layout: Oko_User_Brand.cpLayout || [] };

        console.log('[cpLayout] Отправляю на сервер:', JSON.stringify(payload.cp_layout.map(b => b.id)));

        const resp = await fetch(apiUrl + '?action=save_cp_layout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });
        const result = await resp.json();
        if (result.success) {
            console.log('[cpLayout] ✅ Порядок разделов сохранён на сервер');
        } else {
            console.error('[cpLayout] ❌ Ошибка сохранения:', result.error);
        }
    } catch (e) {
        console.error('[cpLayout] ❌ Сетевая ошибка:', e);
    }
}

// --- SAVE BRAND FROM ADMIN INPUTS ---

function saveBrandFromAdmin() {
    const b = Oko_User_Brand;
    
    const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    
    b.logoUrl = val('brand-logo-url');
    b.primaryColor = val('brand-primary-color');
    b.slogan = val('brand-slogan').replace(/\\n/g, '\n');
    b.qrUrl = val('brand-qr-url');
    b.customText = val('brand-custom-text');
    
    b.companyName = val('brand-company-name');
    b.companyNameFull = val('brand-company-name-full');
    b.inn = val('brand-inn');
    b.ogrnip = val('brand-ogrnip');
    b.kpp = val('brand-kpp');
    b.account = val('brand-account');
    b.bankName = val('brand-bank-name');
    b.bik = val('brand-bik');
    b.corrAccount = val('brand-corr-account');
    b.innBank = val('brand-inn-bank');
    b.kppBank = val('brand-kpp-bank');
    b.signName = val('brand-sign-name');
    b.phone = val('brand-phone');
    b.email = val('brand-email');
    
    saveBrand();
}

// --- GET BRAND DATA FOR KP RENDERING ---

function getBrandCompany() {
    const b = Oko_User_Brand;
    return {
        name_short: b.companyName || DEFAULT_BRAND.companyName,
        name_full: b.companyNameFull || DEFAULT_BRAND.companyNameFull,
        inn: b.inn || DEFAULT_BRAND.inn,
        ogrnip: b.ogrnip || DEFAULT_BRAND.ogrnip,
        ogrn: b.ogrn || '',
        kpp: b.kpp || '',
        account: b.account || DEFAULT_BRAND.account,
        bank_name: b.bankName || DEFAULT_BRAND.bankName,
        bik: b.bik || DEFAULT_BRAND.bik,
        corr_account: b.corrAccount || DEFAULT_BRAND.corrAccount,
        inn_bank: b.innBank || DEFAULT_BRAND.innBank,
        kpp_bank: b.kppBank || DEFAULT_BRAND.kppBank,
        sign_name: b.signName || DEFAULT_BRAND.signName,
        contacts: `<p>📞 ${b.phone || DEFAULT_BRAND.phone}</p><p>✉️ ${b.email || DEFAULT_BRAND.email}</p>`,
        req: buildReqString(b)
    };
}

function buildReqString(b) {
    let parts = [];
    if (b.inn) parts.push(`ИНН: ${b.inn}`);
    if (b.kpp) parts.push(`КПП: ${b.kpp}`);
    if (b.ogrnip) parts.push(`ОГРНИП: ${b.ogrnip}`);
    if (b.ogrn) parts.push(`ОГРН: ${b.ogrn}`);
    if (b.account) parts.push(`Расчётный счёт: ${b.account}`);
    if (b.bankName) parts.push(`Банк: ${b.bankName}`);
    if (b.bik) parts.push(`БИК: ${b.bik}`);
    if (b.corrAccount) parts.push(`Корр. счёт: ${b.corrAccount}`);
    if (b.innBank) parts.push(`ИНН банка: ${b.innBank}`);
    if (b.kppBank) parts.push(`КПП банка: ${b.kppBank}`);
    return parts.join('<br>');
}

function getBrandLogoUrl() {
    return Oko_User_Brand.logoUrl || DEFAULT_BRAND.logoUrl;
}

function getBrandColor() {
    return Oko_User_Brand.primaryColor || DEFAULT_BRAND.primaryColor;
}

function getBrandSlogan() {
    return (Oko_User_Brand.slogan || DEFAULT_BRAND.slogan).replace(/\\n/g, '\n');
}

function getBrandQrUrl() {
    return Oko_User_Brand.qrUrl || DEFAULT_BRAND.qrUrl;
}

function getBrandCustomText() {
    return Oko_User_Brand.customText || '';
}

function getBrandLayout() {
    return Oko_User_Brand.cpLayout || DEFAULT_BRAND.cpLayout;
}

// --- APPLY BRAND TO KP (called after showProposal) ---

function applyBrandToKP() {
    const layout = getBrandLayout();
    const color = getBrandColor();
    const logoUrl = getBrandLogoUrl();
    const slogan = getBrandSlogan();
    const qrUrl = getBrandQrUrl();
    const customText = getBrandCustomText();
    const brandComp = getBrandCompany();

    // 1. Apply logo
    const proposalContent = document.getElementById('proposal-content');
    if (proposalContent) {
        const logoImg = proposalContent.querySelector('img[alt="Логотип"]');
        if (logoImg && logoUrl) logoImg.src = logoUrl;
    }

    // 2. Apply slogan
    const sloganEl = proposalContent ? proposalContent.querySelector('.text-\\[11px\\].font-bold.text-slate-800.uppercase') : null;
    if (sloganEl && slogan) {
        sloganEl.innerHTML = slogan.split('\n').join('<br>');
    }

    // 3. Apply brand color to KP elements
    if (color) {
        // Header border
        const headerBorder = proposalContent ? proposalContent.querySelector('.border-b-2.border-brand-primary') : null;
        if (headerBorder) headerBorder.style.borderBottomColor = color;

        // Total price block
        const totalBlock = document.getElementById('kp-total-sum');
        if (totalBlock) totalBlock.style.color = color;

        // Legal text left border
        const legalBorder = proposalContent ? proposalContent.querySelector('.border-l-\\[3px\\].border-brand-primary') : null;
        if (legalBorder) legalBorder.style.borderLeftColor = color;

        // Payment block header border
        const paymentHeader = proposalContent ? proposalContent.querySelector('#kp-payment-block .border-b-2.border-brand-primary') : null;
        if (paymentHeader) paymentHeader.style.borderBottomColor = color;

        // Total to pay box
        const totalPayBox = proposalContent ? proposalContent.querySelector('.bg-brand-light.border-brand-primary') : null;
        if (totalPayBox) {
            totalPayBox.style.borderColor = color;
            totalPayBox.style.backgroundColor = color + '15'; // 15 = ~8% opacity
        }
    }

    // 4. Apply QR code
    const qrImg = proposalContent ? proposalContent.querySelector('#kp-payment-block img[alt*="QR"]') : null;
    if (qrImg && qrUrl) qrImg.src = qrUrl;

    // 5. Apply brand requisites to bank block
    const bankReqContainer = document.getElementById('kp-bank-requisites');
    if (bankReqContainer) {
        let rows = [
            ['Получатель:', brandComp.name_full],
            ['ИНН:', brandComp.inn || '—'],
            ['Расч. счёт:', brandComp.account || '—'],
            ['Банк:', brandComp.bank_name || '—'],
            ['БИК:', brandComp.bik || '—'],
            ['Корр. счёт:', brandComp.corr_account || '—']
        ];
        if (brandComp.inn_bank) rows.push(['ИНН банка:', brandComp.inn_bank]);
        if (brandComp.kpp_bank) rows.push(['КПП банка:', brandComp.kpp_bank]);
        if (brandComp.kpp) rows.push(['КПП:', brandComp.kpp]);
        if (brandComp.ogrnip) rows.push(['ОГРНИП:', brandComp.ogrnip]);
        if (brandComp.ogrn) rows.push(['ОГРН:', brandComp.ogrn]);

        bankReqContainer.innerHTML = rows.map(([label, val]) =>
            `<span class="text-slate-500 font-medium whitespace-nowrap">${label}</span><span class="font-bold text-slate-800 break-all">${val}</span>`
        ).join('');
    }

    // 6. Apply sign name
    const signEl = document.getElementById('company-sign-name');
    if (signEl) signEl.innerText = brandComp.sign_name + " (подпись)";

    // 7. Apply company contacts
    const contEl = document.getElementById('company-contacts');
    if (contEl) contEl.innerHTML = brandComp.contacts;

    // 8. Apply company requisites in footer
    const reqEl = document.getElementById('company-requisites');
    if (reqEl) reqEl.innerHTML = `<p class="font-bold text-slate-800 text-xs">${brandComp.name_full}</p><p>${brandComp.req}</p>`;

    // 9. Handle layout (block visibility and order)
    if (proposalContent) {
        // Map block IDs to their DOM selectors
        const blockMap = {
            'header': proposalContent.querySelector('.flex.flex-col.sm\\:flex-row.justify-between.items-start.border-b-2'),
            'products_table': proposalContent.querySelector('.overflow-x-auto.w-full.mb-6'),
            'services_table': proposalContent.querySelector('.break-inside-avoid.mt-2.border-t-2'),
            'legal_text': null, // Part of services_table block — handled separately
            'qr_block': document.getElementById('kp-payment-block'),
            'custom_text': document.getElementById('kp-custom-text-block'),
            'footer_signatures': proposalContent.querySelector('.break-inside-avoid.mt-16.pb-8')
        };

        // The legal_text and services_table are inside the same parent div.
        // We need to find and separate them. The legal text is the left div inside the services block.
        const servicesBlock = blockMap['services_table'];
        if (servicesBlock) {
            const legalTextDiv = servicesBlock.querySelector('.text-justify.text-slate-600');
            blockMap['legal_text'] = legalTextDiv ? legalTextDiv.closest('.w-full.md\\:w-1\\/2') || legalTextDiv : null;
        }

        // Handle custom_text block — create it if it doesn't exist
        if (!blockMap['custom_text']) {
            const customDiv = document.createElement('div');
            customDiv.id = 'kp-custom-text-block';
            customDiv.className = 'break-inside-avoid mt-4 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl';
            customDiv.style.display = 'none';
            // Insert before footer signatures or at end of proposal-content
            const footer = blockMap['footer_signatures'];
            if (footer) {
                proposalContent.insertBefore(customDiv, footer);
            } else {
                proposalContent.appendChild(customDiv);
            }
            blockMap['custom_text'] = customDiv;
        }

        // Update custom text content
        const customBlock = blockMap['custom_text'];
        if (customBlock) {
            if (customText) {
                customBlock.innerHTML = `<p class="text-sm text-slate-700 whitespace-pre-line">${customText}</p>`;
            }
        }

        // Apply visibility from layout
        layout.forEach(block => {
            const el = blockMap[block.id];
            if (el) {
                el.style.display = block.visible ? '' : 'none';
            }
        });

        // Apply order: move blocks in DOM according to layout order
        // Only reorder top-level children of proposal-content that we can identify
        const orderedIds = layout.filter(b => b.visible).map(b => b.id);
        const topLevelBlocks = ['header', 'products_table', 'services_table', 'qr_block', 'custom_text', 'footer_signatures'];
        
        let lastInserted = null;
        orderedIds.forEach(id => {
            if (!topLevelBlocks.includes(id)) return; // Skip non-top-level blocks like legal_text
            const el = blockMap[id];
            if (el && el.parentNode === proposalContent) {
                if (lastInserted && lastInserted.nextSibling) {
                    proposalContent.insertBefore(el, lastInserted.nextSibling);
                } else if (lastInserted) {
                    proposalContent.appendChild(el);
                }
                lastInserted = el;
            }
        });
    }
}

// Init on load
initBrand();

// ==========================================
// MULTI-TENANCY: Серверная синхронизация бренда
// ==========================================

/**
 * Загружает настройки бренда (реквизиты, лого, QR) с сервера для текущей компании.
 * company_id определяется на сервере по токену — клиент не передаёт его.
 */
async function loadBrandFromServer() {
    try {
        const token = localStorage.getItem('oko_token');
        if (!token) return;

        const apiUrl = (typeof getApiUrl === 'function') ? getApiUrl() : 'api.php';
        const resp = await fetch(apiUrl + '?action=get_company_settings', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await resp.json();

        if (result.success && result.settings) {
            const s = result.settings;
            // Маппинг полей сервера → Oko_User_Brand
            Oko_User_Brand.companyName = s.legal_name || '';
            Oko_User_Brand.companyNameFull = s.legal_name_full || '';
            Oko_User_Brand.inn = s.inn || '';
            Oko_User_Brand.ogrnip = s.ogrnip || '';
            Oko_User_Brand.ogrn = s.ogrn || '';
            Oko_User_Brand.kpp = s.kpp || '';
            Oko_User_Brand.account = s.account || '';
            Oko_User_Brand.bankName = s.bank_name || '';
            Oko_User_Brand.bik = s.bik || '';
            Oko_User_Brand.corrAccount = s.corr_account || '';
            Oko_User_Brand.innBank = s.inn_bank || '';
            Oko_User_Brand.kppBank = s.kpp_bank || '';
            Oko_User_Brand.signName = s.sign_name || '';
            Oko_User_Brand.phone = s.phone || '';
            Oko_User_Brand.email = s.email || '';
            Oko_User_Brand.slogan = s.slogan || '';
            Oko_User_Brand.customText = s.custom_text || '';
            Oko_User_Brand.primaryColor = s.primary_color || '#2568a9';

            // Логотип и QR — путь с сервера (относительный URL)
            if (s.logo_path) {
                const baseUrl = apiUrl.replace(/api\.php.*$/, '');
                Oko_User_Brand.logoUrl = baseUrl + s.logo_path;
            } else {
                Oko_User_Brand.logoUrl = '';
            }
            if (s.qr_path) {
                const baseUrl = apiUrl.replace(/api\.php.*$/, '');
                Oko_User_Brand.qrUrl = baseUrl + s.qr_path;
            } else {
                Oko_User_Brand.qrUrl = '';
            }

            // Конструктор КП
            console.log('[cpLayout] Данные с сервера:', JSON.stringify(s.cp_layout));
            if (s.cp_layout && Array.isArray(s.cp_layout) && s.cp_layout.length > 0) {
                Oko_User_Brand.cpLayout = s.cp_layout;
                console.log('[cpLayout] ✅ Загружен порядок разделов с сервера:', s.cp_layout.map(b => b.id));
            } else if (typeof s.cp_layout === 'string' && s.cp_layout.length > 2) {
                // Если сервер вернул строку (не декодировал JSON)
                try {
                    const parsed = JSON.parse(s.cp_layout);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        Oko_User_Brand.cpLayout = parsed;
                        console.log('[cpLayout] ✅ Загружен порядок (из строки):', parsed.map(b => b.id));
                    }
                } catch(e) {
                    console.warn('[cpLayout] Не удалось распарсить строку cp_layout');
                }
            } else {
                console.warn('[cpLayout] ⚠️ cp_layout с сервера пуст или null, используется дефолт');
            }
            saveBrand();
            console.log('[Multi-tenancy] Настройки бренда загружены с сервера');
        }
    } catch (e) {
        console.warn('[Multi-tenancy] Не удалось загрузить настройки бренда:', e);
    }
}

/**
 * Сохраняет настройки бренда (реквизиты, цвет, слоган) на сервер.
 * company_id определяется на сервере по токену — клиент не передаёт его.
 */
async function saveBrandToServer() {
    try {
        const token = localStorage.getItem('oko_token');
        if (!token) return;

        const b = Oko_User_Brand;
        const apiUrl = (typeof getApiUrl === 'function') ? getApiUrl() : 'api.php';
        
        const payload = {
            legal_name: b.companyName || '',
            legal_name_full: b.companyNameFull || '',
            inn: b.inn || '',
            ogrnip: b.ogrnip || '',
            ogrn: b.ogrn || '',
            kpp: b.kpp || '',
            account: b.account || '',
            bank_name: b.bankName || '',
            bik: b.bik || '',
            corr_account: b.corrAccount || '',
            inn_bank: b.innBank || '',
            kpp_bank: b.kppBank || '',
            sign_name: b.signName || '',
            phone: b.phone || '',
            email: b.email || '',
            slogan: b.slogan || '',
            custom_text: b.customText || '',
            primary_color: b.primaryColor || '#2568a9',
            cp_layout: b.cpLayout || []
        };

        const resp = await fetch(apiUrl + '?action=save_company_settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });
        const result = await resp.json();
        if (result.success) {
            console.log('[Multi-tenancy] Настройки бренда сохранены на сервер');
        } else {
            console.warn('[Multi-tenancy] Ошибка сохранения бренда:', result.error);
        }
    } catch (e) {
        console.warn('[Multi-tenancy] Не удалось сохранить бренд на сервер:', e);
    }
}

/**
 * Загружает файл (логотип или QR) на сервер.
 * @param {'upload_logo'|'upload_qr'} action - тип загрузки
 * @param {File} file - выбранный файл
 * @param {function} onSuccess - callback при успехе, получает путь к файлу
 */
async function uploadBrandFile(action, file, onSuccess) {
    try {
        const token = localStorage.getItem('oko_token');
        if (!token) { alert('Не авторизован'); return; }

        const apiUrl = (typeof getApiUrl === 'function') ? getApiUrl() : 'api.php';
        const formData = new FormData();
        formData.append('file', file);

        const resp = await fetch(apiUrl + '?action=' + action, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        const result = await resp.json();

        if (result.success && result.path) {
            const baseUrl = apiUrl.replace(/api\.php.*$/, '');
            const fullUrl = baseUrl + result.path;
            if (onSuccess) onSuccess(fullUrl);
            console.log('[Multi-tenancy] Файл загружен:', result.path);
        } else {
            alert('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка'));
        }
    } catch (e) {
        alert('Ошибка загрузки файла: ' + e.message);
    }
}

/**
 * Обработчик выбора файла в input — показывает превью и загружает на сервер.
 * @param {'upload_logo'|'upload_qr'} action
 * @param {HTMLInputElement} inputEl
 * @param {string} previewId - ID элемента img для превью
 */
function handleBrandFileUpload(action, inputEl, previewId) {
    const file = inputEl.files && inputEl.files[0];
    if (!file) return;

    // Проверка размера файла (оптимально до 2 МБ)
    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`Файл слишком большой! Оптимальный размер логотипа/QR-кода не должен превышать ${MAX_SIZE_MB} МБ.\nТекущий размер: ${(file.size / (1024 * 1024)).toFixed(2)} МБ.`);
        inputEl.value = ''; // Сбрасываем выбранный файл
        return;
    }

    // Мгновенное локальное превью
    const preview = document.getElementById(previewId);
    if (preview) {
        const reader = new FileReader();
        reader.onload = (e) => { 
            preview.src = e.target.result; 
            preview.style.display = ''; 
        };
        reader.readAsDataURL(file);
    }

    // Обновляем текст статуса
    const filenameSpan = action === 'upload_logo' 
        ? document.getElementById('brand-logo-filename')
        : document.getElementById('brand-qr-filename');
    if (filenameSpan) filenameSpan.textContent = file.name;

    // Загружаем на сервер
    uploadBrandFile(action, file, (fullUrl) => {
        // Обновляем скрытый input и Oko_User_Brand
        if (action === 'upload_logo') {
            const hidden = document.getElementById('brand-logo-url');
            if (hidden) hidden.value = fullUrl;
            Oko_User_Brand.logoUrl = fullUrl;
        } else {
            const hidden = document.getElementById('brand-qr-url');
            if (hidden) hidden.value = fullUrl;
            Oko_User_Brand.qrUrl = fullUrl;
        }
        saveBrand(); // Сохраняем в localStorage
    });
}
