import { SourceLocation } from "../utils/source-location.js";

export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  IDENTIFIER = "IDENTIFIER",

  // Keywords (meme keywords)
  ZHENG_HUO = "ZHENG_HUO",       // 整活 → function
  SHUAN_Q = "SHUAN_Q",           // 栓Q → return
  GAO_GE = "GAO_GE",             // 搞个 → let/var
  RU_GUO = "RU_GUO",             // 如果 → if
  A_ZHE = "A_ZHE",               // 啊这 → else
  JUAN = "JUAN",                   // 卷 → while
  RUN = "RUN",                     // 润 → break
  JI_XU_JUAN = "JI_XU_JUAN",     // 继续卷 → continue
  BAI_LAN = "BAI_LAN",           // 摆烂 → pass
  JI = "JI",                       // 寄 → throw
  ZHEN_XIANG = "ZHEN_XIANG",     // 真香 → try
  CAO = "CAO",                     // 草 → catch
  QUE_SHI = "QUE_SHI",           // 确实 → true
  MEI_NEI_WEI = "MEI_NEI_WEI",   // 没有内味 → false
  XU_WU = "XU_WU",               // 虚无 → null
  BING_QIE = "BING_QIE",         // 并且 → and
  HUO_ZHE = "HUO_ZHE",           // 或者 → or
  FEI = "FEI",                     // 非 → not

  // Punctuation (canonical forms after normalization)
  LEFT_BRACE = "LEFT_BRACE",     // { or 「 or 『
  RIGHT_BRACE = "RIGHT_BRACE",   // } or 」 or 』
  LEFT_PAREN = "LEFT_PAREN",     // ( or （
  RIGHT_PAREN = "RIGHT_PAREN",   // ) or ）
  COMMA = "COMMA",                 // , or ，
  SEMICOLON = "SEMICOLON",       // ; or ；

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  PERCENT = "PERCENT",
  ASSIGN = "ASSIGN",             // =
  EQUAL = "EQUAL",               // ==
  NOT_EQUAL = "NOT_EQUAL",       // !=
  LESS = "LESS",
  GREATER = "GREATER",
  LESS_EQUAL = "LESS_EQUAL",
  GREATER_EQUAL = "GREATER_EQUAL",

  // Brackets
  LEFT_BRACKET = "LEFT_BRACKET",   // [
  RIGHT_BRACKET = "RIGHT_BRACKET", // ]

  // Special
  NEWLINE = "NEWLINE",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  loc: SourceLocation;
}
