#!/usr/bin/env python3
"""
knowledge_to_kb.py — 知识点内容上传到 IMA 知识库

策略：将知识点保存为 Markdown 文件 → 推到 GitHub → 用 import_urls(raw URL) 导入 IMA KB
（create_media 需要更高权限，import_urls 始终可用）

流程：
  1. 从 *_basic.html 提取知识点，转为 Markdown
  2. 保存到 knowledge/ 目录（提交到 GitHub，可被 IMA 通过 URL 读取）
  3. 用 import_urls 将 raw GitHub URL 导入 IMA KB 各科文件夹
  4. 同时保存到 knowledge_cache/（本地缓存，knowledge_builder 优先读取）

用法: python scripts/knowledge_to_kb.py
"""
import sys, os, re, json, subprocess, time
from datetime import date

REPO = os.path.expanduser('~/daily-exam-review')
SKILL_DIR = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')),
                         'hermes', 'skills', 'ima-skill', 'scripts')
KNOWLEDGE_DIR = os.path.join(REPO, 'knowledge')    # 提交到 GitHub（公开）
CACHE_DIR = os.path.join(REPO, 'knowledge_cache')   # 本地缓存（.gitignore）
KB_ID = '3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E='

GITHUB_RAW = 'https://raw.githubusercontent.com/Hongmingbo/daily-exam-review/main/knowledge'

SUBJECTS = {
    'math':      {'folder': 'folder_7461794717137841', 'name': '数学', 'emoji': '📐'},
    'chinese':   {'folder': 'folder_7461799959991117', 'name': '语文', 'emoji': '📝'},
    'english':   {'folder': 'folder_7461792905171288', 'name': '英语', 'emoji': '📖'},
    'physics':   {'folder': 'folder_7461794624862125', 'name': '物理', 'emoji': '⚡'},
    'chemistry': {'folder': 'folder_7461792687071154', 'name': '化学', 'emoji': '🧪'},
    'history':   {'folder': 'folder_7461792599014306', 'name': '历史', 'emoji': '🏛️'},
    'politics':  {'folder': 'folder_7461792527686439', 'name': '政治', 'emoji': '🎯'},
}

os.makedirs(KNOWLEDGE_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)


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
        except (UnicodeDecodeError, FileNotFoundError):
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
        try:
            err = json.loads(r.stderr)
            return {'code': -1, 'msg': err.get('msg', 'unknown error')}
        except:
            return None
    try:
        return json.loads(r.stdout)
    except:
        return None


def html_to_markdown(html_path):
    """从 *_basic.html 提取知识点，转为 Markdown"""
    with open(html_path, encoding='utf-8') as f:
        html = f.read()

    md_parts = []
    card_pattern = r'<div class="content-card"[^>]*>(.*?)(?=<div class="content-card"|<div class="page-nav")'
    cards = re.findall(card_pattern, html, re.DOTALL)

    for card in cards:
        h2 = re.search(r'<h2[^>]*>(.*?)</h2>', card, re.DOTALL)
        if not h2:
            continue
        title = re.sub(r'<[^>]+>', '', h2.group(1)).strip()
        title = title.replace('📌', '').replace('💡', '').strip()

        formulas = re.findall(r'<div class="formula-box"[^>]*>(.*?)(?=</div>\s*(?:</div>|<div class="formula-box"))',
                              card, re.DOTALL)

        md = f'## {title}\n\n'
        for formula in formulas:
            strong = re.search(r'<strong>(.*?)</strong>', formula, re.DOTALL)
            if strong:
                label = re.sub(r'<[^>]+>', '', strong.group(1)).strip()
                md += f'**{label}**\n\n'

            math = re.search(r'<div class="math-block"[^>]*>(.*?)</div>', formula, re.DOTALL)
            if math:
                content = re.sub(r'<[^>]+>', '', math.group(1)).strip()
                md += f'> {content}\n\n'

            for p in re.finditer(r'<p[^>]*>(.*?)</p>', formula, re.DOTALL):
                text = re.sub(r'<[^>]+>', '', p.group(1)).strip()
                if text:
                    md += f'{text}\n\n'

        md_parts.append(md)

    return '\n---\n\n'.join(md_parts) if md_parts else ''


def extract_knowledge_json(html_path):
    """从 HTML 提取知识点为结构化 JSON"""
    with open(html_path, encoding='utf-8') as f:
        html = f.read()

    topics = []
    card_pattern = r'<div class="content-card" data-topic="([^"]*)"[^>]*>(.*?)(?=<div class="content-card"|<div class="page-nav")'
    for topic, card in re.findall(card_pattern, html, re.DOTALL):
        h2 = re.search(r'<h2[^>]*>(.*?)</h2>', card, re.DOTALL)
        if not h2:
            continue
        title = re.sub(r'<[^>]+>', '', h2.group(1)).strip()
        title = title.replace('📌', '').replace('💡', '').strip()

        formula = ''
        math = re.search(r'<div class="math-block"[^>]*>(.*?)</div>', card, re.DOTALL)
        if math:
            formula = re.sub(r'<[^>]+>', '', math.group(1)).strip()

        explanation = ''
        for p in re.finditer(r'<p[^>]*><strong>说明：</strong>(.*?)</p>', card, re.DOTALL):
            explanation = re.sub(r'<[^>]+>', '', p.group(1)).strip()
            break

        tip = ''
        for p in re.finditer(r'<p[^>]*><strong>(?:易错|提分)[^<]*：</strong>(.*?)</p>', card, re.DOTALL):
            tip = re.sub(r'<[^>]+>', '', p.group(1)).strip()
            break

        if title and formula:
            topics.append({
                'topic': topic, 'title': title,
                'formula': formula, 'explanation': explanation,
                'tip': tip or explanation,
            })

    return topics


def check_url_in_folder(folder_id, raw_url):
    """检查文件夹中是否已导入该 URL"""
    resp = run_node('openapi/wiki/v1/get_knowledge_list', {
        'knowledge_base_id': KB_ID,
        'folder_id': folder_id,
        'cursor': '',
        'limit': 100,
    })
    if resp and resp.get('code') == 0:
        for item in resp.get('data', {}).get('knowledge_list', []):
            if item.get('title') == raw_url:
                return True
    return False


def import_url_to_kb(raw_url, folder_id):
    """用 import_urls 将 raw GitHub URL 导入 IMA KB"""
    if check_url_in_folder(folder_id, raw_url):
        print(f'    [SKIP] 已存在: {raw_url.split("/")[-1]}')
        return True

    resp = run_node('openapi/wiki/v1/import_urls', {
        'knowledge_base_id': KB_ID,
        'urls': [raw_url],
        'folder_id': folder_id,
    })
    if resp and resp.get('code') == 0:
        results = resp.get('data', {}).get('results', {})
        for url, result in results.items():
            if result.get('ret_code') == 0:
                print(f'    [OK] 导入成功: {raw_url.split("/")[-1]}')
                return True
            else:
                print(f'    [FAIL] ret_code={result.get("ret_code")}')
                return False
    print(f'    [FAIL] import_urls: {resp}')
    return False


def save_files(subject_key, md_content, knowledge_json):
    """保存到 knowledge/（GitHub）和 knowledge_cache/（本地）"""
    # 公开目录（提交到 GitHub，供 IMA 通过 URL 读取）
    md_path = os.path.join(KNOWLEDGE_DIR, f'{subject_key}.md')
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

    # 本地缓存
    with open(os.path.join(CACHE_DIR, f'{subject_key}_knowledge.md'), 'w', encoding='utf-8') as f:
        f.write(md_content)
    with open(os.path.join(CACHE_DIR, f'{subject_key}_knowledge.json'), 'w', encoding='utf-8') as f:
        json.dump(knowledge_json, f, ensure_ascii=False, indent=2)


########################################
if __name__ == '__main__':
    print(f'=== knowledge_to_kb {date.today().isoformat()} ===')
    local_saved = []
    uploaded = []

    for subj_key, subj in SUBJECTS.items():
        html_path = os.path.join(REPO, f'{subj_key}_basic.html')
        if not os.path.exists(html_path):
            print(f'\n>>> {subj["emoji"]} {subj["name"]} — HTML 不存在，跳过')
            continue

        print(f'\n>>> {subj["emoji"]} {subj["name"]}')

        md_content = html_to_markdown(html_path)
        if not md_content:
            print('  [SKIP] 无知识点内容')
            continue

        knowledge_json = extract_knowledge_json(html_path)
        print(f'  提取: {len(md_content)} chars, {len(knowledge_json)} topics')

        # 保存文件
        save_files(subj_key, md_content, knowledge_json)
        local_saved.append(subj_key)
        print(f'  ✓ knowledge/{subj_key}.md + knowledge_cache/')

    # 注意：import_urls 需要先 git push，让文件在 GitHub 上可访问
    # 这里只保存文件，import_urls 在 scheduled_sync.py 中 git push 后执行
    if local_saved:
        print(f'\n=== 文件已保存 ===')
        print(f'  knowledge/: {local_saved}')
        print(f'  ⏳ git push 后再执行 import_urls（由 scheduled_sync 控制）')

    print(f'\n=== Done ===')
