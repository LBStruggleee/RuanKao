/* ============================================================
 * page-replacement.js — 页面置换算法模拟器（OPT/FIFO/LRU，零依赖）
 *
 * PageReplacement.mount(container, {
 *   ref: "1,2,3,4,1,2,5,1,2,3,4,5",   // 引用串
 *   frames: 3                          // 物理块数（可切 3/4 演示 Belady）
 * })
 * 口径：OPT 看未来（淘汰最久不再用的页）；FIFO 看进入顺序；
 *      LRU 看过去（淘汰最久未被访问的页）；Clock 是 LRU 近似。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function parseRef(str) {
    return String(str).split(/[,\s]+/).filter(Boolean).map(Number);
  }

  /* 纯函数：返回每步 {page, fault, frames, evicted, note} */
  function simulate(kind, ref, frames) {
    var mem = [], order = [], steps = [], faults = 0, hits = 0;
    ref.forEach(function (page, pos) {
      if (mem.indexOf(page) >= 0) {
        hits += 1;
        if (kind === "LRU") {
          order.splice(order.indexOf(page), 1); order.push(page);
        }
        steps.push({ page: page, fault: false, frames: mem.slice(),
          note: "引用 " + page + "：已在内存 → 命中" + (kind === "LRU" ? "（LRU：刷新为最新）" : "") });
        return;
      }
      faults += 1;
      var evicted = null, note;
      if (mem.length < frames) {
        mem.push(page);
        if (kind === "LRU") { order.push(page); }
        if (kind === "FIFO") { order.push(page); }
        note = "引用 " + page + "：缺页，内存未满 → 直接装入（第 " + faults + " 次缺页）";
      } else if (kind === "FIFO") {
        evicted = order.shift();
        mem.splice(mem.indexOf(evicted), 1);
        mem.push(page); order.push(page);
        note = "引用 " + page + "：缺页 → FIFO 淘汰【最早进入】的 " + evicted + "（第 " + faults + " 次缺页）";
      } else if (kind === "LRU") {
        evicted = order.shift();
        mem.splice(mem.indexOf(evicted), 1);
        mem.push(page); order.push(page);
        note = "引用 " + page + "：缺页 → LRU 淘汰【最久未访问】的 " + evicted + "（第 " + faults + " 次缺页）";
      } else { // OPT：淘汰未来最长时间不再使用的
        var farthest = -1, victim = mem[0];
        mem.forEach(function (p) {
          var nextUse = Infinity;
          for (var j = pos + 1; j < ref.length; j++) {
            if (ref[j] === p) { nextUse = j; break; }
          }
          if (nextUse > farthest) { farthest = nextUse; victim = p; }
        });
        evicted = victim;
        mem.splice(mem.indexOf(victim), 1);
        mem.push(page);
        if (kind === "LRU") { order.push(page); }
        note = "引用 " + page + "：缺页 → OPT 淘汰【未来最久不用】的 " + evicted + "（第 " + faults + " 次缺页）";
      }
      steps.push({ page: page, fault: true, frames: mem.slice(), evicted: evicted, note: note });
    });
    return { steps: steps, faults: faults, hits: hits };
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("page-replacement: 容器不存在"); }
    root.classList.add("pgrep");

    var ref = parseRef(cfg.ref || "1,2,3,4,1,2,5,1,2,3,4,5");
    var framesOpts = cfg.frameOptions || [3, 4];

    var tabs = el("div", "dsim-tabs no-print");
    root.appendChild(tabs);
    var frameSel = el("select");
    framesOpts.forEach(function (f) {
      var op = el("option", null, f + " 个物理块"); op.value = f;
      if (f === (cfg.frames || 3)) { op.selected = true; }
      frameSel.appendChild(op);
    });
    var frameLbl = el("label", null, "物理块数：");
    frameLbl.appendChild(frameSel);
    frameLbl.style.marginLeft = ".6rem";
    tabs.appendChild(frameLbl);

    var pos = el("p", null, "引用串：");
    pos.style.fontFamily = "var(--mono)";
    root.appendChild(pos);
    var stat = el("p", "sortlab-stat", "");
    root.appendChild(stat);
    var grid = el("div", "lab-row");
    root.appendChild(grid);
    var note = el("p", "lab-msg");
    root.appendChild(note);
    var btns = el("div", "lab-modes no-print");
    var btnStep = el("button", "btn", "下一步 →");
    var btnAuto = el("button", "btn ghost", "▶ 自动播放");
    var btnReset = el("button", "btn ghost", "↺ 重置");
    var btnBelady = el("button", "btn ghost", "🧪 Belady 对比（FIFO 3块 vs 4块）");
    btns.appendChild(btnStep); btns.appendChild(btnAuto); btns.appendChild(btnReset); btns.appendChild(btnBelady);
    root.appendChild(btns);
    var beladyBox = el("div", "dsim-done");
    beladyBox.style.display = "none";
    root.appendChild(beladyBox);

    var kind = "FIFO", idx = 0, result = null, timer = null;

    function buildTabs() {
      tabs.textContent = "";
      tabs.appendChild(frameLbl);
      [["FIFO", "FIFO（看进入顺序）"], ["LRU", "LRU（看过去）"], ["OPT", "OPT（看未来·理论最优）"]].forEach(function (o) {
        var b = el("button", "dsim-tab", o[1]);
        if (o[0] === kind) { b.classList.add("active"); }
        b.addEventListener("click", function () { kind = o[0]; restart(); buildTabs(); });
        tabs.appendChild(b);
      });
    }

    function restart() {
      stopAuto();
      result = simulate(kind, ref, Number(frameSel.value));
      idx = 0;
      render();
    }

    function stopAuto() { if (timer) { clearInterval(timer); timer = null; btnAuto.textContent = "▶ 自动播放"; } }

    function render() {
      // 引用串（已处理的标色）
      pos.textContent = "引用串：" + ref.map(function (x, i) {
        return i < idx ? x + "✓" : (i === idx ? "[" + x + "]" : x);
      }).join(" ");
      var st = idx === 0 ? null : result.steps[idx - 1];
      grid.textContent = "";
      var f = Number(frameSel.value);
      for (var i = 0; i < f; i++) {
        var has = st && i < st.frames.length;
        var c = el("div", "lab-cell" + (has ? " visited" : ""), has ? String(st.frames[i]) : "·");
        c.appendChild(el("span", "lab-idx", "块" + i));
        grid.appendChild(c);
      }
      if (st) {
        stat.textContent = "步骤 " + idx + "/" + result.steps.length + "　缺页 " +
          result.steps.slice(0, idx).filter(function (x) { return x.fault; }).length +
          "　命中 " + result.steps.slice(0, idx).filter(function (x) { return !x.fault; }).length +
          (st.evicted !== null && st.evicted !== undefined ? "　淘汰 " + st.evicted : "");
        note.textContent = st.note;
        note.className = "lab-msg" + (st.fault ? " badly" : " good");
      } else {
        stat.textContent = "尚未开始。";
        note.textContent = "点「下一步」逐页看 " + kind + " 怎么决策。";
        note.className = "lab-msg";
      }
    }

    btnStep.addEventListener("click", function () {
      stopAuto();
      if (idx < result.steps.length) { idx += 1; render(); }
    });
    btnAuto.addEventListener("click", function () {
      if (timer) { stopAuto(); return; }
      btnAuto.textContent = "⏸ 暂停";
      timer = setInterval(function () {
        if (idx >= result.steps.length) { stopAuto(); finishNote(); return; }
        idx += 1; render();
        if (idx >= result.steps.length) { stopAuto(); finishNote(); }
      }, 700);
    });
    function finishNote() {
      note.textContent = "完成 ✔ " + kind + " 在 " + frameSel.value + " 个物理块下：缺页 " +
        result.faults + " 次，命中 " + result.hits + " 次。切算法/块数对比。";
    }
    btnReset.addEventListener("click", restart);
    frameSel.addEventListener("change", restart);
    btnBelady.addEventListener("click", function () {
      beladyBox.textContent = "";
      beladyBox.style.display = "";
      beladyBox.appendChild(el("p", null, "")).appendChild(el("span", "total", "Belady 异常实测（同一引用串，FIFO）"));
      var lines = [];
      framesOpts.forEach(function (f) {
        var r = simulate("FIFO", ref, f);
        lines.push(f + " 个物理块 → 缺页 " + r.faults + " 次");
      });
      beladyBox.appendChild(el("p", null, lines.join("；") + "。"));
      beladyBox.appendChild(el("p", null, framesOpts.length >= 2 &&
        simulate("FIFO", ref, framesOpts[1]).faults > simulate("FIFO", ref, framesOpts[0]).faults
        ? "块数变多、缺页反而变多——这就是 Belady 异常。只有 FIFO 会这样（LRU/OPT/Clock 是栈式算法）。"
        : "本串未呈现异常趋势——换引用串试试。"));
    });

    buildTabs();
    restart();
  }

  global.PageReplacement = { mount: mount, simulate: simulate };
})(window);
