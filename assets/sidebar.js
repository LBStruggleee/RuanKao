/* ============================================================
 * sidebar.js — 全站侧边栏导航（零依赖，动态注入）
 *
 * 每个页面加载时自动在左侧注入侧边栏，包含：
 *   - 网站首页 / 文档目录 / 搜索 / 错题本
 *   - 28 门交互课程（按学习顺序）
 *   - 考试大纲
 *
 * 移动端：默认收起，左上角汉堡按钮展开/收起
 * ============================================================ */
(function () {
  "use strict";

  // 防重复注入：若页面不小心引入两次本脚本，第二个实例直接退出，
  // 否则两套 sidebar/overlay/toggle 互相错位，点 ☰ 会打开已脱离 DOM 的旧侧边栏
  if (window.__rkSidebarLoaded) return;
  window.__rkSidebarLoaded = true;

  var LESSONS = [
    { id: "0000", title: "进制与转换", file: "0000-number-bases.html" },
    { id: "0001", title: "组成计算专题", file: "0001-computer-math.html" },
    { id: "0002", title: "CPU 寻址与流水线", file: "0002-cpu-pipeline.html" },
    { id: "0003", title: "Cache 与总线", file: "0003-cache-bus.html" },
    { id: "0004", title: "程序语言基础", file: "0004-programming-languages.html" },
    { id: "0005", title: "数组与链表", file: "0005-arrays-and-linked-lists.html" },
    { id: "0006", title: "栈与队列", file: "0006-stacks-and-queues.html" },
    { id: "0007", title: "二叉树", file: "0007-binary-tree-basics.html" },
    { id: "0008", title: "遍历与重建", file: "0008-tree-traversals.html" },
    { id: "0009", title: "哈夫曼", file: "0009-huffman.html" },
    { id: "0010", title: "图与遍历", file: "0010-graphs-intro.html" },
    { id: "0011", title: "图四大算法", file: "0011-graph-algorithms.html" },
    { id: "0012", title: "查找", file: "0012-searching.html" },
    { id: "0013", title: "排序", file: "0013-sorting.html" },
    { id: "0014", title: "数据结构补遗", file: "0014-ds-supplement.html" },
    { id: "0015", title: "进程管理", file: "0015-os-process.html" },
    { id: "0016", title: "内存管理", file: "0016-os-memory.html" },
    { id: "0017", title: "磁盘基础", file: "0017-disk-foundation.html" },
    { id: "0018", title: "磁盘调度", file: "0018-disk-scheduling.html" },
    { id: "0019", title: "文件系统", file: "0019-file-system-structures.html" },
    { id: "0020", title: "OS 综合练习", file: "0020-day03-os-exercises.html" },
    { id: "0021", title: "关系代数与 SQL", file: "0021-relational-sql.html" },
    { id: "0022", title: "范式与 E-R", file: "0022-normalization-er.html" },
    { id: "0023", title: "数据库进阶", file: "0023-db-advanced.html" },
    { id: "0024", title: "网络分层", file: "0024-network-layers.html" },
    { id: "0025", title: "TCP 与子网", file: "0025-tcp-subnet.html" },
    { id: "0026", title: "信息安全", file: "0026-security.html" },
    { id: "0027", title: "过程模型与 DFD", file: "0027-process-models.html" },
    { id: "0028", title: "测试与 McCabe", file: "0028-testing.html" },
    { id: "0029", title: "项目管理与质量", file: "0029-pm-quality.html" },
    { id: "0030", title: "面向对象基础", file: "0030-oop-basics.html" },
    { id: "0031", title: "UML", file: "0031-uml.html" },
    { id: "0032", title: "设计模式", file: "0032-design-patterns.html" },
    { id: "0033", title: "保底专项", file: "0033-bonus.html" },
    { id: "0034", title: "算法填空", file: "0034-algo-blanks.html" },
    { id: "0035", title: "算法设计策略", file: "0035-algo-strategies.html" }
  ];

  /* 暴露给 pixel-stage.js 的走带字幕刻度（课号 + 课题，单一来源） */
  window.__rkLessons = LESSONS;

  /* 十大学习阶段（序号区间 = 新手认知顺序） */
  var PHASES = [
    { name: "① 计算机组成", from: 0, to: 3 },
    { name: "② 程序语言", from: 4, to: 4 },
    { name: "③ 数据结构与算法", from: 5, to: 14 },
    { name: "④ 操作系统", from: 15, to: 20 },
    { name: "⑤ 数据库", from: 21, to: 23 },
    { name: "⑥ 计算机网络", from: 24, to: 25 },
    { name: "⑦ 信息安全", from: 26, to: 26 },
    { name: "⑧ 软件工程", from: 27, to: 29 },
    { name: "⑨ 面向对象", from: 30, to: 32 },
    { name: "⑩ 保底与实战", from: 33, to: 35 }
  ];

  function buildSidebar() {
    var path = window.location.pathname;
    var isLesson = path.indexOf("/lessons/") >= 0;
    var isPage = path.indexOf("/pages/") >= 0;
    var isReference = path.indexOf("/reference/") >= 0;
    var currentFile = path.split("/").pop();
    var isRoot = !isLesson && !isPage && !isReference && (currentFile === "index.html" || currentFile === "");

    var html = '<nav class="sidebar" id="sidebar">';
    html += '<div class="sidebar-header">';
    html += '<a href="' + REL_ROOT + 'index.html" class="sidebar-brand">📚 软考备考站</a>';
    html += '<span class="sidebar-actions">';
    html += '<button class="sidebar-close" id="sidebarClose" aria-label="收起侧边栏">×</button>';
    html += '</span>';
    html += '</div>';

    html += '<div class="sidebar-section">';
    html += '<a href="' + REL_ROOT + 'index.html" class="sidebar-link' + (isRoot ? " active" : "") + '">🏠 网站首页</a>';
    html += '<a href="' + REL_ROOT + 'pages/index.html" class="sidebar-link' + (isPage && currentFile === "index.html" ? " active" : "") + '">📖 文档目录</a>';
    html += '<a href="' + REL_ROOT + 'search.html" class="sidebar-link">🔍 全站搜索</a>';
    html += '<a href="' + REL_ROOT + 'reference/mistake-notebook.html" class="sidebar-link' + (isReference && currentFile === "mistake-notebook.html" ? " active" : "") + '">📓 错题本</a>';
    html += '<a href="' + REL_ROOT + 'reference/knowledge-map.html" class="sidebar-link' + (isReference && currentFile === "knowledge-map.html" ? " active" : "") + '">🗺 知识体系</a>';
    html += '<a href="' + REL_ROOT + 'reference/books.html" class="sidebar-link' + (isReference && currentFile === "books.html" ? " active" : "") + '">📚 电子书资源</a>';
    html += '<a href="' + REL_ROOT + 'pages/exam-guide.html" class="sidebar-link">📋 考试大纲</a>';
    html += '</div>';

    html += '<div class="sidebar-section">';
    html += '<div class="sidebar-title">🎓 交互课程 · 十大阶段（序号 = 学习顺序）</div>';
    PHASES.forEach(function (ph) {
      var first = LESSONS.filter(function (l) {
        var n = parseInt(l.id, 10);
        return n >= ph.from && n <= ph.to;
      })[0];
      if (first) {
        html += '<a href="' + REL_ROOT + 'lessons/' + first.file + '" class="sidebar-phase" title="跳到「' + ph.name + '」第一课">' + ph.name + '</a>';
      }
      LESSONS.forEach(function (l) {
        var n = parseInt(l.id, 10);
        if (n < ph.from || n > ph.to) return;
        var active = isLesson && currentFile === l.file ? " active" : "";
        html += '<a href="' + REL_ROOT + 'lessons/' + l.file + '" class="sidebar-link sidebar-lesson' + active + '"><span class="lesson-num">' + l.id + '</span>' + l.title + '</a>';
      });
    });
    html += '</div>';

    html += '</nav>';

    return html;
  }

  /* 根目录相对前缀：由本脚本自身的 src 推导（"../assets/sidebar.js?v=2" → "../"）。
   * 不用 location.pathname 数层数——那会把文件名也当目录层，多跳一级跳出站点。
   * 用 src*= 而非 src$=：缓存破坏参数（?v=N）会让 src 不再以 "sidebar.js" 结尾。 */
  var REL_ROOT = (function () {
    var el = document.querySelector('script[src*="sidebar.js"]');
    var up = el ? (el.getAttribute("src").match(/\.\.\//g) || []).length : 0;
    return new Array(up + 1).join("../");
  })();

  function inject() {
    var existing = document.getElementById("sidebar");
    if (existing) existing.remove();

    var sidebarHtml = buildSidebar();
    var wrapper = document.createElement("div");
    wrapper.innerHTML = sidebarHtml;
    document.body.insertBefore(wrapper.firstChild, document.body.firstChild);

    var overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.id = "sidebarOverlay";
    document.body.appendChild(overlay);

    var toggle = document.createElement("button");
    toggle.className = "sidebar-toggle";
    toggle.id = "sidebarToggle";
    toggle.innerHTML = "☰";
    toggle.setAttribute("aria-label", "展开侧边栏");
    document.body.appendChild(toggle);

    var sidebar = document.getElementById("sidebar");
    var closeBtn = document.getElementById("sidebarClose");
    var overlayEl = document.getElementById("sidebarOverlay");

    function openSidebar() {
      sidebar.classList.add("open");
      overlayEl.classList.add("show");
      document.body.classList.add("sidebar-open");
      try { localStorage.setItem("rkSidebarCollapsed", "0"); } catch (e) {}
    }
    function closeSidebar() {
      sidebar.classList.remove("open");
      overlayEl.classList.remove("show");
      document.body.classList.remove("sidebar-open");
      // 记住收起偏好（仅桌面端收起才算数；移动端本来就默认收起）
      if (window.innerWidth > 1024) {
        try { localStorage.setItem("rkSidebarCollapsed", "1"); } catch (e) {}
      }
    }

    toggle.addEventListener("click", openSidebar);
    closeBtn.addEventListener("click", closeSidebar);
    overlayEl.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSidebar();
    });

    // 桌面端默认展开，但尊重用户上一次的收起偏好；移动端始终收起待展开
    var collapsedPref = null;
    try { collapsedPref = localStorage.getItem("rkSidebarCollapsed"); } catch (e) {}
    if (window.innerWidth > 1024 && collapsedPref !== "1") {
      sidebar.classList.add("open");
      document.body.classList.add("sidebar-open");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }

  // 全站深浅色主题（html.dark，theme.js 自带防重入守卫）
  var themeEl = document.createElement("script");
  themeEl.src = REL_ROOT + "assets/theme.js";
  document.head.appendChild(themeEl);

  // 右侧番茄钟：由本脚本按需动态加载，页面无需单独引用（pomodoro.js 自带防重入守卫）
  // v=11：去掉「本周」统计（无账号体系，每周记录对访客没有参考价值）
  var rail = document.createElement("script");
  rail.src = REL_ROOT + "assets/pomodoro.js?v=13";
  document.head.appendChild(rail);

  // 右下角每日组件：必背考点 + 每日一题（daily.js 自带防重入守卫）
  var daily = document.createElement("script");
  daily.src = REL_ROOT + "assets/daily.js?v=2";
  document.head.appendChild(daily);

  // 全站像素小剧场：EP 顶条 + 页眉精灵/假名 + 底部走带字幕（自带防重入守卫）
  var px = document.createElement("script");
  px.src = REL_ROOT + "assets/pixel-stage.js?v=9";
  document.head.appendChild(px);
})();
