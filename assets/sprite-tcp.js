/* ============================================================
 * sprite-tcp.js — TCP 三次握手 / 四次挥手·像素小剧场（sprite-animation 规范）
 *
 * 两台主机（客户端 / 服务端），报文小盒沿飞行航道在两端之间飞行，
 * 每次收到报文时主机状态芯片切换（CLOSED → SYN_SENT → … → ESTABLISHED
 * → FIN_WAIT_1 … → TIME_WAIT → CLOSED）：
 *   - 三次握手：SYN → SYN+ACK → ACK，建立连接后双向传几包数据
 *   - 四次挥手：FIN → ACK（半关闭：服务端还能发数据）→ FIN → ACK，
 *     主动方进入 TIME_WAIT 等 2MSL
 *   - 结尾点破「为什么挥手 4 次而握手 3 次」——FIN 与 ACK 分开发
 *
 * 环境动画（REC/扫描线/大字故障/走带字幕）为纯 CSS keyframes；
 * prefers-reduced-motion 时序列机停摆、静态初始帧收场。
 * 用法：页面放 <div id="otc-holder"></div> 并引入本脚本。
 * ============================================================ */
(function () {
  "use strict";

  if (window.__otcLoaded) return;
  window.__otcLoaded = true;

  var CSS =
'.otc-stage{position:relative;margin:1.2rem 0;width:820px;height:462px;background:#f5efe2;' +
'border:2px solid #26313b;border-radius:6px;overflow:hidden;font-family:var(--mono,monospace);' +
'box-shadow:4px 4px 0 rgba(38,49,59,.18)}' +
'.otc-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;background:' +
'repeating-linear-gradient(0deg,rgba(38,49,59,.028) 0 1px,transparent 1px 3px),' +
'repeating-linear-gradient(90deg,rgba(38,49,59,.02) 0 1px,transparent 1px 4px)}' +
'.otc-topbar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;' +
'padding:.55rem .9rem;font-size:.72rem;letter-spacing:.08em;color:#4a4a42;z-index:5}' +
'.otc-dots span{display:inline-block;width:6px;height:8px;margin:0 2px;background:#4a4a42;opacity:.35}' +
'.otc-dots span.on{opacity:1;animation:otcDot 2s steps(1) infinite}' +
'.otc-rec{color:#b3372a;font-weight:700;animation:otcRec 1.2s steps(1) infinite}' +
'@keyframes otcRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@keyframes otcDot{0%,100%{opacity:1}33%{opacity:.35}}' +

/* —— 大字「握手」—— */
'.otc-year{position:absolute;left:4.5%;bottom:16.5%;z-index:4;font-family:var(--serif,serif);' +
'font-size:clamp(2.6rem,7vw,4.6rem);font-weight:900;line-height:.95;color:#26313b;' +
'animation:otcGlitch 12s steps(1) infinite}' +
'.otc-year small{display:block;font-size:clamp(.68rem,1.4vw,.88rem);font-weight:400;letter-spacing:.28em;color:#8a8474;margin-top:.4rem}' +
'@keyframes otcGlitch{' +
'0%,93%{clip-path:inset(0 0 0 0);transform:translate(0,0)}' +
'94%{clip-path:inset(12% 0 58% 0);transform:translate(-3px,0)}' +
'96%{clip-path:inset(55% 0 20% 0);transform:translate(3px,0)}' +
'98%,100%{clip-path:inset(0 0 0 0);transform:translate(0,0)}}' +
'.otc-year::after{content:"";position:absolute;inset:0;pointer-events:none;' +
'background:repeating-linear-gradient(0deg,rgba(38,49,59,.06) 0 2px,transparent 2px 5px);' +
'animation:otcScan 3.2s linear infinite}' +
'@keyframes otcScan{from{background-position-y:0}to{background-position-y:30px}}' +

/* —— 主机与状态芯片 —— */
'.otc-host{position:absolute;z-index:4;text-align:center;transition:left .4s ease}' +
'.otc-host .pic{width:56px;height:64px;filter:drop-shadow(3px 3px 0 rgba(38,49,59,.22))}' +
'.otc-host .name{font-size:.7rem;font-weight:700;letter-spacing:.1em;color:#4a4a42;margin-top:.3rem}' +
'.otc-host .state{display:inline-block;margin-top:.35rem;padding:.18rem .6rem;font-size:.66rem;' +
'font-weight:700;letter-spacing:.08em;border:2px solid #26313b;border-radius:2px;' +
'background:#fffdf6;color:#26313b;transition:background .25s ease,color .25s ease;white-space:nowrap}' +
'.otc-host .state.hi{background:#e3efe9;color:#0e6b5c}' +
'.otc-host .state.wave{background:#fbeadd;color:#b3372a}' +
'.otc-client{left:7%;top:30%}' +
'.otc-server{right:7%;top:30%}' +

/* —— 飞行航道：虚线穿过两主机屏幕中线，报文压线飞行 —— */
'.otc-lane{position:absolute;left:0;right:0;top:34%;height:4px;z-index:2;' +
'background:repeating-linear-gradient(90deg,#c9bfa8 0 10px,transparent 10px 18px)}' +
'.otc-packet{position:absolute;left:7%;top:31%;z-index:3;width:78px;height:30px;' +
'background:#fffdf6;border:2px solid #26313b;box-shadow:3px 3px 0 rgba(38,49,59,.22);' +
'display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:700;' +
'letter-spacing:.06em;color:#26313b;opacity:0;' +
'transition:left .6s cubic-bezier(.34,1.1,.5,1),opacity .25s ease;transform:translateX(-50%)}' +
'.otc-packet.fly{opacity:1}' +
'.otc-packet .dir{margin-left:.3rem;color:#0e6b5c}' +
'.otc-packet.fin{background:#fbeadd}.otc-packet.fin .dir{color:#b3372a}' +
'.otc-packet.data{background:#e3efe9}' +

/* —— 走带字幕与讲解 —— */
'.otc-ribbon{position:absolute;left:0;right:0;bottom:2.6rem;height:1.7rem;background:#26313b;overflow:hidden;z-index:4}' +
'.otc-ribbon-track{position:absolute;white-space:nowrap;line-height:1.7rem;color:#f5efe2;font-size:.72rem;' +
'letter-spacing:.18em;animation:otcRibbon 16s linear infinite}' +
'@keyframes otcRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
'.otc-caption{position:absolute;left:4.5%;right:4.5%;bottom:.55rem;z-index:4;font-size:.74rem;' +
'line-height:1.5;color:#4a4a42;transition:opacity .2s ease}' +
'.otc-caption b{color:#0e6b5c}.otc-caption i{color:#b3372a;font-style:normal}' +
/* —— 移动端：主机缩小下移，报文航道抬高，标题落回主机下方 —— */
'@media (max-width:640px){.otc-stage{width:100%;height:300px}' +
'.otc-host{top:14%}' +
'.otc-host .pic{width:44px;height:50px}' +
'.otc-host .name{font-size:.64rem}' +
'.otc-host .state{font-size:.64rem;padding:.14rem .42rem}' +
'.otc-packet{top:15%;width:64px;height:26px;font-size:.6rem}' +
'.otc-lane{top:18%}' +
'.otc-year{left:4%;bottom:24%;font-size:1.4rem}' +
'.otc-year small{display:none}' +
'.otc-caption{font-size:.66rem}}' +
'@media (prefers-reduced-motion: reduce){.otc-stage *{animation:none !important}.otc-packet{transition:none !important}}';

  var ACTION_MS = 1100;
  /* 飞行端点（舞台坐标百分比 → 像素在 render 时算） */
  var els = {};
  var capLen = 0;   // 当前字幕可见字数，用于自适应停顿
  var timer = null;
  var actions = [];
  var actIdx = 0;

  /* 脚本：每步的报文飞行 + 状态切换时机（sendX=出发时刻 / arrX=抵达时刻） */
  var SCRIPT = [
    { cap: "<i>三次握手</i>：建立连接，互相同步初始序列号（seq=x / seq=y）" },
    { from: "C", label: "SYN", sendC: ["SYN_SENT", ""],
      cap: "① 客户端发 SYN（seq=x）→ 进入 <b>SYN_SENT</b>" },
    { from: "S", label: "SYN+ACK", arrS: ["SYN_RCVD", "hi"],
      cap: "② 服务端收到 SYN 回 SYN+ACK（ack=x+1，seq=y）→ 进入 <b>SYN_RCVD</b>" },
    { from: "C", label: "ACK", arrC: ["ESTABLISHED", "hi"], arrS: ["ESTABLISHED", "hi"],
      cap: "③ 客户端回 ACK（ack=y+1）→ 双方 <b>ESTABLISHED</b>，连接建立" },
    { banner: true, cap: "<b>连接已建立</b> · 开始双向传输数据……" },
    { from: "C", label: "数据", data: true, cap: "客户端请求数据（全双工：双方都能同时发）" },
    { from: "S", label: "数据", data: true, cap: "服务端响应数据" },
    { banner: true, cap: "<i>四次挥手</i>：断开连接——注意是 4 次不是 3 次" },
    { from: "C", label: "FIN", sendC: ["FIN_WAIT_1", "wave"],
      cap: "① 客户端发 FIN → 进入 <i>FIN_WAIT_1</i>（主动关闭方）" },
    { from: "S", label: "ACK", arrS: ["CLOSE_WAIT", "wave"], arrC: ["FIN_WAIT_2", "wave"],
      cap: "② 服务端回 ACK → <i>CLOSE_WAIT</i> / 客户端 <i>FIN_WAIT_2</i>——<b>半关闭</b>：服务端还能发数据" },
    { from: "S", label: "FIN", sendS: ["LAST_ACK", "wave"],
      cap: "③ 数据传完，服务端发 FIN → 进入 <i>LAST_ACK</i>" },
    { from: "C", label: "ACK", sendC: ["TIME_WAIT", "wave"], arrS: ["CLOSED", ""],
      cap: "④ 客户端回最后的 ACK → 进入 <i>TIME_WAIT</i>；服务端收到 → CLOSED" },
    { cap: "TIME_WAIT 等 <b>2MSL</b>：万一服务端没收到最后的 ACK，它能重发 FIN" },
    { cState: ["CLOSED", ""], cap: "2MSL 到期 → 客户端 CLOSED，连接彻底断开" },
    { banner: true,
      cap: "为什么挥手 4 次而握手 3 次？FIN 与 ACK 必须分开发——<b>TCP 是半关闭的</b>，一端关了另一端还能发" },
    { reset: true, cap: "磁带倒回，重新开始三次握手" }
  ];

  function caption(text) {
    capLen = text.replace(/<[^>]+>/g, "").replace(/\s/g, "").length;
    clearTimeout(caption._t);
    els.caption.style.opacity = "0";
    caption._t = setTimeout(function () {
      els.caption.innerHTML = text;
      els.caption.style.opacity = "1";
    }, 180);
  }

  /* 按字幕字数自适应停顿：中文阅读约 9 字/秒；下限 ACTION_MS（含 560ms 飞行时间），上限 7s */
  function scheduleNext() {
    var dwell = Math.min(Math.max(ACTION_MS, capLen * 110 + 450), 7000);
    timer = setTimeout(function () { step(); scheduleNext(); }, dwell);
  }

  function setState(host, arr) {
    if (!arr || !arr[0]) return;
    host.state.textContent = arr[0];
    host.state.className = "state" + (arr[1] ? " " + arr[1] : "");
  }

  /* 主机水平中心（每次飞行实时算：主机宽度随状态文本变化 52→80px，
     挂载时缓存的端点会偏 14px） */
  function hostCenterX(hostEl) {
    var sr = els.stage.getBoundingClientRect();
    var hr = hostEl.getBoundingClientRect();
    return (hr.left + hr.width / 2) - sr.left;
  }

  /* 飞一次报文：从 from 端出发（应用 sendX 状态），0.56s 后抵达（应用 arrX 状态） */
  function fly(st) {
    var startX = hostCenterX(st.from === "C" ? els.client : els.server);
    var endX = hostCenterX(st.from === "C" ? els.server : els.client);
    var p = els.packet;
    p.className = "otc-packet" + (st.data ? " data" : (st.label === "FIN" ? " fin" : ""));
    p.innerHTML = st.label + '<span class="dir">' + (st.from === "C" ? "▶" : "◀") + "</span>";
    // 用类控制显隐：内联 opacity 会盖过 .fly 的 opacity:1，之前报文一直隐身
    p.classList.remove("fly");
    p.style.left = startX + "px";
    if (st.sendC) setState(els.client, st.sendC);
    if (st.sendS) setState(els.server, st.sendS);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        p.classList.add("fly");
        p.style.left = endX + "px";
      });
    });
    setTimeout(function () {
      // 报文留在目的地不淡出：caption-only 的节拍里也能看到最近一封报文
      if (st.arrC) setState(els.client, st.arrC);
      if (st.arrS) setState(els.server, st.arrS);
    }, 560);
  }

  function buildScript() {
    actions = [];
    SCRIPT.forEach(function (st) {
      actions.push(function () {
        caption(st.cap);
        if (st.from) fly(st);
        if (!st.from && st.cState) setState(els.client, st.cState);
        if (!st.from && st.sState) setState(els.server, st.sState);
        if (st.reset) {
          setState(els.client, ["CLOSED", ""]);
          setState(els.server, ["CLOSED", ""]);
          els.packet.classList.remove("fly");
        }
      });
    });
  }

  function step() {
    if (actIdx >= actions.length) { actIdx = 0; }
    actions[actIdx]();
    actIdx += 1;
    var on = actIdx % 5;
    for (var d = 0; d < els.dots.length; d++) els.dots[d].classList.toggle("on", d === on);
    var shown = actIdx > 99 ? actIdx : ("0" + actIdx).slice(-2);
    els.idx.textContent = shown + " / " + actions.length;
  }

  /* 像素主机：客户端显示器 / 服务端机架 */
  function clientSvg() {
    return '<svg class="pic" width="56" height="64" viewBox="0 0 14 16" shape-rendering="crispEdges">' +
      '<rect x="1" y="1" width="12" height="9" fill="#26313b"/>' +
      '<rect x="2" y="2" width="10" height="7" fill="#0e6b5c"/>' +
      '<rect x="3" y="3" width="2" height="1" fill="#e3efe9"/><rect x="6" y="3" width="3" height="1" fill="#e3efe9"/>' +
      '<rect x="3" y="5" width="6" height="1" fill="#e3efe9"/><rect x="3" y="7" width="4" height="1" fill="#e3efe9"/>' +
      '<rect x="6" y="10" width="2" height="3" fill="#26313b"/>' +
      '<rect x="3" y="13" width="8" height="2" fill="#26313b"/></svg>';
  }
  function serverSvg() {
    return '<svg class="pic" width="56" height="64" viewBox="0 0 14 16" shape-rendering="crispEdges">' +
      '<rect x="2" y="1" width="10" height="14" fill="#26313b"/>' +
      '<rect x="3" y="2" width="8" height="4" fill="#8a6d1f"/>' +
      '<rect x="4" y="3" width="1" height="1" fill="#f6edd6"/><rect x="6" y="3" width="3" height="1" fill="#f6edd6"/>' +
      '<rect x="3" y="7" width="8" height="4" fill="#8a6d1f"/>' +
      '<rect x="4" y="8" width="1" height="1" fill="#f6edd6"/><rect x="6" y="8" width="3" height="1" fill="#f6edd6"/>' +
      '<rect x="3" y="12" width="8" height="2" fill="#8a6d1f"/>' +
      '<rect x="10" y="3" width="1" height="1" fill="#b3372a"/><rect x="10" y="8" width="1" height="1" fill="#2e7d32"/></svg>';
  }

  function buildHTML() {
    var dotsHtml = "";
    for (var d = 0; d < 5; d++) dotsHtml += "<span" + (d === 0 ? ' class="on"' : "") + "></span>";
    return '<div class="otc-stage" data-od-id="stage">' +
      '<div class="otc-grain"></div>' +
      '<div class="otc-topbar" data-od-id="topbar"><span>EP. 25 / 三次握手</span>' +
      '<span><span class="otc-dots">' + dotsHtml + '</span>　<span class="otc-idx">00 / 10</span>' +
      '　<span class="otc-rec">● REC</span></span></div>' +
      '<div class="otc-year" data-od-id="year">握手<small> 三次握手建立 · 四次揮手斷開 · 半關閉 · 2MSL </small></div>' +
      '<div class="otc-lane"></div>' +
      '<div class="otc-packet" data-od-id="packet"></div>' +
      '<div class="otc-host otc-client" data-od-id="sprite-client">' + clientSvg() +
      '<div class="name">客户端</div><span class="state">CLOSED</span></div>' +
      '<div class="otc-host otc-server" data-od-id="sprite-server">' + serverSvg() +
      '<div class="name">服务端</div><span class="state">CLOSED</span></div>' +
      '<div class="otc-ribbon" data-od-id="ribbon"><div class="otc-ribbon-track">' +
      'SYN · SYN+ACK · ACK · ESTABLISHED · FIN · ACK · CLOSE_WAIT · TIME_WAIT · 2MSL · 半關閉 · ' +
      'SYN · SYN+ACK · ACK · ESTABLISHED · FIN · ACK · CLOSE_WAIT · TIME_WAIT · 2MSL · 半關閉 · </div></div>' +
      '<div class="otc-caption" data-od-id="caption">TCP 连接管理：先建立（3 次握手），传完数据再断开（4 次挥手）。</div>' +
      '</div>';
  }

  function mount() {
    var holder = document.getElementById("otc-holder");
    if (!holder || holder.querySelector(".otc-stage")) return;
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    holder.innerHTML = buildHTML();

    /* 桌面窄容器整体 zoom（640–820px）；横竖屏翻转模式变化 → 重载 */
    var st = holder.querySelector(".otc-stage");
    var holderW = holder.clientWidth;
    if (window.innerWidth >= 640 && holderW > 0 && holderW < 820) st.style.zoom = holderW / 820;

    var mobMode = window.innerWidth < 640;
    var rsT = null;
    window.addEventListener("resize", function () {
      clearTimeout(rsT);
      rsT = setTimeout(function () {
        if ((window.innerWidth < 640) !== mobMode) location.reload();
      }, 400);
    });

    els.caption = holder.querySelector(".otc-caption");
    els.idx = holder.querySelector(".otc-idx");
    els.dots = Array.prototype.slice.call(holder.querySelectorAll(".otc-dots span"));
    els.packet = holder.querySelector(".otc-packet");
    els.stage = holder.querySelector(".otc-stage");
    /* 主机用元素本身，state 引用挂其上（fly 每次按实时 rect 算端点） */
    els.client = holder.querySelector(".otc-client") || null;
    els.server = holder.querySelector(".otc-server") || null;
    if (els.client) els.client.state = holder.querySelector(".otc-client .state");
    if (els.server) els.server.state = holder.querySelector(".otc-server .state");

    buildScript();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    setTimeout(function () {
      step();
      scheduleNext();
    }, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
