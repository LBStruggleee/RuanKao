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
 *   - 专注 25 分钟 / 休息 5 分钟，到点提示音并自动切换模式
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

  var state = loadState() || { mode: "focus", running: false, endAt: 0, remain: FOCUS, day: today(), done: 0 };
  if (state.day !== today()) { state.day = today(); state.done = 0; }

  var rail = null, circle = null, modal = null;
  var els = {};
  var origTitle = null;
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

  /* ---------- 渲染 ---------- */

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
    var total = isFocus ? FOCUS : BREAK;
    var frac = total > 0 ? Math.max(0, Math.min(1, remaining() / total)) : 0;
    els.ring.style.strokeDashoffset = (RING_C * (1 - frac)).toFixed(1);

    // 移动端弹窗
    els.mTime.textContent = txt;
    els.mMode.textContent = isFocus ? "专注" : "休息";
    els.mMode.className = "pomo-mode " + state.mode;

    var startTxt = state.running ? "暂停" : "开始";
    els.starts.forEach(function (b) { b.textContent = startTxt; });
    els.dones.forEach(function (d) { d.textContent = "🍅 今日已完成 " + state.done + " 个"; });

    rail.classList.toggle("running", state.running);
    rail.classList.toggle("break", !isFocus);
    circle.classList.toggle("running", state.running);
    circle.classList.toggle("break", !isFocus);

    if (state.running) {
      if (origTitle === null) origTitle = document.title;
      document.title = "⏱ " + txt + " · " + (isFocus ? "专注" : "休息") + "｜" + origTitle;
    } else if (origTitle !== null) {
      document.title = origTitle;
      origTitle = null;
    }
  }

  function finish() {
    // 多标签页兜底：以 localStorage 里较大的已完成数为准，避免覆盖少计
    var fresh = loadState();
    if (fresh && fresh.done > state.done) state.done = fresh.done;

    state.running = false;
    if (state.mode === "focus") {
      state.done += 1;
      state.mode = "break";
      state.remain = BREAK;
    } else {
      state.mode = "focus";
      state.remain = FOCUS;
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
    state.remain = FOCUS;
    state.running = false;
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
      '<span class="pomo-dot"></span>' +
      '<span class="pomo-mini">25:00</span>' +
      '<span class="pomo-chev">▾</span>' +
      "</button>" +
      '<div class="pomo-body">' +
      '<div class="pomo-row1"><span class="pomo-mode focus">专注</span><button class="pomo-theme" data-theme-toggle type="button" aria-label="切换深浅色">🌙</button></div>' +
      '<div class="pomo-time">25:00</div>' +
      '<div class="pomo-btns">' +
      '<button class="pomo-start" type="button">开始</button>' +
      '<button class="pomo-reset" type="button">重置</button>' +
      "</div>" +
      '<div class="pomo-done">🍅 今日已完成 0 个</div>' +
      '<div class="pomo-tip">25 分钟专注 + 5 分钟休息</div>' +
      "</div>";
    document.body.appendChild(rail);

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
      '<button class="pomo-theme" data-theme-toggle type="button" aria-label="切换深浅色">🌙</button>' +
      '<button class="pomo-close" type="button" aria-label="关闭">×</button>' +
      "</span></div>" +
      '<div class="pomo-time">25:00</div>' +
      '<div class="pomo-btns">' +
      '<button class="pomo-start" type="button">开始</button>' +
      '<button class="pomo-reset" type="button">重置</button>' +
      "</div>" +
      '<div class="pomo-done">🍅 今日已完成 0 个</div>' +
      '<div class="pomo-tip">25 分钟专注 + 5 分钟休息</div>' +
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
    els.starts = Array.prototype.slice.call(document.querySelectorAll(".pomo-glass .pomo-start, .pomo-modal .pomo-start"));
    els.dones = Array.prototype.slice.call(document.querySelectorAll(".pomo-glass .pomo-done, .pomo-modal .pomo-done"));

    // 恢复上次计时：仍在跑 → 继续倒计时；离开期间已到点 → 按完成处理
    if (state.running && (state.endAt - Date.now()) / 1000 <= 0) {
      finish();
    }
    render();
    setInterval(tick, 250);

    els.pill.addEventListener("click", function () {
      var open = rail.classList.toggle("open");
      els.pill.setAttribute("aria-expanded", open ? "true" : "false");
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
