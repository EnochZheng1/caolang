# Ready-to-paste submissions

Places that send people to the repo for months, not just one day. Each needs your own account; the text below is ready to paste. Check each site's current submission rules first, since they change.

| Where | Audience | How to submit | Effort |
|---|---|---|---|
| HelloGitHub (月刊) | Chinese developers who browse GitHub for fun projects | "推荐项目" form on hellogithub.com, or an issue on `521xueweihan/HelloGitHub` | 5 min |
| 阮一峰《科技爱好者周刊》 | One of the most-read Chinese tech newsletters | Open an issue on `ruanyf/weekly` | 5 min |
| esolangs.org | Esoteric-language enthusiasts; ranks well in search | Create an account, create the page `CaoLang` | 15 min |
| awesome-esolangs | GitHub list of esoteric languages | PR to `angrykoala/awesome-esolangs` | 5 min |
| Show HN | See `launch-kit.md` §4 | news.ycombinator.com/submit | 10 min |

---

## HelloGitHub

**项目地址：** https://github.com/EnochZheng1/caolang

**类别：** 有趣的项目 / 其它（或 JavaScript）

**项目标题：** 草语言：用中文互联网梗写代码的编程语言

**项目描述：**
```
一门用中文网络梗当关键字的编程语言：变量叫「搞个」，函数叫「整活」，return 叫「栓Q」，循环叫「卷」，break 叫「润」，try/catch 是「真香/草」。连报错都是梗：变量没定义会报「这谁啊，不认识……你是不是想说「名字」？」。

它不只是个玩笑：会编译成 JavaScript，速度和手写 JS 差不多（fib(30) 39ms，Python 123ms），能直接用 npm 的包，还自带画布库。作者用它写了一个 3D 第一人称游戏《逃离996》：下班了老板不让走，用辞职信砸他们，找到出口润出去，手机也能玩。
```

**亮点：**
```
- 关键字全是梗，中文标点和英文标点都能用，手机上写代码不用切输入法
- 编译成可读的 JavaScript（中文变量名原样保留），能用 npm 生态
- 用草语言写的光线投射 3D 游戏，每个像素都是草语言算出来的
- 在线 Playground，打开浏览器就能写：https://enochzheng1.github.io/caolang/
- 在线玩游戏：https://enochzheng1.github.io/caolang/996.html
```

**截图：** `docs/demo.gif`（游戏）、`docs/card.png`（战绩图）

---

## 阮一峰《科技爱好者周刊》

Open an issue on `ruanyf/weekly` with title and body:

**标题：** 【开源自荐】草语言：用中文网络梗写的编程语言，还能写 3D 游戏

**内容：**
```
https://github.com/EnochZheng1/caolang

一门用中文互联网梗当关键字的编程语言：「搞个」是变量，「整活」是函数，「栓Q」是 return，「卷」是循环，「润」是 break。它会编译成 JavaScript，能用 npm 的包。

作者用它写了一个 3D 网页游戏《逃离996》：下班了老板不让走，用辞职信砸老板，找到出口润出去。手机也能玩：https://enochzheng1.github.io/caolang/996.html
```

The weekly features one-paragraph items with a screenshot; `docs/demo.gif` or `docs/social-preview.png` works.

---

## esolangs.org page

Create the page **CaoLang** and paste this (MediaWiki markup). Adjust the year if needed.

```
{{infobox proglang
|name=CaoLang (草语言)
|paradigms=[[:Category:Imperative paradigm|imperative]], [[:Category:Functional paradigm|functional]]
|author=[[User:EnochZheng]]
|year=[[:Category:2026|2026]]
|memsys=[[:Category:Variable-based|variable-based]]
|class=[[:Category:Turing complete|Turing complete]]
|refimpl=[https://github.com/EnochZheng1/caolang caolang] (TypeScript)
|files=<code>.cao</code>
}}
'''CaoLang''' (草语言, "grass language"; 草 is Chinese internet slang for "lol / wtf") is a programming language whose keywords are all Chinese internet memes. It compiles to JavaScript, can import npm packages, and has a canvas library that was used to write a 3D raycasting game in it.

==Keywords==
{| class="wikitable"
! Keyword !! Meaning !! The meme
|-
| <code>搞个</code> || let || "let's get one"
|-
| <code>整活</code> || function || "do a bit", put on a stunt
|-
| <code>栓Q</code> || return || a sarcastic, accented "thank you"
|-
| <code>如果</code> / <code>啊这</code> || if / else || "if" / "uh… well…"
|-
| <code>卷</code> || while || "involution": the endless rat race
|-
| <code>润</code> || break || "run", slang for getting out
|-
| <code>继续卷</code> || continue || "keep grinding"
|-
| <code>盘它</code> || for-each || "work it!"
|-
| <code>摆烂</code> || pass || "let it rot", giving up on purpose
|-
| <code>寄</code> || throw || "it's over" (寄 sounds like "G", as in GG)
|-
| <code>真香</code> / <code>草</code> || try / catch || "smells good actually" / "lol, wtf"
|-
| <code>确实</code> / <code>没有内味</code> || true / false || "indeed" / "doesn't have that flavor"
|-
| <code>虚无</code> || null || "the void"
|-
| <code>上交</code> / <code>拿来吧你</code> || export / import || "hand it over to the state" / "gimme that!"
|}

Both Chinese and ASCII punctuation are accepted: <code>「」</code> or <code>{}</code> for blocks, <code>（）</code> or <code>()</code>, <code>，</code> or <code>,</code>.

==Examples==
===Hello, world!===
<pre>喊话（"你好世界"）</pre>

===Fibonacci===
<pre>
整活 斐波那契（n）「
  如果（n <= 1）「
    栓Q n
  」
  栓Q 斐波那契（n - 1） + 斐波那契（n - 2）
」
喊话（斐波那契（10））
</pre>

==Error messages==
Errors are memes too. An undefined variable gives <code>这谁啊，不认识: 名子 —— 你是不是想说「名字」？</code> ("who's this? never heard of them — did you mean 名字?"); division by zero gives <code>除以零？脑子瓦特了？</code> ("divide by zero? is your brain short-circuiting?").

==Implementation==
The reference implementation is written in TypeScript. Because Chinese has no spaces between words, the lexer uses greedy keyword matching. Programs are compiled to JavaScript that uses native JS values; a tree-walking interpreter is also available. Escape 996, a first-person raycasting game, is written entirely in CaoLang: [https://enochzheng1.github.io/caolang/996.html play it in the browser].

==External resources==
* [https://github.com/EnochZheng1/caolang GitHub repository]
* [https://enochzheng1.github.io/caolang/ Online playground]
* [https://www.npmjs.com/package/caolang npm package]

[[Category:Languages]]
[[Category:2026]]
[[Category:Implemented]]
[[Category:Turing complete]]
[[Category:Imperative paradigm]]
```

Then add a line to the [[Language list]] page: `* [[CaoLang]]`.

---

## awesome-esolangs

PR to `angrykoala/awesome-esolangs`, adding one line in the right section (keep their alphabetical order and format):

```
- [CaoLang](https://github.com/EnochZheng1/caolang) - Keywords are Chinese internet memes (`return` is 栓Q, `break` is 润); compiles to JavaScript and runs a 3D raycasting game.
```
