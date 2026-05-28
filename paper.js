// paper.js — 试卷页功能（跳转答案、骨架屏、图片错误兜底、答案遮盖、PDF下载、全屏）
(function () {
  'use strict';

  function getAnswerStartIdx(wraps) {
    var container = wraps[0] ? wraps[0].parentElement : null;
    if (container) {
      var attr = container.getAttribute('data-answer-start');
      if (attr) {
        var page = parseInt(attr, 10);
        if (page > 0 && page <= wraps.length) return page - 1;
      }
      var card = container.closest('.content-card');
      if (card) {
        attr = card.getAttribute('data-answer-start');
        if (attr) {
          var page = parseInt(attr, 10);
          if (page > 0 && page <= wraps.length) return page - 1;
        }
      }
    }
    var total = wraps.length;
    return Math.max(Math.floor(total * 0.65), total - 3);
  }

  function initPaperJump() {
    var wraps = document.querySelectorAll('.paper-img-wrap');
    if (wraps.length < 4) return;
    wraps.forEach(function(w, i) { w.id = 'paper-page-' + (i + 1); });
    var answerIdx = getAnswerStartIdx(wraps);
    var btn = document.createElement('button');
    btn.id = 'jump-answer-btn';
    btn.className = 'paper-float-btn paper-float-btn-jump';
    btn.innerHTML = '📍 跳转答案';
    btn.title = '跳转到答案页区域';
    btn.addEventListener('click', function() {
      var target = document.getElementById('paper-page-' + (answerIdx + 1));
      if (target) target.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    document.body.appendChild(btn);
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          btn.textContent = '📋 回到题目';
          btn.onclick = function() {
            document.getElementById('paper-page-1').scrollIntoView({ behavior:'smooth', block:'start' });
            setTimeout(function() {
              btn.textContent = '📍 跳转答案';
              btn.onclick = arguments.callee;
            }, 800);
          };
        } else {
          btn.textContent = '📍 跳转答案';
        }
      });
    }, { threshold: 0.3 });
    observer.observe(wraps[answerIdx]);
  }

  function initPaperSkeleton() {
    var imgs = document.querySelectorAll('.paper-img-wrap img');
    imgs.forEach(function(img) {
      if (img.complete && img.naturalHeight > 0) return;
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
  }

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

  function initPaperAnswerMask() {
    var wraps = document.querySelectorAll('.paper-img-wrap');
    if (wraps.length < 4) return;
    var total = wraps.length;
    var answerStartIdx = getAnswerStartIdx(wraps);
    var key = 'zk-answer-revealed-' + location.pathname.split('/').pop();
    var revealed = localStorage.getItem(key) === '1';

    for (var i = answerStartIdx; i < total; i++) {
      var wrap = wraps[i];
      wrap.setAttribute('data-answer', '1');
      if (!revealed) wrap.classList.add('paper-masked');
    }
    if (revealed) return;

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

    if (!document.getElementById('zk-mask-style')) {
      var s = document.createElement('style');
      s.id = 'zk-mask-style';
      s.textContent = '.paper-masked{position:relative;overflow:hidden;border-radius:10px}.paper-masked img{filter:blur(40px) saturate(0) brightness(0.6);pointer-events:none}.paper-masked::after{content:"";position:absolute;inset:0;border-radius:inherit;background:rgba(241,245,249,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);pointer-events:none}.paper-masked::before{content:"🔒 答案已遮盖";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(239,68,68,0.12);color:#dc2626;padding:12px 28px;border-radius:24px;font-weight:700;font-size:0.95rem;border:2px dashed rgba(239,68,68,0.35);z-index:1;white-space:nowrap;letter-spacing:0.02em}body.dark .paper-masked::after{background:rgba(30,41,59,0.7)}body.dark .paper-masked::before{color:#fca5a5;background:rgba(239,68,68,0.08);border-color:rgba(252,165,165,0.25)}';
      document.head.appendChild(s);
    }
  }

  function initPaperDownload() {
    var wraps = document.querySelectorAll('.paper-img-wrap');
    if (wraps.length < 4) return;
    var btn = document.createElement('button');
    btn.id = 'paper-pdf-btn';
    btn.className = 'paper-float-btn paper-float-btn-pdf';
    btn.innerHTML = '📥 下载PDF';
    btn.title = '调用浏览器打印生成PDF';
    btn.onclick = function() {
      ZK.showToast('💡 在打印界面选「另存为PDF」');
      setTimeout(function() { window.print(); }, 500);
    };
    document.body.appendChild(btn);
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
    btn.className = 'paper-float-btn paper-float-btn-fullscreen';
    btn.innerHTML = '📱 全屏';
    btn.title = '沉浸式阅读模式';
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

  window.ZK = window.ZK || {};
  ZK.initPaperJump = initPaperJump;
  ZK.initPaperSkeleton = initPaperSkeleton;
  ZK.initPaperImgError = initPaperImgError;
  ZK.initPaperAnswerMask = initPaperAnswerMask;
  ZK.initPaperDownload = initPaperDownload;
  ZK.initPaperFullscreen = initPaperFullscreen;
})();
