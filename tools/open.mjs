// 開店の あさ（2026-11-01 7:00 日本時間）に、製作所だより（news.json）の いちばん 上へ「開店しました」を のせる。
// GitHub Actions（.github/workflows/open.yml）が ながす。手で ためす とき：node tools/open.mjs
// 7じ より まえ・もう のって いる ときは なにも しない。のせたら "opened" と 出す
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const OPEN = new Date("2026-11-01T07:00:00+09:00");
const ROOT = join(import.meta.dirname, "..");

export function addOpenNews(data, item, now) {
  if (now < OPEN || data.news.some((x) => x.id === item.id)) return null;
  return { ...data, news: [item, ...data.news] };
}

if (process.argv[1] === import.meta.filename) {
  const path = join(ROOT, "news.json");
  const item = JSON.parse(readFileSync(join(ROOT, "tools", "open-news.json"), "utf8"));
  const next = addOpenNews(JSON.parse(readFileSync(path, "utf8")), item, new Date());
  if (next) {
    writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
    console.log("opened");
  } else console.log("まだ（または もう のっている）");
}
