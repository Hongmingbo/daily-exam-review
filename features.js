// features.js — 收藏 + 每日打卡（全部 localStorage，无后端）
(function () {
  var FAV_KEY = 'zk-favorites';
  var CHECKIN_KEY = 'zk-checkin';

  /* ---- helpers ---- */
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function setFavorites(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  /* ---- favorites UI init ---- */
  function initFavorites() {
    var faves = getFavorites();
    var page = getPageName();

    document.querySelectorAll('.formula-box, .trap-box, .tip-box').forEach(function (box, i) {
      if (box.id) return; // already has one
      var id = page + '-f' + i;
      box.id = id;
      var isFav = faves.some(function (f) { return f.id === id && f.page === page; });
      var star = document.createElement('button');
      star.className = 'fav-star' + (isFav ? ' active' : '');
      star.setAttribute('data-id', id);
      star.setAttribute('aria-label', isFav ? '取消收藏' : '收藏');
      star.innerHTML = isFav ? '⭐' : '☆';
      star.style.cssText = 'float:right;background:none;border:none;cursor:pointer;font-size:1.1rem;padding:0;line-height:1;opacity:0.6;transition:opacity 0.15s;';
      star.addEventListener('click', toggleFav);
      star.addEventListener('mouseenter', function () { star.style.opacity = '1'; });
      star.addEventListener('mouseleave', function () { star.style.opacity = isFaved(id) ? '1' : '0.6'; });
      box.style.position = 'relative';
      box.appendChild(star);
    });
  }

  function isFaved(id) {
    var page = getPageName();
    return getFavorites().some(function (f) { return f.id === id && f.page === page; });
  }

  function toggleFav(e) {
    e.stopPropagation();
    var btn = e.currentTarget;
    var id = btn.getAttribute('data-id');
    var page = getPageName();
    var title = getItemTitle(btn.closest('.formula-box, .trap-box, .tip-box') || document.getElementById(id));
    var snippet = getItemSnippet(btn.closest('.formula-box, .trap-box, .tip-box') || document.getElementById(id));
    var favs = getFavorites();
    var idx = favs.findIndex(function (f) { return f.id === id && f.page === page; });
    if (idx >= 0) {
      favs.splice(idx, 1);
      btn.innerHTML = '☆';
      btn.classList.remove('active');
    } else {
      favs.unshift({ id: id, page: page, title: title, snippet: snippet, date: todayStr() });
      btn.innerHTML = '⭐';
      btn.classList.add('active');
    }
    setFavorites(favs);
    // Toast feedback
    showToast(idx >= 0 ? '已取消收藏' : '已收藏 ✓');
  }

  function getItemTitle(el) {
    if (!el) return '未命名';
    var h4 = el.previousElementSibling;
    if (h4 && h4.tagName === 'H4') return h4.textContent.trim();
    var parent = el.parentElement;
    if (parent) {
      var h = parent.querySelector('h4');
      if (h) return h.textContent.trim();
    }
    return el.querySelector('strong') ? el.querySelector('strong').textContent.trim() : '未命名';
  }

  function getItemSnippet(el) {
    if (!el) return '';
    var text = el.textContent || '';
    return text.trim().slice(0, 120);
  }

  /* ---- check-in ---- */
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
    var today = todayStr();
    if (ci.date === today) {
      btn.textContent = '🔥 今日已打卡 ' + ci.streak + '天连击';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      updateStreak(btn, ci, today);
    }
    btn.addEventListener('click', function () {
      var ci2 = getCheckin();
      updateStreak(btn, ci2, todayStr());
    });
  }

  function updateStreak(btn, ci, today) {
    var yesterday = yesterdayStr();
    var streak = (ci.date === yesterday) ? (ci.streak || 0) + 1 : 1;
    var obj = { date: today, streak: streak };
    setCheckin(obj);
    btn.textContent = '🔥 今日已打卡 ' + streak + '天连击';
    btn.disabled = true;
    btn.style.opacity = '0.7';
    showToast('打卡成功！连续' + streak + '天 💪');
  }

  /* ---- utils ---- */
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function yesterdayStr() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function getPageName() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  /* ---- toast ---- */
  function showToast(msg) {
    var existing = document.getElementById('zk-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'zk-toast';
    toast.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
      'background:#1e293b', 'color:white', 'padding:8px 20px', 'border-radius:20px',
      'font-size:0.85rem', 'z-index:99999', 'pointer-events:none', 'opacity:0',
      'transition:opacity 0.3s', 'white-space:nowrap'
    ].join(';');
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = '1'; });
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  /* ---- fav-star hover style ---- */
  var style = document.createElement('style');
  style.textContent = [
    '.fav-star:hover { opacity: 1 !important; }',
    '.fav-star.active { opacity: 1 !important; }',
    '.answer-details { margin-top: 8px; border-radius: 8px; overflow: hidden; }',
    '.answer-summary {',
    '  background: rgba(16, 185, 129, 0.1);',
    '  border: 1px solid rgba(16, 185, 129, 0.3);',
    '  border-radius: 8px;',
    '  padding: 7px 14px;',
    '  font-size: 0.82rem;',
    '  color: #10b981;',
    '  cursor: pointer;',
    '  list-style: none;',
    '  user-select: none;',
    '  transition: background 0.15s;',
    '}',
    '.answer-summary:hover { background: rgba(16, 185, 129, 0.18); }',
    '.answer-summary::marker { display: none; }',
    'body.dark .answer-summary {',
    '  background: rgba(16, 185, 129, 0.15);',
    '  border-color: rgba(16, 185, 129, 0.4);',
    '  color: #6ee7b7;',
    '}',
    'body.dark .answer-summary:hover { background: rgba(16, 185, 129, 0.25); }'
  ].join(' ');
  document.head.appendChild(style);

  /* ---- dual mode (simplified/complete) ---- */
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

  /* ---- answer folding for .question blocks ---- */
  function initAnswerFolding() {
    var questions = document.querySelectorAll('.question');
    if (!questions.length) return;
    var page = getPageName();
    var storageKey = 'zk-answers-shown-' + page;

    var shown = {};
    try { shown = JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch(e) {}

    questions.forEach(function(q, i) {
      var answer = q.querySelector('.answer-block');
      if (!answer) return;
      var qId = 'q-' + i;

      // Build collapsible wrapper
      var details = document.createElement('details');
      details.className = 'answer-details';

      var summary = document.createElement('summary');
      summary.className = 'answer-summary';
      summary.textContent = '👆 点击展开答案';

      details.appendChild(summary);
      details.appendChild(answer);

      // Restore state
      if (shown[qId]) {
        details.open = true;
        summary.textContent = '✅ 已查看答案';
      }

      details.addEventListener('toggle', function() {
        if (details.open) {
          shown[qId] = true;
          try { sessionStorage.setItem(storageKey, JSON.stringify(shown)); } catch(e) {}
          summary.textContent = '✅ 已查看答案';
          // Record in checkin data
          recordAnswer(page, qId);
        }
      });

      q.appendChild(details);
    });
  }

  function recordAnswer(page, qId) {
    // Track how many answers viewed today for checkin bonus
    var key = 'zk-answers-done';
    var data = {};
    try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch(e) {}
    var today = todayStr();
    if (!data[today]) data[today] = [];
    if (!data[today].some(function(d) { return d.page === page && d.qId === qId; })) {
      data[today].push({ page: page, qId: qId, time: Date.now() });
      try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    }
  }

  /* ---- auto-init ---- */
  document.addEventListener('DOMContentLoaded', function () {
    initFavorites();
    initCheckin();
    initDualMode();
    initAnswerFolding();
  });
})();
