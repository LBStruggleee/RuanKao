/* ============================================================
 * blank-trainer.js — 代码填空推演器（下午卷试题四特训，零依赖）
 *
 * BlankTrainer.mount(container, { items: [...] })
 * items: [{
 *   title: "二分查找",
 *   code:  "mid = ____【(1)】____;\n...",        // 代码，空位用 ____【(n)】____ 标记
 *   blanks: [{
 *     id: "(1)",
 *     options: ["A 形式", ...],                  // 选项（等长，勿泄格式）
 *     answer: 1,
 *     opts: ["错因…", "✓ 为什么对…", ...],       // 逐选项解析
 *     explain: "总推导"
 *   }],
 *   source: "出处"
 * }]
 * 每个空自动记入 AnswerStore（错题本）；答完显示逐项解析。
 * ============================================================ */
(function (global) {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function mount(container, cfg) {
    var root = (typeof container === "string") ? document.getElementById(container) : container;
    if (!root) { throw new Error("blank-trainer: 容器不存在"); }
    root.classList.add("bt");

    var recordSeq = 0;

    (cfg.items || []).forEach(function (item, ii) {
      var panel = el("div", "lab-panel bt-item");
      panel.appendChild(el("h4", null, "例 " + (ii + 1) + "：" + item.title));
      if (item.intro) { panel.appendChild(el("p", "lab-msg", item.intro)); }

      // 代码区：把 ____【(n)】____ 高亮成空位标记
      var pre = el("pre", "bt-code");
      var html = escapeHtml(item.code).replace(
        /_{4}【((?:\(\d+\)))】_{4}/g,
        '<span class="bt-blank" data-blank="$1">$1</span>'
      );
      pre.innerHTML = html;
      panel.appendChild(pre);

      // 逐空作答卡
      (item.blanks || []).forEach(function (blank, bi) {
        var card = el("div", "lab-panel bt-blankcard");
        card.appendChild(el("p", null, "")).appendChild(
          el("b", null, "空 " + blank.id + "：它应该填什么？")
        );
        var optsBox = el("div", "q-options");
        var feedback = el("div", "q-explain");
        var locked = false;

        blank.options.forEach(function (optText, oi) {
          var btn = el("button", "q-option", "ABCDEFGH".charAt(oi) + ". " + optText);
          btn.addEventListener("click", function () {
            if (locked) { return; }
            locked = true;
            var isRight = (oi === blank.answer);

            Array.prototype.forEach.call(optsBox.children, function (b, bi2) {
              b.disabled = true;
              if (bi2 === blank.answer) { b.classList.add("correct"); }
            });
            if (!isRight) { btn.classList.add("wrong"); }

            if (isRight) {
              feedback.appendChild(el("b", null, "✓ 答对了。 "));
            } else {
              feedback.appendChild(el("b", null, "✗ 你选了 " + optText + "。 "));
              if (blank.opts && blank.opts[oi]) {
                feedback.appendChild(el("span", "q-whywrong", "该项错在这里：" + blank.opts[oi] + " "));
              }
            }
            if (blank.opts && blank.opts[blank.answer]) {
              feedback.appendChild(el("span", "q-whyright",
                "✓ 正确答案：" + blank.options[blank.answer] + "：" + blank.opts[blank.answer] + " "));
            }
            if (blank.explain) {
              feedback.appendChild(el("span", "q-derive", "推导/要点：" + blank.explain));
            }
            feedback.classList.add(isRight ? "good" : "badly");
            feedback.classList.add("show");

            // 高亮代码里的对应空位
            var mark = pre.querySelector('[data-blank="' + blank.id + '"]');
            if (mark) { mark.classList.add(isRight ? "ok" : "bad"); }

            if (global.AnswerStore && global.AnswerStore.record) {
              try {
                global.AnswerStore.record({
                  lesson: cfg.lessonId || String(document.title || "未命名课程").split("·")[0].trim(),
                  quiz: "代码填空推演器：" + item.title,
                  index: recordSeq++,
                  question: {
                    q: "【代码填空】" + item.title + " 空" + blank.id + "\n" + item.code,
                    options: blank.options, answer: blank.answer,
                    opts: blank.opts || null,
                    explain: blank.explain || "", source: item.source || ""
                  },
                  chosen: oi,
                  right: isRight
                });
              } catch (e) { /* 记录失败不阻断 */ }
            }
          });
          optsBox.appendChild(btn);
        });

        card.appendChild(optsBox);
        card.appendChild(feedback);
        panel.appendChild(card);
      });

      if (item.source) {
        panel.appendChild(el("p", "q-source", "出处：" + item.source));
      }
      root.appendChild(panel);
    });
  }

  global.BlankTrainer = { mount: mount };
})(window);
