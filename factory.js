// ---------- WARPIX製作所：工場の 見取り図を うごかす ----------
// ドットの 絵を 描く、ピクセが 中庭を あるく、えんとつ・UFO・けいじばん（news.json）。
// ブラウザには なにも 保存しない。?hour=0〜23 で 時刻を ためせる。
const factory = (() => {
  const params = new URLSearchParams(location.search);
  const hour = params.has("hour") ? Number(params.get("hour")) % 24 : new Date().getHours();
  const night = hour >= 19 || hour < 6;
  const sleepy = hour < 5; // まよなかは ピクセも ねてる
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();
  const PALETTE = {
    o: color("--shadow"),
    w: color("--fg"),
    p: color("--accent"),
    c: color("--accent-2"),
    y: color("--gold"),
    v: color("--muted"),
    b: color("--btn"),
    h: color("--btn-hover"),
  };

  // ---------- ドットの 絵 ----------
  function draw(canvas, rows, scale = 1, flip = false) {
    const h = rows.length;
    const w = rows[0].length;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!PALETTE[ch]) return;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect((flip ? w - 1 - x : x) * scale, y * scale, scale, scale);
      })
    );
    return canvas;
  }
  const sprite = (rows, scale) => draw(document.createElement("canvas"), rows, scale);
  const overlay = (rows, top, layer) =>
    rows.map((row, y) => {
      const over = layer[y - top];
      return over ? [...row].map((ch, x) => (over[x] && over[x] !== "." ? over[x] : ch)).join("") : row;
    });

  // ピクセ（warpix-link と おなじ 16×16）に、製作所の ヘルメット
  const BODY = [
    ".......pp.......",
    ".......ww.......",
    ".......ww.......",
    ".....oooooo.....",
    "...oowwwwwwoo...",
    "..owwwwwwwwwwo..",
    ".owwwwwwwwwwwwo.",
    ".owwcowwwwcowwo.",
    ".owwoowwwwoowwo.",
    ".owppwwwwwwppwo.",
    ".owwwwwoowwwwwo.",
    ".owwwwwwwwwwwwo.",
    "..owwwwwwwwwwo..",
    "...oowwwwwwoo...",
    "....oo....oo....",
    "................",
  ];
  const HELMET = [
    "....oyyyyyyo....",
    "...oyywyyyyyo...",
    "..oyyyyyyyyyyo..",
    "oyyyyyyyyyyyyyyo",
  ];
  const CLOSED = { 7: ".owwwwwwwwwwwwo." }; // めを とじる（7 行目の 目を けす）
  const withEyes = (rows, closed) => rows.map((r, y) => (closed && CLOSED[y]) || r);
  const PIKUSE = overlay(BODY, 3, HELMET);
  const pikuseFrame = (closed) => withEyes(PIKUSE, closed);

  // ワープゲート（色が ぐるぐる まわる 3 コマ）
  const GATE = [
    "....cccc....",
    "..cc....cc..",
    ".c..pppp..c.",
    ".c.p....p.c.",
    "c.p..ww..p.c",
    "c.p.w..w.p.c",
    "c.p.w..w.p.c",
    "c.p..ww..p.c",
    ".c.p....p.c.",
    ".c..pppp..c.",
    "..cc....cc..",
    "....cccc....",
  ];
  const turn = (rows, map) => rows.map((r) => [...r].map((ch) => map[ch] ?? ch).join(""));
  const GATES = [GATE, turn(GATE, { c: "p", p: "w", w: "c" }), turn(GATE, { c: "w", p: "c", w: "p" })];

  const BED = [
    "............",
    ".p.p........",
    "ppppp.......",
    ".ppp........",
    "..p.........",
    "............",
    "w...........",
    "wcc.........",
    "wccppppppppw",
    "wwwwwwwwwwww",
    "w..........w",
    "w..........w",
  ];
  const DESK = [
    "............",
    "..wwwwwwww..",
    "..wccccccw..",
    "..wcwwcccw..",
    "..wccccccw..",
    "..wcccwwcw..",
    "..wwwwwwww..",
    ".....ww.....",
    "yyyyyyyyyyyy",
    "y..........y",
    "y..........y",
    "y..........y",
  ];
  const GOODS = {
    note: ["....yy..", "....yyy.", "....y.yy", "....y...", "..yyy...", ".yyyy...", ".yyy....", "........"],
    star: ["...yy...", "...yy...", "yyyyyyyy", ".yyyyyy.", "..yyyy..", ".yy..yy.", "yy....yy", "........"],
    heart: [".pp..pp.", "pppppppp", "pppppppp", "pppppppp", ".pppppp.", "..pppp..", "...pp...", "........"],
    gift: ["...pp...", "cccppccc", "cccppccc", "pppppppp", "cccppccc", "cccppccc", "cccppccc", "........"],
  };
  const UFO = ["....cccc....", "...cccccc...", ".wwwwwwwwww.", "wpwwpwwpwwpw", ".wwwwwwwwww.", "...w....w..."];

  // ---------- ピクセの ことば ----------
  const bubble = document.getElementById("bubble");
  let bubbleTimer = 0;
  function say(line, ms = 6000, narration = false) {
    bubble.textContent = narration ? line : `ピクセ「${line}」`;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => (bubble.textContent = ""), ms);
  }
  const greeting =
    sleepy ? null
    : hour < 11 ? "おはよう！ WARPIX製作所へ ようこそ。\nきょうも ドットを くみたてるよ。"
    : hour < 19 ? "こんにちは！ WARPIX製作所へ ようこそ。\nへやを おすと ワープできるよ。"
    : "こんばんは。やきんちゅうの WARPIX製作所へ ようこそ。\nあかりが ついてる へやを のぞいてみて。";
  const LINES = [
    "ここでは ドットを ひとつずつ くみたてて、\nせいひんに してるんだ。",
    "LINK工場は いま フルかどう！\nワープゲートが ぐるぐる まわってる。",
    "???工場は けんせつちゅう。\nなにが できるかは、まだ ひみつ。",
    "このヘルメット、にあう？\nあんぜん だいいち だからね。",
    "ベルトコンベアで ながれてるのは、\nできたての おんぷと ほしと ハート。",
    "けいじばんに、製作所だよりが はってあるよ。",
    "warpix-link には、ぼくの きょうだいみたいな\nピクセが いるんだ。あいに いってみて。",
    "えんとつ、おしてみた？",
  ];
  let lineIndex = Math.floor(Math.random() * LINES.length);
  const nextLine = () => LINES[lineIndex++ % LINES.length];

  // ---------- ピクセ（中庭を あるく） ----------
  const btn = document.getElementById("pikuse-btn");
  const canvas = btn.querySelector("canvas");
  let asleep = sleepy;
  let facingLeft = false;
  const render = (closed = false) => draw(canvas, pikuseFrame(closed || asleep), 4);
  render();
  btn.classList.toggle("asleep", asleep);

  // あるく：工場の とけい（tick）に あわせて、1 コマ 8px ずつ ちょこちょこ すすむ
  let target = null;
  let rest = 8; // つぎに あるきだすまでの コマ
  function walkTick() {
    if (asleep) return;
    const now = btn.offsetLeft;
    if (target == null) {
      if (--rest > 0) return;
      const yard = btn.parentElement.clientWidth;
      target = Math.round(((0.04 + Math.random() * 0.72) * (yard - 64)) / 4) * 4;
      facingLeft = target < now;
      btn.classList.toggle("left", facingLeft);
    }
    const next = now + Math.sign(target - now) * Math.min(8, Math.abs(target - now));
    btn.style.left = `${next}px`;
    btn.classList.toggle("step");
    if (next === target) {
      target = null;
      rest = 10 + Math.floor(Math.random() * 12);
      btn.classList.remove("step");
    }
  }

  btn.addEventListener("click", () => {
    if (asleep) {
      asleep = false;
      btn.classList.remove("asleep");
      render();
      say("……はっ！ ねてないよ。\nやきん してただけ。");
      return;
    }
    btn.classList.remove("hop");
    void btn.offsetWidth;
    btn.classList.add("hop");
    say(nextLine());
  });

  // ---------- へや ----------
  const SOON = {
    "soon-a": "ここは けんせつちゅう。\nトンテンカン……なにが できるかな？",
    "soon-b": "シャッターの むこうで、なにか つくってる。\nのぞいちゃ だめだよ？",
  };
  document.querySelectorAll(".room.soon").forEach((room) =>
    room.addEventListener("click", () => say(SOON[room.dataset.room]))
  );
  const machines = {
    gate: sprite(GATES[0], 4),
    bed: sprite(BED, 4),
    desk: sprite(DESK, 4),
  };
  document.querySelectorAll(".machine").forEach((m) => m.append(machines[m.dataset.sprite]));

  // ---------- のこぎり屋根 ----------
  const roof = document.querySelector(".roof");
  const roofCanvas = document.createElement("canvas");
  roof.append(roofCanvas);
  function drawRoof() {
    const W = Math.max(40, Math.floor(roof.clientWidth / 4));
    const H = 10;
    const teeth = Math.max(3, Math.round(W / 24));
    const P = W / teeth;
    roofCanvas.width = W;
    roofCanvas.height = H;
    const ctx = roofCanvas.getContext("2d");
    for (let x = 0; x < W; x++) {
      const t = x % P;
      const top = Math.min(H - 1, Math.floor((t / P) * H));
      ctx.fillStyle = PALETTE.h;
      ctx.fillRect(x, top, 1, H - top);
      ctx.fillStyle = PALETTE.w;
      ctx.fillRect(x, top, 1, 1);
      // たてに ならぶ まど（夜は あかりが つく）
      if (t < 2.5 && x > 0) {
        ctx.fillStyle = night ? PALETTE.y : PALETTE.c;
        ctx.fillRect(x, 2, 1, H - 4);
      }
    }
    ctx.fillStyle = PALETTE.w;
    ctx.fillRect(0, H - 1, W, 1);
  }
  drawRoof();
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawRoof, 150);
  });

  // ---------- ベルトコンベア（2 まわり ならべて、半分 うごいたら もとに もどる） ----------
  const goods = document.querySelector(".goods");
  const order = ["note", "star", "heart", "gift", "note", "heart", "star", "gift"];
  for (let i = 0; i < 2; i++) for (const id of [...order, ...order]) goods.append(sprite(GOODS[id], 2));
  let beltHalf = 0;
  let beltX = 0;

  // ---------- えんとつ ----------
  const chimney = document.querySelector(".chimney");
  let puffs = 0;
  let bigUntil = 0;
  chimney.addEventListener("click", () => {
    puffs++;
    bigUntil = Date.now() + 1400;
    chimney.classList.add("big");
    setTimeout(() => chimney.classList.remove("big"), 1400);
    say(puffs >= 10 ? "けほっ けほっ……\nもう けむりで まえが みえないよ！" : puffs >= 5 ? "ぽっぽー！ ぽっぽー！\nフルかどう！" : "ぽっぽー！\nきょうも げんきに かどうちゅう。");
  });

  // ---------- UFO（ときどき 屋根の うえを とおる） ----------
  const ufo = document.querySelector(".ufo");
  draw(ufo, UFO, 4);
  function flyUfo() {
    if (reduced || document.hidden) return;
    ufo.hidden = false;
    ufo.classList.remove("fly");
    void ufo.offsetWidth;
    ufo.classList.add("fly");
  }
  ufo.addEventListener("animationend", () => (ufo.hidden = true));
  ufo.addEventListener("click", () => say("あ、warpix-link の UFO だ！\nまた あそびに きたみたい。"));
  if (!reduced) setInterval(flyUfo, 45000 + Math.random() * 30000);

  // ---------- 製作所だより（news.json） ----------
  const list = document.getElementById("news-list");
  const latest = document.getElementById("board-latest");
  const today = new Date();
  const isNew = (date) => (today - new Date(date + "T00:00:00")) / 864e5 < 14;
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  async function loadNews() {
    let items;
    try {
      const res = await fetch("news.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      items = (await res.json()).news ?? [];
    } catch {
      latest.textContent = "おしらせを よめませんでした。";
      list.append(el("li", null, "おしらせを よめませんでした。あとで もういちど ひらいてみてね。"));
      return [];
    }
    items = items.filter((n) => n.date && n.title).sort((a, b) => b.date.localeCompare(a.date));
    list.replaceChildren(
      ...items.map((n) => {
        const li = el("li");
        const time = el("time", null, n.date.replaceAll("-", "."));
        time.dateTime = n.date;
        li.append(time);
        if (isNew(n.date)) li.append(el("span", "n-new", "NEW"));
        const title = n.url ? el("a", "n-title", n.title) : el("span", "n-title", n.title);
        if (n.url) title.href = n.url;
        li.append(title);
        if (n.body) li.append(el("p", "n-body", n.body));
        return li;
      })
    );
    if (!items.length) list.append(el("li", null, "まだ おしらせは ありません。"));
    latest.replaceChildren();
    if (items[0]) {
      if (isNew(items[0].date)) latest.append(el("span", "new", "NEW"));
      latest.append(items[0].title);
    } else latest.textContent = "まだ なにも はってない。";
    return items;
  }
  const newsReady = loadNews();

  // ---------- プロフィールの え ----------
  draw(document.querySelector(".portrait"), PIKUSE, 6);

  // ---------- 工場の とけい ----------
  // うごく ものは ぜんぶ この 1 つの とけいで いっしょに 1 コマ すすめる。
  // ばらばらに うごかすと 画面を なんども 描きなおして、電池を つかうから。
  const TICK = 300;
  const lamp = document.querySelector(".lamp");
  const puffEls = [...document.querySelectorAll(".smoke i")];
  let n = 0;
  function tick() {
    if (document.hidden) return;
    n++;
    draw(machines.gate, GATES[n % 3], 4);
    lamp.classList.toggle("off", n % 4 >= 2);
    // けむり：3 つが ずれて のぼる（えんとつを おした ときは はやい）
    const speed = Date.now() < bigUntil ? 3 : 1;
    puffEls.forEach((el, i) => {
      const phase = (n * speed + i * 4) % 12;
      el.style.translate = `${Math.floor(phase / 3) * 4}px ${-phase * 5}px`;
      el.style.scale = String(0.5 + phase / 12);
      el.style.opacity = String(0.9 - phase / 13);
    });
    // ベルトコンベア：2 まわり ならべて、半分 すすんだら もとに もどる
    beltHalf ||= goods.scrollWidth / 2;
    beltX = (beltX + 4) % beltHalf;
    goods.style.translate = `${beltX - beltHalf}px 0`;
    walkTick();
    if (!asleep && n % 11 === 0) render(true);
    else if (!asleep && n % 11 === 1) render(false);
    btn.classList.toggle("zz-off", n % 6 >= 3);
  }

  // ---------- はじまり ----------
  document.body.classList.toggle("night", night);
  if (greeting) say(greeting, 9000);
  else say("（ピクセは ねている。そっと おしたら、おきるかも）", 9000, true);
  if (!reduced) setInterval(tick, TICK);

  return { say, hour, night, newsReady, lines: LINES, pikuse: PIKUSE, isAsleep: () => asleep };
})();
