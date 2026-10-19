# 一起整活 Contributing

欢迎 PR！草语言的梗越多越好。

## 开发

```bash
npm install
npm test                 # 解释器和编译器跑同一套测试
npm run dev -- run examples/hello.cao
cd playground && npm install && npx vite   # 本地跑 Playground
```

草语言有两个后端，行为必须一致：

- `src/interpreter/` —— 树遍历解释器（`--解释`、REPL）
- `src/compiler/` —— 编译成 JavaScript（默认），运行时在 `src/compiler/runtime.ts`

`tests/interpreter/` 里的测试会在两个后端上各跑一遍，所以改语言行为时两边都要改。

## 最简单的贡献：加梗

- **新的报错梗**：报错信息在 `src/interpreter/interpreter.ts`、`src/interpreter/builtins.ts`（解释器）和 `src/compiler/runtime.ts`（编译器）里，搜现有的报错比如「越界了兄弟」就能找到。两边改成一样的，再在 `tests/` 里加个测试。
- **新的内置函数**：两边各加一个（`builtins.ts` 和 `runtime.ts` 里的 `def(...)`），名字能玩梗就玩梗（比如 `内卷` = reduce、`躺平` = flatten）。
- **《逃离996》新关卡**：地图就是 `examples/逃离996.cao` 里的 `地图文本`，用字符画的。
- **新的老板台词**：同一个文件里的 `老板台词`。

## 注意

- 新关键字要小心：词法分析是贪心前缀匹配，关键字会「吃掉」以它开头的名字（比如 `如果色` 会被切成 `如果` + `色`）。
- 别用敏感的梗，保持好笑不冒犯。
