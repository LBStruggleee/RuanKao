# Day 20设计模式入门：科目二试题五/六前置学习

> **阶段定位**：Phase 2 第 6 天，第二个**错题回归日**。上午做错题重做（见 `docs/practice/review-round2.md`），本笔记是 **Step 2（下午 2.5h）** 的科目二下午大题前置入门。
>
> **为什么现在学设计模式**：设计模式在软考里是**双料考点**——科目一上午年年出 2–3 道选择（2021 下半年考了 44–46 题中介者三连、47 题策略，2022 上半年考了 67–68 题观察者/单例），科目二下午**试题五（C++）/试题六（Java）二选一、15 分**，几乎每年必考一道设计模式代码填空。上午重做的卷 3 第 44–46 题就是典型考法。
>
> **本日覆盖**：23 种 GoF 模式的**三大分类**总览 → 15 个常考模式的**意图 + 角色结构 + C++/Java 代码骨架 + 大题填空点** → 场景关键词识别表 → 答题三步法。
>
> **本笔记定位（与 Day 29 的分工）**：本文是**入门教学**，目标是"教会你认出模式、说清角色结构、写出代码骨架"；Day 29 的 `patterns-algo-notes.md` 是**冲刺速查**（真题映射 + 丢分点），考前再过一遍即可。**先本文、后速查。**
>
> **配套**：`docs/practice/review-round2.md`（错题重做卷②，含卷 3 第 44–46 题中介者三连）、`day17-uml.md`（类图六关系，本文反复用到）。

---

## 一、考法说明（先知道分在哪、怎么考）

### 1.1 科目二的卷面结构

软考中级·软件设计师**科目二《软件设计》**（下午，150 分钟）：

- 共 **6 道大题**（试题一 ~ 试题六），**每题 15 分**，满分 75 分，合格 45 分。
- **试题一 ~ 试题四为必答**：试题一（结构化开发，**数据流图 DFD**）、试题二（数据库分析与设计，**E-R 图 + 关系模式**）、试题三（面向对象分析与设计，**UML**）、试题四（数据结构与算法，**C 语言**）。
- **试题五（C++）与试题六（Java）二选一**：均结合**设计模式**给类图做代码填空。

> **本笔记针对试题五/六**：15 分，全部在填空上。**选答策略**：若两种语言都不排斥，**建议选 Java（试题六）**——`abstract`/`new`/`extends`/`implements` 语法更直白；C++ 要注意 `->`、`= 0`、`: public` 等语言细节（见 §六语言对照表）。

### 1.2 试题五/六的题目结构（固定三件套）

| 组成 | 内容 | 你要做什么 |
|------|------|-----------|
| **【说明】** | 用文字描述一个业务场景（如"某购物中心收银系统要支持打折、返利、满减等不同促销活动"） | **读场景关键词 → 判模式**（第一步，见 §二） |
| **类图** | 给出该模式的类结构（抽象类、接口、具体类、关系线） | **对照类图找角色对应**（第二步，见 §四） |
| **代码骨架** | C++ 或 Java 代码，挖掉 **4~6 个空** | **依多态与继承关系填代码空**（第三步，见 §四） |

### 1.3 填空只考三类位置（记住这三类，逐空定位）

1. **模式角色名/类名**：如"图中的 `____` 类充当抽象产品角色"——直接从类图里抄。
2. **方法签名**：抽象方法声明、接口方法、工厂/管理者方法（`add`/`get`/`create` 等）——**由"子类已实现的签名 + 调用处"反推**。
3. **多态调用语句**：用父类/接口类型的变量调用方法、`return new ConcreteX()`、委托语句（如 `strategy.doPrint(this)`）。

> **每空分值 2~4 分，4~6 个空 = 15 分**。模式识别错 = 全盘皆输，所以**第一步"判模式"是性价比最高的技能**。

---

## 二、识别方法（场景关键词 → 模式）

### 2.1 三大分类先建立全景

GoF 23 种设计模式按**关注点**分三类（**必背**，上午选择常考分类归属）：

```
设计模式（23 种）
├── 创建型（5 种）——关注"对象怎么被创建"
│     工厂方法 Factory Method ★    抽象工厂 Abstract Factory ★
│     单例 Singleton ★             建造者 Builder ★
│     原型 Prototype
├── 结构型（7 种）——关注"类/对象怎么组合"
│     适配器 Adapter ★    装饰 Decorator ★    外观 Facade ★
│     组合 Composite ★    享元 Flyweight ★
│     桥接 Bridge         代理 Proxy
└── 行为型（11 种）——关注"对象间怎么协作、职责怎么分"
      观察者 Observer ★    状态 State ★    策略 Strategy ★
      命令 Command ★       备忘录 Memento ★    职责链 CoR ★
      中介者 Mediator ★（上午高频）    模板方法 Template Method
      迭代器 Iterator      访问者 Visitor      解释器 Interpreter
```

> ★ = 软件设计师**常考的 15 个**（本笔记精讲范围）。记忆口诀：
> **创建型"工抽单建原"**（工厂方法、抽象工厂、单例、建造者、原型）；
> **结构型"适装外组享桥代"**（适配器、装饰、外观、组合、享元、桥接、代理）；
> **行为型"观状策命备职中模迭访解"**（观察者、状态、策略、命令、备忘录、职责链、中介者、模板方法、迭代器、访问者、解释器）。

### 2.2 场景关键词 → 模式映射表（上午选择 + 下午大题通用）

> **用法**：先读【说明】或题干，找**场景关键词**，下表 1 秒锁定模式；再看选项/类图验证。

| 场景描述 | 关键词 | 对应模式 | 意图一句话 |
|----------|--------|----------|-----------|
| 不同时期推出打折、返利、满减等不同促销活动；多种格式化方式可切换 | "可互换""多种方式""可切换""算法变体" | **策略 Strategy** | 把算法封装成独立类，使它们可以互相替换 |
| 一个对象状态改变时，通知所有关注它的监听者/订阅者 | "通知""订阅""监听""状态变化时自动更新" | **观察者 Observer** | 定义一对多依赖，一方变化时多方自动收到通知 |
| 保证一个类只有一个实例，提供全局访问点 | "只能有一个""唯一实例""全局" | **单例 Singleton** | 保证一个类只有一个实例 |
| 不修改原有类的前提下，动态地给它增加新职责/新行为 | "动态增加""装饰""透明包装""比子类更灵活" | **装饰 Decorator** | 动态地给对象增加职责，避免子类膨胀 |
| 已有类的接口不符合要求，要转换成客户端期望的接口 | "转换接口""兼容""适配""已有类复用" | **适配器 Adapter** | 把一个接口转换成客户端期望的另一个接口 |
| 用一个中介对象封装多个对象的交互，使它们不直接互相引用 | "封装一系列对象交互""中介""协调""解耦多对多" | **中介者 Mediator** | 用中介封装一组对象的交互，松耦合 |
| 把对象组合成树形结构，统一对待单个对象与组合对象 | "树形结构""层叠菜单""部分-整体""目录与文件" | **组合 Composite** | 统一处理个体与组合体（部分-整体层次） |
| 撤销/取消/回退到原先状态；文档回复到历史版本 | "撤销""恢复""回退""历史版本""存档" | **备忘录 Memento** | 保存对象状态，以便以后恢复 |
| 大量细粒度对象占用内存，通过共享相同部分来节省内存 | "共享""节省内存""大量相同对象""内部状态" | **享元 Flyweight** | 共享细粒度对象，降低内存占用 |
| 为复杂子系统提供一个统一的高层入口 | "统一接口""统一入口""一站式""接待员代劳" | **外观 Facade** | 为子系统组提供一致界面，简化调用 |
| 对象的行为随其内部状态改变而改变，想消除大量条件分支 | "随状态改变行为""状态驱动""消除 if-else 分支" | **状态 State** | 状态变则行为变，用状态对象替代条件分支 |
| 把请求封装成对象，支持排队、记录日志、撤销重做 | "封装请求""排队执行""日志""撤销重做" | **命令 Command** | 把请求封装为对象，请求可排队/记录/撤销 |
| 请求沿一条链传递，直到某个处理者处理它 | "层层审批""职责链""传递请求""逐级处理" | **职责链 CoR** | 请求沿链传递，直到被处理，发送者与接收者解耦 |
| 定义创建对象的接口，让子类决定实例化哪个类 | "由子类决定""创建接口""延迟实例化" | **工厂方法 Factory Method** | 子类决定创建哪个具体产品 |
| 创建一族相关或相互依赖的产品，不指定具体类 | "产品族""一系列相关产品""不同平台/主题" | **抽象工厂 Abstract Factory** | 创建一族相关产品，产品族整体替换 |
| 分步骤构建一个复杂对象，同样的构建过程产生不同表示 | "分步骤""复杂对象构建""相同过程不同结果" | **建造者 Builder** | 把复杂对象的构建与表示分离 |

> 💡 **上午选择验证法**：锁定模式后，把选项里**其它三个模式的意图**也想一遍——上午选项常把"状态/策略/中介者"混在一起（如 2021 下 44–46 题），能说出"意图一句话"就不会选错。

---

## 三、常考模式精讲（15 个 + 中介者）

> **每个模式四件套**：意图 → 角色结构（ASCII 类图 + 角色表）→ 代码骨架（Java + C++ 各一版简例）→ 大题常考填空点。
> **代码骨架背不下来没关系，要背的是"角色结构"与"填空点"**——大题的空都在结构的关键位置上。

---

### 3.1 工厂方法（Factory Method）｜创建型

- **意图**：定义一个创建对象的接口，让**子类决定**实例化哪一个类，使对象的创建与使用分离。

**角色结构**：

```text
  «interface» Product                    Creator
  + use() : void                         + factoryMethod() : Product      ← 抽象工厂方法
        △                                      △
        │ 实现（虚线三角）                        │ 泛化（实线三角）
        │                                      │
  ConcreteProduct                    ConcreteCreator
  + use() : void                        + factoryMethod() : Product
                                        { return new ConcreteProduct(); }  ← 填空高发区
```

| 角色 | 职责 |
|------|------|
| 抽象产品 Product | 声明产品的公共接口 |
| 具体产品 ConcreteProduct | 实现接口，是被创建的对象 |
| 抽象工厂 Creator | 声明工厂方法，返回抽象产品类型 |
| 具体工厂 ConcreteCreator | 实现工厂方法，`new` 出具体产品 |

**Java 骨架**：

```java
interface Product { void use(); }
class ConcreteProduct implements Product {
    public void use() { System.out.println("使用具体产品"); }
}
abstract class Creator {
    abstract Product factoryMethod();   // ← 抽象方法，填空点
}
class ConcreteCreator extends Creator {
    Product factoryMethod() { return new ConcreteProduct(); }   // ← 填空点
}
// 客户端
Creator c = new ConcreteCreator();
Product p = c.factoryMethod();   // 用父类类型接收（多态）
p.use();
```

**C++ 骨架**：

```cpp
class Product { public: virtual void use() = 0; virtual ~Product() {} };
class ConcreteProduct : public Product {
public: void use() override { }
};
class Creator {
public:
    virtual Product* factoryMethod() = 0;   // 纯虚函数 = 抽象方法
    virtual ~Creator() {}
};
class ConcreteCreator : public Creator {
public:
    Product* factoryMethod() override { return new ConcreteProduct(); }   // ← 指针返回
};
```

**大题常考填空点**：
1. 抽象工厂方法的声明：**返回类型 = 抽象产品**、无方法体（Java 加 `abstract`，C++ 加 `= 0`）；
2. 具体工厂方法体：`return new ConcreteProduct();`；
3. 客户端：`Product p = creator.factoryMethod();`（变量类型是**抽象产品**，不是具体产品）。

---

### 3.2 抽象工厂（Abstract Factory）｜创建型

- **意图**：提供一个创建**一系列相关或相互依赖对象**（产品族）的接口，而无需指定它们具体的类。

**角色结构**：

```text
  «interface» AbstractFactory                «interface» AbstractProductA      «interface» AbstractProductB
  + createProductA() : AbstractProductA      + opA()                           + opB()
  + createProductB() : AbstractProductB            △                                △
        △                                         │                                │
        │ 泛化                                     │…实现…                          │…实现…
  ConcreteFactory1                        ConcreteProductA1            ConcreteProductB1
  + createProductA() { return new ConcreteProductA1(); }
  + createProductB() { return new ConcreteProductB1(); }
```

> **与工厂方法的核心区别**：工厂方法**一个**工厂方法创建**一种**产品；抽象工厂**多个**工厂方法创建**一族**（多个）产品。题目出现"产品族""不同主题/平台""一系列相关"就是抽象工厂。

**Java 骨架**：

```java
interface AbstractProductA { void opA(); }
interface AbstractProductB { void opB(); }
interface AbstractFactory {
    AbstractProductA createProductA();   // ← 填空点：返回类型是抽象产品
    AbstractProductB createProductB();
}
class ConcreteFactory1 implements AbstractFactory {
    public AbstractProductA createProductA() { return new ConcreteProductA1(); }
    public AbstractProductB createProductB() { return new ConcreteProductB1(); }
}
```

**C++ 骨架**：

```cpp
class AbstractProductA { public: virtual void opA() = 0; virtual ~AbstractProductA() {} };
class AbstractProductB { public: virtual void opB() = 0; virtual ~AbstractProductB() {} };
class AbstractFactory {
public:
    virtual AbstractProductA* createProductA() = 0;
    virtual AbstractProductB* createProductB() = 0;
    virtual ~AbstractFactory() {}
};
```

**大题常考填空点**：
1. 抽象工厂接口里的**每个创建方法的返回类型** = 对应的抽象产品接口；
2. 具体工厂方法体 `return new ConcreteProductX1();`（注意与工厂族编号对应，别串号）；
3. 抽象产品接口的方法签名（由所有具体产品的实现取交集）。

---

### 3.3 单例（Singleton）｜创建型

- **意图**：保证一个类**只有一个实例**，并提供一个全局访问点。
- **2022 上半年上午第 68 题考过定义**："限制类的实例对象只能有一个"。

**角色结构**（单例没有复杂角色，只有一个类）：

```text
  ╭──────────────────────────╮
  │      Singleton            │
  ├──────────────────────────┤
  │ - instance : Singleton   │  ← 静态私有唯一实例（类图下划线 = static）
  ├──────────────────────────┤
  │ - Singleton()             │  ← 私有构造（外部不能 new）
  │ + getInstance() : Singleton   ← 静态全局访问点（下划线 = static）
  ╰──────────────────────────╯
```

**Java 骨架**（两种都认得）：

```java
// 懒汉式
public class Singleton {
    private static Singleton instance = null;      // ← 填空点：static 私有
    private Singleton() {}                          // ← 填空点：构造私有
    public static Singleton getInstance() {
        if (instance == null) { instance = new Singleton(); }   // ← 填空点：判空+创建
        return instance;
    }
}
// 饿汉式（线程安全）
public class Singleton2 {
    private static final Singleton2 instance = new Singleton2();
    private Singleton2() {}
    public static Singleton2 getInstance() { return instance; }
}
```

**C++ 骨架**：

```cpp
class Singleton {
public:
    static Singleton& getInstance() {
        static Singleton instance;    // 局部静态变量，线程安全且只初始化一次 ← 填空点
        return instance;
    }
private:
    Singleton() {}                    // 构造私有
    Singleton(const Singleton&) = delete;                // 禁拷贝构造
    Singleton& operator=(const Singleton&) = delete;     // 禁赋值
};
```

**大题常考填空点**：
1. 私有构造 `private Singleton() {}`（保证外部不能 new）；
2. 静态成员声明 `private static Singleton instance;`；
3. `getInstance()` 内的判空与 `new`（懒汉式）/ 直接返回（饿汉式）；
4. C++ 中返回局部静态变量的引用 `static Singleton instance;`。

---

### 3.4 建造者（Builder）｜创建型

- **意图**：将一个**复杂对象的构建与它的表示分离**，使同样的构建过程可以创建不同的表示。

**角色结构**：

```text
  «interface» Builder                       Director（指挥者）
  + buildPartA() : void                     + construct(Builder b) : Product
  + buildPartB() : void                     {  按固定顺序调用 b.buildPartA()、b.buildPartB()… }
  + getResult() : Product                              │ 使用（依赖，虚线箭头）
        △                                               │
        │ 泛化                                           ▼
  ConcreteBuilder                        （指挥者只认识抽象 Builder）
  - product : Product
  + buildPartA() { product.setA(...); }
  + getResult() { return product; }
```

| 角色 | 职责 |
|------|------|
| 抽象建造者 Builder | 声明逐步构建各部件的方法 + 一个返回产品的方法 |
| 具体建造者 ConcreteBuilder | 实现各部件的构建，持有并装配产品 |
| 指挥者 Director | 按固定顺序调用 Builder 的方法（**不关心具体 Builder 是谁**） |
| 产品 Product | 最终被构建的复杂对象 |

**Java 骨架**：

```java
class Product { private String a, b; /* setters/getters */ }
interface Builder {
    void buildPartA();
    void buildPartB();
    Product getResult();
}
class ConcreteBuilder implements Builder {
    private Product product = new Product();
    public void buildPartA() { product.setA("部件A"); }
    public void buildPartB() { product.setB("部件B"); }
    public Product getResult() { return product; }
}
class Director {
    Product construct(Builder b) {          // 参数类型 = 抽象 Builder
        b.buildPartA();                     // ← 填空点：调用顺序
        b.buildPartB();
        return b.getResult();               // ← 填空点
    }
}
```

**C++ 骨架**：

```cpp
class Builder {
public:
    virtual void buildPartA() = 0;
    virtual void buildPartB() = 0;
    virtual Product* getResult() = 0;
    virtual ~Builder() {}
};
class Director {
public:
    Product* construct(Builder* b) {        // b->buildPartA(); b->buildPartB(); return b->getResult();
    }
};
```

**大题常考填空点**：
1. `Director.construct()` 内的调用链（按顺序 `builder.buildPartA()`、`buildPartB()`…）；
2. `getResult()` 的返回（`return product;` / `return builder.getResult();`）；
3. Director 方法的形参类型 = **抽象 Builder**（不是具体建造者）。

---

### 3.5 适配器（Adapter）｜结构型

- **意图**：将一个类的接口**转换**成客户希望的另一个接口，使原本接口不兼容的类可以一起工作。

**角色结构**（对象适配器，更常用）：

```text
  «interface» Target（客户端期望的接口）              Adaptee（已有的、接口不兼容的类）
  + request() : void                                 + specificRequest() : void
        △                                                    ▲
        │ 实现                                                │ 聚合/关联（Adapter 持有 Adaptee）
        │                                                      │
  Adapter ────────────────────────────────────────────────────┘
  - adaptee : Adaptee
  + request() { adaptee.specificRequest(); }   ← 填空点：委托
```

> **类适配器 vs 对象适配器**：**类适配器**用**继承**（`class Adapter : public Target, private Adaptee`，Java 中 `class Adapter extends Adaptee implements Target`）；**对象适配器**用**组合**（持有 Adaptee 引用）。考试两种都可能考，认"Target 的方法体里调 Adaptee 的方法"即可。

**Java 骨架**（对象适配器）：

```java
interface Target { void request(); }
class Adaptee { void specificRequest() { /* 已有的旧实现 */ } }
class Adapter implements Target {
    private Adaptee adaptee;                       // ← 填空点：持有被适配者
    public Adapter(Adaptee adaptee) { this.adaptee = adaptee; }
    public void request() { adaptee.specificRequest(); }   // ← 填空点：委托
}
```

**C++ 骨架**（类适配器 + 对象适配器）：

```cpp
class Target { public: virtual void request() = 0; virtual ~Target() {} };
class Adaptee { public: void specificRequest() { } };
// 对象适配器（组合）
class Adapter : public Target {
    Adaptee* adaptee;
public:
    Adapter(Adaptee* a) : adaptee(a) {}
    void request() override { adaptee->specificRequest(); }   // 指针用 ->
};
```

**大题常考填空点**：
1. Adapter 的成员声明 `private Adaptee adaptee;`（类型 = 被适配者）；
2. `request()` 方法体：`adaptee.specificRequest();`（委托调用）；
3. 构造器/Setter 里接收并保存被适配者。

---

### 3.6 装饰（Decorator）｜结构型

- **意图**：**动态地**给一个对象增加额外的职责，比生成子类（继承）更灵活。

**角色结构**（注意：**抽象装饰与抽象构件是"实现 + 聚合"双重关系**）：

```text
  «interface» Component
  + operation() : void
        △  ▲
        │  │ Component 还被 Decorator 持有（聚合 ◆────，空心菱形在 Decorator 端）
        │  │
  ConcreteComponent          Decorator（抽象装饰，通常也是抽象类）
  + operation()              - component : Component      ← 类型是抽象构件，不是具体构件
                             + operation() { component.operation(); }   ← 先调被装饰者，再加料
                                   △
                                   │ 泛化
                             ConcreteDecoratorA / ConcreteDecoratorB
                             + operation() { super.operation();  新行为; }
```

> **读图要点（衔接 day17-uml.md）**：`Decorator ──△ Component` 是**实现/继承**，同时 `Decorator ◆── Component` 是**聚合**——这正是"装饰器包装一个被装饰者"的类图表达。填空若问"Decorator 与 Component 之间是什么关系"，答**实现（或泛化）+ 聚合**。

**Java 骨架**：

```java
interface Component { void operation(); }
class ConcreteComponent implements Component {
    public void operation() { /* 核心功能 */ }
}
abstract class Decorator implements Component {
    protected Component component;              // ← 填空点：类型 = 抽象构件
    public Decorator(Component c) { this.component = c; }
    public void operation() { component.operation(); }   // ← 填空点：委托
}
class ConcreteDecoratorA extends Decorator {
    public ConcreteDecoratorA(Component c) { super(c); }
    public void operation() {
        super.operation();                      // 先执行被装饰者的核心功能
        addedBehavior();                        // 再加新职责
    }
    private void addedBehavior() { }
}
```

**C++ 骨架**：

```cpp
class Component { public: virtual void operation() = 0; virtual ~Component() {} };
class Decorator : public Component {
protected:
    Component* component;
public:
    Decorator(Component* c) : component(c) {}
    void operation() override { component->operation(); }   // 指针用 ->
};
```

**大题常考填空点**：
1. 抽象装饰的成员 `protected Component component;`（**抽象类型**）；
2. `operation()` 内 `component.operation();`（先调被装饰者，再执行新增行为——**顺序填反是常见丢分点**）；
3. 具体装饰 `super.operation();` 之后的新增行为语句。

---

### 3.7 外观（Facade）｜结构型

- **意图**：为子系统中的一组接口提供一个**一致的界面**（统一入口），使子系统更易于使用。
- **2022 下半年大题考过**（医院接待：挂号 → 门诊 → 取药）。

**角色结构**：

```text
                    Client（客户端只认识 Facade）
                         │ 依赖
                         ▼
                   ╭──────────╮  Facade（外观/接待员）
                   │ dispose() │  持有一组子系统引用，方法内依次调用
                   ╰─────┬────╯
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     ╭─────────╮   ╭─────────╮   ╭─────────╮
     │ SubSysA  │   │ SubSysB  │   │ SubSysC  │   ← 子系统之间互不感知
     │ step1()  │   │ step2()  │   │ step3()  │
     ╰─────────╯   ╰─────────╯   ╰─────────╯
```

**Java 骨架**：

```java
class SubSystemA { void step1() { } }
class SubSystemB { void step2() { } }
class SubSystemC { void step3() { } }
class Facade {
    private SubSystemA a = new SubSystemA();    // ← 填空点：持有子系统
    private SubSystemB b = new SubSystemB();
    private SubSystemC c = new SubSystemC();
    public void dispose() {                     // 统一入口
        a.step1();                              // ← 填空点：依次调用的调用链
        b.step2();
        c.step3();
    }
}
// 客户端：只 new Facade 并调一个方法
Facade f = new Facade();   f.dispose();
```

**C++ 骨架**：

```cpp
class Facade {
    SubSystemA* a;  SubSystemB* b;  SubSystemC* c;
public:
    Facade() : a(new SubSystemA()), b(new SubSystemB()), c(new SubSystemC()) {}
    void dispose() { a->step1(); b->step2(); c->step3(); }   // ← 调用链
    ~Facade() { delete a; delete b; delete c; }
};
```

**大题常考填空点**：
1. Facade 方法体内的**调用链**（按业务顺序 `a.step1(); b.step2(); ...`）；
2. Facade 持有子系统成员的声明；
3. 客户端只与 Facade 交互（`new Facade()` + 一个方法调用）。

---

### 3.8 组合（Composite）｜结构型

- **意图**：将对象组合成**树形结构**以表示"部分-整体"层次，使客户端**统一对待**单个对象与组合对象。
- **2021 上半年大题考过**（层叠菜单：菜单项 + 子菜单）。

**角色结构**：

```text
  «interface» / abstract Component
  + operation() : void
  + add(Component) / remove(Component) / getChild(int)     ← 叶子与组合的公共接口
        △                          ▲
        │ 泛化                      │ 聚合（◆──── 递归自包含！）
        │                            │
  Leaf（叶子）                  Composite（组合）
  + operation() { 具体行为 }    - children : List<Component>   ← 元素类型是抽象构件
  + add() { 抛异常/空实现 }     + operation() { for(child : children) child.operation(); }  ← 递归！
                                + add(Component c) { children.add(c); }
```

> **最醒目的类图特征**：Composite **自己聚合自己**（`Composite ◆── Component`，递归结构），这是组合模式的**身份标志**。读图时看到"一个类的集合元素就是它自己的父类型/接口类型"，几乎就是组合。

**Java 骨架**：

```java
abstract class Component {
    public abstract void operation();
    public void add(Component c) { throw new UnsupportedOperationException(); }
    public void remove(Component c) { throw new UnsupportedOperationException(); }
}
class Leaf extends Component {                    // 叶子：不可再 add
    public void operation() { /* 具体行为 */ }
}
class Composite extends Component {
    private List<Component> children = new ArrayList<>();   // ← 填空点：List<抽象构件>
    public void add(Component c) { children.add(c); }
    public void operation() {
        for (Component child : children) { child.operation(); }   // ← 填空点：递归调用
    }
}
```

**C++ 骨架**：

```cpp
class Component {
public:
    virtual void operation() = 0;
    virtual void add(Component*) { }     // 叶子默认空实现
    virtual ~Component() {}
};
class Composite : public Component {
    std::vector<Component*> children;    // ← vector<抽象构件*>
public:
    void add(Component* c) { children.push_back(c); }
    void operation() override {
        for (auto* child : children) { child->operation(); }   // 递归
    }
};
```

**大题常考填空点**：
1. Composite 的集合成员 `List<Component>`（**元素类型 = 抽象构件**，不是 Composite 自己）；
2. `operation()` 内的**递归**调用 `child.operation();`；
3. 抽象构件里的 `add/remove` 方法签名（叶子的实现为空/抛异常）。

---

### 3.9 享元（Flyweight）｜结构型

- **意图**：运用**共享**技术有效地支持大量细粒度对象的复用，降低内存占用。
- **2021 下半年大题考过**（Java 围棋：黑白棋子共享）。
- **核心思想**：**内部状态（可共享，如棋子颜色）与外部状态（不共享，如落子位置）分离**。

**角色结构**：

```text
  «interface» Flyweight
  + operation(UnsharedFlyweight extState) : void     ← 外部状态作参数传入
        △
        │
  ConcreteFlyweight                      FlyweightFactory（享元工厂）
  - intrinsicState（内部状态，共享）      - pool : Map<Key, Flyweight>   ← 缓存池
  + operation(extState)                   + getFlyweight(Key) : Flyweight
                                               { 若池中没有则 new 并放入；有则直接返回 }
                                                     ▲
  UnsharedFlyweight（外部状态，不共享）          │ 客户端：把外部状态作为参数传给共享对象
```

**Java 骨架**：

```java
interface Flyweight { void operation(String extState); }
class ConcreteFlyweight implements Flyweight {
    private String intrinsicState;                    // 内部状态（共享）
    public ConcreteFlyweight(String s) { this.intrinsicState = s; }
    public void operation(String extState) { /* 用 内部+外部 状态 */ }
}
class FlyweightFactory {
    private static final Map<String, Flyweight> pool = new HashMap<>();
    public static Flyweight getFlyweight(String key) {
        if (!pool.containsKey(key))
            pool.put(key, new ConcreteFlyweight(key));     // ← 填空点：没有则造并放入
        return pool.get(key);                              // ← 填空点：有则复用
    }
}
```

**C++ 骨架**：

```cpp
class Flyweight { public: virtual void operation(std::string extState) = 0; virtual ~Flyweight() {} };
class FlyweightFactory {
    std::map<std::string, Flyweight*> pool;
public:
    Flyweight* getFlyweight(const std::string& key) {
        if (pool.find(key) == pool.end())
            pool[key] = new ConcreteFlyweight(key);   // 造并放入池
        return pool[key];                              // 复用
    }
};
```

**大题常考填空点**：
1. 工厂的缓存池声明 `Map<Key, Flyweight>`（**值类型 = 抽象享元**）；
2. 工厂方法内的**判空 + put + get** 三步；
3. 局部变量用**抽象享元类型**接收（多态）；
4. `operation()` 的形参 = **外部状态**（外部状态一定作参数传入，不作成员）。

---

### 3.10 观察者（Observer）｜行为型

- **意图**：定义对象间**一对多**的依赖关系：当一个对象（主题）的状态发生变化时，所有依赖它的对象（观察者）都得到通知并自动更新。
- **2022 上半年上午第 67 题考过定义**；2023 上半年试题三问题 3 结合 UML 考。

**角色结构**：

```text
  «interface» Observer                       Subject（抽象主题）
  + update() : void                          - observers : List<Observer>   ← 观察者集合
        △                                    + attach(Observer) / detach(Observer)
        │                                    + notify() { for(o : observers) o.update(); }  ← 遍历通知
        │                                            ▲
  ConcreteObserver                            ConcreteSubject
  - observerState                             - subjectState（主题状态）
  + update() { 拉取主题状态并更新自己 }        + setState() { 状态改变后调 notify(); }
```

**Java 骨架**：

```java
interface Observer { void update(); }
abstract class Subject {
    protected List<Observer> observers = new ArrayList<>();   // ← 填空点：List<Observer>
    public void attach(Observer o) { observers.add(o); }
    public void detach(Observer o) { observers.remove(o); }
    public void notifyObservers() {                            // 注意：Java 中不能定义 notify()（Object 的 final 方法）
        for (Observer o : observers) { o.update(); }          // ← 填空点：遍历调用 update
    }
}
class ConcreteSubject extends Subject {
    private int state;
    public void setState(int s) { this.state = s; notifyObservers(); } // ← 填空点：状态改变后通知
}
class ConcreteObserver implements Observer {
    public void update() { /* 拉取主题状态、更新自己 */ }
}
```

**C++ 骨架**：

```cpp
class Observer { public: virtual void update() = 0; virtual ~Observer() {} };
class Subject {
protected:
    std::vector<Observer*> observers;
public:
    void attach(Observer* o) { observers.push_back(o); }
    void notifyObservers() { for (auto* o : observers) o->update(); }
};
```

**大题常考填空点**：
1. Subject 的成员 `List<Observer> observers`（元素类型 = **抽象观察者**）；
2. `notifyObservers()` 内遍历 `o.update();`；
3. 具体主题 `setState()` 末尾调 `notifyObservers();`（**漏掉这步是常见丢分点**）；
4. `attach/detach` 的签名（由调用处反推）。

**试题三答题模板**（选模式 + 解释，3 分）：
> 观察者模式适用于当一个对象的状态发生改变时，所有依赖于它的对象都得到通知并被自动更新。本需求中"……（如：库存数据）"是主题，"……（如：各展示界面）"是观察者，当……发生时自动通知所有……，故选观察者模式。

---

### 3.11 状态（State）｜行为型

- **意图**：允许一个对象在其**内部状态改变时改变它的行为**，对象看起来似乎修改了它的类（用状态对象替代庞大的条件分支）。
- **2021 下半年上午 44/46 题选项涉及**其适用场景："一个对象的行为决定于其状态且必须在运行时刻根据状态改变行为"。

**角色结构**：

```text
  Context（环境类，持有当前状态）
  - state : State          ← 类型是抽象状态
  + request() { state.handle(this); }     ← 把行为委托给状态对象
  + setState(State)
        │ 聚合/关联（Context 持有 State）
        ▼
  «interface» / abstract State
  + handle(Context) : void
        △
        │
  ConcreteStateA                      ConcreteStateB
  + handle(Context c)                 + handle(Context c)
    { 处理A; c.setState(new ConcreteStateB()); }   ← 处理完可切换状态
```

**Java 骨架**：

```java
interface State { void handle(Context ctx); }
class Context {
    private State state;                       // ← 填空点：类型 = 抽象状态
    public void setState(State s) { this.state = s; }
    public void request() { state.handle(this); }   // ← 填空点：委托
}
class ConcreteStateA implements State {
    public void handle(Context ctx) {
        /* 状态A下的行为 */
        ctx.setState(new ConcreteStateB());    // ← 填空点：切换到下一状态
    }
}
```

**C++ 骨架**：

```cpp
class State { public: virtual void handle(Context* ctx) = 0; virtual ~State() {} };
class Context {
    State* state;
public:
    void setState(State* s) { state = s; }
    void request() { state->handle(this); }    // 委托给状态对象
};
```

**大题常考填空点**：
1. Context 的成员类型 = **抽象状态**；
2. `request()` 方法体 `state.handle(this);`（一句委托，常带 `this` 参数）；
3. 具体状态的 `handle()` 内切换状态 `ctx.setState(new ConcreteStateB());`。

> **状态 vs 策略**（极易混）：**策略**是客户端**主动选**一个算法，策略之间**互不知道**；**状态**是状态对象**自己**在 handle 完后**自动切换**到下一状态，状态之间互相感知（`ctx.setState(...)`）。题目出现"状态流转/生命周期/自动切换"是状态；出现"可互换/多种算法/客户端选择"是策略。

---

### 3.12 策略（Strategy）｜行为型

- **意图**：定义一系列算法，把它们各自封装成**可互换**的策略类，使算法的变化**独立于**使用算法的客户端。
- **2021 下半年上午第 47 题考过**（打折/返利/满减促销）；2023 上半年大题考过（Java 区间格式打印）。

**角色结构**：

```text
  Context（环境类）
  - strategy : Strategy       ← 类型是策略接口
  + setStrategy(Strategy)
  + contextMethod() { strategy.doSomething(this); }   ← 一句委托
        │ 聚合
        ▼
  «interface» Strategy
  + doSomething(Context) : void
        △
        ├── ConcreteStrategyA ──┬── ConcreteStrategyB ──┬── ConcreteStrategyC
```

**Java 骨架**：

```java
interface Strategy { void doSomething(Context ctx); }
class ConcreteStrategyA implements Strategy {
    public void doSomething(Context ctx) { /* 算法A */ }
}
class Context {
    private Strategy strategy;                  // ← 填空点：类型 = 策略接口
    public void setStrategy(Strategy s) { this.strategy = s; }
    public void contextMethod() {
        strategy.doSomething(this);             // ← 填空点：委托（常带 this）
    }
}
// 客户端
Context ctx = new Context();
ctx.setStrategy(new ConcreteStrategyA());      // ← 填空点：按类型造具体策略
ctx.contextMethod();
```

**C++ 骨架**：

```cpp
class Strategy { public: virtual void doSomething(Context* ctx) = 0; virtual ~Strategy() {} };
class Context {
    Strategy* strategy;
public:
    void setStrategy(Strategy* s) { strategy = s; }
    void contextMethod() { strategy->doSomething(this); }
};
```

**大题常考填空点**：
1. Context 的成员类型 = **策略接口**；
2. `contextMethod()` 方法体**只有一句** `strategy.doSomething(this);`；
3. 客户端/工厂方法里按类型造策略 `new ConcreteStrategyX();`（常出现在 `switch` 语句的各分支）。

---

### 3.13 命令（Command）｜行为型

- **意图**：将一个**请求封装为一个对象**，从而可用不同的请求对客户进行参数化、对请求排队或记录日志、支持**撤销（undo）**。

**角色结构**：

```text
  Invoker（调用者）  ──持有──▶  «interface» Command           Receiver（接收者，真正干活的人）
  + invoke()                      + execute() : void          + action() : void
  + undo()                        + undo() : void                  ▲
                                       △                          │ 聚合（具体命令持有接收者）
                                       │                          │
                                 ConcreteCommand ─────────────────┘
                                 - receiver : Receiver
                                 + execute() { receiver.action(); }   ← 委托给接收者
```

**Java 骨架**：

```java
class Receiver { void action() { /* 真正的业务 */ } }
interface Command { void execute(); }
class ConcreteCommand implements Command {
    private Receiver receiver;                 // ← 填空点：持有接收者
    public ConcreteCommand(Receiver r) { this.receiver = r; }
    public void execute() { receiver.action(); }   // ← 填空点：委托
}
class Invoker {
    private Command command;                   // ← 填空点：类型 = 抽象命令
    public void setCommand(Command c) { this.command = c; }
    public void invoke() { command.execute(); }
}
```

**C++ 骨架**：

```cpp
class Command { public: virtual void execute() = 0; virtual ~Command() {} };
class ConcreteCommand : public Command {
    Receiver* receiver;
public:
    ConcreteCommand(Receiver* r) : receiver(r) {}
    void execute() override { receiver->action(); }   // 指针用 ->
};
class Invoker {
    Command* command;
public:
    void invoke() { command->execute(); }
};
```

**大题常考填空点**：
1. 具体命令的成员 `private Receiver receiver;`（类型 = 接收者）；
2. `execute()` 方法体 `receiver.action();`（委托）；
3. Invoker 的成员类型 = **抽象命令**；
4. `undo()` 方法体（反向操作或配合备忘录）。

---

### 3.14 备忘录（Memento）｜行为型

- **意图**：在不破坏封装性的前提下，**捕获并保存**一个对象的内部状态，以便以后**恢复**。
- **2022 上半年大题考过 C++/Java 双版本**（状态撤销）。
- **记忆口诀**：**发起人存进备忘录、管理者只搬运、恢复时再取回**。

**角色结构**：

```text
  Originator（发起人）                     Memento（备忘录，封装状态）
  - state : State                         - state : State
  + saveStateToMemento() : Memento        + Memento(State)   ← 构造时写入（只写一次）
    { return new Memento(this.state); }   + getState() : State   ← 只能读
  + getStateFromMemento(Memento m)
    { this.state = m.getState(); }
        │                                        ▲
        └────────────────────────────────────────┘ 发起人创建/读取备忘录

  Caretaker（管理者，只搬运不改内容）
  - list : List<Memento>
  + add(Memento) / + get(int) : Memento
```

**Java 骨架**：

```java
class Memento {
    private String state;
    public Memento(String state) { this.state = state; }    // 构造写入
    public String getState() { return state; }              // 只读
}
class Originator {
    private String state;
    public void setState(String s) { this.state = s; }
    public Memento saveStateToMemento() {
        return new Memento(this.state);                     // ← 填空点：打包成备忘录返回
    }
    public void getStateFromMemento(Memento m) {
        this.state = m.getState();                          // ← 填空点：从备忘录取回
    }
}
class CareTaker {
    private List<Memento> list = new ArrayList<>();
    public void add(Memento m) { list.add(m); }             // ← 填空点：签名由调用处反推
    public Memento get(int index) { return list.get(index); }
}
```

**C++ 骨架**：

```cpp
class Memento {
    std::string state;
public:
    Memento(std::string s) : state(s) {}
    std::string getState() { return state; }
};
class Originator {
    std::string state;
public:
    Memento* saveStateToMemento() { return new Memento(this->state); }
    void getStateFromMemento(Memento* m) { this->state = m->getState(); }
};
class CareTaker {
    std::vector<Memento*> mementoList;
public:
    void add(Memento* m) { mementoList.push_back(m); }
    Memento* get(int index) { return mementoList[index]; }   // 返回类型 = 容器元素类型
};
```

**大题常考填空点**：
1. 发起人的"存档"方法 `return new Memento(this.state);`；
2. 发起人的"恢复"方法 `this.state = memento.getState();`；
3. 管理者的 `add(Memento)` / `get(int)` 方法签名（**由方法体 + main 调用处反推**：`return mementoList[index];` ⇒ 返回类型是 `Memento`）；
4. 客户端调用链 `careTaker.add(originator.saveStateToMemento());`。

---

### 3.15 职责链（Chain of Responsibility）｜行为型

- **意图**：使多个对象都有机会处理请求，从而**避免请求发送者与接收者的耦合**；请求沿链传递，直到有一个对象处理它。

**角色结构**（注意 Handler **自引用**——这是本模式的身份标志）：

```text
  «interface» / abstract Handler
  - successor : Handler      ← 后继处理者（类型是自己！自关联）
  + setSuccessor(Handler)
  + handleRequest(Request)   { if (能处理) 处理之; else if (successor != null) successor.handleRequest(req); }
        △
        ├── ConcreteHandlerA ──┬── ConcreteHandlerB ──┬── ConcreteHandlerC
        （链：A → B → C，请求从 A 开始沿 successor 传递）
```

**Java 骨架**：

```java
abstract class Handler {
    protected Handler successor;              // ← 填空点：类型是自己（自关联）
    public void setSuccessor(Handler s) { this.successor = s; }
    public abstract void handleRequest(String req);
}
class ConcreteHandlerA extends Handler {
    public void handleRequest(String req) {
        if (req.equals("A 能处理")) { /* 处理 */ }
        else if (successor != null) { successor.handleRequest(req); }   // ← 填空点：转发给后继
    }
}
// 客户端组装链
Handler a = new ConcreteHandlerA();
Handler b = new ConcreteHandlerB();
a.setSuccessor(b);                           // ← 填空点：串链
a.handleRequest("某请求");
```

**C++ 骨架**：

```cpp
class Handler {
protected:
    Handler* successor;
public:
    void setSuccessor(Handler* s) { successor = s; }
    virtual void handleRequest(const std::string& req) = 0;
    virtual ~Handler() {}
};
class ConcreteHandlerA : public Handler {
public:
    void handleRequest(const std::string& req) override {
        if (req == "A 能处理") { /* 处理 */ }
        else if (successor != nullptr) { successor->handleRequest(req); }
    }
};
```

**大题常考填空点**：
1. Handler 的成员 `protected Handler successor;`（**自引用类型**）；
2. `handleRequest()` 内的**双分支**：能处理则处理，否则 `successor.handleRequest(req);`；
3. `setSuccessor` 的签名与赋值；
4. 客户端组装链的 `a.setSuccessor(b);`。

---

### 3.16 中介者（Mediator）｜行为型｜**上午高频，必学**

- **意图**：用一个**中介对象**封装一组对象的交互，使各对象不需要显式地互相引用（解耦多对多），而且可以独立地改变它们之间的交互。
- **2021 下半年上午第 44–46 题三连考**（正是今天上午重做题 20）；**2020 下半年大题考过**（Java 支付整合）。

**角色结构**：

```text
  «interface» Mediator                       Colleague（抽象同事，持有中介者）
  + relay(Colleague, msg)                    - mediator : Mediator
        △                                    + send(msg) { mediator.relay(this, msg); }   ← 不直接找对方，找中介
        │                                          ▲
  ConcreteMediator                            ConcreteColleagueA / ConcreteColleagueB
  - colleagueA, colleagueB : Colleague        （彼此不直接引用）
  + relay(Colleague sender, msg)
    { if (sender == A) B.receive(msg); else A.receive(msg); }
```

> **判别标志**：题目说"用一个对象**封装一系列对象交互**、使对象间**不直接互相引用**、**耦合松散**"——必是中介者。类图特征：多个同事类**互不相连**，全都只连到中介者（**星型结构**）。

**Java 骨架**：

```java
abstract class Colleague {
    protected Mediator mediator;              // ← 填空点：同事持有中介者
    public Colleague(Mediator m) { this.mediator = m; }
    public abstract void receive(String msg);
    public void send(String msg) { mediator.relay(this, msg); }   // ← 填空点：委托给中介
}
interface Mediator { void relay(Colleague sender, String msg); }
class ConcreteMediator implements Mediator {
    private Colleague a, b;
    public void setA(Colleague a) { this.a = a; }
    public void setB(Colleague b) { this.b = b; }
    public void relay(Colleague sender, String msg) {
        if (sender == a) { b.receive(msg); } else { a.receive(msg); }   // ← 填空点：转发规则
    }
}
```

**C++ 骨架**：

```cpp
class Colleague {
protected:
    Mediator* mediator;
public:
    Colleague(Mediator* m) : mediator(m) {}
    virtual void receive(const std::string& msg) = 0;
    void send(const std::string& msg) { mediator->relay(this, msg); }   // 找中介
    virtual ~Colleague() {}
};
```

**大题常考填空点**：
1. 同事类的成员 `protected Mediator mediator;`（类型 = 中介者接口）；
2. 同事类的 `send()` 方法体 `mediator.relay(this, msg);`（**一句委托**）；
3. 具体中介者的 `relay()` 内的转发规则（按业务把消息转给目标同事）；
4. 中介者持有各同事成员的声明。

**上午三连考的固定答法**（2021 下 44–46）：
- （44）模式识别 → **中介者（Mediator）**；
- （45）分类 → **行为型对象**（行为型关注对象间职责分配与通信；创建型关注创建、结构型关注组合）；
- （46）适用场景 → "**一组对象以定义良好但复杂的方式进行通信，产生的相互依赖关系结构混乱且难以理解**"。

---

## 四、大题答题三步法（试题五/六通用）

> **口诀**：**一判模式、二对角色、三填代码。**

### 第 1 步：读【说明】定位场景关键词，判模式（1 分钟内）

- 圈出【说明】里的**动词和场景词**：出现"共享/节省内存"→ 享元；"撤销/恢复"→ 备忘录；"统一入口"→ 外观；"多种方式/可切换"→ 策略；"不直接交互/中介协调"→ 中介者；"树形/部分-整体"→ 组合；"转换接口"→ 适配器；"动态增加职责"→ 装饰；"唯一实例"→ 单例；"状态改变通知"→ 观察者（详见 §2.2 表）。
- **判错模式全盘皆输**，所以这一步宁慢勿快：把判出的模式的**意图一句话**默念一遍，与【说明】主旨核对是否吻合。

### 第 2 步：对照类图找角色对应（谁是 Subject、谁是 ConcreteStrategy…）

- 拿判出的模式的**角色表**（§三各小节）去套类图：
  - 谁是**接口/抽象类**（类名斜体、标 `«interface»`）→ 对应抽象角色（Product / Strategy / Subject / Component…）；
  - 谁被**菱形连接**（◆/◆◆）→ 是被持有/被包含的一方（被装饰者、被适配者、子构件）；
  - 谁被**多个类共同指向**（星型中心）→ 是中介者/主题/工厂；
  - 谁**自引用**（集合元素是自己的父类型 / 成员类型是自己）→ 组合（List<Component>）或职责链（Handler successor）。
- **在草稿纸上写下"类图类名 → 模式角色名"的对照清单**，后面填空直接按清单对应。

### 第 3 步：依多态与继承关系填代码空（逐空三类）

| 空的位置 | 填法 | 例子 |
|---------|------|------|
| **抽象方法/接口方法声明** | 把所有**具体子类已实现**的方法签名抄一遍取交集；注意三要素：**修饰符**（不窄于子类）+ `abstract`（C++ 是 `= 0`）+ **返回类型+方法名+参数表** | `abstract Product factoryMethod();` |
| **容器/变量类型** | 同一变量/集合要装多个具体子类 → 填**它们的共同父类或接口**，不填具体子类 | `List<Component> children;`（不是 `List<Composite>`） |
| **方法签名（空在声明处）** | 由**方法体 + 调用处**反推：方法体里用了 `state`、`index` ⇒ 形参名/类型确定；`main` 里 `xxx->add(...)` ⇒ 方法名、参数个数确定；方法体 `return list[index];` ⇒ 返回类型 = 容器元素类型 | `Memento* get(int index)` |
| **方法体语句（空在方法内）** | 找该角色的**职责模板**：工厂造对象 `return new ConcreteX();`；委托类一句 `target.method();`；递归/遍历 `child.operation();`；切换状态/策略 `ctx.setState(new X());` | `strategy.doSomething(this);` |

**填完自检 3 条**：
1. **语法完整**：分号、等号、`->`（C++ 指针）/ `.`（Java 引用）不能少或混；
2. **类型自洽**：每个空填入后，编译能过（返回类型与接收变量匹配、参数个数匹配）；
3. **多态正确**：父类引用调子类方法时，方法必须是**父类/接口中声明过**的（否则编译不过）。

---

## 五、与 day17-uml.md 的类图知识衔接

模式类图**全部由 day17 学过的六种关系构成**（依赖 < 关联 < 聚合 < 组合 < 泛化 ≈ 实现）。读模式类图时按下表"翻译"：

| UML 关系 | 在模式类图中的含义 | 典型模式 |
|---------|------------------|---------|
| **泛化**（实线空心三角，指向父类） | 具体角色继承抽象角色：具体产品↔抽象产品、具体工厂↔抽象工厂、具体状态↔抽象状态 | 工厂方法、抽象工厂、状态、策略、装饰、组合 |
| **实现**（虚线空心三角，指向接口） | 类实现接口：适配器实现 Target、同事/具体主题实现接口 | 适配器、观察者、策略、命令、中介者 |
| **聚合**（空心菱形在整体端） | "持有对方引用、但对方可独立存在"：**装饰持有被装饰者**、**适配器持有被适配者**、**环境类持有策略/状态**、**主题持有观察者集合**、**外观持有子系统**、**上下文持有中介者** | 装饰、适配器、策略、状态、观察者、外观、中介者、命令 |
| **组合**（实心菱形在整体端） | "整体创建并管理部分、同生共死"：外观在构造时 new 子系统、享元工厂创建并缓存享元 | 外观、享元工厂 |
| **关联**（实线箭头） | 长期持有但地位平等：同事之间**不直接关联**（中介者模式的关键特征）、Director 使用 Builder | 中介者、建造者 |
| **依赖**（虚线开放箭头） | 临时使用：客户端临时使用工厂/外观；享元的外部状态作**方法参数**传入 | 享元、工厂方法的客户端 |

> **读图三句真言**（衔接 day17 §2.2）：
> 1. **菱形永远在"整体/持有者"一端**——模式类图里看到菱形，先问"谁持有谁"（装饰器持有被装饰者 = 装饰；组合持有子构件 = 组合模式）；
> 2. **三角永远指向"更抽象"的一端**——泛化指向父类、实现指向接口，填空若问"X 与 Y 是什么关系"，看符号方向即可作答；
> 3. **自聚合/自关联是强信号**——一个类的集合元素类型或成员类型是**它自己的父类型**，几乎必然是**组合模式**（List<Component>）或**职责链模式**（Handler successor）。

**多重性在模式类图中的读法**（衔接 day17 §2.5）：
- `Subject 1 ──── * Observer`：一个主题对应**多个**观察者（一对多）；
- `FlyweightFactory 1 ──── * Flyweight`：一个工厂缓存**多个**享元；
- `Composite 1 ──── * Component`：一个组合节点包含**多个**子构件（递归树）；
- `Mediator 1 ──── * Colleague`：一个中介协调**多个**同事。

---

## 六、Java vs C++ 语言细节对照（选答前看一眼）

| 考点 | Java | C++ | 易错 |
|------|------|-----|------|
| 抽象方法 | `public abstract void draw();` | `virtual void draw() = 0;`（纯虚函数） | C++ 用 `= 0`，**没有** `abstract` 关键字 |
| 抽象类 | `abstract class X { }` | 含纯虚函数的类即为抽象类 | C++ 的抽象类可以有构造函数 |
| 对象创建 | `X x = new X();`（返回引用） | `X x;`（栈对象）或 `X* p = new X();`（堆指针） | C++ **指针 vs 对象**语义不同 |
| 成员访问 | 引用用 `.`：`x.draw()` | 指针用 `->`：`p->draw()`；对象用 `.` | **指针调方法必须 `->`**，最常见丢分点 |
| 泛型集合 | `ArrayList<Piece>` / `List<Piece>` | `vector<Memento>` / `list<Memento>` | C++ 是 `vector<类型>`，无菱形语法 |
| 继承 | `class A extends B` | `class A : public B` | C++ 有访问限定符 `public/private` |
| 实现接口 | `class A implements I` | `class A : public I`（I 是纯虚基类） | C++ **无** `implements` 关键字 |
| 静态成员 | `static`（类图下划线） | `static`（类图下划线） | 单例模式必考 |
| 内存管理 | 自动 GC | `new` 的对象要 `delete`，或用局部静态/智能指针 | C++ 析构函数 `virtual ~X() {}` 防泄漏 |

> 💡 **选答决策**：Java 语法更"直白"（`abstract`/`new`/`extends`/`implements` 一一对应），**建议选试题六（Java）**，填空更少踩语言细节的坑；若 C++ 更熟，务必盯紧 `->` 与 `.`、`= 0`、`: public`。

---

## 七、一页纸速记（考前扫这一页）

1. **三大分类**：创建型（工抽单建原）管"怎么创建"、结构型（适装外组享桥代）管"怎么组合"、行为型（观状策命备职中模迭访解）管"怎么协作"。
2. **试题五/六** = C++/Java **二选一**，15 分全在 4~6 个填空上；题目结构 = 【说明】+ 类图 + 代码骨架。
3. **填空只考三类**：模式角色名、方法签名、多态调用语句。
4. **识别关键词**：共享→享元、撤销→备忘录、统一入口→外观、可切换算法→策略、中介协调→中介者、树形→组合、转接口→适配器、动态加职责→装饰、唯一实例→单例、状态变通知→观察者、随状态变行为→状态、封装请求→命令、逐级传递→职责链。
5. **答题三步法**：一判模式（关键词表）、二对角色（角色表套类图）、三填代码（三类空 + 三条自检）。
6. **填空三招**：抽象方法看子类签名取交集、容器/变量类型取共同父类、方法签名由方法体+调用处反推。
7. **结构强信号**：**自聚合/自引用** → 组合或职责链；**星型中心** → 中介者或主题；**装饰 = 实现 + 聚合双关系**；**工厂必有 `return new ConcreteX();`**。
8. **易混辨析**：策略（客户端主动选、互不感知）vs 状态（自动切换、状态间互相感知）；工厂方法（一厂一产品）vs 抽象工厂（一厂一族产品）；适配器（转换接口）vs 装饰（增强职责）vs 外观（简化入口）。
9. **UML 翻译**：菱形在持有者端、三角指向更抽象端；聚合 = 持有引用（策略/状态/观察者/装饰/适配器/中介者）、组合 = 创建并管理（外观/享元工厂）。
10. **语言细节**：C++ 纯虚 `= 0`、指针用 `->`、继承 `: public`、集合 `vector<T>`；Java `abstract`/`extends`/`implements`。建议选 Java（试题六）。
11. **必背角色结构**（大题最高频 6 个）：享元（工厂+池+内外状态分离）、备忘录（发起人存/取、管理者只搬运）、外观（调用链）、策略（一句委托）、中介者（同事找中介）、组合（List<构件> + 递归）。

---

## 八、本日学习路线（配合 study plan）

| 步骤 | 内容 | 用时 | 产出 |
|------|------|------|------|
| Step 1 | 重做 Day 18–19 错题：`docs/practice/review-round2.md`（20 题组，含卷 3 第 44–46 题中介者三连） | 2h | 重做正确率填入统计表 |
| Step 2 | **本笔记**（设计模式三大分类 + 15 个模式精讲 + 识别表 + 三步法） | 2.5h | §七速记能口头复述；15 个模式的"意图一句话"能脱口而出 |
| Step 3 | 打卡：`tracker.md` Day 20 行（重做正确率）+ `reflection.md` Day 20 节（仍错题四要素） | 1.5h | 重做正确率 + 设计模式自评 |

**本日自评清单（Step 3 打卡前对照）**：
- ☐ 能说出三大分类各自关注什么，并能把 15 个常考模式归入正确分类；
- ☐ 看到 15 个关键词能 1 秒说出对应模式与意图；
- ☐ 能画出 6 个高频模式（享元/备忘录/外观/策略/中介者/组合）的角色结构草图；
- ☐ 能写出每个模式 Java 与 C++ 至少一版的代码骨架；
- ☐ 能复述答题三步法与填空三招；
- ☐ 卷 3 第 44–46 题重做正确（否则回看 §3.16）。
