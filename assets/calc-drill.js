/* ============================================================
 * calc-drill.js — 通用数值计算训练器（零依赖，可复用）
 *
 * CalcDrill.mount(container, {
 *   title: "……训练",
 *   questions: [
 *     { text: "题干（___ 处填数）", answer: 4, mode: "exact"|"round",
 *       derive: "完整推导（提交后显示）" }, ...
 *   ]
 * })
 * exact：整数/精确值（容差 0.01）；round：保留两位小数（容差 0.5% 级）。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function check(user, expected, mode) {
    var d = Math.abs(user - expected);
    if (mode === "precise") { return d <= 0.005; }
    if (mode === "round") { return d <= 0.05; }
    return d <= 0.01;
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("calc-drill: 容器不存在"); }
    root.classList.add("cdrv");

    var qs = cfg.questions || [];
    var idx = 0, score = 0, q = null;

    var counter = el("p"); root.appendChild(counter);
    var counterText = document.createTextNode("");
    if (cfg.title) { counter.appendChild(el("b", null, cfg.title + "　")); }
    counter.appendChild(counterText);
    var qText = el("p", "cdrv-q");
    root.appendChild(qText);
    var row = el("div", "icap-row");
    var input = el("input");
    input.type = "text"; input.inputMode = "decimal"; input.placeholder = "填数字";
    var btn = el("button", "btn", "提交");
    row.appendChild(input); row.appendChild(btn);
    root.appendChild(row);
    var verdict = el("div", "icap-verdict");
    root.appendChild(verdict);
    var derive = el("div", "icap-derive");
    root.appendChild(derive);
    var nextBtn = el("button", "btn ghost", "下一题 →");
    nextBtn.style.display = "none";
    root.appendChild(nextBtn);

    function load() {
      q = qs[idx];
      counterText.textContent = "第 " + (idx + 1) + " / " + qs.length + " 题　本轮已得 " + score + " 分";
      qText.textContent = q.text;
      input.value = ""; input.disabled = false;
      verdict.textContent = ""; verdict.className = "icap-verdict";
      derive.classList.remove("show");
      btn.disabled = false; btn.style.display = "";
      nextBtn.style.display = "none";
      input.focus();
    }

    function submit() {
      var v = parseFloat(input.value.replace(/,/g, ""));
      if (isNaN(v)) {
        verdict.className = "icap-verdict badly";
        verdict.textContent = "请输入一个数字（例如 7）。";
        return;
      }
      var ok = check(v, q.answer, q.mode);
      if (ok) { score += 1; }
      input.disabled = true; btn.disabled = true; btn.style.display = "none";
      verdict.className = "icap-verdict " + (ok ? "good" : "badly");
      verdict.textContent = ok ? "✓ 对！" : "✗ 不对。正确答案是 " + q.answer + "。看推导：";
      derive.textContent = q.derive;
      derive.classList.add("show");
      nextBtn.style.display = "";
      nextBtn.focus();
    }

    function next() {
      idx += 1;
      if (idx >= qs.length) {
        qText.textContent = "";
        input.style.display = "none"; btn.style.display = "none";
        nextBtn.style.display = "none";
        verdict.className = "icap-verdict " + (score >= Math.ceil(qs.length * 0.8) ? "good" : "badly");
        verdict.textContent = "本轮 " + score + " / " + qs.length + "。" +
          (score >= Math.ceil(qs.length * 0.8) ? "这个计算点过关了。" : "低于 80%，重做一轮直到过关。");
        var again = el("button", "btn ghost", "↺ 再来一轮");
        again.addEventListener("click", function () {
          idx = 0; score = 0;
          input.style.display = "";
          again.remove();
          load();
        });
        root.appendChild(again);
        return;
      }
      load();
    }

    btn.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { submit(); } });
    nextBtn.addEventListener("click", next);

    load();
  }

  global.CalcDrill = { mount: mount, check: check };
})(window);
