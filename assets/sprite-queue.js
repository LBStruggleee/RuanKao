/* ============================================================
 * sprite-queue.js — 循环队列·像素小剧场 v2（sprite-animation 规范）
 *
 * v1 的指针用 steps(1) 在远距离关键帧间瞬移、token 硬开关闪烁、
 * 绕格无限闪——既不流畅也不美观。v2 改为：
 *   - 小状态机驱动「出队/入队/绕回」脚本：入队先放元素再 rear+1
 *     （与本课口径一致），出队 front 后移，一轮 10 个动作后磁带倒回
 *   - 精灵逐格平滑跳跃（弹簧缓动 + hop 弧线），绕回时右缘出场、
 *     左缘入场的一次性动画 + 格子单次闪光（不再无限闪）
 *   - token 弹入（pop）/ 淡出上飘（leave），cells 前后指针高亮
 *   - 讲解字幕随每一步实时更新，把判满公式 (rear+1)%M==front
 *     在真的队满时打在字幕上
 *
 * 环境动画（REC 闪烁/扫描线/假名浮现/走带字幕/大字故障）仍为纯
 * CSS keyframes；prefers-reduced-motion 时序列机停摆、静态收场。
 *
 * 用法：页面放 <div id="odq-holder"></div> 并引入本脚本即可。
 * ============================================================ */
(function () {
  "use strict";

  if (window.__odqLoaded) return;
  window.__odqLoaded = true;

  var CSS =
'.odq-stage{position:relative;margin:1.2rem 0;width:820px;height:462px;background:#f5efe2;' +
'border:2px solid #26313b;border-radius:6px;overflow:hidden;font-family:var(--mono,monospace);' +
'box-shadow:4px 4px 0 rgba(38,49,59,.18)}' +
'.odq-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;background:' +
'repeating-linear-gradient(0deg,rgba(38,49,59,.028) 0 1px,transparent 1px 3px),' +
'repeating-linear-gradient(90deg,rgba(38,49,59,.02) 0 1px,transparent 1px 4px)}' +
'.odq-topbar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;' +
'padding:.55rem .9rem;font-size:.72rem;letter-spacing:.08em;color:#4a4a42;z-index:5}' +
'.odq-dots span{display:inline-block;width:6px;height:8px;margin:0 2px;background:#4a4a42;opacity:.35}' +
'.odq-dots span.on{opacity:1;animation:odqDot 2s steps(1) infinite}' +
'.odq-rec{color:#b3372a;font-weight:700;animation:odqRec 1.2s steps(1) infinite}' +
'@keyframes odqRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@keyframes odqDot{0%,100%{opacity:1}33%{opacity:.35}}' +

/* —— 大字「循環」：长周期故障 + 扫描线 —— */
'.odq-year{position:absolute;left:4.5%;bottom:17%;z-index:4;font-family:var(--serif,serif);' +
'font-size:clamp(3rem,8.5vw,5.8rem);font-weight:900;line-height:.95;color:#26313b;' +
'animation:odqGlitch 12s steps(1) infinite}' +
'.odq-year small{display:block;font-size:clamp(.72rem,1.5vw,.95rem);font-weight:400;letter-spacing:.3em;color:#8a8474;margin-top:.4rem}' +
'@keyframes odqGlitch{' +
'0%,93%{clip-path:inset(0 0 0 0);transform:translate(0,0)}' +
'94%{clip-path:inset(12% 0 58% 0);transform:translate(-3px,0)}' +
'96%{clip-path:inset(55% 0 20% 0);transform:translate(3px,0)}' +
'98%,100%{clip-path:inset(0 0 0 0);transform:translate(0,0)}}' +
'.odq-year::after{content:"";position:absolute;inset:0;pointer-events:none;' +
'background:repeating-linear-gradient(0deg,rgba(38,49,59,.06) 0 2px,transparent 2px 5px);' +
'animation:odqScan 3.2s linear infinite}' +
'@keyframes odqScan{from{background-position-y:0}to{background-position-y:30px}}' +

/* —— 假名 —— */
'.odq-kana{position:absolute;right:5%;top:16%;z-index:4;writing-mode:vertical-rl;' +
'font-family:var(--serif,serif);font-size:clamp(1.05rem,2.3vw,1.5rem);letter-spacing:.5em;color:#26313b}' +
'.odq-kana span{opacity:0;animation:odqKana 6.4s ease-in-out infinite}' +
'.odq-kana span:nth-child(2){animation-delay:1.6s}' +
'.odq-kana span:nth-child(3){animation-delay:3.2s}' +
'.odq-kana span:nth-child(4){animation-delay:4.8s}' +
'@keyframes odqKana{0%{opacity:0;transform:translateY(-8px)}12%{opacity:1;transform:translateY(0)}' +
'70%{opacity:1}82%{opacity:0;transform:translateY(6px)}100%{opacity:0}}' +

/* —— 棋盘：微浮 —— */
'.odq-board{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);width:354px;z-index:3;' +
'animation:odqBob 2.8s ease-in-out infinite}' +
'@keyframes odqBob{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 2px))}}' +
'.odq-cells{position:relative;height:52px}' +
'.odq-cell{position:absolute;top:0;width:60px;height:52px;background:#fffdf6;border:3px solid #26313b;' +
'box-shadow:4px 4px 0 rgba(38,49,59,.22);' +
'transition:border-color .3s ease,box-shadow .3s ease}' +
'.odq-cell .n{position:absolute;top:-1.4rem;left:50%;transform:translateX(-50%);font-size:.66rem;color:#8a8474}' +
'.odq-cell.at-front{border-color:#0e6b5c;box-shadow:4px 4px 0 rgba(38,49,59,.22),0 0 0 3px rgba(14,107,92,.28)}' +
'.odq-cell.at-rear{border-color:#b3372a;box-shadow:4px 4px 0 rgba(38,49,59,.22),0 0 0 3px rgba(179,55,42,.25)}' +
'.odq-cell.wrapflash{animation:odqWrapFlash .8s ease 1}' +
'@keyframes odqWrapFlash{0%,100%{box-shadow:4px 4px 0 rgba(38,49,59,.22)}' +
'40%{box-shadow:4px 4px 0 rgba(38,49,59,.22),0 0 0 7px rgba(179,55,42,.4)}}' +

/* —— token：弹入 / 淡出上飘 —— */
'.odq-token{position:absolute;inset:6px;display:flex;align-items:center;justify-content:center;' +
'font-weight:700;font-size:1.1rem;color:#26313b;opacity:0}' +
'.odq-cell.filled .odq-token{opacity:1}' +
'.odq-cell.popping .odq-token{animation:odqPop .45s cubic-bezier(.3,1.4,.5,1) 1}' +
'@keyframes odqPop{0%{transform:scale(0) translateY(-12px);opacity:0}55%{transform:scale(1.12);opacity:1}' +
'100%{transform:scale(1);opacity:1}}' +
'.odq-cell.leaving .odq-token{animation:odqLeave .4s ease 1 forwards}' +
'@keyframes odqLeave{0%{transform:scale(1);opacity:1}40%{transform:scale(1.08) translateY(-8px)}' +
'100%{transform:scale(.4) translateY(-18px);opacity:0}}' +
'.odq-cell.flipping .odq-token{animation:odqFlip .35s ease 1}' +
'@keyframes odqFlip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}' +

/* —— 指针精灵：逐格平滑跳跃 —— */
'.odq-sprite{position:absolute;top:-46px;width:28px;height:34px;' +
'transition:left .5s cubic-bezier(.34,1.25,.5,1),opacity .35s ease}' +
'.odq-sprite .odq-tag{position:absolute;bottom:calc(100% + 3px);left:50%;transform:translateX(-50%);' +
'font-size:.58rem;letter-spacing:.12em;white-space:nowrap}' +
'.odq-sprite.front{color:#0e6b5c}.odq-sprite.front .odq-tag{color:#0e6b5c}' +
'.odq-sprite.rear{color:#b3372a}.odq-sprite.rear .odq-tag{color:#b3372a}' +
'.odq-hop{width:28px;height:34px}' +
'.odq-hop.on{animation:odqHop .5s ease 1}' +
'@keyframes odqHop{0%{transform:translateY(0)}45%{transform:translateY(-12px)}100%{transform:translateY(0)}}' +
'.odq-bob{width:28px;height:34px;animation:odqBob2 1.8s ease-in-out infinite}' +
'.odq-sprite.rear .odq-bob{animation-delay:.9s}' +
'@keyframes odqBob2{0%,100%{margin-top:0}50%{margin-top:-4px}}' +
'.odq-svg{display:block;image-rendering:pixelated}' +

/* —— 走带字幕 —— */
'.odq-ribbon{position:absolute;left:0;right:0;bottom:2.6rem;height:1.7rem;background:#26313b;overflow:hidden;z-index:4}' +
'.odq-ribbon-track{position:absolute;white-space:nowrap;line-height:1.7rem;color:#f5efe2;font-size:.72rem;' +
'letter-spacing:.18em;animation:odqRibbon 16s linear infinite}' +
'@keyframes odqRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
'.odq-caption{position:absolute;left:4.5%;right:4.5%;bottom:.55rem;z-index:4;font-size:.74rem;' +
'line-height:1.5;color:#4a4a42;transition:opacity .2s ease}' +
'.odq-caption b{color:#0e6b5c}.odq-caption i{color:#b3372a;font-style:normal}' +
/* —— 移动端：竖排布局，保持可读字号（不整体缩放）—— */
'@media (max-width:640px){.odq-stage{width:100%;height:330px}' +
'.odq-board{width:280px;top:50%}' +
'.odq-cells{height:44px}' +
'.odq-cell{width:48px;height:44px}' +
'.odq-sprite{top:-36px}.odq-svg{width:22px;height:27px}' +
'.odq-tag{font-size:.52rem}' +
'.odq-kana{display:none}' +
'.odq-year{left:4%;top:10px;bottom:auto;font-size:1.7rem}' +
'.odq-year small{display:none}' +
'.odq-caption{font-size:.66rem}}' +
'@media (prefers-reduced-motion: reduce){.odq-stage *{animation:none !important}.odq-sprite{transition:none !important}}';

  var M = 5;            // 格数
  var CELL_W = 60;      // 挂载时按移动/桌面布局重设
  var STEP = 72;        // 格宽 + 间隔
  var BOARD_W = 348;
  var MOB = false;      // 移动端竖排布局标记
  var ACTION_MS = 1400;
  var ACTIONS_PER_CYCLE = 10;
  var ENQUEUE_LETTERS = ["E", "F", "G", "H", "I"];

  var state = { cells: ["A", "B", "C", "D", null], front: 0, rear: 4 };
  var action = 0;       // 0..9 动作，10 = 磁带倒回
  var qi = 0;

  var els = {};
  var timer = null;

  function spriteX(i) { return i * STEP + CELL_W / 2; }

  function px(n) { return n < 10 ? "0" + n : "" + n; }

  var capTimer = null;
  function caption(text) {
    clearTimeout(capTimer);
    els.caption.style.opacity = "0";
    capTimer = setTimeout(function () {
      els.caption.textContent = text;
      els.caption.style.opacity = "1";
    }, 180);
  }

  /* 棋盘状态刷新：filled / 指针高亮 / 顶条进度点 */
  function refreshBoard() {
    for (var i = 0; i < M; i++) {
      var cell = els.cells[i];
      cell.classList.toggle("filled", !!state.cells[i]);
      cell.classList.toggle("at-front", i === state.front);
      cell.classList.toggle("at-rear", i === state.rear && state.rear !== state.front);
    }
    var on = Math.floor((action % ACTIONS_PER_CYCLE) / 2);
    for (var d = 0; d < els.dots.length; d++) {
      els.dots[d].classList.toggle("on", d === on);
    }
    var n = action % (ACTIONS_PER_CYCLE + 1);
    els.idx.textContent = px(n) + " / " + ACTIONS_PER_CYCLE;
  }

  function hopOf(el) { return el.querySelector(".odq-hop"); }

  function moveSprite(el, cellIdx) {
    el.style.left = spriteX(cellIdx) + "px";
    var hop = hopOf(el);
    hop.classList.remove("on");
    void hop.offsetWidth;          // 强制重排以重启动画
    hop.classList.add("on");
  }

  /* 出队：front 格 token 淡出上飘，front 精灵跳到下一格 */
  function doDequeue() {
    var at = state.front;
    var letter = state.cells[at];
    var cell = els.cells[at];
    cell.classList.add("leaving");
    setTimeout(function () {
      cell.classList.remove("leaving", "filled");
      state.cells[at] = null;
      refreshBoard();
    }, 420);
    state.front = (state.front + 1) % M;
    moveSprite(els.front, state.front);
    caption("出队 " + letter + " · front → 格" + state.front + "（队首后移，位置让出）");
    refreshBoard();
  }

  /* 入队：元素先放进 rear 格，rear 再前进（本课口径：rear 指队尾下一位置） */
  function doEnqueue() {
    var letter = ENQUEUE_LETTERS[qi % ENQUEUE_LETTERS.length];
    qi += 1;
    var at = state.rear;
    state.cells[at] = letter;
    var cell = els.cells[at];
    cell.querySelector(".odq-token").textContent = letter;
    cell.classList.add("filled", "popping");
    setTimeout(function () { cell.classList.remove("popping"); }, 480);

    var wrapped = at === M - 1;
    var newRear = (at + 1) % M;
    var full = (newRear + 1) % M === state.front;

    var msg = "入队 " + letter + " → 格" + at + " · rear" +
      (wrapped ? " 绕回格" : " → 格") + newRear + (wrapped ? "（循环）" : "");
    if (full) msg += " · (rear+1)%M==front → 队满，牺牲一格";
    caption(msg);

    if (wrapped) {
      /* 绕回：右缘出场 → 左缘入场 → 目标格（一次性闪光，不再无限闪） */
      els.rear.style.left = (BOARD_W + 44) + "px";
      els.rear.style.opacity = "0";
      setTimeout(function () {
        els.rear.style.transition = "none";
        els.rear.style.left = "-44px";
        void els.rear.offsetWidth;
        els.rear.style.transition = "";
        els.rear.style.left = spriteX(newRear) + "px";
        els.rear.style.opacity = "1";
        var c2 = els.cells[newRear];
        c2.classList.remove("wrapflash");
        void c2.offsetWidth;
        c2.classList.add("wrapflash");
        setTimeout(function () { c2.classList.remove("wrapflash"); }, 850);
      }, 420);
    } else {
      moveSprite(els.rear, newRear);
    }
    state.rear = newRear;
    refreshBoard();
  }

  /* 一轮演完：磁带倒回，字母翻回 A B C D */
  function doReset() {
    var targets = ["A", "B", "C", "D"];
    for (var i = 0; i < 4; i++) {
      (function (i) {
        setTimeout(function () {
          state.cells[i] = targets[i];
          var cell = els.cells[i];
          cell.querySelector(".odq-token").textContent = targets[i];
          cell.classList.add("flipping");
          setTimeout(function () { cell.classList.remove("flipping"); }, 380);
          refreshBoard();
        }, i * 110);
      })(i);
    }
    caption("一轮循环完成 · 磁带倒回到初始队  A B C D · 空格牺牲");
    setTimeout(function () { refreshBoard(); }, 460);
  }

  function step() {
    if (action >= ACTIONS_PER_CYCLE) {
      doReset();
      action = 0;
    } else {
      if (action % 2 === 0) doDequeue();
      else doEnqueue();
      action += 1;
    }
    refreshBoard();
  }

  function buildHTML() {
    var cellsHtml = "";
    for (var i = 0; i < M; i++) {
      cellsHtml += '<div class="odq-cell" style="left:' + (i * STEP) + 'px">' +
        '<span class="n">格' + i + '</span><span class="odq-token"></span></div>';
    }
    var dotsHtml = "";
    for (var d = 0; d < 5; d++) dotsHtml += "<span" + (d === 0 ? ' class="on"' : "") + "></span>";

    return '<div class="odq-stage" data-od-id="stage">' +
      '<div class="odq-grain"></div>' +
      '<div class="odq-topbar" data-od-id="topbar"><span>EP. 06 / 循環隊列</span>' +
      '<span><span class="odq-dots">' + dotsHtml + '</span>　<span class="odq-idx">00 / 10</span>' +
      '　<span class="odq-rec">● REC</span></span></div>' +
      '<div class="odq-year" data-od-id="year">循環<small> rear 指向隊尾下一格 · 犧牲一格判滿 </small></div>' +
      '<div class="odq-kana" data-od-id="kana"><span>先</span><span>入</span><span>先</span><span>出</span></div>' +
      '<div class="odq-board" data-od-id="sprite">' +
      '<div class="odq-cells">' + cellsHtml +
      '<div class="odq-sprite front" data-od-id="sprite-front" style="left:' + spriteX(0) + 'px">' +
      '<div class="odq-tag">front</div>' +
      '<div class="odq-hop"><div class="odq-bob"><svg class="odq-svg" width="28" height="34" viewBox="0 0 7 9" shape-rendering="crispEdges">' +
      '<rect x="3" y="0" width="1" height="9" fill="currentColor"/><rect x="3" y="0" width="4" height="3" fill="currentColor"/>' +
      '<rect x="1" y="1" width="2" height="1" fill="currentColor"/><rect x="2" y="3" width="1" height="1" fill="currentColor"/>' +
      '<rect x="2" y="5" width="1" height="4" fill="#26313b"/></svg></div></div></div>' +
      '<div class="odq-sprite rear" data-od-id="sprite-rear" style="left:' + spriteX(4) + 'px">' +
      '<div class="odq-tag">rear</div>' +
      '<div class="odq-hop"><div class="odq-bob"><svg class="odq-svg" width="28" height="34" viewBox="0 0 7 9" shape-rendering="crispEdges">' +
      '<rect x="3" y="0" width="1" height="9" fill="currentColor"/><rect x="0" y="0" width="3" height="3" fill="currentColor"/>' +
      '<rect x="0" y="3" width="1" height="1" fill="currentColor"/><rect x="4" y="5" width="1" height="4" fill="#26313b"/>' +
      '</svg></div></div></div>' +
      '</div></div>' +
      '<div class="odq-ribbon" data-od-id="ribbon"><div class="odq-ribbon-track">' +
      '格0 · 格1 · 格2 · 格3 · 格4 · 犧牲一格 · 判滿 (rear+1) mod M == front · 隊空 front == rear · ' +
      '格0 · 格1 · 格2 · 格3 · 格4 · 犧牲一格 · 判滿 (rear+1) mod M == front · 隊空 front == rear · </div></div>' +
      '<div class="odq-caption" data-od-id="caption">循环队列：入队时 <b>rear</b> 逐格后移，出队时 <b>front</b> 跟着走——到头就绕回格 0 继续。</div>' +
      '</div>';
  }

  function mount() {
    var holder = document.getElementById("odq-holder");
    if (!holder || holder.querySelector(".odq-stage")) return;

    /* 布局选择：视口 ≤640px 走移动竖排（可读字号，与 CSS 媒体查询同阈值）；
       桌面但容器 < 820px 整体 zoom 适配。横竖屏翻转时模式变化 → 重载 */
    var holderW = holder.clientWidth;
    MOB = window.innerWidth < 640;
    CELL_W = MOB ? 48 : 60;
    STEP = MOB ? 58 : 72;
    BOARD_W = MOB ? 280 : 348;

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    holder.innerHTML = buildHTML();

    var st = holder.querySelector(".odq-stage");
    if (!MOB && holderW > 0 && holderW < 820) st.style.zoom = holderW / 820;

    var mobMode = MOB;
    var rsT = null;
    window.addEventListener("resize", function () {
      clearTimeout(rsT);
      rsT = setTimeout(function () {
        if ((window.innerWidth < 640) !== mobMode) location.reload();
      }, 400);
    });

    els.caption = holder.querySelector(".odq-caption");
    els.idx = holder.querySelector(".odq-idx");
    els.dots = Array.prototype.slice.call(holder.querySelectorAll(".odq-dots span"));
    els.cells = Array.prototype.slice.call(holder.querySelectorAll(".odq-cell"));
    els.front = holder.querySelector(".odq-sprite.front");
    els.rear = holder.querySelector(".odq-sprite.rear");

    /* 初始静态状态（减弱动效用户看到的也是这一帧） */
    var initials = ["A", "B", "C", "D"];
    for (var i = 0; i < M; i++) {
      if (initials[i]) {
        els.cells[i].classList.add("filled");
        els.cells[i].querySelector(".odq-token").textContent = initials[i];
      }
    }
    els.rear.style.left = spriteX(4) + "px";
    refreshBoard();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;   // 序列机停摆，保持静态初始帧

    setTimeout(function () {
      step();
      timer = setInterval(step, ACTION_MS);
    }, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
