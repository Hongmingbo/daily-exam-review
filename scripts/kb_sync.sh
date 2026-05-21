#!/bin/bash
# kb_sync.sh — 从 IMA 知识库拉取内容，同步到网站页面
# 用法: ./kb_sync.sh
# 依赖: node, curl, python3 (with pymupdf), unzip

set -e

SKILL_DIR="$HOME/.hermes/skills/ima-skill"
REPO_DIR="$HOME/daily-exam-review"
KB_ID="3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E="
PY="$HOME/exam-pipeline/venv2/bin/python"

# 凭证
CID=$(cat "$HOME/.config/ima/client_id")
KEY=$(cat "$HOME/.config/ima/api_key")
OPTS=$(printf '{"clientId":"%s","apiKey":"%s"}' "$CID" "$KEY")

# 科目标签
declare -A SUBJ=(
  [math]="📐 数学"
  [chinese]="📝 语文"
  [history]="🏛️ 历史"
)
declare -A SUBJ_COLORS=(
  [math]="#3498db"
  [chinese]="#e74c3c"
  [history]="#e67e22"
)

# 颜色标签（用于HTML）
declare -A SUBJ_CSS=(
  [math]="--math-c1"
  [chinese]="--chinese-c1"
  [history]="--history-c1"
)

# 文件夹映射
declare -A FOLDER_IDS=(
  [math]="folder_7461794717137841"
  [chinese]="folder_7461799959991117"
  [history]="folder_7461792599014306"
)

mkdir -p "$REPO_DIR/tmp_kb_sync"

########################################
api() {
  local cmd="$1"; local body="$2"
  node "$SKILL_DIR/ima_api.cjs" "$cmd" "$body" "$OPTS" 2>/tmp/api_err
}

########################################
# 提取 docx 文本（传入完整文件路径）
extract_docx() {
  local file="$1"
  local out=$(mktemp --suffix=.xml)
  unzip -p "$file" word/document.xml > "$out" 2>/dev/null || return 1
  python3 -c "
import sys, xml.etree.ElementTree as ET
ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
try:
    root = ET.fromstring(open('$out').read())
    lines = []
    for p in root.iter('{%s}p' % ns):
        texts = [t.text for t in p.iter('{%s}t' % ns) if t.text]
        line = ''.join(texts).strip()
        if line: lines.append(line)
    sys.stdout.write('\n'.join(lines[:200]))  # 最多200行，防止太长
except Exception as e:
    sys.exit(1)
" && rm -f "$out" && return 0 || { rm -f "$out"; return 1; }
}

########################################
# 提取 pdf 文本
extract_pdf() {
  local file="$1"
  "$PY" -c "
import fitz
doc = fitz.open('$file')
texts = []
for i, page in enumerate(doc):
    t = page.get_text()
    if t.strip():
        texts.append('--- 第%d页 ---\n' % (i+1) + t[:2000])
print('\n'.join(texts[:5]))  # 前5页，防止太长
" 2>/dev/null
}

########################################
# 获取文件夹内容列表
get_folder_items() {
  local folder_id="$1"
  local resp=$(api "openapi/wiki/v1/get_knowledge_list" "{\"knowledge_base_id\":\"$KB_ID\",\"folder_id\":\"$folder_id\",\"limit\":50}")
  local code=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code',-1))" 2>/dev/null)
  if [ "$code" != "0" ]; then
    echo "Failed to list folder $folder_id: $resp" >&2
    echo "[]"
    return
  fi
  echo "$resp" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('data', {}).get('knowledge_list', [])
for it in items:
    print(it.get('media_id','') + '\t' + str(it.get('media_type','')) + '\t' + it.get('title',''))
" 2>/dev/null
}

########################################
# 获取下载 URL
get_url() {
  local media_id="$1"
  local resp=$(api "openapi/wiki/v1/get_media_info" "{\"media_id\":\"$media_id\"}")
  local code=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('code',-1))" 2>/dev/null)
  if [ "$code" != "0" ]; then
    echo "" >&2
    return
  fi
  echo "$resp" | python3 -c "
import sys, json
d = json.load(sys.stdin)
url = d.get('data', {}).get('url_info', {}).get('url', '')
print(url)
" 2>/dev/null
}

########################################
# 下载并提取内容
fetch_content() {
  local media_id="$1"; local mtype="$2"; local title="$3"
  local out="$REPO_DIR/tmp_kb_sync/$(echo $media_id | head -c 20).tmp"

  if [ -f "$out" ] && [ $(stat -c%s "$out" 2>/dev/null || echo 0) -gt 50 ]; then
    :
  else
    local url=$(get_url "$media_id")
    if [ -z "$url" ]; then
      echo "  [SKIP] No URL for: $title" >&2
      return 1
    fi
    curl -sL -o "$out" "$url" --max-time 30 2>/dev/null
  fi

  local size=$(stat -c%s "$out" 2>/dev/null || echo 0)
  if [ "$size" -lt 100 ]; then
    echo "  [SKIP] File too small ($size): $title" >&2
    return 1
  fi

  # 提取文本
  local text=""
  if [ "$mtype" = "3" ]; then
    text=$(extract_docx "$out" 2>/dev/null) || text=""
  elif [ "$mtype" = "1" ]; then
    text=$(extract_pdf "$out" 2>/dev/null) || text=""
  fi

  if [ -z "$text" ] || [ ${#text} -lt 50 ]; then
    echo "  [SKIP] No text extracted: $title ($size bytes)" >&2
    return 1
  fi

  echo "$text"
}

########################################
# 清理旧临时文件（保留最新）
cleanup() {
  find "$REPO_DIR/tmp_kb_sync" -name "*.tmp" -mtime +2 -delete 2>/dev/null || true
}

########################################
# 主流程
echo "=== KB Sync $(date '+%Y-%m-%d %H:%M') ==="
cleanup

cd "$REPO_DIR"

for subj in math chinese history; do
  folder="${FOLDER_IDS[$subj]}"
  label="${SUBJ[$subj]}"
  color="${SUBJ_COLORS[$subj]}"

  echo ""
  echo ">>> $label ($folder)"

  items=$(get_folder_items "$folder")
  count=$(echo "$items" | grep -c . || echo 0)
  echo "  Found $count items"

  if [ "$count" = "0" ]; then
    echo "  No items, skipping"
    continue
  fi

  # 取最新2个文件（按标题时间排序，取最新的）
  echo "$items" | while IFS=$'\t' read -r mid mtype title; do
    [ -z "$mid" ] && continue
    echo ""
    echo "  Fetching: [$mtype] $title"

    text=$(fetch_content "$mid" "$mtype" "$title")
    if [ -z "$text" ]; then
      continue
    fi

    chars=$(echo "$text" | wc -c)
    echo "  Extracted ${chars} chars"

    # 写入内容摘要到对应科目的知识点页
    # 这里只更新摘要，完整内容供IMA推送
    echo "[$subj] $title: ${chars}chars"
  done
done

echo ""
echo "=== KB Sync Done ==="
