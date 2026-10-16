// 健康診断：重さ、スマホでの速さ、待機中の CPU、アクセシビリティ（axe-core）。
//   node tools/health.mjs
import { startServer, launchBrowser, closeAll, sleep } from "../tests/lib/harness.mjs";

const AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const server = await startServer();

// ---------- 1. 重さ ----------
{
  const b = await launchBrowser();
  const p = await b.firstPage();
  await p.send("Network.enable");
  await p.send("Network.setCacheDisabled", { cacheDisabled: true });
  const reqs = new Map();
  p.on((m) => {
    if (m.method === "Network.responseReceived") reqs.set(m.params.requestId, { url: m.params.response.url, bytes: 0 });
    if (m.method === "Network.loadingFinished" && reqs.has(m.params.requestId)) reqs.get(m.params.requestId).bytes = m.params.encodedDataLength;
  });
  await p.goto(server.url + "?hour=14", 3000);
  let total = 0;
  console.log("## 重さ（はじめて開いたとき、キャッシュなし）");
  for (const r of reqs.values()) {
    if (r.url.startsWith("data:")) continue;
    total += r.bytes;
    console.log(`- ${r.url.replace(server.url, "/").slice(0, 70)}: ${kb(r.bytes)}`);
  }
  console.log(`- 合計: ${reqs.size} リクエスト, ${kb(total)}`);
  console.log(`- DOM の要素数: ${await p.ev(`document.getElementsByTagName("*").length`)}`);
  await closeAll();
}

// ---------- 2. スマホでの速さ ＋ 3. 待機中の CPU ----------
{
  const b = await launchBrowser({ width: 390, height: 844 });
  const p = await b.firstPage();
  await p.size(390, 844, true);
  await p.send("Network.enable");
  await p.send("Network.setCacheDisabled", { cacheDisabled: true });
  await p.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await p.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const t0 = Date.now();
  await p.send("Page.navigate", { url: server.url + "?hour=14" });
  await p.waitFor("Page.loadEventFired", () => true, 60000);
  const loadMs = Date.now() - t0;
  const timing = await p.ev(`(() => { const n = performance.getEntriesByType("navigation")[0]; const fcp = performance.getEntriesByName("first-contentful-paint")[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), fcp: fcp ? Math.round(fcp.startTime) : null }; })()`);
  console.log("\n## スマホでの速さ（遅めの 4G：150ms・1.6Mbps、CPU 4 倍遅く）");
  console.log(`- 最初に何か描かれるまで（FCP）: ${timing.fcp} ms`);
  console.log(`- HTML の読み込みが終わるまで（DOMContentLoaded）: ${timing.dcl} ms`);
  console.log(`- 全部読み終わるまで（load）: ${loadMs} ms`);

  await p.send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await sleep(2000);
  await p.send("Performance.enable");
  const metric = async () => Object.fromEntries((await p.send("Performance.getMetrics")).result.metrics.map((m) => [m.name, m.value]));
  const a = await metric();
  await sleep(10000);
  const z = await metric();
  console.log("\n## 待機中の CPU（スマホ相当、10 秒なにもしない）");
  console.log(`- メインスレッドが動いていた割合: ${(((z.TaskDuration - a.TaskDuration) / (z.Timestamp - a.Timestamp)) * 100).toFixed(1)} %`);
  console.log(`- そのうちスクリプト: ${(((z.ScriptDuration - a.ScriptDuration) / (z.Timestamp - a.Timestamp)) * 100).toFixed(1)} %`);
  console.log("  ※ GPU を使わないヘッドレス Chrome で測っているので、実機より重く出る");
  await closeAll();
}

// ---------- 4. アクセシビリティ ----------
{
  console.log("\n## アクセシビリティ（axe-core 4.10.2）");
  const b = await launchBrowser();
  const p = await b.firstPage();
  for (const [label, q] of [["ひる（いまの 季節）", "?hour=14"], ["冬・水を のんでいる コマ", "?hour=2&t=64&month=1"], ["春", "?hour=9&month=4"]]) {
    await p.goto(server.url + q, 1500);
    await p.ev(`new Promise((ok, ng) => { if (window.axe) return ok(); const s = document.createElement("script"); s.src = ${JSON.stringify(AXE)}; s.onload = ok; s.onerror = ng; document.head.append(s); })`);
    const res = await p.ev(`axe.run(document, { resultTypes: ["violations"] }).then((r) => r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, where: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })))`);
    console.log(`\n### ${label}: ${res.length ? `${res.length} 種類の問題` : "問題なし"}`);
    for (const v of res) console.log(`- [${v.impact}] ${v.id}（${v.n} か所）${v.help}\n    例: ${v.where.join(" ／ ")}`);
  }
  await closeAll();
}

await server.close();
process.exit(0);
