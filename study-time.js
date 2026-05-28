// study-time.js — 学习时长追踪（全页面生效）
(function () {
  'use strict';

  var TIME_KEY = 'zk-study-time';
  var sessionStart = Date.now();

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
  }

  function pruneOldData() {
    var t = {};
    try { t = JSON.parse(localStorage.getItem(TIME_KEY)) || {}; } catch(e) { return; }
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    var cutoffKey = cutoff.getFullYear() + '-' + ('0'+(cutoff.getMonth()+1)).slice(-2) + '-' + ('0'+cutoff.getDate()).slice(-2);
    var changed = false;
    for (var k in t) {
      if (k < cutoffKey) { delete t[k]; changed = true; }
    }
    if (changed) {
      try { localStorage.setItem(TIME_KEY, JSON.stringify(t)); } catch(e) {}
    }
  }

  // Prune on load
  pruneOldData();

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
})();
