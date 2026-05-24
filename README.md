# 📚 每日中考复习

> 面向福建中考考生的每日复习资料站，7 科轮换、每日更新，手机竖版优先设计。

🌐 **在线访问**：[hdzkfx.dpdns.org](https://hdzkfx.dpdns.org/) ｜ [GitHub Pages](https://hongmingbo.github.io/daily-exam-review/)

---

## ✨ 功能一览

| 功能 | 说明 |
|------|------|
| 📅 每日轮换 | 7 科按周循环，今日科目首页高亮 |
| ⏳ 中考倒计时 | 精确到天，实时更新 |
| 🌙 深色模式 | 跟随系统 + 手动切换，记忆偏好 |
| 🔥 每日打卡 | 每日一题，答对才算打卡，连击天数记录 |
| ⭐ 我的收藏 | 收藏易错题，按科目分组 |
| 🔍 本地搜索 | 纯前端搜索，无需后端 |
| 🧠 知识脉络 | 每科可折叠知识树，快速回顾 |
| ⚡ 双模式切换 | 精简速看 / 完整版一键切换 |
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

## 🏗️ 项目结构

```
├── index.html            ← 首页（每日科目轮播 + 倒计时 + 打卡）
├── style.css             ← 全站样式（7 科独立配色 + 深色模式 + 打印样式）
├── dark-mode.js          ← 深色模式（系统偏好 + 手动切换 + localStorage）
├── features.js           ← 收藏⭐ + 打卡🔥 + 双模式⚡ + 答案折叠
├── questions.js           ← 每日一题题库（7 科各 1 题）
├── mindmap-data.js        ← 7 科知识脉络数据
├── mindmap.js             ← 知识脉络渲染器
├── sw.js                  ← Service Worker（离线缓存）
├── manifest.json          ← PWA manifest
├── [subject]_basic.html   ← 各科知识点复习页（×7）
├── [subject]_paper.html   ← 各科试卷练习页（×7）
├── favorites.html          ← 我的收藏页
├── search.html             ← 本地搜索页
├── about.html              ← 关于 / 更新日志
└── images/                 ← 试卷图片（外置 PNG）
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
- **试卷图片**：外置 PNG + lazy loading，避免 HTML 过大

## 🔧 技术栈

- 纯静态 HTML/CSS/JS，零后端依赖
- Service Worker 离线缓存（network-first + cache-first 策略）
- localStorage 持久化（打卡、收藏、深色模式偏好）
- GitHub Pages + Cloudflare CDN 双部署
- 自动每日更新（Cron Job）

## 📋 内容规范

- **知识点页**：考点速记 + 真题训练 + 复习建议
- **试卷页**：真实试卷扫描图，非 OCR 文字
- **数学/物理公式**：Unicode 字符（²³√≠≤≥ρΩπ×÷），不用 LaTeX
- **内容来源**：IMA 知识库 + 福建省教育考试院等权威平台
- **福建近三年真题优先**（2023-2025 年）

## ⚠️ 免责声明

- 本站内容仅供参考复习使用
- 试题及答案以学校老师和当地官方考纲为准
- 若内容与官方真题不符，请以官方为准

## 📄 许可

本项目仅供学习交流使用，请勿用于商业用途。
