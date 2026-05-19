#!/bin/bash
# daily_exam_review.sh
# 每日 21:00 自动执行：更新首页"今天"标记 → 推送 → 自动触发 Cloudflare Pages 部署
set -e

REPO="$HOME/daily-exam-review"
PYTHON="$HOME/.hermes/hermes-agent/venv/bin/python"
TODAY_MARKER="$REPO/scripts/daily_today_marker.py"

echo "[$(date '+%Y-%m-%d %H:%M')] 开始每日更新..."

cd "$REPO"

# 设置 git
git config user.name "Hongmingbo" 2>/dev/null || true
git config user.email "hongmingbo2011@163.com" 2>/dev/null || true

# 拉取最新
git fetch origin main
# 如果有冲突，用 ours 策略
git merge -X ours origin/main --no-edit 2>/dev/null || git rebase origin/main 2>/dev/null || true

# 更新今天的标记
"$PYTHON" "$TODAY_MARKER" "$REPO"

# 检查是否有变更
if git diff --quiet; then
    echo "没有内容变更，结束"
    exit 0
fi

# 提交
git add -A
git commit -m "auto: 每日更新 $(date '+%Y-%m-%d %H:%M')"
git push origin main

echo "[$(date '+%Y-%m-%d %H:%M')] 更新完成并推送，Cloudflare Pages 部署将自动触发"
