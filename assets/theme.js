/* ============================================================
 * theme.js — 全站深浅色主题（零依赖）
 *
 * 由 sidebar.js 动态加载。主题类挂在 <html> 上（html.dark），
 * base.css 的 html.dark 变量块驱动全站配色。
 *
 * - 默认跟随系统 prefers-color-scheme
 * - 任意 [data-theme-toggle] 元素点击即切换（侧边栏按钮、番茄钟按钮）
 * - 选择持久化 localStorage（rkTheme），跨页/跨标签页同步
 * - 页面 <head> 里有同逻辑的内联防闪屏（FOUC）脚本，先于渲染生效
 * ============================================================ */
(function () {
  "use strict";

  if (window.__rkThemeLoaded) return;
  window.__rkThemeLoaded = true;

  var KEY = "rkTheme";

  function stored() {
    try {
      var t = localStorage.getItem(KEY);
      return (t === "dark" || t === "light") ? t : null;
    } catch (e) { return null; }
  }
  function systemDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
  function current() {
    return stored() || (systemDark() ? "dark" : "light");
  }
  function apply() {
    var dark = current() === "dark";
    document.documentElement.classList.toggle("dark", dark);
    updateBtns();
  }
  function updateBtns() {
    var dark = current() === "dark";
    var btns = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = dark ? "☀️" : "🌙";
      btns[i].title = dark ? "切换浅色模式" : "切换深色模式";
    }
  }
  function setTheme(t) {
    try { localStorage.setItem(KEY, t === "dark" ? "dark" : "light"); } catch (e) {}
    apply();
  }
  function toggle() {
    setTheme(current() === "dark" ? "light" : "dark");
  }

  window.RkTheme = { current: current, toggle: toggle, set: setTheme };

  apply();

  // 页面右上角常驻主题按钮（所有视口可见，不藏在侧边栏/番茄钟里）
  function buildFab() {
    if (document.getElementById("rkThemeFab")) return;
    var b = document.createElement("button");
    b.className = "rk-theme-fab";
    b.id = "rkThemeFab";
    b.type = "button";
    b.setAttribute("data-theme-toggle", "");
    b.setAttribute("aria-label", "切换深浅色模式");
    document.body.appendChild(b);
    updateBtns();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildFab);
  } else {
    buildFab();
  }

  document.addEventListener("click", function (e) {
    var b = e.target;
    while (b && b !== document.documentElement) {
      if (b.getAttribute && b.getAttribute("data-theme-toggle") !== null) { toggle(); return; }
      b = b.parentNode;
    }
  });

  document.addEventListener("DOMContentLoaded", updateBtns);

  // 未手动选择时跟随系统切换
  if (window.matchMedia) {
    try {
      matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (!stored()) apply();
      });
    } catch (e) {}
  }

  // 其他标签页切换主题时同步
  try {
    window.addEventListener("storage", function (e) {
      if (e.key === KEY) apply();
    });
  } catch (e) {}
})();
