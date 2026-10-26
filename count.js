// ---------- きた ひとの かず（v1.26）----------
// Cloudflare Web Analytics：クッキー なし、ブラウザに なにも 保存しない、ひとりずつは おわない。なんにん きたか だけ。
// かぞえるのは 本番の ホスト（warpix.app）で トークンが ある とき だけ（てもとや テストでは なにも しない）。
// トークンは ページに のせて いい 公開の 値。テストでは window.WARPIX_COUNT を さきに おいて ためす
window.WARPIX_COUNT ??= { token: "32fa29b1df004ec89349030206ba54c8", host: "warpix.app" };
(() => {
  const cfg = window.WARPIX_COUNT;
  if (!cfg.token || location.hostname !== cfg.host) return;
  const s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.dataset.cfBeacon = JSON.stringify({ token: cfg.token, spa: false });
  document.head.append(s);
})();
