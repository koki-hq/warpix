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

## これからの 方向（2026-10-16 ユーザーの イメージ）

> **warpix-link の 世界観とは 全く 別に したい。** あくまでも warpix-link は warpix-link。生みの親は WARPIX製作所 だけど、別の 世界観。
> でも ピクセは 入れて いい（その代わり **黄色い ヘルメットの ピクセ**）。
>
> - イメージは **青空、白い雲、町工場、晴れ**
> - **水を 飲む おじさん 作業員、汗を ふきとる**
> - **ピクセと 共同しながら 作業を している ようす**
> - **アニメーション**を イメージ
> - その他の 周辺環境は **レトロで なつかしい 感じ** と **機械の 未来的な 部分が 融合** している 感じ
>
> あくまで これは ぼくの 頭の イメージ。**自由な 発想で 作ってほしい。**

- いまの 第一版（夜空・紺／ピンク／シアン・見取り図）は warpix-link の 世界観を 借りている。**これを 作りなおして いい**（色も 雰囲気も 変えて いい）
- ピクセは ヘルメット版（`factory.js` の `BODY` に `HELMET` を 重ねた もの）。warpix-link の 素の ピクセ（アンテナ・紺の 夜空）とは 区別する
- ユーザーは 自由に 進めて いいと 言っている（作る→テスト→公開→報告）。大きな 方向転換や お金・権利・外に 出す ものは 先に 聞く

## かならず 守る こと

1. **お知らせ（`news.json`）の 形と 場所を 変えない。** warpix-link の `news.js` が `https://koki-hq.github.io/warpix/news.json` を 読んでいる
   - `{ "news": [{ "id", "date": "YYYY-MM-DD", "title", "body"?, "url"? }] }`。`id` は かぶらない、`url` は https、`title` は 40 文字まで（テストで 確かめている）
   - warpix-link の フッター「製作所だより」は `https://koki-hq.github.io/warpix/#news` に 飛ぶ。**`id="news"` の 場所を 残す**
2. **ライセンスは All rights reserved**（`LICENSE`）。フッターに「このページの すべての 権利は WARPIX製作所に あります。」
3. **ブラウザに なにも 保存しない**（いまは そう 書いている）。保存する なら ページの「じむしょ」の 説明も 直す
4. **アクセシビリティ**：axe-core で 問題 0（`node tools/health.mjs`）。部屋や ボタンは キーボードで たどれる、読み上げ用の 名前、`prefers-reduced-motion` の ときは うごかさない
5. **電池に やさしく**：うごく ものは 1 つの「工場の とけい」（いまは 0.3 秒ごとの `tick()`）で いっしょに 1 コマ すすめる。CSS アニメーションを ばらばらに 無限で 回すと、待機中 CPU が 17% → いまは 2〜3%
6. **スマホ**：はば 360px でも よこに はみださない、まわりに 16px の 余白

## 進め方

- テスト：`node tests/run.mjs`（いまは 7 件・約 50 秒）。新しい 動きには テストを 足す
- 健康診断：`node tools/health.mjs`（重さ・スマホでの 速さ・待機中 CPU・axe）。**公開の 前に テストと 健康診断を 両方**
- 時刻を ためす：`?hour=0〜23`
- favicon は `node tools/favicon.mjs`（`factory.js` の ピクセから 作る）
- 公開：`main` に push すると GitHub Pages に 出る。大きな 区切りで タグ `vX.Y`（いまは `v1.0`）。公開後は 本番の URL で 変わった ことを 確かめる
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
