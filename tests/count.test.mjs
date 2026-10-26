// きた ひとの かず（v1.26）：かぞえる のは 本番の ホストで トークンが ある とき だけ。ブラウザには なにも 保存しない
// Cloudflare へは ほんとうに おくらない（テストでは ブロックして、おくろうと したかだけ みる）
async function watch(p) {
  await p.send("Network.enable");
  await p.send("Network.setBlockedURLs", { urls: ["*cloudflareinsights.com*"] });
  const seen = [];
  p.on((m) => {
    if (m.method === "Network.requestWillBeSent" && m.params.request.url.includes("cloudflareinsights")) seen.push(m.params.request.url);
  });
  return seen;
}

export default {
  async "きた ひとの かず：トークンや ホストが ちがえば かぞえない"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    const seen = await watch(p);
    await p.goto(server.url + "?hour=14", 1500);
    t.ok(await p.ev(`window.WARPIX_COUNT.host === "warpix.app"`), "本番の ホストが warpix.app で ない");
    t.ok(seen.length === 0, `てもとで かぞえようと した：${seen.join(", ")}`);
    // トークンが あっても ホストが ちがえば かぞえない
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_COUNT = { token: "TEST", host: "warpix.app" };` });
    await p.goto(server.url + "?hour=14", 1500);
    t.ok(seen.length === 0, `ホストが ちがうのに かぞえようと した：${seen.join(", ")}`);
    t.noErrors(p);
    await server.close();
  },

  async "きた ひとの かず：トークンと ホストが あえば かぞえる。クッキーも 保存も なし"(t) {
    const server = await t.startServer();
    const b = await t.launchBrowser();
    const p = await b.firstPage();
    const seen = await watch(p);
    await p.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.WARPIX_COUNT = { token: "TEST", host: "127.0.0.1" };` });
    await p.goto(server.url + "?hour=14", 1500);
    const tag = await p.ev(`(document.querySelector('script[src*="cloudflareinsights"]') || {}).dataset?.cfBeacon ?? ""`);
    t.eq(JSON.parse(tag || "{}").token, "TEST", `ビーコンが ない：${tag}`);
    t.ok(seen.length >= 1, "かぞえる よみこみが ない");
    t.eq(await p.ev(`document.cookie`), "", "クッキーが ある");
    t.eq(await p.ev(`localStorage.length + sessionStorage.length`), 0, "ブラウザに 保存している");
    t.ok(await p.ev(`document.getElementById("about").textContent.includes("なんにん きたか だけ")`), "じむしょに かぞえる ことが 書いて ない");
    await server.close();
  },
};
