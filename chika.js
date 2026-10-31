// ---------- WARPIX製作所：地面の 下の 世界 ----------
// ページを 下へ スクロールする ほど、地中へ ふかく もぐっていく。
// 表土 → 粘土（化石・うまった 道具）→ 洞窟（水晶・地底湖）→ 古代文明 → 最深部（マグマ・ホタルミミズ）。
// 景色は 1 回だけ 描いて おき、工場の とけいで、見えている 生き物 だけを 描きなおす。
// パネルの まわりは 坑道の 木わくで ささえた「ほった 部屋」。生き物や 遺跡は パネルに かくれない すきまに おく。
// 生き物を おすと こたえる。地層ごとに 石板の かけらが 1 つ。5 つ あつめると 石の ピクセ像の 伝説が わかる。
const chika = (() => {
  const T = factory.tools;
  const { rect, dot, rows, disc, oval, line, seeded } = T;
  const wrap = document.querySelector(".underground");
  const canvas = wrap.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  let base = null; // うごかない 景色の 写し
  let movers = []; // うごく もの { x, y, w, h, draw(n) }
  let W = 0;
  let H = 0;
  let scale = 2;
  let top = 0;

  // ---------- 地層（上から じゅんに） ----------
  const LAYERS = [
    { y: 0, color: "#7b5236", dark: "#6a4630", light: "#94674a", depth: "10" }, // 表土
    { y: 0, color: "#9a6644", dark: "#855638", light: "#b07a55", depth: "120" }, // 粘土
    { y: 0, color: "#5e4a48", dark: "#4f3e3d", light: "#72605d", depth: "800" }, // 岩・洞窟
    { y: 0, color: "#3b3047", dark: "#30273b", light: "#4c3f5a", depth: "3000" }, // 古代文明
    { y: 0, color: "#2a2033", dark: "#211a29", light: "#3a2c40", depth: "????" }, // 最深部
    { y: 0, color: "#170f1f", dark: "#100a16", light: "#2a1d36", depth: "?????" }, // はじまりの 場所
  ];
  // 地層の さかいめは、パネルや 空洞の 場所に あわせて build() が きめる（LAYERS[i].y）
  const boundary = (i, x) => Math.round(LAYERS[i].y + (i ? 3 * Math.sin(x / 13 + i * 2) + 2 * Math.sin(x / 5 + i) : 0));
  const layerAt = (y) => {
    let k = 0;
    for (let i = 0; i < LAYERS.length; i++) if (y >= LAYERS[i].y) k = i;
    return k;
  };
  const Y = {}; // 目じるしの 高さ（空洞 など）
  const band = (i) => [LAYERS[i].y, i + 1 < LAYERS.length ? LAYERS[i + 1].y : H];

  // ---------- 小さな 文字（3×5 の 数字） ----------
  const GLYPH = {
    0: ["ooo", "o.o", "o.o", "o.o", "ooo"],
    1: [".o.", "oo.", ".o.", ".o.", "ooo"],
    2: ["ooo", "..o", "ooo", "o..", "ooo"],
    3: ["ooo", "..o", "ooo", "..o", "ooo"],
    8: ["ooo", "o.o", "ooo", "o.o", "ooo"],
    "?": ["ooo", "..o", ".oo", "...", ".o."],
    "-": ["...", "...", "ooo", "...", "..."],
    m: [".....", ".....", "oo.o.", "o.o.o", "o.o.o"],
  };
  function text(str, x, y, color) {
    for (const ch of str) {
      const gl = GLYPH[ch];
      rows(gl, x, y, { o: color });
      x += gl[0].length + 1;
    }
  }

  // ---------- 絵の 部品 ----------
  const FISH = ["....o.o.o.o....o", ".oooooooooooo.oo", "oo.o.o.o.o.o.ooo", ".oooooooooooo.oo", "....o.o.o.o....o"];
  const SKULL = ["...oooooo...", "..oooooooooo", ".ooo..oooooo", "oooo..ooooo.", "oooooooooo..", ".o.o.o.o....", "..........o.", ".o.o.o.oooo."];
  const CASSETTE = ["oooooooooooooo", "oWWWWWWWWWWWWo", "oWrrrrrrrrrrWo", "oWoooWWWWoooWo", "oWo.oWWWWo.oWo", "oWoooWWWWoooWo", "oWWWWWWWWWWWWo", "oWWWoooooWWWWo", "oooooooooooooo"];
  const CART = ["oooooooooo", "oGGGGGGGGo", "oGyyyyyyGo", "oGyccccyGo", "oGyccccyGo", "oGyyyyyyGo", "oGGGGGGGGo", "oGoGoGoGGo", "oGGGGGGGGo", ".oGGGGGGo.", ".oyyyyyyo.", "..oooooo.."];
  const TINBOT = ["..oooo...", "..oRRo...", ".oooooo..", ".oWcWco..", ".oWWWWo..", "ooooooooo", "oRRRRRRRo", "oRyRRRyRo", "ooooooooo", ".oo...oo.", ".oo...oo."];
  const OLD = { o: "#2b2f3a", W: "#9aa3ad", r: "#e0503c", G: "#8d8f96", y: "#d9b43a", c: "#5fa0c8", R: "#c75b3a" };
  const HORIMARU = [
    "...oooooo.....",
    "..obbbbbbo....",
    ".obbbbbbbbo...",
    "obbWWbbbbbboo.",
    "obbWobbbbbbmMo",
    "obbbbbbbbbbmmM",
    "obbpbbbbbbbmMo",
    ".obbbbbbbbboo.",
    "..oo.oo.oo....",
  ];
  const HORI = { o: "#2b2f3a", b: "#4fb3a5", W: "#ffffff", m: "#c0c7cf", M: "#7d8792", p: "#ff8fb8" };
  const JELLY = ["..ccccc..", ".cWWcccc.", "cWccccccc", "ccccccccc", "cCcCcCcCc"];
  const JELLY_LEGS = [[".c.c.c.c.", ".c.c.c.c.", "c.c.c.c.."], [".c.c.c.c.", "..c.c.c.c", ".c.c.c.c."]];
  const JEL = { c: "#7ff0ff", W: "#ffffff", C: "#3ac4e0" };
  const TOMOSHIBI = ["..ooo..", ".ohhho.", "ohhhhho", "ohyhyho", "ohhhhho", ".ohhho.", ".ohhho.", "ohhhhho", ".o...o."];
  const TOMO = { o: "#1c1626", h: "#6a4fa0", y: "#ffd84a" };
  const HORI_LINES = ["ホリマル「ほりほり……カセット みつけた！\nこれ、ぼくの たからもの。」", "ホリマル「ドリルは まいにち みがいてるよ。」", "ホリマル「もっと したに、ひかる まちが あるんだって。」"];
  const JELLY_LINE = "スイショウクラゲが ぱあっと ひかった。\nふわ〜ん（ほんのり つめたい）";
  const TOMO_LINES = ["トモシビ族「……ようこそ、ちじょうの ひと。\nここは ひかりの まち。」", "トモシビ族「石板の かけらを 5 つ あつめて、\nはじまりの 像に みせて ごらん。」"];
  const STONE = { o: "#3a3540", w: "#9a96a0", p: "#7f7a86", c: "#5ff0ff", y: "#b3aeb8" }; // 石の ピクセ像

  // ---------- 地下の なぞ（その場かぎり。ブラウザには 保存しない） ----------
  const FRAG = [".oooo...", "oSSSSo..", "oScSSSo.", "oSSScSSo", ".oSSSSSo", "..oSScSo", "...oooo."];
  const LEGEND = "『むかし、ちていの やみに、ドットの こびとが うまれた。\nこびとは トモシビ族に あかりの つくりかたを おしえ、\nやがて ひかりを もとめて、そらへ のぼっていった。\nいつか ちじょうで、ものを つくる ために。』";
  const found = new Set(); // みつけた 石板の かけら（地層の 番号）
  let legend = false;
  let openedAt = -1; // はじまりの とびらが ひらいた コマ
  let coreBtn = null;
  let hotspots = []; // { x, y, w, h, label, click, gone }
  let flashUntil = 0;
  let now = 0;
  const hot = (x, y, w, h, label, click, gone) => hotspots.push({ x, y, w, h, label, click, gone });
  // ことばは 画面の 下の まど（.toast）に。読み上げも する
  const toast = document.getElementById("toast");
  let toastTimer = 0;
  function say(text) {
    toast.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.textContent = ""), 4000 + text.length * 60);
  }

  // ---------- 置く 場所を さがす（パネルに かからない ところ） ----------
  let busy = [];
  const hits = (x, y, w, h, pad = 4) => busy.some((b) => x < b.x + b.w + pad && x + w + pad > b.x && y < b.y + b.h + pad && y + h + pad > b.y);
  function spot(w, h, [from, to], rnd, tries = 80) {
    const y0 = Math.round(from);
    const y1 = Math.round(to) - h;
    if (y1 <= y0 || w > W - 4) return null;
    for (let i = 0; i < tries; i++) {
      const x = 2 + Math.floor(rnd() * (W - w - 4));
      const y = y0 + Math.floor(rnd() * (y1 - y0));
      if (!hits(x, y, w, h)) {
        busy.push({ x, y, w, h });
        return { x, y };
      }
    }
    return null;
  }

  // ---------- 1 回だけ 描く 景色 ----------
  function paint() {
    const rnd = seeded(42);
    // 地層
    for (let x = 0; x < W; x++) {
      for (let i = 0; i < LAYERS.length; i++) {
        const y0 = Math.max(0, boundary(i, x));
        const y1 = i + 1 < LAYERS.length ? boundary(i + 1, x) : H;
        rect(x, y0, 1, y1 - y0, LAYERS[i].color);
        if (i) for (let k = 0; k < 2; k++) if ((x + k) % 2 === 0) dot(x, y0 - 1 - k * 2, LAYERS[i].color); // さかいめを まぜる
      }
    }
    // つぶつぶ・小石
    for (let i = 0; i < (W * H) / 90; i++) {
      const x = Math.floor(rnd() * W);
      const y = Math.floor(rnd() * H);
      const L = LAYERS[layerAt(y)];
      if (rnd() < 0.15) {
        oval(x, y, 2 + Math.floor(rnd() * 2), 1 + Math.floor(rnd() * 2), L.dark);
        dot(x - 1, y - 1, L.light);
      } else dot(x, y, rnd() < 0.5 ? L.dark : L.light);
    }
    // 最深部の マグマの すじ（ここは うごく ものと して あとで 描く）
    // 木の 根（いちばん 上）
    for (let i = 0; i < W / 14; i++) {
      let x = Math.floor(rnd() * W);
      let y = 0;
      const len = 10 + Math.floor(rnd() * 26);
      for (let k = 0; k < len; k++) {
        dot(x, y, k < len / 2 ? "#c9a27a" : "#b08a64");
        y++;
        if (rnd() < 0.35) x += rnd() < 0.5 ? -1 : 1;
        if (rnd() < 0.08) {
          let bx = x;
          for (let j = 0; j < 5; j++) dot((bx += 1), y + j, "#b08a64");
        }
      }
    }
    // パネルの まわりを ほって、坑道の 木わくで ささえる
    for (const b of busy) {
      const p = 6;
      rect(b.x - p, b.y - p, b.w + p * 2, b.h + p * 2, "rgba(20,12,10,0.45)");
      for (let x = b.x - p; x < b.x + b.w + p; x += 2) {
        if (rnd() < 0.5) dot(x, b.y - p - 1, "rgba(20,12,10,0.45)");
        if (rnd() < 0.5) dot(x, b.y + b.h + p, "rgba(20,12,10,0.45)");
      }
      if (b.h > 40) {
        for (const x of [b.x - p, b.x + b.w + p - 3]) {
          rect(x, b.y - p, 3, b.h + p * 2, "#8a5a32");
          rect(x + 2, b.y - p, 1, b.h + p * 2, "#6b4424");
        }
        rect(b.x - p, b.y - p, b.w + p * 2, 3, "#8a5a32");
        rect(b.x - p, b.y - p + 2, b.w + p * 2, 1, "#6b4424");
      }
    }
    busy = busy.map((b) => ({ x: b.x - 7, y: b.y - 7, w: b.w + 14, h: b.h + 14 }));
    // 深さの めもり（左の すきまが ひろい とき）
    LAYERS.forEach((L, i) => {
      const y = Math.round(L.y) + 6;
      const label = `-${L.depth}m`;
      const w = label.length * 4 + 2;
      if (!hits(1, y - 1, w + 2, 8, 1)) {
        rect(1, y - 1, w + 1, 8, "rgba(0,0,0,0.35)");
        text(label, 2, y + 1, i < 2 ? "#ffe9c8" : "#9fe3ff");
        busy.push({ x: 1, y: y - 1, w: w + 1, h: 8 }); // めもりの うえには なにも おかない
      }
    });

    // ===== 表土：工場から おりてくる パイプ =====
    for (let i = 0; i < 2; i++) {
      const len = Math.round(LAYERS[1].y * 0.8);
      const s = spot(6, len, [0, LAYERS[1].y], rnd, 30);
      if (!s) continue;
      rect(s.x, 0, 4, s.y + len, "#8d99a6");
      rect(s.x + 3, 0, 1, s.y + len, "#5f6b78");
      for (let y = 8; y < s.y + len; y += 18) rect(s.x - 1, y, 6, 2, "#5f6b78");
      rect(s.x - 2, s.y + len - 2, 8, 3, "#e0503c");
    }
    // ブリキの ロボット（うまっている）
    put(TINBOT, OLD, band(0), rnd);
    // ===== 粘土：化石と うまった 道具 =====
    for (let i = 0; i < 2; i++) ammonite(rnd);
    put(FISH, { o: "#e8dcc0" }, band(1), rnd);
    put(SKULL, { o: "#e8dcc0" }, band(1), rnd);
    put(CASSETTE, OLD, band(1), rnd);
    put(CART, OLD, band(1), rnd);
    // ===== 洞窟：つらら・水晶・きのこ =====
    for (let x = 0; x < W; x += 3 + Math.floor(rnd() * 5)) {
      const y = boundary(2, x) + 1;
      const len = 2 + Math.floor(rnd() * 6);
      if (hits(x, y, 3, len, 0)) continue;
      for (let k = 0; k < len; k++) rect(x + (k > len / 2 ? 1 : 0), y + k, k > len / 2 ? 1 : 3 - Math.floor((k * 2) / len), 1, "#72605d");
    }
    for (let i = 0; i < 8; i++) crystal(rnd, [LAYERS[2].y, LAYERS[4].y]);
    for (let i = 0; i < 4; i++) mushrooms(rnd);
    // ===== 古代文明：岩の 町・神殿・石の ピクセ像 =====
    for (let i = 0; i < 2; i++) houses(rnd);
    temple(rnd);
    const st = spot(18, 22, band(3), rnd) ?? spot(18, 22, [Y.deepTop, Y.deepBottom], rnd);
    if (st) {
      rect(st.x, st.y + 16, 18, 6, "#56505e");
      rect(st.x, st.y + 16, 18, 1, "#76707e");
      rows(T.PIKUSE, st.x + 1, st.y, STONE);
      dot(st.x + 4, st.y + 6, "#5f9a5a"); // こけ
      dot(st.x + 12, st.y + 12, "#5f9a5a");
      movers.push({ x: st.x, y: st.y - 4, w: 18, h: 12, draw: (n) => {
        const on = legend || n % 20 < 3; // ときどき 目が 光る（伝説が わかったら ずっと）
        dot(st.x + 5, st.y + 7, on ? "#5ff0ff" : STONE.w);
        dot(st.x + 11, st.y + 7, on ? "#5ff0ff" : STONE.w);
        if (legend && n % 4 < 2) for (const [dx, dy] of [[1, -2], [16, 0], [8, -4]]) dot(st.x + dx, st.y + dy, "#bff8ff");
      } });
      hot(st.x, st.y, 18, 22, "石の ピクセ像", () =>
        legend ? say(LEGEND) : say(`石の ピクセ像。足もとに「はじまりの……」と ほってある。\nのこりは けずれて よめない。（石板の かけら ${found.size}／5）`)
      );
    }
    for (let i = 0; i < 2; i++) gear(rnd);
    // ===== 最深部：ホタルミミズの トンネル と マグマ =====
    const ty = Math.round(LAYERS[4].y + 16);
    rect(0, ty, W, 9, "#140f1a");
    rect(0, ty + 9, W, 1, "#3a2c40");
    for (let x = 0; x < W; x += 8) dot(x, ty + 8, "#4c3f5a");
    movers.push({ x: 0, y: ty, w: W, h: 9, draw: (n) => worm(n, ty) });
    const my = Math.round(Y.deepBottom + (Y.coreTop - Y.deepBottom) * 0.5);
    movers.push({ x: 0, y: my - 4, w: W, h: 10, draw: (n) => magma(n, my) });
    core(rnd);

    // ===== うごく 生き物 =====
    // ミミズ
    for (let i = 0; i < 2; i++) {
      const s = spot(14, 6, band(0), rnd);
      if (!s) continue;
      movers.push({ x: s.x, y: s.y, w: 14, h: 6, draw: (n) => earthworm(n + i * 3, s.x, s.y) });
      hot(s.x, s.y, 14, 6, "ミミズ", () => say("にょろにょろ。\n（ミミズは 土を ふかふかに する はたらきもの）"));
    }
    // ホリマル（ドリルで ほる）
    const h1 = spot(22, 10, band(1), rnd);
    if (h1) {
      rect(h1.x, h1.y + 1, 22, 8, "rgba(20,12,10,0.45)");
      movers.push({ x: h1.x, y: h1.y, w: 22, h: 10, draw: (n) => {
        const x = h1.x + (n % 16 < 8 ? 0 : 1);
        rows(HORIMARU, x, h1.y, n % 2 ? HORI : { ...HORI, m: HORI.M, M: HORI.m });
        if (n % 3 !== 0) for (const [dx, dy] of [[15, 2], [17, 5], [16, 7]]) dot(x + dx + (n % 2), h1.y + dy, "#c99a6a");
      } });
      let k = 0;
      hot(h1.x, h1.y, 22, 10, "ホリマル", () => say(HORI_LINES[k++ % HORI_LINES.length]));
    }
    // 地底湖と 滝と スイショウクラゲ
    const lake = spot(46, 36, [Y.caveTop, Y.caveBottom], rnd);
    if (lake) {
      const py = lake.y + 26; // 水面
      oval(lake.x + 23, py + 2, 23, 8, "#1a3a4e");
      rect(lake.x, py, 47, 10, "#1a3a4e");
      oval(lake.x + 23, py + 2, 21, 6, "#20506a");
      rect(lake.x + 2, py, 43, 1, "#5fb8d8");
      rect(lake.x + 34, lake.y, 6, 3, "#72605d"); // 滝の 出口
      movers.push({ x: lake.x, y: lake.y, w: 47, h: 30, draw: (n) => {
        // 滝
        for (let y = lake.y + 3; y < py; y++) rect(lake.x + 35, y, 4, 1, (y + n) % 4 < 2 ? "#9fe3ff" : "#5fb8d8");
        for (const dx of [-2, 4, 6]) dot(lake.x + 35 + dx, py - 1 - ((n + dx) % 3), "#bff8ff");
        // クラゲ
        const bright = n < flashUntil;
        for (const [k, dx] of [[0, 6], [5, 20]]) {
          const yy = lake.y + 10 + (Math.floor((n + k) / 4) % 3);
          if (bright) disc(lake.x + dx + 4, yy + 3, 6, "rgba(127,240,255,0.35)");
          rows(JELLY, lake.x + dx, yy, bright ? { ...JEL, c: "#ffffff", C: "#7ff0ff" } : JEL);
          rows(JELLY_LEGS[(n + k) % 2], lake.x + dx, yy + 5, JEL);
        }
      } });
      hot(lake.x, lake.y + 8, 32, 20, "スイショウクラゲ", () => {
        flashUntil = now + 8;
        say(JELLY_LINE);
      });
    }
    // 空洞の 大きな 水晶
    for (let i = 0; i < 3; i++) bigCrystal(rnd, [Y.caveTop, Y.caveBottom]);
    // 石筍（下から はえる）
    for (let x = 0; x < W; x += 4 + Math.floor(rnd() * 6)) {
      const len = 2 + Math.floor(rnd() * 7);
      const y = Math.round(Y.caveBottom) - 1;
      if (hits(x, y - len, 3, len, 0)) continue;
      for (let k = 0; k < len; k++) rect(x + (k < len / 2 ? 0 : 1), y - k, k < len / 2 ? 3 : 1, 1, "#72605d");
    }
    // トモシビ族（ランタンを もって あるく）
    for (let i = 0; i < 2; i++) {
      const s = spot(30, 12, band(3), rnd);
      if (!s) continue;
      rect(s.x, s.y + 10, 30, 2, "#56505e"); // 岩の だん
      movers.push({ x: s.x, y: s.y - 2, w: 30, h: 12, draw: (n) => {
        const t = (n + i * 11) % 44;
        const x = s.x + 1 + (t < 22 ? t : 44 - t);
        const flip = t >= 22;
        disc(x + (flip ? 0 : 8), s.y + 3, 3, "rgba(255,200,90,0.25)");
        rows(TOMOSHIBI, x + (flip ? 2 : 0), s.y + 1 - (n % 2), TOMO, flip);
        const lx = flip ? x : x + 8;
        dot(lx, s.y + 1, "#1c1626");
        rect(lx - 1, s.y + 2, 3, 3, n % 3 ? "#ffb347" : "#ffd84a");
      } });
      hot(s.x, s.y - 2, 30, 12, "トモシビ族", () =>
        say(TOMO_LINES[i])
      );
    }
    // ===== 石板の かけら（地層ごとに 1 つ。パネルに かくれない ところ、なければ 空洞へ） =====
    LAYERS.slice(0, 5).forEach((L, i) => {
      const s = spot(8, 7, band(i), rnd) ?? spot(8, 7, [Y.caveTop, Y.caveBottom], rnd) ?? spot(8, 7, [Y.deepTop, Y.deepBottom], rnd);
      if (!s) return;
      movers.push({ x: s.x - 1, y: s.y - 2, w: 10, h: 9, draw: (n) => {
        if (found.has(i)) return;
        rows(FRAG, s.x, s.y, { o: "#2a2033", S: "#8a8494", c: n % 6 < 3 ? "#5ff0ff" : "#2aa9c4" });
        if ((n + i * 5) % 14 < 2) dot(s.x + 6, s.y - 1, "#ffffff");
      } });
      hot(s.x - 1, s.y - 1, 10, 9, `石板の かけら（${L.depth === "????" ? "最深部" : `ちか ${L.depth}m`}）`, (btn) => {
        found.add(i);
        btn.hidden = true;
        step(now, true);
        if (found.size < 5) say(`石板の かけらを みつけた！（${found.size}／5）`);
        else {
          legend = true;
          openedAt = now;
          say(`石板の かけらが 5 つ そろった！\n${LEGEND}\n……どこか ふかい ところで、おもい とびらが ひらく 音が した。`);
          coreBtn?.setAttribute("aria-label", "ドットの 核（はじまりの 場所）");
          document.dispatchEvent(new CustomEvent("warpix:legend"));
        }
      }, () => found.has(i));
    });
  }

  // ===== はじまりの 場所（いちばん 下の さらに 下） =====
  // ふだんは 石の とびらで とじている。伝説が わかると とびらが ひらき、
  // ドットの 海と、脈うつ「ドットの 核」と、うまれたての ちびピクセたちが 見える
  const BABY = ["...pp...", "...ww...", "..oooo..", ".owwwwo.", "owcwwcwo", "owpwwpwo", ".owwwwo.", "..o..o.."];
  function core(rnd) {
    const cx = Math.round(W / 2);
    const cy = Math.round((Y.coreTop + Y.coreBottom) / 2);
    const a = Math.min(Math.round(W / 2) - 6, 96);
    const b = Math.max(20, Math.round((Y.coreBottom - Y.coreTop) / 2) - 8);
    // 部屋の ふち（ごつごつした 岩）
    oval(cx, cy, a + 4, b + 4, "#2a1d36");
    for (let i = 0; i < 40; i++) {
      const t = (i / 40) * Math.PI * 2;
      disc(cx + Math.round(Math.cos(t) * (a + 3)), cy + Math.round(Math.sin(t) * (b + 3)), 1 + Math.floor(rnd() * 2), "#3a2a48");
    }
    oval(cx, cy, a, b, "#0b0712");
    const dots = Array.from({ length: Math.round(a * 1.4) }, (_, i) => ({ x: Math.round((rnd() - 0.5) * a * 1.6), y: Math.round(rnd() * b * 2), v: 0.3 + rnd() * 0.5, c: i % 4 }));
    const babies = [[-a * 0.6, 0.2], [a * 0.55, 0.5], [-a * 0.3, 0.75], [a * 0.3, 0.05], [-a * 0.8, 0.6], [a * 0.75, 0.9]];
    const box = { x: cx - a - 1, y: cy - b - 1, w: a * 2 + 3, h: b * 2 + 3 };
    movers.push({ ...box, draw: (n) => {
      const open = openedAt < 0 ? 0 : Math.min(1, (n - openedAt) / 10); // 10 コマで ひらく
      // ドットの 海（下から 上へ のぼっていく）
      const COLORS = ["#ff8fb8", "#3ee8ff", "#ffd84a", "#ffffff"];
      for (const d of dots) {
        const y = cy + b - ((d.y + n * d.v) % (b * 2));
        const half = a * Math.sqrt(Math.max(0, 1 - ((y - cy) / b) ** 2)) - 2;
        if (Math.abs(d.x) > half) continue;
        dot(cx + d.x + Math.round(Math.sin((n + d.y) / 6)), Math.round(y), COLORS[d.c]);
      }
      // ドットの 核（ひし形が 脈うつ。まわりに 光の わ）
      const r = Math.min(16, b - 6) + (n % 4 < 2 ? 1 : 0);
      disc(cx, cy, r + 10, "rgba(62,232,255,0.07)");
      disc(cx, cy, r + 5, "rgba(255,143,184,0.10)");
      for (let k = r; k > 0; k -= 3) {
        const c = ["#3ee8ff", "#ff8fb8", "#ffd84a", "#ffffff"][(Math.floor(k / 3) + n) % 4];
        for (let y = -k; y <= k; y++) rect(cx - (k - Math.abs(y)), cy + y, (k - Math.abs(y)) * 2 + 1, 1, c);
      }
      // うまれたての ちびピクセ（ぷかぷか のぼる）
      babies.forEach(([dx, ph], i) => {
        const y = cy + b - 10 - (((ph * b * 2 + n * 0.6) | 0) % (b * 2 - 12));
        rows(BABY, Math.round(cx + dx - 4), Math.round(y + Math.sin((n + i * 7) / 4)), T.PIKU);
      });
      // 石の とびら（ひらく ときは 左右に すべる）
      if (open < 1) {
        const slide = Math.round(open * a);
        for (const side of [-1, 1]) {
          const x0 = side < 0 ? cx - a - slide : cx + slide;
          g2(() => {
            rect(x0, cy - b, a, b * 2 + 1, "#4a3d58");
            for (let y = cy - b + 4; y < cy + b; y += 8) rect(x0, y, a, 1, "#3a2f47");
            rect(side < 0 ? x0 + a - 2 : x0, cy - b, 2, b * 2 + 1, "#2a2033");
            // 石板と おなじ もよう（光る 古代文字）
            const gx = side < 0 ? x0 + a - 14 : x0 + 6;
            rows(FRAG, gx, cy - 4, { o: "#2a2033", S: "#6a5d78", c: n % 6 < 3 ? "#5ff0ff" : "#2aa9c4" });
          }, box);
        }
      }
    } });
    coreHot = { x: cx - a, y: cy - b, w: a * 2, h: b * 2 };
    hot(coreHot.x, coreHot.y, coreHot.w, coreHot.h, legend ? "ドットの 核（はじまりの 場所）" : "はじまりの とびら", (btn) => {
      coreBtn = btn;
      if (!legend) return say(`おもい 石の とびら。石板と おなじ もようが ほってある。\n（石板の かけら ${found.size}／5）`);
      const LINES = ["ドットの 核。ぽかぽか あたたかい。\nピクセ族は、ここで うまれたのかも しれない。", "ちびピクセ「ぴ！」\n（うまれたての ちびピクセが、うえへ のぼっていった）", "ドットの 海が、ピンク・水色・黄色に ひかっている。\nどこかで 見た 色……"];
      say(LINES[coreIndex++ % LINES.length]);
    });
  }
  let coreHot = null;
  let coreIndex = 0;
  // 部屋の 楕円の なかだけに 描く（とびらが 部屋から はみださない）
  function g2(draw, box) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2, box.w / 2 - 1, box.h / 2 - 1, 0, 0, Math.PI * 2);
    ctx.clip();
    draw();
    ctx.restore();
  }

  function put(art, map, range, rnd) {
    const s = spot(art[0].length, art.length, range, rnd);
    if (s) rows(art, s.x, s.y, map);
  }
  function ammonite(rnd) {
    const s = spot(11, 11, band(1), rnd);
    if (!s) return;
    const cx = s.x + 5;
    const cy = s.y + 5;
    disc(cx, cy, 5, "#e8dcc0");
    disc(cx, cy, 4, "#c9b893");
    disc(cx + 1, cy, 3, "#e8dcc0");
    disc(cx + 1, cy, 2, "#c9b893");
    dot(cx + 1, cy, "#e8dcc0");
  }
  function crystal(rnd, range) {
    const s = spot(12, 12, range, rnd);
    if (!s) return;
    const colors = [["#5ff0ff", "#bff8ff", "#2aa9c4"], ["#ff8fd0", "#ffd0ec", "#c4508f"], ["#ffe066", "#fff4b8", "#c99a1a"]];
    const [c, hi, dk] = colors[Math.floor(rnd() * 3)];
    for (const [dx, hgt] of [[2, 8], [5, 11], [8, 7]]) {
      for (let k = 0; k < hgt; k++) {
        const w = k < 2 ? 1 : 2;
        rect(s.x + dx + (k < 2 ? 1 : 0), s.y + 12 - hgt + k, w, 1, k % 3 ? c : hi);
      }
      dot(s.x + dx + 1, s.y + 12 - 1, dk);
    }
    movers.push({ x: s.x, y: s.y, w: 12, h: 12, draw: (n) => {
      if ((n + s.x) % 9 < 2) {
        dot(s.x + 6, s.y + 1, "#ffffff");
        dot(s.x + 5, s.y + 2, "#ffffff");
        dot(s.x + 7, s.y + 2, "#ffffff");
      }
    } });
  }
  function bigCrystal(rnd, range) {
    const s = spot(22, 26, range, rnd);
    if (!s) return;
    const sets = [["#5ff0ff", "#bff8ff", "#2aa9c4"], ["#ff8fd0", "#ffd0ec", "#c4508f"], ["#b48cff", "#e2d4ff", "#7a52c8"]];
    const [c, hi, dk] = sets[Math.floor(rnd() * 3)];
    disc(s.x + 11, s.y + 18, 9, "rgba(160,240,255,0.10)");
    for (const [dx, hgt, w] of [[3, 14, 3], [8, 24, 5], [14, 18, 4], [18, 10, 3]]) {
      for (let k = 0; k < hgt; k++) {
        const ww = k < 3 ? Math.max(1, w - 3 + k) : w;
        rect(s.x + dx + Math.floor((w - ww) / 2), s.y + 26 - hgt + k, ww, 1, c);
        dot(s.x + dx + Math.floor((w - ww) / 2), s.y + 26 - hgt + k, hi);
        dot(s.x + dx + Math.floor((w - ww) / 2) + ww - 1, s.y + 26 - hgt + k, dk);
      }
    }
    movers.push({ x: s.x, y: s.y, w: 22, h: 26, draw: (n) => {
      const k = (n + s.x) % 12;
      if (k < 3) {
        const x = s.x + 10;
        const y = s.y + 2 + k * 6;
        dot(x, y, "#ffffff");
        dot(x - 1, y + 1, "#ffffff");
        dot(x + 1, y + 1, "#ffffff");
        dot(x, y + 2, "#ffffff");
      }
    } });
  }
  function mushrooms(rnd) {
    const s = spot(12, 9, [LAYERS[2].y, LAYERS[4].y], rnd);
    if (!s) return;
    const glow = rnd() < 0.5 ? ["#6affc8", "#b8ffe6"] : ["#8fb8ff", "#d0e2ff"];
    for (const [dx, hh] of [[1, 5], [6, 7]]) {
      rect(s.x + dx + 2, s.y + 9 - hh + 2, 1, hh - 2, "#e8e0d0");
      oval(s.x + dx + 2, s.y + 9 - hh + 1, 2, 1, glow[0]);
      dot(s.x + dx + 1, s.y + 9 - hh + 1, glow[1]);
    }
    movers.push({ x: s.x, y: s.y - 6, w: 12, h: 6, draw: (n) => {
      const ph = (n + s.y) % 12;
      if (ph < 6) dot(s.x + 4 + (ph % 2), s.y - ph, glow[1]);
    } });
  }
  function houses(rnd) {
    const s = spot(44, 26, band(3), rnd);
    if (!s) return;
    rect(s.x, s.y + 4, 44, 22, "#4c3f5a");
    rect(s.x + 2, s.y, 40, 4, "#56495f");
    for (let x = s.x; x < s.x + 44; x += 4) dot(x, s.y + 3, "#3b3047");
    const wins = [];
    for (const [dx, dy] of [[4, 8], [14, 8], [24, 6], [34, 9], [8, 16], [28, 16], [18, 17]]) {
      rect(s.x + dx - 1, s.y + dy - 1, 6, 6, "#2a2033");
      oval(s.x + dx + 1, s.y + dy, 2, 1, "#2a2033");
      wins.push([s.x + dx, s.y + dy]);
    }
    rect(s.x + 38, s.y + 20, 6, 6, "#2a2033"); // かいだん
    rect(s.x + 40, s.y + 22, 4, 2, "#56495f");
    movers.push({ x: s.x, y: s.y, w: 44, h: 26, draw: (n) => {
      wins.forEach(([x, y], k) => {
        const on = (n * 7 + k * 13) % 23 > 4;
        rect(x, y, 4, 4, on ? "#ffcf6a" : "#8a6a3a");
        if (on) dot(x, y, "#fff0b8");
      });
    } });
  }
  function temple(rnd) {
    const s = spot(54, 32, band(3), rnd);
    if (!s) return;
    for (let i = 0; i < 5; i++) rect(s.x + i * 5, s.y + 8 + i * 5, 54 - i * 10, 5, i % 2 ? "#5a4d66" : "#655873");
    // まんなかの とびら と 古代文字
    rect(s.x + 22, s.y + 18, 10, 14, "#1c1626");
    for (const y of [12, 18, 24]) for (const x of [6, 44]) rect(s.x + x, s.y + y + 2, 4, 1, "#2aa9c4");
    movers.push({ x: s.x + 18, y: s.y, w: 18, h: 18, draw: (n) => {
      // 光る 目
      const lit = n % 8 < 5;
      oval(s.x + 27, s.y + 4, 6, 3, "#1c1626");
      oval(s.x + 27, s.y + 4, 5, 2, lit ? "#5ff0ff" : "#2aa9c4");
      disc(s.x + 27, s.y + 4, 1, "#1c1626");
      rect(s.x + 26, s.y + 9, 2, 9, lit ? "#5ff0ff" : "#2aa9c4");
    } });
    hot(s.x + 10, s.y, 34, 32, "ひかる 目の 神殿", () =>
      say(legend ? "神殿の 目が、やさしく まばたきした。" : "神殿の 目が、じっと こっちを 見ている……\n古代文字は まだ よめない。")
    );
  }
  function gear(rnd) {
    const s = spot(19, 19, band(3), rnd);
    if (!s) return;
    const cx = s.x + 9;
    const cy = s.y + 9;
    movers.push({ x: s.x, y: s.y, w: 19, h: 19, draw: (n) => {
      const off = (Math.floor(n / 2) % 2) * (Math.PI / 8);
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + off;
        rect(cx + Math.round(Math.cos(a) * 8) - 1, cy + Math.round(Math.sin(a) * 8) - 1, 3, 3, "#a8763a");
      }
      disc(cx, cy, 7, "#c8923f");
      disc(cx, cy, 5, "#a8763a");
      disc(cx, cy, 2, "#2a2033");
    } });
  }
  function earthworm(n, x, y) {
    for (let k = 0; k < 6; k++) {
      const yy = y + 2 + Math.round(1.5 * Math.sin((n + k) * 0.9));
      rect(x + 1 + k * 2, yy, 2, 2, k === 5 ? "#e88aa0" : "#d9788f");
    }
  }
  // ホタルミミズ（地底の でんしゃ。トモシビ族が のっている）
  function worm(n, ty) {
    const len = 9;
    const head = ((n * 3) % (W + len * 6 + 40)) - len * 6;
    for (let k = 0; k < len; k++) {
      const x = head - k * 6;
      if (x < -6 || x > W) continue;
      const y = ty + 2 + ((n + k) % 2);
      rect(x, y, 6, 5, "#7fc23f");
      rect(x, y, 6, 1, "#c8ff6a");
      dot(x + 2, y + 2, n % 2 ? "#f4ffb0" : "#c8ff6a");
      if (k > 0 && k % 3 === 0) rows(["ohho", "hyyh"], x + 1, y - 2, TOMO);
    }
    if (head >= 0 && head < W) {
      rect(head + 6, ty + 2, 3, 5, "#7fc23f");
      dot(head + 7, ty + 3, "#1c1626");
      disc(head + 10, ty + 4, 1, "rgba(200,255,106,0.5)");
    }
  }
  function magma(n, my) {
    for (let x = 0; x < W; x++) {
      const y = my + Math.round(2 * Math.sin(x / 9) + Math.sin(x / 4 + n * 0.3));
      const hot = (x + n * 2) % 24 < 12;
      dot(x, y, hot ? "#ff7a3a" : "#c8442a");
      if ((x * 7) % 11 === 0) dot(x, y + 2 + ((x + n) % 3), hot ? "#ffb347" : "#ff7a3a");
    }
  }

  // ---------- 大きさを あわせて 描きなおす ----------
  function build() {
    scale = T.scale();
    top = Math.round(T.heroBottom());
    const cssH = document.documentElement.scrollHeight - top;
    wrap.style.top = `${top}px`;
    wrap.style.height = `${cssH}px`;
    W = Math.ceil(wrap.clientWidth / scale);
    H = Math.ceil(cssH / scale);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    const left = (wrap.clientWidth - W * scale) / 2;
    // パネルや けいじばんの 場所（地下の 絵の 目もりで）
    busy = [...document.querySelectorAll(".panel, .guide, .board, footer")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.floor((r.left - left) / scale),
        y: Math.floor((r.top + scrollY - top) / scale),
        w: Math.ceil(r.width / scale),
        h: Math.ceil(r.height / scale),
      };
    });
    // 地層の さかいめを、パネルと 空洞に あわせる
    const yOf = (sel, edge) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return ((edge === "bottom" ? r.bottom : r.top) + scrollY - top) / scale;
    };
    Y.colsTop = yOf(".cols", "top");
    Y.colsBottom = yOf(".cols", "bottom");
    Y.caveTop = yOf("#hollow-cave", "top");
    Y.caveBottom = yOf("#hollow-cave", "bottom");
    Y.nakamaTop = yOf("#nakama", "top");
    Y.nakamaBottom = yOf("#nakama", "bottom");
    Y.deepTop = yOf("#hollow-deep", "top");
    Y.deepBottom = yOf("#hollow-deep", "bottom");
    Y.coreTop = yOf("#hollow-core", "top");
    Y.coreBottom = yOf("#hollow-core", "bottom");
    LAYERS[0].y = 0;
    LAYERS[1].y = Y.colsTop + (Y.colsBottom - Y.colsTop) * 0.35;
    LAYERS[2].y = Y.caveTop - 10;
    LAYERS[3].y = Math.min(Y.deepTop - 10, Y.nakamaTop + (Y.nakamaBottom - Y.nakamaTop) * 0.6);
    LAYERS[4].y = Y.deepTop + (Y.deepBottom - Y.deepTop) * 0.62;
    LAYERS[5].y = Y.coreTop - 8;
    movers = [];
    hotspots = [];
    T.use(ctx);
    paint();
    base = T.paper(() => {}, W, H);
    base.getContext("2d").drawImage(canvas, 0, 0);
    for (const m of movers) {
      T.use(ctx);
      m.draw(now);
    }
    // おせる ところ（すきとおった ボタンを 絵に かさねる）
    wrap.querySelectorAll(".ug-hot").forEach((b) => b.remove());
    for (const h of hotspots) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ug-hot";
      b.setAttribute("aria-label", h.label);
      b.style.left = `${h.x * scale + left}px`;
      b.style.top = `${h.y * scale}px`;
      b.style.width = `${h.w * scale}px`;
      b.style.height = `${h.h * scale}px`;
      b.hidden = h.gone?.() ?? false;
      b.addEventListener("click", () => h.click(b));
      wrap.append(b);
    }
    coreBtn = [...wrap.querySelectorAll(".ug-hot")].find((b) => /^(はじまりの とびら|ドットの 核)/.test(b.getAttribute("aria-label"))) ?? null;
  }

  // 見えている うごく もの だけ、景色を もどしてから 1 コマ 描く（all なら ぜんぶ）
  function step(n, all = false) {
    if (!base) return;
    now = n;
    const y0 = (scrollY - top) / scale - 20;
    const y1 = y0 + innerHeight / scale + 40;
    T.use(ctx);
    for (const m of movers) {
      if (!all && (m.y + m.h < y0 || m.y > y1)) continue;
      ctx.drawImage(base, m.x, m.y, m.w, m.h, m.x, m.y, m.w, m.h);
      m.draw(n);
    }
  }

  // ---------- なかま図鑑の え ----------
  const ZUKAN = {
    horimaru: [HORIMARU, HORI],
    jelly: [[...JELLY, ...JELLY_LEGS[0]], JEL],
    tomoshibi: [TOMOSHIBI, TOMO],
  };
  for (const c of document.querySelectorAll("canvas[data-sprite]")) {
    const name = c.dataset.sprite;
    const s = Number(c.dataset.scale || 3);
    if (ZUKAN[name]) T.drawOn(c, ZUKAN[name][0], s, ZUKAN[name][1]);
    if (name === "worm") {
      const src = T.paper(() => {
        for (let k = 0; k < 5; k++) {
          rect(3 + k * 6, 3 + (k % 2), 6, 5, "#7fc23f");
          rect(3 + k * 6, 3 + (k % 2), 6, 1, "#c8ff6a");
          dot(5 + k * 6, 5 + (k % 2), "#f4ffb0");
        }
        rows(["ohho", "hyyh"], 10, 1, TOMO);
        rect(33, 3, 3, 5, "#7fc23f");
        dot(34, 4, "#1c1626");
      }, 38, 10);
      c.width = src.width * s;
      c.height = src.height * s;
      const t = c.getContext("2d");
      t.imageSmoothingEnabled = false;
      t.drawImage(src, 0, 0, c.width, c.height);
    }
  }

  // ---------- 図鑑から 会いに いく（地上は factory.meet、地下は その 場所へ もぐる） ----------
  const UG = { horimaru: "ホリマル", jelly: "スイショウクラゲ", tomoshibi: "トモシビ族" };
  function meetUnder(key) {
    if (key === "worm") {
      const y = top + (LAYERS[4].y + 16) * scale;
      scrollTo({ top: y - innerHeight / 2, behavior: factory.tools.reduced ? "auto" : "smooth" });
      return say("ホタルミミズは、この トンネルを はしっているよ。\nすこし まっていてね。");
    }
    const btn = [...wrap.querySelectorAll(".ug-hot")].find((b) => b.getAttribute("aria-label") === UG[key]);
    if (!btn) return nozokiOpen(key);
    btn.scrollIntoView({ behavior: factory.tools.reduced ? "auto" : "smooth", block: "center" });
    btn.focus({ preventScroll: true });
    btn.click();
  }
  // ---------- のぞき窓（せまい 画面で 地下に いない 子にも、図鑑から 会える） ----------
  const nozoki = document.getElementById("nozoki");
  const nozokiCanvas = nozoki.querySelector("canvas");
  const nozokiCtx = nozokiCanvas.getContext("2d");
  const nozokiView = nozoki.querySelector(".nozoki-view");
  const nozokiSay = nozoki.querySelector(".nozoki-say");
  const NW = nozokiCanvas.width;
  const NH = nozokiCanvas.height;
  let nozokiKey = null;
  let nozokiTalk = 0;
  let nozokiFlash = -1;
  // その 地層の 土を 1 まい（つぶつぶ つき）
  function nozokiSoil(L) {
    rect(0, 0, NW, NH, L.color);
    const rnd = seeded(7);
    for (let i = 0; i < 70; i++) dot(Math.floor(rnd() * NW), Math.floor(rnd() * NH), rnd() < 0.5 ? L.dark : L.light);
  }
  const NOZOKI = {
    horimaru: {
      layer: 1,
      draw(n) {
        nozokiSoil(LAYERS[1]);
        rect(0, 14, 40, 10, "rgba(20,12,10,0.45)");
        const x = 21 + (n % 16 < 8 ? 0 : 1);
        rows(HORIMARU, x, 13, n % 2 ? HORI : { ...HORI, m: HORI.M, M: HORI.m });
        if (n % 3 !== 0) for (const [dx, dy] of [[15, 2], [17, 5], [16, 7]]) dot(x + dx + (n % 2), 13 + dy, "#c99a6a");
      },
      talk: (k) => HORI_LINES[k % HORI_LINES.length],
    },
    jelly: {
      layer: 2,
      draw(n) {
        nozokiSoil(LAYERS[2]);
        oval(32, 32, 30, 6, "#1a3a4e");
        rect(0, 28, NW, NH - 28, "#1a3a4e");
        rect(0, 28, NW, 1, "#5fb8d8");
        const bright = n < nozokiFlash;
        for (const [k, dx] of [[0, 16], [5, 38]]) {
          const yy = 12 + (Math.floor((n + k) / 4) % 3);
          if (bright) disc(dx + 4, yy + 3, 6, "rgba(127,240,255,0.35)");
          rows(JELLY, dx, yy, bright ? { ...JEL, c: "#ffffff", C: "#7ff0ff" } : JEL);
          rows(JELLY_LEGS[(n + k) % 2], dx, yy + 5, JEL);
        }
      },
      talk: () => {
        nozokiFlash = now + 8;
        return JELLY_LINE;
      },
    },
    tomoshibi: {
      layer: 3,
      draw(n) {
        nozokiSoil(LAYERS[3]);
        rect(0, 28, NW, 2, "#56505e");
        rect(0, 30, NW, NH - 30, LAYERS[3].dark);
        const t = n % 44;
        const x = 18 + (t < 22 ? t : 44 - t);
        const flip = t >= 22;
        disc(x + (flip ? 0 : 8), 21, 3, "rgba(255,200,90,0.25)");
        rows(TOMOSHIBI, x + (flip ? 2 : 0), 19 - (n % 2), TOMO, flip);
        const lx = flip ? x : x + 8;
        dot(lx, 19, "#1c1626");
        rect(lx - 1, 20, 3, 3, n % 3 ? "#ffb347" : "#ffd84a");
      },
      talk: (k) => TOMO_LINES[k % TOMO_LINES.length],
    },
  };
  function nozokiDraw(n) {
    if (!nozokiKey || !nozoki.open) return;
    T.use(nozokiCtx);
    NOZOKI[nozokiKey].draw(n);
  }
  function nozokiOpen(key) {
    nozokiKey = key;
    nozokiTalk = 0;
    const L = LAYERS[NOZOKI[key].layer];
    nozoki.querySelector("h2").textContent = `のぞき窓：ちか ${L.depth}m の ${UG[key]}`;
    nozokiView.setAttribute("aria-label", `${UG[key]}に はなしかける`);
    nozokiCanvas.setAttribute("aria-label", `ちか ${L.depth}m の 地層の なかに いる ${UG[key]}`);
    nozokiSay.textContent = `${UG[key]}は、ちか ${L.depth}m に すんで いるよ。\nおすと はなしかけられる。`;
    nozoki.showModal();
    nozokiDraw(now);
  }
  nozokiView.addEventListener("click", () => {
    nozokiSay.textContent = NOZOKI[nozokiKey].talk(nozokiTalk++);
    nozokiDraw(now);
  });
  nozoki.querySelector(".nozoki-close").addEventListener("click", () => nozoki.close());
  // まどの そと（うしろの くらい ところ）を おしても とじる
  nozoki.addEventListener("click", (e) => {
    const r = nozoki.getBoundingClientRect();
    if (e.target === nozoki && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) nozoki.close();
  });
  nozoki.addEventListener("close", () => (nozokiKey = null));
  if (!T.reduced) T.onTick(nozokiDraw);

  document.addEventListener("click", (e) => {
    const b = e.target.closest?.(".meet");
    if (!b) return;
    if (!factory.meet(b.dataset.meet)) meetUnder(b.dataset.meet);
  });

  let timer = 0;
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  };
  new ResizeObserver(later).observe(document.querySelector("main"));
  addEventListener("resize", later);
  factory.newsReady.then(later);
  document.fonts?.ready.then(later);
  build();
  if (!T.reduced) T.onTick(step);

  return { found: () => found.size, legend: () => legend, open: () => openedAt >= 0 };
})();
