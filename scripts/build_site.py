# -*- coding: utf-8 -*-
"""
build_site.py — 把 docs/ 下的原资料 Markdown 全文转换为静态 HTML 文档集（pages/），
并改写 lessons/、reference/ 中指向 .md 的链接。原资料 md 只读，本脚本只新增文件。

用法：python scripts/build_site.py
输出：pages/**.html、pages/index.html（文档目录）、search-index.json、search.html
"""
import io, os, re, json
import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
OUT = os.path.join(ROOT, "pages")
SITE = "https://lbstruggleee.github.io/RuanKao/"

MD_EXTS = ["tables", "fenced_code"]

NAV_TMPL = """<nav class="topnav">
  <a href="{rel_root}index.html">🏠 网站首页</a>
  <a href="{rel_self}index.html">📖 文档目录</a>
  <a href="{rel_root}reference/ds-learning-path.html">🎓 交互课程</a>
  <a href="{rel_root}reference/mistake-notebook.html">📓 错题本</a>
  <a href="{rel_root}search.html">🔍 搜索</a>
</nav>"""

BADGE = """<div id="rk-badge"></div>
<script>
(function () {
  var b = document.getElementById("rk-badge");
  function tick() {
    var d = Math.ceil((new Date(2026, 9, 24, 9, 0, 0) - Date.now()) / 86400000);
    b.textContent = d > 1 ? "📅 距 10/24 考试还有 " + d + " 天"
      : d === 1 ? "📅 明天考试，加油！" : d === 0 ? "📅 今天考试！"
      : "🏁 考试已结束，感谢使用本站";
  }
  tick(); setInterval(tick, 3600000);
})();
</script>"""


def read(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def find_title(md_text, fallback):
    for line in md_text.splitlines():
        if line.startswith("# "):
            t = line[2:].strip()
            return re.sub(r"[#*`]", "", t).strip()
    return fallback


def page_html(rel_to_root, title, crumb, body):
    depth = crumb.count(" 📁 ")
    rel_root = "../" * (depth + 1)   # 到仓库根（pages/docs/x.md → 根三层）
    rel_self = "../" * depth         # 到 pages/ 根（文档目录在此）
    src_path = "docs/" + crumb_to_path(crumb)
    return """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} · 软考软件设计师备考站</title>
<link rel="stylesheet" href="{rel_root}assets/base.css">
</head>
<body>
{nav}
<div class="page">
<div class="crumb">📖 文档 · {crumb}</div>
{body}
<div class="lesson-footer">
  <div class="nav">
    <a href="{rel_self}index.html">← 返回文档目录</a>
    <a href="{rel_root}reference/ds-learning-path.html">课程总目录</a>
    <a href="{rel_root}reference/mistake-notebook.html">错题本</a>
  </div>
  <p>内容由原资料 Markdown 全文转换生成（<a href="{gh}">{src_path}</a> 原文只读）。</p>
</div>
</div>
{badge}
</body>
</html>""".format(title=title, rel_root=rel_root, rel_self=rel_self, crumb=crumb, body=body,
                 nav=NAV_TMPL.format(rel_root=rel_root, rel_self=rel_self),
                 gh=SITE + "blob/main/" + src_path, src_path=src_path, badge=BADGE)


def crumb_to_path(crumb):
    return crumb.replace(" 📁 ", "/").replace(" 📄 ", "/")


def strip_md(text):
    t = re.sub(r"```[\s\S]*?```", " ", text)          # 代码块整体丢弃（ASCII 图无搜索价值）
    t = re.sub(r"`([^`]*)`", r"\1", t)                # 行内代码留内容
    t = re.sub(r"[#>*_\-\|\[\]()!]", " ", t)
    return re.sub(r"\s+", " ", t)


def main():
    converted = []  # (relpath_in_pages, title)
    for dirpath, dirnames, filenames in os.walk(DOCS):
        dirnames[:] = [d for d in dirnames if d != "superpowers"]  # 内部规划材料不上公开站
        dirnames.sort()
        for fn in sorted(filenames):
            if not fn.endswith(".md"):
                continue
            src = os.path.join(dirpath, fn)
            rel_docs = os.path.relpath(src, DOCS).replace("\\", "/")   # 如 knowledge-points/os/day03-disk.md
            rel_pages = rel_docs[:-3] + ".html"                          # pages/ 直接镜像 docs/ 结构
            out = os.path.join(OUT, rel_pages.replace("/", os.sep))
            text = read(src)
            title = find_title(text, os.path.splitext(fn)[0])
            body = markdown.markdown(text, extensions=MD_EXTS)
            body = re.sub(r'(href="[^"]*?)\.md(")', r"\1.html\2", body)  # md 互链 → html
            depth = rel_pages.count("/")
            rel_to_root = "../" * depth
            crumb = rel_docs.replace("/", " 📁 ")
            html = page_html(rel_to_root, title, crumb, body)
            write(out, html)
            converted.append((rel_pages, title, strip_md(text)))

    # ---- 文档目录页 pages/index.html ----
    groups = {}
    for path, title, _ in converted:
        parts = path.split("/")
        key = parts[0] if len(parts) > 1 else "(根)"   # 第一层目录
        groups.setdefault(key, []).append((path, title))
    order = ["(根)", "schedule", "knowledge-points", "practice", "strategies", "materials"]
    rows = []
    seen = set()
    for key in order + sorted(k for k in groups if k not in order):
        if key in seen or key not in groups:
            continue
        seen.add(key)
        rows.append("<h2>" + ("根目录文档" if key == "(根)" else key) + "</h2><ul>")
        for path, title in sorted(groups[key]):
            rows.append('<li><a href="' + path + '">' + title + "</a></li>")
        rows.append("</ul>")
    dir_body = ("<h1>📖 文档目录（原资料全文）</h1>"
                "<p>以下为 docs/ 原资料 Markdown 的全文 HTML 版，内容与原文件完全一致。</p>"
                + "".join(rows))
    write(os.path.join(OUT, "index.html"),
          page_html("../", "文档目录", "index", dir_body))

    # ---- 搜索索引 + 搜索页 ----
    idx = [{"url": p, "title": t, "text": x} for (p, t, x) in converted]
    write(os.path.join(ROOT, "search-index.json"),
          json.dumps(idx, ensure_ascii=False))
    write(os.path.join(ROOT, "search.html"), SEARCH_HTML)

    # ---- lessons/ reference/ 中指向原资料 .md 的链接改写为 pages/ .html ----
    rewritten = 0
    for folder in ("lessons", "reference"):
        for dirpath, _, filenames in os.walk(os.path.join(ROOT, folder)):
            for fn in filenames:
                if not fn.endswith(".html"):
                    continue
                p = os.path.join(dirpath, fn)
                s = read(p)
                s2 = re.sub(r"(\.\./docs/[^\"#]+?)\.md(\"|#)", r"\1.html\2", s)
                s2 = re.sub(r"(\.\./docs/[^\"#]+?)\.html(\"|#)", r"../pages/\1.html\2", s2)
                if s2 != s:
                    write(p, s2)
                    rewritten += 1
    print("转换 md 页数: %d；改写链接的课程/参考页: %d" % (len(converted), rewritten))


SEARCH_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>搜索 · 软考软件设计师备考站</title>
<link rel="stylesheet" href="assets/base.css">
</head>
<body>
<div class="page">
<h1>🔍 全站文档搜索</h1>
<p><input id="q" type="text" placeholder="输入关键词，如：子网、候选码、Belady…"
   style="width:min(100%,28rem);padding:.5rem .7rem;font-size:1rem;"></p>
<div id="out"></div>
<p><a href="index.html">← 返回网站首页</a> ｜ <a href="pages/index.html">📖 文档目录</a></p>
</div>
<script>
var IDX = null;
fetch("search-index.json").then(function (r) { return r.json(); }).then(function (d) {
  IDX = d; document.getElementById("q").focus();
});
function run() {
  var q = document.getElementById("q").value.trim().toLowerCase();
  var out = document.getElementById("out");
  out.textContent = "";
  if (!IDX || !q) { return; }
  var hits = [];
  for (var i = 0; i < IDX.length; i++) {
    var it = IDX[i];
    var t = (it.title + " " + it.text).toLowerCase();
    if (t.indexOf(q) >= 0) { hits.push(it); if (hits.length >= 50) break; }
  }
  out.appendChild(Object.assign(document.createElement("p"), { textContent: "共 " + hits.length + " 条结果" }));
  hits.forEach(function (it) {
    var d = document.createElement("div"); d.className = "card";
    var a = document.createElement("a"); a.href = it.url; a.textContent = it.title; a.style.fontWeight = "700";
    d.appendChild(a);
    var p = document.createElement("p");
    var pos = it.text.toLowerCase().indexOf(q);
    p.textContent = "…" + it.text.slice(Math.max(0, pos - 40), pos + 80) + "…";
    d.appendChild(p);
    out.appendChild(d);
  });
}
document.getElementById("q").addEventListener("input", run);
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
