#!/usr/bin/env python3
"""
scheduled_sync.py — 每日调度脚本
逻辑：
  - knowledge_builder  每3天执行一次（联网搜索权威学习平台，生成知识点复习页面 *_basic.html）
  - download_and_build_papers today  每天执行（IMA KB下载今日科目试卷，轮换由脚本内部按周控制）
  - daily_today_marker  每天执行
  - sync_readme_about  每次 knowledge_builder 后执行
  - daily_push  每天执行
  - git add/commit/push  仅在有变更时执行
用法: python scripts/scheduled_sync.py [repo_path]
"""
import sys, os, json, subprocess
from datetime import date, timedelta

PY = os.path.abspath(sys.executable)  # hermes venv Python（绝对路径，确保 subprocess 找对）
REPO = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else '~/daily-exam-review')
OUT_DIR = os.path.expanduser('~/.hermes/cron/output')
STATE_FILE = os.path.join(REPO, 'scripts', 'sync_state.json')

os.makedirs(OUT_DIR, exist_ok=True)

def log(msg):
    print(msg)
    with open(os.path.join(OUT_DIR, 'scheduled_sync.log'), 'a', encoding='utf-8') as f:
        f.write(f'[{date.today().isoformat()}] {msg}\n')

def run(cmd, log_file, cwd=None):
    """执行命令并记录日志"""
    result = subprocess.run(
        cmd, capture_output=True, text=True,
        cwd=cwd or REPO, shell=False
    )
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(result.stdout)
        if result.stderr:
            f.write(result.stderr)
    return result.returncode == 0

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            return json.loads(open(STATE_FILE, encoding='utf-8').read())
        except Exception:
            pass
    return {'last_knowledge_build': None}

def save_state(state):
    with open(STATE_FILE, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)

def days_since(s):
    if not s:
        return 999
    return (date.today() - date.fromisoformat(s)).days

def main():
    print(f'=== scheduled_sync {date.today().isoformat()} ===')

    state = load_state()
    last_build = state.get('last_knowledge_build') or state.get('last_kb_sync')
    days_elapsed = days_since(last_build)
    do_build = days_elapsed >= 3

    log(f'last_knowledge_build={last_build}, days_elapsed={days_elapsed}, do_build={do_build}')

    # 1. knowledge_builder — 每3天一次（联网搜索权威学习平台，生成 *_basic.html 知识点复习页面）
    if do_build:
        log('--- knowledge_builder start ---')
        ok = run([PY, 'scripts/knowledge_builder.py'], f'{OUT_DIR}/knowledge_builder.log')
        log(f'knowledge_builder: {"OK" if ok else "FAILED"}')
        if ok:
            state['last_knowledge_build'] = date.today().isoformat()
            save_state(state)
            # 1a. 上传知识点到 IMA KB（缓存到 KB，后续可直接读取）
            ok_kb = run([PY, 'scripts/knowledge_to_kb.py'], f'{OUT_DIR}/knowledge_to_kb.log')
            log(f'knowledge_to_kb: {"OK" if ok_kb else "FAILED (不影响流程)"}')
            # 1b. 同步 README → about.html
            ok2 = run([PY, 'scripts/sync_readme_about.py'], f'{OUT_DIR}/readme_sync.log')
            log(f'sync_readme_about: {"OK" if ok2 else "FAILED"}')
        else:
            log('knowledge_builder failed，跳过同步，保留已有内容')
    else:
        log('knowledge_builder: skipped (未满3天)')

    # 2. download today's paper — 每天（IMA KB 试卷，轮换由脚本内部按周控制）
    # 可能因PDF下载/IMA问题失败，跳过不影响后续步骤
    log('--- download_and_build_papers today ---')
    ok = run([PY, 'scripts/download_and_build_papers.py', 'today'],
             f'{OUT_DIR}/paper_download.log')
    log(f'download_and_build_papers: {"OK" if ok else "FAILED (跳过，不影响流程)"}')

    # 3. daily_today_marker — 每天
    log('--- daily_today_marker ---')
    ok = run([PY, 'scripts/daily_today_marker.py', REPO],
             f'{OUT_DIR}/today_marker.log')
    log(f'daily_today_marker: {"OK" if ok else "FAILED"}')

    # 4. Git commit & push（仅当有变更时，必须先 push 才能让 IMA 通过 URL 导入）
    log('--- git push ---')
    git = ['git', f'-C={REPO}']
    subprocess.run(git + ['config', 'user.name', 'Hongmingbo'], capture_output=True)
    subprocess.run(git + ['config', 'user.email', 'user@users.noreply.github.com'], capture_output=True)
    subprocess.run(git + ['add', '-A'], capture_output=True)
    status = subprocess.run(git + ['status', '--porcelain'], capture_output=True, text=True)
    if status.stdout.strip():
        commit_msg = f'Auto-sync: {date.today().isoformat()}'
        subprocess.run(git + ['commit', '-m', commit_msg], capture_output=True)
        push = subprocess.run(git + ['push', 'origin', 'main'],
                            capture_output=True, text=True)
        log(f'git push: {"OK" if push.returncode == 0 else "FAILED"}')
        log(f'  stdout: {push.stdout[:200]}')
        log(f'  stderr: {push.stderr[:200]}')
    else:
        log('git push: no changes')

    # 5. IMA KB 导入知识点（git push 后，raw URL 可访问）
    log('--- import knowledge to IMA KB ---')
    ok = run([PY, 'scripts/import_knowledge_to_kb.py'], f'{OUT_DIR}/import_knowledge.log')
    log(f'import_knowledge: {"OK" if ok else "FAILED (不影响流程)"}')

    # 5. daily_push — 每天
    log('--- daily_push ---')
    ok = run([PY, 'scripts/daily_push.py'], f'{OUT_DIR}/daily_push.log')
    log(f'daily_push: {"OK" if ok else "FAILED"}')

    print('=== done ===')

if __name__ == '__main__':
    main()
