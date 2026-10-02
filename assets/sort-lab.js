/* ============================================================
 * sort-lab.js — 排序实验室：冒泡 / 选择 / 插入 步进演示（零依赖）
 *
 * SortLab.mount(container, { array: [5,2,8,3,9,1] })
 * 逐帧展示每一步「比较/移动」，统计比较与移动次数——用眼睛理解
 * 为什么冒泡/选择是 O(n²)、为什么基本有序时插入接近 O(n)。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function buildBubble(src) {
    var a = src.slice(), frames = [], comps = 0, moves = 0;
    function snap(hi, locked, note, done) {
      frames.push({ a: a.slice(), hi: (hi || []).slice(), locked: (locked || []).slice(),
        note: note, comps: comps, moves: moves, done: done });
    }
    snap([], [], "初始序列。", false);
    var n = a.length;
    for (var pass = 0; pass < n - 1; pass++) {
      var swapped = false;
      for (var j = 0; j < n - 1 - pass; j++) {
        comps += 1;
        var willSwap = a[j] > a[j + 1];
        snap([j, j + 1], lockedList(n, pass), "比较 " + a[j] + " 与 " + a[j + 1] +
          (willSwap ? "：前者大 → 交换" : "：顺序对 → 不动"), false);
        if (willSwap) {
          var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
          moves += 1; swapped = true;
          snap([j, j + 1], lockedList(n, pass), "交换后：" + a.join(", "), false);
        }
      }
      snap([], lockedList(n, pass + 1), "第 " + (pass + 1) + " 趟结束：最大值 " + a[n - 1 - pass] + " 已就位" +
        (swapped ? "" : "；本趟没有发生交换 → 序列已有序，冒泡可提前结束！"), false);
      if (!swapped) { break; }
    }
    snap([], a.map(function (_, i) { return i; }), "排序完成。", true);
    return frames;

    function lockedList(len, k) {
      var r = [];
      for (var i = len - k; i < len; i++) { r.push(i); }
      return r;
    }
  }

  function buildSelection(src) {
    var a = src.slice(), frames = [], comps = 0, moves = 0;
    function snap(hi, locked, note, done) {
      frames.push({ a: a.slice(), hi: (hi || []).slice(), locked: (locked || []).slice(),
        note: note, comps: comps, moves: moves, done: done });
    }
    snap([], [], "初始序列。", false);
    var n = a.length;
    for (var i = 0; i < n - 1; i++) {
      var min = i;
      for (var j = i + 1; j < n; j++) {
        comps += 1;
        snap([min, j], range(0, i), "在未排序区找最小：当前最小 " + a[min] + "，与 " + a[j] + " 比较", false);
        if (a[j] < a[min]) { min = j; }
      }
      if (min !== i) {
        var t = a[i]; a[i] = a[min]; a[min] = t;
        moves += 1;
      }
      snap([i], range(0, i + 1), "未排序区最小是 " + a[i] + "，换到位置 " + i + "。已排序区扩一格", false);
    }
    snap([], a.map(function (_, i) { return i; }), "排序完成。", true);
    return frames;
    function range(x, y) { var r = []; for (var k = x; k < y; k++) { r.push(k); } return r; }
  }

  function buildInsertion(src) {
    var a = src.slice(), frames = [], comps = 0, moves = 0;
    function snap(hi, locked, note, done) {
      frames.push({ a: a.slice(), hi: (hi || []).slice(), locked: (locked || []).slice(),
        note: note, comps: comps, moves: moves, done: done });
    }
    snap([0], [0], "第 0 张牌本身有序。", false);
    for (var i = 1; i < a.length; i++) {
      var key = a[i];
      snap([i], range(0, i), "摸起新牌 " + key + "，往左边已排序区找位置（像整理手牌）", false);
      var j = i - 1;
      while (j >= 0 && a[j] > key) {
        comps += 1;
        a[j + 1] = a[j]; moves += 1;
        snap([j, j + 1], range(0, i), a[j] + " > " + key + " → 右移一格", false);
        j -= 1;
      }
      if (j >= 0) { comps += 1; }
      a[j + 1] = key;
      snap([j + 1], range(0, i + 1), key + " 插入位置 " + (j + 1) + "。已排序区扩一格", false);
    }
    snap([], a.map(function (_, i) { return i; }), "排序完成。", true);
    return frames;
    function range(x, y) { var r = []; for (var k = x; k < y; k++) { r.push(k); } return r; }
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("sort-lab: 容器不存在"); }
    root.classList.add("sortlab");

    var src = cfg.array || [5, 2, 8, 3, 9, 1];
    var builders = { "冒泡排序": buildBubble, "选择排序": buildSelection, "插入排序": buildInsertion };
    var names = Object.keys(builders);
    var frames = null, idx = 0, timer = null;

    var tabs = el("div", "dsim-tabs no-print");
    root.appendChild(tabs);
    var row = el("div", "sortlab-row");
    root.appendChild(row);
    var note = el("p", null, "");
    root.appendChild(note);
    var stat = el("p", "sortlab-stat");
    root.appendChild(stat);
    var btns = el("div", "lab-modes no-print");
    var btnStep = el("button", "btn", "下一步 →");
    var btnAuto = el("button", "btn ghost", "▶ 自动播放");
    var btnReset = el("button", "btn ghost", "↺ 重置");
    btns.appendChild(btnStep); btns.appendChild(btnAuto); btns.appendChild(btnReset);
    root.appendChild(btns);

    names.forEach(function (nm, i) {
      var b = el("button", "dsim-tab", nm);
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(tabs.children, function (x, xi) { x.classList.toggle("active", xi === i); });
        setAlgo(nm);
      });
      tabs.appendChild(b);
    });

    function stopAuto() { if (timer) { clearInterval(timer); timer = null; btnAuto.textContent = "▶ 自动播放"; } }
    function setAlgo(nm) {
      stopAuto();
      frames = builders[nm](src);
      idx = 0;
      render();
    }
    function render() {
      var f = frames[idx];
      row.textContent = "";
      f.a.forEach(function (v, i) {
        var c = el("div", "sortlab-cell", String(v));
        if (f.hi.indexOf(i) >= 0) { c.classList.add("hit"); }
        if (f.locked.indexOf(i) >= 0) { c.classList.add("locked"); }
        row.appendChild(c);
      });
      note.textContent = f.note;
      stat.textContent = "比较 " + f.comps + " 次，移动 " + f.moves + " 次　（帧 " + (idx + 1) + "/" + frames.length + "）" +
        (f.done ? "　✔ 完成" : "");
    }
    btnStep.addEventListener("click", function () {
      stopAuto();
      if (idx < frames.length - 1) { idx += 1; render(); }
    });
    btnAuto.addEventListener("click", function () {
      if (timer) { stopAuto(); return; }
      btnAuto.textContent = "⏸ 暂停";
      timer = setInterval(function () {
        if (idx >= frames.length - 1) { stopAuto(); return; }
        idx += 1; render();
      }, 650);
    });
    btnReset.addEventListener("click", function () { stopAuto(); idx = 0; render(); });

    tabs.firstChild.classList.add("active");
    setAlgo(names[0]);
  }

  global.SortLab = { mount: mount };
})(window);
