// favicon.svg を つくる：ヘルメットの ピクセ（factory.js と おなじ 絵）
//   node tools/favicon.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
