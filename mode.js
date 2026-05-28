// mode.js — 双模式切换（精简/完整） + 答案折叠 + 打卡
(function () {
  'use strict';

  /* ---- 打卡 ---- */
  var CHECKIN_KEY = 'zk-checkin';
  function getCheckin() {
    try { return JSON.parse(localStorage.getItem(CHECKIN_KEY)) || {}; } catch (e) { return {}; }
  }
  function setCheckin(obj) {
    try { localStorage.setItem(CHECKIN_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  function initCheckin() {
    var btn = document.getElementById('checkin-btn');
    if (!btn) return;
    var ci = getCheckin();
    var today = ZK.todayStr();
    if (ci.date === today) {
      btn.textContent = '🔥 今日已打卡 ' + ci.streak + '天连击';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.onclick = null;
      return;
    }
    btn.onclick = function () {
      var ci = getCheckin();
      var yesterday = ZK.yesterdayStr();
      var streak = (ci.date === yesterday) ? (ci.streak || 0) + 1 : 1;
      setCheckin({ date: today, streak: streak });
      btn.textContent = '🔥 今日已打卡 ' + streak + '天连击';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.onclick = null;
      ZK.showToast('打卡成功！连续' + streak + '天 💪');
    };
  }

  /* ---- 双模式切换 ---- */
  var MODE_KEY = 'zk-view-mode';
  function initDualMode() {
    var toggle = document.getElementById('mode-toggle');
    if (!toggle) return;
    var saved = null;
    try { saved = localStorage.getItem(MODE_KEY); } catch (e) {}
    var mode = saved || 'complete';
    applyMode(mode);
    toggle.addEventListener('click', function () {
      var next = document.body.classList.contains('mode-simplified') ? 'complete' : 'simplified';
      applyMode(next);
    });
  }

  function applyMode(mode) {
    var toggle = document.getElementById('mode-toggle');
    if (mode === 'simplified') {
      document.body.classList.add('mode-simplified');
      if (toggle) toggle.textContent = '📖 完整版';
      try { localStorage.setItem(MODE_KEY, 'simplified'); } catch (e) {}
    } else {
      document.body.classList.remove('mode-simplified');
      if (toggle) toggle.textContent = '⚡ 精简版';
      try { localStorage.setItem(MODE_KEY, 'complete'); } catch (e) {}
    }
  }

  /* ---- 答案折叠 ---- */
  function initAnswerFolding() {
    var questions = document.querySelectorAll('.question');
    if (!questions.length) return;
    var page = ZK.getPageName();
    var storageKey = 'zk-answers-shown-' + page;

    var shown = {};
    try { shown = JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch(e) {}

    questions.forEach(function(q, i) {
      var answer = q.querySelector('.answer-block');
      if (!answer) return;
      var qId = 'q-' + i;

      var details = document.createElement('details');
      details.className = 'answer-details';

      var summary = document.createElement('summary');
      summary.className = 'answer-summary';
      summary.textContent = '👆 点击展开答案';

      details.appendChild(summary);
      details.appendChild(answer);

      if (shown[qId]) {
        details.open = true;
        summary.textContent = '✅ 已查看答案';
      }

      details.addEventListener('toggle', function() {
        if (details.open) {
          shown[qId] = true;
          try { sessionStorage.setItem(storageKey, JSON.stringify(shown)); } catch(e) {}
          summary.textContent = '✅ 已查看答案';
          recordAnswer(page, qId);
        }
      });

      q.appendChild(details);
    });
  }

  function recordAnswer(page, qId) {
    var key = 'zk-answers-done';
    var data = {};
    try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch(e) {}
    var today = ZK.todayStr();
    if (!data[today]) data[today] = [];
    if (!data[today].some(function(d) { return d.page === page && d.qId === qId; })) {
      data[today].push({ page: page, qId: qId, time: Date.now() });
      try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    }
  }

  window.ZK = window.ZK || {};
  ZK.initCheckin = initCheckin;
  ZK.initDualMode = initDualMode;
  ZK.initAnswerFolding = initAnswerFolding;
})();
