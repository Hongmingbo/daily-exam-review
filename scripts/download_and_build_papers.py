#!/usr/bin/env python3
"""
每日下载当日科目试卷PDF → 转图片 → 更新网站试卷页面
依赖: requests, PyMuPDF (fitz) — 已安装在 hermes venv
"""
import sys, os, re, json, time, subprocess
from pathlib import Path

# ========== 路径配置 ==========
REPO_DIR = Path("/home/hmb/daily-exam-review")
IMAGES_DIR = REPO_DIR / "images"
TMP_DIR = REPO_DIR / "tmp_downloads"
IMAGES_DIR.mkdir(exist_ok=True)
TMP_DIR.mkdir(exist_ok=True)

SKILL_DIR = Path("/home/hmb/.hermes/profiles/hermes/skills/ima-skill")

# ========== 科目配置 ==========
# (英文名, 中文名, 主题色1, 主题色2, KB试卷文件夹ID, 已有图片前缀)
SUBJECTS = {
    0: ("physics",   "物理",  "#f39c12", "#e67e22", "folder_7461794670998044", "physics"),
    1: ("chinese",   "语文",  "#e74c3c", "#c0392b", "folder_7461792464797113", "chinese"),
    2: ("math",      "数学",  "#3498db", "#2980b9", "folder_7461795233036275", "math"),
    3: ("english",   "英语",  "#9b59b6", "#8e44ad", "folder_7461794322848125", "english"),
    4: ("chemistry", "化学",  "#27ae60", "#1e8449", "folder_7461792729036437", "chem_nanping"),
    5: ("history",   "历史",  "#e67e22", "#d35400", "folder_7461792649344818", "history_xiamen"),
    6: ("politics",  "政治",  "#1abc9c", "#16a085", "folder_7461792557071449", "politics"),
}

KB1 = "3A7ByqxFj9CRITF77c_FCQ01aCZxReKLUr56zusq72E="

# ========== IMA API ==========
def load_creds():
    cid = Path("/home/hmb/.config/ima/client_id").read_text().strip()
    key = Path("/home/hmb/.config/ima/api_key").read_text().strip()
    return cid, key

def ima_api(api_path, params):
    cid, key = load_creds()
    opts = json.dumps({"clientId": cid, "apiKey": key})
    sk = str(SKILL_DIR / "ima_api.cjs")
    r = subprocess.run(
        ["node", sk, api_path, json.dumps(params), opts],
        capture_output=True, text=True, timeout=30
    )
    if r.returncode != 0:
        return None, r.stderr
    try:
        return json.loads(r.stdout), None
    except:
        return None, r.stdout

# ========== 下载文件 ==========
def download_file(url, dest, headers=None):
    import urllib.request
    if headers is None:
        headers = {}
    headers.setdefault("User-Agent", "Mozilla/5.0")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
            dest.write_bytes(data)
            return len(data)
    except Exception as e:
        return None

# ========== PDF → 图片 ==========
def pdf_to_images(pdf_path, output_dir, prefix, dpi=150):
    import fitz
    paths = []
    try:
        doc = fitz.open(str(pdf_path))
        total = len(doc)
        for i, page in enumerate(doc):
            mat = fitz.Matrix(dpi/72, dpi/72)
            pix = page.get_pixmap(matrix=mat)
            img_name = f"{prefix}_p{i+1:02d}.png"
            img_path = output_dir / img_name
            pix.save(str(img_path))
            paths.append(img_path)
            print(f"    [{i+1}/{total}] {img_name} ({pix.width}x{pix.height})")
        doc.close()
    except Exception as e:
        print(f"    PDF 转图片失败: {e}")
    return paths

# ========== 获取 KB 文件列表 ==========
def get_kb_files(folder_id):
    resp, err = ima_api(
        "openapi/wiki/v1/get_knowledge_list",
        {"knowledge_base_id": KB1, "folder_id": folder_id, "cursor": "", "limit": 20}
    )
    if err or not resp or resp.get("code") != 0:
        return []
    return resp.get("data", {}).get("knowledge_list", [])

# ========== 获取 PDF 下载 URL ==========
def get_pdf_url(media_id):
    resp, err = ima_api("openapi/wiki/v1/get_media_info", {"media_id": media_id})
    if err or not resp or resp.get("code") != 0:
        return None, None, {}
    info = resp.get("data", {}).get("media_info", {}) or {}
    url = info.get("url_info", {}).get("url") if info.get("url_info") else None
    title = info.get("title", "")
    extra_headers = {}
    ui = info.get("url_info") or {}
    if isinstance(ui, dict):
        for k in ["X-IMA-Create-URL-Time", "X-IMA-Platform", "X-IMA-Sign", "X-IMA-UID-SHA256"]:
            v = ui.get(k)
            if v:
                extra_headers[k] = v
    return url, title, extra_headers

# ========== 处理某科目试卷 ==========
def process_subject(subj_en, subj_cn, folder_id, existing_prefix):
    print(f"\n=== {subj_cn} 试卷 ===")
    files = get_kb_files(folder_id)
    pdfs = [f for f in files if f.get("media_type") == 1 and f.get("title", "").lower().endswith(".pdf")]
    print(f"  KB 中找到 {len(pdfs)} 个 PDF")

    all_imgs = []
    processed = 0

    for f in pdfs[:3]:  # 每次最多处理3份试卷
        media_id = f.get("media_id", "")
        title = f.get("title", "unknown.pdf")
        if not title.lower().endswith(".pdf"):
            title += ".pdf"
        print(f"\n  处理: {title}")

        url, _, extra_hdrs = get_pdf_url(media_id)
        if not url:
            print(f"    ⚠️ 无法获取下载链接（IMA KB 权限限制）")
            continue

        # 下载
        safe_title = re.sub(r'[^\w\u4e00-\u9fff-]', '_', title)
        pdf_path = TMP_DIR / safe_title
        size = download_file(url, pdf_path, extra_hdrs)
        if not size:
            print(f"    ❌ 下载失败")
            continue
        print(f"    ✅ 下载完成 ({size/1024:.1f}KB)")

        # 转图片
        prefix = f"{subj_en}_{safe_title[:-4]}"
        imgs = pdf_to_images(pdf_path, IMAGES_DIR, prefix, dpi=150)
        all_imgs.extend(imgs)
        processed += 1
        print(f"    → {len(imgs)} 张图片")

        # 清理
        pdf_path.unlink(missing_ok=True)
        time.sleep(0.3)

    # 收集已有图片
    existing = sorted(IMAGES_DIR.glob(f"{existing_prefix}_p*.png"))
    all_imgs = sorted(set(all_imgs + existing))

    print(f"  共 {len(all_imgs)} 张图片可用")
    return processed, len(all_imgs), all_imgs

# ========== 生成试卷 HTML ==========
def generate_paper_html(subj_en, subj_cn, col1, col2, all_imgs, processed_count):
    if all_imgs:
        img_blocks = ""
        for i, img in enumerate(sorted(all_imgs)):
            rel = f"images/{img.name}"
            img_blocks += f'\n  <div class="paper-img-wrap">\n    <img src="{rel}" alt="第{i+1}页" loading="lazy">\n    <div class="paper-caption">第 {i+1} / {len(all_imgs)} 页</div>\n  </div>'
    else:
        img_blocks = '''
  <div class="tip-box">
    <strong>💡 提示：</strong>试卷图片正在准备中，请稍后刷新页面查看，或访问下方外部链接查看完整试卷。
  </div>
  <div style="margin-top:12px">
    <a href="https://www.51test.net" target="_blank" style="display:block;background:#f39c12;color:white;text-align:center;padding:12px;border-radius:12px;text-decoration:none;font-weight:600;font-size:0.9rem">📄 在无忧考网查看更多试卷 →</a>
  </div>'''

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{subj_cn} · 试卷练习 - 每日中考复习</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<style>
.paper-header {{ background: linear-gradient(135deg, {col1} 0%, {col2} 100%); color: white; padding: 1.8rem 1rem 1.5rem; border-radius: 0 0 24px 24px; margin-bottom: 1.2rem; position: relative; }}
.paper-header::before {{ content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat; }}
.paper-header h1 {{ font-size: 1.5rem; font-weight: 700; margin-bottom: 0.2rem; position: relative; }}
.paper-header p {{ opacity: 0.85; font-size: 0.85rem; position: relative; }}
.paper-header .badge {{ display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 3px 12px; font-size: 0.78rem; margin-top: 6px; }}
</style>
</head>
<body>
<header class="paper-header">
  <a href="index.html" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:0.85rem;position:relative;display:block;margin-bottom:0.4rem">← 返回首页</a>
  <h1>{subj_cn} · 试卷练习</h1>
  <p>IMA知识库试卷 · 共 {processed_count} 份 · {len(all_imgs)} 张图片</p>
  <span class="badge">✍️ 试卷练习</span>
</header>

<div class="container">
<div class="content-card" style="border-top:3px solid {col1}">
  <h2>📄 试卷内容</h2>
  <div class="tip-box" style="margin-bottom:12px">
    <strong>💡 使用说明：</strong>点击图片可放大查看，建议先自己做题，再翻到后面看答案。
  </div>
{img_blocks}
</div>

<p class="source-note">试卷来源：IMA知识库「中考复习知识库/{subj_cn}/试卷」<br>⚠️ 若内容与官方真题不符，请以官方为准</p>

<div class="page-nav">
  <a href="{subj_en}_basic.html">← 知识点复习</a>
  <a href="index.html" class="next">返回首页 →</a>
</div>
</div>
</body>
</html>'''

    out_path = REPO_DIR / f"{subj_en}_paper.html"
    out_path.write_text(html, encoding="utf-8")
    print(f"  ✅ 已更新 {out_path.name}")

# ========== 主流程 ==========
def main():
    import datetime
    weekday = datetime.date.today().weekday()
    if weekday not in SUBJECTS:
        print(f"未知星期: {weekday}")
        return

    subj_en, subj_cn, col1, col2, folder_id, existing_prefix = SUBJECTS[weekday]
    print(f"\n{'='*50}")
    print(f"今日: {subj_cn} ({subj_en})")
    print(f"{'='*50}")

    # 处理下载
    processed, img_count, all_imgs = process_subject(subj_en, subj_cn, folder_id, existing_prefix)

    # 生成 HTML
    generate_paper_html(subj_en, subj_cn, col1, col2, all_imgs, processed)

    # 提交 git
    import subprocess
    git = ["git", "-C", str(REPO_DIR)]
    subprocess.run(git + ["config", "user.name", "Hongmingbo"], capture_output=True)
    subprocess.run(git + ["config", "user.email", "hongmingbo2011@163.com"], capture_output=True)
    subprocess.run(git + ["add", "*.html", "images/"], capture_output=True)
    result = subprocess.run(git + ["status", "--porcelain"], capture_output=True, text=True)
    if result.stdout.strip():
        print("\n提交 git...")
        subprocess.run(git + ["commit", "-m", f"auto: 试卷更新 {datetime.date.today()} {subj_cn}"], capture_output=True)
        subprocess.run(git + ["push", "origin", "main"], capture_output=True)
        print("✅ 已推送")
    else:
        print("没有变更，跳过 git")

    print("\n完成！")

if __name__ == "__main__":
    main()
