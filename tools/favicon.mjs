// favicon.svg を つくる：ヘルメットの ピクセ（factory.js と おなじ 絵）
// v1.26 から ホーム画面の アイコンも：iPhone（icons/apple-touch-icon.png）・Android（icons/icon-192.png・icon-512.png と manifest.webmanifest）。
// こちらは 青空の 色の 上に ピクセを 整数倍で（ぼやけない）
//   node tools/favicon.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateSync, crc32 } from "node:zlib";

const ROOT = join(import.meta.dirname, "..");
const src = readFileSync(join(ROOT, "factory.js"), "utf8");
const rowsOf = (name) => [...src.match(new RegExp(`const ${name} = \\[\\n([\\s\\S]*?)\\n  \\];`))[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
const body = rowsOf("BODY");
const helmet = rowsOf("HELMET");
const rows = body.map((row, y) => {
  const over = helmet[y - 3];
  return over ? [...row].map((ch, x) => (over[x] !== "." ? over[x] : ch)).join("") : row;
});
const COLORS = { o: "#000", w: "#f4f4f4", p: "#ff4fa3", c: "#3ee8ff", y: "#ffd84a" };
let rects = "";
rows.forEach((row, y) => [...row].forEach((ch, x) => { if (COLORS[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[ch]}"/>`; }));
writeFileSync(join(ROOT, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>\n`);
console.log("favicon.svg");

// ---------- PNG（ドットを そのまま 大きく）----------
const SKY = "#2f86e6"; // index.html の theme-color と おなじ
const rgb = (hex) => (hex.length === 4 ? [1, 2, 3].map((i) => parseInt(hex[i] + hex[i], 16)) : [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))); // #000 も #f4f4f4 も
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
// size：画像の はば、scale：1 ドットの 大きさ（ピクセは 16 ドット。まんなかに おく）
function png(size, scale) {
  const off = Math.floor((size - 16 * scale) / 2);
  const sky = rgb(SKY);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const ch = rows[Math.floor((y - off) / scale)]?.[Math.floor((x - off) / scale)];
      const c = x >= off && y >= off && COLORS[ch] ? rgb(COLORS[ch]) : sky;
      raw.set(c, y * (size * 3 + 1) + 1 + x * 3);
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0);
  head.writeUInt32BE(size, 4);
  head.set([8, 2, 0, 0, 0], 8); // 8bit・RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", head), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
mkdirSync(join(ROOT, "icons"), { recursive: true });
// iPhone は 角を 自動で まるめる。Android の maskable は まんなか 8 わりが かならず 見える ので、ピクセは その 中に
for (const [file, size, scale] of [["apple-touch-icon.png", 180, 10], ["icon-192.png", 192, 8], ["icon-512.png", 512, 20]]) {
  writeFileSync(join(ROOT, "icons", file), png(size, scale));
  console.log(`icons/${file}`);
}
const manifest = {
  name: "WARPIX製作所",
  short_name: "WARPIX製作所",
  start_url: "./",
  display: "browser",
  background_color: SKY,
  theme_color: SKY,
  icons: [
    { src: "favicon.svg", sizes: "any", type: "image/svg+xml" },
    { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
  ],
};
writeFileSync(join(ROOT, "manifest.webmanifest"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest.webmanifest");
