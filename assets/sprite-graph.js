/* ============================================================
 * sprite-graph.js — 图遍历·像素小剧场（DFS / BFS，sprite-animation 规范）
 *
 * 固定 6 节点小图（A–F），DFS 与 BFS 各从 A 起轮演一遍：
 *   - 节点按访问顺序逐个点亮（访问 = 填充），「在栈/队列里」的 frontier
 *     节点带金色描边，当前访问节点脉冲
 *   - 右侧面板实时演出栈（DFS，顶进顶出）/队列（BFS，尾进头出），
 *     元素弹入弹出动画与遍历步同步
 *   - 每次访问点亮「来到该节点」的那条父边——DFS 走出深的一条路，
 *     BFS 走出层层铺开的效果，两种形状一眼可辨
 *   - 字幕逐步解释：「一条路走到黑」「死路，回溯」「一层一层扫」
 *
 * 环境动画（REC/扫描线/大字故障/走带字幕）为纯 CSS keyframes；
 * prefers-reduced-motion 时序列机停摆、静态初始帧收场。
 * 用法：页面放 <div id="odg-holder"></div> 并引入本脚本。
 * ============================================================ */
(function () {
  "use strict";

  if (window.__odgLoaded) return;
  window.__odgLoaded = true;

  var CSS =
'.odg-stage{position:relative;margin:1.2rem 0;width:820px;height:462px;background:#f5efe2;' +
'border:2px solid #26313b;border-radius:6px;overflow:hidden;font-family:var(--mono,monospace);' +
'box-shadow:4px 4px 0 rgba(38,49,59,.18)}' +
'.odg-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;background:' +
'repeating-linear-gradient(0deg,rgba(38,49,59,.028) 0 1px,transparent 1px 3px),' +
'repeating-linear-gradient(90deg,rgba(38,49,59,.02) 0 1px,transparent 1px 4px)}' +
'.odg-topbar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;' +
'padding:.55rem .9rem;font-size:.72rem;letter-spacing:.08em;color:#4a4a42;z-index:5}' +
'.odg-dots span{display:inline-block;width:6px;height:8px;margin:0 2px;background:#4a4a42;opacity:.35}' +
'.odg-dots span.on{opacity:1;animation:odgDot 2s steps(1) infinite}' +
'.odg-rec{color:#b3372a;font-weight:700;animation:odgRec 1.2s steps(1) infinite}' +
'@keyframes odgRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@keyframes odgDot{0%,100%{opacity:1}33%{opacity:.35}}' +

/* —— 大字「遍历」—— */
'.odg-year{position:absolute;left:4.5%;bottom:16.5%;z-index:4;font-family:var(--serif,serif);' +
'font-size:clamp(2.6rem,7vw,4.6rem);font-weight:900;line-height:.95;color:#26313b;' +
'animation:odgGlitch 12s steps(1) infinite}' +
'.odg-year small{display:block;font-size:clamp(.68rem,1.4vw,.88rem);font-weight:400;letter-spacing:.28em;color:#8a8474;margin-top:.4rem}' +
'@keyframes odgGlitch{' +
'0%,93%{clip-path:inset(0 0 0 0);transform:translate(0,0)}' +
'94%{clip-path:inset(12% 0 58% 0);transform:translate(-3px,0)}' +
'96%{clip-path:inset(55% 0 20% 0);transform:translate(3px,0)}' +
'98%,100%{clip-path:inset(0 0 0 0);transform:translate(0,0)}}' +
'.odg-year::after{content:"";position:absolute;inset:0;pointer-events:none;' +
'background:repeating-linear-gradient(0deg,rgba(38,49,59,.06) 0 2px,transparent 2px 5px);' +
'animation:odgScan 3.2s linear infinite}' +
'@keyframes odgScan{from{background-position-y:0}to{background-position-y:30px}}' +

/* —— 图 —— */
'.odg-board{position:absolute;left:5%;top:13%;width:520px;height:360px;z-index:3}' +
'.odg-edges{position:absolute;inset:0;width:100%;height:100%}' +
'.odg-edges line{stroke:#b5ab93;stroke-width:5;stroke-linecap:square;transition:stroke .3s ease,stroke-width .3s ease}' +
'.odg-edges line.used{stroke:#0e6b5c;stroke-width:6}' +
'.odg-node{position:absolute;width:44px;height:44px;transform:translate(-50%,-50%);' +
'background:#fffdf6;border:3px solid #26313b;box-shadow:3px 3px 0 rgba(38,49,59,.22);' +
'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.05rem;' +
'color:#26313b;transition:background .3s ease,border-color .3s ease,box-shadow .3s ease}' +
'.odg-node.queued{border-color:#8a6d1f;box-shadow:3px 3px 0 rgba(38,49,59,.22),0 0 0 3px rgba(138,109,31,.3)}' +
'.odg-node.visited{background:#0e6b5c;border-color:#0e6b5c;color:#fff;box-shadow:3px 3px 0 rgba(38,49,59,.22)}' +
'.odg-node.cur{animation:odgPulse .7s ease 1}' +
'@keyframes odgPulse{0%,100%{box-shadow:3px 3px 0 rgba(38,49,59,.22)}' +
'40%{box-shadow:3px 3px 0 rgba(38,49,59,.22),0 0 0 7px rgba(14,107,92,.35)}}' +

/* —— 栈/队列面板 —— */
'.odg-panel{position:absolute;right:4%;top:14%;width:158px;z-index:4;text-align:center}' +
'.odg-panel .t{font-weight:700;letter-spacing:.14em;font-size:.76rem;padding:.25rem .5rem;' +
'border:2px solid #26313b;border-radius:2px;background:#e3efe9;color:#0e6b5c;margin-bottom:.6rem}' +
'.odg-panel .t.bfs{background:#fbeadd;color:#b3372a}' +
'.odg-struct{display:flex;flex-direction:column;align-items:center;gap:5px;min-height:34px;' +
'padding:.4rem 0;border:2px dashed #b5ab93;border-radius:4px;background:rgba(255,253,246,.6)}' +
'.odg-entry{width:34px;height:30px;background:#fffdf6;border:2px solid #26313b;' +
'box-shadow:2px 2px 0 rgba(38,49,59,.2);display:flex;align-items:center;justify-content:center;' +
'font-weight:700;font-size:.95rem;color:#26313b}' +
'.odg-entry.in{animation:odgIn .35s cubic-bezier(.3,1.4,.5,1) 1}' +
'@keyframes odgIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}' +
'.odg-entry.out{animation:odgOut .3s ease 1 forwards}' +
'@keyframes odgOut{0%{transform:scale(1);opacity:1}100%{transform:scale(.3);opacity:0}}' +
'.odg-hint{margin-top:.5rem;font-size:.62rem;color:#8a8474;line-height:1.5}' +

/* —— 走带字幕与讲解 —— */
'.odg-ribbon{position:absolute;left:0;right:0;bottom:2.6rem;height:1.7rem;background:#26313b;overflow:hidden;z-index:4}' +
'.odg-ribbon-track{position:absolute;white-space:nowrap;line-height:1.7rem;color:#f5efe2;font-size:.72rem;' +
'letter-spacing:.18em;animation:odgRibbon 16s linear infinite}' +
'@keyframes odgRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
'.odg-caption{position:absolute;left:4.5%;right:4.5%;bottom:.55rem;z-index:4;font-size:.74rem;' +
'line-height:1.5;color:#4a4a42;transition:opacity .2s ease}' +
'.odg-caption b{color:#0e6b5c}.odg-caption i{color:#b3372a;font-style:normal}' +
/* —— 移动端：图板居中上移，面板横排堆到下方 —— */
'@media (max-width:640px){.odg-stage{width:100%;height:540px}' +
'.odg-board{left:50%;top:9%;transform:translateX(-50%);width:260px;height:260px}' +
'.odg-node{width:36px;height:36px;font-size:.9rem}' +
'.odg-panel{right:auto;left:50%;transform:translateX(-50%);top:336px;width:172px}' +
'.odg-struct{flex-direction:row;flex-wrap:wrap;justify-content:center;padding:.3rem .4rem}' +
'.odg-entry{width:28px;height:26px;font-size:.85rem}' +
'.odg-hint{font-size:.64rem;margin-top:.3rem}' +
'.odg-year{left:4%;top:8px;bottom:auto;font-size:1.5rem}' +
'.odg-year small{display:none}' +
'.odg-caption{font-size:.66rem}}' +
'@media (prefers-reduced-motion: reduce){.odg-stage *{animation:none !important}.odg-node,.odg-edges line{transition:none !important}}';

  var NODES_DESKTOP = {
    A: { x: 150, y: 92 }, B: { x: 300, y: 52 }, C: { x: 150, y: 190 },
    D: { x: 300, y: 172 }, E: { x: 450, y: 92 }, F: { x: 300, y: 302 }
  };
  var NODES_MOBILE = {
    A: { x: 55, y: 46 }, B: { x: 130, y: 22 }, C: { x: 55, y: 118 },
    D: { x: 130, y: 90 }, E: { x: 205, y: 46 }, F: { x: 130, y: 166 }
  };
  var NODES = NODES_DESKTOP;   // 挂载时按移动/桌面布局切换
  var EDGES = [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "D"], ["D", "F"]];
  /* 两种遍历的父边（来到该节点所走的边）与顺序 */
  var PARENT = {
    DFS: { B: "A", D: "B", C: "D", F: "D", E: "B" },
    BFS: { B: "A", C: "A", D: "B", E: "B", F: "D" }
  };
  var ACTION_MS = 950;
  var VIEW_BOX = "0 0 520 360";

  var els = {};
  var capLen = 0;   // 当前字幕可见字数，用于自适应停顿
  var timer = null;
  var actions = [];
  var actIdx = 0;
  var mode = "DFS";
  var visited = {};

  /* 脚本（预先排好的每一步：访问谁 / 进栈（队）/ 出几个 / 字幕） */
  var DFS_SCRIPT = [
    { v: "A", push: ["A"], cap: "DFS：从 A 出发 · 访问 A · 栈 = [A]" },
    { v: "B", push: ["B"], cap: "一条路走到黑：A → B · 栈 = [A,B]" },
    { v: "D", push: ["D"], cap: "继续深入：B → D · 栈 = [A,B,D]" },
    { v: "C", push: ["C"], cap: "D → C · 栈 = [A,B,D,C]" },
    { pop: 1, cap: "C 没有未访问的邻居 → <i>死路，回溯</i> · 栈 = [A,B,D]" },
    { v: "F", push: ["F"], cap: "回到 D，换条路：D → F · 栈 = [A,B,D,F]" },
    { pop: 1, cap: "F 也是死路 → <i>回溯</i> · 栈 = [A,B,D]" },
    { pop: 1, cap: "回到 B（D 的路都走过了）· 栈 = [A,B]" },
    { v: "E", push: ["E"], cap: "B 的另一条：B → E · 栈 = [A,B,E]" },
    { pop: 1, cap: "E 是死路 → <i>回溯</i> · 栈 = [A,B]" },
    { pop: 1, cap: "回溯到 A · 栈 = [A]" },
    { pop: 1, cap: "栈空 · DFS 完成，顺序 = <b>A B D C F E</b>（先深后广）" }
  ];
  var BFS_SCRIPT = [
    { v: "A", push: ["B", "C"], cap: "BFS：从 A 出发 · 访问 A，邻居 B、C 入队 · 队列 = [B,C]" },
    { v: "B", push: ["D", "E"], cap: "访问 B，邻居 D、E 入队 · 队列 = [C,D,E]" },
    { v: "C", push: [], cap: "访问 C，邻居都发现了 → 不重入队 · 队列 = [D,E]" },
    { v: "D", push: ["F"], cap: "访问 D，邻居 F 入队 · 队列 = [E,F]" },
    { v: "E", push: [], cap: "访问 E，B 已发现 → 不重入队 · 队列 = [F]" },
    { v: "F", push: [], cap: "访问 F · 队列空 · BFS 完成，顺序 = <b>A B C D E F</b>（一层一层）" }
  ];

  function caption(text) {
    capLen = text.replace(/<[^>]+>/g, "").replace(/\s/g, "").length;
    clearTimeout(caption._t);
    els.caption.style.opacity = "0";
    caption._t = setTimeout(function () {
      els.caption.innerHTML = text;
      els.caption.style.opacity = "1";
    }, 180);
  }

  /* 按字幕字数自适应停顿：中文阅读约 9 字/秒；下限 ACTION_MS，上限 7s */
  function scheduleNext() {
    var dwell = Math.min(Math.max(ACTION_MS, capLen * 110 + 450), 7000);
    timer = setTimeout(function () { step(); scheduleNext(); }, dwell);
  }

  function setMode(m) {
    mode = m;
    els.panelT.textContent = (m === "DFS" ? "DFS · 栈" : "BFS · 队列");
    els.panelT.className = "t" + (m === "BFS" ? " bfs" : "");
    els.hint.textContent = m === "DFS"
      ? "栈：先进后出\n回溯时弹出"
      : "队列：先进先出\n一层一层推进";
    els.hint.style.whiteSpace = "pre-line";
  }

  function structPush(letter) {
    var el = document.createElement("div");
    el.className = "odg-entry in";
    el.dataset.k = letter;
    el.textContent = letter;
    if (mode === "DFS") els.struct.insertBefore(el, els.struct.firstChild);
    else els.struct.appendChild(el);
    setTimeout(function () { el.classList.remove("in"); }, 380);
  }

  function structPop(n) {
    for (var i = 0; i < n; i++) {
      var el = els.struct.firstChild;
      if (!el) break;
      el.classList.add("out");
      (function (node) { setTimeout(function () { node.remove(); }, 300); })(el);
    }
  }

  function structClear() {
    while (els.struct.firstChild) els.struct.removeChild(els.struct.firstChild);
  }

  function markNode(letter, cls) {
    var el = els.nodes[letter];
    el.classList.add("cur");
    setTimeout(function () { el.classList.remove("cur"); }, 700);
    if (cls === "visit") {
      el.classList.add("visited");
      el.classList.remove("queued");
      var p = PARENT[mode][letter];          // 父节点字母（边键与方向无关，两种拼法都查）
      if (p) {
        var line = els.edges[p + letter] || els.edges[letter + p];
        if (line) line.classList.add("used");
      }
    }
  }

  function resetNodes() {
    Object.keys(els.nodes).forEach(function (k) {
      els.nodes[k].classList.remove("visited", "queued", "cur");
    });
    Array.prototype.forEach.call(els.edgeLines, function (l) { l.classList.remove("used"); });
    visited = {};
  }

  function markFrontier(letters) {
    letters.forEach(function (k) {
      if (!visited[k]) els.nodes[k].classList.add("queued");
    });
  }

  function runStep(st) {
    if (st.pop) {
      structPop(st.pop);
      caption(st.cap);
      return;
    }
    // 出队（BFS 队首/BFS 源点除外）+ 访问
    if (mode === "BFS" && st.v !== "A") structPop(1);
    markNode(st.v, "visit");
    visited[st.v] = true;
    st.push.forEach(structPush);
    markFrontier(st.push);
    caption(st.cap);
  }

  function buildScript() {
    actions = [];
    actions.push(function () {
      resetNodes(); structClear(); setMode("DFS");
      caption("<i>DFS 深度优先</i>：一条路走到黑，走不通就回溯——看看栈怎么帮助记住退路");
    });
    DFS_SCRIPT.forEach(function (st) { actions.push(function () { runStep(st); }); });
    actions.push(function () {
      caption("DFS 顺序 <b>A B D C F E</b>——栈里存的是「退路」，访问顺序像钻进一条缝");
    });
    actions.push(function () {
      resetNodes(); structClear(); setMode("BFS");
      caption("<i>BFS 广度优先</i>：先把起点旁边的全扫一遍，再一层一层往外扩");
    });
    BFS_SCRIPT.forEach(function (st) { actions.push(function () { runStep(st); }); });
    actions.push(function () {
      caption("BFS 顺序 <b>A B C D E F</b>——队列先进先出，天然按层扩展，还能量最短路径");
    });
    actions.push(function () {
      caption("同一张图：DFS 靠<b>栈</b>走深，BFS 靠<b>队列</b>铺开——结构不同，形状不同");
    });
    actions.push(function () {
      resetNodes(); structClear(); setMode("DFS");
      caption("磁带倒回，重新开始 DFS 轮");
    });
  }

  function step() {
    if (actIdx >= actions.length) { buildScript(); actIdx = 0; }
    actions[actIdx]();
    actIdx += 1;
    var on = actIdx % 5;
    for (var d =  0; d < els.dots.length; d++) els.dots[d].classList.toggle("on", d === on);
    var shown = actIdx > 99 ? actIdx : ("0" + actIdx).slice(-2);
    els.idx.textContent = shown + " / " + actions.length;
  }

  function svgEl(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function buildHTML() {
    var edgesSvg = '<svg class="odg-edges" viewBox="' + VIEW_BOX + '" preserveAspectRatio="none">';
    EDGES.forEach(function (e) {
      var a = NODES[e[0]], b = NODES[e[1]];
      edgesSvg += '<line data-k="' + e.join("") + '" x1="' + a.x + '" y1="' + a.y +
        '" x2="' + b.x + '" y2="' + b.y + '"/>';
    });
    edgesSvg += "</svg>";
    var nodesHtml = "";
    Object.keys(NODES).forEach(function (k) {
      var p = NODES[k];
      nodesHtml += '<div class="odg-node" data-k="' + k + '" style="left:' + p.x +
        "px;top:" + p.y + 'px">' + k + "</div>";
    });
    var dotsHtml = "";
    for (var d = 0; d < 5; d++) dotsHtml += "<span" + (d === 0 ? ' class="on"' : "") + "></span>";

    return '<div class="odg-stage" data-od-id="stage">' +
      '<div class="odg-grain"></div>' +
      '<div class="odg-topbar" data-od-id="topbar"><span>EP. 10 / 圖遍歷</span>' +
      '<span><span class="odg-dots">' + dotsHtml + '</span>　<span class="odg-idx">00 / 10</span>' +
      '　<span class="odg-rec">● REC</span></span></div>' +
      '<div class="odg-year" data-od-id="year">遍歷<small> DFS 深度優先 · BFS 廣度優先 · 從 A 出發 </small></div>' +
      '<div class="odg-board" data-od-id="sprite">' + edgesSvg + nodesHtml + '</div>' +
      '<div class="odg-panel" data-od-id="panel"><span class="t">DFS · 栈</span>' +
      '<div class="odg-struct"></div><div class="odg-hint">栈：先进后出\n回溯时弹出</div></div>' +
      '<div class="odg-ribbon" data-od-id="ribbon"><div class="odg-ribbon-track">' +
      'DFS 深度優先 · BFS 廣度優先 · 棧 先進後出 · 隊列 先進先出 · 鄰接矩陣 · 鄰接表 · 從 A 出發 · ' +
      'DFS 深度優先 · BFS 廣度優先 · 棧 先進後出 · 隊列 先進先出 · 鄰接矩陣 · 鄰接表 · 從 A 出發 · </div></div>' +
      '<div class="odg-caption" data-od-id="caption">图遍历：DFS 靠栈走深、BFS 靠队列铺开——先看 DFS 轮。</div>' +
      '</div>';
  }

  function mount() {
    var holder = document.getElementById("odg-holder");
    if (!holder || holder.querySelector(".odg-stage")) return;

    /* 布局选择：视口 ≤640px 走移动竖排（小图 + 下方面板）；桌面窄容器 zoom */
    var MOB = window.innerWidth < 640;
    if (MOB) { NODES = NODES_MOBILE; VIEW_BOX = "0 0 260 260"; }

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    holder.innerHTML = buildHTML();

    var st = holder.querySelector(".odg-stage");
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

    els.caption = holder.querySelector(".odg-caption");
    els.idx = holder.querySelector(".odg-idx");
    els.dots = Array.prototype.slice.call(holder.querySelectorAll(".odg-dots span"));
    els.nodes = {};
    Array.prototype.forEach.call(holder.querySelectorAll(".odg-node"), function (n) {
      els.nodes[n.dataset.k] = n;
    });
    els.edgeLines = Array.prototype.slice.call(holder.querySelectorAll(".odg-edges line"));
    els.edges = {};
    els.edgeLines.forEach(function (l) { els.edges[l.dataset.k] = l; });
    els.struct = holder.querySelector(".odg-struct");
    els.panelT = holder.querySelector(".odg-panel .t");
    els.hint = holder.querySelector(".odg-hint");

    buildScript();
    setMode("DFS");

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    setTimeout(function () {
      step();
      scheduleNext();
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
