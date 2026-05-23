#!/usr/bin/env python3
"""
每日更新首页的"本周轮播"表格日期
保持 nav-cards today 标记与 index.js WEEK_DATA 一致
"""
import datetime, re, sys, os

REPO = os.path.expanduser("~/daily-exam-review")

# 科目颜色（与 index.html WEEK_DATA 一致，Mon=0）
SUBJECTS = [
    ("physics",   "⚡ 物理",  "#f39c12", "physics_basic.html", "physics_paper.html"),
    ("chinese",   "📝 语文",  "#e74c3c", "chinese_basic.html", "chinese_paper.html"),
    ("math",      "📐 数学",  "#3498db", "math_basic.html",    "math_paper.html"),
    ("english",   "📖 英语",  "#9b59b6", "english_basic.html",  "english_paper.html"),
    ("chemistry", "🧪 化学",  "#27ae60", "chemistry_basic.html","chemistry_paper.html"),
    ("history",   "🏛️ 历史",  "#e67e22", "history_basic.html",  "history_paper.html"),
    ("politics",  "🎯 政治",  "#1abc9c", "politics_basic.html", "politics_paper.html"),
]
CN_DAYS = ["周一","周二","周三","周四","周五","周六","周日"]

def days_to_exam():
    exam = datetime.date(2026, 6, 21)
    today = datetime.date.today()
    return max(0, (exam - today).days)

def build_week_table():
    """生成本周轮播表格 HTML"""
    today = datetime.date.today()
    weekday = today.weekday()  # 0=Mon...6=Sun

    # 找到本周一
    monday = today - datetime.timedelta(days=weekday)

    rows = []
    for i in range(7):
        day = monday + datetime.timedelta(days=i)
        subj_obj = SUBJECTS[i]
        subj_key, label, color, basic, paper = subj_obj
        is_today = (i == weekday)
        bg = "#fffbeb" if is_today else ("#f8fafc" if i % 2 == 0 else "white")
        fire = " 🔥" if is_today else ""
        date_str = day.strftime("%m月%d日")
        row_class = f"week-row {subj_key} {'week-today' if is_today else ''}".strip()
        rows.append(f'''    <tr class="{row_class}" style="background:{bg};{'font-weight:700' if is_today else ''}">
      <td style="padding:7px 10px">{date_str}{fire}</td>
      <td style="padding:7px 10px">{label}</td>
      <td style="padding:7px 10px"><a href="{basic}" style="color:{color};text-decoration:none">📖 查看</a></td>
      <td style="padding:7px 10px"><a href="{paper}" style="color:{color};text-decoration:none">✍️ 练习</a></td>
    </tr>''')

    return '\n'.join(rows)

def update_index(repo):
    idx = f"{repo}/index.html"
    with open(idx, encoding="utf-8") as f:
        html = f.read()

    # 生成新表格
    new_table = build_week_table()

    # 替换旧的表格 body（保留 <table> 框架）
    # 找到 <table...> 和 </table> 之间的内容
    table_match = re.search(r'(<table[^>]*>)\s*\n(.*?)\n\s*(</table>)', html, re.DOTALL)
    if table_match:
        html = html[:table_match.start(2)] + '\n' + new_table + '\n' + html[table_match.end(2):]
        print(f"Updated weekly table")
    else:
        print("WARNING: Could not find table in index.html")

    # 更新倒计时（更新 site-header 和 today-card）
    days = days_to_exam()

    # 更新 site-header 倒计时
    html = re.sub(
        r'(距中考约\s*)\d+\s*天',
        f'距中考约 {days} 天',
        html
    )

    # 更新考试日期
    exam_date_str = "6月21日"
    # 更新 today-card 中的距中考天数（JS 也更新，但这里更新 HTML 中可能有的静态文本）
    # today's subject based on weekday
    wd = datetime.date.today().weekday()  # 0=Mon...6=Sun
    subj_key, label, color, basic, paper = SUBJECTS[wd]

    with open(idx, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Updated index.html: weekday={wd} ({CN_DAYS[wd]}), 距中考{days}天")
    return True

if __name__ == "__main__":
    repo = sys.argv[1] if len(sys.argv) > 1 else REPO
    update_index(repo)
