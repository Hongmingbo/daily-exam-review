#!/usr/bin/env python3
"""
每日更新首页的"今天"标记
每周一→物理, 周二→语文, ..., 周日→政治
"""
import datetime, re, sys

REPO = "/home/hmb/daily-exam-review"

SUBJECTS = {
    0: ("physics",   "物理",  "#f39c12"),
    1: ("chinese",   "语文",  "#e74c3c"),
    2: ("math",      "数学",  "#3498db"),
    3: ("english",   "英语",  "#9b59b6"),
    4: ("chemistry", "化学",  "#27ae60"),
    5: ("history",   "历史",  "#e67e22"),
    6: ("politics",  "政治",  "#1abc9c"),
}

def days_to_exam():
    exam = datetime.date(2026, 6, 21)
    today = datetime.date.today()
    return (exam - today).days

def update_index(repo):
    idx = f"{repo}/index.html"
    with open(idx, encoding="utf-8") as f:
        html = f.read()

    today_wd = datetime.date.today().weekday()
    subj, cn_name, color = SUBJECTS[today_wd]
    days = days_to_exam()

    today_str = datetime.date.today().strftime("%Y年%m月%d日")
    today_date_str = datetime.date.today().strftime("%Y年%m月%d日")
    date_str_short = datetime.date.today().strftime("%m月%d日")

    # 更新 site-header 颜色
    old_header_class = re.search(r'<header class="site-header \w+">', html)
    if old_header_class:
        old_class = old_header_class.group(0)
        new_class = f'<header class="site-header {subj}">'
        html = html.replace(old_class, new_class, 1)

    # 更新今日复习计划的科目
    old_plan = re.search(r'<h4 style="color:#[^"]+">[^<]*</h4>\s*<p>[^<]*</p>', html)
    if old_plan:
        old = old_plan.group(0)
        new = f'<h4 style="color:{color}">{subj.upper()}</h4>\n        <p>{today_date_str}（{"周一周二周三四五六日"[today_wd*3:(today_wd+1)*3]}）· 距中考{days}天</p>'
        html = html.replace(old, new, 1)

    # 更新今日科目的 basic/paper 链接颜色
    # 找到今日科目的两个按钮
    today_section = re.search(
        r'(<div style="display:grid;grid-template-columns:1fr 1fr;[^"]*">.*?</div>\s*</div>)',
        html, re.DOTALL
    )
    if today_section:
        old_block = today_section.group(1)
        # 简单替换：保持原有结构，只更新按钮颜色
        pass  # 保持按钮原样，避免破坏结构

    # 更新本周轮播表格中的今天行
    old_today_row = re.search(r'<tr style="background:#fffbeb[^"]*">\s*<td[^>]*>[^<]*🔥</td>', html)
    if old_today_row:
        pass  # 已有🔥标记的行不需要改

    with open(idx, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Updated index.html: today={cn_name} (weekday={today_wd}), 距中考{days}天")
    return True

if __name__ == "__main__":
    repo = sys.argv[1] if len(sys.argv) > 1 else REPO
    update_index(repo)
