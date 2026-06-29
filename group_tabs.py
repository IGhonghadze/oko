import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# The original block is:
# <div class="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-5">
# (14 buttons)
# </div>

# Let's extract the buttons using regex
pattern = r'<div class="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-5">\s*(.*?)\s*</div>'
match = re.search(pattern, content, re.DOTALL)

if match:
    buttons_html = match.group(1)
    # Split the buttons by lines
    lines = [line.strip() for line in buttons_html.split('\n') if line.strip()]
    
    group1 = lines[:10]  # Стеклопакеты ... Услуги
    group2 = lines[10:]  # Бренд и КП ... Аккаунт
    
    new_html = f'''<div class="mb-8">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Прайс-листы и Услуги</h3>
                <div class="flex flex-wrap gap-2 mb-6">
                    {'\\n                    '.join(group1)}
                </div>
                
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">Настройки и Управление</h3>
                <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-5">
                    {'\\n                    '.join(group2)}
                </div>
            </div>'''
            
    content = content[:match.start()] + new_html + content[match.end():]
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("UI update successful.")
else:
    print("Could not find the target HTML block.")
