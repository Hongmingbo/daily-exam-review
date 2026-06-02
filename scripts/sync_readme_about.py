#!/usr/bin/env python3
"""
sync_readme_about.py — 同步 GitHub README.md 到网站 about.html
保留 about.html 原有模板，只替换更新日志区块
用法: python3 scripts/sync_readme_about.py [repo_path]
"""
import sys, re, os
from datetime import datetime

REPO = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/daily-exam-review')
ABOUT = f'{REPO}/about.html'
README = f'{REPO}/README.md'
MARKER = '<!-- merojm -->'

CN_DAYS = ['周日','周一','周二','周三','周四','周五','周六']
today = datetime.now()
date_str = today.strftime('%Y年%m月%d日')
weekday_str = CN_DAYS[today.weekday()]

def extract_readme_body():
    """提取 README 主体内容（去头部链接和安装部分）"""
    if not os.path.exists(README):
        return None
    with open(README, encoding='utf-8') as f:
        content = f.read()
    # 去除 merojm 标记之前的部分
    if MARKER in content:
        content = content[:content.find(MARKER)]
    return content.strip()

def md_to_html_fragment(md_text):
    """Markdown → HTML 片段（用于 about.html 的更新日志区块）"""
    lines = md_text.split('\n')
    html_parts = []
    in_ul = False
    list_buffer = []

    def flush_list(buffer):
        if not buffer:
            return ''
        items = '\n'.join(f'      <li>{item}</li>' for item in buffer)
        return f'    <ul>\n{items}\n    </ul>'

    for line in lines:
        h2 = re.match(r'#{2,6}\s+(.*)', line)
        if h2:
            if in_ul:
                html_parts.append(flush_list(list_buffer))
                list_buffer = []
                in_ul = False
            title = h2.group(1).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            # 标题前插入今日标记
            extra = ''
            html_parts.append(f'  <div class="changelog-item">\n    <div class="changelog-title">{title}{extra}</div>')
            continue

        li = re.match(r'[-*]\s+(.*)', line.strip())
        if li:
            text = li.group(1).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
            text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
            text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
            text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
            list_buffer.append(text)
            in_ul = True
            continue

        if line.strip() == '':
            if in_ul:
                html_parts.append(flush_list(list_buffer))
                html_parts.append('  </div>')
                list_buffer = []
                in_ul = False
            continue

        # 普通段落
        text = line.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
        if text.strip():
            if in_ul:
                html_parts.append(flush_list(list_buffer))
                html_parts.append('  </div>')
                list_buffer = []
                in_ul = False
            html_parts.append(f'  <p>{text}</p>')

    if in_ul:
        html_parts.append(flush_list(list_buffer))
        html_parts.append('  </div>')

    return '\n'.join(html_parts)

def get_section_body(about_html, section_h2):
    """提取 about.html 中指定 h2 标题后的内容块"""
    pattern = f'<h2>{re.escape(section_h2)}</h2>(.*?)(?=<h2>|</main>|<div class="footer"|$)'
    m = re.search(pattern, about_html, re.DOTALL)
    return m.group(1).strip() if m else None

def update_about_html(new_body):
    """只替换 about.html 中"更新日志"区块，保留其余所有内容"""
    if not os.path.exists(ABOUT):
        print(f'WARNING: {ABOUT} not found, skipping about update')
        return False

    with open(ABOUT, encoding='utf-8') as f:
        html = f.read()

    # 找到 <h2>🆕 更新日志</h2> 之后的内容（到下一个 <h2> 或 </main> 之前）
    marker = '<h2>🆕 更新日志</h2>'
    idx = html.find(marker)
    if idx == -1:
        # 尝试其他变体
        for variant in ['<h2>更新日志</h2>', '<h2>📖 更新日志</h2>']:
            idx = html.find(variant)
            if idx != -1:
                marker = variant
                break

    if idx == -1:
        print('WARNING: Could not find changelog section in about.html')
        return False

    insert_pos = idx + len(marker)
    # 找到下一个 <h2 或 </main>
    next_h2 = re.search(r'<h2>', html[insert_pos:])
    next_main = re.search(r'</main>', html[insert_pos:])
    end_pos = len(html)

    if next_h2:
        candidate = insert_pos + next_h2.start()
        if next_main and next_main.start() < next_h2.start():
            end_pos = insert_pos + next_main.start()
        else:
            end_pos = candidate
    elif next_main:
        end_pos = insert_pos + next_main.start()

    new_html = (
        html[:insert_pos]
        + f'\n<div class="changelog-item">\n<div class="changelog-date">{date_str}（{weekday_str}）· 自动同步</div>\n<div class="changelog-body">\n'
        + new_body
        + '\n  </div>\n  </div>'
        + html[end_pos:]
    )

    with open(ABOUT, 'w', encoding='utf-8') as f:
        f.write(new_html)

    return True

def main():
    print(f'=== sync_readme_about {today.strftime("%Y-%m-%d %H:%M")} ===')

    md = extract_readme_body()
    if md is None:
        print('ERROR: README.md not found')
        return

    print(f'Readme: {len(md)} chars')

    body_html = md_to_html_fragment(md)
    ok = update_about_html(body_html)

    if ok:
        print('Updated: about.html (changelog section replaced)')
    else:
        print('Skipped: about.html (no changelog section found)')

    print('Done.')

if __name__ == '__main__':
    main()
