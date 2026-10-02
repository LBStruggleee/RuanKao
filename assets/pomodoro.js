/* ============================================================
 * pomodoro.js — 番茄钟 · Liquid Glass（零依赖，动态注入）
 *
 * 由 sidebar.js 按需动态加载，页面无需单独引用。
 *
 * 形态：
 *   桌面（≥1280px）—— 贴右缘玻璃胶囊，点击 morph 展开为卡片
 *   移动（<1280px）—— 右下角小圆圈：环形进度 + 中央倒计时，
 *                      点开屏幕中央的玻璃弹窗进行操作
 * 配色：绑定站点色板（浅色=暖纸+松绿/旧金），支持深色模式
 *   （默认跟随系统 prefers-color-scheme，可手动切换并记住）
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
  var THEME_KEY = "rkPomodoroTheme";
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

  /* ---------- 主题（浅色/深色） ---------- */

  function systemDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function currentTheme() {
    var t = null;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    return t === "dark" || t === "light" ? t : (systemDark() ? "dark" : "light");
  }
  function applyTheme() {
    var dark = currentTheme() === "dark";
    [rail, circle, els.mcard].forEach(function (el) {
      if (el) el.classList.toggle("pomo-dark", dark);
    });
    els.themeBtns.forEach(function (b) {
      b.textContent = dark ? "☀️" : "🌙";
      b.title = dark ? "切换浅色模式" : "切换深色模式";
    });
  }
  function toggleTheme() {
    try { localStorage.setItem(THEME_KEY, currentTheme() === "dark" ? "light" : "dark"); } catch (e) {}
    applyTheme();
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
      '<div class="pomo-row1"><span class="pomo-mode focus">专注</span><button class="pomo-theme" type="button" aria-label="切换深浅色">🌙</button></div>' +
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
      '<button class="pomo-theme" type="button" aria-label="切换深浅色">🌙</button>' +
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
    els.themeBtns = Array.prototype.slice.call(document.querySelectorAll(".pomo-theme"));

    // 恢复上次计时：仍在跑 → 继续倒计时；离开期间已到点 → 按完成处理
    if (state.running && (state.endAt - Date.now()) / 1000 <= 0) {
      finish();
    }
    applyTheme();
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

    circle.addEventListener("click", openModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();       // 点遮罩关闭
    });
    els.mcard.querySelector(".pomo-close").addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (modal.classList.contains("open")) closeModal();
      else collapse();
    });

    if (window.matchMedia) {
      try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (!storedThemeSet()) applyTheme();
      }); } catch (e) {}
    }

    els.starts.forEach(function (b) { b.addEventListener("click", onStart); });
    Array.prototype.slice.call(document.querySelectorAll(".pomo-glass .pomo-reset, .pomo-modal .pomo-reset"))
      .forEach(function (b) { b.addEventListener("click", onReset); });
    els.themeBtns.forEach(function (b) { b.addEventListener("click", toggleTheme); });
  }

  function storedThemeSet() {
    try { var t = localStorage.getItem(THEME_KEY); return t === "dark" || t === "light"; } catch (e) { return false; }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
