// ---------- WARPIX製作所：青空の 工場まちを うごかす ----------
// 480×176 ドットの 横長の 絵。画面の はばに あわせて 2〜6 倍に して、はみだす ぶんは 左右を けずる。
// うごかない 景色（空・山・町・工場）は さいしょに 1 回だけ 描いて おいて、
// 工場の とけい（0.3 秒ごとの tick）で、うごく もの だけを 上に かさねる。
// お話：ゲンさんが トンテンカン → ピクセが 水を とってくる → ごくごく → 汗を ふく → ぷはー → また しごと。
// えんとつ・ゲンさん・ピクセ・ねこは おせる。けいじばんと 製作所だよりは news.json。
// ブラウザには なにも 保存しない。?hour=0〜23 で あいさつと 時計塔の 時刻、?t=0〜95 で その コマに とめる。
const factory = (() => {
  const params = new URLSearchParams(location.search);
  const hour = params.has("hour") ? Number(params.get("hour")) % 24 : new Date().getHours();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frozen = params.has("t") ? Number(params.get("t")) : reduced ? 64 : null;
  // きょうの 日づけ。?date=2026-11-01（時刻つき 2026-11-01T06:59 も）で ためせる
  const date = params.get("date");
  const day = date ? new Date(date.includes("T") ? date : `${date}T12:00:00`) : new Date();
  // 開店は 2026-11-01 の あさ 7じ（日本時間）。SNS の 入口も ここから
  const OPEN = new Date("2026-11-01T07:00:00+09:00");
  const opened = day >= OPEN;
  // 開店いわい：まいとし 11/1〜11/14 は くすだま・紅白幕・花輪（2 年め からは ◯しゅうねん）
  const years = day.getFullYear() - 2026;
  const kaiten = opened && day.getMonth() === 10 && day.getDate() <= 14 ? { years, today: day.getDate() === 1 } : null;
  // 季節の 服（どの 季節も 晴れ）。?month=1〜12 で ためせる
  const month = params.has("month") ? ((Number(params.get("month")) + 11) % 12) + 1 : day.getMonth() + 1;
  const season = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  const SEASON = {
    spring: { sky: ["#4c9cec", "#58a5ef", "#65aef2", "#74b8f5", "#85c2f7", "#97ccf9", "#aad6fb", "#bddffc", "#d0e9fd", "#e2f2fe"], hill: ["#b8e0a0", "#9fd28a"], ground: ["#ddd3bb", "#c7bc9f"] },
    summer: { sky: ["#2f86e6", "#3a91ec", "#469cf0", "#53a7f3", "#62b1f6", "#73bbf8", "#86c6fa", "#9bd1fc", "#b1dcfd", "#c8e7fe"], hill: ["#a6d39a", "#8cc47f"], ground: ["#ddd3bb", "#c7bc9f"] },
    autumn: { sky: ["#2a7ee2", "#3489e8", "#3f94ec", "#4b9ff0", "#5aaaf3", "#6bb4f6", "#7fbff8", "#95cafa", "#acd6fc", "#c4e3fd"], hill: ["#c9b06a", "#b6944e"], ground: ["#ddd0b4", "#c7b996"] },
    winter: { sky: ["#6aa8e6", "#75b0ea", "#81b8ed", "#8ec0f0", "#9bc8f3", "#a9d0f5", "#b8d9f8", "#c7e2fa", "#d6ebfc", "#e6f3fd"], hill: ["#e9eef4", "#d8e0e9"], ground: ["#f2f5f8", "#dbe3ec"] },
  }[season];

  const W = 480;
  const H = 176;
  const scene = document.querySelector(".scene");
  const canvas = scene.querySelector("canvas");
  const view = canvas.getContext("2d");
  let g = view; // いま 描いている 紙

  // 絵の 色（1 文字 ＝ 1 色）
  const C = {
    o: "#2b2f3a", // りんかく
    W: "#f7f7f2", // しろ
    g: "#3fa45a", // みどり十字
    s: "#f2c49b", // はだ
    k: "#5a3d2b", // ひげ
    t: "#ffffff", // タオル
    u: "#5b7fae", // 作業着
    U: "#44638c",
    p: "#3e4f69", // ズボン
    B: "#3a2e28", // 長ぐつ
    a: "#7fd0ff", // 水
    m: "#8d99a6", // はがね
    M: "#5f6b78",
    h: "#a8713f", // 木
    y: "#ffd84a",
    Y: "#e8a33a",
    c: "#3ee8ff", // 未来の 光
    n: "#f0a040", // ねこ
    N: "#c87828",
    r: "#8a5a3a", // スズメ
  };
  const PIKU = { o: "#2b2f3a", w: "#f4f4f4", p: "#ff8fb8", c: "#3ee8ff", y: "#ffd84a", M: "#3d4656" };
  const HAKOBI = { ...PIKU, y: "#5a9cf5" };
  const BACHI = { ...PIKU, y: "#ff6b5a" };

  // ---------- ちいさな 道具 ----------
  const rect = (x, y, w, h, c) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const dot = (x, y, c) => rect(x, y, 1, 1, c);
  function rows(list, x, y, map = C, flip = false) {
    const w = list[0].length;
    list.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (map[ch]) dot(x + (flip ? w - 1 - i : i), y + j, map[ch]);
      })
    );
  }
  const patch = (list, x, y, map = C) => list.forEach(([dx, dy, row]) => rows([row], x + dx, y + dy, map));
  const disc = (cx, cy, r, c) => {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
      rect(cx - half, cy + y, half * 2 + 1, 1, c);
    }
  };
  const oval = (cx, cy, a, b, c) => {
    for (let y = -b; y <= b; y++) {
      const half = Math.round(a * Math.sqrt(Math.max(0, 1 - (y * y) / (b * b + 0.5))));
      rect(cx - half, cy + y, half * 2 + 1, 1, c);
    }
  };
  const line = (x0, y0, x1, y1, c, size = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) rect(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, size, size, c);
  };
  const sag = (x0, y0, x1, y1, depth, c) => {
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0);
      dot(x, Math.round(y0 + (y1 - y0) * t + depth * 4 * t * (1 - t)), c);
    }
  };
  // いつも おなじ ならびに なる 乱数（景色を 毎回 おなじに する）
  const seeded = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  // べつの 紙に 1 回だけ 描く
  function paper(paint, w = W, h = H) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const keep = g;
    g = c.getContext("2d");
    paint();
    g = keep;
    return c;
  }
  // ドット絵を 1 まい、べつの canvas に（図鑑や かざり）
  function drawOn(target, list, scale, map) {
    target.width = list[0].length * scale;
    target.height = list.length * scale;
    const t = target.getContext("2d");
    list.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!map[ch]) return;
        t.fillStyle = map[ch];
        t.fillRect(x * scale, y * scale, scale, scale);
      })
    );
  }

  // ---------- ピクセ（warpix-link と おなじ 16×16）に、製作所の 黄色い ヘルメット ----------
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
  const PIKUSE = BODY.map((row, y) => {
    const over = HELMET[y - 3];
    return over ? [...row].map((ch, x) => (over[x] !== "." ? over[x] : ch)).join("") : row;
  });
  const HAPPY = [[1, 7, "owwowwwwwwowwo"], [1, 8, "owowowwwwowowo"]]; // にっこり（^ ^）
  const VISOR = [[1, 7, "oMMMMMMMMMMMMo"], [1, 8, "oMcMMMMMMMMcMo"]]; // バチの ようせつの 面
  const STEP = [[4, 14, "oo....oo"]]; // あるく あし
  const withPatch = (list, p) => {
    const out = [...list];
    for (const [dx, dy, row] of p) out[dy] = out[dy].slice(0, dx) + row + out[dy].slice(dx + row.length);
    return out;
  };
  function pikuse(x, y, { happy = false, map = PIKU, visor = false, step = false } = {}) {
    rows(PIKUSE, x, y, map);
    if (happy) patch(HAPPY, x, y, map);
    if (visor) patch(VISOR, x, y, map);
    if (step) {
      rect(x + 4, y + 14, 8, 1, map.w);
      patch(STEP, x, y, map);
    }
  }
  const BOTTLE = [".W.", "aaa", "aaa", "aaa", "aaa"];

  // ---------- ゲンさん（16×23。うでは あとから かさねる） ----------
  const OJI = [
    "......oooo......",
    "....ooWWWWoo....",
    "...oWWWggWWWo...",
    "...oWWggggWWo...",
    "...oWWWggWWWo...",
    "..oooooooooooo..",
    "...osssssssso...",
    "...osossssoso...",
    "...osssssssso...",
    "...oskkkkkkso...",
    "....osssssso....",
    "...tttttttttt...",
    "..ouutuuuutuuo..",
    "..ouutuuuutuuo..",
    "..ouuuuUUuuuuo..",
    "..ouuuuUUuuuuo..",
    "..oooooyyooooo..",
    "...oppppppppo...",
    "...oppppppppo...",
    "...opppoopppo...",
    "...opppoopppo...",
    "...opppoopppo...",
    "..oBBBBooBBBBo..",
  ];
  const EYES_CLOSED = [[3, 7, "osoossooso"]];
  const ARM = {
    lDown: [[0, 12, "ou"], [0, 13, "ou"], [0, 14, "ou"], [0, 15, "ou"], [0, 16, "ss"], [0, 17, "ss"]],
    rDown: [[14, 12, "uo"], [14, 13, "uo"], [14, 14, "uo"], [14, 15, "uo"], [14, 16, "ss"], [14, 17, "ss"]],
    rUp: [[14, 12, "uo"], [14, 11, "uuo"], [15, 10, "uuo"], [16, 9, "ss"], [16, 8, "ss"], [17, 3, "h"], [17, 4, "h"], [17, 5, "h"], [17, 6, "h"], [17, 7, "h"], [15, 1, "mmmmm"], [15, 2, "MMMMM"]],
    rHit: [[14, 12, "uuu"], [14, 13, "uuuss"], [19, 13, "hh"], [21, 11, "mM"], [21, 12, "mM"], [21, 13, "mM"], [21, 14, "mM"], [21, 15, "mM"]],
    rReach: [[14, 12, "uuu"], [14, 13, "uuuuss"]],
    rDrink: [[14, 12, "uo"], [14, 11, "uo"], [13, 10, "ss"], [12, 9, "ss"], [8, 10, "W"], [9, 9, "aa"], [10, 8, "aaa"], [11, 7, "aaa"], [12, 6, "aa"], [13, 5, "W"]],
    lWipe: [[0, 12, "ou"], [0, 11, "ou"], [1, 10, "us"], [2, 7, "ttttt"], [2, 8, "tss"]],
    lUp: [[0, 12, "ou"], [-1, 11, "ou"], [-2, 10, "ou"], [-2, 9, "ss"], [-2, 8, "ss"]],
    rUpEmpty: [[14, 12, "uo"], [15, 11, "uo"], [16, 10, "uo"], [16, 9, "ss"], [16, 8, "ss"]],
    // ラジオ体操（よこに のばす）
    lSide: [[-4, 12, "ssuuu"], [-4, 13, "ssuuu"]],
    rSide: [[14, 12, "uuuss"], [14, 13, "uuuss"]],
    // おべんとう・おやつ（まえで もつ、口へ はこぶ）
    lHold: [[0, 12, "ou"], [1, 13, "uuu"], [3, 14, "ss"]],
    rHold: [[14, 12, "uo"], [13, 13, "uuo"], [11, 14, "ss"]],
    rEat: [[14, 12, "uo"], [14, 11, "uo"], [13, 10, "ss"], [12, 9, "ss"], [10, 9, "hh"]],
    // ほうきを もつ
    rBroom: [[14, 12, "uo"], [14, 13, "uo"], [14, 14, "uo"], [14, 15, "ss"]],
  };
  function ojisan(x, y, left, right, closed) {
    rows(OJI, x, y);
    if (closed) patch(EYES_CLOSED, x, y);
    patch(ARM[left], x, y);
    patch(ARM[right], x, y);
  }

  // ---------- いきもの・きかい ----------
  const CAT = [
    ".o..o.........",
    "onoono.oooooo.",
    "onnnnnonNnNnno",
    "oononnnnnnnnno",
    "onnnnnnNnNnnno",
    ".oWWooooooooo.",
  ];
  const SPARROW = [".rr..", "rWor.", ".rrrr", "..o.."];
  const SPARROW_PECK = [".....", ".rr..", "rWorr", ".rrro"];
  const LIFTON = [
    "..oooooo.......",
    "..occcco.......",
    "..ocoocoo......",
    "..occcco.m.....",
    "oooooooooom....",
    "oyyyyyyyyom....",
    "oyyYYYYyyom....",
    "oyyyyyyyyom....",
    "oyyyyyyyyommmmm",
    "oooooooooo.....",
    ".oMo..oMo......",
    "..o....o.......",
  ];
  const NOTE = ["..oo", "..oo", "..o.", "ooo.", "ooo."];

  // ================= うごかない 景色（さいしょに 1 回） =================
  const SKY = SEASON.sky;
  const back = paper(() => {
    const band = 12;
    SKY.forEach((c, i) => rect(0, i * band, W, band + 1, c));
    for (let i = 1; i < SKY.length; i++) for (let x = (i % 2) * 2; x < W; x += 4) dot(x, i * band, SKY[i - 1]);
    rect(0, SKY.length * band, W, H, SKY[SKY.length - 1]);
    // おひさま（ひかりの わ）
    disc(418, 30, 20, "#8fcbfa");
    disc(418, 30, 16, "#b9e0fd");
    disc(418, 30, 12, "#ffe680");
    disc(418, 30, 10, "#fff3a0");
    disc(415, 27, 4, "#fffbe0");
    if (season === "summer") {
      // 入道雲（ひだりに 大きく、みぎに ちいさく）
      thunderhead(110, 118, 170, 104, seeded(7));
      thunderhead(392, 118, 110, 62, seeded(21));
    } else if (season === "spring") {
      // 春は ふんわり ちいさめの 雲
      thunderhead(120, 118, 120, 44, seeded(7));
      thunderhead(380, 118, 90, 30, seeded(21));
    } else if (season === "autumn") {
      // 秋は 高い 空に、筆で さっと はいた ような すじ雲と、ふんわり 浮かぶ 雲
      for (const [x0, y0, len, bend] of [[60, 22, 150, 9], [210, 12, 120, -6], [250, 46, 90, 5], [90, 58, 70, -4]]) {
        for (let i = 0; i < len; i++) {
          const t = i / len;
          const y = Math.round(y0 + bend * Math.sin(t * Math.PI) - t * 6);
          const fade = Math.sin(t * Math.PI); // まんなかが こく、はしは うすい
          dot(x0 + i, y, fade > 0.35 ? "#ffffff" : "#e4f0fc");
          if (fade > 0.6) dot(x0 + i, y + 1, "#eef6fe");
          if (fade > 0.8 && i % 3 === 0) dot(x0 + i + 1, y - 1, "#ffffff"); // はけの すじ
        }
      }
      thunderhead(150, 118, 110, 34, seeded(7));
      thunderhead(390, 118, 80, 24, seeded(21));
    } else {
      // 冬は うすい すじ雲
      for (const [x, y, w] of [[40, 30, 140], [220, 18, 110], [120, 52, 90], [300, 60, 120]]) {
        rect(x, y, w, 1, "#ffffff");
        rect(x + 10, y + 2, w - 30, 1, "#eef6fd");
      }
    }
  });
  function thunderhead(cx, base, w, h, rnd) {
    const puffs = [];
    for (let i = 0; i < 18; i++) {
      const t = i / 17;
      const y = base - t * h;
      const spread = w * (0.48 - 0.3 * t);
      for (let j = 0; j < 3; j++) {
        const x = cx + (rnd() - 0.5) * 2 * spread;
        const r = Math.round(w * 0.13 * (1 - 0.45 * t) + rnd() * 5);
        puffs.push([x, y, r]);
      }
    }
    for (const [x, y, r] of puffs) disc(x + 3, y + 3, r, "#bcd3ec");
    for (const [x, y, r] of puffs) disc(x, y, r, "#e4eef9");
    for (const [x, y, r] of puffs) disc(x - 2, y - 2, Math.max(1, r - 3), "#ffffff");
  }

  const mid = paper(() => {
    // とおくの 山（雪が すこし のこる）
    for (let x = 0; x < W; x++) {
      const h = Math.round(16 + 10 * Math.sin(x / 31 + 0.6) + 7 * Math.sin(x / 13 + 2) + 4 * Math.sin(x / 5.3));
      const top = 118 - h;
      rect(x, top, 1, h + 2, "#93b7d6");
      const snowLine = season === "winter" ? 14 : season === "summer" ? 27 : 22;
      if (h > snowLine) rect(x, top, 1, Math.min(season === "winter" ? 12 : 4, h - snowLine), "#f2f7fc");
      rect(x, top + Math.round(h * 0.55), 1, 3, "#8aaecf");
    }
    // 丘（季節で 色が かわる）
    const hillRnd = seeded(13);
    for (let x = 0; x < W; x++) {
      const a = Math.round(8 + 4 * Math.sin(x / 23) + 2 * Math.sin(x / 9 + 1));
      rect(x, 120 - a, 1, a + 30, SEASON.hill[0]);
      const b = Math.round(5 + 3 * Math.sin(x / 17 + 3));
      rect(x, 128 - b, 1, b + 30, SEASON.hill[1]);
      // 春は 山ざくら、秋は 紅葉の つぶ
      if (season === "spring" && hillRnd() < 0.12) disc(x, 121 - a + Math.floor(hillRnd() * 4), 1, "#ffc8dc");
      if (season === "autumn" && hillRnd() < 0.18) disc(x, 121 - a + Math.floor(hillRnd() * 5), 1, hillRnd() < 0.5 ? "#e0603a" : "#f0a030");
    }
    // 町（屋根は トタンの 赤・青・みどり）
    const rnd = seeded(5);
    const roofs = ["#d0604a", "#4f7fc0", "#5a9a5a", "#c98a3a"];
    for (let x = 2; x < W; x += 9 + Math.floor(rnd() * 8)) {
      const base = 128 + Math.floor(rnd() * 6);
      if (rnd() < 0.3) {
        disc(x + 3, base - 4, 3 + Math.floor(rnd() * 2), "#5fa35a");
        dot(x + 2, base - 6, "#7fbf6f");
        continue;
      }
      const w = 7 + Math.floor(rnd() * 5);
      const hh = 4 + Math.floor(rnd() * 4);
      rect(x, base - hh, w, hh, "#f1e6cf");
      rect(x - 1, base - hh - 2, w + 2, 2, roofs[Math.floor(rnd() * roofs.length)]);
      rect(x + 2, base - hh + 1, 1, 1, "#7d93a8");
      if (w > 8) rect(x + w - 3, base - hh + 1, 1, 1, "#7d93a8");
    }
    // 高架（電車が はしる）
    rect(0, 128, W, 3, "#b7ab97");
    rect(0, 127, W, 1, "#d8cfbd");
    rect(0, 131, W, 1, "#8f8473");
    for (let x = 6; x < W; x += 24) {
      rect(x, 132, 4, 20, "#a99d88");
      rect(x + 4, 132, 1, 20, "#8f8473");
    }
    for (let x = 0; x < W; x += 6) dot(x, 126, "#8f8473"); // 架線の 柱
  });

  const front = paper(() => {
    // ---------- タワークレーン ----------
    rect(30, 18, 12, 6, "#a7a7a0"); // おもり
    for (let x = 30; x < 152; x++) {
      dot(x, 14, "#f2b632");
      dot(x, 17, "#f2b632");
      if (x % 4 === 0) line(x, 14, x + 2, 17, "#c98f17");
    }
    line(79, 5, 32, 14, "#5f6b78");
    line(80, 5, 150, 14, "#5f6b78");
    rect(78, 4, 3, 10, "#f2b632");
    for (let y = 18; y < 152; y++) {
      dot(76, y, "#f2b632");
      dot(82, y, "#f2b632");
      if (y % 6 === 0) line(76, y, 82, y + 5, "#c98f17");
    }
    rect(70, 18, 8, 7, "#f2b632");
    rect(71, 19, 6, 3, "#9fe3ff");
    // ---------- 足場と ブルーシート（中で なにかを 建造中） ----------
    oval(78, 128, 34, 30, "#2f66b5");
    oval(76, 126, 32, 28, "#3f7fd6");
    rect(44, 128, 68, 24, "#3f7fd6");
    for (const x of [54, 66, 90, 102]) rect(x, 104, 1, 48, "#2f66b5"); // シートの しわ
    // 「？？？」
    const Q = ["oo.", "..o", ".o.", "...", ".o."];
    for (let i = 0; i < 3; i++) rows(Q, 69 + i * 5, 118, { o: "#ffffff" });
    for (const x of [40, 54, 68, 82, 96, 110]) rect(x, 92, 1, 60, "#8d99a6");
    for (const y of [108, 124, 140]) {
      rect(38, y, 76, 2, "#a8713f");
      rect(38, y + 2, 76, 1, "#7a4f2b");
    }
    for (const x of [40, 68, 96]) line(x, 124, x + 14, 108, "#8d99a6");
    // ---------- 電柱と 電線 ----------
    rect(122, 64, 3, 88, "#7a6a5c");
    rect(116, 68, 15, 2, "#5f5247");
    rect(118, 74, 11, 2, "#5f5247");
    dot(117, 67, C.W);
    dot(129, 67, C.W);
    sag(0, 52, 117, 68, 9, "#3d4656");
    sag(0, 60, 119, 74, 8, "#3d4656");
    sag(129, 68, 170, 66, 3, "#3d4656");
    // ---------- 時計塔（事務所） ----------
    rect(130, 62, 44, 90, C.o);
    rect(132, 64, 40, 88, "#e3dccd");
    rect(164, 64, 8, 88, "#cfc6b3");
    rect(130, 62, 44, 3, "#9a8f7c");
    for (const y of [94, 106, 118, 130]) for (const x of [136, 146, 156]) {
      rect(x, y, 7, 6, C.o);
      rect(x + 1, y + 1, 5, 4, "#9fe3ff");
      dot(x + 1, y + 1, "#e6f8ff");
    }
    rect(146, 140, 12, 12, "#5f6b78");
    rect(147, 141, 10, 11, "#8d99a6");
    rect(152, 141, 1, 11, "#5f6b78");
    disc(152, 79, 11, C.o);
    disc(152, 79, 10, "#fff8e7");
    for (const [dx, dy] of [[0, -8], [8, 0], [0, 8], [-8, 0]]) rect(152 + dx - (dx ? 0 : 0), 79 + dy, 1, 1, C.o);
    rect(151, 46, 2, 16, "#5f6b78"); // アンテナ
    rect(148, 50, 8, 1, "#5f6b78");
    // ---------- えんとつ（紅白、うしろに 2 本） ----------
    const stack = (x, top, w) => {
      for (let y = top; y < 92; y++) rect(x, y, w, 1, Math.floor((y - top) / 7) % 2 ? "#f7f7f2" : "#e0503c");
      rect(x - 1, top, w + 2, 2, C.o);
      rect(x + w - 2, top + 2, 2, 90 - top, "rgba(0,0,0,0.12)");
    };
    stack(302, 26, 9);
    stack(318, 46, 7);
    // ---------- 本工場（のこぎり屋根・トタン） ----------
    const x0 = 172;
    const x1 = 334;
    const P = (x1 - x0) / 6;
    for (let x = x0; x < x1; x++) {
      const t = (x - x0) % P;
      const top = 88 + Math.floor((t / P) * 18);
      rect(x, top, 1, 107 - top, t < 4 ? "#9fe3ff" : "#56687a");
      dot(x, top, t < 4 ? "#e6f8ff" : "#7d93a8");
      if (t >= 4 && x % 3 === 0) rect(x, top + 2, 1, 105 - top - 2, "#4d5e70");
    }
    rect(x0, 106, x1 - x0, 2, C.o);
    rect(x0, 108, x1 - x0, 44, "#c9d1d9");
    for (let x = x0 + 1; x < x1; x += 3) rect(x, 108, 1, 44, "#b3bdc7");
    for (const [x, len] of [[180, 9], [207, 5], [279, 11], [318, 7]]) {
      rect(x, 108, 2, len, "#c4683f");
      rect(x, 108 + len, 1, 3, "#c4683f");
    }
    for (const wx of [180, 200, 282, 304]) {
      rect(wx - 1, 116, 14, 12, C.o);
      rect(wx, 117, 12, 10, "#9fe3ff");
      rect(wx, 121, 12, 1, C.o);
      rect(wx + 6, 117, 1, 10, C.o);
      dot(wx + 1, 118, "#e6f8ff");
      dot(wx + 2, 118, "#e6f8ff");
    }
    rect(226, 112, 48, 40, C.o);
    rect(228, 114, 44, 38, "#33404f");
    for (let y = 114; y < 122; y += 2) rect(228, y, 44, 1, "#8d99a6");
    rect(236, 126, 28, 26, "#4a5b6e");
    rect(238, 128, 24, 10, "#1e2b38");
    // 看板の あし と わく（文字は HTML の 見出し）
    for (const x of [200, 244, 290]) rect(x, 80, 2, 10, C.o);
    rect(190, 58, 112, 23, C.o);
    rect(191, 59, 110, 21, "#e0503c");
    rect(193, 61, 106, 17, "#fff8e7");
    // ---------- かまぼこ倉庫 ----------
    oval(364, 122, 31, 18, C.o);
    oval(364, 122, 30, 17, "#b9c3cc");
    for (let x = 336; x < 394; x += 3) rect(x, 105, 1, 18, "#a3adb7");
    rect(333, 122, 62, 30, C.o);
    rect(334, 122, 60, 30, "#d0c7b4");
    for (let x = 335; x < 394; x += 4) rect(x, 122, 1, 30, "#c0b59f");
    rect(350, 128, 28, 24, "#3b3f46");
    rect(352, 140, 8, 12, "#a8713f");
    rect(361, 144, 8, 8, "#a8713f");
    rect(352, 143, 8, 1, "#7a4f2b");
    // ---------- じめん ----------
    const [gr, grDark] = SEASON.ground;
    rect(0, 150, W, 26, gr);
    rect(0, 150, W, 2, grDark);
    for (let x = 0; x < W; x += 32) rect(x, 152, 1, 24, season === "winter" ? "#e6ecf2" : "#d2c7ab");
    rect(0, 172, W, 4, season === "winter" ? "#e3e9f0" : "#cfc4a8");
    const rnd = seeded(11);
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(rnd() * W);
      const y = 154 + Math.floor(rnd() * 16);
      rect(x, y, 3, 1, grDark);
    }
    if (season !== "winter") {
      for (const x of [6, 34, 120, 176, 330, 398, 470]) {
        dot(x, 151, "#5fbf62");
        dot(x + 1, 150, "#3f9446");
        dot(x + 2, 151, "#5fbf62");
      }
    }
    // ---------- 季節の 草木（夏：ひまわり、春：さくら、秋：もみじ、冬：ゆきだるま） ----------
    const flower = (x, top) => {
      rect(x, top, 1, 168 - top, "#3f9446");
      rect(x + 1, top + 8, 3, 2, "#5fbf62");
      rect(x - 3, top + 14, 3, 2, "#5fbf62");
      disc(x, top, 4, "#ffc21a");
      disc(x, top, 2, "#7a4f2b");
    };
    const tree = (x, colors) => {
      rect(x - 1, 140, 3, 28, "#7a5a40");
      line(x, 146, x - 6, 140, "#7a5a40");
      line(x, 144, x + 6, 139, "#7a5a40");
      const r = seeded(x);
      for (let i = 0; i < 16; i++) disc(x - 12 + Math.floor(r() * 24), 126 + Math.floor(r() * 16), 4 + Math.floor(r() * 3), colors[i % colors.length]);
      for (let i = 0; i < 10; i++) dot(x - 12 + Math.floor(r() * 24), 124 + Math.floor(r() * 18), colors[colors.length - 1]);
    };
    const snowman = (x) => {
      disc(x, 160, 7, "#ffffff");
      disc(x, 148, 5, "#ffffff");
      dot(x - 2, 147, C.o);
      dot(x + 2, 147, C.o);
      rect(x, 149, 3, 1, "#ff9a3c");
      rect(x - 5, 141, 10, 2, "#e0503c"); // バケツの かわりに ヘルメット
      rect(x - 3, 139, 6, 2, "#ffd84a");
      line(x - 6, 155, x - 11, 151, "#7a5a40");
      line(x + 6, 155, x + 11, 151, "#7a5a40");
    };
    if (season === "summer") for (const [x, top] of [[8, 138], [16, 132], [25, 140], [455, 134], [464, 140], [472, 130]]) flower(x, top);
    if (season === "spring") for (const x of [18, 464]) tree(x, ["#ffb7d0", "#ffc8dc", "#ffd9e6", "#ffffff"]);
    if (season === "autumn") for (const x of [18, 464]) tree(x, ["#e0603a", "#f0a030", "#c8442a", "#ffd04a"]);
    if (season === "winter") {
      snowman(18);
      snowman(464);
    }
    // ---------- 自動販売機・木の 箱 ----------
    rect(397, 119, 16, 33, C.o);
    rect(398, 120, 14, 31, "#e0503c");
    rect(400, 122, 10, 12, "#fff3c4");
    ["#3c8ce0", "#3fa45a", "#ff9a3c", "#e0503c", "#7a5be0"].forEach((c, i) => rect(401 + (i % 3) * 3, 124 + Math.floor(i / 3) * 5, 2, 3, c));
    rect(400, 137, 10, 3, C.o);
    rect(400, 143, 10, 4, "#b23a2a");
    for (const [x, y] of [[434, 158], [446, 158], [440, 148]]) {
      rect(x, y, 11, 10, "#a8713f");
      rect(x, y + 4, 11, 1, "#7a4f2b");
      rect(x, y, 11, 1, "#c58d55");
    }
    // ---------- 冬は 雪化粧 ----------
    if (season === "winter") {
      const SNOW = "#ffffff";
      rect(30, 12, 122, 2, SNOW); // クレーン
      rect(190, 56, 112, 2, SNOW); // 看板
      rect(130, 60, 44, 3, SNOW); // 時計塔
      rect(301, 24, 11, 2, SNOW); // えんとつ
      rect(317, 44, 9, 2, SNOW);
      rect(397, 117, 16, 2, SNOW); // 自販機
      for (const y of [107, 123, 139]) rect(38, y, 76, 1, SNOW); // 足場
      for (const [x, y] of [[434, 157], [446, 157], [440, 147]]) rect(x, y, 11, 1, SNOW); // 木箱
      // のこぎり屋根の ななめの 面
      for (let x = 172; x < 334; x++) {
        const t = (x - 172) % 27;
        if (t >= 4) dot(x, 88 + Math.floor((t / 27) * 18) - 1, SNOW);
        if (t >= 6) dot(x, 88 + Math.floor((t / 27) * 18), SNOW);
      }
      // かまぼこ屋根
      for (let x = 334; x < 395; x++) {
        const dx = (x - 364) / 31;
        dot(x, Math.round(122 - 18 * Math.sqrt(Math.max(0, 1 - dx * dx))) - 1, SNOW);
        dot(x, Math.round(122 - 18 * Math.sqrt(Math.max(0, 1 - dx * dx))), SNOW);
      }
    }
  });

  // ---------- 開店いわい（11/1〜11/14 だけ。うごかない ので 1 回だけ 描く） ----------
  const PETALS = ["#ff7aa8", "#ffd84a", "#ff9a3c", "#ffffff", "#e0503c", "#7fd0ff"];
  const deco = kaiten && paper(() => {
    // 紅白幕：工場の かべの 上に、すこし たるませて
    for (let x = 172; x < 334; x++) {
      const t = ((x - 172) % 27) / 27;
      const h = 6 + Math.round(8 * t * (1 - t));
      rect(x, 108, 1, h, Math.floor((x - 172) / 4) % 2 ? "#f7f7f2" : "#e0503c");
      dot(x, 108 + h, "rgba(0,0,0,0.15)");
    }
    rect(172, 107, 162, 1, "#2c3a4a");
    for (let x = 172; x <= 334; x += 27) disc(x, 108, 2, "#e0503c");
    // くすだま：看板の 下で ぱかっと ひらいて、たれまく（文字は HTML）
    rect(262, 81, 1, 4, C.o);
    for (let dy = -5; dy <= 5; dy++)
      for (let dx = 0; dx <= 5; dx++) {
        if (dx * dx + dy * dy > 25) continue;
        const c = dx * dx + dy * dy > 16 ? C.o : (dy + 9) % 3 === 0 ? "#e0503c" : "#f2b632";
        dot(254 - dx, 89 + dy, c);
        dot(270 + dx, 89 + dy, c);
      }
    rect(255, 85, 14, 34, C.o);
    rect(256, 86, 12, 32, "#fffdf5");
    rect(256, 87, 12, 1, "#e0503c");
    rect(256, 116, 12, 1, "#e0503c");
    // 花輪：時計塔の よこと、工場の みぎに 1 つずつ
    for (const cx of [167, 326]) {
      const cy = 132;
      line(cx - 6, 160, cx - 1, cy + 6, "#7a4f2b");
      line(cx + 6, 160, cx + 1, cy + 6, "#7a4f2b");
      rect(cx, cy + 6, 1, 154 - cy, "#7a4f2b");
      for (let dy = -9; dy <= 9; dy++)
        for (let dx = -9; dx <= 9; dx++) {
          const d = dx * dx + dy * dy;
          if (d > 81) continue;
          const k = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 18);
          dot(cx + dx, cy + dy, d > 72 ? C.o : d > 25 ? PETALS[(k + (d > 49 ? 1 : 0)) % PETALS.length] : "#fffdf5");
        }
      rect(cx, cy - 3, 1, 6, "#b8361f"); // まんなかの 札（おいわいの ことば）
      rect(cx - 2, cy + 8, 5, 2, "#e0503c"); // 下の リボン
      dot(cx - 2, cy + 10, "#e0503c");
      dot(cx + 2, cy + 10, "#e0503c");
    }
  });
  // くすだまの 紙ふぶき
  function confetti(n) {
    for (let i = 0; i < 16; i++) {
      const y = 92 + ((i * 23 + n * 1.2) % 72);
      const x = 246 + ((i * 13) % 34) + Math.round(3 * Math.sin((n + i * 4) / 5));
      rect(x, y, (n + i) % 3 ? 2 : 1, 1, PETALS[i % PETALS.length]);
    }
  }

  // ================= うごく もの（毎コマ） =================
  const CLOUDS = [
    { x: 20, y: 24, s: 1.1, v: 0.18 },
    { x: 180, y: 10, s: 0.8, v: 0.26 },
    { x: 300, y: 42, s: 0.6, v: 0.4 },
    { x: 420, y: 66, s: 0.5, v: 0.32 },
  ];
  function cloud(x, y, s) {
    const puff = (dx, dy, r, c) => disc(x + dx * s, y + dy * s, Math.round(r * s), c);
    for (const [c, oy] of [["#d3e9fb", 0], ["#ffffff", -1]]) {
      puff(8, 8 + oy, 6, c);
      puff(17, 5 + oy, 8, c);
      puff(27, 8 + oy, 6, c);
      puff(34, 10 + oy, 4, c);
    }
    rect(x + 4 * s, y + 10 * s, 32 * s, 4 * s, "#ffffff");
    rect(x + 4 * s, y + 14 * s, 32 * s, 1, "#d3e9fb");
  }
  function clouds(n) {
    for (const c of CLOUDS) {
      const span = W + 60;
      cloud(Math.floor(((c.x + n * c.v) % span) - 50), c.y, c.s);
    }
  }
  // 飛行船 ソラマメ号（ゆっくり）
  // 見えている はば（cropX〜）の 中を わたる ので、スマホでも かならず 見える。さいしょは まんなか
  let airshipShift = 0;
  const airshipX = (n) => {
    const span = visW + 40;
    return cropX - 40 + Math.floor((((n * 0.12 + visW / 2 + 20 + airshipShift) % span) + span) % span);
  };
  // ツアーで よる とき、ソラマメ号が 絵の はしに かくれていたら、見ていない うちに まんなかへ よんでくる
  function airshipCenter() {
    const x = airshipX(n);
    const seen = x + 40 > cam.x && x < cam.x + visW / cam.z;
    if (!seen && (x + 40 < 20 || x > W - 20)) airshipShift += cropX + visW / 2 - 20 - x;
    return airshipX(n) + 20;
  }
  function airship(n) {
    const x = airshipX(n);
    const y = 46 + (Math.floor(n / 8) % 2);
    oval(x + 20, y, 20, 6, C.o);
    oval(x + 20, y, 19, 5, "#eef1f4");
    rect(x + 3, y - 1, 34, 2, "#e0503c");
    oval(x + 22, y - 3, 12, 1, "#ffffff");
    rect(x - 1, y - 6, 4, 5, "#e0503c");
    rect(x - 1, y + 2, 4, 4, "#e0503c");
    rect(x + 15, y + 6, 10, 3, "#56687a");
    rect(x + 16, y + 7, 2, 1, "#9fe3ff");
    rect(x + 20, y + 7, 2, 1, "#9fe3ff");
    rect(x - 3, y - 1 + (n % 2) * 2, 1, 1, C.o);
  }
  // 季節の とりや むし（夏：鳥の むれ、春：つばめ、秋：赤とんぼ、冬：なし）
  function birds(n) {
    if (season === "winter") return;
    if (season === "spring") {
      for (const [k, y0] of [[0, 60], [37, 84]]) {
        const t = (n + k) % 90;
        const x = -10 + t * 6;
        const y = y0 + Math.round(8 * Math.sin(t / 6));
        const up = n % 2;
        rect(x, y, 3, 1, "#1e2b4a");
        dot(x - 1, y - 1 - up, "#1e2b4a");
        dot(x - 2, y - 2 - up, "#1e2b4a");
        dot(x + 3, y + 1, "#1e2b4a"); // ふたまたの しっぽ
        dot(x + 3, y - 1, "#1e2b4a");
        dot(x + 1, y, "#ffffff");
      }
      return;
    }
    if (season === "autumn") {
      for (const [k, cx, cy] of [[0, 120, 138], [11, 300, 128], [23, 420, 142], [31, 60, 112]]) {
        const x = cx + Math.round(14 * Math.sin((n + k) / 9));
        const y = cy + Math.round(5 * Math.sin((n + k) / 5));
        rect(x, y, 5, 1, "#d8402a");
        dot(x + 1, y - 1 - (n % 2), "#e8eef4");
        dot(x + 2, y - 1 - ((n + 1) % 2), "#e8eef4");
      }
      return;
    }
    const t = n % 240;
    if (t > 120) return;
    for (const [dx, dy] of [[0, 0], [-6, 3], [-12, 6], [-6, -3]]) {
      const x = W + 10 - t * 4.5 + dx;
      const y = 70 - t * 0.3 + dy;
      const up = (n + dx) % 2;
      dot(x, y, C.o);
      dot(x - 1, y - up, C.o);
      dot(x + 1, y - up, C.o);
    }
  }
  // ふって くる もの（春：花びら、秋：落ち葉、冬：雪）。いつも おなじ ならびで、毎コマ すこし うごく
  const FLAKES = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97) % W, y: (i * 53) % H, v: 0.5 + ((i * 7) % 5) * 0.15, k: i }));
  function falling(n) {
    if (season === "summer") return;
    const colors = season === "spring" ? ["#ffc8dc", "#ffb7d0", "#ffffff"] : season === "autumn" ? ["#e0603a", "#f0a030", "#c8442a"] : ["#ffffff", "#ffffff", "#eef6fd"];
    const count = season === "winter" ? 46 : 18;
    for (let i = 0; i < count; i++) {
      const f = FLAKES[i];
      const y = (f.y + n * f.v) % H;
      const x = (f.x + Math.round(6 * Math.sin((n + f.k * 5) / 8)) + n * (season === "winter" ? 0.1 : 0.6)) % W;
      const c = colors[i % 3];
      if (season === "winter") rect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1, c);
      else {
        dot(x, y, c);
        dot(x + ((n + i) % 2 ? 1 : -1), y + 1, c);
      }
    }
  }
  function drone(n) {
    const t = n % 160;
    if (t > 110) return;
    const x = -16 + t * 5;
    const y = 86 + (t % 4 < 2 ? 0 : 1);
    rect(x, y, 12, 2, "#56687a");
    rect(x + 4, y - 1, 4, 1, "#3ee8ff");
    const blade = t % 2 ? 4 : 2;
    rect(x - blade / 2 + 1, y - 2, blade, 1, C.o);
    rect(x + 11 - blade / 2, y - 2, blade, 1, C.o);
    line(x + 6, y + 2, x + 6, y + 4, C.o);
    rect(x + 3, y + 5, 7, 5, "#c99a5b");
    rect(x + 3, y + 7, 7, 1, "#a87a40");
  }
  // 電車（高架を はしる。クリームと オレンジ、みどりの おび）
  function train(n) {
    const t = n % 288;
    if (t > 200) return;
    const x0 = W + 10 - t * 3;
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * 25;
      if (x > W || x < -26) continue;
      rect(x, 116, 24, 11, C.o);
      rect(x + 1, 117, 22, 5, "#f3e7c9");
      rect(x + 1, 122, 22, 4, "#e8732e");
      rect(x + 1, 121, 22, 1, "#2f7d4f");
      for (let w = 0; w < 4; w++) rect(x + 3 + w * 5, 118, 3, 2, "#5f8fb8");
      rect(x + 4, 126, 3, 1, C.o);
      rect(x + 17, 126, 3, 1, C.o);
      if (i === 0) {
        rect(x, 117, 2, 4, "#5f8fb8");
        line(x + 8, 115, x + 12, 112, C.o);
      }
    }
  }
  function crane(n) {
    if (n % 6 < 3) rect(79, 2, 2, 2, "#ff4a3a");
    const tx = 104 + Math.round(30 * (0.5 - 0.5 * Math.cos(n / 40)));
    rect(tx - 2, 17, 6, 3, "#5f6b78");
    line(tx, 20, tx, 52, "#3d4656");
    rect(tx - 1, 52, 3, 2, "#e8a33a");
    rect(tx - 10, 54, 22, 2, "#8d99a6");
    rect(tx - 10, 56, 22, 1, "#5f6b78");
  }
  // 時計塔の はり（ほんとうの 時刻）
  function clockHands() {
    const now = new Date();
    const h = params.has("hour") ? hour : now.getHours();
    const m = now.getMinutes();
    const am = ((h % 12) + m / 60) * (Math.PI / 6) - Math.PI / 2;
    const mm = m * (Math.PI / 30) - Math.PI / 2;
    line(152, 79, 152 + Math.round(Math.cos(am) * 5), 79 + Math.round(Math.sin(am) * 5), C.o);
    line(152, 79, 152 + Math.round(Math.cos(mm) * 8), 79 + Math.round(Math.sin(mm) * 8), "#e0503c");
    dot(152, 79, C.o);
  }
  function antenna(n) {
    rect(151, 44, 2, 2, n % 4 < 2 ? "#3ee8ff" : "#1aa6c4");
  }
  let bigUntil = 0; // えんとつを おされたら しばらく もくもく
  function smoke(n) {
    const big = n < bigUntil;
    for (const [cx, top, k] of [[306, 24, 0], [321, 44, 5]]) {
      for (let i = 0; i < (big ? 6 : 3); i++) {
        const phase = big ? (n * 3 + i * 3 + k) % 18 : (n + i * 4 + k) % 12;
        const r = 2 + Math.floor(phase / 3) + (big ? 1 : 0);
        disc(cx + Math.floor(phase * 1.1), top - 2 - phase * 1.8, r, phase > 8 ? "#e9f3fb" : "#ffffff");
      }
    }
  }
  function signBulbs(n) {
    for (let i = 0; i < 14; i++) rect(193 + i * 8, 56, 2, 2, (i + n) % 3 === 0 ? "#fff3a0" : "#e8a33a");
  }
  function machine(n) {
    const lit = n % 3;
    for (let i = 0; i < 7; i++) rect(240 + i * 3, 131, 2, 2, i % 3 === lit ? "#3ee8ff" : "#1aa6c4");
    rect(240, 135, 20, 1, n % 2 ? "#3ee8ff" : "#1aa6c4");
    rect(247, 122, 6, 4, "#5f6b78");
    rect(249, 120, 2, 2, n % 4 < 2 ? "#ff9a3c" : "#ffd84a");
  }
  // 倉庫の 屋根の ロボットアーム（アームさん）
  const POSES = [[-2.4, -0.4], [-2.6, -0.2], [-1.6, -1.4], [-1.0, 0.8]];
  function robot(n) {
    const bx = 364;
    const by = 104;
    rect(bx - 4, by, 9, 3, "#5f6b78");
    const pose = POSES[Math.floor(n / 6) % POSES.length];
    const ex = bx + Math.round(Math.cos(pose[0]) * 13);
    const ey = by + Math.round(Math.sin(pose[0]) * 13);
    const hx = ex + Math.round(Math.cos(pose[0] + pose[1]) * 11);
    const hy = ey + Math.round(Math.sin(pose[0] + pose[1]) * 11);
    line(bx, by, ex, ey, "#f0f2f5", 2);
    line(ex, ey, hx, hy, "#f0f2f5", 2);
    rect(bx - 1, by - 1, 3, 3, "#3ee8ff");
    rect(ex - 1, ey - 1, 3, 3, "#3ee8ff");
    rect(hx - 1, hy - 1, 3, 2, C.o);
    if (hx < 345 && n % 2 === 0) for (const [dx, dy] of [[-2, -1], [-1, 2], [-3, 1], [0, -2]]) dot(hx + dx, hy + dy, n % 4 ? "#fff3a0" : "#ff9a3c");
  }
  // スズメ（電線の 上）
  function sparrows(n) {
    for (const [x, k] of [[46, 0], [58, 3], [96, 5]]) {
      const y = Math.round(52 + (68 - 52) * (x / 117) + 9 * 4 * (x / 117) * (1 - x / 117)) - 4;
      rows((n + k) % 10 === 0 ? SPARROW_PECK : SPARROW, x, y, C, (n + k) % 20 > 12);
    }
  }
  // ねこの トタン（自販機の 上で ひるね）
  function cat(n) {
    rows(CAT, 398, 113);
    const up = n % 8 < 2;
    rect(412, up ? 113 : 116, 1, 3, C.n);
    dot(413, up ? 112 : 118, C.N);
    if (n % 12 < 6) rows(["o.o", ".o.", "o.o"].map((r) => r.replaceAll("o", "z")), 400, 106 - (n % 6), { z: "#ffffff" });
  }
  // リフトン（木の 箱を はこぶ）
  const liftonX = (n) => {
    const t = n % 40;
    return 410 + (t < 20 ? t : 40 - t);
  };
  const hakobiX = (n) => {
    const t = n % 64;
    return t < 28 ? 98 + t * 2 : t < 32 ? 154 : t < 60 ? 154 - (t - 32) * 2 : 98;
  };
  function lifton(n) {
    const t = n % 40;
    const x = 410 + (t < 20 ? t : 40 - t);
    const flip = t >= 20;
    rows(LIFTON, x, 156, C, flip);
    if (!flip) {
      rect(x + 10, 151, 6, 5, "#a8713f");
      rect(x + 10, 153, 6, 1, "#7a4f2b");
    }
    if (n % 4 < 2) dot(flip ? x + 11 : x + 3, 157, "#ffffff");
  }
  // ハコビ（青ヘルメット。部品を 頭に のせて 時計塔と 足場を 行ったり 来たり）
  function hakobi(n) {
    const t = n % 64;
    const x = t < 28 ? 98 + t * 2 : t < 32 ? 154 : t < 60 ? 154 - (t - 32) * 2 : 98;
    const walking = (t < 28 || (t >= 32 && t < 60));
    const y = 152 - (walking && n % 2 ? 1 : 0);
    rect(x + 3, 167, 10, 1, "#c7bc9f");
    pikuse(x, y, { map: HAKOBI, step: walking && n % 2 === 1 });
    if (t < 30) {
      rect(x + 4, y - 4, 8, 4, "#c99a5b");
      rect(x + 4, y - 3, 8, 1, "#a87a40");
    }
  }
  // バチ（赤ヘルメット。足場の 上で ようせつ）
  function bachi(n) {
    pikuse(102, 108, { map: BACHI, visor: true });
    if (n % 3 !== 2) for (const [dx, dy] of [[-3, -2], [-1, -4], [-4, 1], [-2, 2], [-5, -3]]) dot(100 + dx, 118 + dy + (n % 2), n % 2 ? "#fff3a0" : "#ff9a3c");
  }
  // ラジカセ（チップチューンが ながれる）
  // おすと ほんとうに 鳴る（radio.js）。鳴っている あいだは 音符が ぴょこぴょこ
  function boombox(n, x, y, music = false) {
    const on = music || (typeof radio !== "undefined" && radio.playing());
    const beat = on ? radio.beat() : 0;
    rect(x, y - 2, 12, 1, "#5f6b78");
    rect(x, y, 12, 7, C.o);
    rect(x + 1, y + 1, 10, 5, "#c0c7cf");
    disc(x + 3, y + 3, on && beat % 2 ? 2 : 1, C.o);
    disc(x + 8, y + 3, on && beat % 2 ? 2 : 1, C.o);
    rect(x + 5, y + 1, 2, 2, on ? (beat % 2 ? "#3ee8ff" : "#ff8fb8") : n % 6 < 3 ? "#e0503c" : "#7a2a20");
    if (!on) return;
    const colors = ["#ff8fb8", "#ffd84a", "#3ee8ff"];
    for (let i = 0; i < 3; i++) {
      const ph = (n + i * 4) % 12;
      rows(NOTE, x + 2 + i * 5 + (ph % 4 < 2 ? 0 : 1), y - 6 - ph * 1.5, { o: colors[(Math.floor(n / 12) + i) % 3] });
    }
  }
  const groove = () => (typeof radio !== "undefined" && radio.playing() && radio.beat() % 2 ? 1 : 0);
  function jug(x, y) {
    rect(x - 2, y + 10, 16, 9, "#a8713f");
    rect(x - 2, y + 13, 16, 1, "#7a4f2b");
    rect(x - 1, y - 1, 14, 12, C.o);
    rect(x, y, 12, 10, "#ff9a3c");
    rect(x, y + 3, 12, 2, "#ffffff");
    rect(x + 3, y - 3, 6, 2, "#f7f7f2");
    rect(x + 12, y + 7, 2, 2, "#5f6b78");
  }
  function bench(x, y, n, sparking, glow) {
    rect(x, y, 22, 3, "#a8713f");
    rect(x, y + 3, 22, 1, "#7a4f2b");
    rect(x + 1, y + 4, 2, 7, "#7a4f2b");
    rect(x + 19, y + 4, 2, 7, "#7a4f2b");
    rect(x + 3, y - 4, 7, 4, "#8d99a6");
    rect(x + 4, y - 5, 5, 1, "#5f6b78");
    rect(x + 5, y - 3, 3, 2, glow ? "#3ee8ff" : "#1aa6c4");
    if (sparking) for (const [dx, dy] of [[-2, -7], [1, -9], [4, -8], [7, -6], [-1, -5]]) dot(x + 3 + dx, y + dy + (n % 2), n % 3 ? "#fff3a0" : "#ff9a3c");
  }

  // ---------- お話の 流れ（96 コマ ≒ 29 秒で ひとまわり） ----------
  const OX = 200; // ゲンさんの 位置
  const OY = 145;
  const BX = OX + 17; // 作業台
  const BY = OY + 16;
  const HOME = BX + 24; // ピクセの いつもの 場所
  const JUG = OX + 68;
  const GROUND = OY + 23;
  const ON_BENCH = BY - 15;
  const REST_LINE = { spring: "ふう、いい ひよりだ", summer: "ふう、あっついなあ", autumn: "ふう、すずしく なったなあ", winter: "ふう、さむいけど からだは ぽかぽかだ" };
  // ゲンさんの 一日の 小物（おべんとう・たいやき・ほうき・Zz・からあげを ねらう スズメ・どうぐばこ）
  const TAIYAKI = [".yyyy.", "yyyyyY", "yYyyyy", ".yy.Y."];
  const TAI = { y: "#e8a33a", Y: "#b8741c" };
  function dayExtras(s, n) {
    if (s.bento) {
      rect(OX + 4, OY + 14, 8, 3, "#c0392b");
      rect(OX + 5, OY + 14, 3, 1, "#ffffff"); // ごはん
      dot(OX + 6, OY + 14, "#e0503c"); // うめぼし
      if ((s.thief ?? 0) < 12) rect(OX + 9, OY + 14, 2, 1, "#c98a3a"); // からあげ
      dot(OX + 11, OY + 14, "#5fbf62");
    }
    if (s.thief != null) {
      // 電線から ぴょん → からあげを くわえて → にげる
      const k = s.thief;
      const [x, y] = k < 8 ? [96 + (OX + 9 - 96) * (k / 8), 70 + (OY + 10 - 70) * (k / 8)] : k < 12 ? [OX + 9, OY + 10] : [OX + 9 - (k - 12) * 8, OY + 10 - (k - 12) * 6];
      rows(k % 2 ? SPARROW_PECK : SPARROW, Math.round(x), Math.round(y), C, k >= 12);
      if (k >= 12) rect(Math.round(x) - 1, Math.round(y) + 2, 2, 1, "#c98a3a");
    }
    if (s.taiyaki) {
      rows(TAIYAKI, OX + 9, OY + 7, TAI);
      rows(TAIYAKI, s.px + 5, s.py - 4, TAI);
    }
    if (s.broom != null) {
      const bx = OX + 15;
      const by = OY + 16;
      const tip = s.broom ? 6 : 2;
      line(bx, by, bx + tip, GROUND - 3, "#a8713f");
      rect(bx + tip - 2, GROUND - 3, 5, 3, "#d9b43a");
      if (n % 2) for (const d of [-3, 4, 6]) dot(bx + tip + d, GROUND - 1 - (n % 3), "#c7bc9f"); // ほこり
    }
    if (s.box) {
      rect(s.px + 3, s.py - 4, 10, 4, "#e0503c");
      rect(s.px + 6, s.py - 5, 4, 1, "#8d99a6");
    }
    if (s.zz) {
      for (let i = 0; i < 2; i++) {
        const k = (n + i * 4) % 8;
        rows(["oooo", "..o.", ".o..", "oooo"], OX + 13 + i * 4 + (k % 2), OY - 3 - k * 2, { o: "#ffffff" });
      }
    }
  }

  // ---------- ゲンさんの 一日（ほんとうの 時刻で かわる。?hour=0〜23 で ためせる） ----------
  const hourNow = () => (params.has("hour") ? hour : new Date().getHours());
  const routineAt = (h) => (h < 5 || h >= 19 ? "nap" : h < 9 ? "taiso" : h === 12 ? "lunch" : h === 15 ? "oyatsu" : h >= 17 ? "katazuke" : "work");
  const routine = () => routineAt(hourNow());
  function story(t) {
    const r = routine();
    return r === "work" ? work(t) : DAY[r](t, { left: "lDown", right: "rDown", closed: false, px: HOME, py: GROUND - 16, carry: false, happy: false, laser: false, hammer: true, sparks: false, say: "", who: "o", sweat: false, step: false });
  }
  const DAY = {
    // あさ：ラジオ体操
    taiso(t, s) {
      const beat = t % 4;
      s.left = ["lUp", "lSide", "lDown", "lSide"][beat];
      s.right = ["rUpEmpty", "rSide", "rDown", "rSide"][beat];
      s.music = true;
      s.happy = true;
      s.py -= beat === 0 ? 3 : 0;
      s.say = t < 8 ? "あさの ラジオ体操、はじめ！" : t % 8 < 4 ? "いち、に、さん、し" : "ご、ろく、しち、はち";
      return s;
    },
    // おひる：おべんとう（スズメが からあげを ねらう）
    lunch(t, s) {
      s.bento = true;
      s.left = "lHold";
      s.right = t % 4 < 2 ? "rEat" : "rHold";
      s.happy = true;
      if (t < 20) s.say = "おひるだ！ おべんとう おべんとう♪";
      else if (t < 40) s.say = "もぐもぐ";
      else if (t < 50) Object.assign(s, { say: "あっ、スズメが……", who: "p", thief: t - 40 });
      else if (t < 56) Object.assign(s, { say: "こらっ！ おれの からあげ！", left: "lUp", right: "rUpEmpty", thief: t - 40 });
      else if (t < 70) Object.assign(s, { say: "……まあ いいか。ひとつ わけて やろう", thief: 16 });
      return s;
    },
    // 3 じ：おやつ（たいやき）
    oyatsu(t, s) {
      Object.assign(s, { taiyaki: true, left: "lDown", right: t % 6 < 3 ? "rEat" : "rHold", happy: true });
      if (t < 16) Object.assign(s, { say: "3じの おやつ！ たいやき もってきたよ", who: "p" });
      else if (t < 40) s.say = "あんこ たっぷり！";
      else if (t < 60) s.say = "しっぽまで あんこ……しあわせ";
      return s;
    },
    // ゆうがた：かたづけ（ほうきで そうじ。ピクセは どうぐを しまう）
    katazuke(t, s) {
      s.right = "rBroom";
      s.broom = t % 4 < 2 ? 0 : 1;
      s.hammer = false;
      const k = t % 32; // ピクセは ジャグの ほうへ 行ったり 来たり
      s.px = HOME + (k < 16 ? k : 32 - k) * 1.5;
      s.step = t % 2 === 1;
      s.box = true;
      if (t < 16) s.say = "そろそろ かたづけるか";
      else if (t >= 30 && t < 46) Object.assign(s, { say: "どうぐ、しまってくるね", who: "p" });
      else if (t >= 70 && t < 80) s.say = "きょうも おつかれさん";
      else if (t >= 80 && t < 90) Object.assign(s, { say: "おつかれさま！", who: "p" });
      return s;
    },
    // よる：うたたね（こっちは いつでも 晴れ だけど、ゲンさんは ねむい）
    nap(t, s) {
      Object.assign(s, { closed: true, zz: true });
      if (t < 20) Object.assign(s, { say: "しーっ。ゲンさん、うたたね ちゅう", who: "p" });
      else if (t >= 40 && t < 56) s.say = "Zzz……むにゃ";
      return s;
    },
  };
  function work(t) {
    const s = { left: "lDown", right: "rDown", closed: false, px: HOME, py: GROUND - 16, carry: false, happy: false, laser: false, hammer: true, sparks: false, say: "", who: "o", sweat: false, step: false };
    if (t < 36 || t >= 88) {
      const hit = t % 4 >= 2;
      Object.assign(s, { right: hit ? "rHit" : "rUp", hammer: false, sparks: hit, laser: t % 2 === 0, sweat: true });
      if (t >= 4 && t < 16) s.say = "トンテン カンッ！";
    } else if (t < 40) {
      Object.assign(s, { say: REST_LINE[season], sweat: true });
    } else if (t < 48) {
      Object.assign(s, { px: HOME + (t - 39) * 4, say: "まってて！", who: "p", sweat: true, step: t % 2 === 1 });
    } else if (t < 50) {
      Object.assign(s, { px: JUG - 2, carry: t === 49 });
    } else if (t < 58) {
      Object.assign(s, { px: JUG - 2 - (t - 49) * 4, carry: true, step: t % 2 === 1 });
    } else if (t < 60) {
      Object.assign(s, { px: BX + 12, py: t === 58 ? GROUND - 24 : ON_BENCH, carry: true });
    } else if (t < 61) {
      Object.assign(s, { px: BX + 12, py: ON_BENCH, right: "rReach", say: season === "winter" ? "おちゃ どうぞ！" : "おみず どうぞ！", who: "p" });
    } else if (t < 72) {
      Object.assign(s, { px: BX + 12, py: ON_BENCH, right: "rDrink", closed: true, happy: true });
      if (t < 66) s.say = "ごくっ ごくっ";
      else Object.assign(s, { say: "どうぞ どうぞ", who: "p" });
    } else if (t < 80) {
      Object.assign(s, { px: BX + 12, py: ON_BENCH, left: "lWipe", happy: true, say: "ふきふき" });
    } else if (t < 84) {
      Object.assign(s, { px: BX + 12, py: ON_BENCH - (t % 2) * 3, left: "lUp", right: "rUpEmpty", closed: true, happy: true, say: "ぷはーっ！ いきかえった！" });
    } else {
      Object.assign(s, { px: BX + 12 + (t - 83) * 3, py: t === 84 ? GROUND - 22 : GROUND - 16, say: "よし、もう ひとふんばり！" });
    }
    return s;
  }

  // ---------- ことば ----------
  // 絵の ふきだし（.say）に 出して、読み上げ用の #bubble にも 入れる
  const sayEl = scene.querySelector(".say");
  const bubble = document.getElementById("bubble");
  const NAMES = { p: "ピクセ", o: "ゲンさん", n: "トタン", h: "ハコビ", b: "バチ", l: "リフトン", a: "アームさん", r: "スズメ", s: "ソラマメ号" };
  // なかまたちの ことば（おすと じゅんばんに）
  const FRIEND_LINES = {
    h: ["よいしょ、よいしょ。\nまっすぐ しか あるけないんだ。", "この ぶひん、どこに はこぶんだっけ……", "リフトンが また つみすぎてる！"],
    b: ["バチバチッ！ ようせつ ちゅう。\nちかよると あぶないよ。", "ほんとうは 花火が すき。\nないしょ だよ。", "シートの 中？ まだ ひみつ。"],
    l: ["ピピッ。木箱、はこびます。", "つみすぎ ちゅうい……ピピッ。", "ハコビに また おこられた。ピピ……"],
    a: ["ウィーン。きょうも 点検 いじょう なし。", "よるは 星を かぞえて いるよ。\nきのうは 1024 こ。", "看板の まめ電球、1 こ とりかえた。"],
    r: ["チュン！", "チュンチュン（おべんとうの じかんは まだかな）", "チュン……（ゲンさん、からあげ おいしかった）"],
    s: ["……（ソラマメ号は、なにも いわずに ゆっくり すすんでいく）", "……（まどの おくで、なにかが 手を ふった きがした）"],
  };
  const friendIndex = {};
  let override = null; // { text, who, until }
  let bubbleTimer = 0;
  function say(text, who = "p", ticks = 18) {
    override = { text, who, until: n + ticks };
    bubble.textContent = `${NAMES[who]}「${text.replaceAll("\n", " ")}」`;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => (bubble.textContent = ""), ticks * 300 + 1000);
    if (frozen != null) setTimeout(() => { override = null; frame(); }, ticks * 300);
    frame();
  }
  const greeting =
    kaiten?.today ? (kaiten.years ? `きょうで 開店 ${kaiten.years}しゅうねん！\nいつも きてくれて ありがとう。` : "きょう、WARPIX製作所が 開店！\nきてくれて ありがとう！")
    : kaiten && !kaiten.years ? "WARPIX製作所、開店 したよ！\nくすだま、きれいでしょ？"
    : hour < 5 ? "こんばんは！ よふかしだね。\nこっちは いつでも 晴れてるよ。"
    : hour < 11 ? "おはよう！ WARPIX製作所へ ようこそ。\nきょうも ドットを くみたてるよ。"
    : hour < 19 ? "こんにちは！ WARPIX製作所へ ようこそ。\nぼくや ゲンさんを おすと おはなし できるよ。"
    : "こんばんは！ WARPIX製作所へ ようこそ。\nこっちは まだ 晴れてるよ。";
  const SEASON_LINE = {
    spring: "さくらが さいたね。\nゲンさんは はなより だんご だって。",
    summer: "なつだ！ 入道雲が でっかい！",
    autumn: "あきの 空は たかいね。\nあかとんぼが とんでる。",
    winter: "ゆきだるま、ぼくが つくったんだ。\nヘルメットも かぶせて あげた。",
  };
  const LINES = [
    ...(kaiten ? ["くすだまは、ぼくが ひもを ひっぱったんだ！\nぱかーんって ひらいたよ。", "花輪は ご近所さんからの おいわい。\nスズメたちも 見に きてる。"] : []),
    SEASON_LINE[season],
    "ここでは ドットを ひとつずつ くみたてて、\nせいひんに してるんだ。",
    "ブルーシートの 中は けんせつちゅう。\nなにが できるかは、まだ ひみつ。",
    "このヘルメット、にあう？\nあんぜん だいいち だからね。",
    "ラジカセを おしてみて。\nゲンさんの おきにいりの チップチューンが ながれるよ。",
    "したの けいじばんに、製作所だよりが はってあるよ。",
    "WARPIX LINK には、ぼくの きょうだいみたいな\nピクセが いるんだ。あいに いってみて。",
    "なかま図鑑も 見てね。\nみんなの こと、しょうかい してるよ。",
    "えんとつ、おしてみた？",
  ];
  const GEN_LINES = [
    ...(kaiten ? ["開店 おめでとう……って、おれたちの 店か。\nこれからも よろしくな！"] : []),
    "おう、いらっしゃい！ ゆっくり 見てってくれ。",
    "ピクセは よく はたらく。\nたまに つまみぐい するけどな。",
    "むかしの 道具も、未来の 機械も、\nつかいよう ってもんよ。",
    "ピコピコ した 音楽が すきでな。\nしごとが はかどるんだ。",
  ];
  const CAT_LINES = ["にゃあ", "……zzz", "ふにゃ（ひなたぼっこ ちゅう）"];
  let lineIndex = kaiten ? 0 : Math.floor(Math.random() * LINES.length);
  let genIndex = 0;
  let catIndex = 0;

  // ---------- おせる ところ ----------
  const pikuseBtn = document.getElementById("pikuse-btn");
  const ojiBtn = document.getElementById("oji-btn");
  const catBtn = document.getElementById("cat-btn");
  const friendBtns = Object.fromEntries(Object.keys(FRIEND_LINES).map((k) => [k, document.getElementById(`friend-${k}`)]));
  for (const [k, btn] of Object.entries(friendBtns))
    btn.addEventListener("click", () => {
      friendIndex[k] = (friendIndex[k] ?? -1) + 1;
      say(FRIEND_LINES[k][friendIndex[k] % FRIEND_LINES[k].length], k, 14);
    });
  const radioBtn = document.getElementById("radio-btn");
  const chimneyBtn = scene.querySelector(".hot.chimney");
  const signEl = scene.querySelector(".sign");
  // くすだまの たれまく（開店いわいの ときだけ）
  const tagEl = scene.querySelector(".kaiten-tag");
  if (kaiten) {
    tagEl.textContent = kaiten.years ? `祝${kaiten.years}周年` : "祝開店";
    canvas.setAttribute("aria-label", `${canvas.getAttribute("aria-label")} きょうは 開店いわい。看板の 下で くすだまが ひらいて「${tagEl.textContent}」の たれまく、工場の かべには 紅白幕、まえには 花輪が ふたつ。`);
  }
  let happyUntil = 0;
  let puffs = 0;
  // 地下で 石板の 伝説が わかったら、ピクセは つぎに おされた とき ちょっと しんみり
  let remember = false;
  document.addEventListener("warpix:legend", () => (remember = true));
  pikuseBtn.addEventListener("click", () => {
    happyUntil = n + 6;
    if (remember) {
      remember = false;
      say("……地下の 石板？\nなんだか、なつかしい かんじが する。");
      return;
    }
    say(LINES[lineIndex++ % LINES.length]);
  });
  ojiBtn.addEventListener("click", () => {
    if (routine() === "nap") return say("……むにゃ。あと 5ふん……", "o");
    say(GEN_LINES[genIndex++ % GEN_LINES.length], "o");
  });
  catBtn.addEventListener("click", () => say(CAT_LINES[catIndex++ % CAT_LINES.length], "n", 10));
  radioBtn.addEventListener("click", () => {
    const s = radio.next();
    radioBtn.setAttribute("aria-pressed", String(!!s));
    if (s) say(`♪ ${radio.songs.indexOf(s) + 1}きょくめ「${s.title}」`, "o", 14);
    else say("ラジカセ、とめたぞ。\nまた ききたく なったら おしてくれ。", "o", 14);
  });
  if (typeof radio !== "undefined") radio.onStop(() => radioBtn.setAttribute("aria-pressed", "false"));
  chimneyBtn.addEventListener("click", () => {
    puffs++;
    bigUntil = n + 8;
    say(puffs >= 10 ? "けほっ けほっ……\nもう けむりで まえが みえないよ！" : puffs >= 5 ? "ぽっぽー！ ぽっぽー！\nフルかどう！" : "ぽっぽー！\nきょうも げんきに かどうちゅう。");
  });

  // ---------- 画面の はばに あわせる ----------
  // 整数の 倍率に して ドットを くっきり。はみだす ぶんは 左右を けずる（まんなかは ゲンさんたち）
  let scale = 2;
  let cropX = 0;
  let visW = W;
  const cam = { x: 0, y: 0, z: 1 }; // カメラ（ふだんは cropX・まるごと。ツアーの ときは よって うごく）
  let tour = null;
  function fit() {
    const cssW = scene.clientWidth || innerWidth;
    scale = Math.max(2, Math.ceil(cssW / W));
    visW = Math.min(W, Math.ceil(cssW / scale));
    cropX = Math.max(0, Math.min(W - visW, Math.round(244 - visW / 2)));
    if (!tour) Object.assign(cam, { x: cropX, y: 0, z: 1 });
    canvas.width = visW;
    canvas.height = H;
    view.imageSmoothingEnabled = false;
    canvas.style.width = `${visW * scale}px`;
    canvas.style.height = `${H * scale}px`;
    scene.style.height = `${H * scale}px`;
    placeSign();
    place(chimneyBtn, 298, 22, 16, 70);
    place(ojiBtn, OX - 2, OY - 1, 26, 25);
    place(catBtn, 396, 110, 18, 10);
    place(radioBtn, OX - 24, GROUND - 10, 15, 11);
    place(friendBtns.b, 100, 106, 18, 18);
    place(friendBtns.a, 340, 84, 30, 24);
    place(friendBtns.r, 42, 46, 62, 14);
    lastSay = null;
  }
  const offset = () => (scene.clientWidth - visW * scale) / 2;
  // 絵の 目もり → 画面の 位置（カメラに あわせる）
  const cssX = (x) => (x - cam.x) * cam.z * scale + offset();
  const cssY = (y) => (y - cam.y) * cam.z * scale;
  function place(el, x, y, w, h) {
    const key = `${cssX(x)}|${cssY(y)}|${w * cam.z * scale}|${h * cam.z * scale}`;
    if (el.dataset.at === key) return; // かわった ときだけ 書きかえる（電池に やさしく）
    el.dataset.at = key;
    el.style.left = `${cssX(x)}px`;
    el.style.top = `${cssY(y)}px`;
    el.style.width = `${w * cam.z * scale}px`;
    el.style.height = `${h * cam.z * scale}px`;
    el.hidden = x + w < cam.x || x > cam.x + visW / cam.z; // 見えない ところの ボタンは かくす
  }
  // 看板の 見出し
  function placeSign() {
    place(signEl, 193, 61, 106, 17);
    signEl.hidden = false;
    signEl.style.fontSize = `${Math.floor((106 * scale * cam.z) / 10.5)}px`;
    if (!kaiten) return;
    place(tagEl, 256, 89, 12, 27);
    tagEl.style.fontSize = `${Math.floor((27 * scale * cam.z) / (tagEl.textContent.length + 0.6))}px`;
  }

  // ---------- 1 コマ 描く ----------
  let n = frozen ?? 0;
  let lastSay = null;
  function frame() {
    const t = n % 96;
    const s = story(t);
    if (override && n >= override.until && frozen == null) override = null;
    view.setTransform(cam.z, 0, 0, cam.z, -Math.round(cam.x * cam.z), -Math.round(cam.y * cam.z));
    g = view;
    g.drawImage(back, 0, 0);
    clouds(n);
    birds(n);
    airship(n);
    g.drawImage(mid, 0, 0);
    train(n);
    drone(n);
    smoke(n);
    g.drawImage(front, 0, 0);
    if (deco) {
      g.drawImage(deco, 0, 0);
      confetti(n);
    }
    crane(n);
    clockHands();
    antenna(n);
    signBulbs(n);
    machine(n);
    robot(n);
    sparrows(n);
    cat(n);
    bachi(n);
    hakobi(n);
    lifton(n);
    boombox(n, OX - 22, GROUND - 7, !!s.music);
    jug(JUG + 4, OY + 4);
    bench(BX, BY, n, s.sparks, s.laser);
    if (s.hammer) {
      rect(BX + 13, BY - 1, 6, 1, "#a8713f");
      rect(BX + 18, BY - 3, 2, 3, "#8d99a6");
    }
    rect(OX + 3, GROUND, 10, 1, "#c7bc9f");
    rect(s.px + 3, s.py + 15, 10, 1, "#c7bc9f");
    ojisan(OX, OY, s.left, s.right, s.closed);
    if (s.sweat) {
      const fall = n % 6;
      if (fall < 4) rect(OX + 2, OY + 6 + fall, 1, 2, "#7fd0ff");
      if ((n + 3) % 6 < 3) dot(OX + 14, OY + 7 + ((n + 3) % 6), "#7fd0ff");
    }
    if (s.closed && s.right === "rDrink") {
      const b = n % 3;
      dot(OX + 15, OY + 3 - b, "#ffffff");
      dot(OX + 17, OY + 1 - ((b + 1) % 3), "#ffffff");
    }
    pikuse(s.px, s.py - groove(), { happy: s.happy || n < happyUntil || !!groove(), step: s.step });
    if (s.carry) {
      rows(BOTTLE, s.px + 6, s.py - 5, season === "winter" ? { ...C, a: "#c9a25a" } : C); // 冬は あったかい おちゃ
      if (season === "winter" && n % 2) dot(s.px + 7 + (n % 4 < 2 ? 0 : 1), s.py - 8, "#ffffff");
    }
    if (s.laser) line(s.px + 4, s.py + 8, BX + 8, BY - 3, "#3ee8ff");
    dayExtras(s, n);
    falling(n);
    view.setTransform(1, 0, 0, 1, 0, 0);

    // おせる ピクセを 絵の ピクセに あわせる
    place(pikuseBtn, s.px, s.py, 16, 15);
    place(friendBtns.h, hakobiX(n), 146, 16, 21);
    place(friendBtns.l, liftonX(n), 150, 16, 18);
    place(friendBtns.s, airshipX(n) - 2, 39, 44, 18);

    if (tour) {
      // ツアー中は 看板が カメラに ついていき、ピクセの あんないは 下か 上の まんなかに
      placeSign();
      if (lastSay !== tour.text) {
        lastSay = tour.text;
        sayEl.textContent = tour.text;
        sayEl.classList.add("narrate");
        sayEl.classList.remove("edge-left", "edge-right", "top");
        narratePlace();
      }
      return;
    }
    sayEl.classList.remove("narrate", "top");
    // ふきだし：おされた ときの ことばが さき、なければ お話の セリフ
    const text = override ? override.text : s.say;
    const who = override ? override.who : s.who;
    const POS = { o: [OX + 8, OY - 2], n: [405, 108], h: [hakobiX(n) + 8, 150], b: [110, 106], l: [liftonX(n) + 7, 153], a: [356, 86], r: [72, 48], s: [airshipX(n) + 20, 38] };
    const [x, y] = POS[who] ?? [s.px + 8, s.py - 1];
    const key = `${text}|${x}|${y}|${scale}`;
    if (key !== lastSay) {
      lastSay = key;
      sayEl.textContent = text;
      const left = cssX(x);
      sayEl.style.left = `${left}px`;
      sayEl.style.top = `${cssY(y) - 10}px`;
      const box = scene.clientWidth;
      sayEl.classList.toggle("edge-right", left > box * 0.7);
      sayEl.classList.toggle("edge-left", left < box * 0.3);
    }
  }

  // ---------- 工場見学ツアー（ピクセが あんない。カメラが よって うごく） ----------
  // スマホでは 左右が 見えないので、ツアーで ぜんぶ 見て まわれる。さいごは 地面の 下へ
  const tourBtn = document.getElementById("tour-btn");
  const nowText = () => {
    const d = new Date();
    return `${params.has("hour") ? hour : d.getHours()}じ ${d.getMinutes()}ふん`;
  };
  // see：その コマで 紹介する もの（絵の 目もりの [x, y, w, h]）。あんないの ふきだしで かくさない
  const GEN = [OX - 2, OY - 1, 26, 25];
  const SEE = {
    // ピクセは あるきまわるので、この さき 6 秒ぶんの いどう を ぜんぶ
    pikuse: () => {
      const s = [...Array(24)].map((_, k) => story((n + k) % 96));
      const x = Math.min(...s.map((v) => v.px));
      const y = Math.min(...s.map((v) => v.py));
      return [x, y, Math.max(...s.map((v) => v.px)) + 16 - x, Math.max(...s.map((v) => v.py)) + 15 - y];
    },
    clock: [142, 69, 20, 20],
    bachi: [96, 104, 22, 22],
    sign: [193, 61, 106, 17],
    chimney: [298, 22, 16, 22],
    kusudama: [248, 81, 28, 38],
    arm: [340, 84, 30, 24],
    cat: [396, 108, 18, 12],
    lifton: [410, 150, 36, 18],
    hakobi: [98, 146, 72, 21],
    airship: () => [airshipX(n) - 2, 39, 44, 18],
    drone: [104, 80, 32, 14],
    sparrow: [42, 46, 62, 14],
    radio: [OX - 24, GROUND - 10, 15, 11],
    gen: GEN,
  };
  const seeOf = (keys) => keys.map((k) => (typeof SEE[k] === "function" ? SEE[k]() : SEE[k]));
  const STOPS = [
    { x: 232, y: 150, see: ["pikuse"], text: () => "ぼく、ピクセ！ WARPIX製作所の あんないがかり だよ。\nいっしょに 工場を 見て まわろう！" },
    { x: 152, y: 92, see: ["clock"], text: () => `これが 時計塔。はりは ほんとうの 時刻で うごくんだ。\nいまは ${nowText()}！` },
    { x: 84, y: 100, see: ["bachi"], text: () => "タワークレーンと ブルーシート。\n中では つぎの 製品を 建造中。バチが ようせつ してる！" },
    { x: 252, y: 58, see: kaiten ? ["sign", "kusudama"] : ["sign", "chimney"], text: () => (kaiten ? "屋上の 看板と、紅白の えんとつ。\n看板の 下には、開店いわいの くすだま！" : "屋上の 看板と、紅白の えんとつ。\nえんとつは おすと もくもく するよ。") },
    { x: 364, y: 116, see: ["arm"], text: () => "かまぼこ倉庫。屋根の アームさんが、\nいつも どこかを なおしてる。" },
    { x: 412, y: 138, see: ["cat", "lifton"], text: () => "自販機の 上は、ねこの トタンの いつもの 場所。\nリフトンは 木の 箱を はこんでる。" },
    { x: airshipCenter, y: 64, see: ["airship"], text: () => "空には 飛行船の ソラマメ号。\nうしろの 高架には、レトロな 電車も はしるよ。" },
    { x: 186, y: 154, see: ["radio", "gen"], text: () => "ゲンさんの ラジカセ。おすと チップチューンが ながれるよ。\nゲンさんの おきにいり！" },
    { x: 0, y: 0, end: true, see: [], text: () => "さいごは……地面の 下へ！\nだれも 知らない 世界が まってるよ。" },
  ];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // あんないの ふきだしを、紹介する ものに かさならない ほう（下 → 上）へ。行く さきの カメラで はかる
  const cssRect = ([x, y, w, h], c) => ({ left: (x - c.x) * c.z * scale + offset(), top: (y - c.y) * c.z * scale, width: w * c.z * scale, height: h * c.z * scale });
  const overlap = (a, b) => Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
  function narratePlace() {
    const rects = (tour.see ?? []).map((r) => cssRect(r, tour.to));
    const w = sayEl.offsetWidth;
    const h = sayEl.offsetHeight;
    const left = (scene.clientWidth - w) / 2;
    const cost = (top) => rects.reduce((sum, r) => sum + overlap(r, { left: left - 4, top: top - 4, width: w + 12, height: h + 12 }), 0); // ふちの かげも
    // 上に だす ときは、右上の ツアーの ボタンに かからない ところまで さげる
    const btn = tourBtn.getBoundingClientRect();
    const box = scene.getBoundingClientRect();
    const hit = btn.left - box.left < left + w && btn.right - box.left > left;
    const top = hit ? Math.ceil(btn.bottom - box.top) + 10 : 14;
    const bottom = cost(scene.clientHeight - 14 - h);
    sayEl.style.setProperty("--top", `${top}px`);
    sayEl.classList.toggle("top", bottom > 0 && cost(top) < bottom);
  }
  function camFor(stop) {
    if (stop.end) return { x: cropX, y: 0, z: 1 };
    const z = visW < 300 ? 1 : 2; // スマホは もう 大きいので、よらずに 横へ うごく だけ
    const vw = visW / z;
    const vh = H / z;
    const x = typeof stop.x === "function" ? stop.x() : stop.x;
    return { x: clamp(x - vw / 2, 0, W - vw), y: clamp(stop.y - vh * 0.55, 0, H - vh), z };
  }
  let tourTimer = 0;
  let raf = 0;
  function tourGo(i) {
    if (i >= STOPS.length) return tourEnd(true);
    const text = STOPS[i].text();
    const dur = reduced ? 0 : 1100;
    tour = { i, text, from: { ...cam }, to: camFor(STOPS[i]), start: performance.now(), dur };
    tour.see = seeOf(STOPS[i].see);
    bubble.textContent = `ピクセ「${text.replaceAll("\n", " ")}」`;
    clearTimeout(tourTimer);
    tourTimer = setTimeout(() => tourGo(i + 1), dur + 2600 + text.length * 55);
    frame();
    if (!raf) raf = requestAnimationFrame(tourLoop);
  }
  // うごいている あいだだけ なめらかに 描く（ツアーが おわったら とまる）
  function tourLoop(now) {
    raf = 0;
    if (!tour) return;
    const p = tour.dur ? Math.min(1, Math.max(0, now - tour.start) / tour.dur) : 1;
    const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
    for (const k of ["x", "y", "z"]) cam[k] = tour.from[k] + (tour.to[k] - tour.from[k]) * e;
    frame();
    if (p < 1) raf = requestAnimationFrame(tourLoop);
  }
  function tourStart() {
    scene.classList.add("touring");
    tourBtn.setAttribute("aria-pressed", "true");
    tourBtn.textContent = "■ ツアーを おわる";
    tourGo(0);
  }
  function tourEnd(dive) {
    clearTimeout(tourTimer);
    tour = null;
    scene.classList.remove("touring");
    tourBtn.setAttribute("aria-pressed", "false");
    tourBtn.textContent = "▶ 見学ツアー";
    lastSay = null;
    fit();
    frame();
    if (dive) document.getElementById("hollow-cave").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }
  tourBtn.addEventListener("click", () => (tour ? tourEnd(false) : tourStart()));

  // ---------- 図鑑から 会いに いく（絵まで もどって、カメラが その なかまに よる） ----------
  const MEET = {
    gen: { x: () => OX + 8, y: 150, see: ["gen"], text: () => "ゲンさん「おう、ここだ ここだ！ ゆっくり 見てってくれ。」" },
    pikuse: { x: () => HOME + 8, y: 150, see: ["pikuse"], text: () => "ピクセ「ぼくは ここ！ ゲンさんの となりで はたらいてるよ。」" },
    hakobi: { x: () => hakobiX(n) + 8, y: 150, see: ["hakobi"], text: () => "ハコビ「よいしょ、よいしょ。時計塔の まえを 行ったり 来たり してるよ。」" },
    bachi: { x: () => 104, y: 112, see: ["bachi"], text: () => "バチ「足場の 上だよ！ バチバチッ！」" },
    arm: { x: () => 360, y: 100, see: ["arm"], text: () => "アームさん「ウィーン。倉庫の 屋根から こんにちは。」" },
    lifton: { x: () => liftonX(n) + 8, y: 150, see: ["lifton"], text: () => "リフトン「ピピッ。自販機の まえで 木箱を はこんでいます。」" },
    drone: { x: () => 120, y: 86, see: ["drone"], text: () => "ブンブンは ときどき この 空を とおるよ。すこし まってみてね。" },
    airship: { x: airshipCenter, y: 50, see: ["airship"], text: () => "ソラマメ号は、いまも 空の どこかを ゆっくり とんでいる。" },
    cat: { x: () => 405, y: 116, see: ["cat"], text: () => "トタン「……にゃ。（自販機の 上で ひるね ちゅう）」" },
    sparrow: { x: () => 70, y: 54, see: ["sparrow"], text: () => "スズメ「チュン！ 電線の 上から 見はってるよ。」" },
  };
  function meet(key) {
    const m = MEET[key];
    if (!m) return false;
    scene.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    const text = m.text();
    const dur = reduced ? 0 : 1100;
    scene.classList.add("touring");
    tour = { i: -1, text, from: { ...cam }, to: camFor(m), start: performance.now() + (reduced ? 0 : 400), dur };
    tour.see = seeOf(m.see);
    bubble.textContent = text;
    clearTimeout(tourTimer);
    tourTimer = setTimeout(() => tourEnd(false), dur + 3600 + text.length * 50);
    frame();
    if (!raf) raf = requestAnimationFrame(tourLoop);
    return true;
  }
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && tour) tourEnd(false);
  });

  // ---------- SNS の 入口（開店の あさ 7じから） ----------
  for (const e of document.querySelectorAll(".after-open")) e.hidden = !opened;
  for (const e of document.querySelectorAll(".before-open")) e.hidden = opened;

  // ---------- 展示室の ピクセ：おすと ワープあなに とびこんでから warpix-link へ ----------
  const warp = document.querySelector(".ex-warp");
  warp.addEventListener("click", (e) => {
    if (reduced || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; // 新しい タブ などは ふつうの リンクの まま
    e.preventDefault();
    warp.classList.add("warping");
    setTimeout(() => (location.href = warp.href), 750);
  });
  addEventListener("pageshow", () => warp.classList.remove("warping")); // もどる ボタンで もどった とき

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
    items = items.filter((x) => x.date && x.title).sort((a, b) => b.date.localeCompare(a.date));
    list.replaceChildren(
      ...items.map((x) => {
        const li = el("li");
        const time = el("time", null, x.date.replaceAll("-", "."));
        time.dateTime = x.date;
        li.append(time);
        if (isNew(x.date)) li.append(el("span", "n-new", "NEW"));
        const title = x.url ? el("a", "n-title", x.title) : el("span", "n-title", x.title);
        if (x.url) title.href = x.url;
        li.append(title);
        if (x.body) li.append(el("p", "n-body", x.body));
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

  // ---------- なかま図鑑と かざりの え ----------
  // data-sprite の 名前で、ページの あちこちに キャラクターを 描く
  const portraits = {
    pikuse: [PIKUSE, PIKU],
    hakobi: [PIKUSE, HAKOBI],
    bachi: [withPatch(PIKUSE, VISOR), BACHI],
    gen: [OJI, C],
    cat: [CAT, C],
    sparrow: [SPARROW, C],
    lifton: [LIFTON, C],
  };
  const drawn = {
    arm: () => paper(() => {
      rect(10, 26, 10, 4, "#5f6b78");
      line(15, 26, 8, 14, "#f0f2f5", 2);
      line(8, 14, 20, 6, "#f0f2f5", 2);
      rect(14, 25, 3, 3, "#3ee8ff");
      rect(7, 13, 3, 3, "#3ee8ff");
      rect(20, 5, 3, 2, C.o);
      dot(24, 4, "#fff3a0");
      dot(25, 7, "#ff9a3c");
    }, 30, 30),
    drone: () => paper(() => {
      const x = 2;
      const y = 6;
      rect(x, y, 12, 2, "#56687a");
      rect(x + 4, y - 1, 4, 1, "#3ee8ff");
      rect(x - 1, y - 2, 4, 1, C.o);
      rect(x + 9, y - 2, 4, 1, C.o);
      line(x + 6, y + 2, x + 6, y + 4, C.o);
      rect(x + 3, y + 5, 7, 5, "#c99a5b");
      rect(x + 3, y + 7, 7, 1, "#a87a40");
    }, 16, 16),
    airship: () => paper(() => {
      oval(22, 8, 20, 6, C.o);
      oval(22, 8, 19, 5, "#eef1f4");
      rect(5, 7, 34, 2, "#e0503c");
      oval(24, 5, 12, 1, "#ffffff");
      rect(1, 2, 4, 5, "#e0503c");
      rect(1, 10, 4, 4, "#e0503c");
      rect(17, 14, 10, 3, "#56687a");
      rect(18, 15, 2, 1, "#9fe3ff");
      rect(22, 15, 2, 1, "#9fe3ff");
    }, 44, 18),
  };
  for (const c of document.querySelectorAll("canvas[data-sprite]")) {
    const name = c.dataset.sprite;
    const scaleOf = Number(c.dataset.scale || 4);
    if (portraits[name]) drawOn(c, portraits[name][0], scaleOf, portraits[name][1]);
    else if (drawn[name]) {
      const src = drawn[name]();
      c.width = src.width * scaleOf;
      c.height = src.height * scaleOf;
      const t = c.getContext("2d");
      t.imageSmoothingEnabled = false;
      t.drawImage(src, 0, 0, c.width, c.height);
    }
  }

  // ---------- 工場の とけい ----------
  // うごく ものは ぜんぶ この 1 つの とけいで いっしょに 1 コマ すすめる。
  // ばらばらに うごかすと 画面を なんども 描きなおして、電池を つかうから。
  const lamp = document.querySelector(".lamp");
  const others = []; // ほかの 絵（地下の 世界 など）も この とけいで うごかす
  function tick() {
    if (document.hidden) return;
    n++;
    if (scene.getBoundingClientRect().bottom > 0) frame(); // 地下を 見ている あいだは 地上を 描かない
    lamp.classList.toggle("off", n % 4 >= 2);
    for (const fn of others) fn(n);
  }

  // ---------- はじまり ----------
  fit();
  frame();
  say(greeting, "p", 20);
  let resizeTimer = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fit();
      frame();
    }, 120);
  });
  if (frozen == null) setInterval(tick, 300);

  // 地下の 世界（chika.js）が つかう 道具
  const tools = {
    use: (ctx) => (g = ctx),
    rect, dot, rows, patch, disc, oval, line, seeded, paper, drawOn,
    C, PIKU, PIKUSE,
    scale: () => scale,
    heroBottom: () => scene.getBoundingClientRect().bottom + scrollY,
    onTick: (fn) => others.push(fn),
    reduced: frozen != null,
  };

  // テスト用：いまの あんないの ふきだしと、紹介している もの（どちらも 絵の 中の 画面の 位置）
  const tourView = () => {
    if (!tour) return null;
    const a = sayEl.getBoundingClientRect();
    const b = scene.getBoundingClientRect();
    const c = tourBtn.getBoundingClientRect();
    const rel = (r) => ({ left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height });
    return { say: rel(a), btn: rel(c), see: tour.see.map((r) => cssRect(r, cam)), w: b.width, h: b.height };
  };

  return { say, hour, season, meet, tour: () => (tour ? { i: tour.i, z: cam.z } : null), tourGo: (i) => tourGo(i), tourView, stops: STOPS.length, newsReady, lines: LINES, genLines: GEN_LINES, pikuse: PIKUSE, story, frame: () => n, tools };
})();
