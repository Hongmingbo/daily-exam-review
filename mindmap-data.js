// 思维导图数据：各科知识结构树
// 格式：{ title, icon, color, url, branches: [{ label, topicId?, sub?: [{ text, topicId? } | string] }] }
// topicId 对应 questions.js 中的 topic 字段，用于跳转到相关真题
window.__ZK_MINDMAP__ = {
  math: {
    title: "数学知识脉络",
    icon: "📐",
    color: "#3498db",
    url: "math_paper.html",
    branches: [
      { label: "📌 核心公式", sub: [
        { text: "勾股定理 · a²+b²=c²", topicId: "几何" },
        { text: "一元二次方程 · 求根公式+韦达定理", topicId: "方程" },
        { text: "圆 · 弧长/扇形/垂径定理", topicId: "几何" },
        { text: "三角函数 · sin²α+cos²α=1", topicId: "三角函数" }
      ]},
      { label: "⚠️ 易混概念", sub: [
        { text: "频率 vs 概率（客观数据 vs 理论值）", topicId: "概率" },
        { text: "全等(≅) vs 相似(∽) · 面积比=相似比²", topicId: "几何" },
        { text: "一次函数 · k管倾斜/方向，b管截距", topicId: "函数" }
      ]},
      { label: "📝 压轴模型", sub: [
        { text: "将军饮马 · 最小值问题", topicId: "几何" },
        { text: "手拉手模型 · 旋转全等", topicId: "几何" },
        { text: "半角模型 · 90°含45°", topicId: "几何" }
      ]},
      { label: "💡 备考重点", sub: [
        { text: "每天默写5个公式", topicId: "" },
        { text: "二次函数+圆综合每天各1题", topicId: "函数" },
        { text: "错题三分类：计算/概念/审题", topicId: "" }
      ]}
    ]
  },
  english: {
    title: "英语知识脉络",
    icon: "📖",
    color: "#9b59b6",
    url: "english_paper.html",
    branches: [
      { label: "📝 高频词汇", sub: [
        { text: "动词短语：look forward to / take part in / put off", topicId: "固定搭配" },
        { text: "形近词：alone vs lonely / receive vs accept", topicId: "词汇" },
        { text: "介词搭配：in/on/at/by 四大金刚", topicId: "固定搭配" }
      ]},
      { label: "📌 核心语法", sub: [
        { text: "定语从句 · who/which/that + 先行词", topicId: "从句" },
        { text: "被动语态 · be + 过去分词", topicId: "被动语态" },
        { text: "宾语从句 · 陈述语序 + 时态呼应", topicId: "从句" }
      ]},
      { label: "🔍 阅读技巧", sub: [
        { text: "四步法：划关键词→读文→定位→选答案", topicId: "" },
        { text: "推理题不能选原文直接陈述", topicId: "" },
        { text: "态度题三选项：positive/negative/neutral", topicId: "" }
      ]},
      { label: "✍️ 写作模板", sub: [
        { text: "开头：With the development of... / Recently...", topicId: "" },
        { text: "中间段三结构：列观点+举例子+做总结", topicId: "" },
        { text: "连接词：however/therefore/furthermore", topicId: "固定搭配" }
      ]}
    ]
  },
  chinese: {
    title: "语文知识脉络",
    icon: "📚",
    color: "#e74c3c",
    url: "chinese_paper.html",
    branches: [
      { label: "📝 必背古诗文", sub: [
        { text: "课内古诗词：理解意象+情感+手法", topicId: "古诗词默写" },
        { text: "文言文实词：之/其/以/为/于 一词多义", topicId: "文言文" },
        { text: "名句默写：高频考句每天背3句", topicId: "古诗词默写" }
      ]},
      { label: "📌 阅读理解", sub: [
        { text: "记叙文：六要素+线索+中心思想", topicId: "写作手法" },
        { text: "说明文：说明方法+语言准确性", topicId: "" },
        { text: "议论文：论点+论据+论证方法", topicId: "" }
      ]},
      { label: "✍️ 作文结构", sub: [
        { text: "开头：引材料+亮观点", topicId: "" },
        { text: "中间：3段式论证或叙事", topicId: "写作手法" },
        { text: "结尾：升华扣题+呼应开头", topicId: "" }
      ]},
      { label: "🔍 病句辨析", sub: [
        { text: "成分残缺：缺主/谓/宾", topicId: "语病" },
        { text: "搭配不当：动宾/主谓不匹配", topicId: "语病" },
        { text: "语序不当：多项定语/状语顺序", topicId: "语病" }
      ]}
    ]
  },
  physics: {
    title: "物理知识脉络",
    icon: "⚡",
    color: "#2ecc71",
    url: "physics_paper.html",
    branches: [
      { label: "📌 力学", topicId: "mechanics", sub: [
        { text: "速度 v=s/t · 匀速/变速", topicId: "mechanics" },
        { text: "二力平衡 · 同体/等大/反向/共线", topicId: "mechanics" },
        { text: "压强 p=F/S · 固/液/大气压强", topicId: "mechanics" }
      ]},
      { label: "⚡ 电学", topicId: "electricity", sub: [
        { text: "欧姆定律 I=U/R · 串反并同", topicId: "electricity" },
        { text: "电功率 P=UI · 额定/实际功率", topicId: "electricity" },
        { text: "动态电路 · 滑动变阻器分析", topicId: "electricity" }
      ]},
      { label: "🔬 热学", topicId: "thermodynamics", sub: [
        { text: "比热容 Q=cmΔt · 热效率", topicId: "thermodynamics" },
        { text: "物态变化：熔化/凝固/汽化/液化", topicId: "thermodynamics" },
        { text: "分子热运动 · 内能与做功", topicId: "thermodynamics" }
      ]},
      { label: "🔭 光学", topicId: "optics", sub: [
        { text: "凸透镜成像 · u>2f/f<u<2f/v>2f", topicId: "optics" },
        { text: "光的反射/折射 · 法线作图", topicId: "optics" }
      ]},
      { label: "🧲 电磁学", topicId: "electromagnetism", sub: [
        { text: "安培定则 · 右手螺旋判断磁极", topicId: "electromagnetism" },
        { text: "左手定则 · 磁场对电流的作用", topicId: "electromagnetism" },
        { text: "电磁感应 · 发电机vs电动机", topicId: "electromagnetism" }
      ]},
      { label: "💡 实验专题", topicId: "", sub: [
        { text: "测电阻 · 伏安法/等效替代", topicId: "electricity" },
        { text: "测密度 · 排水法测体积", topicId: "mechanics" },
        { text: "力学实验 · 二力平衡探究", topicId: "mechanics" }
      ]}
    ]
  },
  chemistry: {
    title: "化学知识脉络",
    icon: "🧪",
    color: "#1abc9c",
    url: "chemistry_paper.html",
    branches: [
      { label: "📌 物质构成", sub: [
        { text: "分子/原子/离子 · 三粒子模型", topicId: "元素" },
        { text: "元素符号 · 熟记常见元素", topicId: "元素" },
        { text: "化学式 · 化合价口诀", topicId: "化学式" }
      ]},
      { label: "⚗️ 化学反应", sub: [
        { text: "四大基本反应类型：化合/分解/置换/复分解", topicId: "化学反应" },
        { text: "质量守恒定律 · 化学方程式配平", topicId: "化学反应" },
        { text: "金属活动性顺序 · KCaNaMgAl...", topicId: "化学反应" }
      ]},
      { label: "🧪 酸碱盐", sub: [
        { text: "酸的通性 · 与指示剂/金属/碱/盐反应", topicId: "酸碱盐" },
        { text: "碱的通性 · 与指示剂/酸/盐反应", topicId: "酸碱盐" },
        { text: "复分解条件 · 生成沉淀/气体/水", topicId: "酸碱盐" }
      ]},
      { label: "💡 计算专题", sub: [
        { text: "化学式计算 · Mr/元素质量比/质量分数", topicId: "化学式" },
        { text: "溶液配制 · 溶质质量=溶液×质量分数", topicId: "溶液" },
        { text: "综合计算 · 图像+表格+标签", topicId: "化学式" }
      ]}
    ]
  },
  history: {
    title: "历史知识脉络",
    icon: "🏛️",
    color: "#d35400",
    url: "history_paper.html",
    branches: [
      { label: "📌 中国古代史", topicId: "古代史", sub: [
        { text: "先秦：诸子百家 · 百家争鸣", topicId: "" },
        { text: "秦汉：统一/郡县制/丝绸之路", topicId: "" },
        { text: "唐宋：三省六部/科举/经济重心南移", topicId: "" }
      ]},
      { label: "⚡ 中国近代史", topicId: "近代史", sub: [
        { text: "鸦片战争：南京条约/半殖民地", topicId: "近代史" },
        { text: "洋务运动：师夷长技以自强", topicId: "近代史" },
        { text: "辛亥革命：同盟会/三民主义/中华民国", topicId: "辛亥革命" }
      ]},
      { label: "🌍 世界史", topicId: "世界史", sub: [
        { text: "英国资产阶级革命 · 君主立宪", topicId: "" },
        { text: "法国大革命 · 自由平等博爱", topicId: "" },
        { text: "两次世界大战 · 凡尔赛-华盛顿体系/雅尔塔体系", topicId: "" }
      ]},
      { label: "💡 答题模板", topicId: "历史答题", sub: [
        { text: "背景：原因+条件（经济/政治/思想）", topicId: "" },
        { text: "影响：积极+消极/短期+长期", topicId: "" },
        { text: "评价：辩证两面+史实支撑", topicId: "" }
      ]}
    ]
  },
  politics: {
    title: "道德与法治脉络",
    icon: "⚖️",
    color: "#8e44ad",
    url: "politics_paper.html",
    branches: [
      { label: "📌 成长中的我", topicId: "成长", sub: [
        { text: "认识自我：优缺点/接纳变化", topicId: "" },
        { text: "学习：自主/合作/探究", topicId: "" },
        { text: "情绪：调控方法（理智/转移/幽默/暗示）", topicId: "" }
      ]},
      { label: "🤝 我与他人", topicId: "交往", sub: [
        { text: "友谊：原则+澄清冲突", topicId: "" },
        { text: "师生：新型关系/主动沟通", topicId: "" },
        { text: "亲子：理解+换位思考", topicId: "" }
      ]},
      { label: "🏛️ 我与社会", sub: [
        { text: "社会规则：道德/法律/纪律", topicId: "法治" },
        { text: "社会秩序：自由与规则的关系", topicId: "法治" },
        { text: "责任：角色→责任→担当", topicId: "宪法" }
      ]},
      { label: "💡 国情国策", topicId: "国情", sub: [
        { text: "基本路线：一个中心两个基本点", topicId: "" },
        { text: "五位一体：经济/政治/文化/社会/生态", topicId: "" },
        { text: "两个百年：中国梦/两个阶段", topicId: "" }
      ]}
    ]
  },
  biology: {
    title: "生物知识脉络",
    icon: "🧬",
    color: "#27ae60",
    url: "biology_paper.html",
    branches: [
      { label: "📌 细胞与新陈代谢", sub: [
        { text: "动物/植物细胞结构", topicId: "" },
        { text: "光合作用：CO₂+H₂O→有机物+O₂", topicId: "" },
        { text: "呼吸作用：有机物+O₂→CO₂+H₂O+能量", topicId: "" }
      ]},
      { label: "👤 人体生理", sub: [
        { text: "消化系统：口腔/胃/小肠/大肠", topicId: "" },
        { text: "循环系统：心脏结构+血液循环", topicId: "" },
        { text: "神经系统：反射弧/非条件/条件反射", topicId: "" }
      ]},
      { label: "🧬 遗传与变异", sub: [
        { text: "基因DNA染色体 · 中心法则", topicId: "" },
        { text: "遗传定律：分离/自由组合", topicId: "" },
        { text: "变异：可遗传/不可遗传", topicId: "" }
      ]},
      { label: "🌏 生物与环境", sub: [
        { text: "生态系统：生产者/消费者/分解者", topicId: "" },
        { text: "食物链/食物网 · 能量金字塔", topicId: "" },
        { text: "保护环境：可持续发展", topicId: "" }
      ]}
    ]
  }
};
