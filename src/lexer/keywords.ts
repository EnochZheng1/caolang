import { TokenType } from "./token.js";

/**
 * Keyword map: Chinese meme keywords → TokenType.
 * Sorted by length descending for greedy prefix matching.
 */
export const KEYWORDS: Map<string, TokenType> = new Map([
  // 4-char keywords (must match first)
  ["没有内味", TokenType.MEI_NEI_WEI],   // false
  // 3-char keywords
  ["继续卷", TokenType.JI_XU_JUAN],     // continue
  // 2-char keywords
  ["整活", TokenType.ZHENG_HUO],         // function
  ["栓Q", TokenType.SHUAN_Q],            // return (mixed CJK + ASCII)
  ["搞个", TokenType.GAO_GE],            // let/var
  ["如果", TokenType.RU_GUO],            // if
  ["啊这", TokenType.A_ZHE],             // else
  ["摆烂", TokenType.BAI_LAN],           // pass
  ["真香", TokenType.ZHEN_XIANG],        // try
  ["确实", TokenType.QUE_SHI],           // true
  ["虚无", TokenType.XU_WU],             // null
  ["并且", TokenType.BING_QIE],          // and
  ["或者", TokenType.HUO_ZHE],           // or
  // 1-char keywords
  ["卷", TokenType.JUAN],                 // while
  ["润", TokenType.RUN],                   // break
  ["寄", TokenType.JI],                    // throw
  ["草", TokenType.CAO],                   // catch
  ["非", TokenType.FEI],                   // not
]);

/**
 * Keywords sorted by length descending, for greedy prefix matching.
 */
export const KEYWORDS_BY_LENGTH: Array<[string, TokenType]> = [...KEYWORDS.entries()]
  .sort((a, b) => b[0].length - a[0].length);
