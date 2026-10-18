import urllib.request, json
req = urllib.request.Request('https://api.github.com/repos/sureshmagnolia/antigravityflow/actions/runs?per_page=5', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    runs = json.loads(resp.read().decode('utf-8'))
    for r in runs.get('workflow_runs', []):
        print(f"Name: {r.get('name')} | Branch: {r.get('head_branch')} | ID: {r.get('id')}")
