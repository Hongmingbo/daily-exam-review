# 📚 每日中考复习

> 面向福建中考考生的每日复习资料站，7 科轮换、每日更新，手机竖版优先设计。

🌐 **在线访问**：[hdzkfx.dpdns.org](https://hdzkfx.dpdns.org/) ｜ [GitHub Pages](https://hongmingbo.github.io/daily-exam-review/)

---

## ✨ 功能一览

| 功能 | 说明 |
|------|------|
| 📅 每日轮换 | 7 科按周循环（物理→语文→数学→英语→化学→历史→政治），今日科目首页高亮 |
| 📄 每周换卷 | 每科每周自动切换不同真题试卷，9-13 套轮换不重复 |
| ⏳ 中考倒计时 | 精确到天，实时更新（2026 福建中考 6 月 21 日） |
| 🌙 深色模式 | 跟随系统 + 手动切换，localStorage 记忆偏好 |
| 🔥 每日打卡 | 每日一题，答对才算打卡，连击天数记录 |
| ⭐ 我的收藏 | 收藏易错题，按科目分组 |
| 🔍 本地搜索 | 纯前端搜索，无需后端 |
| 🧠 知识脉络 | 每科可折叠知识树，快速回顾 |
| ⚡ 双模式切换 | 精简速看 / 完整版一键切换 |
| 📒 错题本 | 记录并回顾错题，按科目/错因分类，支持核心考点与 1/3/7/15 天复盘提醒 |
| 🚑 考前急救包 | 临考前速查核心知识点 |
| 📱 PWA 支持 | 可添加到手机主屏幕，离线可用 |

## 📖 7 科内容

| 周几 | 科目 | 知识点页 | 试卷页 |
|------|------|----------|--------|
| 周一 | ⚡ 物理 | physics_basic | physics_paper |
| 周二 | 📝 语文 | chinese_basic | chinese_paper |
| 周三 | 📐 数学 | math_basic | math_paper |
| 周四 | 📖 英语 | english_basic | english_paper |
| 周五 | 🧪 化学 | chemistry_basic | chemistry_paper |
| 周六 | 🏛️ 历史 | history_basic | history_paper |
| 周日 | 🎯 政治 | politics_basic | politics_paper |

每科包含**知识点复习**（考点速记 + 真题训练 + 复习建议）和**试卷练习**（真实试卷图片）两个页面。

### 试卷轮换

每科试卷来源为福建省各地市真题（福州、厦门、泉州、宁德、龙岩、南平、莆田、漳州、三明），每周自动切换不同试卷，用完后循环：

| 科目 | 可用套数 | 来源举例 |
|------|---------|---------|
| 物理 | 10 套 | 龙岩、南平、漳州、宁德、莆田、福州、泉州、三明、厦门 |
| 语文 | 9 套 | 宁德、莆田、泉州、福州、龙岩、厦门、南平、漳州、三明 |
| 数学 | 10 套 | 南平、龙岩、宁德、厦门、福州、三明、泉州、莆田、漳州、石狮 |
| 英语 | 9 套 | 厦门、宁德、龙岩、泉州、漳州、福州、三明、南平、莆田 |
| 化学 | 9 套 | 南平、福州、龙岩、宁德、三明、泉州、莆田、漳州、厦门 |
| 历史 | 9 套 | 厦门、南平、莆田、三明、龙岩、福州、泉州、漳州、宁德 |
| 政治 | 13 套 | 丰泽、厦门、宁德、莆田、南平、三明、漳州、龙岩、泉州、福州、晋江 |

## 🏗️ 项目结构

```
├── index.html              ← 首页（每日科目轮播 + 倒计时 + 打卡）
├── style.css               ← 全站样式（7 科独立配色 + 深色模式 + 打印样式）
├── dark-mode.js            ← 深色模式（系统偏好 + 手动切换 + localStorage）
├── features.js             ← 收藏⭐ + 打卡🔥 + 双模式⚡ + 答案折叠
├── questions.js            ← 每日一题题库（7 科各 1 题）
├── mindmap-data.js         ← 7 科知识脉络数据
├── mindmap.js              ← 知识脉络渲染器
├── sw.js                   ← Service Worker（离线缓存，v9）
├── manifest.json           ← PWA manifest
├── [subject]_basic.html    ← 各科知识点复习页（×7）
├── [subject]_paper.html    ← 各科试卷练习页（×7）
├── favorites.html          ← 我的收藏页
├── mistakes.html           ← 错题本
├── search.html             ← 本地搜索页
├── archive.html            ← 周回顾归档
├── emergency.html          ← 考前急救包
├── about.html              ← 关于 / 更新日志
├── images/                 ← 试卷图片（129 张 PNG，~84 MB）
│   ├── {subject}_paper_current/  ← 当前展示试卷
│   └── {city}_{subject}/         ← 历史轮换试卷
├── scripts/                ← 自动化脚本
│   ├── kb_sync.py               ← IMA 知识库 → 网站内容同步
│   ├── download_and_build_papers.py  ← 下载 PDF → 渲染 PNG → 生成试卷页
│   ├── render_papers.py         ← 批量渲染试卷
│   ├── daily_today_marker.py    ← 首页今日科目高亮更新
│   ├── daily_push.py            ← 生成每日推送摘要
│   └── paper_rotation_state.json ← 试卷轮换状态追踪
└── search-index.json       ← 前端搜索索引
```

## 🎨 科目配色

| 科目 | 主色 | 色系 |
|------|------|------|
| 物理 | 🟠 橙金 | 闪电 ⚡ |
| 语文 | 🔴 中国红 | 毛笔 📝 |
| 数学 | 🔵 科技蓝 | 几何 📐 |
| 英语 | 🟣 皇家紫 | 词典 📖 |
| 化学 | 🟢 活力绿 | 试管 🧪 |
| 历史 | 🟠 古典橙 | 石碑 🏛️ |
| 政治 | 🟢 清新青 | 旗帜 🎯 |

## 📱 设计原则

- **Mobile-first**：375px 竖版优先，所有页面适配手机
- **深色模式**：CSS 变量驱动，7 科独立配色深浅双主题
- **数学公式**：纯 Unicode 字符渲染（a²+b²=c²、ρ=m/V），不依赖 KaTeX
- **试卷图片**：外置 PNG + lazy loading，响应式宽度 `width:100%; height:auto`
- **无障碍访问**：语义化 HTML，图片 alt 标签，合理的对比度

## 🔧 技术栈

- 纯静态 HTML/CSS/JS，零后端依赖
- Service Worker 离线缓存策略：
  - HTML → network-first（始终拿最新）
  - CSS/JS → stale-while-revalidate（缓存优先 + 后台静默更新，无需强制刷新）
  - 图片 → cache-first（大文件，随 SW 版本更新）
- localStorage 持久化（打卡、收藏、深色模式偏好、错题记录）
- GitHub Pages + Cloudflare CDN 双部署
- 自动每日更新（Cron Job 20:00 同步内容 → 21:00 推送摘要）

## 🤖 自动化流程

```
每日 20:00  Cron Job 触发
    │
    ├─ kb_sync.py           ← 从 IMA 知识库同步今日科目知识点
    ├─ daily_today_marker.py ← 更新首页今日高亮
    ├─ download_and_build_papers.py today
    │     ├─ 从 IMA KB 下载试卷 PDF
    │     ├─ pymupdf 渲染为 PNG（150 DPI）
    │     ├─ 生成试卷 HTML 页
    │     └─ 试卷轮换：每周换卷，paper_rotation_state.json 追踪
    ├─ daily_push.py        ← 生成推送摘要
    └─ git push origin main → GitHub Pages 自动部署
         │
         └─ 手动 wrangler deploy → Cloudflare Pages CDN

每日 21:00  微信推送今日复习摘要
```

## 📋 内容规范

- **知识点页**：考点速记 + 真题训练 + 复习建议
- **试卷页**：真实试卷扫描图（非 OCR 文字），含答案页
- **数学/物理公式**：Unicode 字符（²³√≠≤≥ρΩπ×÷），不用 LaTeX
- **内容来源**：IMA 知识库 + 福建省教育考试院等权威平台
- **福建近三年真题优先**（2023-2025 年）
- **信源标注**：所有内容标注来源，不确定的信息不编造

## ⚠️ 免责声明

- 本站内容仅供参考复习使用
- 试题及答案以学校老师和当地官方考纲为准
- 若内容与官方真题不符，请以官方为准

## 📄 许可

本项目仅供学习交流使用，请勿用于商业用途。
