// features.js — 启动器（加载所有模块后统一初始化）
// 依赖: utils.js → favorites.js → quiz.js → paper.js → mode.js → study-time.js
(function () {
  'use strict';

  function boot() {
    ZK.injectCommonStyles();
    ZK.initFavorites();
    ZK.initCheckin();
    ZK.initDailyQuiz();
    ZK.initDualMode();
    ZK.initAnswerFolding();
    ZK.initPaperJump();
    ZK.initPaperSkeleton();
    ZK.initPaperImgError();
    ZK.initPaperAnswerMask();
    ZK.initPaperDownload();
    ZK.initPaperFullscreen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
