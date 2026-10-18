import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix publishSeatingToPublic
old_publish = r"\} catch \(e\) \{\s*console\.error\('Public Seating Publish Error:', e\);\s*throw e;[^\n]*\n\s*\}"
new_publish = """} catch (e) {
            console.error('Public Seating Publish Error:', e);
            if (e.message && e.message.includes('Missing or insufficient permissions')) {
                console.warn("Basic user: Skipping public seating publish.");
            } else {
                throw e; // Re-throw so the UI (Save Button) knows the publish failed
            }
        }"""
content = re.sub(old_publish, new_publish, content)

# Fix executeBulkDelete
old_sync = r"// 4\. Final Cloud Sync\s*if \(typeof syncDataToCloud === 'function'\) \{\s*await syncDataToCloud\('ops'\);\s*await syncDataToCloud\('allocation'\);\s*//.*?\[RESURRECTION FIX\][^\n]*\n\s*//[^\n]*\n\s*await syncDataToCloud\('baseData'\);\s*\}"
new_sync = """// 4. Final Cloud Sync
        if (typeof syncDataToCloud === 'function') {
            try {
                await syncDataToCloud('ops');
                await syncDataToCloud('allocation');
                await syncDataToCloud('baseData');
            } catch (syncErr) {
                if (syncErr.message && syncErr.message.includes('Missing or insufficient permissions')) {
                    console.warn("Basic user: Skipping Firebase cloud sync during delete.");
                } else {
                    throw syncErr;
                }
            }
        }"""
content = re.sub(old_sync, new_sync, content, flags=re.DOTALL)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("app.js patched successfully.")
