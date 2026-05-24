#!/usr/bin/env python3
"""
daily_push.py — 生成每日复习摘要，发送给微信
输出摘要到 ~/.hermes/cron/output/daily_push.txt
"""
import os, sys, re
from datetime import datetime

REPO = os.path.expanduser('~/daily-exam-review')

today = datetime.now()
date_str = today.strftime('%Y年%m月%d日')
weekdays = ['周一','周二','周三','周四','周五','周六','周日']
weekday = weekdays[today.weekday()]
exam = __import__('datetime').date(2026, 6, 21)
days_left = (exam - today.date()).days

SUBJECTS = [
    ('物理', 'physics_basic.html', 'physics_paper.html', '⚡', '#f39c12'),
    ('语文', 'chinese_basic.html', 'chinese_paper.html', '📝', '#e74c3c'),
    ('数学', 'math_basic.html', 'math_paper.html', '📐', '#3498db'),
    ('英语', 'english_basic.html', 'english_paper.html', '📖', '#27ae60'),
    ('化学', 'chemistry_basic.html', 'chemistry_paper.html', '🧪', '#9b59b6'),
    ('历史', 'history_basic.html', 'history_paper.html', '🏛️', '#e67e22'),
    ('政治', 'politics_basic.html', 'politics_paper.html', '🎯', '#1abc9c'),
]
today_subj = SUBJECTS[today.weekday()]

def extract_formulas(page_path, max_count=3):
    if not os.path.exists(page_path):
        return []
    with open(page_path, encoding='utf-8') as f:
        content = f.read()
    results = []
    strongs = re.findall(r'<strong>([^<]+)</strong>', content)
    for s in strongs[:max_count]:
        title = s.strip()
        if title and len(title) < 80:
            results.append(title)
    return results[:max_count]

def extract_mistakes(page_path, max_count=2):
    if not os.path.exists(page_path):
        return []
    with open(page_path, encoding='utf-8') as f:
        content = f.read()
    results = []
    traps = re.findall(r'<div class="trap-box[^"]*">(.*?)</div>', content, re.DOTALL)
    for t in traps:
        text = re.sub(r'<[^>]+>', '', t).strip()
        text = re.sub(r'\s+', ' ', text)
        if text and len(text) > 5:
            results.append(text)
        if len(results) >= max_count:
            break
    return results[:max_count]

def extract_paper_title(paper_path):
    """Extract the paper title from paper HTML."""
    if not os.path.exists(paper_path):
        return None
    with open(paper_path, encoding='utf-8') as f:
        content = f.read()
    # Find <p>title</p> inside paper-header
    m = re.search(r'class="paper-header[^"]*">\s*.*?<p>([^<]+)</p>', content, re.DOTALL)
    if m:
        return m.group(1).strip()[:60]
    # Fallback: badge text
    m = re.search(r'class="badge">([^<]+)</span>', content)
    if m:
        return m.group(1).strip()
    return None

def extract_paper_page_count(paper_path):
    """Count paper image pages."""
    if not os.path.exists(paper_path):
        return 0
    with open(paper_path, encoding='utf-8') as f:
        content = f.read()
    return len(re.findall(r'paper-img-wrap', content))

page = f'{REPO}/{today_subj[1]}'
paper_page = f'{REPO}/{today_subj[2]}'
formulas = extract_formulas(page, max_count=3)
mistakes = extract_mistakes(page, max_count=2)
paper_title = extract_paper_title(paper_page)
page_count = extract_paper_page_count(paper_page)

lines = [
    f"📚 每日中考复习 · {date_str}（{weekday}）",
    f"━━━━━━━━━━━━━━━━━━",
    f"{today_subj[3]} 今日复习：{today_subj[0]}",
    f"",
]

# Knowledge points
if formulas:
    lines.append(f"📌 今日知识点：")
    for f in formulas:
        lines.append(f"  • {f}")
else:
    lines.append(f"📌 今日内容请查看完整页面 ↓")

# Easy-to-make mistakes
if mistakes:
    lines.append(f"")
    lines.append(f"⚠️ 易错提醒：")
    for m in mistakes:
        lines.append(f"  • {m[:100]}")

# Paper info (NEW)
if paper_title:
    lines.append(f"")
    lines.append(f"📄 今日试卷：{paper_title}")
    if page_count:
        lines.append(f"   共{page_count}页（含答案），点击下方链接做题")

lines += [
    f"",
    f"━━━━━━━━━━━━━━━━━━",
    f"⏱️ 距中考还有 {days_left} 天 | {weekday}复习{today_subj[0]}",
    f"",
    f"📖 知识点 → hdzkfx.dpdns.org/{today_subj[1]}",
    f"📄 试卷 → hdzkfx.dpdns.org/{today_subj[2]}",
    f"🚑 急救包 → hdzkfx.dpdns.org/emergency.html",
    f"📒 错题本 → hdzkfx.dpdns.org/mistakes.html",
]

msg = '\n'.join(lines)
print(msg)

out_dir = os.path.expanduser('~/.hermes/cron/output')
os.makedirs(out_dir, exist_ok=True)
out_path = f'{out_dir}/daily_push.txt'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(msg)
print(f"\n[Saved to {out_path}]", file=__import__('sys').stderr)
