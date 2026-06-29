import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<!-- Навигация и управление -->.*?<div class="grid grid-cols-1 md:grid-cols-12 gap-6">', re.DOTALL)

new_header = """<!-- Top System Bar -->
    <div class="bg-slate-900 text-slate-300 text-xs py-2 px-4 md:px-8 flex justify-between items-center w-full">
        <div class="flex items-center gap-3">
            <span class="hidden sm:inline">Вы вошли как:</span> 
            <span id="current-company-name" class="text-white font-bold bg-slate-800 px-2 py-0.5 rounded">Загрузка...</span>
            <span id="trial-counter" style="display:none;" class="text-emerald-400 font-bold ml-2"></span>
            <a href="https://t.me/+995598385893" target="_blank" id="extend-access-btn" style="display: none;" class="text-[#0088cc] hover:text-white underline transition-colors ml-2 font-bold">Продлить доступ</a>
            <input type="hidden" id="select-company" value="daneliya">
        </div>
        <div class="flex items-center gap-4">
            <a href="http://склад.ооко.рф" target="_blank" class="hover:text-white transition-colors flex items-center gap-1 font-medium"><i data-lucide="package" class="w-3 h-3"></i> Склад ОКО</a>
            <button onclick="doLogout()" class="hover:text-red-400 transition-colors flex items-center gap-1 font-medium"><i data-lucide="log-out" class="w-3 h-3"></i> Выйти</button>
        </div>
    </div>

    <!-- Main Application Header -->
    <div class="bg-white border-b border-slate-200 shadow-sm mb-6 px-4 md:px-8 py-5 flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
            <div class="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-sm border border-brand-primary/20">
                <svg viewBox="0 0 24 24" class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </div>
            <div class="flex flex-col">
                <h1 class="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">OKO</h1>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Professional Pricing</p>
            </div>
        </div>

        <!-- Center: Global Markup -->
        <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl w-full md:w-auto justify-center">
            <span class="text-slate-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1">Глобальная наценка:
                <span class="cursor-help text-slate-400 hover:text-brand-primary" title="Множитель к дилерской цене. 100% = цена × 2.">ⓘ</span>
            </span>
            <select id="select-global-markup" class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-black text-sm focus:outline-none focus:border-brand-primary shadow-sm" onchange="handleSettingsChange()">
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

        <!-- Right: Action Buttons -->
        <div class="flex items-center gap-3 w-full lg:w-auto justify-center lg:justify-end">
            <button id="admin-panel-btn" onclick="openAdminPanel()" class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg">
                <i data-lucide="settings-2" class="w-5 h-5"></i>
                Панель управления
            </button>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="max-w-7xl mx-auto px-4 md:px-6 w-full">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">"""

if pattern.search(content):
    content = pattern.sub(new_header, content)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Header redesigned successfully.")
else:
    print("Pattern not found!")
