/* ============================================================
 * pomodoro.js — 右侧番茄钟 · Liquid Glass 胶囊（零依赖，动态注入）
 *
 * 由 sidebar.js 按需动态加载，页面无需单独引用。
 * 设计：iOS 26 Liquid Glass 语言 —— 收起态是贴右缘的半透明胶囊
 * （落在正文右侧留白内，不遮挡内容），点击后 morph 展开为玻璃卡片；
 * 点外部 / Esc 收回。运行中状态点呼吸脉冲，色调随专注/休息切换。
 *
 * - 专注 25 分钟 / 休息 5 分钟，到点提示音并自动切换模式
 * - 计时状态持久化 localStorage（rkPomodoroState）：本站是多页文档集，
 *   跳页/刷新不丢计时；离开期间到点，回来按"完成一次"处理
 * - 今日完成番茄数按天清零
 * ============================================================ */
(function () {
  "use strict";

  if (window.__rkPomodoroLoaded) return;
  window.__rkPomodoroLoaded = true;

  var FOCUS = 25 * 60;
  var BREAK = 5 * 60;
  var KEY = "rkPomodoroState";

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

  var rail = null;
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

  function render() {
    var txt = fmt(remaining());
    els.mini.textContent = txt;
    els.time.textContent = txt;
    els.mode.textContent = state.mode === "focus" ? "专注" : "休息";
    els.mode.className = "pomo-mode " + state.mode;
    els.start.textContent = state.running ? "暂停" : "开始";
    els.done.textContent = "🍅 今日已完成 " + state.done + " 个";
    rail.classList.toggle("running", state.running);
    rail.classList.toggle("break", state.mode === "break");
    if (state.running) {
      if (origTitle === null) origTitle = document.title;
      document.title = "⏱ " + txt + " · " + (state.mode === "focus" ? "专注" : "休息") + "｜" + origTitle;
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

  function collapse() {
    rail.classList.remove("open");
    els.pill.setAttribute("aria-expanded", "false");
  }

  function build() {
    if (document.getElementById("pomodoroRail")) return;
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
      '<div class="pomo-row1"><span class="pomo-mode focus">专注</span><span class="pomo-hint">25 + 5</span></div>' +
      '<div class="pomo-time">25:00</div>' +
      '<div class="pomo-btns">' +
      '<button class="pomo-start" id="pomoStart">开始</button>' +
      '<button class="pomo-reset" id="pomoReset">重置</button>' +
      "</div>" +
      '<div class="pomo-done">🍅 今日已完成 0 个</div>' +
      "</div>";
    document.body.appendChild(rail);

    els.pill = rail.querySelector("#pomoPill");
    els.mini = rail.querySelector(".pomo-mini");
    els.time = rail.querySelector(".pomo-time");
    els.mode = rail.querySelector(".pomo-mode");
    els.start = rail.querySelector("#pomoStart");
    els.done = rail.querySelector(".pomo-done");

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

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") collapse();
    });

    els.start.addEventListener("click", function (e) {
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
    });

    document.getElementById("pomoReset").addEventListener("click", function (e) {
      e.stopPropagation();
      state.mode = "focus";
      state.remain = FOCUS;
      state.running = false;
      saveState();
      render();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
