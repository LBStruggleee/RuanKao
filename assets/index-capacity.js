/* ============================================================
 * index-capacity.js — 索引文件容量「先猜后验算」训练器（零依赖，可复用）
 *
 * 用法：
 *   <div id="icap"></div>
 *   <script src="../assets/index-capacity.js"></script>
 *   <script> IndexCapacity.mount("icap"); </script>
 *
 * 考点（docs/knowledge-points/os/day03-disk.md §6）：
 *   索引块项数 = 块大小 ÷ 块号字节数；n 级索引容量 = 项数^n × 块大小。
 * ============================================================ */
(function (global) {
  "use strict";

  var BLOCK_SIZES = [
    { label: "1 KB", bytes: 1024 },
    { label: "2 KB", bytes: 2048 },
    { label: "4 KB", bytes: 4096 },
    { label: "8 KB", bytes: 8192 }
  ];
  var PTR_SIZES = [
    { label: "1 B", bytes: 1 },
    { label: "2 B", bytes: 2 },
    { label: "4 B", bytes: 4 },
    { label: "8 B", bytes: 8 }
  ];
  var LEVELS = [
    { label: "一级索引", n: 1 },
    { label: "二级索引", n: 2 },
    { label: "三级索引", n: 3 }
  ];
  var UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

  function fmt(bytes) {
    var u = 0, v = bytes;
    while (v >= 1024 && u < UNITS.length - 1) { v /= 1024; u += 1; }
    var s = (v === Math.floor(v)) ? String(v) : v.toFixed(v < 10 ? 2 : 1);
    return s + " " + UNITS[u];
  }

  function itemsPer(blockBytes, ptrBytes) { return Math.floor(blockBytes / ptrBytes); }

  function capacity(blockBytes, ptrBytes, level) {
    var items = itemsPer(blockBytes, ptrBytes);
    return Math.pow(items, level) * blockBytes;
  }

  function pow2(n) { // 把数值表示成 2^k（用于推导展示），否则返回 null
    var k = 0, v = n;
    if (v < 1) { return null; }
    while (v > 1) {
      if (v % 2 !== 0) { return null; }
      v /= 2; k += 1;
    }
    return k;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function mount(container) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("index-capacity: 容器不存在"); }
    root.classList.add("icap");

    var selBlock = el("select"), selPtr = el("select"), selLevel = el("select");
    BLOCK_SIZES.forEach(function (o, i) {
      var op = el("option", null, o.label); op.value = i;
      if (o.bytes === 4096) { op.selected = true; }
      selBlock.appendChild(op);
    });
    PTR_SIZES.forEach(function (o) {
      var op = el("option", null, o.label); op.value = PTR_SIZES.indexOf(o);
      if (o.bytes === 4) { op.selected = true; }
      selPtr.appendChild(op);
    });
    LEVELS.forEach(function (o) {
      var op = el("option", null, o.label); op.value = LEVELS.indexOf(o);
      selLevel.appendChild(op);
    });

    var row1 = el("div", "icap-row");
    [[ "盘块大小", selBlock ], [ "块号（指针）字节数", selPtr ], [ "索引级数", selLevel ]].forEach(function (pair) {
      var lab = el("label", null, pair[0] + "：");
      lab.appendChild(pair[1]);
      row1.appendChild(lab);
    });
    root.appendChild(row1);

    var row2 = el("div", "icap-row");
    var btnCheck = el("button", "btn", "选答案（先自己算！）");
    var btnRandom = el("button", "btn ghost", "🎲 随机出一题");
    row2.appendChild(btnCheck);
    row2.appendChild(btnRandom);
    root.appendChild(row2);

    var verdict = el("div", "icap-verdict");
    root.appendChild(verdict);
    var derive = el("div", "icap-derive");
    root.appendChild(derive);

    function params() {
      return {
        block: BLOCK_SIZES[selBlock.value].bytes,
        ptr: PTR_SIZES[selPtr.value].bytes,
        level: LEVELS[selLevel.value].n
      };
    }

    function buildChoices() {
      // 清掉旧按钮组
      var old = root.querySelector(".icap-choices");
      if (old) { old.remove(); }
      var p = params();
      var correct = capacity(p.block, p.ptr, p.level);
      var cands = [correct, correct * 1024, correct / 1024, correct * 2];
      if (cands[1] === correct || cands[1] < p.block) { cands[1] = correct * 4; }
      if (!(cands[2] >= p.block)) { cands[2] = correct / 4; }
      // 去重并格式化
      var seen = {}, opts = [];
      cands.forEach(function (c) {
        var key = fmt(c);
        if (!seen[key] && c >= p.block) { seen[key] = true; opts.push({ v: c, label: key }); }
      });
      // 洗牌
      for (var i = opts.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp;
      }
      var box = el("div", "icap-row icap-choices");
      opts.forEach(function (o) {
        var b = el("button", "dsim-choice", o.label);
        b.addEventListener("click", function () {
          Array.prototype.forEach.call(box.children, function (x) { x.disabled = true; });
          var ok = (o.v === correct);
          b.classList.add(ok ? "correct" : "wrong");
          if (!ok) {
            Array.prototype.forEach.call(box.children, function (x) {
              if (x.textContent === fmt(correct)) { x.classList.add("correct"); }
            });
          }
          verdict.className = "icap-verdict " + (ok ? "good" : "badly");
          verdict.textContent = ok ? "✓ 答对了！推导过程：" : "✗ 答错了。正确答案 " + fmt(correct) + "，推导过程：";
          showDerive(p, correct);
        });
        box.appendChild(b);
      });
      root.insertBefore(box, verdict);
      verdict.textContent = "";
      verdict.className = "icap-verdict";
      derive.classList.remove("show");
    }

    function showDerive(p, correct) {
      var items = itemsPer(p.block, p.ptr);
      var k = pow2(items);
      var lines = [];
      lines.push("① 索引块项数 = 块大小 ÷ 块号字节 = " + p.block + " B ÷ " + p.ptr + " B = " + items +
        (k !== null ? " = 2^" + k + " 项" : " 项"));
      var totalBlocks = Math.pow(items, p.level);
      lines.push("② " + p.level + " 级索引可管理块数 = 项数^" + p.level + " = " + totalBlocks.toLocaleString() + " 块");
      lines.push("③ 最大文件 = " + totalBlocks.toLocaleString() + " × " + fmt(p.block) + " = " + fmt(correct));
      var ck = pow2(totalBlocks);
      if (ck !== null && pow2(p.block) !== null) {
        lines.push("   即 2^" + ck + " 块 × 2^" + pow2(p.block) + " B = 2^" + (ck + pow2(p.block)) + " B");
      }
      derive.textContent = lines.join("\n");
      derive.classList.add("show");
    }

    btnCheck.addEventListener("click", buildChoices);
    btnRandom.addEventListener("click", function () {
      selBlock.value = Math.floor(Math.random() * BLOCK_SIZES.length);
      selPtr.value = Math.floor(Math.random() * PTR_SIZES.length);
      selLevel.value = Math.floor(Math.random() * LEVELS.length);
      buildChoices();
    });

    [selBlock, selPtr, selLevel].forEach(function (s) {
      s.addEventListener("change", function () {
        derive.classList.remove("show");
        verdict.textContent = "";
      });
    });

    buildChoices();
  }

  global.IndexCapacity = { mount: mount, capacity: capacity, fmt: fmt };
})(window);
