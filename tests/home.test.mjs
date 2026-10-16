// WARPIX製作所の ホームページ：青空の 工場まち、ゲンさんと ピクセ、えんとつ、なかま図鑑、製作所だより
const NEWS = JSON.stringify({
  news: [
    { id: "old", date: "2020-01-01", title: "むかしの おしらせ", body: "ふるい", url: "https://example.com/old" },
    { id: "new", date: "2099-12-31", title: "みらいの おしらせ", body: "あたらしい" },
    { id: "bad", title: "日付が ない" },
  ],
});

async function open(t, query = "?hour=14", opts = {}) {
  const server = await t.startServer(opts.server);
  const b = await t.launchBrowser(opts.size ?? {});
  const p = await b.firstPage();
  if (opts.reduced) await p.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (opts.mobile) await p.size(...opts.mobile, true);
  await p.goto(server.url + query, 1500);
  await p.ev(`factory.newsReady`);
  return { server, p };
}
const said = (p) => p.ev(`document.getElementById("bubble").textContent`);
const pikuseAt = (p) => p.ev(`(() => { const s = document.getElementById("pikuse-btn").style; return s.left + " " + s.top; })()`);

export default {
  async "青空の 町工場：看板、絵、あいさつ、おせる ところは キーボードで たどれる"(t) {
    const { server, p } = await open(t);
    t.eq(await p.ev(`document.title`), "WARPIX製作所", "タイトル");
    t.eq(await p.ev(`document.querySelector("h1").textContent`), "WARPIX製作所", "看板の 見出し");
    t.ok((await said(p)).includes("こんにちは"), "ひるの あいさつ");
    t.ok((await p.ev(`document.querySelector(".scene .say").textContent`)).includes("こんにちは"), "絵の ふきだしに あいさつが ない");
    // 絵が ちゃんと 描かれている（空の 青が ある）
    t.ok(await p.ev(`(() => { const d = document.querySelector(".scene canvas").getContext("2d").getImageData(0, 0, document.querySelector(".scene canvas").width, 176).data; let blue = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 200 && d[i] < 120) blue++; return blue > 4000; })()`), "青空が 描かれていない");
    t.ok(await p.ev(`[...document.querySelectorAll(".hot")].length === 4 && [...document.querySelectorAll(".hot")].filter((b) => !b.hidden).every((b) => b.tabIndex === 0 && b.getAttribute("aria-label"))`), "おせる ところに Tab で いけない・名前が ない");
    t.eq(await p.ev(`[...document.querySelectorAll(".guide a")].map((a) => a.getAttribute("href"))`), ["#products", "#news", "#nakama", "#about"], "工場あんない");
    t.eq(await p.ev(`document.querySelector('#products a').href`), "https://koki-hq.github.io/warpix-link/", "warpix-link への リンク");
    // じむしょの 芯の ことば（デザインが かわっても のこす）
    t.ok((await p.ev(`document.getElementById("about").textContent`)).includes("ドット絵と チップチューンの 世界"), "じむしょの 説明から 芯の ことばが きえた");
    // なかま図鑑：キャラクターの 絵が 描かれている
    t.ok(await p.ev(`[...document.querySelectorAll("#nakama canvas[data-sprite]")].length >= 10 && [...document.querySelectorAll("#nakama canvas[data-sprite]")].every((c) => c.width > 0)`), "図鑑の 絵が ない");
    t.ok(await p.ev(`!!document.getElementById("pikuse")`), "id=pikuse の 場所が ない");
    t.noErrors(p);
    await server.close();
  },

  async "お話：トンテンカン → 水を はこぶ → ごくごく → ふきふき → ぷはー"(t) {
    const { server, p } = await open(t, "?hour=14&t=10");
    const s = (n) => p.ev(`factory.story(${n})`);
    t.ok(["rUp", "rHit"].includes((await s(10)).right), "はじめは かなづちを ふる");
    t.ok((await s(53)).carry, "ピクセが 水を はこばない");
    t.eq((await s(64)).right, "rDrink", "水を のまない");
    t.eq((await s(76)).left, "lWipe", "汗を ふかない");
    t.ok((await s(82)).say.includes("ぷはー"), "ぷはー が ない");
    // ?t= で とめた コマでは、ピクセの ボタンも 絵の ピクセの 場所に いる
    const home = await pikuseAt(p);
    t.noErrors(p);
    await server.close();
    await t.closeAll();
    const again = await open(t, "?hour=14&t=44");
    t.ok((await pikuseAt(again.p)) !== home, "ジャグへ あるいても ピクセの ボタンが うごかない");
    t.noErrors(again.p);
    await again.server.close();
  },

  async "工場の とけいで うごき、ピクセ・ゲンさん・ねこは おすと しゃべる"(t) {
    // ねこは 絵の みぎの ほう。せまい 画面では 見えない ので、ひろい 画面で
    const { server, p } = await open(t, "?hour=14", { size: { width: 1280, height: 900 } });
    t.ok(!(await p.ev(`document.getElementById("cat-btn").hidden`)), "ひろい 画面なのに ねこが かくれている");
    const n0 = await p.ev(`factory.frame()`);
    const img0 = await p.ev(`document.querySelector(".scene canvas").toDataURL()`);
    await t.sleep(1500);
    t.ok((await p.ev(`factory.frame()`)) > n0, "とけいが すすまない");
    t.ok((await p.ev(`document.querySelector(".scene canvas").toDataURL()`)) !== img0, "絵が かわらない");
    await p.click("#pikuse-btn");
    const line = await said(p);
    t.ok(line.startsWith("ピクセ「") && (await p.ev(`factory.lines.some((l) => document.getElementById("bubble").textContent.includes(l.replaceAll("\\n", " ")))`)), `ピクセの セリフ: ${line}`);
    await p.click("#oji-btn");
    t.ok((await said(p)).startsWith("ゲンさん「"), `ゲンさんの セリフ: ${await said(p)}`);
    await p.click("#cat-btn");
    t.ok((await said(p)).startsWith("トタン「"), `ねこの セリフ: ${await said(p)}`);
    t.noErrors(p);
    await server.close();
  },

  async "えんとつを おすと ぽっぽー、10 かいで けほっ"(t) {
    const { server, p } = await open(t);
    await p.click(".hot.chimney");
    t.ok((await said(p)).includes("ぽっぽー"), "えんとつ");
    for (let i = 0; i < 9; i++) await p.click(".hot.chimney");
    t.ok((await said(p)).includes("けほっ"), "10 かい おしたら けむい");
    t.noErrors(p);
    await server.close();
  },

  async "製作所だより：あたらしい じゅん、けいじばんに さいしん、NEW、こわれた ものは とばす"(t) {
    const { server, p } = await open(t, "?hour=14", { server: { override: { "/news.json": NEWS } } });
    const items = await p.ev(`[...document.querySelectorAll("#news-list li")].map((li) => ({ title: li.querySelector(".n-title").textContent, link: li.querySelector("a.n-title")?.href ?? null, isNew: !!li.querySelector(".n-new"), date: li.querySelector("time").dateTime }))`);
    t.eq(items, [
      { title: "みらいの おしらせ", link: null, isNew: true, date: "2099-12-31" },
      { title: "むかしの おしらせ", link: "https://example.com/old", isNew: false, date: "2020-01-01" },
    ], "おしらせの ならび");
    t.eq(await p.ev(`document.getElementById("board-latest").textContent`), "NEWみらいの おしらせ", "けいじばん");
    t.ok(await p.ev(`!!document.getElementById("news")`), "id=news の 場所が ない（warpix-link の フッターが とぶ 先）");
    t.noErrors(p);
    await server.close();
  },

  async "製作所だより：よめない ときも こわれない"(t) {
    for (const body of [null, "{ こわれた"]) {
      const { server, p } = await open(t, "?hour=14", { server: { override: { "/news.json": body } } });
      t.ok((await p.ev(`document.getElementById("board-latest").textContent`)).includes("よめませんでした"), "けいじばん");
      t.ok((await p.ev(`document.getElementById("news-list").textContent`)).includes("よめませんでした"), "おしらせの 一覧");
      t.noErrors(p);
      await server.close();
      await t.closeAll();
    }
  },

  async "本物の news.json は 形が ただしい"(t) {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const data = JSON.parse(readFileSync(join(t.ROOT, "news.json"), "utf8"));
    t.ok(Array.isArray(data.news) && data.news.length > 0, "news が ない");
    const ids = new Set();
    for (const n of data.news) {
      t.ok(/^\d{4}-\d{2}-\d{2}$/.test(n.date), `日付の 形: ${n.date}`);
      t.ok(n.id && !ids.has(n.id), `id が ない・かぶっている: ${n.id}`);
      ids.add(n.id);
      t.ok(n.title && n.title.length <= 40, `タイトルが ない・ながすぎる: ${n.title}`);
      t.ok(!n.url || n.url.startsWith("https://"), `url は https: ${n.url}`);
    }
  },

  async "スマホの はばでも よこに はみださない。動きを へらす せっていでは とまる"(t) {
    let { server, p } = await open(t, "?hour=14", { mobile: [360, 800] });
    t.ok(await p.ev(`document.documentElement.scrollWidth <= innerWidth`), `よこに はみだす: ${await p.ev(`document.documentElement.scrollWidth`)}`);
    t.ok(await p.ev(`document.getElementById("cat-btn").hidden`), "せまい 画面で 見えない ねこの ボタンが のこっている");
    t.noErrors(p);
    await server.close();
    await t.closeAll();

    ({ server, p } = await open(t, "?hour=14", { reduced: true }));
    const n0 = await p.ev(`factory.frame()`);
    const before = await pikuseAt(p);
    await t.sleep(2000);
    t.eq(await p.ev(`factory.frame()`), n0, "動きを へらしているのに とけいが すすむ");
    t.eq(await pikuseAt(p), before, "動きを へらしているのに ピクセが うごいた");
    t.eq(await p.ev(`document.getAnimations().filter((a) => a.playState === "running").length`), 0, "アニメーションが うごいている");
    await p.click("#pikuse-btn");
    t.ok((await said(p)).startsWith("ピクセ「"), "動きを へらしていても はなしかけられる");
    t.noErrors(p);
    await server.close();
  },
};
