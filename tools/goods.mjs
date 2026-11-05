// グッズの 宣伝画像 goods/promo.png（1200×630）を つくる
//   node tools/goods.mjs
// goods/ の キーホルダーの 絵を かえたら ながす。
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, startServer, launchBrowser, closeAll, sleep } from "../tests/lib/harness.mjs";

const server = await startServer();
const b = await launchBrowser({ width: 1200, height: 630 });
const p = await b.firstPage();
await p.size(1200, 630);
for (const [card, out] of [["goods-card", "promo"]]) {
  await p.goto(server.url + `tools/${card}.html`, 1500);
  await p.ev(`document.fonts.ready`);
  await sleep(500);
  const shot = await p.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  writeFileSync(join(ROOT, "goods", `${out}.png`), Buffer.from(shot.result.data, "base64"));
  console.log(`goods/${out}.png（1200×630）`);
}
await closeAll();
await server.close();
