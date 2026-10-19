<div align="center">

# 草语言 CaoLang 🌿

**A programming language made of Chinese internet slang · compiles to JavaScript · runs as fast as JS**

[**▶ Play 《逃离996》 (Escape 996)**](https://enochzheng1.github.io/caolang/996.html) &nbsp;·&nbsp; [**✏️ Try it in the browser**](https://enochzheng1.github.io/caolang/) &nbsp;·&nbsp; [中文](README.md)

<a href="https://enochzheng1.github.io/caolang/996.html"><img src="docs/demo.gif" width="640" alt="Escape 996 gameplay: a boss charges at you and is defeated by two resignation letters"></a>

*Escape 996 — a 3D first-person game written 100% in CaoLang. Every pixel is computed by CaoLang code.*

</div>

---

CaoLang (草语言, "grass language" — 草 is Chinese internet slang for "lol / wtf") replaces every keyword with a meme. Variables are declared with `搞个` ("let's get one"), functions with `整活` ("let's do a bit"), you return with `栓Q` ("thank you", said sarcastically), loop with `卷` ("grind / involution") and break out with `润` ("run away", as in emigrating).

```
整活 斐波那契（n）「            // function fibonacci(n) {
  如果（n <= 1）「              //   if (n <= 1) {
    栓Q n                       //     return n
  」                            //   }
  栓Q 斐波那契（n - 1） + 斐波那契（n - 2）
」
```

It started as a joke. Then it got a real compiler.

- **Compiles to JavaScript** and runs on V8: on par with hand-written JS, 3–20× faster than Python
- **Uses all of npm**: `拿来吧你（"npm:lodash"）` ("gimme that!") imports any package
- **Builds games**: a canvas library with a pixel buffer, input, sound and a game loop — enough for a 60fps raycaster
- **Error messages with attitude**: undefined variable? `这谁啊，不认识` ("who's this? never heard of them"). Division by zero? `除以零？脑子瓦特了？` ("divide by zero? is your brain short-circuiting?")

## 🎮 Escape 996

996 is China's infamous "9am to 9pm, 6 days a week" work culture. It's clock-out time, but the boss won't let you leave. Dodge bosses through a maze of cubicles, throw resignation letters at them, and find the green 下班 (clock out) exit. Still there at 21:00? 996 mode kicks in and every boss goes berserk.

- Real 3D: textured raycasting, distance fog, pixel-art bosses, 60fps — no engine, [`examples/逃离996.cao`](examples/逃离996.cao) is the whole game
- Bosses path-find through the maze (BFS distance field) and shout "this feature is simple", "just stay late tonight", "young people should eat bitterness"
- Through the windows: an office skyline where every light is still on
- Plays on phones with an on-screen joystick, and makes a shareable results card at the end

**[▶ Play it now](https://enochzheng1.github.io/caolang/996.html)** — or open it in the [playground](https://enochzheng1.github.io/caolang/), change `搞个 老板速度 = 1.6` (boss speed) on the first line, and hit 整活！(run).

## 📖 Meme glossary

| Keyword | Means | The meme |
|---|---|---|
| `搞个` | `let` | "let's get one" — casual way to grab something |
| `整活` | `function` | "do a bit" — to put on a stunt or performance |
| `栓Q` | `return` | "thank you" in a heavy accent; now means sarcastic gratitude |
| `喊话` | `print` | "shout out" |
| `如果` / `啊这` | `if` / `else` | "if" / "uh… well…" — the speechless reaction |
| `卷` | `while` | "involution" — endless pointless competition, grinding |
| `润` | `break` | "run" — to get out (originally: emigrate) |
| `继续卷` | `continue` | "keep grinding" |
| `盘它` | for-each | "work it!" — from a crosstalk comedy catchphrase |
| `摆烂` | `pass` | "let it rot" — giving up on purpose |
| `寄` | `throw` | literally "to mail"; slang for "it's over / GG", because 寄 (jì) sounds like "G" |
| `真香` / `草` | `try` / `catch` | "smells good actually" (eating your words) / "lol, wtf" |
| `确实` / `没有内味` | `true` / `false` | "indeed" / "doesn't have that flavor" (deliberately long, to punish boolean-heavy code) |
| `虚无` | `null` | "the void" |
| `上交` | `export` | "hand it over to the state" — the joke reply to anything impressive (建议上交国家) |
| `拿来吧你` | `import` | "gimme that!" |
| `内卷` | `reduce` | involution — rolling a whole array inward into one value |
| `躺平` | `flatten` | "lying flat" — opting out of the rat race |

Errors are memes too:

```
错误！这谁啊，不认识: 打公人们 —— 你是不是想说「打工人们」？
  --> 打工人.cao:3:4
  |
3 | 喊话（打公人们）
  |       ^ 这里有问题
```

("Who's this, never heard of them: 打公人们 — did you mean 打工人们 (workers)?")

## ⚡ Speed

`cao run` compiles to JavaScript first. Generated code keeps the Chinese names and stays readable:

| Benchmark | CaoLang (compiled) | Hand-written JS | Python 3.13 | CaoLang (old interpreter) |
|---|---|---|---|---|
| fib(30), recursive | **39ms** | 42ms | 123ms | 3300ms |
| 10M-iteration loop | **119ms** | 76ms | 2317ms | — |

## Install & use

```bash
git clone https://github.com/EnochZheng1/caolang && cd caolang
npm install
npm run dev -- run examples/hello.cao                  # run a file
npm run dev -- build examples/逃离996.cao --网页         # build the game as one HTML page
npm run dev                                            # REPL
```

```
cao run <file.cao>              # compile to JS and run
cao build <file.cao>            # standalone .mjs (node or browser)
cao build <file.cao> --网页      # self-contained HTML page with the canvas library
cao run <file.cao> --解释        # use the tree-walking interpreter instead
```

Chinese and ASCII punctuation both work and can be mixed: `「」` or `{}` for blocks, `（）` or `()` for calls, `，` or `,`, `：` or `:`.

The full language reference (dicts, closures, modules, the standard library, the canvas API, easter eggs) is in the [Chinese README](README.md).

## How it works

TypeScript, zero runtime dependencies. Lexer (with greedy keyword matching, since Chinese has no spaces) → Pratt parser → either a tree-walking interpreter or a compiler to JavaScript that uses native JS values (arrays are arrays, dicts are objects), so npm values pass straight through. Errors are mapped back to `.cao` lines through a generated line map. The same test suite runs against both backends.

## License

MIT
