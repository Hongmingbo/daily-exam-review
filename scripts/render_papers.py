#!/usr/bin/env python3
"""Render scanned PDF pages to PNG for paper practice pages."""
import subprocess, os, glob, json

homedir = os.path.expanduser('~')
PY = f'{homedir}/exam-pipeline/venv2/bin/python'
IMG_DIR = f'{homedir}/daily-exam-review/images'
SKILL_DIR = f'{homedir}/.hermes/skills/ima-skill'
client_id = open(f'{homedir}/.config/ima/client_id').read().strip()
api_key = open(f'{homedir}/.config/ima/api_key').read().strip()
OPTS = json.dumps({'clientId': client_id, 'apiKey': api_key})
KB_ID = '3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E='

def api(cmd, body):
    r = subprocess.run(
        ['node', f'{SKILL_DIR}/ima_api.cjs', cmd, json.dumps(body), OPTS],
        capture_output=True, text=True, timeout=30
    )
    return json.loads(r.stdout) if r.returncode == 0 else None

def render_pdf(pdf_path, out_dir, name, max_pages=4, scale=1.5):
    os.makedirs(out_dir, exist_ok=True)
    script = '''
import fitz, os, sys
pdf = sys.argv[1]
outdir = sys.argv[2]
scale = float(sys.argv[3])
max_p = int(sys.argv[4])
doc = fitz.open(pdf)
print("PDF pages:", len(doc))
for i in range(min(len(doc), max_p)):
    page = doc[i]
    mat = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat)
    pix.save(os.path.join(outdir, "page_%02d.png" % (i+1)))
print("Rendered", min(len(doc), max_p), "pages to", outdir)
'''
    r = subprocess.run([PY, '-c', script, pdf_path, out_dir, str(scale), str(max_pages)],
                     capture_output=True, text=True, timeout=60)
    print(f'  {name}: {r.stdout.strip()}')
    if r.stderr.strip():
        print(f'  ERR: {r.stderr.strip()[:200]}')
    return r.returncode == 0

def get_latest_pdfs(folder_id, out_dir, max_count=2, max_pages=4):
    resp = api('openapi/wiki/v1/get_knowledge_list', {
        'knowledge_base_id': KB_ID,
        'folder_id': folder_id,
        'limit': 5
    })
    if not resp or resp.get('code') != 0:
        print(f'  Failed: {resp}')
        return
    items = resp.get('data', {}).get('knowledge_list', [])
    pdfs = [it for it in items if it.get('media_type') == 1]
    for item in pdfs[:max_count]:
        mid = item.get('media_id', '')
        title = item.get('title', 'untitled')
        if not mid:
            continue
        print(f'Processing: {title[:50]}')
        info = api('openapi/wiki/v1/get_media_info', {'media_id': mid})
        url = info.get('data', {}).get('url_info', {}).get('url', '') if info else ''
        if not url:
            print(f'  No URL')
            continue
        pdf_file = f'/tmp/paper_{mid[:30]}.pdf'
        if not os.path.exists(pdf_file) or os.path.getsize(pdf_file) < 1000:
            r = subprocess.run(['curl', '-sL', '-o', pdf_file, url, '--max-time', '30'], timeout=35)
            if os.path.getsize(pdf_file) < 1000:
                print(f'  Download failed')
                continue
        size_mb = os.path.getsize(pdf_file) / 1024 / 1024
        print(f'  PDF size: {size_mb:.1f}MB')
        name_short = title.split('】')[0] + '】' if '】' in title else title[:20]
        render_pdf(pdf_file, out_dir, name_short, max_pages)

if __name__ == '__main__':
    print('=== Physics ===')
    get_latest_pdfs('folder_7461794670998044', f'{IMG_DIR}/phys_longyan', max_count=2, max_pages=4)
    print('\n=== Chemistry ===')
    get_latest_pdfs('folder_7461792729036437', f'{IMG_DIR}/chem_nanping', max_count=2, max_pages=4)
    print('\nDone')
