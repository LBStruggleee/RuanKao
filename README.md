# 软考软件设计师 · 备考复习站

> 🌐 **在线阅读（手机/电脑均可）**：**<https://lbstruggleee.github.io/RuanKao/>**
> 📅 考试时间：**2026 年 10 月 24 日** ｜ 🎯 目标：一次性通过软件设计师（中级）｜ 📊 基础：零基础 · 学习能力强
> 💡 本站内容仅供学习交流使用

一套**完整的软考软件设计师备考系统**：34 节交互课程（即时判分 + 逐选项解析）+ 全大纲知识点精讲 + 10 套历年真题（含逐题解析与勘误）+ 下午卷全部 5 道大题专项 + 自动记录的**错题本**。网站在线阅读，仓库保存全部源文件。

## 🌐 在线站点有什么

| 板块 | 内容 | 直达 |
|------|------|------|
| 🎓 交互课程（34 课） | 组成 3 课 → 程序语言 → 数据结构与算法 10 课 → 操作系统 6 课 → 数据库 3 课 → 网络 2 课 + 安全 → 软件工程 3 课 → 面向对象 3 课 → 保底 → 算法大题（新手友好顺序） | [课程总目录](https://lbstruggleee.github.io/RuanKao/reference/ds-learning-path.html) |
| 📖 知识点文档（89 篇全文） | docs/ 原资料 Markdown 的全文 HTML 版——大纲、科目精讲、计划、真题解析、策略，与原文件逐字一致 | [文档目录](https://lbstruggleee.github.io/RuanKao/pages/index.html) |
| 🔍 全站搜索 | 按关键词检索全部文档（纯前端，无需服务端） | [搜索](https://lbstruggleee.github.io/RuanKao/search.html) |
| 📓 错题本 | 每次作答自动记录，按题判定「待重做 / 已攻克」，支持只练错题、导出 Markdown/JSON | [错题本](https://lbstruggleee.github.io/RuanKao/reference/mistake-notebook.html) |
| 📚 知识点精讲 | OS / 网络 / 数据库 / 组成 / 软工 / 数据结构 全部笔记（Markdown 在线渲染 + 全站搜索） | 站内侧边栏「📚 知识点精讲」 |
| ✍️ 刷题与真题 | 2018–2023 上午卷 10 套（逐题解析、多源勘误）+ 下午卷大题专项 + 全真模拟 | 站内侧边栏「✍️ 刷题与真题」 |
| 🎯 应试策略 | 考试技巧 · 高频必考清单 · 速查手册 · 考前冲刺材料 | 站内侧边栏「🎯 应试策略」 |
| ⏱ 番茄钟 | 25 分钟专注 + 5 分钟休息：桌面为右侧 Liquid Glass 胶囊（≥1280px，可展开/收起），移动端为右下角小圆圈（点开屏幕中央弹窗）；深浅色双主题（默认跟随系统），站内跳页不丢计时 | 打开任意页面即见 |
| 📌📝 每日组件 | 右下角「必背考点」（42 条高频口诀/公式，翻面自测）+「每日一题」（30 道高频题，逐选项解析，自动进错题本），按日期轮换 + 随机换题 | 桌面端（≥1280px）右下角 |

交互课程特色：每个考点配**动手实验室**（磁盘调度模拟器、PV 操作模拟器、页面置换、索引容量/换算训练器、排序步进等），测验**逐选项解析**（选错告诉你错在哪、正确答案为什么对），作答自动进错题本。

## 📋 仓库结构

```
├── index.html                  # 静态首页（GitHub Pages）
├── search.html                 # 全站文档搜索（前端检索 search-index.json）
├── pages/                      # docs/ 原资料的全文 HTML 镜像（脚本生成，scripts/build_site.py）
├── scripts/build_site.py       # md → HTML 文档集生成脚本
├── lessons/                    # 交互课程（34 课，HTML，可独立打开）
├── reference/                  # 课程总目录 · 错题本 · 速查卡
├── assets/                     # 课程组件库（测验/模拟器/训练器/作答存储）
├── docs/                       # 知识点精讲 · 真题转录与解析 · 计划与策略
│   ├── exam-guide.md           # 考试大纲与格式详解
│   ├── schedule/               # 冲刺日程
│   ├── knowledge-points/       # 各科目知识点精讲（day01–day33）
│   ├── practice/               # 真题卷 · 大题专项 · 反思与清单
│   └── strategies/             # 应试策略
├── practice_dd/                # 真题 PDF 原件（本地持有，不入库）
└── tools/                      # 辅助工具脚本
```

## 📚 考试科目

| 科目 | 内容 | 题型 | 时间 |
|------|------|------|------|
| 基础知识（上午卷） | 数据结构、OS、网络、数据库、组成、软工、法规等 | 75 道选择题 | 150 分钟 |
| 应用技术（下午卷） | DFD、数据库设计、UML、算法填空、设计模式 | 5 道案例分析大题 | 210 分钟 |

## 📅 冲刺安排

学习顺序按交互课程序号（0001→0035）推进，知识框架见站内「🗺 知识体系」；阶段安排：核心知识 → 真题实战 → 大题专项 → 考前冲刺（日期按自己的开学起排）。

## 🔗 快速入口

- 🌐 **在线阅读**：<https://lbstruggleee.github.io/RuanKao/>
- 🎓 课程总目录：<https://lbstruggleee.github.io/RuanKao/reference/ds-learning-path.html>
- 📓 错题本：<https://lbstruggleee.github.io/RuanKao/reference/mistake-notebook.html>
- 📖 考试指南：[docs/exam-guide.md](docs/exam-guide.md)
- 📚 知识点精讲：[docs/knowledge-points/](docs/knowledge-points/)
- ✍️ 真题与解析：[docs/practice/](docs/practice/)

---

**34 课 + 10 套真题，足够改变结果 💪**
