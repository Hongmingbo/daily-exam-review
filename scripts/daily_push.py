#!/usr/bin/env python3
"""
daily_push.py — 生成每日复习摘要，发送给微信
每天 20:05 由 kb_sync.sh 调用（或独立运行）
输出摘要到 ~/.hermes/cron/output/daily_push.txt
"""
import os, sys, re
from datetime import datetime

REPO = os.path.expanduser('~/daily-exam-review')

# 今日日期
today = datetime.now()
date_str = today.strftime('%Y年%m月%d日')
weekdays = ['周一','周二','周三','周四','周五','周六','周日']
weekday = weekdays[today.weekday()]
exam = __import__('datetime').date(2026, 6, 21)
days_left = (exam - today.date()).days

# 7天循环
SUBJECTS = [
    ('物理', 'physics_basic.html', '⚡', '#f39c12'),
    ('语文', 'chinese_basic.html', '📝', '#e74c3c'),
    ('数学', 'math_basic.html', '📐', '#3498db'),
    ('英语', 'english_basic.html', '📖', '#27ae60'),
    ('化学', 'chemistry_basic.html', '🧪', '#9b59b6'),
    ('历史', 'history_basic.html', '🏛️', '#e67e22'),
    ('政治', 'politics_basic.html', '🎯', '#1abc9c'),
]
today_subj = SUBJECTS[today.weekday()]

def extract_formulas(page_path, max_count=3):
    """从 basic.html 提取关键知识点标题+首句"""
    if not os.path.exists(page_path):
        return []
    with open(page_path, encoding='utf-8') as f:
        content = f.read()
    results = []
    # Find <strong> tags — these are formula/knowledge point titles
    strongs = re.findall(r'<strong>([^<]+)</strong>', content)
    for s in strongs[:max_count]:
        title = s.strip()
        if title and len(title) < 80:
            results.append(title)
    return results[:max_count]

def extract_mistakes(page_path, max_count=2):
    """从 basic.html 提取易错点"""
    if not os.path.exists(page_path):
        return []
    with open(page_path, encoding='utf-8') as f:
        content = f.read()
    results = []
    # trap-box divs
    traps = re.findall(r'<div class="trap-box[^"]*">(.*?)</div>', content, re.DOTALL)
    for t in traps:
        text = re.sub(r'<[^>]+>', '', t).strip()
        text = re.sub(r'\s+', ' ', text)
        if text and len(text) > 5:
            results.append(text)
        if len(results) >= max_count:
            break
    # Also find ⚠️ 易错 patterns
    if len(results) < max_count:
        extras = re.findall(r'⚠️ 易错[：:]\s*([^\n<]+)', content)
        for e in extras:
            text = re.sub(r'<[^>]+>', '', e).strip()
            if text and len(text) > 5:
                results.append(text)
            if len(results) >= max_count:
                break
    return results[:max_count]

page = f'{REPO}/{today_subj[1]}'
formulas = extract_formulas(page, max_count=3)
mistakes = extract_mistakes(page, max_count=2)

# 构建消息
lines = [
    f"📚 每日中考复习 · {date_str}（{weekday}）",
    f"━━━━━━━━━━━━━━━━━━",
    f"{today_subj[2]} 今日复习：{today_subj[0]}",
    f"",
]
if formulas:
    for f in formulas:
        lines.append(f"  📌 {f}")
else:
    lines.append(f"  📌 今日内容请查看完整页面 ↓")

if mistakes:
    lines.append(f"")
    lines.append(f"  ⚠️ 易错点：")
    for m in mistakes[:2]:
        lines.append(f"  • {m[:100]}")

lines += [
    f"",
    f"━━━━━━━━━━━━━━━━━━",
    f"⏱️ 距中考还有 {days_left} 天 | 📖 {weekday}复习{today_subj[0]}",
    f"🔗 {today_subj[1]} → https://hdzkfx.dpdns.org/{today_subj[1]}",
    f"🚑 急救包：hdzkfx.dpdns.org/emergency.html",
]

msg = '\n'.join(lines)
print(msg)

# 写入输出文件（供 cron job 读取发送）
out_dir = os.path.expanduser('~/.hermes/cron/output')
os.makedirs(out_dir, exist_ok=True)
out_path = f'{out_dir}/daily_push.txt'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(msg)
print(f"\n[Saved to {out_path}]", file=__import__('sys').stderr)
