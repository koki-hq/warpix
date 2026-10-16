// 共有カード og.png（1200×630）を つくる：青空の 工場まち（夏）＋ 地面の 帯に ひとこと
//   node tools/og.mjs
// 絵や 看板を かえたら ながす。
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, OUT, startServer, launchBrowser, closeAll, sleep } from "../tests/lib/harness.mjs";

mkdirSync(OUT, { recursive: true });
const server = await startServer();
const b = await launchBrowser({ width: 1440, height: 900 });
const p = await b.firstPage();
await p.size(1440, 900);

// 1. 工場まちを 撮る（ふきだし・ツアーの ボタンは かくす）
await p.goto(server.url + "?hour=10&t=20&month=7", 1500);
await p.ev(`document.fonts.ready`);
await p.ev(`(() => { const s = document.createElement("style"); s.textContent = ".say, .tour-btn { display: none !important }"; document.head.append(s); })()`);
await sleep(300);
const hero = await p.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1440, height: 528, scale: 1 } });
writeFileSync(join(OUT, "og-hero.png"), Buffer.from(hero.result.data, "base64"));

// 2. カードに する
await p.size(1200, 630);
await p.goto(server.url + "tools/og-card.html", 1500);
await p.ev(`document.fonts.ready`);
await sleep(300);
const card = await p.send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
writeFileSync(join(ROOT, "og.png"), Buffer.from(card.result.data, "base64"));
console.log("og.png（1200×630）");
await closeAll();
await server.close();
