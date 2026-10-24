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
    t.ok(await p.ev(`!!document.querySelector('#about a[href="mailto:pixe@warpix.app"]')`), "じむしょに ピクセに おてがみ（pixe@warpix.app）が ない");
    t.eq(await p.ev(`document.querySelector("h1").textContent`), "WARPIX製作所", "看板の 見出し");
    t.ok((await said(p)).includes("こんにちは"), "ひるの あいさつ");
    t.ok((await p.ev(`document.querySelector(".scene .say").textContent`)).includes("こんにちは"), "絵の ふきだしに あいさつが ない");
    // 絵が ちゃんと 描かれている（空の 青が ある）
    t.ok(await p.ev(`(() => { const d = document.querySelector(".scene canvas").getContext("2d").getImageData(0, 0, document.querySelector(".scene canvas").width, 176).data; let blue = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 200 && d[i] < 120) blue++; return blue > 4000; })()`), "青空が 描かれていない");
    t.ok(await p.ev(`[...document.querySelectorAll(".hot")].length === 11 && [...document.querySelectorAll(".hot")].filter((b) => !b.hidden).every((b) => b.tabIndex === 0 && b.getAttribute("aria-label"))`), "おせる ところに Tab で いけない・名前が ない");
    t.eq(await p.ev(`[...document.querySelectorAll(".guide a")].map((a) => a.getAttribute("href"))`), ["#products", "#news", "#nakama", "#about"], "工場あんない");
    t.eq(await p.ev(`document.querySelector('#products a').href`), "https://link.warpix.app/", "warpix-link への リンク");
    // せいひん 展示室：warpix-link の 絵（説明つき）、ひらく ボタン、コード
    t.ok(await p.ev(`(() => { const ex = document.querySelector("#products .exhibit"); return ex.querySelector("img").alt.includes("WARPIX LINK") && ex.querySelector(".ex-go").href === "https://link.warpix.app/" && ex.querySelector(".ex-src").href.startsWith("https://github.com/koki-hq/warpix-link"); })()`), "展示室の warpix-link が たりない");
    t.ok((await p.ev(`document.getElementById("products").textContent`)).includes("いつもの 公式サイトへ、ドット絵の ピクセと いっしょに ワープする 踏み台リンクアプリ。"), "製品の ひとことが きえた");
    t.eq(await p.ev(`document.querySelector("#products .ex-catch").textContent`), "いつもの アプリを、ちょっと 楽しく ひらく 入口。", "WARPIX LINK の ひとこと（事務所で きめた もの）");
    // 展示室は みじかく（説明書は warpix-link の 中）。権利の ことわりは のこす
    // ふだんは みじかく。くわしい 説明は「ピクセの てがき カタログ」に しまって あり、ひらくと 読める
    t.ok((await p.ev(`(() => { const ex = document.querySelector("#products .exhibit").cloneNode(true); ex.querySelector(".ex-catalog .ex-memo").remove(); return ex.textContent.replace(/\\s/g, "").length; })()`)) < 400, "展示室の 紹介（カタログの そと）が ながい");
    t.ok(await p.ev(`(() => { const d = document.querySelector("#products .ex-catalog"); return !d.open && d.querySelector("summary").textContent.includes("カタログ") && d.textContent.includes("こんな ひとに") && d.querySelectorAll(".ex-features li").length === 7 && d.textContent.includes("しゅうらいの よる"); })()`), "ピクセの てがき カタログが ない・さいしょから ひらいている");
    t.ok((await p.ev(`document.querySelector("#products .ex-note").textContent`)).includes("WARPIX製作所の もの"), "名前・絵の 権利の ことわりが ない");
    // じむしょの 芯の ことば（デザインが かわっても のこす）
    t.ok((await p.ev(`document.getElementById("about").textContent`)).includes("ドット絵と チップチューンの 世界"), "じむしょの 説明から 芯の ことばが きえた");
    // なかま図鑑：キャラクターの 絵が 描かれている
    t.ok(await p.ev(`[...document.querySelectorAll("#nakama canvas[data-sprite]")].length >= 10 && [...document.querySelectorAll("#nakama canvas[data-sprite]")].every((c) => c.width > 0)`), "図鑑の 絵が ない");
    t.ok(await p.ev(`!!document.getElementById("pikuse")`), "id=pikuse の 場所が ない");
    // 地面の 下の 世界：パネルの うしろ いっぱいに 描かれ、ふかい ほど くらい
    await t.sleep(400);
    t.ok(await p.ev(`(() => { const w = document.querySelector(".underground"), c = w.querySelector("canvas"); if (!c.width || w.offsetHeight < document.querySelector("main").offsetHeight) return false; const x = c.getContext("2d"); const lum = (y) => { const d = x.getImageData(0, y, 1, 1).data; return d[0] + d[1] + d[2]; }; return lum(2) > lum(c.height - 4); })()`), "地下の 世界が 描かれていない・ふかい ほうが あかるい");
    // 展示室の ピクセ：おすと ワープあなに とびこんでから warpix-link へ（すぐには とばない）
    const warp = await p.ev(`(() => { const w = document.querySelector(".ex-warp"); w.click(); return { label: w.getAttribute("aria-label"), href: w.href, warping: w.classList.contains("warping"), here: location.host }; })()`);
    t.ok(warp.label.includes("WARPIX LINK") && warp.href === "https://link.warpix.app/" && warp.warping && warp.here.startsWith("127.0.0.1"), `展示室の ピクセが ワープ しない: ${JSON.stringify(warp)}`);
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
    // 図鑑の なかまも みんな しゃべる（うごく なかまは ボタンも ついていく）
    for (const [id, name] of [["h", "ハコビ"], ["b", "バチ"], ["l", "リフトン"], ["a", "アームさん"], ["r", "スズメ"]]) {
      await p.click(`#friend-${id}`);
      t.ok((await said(p)).startsWith(`${name}「`), `${name} が しゃべらない: ${await said(p)}`);
    }
    const h0 = await p.ev(`document.getElementById("friend-h").style.left`);
    await t.sleep(1300);
    t.ok((await p.ev(`document.getElementById("friend-h").style.left`)) !== h0, "ハコビの ボタンが ハコビに ついていかない");
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
    await t.sleep(1500); // パソコンが いそがしいと 音の 時計が おくれる ので、すこし ながめに まつ
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
      // はじまりの とびらは まだ とじている
      const door = `.ug-hot[aria-label="はじまりの とびら"]`;
      t.ok(await p.ev(`!!document.querySelector('${door}')`), "はじまりの とびらが ない");
      await p.ev(`document.querySelector('${door}').scrollIntoView({ block: "center", behavior: "instant" })`);
      await t.sleep(100);
      await p.click(door);
      t.ok((await toast()).includes("石の とびら") && !(await p.ev(`chika.open()`)), `とびらが こたえない・はじめから ひらいている: ${await toast()}`);
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
      // 伝説の あとは とびらが ひらき、ドットの 核に なる
      t.ok((await toast()).includes("とびらが ひらく 音") && (await p.ev(`chika.open()`)), "とびらが ひらかない");
      const coreSel = `.ug-hot[aria-label^="ドットの 核"]`;
      await p.ev(`document.querySelector('${coreSel}').scrollIntoView({ block: "center", behavior: "instant" })`);
      await t.sleep(100);
      await p.click(coreSel);
      t.ok((await toast()).includes("うまれた"), `ドットの 核が こたえない: ${await toast()}`);
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

  async "工場見学ツアー：ピクセが あんないして カメラが うごく。Esc で おわる。スマホでも 見えない ところへ"(t) {
    for (const opts of [{ size: { width: 1440, height: 900 } }, { mobile: [390, 844] }]) {
      const { server, p } = await open(t, "?hour=14", opts);
      t.eq(await p.ev(`factory.tour()`), null, "さいしょから ツアー中");
      await p.click("#tour-btn");
      t.eq(await p.ev(`document.getElementById("tour-btn").getAttribute("aria-pressed")`), "true", "aria-pressed");
      t.ok((await said(p)).includes("あんないがかり"), `ピクセが あんない しない: ${await said(p)}`);
      t.ok(await p.ev(`[...document.querySelectorAll(".hot")].every((b) => getComputedStyle(b).display === "none")`), "ツアー中に おせる ところが のこっている");
      t.ok((await p.ev(`document.querySelector(".scene .say").textContent`)).includes("いっしょに 工場を"), "絵の 中に あんないが でない");
      await t.sleep(7000); // 1 つめの あんないは 約 6 秒
      const st = await p.ev(`factory.tour()`);
      t.ok(st && st.i >= 1 && (await said(p)).includes("時計塔"), `つぎの 場所へ すすまない: ${JSON.stringify(st)} ${await said(p)}`);
      t.eq(st.z, opts.mobile ? 1 : 2, "カメラの よりかた");
      await p.key("Escape");
      t.eq(await p.ev(`factory.tour()`), null, "Esc で おわらない");
      t.ok(await p.ev(`getComputedStyle(document.getElementById("pikuse-btn")).display !== "none"`), "おわっても おせる ところが もどらない");
      t.noErrors(p);
      await server.close();
      await t.closeAll();
    }
  },

  async "ツアーと 会いに いく：紹介している なかまが あんないの ふきだしに かくれない（360・390・パソコン）"(t) {
    const area = (a, b) => Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
    const check = (v, label) => {
      t.ok(area(v.say, v.btn) === 0, `${label}：ふきだしが ツアーの ボタンに かかる`);
      for (const r of v.see) {
        const shown = area(r, { left: 0, top: 0, width: v.w, height: v.h }) / (r.width * r.height);
        t.ok(shown > 0.5, `${label}：紹介している ものが 画面の 外（${Math.round(shown * 100)}%）`);
        t.ok(area(r, v.say) === 0, `${label}：ふきだしに かくれる ${JSON.stringify(r)} / ${JSON.stringify(v.say)}`);
      }
    };
    for (const opts of [{ mobile: [360, 740] }, { mobile: [390, 844] }, { size: { width: 1440, height: 900 } }, { size: { width: 1024, height: 768 } }]) {
      const size = opts.mobile?.[0] ?? opts.size.width;
      const { server, p } = await open(t, "?hour=14", opts);
      const stops = await p.ev(`factory.stops`);
      for (let i = 0; i < stops - 1; i++) {
        await p.ev(`factory.tourGo(${i})`);
        await t.sleep(1300); // カメラが つくまで
        check(await p.ev(`factory.tourView()`), `${size}px ツアー ${i}`);
      }
      await p.key("Escape");
      for (const k of ["gen", "pikuse", "hakobi", "bachi", "arm", "lifton", "airship", "cat", "sparrow"]) {
        await p.ev(`(window.scrollTo({ top: 0, behavior: "instant" }), factory.meet("${k}"))`);
        await t.sleep(1700);
        check(await p.ev(`factory.tourView()`), `${size}px 会いに いく ${k}`);
        await p.key("Escape");
      }
      t.noErrors(p);
      await server.close();
      await t.closeAll();
    }
  },

  async "ソラマメ号：スマホでも ふだんの 絵に 見えている（うごく ときも、うごかない ときも）"(t) {
    for (const opts of [{ mobile: [360, 740] }, { mobile: [390, 844] }, { mobile: [390, 844], reduced: true }, { size: { width: 1440, height: 900 } }]) {
      const { server, p } = await open(t, "?hour=14", opts);
      const seen = () => p.ev(`(() => { const b = document.getElementById("friend-s").getBoundingClientRect(); const s = document.querySelector(".scene").getBoundingClientRect(); return !document.getElementById("friend-s").hidden && b.right > s.left + 20 && b.left < s.right - 20; })()`);
      t.ok(await seen(), `${JSON.stringify(opts)}：ソラマメ号が 見えない`);
      t.noErrors(p);
      await server.close();
      await t.closeAll();
    }
  },

  async "開店いわい：11/1 7じ〜11/14 だけ くすだま・紅白幕・花輪。2 年めからは ◯周年。SNS の 入口は 7じ から"(t) {
    const { server, p } = await open(t, "?date=2026-11-01&hour=14", { mobile: [390, 844] });
    const tag = () => p.ev(`(() => { const e = document.querySelector(".kaiten-tag"); return e.hidden ? null : e.textContent; })()`);
    t.eq(await tag(), "祝開店", "開店の 日の たれまく");
    t.ok((await said(p)).includes("開店！"), `開店の 日の あいさつ: ${await said(p)}`);
    t.ok((await p.ev(`document.querySelector(".scene canvas").getAttribute("aria-label")`)).includes("くすだま"), "読み上げに くすだまが ない");
    await p.click("#pikuse-btn");
    t.ok((await said(p)).includes("くすだま"), `ピクセの 開店の ことば: ${await said(p)}`);
    // ツアーの 看板の コマで、くすだまが ふきだしに かくれない
    await p.ev(`factory.tourGo(3)`);
    await t.sleep(1300);
    const v = await p.ev(`factory.tourView()`);
    const area = (a, b) => Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
    t.ok((await said(p)).includes("くすだま") && v.see.every((r) => area(r, v.say) === 0), `ツアーで くすだまが かくれる: ${await said(p)}`);
    await p.key("Escape");
    const links = await p.ev(`[...document.querySelectorAll("#about a, footer a")].filter((a) => a.checkVisibility()).map((a) => a.href).join(" ")`);
    for (const u of ["https://x.com/warpix_app", "https://www.instagram.com/warpix_app/", "mailto:pixe@warpix.app"]) t.ok(links.includes(u), `SNS の リンクが ない: ${u}`);
    const sns = () => p.ev(`[...document.querySelectorAll('a[href^="https://x.com/"]')].filter((a) => a.checkVisibility()).length`);
    // 7じ まえは まだ。SNS は「じゅんびちゅう」
    await p.goto(`${server.url}?date=2026-11-01T06:59&hour=6`, 800);
    t.eq(await tag(), null, "7じ まえに たれまく");
    t.eq(await sns(), 0, "7じ まえに SNS の リンクが 見える");
    t.ok(await p.ev(`document.querySelector(".before-open").checkVisibility()`), "7じ まえに「じゅんびちゅう」が ない");
    // だいにだん WARPIX ARCADE の 部屋は 開店から
    const arcade = () => p.ev(`(() => { const a = document.getElementById("ex-arcade"); return a.checkVisibility() && a.querySelector(".ex-go").href === "https://arcade.warpix.app/" && [...document.querySelectorAll("#about a")].some((l) => l.checkVisibility() && l.href === "https://arcade.warpix.app/"); })()`);
    t.ok(!(await arcade()), "7じ まえに ARCADE の 部屋が 見える");
    await p.goto(`${server.url}?date=2026-11-01T07:00&hour=7`, 800);
    t.eq(await tag(), "祝開店", "7じ ちょうどに たれまくが ない");
    t.eq(await sns(), 2, "7じ に SNS の リンク（じむしょ・フッター）");
    t.ok(!(await p.ev(`document.querySelector(".before-open").checkVisibility()`)), "開店 したのに「じゅんびちゅう」");
    t.ok(await arcade(), "開店 したのに ARCADE の 部屋が ない");
    for (const [q, want] of [["2026-10-31", null], ["2026-11-14", "祝開店"], ["2026-11-15", null], ["2027-11-03", "祝1周年"]]) {
      await p.goto(`${server.url}?date=${q}&hour=14`, 800);
      t.eq(await tag(), want, `${q} の たれまく`);
    }
    t.ok(!(await said(p)).includes("開店"), "2 年めの ふつうの 日に 開店の あいさつ");
    t.eq(await sns(), 2, "開店の あとも SNS の リンクは のこる");
    t.noErrors(p);
    await server.close();
  },

  async "開店の あさの おしらせ：7じ から 1 回だけ、news.json の いちばん 上へ（GitHub Actions が ながす）"(t) {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { pathToFileURL } = await import("node:url");
    const { addOpenNews, OPEN } = await import(pathToFileURL(join(t.ROOT, "tools", "open.mjs")).href);
    const item = JSON.parse(readFileSync(join(t.ROOT, "tools", "open-news.json"), "utf8"));
    const data = JSON.parse(readFileSync(join(t.ROOT, "news.json"), "utf8"));
    t.eq(OPEN.toISOString(), "2026-10-31T22:00:00.000Z", "開店の 時刻（日本時間 11/1 7:00）");
    t.eq(addOpenNews(data, item, new Date("2026-11-01T06:59:59+09:00")), null, "7じ まえに のる");
    const next = addOpenNews(data, item, new Date("2026-11-01T07:00:00+09:00"));
    t.ok(next && next.news[0].id === "2026-11-01-open" && next.news.length === data.news.length + 1, "7じ に のらない");
    t.eq(addOpenNews(next, item, new Date("2026-11-02T07:00:00+09:00")), null, "2 回め も のる");
    // news.json と おなじ きまり（id は かぶらない・url は https・title は 40 文字まで）
    t.ok(new Set(next.news.map((x) => x.id)).size === next.news.length, "id が かぶる");
    t.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date) && item.url.startsWith("https://") && [...item.title].length <= 40, `形が ちがう: ${JSON.stringify(item)}`);
    const yml = readFileSync(join(t.ROOT, ".github", "workflows", "open.yml"), "utf8");
    t.ok(yml.includes(`cron: "0 22 31 10 *"`) && yml.includes("node tools/open.mjs") && yml.includes("git tag v2.0"), "予約（open.yml）が ちがう");
  },

  async "ゲンさんの 一日：朝は 体操、昼は おべんとう（スズメ）、3じは おやつ、夕方は かたづけ、夜は うたたね"(t) {
    const cases = [
      [7, (s) => ["lUp", "lSide", "lDown"].includes(s(10).left) && s(10).say.includes("いち") && s(2).music, "ラジオ体操"],
      [12, (s) => s(30).bento && s(52).say.includes("からあげ") && s(52).thief != null, "おべんとう"],
      [15, (s) => s(30).taiyaki && s(30).say.includes("あんこ"), "おやつ"],
      [17, (s) => s(40).broom != null && s(40).box && s(40).say.includes("どうぐ"), "かたづけ"],
      [21, (s) => s(44).zz && s(44).closed && s(44).say.includes("Zzz"), "うたたね"],
      [3, (s) => s(44).zz, "まよなかも うたたね"],
      [10, (s) => ["rUp", "rHit"].includes(s(10).right), "ごぜんは しごと"],
    ];
    const { server, p } = await open(t, "?hour=14");
    for (const [h, check, label] of cases) {
      await p.goto(`${server.url}?hour=${h}&t=0`, 600);
      const ok = await p.ev(`(${check.toString()})((n) => factory.story(n))`);
      t.ok(ok, `${h} じ：${label}`);
    }
    await p.goto(`${server.url}?hour=21`, 800);
    await p.click("#oji-btn");
    t.ok((await said(p)).includes("あと 5ふん"), `うたたね中の ゲンさん: ${await said(p)}`);
    t.noErrors(p);
    await server.close();
  },

  async "図鑑から 会いに いく：地上の なかまは カメラが よる、地下の なかまは その 場所で こたえる"(t) {
    const { server, p } = await open(t, "?hour=14", { size: { width: 1440, height: 900 } });
    await t.sleep(600);
    t.eq(await p.ev(`document.querySelectorAll("#nakama .meet").length`), 14, "会いに いく ボタンの 数");
    const meet = (k) => p.ev(`document.querySelector('.meet[data-meet="${k}"]').click()`);
    await meet("gen");
    t.ok((await p.ev(`factory.tour()`)) && (await said(p)).startsWith("ゲンさん「"), `ゲンさんに よらない: ${await said(p)}`);
    await p.key("Escape");
    t.eq(await p.ev(`factory.tour()`), null, "Esc で もどらない");
    await meet("hakobi");
    t.ok((await said(p)).startsWith("ハコビ「"), `ハコビに よらない: ${await said(p)}`);
    await p.key("Escape");
    await meet("horimaru");
    t.ok((await p.ev(`document.getElementById("toast").textContent`)).includes("ホリマル"), "ホリマルが こたえない");
    await meet("worm");
    t.ok((await p.ev(`document.getElementById("toast").textContent`)).includes("ホタルミミズ"), "ホタルミミズの 場所へ いかない");
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

  async "フォント：つかう 文字が ぜんぶ はいっている。DotGothic16 は この サイトに、Press Start 2P は 表示を とめずに"(t) {
    const { readFileSync, existsSync } = await import("node:fs");
    const { createHash } = await import("node:crypto");
    const { join } = await import("node:path");
    const { pathToFileURL } = await import("node:url");
    const fonts = await import(pathToFileURL(join(t.ROOT, "tools", "fonts.mjs")).href);
    const have = fonts.linkedChars();
    t.ok(have, "fonts/chars.txt が ない");
    const missing = fonts.usedChars().filter((c) => !have?.has(c));
    t.eq(missing.join(""), "", "たりない 文字が ある（node tools/fonts.mjs を ながして）");

    const html = readFileSync(join(t.ROOT, "index.html"), "utf8");
    const css = readFileSync(join(t.ROOT, "style.css"), "utf8");
    const font = readFileSync(join(t.ROOT, "fonts", "dotgothic16.woff2"));
    t.eq(font.subarray(0, 4).toString(), "wOF2", "dotgothic16.woff2");
    // 住所の v は 中身の ハッシュ（ふるい フォントが のこらない ように）
    const v = createHash("sha256").update(font).digest("hex").slice(0, 8);
    t.ok(css.includes(`url("fonts/dotgothic16.woff2?v=${v}")`), "style.css の @font-face の 住所が いまの フォントと ちがう（node tools/fonts.mjs を ながして）");
    t.ok(!/rel="preload"[^>]*woff2/.test(html), "フォントの preload は つけない（表示が おそく なる）");
    t.ok(existsSync(join(t.ROOT, "fonts", "OFL-DotGothic16.txt")), "DotGothic16 の ライセンス（OFL）が ない");
    t.ok(!/family=DotGothic16/.test(html), "DotGothic16 を まだ Google から 読んでいる");
    t.ok(/<link id="font" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Press\+Start\+2P&amp;text=[^"]+" rel="stylesheet" media="print" onload="this\.media='all'">/.test(html), "Press Start 2P が 表示を とめている");
  },

  async "共有カード：og.png（1200×630）と、それを さす メタ情報。住所は warpix.app"(t) {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const png = readFileSync(join(t.ROOT, "og.png"));
    t.eq([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], "og.png の 大きさ");
    const html = readFileSync(join(t.ROOT, "index.html"), "utf8");
    t.ok(html.includes('<meta property="og:image" content="https://warpix.app/og.png">'), "og:image が ない");
    t.ok(html.includes('<meta property="og:url" content="https://warpix.app/">'), "og:url が ない");
    t.ok(html.includes('<link rel="canonical" href="https://warpix.app/">'), "canonical が ない");
    t.eq(readFileSync(join(t.ROOT, "CNAME"), "utf8").trim(), "warpix.app", "CNAME");
    t.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'), "twitter:card が ない");
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
