# -*- coding: utf-8 -*-
"""生成 search-index.json 与 sitemap.xml —— 内容改动后跑一次：
   python tools/build-index.py
"""
import re, os, json, html, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://lbstruggleee.github.io/RuanKao/"
SUFFIX = " · 软考软件设计师备考站"

def extract(path):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'<title>([^<]*)</title>', s)
    title = html.unescape(m.group(1)).strip() if m else ""
    if title.endswith(SUFFIX): title = title[:-len(SUFFIX)].strip()
    body = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', s)
    body = re.sub(r'<[^>]+>', ' ', body)
    body = html.unescape(re.sub(r'\s+', ' ', body)).strip()
    return title, body[:20000]

entries, urls = [], []
for rel in sorted(os.listdir('.')):
    pass
walk = []
for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('.git', '.shots', 'node_modules', 'resource', 'tools')]
    for f in files:
        if f.endswith('.html'):
            walk.append(os.path.relpath(os.path.join(root, f), ROOT).replace(chr(92), '/'))
walk.sort(key=lambda p: (p != 'index.html', p))
for rel in walk:
    if rel == 'search.html': continue
    title, text = extract(os.path.join(ROOT, rel))
    if not title: continue
    entries.append({"url": rel, "title": title, "text": text})
    urls.append(rel)

with open(os.path.join(ROOT, 'search-index.json'), 'w', encoding='utf-8', newline='\n') as f:
    json.dump(entries, f, ensure_ascii=False, separators=(',', ':'))

sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url><loc>' + BASE + '</loc></url>']
for u in urls:
    sm.append('  <url><loc>' + BASE + u + '</loc></url>')
sm.append('</urlset>')
with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(sm) + '\n')
print("search-index:", len(entries), "条 | sitemap:", len(urls) + 1, "个 URL")
