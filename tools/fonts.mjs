// フォントを かるく する：このページで つかう 文字 だけの フォントに する
//   node tools/fonts.mjs          … フォントを つくりなおす
//   node tools/fonts.mjs --check  … たりない 文字が ないか しらべる（テストが つかう）
// 文字を ふやしたら（news.json・セリフ・文章）、かならず ながす。ながさないと、その 文字だけ ふつうの 字に なる。
//
// - DotGothic16（ふだんの 文字）：つかう 文字だけの woff2 を Google Fonts から もらって、fonts/ に おく。
//   ほかの サーバーへ とりに いかない。preload は つけない（はかったら、フォントを 待って 表示が おそく なった）
//   OFL で、予約された 名前が ない ので、文字を しぼって 置いて いい（fonts/OFL-DotGothic16.txt）
// - Press Start 2P（看板の 英字）：予約された 名前（RFN）つき なので、しぼった ものは 自分で 配れない（OFL FAQ 2.6）。
//   これまでどおり Google Fonts から。表示を とめない ように、あとから 読みこむ
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
export const SOURCES = ["index.html", "factory.js", "chika.js", "radio.js", "news.json"];
const GOOGLE = "https://fonts.googleapis.com/css2";
// Google Fonts は ブラウザを 見て 形式を かえる。woff2 を もらう ために Chrome の ふりを する
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const CHARS = join(ROOT, "fonts", "chars.txt");
const WOFF2 = join(ROOT, "fonts", "dotgothic16.woff2");

// つかう 文字：ASCII の 見える 文字 ぜんぶ ＋ ファイルに でてくる それ以外の 文字
export function usedChars() {
  const set = new Set();
  for (let c = 32; c < 127; c++) set.add(String.fromCharCode(c));
  for (const f of SOURCES) for (const ch of readFileSync(join(ROOT, f), "utf8")) if (ch.codePointAt(0) > 127) set.add(ch);
  set.delete("﻿");
  return [...set].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
}
// Press Start 2P に ない 文字（かな・漢字）は Google が はぶいて くれる
export const pressStartUrl = (chars) => `${GOOGLE}?family=Press+Start+2P&text=${encodeURIComponent(chars.join(""))}&display=swap`;
// いま fonts/dotgothic16.woff2 に はいっている 文字
export function linkedChars() {
  try {
    return new Set([...readFileSync(CHARS, "utf8").replace(/\r?\n$/, "")]);
  } catch {
    return null;
  }
}

async function build() {
  const chars = usedChars();
  const css = await (await fetch(`${GOOGLE}?family=DotGothic16&text=${encodeURIComponent(chars.join(""))}`, { headers: { "user-agent": UA } })).text();
  const src = css.match(/url\((https:[^)]+)\) format\('woff2'\)/)?.[1];
  if (!src) throw new Error("Google Fonts から woff2 の 住所が もらえなかった\n" + css.slice(0, 300));
  const font = Buffer.from(await (await fetch(src)).arrayBuffer());
  if (font.subarray(0, 4).toString() !== "wOF2") throw new Error("woff2 では なかった");
  writeFileSync(WOFF2, font);
  writeFileSync(CHARS, chars.join("") + "\n");
  // 中身が かわったら 住所も かえる（ふるい フォントが のこらない ように）
  const v = createHash("sha256").update(font).digest("hex").slice(0, 8);
  const href = `fonts/dotgothic16.woff2?v=${v}`;

  const replaceIn = (file, re, to) => {
    const path = join(ROOT, file);
    const text = readFileSync(path, "utf8");
    if (!re.test(text)) throw new Error(`${file} に ${re} が みつからない`);
    writeFileSync(path, text.replace(re, to));
  };
  replaceIn("index.html", /<link id="font" href="[^"]*"/, `<link id="font" href="${pressStartUrl(chars).replaceAll("&", "&amp;")}"`);
  replaceIn("index.html", /<noscript><link href="[^"]*"/, `<noscript><link href="${pressStartUrl(chars).replaceAll("&", "&amp;")}"`);
  replaceIn("style.css", /url\("fonts\/dotgothic16\.woff2[^"]*"\)/, `url("${href}")`);
  console.log(`fonts/dotgothic16.woff2：${chars.length} 文字、${(font.length / 1024).toFixed(1)} KB（v=${v}）`);
}

if (process.argv[1]?.endsWith("fonts.mjs")) {
  if (process.argv.includes("--check")) {
    const have = linkedChars();
    const missing = have ? usedChars().filter((c) => !have.has(c)) : usedChars();
    console.log(missing.length ? `たりない 文字: ${missing.join("")}` : `OK（${have.size} 文字）`);
    process.exit(missing.length ? 1 : 0);
  }
  await build();
}
