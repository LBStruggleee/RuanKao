/* ============================================================
 * sprite-base.js — 进制转换·像素小剧场（sprite-animation 规范）
 *
 * 两个剧场，各挂各的容器（放在它所讲解的章节旁边）：
 *   BaseLab.mountExpand("oba-holder")  §一 按权展开：1011B → 11
 *   BaseLab.mountDivide("obd-holder")  §二 除基取余：25 → 11001B
 *
 * 剧场 A：四个数字格下方依次落下位权条（2³=8…2⁰=1）、乘积条
 *   （1×8=8…），最后汇聚成 8+0+2+1 = 11——「逐位相乘再相加」一眼看穿。
 * 剧场 B：除法阶梯一行一行落下，余数被收进右栏（从下往上），
 *   最后箭头点亮、拼出 11001B 并验算 16+8+1=25——「余数逆序读」。
 *
 * 环境动画（REC/扫描线/大字故障/走带字幕）为纯 CSS keyframes；
 * prefers-reduced-motion 时序列机停摆、静态初始帧收场。
 * ============================================================ */
(function (global) {
  "use strict";

  var CSS =
'.ob-stage{position:relative;margin:1.2rem 0;width:820px;overflow:hidden;background:#f5efe2;' +
'border:2px solid #26313b;border-radius:6px;font-family:var(--mono,monospace);' +
'box-shadow:4px 4px 0 rgba(38,49,59,.18)}' +
'.oba-stage{height:430px}.obd-stage{height:500px}' +
'.ob-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;background:' +
'repeating-linear-gradient(0deg,rgba(38,49,59,.028) 0 1px,transparent 1px 3px),' +
'repeating-linear-gradient(90deg,rgba(38,49,59,.02) 0 1px,transparent 1px 4px)}' +
'.ob-topbar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;' +
'padding:.55rem .9rem;font-size:.72rem;letter-spacing:.08em;color:#4a4a42;z-index:5}' +
'.ob-dots span{display:inline-block;width:6px;height:8px;margin:0 2px;background:#4a4a42;opacity:.35}' +
'.ob-dots span.on{opacity:1;animation:obDot 2s steps(1) infinite}' +
'.ob-rec{color:#b3372a;font-weight:700;animation:obRec 1.2s steps(1) infinite}' +
'@keyframes obRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@keyframes obDot{0%,100%{opacity:1}33%{opacity:.35}}' +

/* —— 大字水印（故障 + 扫描线）—— */
'.ob-year{position:absolute;left:3.5%;top:42px;z-index:4;font-family:var(--serif,serif);' +
'font-size:2rem;font-weight:900;line-height:.95;color:#26313b;animation:obGlitch 12s steps(1) infinite}' +
'.ob-year small{display:block;font-size:.64rem;font-weight:400;letter-spacing:.22em;color:#8a8474;margin-top:.4rem}' +
'@keyframes obGlitch{' +
'0%,93%{clip-path:inset(0 0 0 0);transform:translate(0,0)}' +
'94%{clip-path:inset(12% 0 58% 0);transform:translate(-3px,0)}' +
'96%{clip-path:inset(55% 0 20% 0);transform:translate(3px,0)}' +
'98%,100%{clip-path:inset(0 0 0 0);transform:translate(0,0)}}' +
'.ob-year::after{content:"";position:absolute;inset:0;pointer-events:none;' +
'background:repeating-linear-gradient(0deg,rgba(38,49,59,.06) 0 2px,transparent 2px 5px);' +
'animation:obScan 3.2s linear infinite}' +
'@keyframes obScan{from{background-position-y:0}to{background-position-y:30px}}' +

/* —— 走带字幕 + 讲解字幕 —— */
'.ob-ribbon{position:absolute;left:0;right:0;bottom:2.6rem;height:1.7rem;background:#26313b;overflow:hidden;z-index:4}' +
'.ob-ribbon-track{position:absolute;white-space:nowrap;line-height:1.7rem;color:#f5efe2;font-size:.72rem;' +
'letter-spacing:.18em;animation:obRibbon 16s linear infinite}' +
'@keyframes obRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
'.ob-caption{position:absolute;left:4.5%;right:4.5%;bottom:.55rem;z-index:4;font-size:.74rem;' +
'line-height:1.5;color:#4a4a42;transition:opacity .2s ease}' +
'.ob-caption b{color:#0e6b5c}.ob-caption i{color:#b3372a;font-style:normal}' +

/* —— 剧场 A：数字格 / 位权条 / 乘积条 / 结果箱 —— */
'.oba-cell{position:absolute;width:64px;height:64px;border:2px solid #26313b;border-radius:4px;' +
'background:#fffdf6;display:flex;align-items:center;justify-content:center;' +
'font-size:1.5rem;font-weight:700;color:#26313b;box-shadow:3px 3px 0 rgba(38,49,59,.18);z-index:3}' +
'.oba-wchip,.oba-pchip{position:absolute;width:64px;text-align:center;opacity:0;transform:translateY(6px);' +
'transition:opacity .35s ease,transform .35s ease}' +
'.oba-wchip{height:26px;line-height:24px;font-size:.76rem;color:#8a5b12;font-weight:700;' +
'border:1px dashed #a3843d;border-radius:3px;background:rgba(220,185,94,.14)}' +
'.oba-pchip{height:32px;line-height:30px;font-size:.86rem;color:#0e6b5c;font-weight:700;' +
'border:2px solid #0e6b5c;border-radius:4px;background:rgba(14,107,92,.08)}' +
'.oba-wchip.on,.oba-pchip.on{opacity:1;transform:translateY(0)}' +
'.oba-result{position:absolute;opacity:0;transform:scale(.94);' +
'border:2px solid #b3372a;border-radius:6px;background:rgba(179,55,42,.07);display:flex;align-items:center;' +
'justify-content:center;font-size:1.15rem;font-weight:700;color:#b3372a;box-shadow:3px 3px 0 rgba(38,49,59,.18);' +
'transition:opacity .4s ease,transform .4s cubic-bezier(.3,1.3,.5,1);z-index:3}' +
'.oba-result.on{opacity:1;transform:scale(1)}' +

/* —— 剧场 B：除法阶梯 / 余数 / 收集栏 —— */
'.obd-row{position:absolute;left:64px;display:flex;align-items:center;gap:.5rem;' +
'font-size:.95rem;color:#26313b;opacity:0;transform:translateX(-10px);' +
'transition:opacity .35s ease,transform .35s ease;z-index:3}' +
'.obd-row.on{opacity:1;transform:translateX(0)}' +
'.obd-row .dv{font-weight:700}.obd-row .q{font-weight:700;color:#0e6b5c}' +
'.obd-rem{border:2px solid #b3372a;border-radius:4px;background:rgba(179,55,42,.1);color:#b3372a;' +
'font-weight:700;padding:.1rem .45rem;font-size:.9rem}' +
'.obd-rem.lit{animation:obPulse 1s steps(2) infinite}' +
'@keyframes obPulse{0%{background:rgba(179,55,42,.1)}50%{background:rgba(179,55,42,.4)}}' +
'.obd-panel{position:absolute;left:470px;top:100px;width:300px;height:250px;border:2px solid #26313b;' +
'border-radius:6px;background:rgba(255,253,246,.6);box-shadow:3px 3px 0 rgba(38,49,59,.18);z-index:3}' +
'.obd-panel .ptitle{padding:.4rem .6rem .3rem;font-size:.7rem;font-weight:700;letter-spacing:.1em;color:#4a4a42;' +
'border-bottom:1px dashed #a3843d}' +
'.obd-slot{position:absolute;width:52px;height:32px;border:2px solid #b3372a;border-radius:4px;' +
'background:rgba(179,55,42,.1);color:#b3372a;display:flex;align-items:center;justify-content:center;' +
'font-weight:700;font-size:.95rem;opacity:0;transform:scale(.6);z-index:3;' +
'transition:opacity .3s ease,transform .3s cubic-bezier(.3,1.3,.5,1)}' +
'.obd-slot.on{opacity:1;transform:scale(1)}' +
'.obd-slot small{position:absolute;bottom:-15px;left:0;right:0;text-align:center;font-size:.52rem;' +
'font-weight:400;color:#8a8474;letter-spacing:.05em}' +
'.obd-arrow{position:absolute;left:494px;top:150px;writing-mode:vertical-rl;font-size:.66rem;font-weight:700;' +
'letter-spacing:.28em;color:#b3372a;opacity:0;z-index:3;transition:opacity .4s ease}' +
'.obd-arrow.on{opacity:1}' +
'.obd-result{position:absolute;left:64px;top:368px;width:390px;height:42px;opacity:0;transform:scale(.94);' +
'border:2px solid #0e6b5c;border-radius:6px;background:rgba(14,107,92,.08);display:flex;align-items:center;' +
'justify-content:center;font-size:1.05rem;font-weight:700;color:#0e6b5c;box-shadow:3px 3px 0 rgba(38,49,59,.18);' +
'transition:opacity .4s ease,transform .4s cubic-bezier(.3,1.3,.5,1);z-index:3}' +
'.obd-result.on{opacity:1;transform:scale(1)}' +

/* —— 移动端 —— */
'@media (max-width:640px){.ob-stage{width:100%}.oba-stage{height:352px}.obd-stage{height:540px}' +
'.ob-year{font-size:1.4rem;top:36px}.ob-year small{display:none}' +
'.ob-caption{font-size:.66rem}.obd-row{left:10px;font-size:.82rem}.obd-panel{display:none}' +
'.obd-arrow{display:none}}' +
'@media (prefers-reduced-motion: reduce){.ob-stage *{animation:none !important}' +
'.oba-wchip,.oba-pchip,.oba-result,.obd-row,.obd-slot,.obd-arrow,.obd-result{transition:none !important}}';

  var cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var ACTION_MS = 1200;

  /* ---------- 通用序列机（字幕自适应停顿 + 步数灯） ---------- */
  function makeRunner(els, actions) {
    var capLen = 0, timer = null, actIdx = 0;

    function caption(text) {
      capLen = text.replace(/<[^>]+>/g, "").replace(/\s/g, "").length;
      clearTimeout(caption._t);
      els.caption.style.opacity = "0";
      caption._t = setTimeout(function () {
        els.caption.innerHTML = text;
        els.caption.style.opacity = "1";
      }, 180);
    }

    /* 按字幕字数自适应停顿：中文阅读约 9 字/秒；下限 ACTION_MS，上限 7s */
    function scheduleNext() {
      var dwell = Math.min(Math.max(ACTION_MS, capLen * 110 + 450), 7000);
      timer = setTimeout(function () { step(); scheduleNext(); }, dwell);
    }

    function step() {
      if (actIdx >= actions.length) actIdx = 0;
      actions[actIdx]();
      actIdx += 1;
      var on = actIdx % 5;
      for (var d = 0; d < els.dots.length; d++) els.dots[d].classList.toggle("on", d === on);
      var shown = actIdx > 99 ? actIdx : ("0" + actIdx).slice(-2);
      els.idx.textContent = shown + " / " + actions.length;
    }

    return {
      caption: caption,
      start: function () {
        setTimeout(function () { step(); scheduleNext(); }, 1000);
      }
    };
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  /* ============================================================
   * 剧场 A：按权展开（1011B → 11）
   * ============================================================ */
  var Expand = {
    mount: function (holderId) {
      var holder = document.getElementById(holderId);
      if (!holder || holder.querySelector(".ob-stage")) return;

      var DIGITS = [1, 0, 1, 1];
      var WEIGHTS = ["2³=8", "2²=4", "2¹=2", "2⁰=1"];
      var PRODUCTS = ["1×8=8", "0×4=0", "1×2=2", "1×1=1"];
      var SUM_TEXT = "8 + 0 + 2 + 1 = 11";

      var MOB = window.innerWidth < 640;
      var CELL = MOB ? 42 : 64, GAP = MOB ? 8 : 18, STEP = CELL + GAP;
      var Y0 = MOB ? 62 : 88;
      var WY = Y0 + CELL + (MOB ? 8 : 12);
      var PY = WY + (MOB ? 26 : 30);
      var RH = MOB ? 36 : 46;
      var RY = PY + (MOB ? 36 : 46);
      var stageW = MOB ? holder.clientWidth : 820;
      var totalW = 4 * CELL + 3 * GAP;
      var X0 = Math.max(6, Math.round((stageW - totalW) / 2));

      var cellsHtml = "", wchipsHtml = "", pchipsHtml = "";
      for (var i = 0; i < 4; i++) {
        var xi = X0 + i * STEP;
        cellsHtml += '<div class="oba-cell" style="left:' + xi + "px;top:" + Y0 + 'px">' + DIGITS[i] + "</div>";
        wchipsHtml += '<div class="oba-wchip" data-i="' + i + '" style="left:' + xi + "px;top:" + WY + 'px">' + WEIGHTS[i] + "</div>";
        pchipsHtml += '<div class="oba-pchip" data-i="' + i + '" style="left:' + xi + "px;top:" + PY + 'px">' + PRODUCTS[i] + "</div>";
      }
      var dotsHtml = "";
      for (var d = 0; d < 5; d++) dotsHtml += "<span" + (d === 0 ? ' class="on"' : "") + "></span>";
      var ribbonText = "按權展開 · 1011B = 11 · 位權 8 4 2 1 · 逐位相乘再相加 · 小數點右 0.5 0.25 · 任意 R 進制同理 · ";

      var html = '<div class="ob-stage oba-stage" data-od-id="stage-a">' +
        '<div class="ob-grain"></div>' +
        '<div class="ob-topbar"><span>EP. 00 / 按權展開</span>' +
        '<span><span class="ob-dots">' + dotsHtml + '</span>　<span class="ob-idx">00 / 07</span>' +
        '　<span class="ob-rec">● REC</span></span></div>' +
        '<div class="ob-year">1011<small> 按權展開法 · R 進制 → 十進制 </small></div>' +
        cellsHtml + wchipsHtml + pchipsHtml +
        '<div class="oba-result" style="left:' + X0 + "px;top:" + RY + "px;width:" + totalW + "px;height:" + RH + 'px">' +
        SUM_TEXT + "</div>" +
        '<div class="ob-ribbon"><div class="ob-ribbon-track">' + ribbonText + ribbonText + "</div></div>" +
        '<div class="ob-caption">按权展开：R 进制 → 十进制的第一招，也是唯一一招。</div>' +
        "</div>";
      holder.innerHTML = html;

      var st = holder.querySelector(".ob-stage");
      var holderW = holder.clientWidth;
      if (!MOB && holderW > 0 && holderW < 820) st.style.zoom = holderW / 820;

      var mobMode = MOB;
      var rsT = null;
      window.addEventListener("resize", function () {
        clearTimeout(rsT);
        rsT = setTimeout(function () {
          if ((window.innerWidth < 640) !== mobMode) location.reload();
        }, 400);
      });

      var els = {
        caption: holder.querySelector(".ob-caption"),
        idx: holder.querySelector(".ob-idx"),
        dots: Array.prototype.slice.call(holder.querySelectorAll(".ob-dots span")),
        wchips: Array.prototype.slice.call(holder.querySelectorAll(".oba-wchip")),
        pchips: Array.prototype.slice.call(holder.querySelectorAll(".oba-pchip")),
        result: holder.querySelector(".oba-result")
      };

      function staggerOn(list) {
        list.forEach(function (c, i) {
          c.style.transitionDelay = (i * 0.18) + "s";
          c.classList.add("on");
        });
      }
      function resetAll() {
        els.wchips.concat(els.pchips).forEach(function (c) {
          c.style.transitionDelay = "";
          c.classList.remove("on");
        });
        els.result.classList.remove("on");
      }

      var runner = makeRunner(els, [
        function () {
          runner.caption("R 进制 → 十进制只有一招：<i>按权展开</i>。看 1011B 一步步变成 11");
        },
        function () {
          staggerOn(els.wchips);
          runner.caption("从右往左，第 i 位的权是 2⁰ 起：<b>8、4、2、1</b>——这排背熟，转换不用算");
        },
        function () {
          staggerOn(els.pchips);
          runner.caption("逐位相乘：1×8、0×4、1×2、1×1——遇到 0 该位贡献就是 0，但位置要留");
        },
        function () {
          els.result.classList.add("on");
          runner.caption("相加 = <b>11</b> ✓。这招在 0001 浮点、0025 子网划分里还要用一百遍");
        },
        function () {
          runner.caption("带小数同理：小数点右边的权是 2⁻¹ = 0.5、2⁻² = 0.25，往右减半（11.01B = 3.25）");
        },
        function () {
          runner.caption("任意 R 进制都一样：把 2 换成 R——八进制就按 8 的幂展开");
        },
        function () {
          resetAll();
          runner.caption("磁带倒回，重新来一遍——下一遍抢在字幕前报出答案");
        }
      ]);

      var reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) runner.start();
    }
  };

  /* ============================================================
   * 剧场 B：除基取余（25 → 11001B）
   * ============================================================ */
  var Divide = {
    mount: function (holderId) {
      var holder = document.getElementById(holderId);
      if (!holder || holder.querySelector(".ob-stage")) return;

      /* [被除数, 商, 余数] —— 25 = 11001B */
      var ROWS = [[25, 12, 1], [12, 6, 0], [6, 3, 0], [3, 1, 1], [1, 0, 1]];

      var MOB = window.innerWidth < 640;
      var Y0 = MOB ? 76 : 100, ROW_H = 52;
      var stageW = MOB ? holder.clientWidth : 820;

      var rowsHtml = "";
      for (var i = 0; i < ROWS.length; i++) {
        rowsHtml += '<div class="obd-row" data-i="' + i + '" style="top:' + (Y0 + i * ROW_H) + 'px">' +
          "<span class=\"dv\">" + ROWS[i][0] + "</span><span>÷ 2 =</span>" +
          "<span class=\"q\">" + ROWS[i][1] + "</span><span>⋯ 余</span>" +
          '<span class="obd-rem">' + ROWS[i][2] + "</span></div>";
      }

      /* 收集格：生成顺序 i=0 是最低位。桌面在面板内自下而上；移动端一行、最高位在最左 */
      var slotsHtml = "";
      for (var j = 0; j < ROWS.length; j++) {
        var sx, sy, sw = MOB ? 44 : 52, sh = MOB ? 30 : 32;
        if (MOB) {
          var x0 = Math.max(4, Math.round((stageW - (5 * 44 + 4 * 6)) / 2));
          sx = x0 + (4 - j) * 50;           // j=4（最高位）在最左
          sy = 344;
        } else {
          sx = 556;
          sy = 286 - j * 38;                // j=0（最低位）在最下
        }
        var label = j === 0 ? "<small>最低位</small>" : (j === 4 ? "<small>最高位</small>" : "");
        slotsHtml += '<div class="obd-slot" data-i="' + j + '" style="left:' + sx + "px;top:" + sy + 'px">' +
          ROWS[j][2] + label + "</div>";
      }

      var dotsHtml = "";
      for (var d = 0; d < 5; d++) dotsHtml += "<span" + (d === 0 ? ' class="on"' : "") + "></span>";
      var ribbonText = "除基取餘 · 25 = 11001B · 餘數逆序讀 · 商 0 就停 · 最先得最低位 · 小數乘基取整順序讀 · ";

      var html = '<div class="ob-stage obd-stage" data-od-id="stage-b">' +
        '<div class="ob-grain"></div>' +
        '<div class="ob-topbar"><span>EP. 00 / 除基取餘</span>' +
        '<span><span class="ob-dots">' + dotsHtml + '</span>　<span class="ob-idx">00 / 09</span>' +
        '　<span class="ob-rec">● REC</span></span></div>' +
        '<div class="ob-year">25<small> 除基取餘 · 十進制 → 二進制 </small></div>' +
        rowsHtml +
        (MOB ? "" : '<div class="obd-panel" data-od-id="panel"><div class="ptitle">余数收集栏 · 从下往上读</div></div>') +
        slotsHtml +
        (MOB ? "" : '<div class="obd-arrow">↑ 逆 序 读</div>') +
        '<div class="obd-result">余数逆序读 → 11001B　验算：16 + 8 + 1 = 25 ✓</div>' +
        '<div class="ob-ribbon"><div class="ob-ribbon-track">' + ribbonText + ribbonText + "</div></div>" +
        '<div class="ob-caption">除基取余：十进制整数 → R 进制的标准动作，除到商为 0。</div>' +
        "</div>";
      holder.innerHTML = html;

      var st = holder.querySelector(".ob-stage");
      var holderW = holder.clientWidth;
      if (!MOB && holderW > 0 && holderW < 820) st.style.zoom = holderW / 820;

      var mobMode = MOB;
      var rsT = null;
      window.addEventListener("resize", function () {
        clearTimeout(rsT);
        rsT = setTimeout(function () {
          if ((window.innerWidth < 640) !== mobMode) location.reload();
        }, 400);
      });

      var els = {
        caption: holder.querySelector(".ob-caption"),
        idx: holder.querySelector(".ob-idx"),
        dots: Array.prototype.slice.call(holder.querySelectorAll(".ob-dots span")),
        rows: Array.prototype.slice.call(holder.querySelectorAll(".obd-row")),
        rems: Array.prototype.slice.call(holder.querySelectorAll(".obd-rem")),
        slots: Array.prototype.slice.call(holder.querySelectorAll(".obd-slot")),
        arrow: holder.querySelector(".obd-arrow"),
        result: holder.querySelector(".obd-result")
      };

      function resetAll() {
        els.rows.forEach(function (r) { r.classList.remove("on"); });
        els.rems.forEach(function (r) { r.classList.remove("lit"); });
        els.slots.forEach(function (s) { s.classList.remove("on"); });
        if (els.arrow) els.arrow.classList.remove("on");
        els.result.classList.remove("on");
      }

      var runner = makeRunner(els, [
        function () {
          runner.caption("十进制 → R 进制（整数部分）：<i>除基取余</i>，一直除到商为 0 为止");
        },
        function () { lightRow(0); },
        function () { lightRow(1); runner.caption("拿商继续除：12 ÷ 2 = 6 余 0——不用思考，除就是了"); },
        function () { lightRow(2); runner.caption("6 ÷ 2 = 3 余 0——每除一次，余数就帮你锁定二进制的一位"); },
        function () { lightRow(3); runner.caption("3 ÷ 2 = 1 余 1"); },
        function () { lightRow(4); },
        function () {
          if (els.arrow) els.arrow.classList.add("on");
          els.result.classList.add("on");
          runner.caption("余数<b>逆序</b>读：11001B。验算：16 + 8 + 1 = 25 ✓（正是剧场 A 的按权展开）");
        },
        function () {
          runner.caption("小数部分反着来：<b>乘基取整、顺序读</b>——0.625 → 0.101B，见 §二例题");
        },
        function () {
          resetAll();
          runner.caption("磁带倒回，重来——下一遍抢在字幕前面报出余数");
        }
      ]);

      function lightRow(i) {
        els.rows[i].classList.add("on");
        els.rems[i].classList.add("lit");
        els.slots[i].classList.add("on");
        if (i === 0) {
          runner.caption("25 ÷ 2 = 12 余 1——<b>先得到的余数是最低位</b>（二进制最右边那一位）");
        } else if (i === 4) {
          runner.caption("1 ÷ 2 = 0 余 1——<b>商为 0，停止</b>；最后这个余数是<b>最高位</b>");
        }
      }

      var reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) runner.start();
    }
  };

  global.BaseLab = {
    mountExpand: function (holderId) { injectCSS(); Expand.mount(holderId); },
    mountDivide: function (holderId) { injectCSS(); Divide.mount(holderId); }
  };
})(window);
