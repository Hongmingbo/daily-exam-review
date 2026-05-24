     1|// features.js — 收藏 + 每日打卡（全部 localStorage，无后端）
     2|(function () {
     3|  var FAV_KEY = 'zk-favorites';
     4|  var CHECKIN_KEY = 'zk-checkin';
     5|
     6|  /* ---- helpers ---- */
     7|  function getFavorites() {
     8|    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
     9|  }
    10|  function setFavorites(arr) {
    11|    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) {}
    12|  }
    13|
    14|  /* ---- favorites UI init ---- */
    15|  function initFavorites() {
    16|    var faves = getFavorites();
    17|    var page = getPageName();
    18|
    19|    document.querySelectorAll('.formula-box, .trap-box, .tip-box').forEach(function (box, i) {
    20|      if (box.id) return; // already has one
    21|      var id = page + '-f' + i;
    22|      box.id = id;
    23|      var isFav = faves.some(function (f) { return f.id === id && f.page === page; });
    24|      var star = document.createElement('button');
    25|      star.className = 'fav-star' + (isFav ? ' active' : '');
    26|      star.setAttribute('data-id', id);
    27|      star.setAttribute('aria-label', isFav ? '取消收藏' : '收藏');
    28|      star.innerHTML = isFav ? '⭐' : '☆';
    29|      star.style.cssText = 'float:right;background:none;border:none;cursor:pointer;font-size:1.1rem;padding:0;line-height:1;opacity:0.6;transition:opacity 0.15s;';
    30|      star.addEventListener('click', toggleFav);
    31|      star.addEventListener('mouseenter', function () { star.style.opacity = '1'; });
    32|      star.addEventListener('mouseleave', function () { star.style.opacity = isFaved(id) ? '1' : '0.6'; });
    33|      box.style.position = 'relative';
    34|      box.appendChild(star);
    35|    });
    36|  }
    37|
    38|  function isFaved(id) {
    39|    var page = getPageName();
    40|    return getFavorites().some(function (f) { return f.id === id && f.page === page; });
    41|  }
    42|
    43|  function toggleFav(e) {
    44|    e.stopPropagation();
    45|    var btn = e.currentTarget;
    46|    var id = btn.getAttribute('data-id');
    47|    var page = getPageName();
    48|    var title = getItemTitle(btn.closest('.formula-box, .trap-box, .tip-box') || document.getElementById(id));
    49|    var snippet = getItemSnippet(btn.closest('.formula-box, .trap-box, .tip-box') || document.getElementById(id));
    50|    var favs = getFavorites();
    51|    var idx = favs.findIndex(function (f) { return f.id === id && f.page === page; });
    52|    if (idx >= 0) {
    53|      favs.splice(idx, 1);
    54|      btn.innerHTML = '☆';
    55|      btn.classList.remove('active');
    56|    } else {
    57|      favs.unshift({ id: id, page: page, title: title, snippet: snippet, date: todayStr() });
    58|      btn.innerHTML = '⭐';
    59|      btn.classList.add('active');
    60|    }
    61|    setFavorites(favs);
    62|    // Toast feedback
    63|    showToast(idx >= 0 ? '已取消收藏' : '已收藏 ✓');
    64|  }
    65|
    66|  function getItemTitle(el) {
    67|    if (!el) return '未命名';
    68|    var h4 = el.previousElementSibling;
    69|    if (h4 && h4.tagName === 'H4') return h4.textContent.trim();
    70|    var parent = el.parentElement;
    71|    if (parent) {
    72|      var h = parent.querySelector('h4');
    73|      if (h) return h.textContent.trim();
    74|    }
    75|    return el.querySelector('strong') ? el.querySelector('strong').textContent.trim() : '未命名';
    76|  }
    77|
    78|  function getItemSnippet(el) {
    79|    if (!el) return '';
    80|    var text = el.textContent || '';
    81|    return text.trim().slice(0, 120);
    82|  }
    83|
    84|  /* ---- check-in ---- */
    85|  function getCheckin() {
    86|    try { return JSON.parse(localStorage.getItem(CHECKIN_KEY)) || {}; } catch (e) { return {}; }
    87|  }
    88|  function setCheckin(obj) {
    89|    try { localStorage.setItem(CHECKIN_KEY, JSON.stringify(obj)); } catch (e) {}
    90|  }
    91|
    92|  function initCheckin() {
    93|    var btn = document.getElementById('checkin-btn');
    94|    if (!btn) return;
    95|    var ci = getCheckin();
    96|    var today = todayStr();
    97|    if (ci.date === today) {
    98|      btn.textContent = '🔥 今日已打卡 ' + ci.streak + '天连击';
    99|      btn.disabled = true;
   100|      btn.style.opacity = '0.7';
   101|    } else {
   102|      // 未打卡：点击弹出每日一题
   103|      btn.addEventListener('click', function () {
   104|        showDailyQuestionModal(btn);
   105|      });
   106|    }
   107|  }
   108|
   109|  function showDailyQuestionModal(btn) {
   110|    // 获取今日科目对应的题目
   111|    var dow = new Date().getDay(); // 0=周日
   112|    var qIndex = (dow === 0) ? 6 : dow - 1; // 周一→0, ..., 周六→5, 周日→6
   113|    var q = DAILY_QUESTIONS[qIndex];
   114|    if (!q) return;
   115|
   116|    // 已有弹窗则关闭
   117|    var existing = document.getElementById('zk-q-modal');
   118|    if (existing) existing.remove();
   119|
   120|    var modal = document.createElement('div');
   121|    modal.id = 'zk-q-modal';
   122|    modal.style.cssText = [
   123|      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
   124|      'background:rgba(0,0,0,0.55)', 'z-index:99998',
   125|      'display:flex', 'align-items:center', 'justify-content:center',
   126|      'padding:16px'
   127|    ].join(';');
   128|
   129|    var card = document.createElement('div');
   130|    card.style.cssText = [
   131|      'background:white', 'border-radius:16px', 'padding:24px 20px',
   132|      'max-width:420px', 'width:100%', 'max-height:90vh', 'overflow-y:auto',
   133|      'box-shadow:0 8px 32px rgba(0,0,0,0.18)', 'font-family:inherit'
   134|    ].join(';');
   135|
   136|    var subjectLabels = ['⚡物理','📝语文','📐数学','📖英语','🧪化学','🏛️历史','🎯政治'];
   137|    var colors = ['#f39c12','#e74c3c','#3498db','#9b59b6','#27ae60','#e67e22','#1abc9c'];
   138|    var subjColor = colors[qIndex] || '#f39c12';
   139|
   140|    card.innerHTML = [
   141|      '<div style="text-align:center;margin-bottom:16px">',
   142|        '<span style="display:inline-block;background:' + subjColor + ';color:white;padding:3px 12px;border-radius:20px;font-size:0.75rem;font-weight:600">',
   143|          '📅 每日一题 · ' + subjectLabels[qIndex],
   144|        '</span>',
   145|      '</div>',
   146|      '<p style="font-size:0.95rem;font-weight:600;margin-bottom:14px;line-height:1.5;color:#1e293b">' + q.q + '</p>',
   147|      '<div id="zk-q-options" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px"></div>',
   148|      '<div id="zk-q-result" style="display:none;margin-bottom:16px"></div>',
   149|      '<div style="display:flex;gap:10px" id="zk-q-btns">',
   150|        '<button id="zk-q-submit" style="flex:1;background:' + subjColor + ';color:white;border:none;border-radius:10px;',
   151|          'padding:10px;font-weight:600;font-size:0.9rem;cursor:pointer">提交答案</button>',
   152|        '<button id="zk-q-close" style="flex:1;background:#e2e8f0;color:#64748b;border:none;border-radius:10px;',
   153|          'padding:10px;font-weight:600;font-size:0.9rem;cursor:pointer">取消</button>',
   154|      '</div>',
   155|      '<div id="zk-q-success" style="display:none;text-align:center;padding:16px 0">',
   156|        '<div style="font-size:2rem;margin-bottom:8px">🎉</div>',
   157|        '<div id="zk-q-streak-text" style="font-size:1.1rem;font-weight:700;color:#f39c12;margin-bottom:4px"></div>',
   158|        '<div style="font-size:0.85rem;color:#64748b">坚持学习，你离目标越来越近！</div>',
   159|      '</div>'
   160|    ].join('');
   161|
   162|    modal.appendChild(card);
   163|    document.body.appendChild(modal);
   164|
   165|    // 填充选项
   166|    var optsDiv = document.getElementById('zk-q-options');
   167|    q.opts.forEach(function (opt, i) {
   168|      var label = document.createElement('label');
   169|      label.style.cssText = [
   170|        'display:flex', 'align-items:center', 'gap:8px',
   171|        'padding:9px 12px', 'border-radius:8px', 'border:1.5px solid #e2e8f0',
   172|        'cursor:pointer', 'font-size:0.88rem', 'transition:all 0.15s', 'color:#374151'
   173|      ].join(';');
   174|      label.innerHTML = '<input type="radio" name="zk-q" value="' + i + '" style="accent-color:' + subjColor + '"> ' + opt;
   175|      label.addEventListener('click', function () {
   176|        label.style.background = 'rgba(0,0,0,0.04)';
   177|        label.style.borderColor = subjColor;
   178|        label.style.color = subjColor;
   179|        optsDiv.querySelectorAll('label').forEach(function (other) {
   180|          if (other !== label) {
   181|            other.style.background = '';
   182|            other.style.borderColor = '#e2e8f0';
   183|            other.style.color = '#374151';
   184|          }
   185|        });
   186|      });
   187|      optsDiv.appendChild(label);
   188|    });
   189|
   190|    // 提交答案
   191|    document.getElementById('zk-q-submit').addEventListener('click', function () {
   192|      var selected = document.querySelector('input[name="zk-q"]:checked');
   193|      if (!selected) { showToast('请先选择一个答案'); return; }
   194|      var chosen = parseInt(selected.value);
   195|      var resultDiv = document.getElementById('zk-q-result');
   196|      var optsDivEl = document.getElementById('zk-q-options');
   197|      var btnsDiv = document.getElementById('zk-q-btns');
   198|      var successDiv = document.getElementById('zk-q-success');
   199|
   200|      optsDivEl.style.display = 'none';
   201|      btnsDiv.style.display = 'none';
   202|      resultDiv.style.display = 'block';
   203|
   204|      if (chosen === q.ans) {
   205|        // 答对 → 打卡
   206|        var ci = getCheckin();
   207|        var yesterday = yesterdayStr();
   208|        var streak = (ci.date === yesterday) ? (ci.streak || 0) + 1 : 1;
   209|        var obj = { date: todayStr(), streak: streak };
   210|        setCheckin(obj);
   211|
   212|        resultDiv.innerHTML = '<div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px 14px">' +
   213|          '<div style="font-weight:700;color:#10b981;margin-bottom:4px">✅ 回答正确！</div>' +
   214|          '<div style="font-size:0.82rem;color:#64748b;line-height:1.5">' + q.exp + '</div></div>';
   215|
   216|        document.getElementById('zk-q-streak-text').textContent = '🔥 今日已打卡 ' + streak + '天连击';
   217|
   218|        var modalCard = modal.querySelector('div');
   219|        modalCard.style.padding = '24px 20px';
   220|        successDiv.style.display = 'block';
   221|        successDiv.style.background = 'rgba(243,156,18,0.08)';
   222|        successDiv.style.borderRadius = '10px';
   223|        successDiv.style.marginBottom = '16px';
   224|
   225|        // 更新首页打卡按钮
   226|        var homeBtn = document.getElementById('checkin-btn');
   227|        if (homeBtn) {
   228|          homeBtn.textContent = '🔥 今日已打卡 ' + streak + '天连击';
   229|          homeBtn.disabled = true;
   230|          homeBtn.style.opacity = '0.7';
   231|        }
   232|
   233|        showToast('打卡成功！连续' + streak + '天 💪');
   234|        setTimeout(function () { modal.remove(); }, 2200);
   235|      } else {
   236|        // 答错 → 显示解析，可重试
   237|        resultDiv.innerHTML = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px 14px;margin-bottom:10px">' +
   238|          '<div style="font-weight:700;color:#ef4444;margin-bottom:4px">❌ 回答错误，请再试一次</div>' +
   239|          '<div style="font-size:0.82rem;color:#64748b;line-height:1.5">' + q.exp + '</div></div>';
   240|        var retryBtn = document.createElement('button');
   241|        retryBtn.textContent = '🔄 重新答题';
   242|        retryBtn.style.cssText = 'width:100%;background:#f39c12;color:white;border:none;border-radius:10px;padding:10px;font-weight:600;font-size:0.9rem;cursor:pointer;margin-top:8px';
   243|        retryBtn.addEventListener('click', function () {
   244|          modal.remove();
   245|          showDailyQuestionModal(btn);
   246|        });
   247|        resultDiv.appendChild(retryBtn);
   248|      }
   249|    });
   250|
   251|    // 取消/关闭
   252|    document.getElementById('zk-q-close').addEventListener('click', function () { modal.remove(); });
   253|    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
   254|  }
   255|
   256|  /* ---- utils ---- */
   257|  function todayStr() {
   258|    var d = new Date();
   259|    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
   260|  }
   261|  function yesterdayStr() {
   262|    var d = new Date();
   263|    d.setDate(d.getDate() - 1);
   264|    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
   265|  }
   266|  function pad(n) { return n < 10 ? '0' + n : '' + n; }
   267|  function getPageName() {
   268|    return location.pathname.split('/').pop() || 'index.html';
   269|  }
   270|
   271|  /* ---- toast ---- */
   272|  function showToast(msg) {
   273|    var existing = document.getElementById('zk-toast');
   274|    if (existing) existing.remove();
   275|    var toast = document.createElement('div');
   276|    toast.id = 'zk-toast';
   277|    toast.style.cssText = [
   278|      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
   279|      'background:#1e293b', 'color:white', 'padding:8px 20px', 'border-radius:20px',
   280|      'font-size:0.85rem', 'z-index:99999', 'pointer-events:none', 'opacity:0',
   281|      'transition:opacity 0.3s', 'white-space:nowrap'
   282|    ].join(';');
   283|    toast.textContent = msg;
   284|    document.body.appendChild(toast);
   285|    requestAnimationFrame(function () { toast.style.opacity = '1'; });
   286|    setTimeout(function () {
   287|      toast.style.opacity = '0';
   288|      setTimeout(function () { toast.remove(); }, 300);
   289|    }, 2000);
   290|  }
   291|
   292|  /* ---- fav-star hover style ---- */
   293|  var style = document.createElement('style');
   294|  style.textContent = [
   295|    '.fav-star:hover { opacity: 1 !important; }',
   296|    '.fav-star.active { opacity: 1 !important; }',
   297|    '.answer-details { margin-top: 8px; border-radius: 8px; overflow: hidden; }',
   298|    '.answer-summary {',
   299|    '  background: rgba(16, 185, 129, 0.1);',
   300|    '  border: 1px solid rgba(16, 185, 129, 0.3);',
   301|    '  border-radius: 8px;',
   302|    '  padding: 7px 14px;',
   303|    '  font-size: 0.82rem;',
   304|    '  color: #10b981;',
   305|    '  cursor: pointer;',
   306|    '  list-style: none;',
   307|    '  user-select: none;',
   308|    '  transition: background 0.15s;',
   309|    '}',
   310|    '.answer-summary:hover { background: rgba(16, 185, 129, 0.18); }',
   311|    '.answer-summary::marker { display: none; }',
   312|    'body.dark .answer-summary {',
   313|    '  background: rgba(16, 185, 129, 0.15);',
   314|    '  border-color: rgba(16, 185, 129, 0.4);',
   315|    '  color: #6ee7b7;',
   316|    '}',
   317|    'body.dark .answer-summary:hover { background: rgba(16, 185, 129, 0.25); }'
   318|  ].join(' ');
   319|  document.head.appendChild(style);
   320|
   321|  /* ---- dual mode (simplified/complete) ---- */
   322|  var MODE_KEY = 'zk-view-mode';
   323|  function initDualMode() {
   324|    var toggle = document.getElementById('mode-toggle');
   325|    if (!toggle) return;
   326|    var saved = null;
   327|    try { saved = localStorage.getItem(MODE_KEY); } catch (e) {}
   328|    var mode = saved || 'complete';
   329|    applyMode(mode);
   330|    toggle.addEventListener('click', function () {
   331|      var next = document.body.classList.contains('mode-simplified') ? 'complete' : 'simplified';
   332|      applyMode(next);
   333|    });
   334|  }
   335|  function applyMode(mode) {
   336|    var toggle = document.getElementById('mode-toggle');
   337|    if (mode === 'simplified') {
   338|      document.body.classList.add('mode-simplified');
   339|      if (toggle) toggle.textContent = '📖 完整版';
   340|      try { localStorage.setItem(MODE_KEY, 'simplified'); } catch (e) {}
   341|    } else {
   342|      document.body.classList.remove('mode-simplified');
   343|      if (toggle) toggle.textContent = '⚡ 精简版';
   344|      try { localStorage.setItem(MODE_KEY, 'complete'); } catch (e) {}
   345|    }
   346|  }
   347|
   348|  /* ---- answer folding for .question blocks ---- */
   349|  function initAnswerFolding() {
   350|    var questions = document.querySelectorAll('.question');
   351|    if (!questions.length) return;
   352|    var page = getPageName();
   353|    var storageKey = 'zk-answers-shown-' + page;
   354|
   355|    var shown = {};
   356|    try { shown = JSON.parse(sessionStorage.getItem(storageKey)) || {}; } catch(e) {}
   357|
   358|    questions.forEach(function(q, i) {
   359|      var answer = q.querySelector('.answer-block');
   360|      if (!answer) return;
   361|      var qId = 'q-' + i;
   362|
   363|      // Build collapsible wrapper
   364|      var details = document.createElement('details');
   365|      details.className = 'answer-details';
   366|
   367|      var summary = document.createElement('summary');
   368|      summary.className = 'answer-summary';
   369|      summary.textContent = '👆 点击展开答案';
   370|
   371|      details.appendChild(summary);
   372|      details.appendChild(answer);
   373|
   374|      // Restore state
   375|      if (shown[qId]) {
   376|        details.open = true;
   377|        summary.textContent = '✅ 已查看答案';
   378|      }
   379|
   380|      details.addEventListener('toggle', function() {
   381|        if (details.open) {
   382|          shown[qId] = true;
   383|          try { sessionStorage.setItem(storageKey, JSON.stringify(shown)); } catch(e) {}
   384|          summary.textContent = '✅ 已查看答案';
   385|          // Record in checkin data
   386|          recordAnswer(page, qId);
   387|        }
   388|      });
   389|
   390|      q.appendChild(details);
   391|    });
   392|  }
   393|
   394|  function recordAnswer(page, qId) {
   395|    // Track how many answers viewed today for checkin bonus
   396|    var key = 'zk-answers-done';
   397|    var data = {};
   398|    try { data = JSON.parse(localStorage.getItem(key)) || {}; } catch(e) {}
   399|    var today = todayStr();
   400|    if (!data[today]) data[today] = [];
   401|    if (!data[today].some(function(d) { return d.page === page && d.qId === qId; })) {
   402|      data[today].push({ page: page, qId: qId, time: Date.now() });
   403|      try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
   404|    }
   405|  }
   406|
   407|
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

  /* ---- auto-init ---- */
   408|  function boot() {
   409|    initFavorites();
   410|    initCheckin();
   411|    initDualMode();
   412|    initAnswerFolding();
   413|  }
   414|  if (document.readyState === 'loading') {
   415|    document.addEventListener('DOMContentLoaded', boot);
   416|  } else {
   417|    boot(); // DOM already complete
   418|  }
   419|})();
   420|