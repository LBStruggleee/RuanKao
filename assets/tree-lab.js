/* ============================================================
 * tree-lab.js — 二叉树实验室（零依赖，可复用）
 *
 * TreeLab.mount(container, { tree, games: [...] })
 *   tree  : { v:"A", l:{...}, r:{...} }（v 为节点标记）
 *   games : [{ type:"concept", target:"leaves"|"deg2", title:"点出所有叶子" },
 *            { type:"traverse", order:"pre"|"in"|"post"|"level", title:"先序遍历" }]
 *
 * 另暴露 TreeLab.drawTree(container, root, opts) 供哈夫曼等复用：
 *   opts.label(node) 自定义节点文字；opts.height 每层像素。
 * 布局：按中序序号定横坐标、深度定纵坐标（经典二叉树画法）。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  var SVGNS = "http://www.w3.org/2000/svg";

  /* 布局：中序序号 → x，深度 → y */
  function layout(root, levelH) {
    var nodes = [], counter = 0, maxD = 0;
    (function walk(n, d) {
      if (!n) { return; }
      walk(n.l, d + 1);
      n._x = counter++; n._d = d;
      if (d > maxD) { maxD = d; }
      nodes.push(n);
      walk(n.r, d + 1);
    })(root, 0);
    var total = counter || 1;
    var H = (maxD + 1) * levelH;
    nodes.forEach(function (n) {
      n._px = (n._x + 0.5) / total * 100;
      n._py = d2y(n._d, levelH, H);
    });
    return { nodes: nodes, height: H };
  }
  function d2y(d, levelH, H) { return d * levelH + levelH / 2 + 6; }

  /* 通用画树：SVG 连线 + 节点圆钮；返回 value → button 映射 */
  function drawTree(container, root, opts) {
    opts = opts || {};
    var levelH = opts.levelH || 62;
    var L = layout(root, levelH);
    container.textContent = "";
    container.classList.add("tlab-tree");
    container.style.height = L.height + "px";

    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 1000 " + L.height * 10);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.classList.add("tlab-svg");
    container.appendChild(svg);

    var byVal = {};
    L.nodes.forEach(function (n) {
      ["l", "r"].forEach(function (side) {
        var c = n[side];
        if (c) {
          var line = document.createElementNS(SVGNS, "line");
          line.setAttribute("x1", n._px * 10); line.setAttribute("y1", n._py * 10);
          line.setAttribute("x2", c._px * 10); line.setAttribute("y2", c._py * 10);
          line.setAttribute("class", "tlab-edge");
          svg.appendChild(line);
        }
      });
    });
    L.nodes.forEach(function (n) {
      var b = el("button", "tlab-node", opts.label ? opts.label(n) : String(n.v));
      b.style.left = n._px + "%";
      b.style.top = (n._py / L.height * 100) + "%";
      container.appendChild(b);
      if (!byVal[n.v]) { byVal[n.v] = b; }
    });
    return byVal;
  }

  /* 遍历序列 */
  function traverse(root, order) {
    var out = [];
    function pre(n)  { if (!n) { return; } out.push(n.v); pre(n.l); pre(n.r); }
    function mid(n)  { if (!n) { return; } mid(n.l); out.push(n.v); mid(n.r); }
    function post(n) { if (!n) { return; } post(n.l); post(n.r); out.push(n.v); }
    if (order === "pre") { pre(root); }
    else if (order === "in") { mid(root); }
    else if (order === "post") { post(root); }
    else {
      var q = [root];
      while (q.length) {
        var n = q.shift();
        out.push(n.v);
        if (n.l) { q.push(n.l); }
        if (n.r) { q.push(n.r); }
      }
    }
    return out;
  }
  function isLeaf(n) { return n && !n.l && !n.r; }
  function isDeg2(n) { return n && n.l && n.r; }
  function allNodes(root, out) {
    out = out || [];
    if (!root) { return out; }
    out.push(root);
    allNodes(root.l, out); allNodes(root.r, out);
    return out;
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("tree-lab: 容器不存在"); }
    root.classList.add("tlab");

    var tree = cfg.tree;
    var games = cfg.games || [];
    var byVal = drawTree(root, tree, { levelH: cfg.levelH });

    var tabs = el("div", "dsim-tabs no-print");
    root.appendChild(tabs);
    var status = el("div", "dsim-status");
    var stProg = el("span"); status.appendChild(stProg);
    root.appendChild(status);
    var hint = el("div", "dsim-hint");
    root.appendChild(hint);
    var doneBox = el("div", "tlab-done dsim-done");
    root.appendChild(doneBox);

    var cur = null, nextIdx = 0, mistakes = 0;

    function clearMarks() {
      Object.keys(byVal).forEach(function (k) {
        byVal[k].classList.remove("hit", "wrong", "visited");
      });
    }

    function setGame(i) {
      cur = games[i]; nextIdx = 0; mistakes = 0;
      Array.prototype.forEach.call(tabs.children, function (b, bi) {
        b.classList.toggle("active", bi === i);
      });
      clearMarks();
      doneBox.style.display = "none";
      hint.textContent = "";
      var want = cur.type === "traverse" ? traverse(tree, cur.order) : null;
      cur._want = want;
      var ruleText = {
        pre: "先序 = 根 → 左子树 → 右子树",
        in: "中序 = 左子树 → 根 → 右子树",
        post: "后序 = 左子树 → 右子树 → 根",
        level: "层序 = 一层一层从左到右"
      }[cur.order] || "";
      stProg.innerHTML = "<b>" + cur.title + "</b>" + (ruleText ? "　" + ruleText : "");
      renderProg();
    }

    function renderProg() {
      if (cur.type === "traverse") {
        stProg.innerHTML += "　已点 <b>" + nextIdx + " / " + cur._want.length + "</b>";
      } else {
        var targets = allNodes(tree).filter(cur.target === "leaves" ? isLeaf : isDeg2);
        stProg.innerHTML += "　共 <b>" + targets.length + "</b> 个，已点 <b>" + nextIdx + "</b>";
      }
    }

    function nextOf() {
      if (cur.type === "traverse") { return cur._want[nextIdx]; }
      var pool = allNodes(tree).filter(cur.target === "leaves" ? isLeaf : isDeg2)
        .map(function (n) { return n.v; });
      return pool.find(function (v) { return !byVal[v].classList.contains("hit"); });
    }

    Object.keys(byVal).forEach(function (k) {
      byVal[k].addEventListener("click", function () { onNode(k, byVal[k]); });
    });

    function onNode(v, btn) {
      if (!cur) { return; }
      var want = nextOf();
      if (v === want) {
        btn.classList.remove("wrong");
        btn.classList.add(cur.type === "traverse" ? "visited" : "hit");
        nextIdx += 1;
        hint.textContent = "";
        renderProg();
        var total = cur.type === "traverse" ? cur._want.length
          : allNodes(tree).filter(cur.target === "leaves" ? isLeaf : isDeg2).length;
        if (nextIdx >= total) { finish(); }
      } else {
        mistakes += 1;
        btn.classList.add("wrong");
        setTimeout(function () { btn.classList.remove("wrong"); }, 450);
        hint.textContent = wrongHint(v, want);
      }
    }

    function wrongHint(v, want) {
      if (cur.type === "traverse") {
        var rules = {
          pre: "先序：先访问根，再整棵左子树，最后右子树。现在轮到的是【" + want + "】——想一想它是不是当前子树的根/下一个该进入的节点。",
          in: "中序：先挖完左子树才轮到根。现在轮到【" + want + "】。",
          post: "后序：左右都挖完才轮到根。现在轮到【" + want + "】。",
          level: "层序：一层一层从左到右。现在轮到【" + want + "】。"
        };
        return "点错了（" + v + "）。" + (rules[cur.order] || "");
      }
      if (cur.target === "leaves") {
        return "点错了（" + v + "）：它有子节点，不是叶子。叶子 = 左右子树都为空的节点。该点【" + want + "】。";
      }
      return "点错了（" + v + "）：它的度不是 2。度为 2 = 左右子树都有。该点【" + want + "】。";
    }

    function finish() {
      doneBox.style.display = "";
      var line = el("p");
      var seq = cur.type === "traverse" ? cur._want.join(" → ")
        : allNodes(tree).filter(cur.target === "leaves" ? isLeaf : isDeg2).map(function (n) { return n.v; }).join("、");
      line.appendChild(el("span", "total", "完成 ✔ " + (cur.type === "traverse" ? "序列：" + seq : "目标节点：" + seq)));
      doneBox.appendChild(line);
      doneBox.appendChild(el("p", null, mistakes === 0 ? "零失误，这个遍历你已经掌握了。" :
        "错了 " + mistakes + " 次——把上面的规则口诀念一遍再切下一个游戏。"));
    }

    games.forEach(function (g, i) {
      var b = el("button", "dsim-tab", g.title);
      b.addEventListener("click", function () { setGame(i); });
      tabs.appendChild(b);
    });
    if (games.length) { setGame(0); }
  }

  global.TreeLab = { mount: mount, drawTree: drawTree, traverse: traverse };
})(window);
