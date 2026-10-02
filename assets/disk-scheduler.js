/* ============================================================
 * disk-scheduler.js — 磁盘调度「预测下一步」训练器（零依赖，可复用）
 *
 * 用法：
 *   <div id="sim"></div>
 *   <script src="../assets/disk-scheduler.js"></script>
 *   <script>
 *     DiskScheduler.mount("sim", {
 *       start: 100, max: 199, direction: "down",   // down = 朝柱面 0 移动
 *       requests: [108,90,88,60,130,40,160,20],
 *       expect:   { "FCFS":476, "SSTF":236, "SCAN":260, "LOOK":220, "C-SCAN":390, "C-LOOK":272 },
 *       takeaways: { "SSTF": "…", "LOOK": "…" },   // 完成后结论（可选）
 *       notes:     { "C-SCAN": "口径提示（可选）" }
 *     });
 *   </script>
 *
 * 口径（与 docs/knowledge-points/os/day03-disk.md §3 一致）：
 *  - SCAN/C-SCAN 走到物理端点；LOOK/C-LOOK 只走到最远请求；
 *  - C-SCAN 回程空跳不计服务但计入距离；平均寻道 = 总距离 ÷ 请求个数。
 * ============================================================ */
(function (global) {
  "use strict";

  var ORD = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫"];
  var ALGOS = ["FCFS", "SSTF", "SCAN", "LOOK", "C-SCAN", "C-LOOK"];

  var DEFAULT_HINTS = {
    "FCFS":   "FCFS 没有预测空间：到达顺序就是服务顺序。",
    "SSTF":   "SSTF：每步从剩余请求里挑【离当前磁头最近】的（不看方向、不看未来）。",
    "SCAN":   "SCAN：沿当前方向（本题朝 0）依次服务，走到【物理端点 0】才折返。",
    "LOOK":   "LOOK：同 SCAN，但走到【该方向最远请求】就折返，不去端点 0。",
    "C-SCAN": "C-SCAN：只朝一个方向服务 → 端点 0 → 空跳回 199（回程不服务、计入距离）→ 继续朝 0 服务。",
    "C-LOOK": "C-LOOK：同 C-SCAN，但跳回的是【最远未服务请求】而不是端点 199。"
  };

  /* ---------- 纯函数：算法计划 ---------- */

  function serviceOrder(algo, cfg) {
    var reqs = cfg.requests.slice();
    var start = cfg.start;
    var below = reqs.filter(function (r) { return r < start; }).sort(function (a, b) { return b - a; }); // 近→远(朝0)
    var above = reqs.filter(function (r) { return r > start; }).sort(function (a, b) { return a - b; }); // 0→max
    var i, best, bd, d;
    switch (algo) {
      case "FCFS":
        return reqs;
      case "SSTF":
        var remaining = reqs.slice(), cur = start, out = [];
        while (remaining.length) {
          best = null; bd = Infinity;
          for (i = 0; i < remaining.length; i++) {
            d = Math.abs(remaining[i] - cur);
            if (d < bd) { bd = d; best = remaining[i]; }
          }
          out.push(best); cur = best;
          remaining.splice(remaining.indexOf(best), 1);
        }
        return out;
      case "SCAN":
      case "LOOK":
        return below.concat(above);
      case "C-SCAN":
      case "C-LOOK":
        return below.concat(above.slice().reverse()); // 跳回后继续朝 0 → 由高到低
    }
    return [];
  }

  /* 把服务顺序展开成「步」，每步含 1~3 个移动段（空走/空跳 + 服务） */
  function buildSteps(algo, cfg) {
    var order = serviceOrder(algo, cfg);
    var max = cfg.max;
    var steps = [], segs, prev = cfg.start;

    function begin() { segs = []; steps.push({ segs: segs }); }
    function seg(from, to, label, serve) {
      segs.push({ from: from, to: to, label: label || null, serve: serve || null, dist: Math.abs(to - from) });
    }

    var below = order.filter(function (r) { return r < cfg.start; });
    var above = order.filter(function (r) { return r > cfg.start; });

    if (algo === "FCFS" || algo === "SSTF") {
      order.forEach(function (r) { begin(); seg(prev, r, null, r); prev = r; });
      return steps;
    }

    // SCAN 家族：先沿初始方向（朝 0）服务 below（近→远）
    below.forEach(function (r) { begin(); seg(prev, r, null, r); prev = r; });
    if (!above.length) { return steps; }

    if (algo === "SCAN") {
      begin();
      seg(prev, 0, "空走到端点 0（该方向已无请求）", null);
      seg(0, above[0], null, above[0]);
      prev = above[0];
      above.slice(1).forEach(function (r) { begin(); seg(prev, r, null, r); prev = r; });
    } else if (algo === "LOOK") {
      above.forEach(function (r) { begin(); seg(prev, r, null, r); prev = r; });
    } else if (algo === "C-SCAN") {
      begin();
      seg(prev, 0, "空走到端点 0（该方向已无请求）", null);
      seg(0, max, "空跳回另一端 " + max + "（回程不服务，但计入距离）", null);
      seg(max, above[0], null, above[0]);
      prev = above[0];
      above.slice(1).forEach(function (r) { begin(); seg(prev, r, null, r); prev = r; });
    } else { // C-LOOK
      begin();
      seg(prev, above[0], "空跳到最远未服务请求 " + above[0] + "（计入距离）", above[0]);
      prev = above[0];
      above.slice(1).forEach(function (r) { begin(); seg(prev, r, null, r); prev = r; });
    }
    return steps;
  }

  function stepTotal(step) {
    return step.segs.reduce(function (s, g) { return s + g.dist; }, 0);
  }

  /* ---------- 视图 ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("disk-scheduler: 容器不存在"); }
    root.classList.add("dsim");

    var hints = Object.assign({}, DEFAULT_HINTS, cfg.hints || {});
    var takeaways = cfg.takeaways || {};
    var notes = cfg.notes || {};
    var state = { algo: "SSTF", stepIdx: 0, cum: 0, done: false, autoplay: null };

    /* --- 顶栏：算法页签 --- */
    var tabs = el("div", "dsim-tabs");
    ALGOS.forEach(function (a) {
      var b = el("button", "dsim-tab", a);
      b.addEventListener("click", function () { setAlgo(a); });
      tabs.appendChild(b);
    });
    root.appendChild(tabs);

    /* --- 轨道 --- */
    var wrap = el("div", "dsim-track-wrap");
    var track = el("div", "dsim-track");
    track.appendChild(el("div", "dsim-rail"));
    var max = cfg.max;
    function pct(pos) { return (pos / max) * 100; }
    for (var t = 0; t <= max; t += 20) {
      var tick = el("div", "dsim-tick");
      tick.style.left = pct(t) + "%";
      track.appendChild(tick);
      if (t % 40 === 0) {
        var lab = el("div", "dsim-tick-label", String(t));
        lab.style.left = pct(t) + "%";
        track.appendChild(lab);
      }
    }
    var pins = {};
    cfg.requests.forEach(function (r) {
      var p = el("div", "dsim-pin", String(r));
      p.style.left = pct(r) + "%";
      pins[r] = p;
      track.appendChild(p);
    });
    var head = el("div", "dsim-head");
    var cap = el("div", "cap", "磁头 " + cfg.start);
    head.appendChild(cap);
    head.appendChild(el("div", "arrow"));
    head.style.left = pct(cfg.start) + "%";
    track.appendChild(head);
    wrap.appendChild(track);
    root.appendChild(wrap);

    /* --- 状态行 --- */
    var status = el("div", "dsim-status");
    var stServed = el("span"); status.appendChild(stServed);
    var stCum = el("span"); status.appendChild(stCum);
    var stPos = el("span"); status.appendChild(stPos);
    root.appendChild(status);

    /* --- 预测区 --- */
    var prompt = el("div", "dsim-prompt");
    root.appendChild(prompt);
    var choices = el("div", "dsim-choices");
    root.appendChild(choices);
    var hint = el("div", "dsim-hint");
    root.appendChild(hint);

    /* --- 日志 + 完成 --- */
    var log = el("div", "dsim-log");
    root.appendChild(log);
    var doneBox = el("div", "dsim-done");
    root.appendChild(doneBox);

    /* --- 操作按钮 --- */
    var actions = el("div", "dsim-actions no-print");
    var btnPlay = el("button", "btn ghost", "▶ 自动演示剩余步骤");
    var btnReset = el("button", "btn ghost", "↺ 重置本算法");
    actions.appendChild(btnPlay);
    actions.appendChild(btnReset);
    root.appendChild(actions);

    function stopAutoplay() {
      if (state.autoplay) { clearInterval(state.autoplay); state.autoplay = null; }
    }

    function setAlgo(a) {
      stopAutoplay();
      state.algo = a;
      state.stepIdx = 0;
      state.cum = 0;
      state.done = false;
      serveCount = 0;
      Array.prototype.forEach.call(tabs.children, function (b) {
        b.classList.toggle("active", b.textContent === a);
      });
      Array.prototype.forEach.call(Object.keys(pins), function (k) {
        var p = pins[k];
        p.classList.remove("served");
        var ord = p.querySelector(".ord");
        if (ord) { ord.remove(); }
      });
      head.style.left = pct(cfg.start) + "%";
      cap.textContent = "磁头 " + cfg.start;
      log.textContent = "";
      doneBox.textContent = "";
      doneBox.style.display = "none";
      hint.textContent = "";
      renderStatus();
      renderPrompt();
    }

    function renderStatus() {
      var served = state.stepIdx;
      stServed.innerHTML = "算法：<b>" + state.algo + "</b>（预测模式）";
      stCum.innerHTML = "已服务：<b>" + served + " / " + cfg.requests.length + "</b>";
      stCum.innerHTML += "　累计寻道：<b>" + state.cum + "</b>";
      var curPos = state.stepIdx === 0 ? cfg.start
        : steps[state.stepIdx - 1].segs[steps[state.stepIdx - 1].segs.length - 1].to;
      stPos.innerHTML = "磁头位置：<b>" + curPos + "</b>";
    }

    var steps = [];        // 当前算法的步计划
    var serveCount = 0;    // 已服务请求总数（含跨算法重置）

    function renderPrompt() {
      steps = buildSteps(state.algo, cfg);
      doneBox.style.display = "none";
      doneBox.textContent = "";
      if (state.done) { return; }
      if (state.algo === "FCFS") {
        prompt.textContent = "FCFS：到达顺序即服务顺序，没有预测空间——点「自动演示」看它有多折腾。";
        renderChoices(null);
        return;
      }
      if (state.stepIdx >= steps.length) { return; }
      prompt.textContent = "下一步磁头会服务哪个请求？（先自己推演，再点选项）";
      var remaining = cfg.requests.filter(function (r) {
        var s = 0;
        for (var i = 0; i < state.stepIdx; i++) {
          var last = steps[i].segs[steps[i].segs.length - 1];
          if (last.serve === r) { s = 1; break; }
        }
        return !s;
      }).sort(function (a, b) { return a - b; });
      renderChoices(remaining);
    }

    function renderChoices(remaining) {
      choices.textContent = "";
      if (!remaining || !remaining.length) { return; }
      remaining.forEach(function (r) {
        var b = el("button", "dsim-choice", String(r));
        b.addEventListener("click", function () { pick(b, r); });
        choices.appendChild(b);
      });
    }

    function pick(btn, r) {
      if (state.done || (state.algo === "FCFS")) { return; }
      var step = steps[state.stepIdx];
      var serveReq = step.segs[step.segs.length - 1].serve;
      if (r === serveReq) {
        btn.classList.add("correct");
        applyStep();
      } else {
        btn.classList.add("wrong");
        setTimeout(function () { btn.classList.remove("wrong"); }, 450);
        hint.textContent = "再想想。" + hints[state.algo];
      }
    }

    function applyStep() {
      var step = steps[state.stepIdx];
      var serveReq = step.segs[step.segs.length - 1].serve;
      var d = stepTotal(step);
      state.cum += d;
      state.stepIdx += 1;

      serveCount += 1;
      var pin = pins[serveReq];
      pin.classList.add("served");
      var ord = el("span", "ord", String(serveCount));
      pin.appendChild(ord);

      // 日志
      var entry = el("div", "dsim-log-step");
      entry.appendChild(el("span", null, "第 " + state.stepIdx + " 步：服务 " + serveReq +
        "　本步 +" + d + "（累计 " + state.cum + "）"));
      step.segs.forEach(function (g) {
        var s = el("span", "seg", g.from + " → " + g.to + "　" +
          (g.label ? "〔" + g.label + "〕" : "") + "　+" + g.dist);
        if (g.label) { s.classList.add("void"); }
        entry.appendChild(s);
      });
      log.appendChild(entry);
      log.scrollTop = log.scrollHeight;

      head.style.left = pct(serveReq) + "%";
      cap.textContent = "磁头 " + serveReq;
      hint.textContent = "";
      renderStatus();
      renderPrompt();
      if (state.stepIdx >= steps.length) { finish(); }
    }

    function finish() {
      state.done = true;
      stopAutoplay();
      prompt.textContent = "全部请求已服务完毕 ✔";
      choices.textContent = "";
      var total = state.cum;
      var avg = (total / cfg.requests.length);
      var avgStr = (Math.round(avg * 100) / 100).toString();
      doneBox.style.display = "";
      var line = el("p");
      line.appendChild(el("span", "total", state.algo + "：总寻道距离 " + total));
      var expect = cfg.expect && cfg.expect[state.algo];
      if (expect !== undefined) {
        line.appendChild(document.createTextNode(expect === total
          ? "　✓ 与教材参考值 " + expect + " 一致"
          : "　⚠ 与教材参考值 " + expect + " 不一致，请报告给老师（ZCode）"));
      }
      doneBox.appendChild(line);
      doneBox.appendChild(el("p", null, "平均寻道距离 = " + total + " ÷ " + cfg.requests.length + " = " + avgStr + "（分母是请求个数，不是移动段数）"));
      if (takeaways[state.algo]) { doneBox.appendChild(el("p", null, takeaways[state.algo])); }
      if (notes[state.algo]) { doneBox.appendChild(el("p", null, "⚠ " + notes[state.algo])); }
    }

    /* --- 自动演示 --- */
    btnPlay.addEventListener("click", function () {
      if (state.done) { return; }
      if (state.autoplay) { stopAutoplay(); btnPlay.textContent = "▶ 自动演示剩余步骤"; return; }
      if (state.algo === "FCFS" && state.stepIdx === 0) { /* FCFS 从头演示 */ }
      btnPlay.textContent = "⏸ 暂停演示";
      state.autoplay = setInterval(function () {
        if (state.done || state.stepIdx >= steps.length) {
          stopAutoplay(); btnPlay.textContent = "▶ 自动演示剩余步骤";
          return;
        }
        applyStep();
      }, 950);
    });
    btnReset.addEventListener("click", function () { setAlgo(state.algo); });

    setAlgo("SSTF");
  }

  global.DiskScheduler = { mount: mount, serviceOrder: serviceOrder, buildSteps: buildSteps };
})(window);
