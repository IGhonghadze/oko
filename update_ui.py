import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace active tab classes
content = content.replace('class="admin-tab-btn bg-brand-primary text-white shadow-md px-3 py-1.5 rounded font-bold text-xs"', 'class="admin-tab-btn bg-brand-primary text-white border-brand-primary shadow-md px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border flex items-center gap-1.5"')

# Replace inactive tab classes
content = content.replace('class="admin-tab-btn bg-white text-slate-600 px-3 py-1.5 rounded font-bold text-xs"', 'class="admin-tab-btn bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border shadow-sm flex items-center gap-1.5"')

# Replace tab container bottom border and margin
content = content.replace('<div class="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-2">', '<div class="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-5">')

# Replace Excel button
content = content.replace('text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded', 'text-sm bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 px-4 py-2 rounded-lg font-semibold transition-all')

# Replace Upload button
content = content.replace('text-xs bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-bold px-3 py-1.5 rounded', 'text-sm bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-bold px-4 py-2 rounded-lg transition-all')

# Replace Save top button
content = content.replace('<button onclick="saveAdminPrices()" class="bg-brand-primary hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2">', '<button onclick="saveAdminPrices()" class="bg-brand-primary hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2">')

# Replace Close top button
content = content.replace('<button onclick="closeAdminPanel()" class="bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2">', '<button onclick="closeAdminPanel()" class="bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-600 px-5 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
