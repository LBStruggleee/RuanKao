/* ============================================================
 * graph-lab.js — 图实验室：DFS/BFS 遍历游戏 + Kruskal 选边游戏（零依赖）
 *
 * GraphLab.mount(container, {
 *   vertices: { A:{x:20,y:30}, ... },        // 百分比坐标
 *   edges:    [ {a:"A",b:"B",w:1}, ... ],     // w 可省略（仅 Kruskal 需要）
 *   start:    "A"
 * })
 * 规则口径：邻居按字母序访问；Kruskal 每次取全图最小权边，成环则跳过。
 * ============================================================ */
(function (global) {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("graph-lab: 容器不存在"); }
    root.classList.add("glab");

    var verts = cfg.vertices, edges = cfg.edges, start = cfg.start;
    var labels = Object.keys(verts).sort();

    function neighbors(v) {
      return edges.filter(function (e) { return e.a === v || e.b === v; })
        .map(function (e) { return e.a === v ? e.b : e.a; })
        .sort();
    }

    /* ---- 画布：SVG 边 + 顶点钮 + 边权钮 ---- */
    var plot = el("div", "glab-plot");
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 1000 1000");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.classList.add("tlab-svg");
    plot.appendChild(svg);
    edges.forEach(function (e) {
      var p1 = verts[e.a], p2 = verts[e.b];
      var line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", p1.x * 10); line.setAttribute("y1", p1.y * 10);
      line.setAttribute("x2", p2.x * 10); line.setAttribute("y2", p2.y * 10);
      line.setAttribute("class", "tlab-edge");
      plot.appendChild(line);
    });
    var vBtns = {};
    labels.forEach(function (v) {
      var b = el("button", "glab-v", v);
      b.style.left = verts[v].x + "%";
      b.style.top = verts[v].y + "%";
      plot.appendChild(b);
      vBtns[v] = b;
    });
    var eBtns = {};
    edges.forEach(function (e, i) {
      var mid = { x: (verts[e.a].x + verts[e.b].x) / 2, y: (verts[e.a].y + verts[e.b].y) / 2 };
      var chip = el("button", "glab-e", e.w !== undefined ? String(e.w) : (e.a + e.b));
      chip.style.left = mid.x + "%";
      chip.style.top = mid.y + "%";
      chip.title = e.a + "–" + e.b + (e.w !== undefined ? "，权 " + e.w : "");
      plot.appendChild(chip);
      eBtns[i] = chip;
    });
    root.appendChild(plot);

    /* ---- 游戏框架 ---- */
    var tabs = el("div", "dsim-tabs no-print");
    root.appendChild(tabs);
    var status = el("div", "dsim-status");
    var stProg = el("span"); status.appendChild(stProg);
    root.appendChild(status);
    var hint = el("div", "dsim-hint");
    root.appendChild(hint);
    var doneBox = el("div", "dsim-done");
    doneBox.style.display = "none";
    root.appendChild(doneBox);

    var mode = null;       // "dfs" | "bfs" | "kruskal"
    var order = [], idx = 0, mistakes = 0, chosen = [], rejected = [];

    function traversalSeq(kind) {
      var seen = {}, out = [];
      if (kind === "dfs") {
        (function go(v) {
          seen[v] = true; out.push(v);
          neighbors(v).forEach(function (u) { if (!seen[u]) { go(u); } });
        })(start);
      } else {
        var q = [start]; seen[start] = true;
        while (q.length) {
          var v = q.shift(); out.push(v);
          neighbors(v).forEach(function (u) { if (!seen[u]) { seen[u] = true; q.push(u); } });
        }
      }
      return out;
    }

    function findCycle() { // 并查集：判断 chosen+e 是否成环
      var parent = {};
      labels.forEach(function (v) { parent[v] = v; });
      function find(x) { while (parent[x] !== x) { x = parent[x]; } return x; }
      chosen.forEach(function (i) {
        var e = edges[i];
        var ra = find(e.a), rb = find(e.b);
        if (ra !== rb) { parent[ra] = rb; }
      });
      return function (e) { return find(e.a) === find(e.b); };
    }

    function setMode(m) {
      mode = m; idx = 0; mistakes = 0; chosen = []; rejected = [];
      Array.prototype.forEach.call(tabs.children, function (b, bi) {
        b.classList.toggle("active",
          (m === "dfs" && bi === 0) || (m === "bfs" && bi === 1) || (m === "kruskal" && bi === 2));
      });
      Object.keys(vBtns).forEach(function (k) { vBtns[k].classList.remove("visited", "wrong"); });
      Object.keys(eBtns).forEach(function (k) { eBtns[k].classList.remove("chosen", "rejected"); });
      doneBox.style.display = "none";
      hint.textContent = "";
      order = (m === "kruskal") ? null : traversalSeq(m);
      var names = { dfs: "DFS 深度优先（一条路走到底，走不动回头；邻居按字母序）",
                    bfs: "BFS 广度优先（先访问起点全部邻居，再一层层向外；邻居按字母序）",
                    kruskal: "Kruskal：每次点【当前权值最小的边】；若会造成环就跳过它（点成环边算一次纠错）" };
      stProg.innerHTML = "<b>" + names[m] + "</b>";
      renderProg();
    }

    function renderProg() {
      if (mode === "kruskal") {
        var need = labels.length - 1;
        stProg.innerHTML += "　已选 <b>" + chosen.length + " / " + need + "</b> 条（生成树 = n−1 条边）";
      } else {
        stProg.innerHTML += "　已访问 <b>" + idx + " / " + order.length + "</b>";
      }
    }

    labels.forEach(function (v) {
      vBtns[v].addEventListener("click", function () { onVertex(v); });
    });
    Object.keys(eBtns).forEach(function (k) {
      eBtns[k].addEventListener("click", function () { onEdge(Number(k)); });
    });

    function onVertex(v) {
      if (mode !== "dfs" && mode !== "bfs") { return; }
      var want = order[idx];
      if (v === want) {
        vBtns[v].classList.add("visited");
        idx += 1; hint.textContent = "";
        renderProg();
        if (idx >= order.length) { finishTraversal(); }
      } else {
        mistakes += 1;
        vBtns[v].classList.add("wrong");
        setTimeout(function () { vBtns[v].classList.remove("wrong"); }, 450);
        var rule = mode === "dfs"
          ? "DFS 是一条路走到黑：从当前点沿字母序最小的未访问邻居继续；没有未访问邻居才回头。现在轮到【" + want + "】。"
          : "BFS 是水波纹：先访问起点的全部邻居，再访问邻居的邻居（用队列！）。现在轮到【" + want + "】。";
        hint.textContent = "点错了（" + v + "）。" + rule;
      }
    }

    function onEdge(i) {
      if (mode !== "kruskal") { return; }
      if (chosen.indexOf(i) >= 0 || rejected.indexOf(i) >= 0) { return; }
      var e = edges[i];
      // 必须是未选边中权值最小
      var remaining = edges.map(function (x, xi) { return { x: x, xi: xi }; })
        .filter(function (o) { return chosen.indexOf(o.xi) < 0 && rejected.indexOf(o.xi) < 0; });
      var minW = Math.min.apply(null, remaining.map(function (o) { return o.x.w; }));
      if (e.w !== minW) {
        mistakes += 1;
        hint.textContent = "不是它——Kruskal 每一步选【全图最小】的未选边，现在最小权是 " + minW + "。";
        return;
      }
      var makesCycle = findCycle()(e);
      if (makesCycle) {
        rejected.push(i);
        eBtns[i].classList.add("rejected");
        mistakes += 1;
        hint.textContent = "权 " + e.w + " 确实最小，但选它会把两个已连通的顶点连成一个环（Kruskal 跳过它，看下一条）。";
        renderProg();
        return;
      }
      chosen.push(i);
      eBtns[i].classList.add("chosen");
      hint.textContent = "";
      renderProg();
      if (chosen.length === labels.length - 1) { finishKruskal(); }
    }

    function finishTraversal() {
      doneBox.style.display = "";
      doneBox.textContent = "";
      doneBox.appendChild(el("p", null, "")).appendChild(el("span", "total",
        (mode === "dfs" ? "DFS" : "BFS") + " 序列：" + order.join(" → ")));
      doneBox.appendChild(el("p", null, mistakes === 0
        ? "零失误 ✔ 记住：DFS 用栈/递归，BFS 用队列——Lesson 0002 在这里接上了。"
        : "错了 " + mistakes + " 次。切另一个模式再走一遍。"));
    }

    function finishKruskal() {
      doneBox.style.display = "";
      doneBox.textContent = "";
      var total = chosen.reduce(function (s, i) { return s + edges[i].w; }, 0);
      doneBox.appendChild(el("p", null, "")).appendChild(el("span", "total",
        "最小生成树：(" + chosen.map(function (i) { return edges[i].a + edges[i].b + "=" + edges[i].w; }).join("，") + ")，总权 " + total));
      doneBox.appendChild(el("p", null, "选了 " + chosen.length + " = n−1 条边" +
        (rejected.length ? "，跳过了 " + rejected.length + " 条成环边" : "") +
        "。若所有边权互不相同，最小生成树唯一；Prim 也得到同一棵树（从任一顶点扩展）。"));
    }

    var defs = [
      { m: "dfs", label: "DFS 遍历游戏" },
      { m: "bfs", label: "BFS 遍历游戏" },
      { m: "kruskal", label: "Kruskal 选边游戏" }
    ];
    defs.forEach(function (d, i) {
      var b = el("button", "dsim-tab", d.label);
      b.addEventListener("click", function () { setMode(d.m); });
      tabs.appendChild(b);
    });
    setMode("dfs");
  }

  global.GraphLab = { mount: mount };
})(window);
