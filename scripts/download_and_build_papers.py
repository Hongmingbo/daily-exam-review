#!/usr/bin/env python3
"""Download ONE complete PDF per subject from IMA KB, render ALL pages, rebuild paper pages.

Rules:
- one paper per subject page
- include all PDF pages (questions + answers)
- do not mix multiple papers on one page
"""
import sys, re, json, time, shutil, subprocess
from pathlib import Path
from datetime import date

REPO_DIR = Path("/home/hmb/daily-exam-review")
IMAGES_DIR = REPO_DIR / "images"
TMP_DIR = REPO_DIR / "tmp_downloads"
IMAGES_DIR.mkdir(exist_ok=True)
TMP_DIR.mkdir(exist_ok=True)

SKILL_DIR = Path("/home/hmb/.hermes/skills/ima-skill")
KB_ID = "3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E="

# weekday order: Mon=physics ... Sun=politics
SUBJECTS = {
    "physics":   {"cn": "物理", "c1": "#f39c12", "c2": "#e67e22", "folder": "folder_7461794670998044", "icon": "⚡"},
    "chinese":   {"cn": "语文", "c1": "#e74c3c", "c2": "#c0392b", "folder": "folder_7461792464797113", "icon": "📝"},
    "math":      {"cn": "数学", "c1": "#3498db", "c2": "#2980b9", "folder": "folder_7461795233036275", "icon": "📐"},
    "english":   {"cn": "英语", "c1": "#9b59b6", "c2": "#8e44ad", "folder": "folder_7461794322848125", "icon": "📖"},
    "chemistry": {"cn": "化学", "c1": "#27ae60", "c2": "#1e8449", "folder": "folder_7461792729036437", "icon": "🧪"},
    "history":   {"cn": "历史", "c1": "#e67e22", "c2": "#d35400", "folder": "folder_7461792649344818", "icon": "🏛️"},
    "politics":  {"cn": "政治", "c1": "#1abc9c", "c2": "#16a085", "folder": "folder_7461792557071449", "icon": "🎯"},
}
WEEKDAY_SUBJECTS = ["physics", "chinese", "math", "english", "chemistry", "history", "politics"]
BAD_TITLE_WORDS = ("听力原稿", "详细解析", "评析")

def load_creds():
    cid = Path("/home/hmb/.config/ima/client_id").read_text().strip()
    key = Path("/home/hmb/.config/ima/api_key").read_text().strip()
    return cid, key

def ima_api(api_path, params):
    cid, key = load_creds()
    opts = json.dumps({"clientId": cid, "apiKey": key}, ensure_ascii=False)
    r = subprocess.run(
        ["node", str(SKILL_DIR / "ima_api.cjs"), api_path, json.dumps(params, ensure_ascii=False), opts],
        capture_output=True, text=True, timeout=45
    )
    if r.returncode != 0:
        raise RuntimeError(f"IMA API failed: {r.stderr[:300]}")
    if not r.stdout.strip():
        raise RuntimeError("IMA API returned empty stdout")
    data = json.loads(r.stdout)
    if data.get("code") != 0:
        raise RuntimeError(f"IMA API business error: {data.get('code')} {data.get('msg')}")
    return data

def get_kb_pdfs(folder_id):
    resp = ima_api("openapi/wiki/v1/get_knowledge_list", {
        "knowledge_base_id": KB_ID,
        "folder_id": folder_id,
        "cursor": "",
        "limit": 50,
    })
    items = resp.get("data", {}).get("knowledge_list", [])
    return [x for x in items if x.get("media_type") == 1 and x.get("media_id")]

def choose_one_complete_pdf(pdfs):
    # Prefer files explicitly containing both test and answer; exclude analysis-only docs.
    for item in pdfs:
        title = item.get("title", "")
        if "答案" in title and not any(w in title for w in BAD_TITLE_WORDS):
            return item
    for item in pdfs:
        title = item.get("title", "")
        if not any(w in title for w in BAD_TITLE_WORDS):
            return item
    return pdfs[0] if pdfs else None

def get_pdf_url_and_headers(media_id):
    resp = ima_api("openapi/wiki/v1/get_media_info", {"media_id": media_id})
    data = resp.get("data", {})
    url_info = data.get("url_info") or data.get("media_info", {}).get("url_info") or {}
    url = url_info.get("url")
    headers = url_info.get("headers", {}) or {}
    if not url:
        raise RuntimeError("No PDF URL in get_media_info response")
    return url, headers

def download_file(url, dest, headers):
    import urllib.request
    req_headers = {"User-Agent": "Mozilla/5.0"}
    req_headers.update(headers or {})
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = resp.read()
    dest.write_bytes(data)
    return len(data)

def clean_old_current_dir(out_dir):
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

def pdf_to_images(pdf_path, output_dir, dpi=150):
    import fitz
    paths = []
    doc = fitz.open(str(pdf_path))
    try:
        total = len(doc)
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), alpha=False)
            img_path = output_dir / f"page_{i+1:02d}.png"
            pix.save(str(img_path))
            paths.append(img_path)
            print(f"    [{i+1}/{total}] {img_path.relative_to(REPO_DIR)} ({pix.width}x{pix.height})")
    finally:
        doc.close()
    return paths

def html_escape(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def generate_paper_html(subj, cfg, paper_title, imgs):
    img_blocks = []
    for i, img in enumerate(imgs, 1):
        rel = img.relative_to(REPO_DIR).as_posix()
        img_blocks.append(f'''      <div class="paper-img-wrap">
        <img src="{rel}" alt="{cfg['cn']}试卷第{i}页" loading="lazy">
        <div class="paper-caption">第 {i} / {len(imgs)} 页</div>
      </div>''')
    img_html = "\n".join(img_blocks) if img_blocks else '''      <div class="tip-box"><strong>提示：</strong>试卷图片暂未生成成功。</div>'''
    today = date.today().strftime("%Y-%m-%d")
    title = html_escape(paper_title)
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{cfg['cn']} · 试卷练习 - 每日中考复习</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<style>
.paper-header {{ background: linear-gradient(135deg, {cfg['c1']} 0%, {cfg['c2']} 100%); color: white; padding: 1.8rem 1rem 1.5rem; border-radius: 0 0 24px 24px; margin-bottom: 1.2rem; position: relative; }}
.paper-header h1 {{ font-size: 1.5rem; font-weight: 700; margin-bottom: 0.2rem; position: relative; }}
.paper-header p {{ opacity: 0.92; font-size: 0.86rem; position: relative; line-height: 1.5; }}
.paper-header .badge {{ display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 3px 12px; font-size: 0.78rem; margin-top: 6px; }}
.paper-meta {{ font-size: 0.86rem; color: var(--text-mid); line-height: 1.7; margin-bottom: 12px; }}
</style>
</head>
<body>
<header class="paper-header {subj}">
  <a href="index.html" style="color:rgba(255,255,255,0.86);text-decoration:none;font-size:0.85rem;position:relative;display:block;margin-bottom:0.4rem">← 返回首页</a>
  <h1>{cfg['icon']} {cfg['cn']} · 试卷练习</h1>
  <p>{title}</p>
  <span class="badge">一份完整试卷 · 全部 {len(imgs)} 页 · 含答案页</span>
</header>

<div class="container">
  <div class="content-card {subj}" style="border-top:3px solid {cfg['c1']}">
    <h2>📄 试卷内容</h2>
    <div class="tip-box" style="margin-bottom:12px">
      <strong>使用说明：</strong>从第1页开始按顺序做题，答案页在后面。建议先做完再翻答案。
    </div>
    <div class="paper-meta">来源：IMA知识库「中考复习知识库/{cfg['cn']}/试卷」 · 更新：{today}</div>
{img_html}
  </div>

  <p class="source-note">试卷来源：IMA知识库「中考复习知识库/{cfg['cn']}/试卷」<br>⚠️ 若内容与官方真题不符，请以官方发布或学校老师要求为准。</p>

  <div class="page-nav">
    <a href="{subj}_basic.html">← 知识点复习</a>
    <a href="index.html" class="next">返回首页 →</a>
  </div>
</div>
<script src="dark-mode.js"></script>
<script src="features.js"></script>
</body>
</html>
'''
    out = REPO_DIR / f"{subj}_paper.html"
    out.write_text(html, encoding="utf-8")
    print(f"  Updated {out.name}: {len(imgs)} pages")

def process_subject(subj):
    cfg = SUBJECTS[subj]
    print(f"\n=== {cfg['cn']} ({subj}) ===")
    pdfs = get_kb_pdfs(cfg["folder"])
    print(f"  KB PDFs: {len(pdfs)}")
    item = choose_one_complete_pdf(pdfs)
    if not item:
        print("  No PDF found, skip")
        return False
    title = item.get("title", "未命名试卷.pdf")
    print(f"  Selected: {title}")
    url, headers = get_pdf_url_and_headers(item["media_id"])
    pdf_path = TMP_DIR / f"{subj}_current.pdf"
    size = download_file(url, pdf_path, headers)
    if size < 1000:
        raise RuntimeError(f"Downloaded PDF too small: {size}")
    print(f"  Downloaded: {size/1024/1024:.2f} MB")
    out_dir = IMAGES_DIR / f"{subj}_paper_current"
    clean_old_current_dir(out_dir)
    imgs = pdf_to_images(pdf_path, out_dir, dpi=150)
    if not imgs:
        raise RuntimeError("No images rendered")
    generate_paper_html(subj, cfg, title, imgs)
    pdf_path.unlink(missing_ok=True)
    return True

def validate_html_files(subjects):
    from html.parser import HTMLParser
    class Validator(HTMLParser):
        void = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
        def __init__(self):
            super().__init__(); self.stack=[]; self.errors=[]
        def handle_starttag(self, tag, attrs):
            if tag not in self.void: self.stack.append(tag)
        def handle_endtag(self, tag):
            if tag in self.void: return
            if self.stack and self.stack[-1] == tag:
                self.stack.pop()
            else:
                self.errors.append(f"mismatch </{tag}>, stack_tail={self.stack[-3:]}")
    for subj in subjects:
        path = REPO_DIR / f"{subj}_paper.html"
        text = path.read_text(encoding="utf-8")
        v = Validator(); v.feed(text)
        if v.errors or v.stack:
            raise RuntimeError(f"HTML invalid {path.name}: errors={v.errors[:3]} stack={v.stack[-5:]}")
        page_count = len(re.findall(r'<img src="images/' + re.escape(subj) + r'_paper_current/page_\d+\.png"', text))
        if page_count == 0:
            raise RuntimeError(f"No current paper images referenced in {path.name}")
        print(f"  HTML OK: {path.name}, images={page_count}")

def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else "today"
    if arg == "all":
        subjects = WEEKDAY_SUBJECTS
    elif arg == "today":
        subjects = [WEEKDAY_SUBJECTS[date.today().weekday()]]
    elif arg in SUBJECTS:
        subjects = [arg]
    else:
        raise SystemExit(f"Usage: {sys.argv[0]} [all|today|" + "|".join(SUBJECTS) + "]")

    done = []
    for subj in subjects:
        if process_subject(subj):
            done.append(subj)
            time.sleep(0.3)
    validate_html_files(done)
    print("\nDone:", ", ".join(done))

if __name__ == "__main__":
    main()
