import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = r"catch \(e\) \{\s*console\.error\(\"Cloud Wipe Error:\", e\);\s*alert\(\"[^\"]*Warning: Cloud wipe failed\.\\nError: \" \+ e\.message\);\s*\}"
new_code = """catch (e) {
                        console.error("Cloud Wipe Error:", e);
                        if (e.message && e.message.includes('Missing or insufficient permissions')) {
                            console.warn("Basic user: Skipping Firebase cloud wipe.");
                        } else {
                            alert("Warning: Cloud wipe failed.\\nError: " + e.message);
                        }
                    }"""

content = re.sub(old_code, new_code, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("app.js patched for Reset Button cloud wipe error handling.")
