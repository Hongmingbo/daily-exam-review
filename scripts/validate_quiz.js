#!/usr/bin/env node
// scripts/validate_quiz.js — 验证 questions.js 题库完整性
// 用法: node scripts/validate_quiz.js

var fs = require('fs');
var path = require('path');

var qPath = path.join(__dirname, '..', 'questions.js');
var src = fs.readFileSync(qPath, 'utf8');
eval(src);

var errors = [];
var warnings = [];
var subjects = ['物理', '语文', '数学', '英语', '化学', '历史', '政治'];
var expectedPerSubject = 30;
var total = DAILY_QUESTIONS.length;

console.log('📋 题库验证: ' + total + ' 题\n');

// Check total count
if (total !== 210 && total !== 212) {
  warnings.push('总题数 ' + total + '（预期 210-212）');
}

// Per-subject validation
for (var s = 0; s < 7; s++) {
  var start = s * 30;
  var end = start + expectedPerSubject;
  var subjectErrors = 0;

  for (var i = start; i < end && i < total; i++) {
    var q = DAILY_QUESTIONS[i];
    var prefix = '[' + subjects[s] + ' #' + (i - start + 1) + ']';

    if (!q) {
      errors.push(prefix + ' 题目缺失');
      subjectErrors++;
      continue;
    }

    // Must have topic
    if (!q.topic) {
      errors.push(prefix + ' 缺少 topic 字段');
      subjectErrors++;
    }

    // Must have question text
    if (!q.q || q.q.length < 5) {
      errors.push(prefix + ' 题目文本过短');
      subjectErrors++;
    }

    // Must have explanation
    if (!q.exp || q.exp.length < 3) {
      errors.push(prefix + ' 缺少解析 (exp)');
      subjectErrors++;
    }

    if (q.type === 'fill') {
      // Fill-in question
      if (!q.ans || q.ans.toString().trim() === '') {
        errors.push(prefix + ' 填空题缺少答案 (ans)');
        subjectErrors++;
      }
    } else {
      // Multiple choice
      if (!q.opts || !Array.isArray(q.opts)) {
        errors.push(prefix + ' 选择题缺少选项 (opts)');
        subjectErrors++;
      } else if (q.opts.length !== 4) {
        errors.push(prefix + ' 选择题选项数量不是4个 (有' + q.opts.length + '个)');
        subjectErrors++;
      }
      if (typeof q.ans !== 'number' || q.ans < 0 || q.ans > 3) {
        errors.push(prefix + ' 选择题答案无效 (ans=' + q.ans + '，应为0-3)');
        subjectErrors++;
      }
    }
  }

  var count = Math.min(end, total) - start;
  var status = subjectErrors === 0 ? '✅' : '❌';
  console.log(status + ' ' + subjects[s] + ': ' + count + ' 题' + (subjectErrors > 0 ? ' (' + subjectErrors + ' 错误)' : ''));
}

// Summary
console.log('\n───────────────────');
if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 全部通过！' + total + ' 题验证无误');
} else {
  if (warnings.length > 0) {
    console.log('\n⚠️  警告:');
    warnings.forEach(function(w) { console.log('  ' + w); });
  }
  if (errors.length > 0) {
    console.log('\n❌ 错误 (' + errors.length + '):');
    errors.forEach(function(e) { console.log('  ' + e); });
    process.exit(1);
  }
}
