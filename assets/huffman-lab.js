/* ============================================================
 * huffman-lab.js — 哈夫曼树「预测合并」实验室（零依赖）
 * 依赖：tree-lab.js（复用其画树函数 TreeLab.drawTree），页面需先加载它。
 *
 * HuffmanLab.mount(container, { weights: [2,3,4,5,8] })
 * 玩法：每一步点选当前权值最小的两棵树 → 合并；全合并后自动画出
 *       最终哈夫曼树并推导 WPL（= 所有内部节点权值之和）。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("huffman-lab: 容器不存在"); }
    if (!global.TreeLab) { throw new Error("huffman-lab: 需要先加载 tree-lab.js"); }
    root.classList.add("hlab");

    var weights = (cfg.weights || [2, 3, 4, 5, 8]).slice().sort(function (a, b) { return a - b; });
    var forest = [], selected = [], steps = 0, merges = [], logLines = [];

    var head = el("p", null, "初始叶子权值：" + weights.join("，"));
    root.appendChild(head);

    var chips = el("div", "lab-row hlab-forest");
    root.appendChild(chips);
    var msg = el("p", "lab-msg");
    root.appendChild(msg);
    var btns = el("div", "lab-modes no-print");
    var btnMerge = el("button", "btn", "合并选中的两棵");
    var btnAuto = el("button", "btn ghost", "▶ 自动演示");
    var btnReset = el("button", "btn ghost", "↺ 重置");
    btns.appendChild(btnMerge); btns.appendChild(btnAuto); btns.appendChild(btnReset);
    root.appendChild(btns);
    var log = el("div", "dsim-log");
    root.appendChild(log);
    var doneBox = el("div", "dsim-done");
    doneBox.style.display = "none";
    root.appendChild(doneBox);

    var uid = 0;
    function reset() {
      forest = weights.map(function (w) {
        return { id: ++uid, w: w, leaf: true, children: null };
      });
      selected = []; steps = 0; merges = []; logLines = [];
      log.textContent = "";
      doneBox.style.display = "none";
      msg.textContent = "规则：每一 Step 都取【当前权值最小】的两棵树合并，新树权 = 两权之和。先点两片最小的叶子试试。";
      msg.className = "lab-msg";
      renderChips();
    }

    function twoSmallest() {
      var sorted = forest.slice().sort(function (a, b) { return a.w - b.w; });
      var min = sorted[0].w;
      var mins = forest.filter(function (t) { return t.w === min; });
      var second = forest.filter(function (t) { return t !== sorted[0]; })
        .reduce(function (m, t) { return Math.min(m, t.w); }, Infinity);
      return { first: sorted[0], minW: min, secondW: sorted[1] ? sorted[1].w : null, anyPairOK: mins.length >= 2 };
    }

    function renderChips() {
      chips.textContent = "";
      forest.forEach(function (t) {
        var chip = el("button", "dsim-choice hlab-chip" + (t.leaf ? "" : " hroot"),
          t.leaf ? String(t.w) : t.w + "（" + t.children[0].w + "+" + t.children[1].w + "）");
        if (selected.indexOf(t) >= 0) { chip.classList.add("correct"); }
        if (!t.leaf) { chip.style.borderColor = ""; }
        chip.addEventListener("click", function () { onChip(t, chip); });
        chips.appendChild(chip);
      });
      chips.appendChild(el("span", "lab-null", forest.length > 1
        ? "　还剩 " + forest.length + " 棵树（再合并 " + (forest.length - 1) + " 次）"
        : "　✔ 只剩一棵树了"));
    }

    function onChip(t, chip) {
      if (forest.length === 1) { return; }
      var i = selected.indexOf(t);
      if (i >= 0) {
        selected.splice(i, 1);
        chip.classList.remove("correct");
        return;
      }
      if (selected.length >= 2) {
        setMsg("一次只能选两棵——先取消一个再选。", "badly");
        return;
      }
      selected.push(t);
      chip.classList.add("correct");
      setMsg("已选 " + selected.map(function (x) { return x.w; }).join(" 和 ") +
        (selected.length === 2 ? "，点「合并选中的两棵」。" : "，再选一棵。"));
    }

    function tryMerge() {
      if (forest.length === 1) { setMsg("已经完成啦——下面就是最终哈夫曼树。", ""); return; }
      if (selected.length !== 2) { setMsg("先点选两棵树。", "badly"); return; }
      var a = selected[0], b = selected[1];
      var ts = twoSmallest();
      var okPair = (a.w === ts.minW || a.w === ts.secondW) && (b.w === ts.minW || b.w === ts.secondW) &&
                   (a.w + b.w === ts.minW + ts.secondW);
      if (!okPair) {
        setMsg("哈夫曼是贪心：这一步必须合并当前最小的两个权 " + ts.minW + " 和 " + ts.secondW +
          "。你选的是 " + a.w + " 和 " + b.w + "——取消后重选。", "badly");
        return;
      }
      merge(a, b);
    }

    function merge(a, b) {
      var node = { id: ++uid, w: a.w + b.w, leaf: false, children: [a, b] };
      forest = forest.filter(function (t) { return t !== a && t !== b; });
      forest.push(node);
      selected = [];
      steps += 1;
      var line = "第 " + steps + " 步：取 " + a.w + " + " + b.w + " → 新树权 " + node.w;
      logLines.push(line);
      log.appendChild(el("div", "dsim-log-step", line));
      log.scrollTop = log.scrollHeight;
      renderChips();
      if (forest.length === 1) { finish(); }
      else { setMsg("合好！继续：当前最小的是 " + twoSmallest().minW + " 和 " + twoSmallest().secondW + "。"); }
    }

    function finish() {
      var rootT = forest[0];
      var box = el("div", "hlab-treebox");
      doneBox.textContent = "";
      doneBox.style.display = "";
      doneBox.appendChild(el("p", null, "")).appendChild(el("span", "total", "最终哈夫曼树（圆点上的数字 = 子树权）："));
      global.TreeLab.drawTree(box, rootT, { levelH: 58, label: function (n) { return String(n.w); } });
      doneBox.appendChild(box);

      var internals = [], leaves = [];
      (function walk(n, d) {
        if (!n) { return; }
        if (n.leaf) { leaves.push({ w: n.w, d: d }); }
        else { internals.push(n.w); }
        walk(n.children[0], d + 1); walk(n.children[1], d + 1);
      })(rootT, 0);

      var wpl = internals.reduce(function (s, w) { return s + w; }, 0);
      var wplCheck = leaves.reduce(function (s, l) { return s + l.w * l.d; }, 0);
      var n0 = leaves.length;
      doneBox.appendChild(el("p", null, "合并次数 = " + steps + "（n−1 = " + (n0 - 1) + "）；" +
        "节点总数 = " + (n0 * 2 - 1) + "（哈夫曼树没有度为 1 的节点：n₁ = 0）。"));
      var pl = el("p");
      pl.appendChild(el("span", "total", "WPL = " + wpl));
      pl.appendChild(document.createTextNode("　＝ 内部节点权之和 (" + internals.join("+") + ")" +
        "　双验证：Σ权×深度 = " + leaves.map(function (l) { return l.w + "×" + l.d; }).join(" + ") + " = " + wplCheck +
        (wpl === wplCheck ? " ✓" : " ⚠不一致，请报告")));
      doneBox.appendChild(pl);
      doneBox.appendChild(el("p", null, "编码：左 0 右 1 走到每个叶子——任意编码都不是别人的前缀（前缀码），高频权值路径短 → 压缩。"));
      setMsg("完成！重置可以再走一遍，或直接去做下面的自查题。", "good");
    }

    var autoTimer = null;
    btnMerge.addEventListener("click", function () { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; btnAuto.textContent = "▶ 自动演示"; } tryMerge(); });
    btnAuto.addEventListener("click", function () {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; btnAuto.textContent = "▶ 自动演示"; return; }
      btnAuto.textContent = "⏸ 暂停";
      autoTimer = setInterval(function () {
        if (forest.length === 1) { clearInterval(autoTimer); autoTimer = null; btnAuto.textContent = "▶ 自动演示"; return; }
        var ts = twoSmallest();
        merge(ts.first, forest.filter(function (t) { return t !== ts.first && t.w === ts.secondW; })[0] ||
          forest.filter(function (t) { return t.w === ts.secondW; })[0]);
      }, 900);
    });
    btnReset.addEventListener("click", function () {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; btnAuto.textContent = "▶ 自动演示"; }
      reset();
    });

    function setMsg(text, cls) {
      msg.textContent = text;
      msg.className = "lab-msg" + (cls ? " " + cls : "");
    }

    reset();
  }

  global.HuffmanLab = { mount: mount };
})(window);
