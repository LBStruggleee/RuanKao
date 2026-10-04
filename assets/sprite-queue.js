/* ============================================================
 * sprite-queue.js — 循环队列·像素动画解说帧（sprite-animation 规范）
 *
 * 单帧解说场景：奶油纸面舞台 + 大字「循環」故障特效 + 像素队列
 * sprite（front/rear 像素指针按 steps() 逐格跳动）+ 先入先出假名
 * 浮现 + 底部走带字幕。≥3 组独立循环动画，纯 CSS keyframes。
 *
 * 用法：页面放 <div id="odq-holder"></div> 并引入本脚本即可。
 * 减弱动态效果（prefers-reduced-motion）时全部动画暂停。
 * ============================================================ */
(function () {
  "use strict";

  if (window.__odqLoaded) return;
  window.__odqLoaded = true;

  var CSS =
'.odq-stage{position:relative;margin:1.2rem 0;max-width:860px;aspect-ratio:16/9;background:#f5efe2;' +
'border:1px solid #d8cfba;border-radius:6px;overflow:hidden;font-family:var(--mono,monospace);' +
'box-shadow:0 4px 18px rgba(38,49,59,.08)}' +
'.odq-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;background:' +
'repeating-linear-gradient(0deg,rgba(38,49,59,.028) 0 1px,transparent 1px 3px),' +
'repeating-linear-gradient(90deg,rgba(38,49,59,.02) 0 1px,transparent 1px 4px)}' +
'.odq-topbar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;' +
'padding:.55rem .9rem;font-size:.72rem;letter-spacing:.08em;color:#4a4a42;z-index:5}' +
'.odq-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;background:#4a4a42;border-radius:50%;opacity:.35}' +
'.odq-dots span.on{opacity:1;animation:odqDot 2s steps(1) infinite}' +
'.odq-rec{color:#b3372a;font-weight:700;animation:odqRec 1.2s steps(1) infinite}' +
'@keyframes odqRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@keyframes odqDot{0%,100%{opacity:1}33%{opacity:.35}}' +

'.odq-year{position:absolute;left:4.5%;bottom:14%;z-index:4;font-family:var(--serif,serif);' +
'font-size:clamp(3.2rem,9vw,6.2rem);font-weight:900;line-height:.95;color:#26313b;' +
'animation:odqGlitch 10s steps(1) infinite}' +
'.odq-year small{display:block;font-size:clamp(.8rem,1.6vw,1rem);font-weight:400;letter-spacing:.35em;color:#8a8474;margin-top:.4rem}' +
'@keyframes odqGlitch{' +
'0%,86%{clip-path:inset(0 0 0 0);transform:translate(0,0) scale(1)}' +
'87%{clip-path:inset(12% 0 58% 0);transform:translate(-4px,0)}' +
'89%{clip-path:inset(55% 0 20% 0);transform:translate(4px,0) scale(1.04)}' +
'91%{clip-path:inset(30% 0 45% 0);transform:translate(-2px,0)}' +
'93%{clip-path:inset(0 0 0 0);transform:translate(0,0) scale(1)}' +
'100%{clip-path:inset(0 0 0 0);transform:translate(0,0) scale(1)}}' +
'.odq-year::after{content:"";position:absolute;inset:0;pointer-events:none;' +
'background:repeating-linear-gradient(0deg,rgba(38,49,59,.07) 0 2px,transparent 2px 5px);' +
'animation:odqScan 3s linear infinite}' +
'@keyframes odqScan{from{background-position-y:0}to{background-position-y:30px}}' +

'.odq-kana{position:absolute;right:5%;top:16%;z-index:4;writing-mode:vertical-rl;' +
'font-family:var(--serif,serif);font-size:clamp(1.1rem,2.4vw,1.6rem);letter-spacing:.5em;color:#26313b}' +
'.odq-kana span{opacity:0;animation:odqKana 6.4s ease-in-out infinite}' +
'.odq-kana span:nth-child(2){animation-delay:1.6s}' +
'.odq-kana span:nth-child(3){animation-delay:3.2s}' +
'.odq-kana span:nth-child(4){animation-delay:4.8s}' +
'@keyframes odqKana{0%{opacity:0;transform:translateY(-8px)}12%{opacity:1;transform:translateY(0)}' +
'70%{opacity:1}82%{opacity:0;transform:translateY(6px)}100%{opacity:0}}' +

'.odq-board{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:408px;z-index:3;' +
'animation:odqBob 1.6s ease-in-out infinite}' +
'@keyframes odqBob{0%,100%{transform:translate(-50%,-50%)}50%{transform:translate(-50%,calc(-50% - 4px))}}' +
'.odq-cells{position:relative;height:52px}' +
'.odq-cell{position:absolute;top:0;width:60px;height:52px;background:#fffdf6;border:3px solid #26313b;' +
'box-shadow:4px 4px 0 rgba(38,49,59,.22)}' +
'.odq-cell .n{position:absolute;top:-1.5rem;left:50%;transform:translateX(-50%);font-size:.66rem;color:#8a8474}' +
'.odq-token{position:absolute;inset:6px;display:flex;align-items:center;justify-content:center;' +
'font-weight:700;font-size:1.15rem;color:#26313b;opacity:0}' +
'.odq-cell.filled .odq-token{opacity:1}' +
'.odq-cell.wrapflash{animation:odqWrap .9s steps(1) infinite}' +
'@keyframes odqWrap{0%,100%{box-shadow:4px 4px 0 rgba(38,49,59,.22)}50%{box-shadow:0 0 0 6px rgba(14,107,92,.35)}}' +

'.odq-sprite{position:absolute;top:-46px;width:28px;height:34px;transform:translateX(-50%);' +
'animation:odqBob2 1.6s ease-in-out infinite}' +
'@keyframes odqBob2{0%,100%{margin-top:0}50%{margin-top:-4px}}' +
'.odq-sprite.front{left:30px;color:#0e6b5c}' +
'.odq-sprite.rear{left:346px;color:#b3372a;animation-delay:.8s}' +
'.odq-front{animation:odqFront 10s steps(1) infinite}' +
'.odq-rear{animation:odqRear 10s steps(1) infinite}' +
'@keyframes odqRear{0%{left:30px}8%{left:102px}16%{left:174px}24%{left:246px}32%{left:318px}' +
'40%{left:30px}100%{left:30px}}' +
'@keyframes odqFront{0%{left:30px}56%{left:30px}64%{left:102px}100%{left:102px}}' +
'.odq-svg{display:block;image-rendering:pixelated}' +

'@keyframes odqTok{0%{opacity:0}8%{opacity:1}48%{opacity:1}56%{opacity:0}100%{opacity:0}}' +
'@keyframes odqTokStay{0%{opacity:0}16%{opacity:1}100%{opacity:1}}' +
'@keyframes odqTokLate{0%{opacity:0}64%{opacity:1}100%{opacity:1}}' +
'@keyframes odqTokWrap{0%{opacity:0}80%{opacity:1}100%{opacity:1}}' +
'.odq-t1{animation:odqTok 10s steps(1) infinite}' +
'.odq-t2{animation:odqTokStay 10s steps(1) infinite}' +
'.odq-t3{animation:odqTokStay 10s steps(1) infinite}' +
'.odq-t4{animation:odqTokLate 10s steps(1) infinite}' +
'.odq-t5{animation:odqTokWrap 10s steps(1) infinite}' +

'.odq-ribbon{position:absolute;left:0;right:0;bottom:2.6rem;height:1.7rem;background:#26313b;overflow:hidden;z-index:4}' +
'.odq-ribbon-track{position:absolute;white-space:nowrap;line-height:1.7rem;color:#f5efe2;font-size:.72rem;' +
'letter-spacing:.18em;animation:odqRibbon 16s linear infinite}' +
'@keyframes odqRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
'.odq-caption{position:absolute;left:4.5%;right:4.5%;bottom:.6rem;z-index:4;font-size:.72rem;' +
'line-height:1.5;color:#4a4a42}' +
'.odq-caption b{color:#0e6b5c}' +
'@media (max-width:640px){.odq-board{transform:translate(-50%,-50%) scale(.82)}.odq-year{bottom:20%}}' +
'@media (prefers-reduced-motion: reduce){.odq-stage *{animation:none !important}}';

  var HTML =
'<div class="odq-stage" data-od-id="stage">' +
'<div class="odq-grain"></div>' +
'<div class="odq-topbar" data-od-id="topbar"><span>EP. 06 / 循環隊列</span>' +
'<span><span class="odq-dots"><span class="on"></span><span></span><span></span><span></span><span></span></span>' +
'　01 / 05　<span class="odq-rec">● REC</span></span></div>' +
'<div class="odq-year" data-od-id="year">循環<small> rear 指向隊尾下一格 · 犧牲一格判滿 </small></div>' +
'<div class="odq-kana" data-od-id="kana"><span>先</span><span>入</span><span>先</span><span>出</span></div>' +
'<div class="odq-board" data-od-id="sprite">' +
'<div class="odq-cells">' +
'<div class="odq-cell" style="left:0"><span class="n">格0</span><span class="odq-token odq-t1">A</span></div>' +
'<div class="odq-cell" style="left:72px"><span class="n">格1</span><span class="odq-token odq-t2">B</span></div>' +
'<div class="odq-cell" style="left:144px"><span class="n">格2</span><span class="odq-token odq-t3">C</span></div>' +
'<div class="odq-cell" style="left:216px"><span class="n">格3</span><span class="odq-token odq-t4">D</span></div>' +
'<div class="odq-cell odq-wrapflash" style="left:288px"><span class="n">格4</span><span class="odq-token odq-t5">E</span></div>' +
'<div class="odq-sprite front odq-front" data-od-id="sprite-front"><svg class="odq-svg" width="28" height="34" viewBox="0 0 7 9" shape-rendering="crispEdges"><rect x="3" y="0" width="1" height="9" fill="#0e6b5c"/><rect x="3" y="0" width="4" height="3" fill="#0e6b5c"/><rect x="1" y="1" width="2" height="1" fill="#0e6b5c"/><rect x="2" y="3" width="1" height="1" fill="#0e6b5c"/><rect x="2" y="5" width="1" height="4" fill="#26313b"/></svg></div>' +
'<div class="odq-sprite rear odq-rear"><svg class="odq-svg" width="28" height="34" viewBox="0 0 7 9" shape-rendering="crispEdges"><rect x="3" y="0" width="1" height="9" fill="#b3372a"/><rect x="0" y="0" width="3" height="3" fill="#b3372a"/><rect x="0" y="3" width="1" height="1" fill="#b3372a"/><rect x="4" y="5" width="1" height="4" fill="#26313b"/></svg></div>' +
'</div></div>' +
'<div class="odq-ribbon" data-od-id="ribbon"><div class="odq-ribbon-track">' +
'格0 · 格1 · 格2 · 格3 · 格4 · 犧牲一格 · 判滿 (rear+1) mod M == front · 隊空 front == rear · ' +
'格0 · 格1 · 格2 · 格3 · 格4 · 犧牲一格 · 判滿 (rear+1) mod M == front · 隊空 front == rear · </div></div>' +
'<div class="odq-caption" data-od-id="caption">循环队列：入队时 <b>rear</b> 逐格后移，出队时 <b>front</b> 跟着走——到头就绕回格 0 继续，这就是「循环」。牺牲一格，换来判满判空条件永不打架。</div>' +
'</div>';

  function mount() {
    var holder = document.getElementById("odq-holder");
    if (!holder || holder.querySelector(".odq-stage")) return;
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    holder.innerHTML = HTML;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
