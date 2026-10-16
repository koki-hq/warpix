// WARPIX製作所の ホームページ：見取り図、ピクセ、えんとつ、製作所だより
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

export default {
  async "見取り図：LINK工場は warpix-link へ、けんせつちゅうの へやは ピクセが こたえる"(t) {
    const { server, p } = await open(t);
    t.eq(await p.ev(`document.title`), "WARPIX製作所", "タイトル");
    t.eq(await p.ev(`document.querySelector('[data-room="link"]').href`), "https://koki-hq.github.io/warpix-link/", "LINK工場の 行き先");
    t.ok(await p.ev(`document.querySelector('[data-room="link"]').textContent.includes("warpix-link へ ワープ")`), "LINK工場に 読み上げ用の 説明がない");
    t.ok((await p.ev(`document.getElementById("bubble").textContent`)).includes("こんにちは"), "ひるの あいさつ");
    await p.click('[data-room="soon-a"]');
    t.ok((await p.ev(`document.getElementById("bubble").textContent`)).includes("けんせつちゅう"), "けんせつちゅうの へやの ことば");
    // へやは キーボードで たどれる
    const tabbable = await p.ev(`[...document.querySelectorAll(".room")].every((r) => r.tabIndex === 0)`);
    t.ok(tabbable, "へやに Tab で いけない");
    // ドットの 絵が ちゃんと 描かれている（まっしろ・まっくろ では ない）
    t.ok(await p.ev(`(() => { const c = document.querySelector('.machine[data-sprite="gate"] canvas'); return c.width === 48 && c.getContext("2d").getImageData(0, 0, 48, 48).data.some((v, i) => i % 4 === 3 && v > 0); })()`), "ワープゲートの 絵が ない");
    t.ok(await p.ev(`document.querySelectorAll(".goods canvas").length >= 32`), "ベルトコンベアの 荷物が たりない");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセ：おすと しゃべって はねる。まよなかは ねていて、おすと おきる"(t) {
    let { server, p } = await open(t);
    await p.click("#pikuse-btn");
    const said = await p.ev(`document.getElementById("bubble").textContent`);
    t.ok(said.startsWith("ピクセ「") && (await p.ev(`factory.lines.some((l) => document.getElementById("bubble").textContent.includes(l))`)), `ピクセの セリフ: ${said}`);
    t.ok(await p.ev(`document.getElementById("pikuse-btn").classList.contains("hop")`), "はねない");
    t.noErrors(p);
    await server.close();
    await t.closeAll();

    ({ server, p } = await open(t, "?hour=2"));
    t.ok(await p.ev(`factory.isAsleep() && document.getElementById("pikuse-btn").classList.contains("asleep")`), "まよなかなのに おきている");
    t.ok((await p.ev(`document.getElementById("bubble").textContent`)).includes("ねている"), "ねている ことが わからない");
    t.ok(await p.ev(`document.body.classList.contains("night")`), "よるに ならない");
    const left = await p.ev(`document.getElementById("pikuse-btn").style.left`);
    await t.sleep(5600);
    t.eq(await p.ev(`document.getElementById("pikuse-btn").style.left`), left, "ねているのに あるいた");
    await p.click("#pikuse-btn");
    t.ok(!(await p.ev(`factory.isAsleep()`)) && (await p.ev(`document.getElementById("bubble").textContent`)).includes("ねてないよ"), "おきない");
    t.noErrors(p);
    await server.close();
  },

  async "ピクセは 中庭を あるき、えんとつを おすと けむりが ぽっ"(t) {
    const { server, p } = await open(t);
    const before = await p.ev(`document.getElementById("pikuse-btn").style.left`);
    await t.sleep(5600);
    t.ok((await p.ev(`document.getElementById("pikuse-btn").style.left`)) !== before, "あるかない");
    await p.click(".chimney");
    t.ok(await p.ev(`document.querySelector(".chimney").classList.contains("big") && document.getElementById("bubble").textContent.includes("ぽっぽー")`), "えんとつ");
    for (let i = 0; i < 9; i++) await p.click(".chimney");
    t.ok((await p.ev(`document.getElementById("bubble").textContent`)).includes("けほっ"), "10 かい おしたら けむい");
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
    t.noErrors(p);
    await server.close();
    await t.closeAll();

    ({ server, p } = await open(t, "?hour=14", { reduced: true }));
    const before = await p.ev(`document.getElementById("pikuse-btn").style.left`);
    await t.sleep(5600);
    t.eq(await p.ev(`document.getElementById("pikuse-btn").style.left`), before, "動きを へらしているのに あるいた");
    t.eq(await p.ev(`document.getAnimations().filter((a) => a.playState === "running").length`), 0, "アニメーションが うごいている");
    t.noErrors(p);
    await server.close();
  },
};
