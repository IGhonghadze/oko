import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<!-- Header Section -->.*?</div>\s*</div>\s*</div>\s*<div class="grid grid-cols-1 md:grid-cols-12 gap-6">', re.DOTALL)

new_header = """<!-- Header Section -->
            <div class="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <!-- Left: Logo & Title -->
                <div class="flex items-center gap-4 w-full xl:w-auto justify-center xl:justify-start">
                    <div class="w-14 h-14 flex-shrink-0 flex items-center justify-center">
                        <img src="https://static.tildacdn.com/tild3262-6164-4464-a231-336136356536/_.png" alt="Logo" class="max-w-full max-h-full object-contain">
                    </div>
                    <div class="flex flex-col">
                        <h1 class="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">OKO</h1>
                        <p class="text-slate-500 text-[11px] font-medium mt-1 uppercase tracking-widest">Профессиональный калькулятор</p>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
                    <!-- Center: Global Markup -->
                    <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl w-full md:w-auto justify-center">
                        <span class="text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1">Наценка:
                            <span class="cursor-help text-slate-400 hover:text-brand-primary" title="Глобальная наценка — множитель к дилерской цене. 100% = цена × 2. Применяется ко всем позициям. Это НЕ то же самое, что Доп. наценка в смете.">ⓘ</span>
                        </span>
                        <select id="select-global-markup" class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 font-black text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-sm" onchange="handleSettingsChange()">
                            <option value="1.0">0% (Базовая)</option>
                            <option value="1.1">10%</option>
                            <option value="1.2">20%</option>
                            <option value="1.25">25%</option>
                            <option value="1.3">30%</option>
                            <option value="1.4">40%</option>
                            <option value="1.5">50%</option>
                            <option value="1.7">70%</option>
                            <option value="1.75">75%</option>
                            <option value="2.0" selected>100%</option>
                            <option value="2.25">125%</option>
                            <option value="2.5">150%</option>
                            <option value="3.0">200%</option>
                        </select>
                    </div>

                    <!-- Right: User & Admin Actions -->
                    <div class="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
                        <div class="flex flex-col items-end">
                            <div class="flex items-center gap-2">
                                <span class="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">Компания</span>
                                <span id="current-company-name" class="text-slate-800 font-bold text-sm bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Загрузка...</span>
                                <span id="trial-counter" style="display: none;" class="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md border border-red-100"></span>
                            </div>
                            <a href="https://t.me/+995598385893" target="_blank" id="extend-access-btn" style="display: none;" class="text-[11px] text-brand-primary hover:text-brand-dark hover:underline font-bold mt-1">Продлить подписку</a>
                        </div>
                        
                        <div class="h-8 w-px bg-slate-200 hidden md:block"></div>
                        
                        <button id="admin-panel-btn" onclick="openAdminPanel()" class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md">
                            <i data-lucide="settings-2" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Панель управления</span>
                        </button>
                        
                        <button onclick="doLogout()" class="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors border border-slate-200 shadow-sm" title="Выйти из аккаунта">
                            <i data-lucide="log-out" class="w-4 h-4"></i>
                        </button>
                        <input type="hidden" id="select-company" value="daneliya">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">"""

if pattern.search(content):
    content = pattern.sub(new_header, content)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Header rewritten successfully.")
else:
    print("Pattern not found!")
