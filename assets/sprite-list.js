/* ============================================================
 * sprite-list.js — 数组 vs 链表插入·像素小剧场（sprite-animation 规范）
 *
 * 同一个操作「把 X 插到中间」，上下两条带子各演一遍：
 *   - 数组带：X 落入后的格子后面，右侧全部逐个右移（错落弹簧动画），
 *     行从 6 变 7——移动次数 = 插入点后的元素数 → O(n)
 *   - 链表带：节点散落放置，箭头指针相连；X 弹入后只重接 2 根指针
 *     （n1→n2 断开变 n1→X，新箭头 X→n2）→ O(1)
 *   - 结尾点破权衡：插入/删除链表快，按下标读数组快
 *
 * 环境动画（REC/扫描线/大字故障/走带字幕）为纯 CSS keyframes；
 * prefers-reduced-motion 时序列机停摆、静态初始帧收场。
 * 用法：页面放 <div id="ols-holder"></div> 并引入本脚本。
 * ============================================================ */
(function () {
  "use strict";

  if (window.__olsLoaded) return;
  window.__olsLoaded = true;

  var CSS =
'.ols-stage{position:relative;margin:1.2rem 0;width:820px;height:462px;background:#f5efe2;' +
'border:2px solid #26313b;border-radius:6px;overflow:hidden;font-family:var(--mono,monospace);' +
'box-shadow:4px 4px 0 rgba(38,49,59,.18)}' +
'.ols-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;background:' +
'repeating-linear-gradient(0deg,rgba(38,49,59,.028) 0 1px,transparent 1px 3px),' +
'repeating-linear-gradient(90deg,rgba(38,49,59,.02) 0 1px,transparent 1px 4px)}' +
'.ols-topbar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;' +
'padding:.55rem .9rem;font-size:.72rem;letter-spacing:.08em;color:#4a4a42;z-index:5}' +
'.ols-dots span{display:inline-block;width:6px;height:8px;margin:0 2px;background:#4a4a42;opacity:.35}' +
'.ols-dots span.on{opacity:1;animation:olsDot 2s steps(1) infinite}' +
'.ols-rec{color:#b3372a;font-weight:700;animation:olsRec 1.2s steps(1) infinite}' +
'@keyframes olsRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@keyframes olsDot{0%,100%{opacity:1}33%{opacity:.35}}' +

/* —— 大字「插入」—— */
'.ols-year{position:absolute;left:4.5%;bottom:16.5%;z-index:4;font-family:var(--serif,serif);' +
'font-size:clamp(2.2rem,6vw,3.8rem);font-weight:900;line-height:.95;color:#26313b;' +
'animation:olsGlitch 12s steps(1) infinite}' +
'.ols-year small{display:block;font-size:clamp(.66rem,1.3vw,.84rem);font-weight:400;letter-spacing:.24em;color:#8a8474;margin-top:.4rem}' +
'@keyframes olsGlitch{' +
'0%,93%{clip-path:inset(0 0 0 0);transform:translate(0,0)}' +
'94%{clip-path:inset(12% 0 58% 0);transform:translate(-3px,0)}' +
'96%{clip-path:inset(55% 0 20% 0);transform:translate(3px,0)}' +
'98%,100%{clip-path:inset(0 0 0 0);transform:translate(0,0)}}' +
'.ols-year::after{content:"";position:absolute;inset:0;pointer-events:none;' +
'background:repeating-linear-gradient(0deg,rgba(38,49,59,.06) 0 2px,transparent 2px 5px);' +
'animation:olsScan 3.2s linear infinite}' +
'@keyframes olsScan{from{background-position-y:0}to{background-position-y:30px}}' +

/* —— 两条带子 —— */
'.ols-band{position:absolute;left:6%;right:6%;z-index:3}' +
'.ols-band .lab{font-size:.74rem;font-weight:700;letter-spacing:.12em;color:#4a4a42;margin-bottom:.4rem}' +
'.ols-band .lab b{color:#0e6b5c}' +
'.ols-array{top:13%}' +
'.ols-list{top:50%}' +
'.ols-row{position:relative;height:74px}' +

/* —— 数组格子 —— */
'.ols-cell{position:absolute;top:0;width:54px;height:54px;background:#fffdf6;border:3px solid #26313b;' +
'box-shadow:3px 3px 0 rgba(38,49,59,.2);display:flex;align-items:center;justify-content:center;' +
'font-weight:700;font-size:1.05rem;color:#26313b;' +
'transition:left .45s cubic-bezier(.34,1.2,.5,1),opacity .3s ease,transform .3s ease}' +
'.ols-cell.ins{background:#e3efe9;border-color:#0e6b5c;color:#0e6b5c;animation:olsDrop .5s cubic-bezier(.3,1.3,.5,1) 1}' +
'@keyframes olsDrop{0%{transform:translateY(-26px) scale(.4);opacity:0}60%{transform:translateY(2px) scale(1.1)}' +
'100%{transform:translateY(0) scale(1);opacity:1}}' +
'.ols-cell.shifting{background:#fffdf6;z-index:2}' +
'.ols-marker{position:absolute;top:57px;transform:translateX(-50%);color:#b3372a;font-weight:700;' +
'font-size:.9rem;opacity:0;transition:opacity .25s ease,left .45s cubic-bezier(.34,1.2,.5,1)}' +
'.ols-marker.on{opacity:1}' +

/* —— 链表节点与指针 —— */
'.ols-node{position:absolute;width:46px;height:46px;transform:translate(-50%,-50%);background:#fffdf6;' +
'border:3px solid #26313b;box-shadow:3px 3px 0 rgba(38,49,59,.2);z-index:2;' +
'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;color:#26313b}' +
'.ols-node.ins-node{border-color:#0e6b5c;color:#0e6b5c;animation:olsPop2 .45s cubic-bezier(.3,1.4,.5,1) 1}' +
'@keyframes olsPop2{0%{transform:translate(-50%,-50%) scale(0);opacity:0}60%{transform:translate(-50%,-50%) scale(1.15)}' +
'100%{transform:translate(-50%,-50%) scale(1);opacity:1}}' +
'.ols-arrow{position:absolute;height:4px;background:#26313b;z-index:1;transform-origin:left center;' +
'transition:width .4s cubic-bezier(.34,1.2,.5,1),transform .4s cubic-bezier(.34,1.2,.5,1),opacity .3s ease}' +
'.ols-arrow.new{background:#0e6b5c}' +

/* —— 走带字幕与讲解 —— */
'.ols-ribbon{position:absolute;left:0;right:0;bottom:2.6rem;height:1.7rem;background:#26313b;overflow:hidden;z-index:4}' +
'.ols-ribbon-track{position:absolute;white-space:nowrap;line-height:1.7rem;color:#f5efe2;font-size:.72rem;' +
'letter-spacing:.18em;animation:olsRibbon 16s linear infinite}' +
'@keyframes olsRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
'.ols-caption{position:absolute;left:4.5%;right:4.5%;bottom:.55rem;z-index:4;font-size:.74rem;' +
'line-height:1.5;color:#4a4a42;transition:opacity .2s ease}' +
'.ols-caption b{color:#0e6b5c}.ols-caption i{color:#b3372a;font-style:normal}' +
/* —— 移动端：两条带子竖排堆叠，格子/节点缩小到可读档 —— */
'@media (max-width:640px){.ols-stage{width:100%;height:420px}' +
'.ols-band{left:2%;right:2%}' +
'.ols-array{top:11%}' +
'.ols-list{top:42%}' +
'.ols-cell{width:38px;height:42px;font-size:.85rem}' +
'.ols-node{width:34px;height:34px;font-size:.8rem}' +
'.ols-marker{top:45px;font-size:.75rem}' +
'.ols-year{left:4%;top:8px;bottom:auto;font-size:1.5rem}' +
'.ols-year small{display:none}' +
'.ols-caption{font-size:.66rem}}' +
'@media (prefers-reduced-motion: reduce){.ols-stage *{animation:none !important}.ols-cell,.ols-arrow,.ols-marker{transition:none !important}}';

  var ACTION_MS = 1200;

  /* —— 数组带：初始 6 格，X 插入位置 2（挂载时按布局重设尺寸）—— */
  var ARR = ["A", "B", "C", "D", "E", "F"];
  var CELL_W = 54, CELL_GAP = 8, CELL_STEP = CELL_W + CELL_GAP;
  var ARR_BASE_X = 250;   // 第一格 left（行内坐标）
  var R = 21;             // 节点半边

  /* —— 链表带：5 节点散落，X 插在 n1 与 n2 之间（移动端缩小+左移）—— */
  var LIST_DESKTOP = [
    { v: "A", x: 240, y: 46 }, { v: "B", x: 350, y: 22 }, { v: "C", x: 480, y: 58 },
    { v: "D", x: 610, y: 20 }, { v: "E", x: 680, y: 50 }
  ];
  var LIST_MOBILE = [
    { v: "A", x: 24, y: 34 }, { v: "B", x: 82, y: 20 }, { v: "C", x: 140, y: 44 },
    { v: "D", x: 198, y: 20 }, { v: "E", x: 256, y: 34 }
  ];
  var LIST = LIST_DESKTOP;
  var X_DESKTOP = { v: "X", x: 415, y: 44 };
  var X_MOBILE = { v: "X", x: 111, y: 34 };
  var X_NODE = X_DESKTOP;

  var els = {};
  var actions = [];
  var actIdx = 0;
  var arrayInserted = false;
  var listInserted = false;

  function caption(text) {
    clearTimeout(caption._t);
    els.caption.style.opacity = "0";
    caption._t = setTimeout(function () {
      els.caption.innerHTML = text;
      els.caption.style.opacity = "1";
    }, 180);
  }

  /* ---------- 数组带 ---------- */
  function arrayReset() {
    for (var i = 0; i < ARR.length; i++) {
      var c = els.arrCells[i];
      c.style.left = (ARR_BASE_X + i * CELL_STEP) + "px";
      c.textContent = ARR[i];
      c.classList.remove("shifting");
    }
    if (els.arrX) {
      els.arrX.classList.remove("ins");
      els.arrX.style.opacity = "0";
    }
    arrayInserted = false;
  }

  function arrayInsert() {
    if (arrayInserted) return;
    arrayInserted = true;
    // 插入标记落在位置 2
    els.marker.style.left = (ARR_BASE_X + 2 * CELL_STEP) + "px";
    els.marker.classList.add("on");
    // X 空降
    els.arrX.style.left = (ARR_BASE_X + 2 * CELL_STEP) + "px";
    els.arrX.textContent = "X";
    els.arrX.style.opacity = "1";
    els.arrX.classList.remove("ins");
    void els.arrX.offsetWidth;
    els.arrX.classList.add("ins");
    // 位置 2 及之后的格子依次右移（错落，突出「全部都要动」）
    for (var i = 2; i < ARR.length; i++) {
      (function (i) {
        setTimeout(function () {
          els.arrCells[i].classList.add("shifting");
          els.arrCells[i].style.left = (ARR_BASE_X + (i + 1) * CELL_STEP) + "px";
        }, 90 * (i - 1));
      })(i);
    }
  }
  function arrayUninsert() {
    if (!arrayInserted) return;
    arrayReset();
    els.marker.classList.remove("on");
  }

  /* ---------- 链表带 ---------- */

  var R = 21; // 节点半边

  function placeArrow(el, sx, sy, tx, ty) {
    var dx = tx - sx, dy = ty - sy;
    var len = Math.sqrt(dx * dx + dy * dy);
    el.style.width = len + "px";
    el.style.transform = "translate(" + sx + "px," + sy + "px) rotate(" + (Math.atan2(dy, dx) * 180 / Math.PI) + "deg)";
  }

  function listReset() {
    /* 初始箭头：A→B B→C C→D D→E（X→C 隐藏，插入时才出现） */
    var pts = LIST.map(function (n) { return { x: n.x, y: n.y }; });
    els.arrows[0].style.opacity = "1";
    els.arrows[1].style.opacity = "1";
    els.arrows[2].style.opacity = "0";
    els.arrows[3].style.opacity = "1";
    els.arrows[4].style.opacity = "1";
    placeArrow(els.arrows[0], pts[0].x, pts[0].y, pts[1].x, pts[1].y);
    placeArrow(els.arrows[1], pts[1].x, pts[1].y, pts[2].x, pts[2].y);
    placeArrow(els.arrows[2], X_NODE.x, X_NODE.y, pts[2].x, pts[2].y);
    placeArrow(els.arrows[3], pts[2].x, pts[2].y, pts[3].x, pts[3].y);
    placeArrow(els.arrows[4], pts[3].x, pts[3].y, pts[4].x, pts[4].y);
    els.xNode.style.opacity = "0";
    els.xNode.classList.remove("ins-node");
    listInserted = false;
  }

  function listInsert() {
    if (listInserted) return;
    listInserted = true;
    els.xNode.style.opacity = "1";
    els.xNode.classList.remove("ins-node");
    void els.xNode.offsetWidth;
    els.xNode.classList.add("ins-node");
    // 断开 B→C，重接 B→X；新箭头 X→C 弹出
    var b = LIST[1], c = LIST[2];
    placeArrow(els.arrows[1], b.x, b.y, X_NODE.x, X_NODE.y);
    placeArrow(els.arrows[2], X_NODE.x, X_NODE.y, c.x, c.y);
    els.arrows[2].style.opacity = "1";
  }

  function listUninsert() {
    if (!listInserted) return;
    listReset();
  }

  /* ---------- 总序列 ---------- */
  function buildScript() {
    actions = [];
    actions.push(function () {
      caption("<i>同一个操作</i>：把 X 插到中间——先看数组（连续存储）");
    });
    actions.push(function () {
      arrayInsert();
      caption("数组：X 落位后，<i>后面的 4 个全部右移</i> = 移动 4 次（多了 1 格——还没算扩容）→ <b>O(n)</b>");
    });
    actions.push(function () { caption("数组插入的代价全部花在「搬家」上；插得越靠前，搬得越多。"); });
    actions.push(function () {
      caption("<i>再看链表</i>：节点散着放，靠指针牵手——看它插中间要动几个零件");
    });
    actions.push(function () {
      listInsert();
      caption("链表：X 弹入，<b>只重接 2 根指针</b>（B→X、X→C），其余节点一动不动 → <b>O(1)</b>");
    });
    actions.push(function () {
      caption("权衡：插入/删除<b>链表快 O(1)</b>；按下标读取<i>数组快 O(1)</i>（链表要顺着指针找）");
    });
    actions.push(function () {
      caption("软件工程师的活：根据主要操作选结构——常查不常改用数组，常改不常查用链表");
    });
    actions.push(function () {
      arrayUninsert();
      listUninsert();
      caption("磁带倒回：两条带子回到初始状态，重新开始");
    });
  }

  function step() {
    if (actIdx >= actions.length) { actIdx = 0; }
    actions[actIdx]();
    actIdx += 1;
    var on = actIdx % 5;
    for (var d = 0; d < els.dots.length; d++) els.dots[d].classList.toggle("on", d === on);
    var shown = actIdx > 99 ? actIdx : ("0" + actIdx).slice(-2);
    els.idx.textContent = shown + " / " + actions.length;
  }

  function buildHTML() {
    var cellsHtml = "";
    for (var i = 0; i < ARR.length; i++) {
      cellsHtml += '<div class="ols-cell" style="left:' + (ARR_BASE_X + i * CELL_STEP) + 'px">' + ARR[i] + "</div>";
    }
    var nodesHtml = "";
    LIST.forEach(function (n) {
      nodesHtml += '<div class="ols-node" style="left:' + n.x + "px;top:" + n.y + 'px">' + n.v + "</div>";
    });
    nodesHtml += '<div class="ols-node ins-node-slot" style="left:' + X_NODE.x + "px;top:" + X_NODE.y + 'px;opacity:0">X</div>';
    var arrowsHtml = '<div class="ols-arrow a0"></div><div class="ols-arrow a1"></div><div class="ols-arrow a2 new"></div>' +
      '<div class="ols-arrow a3"></div><div class="ols-arrow a4"></div>';
    var dotsHtml = "";
    for (var d = 0; d < 5; d++) dotsHtml += "<span" + (d === 0 ? ' class="on"' : "") + "></span>";

    return '<div class="ols-stage" data-od-id="stage">' +
      '<div class="ols-grain"></div>' +
      '<div class="ols-topbar" data-od-id="topbar"><span>EP. 05 / 數組·鏈表</span>' +
      '<span><span class="ols-dots">' + dotsHtml + '</span>　<span class="ols-idx">00 / 08</span>' +
      '　<span class="ols-rec">● REC</span></span></div>' +
      '<div class="ols-year" data-od-id="year">插入<small> 數組 O(n) · 鏈表指針 O(1) · 看主要操作選結構 </small></div>' +
      '<div class="ols-band ols-array" data-od-id="band-array">' +
      '<div class="lab">数组 · <b>连续存储</b>：插入中间 = 后面全部搬家</div>' +
      '<div class="ols-row">' + cellsHtml + '<div class="ols-cell ins-cell" style="left:' +
      (ARR_BASE_X + 2 * CELL_STEP) + 'px;opacity:0">X</div><span class="ols-marker">▲</span></div>' +
      '</div>' +
      '<div class="ols-band ols-list" data-od-id="band-list">' +
      '<div class="lab">链表 · <b>散落 + 指针</b>：插入中间 = 只改 2 根指针</div>' +
      '<div class="ols-row">' + arrowsHtml + nodesHtml + '</div>' +
      '</div>' +
      '<div class="ols-ribbon" data-od-id="ribbon"><div class="ols-ribbon-track">' +
      '數組 連續 · 鏈表 指針 · 插入 O(n) vs O(1) · 讀取 O(1) vs O(n) · 隨機訪問 · 順序訪問 · ' +
      '數組 連續 · 鏈表 指針 · 插入 O(n) vs O(1) · 讀取 O(1) vs O(n) · 隨機訪問 · 順序訪問 · </div></div>' +
      '<div class="ols-caption" data-od-id="caption">数组与链表的最大差别在「插入中间」的成本——先看数组带。</div>' +
      '</div>';
  }

  function mount() {
    var holder = document.getElementById("ols-holder");
    if (!holder || holder.querySelector(".ols-stage")) return;

    /* 布局选择：视口 ≤640px 走移动竖排（小坐标）；桌面窄容器 zoom */
    var MOB = window.innerWidth < 640;
    if (MOB) {
      CELL_W = 38; CELL_GAP = 4; CELL_STEP = CELL_W + CELL_GAP;
      ARR_BASE_X = 5;
      R = 17;
      LIST = LIST_MOBILE;
      X_NODE = X_MOBILE;
    }

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    holder.innerHTML = buildHTML();

    var st = holder.querySelector(".ols-stage");
    var holderW = holder.clientWidth;
    if (!MOB && holderW > 0 && holderW < 820) st.style.zoom = holderW / 820;

    var mobMode = MOB;
    var rsT = null;
    window.addEventListener("resize", function () {
      clearTimeout(rsT);
      rsT = setTimeout(function () {
        if ((window.innerWidth < 640) !== mobMode) location.reload();
      }, 400);
    });

    els.caption = holder.querySelector(".ols-caption");
    els.idx = holder.querySelector(".ols-idx");
    els.dots = Array.prototype.slice.call(holder.querySelectorAll(".ols-dots span"));
    els.arrCells = Array.prototype.slice.call(holder.querySelectorAll(".ols-array .ols-cell:not(.ins-cell)"));
    els.arrX = holder.querySelector(".ols-array .ins-cell");
    els.marker = holder.querySelector(".ols-marker");
    els.xNode = holder.querySelector(".ins-node-slot");
    els.arrows = [
      holder.querySelector(".a0"),
      holder.querySelector(".a1"),
      holder.querySelector(".a2"),
      holder.querySelector(".a3"),
      holder.querySelector(".a4")
    ];

    arrayReset();
    listReset();
    buildScript();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    setTimeout(function () {
      step();
      setInterval(step, ACTION_MS);
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
