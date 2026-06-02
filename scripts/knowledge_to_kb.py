#!/usr/bin/env python3
"""
knowledge_to_kb.py — 将知识点内容保存到本地缓存，尝试上传到 IMA KB

流程：
  1. 读取各科 *_basic.html 中的知识点内容
  2. 转换为 Markdown，保存到本地缓存 (knowledge_cache/)
  3. 尝试上传到 IMA KB 各科文件夹（需要 create_media 权限）
  4. knowledge_builder 优先读取本地缓存，无需联网即可快速更新

用法: python scripts/knowledge_to_kb.py
"""
import sys, os, re, json, subprocess, time, tempfile
from datetime import date
from pathlib import Path

REPO = os.path.expanduser('~/daily-exam-review')
SKILL_DIR = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')),
                         'hermes', 'skills', 'ima-skill', 'scripts')
CACHE_DIR = os.path.join(REPO, 'knowledge_cache')
KB_ID = '3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E='

SUBJECTS = {
    'math':      {'folder': 'folder_7461794717137841', 'name': '数学', 'emoji': '📐'},
    'chinese':   {'folder': 'folder_7461799959991117', 'name': '语文', 'emoji': '📝'},
    'english':   {'folder': 'folder_7461792905171288', 'name': '英语', 'emoji': '📖'},
    'physics':   {'folder': 'folder_7461794624862125', 'name': '物理', 'emoji': '⚡'},
    'chemistry': {'folder': 'folder_7461792687071154', 'name': '化学', 'emoji': '🧪'},
    'history':   {'folder': 'folder_7461792599014306', 'name': '历史', 'emoji': '🏛️'},
    'politics':  {'folder': 'folder_7461792527686439', 'name': '政治', 'emoji': '🎯'},
}

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


def check_file_exists(folder_id, file_name):
    """检查文件夹中是否已有同名文件"""
    resp = run_node('openapi/wiki/v1/get_knowledge_list', {
        'knowledge_base_id': KB_ID,
        'folder_id': folder_id,
        'cursor': '',
        'limit': 100,
    })
    if resp and resp.get('code') == 0:
        for item in resp.get('data', {}).get('knowledge_list', []):
            if item.get('title') == file_name:
                return True
    return False


def try_upload_md(md_content, file_name, folder_id):
    """尝试上传 .md 文件到 IMA KB（需要 create_media 权限）"""
    tmp_path = os.path.join(tempfile.gettempdir(), file_name)
    with open(tmp_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    file_size = os.path.getsize(tmp_path)

    if check_file_exists(folder_id, file_name):
        print(f'    [SKIP] 已存在: {file_name}')
        return True

    # 尝试 create_media
    resp = run_node('openapi/wiki/v1/create_media', {
        'knowledge_base_id': KB_ID,
        'file_name': file_name,
        'file_size': file_size,
        'media_type': 8,  # Markdown
    })
    if not resp or resp.get('code') != 0:
        # create_media 不可用（权限或 API 限制），跳过上传
        try:
            os.remove(tmp_path)
        except:
            pass
        return False

    data = resp['data']
    creds = data['credentials']
    cos_upload = os.path.join(SKILL_DIR, 'cos-upload.cjs')

    r = subprocess.run(
        ['node', cos_upload,
         '--bucket', data['bucket'], '--region', data['region'],
         '--key', data['media_upload_path'], '--file', tmp_path,
         '--tmp-secret-id', creds['tmpSecretId'],
         '--tmp-secret-key', creds['tmpSecretKey'],
         '--token', creds['token']],
        capture_output=True, text=True, timeout=60
    )
    if r.returncode != 0:
        print(f'    [FAIL] COS 上传失败: {r.stderr[:200]}')
        return False

    for attempt in range(5):
        resp = run_node('openapi/wiki/v1/add_knowledge', {
            'knowledge_base_id': KB_ID,
            'media_type': 8,
            'file_name': file_name,
            'folder_id': folder_id,
        })
        if resp and resp.get('code') == 0:
            print(f'    [OK] 上传成功: {file_name}')
            try:
                os.remove(tmp_path)
            except:
                pass
            return True
        time.sleep(2)

    return False


def save_local_cache(subject_key, md_content, knowledge_json):
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

        # 保存本地缓存（始终执行，这是 knowledge_builder 的数据源）
        save_local_cache(subj_key, md_content, knowledge_json)
        local_saved.append(subj_key)
        print(f'  ✓ 缓存: knowledge_cache/{subj_key}_knowledge.md')

        # 尝试上传到 IMA KB（需要 create_media 权限，失败不影响流程）
        today = date.today().strftime('%Y%m%d')
        file_name = f'{subj["name"]}知识点_{today}.md'
        if try_upload_md(md_content, file_name, subj['folder']):
            uploaded.append(subj_key)
        else:
            print(f'  ⚠ KB 上传跳过（create_media 权限不可用）')

    print(f'\n=== Done ===')
    print(f'  本地缓存: {len(local_saved)} 科 — {local_saved}')
    print(f'  KB 上传:  {len(uploaded)} 科 — {uploaded}')
