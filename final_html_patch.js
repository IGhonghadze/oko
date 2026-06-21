const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');

// 1. Add admin.js script tag
if (!index.includes('<script src="admin.js"')) {
    index = index.replace('<script src="script.js"', '<script src="admin.js" defer></script>\n    <script src="script.js"');
}

// 2. Add the Admin Screen HTML before SETTINGS MODAL
const adminHtml = `
    <!-- ADMIN SCREEN -->
    <div id="admin-screen" class="min-h-screen bg-slate-50 font-sans hidden pb-24">
        <div class="max-w-6xl mx-auto p-4 md:p-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
                        <i data-lucide="settings-2" class="w-8 h-8 text-brand-primary"></i> Панель управления
                    </h1>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="saveAdminPrices()" class="bg-brand-primary hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2"><i data-lucide="save" class="w-5 h-5"></i> Сохранить</button>
                    <button onclick="closeAdminPanel()" class="bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"><i data-lucide="x" class="w-5 h-5"></i> Закрыть</button>
                </div>
            </div>

            <!-- Admin Tabs -->
            <div class="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-2">
                <button class="admin-tab-btn bg-brand-primary text-white shadow-md px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-glasses" onclick="switchAdminTab('tab-admin-glasses')">Стеклопакеты</button>
                <button class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-nets" onclick="switchAdminTab('tab-admin-nets')">Сетки</button>
                <button class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-sills" onclick="switchAdminTab('tab-admin-sills')">Подоконники</button>
                <button class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-slopes" onclick="switchAdminTab('tab-admin-slopes')">Откосы</button>
                <button class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-hardware" onclick="switchAdminTab('tab-admin-hardware')">Фурнитура</button>
                <button class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-sandwiches" onclick="switchAdminTab('tab-admin-sandwiches')">Сендвич-панели</button>
                <button class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-mount" onclick="switchAdminTab('tab-admin-mount')">Монтаж</button>
                <button class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs" data-target="tab-admin-services" onclick="switchAdminTab('tab-admin-services')">Услуги</button>
            </div>

            <!-- Content Areas -->
            <div id="tab-admin-glasses" class="admin-tab-content">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Стеклопакеты</h3><div id="admin-glasses-container"></div>
                <h3 class="text-lg font-bold text-slate-800 mb-4 mt-8">Шпросы и Раскладка</h3><div id="admin-layouts-container"></div>
                <h3 class="text-lg font-bold text-slate-800 mb-4 mt-8">Формы (Наценка)</h3><div id="admin-shapes-container"></div>
            </div>
            <div id="tab-admin-nets" class="admin-tab-content hidden">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Москитные сетки</h3><div id="admin-nets-container"></div>
            </div>
            <div id="tab-admin-sills" class="admin-tab-content hidden">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Подоконники</h3><div id="admin-sills-container"></div>
            </div>
            <div id="tab-admin-slopes" class="admin-tab-content hidden">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Откосы</h3><div id="admin-slopes-container"></div>
            </div>
            <div id="tab-admin-hardware" class="admin-tab-content hidden">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Фурнитура</h3><div id="admin-hardware-container"></div>
            </div>
            <div id="tab-admin-sandwiches" class="admin-tab-content hidden">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Сендвич-панели</h3><div id="admin-sandwiches-container"></div>
            </div>
            <div id="tab-admin-mount" class="admin-tab-content hidden">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Базовые тарифы монтажа</h3><div id="admin-mount-container"></div>
            </div>
            <div id="tab-admin-services" class="admin-tab-content hidden">
                <h3 class="text-lg font-bold text-slate-800 mb-4">Дополнительные услуги</h3><div id="admin-services-container"></div>
            </div>
        </div>
    </div>
    
`;
if (!index.includes('<!-- ADMIN SCREEN -->')) {
    index = index.replace('    <!-- SETTINGS MODAL -->', adminHtml + '    <!-- SETTINGS MODAL -->');
}

// 3. Update Hardware inputs
const hwStart = index.indexOf('<div id="tab-hardware" class="category-content p-4 sm:p-6">');
if (hwStart !== -1) {
    const hwEnd = index.indexOf('<!-- TAB: CUSTOM ITEMS -->', hwStart);
    if (hwEnd !== -1) {
        const newHwHtml = `<div id="tab-hardware" class="category-content p-4 sm:p-6">
                                <h2 class="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><i data-lucide="wrench" class="w-5 h-5 text-brand-primary"></i> Фурнитура</h2>
                                <p class="text-sm text-slate-500 mb-5">Оконная и дверная фурнитура для ремонта и модернизации.</p>

                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-slate-600 mb-1">Фурнитура <span class="text-red-400">*</span></label>
                                    <select id="hardware-type" class="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"></select>
                                </div>

                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <div style="display:none;">
                                        <label class="block text-sm font-medium text-slate-600 mb-1">Цена (₽)</label>
                                        <input type="number" id="hardware-price" value="0" min="0" class="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    </div>
                                    <div class="col-span-2">
                                        <label class="block text-sm font-medium text-slate-600 mb-1">Кол-во (шт)</label>
                                        <input type="number" id="hardware-qty" value="1" min="1" class="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                    </div>
                                </div>

                                <div class="mb-4">
                                    <label class="block text-sm font-medium text-slate-600 mb-1">Комментарий для клиента</label>
                                    <input type="text" id="hardware-comment" placeholder="Напр.: замена сломанной петли..." class="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                </div>

                                <button onclick="addHardwareItem()" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"><i data-lucide="plus" class="w-5 h-5"></i> Добавить фурнитуру</button>
                            </div>
                            `;
        index = index.substring(0, hwStart) + newHwHtml + index.substring(hwEnd);
    }
}

// 4. Update Sandwich inputs
const swStart = index.indexOf('<div id="tab-sandwich" class="category-content">');
if (swStart !== -1) {
    const swEnd = index.indexOf('<!-- TAB: SILLS -->', swStart);
    if (swEnd !== -1) {
        const newSwHtml = `<div id="tab-sandwich" class="category-content">
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                    <div><label class="block text-sm font-medium text-slate-600 mb-1">Ширина (мм)</label><input type="number" id="sandwich-w" class="w-full relative p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" placeholder="1000"></div>
                                    <div><label class="block text-sm font-medium text-slate-600 mb-1">Высота (мм)</label><input type="number" id="sandwich-h" class="w-full relative p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" placeholder="1200"></div>
                                    <div><label class="block text-sm font-medium text-slate-600 mb-1">Кол-во (шт)</label><input type="number" id="sandwich-qty" value="1" min="1" class="w-full relative p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" placeholder="1"></div>
                                </div>
                                <div class="mb-5">
                                    <label class="block text-sm font-medium text-slate-600 mb-1">Тип сендвич-панели</label>
                                    <select id="sandwich-type" class="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"></select>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5" style="display:none;">
                                    <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>
                                        <label class="block text-sm font-bold text-slate-700 mb-2">Цвет снаружи</label>
                                        <select id="sandwich-color-out" class="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                            <option value="Белый">Белый</option>
                                        </select>
                                    </div>
                                    <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-brand-secondary"></div>
                                        <label class="block text-sm font-bold text-slate-700 mb-2">Цвет внутри</label>
                                        <select id="sandwich-color-in" class="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                            <option value="Белый">Белый</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-5">
                                    <label class="block text-sm font-medium text-slate-600 mb-1">Комментарий <span class="text-slate-400 font-normal">(необязательно)</span></label>
                                    <input type="text" id="sandwich-comment" placeholder="Напр.: для балконной двери..." class="w-full relative p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all">
                                </div>
                                <button onclick="addSandwichItem()" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"><i data-lucide="plus" class="w-5 h-5"></i> Добавить сендвич-панель</button>
                            </div>
                            `;
        index = index.substring(0, swStart) + newSwHtml + index.substring(swEnd);
    }
}

// 5. Replace "toggleSettingsModal" with "openAdminPanel" button
const btnOld = `                        <button onclick="toggleSettingsModal()"
                            class="bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm">
                            <i data-lucide="settings" class="w-4 h-4"></i>
                            Загрузка цен
                        </button>`;
const btnNew = `                        <button onclick="openAdminPanel()"
                            class="bg-brand-primary hover:bg-brand-dark text-white px-4 py-1.5 rounded-lg flex items-center gap-2 font-bold transition-all shadow-md">
                            <i data-lucide="settings-2" class="w-4 h-4"></i>
                            Панель управления
                        </button>`;
if (index.includes(btnOld)) {
    index = index.replace(btnOld, btnNew);
} else {
    // try fallback
    const btnOldFallback = /<button onclick="toggleSettingsModal\(\)"[\s\S]*?<\/button>/;
    index = index.replace(btnOldFallback, btnNew);
}

// 6. Fix KP Header Layout WITHOUT touching lines around it
const kpHeaderOld = `                    <div class="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-4 w-full sm:w-auto"><img
                            src="https://static.tildacdn.com/tild3262-6164-4464-a231-336136356536/_.png" alt="Логотип"
                            class="w-52 sm:w-60 print:w-52 h-auto object-contain shrink-0">
                        <div class="flex flex-col justify-center border-t-2 sm:border-t-0 sm:border-l-2 border-slate-200 pt-2 sm:pt-0 pl-0 sm:pl-4 shrink-0 text-center sm:text-left w-full sm:w-auto">
                            <p
                                class="text-[11px] font-bold text-slate-800 uppercase tracking-wide leading-snug whitespace-nowrap">
                                Комплексные решения<br>для дома и бизнеса</p>
                            <div class="text-[10px] text-slate-600 mt-1.5 space-y-1 font-medium whitespace-nowrap"
                                id="company-contacts"></div>
                        </div>
                    </div>
                    <div class="w-full sm:max-w-[45%] text-left sm:text-right flex flex-col items-start sm:items-end shrink-0 pl-0 sm:pl-4 mt-4 sm:mt-0">
                        <div class="flex items-baseline justify-start sm:justify-end flex-wrap gap-x-2 w-full">
                            <h2
                                class="text-base sm:text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">
                                Коммерческое предложение</h2>
                            <h3 class="text-base sm:text-lg md:text-xl font-black text-brand-primary"
                                id="kp-number-display-right"></h3>
                        </div>
                        <p class="text-xs font-bold text-slate-500 uppercase mt-1">Счет-договор (Оферта)</p>
                        <p class="text-slate-500 text-xs mt-1">Дата: <span id="kp-date"
                                class="text-slate-900 font-bold"></span></p>
                        <div class="mt-3 bg-slate-50 border border-slate-200 rounded p-2 text-left w-full sm:w-[220px]">
                            <p class="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Заказчик</p>
                            <p id="kp-client-display" class="font-bold text-slate-800 text-xs break-words">
                                _______________</p>
                        </div>
                    </div>`;

const kpHeaderNew = `                    <div class="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-4 w-full sm:w-auto"><img
                            src="https://static.tildacdn.com/tild3262-6164-4464-a231-336136356536/_.png" alt="Логотип"
                            class="w-52 sm:w-60 print:w-52 h-auto object-contain shrink-0">
                        <div class="flex flex-col justify-center border-t-2 sm:border-t-0 sm:border-l-2 border-slate-200 pt-2 sm:pt-0 pl-0 sm:pl-4 shrink-0 text-center sm:text-left w-full sm:w-auto">
                            <p class="text-[11px] font-bold text-slate-800 uppercase tracking-wide leading-snug whitespace-nowrap">
                                Комплексные решения<br>для дома и бизнеса</p>
                            <div class="text-[10px] text-slate-600 mt-1.5 space-y-1 font-medium whitespace-nowrap"
                                id="company-contacts"></div>
                        </div>
                    </div>
                    
                    <!-- Правый блок (Заголовок, дата, заказчик) -->
                    <div class="w-full sm:w-[320px] text-left flex flex-col items-start shrink-0 mt-4 sm:mt-0 sm:ml-auto bg-slate-50 border border-slate-100 rounded-xl p-3 shadow-sm">
                        <div class="flex items-baseline justify-start flex-wrap gap-x-2 w-full">
                            <h2 class="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Коммерческое предложение</h2>
                            <h3 class="text-base sm:text-lg font-black text-brand-primary" id="kp-number-display-right"></h3>
                        </div>
                        <p class="text-[10px] font-bold text-slate-500 uppercase mt-1 mb-1">Счет-договор (Оферта)</p>
                        <p class="text-slate-500 text-xs mb-3">Дата: <span id="kp-date" class="text-slate-900 font-bold"></span></p>
                        
                        <div class="w-full bg-white border border-slate-200 rounded p-2">
                            <p class="text-[9px] text-slate-400 uppercase tracking-wider mb-0.5">Заказчик</p>
                            <p id="kp-client-display" class="font-bold text-slate-800 text-xs break-words">_______________</p>
                        </div>
                    </div>`;

index = index.replace(kpHeaderOld, kpHeaderNew);

fs.writeFileSync('index.html', index, 'utf8');
console.log('index.html successfully updated safely!');
