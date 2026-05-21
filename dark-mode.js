// Dark mode toggle — auto-detects system preference, respects manual override via localStorage
(function () {
  var KEY = 'zk-dark-mode'; // zk = zhongkao, avoids collisions
  window.__zkDarkObserver = window.__zkDarkObserver || [];

  function notify() {
    window.__zkDarkObserver.forEach(function (fn) { fn(); });
  }

  function apply(mode) {
    if (mode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    notify();
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mode = saved || (prefersDark ? 'dark' : 'light');
    apply(mode);

    // Auto-respond to system preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (localStorage.getItem(KEY) === null) {
          apply(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  function toggle() {
    var isDark = document.body.classList.contains('dark');
    apply(isDark ? 'light' : 'dark');
  }

  init();

  // Expose globally so the button can call it
  window._zkDarkToggle = toggle;
})();
