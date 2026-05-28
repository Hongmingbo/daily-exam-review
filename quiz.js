// quiz.js — 每日一题（5题连做模式）
(function () {
  'use strict';

  var QUIZ_KEY = 'zk-daily-quiz';
  function getQuiz() { try { return JSON.parse(localStorage.getItem(QUIZ_KEY)) || {}; } catch(e) { return {}; } }
  function setQuiz(obj) { try { localStorage.setItem(QUIZ_KEY, JSON.stringify(obj)); } catch(e) {} }

  function initDailyQuiz() {
    var btn = document.getElementById('daily-quiz-btn');
    if (!btn) return;
    var quiz = getQuiz();
    var today = ZK.todayStr();
    if (quiz.date === today && quiz.done) {
      btn.textContent = '🏆 今日5题已完成';
      btn.onclick = function() { showQuizDoneModal(); };
    } else if (quiz.date === today) {
      var cnt = quiz.count || 0;
      btn.textContent = '📝 今日已答 ' + cnt + '/5';
      btn.onclick = function() { showDailyQuestionModal(btn); };
    } else {
      btn.onclick = function() { showDailyQuestionModal(btn); };
    }
  }

  window.showDailyQuestionModal = function(btn) {
    var dow = new Date().getDay();
    var subjectIdx = (dow === 0) ? 6 : dow - 1;
    var startIdx = subjectIdx * 30;
    var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    var quiz = getQuiz();
    var today = ZK.todayStr();
    var currentCount = (quiz.date === today) ? (quiz.count || 0) : 0;
    if (currentCount >= 5) { showQuizDoneModal(); return; }
    var qIndex = startIdx + ((dayOfYear + currentCount) % 30);
    var q = DAILY_QUESTIONS[qIndex];
    if (!q) return;

    var existing = document.getElementById('zk-q-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'zk-q-modal';
    modal.className = 'zk-modal-overlay';

    var card = document.createElement('div');
    card.className = 'zk-modal-card';

    var subjectLabels = ['⚡物理','📝语文','📐数学','📖英语','🧪化学','🏛️历史','🎯政治'];
    var colors = ['#f39c12','#e74c3c','#3498db','#9b59b6','#27ae60','#e67e22','#1abc9c'];
    var subjColor = colors[subjectIdx] || '#f39c12';

    var isFill = (q.type === 'fill');
    var fillParts = isFill ? (q.ans || '').split('，').length : 1;
    var inputHtml = '';
    if (isFill) {
      if (fillParts > 1) {
        inputHtml = '<div id="zk-q-fills" style="display:flex;flex-direction:column;gap:10px">';
        for (var fi = 0; fi < fillParts; fi++) {
          inputHtml += '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:0.82rem;color:#64748b;white-space:nowrap">空' + (fi+1) + '：</span>' +
            '<input class="zk-q-fill-item zk-modal-input" data-idx="' + fi + '" type="text" placeholder="输入第' + (fi+1) + '个答案..." style="flex:1">' +
            '</div>';
        }
        inputHtml += '</div>';
      } else {
        inputHtml = '<input id="zk-q-fill" class="zk-modal-input" type="text" placeholder="输入答案...">';
      }
    }

    card.innerHTML = [
      '<div style="text-align:center;margin-bottom:16px">',
        '<span class="zk-modal-subject" style="background:' + subjColor + '">',
          '📝 每日一题 · ' + subjectLabels[subjectIdx] + (isFill ? ' · 填空题' : ''),
        '</span>',
      '</div>',
      '<p class="zk-modal-question">' + q.q + '</p>',
      inputHtml,
      '<div id="zk-q-options" class="zk-modal-options"></div>',
      '<div id="zk-q-result" class="zk-modal-result"></div>',
      '<div class="zk-modal-btns" id="zk-q-btns">',
        '<button id="zk-q-submit" class="zk-modal-btn" style="background:' + subjColor + '">提交答案</button>',
        '<button id="zk-q-close" class="zk-modal-btn zk-modal-btn-cancel">取消</button>',
      '</div>',
      '<div id="zk-q-success" style="display:none;text-align:center;padding:16px 0">',
        '<div style="font-size:2rem;margin-bottom:8px">🎉</div>',
        '<div id="zk-q-streak-text" style="font-size:1.1rem;font-weight:700;color:#f39c12;margin-bottom:4px"></div>',
        '<div style="font-size:0.85rem;color:#64748b">坚持学习，你离目标越来越近！</div>',
      '</div>'
    ].join('');

    modal.appendChild(card);
    document.body.appendChild(modal);

    var isDarkMode = document.body.classList.contains('dark');
    var optsDiv = document.getElementById('zk-q-options');
    if (!isFill && q.opts) {
      q.opts.forEach(function (opt, i) {
        var label = document.createElement('label');
        label.className = 'zk-modal-option';
        label.innerHTML = '<input type="radio" name="zk-q" value="' + i + '" style="accent-color:' + subjColor + '"> ' + opt;
        label.addEventListener('click', function () {
          label.classList.add('selected');
          label.style.borderColor = subjColor;
          label.style.color = isDarkMode ? '#f1f5f9' : subjColor;
          optsDiv.querySelectorAll('label').forEach(function (other) {
            if (other !== label) {
              other.classList.remove('selected');
              other.style.borderColor = '';
              other.style.color = '';
            }
          });
        });
        optsDiv.appendChild(label);
      });
    } else {
      optsDiv.style.display = 'none';
    }

    document.getElementById('zk-q-submit').addEventListener('click', function () {
      var correct;
      if (isFill) {
        if (fillParts > 1) {
          var inputs = document.querySelectorAll('.zk-q-fill-item');
          var allFilled = true;
          var userParts = [];
          inputs.forEach(function(inp) {
            var val = inp.value.trim();
            if (!val) allFilled = false;
            userParts.push(val.replace(/\s+/g, ''));
          });
          if (!allFilled) { ZK.showToast('请填写所有空'); return; }
          var correctParts = q.ans.split('，').map(function(s) { return s.trim().replace(/\s+/g, ''); });
          correct = userParts.every(function(up, i) { return up === correctParts[i]; });
        } else {
          var input = document.getElementById('zk-q-fill');
          if (!input || !input.value.trim()) { ZK.showToast('请先输入答案'); return; }
          var userAns = input.value.trim().replace(/\s+/g, '');
          var correctAns = (q.ans || '').toString().trim().replace(/\s+/g, '');
          correct = (userAns === correctAns);
        }
      } else {
        var selected = document.querySelector('input[name="zk-q"]:checked');
        if (!selected) { ZK.showToast('请先选择一个答案'); return; }
        correct = (parseInt(selected.value) === q.ans);
      }

      var resultDiv = document.getElementById('zk-q-result');
      var optsDivEl = document.getElementById('zk-q-options');
      var fillEl = document.getElementById('zk-q-fill');
      var btnsDiv = document.getElementById('zk-q-btns');

      if (fillEl) fillEl.disabled = true;
      document.querySelectorAll('.zk-q-fill-item').forEach(function(inp) { inp.disabled = true; });
      optsDivEl.style.display = 'none';
      btnsDiv.style.display = 'none';
      resultDiv.style.display = 'block';

      var newCount = correct ? currentCount + 1 : currentCount;
      var isDone = newCount >= 5;
      setQuiz({ date: ZK.todayStr(), count: newCount, done: isDone });

      if (correct) {
        resultDiv.innerHTML = '<div class="zk-modal-result-correct">' +
          '<strong>✅ 回答正确！(' + newCount + '/5)</strong>' +
          '<div class="zk-modal-result-exp">' + q.exp + '</div></div>';

        var quizBtn = document.getElementById('daily-quiz-btn');
        if (isDone) {
          if (quizBtn) quizBtn.textContent = '🏆 今日5题已完成';
          ZK.showToast('🎉 今日5题全部完成！');
        } else {
          if (quizBtn) quizBtn.textContent = '📝 今日已答 ' + newCount + '/5';
          ZK.showToast('答对了！💪');
        }
      } else {
        resultDiv.innerHTML = '<div class="zk-modal-result-wrong">' +
          '<strong>❌ 回答错误(' + currentCount + '/5)</strong>' +
          '<div class="zk-modal-result-exp">正确答案：' + (isFill ? q.ans.replace(/，/g, ' | ') : q.opts[q.ans]) + '</div>' +
          '<div class="zk-modal-result-exp">' + q.exp + '</div></div>';
        var quizBtn = document.getElementById('daily-quiz-btn');
        if (quizBtn) quizBtn.textContent = '📝 今日已答 ' + currentCount + '/5';
        ZK.showToast('答错了，看看解析');
      }

      if (correct && !isDone) {
        var nextBtn = document.createElement('button');
        nextBtn.textContent = '📝 继续下一题 (' + newCount + '/5)';
        nextBtn.className = 'zk-modal-btn';
        nextBtn.style.cssText = 'width:100%;background:' + subjColor + ';margin-top:8px';
        nextBtn.addEventListener('click', function () {
          modal.remove();
          showDailyQuestionModal(btn);
        });
        resultDiv.appendChild(nextBtn);
      } else if (isDone) {
        var doneDiv = document.createElement('div');
        doneDiv.style.cssText = 'text-align:center;padding:12px 0;margin-top:8px';
        doneDiv.innerHTML = '<div style="font-size:1.6rem">🏆</div><div style="font-weight:700;color:#f39c12;font-size:0.95rem">今日5题全部完成！</div><div style="font-size:0.78rem;color:#64748b;margin-top:4px">明天继续加油</div>';
        resultDiv.appendChild(doneDiv);
      } else {
        var retryBtn = document.createElement('button');
        retryBtn.textContent = '🔄 重新答题';
        retryBtn.className = 'zk-modal-btn';
        retryBtn.style.cssText = 'width:100%;background:#f39c12;margin-top:8px';
        retryBtn.addEventListener('click', function () {
          modal.remove();
          showDailyQuestionModal(btn);
        });
        resultDiv.appendChild(retryBtn);
      }
      var reportLink = document.createElement("a");
      reportLink.href = "feedback.html?type=题目错误";
      reportLink.target = "_blank";
      reportLink.style.cssText = "display:block;text-align:center;font-size:12px;color:#999;margin-top:8px;text-decoration:none";
      reportLink.textContent = "🐛 本题有误？点此反馈";
      resultDiv.appendChild(reportLink);
    });

    document.getElementById('zk-q-close').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  };

  window.showQuizDoneModal = function() {
    var existing = document.getElementById('zk-q-modal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'zk-q-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px';
    var card = document.createElement('div');
    var isDark = document.body.classList.contains('dark');
    card.style.cssText = 'background:' + (isDark ? '#1e293b' : 'white') + ';border-radius:16px;padding:32px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.18);color:' + (isDark ? '#f1f5f9' : '#1e293b');
    card.innerHTML = '<div style="font-size:2.5rem;margin-bottom:12px">🏆</div>' +
      '<div style="font-weight:700;font-size:1.1rem;margin-bottom:6px;color:#f39c12">今日5题已完成</div>' +
      '<div style="font-size:0.82rem;color:' + (isDark ? '#94a3b8' : '#64748b') + ';margin-bottom:20px;line-height:1.5">每天坚持5题，离目标更近一步！明天再来挑战 💪</div>' +
      '<button id="zk-done-close" style="width:100%;background:#f39c12;color:white;border:none;border-radius:10px;padding:12px;font-weight:600;font-size:0.9rem;cursor:pointer">知道了</button>';
    modal.appendChild(card);
    document.body.appendChild(modal);
    document.getElementById('zk-done-close').addEventListener('click', function() { modal.remove(); });
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  };

  window.ZK = window.ZK || {};
  ZK.initDailyQuiz = initDailyQuiz;
})();
