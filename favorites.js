// favorites.js — 收藏功能
(function () {
  'use strict';

  var FAV_KEY = 'zk-favorites';

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function setFavorites(arr) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function isFaved(id) {
    var page = ZK.getPageName();
    return getFavorites().some(function (f) { return f.id === id && f.page === page; });
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

  function toggleFav(e) {
    e.stopPropagation();
    var btn = e.currentTarget;
    var id = btn.getAttribute('data-id');
    var page = ZK.getPageName();
    var title = getItemTitle(btn.closest('.formula-box, .trap-box, .tip-box') || document.getElementById(id));
    var snippet = getItemSnippet(btn.closest('.formula-box, .trap-box, .tip-box') || document.getElementById(id));
    var favs = getFavorites();
    var idx = favs.findIndex(function (f) { return f.id === id && f.page === page; });
    if (idx >= 0) {
      favs.splice(idx, 1);
      btn.innerHTML = '☆';
      btn.classList.remove('active');
    } else {
      favs.unshift({ id: id, page: page, title: title, snippet: snippet, date: ZK.todayStr() });
      btn.innerHTML = '⭐';
      btn.classList.add('active');
    }
    setFavorites(favs);
    ZK.showToast(idx >= 0 ? '已取消收藏' : '已收藏 ✓');
  }

  function initFavorites() {
    var faves = getFavorites();
    var page = ZK.getPageName();

    document.querySelectorAll('.formula-box, .trap-box, .tip-box').forEach(function (box, i) {
      if (box.id) return;
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

  window.ZK = window.ZK || {};
  ZK.initFavorites = initFavorites;
})();
