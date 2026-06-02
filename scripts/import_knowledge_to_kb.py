#!/usr/bin/env python3
"""
import_knowledge_to_kb.py — 将 GitHub 上的知识点 Markdown 文件导入 IMA KB

前提：knowledge/*.md 文件已通过 git push 推送到 GitHub
策略：用 import_urls 将 raw.githubusercontent.com URL 导入各科文件夹

用法: python scripts/import_knowledge_to_kb.py
"""
import sys, os, json, subprocess
from datetime import date

REPO = os.path.expanduser('~/daily-exam-review')
SKILL_DIR = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')),
                         'hermes', 'skills', 'ima-skill', 'scripts')
KNOWLEDGE_DIR = os.path.join(REPO, 'knowledge')
KB_ID = '3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E='

GITHUB_RAW = 'https://raw.githubusercontent.com/Hongmingbo/daily-exam-review/main/knowledge'

SUBJECTS = {
    'math':      {'folder': 'folder_7461794717137841', 'name': '数学'},
    'chinese':   {'folder': 'folder_7461799959991117', 'name': '语文'},
    'english':   {'folder': 'folder_7461792905171288', 'name': '英语'},
    'physics':   {'folder': 'folder_7461794624862125', 'name': '物理'},
    'chemistry': {'folder': 'folder_7461792687071154', 'name': '化学'},
    'history':   {'folder': 'folder_7461792599014306', 'name': '历史'},
    'politics':  {'folder': 'folder_7461792527686439', 'name': '政治'},
}


def load_creds():
    homedir = os.path.expanduser('~')
    for enc in ('utf-8', 'utf-16-le', 'utf-16'):
        try:
            cid = open(f'{homedir}/.config/ima/client_id', encoding=enc).read()
            cid = cid.replace('\ufeff', '').replace('\ufffe', '').strip()
            key = open(f'{homedir}/.config/ima/api_key', encoding=enc).read()
            key = key.replace('\ufeff', '').replace('\ufffe', '').strip()
            if cid and key:
                return cid, key
        except:
            continue
    raise RuntimeError('IMA credentials not found')


def run_node(api_path, body):
    cid, key = load_creds()
    opts = json.dumps({'clientId': cid, 'apiKey': key})
    ima_api = os.path.join(SKILL_DIR, 'ima_api.cjs')
    r = subprocess.run(
        ['node', ima_api, api_path, json.dumps(body, ensure_ascii=False), opts],
        capture_output=True, text=True, timeout=30
    )
    if r.returncode != 0:
        return None
    try:
        return json.loads(r.stdout)
    except:
        return None


def check_url_in_folder(folder_id, url):
    """检查文件夹中是否已有该 URL 导入的条目"""
    resp = run_node('openapi/wiki/v1/get_knowledge_list', {
        'knowledge_base_id': KB_ID,
        'folder_id': folder_id,
        'cursor': '',
        'limit': 100,
    })
    if resp and resp.get('code') == 0:
        for item in resp.get('data', {}).get('knowledge_list', []):
            if item.get('title') == url:
                return True
    return False


def import_url(raw_url, folder_id, file_label):
    """用 import_urls 导入单个 URL"""
    if check_url_in_folder(folder_id, raw_url):
        print(f'  [SKIP] 已存在: {file_label}')
        return True

    resp = run_node('openapi/wiki/v1/import_urls', {
        'knowledge_base_id': KB_ID,
        'urls': [raw_url],
        'folder_id': folder_id,
    })
    if resp and resp.get('code') == 0:
        results = resp.get('data', {}).get('results', {})
        for url_key, result in results.items():
            if result.get('ret_code') == 0:
                print(f'  [OK] 导入成功: {file_label}')
                return True
            else:
                print(f'  [FAIL] ret_code={result.get("ret_code")}')
                return False
    print(f'  [FAIL] {resp}')
    return False


########################################
if __name__ == '__main__':
    print(f'=== import_knowledge_to_kb {date.today().isoformat()} ===')
    results = []

    for subj_key, subj in SUBJECTS.items():
        md_path = os.path.join(KNOWLEDGE_DIR, f'{subj_key}.md')
        if not os.path.exists(md_path):
            continue

        raw_url = f'{GITHUB_RAW}/{subj_key}.md'
        print(f'\n>>> {subj["name"]}: {subj_key}.md')

        if import_url(raw_url, subj['folder'], f'{subj["name"]}知识点'):
            results.append(subj_key)

    print(f'\n=== Done. 导入: {len(results)} 科 — {results} ===')
