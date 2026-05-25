# 知识脉络跳转功能建议

## 当前状态

题目数据（questions.js）中没有知识点标签字段，无法直接关联知识脉络节点。

## 建议的数据结构

### 1. 为题目添加 topic 字段

```javascript
// questions.js 中每个题目添加 topic 字段
{
  q: '下列现象中，属于光的折射现象的是（　）',
  opts: ['A. 小孔成像', 'B. 水中筷子看起来变弯了', 'C. 影子的形成', 'D. 平面镜成像'],
  ans: 1,
  exp: '水中筷子变弯是光从水进入空气时发生折射所致，属于折射现象。',
  topic: 'optics'  // 新增：知识点标签
}
```

### 2. 推荐的 topic 值（与知识脉络对应）

#### 物理
- `mechanics` - 力学
- `electricity` - 电学
- `optics` - 光学
- `thermodynamics` - 热学
- `acoustics` - 声学

#### 数学
- `quadratic` - 一元二次方程
- `geometry` - 几何
- `trigonometry` - 三角函数
- `statistics` - 统计概率

#### 化学
- `equations` - 化学方程式
- `acid_base` - 酸碱盐
- `metals` - 金属
- `organic` - 有机物

#### 语文
- `polysemy` - 一词多义
- `poetry` - 诗文默写
- `grammar` - 语病
- `rhetoric` - 修辞
- `literature` - 文学常识

#### 英语
- `vocabulary` - 词汇
- `tense` - 时态
- `clauses` - 从句
- `writing` - 写作

#### 历史
- `opium_war` - 鸦片战争
- `revolution` - 辛亥革命
- `anti_japanese` - 抗日战争
- `reform` - 改革开放

#### 政治
- `constitution` - 宪法
- `rights` - 权利义务
- `rule_of_law` - 法治
- `national_conditions` - 国情

### 3. 实现跳转的代码示例

```javascript
// 在 mindmap.js 中添加跳转逻辑
function jumpToQuestion(topic) {
  // 找到对应 topic 的题目
  var questions = DAILY_QUESTIONS.filter(function(q) {
    return q.topic === topic;
  });
  
  if (questions.length === 0) {
    showToast('暂无相关真题');
    return;
  }
  
  // 随机选择一道题
  var q = questions[Math.floor(Math.random() * questions.length)];
  
  // 打开每日一题弹窗并显示该题
  showQuestionModal(q);
}
```

### 4. 知识脉络数据结构扩展

```javascript
// mindmap-data.js 中为每个节点添加 topic 映射
{
  label: "📌 力学",
  topic: "mechanics",  // 新增：对应题目 topic
  sub: [
    "速度 v=s/t · 匀速/变速",
    "二力平衡 · 同体/等大/反向/共线",
    "压强 p=F/S · 固/液/大气压强"
  ]
}
```

## 实现优先级

1. **第一步**：为 questions.js 中所有题目添加 topic 字段（工作量：56题）
2. **第二步**：为 mindmap-data.js 中叶子节点添加 topic 映射
3. **第三步**：修改 mindmap.js 添加点击事件和跳转逻辑

## 预计工作量

- 数据改造：1-2小时
- 代码实现：30分钟
- 测试验证：30分钟

## 备选方案

如果不想修改 questions.js，可以：
1. 在 mindmap 中添加"查看相关知识点"链接，跳转到对应科目的 basic 页面
2. 在 basic 页面中添加锚点，直接定位到相关知识点
