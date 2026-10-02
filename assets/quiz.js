/* ============================================================
 * quiz.js — teach 课程可复用测验组件（零依赖）
 *
 * 用法：
 *   <div id="quiz1"></div>
 *   <script src="../assets/quiz.js"></script>
 *   <script>
 *     Quiz.render("quiz1", {
 *       title: "随堂检索练习",
 *       passNote: "≥ 9/11",
 *       shuffle: true,                        // 可选：渲染时随机打乱选项顺序（防背答案位）
 *       questions: [
 *         { q: "题干",
 *           options: ["…","…","…","…"],      // 选项（保持等长，避免格式提示）
 *           answer: 1,                        // 正确选项下标（0 起）
 *           opts: ["A 错因…","B 为什么对…",…], // 可选：逐选项解析（与 options 等长，按内容引用、不写字母）
 *           explain: "总解析/推导过程",        // 可选
 *           source: "出处" }                  // 可选
 *       ],
 *       onDone: function (score, total) { ... }   // 回调，可选
 *     });
 *   </script>
 *
 * 反馈行为：
 *   - 答错：指出「你选了哪项 + 该项错在哪里」，再给「正确答案为什么正确」；
 *   - 答对：给出该选项为什么正确的解析；
 *   - 每题均可展开「全部选项逐项解析」复盘。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function letter(i) { return "ABCDEFGH".charAt(i); }

  function shuffledPerm(n) {
    var p = [];
    for (var i = 0; i < n; i++) { p.push(i); }
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = p[j]; p[j] = p[k]; p[k] = t;
    }
    return p;
  }

  function render(containerId, cfg) {
    var root = document.getElementById(containerId);
    if (!root) { throw new Error("quiz: 容器不存在 #" + containerId); }
    root.classList.add("quiz");

    var questions = cfg.questions || [];
    var state = { score: 0, answered: 0 };

    if (cfg.title) {
      root.appendChild(el("h3", null, cfg.title));
    }

    questions.forEach(function (item, qi) {
      var card = el("div", "quiz-q");
      var head = el("p", "q-text");
      head.appendChild(el("span", "q-no", "Q" + (qi + 1) + "."));
      head.appendChild(document.createTextNode(item.q));
      card.appendChild(head);

      var optsBox = el("div", "q-options");
      var feedback = el("div", "q-explain");
      var locked = false;

      // perm[显示位] = 实际下标；shuffle 时随机化，否则恒等
      var perm = (cfg.shuffle) ? shuffledPerm(item.options.length)
                               : item.options.map(function (_, i) { return i; });
      var invPerm = [];
      perm.forEach(function (actual, ri) { invPerm[actual] = ri; });

      function optionLabel(actualIndex) {
        return letter(invPerm[actualIndex]) + ". " + item.options[actualIndex];
      }

      perm.forEach(function (actual, ri) {
        var btn = el("button", "q-option", letter(ri) + ". " + item.options[actual]);
        btn.addEventListener("click", function () {
          if (locked) { return; }
          locked = true;
          var isRight = (actual === item.answer);
          if (isRight) { state.score += 1; }

          // —— 自动记录本次作答（错题本数据源；失败不影响作答） ——
          if (global.AnswerStore && global.AnswerStore.record) {
            try {
              global.AnswerStore.record({
                lesson: cfg.lessonId || String(document.title || "未命名课程").split("·")[0].trim(),
                quiz: cfg.title || containerId,
                index: qi,
                question: {
                  q: item.q, options: item.options, answer: item.answer,
                  opts: item.opts || null, explain: item.explain || "", source: item.source || ""
                },
                chosen: actual,
                right: isRight
              });
            } catch (e) { /* 记录失败不阻断答题 */ }
          }

          Array.prototype.forEach.call(optsBox.children, function (b, bi) {
            b.disabled = true;
            if (bi === invPerm[item.answer]) { b.classList.add("correct"); }
          });
          if (!isRight) { btn.classList.add("wrong"); }

          // —— 逐选项详细反馈 ——
          if (isRight) {
            feedback.appendChild(el("b", null, "✓ 答对了。 "));
            if (item.opts && item.opts[item.answer]) {
              feedback.appendChild(document.createTextNode(item.opts[item.answer] + " "));
            }
          } else {
            feedback.appendChild(el("b", null, "✗ 你选了 " + letter(ri) + ". " + item.options[actual] + "。 "));
            if (item.opts && item.opts[actual]) {
              feedback.appendChild(el("span", "q-whywrong", "该项错在这里：" + item.opts[actual] + " "));
            }
            if (item.opts && item.opts[item.answer]) {
              feedback.appendChild(el("span", "q-whyright",
                "✓ 正确答案是 " + optionLabel(item.answer) + "：" + item.opts[item.answer] + " "));
            } else {
              feedback.appendChild(el("span", "q-whyright",
                "✓ 正确答案是 " + optionLabel(item.answer) + "（已标绿）。 "));
            }
          }
          if (item.explain) {
            feedback.appendChild(el("span", "q-derive", "推导/要点：" + item.explain));
          }
          feedback.classList.add(isRight ? "good" : "badly");
          feedback.classList.add("show");

          if (item.source) {
            card.appendChild(el("p", "q-source", "出处：" + item.source));
          }

          // —— 全部选项逐项解析（复盘用） ——
          if (item.opts) {
            var all = el("details", "q-all");
            all.appendChild(el("summary", null, "展开全部选项的逐项解析（复盘用）"));
            var ul = el("ul");
            perm.forEach(function (a, displayIdx) {
              var li = el("li", a === item.answer ? "ok" : null);
              li.textContent = (a === item.answer ? "✓ " : "✗ ") + letter(displayIdx) + ". " + item.options[a] + "：" + item.opts[a];
              ul.appendChild(li);
            });
            all.appendChild(ul);
            card.appendChild(all);
          }

          state.answered += 1;
          if (state.answered === questions.length) { finish(); }
        });
        optsBox.appendChild(btn);
      });

      card.appendChild(optsBox);
      card.appendChild(feedback);
      root.appendChild(card);
    });

    function finish() {
      var total = questions.length;
      var box = el("div", "quiz-score");
      var line1 = el("p");
      line1.appendChild(el("span", "big", state.score + " / " + total));
      line1.appendChild(document.createTextNode("　" + (cfg.passNote ? "（目标：" + cfg.passNote + "）" : "")));
      box.appendChild(line1);

      var ratio = state.score / total;
      var msg;
      if (ratio >= 0.85) {
        msg = "非常稳。这个考点可以进入「只错题回看」状态，把时间投给更弱的地方。";
      } else if (ratio >= 0.7) {
        msg = "达标。把答错题的出处章节重读一遍，今晚错题时段登记到 reflection.md。";
      } else {
        msg = "还没到位。先回看本组对应章节再点「重做本组」，重做全对后再回原资料练习。";
      }
      box.appendChild(el("p", null, msg));
      if (ratio < 0.7) {
        box.appendChild(el("p", null, "⚠️ 建议把本组得分记入 docs/practice/reflection.md 今日错题区（题目→错因→正确思路→知识点），并回填 tracker 正确率。"));
      }

      var retry = el("button", "btn ghost", "重做本组");
      retry.addEventListener("click", function () {
        var parent = root.parentNode;
        var fresh = root.cloneNode(false);
        parent.replaceChild(fresh, root);
        render(containerId, cfg);
        if (cfg.onRetry) { cfg.onRetry(); }
      });
      box.appendChild(retry);
      var nb = el("p", null, "");
      var nbLink = el("a", null, "📓 本组成绩已自动记入错题本（查看 / 导出 / 只练错题）");
      nbLink.href = "../reference/mistake-notebook.html";
      nb.appendChild(nbLink);
      box.appendChild(nb);
      root.appendChild(box);
      box.classList.add("show");
      if (cfg.onDone) { cfg.onDone(state.score, total); }
    }
  }

  global.Quiz = { render: render };
})(window);
