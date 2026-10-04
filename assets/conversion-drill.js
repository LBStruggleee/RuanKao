/* ============================================================
 * conversion-drill.js — 换算训练器（零依赖，可复用）
 *
 * 用法：
 *   <div id="cdrv"></div>
 *   <script src="../assets/conversion-drill.js"></script>
 *   <script> ConversionDrill.mount("cdrv"); </script>
 *
 * 每轮 5 题（各类型一道）：转一圈时间 / 平均旋转延迟 /
 * 时间单位换算 / 二进制单位 / 数轴距离。即时判分 + 完整推导。
 * ============================================================ */
(function (global) {
  "use strict";

  var SPINS = [3600, 5400, 7200, 10000];

  function round2(x) { return Math.round(x * 100) / 100; }
  function circleMs(r) { return round2(60000 / r); }
  function halfMs(r) { return round2(30000 / r); }

  var UNIT_POOL = [
    { t: "1 s = ___ ms", a: 1000, d: "时间单位是千进制：1 s（秒）= 1000 ms（毫秒）。" },
    { t: "1 ms = ___ μs", a: 1000, d: "1 ms（毫秒）= 1000 μs（微秒）。所以 1 s = 1000000 μs。" },
    { t: "3 ms = ___ μs", a: 3000, d: "毫秒 → 微秒乘 1000：3 × 1000 = 3000 μs。" },
    { t: "0.00833 s = ___ ms", a: 8.33, d: "秒 → 毫秒乘 1000：0.00833 × 1000 = 8.33 ms（7200 转/分的转一圈时间）。" },
    { t: "8.33 ms = ___ μs", a: 8330, d: "毫秒 → 微秒乘 1000：8.33 × 1000 = 8330 μs。" },
    { t: "0.00417 s = ___ ms", a: 4.17, d: "0.00417 × 1000 = 4.17 ms（7200 转/分的平均旋转延迟）。" }
  ];
  var BIN_POOL = [
    { t: "1 KB = ___ B", a: 1024, d: "存储单位是二进制：1 KB = 2¹⁰ B = 1024 B（不是 1000）。" },
    { t: "4 KB = ___ B", a: 4096, d: "4 × 1024 = 4096 B。索引计算题里最常用的数字。" },
    { t: "2 KB = ___ B", a: 2048, d: "2 × 1024 = 2048 B。" },
    { t: "1 MB = ___ KB", a: 1024, d: "1 MB = 1024 KB；同理 1 GB = 1024 MB。" },
    { t: "2 MB = ___ KB", a: 2048, d: "2 × 1024 = 2048 KB。" },
    { t: "8 KB = ___ B", a: 8192, d: "8 × 1024 = 8192 B（8 = 2³，所以 8 KB = 2¹³ B）。" }
  ];

  function pick(pool) { return pool[Math.floor(Math.random() * pool.length)]; }

  /* 纯函数：按类型出一题。types: circle / half / unit / binary / dist */
  function makeQuestion(type) {
    var r = SPINS[Math.floor(Math.random() * SPINS.length)];
    switch (type) {
      case "circle":
        return {
          text: "磁盘转速 " + r + " 转/分，转一圈的时间是 ___ ms（保留两位小数）",
          answer: circleMs(r), mode: "round",
          derive: "两步：① 每秒圈数 = " + r + " ÷ 60 = " + round2(r / 60) + " 圈/秒；② 转一圈 = 60 ÷ " + r + " = " + round2(60 / r) + " s，×1000 化成毫秒 = " + circleMs(r) + " ms。"
        };
      case "half":
        return {
          text: "磁盘转速 " + r + " 转/分，平均旋转延迟（按半圈算）是 ___ ms",
          answer: halfMs(r), mode: "round",
          derive: "转一圈 = " + circleMs(r) + " ms；平均按半圈 = " + circleMs(r) + " ÷ 2 = " + halfMs(r) + " ms（目标扇区等概率出现在圆周任意位置，最好不用等、最坏等一圈，平均半圈）。"
        };
      case "unit":
        var u = pick(UNIT_POOL);
        return { text: u.t, answer: u.a, mode: u.m, derive: u.d };
      case "binary":
        var b = pick(BIN_POOL);
        return { text: b.t, answer: b.a, mode: "exact", derive: b.d };
      case "dist":
        var a = Math.floor(Math.random() * 200);
        var c = Math.floor(Math.random() * 200);
        return {
          text: "磁头从柱面 " + a + " 移动到柱面 " + c + "，移动距离是 ___ 个柱面",
          answer: Math.abs(a - c), mode: "exact",
          derive: "柱面号是数轴上的点：距离 = |" + a + " − " + c + "| = " + Math.abs(a - c) + "（方向不影响距离，磁头来回都按绝对差算）。"
        };
    }
    return null;
  }

  function check(user, expected, mode) {
    var d = Math.abs(user - expected);
    if (mode === "precise") { return d <= 0.005; }
    if (mode === "round") { return d <= 0.05; }
    return d <= 0.01;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function mount(container) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("conversion-drill: 容器不存在"); }
    root.classList.add("cdrv");

    var types = ["circle", "half", "unit", "binary", "dist"];
    var idx = 0, score = 0, q = null;
    // 挂载首轮不抢焦点：页面加载中聚焦视口外的输入框会触发浏览器自动滚屏，
    // 导致从别的页面跳进来时落到页面中段。下一题/再来一轮时才聚焦。
    var firstLoad = true;

    var counter = el("p", null, ""); root.appendChild(counter);
    var qText = el("p", "cdrv-q"); root.appendChild(qText);
    var row = el("div", "icap-row");
    var input = el("input");
    input.type = "text"; input.inputMode = "decimal"; input.placeholder = "填数字";
    var btn = el("button", "btn", "提交");
    row.appendChild(input); row.appendChild(btn);
    root.appendChild(row);
    var verdict = el("div", "icap-verdict"); root.appendChild(verdict);
    var derive = el("div", "icap-derive"); root.appendChild(derive);
    var nextBtn = el("button", "btn ghost", "下一题 →");
    nextBtn.style.display = "none";
    root.appendChild(nextBtn);

    function load() {
      q = makeQuestion(types[idx]);
      counter.textContent = "第 " + (idx + 1) + " / 5 题　本轮已得 " + score + " 分";
      qText.textContent = q.text;
      input.value = ""; input.disabled = false;
      verdict.textContent = ""; verdict.className = "icap-verdict";
      derive.classList.remove("show");
      btn.disabled = false; btn.style.display = "";
      nextBtn.style.display = "none";
      if (firstLoad) { firstLoad = false; } else { input.focus(); }
    }

    function submit() {
      var v = parseFloat(input.value.replace(/,/g, ""));
      if (isNaN(v)) {
        verdict.className = "icap-verdict badly";
        verdict.textContent = "请输入一个数字（例如 8.33）。";
        return;
      }
      var ok = check(v, q.answer, q.mode);
      if (ok) { score += 1; }
      input.disabled = true; btn.disabled = true; btn.style.display = "none";
      verdict.className = "icap-verdict " + (ok ? "good" : "badly");
      verdict.textContent = ok ? "✓ 对！" : "✗ 不对。正确答案是 " + q.answer + "。看推导：";
      derive.textContent = q.derive;
      derive.classList.add("show");
      nextBtn.style.display = "";
      nextBtn.focus();
    }

    function next() {
      idx += 1;
      if (idx >= types.length) {
        qText.textContent = "";
        input.style.display = "none"; btn.style.display = "none";
        nextBtn.style.display = "none";
        verdict.className = "icap-verdict " + (score >= 4 ? "good" : "badly");
        verdict.textContent = "本轮 " + score + " / 5。" + (score >= 4 ? "换算这关过了，回 Lesson 0001 试试。" : "再来一轮，直到 4 分以上。");
        var again = el("button", "btn ghost", "↺ 再来一轮");
        again.addEventListener("click", function () {
          idx = 0; score = 0;
          input.style.display = "";
          again.remove();
          load();
        });
        root.appendChild(again);
        return;
      }
      load();
    }

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { submit(); } });
    nextBtn.addEventListener("click", next);

    load();
  }

  global.ConversionDrill = { mount: mount, makeQuestion: makeQuestion, circleMs: circleMs, halfMs: halfMs, check: check };
})(window);
