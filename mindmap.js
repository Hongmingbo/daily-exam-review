// 文本思维导图生成器
// 在每个内容页底部渲染知识结构树，折叠显示
(function() {
  if (!window.__ZK_MINDMAP__) return;

  // 全局：显示 toast 提示
  window.__mindmapToast = function(msg) {
    var old = document.getElementById('__mindmap_toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.id = '__mindmap_toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;top:12%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.78);color:#fff;padding:8px 20px;border-radius:20px;font-size:0.85rem;z-index:9999;pointer-events:none;opacity:0;transition:opacity .3s';
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = '1'; });
    setTimeout(function(){ t.style.opacity = '0'; setTimeout(function(){ t.remove(); }, 300); }, 1600);
  };

  // 全局：跳转到试卷页
  window.__mindmapGoPaper = function(url) {
    if (url) window.location.href = url;
  };

  // 从 URL 路径猜测科目
  var path = location.pathname;
  var subject = null;
  var map = null;

  // 匹配优先级：精确文件名 > 目录名
  if (/math/i.test(path))      { subject = 'math'; }
  else if (/english/i.test(path)) { subject = 'english'; }
  else if (/chinese|i18n/i.test(path)) { subject = 'chinese'; }
  else if (/physics/i.test(path))  { subject = 'physics'; }
  else if (/chemistry/i.test(path)) { subject = 'chemistry'; }
  else if (/history/i.test(path))  { subject = 'history'; }
  else if (/politics/i.test(path)) { subject = 'politics'; }
  else if (/biology/i.test(path))  { subject = 'biology'; }

  if (!subject || !window.__ZK_MINDMAP__[subject]) return;
  map = window.__ZK_MINDMAP__[subject];

  // 渲染函数
  function render(map) {
    var isDark = document.body.classList.contains('dark');
    var bg = isDark ? '#1e293b' : '#f0f4f8';
    var cardBg = isDark ? '#1e293b' : '#ffffff';
    var textColor = isDark ? '#e2e8f0' : '#334155';
    var muted = isDark ? '#94a3b8' : '#64748b';
    var border = isDark ? '#334155' : '#cbd5e1';
    var accent = map.color;

    var lines = [
      '<div style="margin:1.5rem 0 1rem;border-top:2px solid ' + border + ';padding-top:1rem;">',
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:0.6rem;cursor:pointer" onclick="var n=this.nextElementSibling;n.style.display=n.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'span\').textContent=n.style.display===\'none\'?\'▼\':\'▲\'">',
      '<span style="font-size:1.1rem;' + (isDark ? 'color:#e2e8f0' : 'color:#1e293b') + '">' + map.icon + ' ' + map.title + '</span>',
      '<span style="color:' + muted + ';font-size:0.75rem">▼ 点击展开/收起</span>',
      '</div>',
      '<div style="display:none;background:' + cardBg + ';border:1px solid ' + border + ';border-radius:12px;padding:0.8rem 1rem;margin-top:0.4rem;">'
    ];

    map.branches.forEach(function(branch, i) {
      var isLast = i === map.branches.length - 1;
      var pipe = isLast ? '└' : '├';

      lines.push('<div style="margin-bottom:0.5rem;">');
      lines.push('<div style="color:' + accent + ';font-weight:600;font-size:0.88rem;margin-bottom:2px;display:flex;align-items:center;gap:4px;">');
      lines.push('<span>' + pipe + ' ' + branch.label + '</span>');
      lines.push('<a href="javascript:void(0)" onclick="window.__mindmapGoPaper(\'' + (map.url || '') + '\')" style="font-size:0.7rem;color:' + accent + ';text-decoration:none;opacity:0.7;cursor:pointer;" title="跳转到试卷页">🔗</a>');
      lines.push('</div>');

      if (branch.sub && branch.sub.length) {
        branch.sub.forEach(function(item, j) {
          var last = j === branch.sub.length - 1;
          var sp = last ? '  ' : '│ ';
          lines.push('<div onclick="window.__mindmapToast(\'暂无对应真题，可前往试卷页查看\')" style="color:' + muted + ';font-size:0.8rem;padding-left:1.2rem;line-height:1.7;cursor:pointer;border-radius:4px;transition:background .15s;" onmouseover="this.style.background=\'' + (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') + '\'" onmouseout="this.style.background=\'transparent\'">' + sp + (last ? '└' : '├') + ' ' + item + '</div>');
        });
      }
      lines.push('</div>');
    });

    lines.push('<p style="margin:0.5rem 0 0;color:' + muted + ';font-size:0.72rem;text-align:right">📌 知识结构 · 睡前过一遍</p>');
    lines.push('</div></div>');
    return lines.join('\n');
  }

  // 插入到 .source-note 之前
  var sourceNote = document.querySelector('.source-note');
  if (!sourceNote) return;

  var container = document.createElement('div');
  container.innerHTML = render(map);
  sourceNote.parentNode.insertBefore(container, sourceNote);

  // 深色模式切换后更新
  if (window.__zkDarkObserver) {
    window.__zkDarkObserver.push(function() {
      container.innerHTML = render(map);
    });
  }
})();
