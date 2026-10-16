# WARPIX製作所 ホームページ：作業の てびき

このリポジトリは **WARPIX製作所の ホームページ**。公開先は https://koki-hq.github.io/warpix/ （GitHub Pages、`main` から）。
ユーザーは 日本語で話す。遊び心と 自由な 発想が 大好き。説明は やさしい 日本語で。

2026-10-16 に、ユーザーの 希望で **ホームページは この ウィンドウ（セッション）、warpix-link は 別の ウィンドウ** で 並行して 進める ことに なった。
warpix-link（`C:\dev\warpix-link`）には 手を 入れない。

## 関係する もの

| もの | 場所 | メモ |
|---|---|---|
| ホームページ（ここ） | `C:\dev\warpix` / github.com/koki-hq/warpix（**公開**） | All rights reserved。公開なのは GitHub Pages を 無料で つかう ため |
| warpix-link | `C:\dev\warpix-link` / github.com/koki-hq/warpix-link（公開、MIT） | 第一弾の 製品。**別の ウィンドウが 担当** |
| 事務所 | `C:\dev\warpix-seisakusho` / github.com/koki-hq/warpix-seisakusho（**非公開**） | 事業の 方針・決めたこと・やること。決まったことは ここの `きめたこと.md`（新しい ものが 上）と `04-やること.md` に 書いて push |

## WARPIX製作所 とは（決まっている こと）

- ブランド名は **WARPIX製作所**。町工場の ニュアンス。「作品を、製品として 世に出す 工場」
- 本拠地の ドメインは将来 **warpix.app**（まだ 買っていない）。製品は サブドメイン（link.warpix.app など）
- 日本の 商標データベースでは「WARPIX」は 0 件（2026-10-16）。海外には 同じ名前の 会社が ある（warpix.com＝アメリカの ロボット等の ネットショップ、warpix.io、warpix.studio）
- 詳しくは 事務所リポジトリの `01-ほうしん.md`・`02-なまえと権利.md`

## いまの ホームページ（v1.2「青空の 工場まち」）

- 地上：入道雲の 青空の パノラマ（480×176 ドット、整数倍）。ゲンさん（職人）と 黄色い ヘルメットの ピクセの お話、なかまたち
- 地下：スクロールする ほど 地中へ（表土 → 粘土 → 洞窟 → 古代文明 → 最深部）。`chika.js`
- ラジカセ：おすと チップチューン（`radio.js`、v1.3）
- 地下の なぞ：生き物が こたえる、石板の かけら 5 つで 石の ピクセ像の 伝説（v1.4）
- 季節の 服：月で 春・夏・秋・冬に 着がえる（v1.5）。`?month=1〜12` で ためす。どの 季節も 晴れ
- せいひん 展示室：warpix-link の 紹介（v1.6、第一版。中身は ユーザーと 育てる）。warpix-link の 機能が かわったら ここも 見なおす
- 健康診断の 数字は、別の ウィンドウが 重い ときに 悪く でる（パソコン全体の CPU も 見て 書く）
- テストで 地下の ボタンへ スクロールする ときは `behavior: "instant"`（ページは なめらかスクロール なので、まにあわない）
- なかま図鑑：5 種族・14 人。キャラの 数・種類・分類は 自由に ふやして いい（ユーザー公認）
- くわしくは **`docs/THEME.md`**（世界観）と **`docs/spec/v1.2.md`**（仕様）。かならず 読んでから 作業する

## からだと 服（ユーザーの ことば、2026-10-16）

- デザイン（青空・町工場など）は **服**。バージョンで 着がえて いい
- WARPIX製作所の 芯の ことば（**ドット絵・レトロ・チップチューン**、「作品を 製品として 世に出す」、ピクセの プロフィール）は **からだ**。デザインを 変えても 文章から けずらない（足すのは いい）
- ユーザーが 長文で 伝える イメージは「デザインの テーマ」。文章まで 書きかえない
- warpix-link の 世界観とは 別。ピクセは ヘルメット版（`factory.js` の `BODY` に `HELMET`）

## バージョンと 仕様メモ

- **v1.x は 作っている あいだ**（宣伝前）。区切りごとに 小さく 刻む。**v2.0 は ほんとうの 開店の 日**（warpix.app に 引っ越す日など）に とっておく
- 公開する たびに **タグ `vX.Y` と 仕様メモ `docs/spec/vX.Y.md` を セット**で。`docs/spec/README.md` の 一覧にも 足す。変わった ところだけ 書き、大きく 作りなおした ときは 全体を 書く
- 世界観が 変わったら `docs/THEME.md` も 直す
- ユーザーは 自由に 進めて いいと 言っている（作る→テスト→報告）。**公開・大きな 方向転換・お金・権利・外に 出す ものは 先に 聞く**

## かならず 守る こと

1. **お知らせ（`news.json`）の 形と 場所を 変えない。** warpix-link の `news.js` が `https://koki-hq.github.io/warpix/news.json` を 読んでいる
   - `{ "news": [{ "id", "date": "YYYY-MM-DD", "title", "body"?, "url"? }] }`。`id` は かぶらない、`url` は https、`title` は 40 文字まで（テストで 確かめている）
   - warpix-link の フッター「製作所だより」は `https://koki-hq.github.io/warpix/#news` に 飛ぶ。**`id="news"` の 場所を 残す**
2. **ライセンスは All rights reserved**（`LICENSE`）。フッターに「このページの すべての 権利は WARPIX製作所に あります。」
3. **ブラウザに なにも 保存しない**（いまは そう 書いている）。保存する なら ページの「じむしょ」の 説明も 直す
4. **アクセシビリティ**：axe-core で 問題 0（`node tools/health.mjs`）。部屋や ボタンは キーボードで たどれる、読み上げ用の 名前、`prefers-reduced-motion` の ときは うごかさない
5. **電池に やさしく**：うごく ものは 1 つの「工場の とけい」（0.3 秒ごとの `tick()`）で いっしょに 1 コマ すすめる。うごかない 景色は 1 回だけ 描いて、うごく もの だけ かさねる。画面に 見えて いない ものは 描かない（地下は `factory.tools.onTick`）。CSS アニメーションを ばらばらに 無限で 回すと 待機中 CPU 17% → いまは 3〜4%
6. **スマホ**：はば 360px でも よこに はみださない、まわりに 16px の 余白

## 進め方

- テスト：`node tests/run.mjs`（いまは 11 件・約 70 秒）。新しい 動きには テストを 足す
- 健康診断：`node tools/health.mjs`（重さ・スマホでの 速さ・待機中 CPU・axe）。**公開の 前に テストと 健康診断を 両方**
- 時刻を ためす：`?hour=0〜23`（あいさつと 時計塔）。お話の コマを とめる：`?t=0〜95`
- favicon は `node tools/favicon.mjs`（`factory.js` の ピクセから 作る）
- 公開：`main` に push すると GitHub Pages に 出る。タグ `vX.Y`（いまは `v1.6.1`）と 仕様メモを セットで。公開後は 本番の URL で 変わった ことを 確かめる
  - Pages の 公開が「waiting」で 止まる ことが ある → `gh api -X POST repos/koki-hq/warpix/pages/builds` で 頼みなおすと 通る
- コミット：git の メールは noreply 設定ずみ。メッセージの 最後に `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## ヘッドレス Chrome の 後片付け（だいじ）

- テストの Chrome は `--mute-audio`（音を 出さない）。終わったら 残さない
- **別の ウィンドウ（warpix-link）も 同時に テストで Chrome を 使う。** `tasklist | grep chrome` の 数は あてに しない。
  この リポジトリの テスト用 Chrome は プロファイル名が `warpix-home-test-` で 始まる ので、残っているか どうかは それで 調べる：
  `powershell -Command "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | ? { $_.CommandLine -like '*warpix-home-test-*' } | measure"`
- テストの ポートは 10400〜（warpix-link は 9400〜）。同時に ながしても ぶつからない

## 道具の くせ

- Bash の heredoc や python の 文字列に `\\n` を 書くと、本物の 改行に 化ける ことが ある。JS の `\n` や 正規表現は Edit ツールで 書いて、grep で たしかめる
