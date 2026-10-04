/* ============================================================
 * pomodoro.js — 番茄钟 · Liquid Glass（零依赖，动态注入）
 *
 * 由 sidebar.js 按需动态加载，页面无需单独引用。
 *
 * 形态：
 *   桌面（≥1280px）—— 贴右缘玻璃胶囊，点击 morph 展开为卡片
 *   移动（<1280px）—— 右下角小圆圈：环形进度 + 中央倒计时，
 *                      点开屏幕中央的玻璃弹窗进行操作
 * 配色：跟随全站主题（assets/theme.js 维护的 html.dark），
 *   浅色=暖纸白玻璃 + 深松绿/旧金，深色由 base.css 的
 *   html.dark .pomo-glass 等选择器整体覆写 --pg-* 变量。
 *
 * 计时：
 *   - 默认专注 25 分钟 / 休息 5 分钟，卡片/弹窗里可 ± 调整（1–120 / 1–60），
 *     到点提示音并自动切换模式
 *   - 不改动标签页标题；窄屏（<1500px）展开时以居中弹窗呈现，不遮挡正文
 *   - 状态持久化 localStorage（rkPomodoroState）：跳页/刷新不丢计时，
 *     离开期间到点按"完成一次"处理
 *   - 今日完成番茄数按天清零
 * ============================================================ */
(function () {
  "use strict";

  if (window.__rkPomodoroLoaded) return;
  window.__rkPomodoroLoaded = true;

  var FOCUS = 25 * 60;
  var BREAK = 5 * 60;
  var KEY = "rkPomodoroState";
  var POS_KEY = "rkPomodoroPos";      // 移动端圆圈拖拽位置
  var LOG_KEY = "rkStudyLog";         // 学习时长记录（分钟级，跨页持久）
  var DEFAULT_GOAL = 120;             // 默认每日目标（分钟）
  var RING_C = 169.6;               // r=27 的圆周长（进度环）

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (e) { return null; }
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = loadState() || { mode: "focus", running: false, endAt: 0, remain: FOCUS, day: today(), done: 0, focusMin: 25, breakMin: 5 };
  if (state.day !== today()) { state.day = today(); state.done = 0; }
  if (!state.focusMin) state.focusMin = 25;
  if (!state.breakMin) state.breakMin = 5;

  /* ---------- 学习时长记录 ---------- */
  function loadLog() {
    try {
      var l = JSON.parse(localStorage.getItem(LOG_KEY) || "null");
      if (l && Array.isArray(l.entries)) return l;
    } catch (e) { /* 损坏记录忽略 */ }
    return { v: 1, goal: DEFAULT_GOAL, entries: [] };
  }
  var log = loadLog();

  function saveLog() {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) {}
  }

  /* 老用户迁移：只有番茄数、没有分钟记录时，按其专注时长估算今日 minutes，
   * 让「今日已完成 N 个」的历史努力不丢失 */
  if (!log.entries.length && state.done > 0) {
    log.entries.push({ d: state.day, m: state.done * (state.focusMin || 25) });
    saveLog();
  }

  /* 日期串与 today() 同格式（不补零），offset 负数为前几天 */
  function dayStr(offset) {
    var d = new Date();
    d.setDate(d.getDate() - offset);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function computeStats() {
    var perDay = {};
    log.entries.forEach(function (e) {
      if (e && typeof e.m === "number" && e.m > 0) perDay[e.d] = (perDay[e.d] || 0) + e.m;
    });
    var t = dayStr(0);
    var todayMin = perDay[t] || 0;
    var allMin = 0;
    for (var k in perDay) allMin += perDay[k];
    /* 连续打卡：今天有记录从今天数，否则从昨天数（白天内不算断签） */
    var off = perDay[t] ? 0 : 1;
    var streak = 0;
    while (perDay[dayStr(off)] && streak < 900) { streak++; off++; }
    return { todayMin: todayMin, allMin: allMin,
             streak: streak, goal: log.goal || DEFAULT_GOAL };
  }

  /* 紧凑时长：<60 分用分钟，否则小时 */
  function fmtMin(m) {
    if (m < 60) return m + "分";
    var h = m / 60;
    return (h % 1 === 0 ? h : h.toFixed(1)) + "h";
  }

  function statsHtml() {
    var s = computeStats();
    var pct = Math.min(100, Math.round(s.todayMin / s.goal * 100));
    var met = s.todayMin >= s.goal;
    return '<div class="pomo-bar-line"><span>🍅 今日 <b>' + state.done +
      '</b> 个 · <b>' + s.todayMin + '</b> 分</span><span>连续 <b>' + s.streak + '</b> 天</span></div>' +
      '<div class="pomo-bar' + (met ? " met" : "") + '"><i style="width:' + pct + '%"></i></div>' +
      '<div class="pomo-bar-line"><span>' + (met
        ? '<b style="color:var(--ok)">✓ 已达标</b>'
        : '目标 <b>' + s.goal + '</b> 分') +
      '</span><span>累计 <b>' + fmtMin(s.allMin) + '</b></span></div>';
  }

  var rail = null, circle = null, modal = null, veil = null;
  var els = {};
  var audioCtx = null;

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function audioWarm() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) { /* 无音频环境忽略 */ }
  }

  function beep() {
    try {
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") audioCtx.resume();
      var t0 = audioCtx.currentTime;
      [0, 0.22, 0.44].forEach(function (off) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, t0 + off);
        g.gain.exponentialRampToValueAtTime(0.18, t0 + off + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.18);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(t0 + off); o.stop(t0 + off + 0.2);
      });
    } catch (e) { /* 静音环境忽略 */ }
  }

  function remaining() {
    if (!state.running) return state.remain;
    return (state.endAt - Date.now()) / 1000;
  }

  function totalSec(mode) {
    var m = mode === "focus" ? state.focusMin : state.breakMin;
    return Math.max(1, Math.round(m)) * 60;
  }

  /* ---------- 渲染 ---------- */

  /* 统计区只在数值变化时重绘，避免 250ms tick 反复重建 DOM 打断进度条过渡 */
  var statsSig = "";
  function renderStats() {
    var sig = state.done + "|" + JSON.stringify(computeStats());
    if (sig === statsSig) return;
    statsSig = sig;
    els.statsBoxes.forEach(function (box) { box.innerHTML = statsHtml(); });
    els.goalVals.forEach(function (b) { b.textContent = log.goal || DEFAULT_GOAL; });
    var s = computeStats();
    if (circle) circle.title = "番茄钟 · 今日已学 " + s.todayMin + " 分钟";
  }

  function render() {
    var txt = fmt(remaining());
    var isFocus = state.mode === "focus";

    // 桌面胶囊 / 展开卡片
    els.mini.textContent = txt;
    els.time.textContent = txt;
    els.mode.textContent = isFocus ? "专注" : "休息";
    els.mode.className = "pomo-mode " + state.mode;

    // 移动端圆圈：中央倒计时 + 环形进度
    els.circ.textContent = txt;
    var total = totalSec(state.mode);
    var frac = total > 0 ? Math.max(0, Math.min(1, remaining() / total)) : 0;
    els.ring.style.strokeDashoffset = (RING_C * (1 - frac)).toFixed(1);

    // 时长设置行
    els.setVals.forEach(function (b) {
      b.textContent = b.getAttribute("data-set-val") === "focus" ? state.focusMin : state.breakMin;
    });

    // 移动端弹窗
    els.mTime.textContent = txt;
    els.mMode.textContent = isFocus ? "专注" : "休息";
    els.mMode.className = "pomo-mode " + state.mode;

    var startTxt = state.running ? "暂停" : "开始";
    els.starts.forEach(function (b) { b.textContent = startTxt; });
    if (els.dones.length) els.dones.forEach(function (d) { d.textContent = "🍅 今日已完成 " + state.done + " 个"; });
    renderStats();

    rail.classList.toggle("running", state.running);
    rail.classList.toggle("break", !isFocus);
    circle.classList.toggle("running", state.running);
    circle.classList.toggle("break", !isFocus);
  }

  function finish() {
    // 多标签页兜底：以 localStorage 里较大的已完成数为准，避免覆盖少计
    var fresh = loadState();
    if (fresh && fresh.done > state.done) state.done = fresh.done;

    state.running = false;
    if (state.mode === "focus") {
      state.done += 1;
      // 入账：一轮完整专注 = 该轮专注时长（分钟，至少 1）
      log.entries.push({ d: today(), m: Math.max(1, Math.round(totalSec("focus") / 60)) });
      if (log.entries.length > 3000) log.entries = log.entries.slice(-2000);
      saveLog();
      state.mode = "break";
      state.remain = totalSec("break");
    } else {
      state.mode = "focus";
      state.remain = totalSec("focus");
    }
    saveState();
    beep();
    render();
  }

  function tick() {
    if (!state.running) return;
    if (remaining() <= 0) { finish(); return; }
    render();
  }

  /* ---------- 交互 ---------- */

  function collapse() {
    rail.classList.remove("open");
    els.pill.setAttribute("aria-expanded", "false");
    if (veil) veil.classList.remove("show");
  }
  function openModal() {
    modal.classList.add("open");
    render();
  }
  function closeModal() {
    modal.classList.remove("open");
  }

  function onStart(e) {
    e.stopPropagation();
    if (state.running) {
      state.remain = Math.max(0, remaining());
      state.running = false;
    } else {
      audioWarm(); // AudioContext 需在用户手势里创建/恢复
      state.endAt = Date.now() + state.remain * 1000;
      state.running = true;
    }
    saveState();
    render();
  }
  function onReset(e) {
    e.stopPropagation();
    state.mode = "focus";
    state.remain = totalSec("focus");
    state.running = false;
    saveState();
    render();
  }

  function onSet(e) {
    var act = e.currentTarget.getAttribute("data-set");
    if (act.indexOf("goal") === 0) {
      var d = act.indexOf("plus") >= 0 ? 10 : -10;
      log.goal = Math.min(480, Math.max(30, (log.goal || DEFAULT_GOAL) + d));
      saveLog();
      render();
      return;
    }
    var isFocus = act.indexOf("focus") === 0;
    var d = act.indexOf("plus") >= 0 ? 1 : -1;
    if (isFocus) {
      state.focusMin = Math.min(120, Math.max(1, state.focusMin + d));
      if (state.mode === "focus" && !state.running) state.remain = totalSec("focus");
    } else {
      state.breakMin = Math.min(60, Math.max(1, state.breakMin + d));
      if (state.mode === "break" && !state.running) state.remain = totalSec("break");
    }
    saveState();
    render();
  }

  /* ---------- 构建 DOM ---------- */

  function build() {
    if (document.getElementById("pomodoroRail")) return;

    // 桌面：贴右缘胶囊 + 展开卡片
    rail = document.createElement("aside");
    rail.className = "pomo-glass";
    rail.id = "pomodoroRail";
    rail.innerHTML =
      '<button class="pomo-pill" id="pomoPill" aria-expanded="false" aria-label="番茄钟：点击展开或收起" title="番茄钟">' +
      '<span class="pomo-dot"><svg class="pomo-svg" width="15" height="17" viewBox="0 0 7 8" shape-rendering="crispEdges">' +
      '<g fill="#2e7d32"><rect x="3" y="0" width="1" height="2"/><rect x="2" y="1" width="1" height="1"/><rect x="4" y="1" width="1" height="1"/></g>' +
      '<rect x="1" y="2" width="5" height="6" fill="#b3372a"/>' +
      '<rect x="2" y="3" width="1" height="1" fill="#e8a08c"/></svg></span>' +
      '<span class="pomo-mini">25:00</span>' +
      '<span class="pomo-chev">▾</span>' +
      "</button>" +
      '<div class="pomo-body">' +
      '<div class="pomo-row1"><span class="pomo-mode focus">专注</span></div>' +
      '<div class="pomo-time">25:00</div>' +
      '<div class="pomo-set">' +
      '<span class="pomo-set-g">专注<button data-set="focus-minus" type="button" aria-label="专注减一分钟">−</button><b data-set-val="focus">25</b><button data-set="focus-plus" type="button" aria-label="专注加一分钟">+</button></span>' +
      '<span class="pomo-set-g">休息<button data-set="break-minus" type="button" aria-label="休息减一分钟">−</button><b data-set-val="break">5</b><button data-set="break-plus" type="button" aria-label="休息加一分钟">+</button></span>' +
      '<span class="pomo-set-g">目标<button data-set="goal-minus" type="button" aria-label="每日目标减十分钟">−</button><b data-goal-val="1">120</b><button data-set="goal-plus" type="button" aria-label="每日目标加十分钟">+</button>分</span>' +
      "</div>" +
      '<div class="pomo-btns">' +
      '<button class="pomo-start" type="button">开始</button>' +
      '<button class="pomo-reset" type="button">重置</button>' +
      "</div>" +
      '<div class="pomo-stats" data-od-id="study-stats"></div>' +
      "</div>";
    document.body.appendChild(rail);

    // 窄屏（<1500px）展开时的遮罩：内容优先，卡片悬浮居中
    veil = document.createElement("div");
    veil.className = "pomo-veil";
    document.body.appendChild(veil);

    // 移动端：右下角小圆圈（环形进度 + 中央倒计时）
    circle = document.createElement("button");
    circle.className = "pomo-circle";
    circle.type = "button";
    circle.setAttribute("aria-label", "打开番茄钟");
    circle.title = "番茄钟";
    circle.innerHTML =
      '<svg class="pomo-ring" viewBox="0 0 60 60" aria-hidden="true">' +
      '<circle class="pomo-ring-bg" cx="30" cy="30" r="27"></circle>' +
      '<circle class="pomo-ring-fg" cx="30" cy="30" r="27" stroke-dasharray="169.6" stroke-dashoffset="0"></circle>' +
      "</svg>" +
      '<span class="pomo-circ-time">25:00</span>';
    document.body.appendChild(circle);

    // 移动端：屏幕中央玻璃弹窗
    modal = document.createElement("div");
    modal.className = "pomo-modal";
    modal.id = "pomodoroModal";
    modal.innerHTML =
      '<div class="pomo-modal-card" role="dialog" aria-label="番茄钟设置">' +
      '<div class="pomo-row1"><span class="pomo-mode focus">专注</span>' +
      '<span class="pomo-mactions">' +
      '<button class="pomo-close" type="button" aria-label="关闭">×</button>' +
      "</span></div>" +
      '<div class="pomo-time">25:00</div>' +
      '<div class="pomo-set">' +
      '<span class="pomo-set-g">专注<button data-set="focus-minus" type="button" aria-label="专注减一分钟">−</button><b data-set-val="focus">25</b><button data-set="focus-plus" type="button" aria-label="专注加一分钟">+</button></span>' +
      '<span class="pomo-set-g">休息<button data-set="break-minus" type="button" aria-label="休息减一分钟">−</button><b data-set-val="break">5</b><button data-set="break-plus" type="button" aria-label="休息加一分钟">+</button></span>' +
      '<span class="pomo-set-g">目标<button data-set="goal-minus" type="button" aria-label="每日目标减十分钟">−</button><b data-goal-val="1">120</b><button data-set="goal-plus" type="button" aria-label="每日目标加十分钟">+</button>分</span>' +
      "</div>" +
      '<div class="pomo-btns">' +
      '<button class="pomo-start" type="button">开始</button>' +
      '<button class="pomo-reset" type="button">重置</button>' +
      "</div>" +
      '<div class="pomo-stats" data-od-id="study-stats-m"></div>' +
      "</div>";
    document.body.appendChild(modal);

    els.pill = rail.querySelector("#pomoPill");
    els.mini = rail.querySelector(".pomo-mini");
    els.time = rail.querySelector(".pomo-time");
    els.mode = rail.querySelector(".pomo-mode");
    els.ring = circle.querySelector(".pomo-ring-fg");
    els.circ = circle.querySelector(".pomo-circ-time");
    els.mcard = modal.querySelector(".pomo-modal-card");
    els.mTime = els.mcard.querySelector(".pomo-time");
    els.mMode = els.mcard.querySelector(".pomo-mode");
    els.setVals = Array.prototype.slice.call(document.querySelectorAll("[data-set-val]"));
    els.starts = Array.prototype.slice.call(document.querySelectorAll(".pomo-glass .pomo-start, .pomo-modal .pomo-start"));
    els.dones = [];   // 已并入统计条首行
    els.statsBoxes = Array.prototype.slice.call(document.querySelectorAll(".pomo-stats"));
    els.goalVals = Array.prototype.slice.call(document.querySelectorAll("[data-goal-val]"));

    // 恢复上次计时：仍在跑 → 继续倒计时；离开期间已到点 → 按完成处理
    if (state.running && (state.endAt - Date.now()) / 1000 <= 0) {
      finish();
    }
    render();
    setInterval(tick, 250);

    els.pill.addEventListener("click", function () {
      var open = rail.classList.toggle("open");
      els.pill.setAttribute("aria-expanded", open ? "true" : "false");
      if (veil) veil.classList.toggle("show", open);
    });

    // 点胶囊外部收回（capture 阶段，先于其他 handler）
    document.addEventListener("click", function (e) {
      if (rail.classList.contains("open") && !rail.contains(e.target)) collapse();
    }, true);

    // —— 拖拽移动（位移超阈值判定为拖拽，否则视为点按打开弹窗） ——
    var dragState = null;
    var suppressClick = false;
    var DRAG_THRESHOLD = 8;

    function clampPos(x, y) {
      var w = circle.offsetWidth, h = circle.offsetHeight;
      var maxX = Math.max(4, window.innerWidth - w - 4);
      var maxY = Math.max(4, window.innerHeight - h - 4);
      return { x: Math.min(Math.max(4, x), maxX), y: Math.min(Math.max(4, y), maxY) };
    }
    function setPos(x, y, animate) {
      var pt = clampPos(x, y);
      circle.style.left = pt.x + "px";
      circle.style.top = pt.y + "px";
      circle.style.right = "auto";
      circle.style.bottom = "auto";
      if (animate) {
        circle.style.transition = "left .25s ease-out, top .25s ease-out";
        setTimeout(function () { circle.style.transition = ""; }, 300);
      }
    }
    function loadPos() {
      try {
        var p = JSON.parse(localStorage.getItem(POS_KEY) || "null");
        if (p && typeof p.x === "number" && typeof p.y === "number") setPos(p.x, p.y);
      } catch (e) {}
    }
    function savePos() {
      try {
        localStorage.setItem(POS_KEY, JSON.stringify({
          x: parseFloat(circle.style.left) || 0,
          y: parseFloat(circle.style.top) || 0
        }));
      } catch (e) {}
    }

    circle.addEventListener("pointerdown", function (e) {
      var r = circle.getBoundingClientRect();
      dragState = { startX: e.clientX, startY: e.clientY, origX: r.left, origY: r.top, moved: false };
      try { circle.setPointerCapture(e.pointerId); } catch (err) {}
    });
    circle.addEventListener("pointermove", function (e) {
      if (!dragState) return;
      var dx = e.clientX - dragState.startX, dy = e.clientY - dragState.startY;
      if (!dragState.moved && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      dragState.moved = true;
      circle.classList.add("dragging");
      setPos(dragState.origX + dx, dragState.origY + dy);
    });
    function endDrag() {
      if (!dragState) return;
      var wasMoved = dragState.moved;
      dragState = null;
      circle.classList.remove("dragging");
      if (!wasMoved) return;
      // 松手贴边：X 吸附较近一侧，Y 原地保留
      var r = circle.getBoundingClientRect();
      var toLeft = (r.left + r.width / 2) < window.innerWidth / 2;
      setPos(toLeft ? 12 : window.innerWidth - r.width - 12, r.top, true);
      savePos();
      suppressClick = true;                 // 本次拖拽不触发弹窗
      setTimeout(function () { suppressClick = false; }, 350);
    }
    circle.addEventListener("pointerup", endDrag);
    circle.addEventListener("pointercancel", endDrag);
    circle.addEventListener("click", function () {
      if (suppressClick) return;
      openModal();
    });
    loadPos();
    window.addEventListener("resize", function () {
      if (circle.style.left) {
        var r = circle.getBoundingClientRect();
        setPos(r.left, r.top);
        savePos();
      }
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();       // 点遮罩关闭
    });
    els.mcard.querySelector(".pomo-close").addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (modal.classList.contains("open")) closeModal();
      else collapse();
    });

    els.starts.forEach(function (b) { b.addEventListener("click", onStart); });
    Array.prototype.slice.call(document.querySelectorAll(".pomo-glass .pomo-reset, .pomo-modal .pomo-reset"))
      .forEach(function (b) { b.addEventListener("click", onReset); });
    Array.prototype.slice.call(document.querySelectorAll("[data-set]"))
      .forEach(function (b) { b.addEventListener("click", onSet); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
