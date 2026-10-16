// ---------- 青空の 町工場（ためしの 1 場面） ----------
// 192×112 ドットの 絵を、工場の とけい（0.3 秒ごとの tick）で 1 コマずつ 描きなおす。
// おじさんが トンテンカン → ピクセが 水を とってくる → ごくごく → 汗を ふく → ぷはー → また しごと。
// ?t=0〜95 で その コマに とめる。動きを へらす せっていでは とまった 1 枚。
const aozora = (() => {
  const W = 192;
  const H = 112;
  const canvas = document.querySelector(".scene canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const sayEl = document.querySelector(".scene .say");
  const params = new URLSearchParams(location.search);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frozen = params.has("t") ? Number(params.get("t")) : reduced ? 64 : null;

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
    y: "#ffd84a", // ヘルメットの 黄色
    Y: "#d9a61e",
    w: "#f4f4f4", // ピクセの からだ
    P: "#ff8fb8", // ピクセの ほっぺ
    c: "#3ee8ff", // 未来の 光
    a: "#7fd0ff", // 水
    m: "#8d99a6", // はがね
    M: "#5f6b78",
    h: "#a8713f", // 木
  };
  const SKY = ["#3d9bf0", "#4ea7f4", "#5fb2f7", "#76bff9", "#8ccbfb", "#a6d8fd", "#bfe4ff"];

  // ---------- ちいさな 道具 ----------
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const dot = (x, y, c) => rect(x, y, 1, 1, c);
  function rows(list, x, y, map = C) {
    list.forEach((row, j) =>
      [...row].forEach((ch, i) => {
        if (map[ch]) dot(x + i, y + j, map[ch]);
      })
    );
  }
  const patch = (list, x, y) => list.forEach(([dx, dy, row]) => rows([row], x + dx, y + dy));
  const disc = (cx, cy, r, c) => {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y + r * 0.6));
      rect(cx - half, cy + y, half * 2 + 1, 1, c);
    }
  };
  const line = (x0, y0, x1, y1, c, size = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) rect(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, size, size, c);
  };

  // ---------- おじさん（16×23。うでは あとから かさねる） ----------
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
    // かなづちを ふりあげる
    rUp: [[14, 12, "uo"], [14, 11, "uuo"], [15, 10, "uuo"], [16, 9, "ss"], [16, 8, "ss"], [17, 3, "h"], [17, 4, "h"], [17, 5, "h"], [17, 6, "h"], [17, 7, "h"], [15, 1, "mmmmm"], [15, 2, "MMMMM"]],
    // かなづちを ふりおろす
    rHit: [[14, 12, "uuu"], [14, 13, "uuuss"], [19, 13, "hh"], [21, 11, "mM"], [21, 12, "mM"], [21, 13, "mM"], [21, 14, "mM"], [21, 15, "mM"]],
    // ピクセから 水を うけとる
    rReach: [[14, 12, "uuu"], [14, 13, "uuuuss"]],
    // ごくごく（ボトルを 口に）
    rDrink: [[14, 12, "uo"], [14, 11, "uo"], [13, 10, "ss"], [12, 9, "ss"], [8, 10, "W"], [9, 9, "aa"], [10, 8, "aaa"], [11, 7, "aaa"], [12, 6, "aa"], [13, 5, "W"]],
    // タオルで おでこを ふく
    lWipe: [[0, 12, "ou"], [0, 11, "ou"], [1, 10, "us"], [2, 7, "ttttt"], [2, 8, "tss"]],
    // ばんざい
    lUp: [[0, 12, "ou"], [-1, 11, "ou"], [-2, 10, "ou"], [-2, 9, "ss"], [-2, 8, "ss"]],
    rUpEmpty: [[14, 12, "uo"], [15, 11, "uo"], [16, 10, "uo"], [16, 9, "ss"], [16, 8, "ss"]],
  };
  function ojisan(x, y, left, right, closed) {
    rows(OJI, x, y);
    if (closed) patch(EYES_CLOSED, x, y);
    patch(ARM[left], x, y);
    patch(ARM[right], x, y);
  }

  // ---------- ピクセ（ホームページの 黄色い ヘルメット版） ----------
  const PIKUSE = [
    ".......PP.......",
    ".......ww.......",
    ".......ww.......",
    "....oyyyyyyo....",
    "...oyywyyyyyo...",
    "..oyyyyyyyyyyo..",
    "oyyyyyyyyyyyyyyo",
    ".owwcowwwwcowwo.",
    ".owwoowwwwoowwo.",
    ".owPPwwwwwwPPwo.",
    ".owwwwwoowwwwwo.",
    ".owwwwwwwwwwwwo.",
    "..owwwwwwwwwwo..",
    "...oowwwwwwoo...",
    "....oo....oo....",
    "................",
  ];
  const PIKUSE_HAPPY = [[1, 7, "owwowwwwwwowwo"], [1, 8, "owowowwwwowowo"]];
  function pikuse(x, y, happy) {
    rows(PIKUSE, x, y);
    if (happy) patch(PIKUSE_HAPPY, x, y);
  }
  const BOTTLE = [".W.", "aaa", "aaa", "aaa", "aaa"];

  // ---------- 空と 雲 ----------
  function sky() {
    const band = 10;
    SKY.forEach((c, i) => rect(0, i * band, W, band + 1, c));
    // さかいめを ドットで まぜる
    for (let i = 1; i < SKY.length; i++)
      for (let x = (i % 2) * 2; x < W; x += 4) dot(x, i * band, SKY[i - 1]);
    rect(0, SKY.length * band, W, 40, SKY[SKY.length - 1]);
  }
  function sun(n) {
    const cx = 170;
    const cy = 15;
    if (n % 4 < 2) {
      for (const [dx, dy] of [[-13, 0], [13, 0], [0, -12], [0, 12], [-9, -9], [9, -9], [-9, 9], [9, 9]])
        rect(cx + dx - 1, cy + dy - 1, 2, 2, "#fff3a0");
    }
    disc(cx, cy, 8, "#ffd84a");
    disc(cx, cy, 6, "#fff3a0");
  }
  const CLOUDS = [
    { x: 8, y: 10, s: 1, v: 0.2 },
    { x: 96, y: 4, s: 0.8, v: 0.3 },
    { x: 140, y: 30, s: 0.6, v: 0.45 },
  ];
  function cloud(x, y, s) {
    const puff = (dx, dy, r) => disc(x + dx * s, y + dy * s, Math.round(r * s), "#d3e9fb");
    const puffW = (dx, dy, r) => disc(x + dx * s, y + dy * s - 1, Math.round(r * s), "#ffffff");
    for (const f of [puff, puffW]) {
      f(8, 8, 6);
      f(17, 5, 8);
      f(27, 8, 6);
      f(34, 10, 4);
    }
    rect(x + 4 * s, y + 10 * s, 32 * s, 4 * s, "#ffffff");
    rect(x + 4 * s, y + 14 * s, 32 * s, 1, "#d3e9fb");
  }
  function clouds(n) {
    for (const c of CLOUDS) {
      const span = W + 50;
      const x = ((c.x + n * c.v) % span) - 46;
      cloud(Math.floor(x), c.y, c.s);
    }
  }

  // ---------- とおくの 町 ----------
  function town() {
    rect(0, 64, W, 24, "#a9cbe6");
    // やま
    for (let x = 0; x < W; x++) {
      const h = Math.round(6 + 4 * Math.sin(x / 17) + 3 * Math.sin(x / 7 + 1));
      rect(x, 60 - h, 1, h + 6, "#b9d6ec");
    }
    rect(0, 66, W, 22, "#a1c3df");
    // いえ（さんかくの 屋根）
    const house = (x, w, h, roof) => {
      rect(x, 86 - h, w, h, "#93b9da");
      for (let i = 0; i < w / 2 + 1; i++) rect(x + i - 1, 86 - h - i + Math.floor(w / 2) - Math.floor(w / 2), w - i * 2 + 2, 1, roof);
    };
    house(2, 10, 12, "#86acd0");
    house(14, 12, 9, "#86acd0");
    house(166, 12, 10, "#86acd0");
    house(180, 10, 14, "#86acd0");
    // 給水塔
    rect(180, 52, 10, 8, "#86acd0");
    rect(181, 50, 8, 2, "#86acd0");
    line(181, 60, 179, 72, "#86acd0");
    line(188, 60, 190, 72, "#86acd0");
    line(181, 64, 188, 68, "#86acd0");
  }

  // ---------- 電柱と 電線 ----------
  function pole() {
    rect(16, 26, 3, 62, "#7a6a5c");
    rect(10, 30, 15, 2, "#5f5247");
    rect(13, 36, 9, 2, "#5f5247");
    dot(11, 29, C.W);
    dot(23, 29, C.W);
    // 電線（ゆるく たれる）
    for (const [y0, sag] of [[30, 10], [36, 8]]) {
      for (let x = 24; x < W; x++) {
        const t = (x - 24) / (W - 24);
        dot(x, y0 + Math.round(sag * 4 * t * (1 - t)), "#3d4656");
      }
    }
  }

  // ---------- 工場 ----------
  function factory(n) {
    // のこぎり屋根（たての 面は ガラス）
    const x0 = 28;
    const x1 = 164;
    const teeth = 5;
    const P = (x1 - x0) / teeth;
    for (let x = x0; x < x1; x++) {
      const t = (x - x0) % P;
      const top = 34 + Math.floor((t / P) * 12);
      rect(x, top, 1, 47 - top, t < 3 ? "#9fe3ff" : "#56687a");
      dot(x, top, t < 3 ? "#e6f8ff" : "#7d93a8");
    }
    rect(x0, 46, x1 - x0, 2, C.o);
    // トタンの かべ
    rect(x0, 48, x1 - x0, 40, "#c9d1d9");
    for (let x = x0 + 1; x < x1; x += 3) rect(x, 48, 1, 40, "#b3bdc7");
    // さびの すじ
    for (const [x, len] of [[34, 8], [61, 5], [131, 9], [150, 6]]) {
      rect(x, 48, 2, len, "#c4683f");
      rect(x, 48 + len, 1, 2, "#c4683f");
    }
    rect(x0, 86, x1 - x0, 2, "#98a3ae");
    // まど（左右）
    for (const wx of [36, 54, 132, 148]) {
      rect(wx - 1, 57, 12, 11, C.o);
      rect(wx, 58, 10, 9, "#9fe3ff");
      rect(wx, 62, 10, 1, C.o);
      rect(wx + 5, 58, 1, 9, C.o);
      dot(wx + 1, 59, "#e6f8ff");
      dot(wx + 2, 59, "#e6f8ff");
    }
    // 大きな シャッター（あいている。中では 未来の 機械が 光る）
    rect(78, 54, 44, 34, C.o);
    rect(80, 56, 40, 32, "#33404f");
    for (let y = 56; y < 63; y += 2) rect(80, y, 40, 1, "#8d99a6");
    // 中の 機械
    rect(88, 68, 24, 20, "#4a5b6e");
    rect(90, 70, 20, 8, "#1e2b38");
    const lit = n % 3;
    for (let i = 0; i < 6; i++) rect(91 + i * 3, 72, 2, 2, i % 3 === lit ? "#3ee8ff" : "#1aa6c4");
    rect(92, 75, 16, 1, n % 2 ? "#3ee8ff" : "#1aa6c4");
    rect(98, 64, 4, 4, "#5f6b78");
    rect(99, 62, 2, 2, n % 4 < 2 ? "#ff9a3c" : "#ffd84a");
  }

  // ---------- えんとつ（紅白）と けむり ----------
  function chimney(n) {
    for (let y = 12; y < 46; y++) rect(40, y, 7, 1, Math.floor((y - 12) / 6) % 2 ? "#f7f7f2" : "#e0503c");
    rect(39, 12, 9, 2, C.o);
    for (let i = 0; i < 3; i++) {
      const phase = (n + i * 4) % 12;
      const r = 2 + Math.floor(phase / 3);
      disc(43 + Math.floor(phase * 0.9), 9 - phase * 1.6, r, phase > 8 ? "#e9f3fb" : "#ffffff");
    }
  }

  // ---------- 屋上の 看板 ----------
  function sign(n) {
    // あし
    rect(70, 31, 2, 6, C.o);
    rect(128, 31, 2, 6, C.o);
    rect(98, 31, 2, 4, C.o);
    rect(62, 18, 76, 14, "#e0503c");
    rect(63, 19, 74, 12, "#fff8e7");
    // まめ電球（じゅんばんに 光る）
    for (let i = 0; i < 10; i++) dot(65 + i * 8, 17, (i + n) % 3 === 0 ? "#fff3a0" : "#ffd84a");
  }

  // ---------- ロボットアーム（看板を 溶接して なおしている） ----------
  const POSES = [
    [-2.0, -0.9], // 看板へ
    [-2.2, -0.6],
    [-1.6, -1.6], // 上へ
    [-1.2, 0.6], // ひとやすみ
  ];
  function robot(n) {
    const bx = 150;
    const by = 36;
    rect(bx - 4, by, 9, 4, "#5f6b78");
    rect(bx - 3, by - 1, 7, 1, "#8d99a6");
    const pose = POSES[Math.floor(n / 6) % POSES.length];
    const ex = bx + Math.round(Math.cos(pose[0]) * 11);
    const ey = by + Math.round(Math.sin(pose[0]) * 11);
    const hx = ex + Math.round(Math.cos(pose[0] + pose[1]) * 9);
    const hy = ey + Math.round(Math.sin(pose[0] + pose[1]) * 9);
    line(bx, by, ex, ey, "#f0f2f5", 2);
    line(ex, ey, hx, hy, "#f0f2f5", 2);
    rect(bx - 1, by - 1, 3, 3, "#3ee8ff");
    rect(ex - 1, ey - 1, 3, 3, "#3ee8ff");
    rect(hx - 1, hy - 1, 3, 2, C.o);
    // 看板に とどいている ときは 火花
    if (hx <= 140 && n % 2 === 0) {
      for (const [dx, dy] of [[-2, -1], [-1, 2], [-3, 1], [0, -2]]) dot(hx + dx, hy + dy, n % 4 ? "#fff3a0" : "#ff9a3c");
    }
  }

  // ---------- ドローン（ときどき 荷物を はこぶ） ----------
  function drone(n) {
    const t = n % 96;
    if (t > 70) return;
    const x = -16 + t * 3;
    const y = 40 + (t % 4 < 2 ? 0 : 1);
    rect(x, y, 12, 2, "#56687a");
    rect(x + 4, y - 1, 4, 1, "#3ee8ff");
    const blade = t % 2 ? 4 : 2;
    rect(x - blade / 2 + 1, y - 2, blade, 1, C.o);
    rect(x + 11 - blade / 2, y - 2, blade, 1, C.o);
    line(x + 6, y + 2, x + 6, y + 4, C.o);
    rect(x + 3, y + 5, 7, 5, "#c99a5b");
    rect(x + 3, y + 7, 7, 1, "#a87a40");
  }

  // ---------- じめん・自動販売機・ウォータージャグ ----------
  function ground() {
    rect(0, 88, W, 24, "#ddd3bb");
    rect(0, 88, W, 1, "#c7bc9f");
    for (const [x, y] of [[20, 96], [60, 106], [150, 104], [176, 95], [110, 108]]) {
      rect(x, y, 4, 1, "#c7bc9f");
      dot(x + 4, y + 1, "#c7bc9f");
    }
    // ざっそう
    for (const x of [6, 9, 30, 160, 186]) {
      dot(x, 87, "#5fbf62");
      dot(x + 1, 86, "#3f9446");
      dot(x + 2, 87, "#5fbf62");
    }
    rect(0, 109, W, 3, "#c7bc9f");
  }
  function vending(n) {
    const x = 168;
    const y = 62;
    rect(x - 1, y - 1, 16, 32, C.o);
    rect(x, y, 14, 30, "#e0503c");
    rect(x + 2, y + 2, 10, 12, n % 8 === 0 ? "#fffbe0" : "#fff3c4");
    const cans = ["#3c8ce0", "#3fa45a", "#ff9a3c", "#e0503c", "#7a5be0"];
    for (let i = 0; i < 5; i++) rect(x + 3 + (i % 3) * 3, y + 4 + Math.floor(i / 3) * 5, 2, 3, cans[i]);
    rect(x + 2, y + 17, 10, 3, "#2b2f3a");
    rect(x + 2, y + 23, 10, 4, "#b23a2a");
  }
  function jug(x, y) {
    // 木の 箱の うえに オレンジの ジャグ
    rect(x - 2, y + 10, 16, 9, "#a8713f");
    rect(x - 2, y + 13, 16, 1, "#7a4f2b");
    rect(x - 1, y - 1, 14, 12, C.o);
    rect(x, y, 12, 10, "#ff9a3c");
    rect(x, y + 3, 12, 2, "#ffffff");
    rect(x + 3, y - 3, 6, 2, "#f7f7f2");
    rect(x + 12, y + 7, 2, 2, "#5f6b78");
  }

  // ---------- 作業台と つくっている もの ----------
  function bench(x, y, n, sparking, glow) {
    rect(x, y, 22, 3, "#a8713f");
    rect(x, y + 3, 22, 1, "#7a4f2b");
    rect(x + 1, y + 4, 2, 11, "#7a4f2b");
    rect(x + 19, y + 4, 2, 11, "#7a4f2b");
    rect(x + 1, y + 10, 20, 1, "#7a4f2b");
    // できかけの きかい（ピクセが 光で しらべる）
    rect(x + 3, y - 4, 7, 4, "#8d99a6");
    rect(x + 4, y - 5, 5, 1, "#5f6b78");
    rect(x + 5, y - 3, 3, 2, glow ? "#3ee8ff" : "#1aa6c4");
    if (sparking) {
      for (const [dx, dy] of [[-2, -7], [1, -9], [4, -8], [7, -6], [-1, -5]]) dot(x + 3 + dx, y + dy + (n % 2), n % 3 ? "#fff3a0" : "#ff9a3c");
    }
  }

  // ---------- お話の 流れ（96 コマ ≒ 29 秒で ひとまわり） ----------
  const OX = 70; // おじさんの 位置
  const OY = 78;
  const BX = OX + 17; // 作業台
  const BY = OY + 16;
  const HOME = BX + 24; // ピクセの いつもの 場所
  const JUG = 138;
  const GROUND = 101;
  function story(t) {
    const s = { left: "lDown", right: "rDown", closed: false, px: HOME, py: GROUND - 16, carry: false, happy: false, laser: false, hammerOnBench: true, sparks: false, say: "", sweat: false };
    const work = t < 36 || t >= 88;
    if (work) {
      const hit = t % 4 >= 2;
      s.right = hit ? "rHit" : "rUp";
      s.hammerOnBench = false;
      s.sparks = hit;
      s.laser = t % 2 === 0;
      s.sweat = true;
      if (t >= 4 && t < 16) s.say = "トンテン カンッ！";
    } else if (t < 40) {
      s.say = "ふう、あっついなあ";
      s.sweat = true;
    } else if (t < 48) {
      s.px = HOME + (t - 39) * 4; // ジャグへ
      s.say = "ピクセ「まってて！」";
      s.sweat = true;
    } else if (t < 50) {
      s.px = JUG - 2;
      s.carry = t === 49;
    } else if (t < 58) {
      s.px = JUG - 2 - (t - 49) * 4;
      s.carry = true;
    } else if (t < 60) {
      // 作業台に ぴょん
      s.px = BX + 12;
      s.py = t === 58 ? GROUND - 24 : BY - 15;
      s.carry = true;
    } else if (t < 61) {
      s.px = BX + 12;
      s.py = BY - 15;
      s.right = "rReach";
      s.say = "ピクセ「おみず どうぞ！」";
    } else if (t < 72) {
      s.px = BX + 12;
      s.py = BY - 15;
      s.right = "rDrink";
      s.closed = true;
      s.happy = true;
      s.say = t < 66 ? "ごくっ ごくっ" : "ピクセ「どうぞ どうぞ」";
    } else if (t < 80) {
      s.px = BX + 12;
      s.py = BY - 15;
      s.left = "lWipe";
      s.happy = true;
      s.say = "ふきふき";
    } else if (t < 84) {
      s.px = BX + 12;
      s.py = BY - 15 - (t % 2) * 3;
      s.left = "lUp";
      s.right = "rUpEmpty";
      s.closed = true;
      s.happy = true;
      s.say = "ぷはーっ！ いきかえった！";
    } else {
      s.px = BX + 12 + (t - 83) * 3;
      s.py = t === 84 ? GROUND - 22 : GROUND - 16;
      s.say = "よし、もう ひとふんばり！";
    }
    return s;
  }

  // ---------- 1 コマ 描く ----------
  let n = frozen ?? 0;
  function frame() {
    const t = n % 96;
    const s = story(t);
    sky();
    sun(n);
    clouds(n);
    town();
    drone(n);
    pole();
    chimney(n);
    factory(n);
    sign(n);
    robot(n);
    ground();
    vending(n);
    jug(JUG + 4, 82);
    bench(BX, BY, n, s.sparks, s.laser);
    if (s.hammerOnBench) {
      rect(BX + 13, BY - 1, 6, 1, "#a8713f");
      rect(BX + 18, BY - 3, 2, 3, "#8d99a6");
    }
    // かげ
    rect(OX + 3, GROUND + 0, 10, 1, "#c7bc9f");
    rect(s.px + 3, s.py + 15, 10, 1, "#c7bc9f");
    ojisan(OX, OY, s.left, s.right, s.closed);
    if (s.sweat) {
      const fall = n % 6;
      if (fall < 4) {
        dot(OX + 2, OY + 6 + fall, "#7fd0ff");
        dot(OX + 2, OY + 7 + fall, "#7fd0ff");
      }
      if ((n + 3) % 6 < 3) dot(OX + 14, OY + 7 + ((n + 3) % 6), "#7fd0ff");
    }
    if (s.closed && s.right === "rDrink") {
      // ごくごくの あわ
      const b = n % 3;
      dot(OX + 15, OY + 3 - b, "#ffffff");
      dot(OX + 17, OY + 1 - ((b + 1) % 3), "#ffffff");
    }
    pikuse(s.px, s.py, s.happy);
    if (s.carry) rows(BOTTLE, s.px + 6, s.py - 5);
    if (s.laser) line(s.px + 4, s.py + 8, BX + 8, BY - 3, "#3ee8ff");
    // ふきだしは おじさんか ピクセの うえに
    const who = s.say.startsWith("ピクセ") ? s.px + 8 : OX + 8;
    if (sayEl.textContent !== s.say) sayEl.textContent = s.say;
    sayEl.style.left = `${(who / W) * 100}%`;
  }

  frame();
  if (frozen == null) {
    setInterval(() => {
      if (document.hidden) return;
      n++;
      frame();
    }, 300);
  }
  return { frame, story };
})();
