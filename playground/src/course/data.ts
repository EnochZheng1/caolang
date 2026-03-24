import type { Course } from "./types.js";

export const COURSE: Course = {
  title: "草语言大师之路",
  chapters: [
    // ═══════════════════════════════════════════════
    // 第一章: Hello, 草世界 (入门篇)
    // ═══════════════════════════════════════════════
    {
      id: 1,
      title: "Hello, 草世界",
      subtitle: "入门篇",
      emoji: "🌱",
      lessons: [
        // ── 1-1 开口说话 ──
        {
          id: "1-1",
          title: "开口说话",
          instruction: `<h2>第一课：开口说话 🔊</h2>
<p>恭喜你踏入<strong>草语言</strong>的世界！在这片神奇的土地上，我们不说 <code>print</code>，我们<strong>喊话</strong>！</p>
<p>就像你在群里发消息一样，想让程序说点什么，就用 <code>喊话（）</code>：</p>
<pre class="code-block">喊话（"你好世界"）</pre>
<p>注意！我们用的是<strong>中文标点</strong>——圆括号 <code>（）</code> 和引号 <code>""</code>，用英文标点会寄！</p>
<div class="task-box"><strong>🎯 任务：</strong>让程序喊出 <code>你好世界</code>，迈出你的草语言第一步！</div>`,
          starterCode: `// 在这里写你的第一行草语言代码\n// 提示：喊话（"内容"）\n`,
          task: "使用 喊话 输出「你好世界」",
          expectedOutput: ["你好世界"],
          validationMode: "exact",
          hints: [
            { text: "草语言的打印函数叫「喊话」，用中文括号包裹内容" },
            { text: "答案：喊话（\"你好世界\"）" },
          ],
          solutionCode: `喊话（"你好世界"）`,
        },

        // ── 1-2 数学不好也得学 ──
        {
          id: "1-2",
          title: "数学不好也得学",
          instruction: `<h2>第二课：数学不好也得学 🧮</h2>
<p>别慌，草语言的数学跟你上学时一样——先乘除后加减。不信你看：</p>
<pre class="code-block">喊话（2 + 3 * 4）  // 输出 14，不是 20！</pre>
<p>还有个好东西叫<strong>取模</strong>（<code>%</code>），就是算余数：</p>
<pre class="code-block">喊话（10 % 3）  // 10 除以 3 余 1</pre>
<p>数学老师看到这里应该会很欣慰。</p>
<div class="task-box"><strong>🎯 任务：</strong>分两行分别输出 <code>2+3*4</code> 的结果和 <code>10%3</code> 的结果。</div>`,
          starterCode: `// 第一行：喊出 2 + 3 * 4 的结果\n// 第二行：喊出 10 % 3 的结果\n`,
          task: "输出 2+3*4 的结果（14）和 10%3 的结果（1）",
          expectedOutput: ["14", "1"],
          validationMode: "exact",
          hints: [
            { text: "喊话可以直接放数学表达式，不需要引号" },
            { text: "喊话（2 + 3 * 4） 会先算乘法再算加法" },
            { text: "答案：喊话（2 + 3 * 4）\\n喊话（10 % 3）" },
          ],
          solutionCode: `喊话（2 + 3 * 4）\n喊话（10 % 3）`,
        },

        // ── 1-3 搞个变量 ──
        {
          id: "1-3",
          title: "搞个变量",
          instruction: `<h2>第三课：搞个变量 📦</h2>
<p>在草语言里，声明变量不用 <code>let</code>，我们说<strong>「搞个」</strong>！因为编程就是搞事情嘛。</p>
<pre class="code-block">搞个 名字 = "张三"
搞个 年龄 = 18
喊话（名字）   // 张三
喊话（年龄）   // 18</pre>
<p>变量还能<strong>重新赋值</strong>（渣男行为）：</p>
<pre class="code-block">搞个 心情 = "开心"
心情 = "难过"  // 变心了！
喊话（心情）   // 难过</pre>
<div class="task-box"><strong>🎯 任务：</strong>搞个变量 <code>x</code> 等于 <code>10</code>，喊出来，然后改成 <code>20</code>，再喊出来。</div>`,
          starterCode: `// 搞个变量 x，赋值为 10\n// 喊出 x\n// 把 x 改成 20\n// 再喊出 x\n`,
          task: "声明变量 x=10，输出，改为 20，再输出",
          expectedOutput: ["10", "20"],
          validationMode: "exact",
          hints: [
            { text: "用「搞个 x = 10」来声明变量" },
            { text: "重新赋值不需要再写「搞个」，直接 x = 20" },
            { text: "答案：搞个 x = 10\\n喊话（x）\\nx = 20\\n喊话（x）" },
          ],
          solutionCode: `搞个 x = 10\n喊话（x）\nx = 20\n喊话（x）`,
        },

        // ── 1-4 字符串拼接大师 ──
        {
          id: "1-4",
          title: "字符串拼接大师",
          instruction: `<h2>第四课：字符串拼接大师 🧵</h2>
<p>在草语言里，字符串可以用 <code>+</code> 号拼接起来，就像把两根面条接在一起：</p>
<pre class="code-block">搞个 姓 = "张"
搞个 名 = "三"
喊话（姓 + 名）  // 张三</pre>
<p>字符串和数字也能拼，数字会自动变成字符串（社会我数字哥，自动转型）：</p>
<pre class="code-block">搞个 年龄 = 18
喊话（"我今年" + 年龄 + "岁"）  // 我今年18岁</pre>
<div class="task-box"><strong>🎯 任务：</strong>搞个变量 <code>名字</code> = <code>"草神"</code>，搞个变量 <code>等级</code> = <code>100</code>，然后喊出 <code>草神的等级是100</code>。</div>`,
          starterCode: `// 搞两个变量：名字 和 等级\n// 用 + 把它们拼起来喊出去\n`,
          task: "拼接字符串输出「草神的等级是100」",
          expectedOutput: ["草神的等级是100"],
          validationMode: "exact",
          hints: [
            { text: "用 + 号把字符串和变量连起来" },
            { text: "喊话（名字 + \"的等级是\" + 等级）" },
            { text: "答案：搞个 名字 = \"草神\"\\n搞个 等级 = 100\\n喊话（名字 + \"的等级是\" + 等级）" },
          ],
          solutionCode: `搞个 名字 = "草神"\n搞个 等级 = 100\n喊话（名字 + "的等级是" + 等级）`,
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // 第二章: 做个决定吧 (条件篇)
    // ═══════════════════════════════════════════════
    {
      id: 2,
      title: "做个决定吧",
      subtitle: "条件篇",
      emoji: "🤔",
      lessons: [
        // ── 2-1 如果...啊这... ──
        {
          id: "2-1",
          title: "如果...啊这...",
          instruction: `<h2>第一课：如果...啊这... 🎭</h2>
<p>人生充满选择，代码也一样。草语言的条件判断长这样：</p>
<pre class="code-block">如果（分数 >= 60）「
  喊话（"及格了！"）
」啊这「
  喊话（"挂了..."）
」</pre>
<p><code>如果</code> = if，<code>啊这</code> = else。用花括号的中文版 <code>「」</code> 包裹代码块。</p>
<p>"啊这"是当条件不成立时的反应——就像老师看到你的成绩时的表情。</p>
<div class="task-box"><strong>🎯 任务：</strong>搞个变量 <code>分数</code> = <code>75</code>，如果 >= 60 喊「及格了」，否则喊「挂科了」。</div>`,
          starterCode: `搞个 分数 = 75\n// 用 如果...啊这... 判断是否及格\n`,
          task: "判断分数 75 是否及格（>=60），输出对应结果",
          expectedOutput: ["及格了"],
          validationMode: "exact",
          hints: [
            { text: "如果（分数 >= 60）「...」啊这「...」" },
            { text: "代码块用中文花括号「」包裹" },
            { text: "答案：搞个 分数 = 75\\n如果（分数 >= 60）「\\n  喊话（\"及格了\"）\\n」啊这「\\n  喊话（\"挂科了\"）\\n」" },
          ],
          solutionCode: `搞个 分数 = 75\n如果（分数 >= 60）「\n  喊话（"及格了"）\n」啊这「\n  喊话（"挂科了"）\n」`,
        },

        // ── 2-2 大于小于都是泪 ──
        {
          id: "2-2",
          title: "大于小于都是泪",
          instruction: `<h2>第二课：大于小于都是泪 😢</h2>
<p>比较运算符家族全员到齐：</p>
<ul>
<li><code>==</code> 等于（注意是两个等号，一个等号是赋值！）</li>
<li><code>!=</code> 不等于</li>
<li><code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code> 大于、小于、大于等于、小于等于</li>
</ul>
<pre class="code-block">搞个 a = 10
搞个 b = 20
如果（a > b）「
  喊话（"a大")
」啊这「
  喊话（"b大"）
」</pre>
<div class="task-box"><strong>🎯 任务：</strong>搞三个变量 <code>a=15</code>，<code>b=15</code>，<code>c=20</code>。如果 a==b 喊「ab相等」，如果 c>a 喊「c最大」。</div>`,
          starterCode: `搞个 a = 15\n搞个 b = 15\n搞个 c = 20\n// 判断 a == b\n// 判断 c > a\n`,
          task: "进行两次比较判断，输出「ab相等」和「c最大」",
          expectedOutput: ["ab相等", "c最大"],
          validationMode: "exact",
          hints: [
            { text: "需要写两个 如果 语句，分别判断" },
            { text: "第一个判断 a == b，第二个判断 c > a" },
            { text: "答案：如果（a == b）「喊话（\"ab相等\"）」\\n如果（c > a）「喊话（\"c最大\"）」" },
          ],
          solutionCode: `搞个 a = 15\n搞个 b = 15\n搞个 c = 20\n如果（a == b）「\n  喊话（"ab相等"）\n」\n如果（c > a）「\n  喊话（"c最大"）\n」`,
        },

        // ── 2-3 确实没有内味虚无 ──
        {
          id: "2-3",
          title: "确实没有内味虚无",
          instruction: `<h2>第三课：确实没有内味虚无 🌀</h2>
<p>草语言有三个哲学级别的值：</p>
<ul>
<li><code>确实</code> = true（确实是这样的）</li>
<li><code>没有内味</code> = false（没有那个味道）</li>
<li><code>虚无</code> = null（空虚、寂寞、冷）</li>
</ul>
<pre class="code-block">搞个 有钱 = 确实
搞个 有对象 = 没有内味
搞个 未来 = 虚无</pre>
<p>这仨在条件判断里很重要：<code>确实</code> 让条件通过，<code>没有内味</code> 和 <code>虚无</code> 都不通过。</p>
<div class="task-box"><strong>🎯 任务：</strong>搞个变量 <code>在线</code> = <code>确实</code>，如果在线喊「我在呢」。搞个变量 <code>摸鱼</code> = <code>没有内味</code>，如果摸鱼喊「在摸鱼」啊这喊「在卷」。</div>`,
          starterCode: `// 搞个变量 在线 = 确实，然后判断\n// 搞个变量 摸鱼 = 没有内味，然后判断\n`,
          task: "使用布尔值进行条件判断，输出「我在呢」和「在卷」",
          expectedOutput: ["我在呢", "在卷"],
          validationMode: "exact",
          hints: [
            { text: "确实 就是 true，可以直接放进 如果 的条件里" },
            { text: "没有内味 是 false，所以会走 啊这 分支" },
            { text: "答案：搞个 在线 = 确实\\n如果（在线）「喊话（\"我在呢\"）」\\n搞个 摸鱼 = 没有内味\\n如果（摸鱼）「喊话（\"在摸鱼\"）」啊这「喊话（\"在卷\"）」" },
          ],
          solutionCode: `搞个 在线 = 确实\n如果（在线）「\n  喊话（"我在呢"）\n」\n搞个 摸鱼 = 没有内味\n如果（摸鱼）「\n  喊话（"在摸鱼"）\n」啊这「\n  喊话（"在卷"）\n」`,
        },

        // ── 2-4 并且或者非 ──
        {
          id: "2-4",
          title: "并且或者非",
          instruction: `<h2>第四课：并且或者非 🔗</h2>
<p>有时候一个条件不够用，需要组合起来：</p>
<ul>
<li><code>并且</code> = and（两边都要满足）</li>
<li><code>或者</code> = or（满足一边就行）</li>
<li><code>非</code> = not（取反，颠倒黑白）</li>
</ul>
<pre class="code-block">搞个 年龄 = 25
搞个 有房 = 确实
如果（年龄 >= 18 并且 有房）「
  喊话（"人生赢家"）
」</pre>
<div class="task-box"><strong>🎯 任务：</strong>搞个 <code>分数=85</code>，<code>出勤=确实</code>。如果分数>=80 并且 出勤，喊「优秀学生」。再搞个 <code>下雨=没有内味</code>，如果 非 下雨，喊「出去玩」。</div>`,
          starterCode: `搞个 分数 = 85\n搞个 出勤 = 确实\n// 判断：分数>=80 并且 出勤\n\n搞个 下雨 = 没有内味\n// 判断：非 下雨\n`,
          task: "使用逻辑运算符组合条件，输出「优秀学生」和「出去玩」",
          expectedOutput: ["优秀学生", "出去玩"],
          validationMode: "exact",
          hints: [
            { text: "「并且」连接两个条件，两个都成立才执行" },
            { text: "「非」放在条件前面，取反" },
            { text: "答案：如果（分数 >= 80 并且 出勤）「喊话（\"优秀学生\"）」\\n如果（非 下雨）「喊话（\"出去玩\"）」" },
          ],
          solutionCode: `搞个 分数 = 85\n搞个 出勤 = 确实\n如果（分数 >= 80 并且 出勤）「\n  喊话（"优秀学生"）\n」\n搞个 下雨 = 没有内味\n如果（非 下雨）「\n  喊话（"出去玩"）\n」`,
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // 第三章: 卷起来！ (循环篇)
    // ═══════════════════════════════════════════════
    {
      id: 3,
      title: "卷起来！",
      subtitle: "循环篇",
      emoji: "🔄",
      lessons: [
        // ── 3-1 卷它一百遍 ──
        {
          id: "3-1",
          title: "卷它一百遍",
          instruction: `<h2>第一课：卷它一百遍 🔁</h2>
<p>内卷从代码开始！草语言的循环关键字是<strong>「卷」</strong>，因为循环就是不停地卷啊卷：</p>
<pre class="code-block">搞个 i = 1
卷（i <= 5）「
  喊话（i）
  i = i + 1
」</pre>
<p>这就是 while 循环——只要条件<code>确实</code>，就一直卷下去。</p>
<p>⚠️ 别忘了更新循环变量，不然就是死循环（无限内卷，社畜噩梦）。</p>
<div class="task-box"><strong>🎯 任务：</strong>用卷循环打印 1 到 5，每行一个数。</div>`,
          starterCode: `搞个 i = 1\n// 用 卷 循环打印 1 到 5\n`,
          task: "使用卷循环打印 1 到 5",
          expectedOutput: ["1", "2", "3", "4", "5"],
          validationMode: "exact",
          hints: [
            { text: "卷（条件）「代码块」，条件为真就一直执行" },
            { text: "每次循环结束记得 i = i + 1" },
            { text: "答案：搞个 i = 1\\n卷（i <= 5）「\\n  喊话（i）\\n  i = i + 1\\n」" },
          ],
          solutionCode: `搞个 i = 1\n卷（i <= 5）「\n  喊话（i）\n  i = i + 1\n」`,
        },

        // ── 3-2 累加器 ──
        {
          id: "3-2",
          title: "累加器",
          instruction: `<h2>第二课：累加器 ➕</h2>
<p>经典面试题来了：<strong>1 加到 100 等于多少？</strong></p>
<p>传说高斯小时候用公式算出了 5050，但我们是程序员，我们用循环暴力求解：</p>
<pre class="code-block">搞个 总和 = 0
搞个 i = 1
卷（i <= 100）「
  总和 = 总和 + i
  i = i + 1
」
喊话（总和）</pre>
<p>暴力出奇迹，循环最简单！</p>
<div class="task-box"><strong>🎯 任务：</strong>用循环算出 1+2+3+...+100 的结果并喊出来。答案应该是 <code>5050</code>。</div>`,
          starterCode: `搞个 总和 = 0\n搞个 i = 1\n// 用卷循环累加 1 到 100\n// 最后喊出总和\n`,
          task: "计算 1 到 100 的和，输出 5050",
          expectedOutput: ["5050"],
          validationMode: "exact",
          hints: [
            { text: "每次循环把 i 加到 总和 上：总和 = 总和 + i" },
            { text: "循环条件是 i <= 100，别忘了 i = i + 1" },
            { text: "答案：搞个 总和 = 0\\n搞个 i = 1\\n卷（i <= 100）「\\n  总和 = 总和 + i\\n  i = i + 1\\n」\\n喊话（总和）" },
          ],
          solutionCode: `搞个 总和 = 0\n搞个 i = 1\n卷（i <= 100）「\n  总和 = 总和 + i\n  i = i + 1\n」\n喊话（总和）`,
        },

        // ── 3-3 润了润了 ──
        {
          id: "3-3",
          title: "润了润了",
          instruction: `<h2>第三课：润了润了 🏃</h2>
<p>有时候卷到一半不想卷了，那就<strong>润</strong>！<code>润</code> = break，直接跳出循环。</p>
<pre class="code-block">搞个 i = 1
卷（i <= 100）「
  如果（i == 5）「
    喊话（"找到5了，润！"）
    润
  」
  i = i + 1
」</pre>
<p>润 = 润出去 = break，懂的都懂。当你在循环里找到想要的东西，果断润！</p>
<div class="task-box"><strong>🎯 任务：</strong>从 1 开始循环，逐个打印数字，当 i 等于 3 时喊「找到了」然后润出循环。输出应为 1, 2, 找到了。</div>`,
          starterCode: `搞个 i = 1\n卷（i <= 10）「\n  // 判断 i == 3 时喊"找到了"然后润\n  // 否则喊出 i\n  i = i + 1\n」\n`,
          task: "循环打印数字，i==3 时输出「找到了」并 break",
          expectedOutput: ["1", "2", "找到了"],
          validationMode: "exact",
          hints: [
            { text: "在循环里用 如果（i == 3）来判断" },
            { text: "找到后先喊话再润，注意顺序" },
            { text: "答案：搞个 i = 1\\n卷（i <= 10）「\\n  如果（i == 3）「\\n    喊话（\"找到了\"）\\n    润\\n  」\\n  喊话（i）\\n  i = i + 1\\n」" },
          ],
          solutionCode: `搞个 i = 1\n卷（i <= 10）「\n  如果（i == 3）「\n    喊话（"找到了"）\n    润\n  」\n  喊话（i）\n  i = i + 1\n」`,
        },

        // ── 3-4 继续卷 ──
        {
          id: "3-4",
          title: "继续卷",
          instruction: `<h2>第四课：继续卷 ⏭️</h2>
<p>有时候不想润，但想跳过当前这一轮，那就<strong>继续卷</strong>！<code>继续卷</code> = continue。</p>
<pre class="code-block">搞个 i = 0
卷（i < 10）「
  i = i + 1
  如果（i % 2 != 0）「
    继续卷   // 跳过奇数
  」
  喊话（i）  // 只打印偶数
」</pre>
<p>继续卷的意思是："这轮不算，继续下一轮！"——像极了抽卡没出金的你。</p>
<div class="task-box"><strong>🎯 任务：</strong>打印 1 到 10 中的偶数（2, 4, 6, 8, 10），用继续卷跳过奇数。</div>`,
          starterCode: `搞个 i = 0\n卷（i < 10）「\n  i = i + 1\n  // 如果是奇数就继续卷\n  // 否则喊出来\n」\n`,
          task: "使用继续卷跳过奇数，只输出偶数 2,4,6,8,10",
          expectedOutput: ["2", "4", "6", "8", "10"],
          validationMode: "exact",
          hints: [
            { text: "奇数的特征是 i % 2 != 0" },
            { text: "先 i = i + 1，再判断奇偶，最后喊话" },
            { text: "答案：搞个 i = 0\\n卷（i < 10）「\\n  i = i + 1\\n  如果（i % 2 != 0）「\\n    继续卷\\n  」\\n  喊话（i）\\n」" },
          ],
          solutionCode: `搞个 i = 0\n卷（i < 10）「\n  i = i + 1\n  如果（i % 2 != 0）「\n    继续卷\n  」\n  喊话（i）\n」`,
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // 第四章: 整活时间 (函数篇)
    // ═══════════════════════════════════════════════
    {
      id: 4,
      title: "整活时间",
      subtitle: "函数篇",
      emoji: "🎪",
      lessons: [
        // ── 4-1 整个活 ──
        {
          id: "4-1",
          title: "整个活",
          instruction: `<h2>第一课：整个活 🎬</h2>
<p>在草语言里，定义函数叫<strong>「整活」</strong>！因为函数就是整个活儿出来复用的。</p>
<pre class="code-block">整活 打招呼（名字）「
  喊话（"你好，" + 名字 + "！"）
」

打招呼（"世界"）  // 你好，世界！</pre>
<p>语法：<code>整活 函数名（参数）「代码块」</code>，然后用 <code>函数名（参数）</code> 调用。</p>
<p>整活 = 我要搞一个函数。就这么简单。</p>
<div class="task-box"><strong>🎯 任务：</strong>整一个函数 <code>问好（名字）</code>，让它喊出 <code>你好+名字</code>。然后调用 <code>问好（"草语言"）</code>。</div>`,
          starterCode: `// 整活 问好（名字）「...」\n// 调用 问好（"草语言"）\n`,
          task: "定义并调用问好函数，输出「你好草语言」",
          expectedOutput: ["你好草语言"],
          validationMode: "exact",
          hints: [
            { text: "整活 问好（名字）「 喊话（\"你好\" + 名字） 」" },
            { text: "定义完函数后，别忘了调用：问好（\"草语言\"）" },
            { text: "答案：整活 问好（名字）「\\n  喊话（\"你好\" + 名字）\\n」\\n问好（\"草语言\"）" },
          ],
          solutionCode: `整活 问好（名字）「\n  喊话（"你好" + 名字）\n」\n问好（"草语言"）`,
        },

        // ── 4-2 栓Q你回来了 ──
        {
          id: "4-2",
          title: "栓Q你回来了",
          instruction: `<h2>第二课：栓Q你回来了 🔙</h2>
<p>函数不光能喊话，还能<strong>返回值</strong>。返回值用<code>栓Q</code>：</p>
<pre class="code-block">整活 加法（a，b）「
  栓Q a + b
」

搞个 结果 = 加法（3，4）
喊话（结果）  // 7</pre>
<p><code>栓Q</code> = return。"栓Q"谐音"thank you"——函数说"栓Q，我把结果还给你了"。</p>
<div class="task-box"><strong>🎯 任务：</strong>整一个函数 <code>乘法（a，b）</code>，栓Q 返回 a*b。然后喊出 <code>乘法（6，7）</code> 的结果。</div>`,
          starterCode: `// 整活 乘法（a，b）「栓Q ...」\n// 喊出 乘法（6，7）\n`,
          task: "定义乘法函数并调用，输出「42」",
          expectedOutput: ["42"],
          validationMode: "exact",
          hints: [
            { text: "函数体内用 栓Q a * b 返回乘积" },
            { text: "喊话（乘法（6，7））直接把调用结果喊出来" },
            { text: "答案：整活 乘法（a，b）「\\n  栓Q a * b\\n」\\n喊话（乘法（6，7））" },
          ],
          solutionCode: `整活 乘法（a，b）「\n  栓Q a * b\n」\n喊话（乘法（6，7））`,
        },

        // ── 4-3 套娃 ──
        {
          id: "4-3",
          title: "套娃",
          instruction: `<h2>第三课：套娃 🪆</h2>
<p>函数可以调用自己，这叫<strong>递归</strong>——也叫<strong>套娃</strong>！</p>
<pre class="code-block">整活 阶乘（n）「
  如果（n <= 1）「
    栓Q 1
  」
  栓Q n * 阶乘（n - 1）
」</pre>
<p>阶乘就是 n! = n * (n-1) * ... * 1。经典套娃题。</p>
<p>⚠️ 递归一定要有<strong>终止条件</strong>（n <= 1 时停），不然就是无限套娃，程序会寄！</p>
<div class="task-box"><strong>🎯 任务：</strong>实现阶乘函数 <code>阶乘（n）</code>，然后喊出 <code>阶乘（5）</code>。5! = 120。</div>`,
          starterCode: `// 整活 阶乘（n）「...」\n// 提示：n <= 1 时栓Q 1，否则栓Q n * 阶乘（n-1）\n// 喊出 阶乘（5）\n`,
          task: "用递归实现阶乘函数，输出 阶乘(5)=120",
          expectedOutput: ["120"],
          validationMode: "exact",
          hints: [
            { text: "终止条件：如果（n <= 1）「栓Q 1」" },
            { text: "递归步骤：栓Q n * 阶乘（n - 1）" },
            { text: "答案：整活 阶乘（n）「\\n  如果（n <= 1）「栓Q 1」\\n  栓Q n * 阶乘（n - 1）\\n」\\n喊话（阶乘（5））" },
          ],
          solutionCode: `整活 阶乘（n）「\n  如果（n <= 1）「\n    栓Q 1\n  」\n  栓Q n * 阶乘（n - 1）\n」\n喊话（阶乘（5））`,
          testSuite: `喊话（阶乘（5））\n喊话（阶乘（0））\n喊话（阶乘（1））`,
        },

        // ── 4-4 函数是一等公民 ──
        {
          id: "4-4",
          title: "函数是一等公民",
          instruction: `<h2>第四课：函数是一等公民 👑</h2>
<p>在草语言里，函数可以当参数传给另一个函数！这叫<strong>高阶函数</strong>。</p>
<pre class="code-block">整活 翻倍（x）「
  栓Q x * 2
」

整活 应用（函数，值）「
  栓Q 函数（值）
」

喊话（应用（翻倍，5））  // 10</pre>
<p>函数名不加括号就是函数本身，加括号才是调用。这个区别很重要！</p>
<div class="task-box"><strong>🎯 任务：</strong>整一个 <code>平方（x）</code> 返回 x*x，整一个 <code>应用（函数，值）</code> 调用传入的函数。然后喊出 <code>应用（平方，9）</code>。</div>`,
          starterCode: `// 整活 平方（x）「...」\n// 整活 应用（函数，值）「...」\n// 喊出 应用（平方，9）\n`,
          task: "实现高阶函数，输出 平方(9)=81",
          expectedOutput: ["81"],
          validationMode: "exact",
          hints: [
            { text: "平方函数：栓Q x * x" },
            { text: "应用函数：栓Q 函数（值）—— 把传入的函数调用一下" },
            { text: "答案：整活 平方（x）「栓Q x * x」\\n整活 应用（函数，值）「栓Q 函数（值）」\\n喊话（应用（平方，9））" },
          ],
          solutionCode: `整活 平方（x）「\n  栓Q x * x\n」\n整活 应用（函数，值）「\n  栓Q 函数（值）\n」\n喊话（应用（平方，9））`,
        },

        // ── 4-5 闭包有内味了 ──
        {
          id: "4-5",
          title: "闭包有内味了",
          instruction: `<h2>第五课：闭包有内味了 🔒</h2>
<p>闭包就是：函数里面再定义函数，内部函数能访问外部函数的变量。听起来很绕？看例子：</p>
<pre class="code-block">整活 创建计数器（）「
  搞个 计数 = 0
  整活 增加（）「
    计数 = 计数 + 1
    栓Q 计数
  」
  栓Q 增加
」

搞个 计数器 = 创建计数器（）
喊话（计数器（））  // 1
喊话（计数器（））  // 2
喊话（计数器（））  // 3</pre>
<p>每次调用 <code>计数器（）</code>，里面的 <code>计数</code> 都会记住上一次的值。这就是闭包的魔力！</p>
<div class="task-box"><strong>🎯 任务：</strong>实现上面的 <code>创建计数器</code> 函数，调用三次并喊出结果 1, 2, 3。</div>`,
          starterCode: `// 整活 创建计数器（）「\n//   搞个 计数 = 0\n//   整活 增加（）「...」\n//   栓Q 增加\n// 」\n// 搞个 计数器 = 创建计数器（）\n// 调用三次并喊出结果\n`,
          task: "实现闭包计数器，三次调用输出 1, 2, 3",
          expectedOutput: ["1", "2", "3"],
          validationMode: "exact",
          hints: [
            { text: "外部函数里搞个 计数 = 0，内部函数每次 计数 = 计数 + 1 再栓Q 计数" },
            { text: "外部函数栓Q的是内部函数本身（不加括号）" },
            { text: "答案见 starterCode 注释，去掉注释符号即可" },
          ],
          solutionCode: `整活 创建计数器（）「\n  搞个 计数 = 0\n  整活 增加（）「\n    计数 = 计数 + 1\n    栓Q 计数\n  」\n  栓Q 增加\n」\n搞个 计数器 = 创建计数器（）\n喊话（计数器（））\n喊话（计数器（））\n喊话（计数器（））`,
          testSuite: `搞个 测试计数器 = 创建计数器（）\n喊话（测试计数器（））\n喊话（测试计数器（））\n喊话（测试计数器（））\n喊话（测试计数器（））`,
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // 第五章: 有序的世界 (数组篇)
    // ═══════════════════════════════════════════════
    {
      id: 5,
      title: "有序的世界",
      subtitle: "数组篇",
      emoji: "📋",
      lessons: [
        // ── 5-1 排排坐 ──
        {
          id: "5-1",
          title: "排排坐",
          instruction: `<h2>第一课：排排坐 🪑</h2>
<p>数组就是一排座位，每个位置放一个值：</p>
<pre class="code-block">搞个 水果 = ["苹果"，"香蕉"，"橘子"]
喊话（水果[0]）  // 苹果（从0开始数！）
喊话（水果[1]）  // 香蕉
喊话（水果[2]）  // 橘子</pre>
<p>注意：数组下标从 <strong>0</strong> 开始，不是 1！这是程序员的基本素养。</p>
<p>数组用方括号 <code>[]</code> 创建，元素之间用中文逗号 <code>，</code> 分隔。</p>
<div class="task-box"><strong>🎯 任务：</strong>搞个数组 <code>英雄</code> = <code>["亚索"，"盲僧"，"劫"]</code>，然后分别喊出第一个和最后一个英雄。</div>`,
          starterCode: `// 搞个数组 英雄\n// 喊出第一个（下标0）和最后一个（下标2）\n`,
          task: "创建数组并访问元素，输出「亚索」和「劫」",
          expectedOutput: ["亚索", "劫"],
          validationMode: "exact",
          hints: [
            { text: "数组下标从 0 开始，英雄[0] 是第一个" },
            { text: "最后一个是 英雄[2]" },
            { text: "答案：搞个 英雄 = [\"亚索\"，\"盲僧\"，\"劫\"]\\n喊话（英雄[0]）\\n喊话（英雄[2]）" },
          ],
          solutionCode: `搞个 英雄 = ["亚索"，"盲僧"，"劫"]\n喊话（英雄[0]）\n喊话（英雄[2]）`,
        },

        // ── 5-2 推入弹出 ──
        {
          id: "5-2",
          title: "推入弹出",
          instruction: `<h2>第二课：推入弹出 📥📤</h2>
<p>数组不是一成不变的，你可以往里塞东西、往外掏东西：</p>
<ul>
<li><code>推入（数组，值）</code> = push，往末尾塞一个</li>
<li><code>弹出（数组）</code> = pop，从末尾掏一个出来</li>
<li><code>长度（数组）</code> = length，看看有多长</li>
</ul>
<pre class="code-block">搞个 栈 = [1，2，3]
推入（栈，4）        // [1,2,3,4]
搞个 尾巴 = 弹出（栈）  // 尾巴=4，栈=[1,2,3]
喊话（长度（栈））      // 3</pre>
<div class="task-box"><strong>🎯 任务：</strong>搞个数组 <code>[10，20]</code>，推入 <code>30</code>，喊出长度（应为3），然后弹出一个，喊出弹出的值（30），再喊出长度（应为2）。</div>`,
          starterCode: `搞个 数组 = [10，20]\n// 推入 30\n// 喊出长度\n// 弹出并喊出弹出的值\n// 喊出长度\n`,
          task: "练习推入弹出操作，输出 3, 30, 2",
          expectedOutput: ["3", "30", "2"],
          validationMode: "exact",
          hints: [
            { text: "推入（数组，30）把 30 加到末尾" },
            { text: "搞个 出来的 = 弹出（数组），然后喊话（出来的）" },
            { text: "答案：搞个 数组 = [10，20]\\n推入（数组，30）\\n喊话（长度（数组））\\n搞个 出来的 = 弹出（数组）\\n喊话（出来的）\\n喊话（长度（数组））" },
          ],
          solutionCode: `搞个 数组 = [10，20]\n推入（数组，30）\n喊话（长度（数组））\n搞个 出来的 = 弹出（数组）\n喊话（出来的）\n喊话（长度（数组））`,
        },

        // ── 5-3 遍历数组 ──
        {
          id: "5-3",
          title: "遍历数组",
          instruction: `<h2>第三课：遍历数组 🚶</h2>
<p>有了循环和数组，我们可以把数组里的每个元素都访问一遍：</p>
<pre class="code-block">搞个 名单 = ["张三"，"李四"，"王五"]
搞个 i = 0
卷（i < 长度（名单））「
  喊话（名单[i]）
  i = i + 1
」</pre>
<p>这就是遍历——挨个点名，一个都不放过。用 <code>长度（数组）</code> 获取数组长度作为循环边界。</p>
<div class="task-box"><strong>🎯 任务：</strong>搞个数组 <code>["草"，"语"，"言"，"牛"，"逼"]</code>，用循环依次喊出每个元素。</div>`,
          starterCode: `搞个 字们 = ["草"，"语"，"言"，"牛"，"逼"]\n搞个 i = 0\n// 用卷循环遍历并喊出每个元素\n`,
          task: "遍历数组，依次输出每个元素",
          expectedOutput: ["草", "语", "言", "牛", "逼"],
          validationMode: "exact",
          hints: [
            { text: "循环条件：i < 长度（字们）" },
            { text: "用 字们[i] 访问当前元素" },
            { text: "答案：卷（i < 长度（字们））「\\n  喊话（字们[i]）\\n  i = i + 1\\n」" },
          ],
          solutionCode: `搞个 字们 = ["草"，"语"，"言"，"牛"，"逼"]\n搞个 i = 0\n卷（i < 长度（字们））「\n  喊话（字们[i]）\n  i = i + 1\n」`,
        },

        // ── 5-4 冒泡排序 ──
        {
          id: "5-4",
          title: "冒泡排序",
          instruction: `<h2>第四课：冒泡排序 🫧</h2>
<p>经典算法挑战！冒泡排序的思路：</p>
<ol>
<li>比较相邻两个元素</li>
<li>如果前面的比后面的大，就交换</li>
<li>重复这个过程，直到没有需要交换的</li>
</ol>
<pre class="code-block">// 交换技巧：
搞个 临时 = 数组[j]
数组[j] = 数组[j + 1]
数组[j + 1] = 临时</pre>
<p>这是每个程序员的成人礼——手写排序！</p>
<div class="task-box"><strong>🎯 任务：</strong>对数组 <code>[5，3，8，1，2]</code> 进行冒泡排序（升序），然后依次喊出排序后的每个元素。</div>`,
          starterCode: `搞个 数组 = [5，3，8，1，2]\n// 冒泡排序：两层循环\n// 外层 i 从 0 到 长度-1\n// 内层 j 从 0 到 长度-1-i\n// 如果 数组[j] > 数组[j+1] 就交换\n\n// 排完后遍历输出\n`,
          task: "实现冒泡排序，输出 1,2,3,5,8",
          expectedOutput: ["1", "2", "3", "5", "8"],
          validationMode: "exact",
          hints: [
            { text: "需要两层循环：外层控制轮数，内层做相邻比较交换" },
            { text: "交换用三步：临时变量存一个，赋值，再赋值" },
            { text: "答案：搞个 数组 = [5，3，8，1，2]\\n搞个 n = 长度（数组）\\n搞个 i = 0\\n卷（i < n）「\\n  搞个 j = 0\\n  卷（j < n - 1 - i）「\\n    如果（数组[j] > 数组[j + 1]）「\\n      搞个 临时 = 数组[j]\\n      数组[j] = 数组[j + 1]\\n      数组[j + 1] = 临时\\n    」\\n    j = j + 1\\n  」\\n  i = i + 1\\n」\\n搞个 k = 0\\n卷（k < n）「\\n  喊话（数组[k]）\\n  k = k + 1\\n」" },
          ],
          solutionCode: `搞个 数组 = [5，3，8，1，2]\n搞个 n = 长度（数组）\n搞个 i = 0\n卷（i < n）「\n  搞个 j = 0\n  卷（j < n - 1 - i）「\n    如果（数组[j] > 数组[j + 1]）「\n      搞个 临时 = 数组[j]\n      数组[j] = 数组[j + 1]\n      数组[j + 1] = 临时\n    」\n    j = j + 1\n  」\n  i = i + 1\n」\n搞个 k = 0\n卷（k < n）「\n  喊话（数组[k]）\n  k = k + 1\n」`,
          testSuite: `搞个 测试数组 = [9，1，5，3，7，2，8，4，6]\n搞个 测n = 长度（测试数组）\n搞个 测i = 0\n卷（测i < 测n）「\n  搞个 测j = 0\n  卷（测j < 测n - 1 - 测i）「\n    如果（测试数组[测j] > 测试数组[测j + 1]）「\n      搞个 测临时 = 测试数组[测j]\n      测试数组[测j] = 测试数组[测j + 1]\n      测试数组[测j + 1] = 测临时\n    」\n    测j = 测j + 1\n  」\n  测i = 测i + 1\n」\n搞个 测k = 0\n卷（测k < 测n）「\n  喊话（测试数组[测k]）\n  测k = 测k + 1\n」`,
        },
      ],
    },

    // ═══════════════════════════════════════════════
    // 第六章: 大师之路 (高级篇)
    // ═══════════════════════════════════════════════
    {
      id: 6,
      title: "大师之路",
      subtitle: "高级篇",
      emoji: "🏆",
      lessons: [
        // ── 6-1 寄了寄了 ──
        {
          id: "6-1",
          title: "寄了寄了",
          instruction: `<h2>第一课：寄了寄了 💀</h2>
<p>有时候程序遇到无法处理的情况，就得<strong>寄</strong>！<code>寄（）</code> = throw，主动抛出错误。</p>
<pre class="code-block">整活 除法（a，b）「
  如果（b == 0）「
    寄（"除数不能为零！"）
  」
  栓Q a / b
」</pre>
<p>寄 = 完蛋了 = 报错。程序会立刻停下来，并告诉你寄在哪里。</p>
<p>在这个练习里，我们故意让程序寄一下，感受一下报错的快乐。</p>
<div class="task-box"><strong>🎯 任务：</strong>整一个函数 <code>检查年龄（年龄）</code>，如果年龄 < 0 就寄（"年龄不能为负数"），否则喊出 <code>"年龄合法"</code>。先调用 <code>检查年龄（18）</code>，观察正常输出。</div>`,
          starterCode: `// 整活 检查年龄（年龄）「...」\n// 调用 检查年龄（18）\n`,
          task: "定义带错误检查的函数，正常调用输出「年龄合法」",
          expectedOutput: ["年龄合法"],
          validationMode: "exact",
          hints: [
            { text: "如果（年龄 < 0）「寄（\"年龄不能为负数\"）」" },
            { text: "啊这分支（或者直接在后面）喊话（\"年龄合法\"）" },
            { text: "答案：整活 检查年龄（年龄）「\\n  如果（年龄 < 0）「\\n    寄（\"年龄不能为负数\"）\\n  」\\n  喊话（\"年龄合法\"）\\n」\\n检查年龄（18）" },
          ],
          solutionCode: `整活 检查年龄（年龄）「\n  如果（年龄 < 0）「\n    寄（"年龄不能为负数"）\n  」\n  喊话（"年龄合法"）\n」\n检查年龄（18）`,
        },

        // ── 6-2 真香定律 ──
        {
          id: "6-2",
          title: "真香定律",
          instruction: `<h2>第二课：真香定律 😋</h2>
<p>程序寄了怎么办？用<strong>真香</strong>接住它！<code>真香「...」草（错误）「...」</code> = try/catch。</p>
<pre class="code-block">真香「
  寄（"炸了！"）
」草（错误）「
  喊话（"接住了：" + 错误）
」</pre>
<p>真香 = try（先试试）。草 = catch（出错了就"草！"，然后处理错误）。</p>
<p>这就是著名的<strong>真香定律</strong>：一开始说不要，最后还是要处理错误。</p>
<div class="task-box"><strong>🎯 任务：</strong>用真香...草捕获一个错误。在真香块里寄（"寄了"），在草块里喊出 <code>"接住：" + 错误</code>。</div>`,
          starterCode: `// 真香「\n//   寄（"寄了"）\n// 」草（错误）「\n//   喊话（"接住：" + 错误）\n// 」\n`,
          task: "使用 try/catch 捕获错误，输出「接住：寄了」",
          expectedOutput: ["接住：寄了"],
          validationMode: "exact",
          hints: [
            { text: "真香「代码块」草（错误变量名）「处理块」" },
            { text: "草 后面的（错误）是捕获到的错误信息" },
            { text: "答案：真香「\\n  寄（\"寄了\"）\\n」草（错误）「\\n  喊话（\"接住：\" + 错误）\\n」" },
          ],
          solutionCode: `真香「\n  寄（"寄了"）\n」草（错误）「\n  喊话（"接住：" + 错误）\n」`,
        },

        // ── 6-3 摆烂的艺术 ──
        {
          id: "6-3",
          title: "摆烂的艺术",
          instruction: `<h2>第三课：摆烂的艺术 😴</h2>
<p><code>摆烂</code> = pass/no-op，什么都不做。用在需要有代码但暂时不想写的地方。</p>
<pre class="code-block">整活 未来功能（）「
  摆烂  // 先摆着，以后再写
」</pre>
<p>摆烂是一种哲学：不是不做，是还没到时候。它让代码结构完整，但内容为空。</p>
<p>在条件判断中也很有用——有时候你只想处理一种情况：</p>
<pre class="code-block">如果（条件）「
  摆烂  // 这种情况不管
」啊这「
  喊话（"处理另一种情况"）
」</pre>
<div class="task-box"><strong>🎯 任务：</strong>整一个函数 <code>待实现（）</code>，里面用摆烂占位。然后整一个函数 <code>分类（x）</code>：如果 x > 0 摆烂（正数不管），啊这喊「非正数」。调用 <code>待实现（）</code> 和 <code>分类（-1）</code>。</div>`,
          starterCode: `// 整活 待实现（）「摆烂」\n// 整活 分类（x）「如果 x>0 摆烂，啊这 喊"非正数"」\n// 调用 待实现（）\n// 调用 分类（-1）\n`,
          task: "使用摆烂占位，调用后输出「非正数」",
          expectedOutput: ["非正数"],
          validationMode: "exact",
          hints: [
            { text: "摆烂 单独一行就行，表示什么都不做" },
            { text: "分类函数里：如果（x > 0）「摆烂」啊这「喊话（\"非正数\"）」" },
            { text: "答案：整活 待实现（）「\\n  摆烂\\n」\\n整活 分类（x）「\\n  如果（x > 0）「\\n    摆烂\\n  」啊这「\\n    喊话（\"非正数\"）\\n  」\\n」\\n待实现（）\\n分类（-1）" },
          ],
          solutionCode: `整活 待实现（）「\n  摆烂\n」\n整活 分类（x）「\n  如果（x > 0）「\n    摆烂\n  」啊这「\n    喊话（"非正数"）\n  」\n」\n待实现（）\n分类（-1）`,
        },

        // ── 6-4 草语言毕业典礼 ──
        {
          id: "6-4",
          title: "草语言毕业典礼",
          instruction: `<h2>第四课：草语言毕业典礼 🎓</h2>
<p>恭喜你走到最后一关！现在来个终极挑战——<strong>草Buzz</strong>（FizzBuzz 的草语言版）！</p>
<p>规则：打印 1 到 20 的数字，但是：</p>
<ul>
<li>能被 3 整除的，喊 <code>"草"</code></li>
<li>能被 5 整除的，喊 <code>"Buzz"</code></li>
<li>能同时被 3 和 5 整除的，喊 <code>"草Buzz"</code></li>
<li>其他情况，喊出数字本身</li>
</ul>
<p>⚠️ 注意判断顺序！先判断能被 3 和 5 同时整除的情况（用 <code>并且</code>）。</p>
<p>完成这道题，你就正式从草语言毕业了！🎉</p>
<div class="task-box"><strong>🎯 任务：</strong>实现草Buzz，打印 1 到 20。</div>`,
          starterCode: `搞个 i = 1\n卷（i <= 20）「\n  // 先判断能被3和5同时整除\n  // 再判断能被3整除\n  // 再判断能被5整除\n  // 其他情况喊出数字\n  i = i + 1\n」\n`,
          task: "实现草Buzz：1到20，3的倍数喊草，5的倍数喊Buzz，15的倍数喊草Buzz",
          expectedOutput: [
            "1", "2", "草", "4", "Buzz",
            "草", "7", "8", "草", "Buzz",
            "11", "草", "13", "14", "草Buzz",
            "16", "17", "草", "19", "Buzz",
          ],
          validationMode: "exact",
          hints: [
            { text: "先判断 i % 3 == 0 并且 i % 5 == 0 的情况，再分别判断" },
            { text: "需要用嵌套的 如果...啊这 或者注意判断顺序" },
            { text: "答案：卷（i <= 20）「\\n  如果（i % 3 == 0 并且 i % 5 == 0）「喊话（\"草Buzz\"）」啊这「如果（i % 3 == 0）「喊话（\"草\"）」啊这「如果（i % 5 == 0）「喊话（\"Buzz\"）」啊这「喊话（i）」」」\\n  i = i + 1\\n」" },
          ],
          solutionCode: `搞个 i = 1\n卷（i <= 20）「\n  如果（i % 3 == 0 并且 i % 5 == 0）「\n    喊话（"草Buzz"）\n  」啊这「\n    如果（i % 3 == 0）「\n      喊话（"草"）\n    」啊这「\n      如果（i % 5 == 0）「\n        喊话（"Buzz"）\n      」啊这「\n        喊话（i）\n      」\n    」\n  」\n  i = i + 1\n」`,
        },
      ],
    },
  ],
};
