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
    t.ok(await p.ev(`[...document.querySelectorAll(".hot")].length === 5 && [...document.querySelectorAll(".hot")].filter((b) => !b.hidden).every((b) => b.tabIndex === 0 && b.getAttribute("aria-label"))`), "おせる ところに Tab で いけない・名前が ない");
    t.eq(await p.ev(`[...document.querySelectorAll(".guide a")].map((a) => a.getAttribute("href"))`), ["#products", "#news", "#nakama", "#about"], "工場あんない");
    t.eq(await p.ev(`document.querySelector('#products a').href`), "https://koki-hq.github.io/warpix-link/", "warpix-link への リンク");
    // じむしょの 芯の ことば（デザインが かわっても のこす）
    t.ok((await p.ev(`document.getElementById("about").textContent`)).includes("ドット絵と チップチューンの 世界"), "じむしょの 説明から 芯の ことばが きえた");
    // なかま図鑑：キャラクターの 絵が 描かれている
    t.ok(await p.ev(`[...document.querySelectorAll("#nakama canvas[data-sprite]")].length >= 10 && [...document.querySelectorAll("#nakama canvas[data-sprite]")].every((c) => c.width > 0)`), "図鑑の 絵が ない");
    t.ok(await p.ev(`!!document.getElementById("pikuse")`), "id=pikuse の 場所が ない");
    // 地面の 下の 世界：パネルの うしろ いっぱいに 描かれ、ふかい ほど くらい
    await t.sleep(400);
    t.ok(await p.ev(`(() => { const w = document.querySelector(".underground"), c = w.querySelector("canvas"); if (!c.width || w.offsetHeight < document.querySelector("main").offsetHeight) return false; const x = c.getContext("2d"); const lum = (y) => { const d = x.getImageData(0, y, 1, 1).data; return d[0] + d[1] + d[2]; }; return lum(2) > lum(c.height - 4); })()`), "地下の 世界が 描かれていない・ふかい ほうが あかるい");
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

  async "ラジカセ：おす たびに 1 → 2 → 3 きょくめ、つぎで とまる。タブを かくすと とまる"(t) {
    const { server, p } = await open(t);
    const btn = "#radio-btn";
    t.eq(await p.ev(`radio.playing()`), false, "さいしょから 鳴っている");
    for (const [i, title] of ["こうじょうの あさ", "ゲンさんの ひとやすみ", "ちていの ふしぎ"].entries()) {
      await p.click(btn);
      t.ok(await p.ev(`radio.playing() && radio.current().title === ${JSON.stringify(title)}`), `${i + 1} きょくめが ながれない`);
      t.ok((await said(p)).includes(`${i + 1}きょくめ「${title}」`), `ゲンさんが きょくめいを いわない: ${await said(p)}`);
      t.eq(await p.ev(`document.querySelector("${btn}").getAttribute("aria-pressed")`), "true", "aria-pressed");
    }
    await t.sleep(700);
    t.ok((await p.ev(`radio.beat()`)) >= 1, "はくが すすまない");
    await p.click(btn);
    t.ok(!(await p.ev(`radio.playing()`)) && (await said(p)).includes("とめたぞ"), "4 かいめで とまらない");
    t.eq(await p.ev(`document.querySelector("${btn}").getAttribute("aria-pressed")`), "false", "とめたのに aria-pressed が true");
    await p.click(btn);
    await p.send("Emulation.setFocusEmulationEnabled", { enabled: false });
    await p.ev(`(Object.defineProperty(document, "hidden", { value: true, configurable: true }), document.dispatchEvent(new Event("visibilitychange")))`);
    t.ok(!(await p.ev(`radio.playing()`)), "タブを かくしても 鳴りつづける");
    t.eq(await p.ev(`document.querySelector("${btn}").getAttribute("aria-pressed")`), "false", "かくして とまったのに aria-pressed が true");
    t.noErrors(p);
    await server.close();
  },

  async "地下の なぞ：生き物が こたえ、石板の かけらを 5 つ あつめると 伝説。ピクセも おぼえている"(t) {
    for (const size of [{ width: 1280, height: 900 }, { mobile: [390, 844] }]) {
      const { server, p } = await open(t, "?hour=14", size.mobile ? { mobile: size.mobile } : { size });
      await t.sleep(800);
      const frags = await p.ev(`[...document.querySelectorAll(".ug-hot")].filter((b) => b.getAttribute("aria-label").startsWith("石板")).length`);
      t.eq(frags, 5, `石板の かけらが 5 つ ない（${size.width ?? "スマホ"}）`);
      const toast = () => p.ev(`document.getElementById("toast").textContent`);
      for (let i = 0; i < 5; i++) {
        // パネルの あいだの すきまを とおして、ほんとうに クリックが とどく
        await p.ev(`document.querySelectorAll(".ug-hot:not([hidden])")[0] && [...document.querySelectorAll(".ug-hot")].find((b) => !b.hidden && b.getAttribute("aria-label").startsWith("石板")).scrollIntoView({ block: "center", behavior: "instant" })`);
        await t.sleep(100);
        await p.click(`.ug-hot[aria-label^="石板"]:not([hidden])`);
        if (i < 4) t.ok((await toast()).includes(`（${i + 1}／5）`), `かけら ${i + 1}: ${await toast()}`);
      }
      t.ok((await toast()).includes("そらへ のぼっていった") && (await p.ev(`chika.legend()`)), `伝説が でない: ${await toast()}`);
      t.eq(await p.ev(`document.querySelectorAll('.ug-hot[aria-label^="石板"]:not([hidden])').length`), 0, "あつめた かけらが のこっている");
      t.ok(await p.ev(`!!document.querySelector('.ug-hot[aria-label="石の ピクセ像"]')`), "石の ピクセ像が ない");
      await p.ev(`scrollTo({ top: 0, behavior: "instant" })`);
      await t.sleep(100);
      await p.click("#pikuse-btn");
      t.ok((await said(p)).includes("なつかしい"), `ピクセが 伝説を おぼえていない: ${await said(p)}`);
      t.noErrors(p);
      await server.close();
      await t.closeAll();
    }
    const { server, p } = await open(t, "?hour=14", { size: { width: 1280, height: 900 } });
    await t.sleep(800);
    await p.ev(`document.querySelector('.ug-hot[aria-label="スイショウクラゲ"]').scrollIntoView({ block: "center", behavior: "instant" })`);
    await t.sleep(100);
    await p.click(`.ug-hot[aria-label="スイショウクラゲ"]`);
    t.ok((await p.ev(`document.getElementById("toast").textContent`)).includes("ひかった"), "クラゲが こたえない");
    t.noErrors(p);
    await server.close();
  },

  async "季節の 服：春は さくら、夏は 入道雲、秋は すずしい、冬は 雪と おちゃ（どれも 晴れ）"(t) {
    const count = (p, test) => p.ev(`(() => { const c = document.querySelector(".scene canvas"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 0; i < d.length; i += 4) { const [r, g, b] = [d[i], d[i + 1], d[i + 2]]; if (${test}) k++; } return k; })()`);
    const cases = [
      [4, "spring", "ふう、いい ひよりだ", "r > 240 && g > 170 && g < 215 && b > 195 && b < 230"], // さくらの ピンク
      [7, "summer", "ふう、あっついなあ", "r > 240 && g > 180 && g < 210 && b < 40"], // ひまわりの 黄色
      [10, "autumn", "ふう、すずしく なったなあ", "r > 210 && g > 80 && g < 110 && b < 70"], // もみじの 赤
      [1, "winter", "ふう、さむいけど からだは ぽかぽかだ", "r > 238 && g > 242 && b > 245"], // 雪の しろ
    ];
    for (const [m, season, rest, test] of cases) {
      const { server, p } = await open(t, `?hour=14&t=40&month=${m}`, { size: { width: 1440, height: 900 } }); // 1440 なら 絵が ぜんぶ 見える
      t.eq(await p.ev(`factory.season`), season, `${m} 月の 季節`);
      t.eq((await p.ev(`factory.story(37)`)).say, rest, `${season} の ひとやすみの セリフ`);
      t.ok((await count(p, test)) > 60, `${season} の 色が 見あたらない`);
      t.ok((await count(p, "b > 200 && r < 140")) > 3000, `${season} でも 青空`);
      if (season === "winter") t.eq((await p.ev(`factory.story(60)`)).say, "おちゃ どうぞ！", "冬は おちゃ");
      t.noErrors(p);
      await server.close();
      await t.closeAll();
    }
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
