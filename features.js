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
      btn.onclick = null;
      return;
    }
    btn.onclick = function () {
      var ci = getCheckin();
      var yesterday = yesterdayStr();
      var streak = (ci.date === yesterday) ? (ci.streak || 0) + 1 : 1;
      setCheckin({ date: today, streak: streak });
      btn.textContent = '🔥 今日已打卡 ' + streak + '天连击';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.onclick = null;
      showToast('打卡成功！连续' + streak + '天 💪');
    };
  }

  /* ---- 每日一题（独立于打卡） ---- */
  var QUIZ_KEY = 'zk-daily-quiz';
  function getQuiz() { try { return JSON.parse(localStorage.getItem(QUIZ_KEY)) || {}; } catch(e) { return {}; } }
  function setQuiz(obj) { try { localStorage.setItem(QUIZ_KEY, JSON.stringify(obj)); } catch(e) {} }

  function initDailyQuiz() {
    var btn = document.getElementById('daily-quiz-btn');
    if (!btn) return;
    var quiz = getQuiz();
    var today = todayStr();
    if (quiz.date === today) {
      btn.textContent = '📝 今日已答 ' + (quiz.correct ? '✅' : '❌');
      btn.onclick = function() { showDailyQuestionModal(btn); };
    } else {
      btn.onclick = function() { showDailyQuestionModal(btn); };
    }
  }

  function showDailyQuestionModal(btn) {
    var dow = new Date().getDay();
    var subjectIdx = (dow === 0) ? 6 : dow - 1;
    var startIdx = subjectIdx * 8;
    var dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    var qIndex = startIdx + (dayOfYear % 8);
    var q = DAILY_QUESTIONS[qIndex];
    if (!q) return;

    // 已有弹窗则关闭
    var existing = document.getElementById('zk-q-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'zk-q-modal';
    modal.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.55)', 'z-index:99998',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px'
    ].join(';');

    var card = document.createElement('div');
    card.style.cssText = [
      'background:white', 'border-radius:16px', 'padding:24px 20px',
      'max-width:420px', 'width:100%', 'max-height:90vh', 'overflow-y:auto',
      'box-shadow:0 8px 32px rgba(0,0,0,0.18)', 'font-family:inherit'
    ].join(';');

    var subjectLabels = ['⚡物理','📝语文','📐数学','📖英语','🧪化学','🏛️历史','🎯政治'];
    var colors = ['#f39c12','#e74c3c','#3498db','#9b59b6','#27ae60','#e67e22','#1abc9c'];
    var subjColor = colors[subjectIdx] || '#f39c12';

    var isFill = (q.type === 'fill');
    // 多空填空题：用逗号分隔答案
    var fillParts = isFill ? (q.ans || '').split('，').length : 1;
    var inputHtml = '';
    if (isFill) {
      if (fillParts > 1) {
        inputHtml = '<div id="zk-q-fills" style="display:flex;flex-direction:column;gap:10px">';
        for (var fi = 0; fi < fillParts; fi++) {
          inputHtml += '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:0.82rem;color:#64748b;white-space:nowrap">空' + (fi+1) + '：</span>' +
            '<input class="zk-q-fill-item" data-idx="' + fi + '" type="text" placeholder="输入第' + (fi+1) + '个答案..." style="flex:1;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;box-sizing:border-box">' +
            '</div>';
        }
        inputHtml += '</div>';
      } else {
        inputHtml = '<input id="zk-q-fill" type="text" placeholder="输入答案..." style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;box-sizing:border-box">';
      }
    }

    card.innerHTML = [
      '<div style="text-align:center;margin-bottom:16px">',
        '<span style="display:inline-block;background:' + subjColor + ';color:white;padding:3px 12px;border-radius:20px;font-size:0.75rem;font-weight:600">',
          '📝 每日一题 · ' + subjectLabels[subjectIdx] + (isFill ? ' · 填空题' : ''),
        '</span>',
      '</div>',
      '<p style="font-size:0.95rem;font-weight:600;margin-bottom:14px;line-height:1.5;color:#1e293b">' + q.q + '</p>',
      inputHtml,
      '<div id="zk-q-options" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px"></div>',
      '<div id="zk-q-result" style="display:none;margin-bottom:16px"></div>',
      '<div style="display:flex;gap:12px;margin-top:4px" id="zk-q-btns">',
        '<button id="zk-q-submit" style="flex:1;background:' + subjColor + ';color:white;border:none;border-radius:10px;',
          'padding:12px 16px;font-weight:600;font-size:0.9rem;cursor:pointer">提交答案</button>',
        '<button id="zk-q-close" style="flex:1;background:#e2e8f0;color:#64748b;border:none;border-radius:10px;',
          'padding:12px 16px;font-weight:600;font-size:0.9rem;cursor:pointer">取消</button>',
      '</div>',
      '<div id="zk-q-success" style="display:none;text-align:center;padding:16px 0">',
        '<div style="font-size:2rem;margin-bottom:8px">🎉</div>',
        '<div id="zk-q-streak-text" style="font-size:1.1rem;font-weight:700;color:#f39c12;margin-bottom:4px"></div>',
        '<div style="font-size:0.85rem;color:#64748b">坚持学习，你离目标越来越近！</div>',
      '</div>'
    ].join('');

    modal.appendChild(card);
    document.body.appendChild(modal);

    // 填充选项（仅选择题）
    var optsDiv = document.getElementById('zk-q-options');
    if (!isFill && q.opts) {
      q.opts.forEach(function (opt, i) {
        var label = document.createElement('label');
        label.style.cssText = [
          'display:flex', 'align-items:center', 'gap:8px',
          'padding:9px 12px', 'border-radius:8px', 'border:1.5px solid #e2e8f0',
          'cursor:pointer', 'font-size:0.88rem', 'transition:all 0.15s', 'color:#374151'
        ].join(';');
        label.innerHTML = '<input type="radio" name="zk-q" value="' + i + '" style="accent-color:' + subjColor + '"> ' + opt;
        label.addEventListener('click', function () {
          label.style.background = 'rgba(0,0,0,0.04)';
          label.style.borderColor = subjColor;
          label.style.color = subjColor;
          optsDiv.querySelectorAll('label').forEach(function (other) {
            if (other !== label) {
              other.style.background = '';
              other.style.borderColor = '#e2e8f0';
              other.style.color = '#374151';
            }
          });
        });
        optsDiv.appendChild(label);
      });
    } else {
      optsDiv.style.display = 'none';
    }

    // 提交答案
    document.getElementById('zk-q-submit').addEventListener('click', function () {
      var correct;
      if (isFill) {
        if (fillParts > 1) {
          // 多空填空题
          var inputs = document.querySelectorAll('.zk-q-fill-item');
          var allFilled = true;
          var userParts = [];
          inputs.forEach(function(inp) {
            var val = inp.value.trim();
            if (!val) allFilled = false;
            userParts.push(val.replace(/\s+/g, ''));
          });
          if (!allFilled) { showToast('请填写所有空'); return; }
          var correctParts = q.ans.split('，').map(function(s) { return s.trim().replace(/\s+/g, ''); });
          correct = userParts.every(function(up, i) { return up === correctParts[i]; });
        } else {
          // 单空填空题
          var input = document.getElementById('zk-q-fill');
          if (!input || !input.value.trim()) { showToast('请先输入答案'); return; }
          var userAns = input.value.trim().replace(/\s+/g, '');
          var correctAns = (q.ans || '').toString().trim().replace(/\s+/g, '');
          correct = (userAns === correctAns);
        }
      } else {
        var selected = document.querySelector('input[name="zk-q"]:checked');
        if (!selected) { showToast('请先选择一个答案'); return; }
        correct = (parseInt(selected.value) === q.ans);
      }

      var resultDiv = document.getElementById('zk-q-result');
      var optsDivEl = document.getElementById('zk-q-options');
      var fillEl = document.getElementById('zk-q-fill');
      var btnsDiv = document.getElementById('zk-q-btns');

      if (fillEl) fillEl.disabled = true;
      // 禁用多空填空题的所有输入框
      document.querySelectorAll('.zk-q-fill-item').forEach(function(inp) { inp.disabled = true; });
      optsDivEl.style.display = 'none';
      btnsDiv.style.display = 'none';
      resultDiv.style.display = 'block';

      // 保存答题结果
      setQuiz({ date: todayStr(), correct: correct });

      if (correct) {
        resultDiv.innerHTML = '<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px 14px">' +
          '<div style="font-weight:700;color:#10b981;margin-bottom:4px">✅ 回答正确！</div>' +
          '<div style="font-size:0.82rem;color:#64748b;line-height:1.5">' + q.exp + '</div></div>';

        var quizBtn = document.getElementById('daily-quiz-btn');
        if (quizBtn) quizBtn.textContent = '📝 今日已答 ✅';
        showToast('答对了！💪');
      } else {
        resultDiv.innerHTML = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px 14px;margin-bottom:10px">' +
          '<div style="font-weight:700;color:#ef4444;margin-bottom:4px">❌ 回答错误</div>' +
          '<div style="font-size:0.82rem;color:#64748b;line-height:1.5">正确答案：' + (isFill ? q.ans.replace(/，/g, ' | ') : q.opts[q.ans]) + '</div>' +
          '<div style="font-size:0.82rem;color:#64748b;line-height:1.5;margin-top:6px">' + q.exp + '</div></div>';
        var quizBtn = document.getElementById('daily-quiz-btn');
        if (quizBtn) quizBtn.textContent = '📝 今日已答 ❌';
        showToast('答错了，看看解析');
      }

      var retryBtn = document.createElement('button');
      retryBtn.textContent = '🔄 重新答题';
      retryBtn.style.cssText = 'width:100%;background:#f39c12;color:white;border:none;border-radius:10px;padding:10px;font-weight:600;font-size:0.9rem;cursor:pointer;margin-top:8px';
      retryBtn.addEventListener('click', function () {
        modal.remove();
        showDailyQuestionModal(btn);
      });
      resultDiv.appendChild(retryBtn);
    });

    // 取消/关闭
    document.getElementById('zk-q-close').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
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


  /* ---- paper page: jump-to-answer floating button (Task 1) ---- */
  function initPaperJump() {
    var wraps = document.querySelectorAll('.paper-img-wrap');
    if (wraps.length < 4) return; // not a paper page
    // Add id to each wrap for anchoring
    wraps.forEach(function(w, i) { w.id = 'paper-page-' + (i + 1); });
    // Estimate answer section: last ~35% of pages
    var total = wraps.length;
    var answerIdx = Math.max(Math.floor(total * 0.65), total - 3);
    // Create floating button
    var btn = document.createElement('button');
    btn.id = 'jump-answer-btn';
    btn.innerHTML = '📍 跳转答案';
    btn.title = '跳转到答案页区域';
    btn.style.cssText = [
      'position:fixed','bottom:20px','right:16px','z-index:9999',
      'background:linear-gradient(135deg,#f39c12,#e67e22)','color:white',
      'border:none','border-radius:28px','padding:10px 18px',
      'font-size:0.88rem','font-weight:600','cursor:pointer',
      'box-shadow:0 4px 16px rgba(243,156,18,0.4)',
      'font-family:inherit','transition:transform 0.15s,opacity 0.15s',
      'opacity:0.92'
    ].join(';');
    btn.addEventListener('mouseenter', function() { btn.style.transform='scale(1.06)'; btn.style.opacity='1'; });
    btn.addEventListener('mouseleave', function() { btn.style.transform='scale(1)'; btn.style.opacity='0.92'; });
    btn.addEventListener('click', function() {
      var target = document.getElementById('paper-page-' + (answerIdx + 1));
      if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    document.body.appendChild(btn);
    // Hide when scrolled to answer area
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          btn.textContent = '📋 回到题目';
          btn.onclick = function() {
            document.getElementById('paper-page-1').scrollIntoView({ behavior:'smooth', block:'start' });
            setTimeout(function() {
              btn.textContent = '📍 跳转答案';
              btn.onclick = arguments.callee; // reset
            }, 800);
          };
        } else {
          btn.textContent = '📍 跳转答案';
        }
      });
    }, { threshold: 0.3 });
    observer.observe(wraps[answerIdx]);
  }

  /* ---- paper page: skeleton placeholder (Task 4) ---- */
  function initPaperSkeleton() {
    var imgs = document.querySelectorAll('.paper-img-wrap img');
    imgs.forEach(function(img) {
      if (img.complete && img.naturalHeight > 0) return; // already loaded
      var wrap = img.parentElement;
      wrap.style.minHeight = '200px';
      wrap.style.background = 'linear-gradient(110deg, #f0f4f8 30%, #e2e8f0 50%, #f0f4f8 70%)';
      wrap.style.backgroundSize = '200% 100%';
      wrap.style.animation = 'zk-shimmer 1.5s ease-in-out infinite';
      wrap.setAttribute('data-skeleton', '1');
      img.addEventListener('load', function() {
        wrap.style.minHeight = '';
        wrap.style.background = '';
        wrap.style.animation = '';
        wrap.removeAttribute('data-skeleton');
      });
      img.addEventListener('error', function() {
        wrap.style.minHeight = '';
        wrap.style.animation = '';
        wrap.removeAttribute('data-skeleton');
      });
    });
    // Add shimmer animation
    if (!document.getElementById('zk-shimmer-style')) {
      var s = document.createElement('style');
      s.id = 'zk-shimmer-style';
      s.textContent = '@keyframes zk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}body.dark .paper-img-wrap[data-skeleton]{background:linear-gradient(110deg,#1e293b 30%,#334155 50%,#1e293b 70%);background-size:200% 100%}';
      document.head.appendChild(s);
    }
  }

  /* ---- paper page: offline image error fallback (Task 6) ---- */
  function initPaperImgError() {
    var imgs = document.querySelectorAll('.paper-img-wrap img');
    imgs.forEach(function(img) {
      if (img.getAttribute('data-error-bound')) return;
      img.setAttribute('data-error-bound', '1');
      img.addEventListener('error', function() {
        if (img.getAttribute('data-fallback')) return;
        img.setAttribute('data-fallback', '1');
        var fallback = document.createElement('div');
        fallback.style.cssText = 'text-align:center;padding:40px 16px;color:#64748b;font-size:0.88rem';
        fallback.innerHTML = '📐 需要联网查看此页试卷<br><span style="font-size:0.75rem;color:#94a3b8">请连接网络后刷新页面</span>';
        img.style.display = 'none';
        img.parentElement.appendChild(fallback);
      });
    });
  }


  /* ---- paper page: answer mask (B2) + PDF download (B4) + fullscreen (B6) ---- */
  function initPaperAnswerMask() {
    var wraps = document.querySelectorAll('.paper-img-wrap');
    if (wraps.length < 4) return;
    var total = wraps.length;
    var answerStartIdx = Math.max(Math.floor(total * 0.65), total - 3);
    var key = 'zk-answer-revealed-' + location.pathname.split('/').pop();
    var revealed = localStorage.getItem(key) === '1';

    for (var i = answerStartIdx; i < total; i++) {
      var wrap = wraps[i];
      wrap.setAttribute('data-answer', '1');
      if (!revealed) wrap.classList.add('paper-masked');
    }
    if (revealed) return; // already revealed

    // Insert reveal button before first answer page
    var revealBtn = document.createElement('div');
    revealBtn.id = 'paper-reveal-zone';
    revealBtn.style.cssText = 'background:linear-gradient(135deg,#fee2e2,#fecaca);border:2px dashed #ef4444;border-radius:14px;padding:24px 16px;margin:16px 0;text-align:center;cursor:pointer;transition:all 0.2s';
    revealBtn.innerHTML =
      '<div style="font-size:1.8rem;margin-bottom:6px">🔒</div>' +
      '<div style="font-weight:700;color:#dc2626;font-size:0.95rem;margin-bottom:4px">答案区已遮盖</div>' +
      '<div style="font-size:0.78rem;color:#7f1d1d">建议先做完再看答案 · 点击此处揭示</div>';
    revealBtn.onclick = function() {
      if (!confirm('确定要查看答案吗？建议先把题做完再看。')) return;
      document.querySelectorAll('.paper-masked').forEach(function(w) { w.classList.remove('paper-masked'); });
      localStorage.setItem(key, '1');
      revealBtn.remove();
    };
    wraps[answerStartIdx].parentElement.insertBefore(revealBtn, wraps[answerStartIdx]);

    // Inject mask CSS
    if (!document.getElementById('zk-mask-style')) {
      var s = document.createElement('style');
      s.id = 'zk-mask-style';
      s.textContent = '.paper-masked{position:relative}.paper-masked img{filter:blur(28px) brightness(0.85);pointer-events:none}.paper-masked::after{content:"🔒 答案已遮盖";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,255,255,0.92);color:#dc2626;padding:8px 16px;border-radius:20px;font-weight:600;font-size:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,0.15)}body.dark .paper-masked::after{background:rgba(15,23,42,0.92);color:#fca5a5}';
      document.head.appendChild(s);
    }
  }

  function initPaperDownload() {
    var wraps = document.querySelectorAll('.paper-img-wrap');
    if (wraps.length < 4) return;
    var btn = document.createElement('button');
    btn.id = 'paper-pdf-btn';
    btn.innerHTML = '📥 下载PDF';
    btn.title = '调用浏览器打印生成PDF';
    btn.style.cssText = 'position:fixed;bottom:74px;right:16px;z-index:9998;background:linear-gradient(135deg,#3498db,#2980b9);color:white;border:none;border-radius:24px;padding:8px 14px;font-size:0.78rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(52,152,219,0.35);opacity:0.9;font-family:inherit';
    btn.onmouseenter = function() { btn.style.opacity = '1'; };
    btn.onmouseleave = function() { btn.style.opacity = '0.9'; };
    btn.onclick = function() {
      showToast('💡 在打印界面选「另存为PDF」');
      setTimeout(function() { window.print(); }, 500);
    };
    document.body.appendChild(btn);
    // Print-specific CSS
    if (!document.getElementById('zk-print-style')) {
      var s = document.createElement('style');
      s.id = 'zk-print-style';
      s.textContent = '@media print{@page{size:A4;margin:8mm}body{background:white!important}#paper-pdf-btn,#jump-answer-btn,#paper-fullscreen-btn,.paper-header,.paper-meta,.page-nav,.source-note,#dark-toggle,header{display:none!important}.paper-masked img{filter:none!important;opacity:1!important}.paper-masked::after{display:none!important}.paper-img-wrap{page-break-inside:avoid;margin:0 0 4mm 0!important}.paper-img-wrap img{max-width:100%;width:100%}.container{max-width:100%!important;padding:0!important}.content-card{box-shadow:none!important;background:white!important;padding:0!important}h2,.tip-box{display:none!important}}';
      document.head.appendChild(s);
    }
  }

  function initPaperFullscreen() {
    var wraps = document.querySelectorAll('.paper-img-wrap');
    if (wraps.length < 4) return;
    var btn = document.createElement('button');
    btn.id = 'paper-fullscreen-btn';
    btn.innerHTML = '📱 全屏';
    btn.title = '沉浸式阅读模式';
    btn.style.cssText = 'position:fixed;bottom:128px;right:16px;z-index:9998;background:linear-gradient(135deg,#1abc9c,#16a085);color:white;border:none;border-radius:24px;padding:8px 14px;font-size:0.78rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(26,188,156,0.35);opacity:0.9;font-family:inherit';
    btn.onmouseenter = function() { btn.style.opacity = '1'; };
    btn.onmouseleave = function() { btn.style.opacity = '0.9'; };
    btn.onclick = function() {
      document.body.classList.toggle('paper-immersive');
      btn.innerHTML = document.body.classList.contains('paper-immersive') ? '🔙 退出' : '📱 全屏';
    };
    document.body.appendChild(btn);
    if (!document.getElementById('zk-immersive-style')) {
      var s = document.createElement('style');
      s.id = 'zk-immersive-style';
      s.textContent = 'body.paper-immersive header,body.paper-immersive .paper-meta,body.paper-immersive .page-nav,body.paper-immersive .source-note,body.paper-immersive h2,body.paper-immersive .tip-box,body.paper-immersive #dark-toggle{display:none!important}body.paper-immersive .container{max-width:100%!important;padding:0 4px!important}body.paper-immersive .content-card{padding:8px 0!important;box-shadow:none!important;border:none!important;background:white!important}body.paper-immersive.dark .content-card{background:#0f172a!important}body.paper-immersive .paper-img-wrap{margin:0 0 6px 0!important}';
      document.head.appendChild(s);
    }
  }


  /* ---- study time tracking (B5) - works on all pages ---- */
  function initStudyTimeTracker() {
    var TIME_KEY = 'zk-study-time';
    var sessionStart = Date.now();
    function todayKey() {
      var d = new Date();
      return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
    }
    function flush() {
      if (document.visibilityState !== 'visible') return;
      var now = Date.now();
      var diff = Math.min(now - sessionStart, 60000);
      if (diff < 1000) return;
      var t = {};
      try { t = JSON.parse(localStorage.getItem(TIME_KEY)) || {}; } catch(e) {}
      var k = todayKey();
      t[k] = (t[k] || 0) + Math.floor(diff/1000);
      try { localStorage.setItem(TIME_KEY, JSON.stringify(t)); } catch(e) {}
      sessionStart = now;
    }
    setInterval(flush, 30000);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') flush();
      else sessionStart = Date.now();
    });
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
  }

  /* ---- auto-init ---- */
  function boot() {
    initFavorites();
    initCheckin();
    initDailyQuiz();
    initDualMode();
    initAnswerFolding();
    initPaperJump();
    initPaperSkeleton();
    initPaperImgError();
    initPaperAnswerMask();
    initPaperDownload();
    initPaperFullscreen();
    initStudyTimeTracker();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot(); // DOM already complete
  }
})();
