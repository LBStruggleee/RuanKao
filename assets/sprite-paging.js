/* ============================================================
 * sprite-paging.js — 页面置换·像素小剧场（sprite-animation 规范）
 *
 * 同一访问串 7 0 1 2 0 3 0 4、3 个页框，FIFO 与 LRU 各轮演一遍：
 *   - 访问串逐格推进（当前格高亮）
 *   - 命中：页框绿闪；缺页：新页弹入；需淘汰时旧页弹出、新页弹入
 *   - 「将被逐出」标签预先停在淘汰目标页框上（FIFO=最老，LRU=最久未用），
 *     观众在缺页发生前就看到谁要被踢——这是全片的教学重点
 *   - 结尾打出经典对比：FIFO 7 次缺页 vs LRU 6 次（访问串不变，策略决定结果）
 *
 * 环境动画（REC/扫描线/大字故障/走带字幕）为纯 CSS keyframes；
 * prefers-reduced-motion 时序列机停摆、静态初始帧收场。
 * 用法：页面放 <div id="odp-holder"></div> 并引入本脚本。
 * ============================================================ */
(function () {
  "use strict";

  if (window.__odpLoaded) return;
  window.__odpLoaded = true;

  var CSS =
'.odp-stage{position:relative;margin:1.2rem 0;width:820px;height:462px;background:#f5efe2;' +
'border:2px solid #26313b;border-radius:6px;overflow:hidden;font-family:var(--mono,monospace);' +
'box-shadow:4px 4px 0 rgba(38,49,59,.18)}' +
'.odp-grain{position:absolute;inset:0;pointer-events:none;opacity:.5;background:' +
'repeating-linear-gradient(0deg,rgba(38,49,59,.028) 0 1px,transparent 1px 3px),' +
'repeating-linear-gradient(90deg,rgba(38,49,59,.02) 0 1px,transparent 1px 4px)}' +
'.odp-topbar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;' +
'padding:.55rem .9rem;font-size:.72rem;letter-spacing:.08em;color:#4a4a42;z-index:5}' +
'.odp-dots span{display:inline-block;width:6px;height:8px;margin:0 2px;background:#4a4a42;opacity:.35}' +
'.odp-dots span.on{opacity:1;animation:odpDot 2s steps(1) infinite}' +
'.odp-rec{color:#b3372a;font-weight:700;animation:odpRec 1.2s steps(1) infinite}' +
'@keyframes odpRec{0%{opacity:1}50%{opacity:.15}100%{opacity:1}}' +
'@keyframes odpDot{0%,100%{opacity:1}33%{opacity:.35}}' +

/* —— 大字「置換」—— */
'.odp-year{position:absolute;left:4.5%;bottom:16.5%;z-index:4;font-family:var(--serif,serif);' +
'font-size:clamp(2.6rem,7vw,4.6rem);font-weight:900;line-height:.95;color:#26313b;' +
'animation:odpGlitch 12s steps(1) infinite}' +
'.odp-year small{display:block;font-size:clamp(.68rem,1.4vw,.88rem);font-weight:400;letter-spacing:.28em;color:#8a8474;margin-top:.4rem}' +
'@keyframes odpGlitch{' +
'0%,93%{clip-path:inset(0 0 0 0);transform:translate(0,0)}' +
'94%{clip-path:inset(12% 0 58% 0);transform:translate(-3px,0)}' +
'96%{clip-path:inset(55% 0 20% 0);transform:translate(3px,0)}' +
'98%,100%{clip-path:inset(0 0 0 0);transform:translate(0,0)}}' +
'.odp-year::after{content:"";position:absolute;inset:0;pointer-events:none;' +
'background:repeating-linear-gradient(0deg,rgba(38,49,59,.06) 0 2px,transparent 2px 5px);' +
'animation:odpScan 3.2s linear infinite}' +
'@keyframes odpScan{from{background-position-y:0}to{background-position-y:30px}}' +

/* —— 访问串 —— */
'.odp-refs{position:absolute;left:50%;transform:translateX(-50%);top:20%;display:flex;gap:10px;z-index:3}' +
'.odp-ref{width:42px;height:38px;background:#fffdf6;border:3px solid #26313b;box-shadow:3px 3px 0 rgba(38,49,59,.2);' +
'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;color:#26313b;' +
'transition:transform .2s ease}' +
'.odp-ref.cur{transform:translateY(6px);border-color:#0e6b5c;box-shadow:3px 3px 0 rgba(38,49,59,.2),0 0 0 3px rgba(14,107,92,.3)}' +
'.odp-ref.done{opacity:.35}' +

/* —— 页框 —— */
'.odp-frames{position:absolute;left:50%;transform:translateX(-50%);top:47%;display:flex;gap:18px;z-index:3}' +
'.odp-frame{position:relative;width:64px;height:64px;background:#fffdf6;border:3px solid #26313b;' +
'box-shadow:4px 4px 0 rgba(38,49,59,.22);display:flex;align-items:center;justify-content:center;' +
'transition:border-color .25s ease,box-shadow .25s ease}' +
'.odp-frame .n{position:absolute;top:-1.35rem;left:50%;transform:translateX(-50%);font-size:.68rem;color:#8a8474}' +
'.odp-frame .p{font-weight:700;font-size:1.4rem;color:#26313b;opacity:0}' +
'.odp-frame.filled .p{opacity:1}' +
'.odp-frame.popping .p{animation:odpPop .45s cubic-bezier(.3,1.4,.5,1) 1}' +
'@keyframes odpPop{0%{transform:scale(0) translateY(-12px);opacity:0}55%{transform:scale(1.15);opacity:1}' +
'100%{transform:scale(1);opacity:1}}' +
'.odp-frame.ejecting .p{animation:odpEject .4s ease 1 forwards}' +
'@keyframes odpEject{0%{transform:scale(1);opacity:1}40%{transform:scale(1.1) translateY(-8px)}' +
'100%{transform:scale(.3) translateY(-20px);opacity:0}}' +
'.odp-frame.hit-flash{animation:odpHit .6s ease 1}' +
'@keyframes odpHit{0%,100%{box-shadow:4px 4px 0 rgba(38,49,59,.22)}' +
'40%{box-shadow:4px 4px 0 rgba(38,49,59,.22),0 0 0 6px rgba(46,125,50,.4)}}' +
'.odp-frame.miss-flash{animation:odpMiss .6s ease 1}' +
'@keyframes odpMiss{0%,100%{box-shadow:4px 4px 0 rgba(38,49,59,.22)}' +
'40%{box-shadow:4px 4px 0 rgba(38,49,59,.22),0 0 0 6px rgba(179,55,42,.4)}}' +

/* —— 淘汰目标标签（教学重点：预先停在将被逐出的页框上） —— */
'.odp-victim{position:absolute;top:47%;z-index:4;transform:translateX(-50%);margin-top:86px;' +
'transition:left .5s cubic-bezier(.34,1.25,.5,1);text-align:center;pointer-events:none}' +
'.odp-victim .k{font-size:.66rem;letter-spacing:.06em;color:#b3372a;font-weight:700;white-space:nowrap}' +
'.odp-victim .arrow{font-size:.8rem;color:#b3372a;line-height:1}' +

/* —— 右侧面板：算法 + 计数器 —— */
'.odp-panel{position:absolute;right:5%;top:33%;z-index:4;text-align:right}' +
'.odp-algo{display:inline-block;font-weight:700;letter-spacing:.18em;font-size:.8rem;padding:.25rem .7rem;' +
'border:2px solid #26313b;border-radius:2px;background:#e3efe9;color:#0e6b5c;margin-bottom:.6rem}' +
'.odp-algo.lru{background:#fbeadd;color:#b3372a}' +
'.odp-counts{font-size:.78rem;color:#4a4a42;line-height:2}' +
'.odp-counts b{display:inline-block;min-width:1.6rem;font-size:1.05rem;color:#26313b}' +
'.odp-counts .ok b{color:#2e7d32}.odp-counts .bad b{color:#b3261e}' +

/* —— 走带字幕与讲解 —— */
'.odp-ribbon{position:absolute;left:0;right:0;bottom:2.6rem;height:1.7rem;background:#26313b;overflow:hidden;z-index:4}' +
'.odp-ribbon-track{position:absolute;white-space:nowrap;line-height:1.7rem;color:#f5efe2;font-size:.72rem;' +
'letter-spacing:.18em;animation:odpRibbon 16s linear infinite}' +
'@keyframes odpRibbon{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
'.odp-caption{position:absolute;left:4.5%;right:4.5%;bottom:.55rem;z-index:4;font-size:.74rem;' +
'line-height:1.5;color:#4a4a42;transition:opacity .2s ease}' +
'.odp-caption b{color:#0e6b5c}.odp-caption i{color:#b3372a;font-style:normal}' +
/* —— 移动端：竖排堆叠，面板下移居中 —— */
'@media (max-width:640px){.odp-stage{width:100%;height:440px}' +
'.odp-refs{top:11%;gap:6px}' +
'.odp-ref{width:30px;height:34px;font-size:.9rem}' +
'.odp-frames{top:26%}' +
'.odp-frame{width:56px;height:56px}' +
'.odp-frame .p{font-size:1.2rem}' +
'.odp-victim{top:26%;margin-top:80px}' +
'.odp-panel{right:auto;left:50%;transform:translateX(-50%);top:auto;bottom:96px;text-align:center}' +
'.odp-algo{margin:0 0 .3rem}' +
'.odp-counts{line-height:1.6}' +
'.odp-year{left:4%;top:8px;bottom:auto;font-size:1.5rem}' +
'.odp-year small{display:none}' +
'.odp-caption{font-size:.66rem}}' +
'@media (prefers-reduced-motion: reduce){.odp-stage *{animation:none !important}.odp-victim{transition:none !important}}';

  var REF = [7, 0, 1, 2, 0, 3, 0, 4];
  var M = 3;                       // 页框数
  var FRAME_W = 64, FRAME_GAP = 18;
  var MOB = false;                 // 移动端竖排布局标记
  var ACTION_MS = 1050;

  var S = null;
  var els = {};
  var capLen = 0;   // 当前字幕可见字数，用于自适应停顿
  var timer = null;
  var actions = [];
  var actIdx = 0;
  var lastFIFO = 0, lastLRU = 0;

  function freshState(algo) {
    return { algo: algo, frames: [null, null, null], hits: 0, misses: 0,
             fifoQ: [], lruRec: [], refIdx: 0 };
  }

  function frameX(i) { return i * (FRAME_W + FRAME_GAP) + FRAME_W / 2; }

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

  function refreshPanel() {
    els.algo.textContent = S.algo;
    els.algo.className = "odp-algo" + (S.algo === "LRU" ? " lru" : "");
    els.hits.textContent = S.hits;
    els.misses.textContent = S.misses;
    for (var i = 0; i < M; i++) {
      var f = els.frames[i];
      f.classList.toggle("filled", S.frames[i] !== null);
      f.querySelector(".p").textContent = S.frames[i] === null ? "" : S.frames[i];
    }
    for (var r = 0; r < els.refs.length; r++) {
      els.refs[r].classList.toggle("cur", r === S.curRef);
      els.refs[r].classList.toggle("done", r < S.curRef);
    }
    updateVictimTag();
  }

  /* 淘汰标签：只在 algo 有 victim 时停在对应页框上方/下方 */
  function updateVictimTag() {
    var victimPage = null;
    if (S.algo === "FIFO" && S.fifoQ.length >= M) victimPage = S.fifoQ[0];
    if (S.algo === "LRU" && S.lruRec.length >= M) victimPage = S.lruRec[0];
    if (victimPage === null || S.frames.indexOf(victimPage) < 0) {
      els.victim.style.opacity = "0";
      return;
    }
    els.victim.style.opacity = "1";
    var idx = S.frames.indexOf(victimPage);
    els.victim.style.left = els.framesBaseX + frameX(idx) + "px";
    els.victim.querySelector(".k").textContent =
      (S.algo === "FIFO" ? "下一个逐出（最老）" : "下一个逐出（最久未用）");
  }

  function flash(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 650);
  }

  /* 一次访存：命中/缺页/淘汰的完整演出 */
  function access(p, refI) {
    S.curRef = refI;

    var at = S.frames.indexOf(p);
    if (at >= 0) {
      // 命中
      S.hits += 1;
      if (S.algo === "LRU") {
        var k = S.lruRec.indexOf(p);
        if (k >= 0) S.lruRec.splice(k, 1);
        S.lruRec.push(p);
      }
      flash(els.frames[at], "hit-flash");
      caption("访问 " + p + " · <i>命中</i> ✓ 页 " + p + " 在页框" + at +
        (S.algo === "LRU" ? "（并刷新为最近使用）" : ""));
      refreshPanel();
      return;
    }

    // 缺页
    S.misses += 1;
    var empty = S.frames.indexOf(null);
    if (empty >= 0) {
      // 有空框：直接装入
      S.frames[empty] = p;
      S.fifoQ.push(p);
      S.lruRec.push(p);
      var f1 = els.frames[empty];
      f1.classList.add("filled");
      f1.querySelector(".p").textContent = p;
      flash(f1, "miss-flash");
      f1.classList.add("popping");
      setTimeout(function () { f1.classList.remove("popping"); }, 480);
      caption("访问 " + p + " · <i>缺页</i> → 装入页框" + empty + "（还剩空框）");
      refreshPanel();
      return;
    }

    // 无空框：淘汰
    var victim = (S.algo === "FIFO") ? S.fifoQ[0] : S.lruRec[0];
    var vi = S.frames.indexOf(victim);
    var fv = els.frames[vi];
    flash(fv, "miss-flash");
    fv.classList.add("ejecting");
    setTimeout(function () {
      fv.classList.remove("ejecting", "filled");
      S.frames[vi] = p;
      // FIFO 队列换出 victim 换入 p；LRU 记录同样把 victim 换成 p（p 刚用）
      var q = (S.algo === "FIFO") ? S.fifoQ : S.lruRec;
      q.splice(q.indexOf(victim), 1);
      q.push(p);
      fv.querySelector(".p").textContent = p;
      fv.classList.add("filled", "popping");
      setTimeout(function () { fv.classList.remove("popping"); }, 480);
      caption("访问 " + p + " · <i>缺页</i> · " + S.algo +
        (S.algo === "FIFO" ? " 逐出最老的 " : " 逐出最久未用的 ") + victim +
        " → 页框" + vi);
      refreshPanel();
    }, 400);
    refreshPanel();
  }

  function banner(text) { caption(text); }

  function clearFrames() {
    for (var i = 0; i < M; i++) {
      els.frames[i].classList.remove("filled", "popping", "ejecting");
      els.frames[i].querySelector(".p").textContent = "";
    }
  }

  function buildScript() {
    actions = [];
    // FIFO 轮
    actions.push(function () {
      S = freshState("FIFO");
      clearFrames(); refreshPanel();
      caption("<i>FIFO 轮</i> · 先进先出：最先进来的页最先被逐出");
    });
    REF.forEach(function (p, i) { actions.push(function () { access(p, i); }); });
    actions.push(function () {
      lastFIFO = S.misses;
      banner("<i>FIFO 结果</i>：" + S.misses + " 次缺页 / " + REF.length + " 次访问 · 缺页率 " +
        Math.round(S.misses / REF.length * 100) + "%");
    });
    // LRU 轮
    actions.push(function () {
      S = freshState("LRU");
      clearFrames(); refreshPanel();
      caption("<i>LRU 轮</i> · 最近最少使用：最久没被碰的页被逐出（相同访问串）");
    });
    REF.forEach(function (p, i) { actions.push(function () { access(p, i); }); });
    actions.push(function () {
      lastLRU = S.misses;
      banner("<i>LRU 结果</i>：" + S.misses + " 次缺页 / " + REF.length + " 次访问 · 缺页率 " +
        Math.round(S.misses / REF.length * 100) + "%");
    });
    // 对比
    actions.push(function () {
      caption("<b>同一访问串</b>：FIFO " + lastFIFO + " 次缺页 vs LRU " + lastLRU +
        " 次——策略决定谁被踢，缺页率随之不同");
    });
    // 静帧还原
    actions.push(function () {
      S = freshState("FIFO");
      clearFrames(); refreshPanel();
      caption("一轮演完 · 磁带倒回，重新开始 FIFO 轮");
    });
  }

  function step() {
    if (actIdx >= actions.length) { buildScript(); actIdx = 0; }
    actions[actIdx]();
    actIdx += 1;
    var on = actIdx % 5;
    for (var d = 0; d < els.dots.length; d++) els.dots[d].classList.toggle("on", d === on);
    var shown = actIdx > 99 ? actIdx : ("0" + actIdx).slice(-2);
    els.idx.textContent = shown + " / " + actions.length;
  }

  function buildHTML() {
    var refsHtml = "";
    for (var i = 0; i < REF.length; i++) refsHtml += '<div class="odp-ref">' + REF[i] + "</div>";
    var dotsHtml = "";
    for (var d = 0; d < 5; d++) dotsHtml += "<span" + (d === 0 ? ' class="on"' : "") + "></span>";
    var framesHtml = "";
    for (var f = 0; f < M; f++)
      framesHtml += '<div class="odp-frame"><span class="n">页框' + f + "</span><span class=\"p\"></span></div>";

    return '<div class="odp-stage" data-od-id="stage">' +
      '<div class="odp-grain"></div>' +
      '<div class="odp-topbar" data-od-id="topbar"><span>EP. 16 / 頁面置換</span>' +
      '<span><span class="odp-dots">' + dotsHtml + '</span>　<span class="odp-idx">00 / 10</span>' +
      '　<span class="odp-rec">● REC</span></span></div>' +
      '<div class="odp-year" data-od-id="year">置換<small> FIFO 先進先出 · LRU 最久未用 · 3 頁框 </small></div>' +
      '<div class="odp-refs" data-od-id="refs">' + refsHtml + '</div>' +
      '<div class="odp-frames" data-od-id="frames">' + framesHtml + '</div>' +
      '<div class="odp-victim" data-od-id="victim"><div class="k">下一个逐出</div><div class="arrow">▼</div></div>' +
      '<div class="odp-panel" data-od-id="panel">' +
      '<span class="odp-algo">FIFO</span>' +
      '<div class="odp-counts"><span class="ok">命中 <b>0</b></span>　<span class="bad">缺页 <b>0</b></span></div>' +
      '</div>' +
      '<div class="odp-ribbon" data-od-id="ribbon"><div class="odp-ribbon-track">' +
      '訪問串 7·0·1·2·0·3·0·4 · 命中 · 缺頁 · FIFO 逐出最先進入的 · LRU 逐出最久未用的 · Belady 異常 · ' +
      '訪問串 7·0·1·2·0·3·0·4 · 命中 · 缺頁 · FIFO 逐出最先進入的 · LRU 逐出最久未用的 · Belady 異常 · </div></div>' +
      '<div class="odp-caption" data-od-id="caption">页面置换：同一访问串，FIFO 与 LRU 谁被逐出不同——先看 FIFO 轮。</div>' +
      '</div>';
  }

  function mount() {
    var holder = document.getElementById("odp-holder");
    if (!holder || holder.querySelector(".odp-stage")) return;

    MOB = window.innerWidth < 640;     // 与 CSS 媒体查询同阈值
    FRAME_W = MOB ? 56 : 64;
    FRAME_GAP = MOB ? 18 : 18;

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    holder.innerHTML = buildHTML();

    /* 桌面窄容器：整体 zoom 适配（640–820px）；横竖屏翻转模式变化 → 重载 */
    var st = holder.querySelector(".odp-stage");
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

    els.caption = holder.querySelector(".odp-caption");
    els.idx = holder.querySelector(".odp-idx");
    els.dots = Array.prototype.slice.call(holder.querySelectorAll(".odp-dots span"));
    els.refs = Array.prototype.slice.call(holder.querySelectorAll(".odp-ref"));
    els.frames = Array.prototype.slice.call(holder.querySelectorAll(".odp-frame"));
    els.algo = holder.querySelector(".odp-algo");
    els.hits = holder.querySelector(".odp-counts .ok b");
    els.misses = holder.querySelector(".odp-counts .bad b");
    els.victim = holder.querySelector(".odp-victim");

    /* 页框在舞台中的绝对基准 x（避开 resize 复算，取一次 mount 时布局） */
    var fr = els.frames[0].getBoundingClientRect();
    var sr = holder.querySelector(".odp-stage").getBoundingClientRect();
    els.framesBaseX = (fr.left + fr.width / 2) - sr.left - frameX(0);
    els.victim.style.left = els.framesBaseX + frameX(0) + "px";

    S = freshState("FIFO");
    buildScript();
    refreshPanel();

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    setTimeout(function () {
      step();
      scheduleNext();
    }, 1100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
