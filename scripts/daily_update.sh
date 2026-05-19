#!/bin/bash
# daily_exam_review.sh
# 每日自动更新中考备考网站
# 用法: ./daily_update.sh

set -e

REPO_DIR="$HOME/daily-exam-review"
SKILL_DIR="$HOME/.hermes/profiles/hermes/skills/ima-skill"
CID=$(cat ~/.config/ima/client_id)
KEY=$(cat ~/.config/ima/api_key)
OPTS="{\"clientId\":\"$CID\",\"apiKey\":\"$KEY\"}"
KB1="3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E="
KB2="5SOTWRWA5M_FlqvSWc-lZT-mP9SaNWW5CIn0GSusNKs="

# 星期几 → 科目映射（0=周一...6=周日）
declare -A SUBJECTS=(
  [0]="physics"
  [1]="chinese"
  [2]="math"
  [3]="english"
  [4]="chemistry"
  [5]="history"
  [6]="politics"
)

# Emoji 和颜色映射
declare -A EMOJIS=(
  [physics]="⚡"
  [chinese]="📝"
  [math]="📐"
  [english]="📖"
  [chemistry]="🧪"
  [history]="🏛️"
  [politics]="🎯"
)

# KB 文件夹 ID
declare -A KB_BASIC_IDS=(
  [chinese]="folder_7461799959991117"
  [math]="folder_7461794717137841"
  [history]="folder_7461792599014306"
)

# KB 试卷文件夹 ID
declare -A KB_PAPER_IDS=(
  [physics]="folder_7461794670998044"
  [chinese]="folder_7461792464797113"
  [math]="folder_7461795233036275"
  [english]="folder_7461794322848125"
  [chemistry]="folder_7461792729036437"
  [history]="folder_7461792649344818"
  [politics]="folder_7461792557071449"
)

echo "=== 每日中考复习更新 $(date '+%Y-%m-%d %H:%M') ==="

# 进入仓库
cd "$REPO_DIR" || { echo "仓库不存在，克隆中..."; git clone https://github.com/Hongmingbo/daily-exam-review "$REPO_DIR"; cd "$REPO_DIR"; }
git pull origin main --quiet

# 获取今天星期
weekday=$(date +%w)
subject="${SUBJECTS[$weekday]}"
emoji="${EMOJIS[$subject]}"
today=$(date +"%Y年%m月%d日")
exam_date="2026年6月21日"
days_left=$(( ($(date -d "20260621" +%s) - $(date +%s)) / 86400 ))

echo "今天: $today (weekday=$weekday) → $emoji $subject"
echo "距中考: 约 $days_left 天"

# 更新 index.html 中的"今天"标记
update_index_today() {
  local subj=$1
  local cn_name=$2
  # 更新首页 nav-cards 中的 today 标记
  # 由于结构复杂，这里只更新关键标记
  sed -i "s/class=\"nav-card $subj\"/class=\"nav-card $subj today\"/g" index.html 2>/dev/null || true
  echo "index.html 已更新 today 标记"
}

# 提交并推送
commit_and_push() {
  git config user.name "Hongmingbo" || true
  git config user.email "hongmingbo2011@163.com" || true
  git add -A
  if git diff --cached --quiet; then
    echo "没有变更，跳过提交"
  else
    git commit -m "auto: daily update $(date '+%Y-%m-%d')"
    git push origin main
    echo "已推送更新"
  fi
}

# 主流程
update_index_today "$subject" "$cn_name"

commit_and_push

echo "=== 更新完成 ==="
