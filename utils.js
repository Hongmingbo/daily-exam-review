// utils.js — 共享工具函数（toast、日期、页面名、通用样式注入）
(function () {
  'use strict';

  window.ZK = window.ZK || {};

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function yesterdayStr() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function getPageName() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function showToast(msg) {
    var existing = document.getElementById('zk-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'zk-toast';
    toast.className = 'zk-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = '1'; });
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  function injectCommonStyles() {
    if (document.getElementById('zk-common-styles')) return;
    var style = document.createElement('style');
    style.id = 'zk-common-styles';
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
      'body.dark .answer-summary:hover { background: rgba(16, 185, 129, 0.25); }',
      '@keyframes zk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}',
      'body.dark .paper-img-wrap[data-skeleton]{background:linear-gradient(110deg,#1e293b 30%,#334155 50%,#1e293b 70%);background-size:200% 100%}'
    ].join(' ');
    document.head.appendChild(style);
  }

  ZK.pad = pad;
  ZK.todayStr = todayStr;
  ZK.yesterdayStr = yesterdayStr;
  ZK.getPageName = getPageName;
  ZK.showToast = showToast;
  ZK.injectCommonStyles = injectCommonStyles;
})();
