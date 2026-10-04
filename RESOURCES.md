# 软考软件设计师 Resources

## Knowledge（本仓库内的精编资料 = 首要知识来源，均为只读）

- [Day 3 笔记：磁盘调度与文件系统](docs/knowledge-points/os/day03-disk.md)
  六种磁盘调度算法完整手算（同一序列六结果 476/236/260/220/390/272）、存取时间三段式、文件物理结构对比、索引容量 4MB/4GB/4TB、混合索引 I/O 次数、FAT/FCB/inode；第十节是 OS 三天知识框架图（20 条必背结论 + 十种题型公式表）。Use for：磁盘/文件类选择题与计算题的一切口径来源。
- [Day 3 练习：OS 综合 25 题](docs/knowledge-points/os/day03-exercises.md)
  含「自测速答」与逐题解析。Use for：学完当天笔记后的配套练习卷。
- [Day 1 笔记：进程管理](docs/knowledge-points/os/day01-process.md)
  五状态、PV 操作、调度算法、死锁。Use for：间隔复习出题来源、错题回看。
- [Day 2 笔记：内存管理](docs/knowledge-points/os/day02-memory.md)
  页式地址转换（5 道手算例题含二级页表）、四种置换算法、Belady 反例、TLB/EAT。Use for：同上。
- [数据结构摸底卷（30 题计时 40 分钟，原计划 Day 1）](docs/knowledge-points/data-structures/day01-diagnostic.md)
  覆盖链表/树/图/排序/查找。Use for：数据结构零基础路线（reference/ds-learning-path.html）学完后的出关测试。
- [下午算法大题专项（动态规划/贪心，试题四）](docs/practice/subject2/patterns-algo-exercises.md)
  Use for：数据结构路线的地基验收场景（学完 Day 3–4 的数据结构基础后进入），算法填空的递推/边界都踩在数据结构基础上。
- [34 天学习路线与打卡表](docs/practice/tracker.md)
  34 天路线（日期栏留空自填）、每检查点合格线、各真题卷勘误结论备注。Use for：定今天学什么、考什么口径。
- [高频必考清单](docs/strategies/high-frequency-topics.md)
  各科目分值定位（OS 6-8 题，磁盘调度为必考计算）。Use for：判断一个考点值不值得花交互课时。
- [历年真题 PDF（只读原卷）](practice_dd/)
  2009–2023 上午/下午试卷与部分答案册。注意：多数“答案 PDF”实为试卷副本，真题答案以 docs/practice/papers/ 内已交叉核对的 key 为准。

## Wisdom (Communities)

- [信管网（cnitpm.com）](https://www.cnitpm.com)
  软考真题讨论与答案勘误社区；本仓库真题 key 的交叉核对来源之一。Use for：对答案有分歧时搜讨论帖。
- [希赛网（educity.cn）](https://www.educity.cn)
  软考题库与解析；同为 key 交叉来源。Use for：同上。
- ⚠️ 社区答案与仓库口径冲突时：以仓库 tracker/各卷 key 的勘误结论为准（它们已做多源交叉 + 独立复算），不要临场改口径。

## Gaps

- 交互课程的测验得分是第一份真实掌握度数据：做完后把正确率回填 tracker.md，再用 knowledge-checklist.md 的「二轮重点清单」锁定薄弱点。
- 下午大题（UML/DFD/设计模式/算法填空）的交互训练组件暂缺，Phase 3（Day 27–29）大题专项目前以 docs/practice/subject2/ 的真题练习为主。
