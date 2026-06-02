#!/usr/bin/env python3
"""
kb_sync.py — 从 IMA 知识库拉取内容，同步到网站页面
依赖: pip install PyMuPDF (已在 exam-pipeline venv2)
"""
import os, sys, json, subprocess, zipfile, xml.etree.ElementTree as ET, tempfile
from datetime import datetime

# 路径配置
REPO = os.path.expanduser('~/daily-exam-review')
SKILL_DIR = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'hermes', 'skills', 'ima-skill', 'scripts')
PY = os.path.expanduser('~/exam-pipeline/venv2/bin/python')
TMP = f'{REPO}/tmp_kb_sync'
os.makedirs(TMP, exist_ok=True)

# KB 配置
KB_ID = '3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E='
SUBJECTS = {
    'math': {
        'folder': 'folder_7461794717137841',
        'label': '📐 数学',
        'page': 'math_basic.html',
        'basic_page': 'math_basic.html',
        'color': '#3498db',
        'paper_folder': 'folder_7461795233036275',
    },
    'chinese': {
        'folder': 'folder_7461799959991117',
        'label': '📝 语文',
        'page': 'chinese_basic.html',
        'basic_page': 'chinese_basic.html',
        'color': '#e74c3c',
        'paper_folder': 'folder_7461792464797113',
    },
    'history': {
        'folder': 'folder_7461792599014306',
        'label': '🏛️ 历史',
        'page': 'history_basic.html',
        'basic_page': 'history_basic.html',
        'color': '#e67e22',
        'paper_folder': 'folder_7461792649344818',
    },
    'english': {
        'folder': 'folder_7461792905171288',
        'label': '📖 英语',
        'page': 'english_basic.html',
        'basic_page': 'english_basic.html',
        'color': '#9b59b6',
        'paper_folder': 'folder_7461794322848125',
    },
    'physics': {
        'folder': 'folder_7461794624862125',
        'label': '⚡ 物理',
        'page': 'physics_basic.html',
        'basic_page': 'physics_basic.html',
        'color': '#f39c12',
        'paper_folder': 'folder_7461794670998044',
    },
    'chemistry': {
        'folder': 'folder_7461792687071154',
        'label': '🧪 化学',
        'page': 'chemistry_basic.html',
        'basic_page': 'chemistry_basic.html',
        'color': '#27ae60',
        'paper_folder': 'folder_7461792729036437',
    },
    'politics': {
        'folder': 'folder_7461792527686439',
        'label': '🎯 政治',
        'page': 'politics_basic.html',
        'basic_page': 'politics_basic.html',
        'color': '#1abc9c',
        'paper_folder': 'folder_7461792557071449',
    },
}


def run_node(cmd, body):
    """调用 ima_api.cjs"""
    opts = json.dumps({'clientId': CID, 'apiKey': KEY})
    r = subprocess.run(
        ['node', f'{SKILL_DIR}/ima_api.cjs', cmd, body, opts],
        capture_output=True, text=True, timeout=30
    )
    if r.returncode != 0:
        return None
    try:
        return json.loads(r.stdout)
    except:
        return None


def get_folder_items(folder_id):
    """获取 KB 文件夹中的所有条目"""
    resp = run_node('openapi/wiki/v1/get_knowledge_list',
                    json.dumps({'knowledge_base_id': KB_ID, 'folder_id': folder_id, 'limit': 50}))
    if not resp or resp.get('code') != 0:
        return []
    return resp.get('data', {}).get('knowledge_list', [])


def get_url(media_id):
    """获取下载 URL"""
    resp = run_node('openapi/wiki/v1/get_media_info', json.dumps({'media_id': media_id}))
    if not resp or resp.get('code') != 0:
        return None
    return resp.get('data', {}).get('url_info', {}).get('url')


def download_file(url, dest):
    """下载文件"""
    r = subprocess.run(['curl', '-sL', '-o', dest, url, '--max-time', '30'], timeout=35)
    if r.returncode != 0:
        return False
    return os.path.getsize(dest) > 500


def extract_docx(path):
    """从 docx 提取纯文本（最多150行）"""
    ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
        root = ET.fromstring(xml_content)
        lines = []
        for p in root.iter(f'{{{ns}}}p'):
            texts = [t.text for t in p.iter(f'{{{ns}}}t') if t.text]
            line = ''.join(texts).strip()
            if line:
                lines.append(line)
            if len(lines) >= 150:
                break
        return '\n'.join(lines)
    except Exception as e:
        return ''


def extract_pdf(path, max_pages=3):
    """从 PDF 提取纯文本（最多3页）"""
    try:
        import fitz
        doc = fitz.open(path)
        texts = []
        for i in range(min(len(doc), max_pages)):
            t = doc[i].get_text()
            if t.strip():
                texts.append(f'--- 第{i+1}页 ---\n{t[:1000]}')
        return '\n'.join(texts)
    except:
        return ''


def fetch_content(media_id, mtype):
    """下载并提取内容"""
    url = get_url(media_id)
    if not url:
        return ''
    dest = f'{TMP}/{media_id[:40]}.tmp'
    if not os.path.exists(dest) or os.path.getsize(dest) < 500:
        if not download_file(url, dest):
            return ''
    if os.path.getsize(dest) < 500:
        return ''
    if mtype == 3:  # docx
        return extract_docx(dest)
    elif mtype == 1:  # pdf
        return extract_pdf(dest)
    return ''


def build_html_content(subj_key, items_with_content):
    """为科目生成 HTML 内容块"""
    subj = SUBJECTS[subj_key]
    color = subj['color']
    today = datetime.now().strftime('%Y年%m月%d日')

    html_parts = []
    html_parts.append(f'''  <div class="content-card" style="border-top: 3px solid {color}">
    <h2>📚 KB 最新内容 · {today}</h2>''')

    for title, text in items_with_content:
        # 转义并截取前400字
        safe = (text[:400]
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;'))
        html_parts.append(f'''
    <div class="knowledge-item">
      <h4 style="color:{color}">📄 {title}</h4>
      <div class="formula-box" style="border-color:{color}">
        <p style="font-size:0.85rem;line-height:1.8;white-space:pre-wrap;margin:0">{safe}</p>
      </div>
    </div>''')

    html_parts.append('  </div>')
    return '\n'.join(html_parts)


def update_page(page_path, new_content_block):
    """在页面指定位置注入新内容"""
    if not os.path.exists(page_path):
        return False
    with open(page_path, encoding='utf-8') as f:
        html = f.read()

    # 优先找 <main class="content-body">，其次找 <div class="container">
    for marker in ['<main class="content-body">', '<div class="container">']:
        idx = html.find(marker)
        if idx != -1:
            insert_pos = idx + len(marker)
            html = html[:insert_pos] + '\n' + new_content_block + html[insert_pos:]
            with open(page_path, 'w', encoding='utf-8') as f:
                f.write(html)
            return True

    return False


########################################
# 主程序
print(f'=== KB Sync {datetime.now().strftime("%Y-%m-%d %H:%M")} ===')

# 加载凭证
homedir = os.path.expanduser('~')
cid_path = f'{homedir}/.config/ima/client_id'
key_path = f'{homedir}/.config/ima/api_key'
# 文件可能是 UTF-16 编码，尝试多种编码
for enc in ('utf-8', 'utf-16', 'utf-16-le', 'utf-16-be'):
    try:
        CID = open(cid_path, encoding=enc).read().strip()
        KEY = open(key_path, encoding=enc).read().strip()
        break
    except (UnicodeDecodeError, LookupError):
        continue

changed = []
for subj_key, subj in SUBJECTS.items():
    print(f'\n>>> {subj["label"]}')
    items = get_folder_items(subj['folder'])
    print(f'  Found {len(items)} items')

    # 取最新3个文件（按 media_id 倒序，假设更新的有更大的 ID）
    # 排序：最新在前
    sorted_items = sorted(items, key=lambda x: x.get('media_id', ''), reverse=True)[:3]

    content_blocks = []
    for item in sorted_items:
        mid = item.get('media_id', '')
        mtype = item.get('media_type', 0)
        title = item.get('title', '未命名')

        if not mid or mtype not in (1, 3):
            continue

        text = fetch_content(mid, mtype)
        if len(text) < 100:
            print(f'  [SKIP] {title}: too short ({len(text)} chars)')
            continue

        print(f'  [OK] {title}: {len(text)} chars')
        content_blocks.append((title, text))

    if content_blocks:
        html_block = build_html_content(subj_key, content_blocks)
        if update_page(f'{REPO}/{subj["page"]}', html_block):
            print(f'  Updated: {subj["page"]}')
            changed.append(subj["page"])
        else:
            print(f'  Failed to update: {subj["page"]}')

print(f'\n=== Done. Updated: {changed} ===')
