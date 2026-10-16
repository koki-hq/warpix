// フォントを かるく する：このページで つかう 文字 だけの フォントを Google Fonts に たのむ
//   node tools/fonts.mjs          … index.html の フォントの リンクを つくりなおす
//   node tools/fonts.mjs --check  … たりない 文字が ないか しらべる（テストが つかう）
// 文字を ふやしたら（news.json・セリフ・文章）、かならず ながす。ながさないと、その 文字だけ ふつうの 字に なる。
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
export const SOURCES = ["index.html", "factory.js", "chika.js", "radio.js", "news.json"];
const BASE = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DotGothic16";

// つかう 文字：ASCII の 見える 文字 ぜんぶ ＋ ファイルに でてくる それ以外の 文字
export function usedChars() {
  const set = new Set();
  for (let c = 32; c < 127; c++) set.add(String.fromCharCode(c));
  for (const f of SOURCES) for (const ch of readFileSync(join(ROOT, f), "utf8")) if (ch.codePointAt(0) > 127) set.add(ch);
  set.delete("﻿");
  return [...set].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}
export const fontUrl = (chars) => `${BASE}&text=${encodeURIComponent(chars.join(""))}&display=swap`;
// index.html に いま 書いてある 文字
export function linkedChars() {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  const m = html.match(/<link id="font" href="([^"]+)"/);
  if (!m) return null;
  const url = new URL(m[1].replaceAll("&amp;", "&"));
  return new Set([...(url.searchParams.get("text") ?? "")]);
}

if (import.meta.url === `file:///${process.argv[1].replaceAll("\\", "/")}` || process.argv[1]?.endsWith("fonts.mjs")) {
  const chars = usedChars();
  if (process.argv.includes("--check")) {
    const have = linkedChars();
    const missing = have ? chars.filter((c) => !have.has(c)) : chars;
    console.log(missing.length ? `たりない 文字: ${missing.join("")}` : `OK（${chars.length} 文字）`);
    process.exit(missing.length ? 1 : 0);
  }
  const path = join(ROOT, "index.html");
  const html = readFileSync(path, "utf8");
  const url = fontUrl(chars).replaceAll("&", "&amp;");
  const tag = `<link id="font" href="${url}" rel="stylesheet">`;
  const next = html.replace(/<link (?:id="font" )?href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/, tag);
  if (next === html && !html.includes(tag)) throw new Error("index.html に フォントの リンクが みつからない");
  writeFileSync(path, next);
  console.log(`index.html：${chars.length} 文字、URL ${url.length} 文字`);
}
