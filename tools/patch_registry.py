import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = r"// 4\. Update Master Registry \(ONLY if full session delete\)\s*alert"
new_code = """// 4. Update Master Registry (ONLY if full session delete)
        if (!targetExamName) {
            let knownRegistry = JSON.parse(localStorage.getItem('examAllKnownSessions') || '[]');
            knownRegistry = knownRegistry.filter(s => !sessionSet.has(s));
            localStorage.setItem('examAllKnownSessions', JSON.stringify(knownRegistry));
        }

        alert"""

content = re.sub(old_code, new_code, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("app.js patched for examAllKnownSessions.")
