/* ============================================================
 * pixel-stage.js — 全站像素小剧场（sprite-animation 规范）
 *
 * 把 sprite-animation 的单帧解说语言落到全站每个页面：
 *   - 课程页：EP 顶条（slug + 34 格像素进度点 + ● REC 闪烁）
 *   - 课程页页眉：像素精灵（按学习阶段 10 种）+ 纵排假名浮现
 *   - 所有页面底部：全宽走带字幕（34 课刻度，线性滑动）
 *
 * ≥3 组独立 CSS 循环动画；prefers-reduced-motion 全部暂停。
 * 纯内联，无外部资源。随 sidebar.js 链式加载。
 * ============================================================ */
(function () {
  "use strict";

  if (window.__pxStageLoaded) return;
  window.__pxStageLoaded = true;

  var TOTAL = 34;

  /* 十大学习阶段：序号区间 + 纵排假名（两字）+ 像素精灵 */
  var PHASES = [
    { from: 1,  to: 3,  kana: ["機", "械"], sprite: "chip" },
    { from: 4,  to: 4,  kana: ["言", "語"], sprite: "braces" },
    { from: 5,  to: 14, kana: ["構", "造"], sprite: "tree" },
    { from: 15, to: 20, kana: ["操", "作"], sprite: "frames" },
    { from: 21, to: 23, kana: ["関", "係"], sprite: "cylinder" },
    { from: 24, to: 25, kana: ["通", "信"], sprite: "network" },
    { from: 26, to: 26, kana: ["安", "全"], sprite: "shield" },
    { from: 27, to: 29, kana: ["工", "程"], sprite: "diamond" },
    { from: 30, to: 32, kana: ["抽", "象"], sprite: "hexagon" },
    { from: 33, to: 34, kana: ["実", "戦"], sprite: "sword" }
  ];
  var PHASE_NAMES = [
    "① 组成", "② 程序语言", "③ 数据结构与算法", "④ 操作系统",
    "⑤ 数据库", "⑥ 网络", "⑦ 安全", "⑧ 软件工程", "⑨ 面向对象", "⑩ 保底实战"
  ];

  function phaseOf(n) {
    for (var i = 0; i < PHASES.length; i++) {
      if (n >= PHASES[i].from && n <= PHASES[i].to) {
        return { cfg: PHASES[i], name: PHASE_NAMES[i], idx: i };
      }
    }
    return { cfg: PHASES[0], name: PHASE_NAMES[0], idx: 0 };
  }

  /* 像素精灵：9×10 像素网格，3px/格输出 27×30。
   * fg=currentColor（主色），.pk=墨色（深色模式由 CSS 反转）。 */
  function svg(fg, ink) {
    return '<svg class="px-svg" width="27" height="30" viewBox="0 0 9 10" shape-rendering="crispEdges">'
      + '<g fill="currentColor">' + fg + '</g><g class="pk">' + ink + '</g></svg>';
  }

  var SPRITES = {
    chip: svg(
      '<rect x="2" y="2" width="5" height="5"/>',
      '<rect x="0" y="3" width="2" height="1"/><rect x="7" y="3" width="2" height="1"/>'
      + '<rect x="3" y="0" width="1" height="2"/><rect x="5" y="0" width="1" height="2"/>'
      + '<rect x="3" y="8" width="1" height="2"/><rect x="5" y="8" width="1" height="2"/>'
      + '<rect x="4" y="4" width="1" height="1"/>'),
    braces: svg(
      '<rect x="3" y="0" width="1" height="2"/><rect x="2" y="2" width="1" height="1"/>'
      + '<rect x="3" y="3" width="1" height="3"/><rect x="2" y="6" width="1" height="1"/>'
      + '<rect x="3" y="7" width="1" height="2"/>'
      + '<rect x="5" y="0" width="1" height="2"/><rect x="6" y="2" width="1" height="1"/>'
      + '<rect x="5" y="3" width="1" height="3"/><rect x="6" y="6" width="1" height="1"/>'
      + '<rect x="5" y="7" width="1" height="2"/>', ''),
    tree: svg(
      '<rect x="3" y="0" width="3" height="1"/><rect x="2" y="1" width="5" height="1"/>'
      + '<rect x="1" y="2" width="7" height="2"/>',
      '<rect x="4" y="4" width="1" height="5"/>'
      + '<rect x="3" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/>'),
    frames: svg(
      '<rect x="1" y="1" width="7" height="2"/><rect x="1" y="7" width="7" height="2"/>',
      '<rect x="1" y="4" width="7" height="2"/>'),
    cylinder: svg(
      '<rect x="1" y="2" width="7" height="6"/>',
      '<rect x="1" y="1" width="7" height="1"/>'
      + '<rect x="1" y="4" width="7" height="1"/><rect x="1" y="6" width="7" height="1"/>'),
    network: svg(
      '<rect x="0" y="0" width="3" height="3"/><rect x="6" y="6" width="3" height="3"/>',
      '<rect x="3" y="3" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/>'
      + '<rect x="5" y="5" width="1" height="1"/>'),
    shield: svg(
      '<rect x="1" y="0" width="7" height="5"/><rect x="2" y="5" width="5" height="1"/>'
      + '<rect x="3" y="6" width="3" height="1"/><rect x="4" y="7" width="1" height="2"/>',
      '<rect x="4" y="1" width="1" height="4"/><rect x="2" y="2" width="5" height="1"/>'),
    diamond: svg(
      '<rect x="4" y="0" width="1" height="1"/><rect x="3" y="1" width="3" height="1"/>'
      + '<rect x="2" y="2" width="5" height="1"/><rect x="1" y="3" width="7" height="1"/>'
      + '<rect x="2" y="4" width="5" height="1"/><rect x="3" y="5" width="3" height="1"/>'
      + '<rect x="4" y="6" width="1" height="1"/>',
      '<rect x="4" y="3" width="1" height="1"/>'),
    hexagon: svg(
      '<rect x="3" y="0" width="3" height="1"/><rect x="1" y="1" width="7" height="3"/>'
      + '<rect x="3" y="4" width="3" height="1"/>',
      '<rect x="4" y="2" width="1" height="1"/>'),
    sword: svg(
      '<rect x="4" y="0" width="1" height="6"/>',
      '<rect x="2" y="5" width="5" height="1"/><rect x="4" y="6" width="1" height="4"/>')
  };

  var CSS =
'/* —— EP 顶条 —— */' +
'.px-topbar{display:flex;justify-content:space-between;align-items:center;gap:.8rem;flex-wrap:wrap;' +
'padding:.5rem 0 .55rem;margin-bottom:1.4rem;border-bottom:2px solid var(--px-ink);' +
'font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;color:var(--ink-soft)}' +
'.px-slug{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62%}' +
'.px-slug b{color:var(--ink);font-weight:700}' +
'.px-meta{display:flex;align-items:center;gap:.7rem;flex-shrink:0}' +
'.px-dots{display:inline-flex;align-items:center;gap:2px}' +
'.px-dots i{width:6px;height:8px;background:var(--px-ink);opacity:.85;display:inline-block}' +
'.px-dots i.future{opacity:.18}' +
'.px-dots i.now{background:var(--accent);opacity:1;animation:pxDot 1.2s steps(1) infinite}' +
'@keyframes pxDot{0%,70%{opacity:1}71%,100%{opacity:.3}}' +
'.px-idx{color:var(--ink);font-weight:700}' +
'.px-rec{color:#b3372a;font-weight:700;animation:pxRec 1.2s steps(1) infinite}' +
'html.dark .px-rec{color:#ef7b72}' +
'@keyframes pxRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@media (max-width:720px){.px-dots,.px-rec{display:none}}' +

'/* —— 页眉像素小剧场 —— */' +
'.px-art{position:absolute;top:0;right:0;display:flex;align-items:flex-start;gap:.55rem;z-index:2}' +
'.px-sprite{color:var(--accent);flex-shrink:0;animation:pxBob 1.6s ease-in-out infinite}' +
'.px-svg{display:block;image-rendering:pixelated}' +
'.px-sprite .pk{fill:#26313b}' +
'html.dark .px-sprite .pk{fill:#e8e4da}' +
'@keyframes pxBob{0%,100%{margin-top:0}50%{margin-top:-4px}}' +
'.px-kana{writing-mode:vertical-rl;font-family:var(--serif);font-size:1.1rem;letter-spacing:.4em;' +
'color:var(--ink);line-height:1;padding-top:.1rem}' +
'.px-kana span{opacity:0;animation:pxKana 6.4s ease-in-out infinite}' +
'.px-kana span:nth-child(2){animation-delay:1.6s}' +
'@keyframes pxKana{0%{opacity:0;transform:translateY(-8px)}12%{opacity:1;transform:translateY(0)}' +
'70%{opacity:1}82%{opacity:0;transform:translateY(6px)}100%{opacity:0}}' +
'@media (max-width:640px){.px-kana{display:none}.px-svg{width:21px;height:24px}}' +

'/* —— 全宽走带字幕（直接挂在 body 下，天然通栏，无负边距溢出） —— */' +
'.px-ribbon{width:100%;margin:2.5rem 0 0;' +
'background:var(--ink);border-top:2px solid var(--px-ink);border-bottom:2px solid var(--px-ink);' +
'height:1.8rem;overflow:hidden;position:relative;z-index:901}' +
'.px-ribbon-track{position:absolute;white-space:nowrap;line-height:1.8rem;' +
'color:var(--on-ink);font-family:var(--mono);font-size:.72rem;letter-spacing:.18em;' +
'animation:pxRibbon 34s linear infinite}' +
'.px-ribbon-track b{color:#5cc2a2;font-weight:700}' +
'@keyframes pxRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +

'@media (prefers-reduced-motion: reduce){.px-topbar *,.px-art *,.px-ribbon-track{animation:none !important}}';

  function pad4(n) {
    return "0000".slice(String(n).length) + n;
  }

  function detectLesson() {
    var m = null;
    var k = document.querySelector(".lesson-header .kicker");
    var src = k ? k.textContent : "";
    m = /Lesson\s+0*(\d+)/i.exec(src);
    if (!m) m = /Lesson\s+0*(\d+)/i.exec(document.title || "");
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return (n >= 1 && n <= TOTAL) ? n : 0;
  }

  function buildTopbar(n) {
    var title = "";
    var h1 = document.querySelector(".lesson-header h1");
    if (h1) title = h1.textContent.trim();

    var dots = "";
    for (var i = 1; i <= TOTAL; i++) {
      var cls = i === n ? "now" : (i < n ? "" : "future");
      dots += '<i class="' + cls + '"></i>';
    }

    var el = document.createElement("div");
    el.className = "px-topbar";
    el.setAttribute("data-od-id", "topbar");
    el.innerHTML =
      '<span class="px-slug">EP. ' + pad4(n) + ' / <b>' + title + '</b></span>' +
      '<span class="px-meta"><span class="px-dots">' + dots + '</span>' +
      '<span class="px-idx">' + pad4(n) + ' / ' + TOTAL + '</span>' +
      '<span class="px-rec">● REC</span></span>';
    return el;
  }

  function buildArt(n) {
    var ph = phaseOf(n);
    var el = document.createElement("div");
    el.className = "px-art";
    el.setAttribute("data-od-id", "sprite");
    el.innerHTML =
      '<div class="px-kana" data-od-id="kana"><span>' + ph.cfg.kana[0] +
      '</span><span>' + ph.cfg.kana[1] + '</span></div>' +
      '<div class="px-sprite">' + SPRITES[ph.cfg.sprite] + '</div>';
    return el;
  }

  function buildRibbon() {
    /* 刻度：阶段名 + 课号；有侧栏课表时带上课题，带名刻度更易跳读 */
    var L = window.__rkLessons;
    var ticks = [];
    PHASES.forEach(function (ph, i) {
      ticks.push("<b>" + PHASE_NAMES[i] + "</b>");
      if (L && L.length) {
        L.forEach(function (l) {
          var n = parseInt(l.id, 10);
          if (n >= ph.from && n <= ph.to) ticks.push("EP." + l.id + " " + l.title);
        });
      } else {
        for (var n = ph.from; n <= ph.to; n++) ticks.push("EP." + pad4(n));
      }
    });
    var unit = ticks.join(" · ") + " · ";

    var el = document.createElement("div");
    el.className = "px-ribbon";
    el.setAttribute("data-od-id", "ribbon");
    el.innerHTML = '<div class="px-ribbon-track">' + unit + unit + '</div>';
    return el;
  }

  function mount() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    /* 走带字幕挂到 body 末尾：宽度 100% 天然通栏，
     * 挂在 .page 内则要靠负 margin 突围，Chrome 会把它计入横向滚动区域。 */
    document.body.appendChild(buildRibbon());

    var page = document.querySelector(".page");
    var header = document.querySelector(".lesson-header");
    var num = detectLesson();
    if (num && header && page) {
      page.insertBefore(buildTopbar(num), page.firstChild);
      header.appendChild(buildArt(num));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
