# 软考软件设计师 34 天冲刺计划（方案 A：以题带学 + 每日双线）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 2026-10-24 的软考中级软件设计师考试中，通过"以题带学 + 每日双线"策略，34 天内把弱项（OS/网络/数据库/组成/软工）提升到稳过 45 分线的水平，同时保住数据结构强项。

**Architecture:** 每天 7 小时分为"输入（3h）→ 刷题（2.5h）→ 反馈（1.5h）"三段，知识学习与对应章节真题同日绑定，用题目暴露盲区再回头补知识。强项数据结构只做验证不系统学，省出的时间全给弱项。每 3-4 天插入一个"错题回归日"作为缓冲与二轮复习。

**Tech Stack:** 教材/辅导书 + 视频课程 + 历年真题题库 + 本仓库（docs/）作为笔记与错题载体，git commit 打卡。

**Spec:** `docs/superpowers/plans/2026-09-20-34-day-exam-sprint.md`（本文件；设计基准见下"全局约束"）

## 全局约束（设计基准，每个任务默认遵守）

- **考试日期**：2026-10-24（周六）；**学习日 9/21 - 10/23 共 33 天**，10/24 为考试日不安排学习。
- **每日时长**：6-8 小时，标准节奏 = 上午 3h + 下午 2.5h + 晚上 1.5h = 7h；状态好可加到 8h，状态差保底 5h 但不可为 0。
- **基础画像**：有零散基础。强项 = 数据结构与算法（不系统学，仅验证）；弱项 = 操作系统、计算机网络、数据库、计算机组成、软件工程与设计（重点投入）。
- **合格线**：科目一（75 选择）与科目二（4 道大题）**各 45 分**即合格。目标定在"选择 55+ / 大题 50+（折算前）"，策略是先保 45 再冲高。
- **每日双线**：知识输入与对应章节题必须在**同一天**绑定，不允许"只学不练"或"只练不学"。
- **错题管理**：每道错题记录 `题目 → 错因 → 正确思路 → 知识点` 四要素，当晚回顾，隔日在"回归日"重做。
- **打卡纪律**：每天学习结束前更新 `docs/practice/tracker.md` 并 git commit，commit message 统一为 `day-N: <一句话内容>`。
- **休息**：每周至少半天完全休息（建议周日晚上），防止后期崩盘。

## Review Focus（最可能翻车的 5 个点，及应对）

1. **数据结构被误判为强项后失血** → Day 1 必须先做一套数据结构真题验证；正确率 < 80% 立刻触发 Day 14 补漏，不可跳过。
2. **前 3 天错题太多导致心态崩** → 错题是"以题带学"的燃料，Day 1 明确记录"错题数 = 收获数"，回归日重做看进步。
3. **大题（科目二）训练太晚** → Phase 3 专项（Day 27-29）之前，Phase 2 每个回归日已插入大题单项入门，避免最后手生。
4. **计划被突发事件打断** → 每个 Phase 内置回归日，回归日 = 天然缓冲；落后不超过 1 天直接在回归日消化，超过 1 天则压缩 Phase 4 的复习强度而非砍掉真题。
5. **只做题不回顾，错题反复错** → 回归日重做错题是**硬性要求**， tracker.md 记录"错题重做正确率"，低于 70% 的知识点升级为二轮重点。

---

## Phase 1：以题带学，弱项扫盲（Day 1-14，9/21 - 10/4）

**目标**：5 个弱项各建立"知识框架 + 章节题反馈"的闭环；数据结构完成验证。
**每日固定时间块**：

| 时间 | 时长 | 内容 |
|------|------|------|
| 08:30-11:30 | 3h | 新知识输入（教材对应章节 / 视频课）+ 整理笔记 |
| 14:00-16:30 | 2.5h | 当天科目对应章节真题（题库按章节筛选） |
| 19:30-21:00 | 1.5h | 错题四要素整理 + 当天笔记回顾 + tracker 打卡 |

### Task 1: Day 1（9/21）操作系统①：进程管理 + 数据结构强项验证

**Files:**
- Modify: `docs/practice/tracker.md`（每日打卡行）
- Modify: `docs/practice/reflection.md`（错题记录）
- Create: `docs/knowledge-points/os/day01-process.md`（进程管理笔记）

**Interfaces:** 产出的错题记录格式为后续所有天的模板。

- [ ] **Step 1（上午 1h）：数据结构强项验证**

做一套数据结构章节真题（约 30 题，从题库按"数据结构与算法"标签抽取），计时 40 分钟，记录正确率到 tracker.md。

- [ ] **Step 2（上午判定）：根据正确率决定数据策略**

正确率 ≥ 80% → 数据结构跳过系统学习，仅 Day 14 补漏；< 80% → 在 Day 14 之外，每天的晚上 1.5h 抽 30 分钟补数据结构薄弱点。把判定结果写入 reflection.md。

- [ ] **Step 3（上午 2h）：操作系统 - 进程与线程**

学进程五状态模型、进程 vs 线程、进程调度算法，整理到 `docs/knowledge-points/os/day01-process.md`。

- [ ] **Step 4（下午 2.5h）：PV 操作章节题 + 进程管理章节题**

先学信号量与 PV 操作、生产者-消费者/读者-写者经典模型（30 分钟），再刷章节题 20-25 道。**PV 操作大题做 1 道**（这是科目二高频考点）。

- [ ] **Step 5（晚上 1.5h）：错题四要素整理 + 打卡**

错题按 `题目 → 错因 → 正确思路 → 知识点` 记入 reflection.md；更新 tracker.md；提交：

```bash
git add docs/
git commit -m "day-1: OS进程管理 + 数据结构验证(正确率__%)"
```

### Task 2: Day 2（9/22）操作系统②：内存管理

**Files:**
- Create: `docs/knowledge-points/os/day02-memory.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 3h）：内存管理知识输入**

页式存储（页表、地址转换）、段式存储、虚拟内存、页面置换算法（FIFO/LRU/OPT/Clock）、缺页中断。**地址转换计算必须手算 3 遍以上**，这是必考计算题。笔记写入 day02-memory.md。

- [ ] **Step 2（下午 2.5h）：内存管理章节题 20 道 + 地址转换计算题 3 道**

- [ ] **Step 3（晚上 1.5h）：错题整理 + 回顾昨天进程管理错题（隔日重复）+ 打卡**

```bash
git commit -m "day-2: OS内存管理 + 地址转换计算"
```

### Task 3: Day 3（9/23）操作系统③：磁盘调度与文件系统 + OS 阶段收尾

**Files:**
- Create: `docs/knowledge-points/os/day03-disk.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 2h）：磁盘调度算法**

FCFS/SSTF/SCAN/C-SCAN，手算 1 道寻道时间题；文件逻辑/物理结构、索引文件、文件目录。

- [ ] **Step 2（上午 1h）：OS 整张知识框架图**

画一张覆盖进程/内存/磁盘/文件的 OS 思维导图，存入 day03-disk.md。这是后续冲刺阶段的复习材料。

- [ ] **Step 3（下午 2.5h）：OS 综合章节题 25 道（跨知识点混合）**

- [ ] **Step 4（晚上 1.5h）：OS 三天错题总回顾 + 标记仍错的知识点 + 打卡**

```bash
git commit -m "day-3: OS磁盘与文件系统 + OS阶段框架图"
```

### Task 4: Day 4（9/24）计算机网络①：协议与模型

**Files:**
- Create: `docs/knowledge-points/networks/day04-protocols.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 3h）：网络分层模型**

OSI 七层 vs TCP/IP 四层对照表（必背）、各层功能与代表协议、封装/解封装过程、HTTP/HTTPS/FTP/SMTP/DNS/ARP 工作层级。笔记写入 day04-protocols.md。

- [ ] **Step 2（下午 2.5h）：网络基础章节题 20 道 + 层级判断题专项**

- [ ] **Step 3（晚上 1.5h）：错题整理 + 打卡**

```bash
git commit -m "day-4: 网络分层模型与协议"
```

### Task 5: Day 5（9/25）计算机网络②：TCP/IP 与子网划分（重点）

**Files:**
- Create: `docs/knowledge-points/networks/day05-tcp.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 1.5h）：TCP 连接管理**

三次握手/四次挥手全过程（画图）、滑动窗口、拥塞控制（慢开始/拥塞避免/快重传/快恢复）。

- [ ] **Step 2（上午 1.5h）：子网划分计算（重点！）**

CIDR、子网掩码计算、IP 地址划分。整理"子网划分计算模板"（5 步法）到 day05-tcp.md。

- [ ] **Step 3（下午 2.5h）：TCP + 子网划分章节题 20 道，其中子网计算至少 5 道，全部用模板手算**

- [ ] **Step 4（晚上 1.5h）：错题整理 + 打卡**

```bash
git commit -m "day-5: TCP连接管理 + 子网划分计算模板"
```

### Task 6: Day 6（9/26）计算机网络③：网络安全 + 网络阶段收尾

**Files:**
- Create: `docs/knowledge-points/networks/day06-security.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 1.5h）：信息安全基础**

对称/非对称加密、数字签名、报文摘要（MD5/SHA）、HTTPS 握手、常见攻击（SQL 注入/XSS/DDoS）与防御、防火墙。

- [ ] **Step 2（上午 1.5h）：网络知识框架图**

画网络阶段思维导图（分层 + 协议 + 子网计算 + 安全），存入 day06-security.md。

- [ ] **Step 3（下午 2.5h）：信息安全章节题 15 道 + 网络综合题 10 道**

- [ ] **Step 4（晚上 1.5h）：网络三天错题总回顾 + 打卡**

```bash
git commit -m "day-6: 信息安全 + 网络阶段框架图"
```

### Task 7: Day 7（9/27）数据库①：关系模型与 SQL

**Files:**
- Create: `docs/knowledge-points/databases/day07-sql.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 3h）：关系代数与 SQL**

关系运算（选择/投影/连接/除运算）、SQL 全套（SELECT/FROM/WHERE/GROUP BY/HAVING/ORDER BY、子查询、JOIN、聚合函数）。整理 SQL 语法要点与陷阱表到 day07-sql.md。

- [ ] **Step 2（下午 2.5h）：SQL 章节题 20 道 + 关系代数题 5 道**

- [ ] **Step 3（晚上 1.5h）：错题整理 + 打卡**

```bash
git commit -m "day-7: 关系代数与SQL"
```

### Task 8: Day 8（9/28）数据库②：范式与 E-R 图（大题核心）

**Files:**
- Create: `docs/knowledge-points/databases/day08-er.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 2h）：范式判断**

1NF/2NF/3NF/BCNF 定义与判断流程（整理成流程图）。函数依赖、部分依赖、传递依赖的判别。

- [ ] **Step 2（上午 1h）：E-R 图**

实体/属性/联系（1:1 / 1:N / M:N）、E-R 图转关系模式规则。画 2 个完整 E-R 图示例。

- [ ] **Step 3（下午 2.5h）：范式判断题 15 道 + E-R 图大题 1 道（完整画出并转关系模式）**

- [ ] **Step 4（晚上 1.5h）：错题整理 + 打卡**

```bash
git commit -m "day-8: 范式判断流程 + E-R图大题"
```

### Task 9: Day 9（9/29）数据库③：数据库阶段收尾 + 阶段性测验

**Files:**
- Create: `docs/knowledge-points/databases/day09-summary.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`, `docs/practice/knowledge-checklist.md`

- [ ] **Step 1（上午 1h）：数据库知识框架图**

- [ ] **Step 2（上午 2h）：第一阶段小测验**

做一套"OS + 网络 + 数据库"三科混合的选择题（约 45 题，从题库按这三个标签组卷），计时 60 分钟。

- [ ] **Step 3（下午 2.5h）：测验逐题分析**

按知识点统计正确率，写入 `docs/practice/knowledge-checklist.md`（这份清单是 Phase 2 的导航）。正确率 < 60% 的知识点标记为"二轮重点"。

- [ ] **Step 4（晚上 1.5h）：三天错题总回顾 + 打卡**

```bash
git commit -m "day-9: 数据库阶段收尾 + 阶段1测验(正确率__%)"
```

### Task 10: Day 10（9/30）计算机组成①：CPU、指令与寻址

**Files:**
- Create: `docs/knowledge-points/architecture/day10-cpu.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 3h）：组成原理核心**

CPU 组成（ALU/控制器/寄存器/指令流水线）、指令格式、寻址方式（立即/直接/间接/寄存器/基址/变址）、指令流水线计算（流水线周期、加速比、吞吐率）。**流水线计算手算 3 遍**。

- [ ] **Step 2（下午 2.5h）：组成原理章节题 20 道 + 流水线/寻址计算题 5 道**

- [ ] **Step 3（晚上 1.5h）：错题整理 + 打卡**

```bash
git commit -m "day-10: CPU组成/指令/寻址/流水线"
```

### Task 11: Day 11（10/1）计算机组成②：存储体系与总线 + 阶段收尾

**Files:**
- Create: `docs/knowledge-points/architecture/day11-cache.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 2h）：存储体系**

Cache 工作原理、三种映射方式（直接/全相联/组相联）对比、Cache 命中率计算、虚拟存储与 Cache 关系、总线分类。

- [ ] **Step 2（上午 1h）：组成知识框架图**

- [ ] **Step 3（下午 2.5h）：组成章节题 20 道 + Cache 命中率计算题 3 道**

- [ ] **Step 4（晚上 1.5h）：错题回顾 + 打卡**

```bash
git commit -m "day-11: 存储体系/Cache/总线 + 组成阶段框架图"
```

### Task 12: Day 12（10/2）软件工程①：过程模型与需求分析

**Files:**
- Create: `docs/knowledge-points/software-engineering/day12-process.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 3h）：软件过程**

瀑布/增量/螺旋/原型/V 模型/敏捷（Scrum）对比表（必考）、软件生命周期、需求分析、结构化分析方法（数据流图 DFD）。

- [ ] **Step 2（下午 2.5h）：软件工程章节题 20 道**

- [ ] **Step 3（晚上 1.5h）：错题整理 + 打卡**

```bash
git commit -m "day-12: 过程模型对比 + 结构化分析"
```

### Task 13: Day 13（10/3）软件工程②：设计、测试与项目管理

**Files:**
- Create: `docs/knowledge-points/software-engineering/day13-test.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`

- [ ] **Step 1（上午 3h）：设计与测试**

面向对象设计原则、耦合/内聚分级、测试方法（黑盒/白盒）、逻辑覆盖与路径测试、软件维护类型、项目管理基础（甘特图/风险分析）。

- [ ] **Step 2（下午 2.5h）：测试与设计章节题 20 道 + 路径测试题 3 道**

- [ ] **Step 3（晚上 1.5h）：错题整理 + 打卡**

```bash
git commit -m "day-13: 设计原则/测试方法/项目管理"
```

### Task 14: Day 14（10/4）数据结构补漏 + Phase 1 总收尾（缓冲日）

**Files:**
- Modify: `docs/knowledge-points/data-structures/index.md`
- Modify: `docs/practice/tracker.md`, `docs/practice/reflection.md`, `docs/practice/knowledge-checklist.md`

- [ ] **Step 1（上午 2h）：数据结构补漏**

按 Day 1 验证结果补薄弱点（树遍历/图算法/排序稳定性/哈希冲突处理等），更新 `docs/knowledge-points/data-structures/index.md`。

- [ ] **Step 2（上午 1h）：Phase 1 全部错题筛查**

翻 reflection.md，把"错过 2 次以上"的知识点列入 knowledge-checklist.md 的"二轮重点"区。

- [ ] **Step 3（下午 2.5h）：Phase 1 综合测验**

组一套覆盖全部 6 科的选择题（60 题），计时 90 分钟。

- [ ] **Step 4（晚上 1.5h）：测验分析 + 更新二轮重点清单 + 打卡**

```bash
git commit -m "day-14: 数据结构补漏 + Phase1综合测验(正确率__%)"
```

---

## Phase 2：真题实战 + 盲区清扫（Day 15-26，10/5 - 10/16）

**目标**：刷 8 套历年真题选择部分，建立考试节奏；错题回归日消化盲区并插入大题入门。
**节奏**：做题日（2.5h 做题 + 分析）与回归日（错题重做 + 弱项强化）交替。
**做题日固定时间块**：

| 时间 | 时长 | 内容 |
|------|------|------|
| 08:30-11:00 | 2.5h | 完整一套真题选择题 75 题，计时 150 分钟内做完 |
| 14:00-16:30 | 2.5h | 逐题对答案 + 错题四要素整理 |
| 19:30-21:00 | 1.5h | 错题对应知识点回看笔记 |

### Task 15: Day 15（10/5）真题卷 1

- [ ] **Step 1（上午）：做真题卷 1 选择题 75 题，计时**
- [ ] **Step 2（下午）：对答案，逐题分析，记错题，统计各科正确率到 tracker.md**
- [ ] **Step 3（晚上）：错题知识点回看 + 打卡**

```bash
git commit -m "day-15: 真题卷1(正确率__%)"
```

### Task 16: Day 16（10/6）真题卷 2

- [ ] **Step 1（上午）：做真题卷 2 选择题 75 题，计时**
- [ ] **Step 2（下午）：对答案 + 错题整理 + 与卷 1 对比得分**
- [ ] **Step 3（晚上）：错题知识点回看 + 打卡**

```bash
git commit -m "day-16: 真题卷2(正确率__%)"
```

### Task 17: Day 17（10/7）错题回归日 ① + UML 大题入门

- [ ] **Step 1（上午 2h）：重做 Day 15-16 全部错题，记录重做正确率**
- [ ] **Step 2（上午 1h）：UML 基础（科目二大题提前入门）**

学用例图、类图、顺序图、状态图、活动图画法；类间关系（关联/聚合/组合/依赖/泛化）。

- [ ] **Step 3（下午 2.5h）：弱项强化刷题 25 道（按 knowledge-checklist 的二轮重点选题）**
- [ ] **Step 4（晚上 1.5h）：打错题重做正确率到 tracker.md + 打卡**

```bash
git commit -m "day-17: 错题回归(重做正确率__%) + UML入门"
```

### Task 18: Day 18（10/8）真题卷 3

- [ ] **Step 1（上午）：做真题卷 3，计时**
- [ ] **Step 2（下午）：对答案 + 错题整理**
- [ ] **Step 3（晚上）：错题知识点回看 + 打卡**

```bash
git commit -m "day-18: 真题卷3(正确率__%)"
```

### Task 19: Day 19（10/9）真题卷 4

- [ ] **Step 1（上午）：做真题卷 4，计时**
- [ ] **Step 2（下午）：对答案 + 错题整理**
- [ ] **Step 3（晚上）：错题知识点回看 + 打卡**

```bash
git commit -m "day-19: 真题卷4(正确率__%)"
```

### Task 20: Day 20（10/10）错题回归日 ② + 设计模式大题入门

- [ ] **Step 1（上午 2h）：重做 Day 18-19 错题 + Phase 2 高频错题**
- [ ] **Step 2（上午 1h）：设计模式速学（科目二必考 1 道大题）**

创建型（单例/工厂/抽象工厂/建造者）、结构型（适配器/代理/装饰器/外观）、行为型（观察者/策略/模板方法/状态）。每种记住"意图 + 结构图 + 适用场景"。

- [ ] **Step 3（下午 2.5h）：设计模式选择题 15 道 + 弱项刷题 10 道**
- [ ] **Step 4（晚上 1.5h）：打错题重做正确率 + 打卡**

```bash
git commit -m "day-20: 错题回归 + 设计模式速学"
```

### Task 21: Day 21（10/11）真题卷 5

- [ ] **Step 1（上午）：做真题卷 5，计时**
- [ ] **Step 2（下午）：对答案 + 错题整理**
- [ ] **Step 3（晚上）：错题知识点回看 + 打卡**

```bash
git commit -m "day-21: 真题卷5(正确率__%)"
```

### Task 22: Day 22（10/12）真题卷 6

- [ ] **Step 1（上午）：做真题卷 6，计时**
- [ ] **Step 2（下午）：对答案 + 错题整理**
- [ ] **Step 3（晚上）：错题知识点回看 + 打卡**

```bash
git commit -m "day-22: 真题卷6(正确率__%)"
```

### Task 23: Day 23（10/13）错题回归日 ③ + 数据流图大题入门

- [ ] **Step 1（上午 2h）：重做 Phase 2 全部错题（这是第三轮重复，要求重做正确率 ≥ 85%）**
- [ ] **Step 2（上午 1h）：数据流图（DFD）大题**

学 DFD 层次（顶层/0 层/1 层）、数据流平衡规则、常见错误类型。

- [ ] **Step 3（下午 2.5h）：UML 大题 1 道 + DFD 大题 1 道（首次完整做大题，不计时，重在熟悉题型）**
- [ ] **Step 4（晚上 1.5h）：打错题重做正确率 + 打卡**

```bash
git commit -m "day-23: 错题回归(三轮) + DFD大题入门"
```

### Task 24: Day 24（10/14）真题卷 7

- [ ] **Step 1（上午）：做真题卷 7，计时**
- [ ] **Step 2（下午）：对答案 + 错题整理**
- [ ] **Step 3（晚上）：错题知识点回看 + 打卡**

```bash
git commit -m "day-24: 真题卷7(正确率__%)"
```

### Task 25: Day 25（10/15）真题卷 8

- [ ] **Step 1（上午）：做真题卷 8，计时**
- [ ] **Step 2（下午）：对答案 + 错题整理**
- [ ] **Step 3（晚上）：8 套真题正确率趋势分析，写到 tracker.md（看是否稳定在 55+）+ 打卡**

```bash
git commit -m "day-25: 真题卷8 + 8套正确率趋势分析"
```

### Task 26: Day 26（10/16）阶段总结 + 选择题全真模拟

- [ ] **Step 1（上午 2.5h）：全真模拟一套完整选择题（严格 150 分钟，用没做过的卷子或模拟卷）**
- [ ] **Step 2（下午 2.5h）：模拟分析 + 更新 knowledge-checklist.md 的"考前必看"区**
- [ ] **Step 3（晚上 1.5h）：整理 Phase 2 高频错题 TOP 10 + 打卡**

```bash
git commit -m "day-26: 选择题全真模拟(正确率__%) + 高频错题TOP10"
```

---

## Phase 3：大题专项 + 查漏补缺（Day 27-31，10/17 - 10/21）

**目标**：科目二四类大题各练 2-3 道，掌握答题套路与步骤分。
**大题答题原则**：写出关键步骤就能拿步骤分，**绝不留空**。

### Task 27: Day 27（10/17）大题专项①：数据流图 + UML

**Files:**
- Create: `docs/practice/subject2-notes.md`（科目二答题模板）

- [ ] **Step 1（上午 3h）：DFD 大题 2 道 + UML 大题 2 道**

DFD 重点练数据流平衡检查；UML 重点练类图关系识别与顺序图补全。

- [ ] **Step 2（下午 2.5h）：对答案，整理"DFD 答题模板"和"UML 答题模板"到 subject2-notes.md**
- [ ] **Step 3（晚上 1.5h）：错题/丢分点回顾 + 打卡**

```bash
git commit -m "day-27: 大题专项-DFD与UML + 答题模板"
```

### Task 28: Day 28（10/18）大题专项②：数据库设计

- [ ] **Step 1（上午 3h）：E-R 图大题 2 道 + SQL 大题 2 道**

E-R 图重点练"需求 → 实体/联系 → 关系模式"全流程；SQL 大题重点练多表 JOIN 与子查询。

- [ ] **Step 2（下午 2.5h）：整理"E-R 图答题模板"和"SQL 大题常见考法"到 subject2-notes.md**
- [ ] **Step 3（晚上 1.5h）：丢分点回顾 + 打卡**

```bash
git commit -m "day-28: 大题专项-数据库设计"
```

### Task 29: Day 29（10/19）大题专项③：设计模式 + 算法填空

- [ ] **Step 1（上午 3h）：设计模式大题 2 道 + C/Java 算法填空题 2 道**

设计模式大题重点练"根据场景识别模式 + 画类结构"；算法填空重点练经典算法的代码骨架（排序/查找/树的遍历）。

- [ ] **Step 2（下午 2.5h）：整理"设计模式大题识别速查表"到 subject2-notes.md**
- [ ] **Step 3（晚上 1.5h）：丢分点回顾 + 打卡**

```bash
git commit -m "day-29: 大题专项-设计模式与算法填空"
```

### Task 30: Day 30（10/20）全真模拟（完整版：选择 + 大题）

- [ ] **Step 1（上午 8:30-11:00）：模拟选择题 75 题，计时 150 分钟**
- [ ] **Step 2（下午 14:00-15:30）：模拟大题 4 道，计时 90 分钟（严格按考试节奏）**
- [ ] **Step 3（下午 15:30-16:30）：对答案，算总分，记录到 tracker.md**
- [ ] **Step 4（晚上 1.5h）：全面复盘，列出"考前必须再看的 5 个点" + 打卡**

```bash
git commit -m "day-30: 全真模拟(总分__分) + 考前5点清单"
```

### Task 31: Day 31（10/21）查漏补缺（弹性日）

- [ ] **Step 1（上午 3h）：按"考前必须再看的 5 个点"定向复习**
- [ ] **Step 2（下午 2.5h）：错题本最后一轮筛查，只看仍错的题**
- [ ] **Step 3（晚上 1.5h）：保持手感做 20 道选择 + 打卡**

```bash
git commit -m "day-31: 查漏补缺 + 错题最后筛查"
```

---

## Phase 4：考前冲刺（Day 32-33，10/22 - 10/23）

**目标**：巩固记忆、调整状态，不做新题、不学新知识。

### Task 32: Day 32（10/22）冲刺复习①

- [ ] **Step 1（上午 3h）：回顾所有框架图（OS/网络/数据库/组成/软工各 15-30 分钟）**
- [ ] **Step 2（下午 2h）：背诵记忆性内容（协议层级、端口号、范式定义、设计模式意图）**
- [ ] **Step 3（下午 0.5h）：看高频考点清单 `docs/strategies/high-frequency-topics.md`**
- [ ] **Step 4（晚上 1.5h）：回顾大题答题模板 subject2-notes.md + 打卡**

```bash
git commit -m "day-32: 框架图回顾 + 记忆性内容背诵"
```

### Task 33: Day 33（10/23）考前一天（轻度）

- [ ] **Step 1（上午 2h）：只看笔记和框架图，不做题**
- [ ] **Step 2（下午 1h）：准备考试证件（身份证、准考证）、文具、确认考场与时间**
- [ ] **Step 3（晚上）：早点休息，调整心态 + 打卡**

```bash
git commit -m "day-33: 考前轻度复习 + 证件准备"
```

---

## Task 34: 考试日（10/24）

- [ ] **Step 1：按时参加考试，选择题稳住节奏（先易后难，不确定的先标记）**
- [ ] **Step 2：大题写出所有能写的步骤，不留空**
- [ ] **Step 3：考后更新 tracker.md 记录考试情况**

```bash
git commit -m "day-34: 参加考试 💪"
```

---

## Self-Review 自查结果

**1. Spec 覆盖**：5 个弱项（OS Day1-3、网络 Day4-6、数据库 Day7-9、组成 Day10-11、软工 Day12-13）各有 2-3 天专项；强项数据结构 Day1 验证 + Day14 补漏；科目二大题 Day17/20/23 入门 + Day27-29 专项；真题 8 套 + 2 次全真模拟；缓冲机制 = 4 个回归日 + Day31 弹性日。全部覆盖。

**2. 占位符扫描**：无 TBD/TODO；正确率用 `__%` 占位供打卡时填写（这是模板字段，非占位缺陷）。

**3. 一致性检查**：打卡文件统一为 `docs/practice/tracker.md`，错题统一 `docs/practice/reflection.md`，二轮重点清单统一 `docs/practice/knowledge-checklist.md`，大题模板统一 `docs/practice/subject2-notes.md`，commit message 统一 `day-N:` 前缀。全文一致。

**4. Review Focus 落地**：①数据结构失血 → Day 1 Step 2 有判定分支；②心态崩 → 回归日重做正确率追踪；③大题太晚 → Day 17/20/23 提前入门；④突发事件 → 回归日即缓冲，规则明确；⑤错题反复 → 三轮重做 + 70% 阈值升级机制。
