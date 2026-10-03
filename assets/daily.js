/* ============================================================
 * daily.js — 右下角每日组件：必背考点 + 每日一题（零依赖，动态注入）
 *
 * 由 sidebar.js 按需动态加载；桌面（≥1280px）右下角显示两个玻璃
 * 标签「📌 必背」「📝 一题」，点击向上展开卡片，点外部/Esc 收起。
 *
 * - 必背考点：42 条高频口诀/公式/结论，按日期轮换，翻面自测
 * - 每日一题：30 道高频选择题，按日期轮换 + 随机换题；
 *   每个选项都有对错解析，作答自动记入错题本（AnswerStore）
 * ============================================================ */
(function () {
  "use strict";

  if (window.__rkDailyLoaded) return;
  window.__rkDailyLoaded = true;

  /* ---------------- 题库：每日必背（f 正面提问，b 背面答案） ---------------- */
  var FACTS = [
    { c: "排序", f: "哪些排序算法不稳定？", b: "快速、选择、希尔、堆（口诀：快选希堆不稳定）；稳定的是：直接插入、冒泡、归并" },
    { c: "排序", f: "快速排序的平均 / 最坏复杂度？", b: "平均 O(n log n)；基本有序或全部相等时最坏 O(n²)（划分不平衡）" },
    { c: "排序", f: "堆排序的复杂度？建堆呢？", b: "整体 O(n log n)；建堆 O(n)；每次向下调整 O(log n)" },
    { c: "树", f: "二叉树叶子数与度 2 节点数的关系？", b: "n₀ = n₂ + 1（与度 1 节点个数无关）" },
    { c: "树", f: "n 个节点的完全二叉树的深度？", b: "⌊log₂n⌋ + 1" },
    { c: "树", f: "哈夫曼树的节点数与形状特点？", b: "n 个叶子共 2n−1 个节点；不存在度 1 的节点" },
    { c: "查找", f: "二分查找 n 个元素最多比较几次？", b: "⌊log₂n⌋ + 1（例：100 个元素最多 7 次，因 2⁶<100≤2⁷）" },
    { c: "查找", f: "哈希装填因子 α 的含义与影响？", b: "α = 元素数 / 表长；α 越小冲突越少、查找越快，但空间利用率越低" },
    { c: "图", f: "DFS / BFS 各用什么辅助结构？", b: "DFS 用栈（递归调用栈）；BFS 用队列（逐层扩展）" },
    { c: "图", f: "Prim / Kruskal 的适用场景？", b: "Prim O(n²) 与边数无关，适合稠密图；Kruskal O(eloge) 适合稀疏图" },
    { c: "图", f: "Dijkstra 算法的局限？", b: "不能处理负权边——贪心假设已确定的路径不会再变短" },
    { c: "图", f: "关键路径中 ve / vl 怎么求？", b: "ve（最早发生）从前往后取 max；vl（最迟发生）从后往前取 min；关键活动 slack = vl − ve = 0" },
    { c: "图", f: "拓扑排序怎么做？何时失败？", b: "每轮取入度为 0 的顶点并删除其出边；若图中存在环（剩余顶点都有前驱）则无法输出全部顶点" },
    { c: "OS", f: "循环队列判满与求元素个数？", b: "队满：(rear + 1) % size == front；元素个数：(rear − front + size) % size" },
    { c: "OS", f: "死锁的四个必要条件？", b: "互斥、保持并等待、不可剥夺、循环等待——破坏任意一个即可预防死锁" },
    { c: "OS", f: "银行家算法 / 资源有序分配分别属于什么策略？", b: "银行家算法 = 死锁避免（分配前判断安全状态）；资源有序分配 = 死锁预防（破坏循环等待）" },
    { c: "OS", f: "Belady 异常是什么？哪些算法有？", b: "物理页面增多缺页反而增多；只出现在 FIFO（LRU / OPT / Clock 是栈式算法）" },
    { c: "OS", f: "磁盘平均存取时间由哪三段组成？", b: "寻道时间 + 旋转延迟 + 传输时间；磁盘调度算法只优化寻道时间" },
    { c: "OS", f: "SSTF / SCAN 谁会饥饿？", b: "SSTF 会（新请求总在附近时远处饿死）；SCAN / C-SCAN 扫完全程不会" },
    { c: "OS", f: "一级索引最大文件大小（4KB 块、4B 块号）？", b: "4096 ÷ 4 = 1024 项 → 1024 × 4KB = 4MB（二级 4GB、三级 4TB）；注意读索引块也算磁盘访问" },
    { c: "OS", f: "内部碎片与外部碎片分别出现在哪？", b: "分页固定大小 → 内部碎片（最后一页装不满）；分段 / 动态分区 → 外部碎片" },
    { c: "OS", f: "缺页中断属于哪类？处理完做什么？", b: "内中断（程序性异常），指令执行期间产生；处理后重新执行被中断的那条指令" },
    { c: "网络", f: "TCP 三次握手流程与目的？", b: "SYN → SYN+ACK → ACK；同步初始序列号、确认双向收发能力、防止失效的连接请求突然到达" },
    { c: "网络", f: "TIME_WAIT 出现在哪一方？等多久？", b: "主动关闭方；等待 2MSL——确保最后的 ACK 能到达，并让本连接的旧报文在网络中消逝" },
    { c: "网络", f: "常用端口号背一遍？", b: "FTP 21、SSH 22、Telnet 23、SMTP 25、DNS 53、HTTP 80、POP3 110、HTTPS 443" },
    { c: "网络", f: "/26 掩码的每个子网可用主机数？", b: "255.255.255.192 → 主机位 6 位，2⁶ − 2 = 62（去掉网络地址与广播地址）" },
    { c: "网络", f: "DHCP / DNS / ARP 各自的作用？", b: "DHCP 动态分配 IP；DNS 域名 → IP；ARP 由 IP 找 MAC 地址" },
    { c: "数据库", f: "2NF / 3NF 分别消除什么依赖？", b: "2NF 消除非主属性对码的部分函数依赖；3NF 在 2NF 基础上消除传递函数依赖" },
    { c: "数据库", f: "候选码 / 主属性的定义？", b: "候选码：能唯一标识元组的最小属性集；主属性：包含在任意候选码中的属性" },
    { c: "数据库", f: "E-R 图转关系模式的规则？", b: "1:1 和 1:n 联系可并入实体关系；m:n 必须独立成关系模式（含两端实体的码 + 联系自身属性）" },
    { c: "数据库", f: "事务的 ACID 四性质？", b: "原子性、一致性、隔离性、持久性；隔离性由并发控制（锁机制）保证" },
    { c: "数据库", f: "共享锁 S 与排他锁 X 的兼容性？", b: "S 与 S 兼容；S 与 X、X 与 X 都不兼容" },
    { c: "软工", f: "瀑布 / 原型 / 螺旋模型各适用什么场景？", b: "瀑布：需求明确少变更；原型：需求不明确；螺旋 = 瀑布 + 原型 + 风险分析，适合大型高风险项目" },
    { c: "软工", f: "白盒覆盖强度从小到大排序？", b: "语句 < 判定 < 条件 < 判定/条件 < 条件组合 < 路径覆盖" },
    { c: "软工", f: "McCabe 环形复杂度的三种算法？", b: "V(G) = 判定节点数 + 1 = 边数 E − 节点数 N + 2 = 封闭区域数 + 1（三者等价）" },
    { c: "软工", f: "耦合从弱到强 / 内聚从强到弱？", b: "耦合：数据 < 标记 < 控制 < 公共 < 内容；内聚：功能内聚最强，偶然内聚最弱" },
    { c: "软工", f: "UML 静态图与动态图怎么区分？", b: "静态：类图、对象图、构件图、部署图、包图；动态：用例图、序列图、通信图、状态图、活动图" },
    { c: "设计模式", f: "单例 / 观察者 / 策略模式的一句话意图？", b: "单例：一个类只有一个实例；观察者：一对多依赖，状态变化自动通知；策略：算法封装成类可互相替换" },
    { c: "组成", f: "Cache 平均访问时间公式？", b: "h × tc + (1 − h) × tm（h 命中率，tc 命中访问时间，tm 主存访问时间）" },
    { c: "组成", f: "流水线执行时间公式？", b: "(k + n − 1) × Δt（k 个阶段、n 条指令、周期 Δt）；理论上加速比趋近 k" },
    { c: "组成", f: "海明码校验位个数怎么定？", b: "2^k ≥ n + k + 1（n 为信息位，k 为校验位）" },
    { c: "安全", f: "对称 / 非对称加密的典型算法与特点？", b: "对称：DES、3DES、AES——快，但密钥分发难；非对称：RSA、ECC——慢，公钥加密私钥解，可做数字签名" }
  ];

  /* ---------------- 题库：每日一题（o 选项，a 答案下标，w 每个选项的解析） ---------------- */
  var QUIZ = [
    { tag: "排序", q: "对 n 个元素进行直接插入排序，最好情况（基本有序）下的时间复杂度为（）。", o: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], a: 0,
      w: ["基本有序时每趟只需比较 1 次、不移动元素，共 n−1 趟 → O(n)", "这是快排 / 归并 / 堆排序的平均复杂度，插入排序达不到", "这是逆序时的最坏情况，不是最好情况", "基于比较的排序没有 O(log n) 这一级别"], src: "0009 排序" },
    { tag: "排序", q: "下列排序算法中，稳定的是（）。", o: ["快速排序", "堆排序", "归并排序", "希尔排序"], a: 2,
      w: ["快排交换间隔较远的元素，相等元素相对次序会被破坏", "堆顶与末尾元素交换，相等元素次序被打乱", "归并合并时相等元素优先取左半边，次序不变——稳定的只有直接插入、冒泡、归并", "希尔按步长分组跳跃移动，相等元素可能分到不同组"], src: "0009 排序" },
    { tag: "排序", q: "关于快速排序，正确的是（）。", o: ["平均 O(n log n)，基本有序时最坏 O(n²)", "平均 O(n²)，最好 O(n)", "任何情况下都是 O(n log n)", "最坏情况也是 O(n log n)"], a: 0,
      w: ["平均 O(n log n)；划分极不平衡（基本有序 / 全相等）时退化为 O(n²)", "平均远好于 O(n²)，O(n²) 是最坏情形", "划分不平衡时会退化到 O(n²)", "恰恰相反，最坏是 O(n²)"], src: "0009 排序" },
    { tag: "树", q: "某二叉树有 5 个度为 2 的节点，则叶子节点数为（）。", o: ["4", "5", "6", "7"], a: 2,
      w: ["关系是 n₀ = n₂ + 1，不是减 1", "忘了加 1", "n₀ = n₂ + 1 = 6，与度 1 节点个数无关", "把度 1 节点也数进去了"], src: "0003 二叉树" },
    { tag: "树", q: "完全二叉树按层从 1 编号，编号为 i 的节点其左孩子编号为（）（存在时）。", o: ["2i", "2i+1", "i/2", "i−1"], a: 0,
      w: ["左孩子 = 2i（需 ≤ n 才存在）", "2i+1 是右孩子的编号", "i/2 向下取整是双亲编号", "层序连续编号，左孩子是倍增不是减法"], src: "0003 二叉树" },
    { tag: "树", q: "哈夫曼树有 n 个叶子节点，则整棵树共有（）个节点。", o: ["2n", "2n−1", "2n+1", "n−1"], a: 1,
      w: ["多了 n 个", "n₀ = n，n₂ = n₀ − 1 = n−1，n₁ = 0 → 总数 2n−1", "多了 n+1 个", "少了一半"], src: "0005 哈夫曼" },
    { tag: "查找", q: "对 100 个元素进行二分查找，最多需要比较（）次。", o: ["6", "7", "50", "100"], a: 1,
      w: ["差 1：⌊log₂100⌋ + 1 = 7", "2⁶ = 64 < 100 ≤ 128 = 2⁷，最多 7 次", "那是顺序查找平均情况的数量级", "二分是对数级，与元素个数线性无关"], src: "0008 查找" },
    { tag: "查找", q: "哈希表的装填因子 α 越小，则（）。", o: ["空间利用率越高", "发生冲突的可能性越小", "查找时间越长", "存储的元素越多"], a: 1,
      w: ["α 小 = 空位多，利用率反而低", "α = 元素数/表长，越小空位越多、冲突概率越低", "恰恰相反，α 小查找更快", "α 由元素数与表长共同决定，不是 α 小元素多"], src: "0008 查找" },
    { tag: "图", q: "图的广度优先遍历（BFS）需要借助的数据结构是（）。", o: ["栈", "队列", "堆", "哈希表"], a: 1,
      w: ["栈是深度优先（DFS）的辅助结构", "BFS 先访问的顶点先扩展邻接点——先进先出的队列", "堆用于优先队列（如 Dijkstra 的优化实现）", "哈希表可用来判重，不是遍历骨架"], src: "0006 图" },
    { tag: "图", q: "关于 Prim 与 Kruskal，正确的是（）。", o: ["Prim 适合稀疏图", "Kruskal 适合稠密图", "Prim 适合稠密图，Kruskal 适合稀疏图", "两者都只适用于有向图"], a: 2,
      w: ["Prim 每轮扫描候选边，O(n²) 与边数无关——稠密才有优势", "Kruskal 要先给边排序，边多的图开销大", "Prim O(n²) 适合稠密；Kruskal O(eloge) 适合稀疏", "两者都是求无向连通图的最小生成树"], src: "0007 图算法" },
    { tag: "图", q: "Dijkstra 算法无法正确处理的情况是（）。", o: ["带负权边的图", "无向图", "带环的图", "边权相等的图"], a: 0,
      w: ["贪心假设『已确定的最短路径不再变』，负权边会推翻它", "无向图同样适用", "有环不影响（负权环才无解）", "边权相等不影响贪心流程"], src: "0007 图算法" },
    { tag: "OS-PV", q: "生产者-消费者问题中，互斥信号量 mutex 的初值应为（）。", o: ["0", "1", "缓冲区大小", "消费者数量"], a: 1,
      w: ["0 表示已有进程持有，第一个进程会阻塞", "互斥信号量 = 同时允许进入临界区的进程数，初值 1", "缓冲区大小是同步信号量 empty 的初值", "与消费者数量无关"], src: "0014 进程" },
    { tag: "OS-死锁", q: "『进程一次性申请全部所需资源』的分配策略，破坏了死锁必要条件中的（）。", o: ["互斥", "保持并等待", "不可剥夺", "循环等待"], a: 1,
      w: ["互斥是资源本身的属性（如打印机），一般不可破坏", "一次性拿齐所有资源，进程不会『占着一部分再等另一部分』", "可剥夺是另一种策略，本题描述的是破坏保持并等待", "循环等待由资源有序分配破坏"], src: "0014 进程" },
    { tag: "OS-置换", q: "增加物理页面数，缺页次数反而可能增加——该现象只出现在（）算法。", o: ["OPT", "LRU", "FIFO", "Clock"], a: 2,
      w: ["OPT 是理论最优，无此异常", "LRU 是栈式算法，页面增多缺页单调不增", "这就是 Belady 异常，只有 FIFO 会出现", "Clock 是 LRU 的近似，同样不会出现"], src: "0015 内存" },
    { tag: "OS-磁盘", q: "下列磁盘调度算法中，可能导致远处请求饥饿的是（）。", o: ["FCFS", "SSTF", "SCAN", "C-SCAN"], a: 1,
      w: ["FCFS 按到达顺序服务，不会饥饿", "SSTF 总选最近的，新请求不断出现在附近时远处长期得不到服务", "SCAN 电梯式扫完全程，各柱面都会被服务", "C-SCAN 单向循环扫描，同样覆盖全部柱面"], src: "0011 磁盘调度" },
    { tag: "OS-文件", q: "盘块 4KB、块号 4B，一级索引结构可管理的最大文件约为（）。", o: ["4KB", "4MB", "4GB", "4TB"], a: 1,
      w: ["4KB 只是一个索引块自身大小", "4096 ÷ 4 = 1024 个块号 → 1024 × 4KB = 4MB", "4GB 是二级索引（1024 × 1024 块）", "4TB 是三级索引"], src: "0012 文件系统" },
    { tag: "OS-内存", q: "分页存储管理中产生的碎片是（）。", o: ["外部碎片", "内部碎片", "不会产生碎片", "内部和外部都有"], a: 1,
      w: ["外部碎片是分段 / 动态分区的问题", "页大小固定，最后一页往往装不满——页内剩余即内部碎片", "固定分配必有内部碎片", "分页只有内部碎片，离散分配无外部碎片"], src: "0015 内存" },
    { tag: "网络-TCP", q: "TCP 建立连接采用三次握手，主要目的是（）。", o: ["减少报文数量", "确认双方收发能力正常并同步序列号", "对数据加密", "提高传输速率"], a: 1,
      w: ["握手本身是开销，不是为了省报文", "两次握手无法确认『服务器能收到客户端的确认』，还会被滞留的旧连接请求干扰；三次握手同步初始序列号", "加密是 TLS 的职责", "握手增加一个 RTT 的延迟"], src: "0017 TCP" },
    { tag: "网络-端口", q: "HTTPS 默认使用的端口号是（）。", o: ["80", "443", "8080", "21"], a: 1,
      w: ["80 是 HTTP 明文端口", "HTTPS = HTTP over TLS，默认 443", "8080 是常见的备用 HTTP 端口", "21 是 FTP 控制端口"], src: "0016 网络" },
    { tag: "网络-子网", q: "子网掩码 255.255.255.192 的每个子网，最多可容纳（）台主机。", o: ["64", "62", "126", "30"], a: 1,
      w: ["64 是含网络地址与广播地址的总数", "192 → /26，主机位 6 位，2⁶ − 2 = 62", "126 是 /25 的可用主机数", "30 是 /27 的可用主机数"], src: "0017 子网" },
    { tag: "网络-DNS", q: "DNS 协议的基本作用是（）。", o: ["动态分配 IP 地址", "将域名解析为 IP 地址", "加密网页传输", "传输电子邮件"], a: 1,
      w: ["动态分配 IP 是 DHCP 的任务", "DNS 维护域名与 IP 的映射关系，完成解析", "加密由 HTTPS / TLS 负责", "邮件传输由 SMTP / POP3 / IMAP 负责"], src: "0016 网络" },
    { tag: "数据库", q: "消除非主属性对码的传递函数依赖，可达到（）。", o: ["1NF", "2NF", "3NF", "4NF"], a: 2,
      w: ["1NF 只要求属性不可再分", "2NF 消除的是部分函数依赖", "3NF = 2NF + 消除传递依赖", "4NF 处理多值依赖，超出题目描述"], src: "0020 范式" },
    { tag: "数据库", q: "E-R 图中 m:n 的联系转换为关系模式时，（）。", o: ["可与任意一端实体合并", "必须独立成为一个关系模式", "可以省略不转换", "只能转换为一个属性"], a: 1,
      w: ["1:1 与 1:n 才可合并，m:n 合并会产生大量冗余", "m:n 联系需要独立的关系模式：两端实体的码 + 联系自身属性", "联系承载业务数据，必须转换", "它是一个独立的关系，不是一个属性"], src: "0020 ER" },
    { tag: "数据库", q: "多个事务并发执行互不干扰，属于事务的（）。", o: ["原子性", "一致性", "隔离性", "持久性"], a: 2,
      w: ["原子性：全做或全不做", "一致性：从一个一致状态到另一个一致状态", "隔离性：并发事务互不干扰，如同串行执行", "持久性：提交后的修改永久保存"], src: "0019 SQL" },
    { tag: "软工-测试", q: "下列不属于黑盒测试用例设计方法的是（）。", o: ["等价类划分", "边界值分析", "因果图", "循环覆盖"], a: 3,
      w: ["典型的黑盒方法", "等价类的补充，黑盒", "适合多输入组合场景，黑盒", "循环 / 路径覆盖要看代码结构，属于白盒"], src: "0024 测试" },
    { tag: "软工-度量", q: "计算程序环形复杂度 V(G)，错误的公式是（）。", o: ["V(G) = 判定节点数 + 1", "V(G) = E − N + 2（E 边、N 节点）", "V(G) = 封闭区域数 + 1", "V(G) = 源代码行数 / 10"], a: 3,
      w: ["正确", "正确，与判定节点法等价", "正确，看控制流图围出的区域", "行数估算法不是环形复杂度的定义式"], src: "0024 测试" },
    { tag: "软工-耦合", q: "下列耦合中，耦合性最弱、最理想的是（）。", o: ["内容耦合", "公共耦合", "控制耦合", "数据耦合"], a: 3,
      w: ["内容耦合直接访问对方内部，最强最应避免", "公共耦合通过全局数据区，较强", "控制耦合传递控制标志，中等", "数据耦合只传简单数据参数，最弱最理想"], src: "0023 过程" },
    { tag: "组成-Cache", q: "Cache 平均访问时间（h 命中率、tc 命中时间、tm 主存时间）为（）。", o: ["h×tc + (1−h)×tm", "h×tc", "tm", "h×tm + (1−h)×tc"], a: 0,
      w: ["命中部分与未命中部分的加权平均", "漏掉了未命中时访问主存的时间", "完全忽略 Cache 的存在", "主次颠倒"], src: "0022 Cache" },
    { tag: "组成-流水线", q: "k 段指令流水线（每段周期 Δt）执行 n 条指令需要（）。", o: ["n×k×Δt", "(k+n−1)×Δt", "(n+k)×Δt", "k×Δt"], a: 1,
      w: ["那是无流水线串行执行的时间", "第一条流完要 kΔt，之后每 Δt 流出一条 → (k+n−1)Δt", "多加了一个 k", "那是只执行第一条的时间"], src: "0021 CPU" },
    { tag: "设计模式", q: "「对象状态变化时，所有依赖它的对象都得到通知并自动更新」适合的模式是（）。", o: ["单例模式", "观察者模式", "策略模式", "备忘录模式"], a: 1,
      w: ["单例保证一个类只有一个实例", "一对多依赖、状态变化自动通知——观察者（发布/订阅）", "策略用于算法封装与互换", "备忘录用于保存与恢复对象状态"], src: "0026 设计模式" }
  ];

  /* ---------------- 通用 ---------------- */
  var REL_ROOT = (function () {
    var el = document.querySelector('script[src*="daily.js"]');
    var up = el ? (el.getAttribute("src").match(/\.\.\//g) || []).length : 0;
    return new Array(up + 1).join("../");
  })();

  var dayIndex = Math.floor(Date.now() / 86400000);
  var factIdx = ((dayIndex % FACTS.length) + FACTS.length) % FACTS.length;
  var quizIdx = ((dayIndex % QUIZ.length) + QUIZ.length) % QUIZ.length;
  var factFlipped = false;
  var quizAnswered = -1;      // 当前题的作答（-1 未答）
  var openCard = null;        // "fact" | "quiz" | null

  var els = {};

  function fmtDate() {
    var d = new Date();
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  function ensureStore(cb) {
    if (window.AnswerStore) return cb();
    var s = document.createElement("script");
    s.src = REL_ROOT + "assets/answer-store.js";
    s.onload = function () { cb(); };
    s.onerror = function () { cb(); };
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------------- 渲染 ---------------- */

  function renderFact() {
    var it = FACTS[factIdx];
    els.factBody.innerHTML =
      '<div class="daily-head"><span class="daily-tag">📌 今日必背 · ' + esc(it.c) + '</span><span class="daily-date">' + fmtDate() + '</span></div>' +
      '<div class="daily-front">' + esc(it.f) + '</div>' +
      (factFlipped
        ? '<div class="daily-back">' + esc(it.b) + '</div>'
        : '<button class="daily-flip" id="dailyFlip" type="button">翻面看答案</button>') +
      '<div class="daily-foot">' +
      (factFlipped ? '<button class="daily-btn" id="dailyNext" type="button">下一条 →</button>' : "") +
      '<span class="daily-count">' + (factIdx + 1) + "/" + FACTS.length + '</span>' +
      "</div>";
    if (factFlipped) {
      els.factBody.querySelector("#dailyNext").addEventListener("click", function () {
        factIdx = (factIdx + 1) % FACTS.length;
        factFlipped = false;
        renderFact();
      });
    } else {
      els.factBody.querySelector("#dailyFlip").addEventListener("click", function () {
        factFlipped = true;
        renderFact();
      });
    }
  }

  function renderQuiz() {
    var it = QUIZ[quizIdx];
    var letters = ["A", "B", "C", "D"];
    var html =
      '<div class="daily-head"><span class="daily-tag">🎲 今日一题 · ' + esc(it.tag) + '</span><span class="daily-date">' + fmtDate() + '</span></div>' +
      '<div class="daily-q">' + esc(it.q) + "</div>" +
      '<div class="daily-opts">';
    for (var i = 0; i < it.o.length; i++) {
      var cls = "daily-opt";
      if (quizAnswered >= 0) {
        if (i === it.a) cls += " right";
        else if (i === quizAnswered) cls += " wrong";
        else cls += " dim";
      }
      html += '<button class="' + cls + '" data-i="' + i + '"' + (quizAnswered >= 0 ? " disabled" : "") + ' type="button"><b>' + letters[i] + "</b>" + esc(it.o[i]) + "</button>";
    }
    html += "</div>";
    if (quizAnswered >= 0) {
      var right = quizAnswered === it.a;
      html += '<div class="daily-verdict ' + (right ? "ok" : "bad") + '">' + (right ? "✓ 答对了" : "✗ 答错了，正确答案是 " + letters[it.a]) + "</div>";
      html += '<div class="daily-exp">';
      for (var k = 0; k < it.o.length; k++) {
        if (k !== quizAnswered || right) {
          html += '<div class="daily-exp-line"><b>' + letters[k] + "</b>" + esc(it.w[k]) + "</div>";
        }
      }
      html += "</div>";
      html += '<div class="daily-foot"><button class="daily-btn" id="dailyChange" type="button">🎲 换一题</button><span class="daily-count">' + (quizIdx + 1) + "/" + QUIZ.length + "</span></div>";
    }
    els.quizBody.innerHTML = html;

    if (quizAnswered < 0) {
      Array.prototype.forEach.call(els.quizBody.querySelectorAll(".daily-opt"), function (b) {
        b.addEventListener("click", function () {
          var chosen = parseInt(b.getAttribute("data-i"), 10);
          quizAnswered = chosen;
          recordQuiz(it, chosen);
          renderQuiz();
        });
      });
    } else {
      els.quizBody.querySelector("#dailyChange").addEventListener("click", function () {
        var next;
        do { next = Math.floor(Math.random() * QUIZ.length); } while (next === quizIdx && QUIZ.length > 1);
        quizIdx = next;
        quizAnswered = -1;
        renderQuiz();
      });
    }
  }

  function recordQuiz(item, chosen) {
    ensureStore(function () {
      try {
        if (window.AnswerStore && window.AnswerStore.record) {
          window.AnswerStore.record({
            lesson: "每日一题",
            quiz: "右栏·每日一题",
            index: quizIdx,
            question: { q: item.q, options: item.o, answer: item.a, opts: item.w, explain: "", source: item.src || "" },
            chosen: chosen,
            right: chosen === item.a
          });
        }
      } catch (e) { /* 记录失败不影响作答 */ }
    });
  }

  /* ---------------- 开合交互 ---------------- */

  function dailyOpen(name) {
    if (openCard === name) { closeAll(); return; }
    openCard = name;
    els.factCard.classList.toggle("open", name === "fact");
    els.quizCard.classList.toggle("open", name === "quiz");
    if (name === "fact") renderFact(); else renderQuiz();
  }
  function closeAll() {
    openCard = null;
    els.factCard.classList.remove("open");
    els.quizCard.classList.remove("open");
  }

  /* ---------------- 构建 DOM ---------------- */

  function build() {
    if (document.getElementById("dailyDock")) return;

    var dock = document.createElement("div");
    dock.className = "daily-dock";
    dock.id = "dailyDock";
    dock.innerHTML =
      '<button class="daily-tab" data-card="fact" type="button">📌 必背</button>' +
      '<button class="daily-tab" data-card="quiz" type="button">📝 一题</button>';
    document.body.appendChild(dock);

    var factCard = document.createElement("aside");
    factCard.className = "daily-card";
    factCard.id = "dailyFactCard";
    factCard.innerHTML = '<div class="daily-inner"></div>';
    document.body.appendChild(factCard);

    var quizCard = document.createElement("aside");
    quizCard.className = "daily-card";
    quizCard.id = "dailyQuizCard";
    quizCard.innerHTML = '<div class="daily-inner"></div>';
    document.body.appendChild(quizCard);

    els.factCard = factCard;
    els.quizCard = quizCard;
    els.factBody = factCard.querySelector(".daily-inner");
    els.quizBody = quizCard.querySelector(".daily-inner");

    dock.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".daily-tab") : null;
      if (b) dailyOpen(b.getAttribute("data-card"));
    });

    document.addEventListener("click", function (e) {
      if (!openCard) return;
      if (e.target === els.factCard || els.factCard.contains(e.target)) return;
      if (e.target === els.quizCard || els.quizCard.contains(e.target)) return;
      if (dock.contains(e.target)) return;
      closeAll();
    }, true);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
