// ---------- WARPIX製作所：ゲンさんの ラジカセ（チップチューン） ----------
// 音の ファイルは つかわず、ブラウザの 中で ピコピコの 音を つくる（Web Audio）。
// 鳴るのは ラジカセを おした ときだけ。おす たびに 1 きょくめ → 2 → 3 → とめる。
// タブを かくしたら とめる。ブラウザには なにも 保存しない。
const radio = (() => {
  // 1 こ ＝ 8 分音符。「-」は のばす、「.」は やすみ。ドラムは k（バスドラ）・s（スネア）・h（ハイハット）
  const SONGS = [
    {
      title: "こうじょうの あさ",
      bpm: 132,
      lead: [
        "C5 E5 G5 E5 C6 - G5 -", "A5 G5 E5 C5 D5 - . .", "F5 A5 C6 A5 G5 - E5 -", "D5 E5 F5 D5 C5 - - .",
        "C5 E5 G5 E5 C6 - G5 -", "A5 G5 E5 C5 D5 - . .", "F5 E5 D5 F5 E5 D5 C5 E5", "D5 - G4 - C5 - - .",
      ],
      bass: [
        "C3 . G3 . C3 . G3 .", "A2 . E3 . A2 . E3 .", "F2 . C3 . F2 . C3 .", "G2 . D3 . G2 . D3 .",
        "C3 . G3 . C3 . G3 .", "A2 . E3 . A2 . E3 .", "F2 . C3 . F2 . C3 .", "G2 . G2 . C3 . . .",
      ],
      drum: "k h s h k h s h",
    },
    {
      title: "ゲンさんの ひとやすみ",
      bpm: 100,
      lead: [
        "F5 - A5 - C6 - A5 G5", "F5 - - - D5 - C5 -", "D5 - F5 - A5 - G5 F5", "E5 - - - G5 - - -",
        "F5 - A5 - C6 - A5 G5", "F5 - - - A5 - C6 -", "D6 - C6 A#5 A5 - G5 -", "F5 - - - - - . .",
      ],
      bass: [
        "F2 - A2 - C3 - A2 -", "D3 - F3 - A3 - F3 -", "A#2 - D3 - F3 - D3 -", "C3 - E3 - G3 - E3 -",
        "F2 - A2 - C3 - A2 -", "F2 - A2 - C3 - A2 -", "A#2 - D3 - F3 - D3 -", "C3 - E3 - F2 - - -",
      ],
      drum: "k . h . s . h h",
    },
    {
      title: "ちていの ふしぎ",
      bpm: 112,
      lead: [
        "A4 C5 E5 A5 G5 E5 C5 E5", "F4 A4 C5 F5 E5 C5 A4 C5", "D4 F4 A4 D5 C5 A4 F4 A4", "E4 G#4 B4 E5 D5 B4 G#4 B4",
        "A5 - - - B5 C6 B5 A5", "F5 - - - E5 - C5 -", "D5 - E5 F5 E5 - D5 C5", "B4 - - - E5 - - -",
      ],
      bass: [
        "A2 - - - A2 - - -", "F2 - - - F2 - - -", "D2 - - - D2 - - -", "E2 - - - E2 - - -",
        "A2 - - - A2 - - -", "F2 - - - F2 - - -", "D2 - - - D2 - - -", "E2 - - - E2 - - -",
      ],
      drum: "k . . h . . s .",
    },
  ];
  const NOTE = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  const freq = (name) => {
    const [, n, o] = name.match(/^([A-G]#?)(\d)$/);
    return 440 * 2 ** ((NOTE[n] + (Number(o) + 1) * 12 - 69) / 12);
  };
  // 「C5 - E5 .」→ [{ f, start, len }]（単位は 8 分音符）
  function parse(bars) {
    const tokens = bars.join(" ").split(/\s+/);
    const notes = [];
    tokens.forEach((tk, i) => {
      if (tk === "-") {
        if (notes.length) notes[notes.length - 1].len++;
      } else if (tk !== ".") notes.push({ f: freq(tk), start: i, len: 1 });
    });
    return { notes, steps: tokens.length };
  }

  let ac = null;
  let noise = null;
  let master = null;
  let timer = 0;
  let song = -1; // -1 は とまっている
  let startedAt = 0;
  let stepSec = 0.25;

  function setup() {
    ac ??= new (window.AudioContext || window.webkitAudioContext)();
    if (!noise) {
      noise = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
  }
  function tone(type, f, t, dur, vol) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, t + dur * 0.95);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur);
  }
  function drum(kind, t) {
    if (kind === "k") {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.15);
      return;
    }
    const s = ac.createBufferSource();
    const g = ac.createGain();
    const f = ac.createBiquadFilter();
    s.buffer = noise;
    f.type = "highpass";
    f.frequency.value = kind === "h" ? 7000 : 1500;
    const len = kind === "h" ? 0.04 : 0.12;
    g.gain.setValueAtTime(kind === "h" ? 0.25 : 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + len);
    s.connect(f).connect(g).connect(master);
    s.start(t);
    s.stop(t + len);
  }
  // 1 まわり ぶんを まとめて よやくして、おわる すこし 前に つぎを よやく
  function schedule(t0) {
    const S = SONGS[song];
    stepSec = 60 / S.bpm / 2;
    const lead = parse(S.lead);
    const bass = parse(S.bass);
    for (const n of lead.notes) tone("square", n.f, t0 + n.start * stepSec, n.len * stepSec, 0.18);
    for (const n of bass.notes) tone("triangle", n.f, t0 + n.start * stepSec, n.len * stepSec, 0.35);
    const pattern = S.drum.split(" ");
    for (let i = 0; i < lead.steps; i++) {
      const k = pattern[i % pattern.length];
      if (k !== ".") drum(k, t0 + i * stepSec);
    }
    const dur = lead.steps * stepSec;
    timer = setTimeout(() => schedule(t0 + dur), (t0 + dur - ac.currentTime - 0.5) * 1000);
  }
  function stopAll() {
    clearTimeout(timer);
    if (master) {
      const old = master;
      old.gain.setTargetAtTime(0, ac.currentTime, 0.03);
      setTimeout(() => old.disconnect(), 300);
    }
    master = null;
    song = -1;
  }
  function play(i) {
    setup();
    stopAll();
    if (ac.state === "suspended") ac.resume();
    song = i;
    master = ac.createGain();
    master.gain.value = 0.12;
    master.connect(ac.destination);
    startedAt = ac.currentTime + 0.05;
    schedule(startedAt);
  }
  // おす たびに：1 → 2 → 3 → とめる。かえりちは いま なに を ながしているか（null は とめた）
  function next() {
    if (song + 1 < SONGS.length) {
      play(song + 1);
      return SONGS[song];
    }
    stopAll();
    return null;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && song >= 0) {
      stopAll();
      onStop?.();
    }
  });
  let onStop = null;

  return {
    next,
    stop: stopAll,
    songs: SONGS,
    playing: () => song >= 0,
    current: () => (song >= 0 ? SONGS[song] : null),
    // いま 何拍目か（絵を リズムに あわせる）
    beat: () => (song >= 0 && ac ? Math.floor((ac.currentTime - startedAt) / (stepSec * 2)) : -1),
    onStop: (fn) => (onStop = fn),
  };
})();
