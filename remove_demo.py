with open('/workspaces/Letsgrow/index.html', 'r') as f:
    html = f.read()

# 1. Remove demo buttons div (lines 359-361)
import re

html = re.sub(
    r'\s*<div class="demo-row">.*?</div>',
    '',
    html,
    flags=re.DOTALL
)

# 2. Remove demoLogin function (line 1150 block)
html = re.sub(
    r'window\.demoLogin\s*=\s*function\(role\)\{.*?\};',
    '',
    html,
    flags=re.DOTALL
)

# 3. Remove savedRole sessionStorage line
html = re.sub(
    r'.*const savedRole = sessionStorage\.getItem\(.*?\);\n',
    '',
    html
)

# 4. Remove demo CSS block
html = re.sub(
    r'\.demo-row\{.*?\}',
    '',
    html,
    flags=re.DOTALL
)
html = re.sub(r'\.demo-btn\{.*?\}', '', html, flags=re.DOTALL)
html = re.sub(r'\.demo-btn:hover\{.*?\}', '', html, flags=re.DOTALL)

with open('/workspaces/Letsgrow/index.html', 'w') as f:
    f.write(html)

print("Demo mode removed")
