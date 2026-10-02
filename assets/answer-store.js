/* ============================================================
 * answer-store.js — 作答记录存储（零依赖，可复用）
 *
 * 数据流：quiz.js 每答一题 → AnswerStore.record(整题快照) →
 *         localStorage（键 rkTeachAnswersV1）→ 错题本页读取整理。
 * localStorage 不可用时（部分 file:// 环境）自动退化为内存模式：
 * 当次会话仍可整理/导出，持久化请用「导出 JSON / 导入 JSON」。
 *
 * API：
 *   AnswerStore.record(payload)        // quiz.js 调用
 *   AnswerStore.all()                  // 全部作答记录（含历史尝试）
 *   AnswerStore.summary()              // { attempts, questions, wrong, solved, groups, lsOK }
 *   AnswerStore.exportJSON()           // 字符串（含全部历史）
 *   AnswerStore.importJSON(text)       // 合并导入（按 id 去重）→ {added, total}
 *   AnswerStore.clear()
 *   AnswerStore.lsOK()                 // 本地存储是否可用
 * ============================================================ */
(function (global) {
  "use strict";

  var KEY = "rkTeachAnswersV1";
  var mem = null;
  var lsOK = (function () {
    try {
      global.localStorage.setItem("__rk_test__", "1");
      global.localStorage.removeItem("__rk_test__");
      return true;
    } catch (e) { return false; }
  })();

  function load() {
    if (!lsOK) {
      if (!mem) { mem = []; }
      return mem;
    }
    try {
      return JSON.parse(global.localStorage.getItem(KEY) || "[]");
    } catch (e) { return []; }
  }

  function save(arr) {
    if (lsOK) {
      try { global.localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) { /* 满了等异常：静默，导出兜底 */ }
    } else {
      mem = arr;
    }
  }

  function record(p) {
    var arr = load();
    arr.push({
      id: [p.lesson, p.quiz, p.index, Date.now(), arr.length].join("|"),
      t: Date.now(),
      lesson: p.lesson || "未命名课程",
      quiz: p.quiz || "",
      index: p.index || 0,
      q: p.question.q,
      options: p.question.options,
      answer: p.question.answer,
      opts: p.question.opts || null,
      explain: p.question.explain || "",
      source: p.question.source || "",
      chosen: p.chosen,
      right: !!p.right
    });
    save(arr);
    return arr.length;
  }

  function all() { return load(); }

  /* 每道题（lesson|quiz|index）只看最新一次作答（时间戳相同取后写入者） */
  function latestByKey(arr) {
    var m = {};
    arr.forEach(function (r) {
      var k = r.lesson + "|" + r.quiz + "|" + r.index;
      if (!m[k] || m[k].t <= r.t) { m[k] = r; }
    });
    return m;
  }

  function summary() {
    var arr = load();
    var m = latestByKey(arr);
    var wrong = [], solved = [];
    Object.keys(m).forEach(function (k) {
      (m[k].right ? solved : wrong).push(m[k]);
    });
    var groups = {};
    Object.keys(m).forEach(function (k) {
      var r = m[k];
      var g = r.lesson + "::" + r.quiz;
      if (!groups[g]) { groups[g] = { lesson: r.lesson, quiz: r.quiz, total: 0, correct: 0 }; }
      groups[g].total += 1;
      if (r.right) { groups[g].correct += 1; }
    });
    return {
      attempts: arr.length,
      questions: Object.keys(m).length,
      wrong: wrong,
      solved: solved,
      groups: groups,
      lsOK: lsOK
    };
  }

  function exportJSON() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      records: load()
    });
  }

  function importJSON(text) {
    try {
      var data = JSON.parse(text);
      var recs = Array.isArray(data) ? data : (data.records || []);
      var arr = load();
      var ids = {};
      arr.forEach(function (r) { ids[r.id] = true; });
      var added = 0;
      recs.forEach(function (r) {
        if (r && r.id && !ids[r.id] && typeof r.q === "string") {
          arr.push(r); ids[r.id] = true; added += 1;
        }
      });
      save(arr);
      return { added: added, total: arr.length };
    } catch (e) {
      return { added: 0, error: String(e) };
    }
  }

  function clear() { save([]); }

  global.AnswerStore = {
    record: record,
    all: all,
    summary: summary,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clear: clear,
    lsOK: function () { return lsOK; }
  };
})(window);
