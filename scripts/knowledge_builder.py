#!/usr/bin/env python3
"""
knowledge_builder.py — 联网搜索权威学习平台，生成中考知识点复习页面

功能：
  - 联网搜索各科中考知识点（人民教育出版社、学科网、福建教育考试院等权威源）
  - AI 生成结构化知识点内容块（几何、函数、方程等主题）
  - 输出符合 *_basic.html 模板的完整 HTML 页面

依赖：hermes venv Python（绝对路径 sys.executable）
"""
import sys, os, json, subprocess, re
from datetime import date

REPO = os.path.expanduser('~/daily-exam-review')

# 科目配置
SUBJECTS = {
    'math': {
        'name': '数学',
        'emoji': '📐',
        'color': '#3498db',
        'badge': '核心公式 · 数学',
        'topics': '几何 · 方程 · 函数 · 概率 · 三角函数',
        'header_bg': 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        'header_class': 'math-header',
        'page': 'math_basic.html',
    },
    'chinese': {
        'name': '语文',
        'emoji': '📝',
        'color': '#e74c3c',
        'badge': '核心知识点 · 语文',
        'topics': '古诗文 · 现代文 · 作文 · 语法',
        'header_bg': 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        'header_class': 'chinese-header',
        'page': 'chinese_basic.html',
    },
    'english': {
        'name': '英语',
        'emoji': '📖',
        'color': '#9b59b6',
        'badge': '核心词汇语法 · 英语',
        'topics': '词汇 · 语法 · 阅读 · 写作',
        'header_bg': 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
        'header_class': 'english-header',
        'page': 'english_basic.html',
    },
    'physics': {
        'name': '物理',
        'emoji': '⚡',
        'color': '#f39c12',
        'badge': '核心公式 · 物理',
        'topics': '力学 · 电学 · 光学 · 热学',
        'header_bg': 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
        'header_class': 'physics-header',
        'page': 'physics_basic.html',
    },
    'chemistry': {
        'name': '化学',
        'emoji': '🧪',
        'color': '#27ae60',
        'badge': '核心方程式 · 化学',
        'topics': '物质结构 · 反应类型 · 计算 · 实验',
        'header_bg': 'linear-gradient(135deg, #27ae60 0%, #1e8449 100%)',
        'header_class': 'chemistry-header',
        'page': 'chemistry_basic.html',
    },
    'history': {
        'name': '历史',
        'emoji': '🏛️',
        'color': '#e67e22',
        'badge': '核心时间线 · 历史',
        'topics': '中国古代史 · 中国近代史 · 世界史',
        'header_bg': 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
        'header_class': 'history-header',
        'page': 'history_basic.html',
    },
    'politics': {
        'name': '政治',
        'emoji': '🎯',
        'color': '#1abc9c',
        'badge': '核心时政要点 · 政治',
        'topics': '道德与法治 · 国情教育 · 时政',
        'header_bg': 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)',
        'header_class': 'politics-header',
        'page': 'politics_basic.html',
    },
}

# AI 提示词：各科目知识点内容生成
PROMPTS = {
    'math': """搜索并总结 2026 年福建省中考数学核心知识点，要求：
1. 搜索来源：人民教育出版社、数学学科网、福建教育考试院
2. 覆盖模块：几何（三角形/圆/相似）、方程与不等式、函数（一次/二次/反比例）、统计概率、锐角三角函数
3. 每个模块包含：核心公式/定理 + 常见考法 + 易错点
4. 输出格式：严格 JSON 数组，每个元素 {topic, title, formula, explanation, tip}

示例格式：
[
  {"topic": "几何", "title": "三角形常用结论", "formula": "勾股定理：a²+b²=c²；内角和=180°", "explanation": "直角三角形先找斜边；含30°角时，对边=斜边一半。", "tip": "三边比例满足 3:4:5 时必为直角三角形。"},
  ...
]

只输出 JSON，不要其他文字。""",

    'chinese': """搜索并总结 2026 年福建省中考语文核心知识点，要求：
1. 搜索来源：语文出版社、福建中考语文大纲、中华语文网
2. 覆盖模块：古诗文默写（重点篇目+易错字）、现代文阅读技巧、作文结构模板、语法基础
3. 每个模块包含：核心知识点 + 考法 + 易错点
4. 输出格式：严格 JSON 数组，每个元素 {topic, title, formula, explanation, tip}

只输出 JSON，不要其他文字。""",

    'english': """搜索并总结 2026 年福建省中考英语核心知识点，要求：
1. 搜索来源：英语学科网、福建中考英语大纲、人教社英语
2. 覆盖模块：1600 考纲词汇（高频词组搭配）、语法填空技巧、阅读理解题型、书面表达模板
3. 每个模块包含：核心词汇/结构 + 用法 + 易错点
4. 输出格式：严格 JSON 数组，每个元素 {topic, title, formula, explanation, tip}

只输出 JSON，不要其他文字。""",

    'physics': """搜索并总结 2026 年福建省中考物理核心知识点，要求：
1. 搜索来源：人民教育出版社物理、福建中考物理大纲
2. 覆盖模块：力学（力与运动/压强/浮力）、电学（电路/欧姆定律/电功率）、光学（反射/折射/凸透镜）、热学
3. 每个模块包含：核心公式 + 实验原理 + 易错点
4. 输出格式：严格 JSON 数组，每个元素 {topic, title, formula, explanation, tip}

只输出 JSON，不要其他文字。""",

    'chemistry': """搜索并总结 2026 年福建省中考化学核心知识点，要求：
1. 搜索来源：人民教育出版社化学、福建中考化学大纲、化学学科网
2. 覆盖模块：物质构成（原子结构/化学式）、化学反应（类型/方程式）、溶液与溶解度、化学计算
3. 每个模块包含：核心方程式/概念 + 实验现象 + 易错点
4. 输出格式：严格 JSON 数组，每个元素 {topic, title, formula, explanation, tip}

只输出 JSON，不要其他文字。""",

    'history': """搜索并总结 2026 年福建省中考历史核心知识点，要求：
1. 搜索来源：历史学科网、福建中考历史大纲、人民教育出版社历史
2. 覆盖模块：中国古代史（朝代更替/重大改革）、中国近代史（鸦片战争/辛亥革命/五四运动）、世界史（工业革命/两次世界大战）
3. 每个模块包含：时间线索 + 重大事件 + 影响/意义
4. 输出格式：严格 JSON 数组，每个元素 {topic, title, formula, explanation, tip}

只输出 JSON，不要其他文字。""",

    'politics': """搜索并总结 2026 年福建省中考道德与法治（政治）核心知识点，要求：
1. 搜索来源：福建中考政治大纲、道德与法治教材
2. 覆盖模块：心理健康与道德、法律常识、国情教育、时政热点
3. 每个模块包含：核心观点 + 常见考法 + 易错点
4. 输出格式：严格 JSON 数组，每个元素 {topic, title, formula, explanation, tip}

只输出 JSON，不要其他文字。""",
}


def escape_html(text):
    """HTML 安全转义"""
    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'))


def build_topic_cards(knowledge_list, color):
    """将知识点 JSON 数组渲染为 HTML 卡片"""
    html = []
    for item in knowledge_list:
        topic = escape_html(item.get('topic', ''))
        title = escape_html(item.get('title', ''))
        formula = escape_html(item.get('formula', ''))
        explanation = escape_html(item.get('explanation', ''))
        tip = escape_html(item.get('tip', ''))

        html.append(f'''  <div class="content-card" data-topic="{topic}">
    <h2>📌 {title}</h2>
    <div class="formula-box">
      <strong>{topic}核心</strong>
      <div class="math-block">{formula}</div>
      <p><strong>说明：</strong>{explanation}</p>
    </div>
    <div class="formula-box">
      <p><strong>易错/提分：</strong>{tip}</p>
    </div>
  </div>''')
    return '\n'.join(html)


def build_today_action(subject_key, color):
    """生成"今日提分动作"区块"""
    actions = {
        'math': [
            ('读题顺序', '条件分类：长度/角度/平行/垂直/圆', '把条件写到图上，别只在脑子里想。'),
            ('辅助线优先级', '连半径、作高、作平行、构造中点', '不会做时先问：能不能造全等/相似？'),
            ('验收标准', '今晚做2道几何综合题，每题写出辅助线理由', '做完能说清"为什么这样连线"才算完成。'),
        ],
        'chinese': [
            ('古诗文背诵', '每天默写1首重点古诗，标出易错字', '写完后立刻对照原文，用红笔批改。'),
            ('现代文答题套路', '记叙文：找线索/中心/修辞；说明文：找方法/顺序/语言；议论文：找论点/论据/论证', '答案要从原文中找依据，不要自己发挥。'),
            ('作文开头结尾', '开头：引用/悬念/景物描写；结尾：呼应开头/升华主旨', '准备3个万能开头模板，考场上直接套用。'),
        ],
        'english': [
            ('词汇复习', '每天背20个高频词组搭配，写在笔记本上', '只记中文不够，要记例句和搭配。'),
            ('语法填空', '先判断词性，再考虑形式变化（单复数/时态/比较级）', '找不到线索时，联系上下文语境。'),
            ('阅读理解', '先看题干再回原文找答案区间，细节题不选绝对化表述', '遇到生词不要慌，联系上下文猜意思。'),
        ],
        'physics': [
            ('公式默写', '每天默写3个核心公式，对着检查', '单位写错整题零分，注意物理量的单位。'),
            ('受力分析', '先整体后隔离，先重力后弹力再摩擦力', '静止/匀速＝合力为零，这是列方程的依据。'),
            ('电路分析', '先判断串并联，再找电压表测谁、电流表测谁', '电压表当开路，电流表当导线。'),
        ],
        'chemistry': [
            ('化学方程式', '每天写5个核心反应方程式，注明反应类型和现象', '写方程式前先配平，检验气体/沉淀符号。'),
            ('实验现象', '记忆氧气/氢气/二氧化碳/铁燃烧的典型现象', '描述现象不能说生成物名称（如"生成水"），要说"液滴"。'),
            ('计算题套路', '质量守恒：反应前后总质量相等；溶液：溶质质量÷溶液质量', '列比例式时上下单位要一致。'),
        ],
        'history': [
            ('时间轴背诵', '用时间轴串起重大事件，标注背景/经过/影响', '同一时期的中外事件可以对比记忆。'),
            ('意义/影响答题', '对内+对外，政治+经济+思想多角度作答', '先写直接意义，再写深远影响。'),
            ('材料题技巧', '先看问题再看材料，边读边画关键词', '答案尽量用材料原词，不要自己总结。'),
        ],
        'politics': [
            ('关键词背诵', '依法治国/改革开放/生态文明等核心概念的完整表述', '表述要准确，不要用自己的话概括。'),
            ('时政热点', '关注近半年重大国内国际事件，会与教材知识点结合', '时政不是背新闻，而是找知识点。'),
            ('题型套路', '选择题：排除绝对化/无关项；非选题：原理+材料+分析', '非选题一定要写"原理"，不能只抄材料。'),
        ],
    }
    items = actions.get(subject_key, actions['math'])
    html = ['  <div class="content-card" data-topic="提分">\n    <h2>💡 今日提分动作：针对性训练</h2>']
    for title, formula, tip in items:
        html.append(f'''    <div class="formula-box">
      <strong>① {title}</strong>
      <div class="math-block">{escape_html(formula)}</div>
      <p><strong>说明：</strong>{escape_html(tip)}</p>
    </div>''')
    html.append('  </div>')
    return '\n'.join(html)


def build_html_page(subject_key, config, knowledge_list):
    """生成完整的 *_basic.html 页面"""
    color = config['color']
    today = date.today().strftime('%Y年%m月%d日')
    header_bg = config['header_bg']
    header_class = config['header_class']
    emoji = config['emoji']
    name = config['name']
    badge = config['badge']
    topics = config['topics']
    page = config['page']

    topic_cards = build_topic_cards(knowledge_list, color)
    today_action = build_today_action(subject_key, color)

    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{emoji} {name} · 知识点复习 - 每日中考复习</title>
  <link rel="stylesheet" href="style.css">
  <style>
  .{header_class} {{ background: {header_bg}; color: white; padding: 1.8rem 1rem 1.5rem; border-radius: 0 0 24px 24px; margin-bottom: 1.2rem; position: relative; overflow: hidden; }}
  .{header_class}::before {{ content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat; }}
  .{header_class} h1 {{ font-size: 1.5rem; font-weight: 700; margin-bottom: 0.2rem; position: relative; }}
  .{header_class} p {{ opacity: 0.85; font-size: 0.85rem; position: relative; }}
  .{header_class} .badge {{ display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 3px 12px; font-size: 0.78rem; margin-top: 6px; }}
  </style>
<link rel="manifest" href="manifest.json">
</head>
<body>
<button id="dark-toggle" onclick="window._zkDarkToggle()" aria-label="切换深色模式">🌙 深色</button>
<header class="{header_class}">
  <a href="index.html" style="color:rgba(255,255,255,0.8);text-decoration:none;font-size:0.85rem;position:relative;display:block;margin-bottom:0.4rem">← 返回首页</a>
  <h1>{emoji} {name} · 知识点复习</h1>
  <p>{topics} · {today}</p>
  <span class="badge">{badge}</span>
</header>

<div class="container">
{topic_cards}
{today_action}

  <div class="page-nav">
    <a href="{subject_key}_paper.html">← 试卷练习</a>
    <a href="index.html" class="next">返回首页 →</a>
  </div>
</div>

<script src="dark-mode.js"></script>
<script>
if ('serviceWorker' in navigator) {{
  navigator.serviceWorker.register('sw.js').catch(function(e) {{ console.warn('SW register failed', e); }});
}}
</script>
<script defer src="utils.js"></script>
<script defer src="questions.js"></script>
<script defer src="favorites.js"></script>
<script defer src="quiz.js"></script>
<script defer src="paper.js"></script>
<script defer src="mode.js"></script>
<script defer src="study-time.js"></script>
<script defer src="features.js"></script>
<script defer src="mindmap-data.js"></script>
<script defer src="mindmap.js"></script>
</body>
</html>'''


def call_ai_knowledge(prompt, subject_key):
    """调用 AI 生成知识点内容（通过 hermes 的 RawChat provider）"""
    import urllib.request, urllib.error, json as jsonmod

    api_url = 'https://new.sharedchat.cc/codex/v1/responses'
    api_key = os.environ.get('RAWCHAT_API_KEY', '')
    if not api_key:
        return None

    payload = {
        'model': 'gpt-5.5',
        'input': prompt,
        'max_output_tokens': 4000,
    }
    req = urllib.request.Request(
        api_url,
        data=jsonmod.dumps(payload).encode(),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = jsonmod.loads(resp.read())
            text = result.get('output', '')
            # 尝试从响应中提取 JSON
            return extract_json(text)
    except Exception as e:
        print(f'  [AI call failed: {e}]')
        return None


def extract_json(text):
    """从 AI 输出中提取 JSON 数组"""
    # 去掉 markdown 代码块
    text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^```\s*$', '', text, flags=re.MULTILINE)
    text = text.strip()
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass
    # 尝试找 JSON 数组
    match = re.search(r'\[\s*\{.*\}\s*\]', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass
    return None


def load_cached_knowledge(subject_key):
    """从本地缓存读取知识点 JSON（knowledge_to_kb.py 生成）"""
    cache_path = os.path.join(REPO, 'knowledge_cache', f'{subject_key}_knowledge.json')
    if os.path.exists(cache_path):
        try:
            data = json.loads(open(cache_path, encoding='utf-8').read())
            if isinstance(data, list) and len(data) > 0:
                return data
        except Exception:
            pass
    return None


def build_knowledge_page(subject_key, config):
    """为单个科目构建知识点页面"""
    print(f'  Building {subject_key}...')
    prompt = PROMPTS.get(subject_key, PROMPTS['math'])

    # 优先级：本地缓存 > AI 生成 > 静态 fallback
    knowledge_list = load_cached_knowledge(subject_key)
    if knowledge_list:
        print(f'  [Cache hit: {len(knowledge_list)} topics]')
    else:
        knowledge_list = call_ai_knowledge(prompt, subject_key)
        if knowledge_list is None or len(knowledge_list) == 0:
            print(f'  [AI failed, using fallback for {subject_key}]')
            knowledge_list = get_fallback_knowledge(subject_key)

    html = build_html_page(subject_key, config, knowledge_list)
    page_path = os.path.join(REPO, config['page'])
    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'  [OK] {config["page"]} ({len(knowledge_list)} topics)')
    return True


def get_fallback_knowledge(subject_key):
    """备用知识点（AI 不可用时使用，基于考纲的静态内容）"""
    fallbacks = {
        'math': [
            {'topic': '几何', 'title': '三角形常用结论', 'formula': '勾股定理：a²+b²=c²；内角和=180°', 'explanation': '直角三角形先找斜边；含30°角时，对边=斜边一半。', 'tip': '三边比例满足 3:4:5 时必为直角三角形。'},
            {'topic': '几何', 'title': '全等与相似', 'formula': '全等：SSS/SAS/ASA/AAS/HL；相似：AA/SAS/SSS', 'explanation': '相似比=k，周长比=k，面积比=k²。', 'tip': '找不到条件时先构造全等/相似三角形。'},
            {'topic': '几何', 'title': '圆的高频定理', 'formula': '垂径定理：垂直于弦的直径平分弦和弧', 'explanation': '遇到圆先连半径，半径相等常制造等腰三角形。', 'tip': '圆心角=2×圆周角，同弧所对圆周角相等。'},
            {'topic': '方程', 'title': '一元二次方程', 'formula': 'ax²+bx+c=0；Δ=b²-4ac', 'explanation': 'Δ>0 两根，Δ=0 一根，Δ<0 无实根。', 'tip': '韦达定理：x₁+x₂=-b/a，x₁x₂=c/a，用于求参数。'},
            {'topic': '方程', 'title': '分式方程', 'formula': '去分母 → 解整式方程 → 验根', 'explanation': '验根是必写步骤，分母为0的根要舍去。', 'tip': '增根必须舍去！做题时一定要写验根步骤。'},
            {'topic': '函数', 'title': '一次函数', 'formula': 'y=kx+b', 'explanation': 'k定升降，b定截距；k>0 上升，k<0 下降。', 'tip': 'k和b的符号决定直线位置，过原点时b=0。'},
            {'topic': '函数', 'title': '二次函数', 'formula': 'y=a(x-h)²+k，顶点(h,k)', 'explanation': '顶点(h,k)，对称轴 x=h；a>0 开口向上，a<0 向下。', 'tip': '求最值用顶点公式，与x轴交点个数看Δ。'},
            {'topic': '函数', 'title': '反比例函数', 'formula': 'y=k/x', 'explanation': 'k>0 在一三象限，k<0 在二四象限。', 'tip': '双曲线与坐标轴不相交，面积问题常用|k|。'},
            {'topic': '概率', 'title': '概率公式', 'formula': 'P(A)=事件A可能结果数/所有等可能结果数', 'explanation': '必须是等可能事件，不等可能不能硬套。', 'tip': '列表法/树状图法求等可能结果数。'},
            {'topic': '概率', 'title': '中位数/众数/平均数', 'formula': '中位数先排序；众数看出现次数最多', 'explanation': '平均数易受极端值影响，中位数更稳定。', 'tip': '加权平均数：各数据乘权再求和除总数。'},
            {'topic': '三角函数', 'title': '锐角三角函数定义', 'formula': 'sinA=对边/斜边，cosA=邻边/斜边，tanA=对边/邻边', 'explanation': '先找角A，再定对边和邻边。', 'tip': 'sin²A+cos²A=1，同角三角函数基本关系。'},
            {'topic': '三角函数', 'title': '特殊角三角函数值', 'formula': '30°：1/2, √3/2, √3/3；45°：√2/2, √2/2, 1；60°：√3/2, 1/2, √3', 'explanation': '特殊角值要默写，解直角三角形常直接用。', 'tip': '可用直角三角形边长比记忆：3-4-5→30-60-90。'},
        ],
        'chinese': [
            {'topic': '古诗文', 'title': '重点古诗词默写', 'formula': '《论语》《孟子》《庄子》重要段落+初中语文课程标准篇目', 'explanation': '先背名句再背全篇，注意诗体特点和作者情感。', 'tip': '易错字：用红笔圈出每天默写出错的字，重点标记。'},
            {'topic': '古诗文', 'title': '古诗文意象与情感', 'formula': '月亮=思乡，菊花=隐逸，梅花=高洁，鸿雁=书信/思归', 'explanation': '意象是理解古诗情感的钥匙，同一意象在不同诗中情感相似。', 'tip': '常见情感：忧国忧民、建功立业、离愁别绪、山水田园。'},
            {'topic': '现代文', 'title': '记叙文阅读套路', 'formula': '找线索→定六要素→析手法→悟主旨', 'explanation': '标题作用/线索判断/人物形象分析/环境描写作用', 'tip': '答题格式：手法+内容+情感/主题。'},
            {'topic': '现代文', 'title': '说明文阅读套路', 'formula': '找说明对象→抓特征→理顺序→析方法→品语言', 'explanation': '说明方法：举例子、列数字、作比较、打比方、分类别。', 'tip': '说明文语言准确性：修饰限制词是高频考点。'},
            {'topic': '写作', 'title': '作文结构模板', 'formula': '开头（点题+引材料）→主体（2-3件事/2-3个层次）→结尾（升华呼应）', 'explanation': '准备3个万能开头模板和结尾升华句式。', 'tip': '字数：初中作文600字左右，宁可多写不要少写。'},
            {'topic': '语法', 'title': '病句辨析', 'formula': '成分残缺/搭配不当/语序不当/重复累赘/表意不明', 'explanation': '用"主干分析法"找主谓宾，先判断病因再修改。', 'tip': '看到"通过...使..."基本是成分残缺。'},
        ],
        'english': [
            {'topic': '词汇', 'title': '1600考纲核心词汇', 'formula': '掌握名词/动词/形容词的高频搭配和一词多义', 'explanation': '只背中文不够，要记词组搭配和例句。', 'tip': '每天背20个，分早中晚三次复习，不容易忘。'},
            {'topic': '语法', 'title': '时态综合', 'formula': '一般现在/过去/将来；现在/过去/将来进行；现在/过去/将来完成', 'explanation': '时间状语是判断时态的关键标志。', 'tip': '关键词：already/yet/for/since → 完成时；now/right now → 进行时。'},
            {'topic': '语法', 'title': '被动语态', 'formula': 'be+动词过去分词；各种时态的被动形式', 'explanation': '主语是动作的承受者时用被动，主语是发出者时用主动。', 'tip': '不及物动词没有被动语态，如happen/arrive/belong to。'},
            {'topic': '阅读', 'title': '阅读理解技巧', 'formula': '先看题干→定位原文→对比选项→排除绝对化表述', 'explanation': '正确答案多为原文的同义改写，不是字面照抄。', 'tip': '遇到生词联系上下文猜；主旨题看首尾段。'},
            {'topic': '写作', 'title': '书面表达模板', 'formula': '开头（回应题目）→主体（2-3点）→结尾（总结/建议）', 'explanation': '用连接词：firstly/secondly/however/in conclusion。', 'tip': '字迹工整比内容更重要，阅卷老师第一眼印象分很关键。'},
            {'topic': '完形', 'title': '完形填空技巧', 'formula': '先通读全文掌握大意→逐空试填→复查连贯性', 'explanation': '上下文语境是解题关键，不要凭感觉选。', 'tip': '常见固定搭配：make progress/dream come true/take part in。'},
        ],
        'physics': [
            {'topic': '力学', 'title': '速度与运动', 'formula': 'v=s/t；匀速直线运动：路程与时间成正比', 'explanation': '注意单位换算：1m/s=3.6km/h。', 'tip': '图像题：s-t图斜率=速度，v-t图面积=路程。'},
            {'topic': '力学', 'title': '力与压强', 'formula': 'P=F/S；液体压强：P=ρgh', 'explanation': '固体压强先求F再除S；液体压强只看ρ和h。', 'tip': '容器底受到的压力不一定等于液体重力（形状不同）。'},
            {'topic': '力学', 'title': '浮力', 'formula': 'F浮=G排=ρ液gV排；漂浮/悬浮：F浮=G物', 'explanation': 'V排是物体浸入液体的体积，不是总体积。', 'tip': '判断浮沉：比较ρ物和ρ液，或比较G物和F浮。'},
            {'topic': '力学', 'title': '功和机械效率', 'formula': 'W=Fs；P=W/t；η=W有/W总', 'explanation': '额外功：克服动滑轮重力、摩擦力做功。', 'tip': '滑轮组：n股绳子吊着物体，s=nh，v绳=nv物。'},
            {'topic': '电学', 'title': '欧姆定律', 'formula': 'I=U/R；串联分压：U1/U2=R1/R2；并联分流：I1/I2=R2/R1', 'explanation': '电阻是导体本身属性，与U、I无关。', 'tip': '短路：电流不经过用电器；断路：电路不通。'},
            {'topic': '电学', 'title': '电功率', 'formula': 'P=UI=U²/R=I²R；电能：W=Pt', 'explanation': '实际功率决定亮度，额定功率是标称值。', 'tip': '电能表：3000r/kWh，铝盘转数÷3000=用电度数。'},
            {'topic': '光学', 'title': '光的反射与折射', 'formula': '反射定律：入射角=反射角；折射：空气角最大', 'explanation': '反射和折射都在同一平面内。', 'tip': '平面镜成像：像与物关于镜面对称，大小相等。'},
            {'topic': '光学', 'title': '凸透镜成像', 'formula': 'u>2f：倒立缩小实像（照相机）；f<u<2f：倒立放大实像（投影仪）', 'explanation': 'u<f：正立放大虚像（放大镜）。', 'tip': '口诀：一倍焦距分虚实，二倍焦距分大小。'},
            {'topic': '热学', 'title': '比热容与热值', 'formula': 'Q=cmΔt；燃料：Q=qm；热效率：η=Q吸/Q放', 'explanation': '水的比热容最大，吸放热能力强，保温好。', 'tip': '图像题：比较斜率判断c大小。'},
        ],
        'chemistry': [
            {'topic': '物质构成', 'title': '原子结构', 'formula': '原子核（质子+中子）+核外电子；原子序数=质子数=核电荷数', 'explanation': '相对原子质量≈质子数+中子数。', 'tip': '同种原子质子数相同，离子是得失电子后的带电原子。'},
            {'topic': '化学反应', 'title': '四种基本反应类型', 'formula': '化合反应：A+B→AB；分解反应：AB→A+B；置换反应：A+BC→AC+B；复分解反应：AB+CD→AD+CB', 'explanation': '置换反应有单质和化合物生成单质和化合物。', 'tip': '复分解反应条件：生成沉淀/气体/水，三有其一即可。'},
            {'topic': '化学反应', 'title': '质量守恒定律', 'formula': '反应前后原子种类/数目/质量不变；化学方程式配平', 'explanation': '配平时改系数不改化学式。', 'tip': '利用守恒：已知一种物质质量，可推算其他物质质量。'},
            {'topic': '溶液', 'title': '溶解度与溶质质量分数', 'formula': '溶解度：100g溶剂最多溶解溶质质量；w%=m质/m液×100%', 'explanation': '饱和溶液才能用溶解度计算，不饱和溶液先转饱和。', 'tip': '加溶质/降温/蒸发溶剂使不饱和溶液变饱和。'},
            {'topic': '计算', 'title': '化学方程式计算', 'formula': '利用化学方程式找已知量和未知量的比例关系', 'explanation': '纯物质质量代入方程式，按比例计算。', 'tip': '格式：设→写→找→列→求→答，每步都要写。'},
            {'topic': '实验', 'title': '氧气/二氧化碳/氢气制备', 'formula': 'O₂：KMnO₄/KClO₃+MnO₂；CO₂：大理石+稀盐酸；H₂：Zn+稀H₂SO₄', 'explanation': '实验室制气体原理、装置选择、收集方法、检验验满。', 'tip': 'O₂验满：用带火星木条放瓶口；CO₂验满：用燃着木条放瓶口。'},
        ],
        'history': [
            {'topic': '中国古代史', 'title': '朝代更替与重大改革', 'formula': '秦：统一（文字/货币/度量衡）；汉：文景之治/汉武帝大一统', 'explanation': '记住各朝代政治制度创新和经济政策特点。', 'tip': '改革类题目：商鞅变法/王安石变法/洋务运动。'},
            {'topic': '中国近代史', 'title': '鸦片战争到五四运动', 'formula': '鸦片战争（1840）→南京条约；甲午战争（1894）→马关条约；辛亥革命（1911）；五四运动（1919）', 'explanation': '中国近代史是屈辱史+抗争史+探索史。', 'tip': '时间轴法：按时间顺序梳理每个重大事件的意义。'},
            {'topic': '世界史', 'title': '工业革命与两次世界大战', 'formula': '第一次工业革命：蒸汽时代（英国）；第二次工业革命：电气时代；两次世界大战', 'explanation': '工业革命改变社会结构和国际格局。', 'tip': '比较两次世界大战：原因/性质/影响/参战国阵营。'},
            {'topic': '历史', 'title': '意义/影响答题套路', 'formula': '国内+国外；政治+经济+思想文化；直接影响+深远意义', 'explanation': '按"是什么→为什么→怎么样了"组织答案。', 'tip': '用材料中的关键词，不要过度发挥。'},
            {'topic': '历史', 'title': '材料题技巧', 'formula': '先看问题→带着问题读材料→边读边标注关键词', 'explanation': '答案在材料中，直接提取+概括即可。', 'tip': '分点作答，每点前面加序号。'},
        ],
        'politics': [
            {'topic': '道德', 'title': '珍爱生命与心理健康', 'formula': '生命价值：创造价值+奉献社会；挫折：双重性→面对挫折态度', 'explanation': '延伸：敬畏生命/守护生命/提升生命价值。', 'tip': '答题：结合材料→联系教材观点→升华到实际行动。'},
            {'topic': '法律', 'title': '宪法与公民权利', 'formula': '公民基本权利：平等权/政治权利/宗教信仰自由/监督权/社会经济权利', 'explanation': '公民基本义务：维护国家统一/依法纳税/服兵役/受教育。', 'tip': '公民维权的合法途径：协商→调解→仲裁→诉讼。'},
            {'topic': '国情', 'title': '改革开放与经济发展', 'formula': '改革开放是强国之路；社会主义市场经济；创新驱动发展', 'explanation': '我国主要矛盾：人民日益增长的美好生活需要和不平衡不充分发展之间的矛盾。', 'tip': '热点：共同富裕/高质量发展/中国式现代化。'},
            {'topic': '时政', 'title': '2026年时政热点', 'formula': '关注两会精神、重大科技成就、国际重要合作', 'explanation': '时政与教材结合：找到对应的知识点。', 'tip': '准备一个时政本，记录每月重大事件和对应的政治知识点。'},
            {'topic': '答题', 'title': '非选题答题套路', 'formula': '原理（知识点）+材料分析+结论', 'explanation': '一定要先写"原理"，不能只抄材料。', 'tip': '分点做答，用学科语言，不要口语化。'},
        ],
    }
    return fallbacks.get(subject_key, fallbacks['math'])


########################################
# 主程序
if __name__ == '__main__':
    print(f'=== knowledge_builder {date.today().isoformat()} ===')
    changed = []
    for subj_key, config in SUBJECTS.items():
        try:
            if build_knowledge_page(subj_key, config):
                changed.append(config['page'])
        except Exception as e:
            print(f'  [{subj_key} FAILED: {e}]')
    print(f'\n=== Done. Built: {changed} ===')
