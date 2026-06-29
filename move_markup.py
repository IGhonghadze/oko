import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

markup_match = re.search(r'        <!-- Center: Global Markup -->\s*<div.*?class=\"flex items-center gap-3 bg-slate-50.*?</select>\s*</div>', html, re.DOTALL)
if markup_match:
    markup_code = markup_match.group(0)
    # Remove from original location
    html = html.replace(markup_code, '')
    
    # Insert above estimate
    estimate_pattern = r'<!-- RIGHT COLUMN: ESTIMATE -->\s*<div class=\"md:col-span-4 relative flex flex-col gap-6\" id=\"right-column\">\s*<div class=\"bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sticky top-6\">'
    replacement = f'<!-- RIGHT COLUMN: ESTIMATE -->\n                <div class=\"md:col-span-4 relative flex flex-col gap-6\" id=\"right-column\">\n                    \n{markup_code}\n                    <div class=\"bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sticky top-6\">'
    html = re.sub(estimate_pattern, replacement, html)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Global markup moved successfully.')
else:
    print('Global markup not found.')
