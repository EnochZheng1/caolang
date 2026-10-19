# 草语言 Launch Kit

Everything needed to launch: a checklist, the video script, ready-to-post copy for each platform, and the schedule.

**Links used below**
- Game: https://enochzheng1.github.io/caolang/996.html
- Playground: https://enochzheng1.github.io/caolang/
- Repo: https://github.com/EnochZheng1/caolang
- Assets in `docs/`: `demo.gif` (gameplay), `card.png` (results card), `social-preview.png` (1280×640)

---

## 1. Pre-launch checklist

- [ ] **Merge the launch-prep PR** and confirm the Pages deploy is green; open both links on a computer and on your own phone (portrait and landscape).
- [ ] **Publish v0.2.0 to npm.** The README says `npm install -g caolang`, but npm still has 0.1.0 (no compiler, no game). From the repo: `npm login`, then `npm publish` (`prepublishOnly` builds and runs the tests first).
- [ ] **Repo polish** (Settings on GitHub):
  - Social preview: Settings → General → Social preview → upload `docs/social-preview.png`
  - Topics: `programming-language`, `chinese`, `compiler`, `javascript`, `raycasting`, `game`, `meme`, `esolang`
  - Website field: the game link
- [ ] **China reachability.** `github.io` is unreliable from mainland China without a VPN. Before posting on Chinese platforms, test the game link from a mainland network (ask a friend). If it fails, either set up a mirror that's reachable there, or plan to share the HTML file itself (`cao build examples/逃离996.cao --网页` → one 70 KB file that works offline) in WeChat/QQ groups.
- [ ] **Play it all the way through once** (win and lose) and make a results card on your phone, so you know the share flow works.
- [ ] **Keep sensitive content out of posts:** no 社会信用 (it's hidden in the playground; the CLI easter egg still exists), no real company names. 996 is framed as satire of overwork, which is how people already talk about it.

---

## 2. The video (60–90 s, vertical 9:16 for Douyin, 16:9 for Bilibili)

Record the game in the browser (fullscreen button in the playground, or the 996.html page) and the code in the playground. Keep cuts fast: nothing longer than 4 seconds before the code reveal.

| Time | Shot | On-screen text / voiceover |
|---|---|---|
| 0–3 s | Gameplay: a boss charges straight at the camera | **字幕：** 下班了，老板不让走 |
| 3–8 s | Throw two resignation letters, boss explodes into paper, "老板：栓Q……" pops up | **配音：** 我用辞职信把老板送走了 |
| 8–12 s | Run through the maze, 21:00 hits, screen pulses red, "996 模式开启" | **字幕：** 21:00，996 模式开启，老板全体狂暴 |
| 12–16 s | **Hard cut** to the code in the playground, scrolling | **配音：** 这个 3D 游戏，是我用自己写的编程语言做的 |
| 16–24 s | Zoom on keywords: `整活`, `栓Q`, `卷`, `润`, `摆烂` with labels | **字幕：** 函数叫「整活」，return 叫「栓Q」，循环叫「卷」，break 叫「润」 |
| 24–30 s | Show an error: `这谁啊，不认识: 打公人们 —— 你是不是想说「打工人们」？` | **配音：** 连报错都是梗 |
| 30–40 s | **Live edit**: change `搞个 老板速度 = 1.6` to `5`, hit 整活！, bosses sprint at you | **字幕：** 改一个数字，老板速度 ×3 |
| 40–48 s | Speed table (fib 39ms vs Python 123ms) | **配音：** 而且它不是玩具，编译成 JavaScript，比 Python 快 |
| 48–55 s | Lose screen: "你被优化了 · 毕业快乐", then the results card | **字幕：** 你能坚持多久？ |
| 55–60 s | Game link + "手机也能玩" + GitHub | **配音：** 链接在简介/评论区，手机就能玩 |

**Thumbnail/cover:** the lose screen ("你被优化了" over the boss's face) or the results card. Big text: 「我用中文梗写了个编程语言，还做了个 3D 游戏」.

---

## 3. Chinese platforms

### Bilibili（首发，16:9 完整版）

**标题（选一个）**
- 我用中文网络梗写了一门编程语言，还用它做了个 3D 游戏
- 【草语言】函数叫「整活」，return 叫「栓Q」，我用它写了个《逃离996》
- 下班时间到了，老板不让走——用自制编程语言写的 3D 游戏

**简介**
```
《逃离996》是一个 100% 用「草语言」写的 3D 第一人称游戏：在办公室迷宫里躲开老板，用辞职信砸他们，找到「下班」出口润出去。

草语言是我写的一门用中文互联网梗当关键字的编程语言：
搞个 = 变量，整活 = 函数，栓Q = return，卷 = 循环，润 = break，摆烂 = pass，真香/草 = try/catch
它会编译成 JavaScript，跑得跟 JS 差不多快，还能用 npm 的包。

▶ 在线玩（手机也行）：https://enochzheng1.github.io/caolang/996.html
✏️ 在线改代码：https://enochzheng1.github.io/caolang/
⭐ GitHub：https://github.com/EnochZheng1/caolang

你能坚持多久？评论区晒战绩图！
```
**标签：** 编程、程序员、编程语言、游戏开发、独立游戏、996、打工人、整活、JavaScript

**置顶评论：** 链接 + 「玩完点『战绩』生成战绩图，评论区晒一下你的称号 👇」

### 抖音（竖屏剪辑版，前 3 秒必须是老板冲脸）

**文案**
```
下班了老板不让走？用辞职信送走他 😤
这个 3D 游戏是我用自己写的「中文梗编程语言」做的，return 叫「栓Q」，break 叫「润」
你能坚持多久？#程序员 #编程 #打工人 #996 #独立游戏 #整活
```
抖音文案里的链接点不了：把链接放主页简介，评论区置顶「搜 草语言 GitHub / 主页有链接」。

### 小红书（图文，6 张图）

1. 封面：战绩图（`docs/card.png`）+ 大字「我用中文梗写了个编程语言」
2. 游戏截图：老板冲脸
3. 代码截图：`整活` `栓Q` `卷` `润`
4. 关键字对照表（截 README 的速查表）
5. 报错截图「这谁啊，不认识……你是不是想说」
6. 结局「你被优化了 · 毕业快乐」

**标题：** 程序员的发疯文学：我写了一门用网络梗当关键字的编程语言

**正文**
```
函数叫「整活」，return 叫「栓Q」，循环叫「卷」，break 叫「润」，什么都不干叫「摆烂」😂
我还用它写了个 3D 游戏《逃离996》：下班了老板不让走，用辞职信砸他！
手机就能玩，玩完能生成战绩图，看看你是「润学大师」还是「职场萌新」
（链接在战绩图上 / 搜「草语言」）
#程序员 #编程 #打工人 #发疯文学 #独立游戏
```
小红书屏蔽外链，所以战绩图上印着网址：每个晒图的人都在帮你传链接。

### 知乎

找问题回答（搜「有哪些有趣的编程语言」「如何自己写一门编程语言」「中文编程有没有前途」），或者发文章：

**文章标题：** 我用中文互联网梗写了一门编程语言：从解释器到编译器，再到一个 3D 游戏

**结构：** 动机（梗）→ 语言设计（中文没有空格，关键字怎么切）→ 从树遍历解释器到编译成 JS（快了 85 倍）→ 用它写光线投射 3D 游戏 → 链接。知乎读者吃技术细节，可以讲「搞个x = x + 1」这种作用域坑怎么处理。

### V2EX（分享创造节点）/ 即刻

```
标题：做了个用网络梗当关键字的编程语言「草语言」，顺手用它写了个 3D 游戏

搞个 = let，整活 = function，栓Q = return，卷 = while，润 = break
编译成 JS（fib(30) 39ms，Python 123ms），能用 npm 包，报错也是梗。
用它写了个光线投射 3D 游戏《逃离996》，手机也能玩：
https://enochzheng1.github.io/caolang/996.html
GitHub：https://github.com/EnochZheng1/caolang
欢迎来 PR 新梗（加报错信息是最简单的贡献方式）
```

---

## 4. English platforms

### Show HN

**Title:** `Show HN: CaoLang – a programming language made of Chinese internet slang`

**URL:** the repo (the README.en.md GIF does the selling)

**First comment (post right after submitting):**
```
Hi HN! CaoLang started as a joke: every keyword is a Chinese internet meme. `let` is 搞个 ("let's get one"), `return` is 栓Q (a sarcastic, accented "thank you"), `while` is 卷 ("involution" — the endless rat race), and `break` is 润 ("run", slang for getting out of the country).

Then it got serious. It now compiles to JavaScript (fib(30) in 39ms vs 123ms in Python), uses npm packages, and has a small canvas library — enough to write a 60fps raycasting game in it: Escape 996, where you throw resignation letters at bosses who won't let you leave work. It runs in the browser, phones included: https://enochzheng1.github.io/caolang/996.html

Some fun problems along the way: Chinese has no spaces, so the lexer does greedy keyword matching (and had to learn not to split 草莓 "strawberry" into 草 "catch" + 莓). Compiling to JS meant mapping CaoLang's dynamic scoping onto `let` (e.g. `搞个 x = x + 1` inside a block reads the outer x), and errors are mapped back to .cao lines from V8 stack traces.

The README has a glossary of the memes — the translations are half the fun.
```

**When:** Tuesday–Thursday, 8–10am US Pacific. Reply to every comment in the first 2 hours.

### Reddit

- **r/ProgrammerHumor** (image post — the glossary is the joke)
  - Title: `In this Chinese meme programming language, return is 栓Q (a sarcastic "thank you") and break is 润 ("emigrate")`
  - Image: a screenshot of the glossary table from README.en.md, or the error message with "did you mean"
  - Comment with the repo and game links
- **r/ProgrammingLanguages** (technical)
  - Title: `CaoLang: keywords are Chinese internet slang; compiles to JS; enough to write a raycaster`
  - Body: lexing without spaces, interpreter → compiler, scoping semantics vs JS `let`, line-map error reporting, one test suite running on both backends
- **r/webgames** or **r/IndieGaming**: the game itself, "made in a meme programming language" as the hook

### X / Twitter (thread)

1. I made a programming language out of Chinese internet slang. `return` is 栓Q (sarcastic "thank you"). `break` is 润 ("run" — as in, leave the country). Then I wrote a 3D game in it. 🧵 [GIF]
2. The game: it's clock-out time but the boss won't let you leave. Throw resignation letters at bosses, find the exit. At 21:00, "996 mode" turns on and they go berserk. Play it (phones work too): [game link]
3. It's not a toy: it compiles to JavaScript. fib(30): 39ms. Python: 123ms. The old interpreter: 3300ms. [speed table]
4. Even the errors are memes: undefined variable → "who's this? never heard of them — did you mean …?" [error screenshot]
5. MIT, PRs welcome (adding new meme error messages is the easiest first PR): [repo link]

---

## 5. Schedule

| Day | Where | Why |
|---|---|---|
| D-2 | Checklist above; record and edit the video | |
| D0, 19:00–21:00 Beijing time | **Bilibili** (full video) + **Douyin** (vertical cut) | Evening is peak time; Bilibili audience loves this exact kind of 整活 |
| D0 | Share in your own WeChat/QQ groups and Moments, with the results card | Seed the first plays and cards |
| D1 | **小红书**, **知乎** article, **V2EX**, **即刻** | Second wave; point back to the video |
| D2–D4 (Tue–Thu) | **Show HN** at 8–10am Pacific, then **Reddit** and **X** the same day | English launch, after the Chinese wave has given you social proof (stars) |
| D7 | Follow-up post: best results cards, funniest PRs, "what's next" | Keeps momentum |

---

## 6. During the launch

- **Reply fast and in character.** Use the memes in replies; it's part of the product.
- **Pin a "晒战绩" comment** everywhere: results cards in the comments are free reach.
- **Good first issues ready before launch:** "add a new meme error message", "add a new keyword alias", "make a new level map". People who arrive from a viral post want something small to contribute.
- **Watch:** GitHub stars, game page visits (enable a free analytics tool if you want numbers), results cards posted, PRs/issues.
- **If something breaks:** the game is a single static page; fix, merge, and Pages redeploys in ~2 minutes.

---

## 7. After the launch: merch (only once there's traction)

Wait for a clear signal (for example ~1,000 stars or a video that takes off), then start with print-on-demand so there's no inventory:

- **Stickers** (cheapest, great giveaways): `栓Q`, `润`, `摆烂`, the pixel boss, a resignation letter
- **T-shirts:** the pixel boss with 「这个需求很简单」; the keyword cheat sheet; 「这谁啊，不认识」
- **Mug:** 「摆烂」 or 「卷不动了」
- Run a quick pre-order or interest form first; check the 草语言 / CaoLang trademark situation before ordering anything at scale.
