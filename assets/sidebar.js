/* ============================================================
 * sidebar.js — 全站侧边栏导航（零依赖，动态注入）
 *
 * 每个页面加载时自动在左侧注入侧边栏，包含：
 *   - 网站首页 / 文档目录 / 搜索 / 错题本
 *   - 28 门交互课程（按学习顺序）
 *   - 打卡表 / 考试大纲
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
    { id: "0001", title: "数组与链表", file: "0001-arrays-and-linked-lists.html" },
    { id: "0002", title: "栈与队列", file: "0002-stacks-and-queues.html" },
    { id: "0003", title: "二叉树：概念与性质", file: "0003-binary-tree-basics.html" },
    { id: "0004", title: "四种遍历与序列重建", file: "0004-tree-traversals.html" },
    { id: "0005", title: "哈夫曼树与编码", file: "0005-huffman.html" },
    { id: "0006", title: "图：概念与遍历", file: "0006-graphs-intro.html" },
    { id: "0007", title: "图四大算法", file: "0007-graph-algorithms.html" },
    { id: "0008", title: "查找：折半与哈希", file: "0008-searching.html" },
    { id: "0009", title: "排序总表", file: "0009-sorting.html" },
    { id: "0010", title: "磁盘基础", file: "0010-disk-foundation.html" },
    { id: "0011", title: "磁盘调度算法", file: "0011-disk-scheduling.html" },
    { id: "0012", title: "文件系统结构", file: "0012-file-system-structures.html" },
    { id: "0013", title: "OS 综合练习", file: "0013-day03-os-exercises.html" },
    { id: "0014", title: "进程与线程", file: "0014-os-process.html" },
    { id: "0015", title: "内存管理", file: "0015-os-memory.html" },
    { id: "0016", title: "网络分层与协议", file: "0016-network-layers.html" },
    { id: "0017", title: "TCP 与子网划分", file: "0017-tcp-subnet.html" },
    { id: "0018", title: "信息安全", file: "0018-security.html" },
    { id: "0019", title: "关系数据库与 SQL", file: "0019-relational-sql.html" },
    { id: "0020", title: "范式与 E-R 图", file: "0020-normalization-er.html" },
    { id: "0021", title: "CPU 与流水线", file: "0021-cpu-pipeline.html" },
    { id: "0022", title: "Cache 与总线", file: "0022-cache-bus.html" },
    { id: "0023", title: "开发过程模型", file: "0023-process-models.html" },
    { id: "0024", title: "软件测试", file: "0024-testing.html" },
    { id: "0025", title: "UML 建模", file: "0025-uml.html" },
    { id: "0026", title: "设计模式", file: "0026-design-patterns.html" },
    { id: "0027", title: "知识产权与标准化", file: "0027-bonus.html" },
    { id: "0028", title: "算法填空专项", file: "0028-algo-blanks.html" }
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
    html += '<button class="sidebar-theme" data-theme-toggle type="button" aria-label="切换深浅色">🌙</button>';
    html += '<button class="sidebar-close" id="sidebarClose" aria-label="收起侧边栏">×</button>';
    html += '</span>';
    html += '</div>';

    html += '<div class="sidebar-section">';
    html += '<a href="' + REL_ROOT + 'index.html" class="sidebar-link' + (isRoot ? " active" : "") + '">🏠 网站首页</a>';
    html += '<a href="' + REL_ROOT + 'pages/index.html" class="sidebar-link' + (isPage && currentFile === "index.html" ? " active" : "") + '">📖 文档目录</a>';
    html += '<a href="' + REL_ROOT + 'search.html" class="sidebar-link">🔍 全站搜索</a>';
    html += '<a href="' + REL_ROOT + 'reference/mistake-notebook.html" class="sidebar-link' + (isReference && currentFile === "mistake-notebook.html" ? " active" : "") + '">📓 错题本</a>';
    html += '<a href="' + REL_ROOT + 'pages/practice/tracker.html" class="sidebar-link">🗓 打卡表</a>';
    html += '<a href="' + REL_ROOT + 'pages/exam-guide.html" class="sidebar-link">📋 考试大纲</a>';
    html += '</div>';

    html += '<div class="sidebar-section">';
    html += '<div class="sidebar-title">🎓 交互课程（按学习顺序）</div>';
    LESSONS.forEach(function (l) {
      var active = isLesson && currentFile === l.file ? " active" : "";
      html += '<a href="' + REL_ROOT + 'lessons/' + l.file + '" class="sidebar-link sidebar-lesson' + active + '"><span class="lesson-num">' + l.id + '</span>' + l.title + '</a>';
    });
    html += '</div>';

    html += '</nav>';

    return html;
  }

  /* 根目录相对前缀：由本脚本自身的 src 推导（"../assets/sidebar.js" → "../"）。
   * 不用 location.pathname 数层数——那会把文件名也当目录层，多跳一级跳出站点。 */
  var REL_ROOT = (function () {
    var el = document.querySelector('script[src$="sidebar.js"]');
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
  // v=5：移动端圆圈可拖拽移动（贴边+位置记忆）
  var rail = document.createElement("script");
  rail.src = REL_ROOT + "assets/pomodoro.js?v=5";
  document.head.appendChild(rail);
})();
