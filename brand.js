// ==========================================
// Oko White Label / Brand Configuration
// ==========================================

// --- DEFAULT BRAND CONFIG ---
const DEFAULT_BRAND = {
    // Визуал
    primaryColor: '#2568a9',
    secondaryColors: ['#4bd3f8', '#4cffb4', '#18c366', '#21c59e'],
    logoUrl: 'https://static.tildacdn.com/tild3262-6164-4464-a231-336136356536/_.png',
    qrUrl: 'QR для оплаты .png',
    slogan: 'Комплексные решения\nдля дома и бизнеса',
    customText: '',

    // Реквизиты компании
    companyName: 'ИП Данелия Д.Т.',
    companyNameFull: 'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ДАНЕЛИЯ ДМИТРИЙ ТЕЗИКОВИЧ',
    inn: '230410343285',
    ogrnip: '317237500425682',
    ogrn: '',
    kpp: '',
    account: '40802810430000046903',
    bankName: 'КРАСНОДАРСКОЕ ОТДЕЛЕНИЕ N8619 ПАО СБЕРБАНК',
    bik: '040349602',
    corrAccount: '30101810100000000602',
    innBank: '7707083893',
    kppBank: '231043001',
    signName: 'ИП Данелия Д.Т.',
    phone: '+7 (918) 370-47-47',
    email: 'oknazavod-gel@yandex.ru',

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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Логотип (URL изображения)</label>
                <input type="text" id="brand-logo-url" value="${b.logoUrl || ''}" 
                    class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" 
                    placeholder="https://example.com/logo.png">
                <div class="mt-2 p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-center h-20">
                    <img src="${b.logoUrl || ''}" alt="Превью" class="max-h-16 max-w-[200px] object-contain" onerror="this.style.display='none'">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Главный цвет бренда</label>
                <div class="flex items-center gap-3">
                    <input type="color" id="brand-primary-color" value="${b.primaryColor || '#2568a9'}" class="w-12 h-12 rounded border border-slate-200 cursor-pointer">
                    <input type="text" id="brand-primary-color-hex" value="${b.primaryColor || '#2568a9'}" 
                        class="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        oninput="document.getElementById('brand-primary-color').value = this.value">
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Этот цвет будет использоваться в КП: заголовки, рамки, акценты.</p>
            </div>
        </div>
        <div class="mt-4">
            <label class="block text-xs font-bold text-slate-600 mb-1">Слоган / подпись под логотипом</label>
            <input type="text" id="brand-slogan" value="${(b.slogan || '').replace(/\n/g, '\\n')}" 
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                placeholder="Комплексные решения для дома и бизнеса">
            <p class="text-[10px] text-slate-400 mt-1">Используйте \\n для переноса строки.</p>
        </div>
        <div class="mt-4">
            <label class="block text-xs font-bold text-slate-600 mb-1">QR-код для оплаты (URL изображения)</label>
            <input type="text" id="brand-qr-url" value="${b.qrUrl || ''}" 
                class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                placeholder="QR для оплаты .png">
        </div>
    </div>

    <!-- Реквизиты компании -->
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h4 class="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
            <i data-lucide="building-2" class="w-4 h-4 text-brand-primary"></i> Реквизиты компании
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Краткое название</label>
                <input type="text" id="brand-company-name" value="${b.companyName || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Полное наименование</label>
                <input type="text" id="brand-company-name-full" value="${b.companyNameFull || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">ИНН</label>
                <input type="text" id="brand-inn" value="${b.inn || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">ОГРНИП / ОГРН</label>
                <input type="text" id="brand-ogrnip" value="${b.ogrnip || b.ogrn || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">КПП (если есть)</label>
                <input type="text" id="brand-kpp" value="${b.kpp || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="Оставьте пустым для ИП">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Расчётный счёт</label>
                <input type="text" id="brand-account" value="${b.account || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Банк</label>
                <input type="text" id="brand-bank-name" value="${b.bankName || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">БИК</label>
                <input type="text" id="brand-bik" value="${b.bik || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Корр. счёт</label>
                <input type="text" id="brand-corr-account" value="${b.corrAccount || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">ИНН банка</label>
                <input type="text" id="brand-inn-bank" value="${b.innBank || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">КПП банка</label>
                <input type="text" id="brand-kpp-bank" value="${b.kppBank || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Подпись (для КП)</label>
                <input type="text" id="brand-sign-name" value="${b.signName || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="ИП Данелия Д.Т.">
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Телефон</label>
                <input type="text" id="brand-phone" value="${b.phone || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input type="text" id="brand-email" value="${b.email || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
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
    }
}

function moveLayoutBlock(idx, direction) {
    const layout = Oko_User_Brand.cpLayout;
    if (!layout) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= layout.length) return;
    [layout[idx], layout[newIdx]] = [layout[newIdx], layout[idx]];
    renderLayoutBuilder();
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
