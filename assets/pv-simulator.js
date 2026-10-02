/* ============================================================
 * pv-simulator.js — 生产者-消费者 PV 操作模拟器（零依赖）
 *
 * PVSimulator.mount(container, { bufferSize: 3 })
 *
 * 三个信号量：mutex=1（互斥）、empty=n（空缓冲数）、full=0（满缓冲数）
 * 正确口径：生产者 P(empty)→P(mutex)→放入→V(mutex)→V(full)
 *          消费者 P(full)→P(mutex)→取出→V(mutex)→V(empty)
 * 「资源量 P 在互斥量 P 之前」——错误顺序模式可亲手制造死锁。
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
    if (!root) { throw new Error("pv-simulator: 容器不存在"); }
    root.classList.add("pvsim");

    var N = cfg.bufferSize || 3;
    var sem = { mutex: 1, empty: N, full: 0 };
    var buffer = [];
    var wrongOrder = false;
    var timer = null;

    /* ---- 视图 ---- */
    var modeRow = el("div", "lab-modes no-print");
    var lbl = el("label", null, "顺序模式：");
    var sel = el("select");
    [["right", "正确：先 P 资源量，后 P 互斥量"], ["wrong", "错误：先 P 互斥量（可死锁）"]].forEach(function (o) {
      var op = el("option", null, o[1]); op.value = o[0];
      sel.appendChild(op);
    });
    lbl.appendChild(sel);
    modeRow.appendChild(lbl);
    var btnProd = el("button", "btn", "▶ 生产者执行一轮");
    var btnCons = el("button", "btn", "▶ 消费者执行一轮");
    var btnReset = el("button", "btn ghost", "↺ 重置");
    modeRow.appendChild(btnProd); modeRow.appendChild(btnCons); modeRow.appendChild(btnReset);
    root.appendChild(modeRow);

    var bufRow = el("div", "lab-row");
    root.appendChild(bufRow);
    var semRow = el("div", "lab-row sq-out");
    root.appendChild(semRow);
    var stateLine = el("p", "sq-qstatus");
    root.appendChild(stateLine);
    var msg = el("p", "lab-msg");
    root.appendChild(msg);
    var log = el("div", "dsim-log");
    root.appendChild(log);

    function renderBuf() {
      bufRow.textContent = "";
      bufRow.appendChild(el("span", "lab-null", "缓冲区（" + buffer.length + "/" + N + "）→"));
      for (var i = 0; i < N; i++) {
        var c = el("div", "lab-cell" + (i < buffer.length ? " visited" : ""), i < buffer.length ? "📦" : "·");
        c.appendChild(el("span", "lab-idx", "格" + i));
        bufRow.appendChild(c);
      }
      semRow.textContent = "";
      [["mutex（互斥）", sem.mutex], ["empty（空缓冲）", sem.empty], ["full（满缓冲）", sem.full]].forEach(function (p) {
        semRow.appendChild(el("div", "lab-cell", String(p[1]))).appendChild(el("span", "lab-idx", p[0]));
      });
      var blocked = producerBlocked || consumerBlocked;
      stateLine.textContent = "生产者：" + (producerBlocked ? "【阻塞】" : "就绪") +
        "　消费者：" + (consumerBlocked ? "【阻塞】" : "就绪") +
        (blocked ? "　⚠ 有进程阻塞" : "");
    }

    var producerBlocked = false, consumerBlocked = false;
    var logLines = 0;

    function stepLog(text, warn) {
      logLines += 1;
      var d = el("div", "dsim-log-step" + (warn ? " void" : ""), logLines + ". " + text);
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }

    function doP(semName, who, onFail) {
      sem[semName] -= 1;
      if (sem[semName] < 0) {
        stepLog(who + " 执行 P(" + semName + ")：" + semName + " = " + sem[semName] + " < 0 → 【阻塞】", true);
        if (who === "生产者") { producerBlocked = true; } else { consumerBlocked = true; }
        return false;
      }
      stepLog(who + " 执行 P(" + semName + ")：" + semName + " = " + sem[semName] + " → 通过");
      return true;
    }
    function doV(semName, who) {
      sem[semName] += 1;
      stepLog(who + " 执行 V(" + semName + ")：" + semName + " = " + sem[semName]);
      return true;
    }

    function producerRound(done) {
      var seq = wrongOrder
        ? [function () { return doP("mutex", "生产者"); },
           function () { return doP("empty", "生产者"); },
           function () { buffer.push("📦"); stepLog("生产者放入一个产品（缓冲区 " + buffer.length + "/" + N + "）"); return true; },
           function () { return doV("mutex", "生产者"); },
           function () { return doV("full", "生产者"); }]
        : [function () { return doP("empty", "生产者"); },
           function () { return doP("mutex", "生产者"); },
           function () { buffer.push("📦"); stepLog("生产者放入一个产品（缓冲区 " + buffer.length + "/" + N + "）"); return true; },
           function () { return doV("mutex", "生产者"); },
           function () { return doV("full", "生产者"); }];
      runSeq(seq, btnProd, done);
    }

    function consumerRound(done) {
      var seq = [
        function () { return doP("full", "消费者"); },
        function () { return doP("mutex", "消费者"); },
        function () { buffer.pop(); stepLog("消费者取走一个产品（缓冲区 " + buffer.length + "/" + N + "）"); return true; },
        function () { return doV("mutex", "消费者"); },
        function () { return doV("empty", "消费者"); }
      ];
      runSeq(seq, btnCons, done);
    }

    function runSeq(seq, btn, done) {
      var i = 0;
      btn.disabled = true;
      var t = setInterval(function () {
        if (i >= seq.length) {
          clearInterval(t); btn.disabled = false;
          renderBuf();
          if (producerBlocked && consumerBlocked) {
            setMsg("💀 死锁发生：生产者握着 mutex 等 empty，消费者（或后继操作）等 mutex——互相等待，永不前进。" +
              "这就是『资源量 P 必须在互斥量 P 之前』的原因。点「重置」重来。", "badly");
            if (done) { done(); }
            return;
          }
          renderBuf();
          if (done) { done(); }
          return;
        }
        var ok = seq[i]();
        i += 1;
        renderBuf();
        if (!ok) {
          clearInterval(t); btn.disabled = false;
          renderBuf();
          if (done) { done(); }
          return;
        }
      }, 650);
    }

    function setMsg(text, cls) {
      msg.textContent = text;
      msg.className = "lab-msg" + (cls ? " " + cls : "");
    }

    function reset() {
      if (timer) { clearInterval(timer); }
      sem = { mutex: 1, empty: N, full: 0 };
      buffer = []; producerBlocked = false; consumerBlocked = false; logLines = 0;
      log.textContent = "";
      btnProd.disabled = false; btnCons.disabled = false;
      setMsg(wrongOrder
        ? "错误顺序模式：生产者先 P(mutex) 再 P(empty)。缓冲区满时试试两个按钮——亲手制造一次死锁。"
        : "正确口径：生产者 P(empty)→P(mutex)→放→V(mutex)→V(full)；消费者对称。开两个按钮交替点，盯住三个信号量。");
      renderBuf();
    }

    sel.addEventListener("change", function () { wrongOrder = (sel.value === "wrong"); reset(); });
    btnProd.addEventListener("click", function () { producerRound(); });
    btnCons.addEventListener("click", function () { consumerRound(); });
    btnReset.addEventListener("click", reset);

    reset();
  }

  global.PVSimulator = { mount: mount };
})(window);
