import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'src=\"(.*?\.js)(\?v=\d+)?\"', r'src="\1?v=3"', content)
content = re.sub(r'href=\"(.*?\.css)(\?v=\d+)?\"', r'href="\1?v=3"', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
