/* ============================================================
 * stack-queue.js — 栈与循环队列实验室（零依赖，可复用）
 *
 * StackQueue.mount(container, {
 *   tokens: [1,2,3,4,5],          // 进栈/入队元素顺序
 *   judge: [                       // 出栈序列判定卡
 *     { seq: [4,3,5,2,1], legal: true }, ...
 *   ],
 *   queueM: 5                      // 循环队列格数
 * })
 * 口径：循环队列 rear 指向队尾元素的下一位置；
 *      判满（牺牲一格）：(rear+1) % M == front；判空：front == rear；
 *      元素个数 = (rear - front + M) % M。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function setMsg(m, text, cls) {
    m.textContent = text;
    m.className = "lab-msg" + (cls ? " " + cls : "");
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("stack-queue: 容器不存在"); }
    root.classList.add("sq-lab");

    var tokens = cfg.tokens || [1, 2, 3, 4, 5];
    var M = cfg.queueM || 5;

    /* ---------- ① 栈：自由操作 ---------- */
    var sPanel = el("div", "lab-panel");
    sPanel.appendChild(el("h4", null, "① 栈：后进先出（自己点着玩）"));
    var sRow = el("div", "lab-row");
    sPanel.appendChild(sRow);
    var sOut = el("p", "sq-out");
    sPanel.appendChild(sOut);
    var sMsg = el("p", "lab-msg");
    sPanel.appendChild(sMsg);
    var sBtns = el("div", "lab-modes no-print");
    var btnPush = el("button", "btn ghost", "进栈下一个");
    var btnPop = el("button", "btn ghost", "出栈");
    var btnReset = el("button", "btn ghost", "↺ 清空");
    sBtns.appendChild(btnPush); sBtns.appendChild(btnPop); sBtns.appendChild(btnReset);
    sPanel.appendChild(sBtns);
    root.appendChild(sPanel);

    var stack = [], nextTok = 0, popped = [];
    function renderStack() {
      sRow.textContent = "";
      if (!stack.length) {
        sRow.appendChild(el("span", "lab-null", "（栈空）——出栈只能动这一侧 ↑"));
      } else {
        sRow.appendChild(el("span", "lab-null", "栈底 →"));
        stack.forEach(function (v) {
          var c = el("div", "lab-cell", String(v));
          c.appendChild(el("span", "lab-idx", " "));
          sRow.appendChild(c);
        });
        var top = sRow.lastChild;
        top.classList.add("hit");
        sRow.appendChild(el("span", "lab-arrow", "← 栈顶（" + stack[stack.length - 1] + "）"));
      }
      sOut.textContent = popped.length ? "已出栈序列：" + popped.join("，") : "已出栈序列：（还没有）";
      btnPush.textContent = "进栈下一个（" + (nextTok < tokens.length ? tokens[nextTok] : "用完") + "）";
    }
    btnPush.addEventListener("click", function () {
      if (nextTok >= tokens.length) { setMsg(sMsg, "元素全部进完了，只能出栈。", "badly"); return; }
      var v = tokens[nextTok++];
      stack.push(v);
      setMsg(sMsg, "进栈 " + v + "。栈顶现在是 " + stack[stack.length - 1] + "——后进先出，只能动栈顶这一头。");
      renderStack();
    });
    btnPop.addEventListener("click", function () {
      if (!stack.length) { setMsg(sMsg, "栈空（front==rear 式的判断题：栈空不能出栈）。", "badly"); return; }
      var v = stack.pop(); popped.push(v);
      setMsg(sMsg, "出栈 " + v + "——最后进的先出。已出序列：" + popped.join("，"));
      renderStack();
    });
    btnReset.addEventListener("click", function () {
      stack = []; nextTok = 0; popped = [];
      setMsg(sMsg, "已清空。自己造几个出栈序列，再到下面的判定卡验证理解。");
      renderStack();
    });

    /* ---------- ② 出栈序列判定卡 ---------- */
    var jPanel = el("div", "lab-panel");
    jPanel.appendChild(el("h4", null, "② 判定游戏：元素按 " + tokens.join("，") + " 顺序进栈，以下出栈序列合法吗？"));
    root.appendChild(jPanel);

    function simulate(seq) {
      var st = [], next = 1, steps = [];
      for (var i = 0; i < seq.length; i++) {
        while (st.length === 0 || st[st.length - 1] !== seq[i]) {
          if (next > tokens.length) {
            return "要出 " + seq[i] + " 时：栈顶是 " + (st.length ? st[st.length - 1] : "空") +
              "，且新元素已经进完——" + seq[i] + " 被压在栈里取不出来 → 不合法。";
          }
          st.push(next); steps.push("进" + next); next += 1;
        }
        st.pop(); steps.push("出" + seq[i]);
      }
      return "依次 " + steps.join(" → ") + " → 全部取出，合法。";
    }

    (cfg.judge || []).forEach(function (card, ci) {
      var box = el("div", "lab-panel sq-judge");
      box.appendChild(el("p", null, "")).appendChild(el("b", null, "序列 " + "ABC"[ci] + "：" + card.seq.join("，")));
      var row = el("div", "lab-modes no-print");
      var bYes = el("button", "btn ghost", "合法");
      var bNo = el("button", "btn ghost", "不合法");
      row.appendChild(bYes); row.appendChild(bNo);
      box.appendChild(row);
      var msg = el("p", "lab-msg");
      box.appendChild(msg);
      jPanel.appendChild(box);
      function answer(saidLegal) {
        bYes.disabled = true; bNo.disabled = true;
        var truth = simulate(card.seq).indexOf("不合法") === -1;
        var ok = (saidLegal === truth);
        msg.className = "lab-msg " + (ok ? "good" : "badly");
        msg.textContent = (ok ? "✓ 判断正确。" : "✗ 判断错了。") + " 亲自模拟一遍：" + simulate(card.seq);
      }
      bYes.addEventListener("click", function () { answer(true); });
      bNo.addEventListener("click", function () { answer(false); });
    });

    /* ---------- ③ 循环队列 ---------- */
    var qPanel = el("div", "lab-panel");
    qPanel.appendChild(el("h4", null, "③ 循环队列（" + M + " 格，牺牲一格判满）"));
    var qRow = el("div", "lab-row");
    qPanel.appendChild(qRow);
    var qMarks = el("div", "lab-row sq-marks");
    qPanel.appendChild(qMarks);
    var qStatus = el("p", "sq-qstatus");
    qPanel.appendChild(qStatus);
    var qMsg = el("p", "lab-msg");
    qPanel.appendChild(qMsg);
    var qBtns = el("div", "lab-modes no-print");
    var btnEn = el("button", "btn ghost", "入队下一个");
    var btnDe = el("button", "btn ghost", "出队");
    var btnQReset = el("button", "btn ghost", "↺ 重置");
    qBtns.appendChild(btnEn); qBtns.appendChild(btnDe); qBtns.appendChild(btnQReset);
    qPanel.appendChild(qBtns);
    root.appendChild(qPanel);

    var front = 0, rear = 0, cellsArr = [], tokenIdx = 0;
    function count() { return (rear - front + M) % M; }
    function renderQueue() {
      qRow.textContent = "";
      qMarks.textContent = "";
      for (var i = 0; i < M; i++) {
        var occupied = (cellsArr[i] !== null && cellsArr[i] !== undefined);
        var c = el("div", "lab-cell" + (occupied ? " visited" : ""), occupied ? String(cellsArr[i]) : "·");
        c.appendChild(el("span", "lab-idx", "格" + i));
        qRow.appendChild(c);
        var tag = [];
        if (i === front) { tag.push("front"); }
        if (i === rear) { tag.push("rear"); }
        qMarks.appendChild(el("span", "lab-idx", tag.length ? "↑" + tag.join("/↑") : " "));
      }
      qStatus.textContent = "front=" + front + "，rear=" + rear +
        "，元素个数 = (rear−front+" + M + ") mod " + M + " = " + count() +
        (count() === M - 1 ? "　【队满：牺牲了 1 格】" : (count() === 0 ? "　【队空】" : ""));
    }
    btnEn.addEventListener("click", function () {
      if (count() === M - 1) {
        setMsg(qMsg, "队满！(rear+1) mod " + M + " = " + ((rear + 1) % M) + " = front，不能再入。" +
          "『牺牲一格判满』：宁可永远空一格，换来判满判空条件不冲突——必考。", "badly");
        return;
      }
      if (tokenIdx >= tokens.length) { tokenIdx = 0; }
      var v = tokens[tokenIdx++];
      cellsArr[rear] = v;
      var at = rear;
      rear = (rear + 1) % M;
      setMsg(qMsg, "入队 " + v + " → 放进格" + at + "，rear = (rear+1) mod " + M + " = " + rear + "。当前个数 " + count() + "。");
      renderQueue();
    });
    btnDe.addEventListener("click", function () {
      if (count() === 0) {
        setMsg(qMsg, "队空：front == rear → 不能出队。", "badly");
        return;
      }
      var v = cellsArr[front];
      cellsArr[front] = null;
      front = (front + 1) % M;
      setMsg(qMsg, "出队 " + v + "，front = (front+1) mod " + M + " = " + front + "。当前个数 " + count() + "。");
      renderQueue();
    });
    btnQReset.addEventListener("click", function () {
      front = 0; rear = 0; cellsArr = []; tokenIdx = 0;
      setMsg(qMsg, "已重置。多入几个再出几个，盯住 front/rear 怎么『绕圈』——这就是循环的含义。");
      renderQueue();
    });

    renderStack();
    renderQueue();
  }

  global.StackQueue = { mount: mount, simulate: function (tokens, seq) { return null; } };
})(window);
