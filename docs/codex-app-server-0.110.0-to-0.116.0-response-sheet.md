# Codex app-server 0.110.0 to 0.116.0 Response Sheet

このドキュメントは、`codex` `0.110.0` から `0.116.0` の間で、**この VS Code 拡張が app-server 経由で実際に対応できる差分だけ** を対象にした回答シートです。

除外したもの:

- CLI 単体 UX のみの差分
- hooks / code mode / js_repl など app-server から直接扱えない差分
- OS 固有の sandbox 修正や CI / docs / telemetry 変更

## 使い方

- 各項目の `ユーザー回答` を 1 行だけ埋めてください。
- 例:
  - `採用。Session Inspector。P1。0.116.0未満は非表示`
  - `後回し。P3`
  - `見送り`

## 現在の判断

- `plugin` はこの拡張の UI 用語としてそのまま使う
- `realtime` は今回の実装対象に含める
- `remote resume/fork` は一旦実装対象から外す
- 旧 `画像生成` 項目は、専用生成導線ではなく `imageView` の UX 改善として扱う

---

## app-server 直接差分

### 1. MCP elicitation structured flow in app-server v2 (`0.111.0`)

- 差分:
  - MCP elicitation が構造化 request/response になる
- この拡張での対応案:
  - approval UI を MCP 専用ラベル付きで出し分ける
  - Session Inspector に MCP 要求種別を見せる
- 優先度案:
  - `P1`
- ユーザー回答:
  - OK

### 2. `@plugin` mentions を支える plugin 文脈 (`0.112.0`)

- 差分:
  - plugin 情報が app-server 経由セッションで扱いやすくなる
- この拡張での対応案:
  - plugin 一覧 UI の前提として plugin 状態を表示する
  - composer 補完への反映可否を検討する
- 優先度案:
  - `P2`
- ユーザー回答:
  - 採用。UI用語は plugin でOK。

### 3. Permission profiles merged into sandbox policy (`0.112.0`)

- 差分:
  - permission profile が turn sandbox に統合
- この拡張での対応案:
  - approval detail を構造化表示し、要求権限を読みやすくする
  - Session Inspector に effective policy summary を出す
- 優先度案:
  - `P1`
- ユーザー回答:
  - OK

### 4. Diagnostics earlier in workflow (`0.112.0`)

- 差分:
  - 診断情報が前倒しで見える
- この拡張での対応案:
  - backend 起動直後の status 表示を強化する
  - 認証/接続/設定エラーを最初に見せる
- 優先度案:
  - `P2`
- ユーザー回答:
  - OK

### 5. `request_permissions` tool (`0.113.0`)

- 差分:
  - `request_permissions` ツール追加
- この拡張での対応案:
  - approval UI を「command approval」「permission request」で分離する
  - 許可対象の差分を構造化表示する
- 優先度案:
  - `P1`
- ユーザー回答:
  - OK

### 6. Plugin marketplace discovery / metadata / uninstall (`0.113.0`)

- 差分:
  - plugin 一覧/metadata/uninstall が広がる
- この拡張での対応案:
  - `Plugins` UI を追加
  - 一覧、install、uninstall、状態表示を載せる
- 優先度案:
  - `P1`
- ユーザー回答:
  - 採用。plugin UI を作る。

### 7. Exec streaming + TTY/PTY support (`0.113.0`)

- 差分:
  - app-server exec の stdin/stdout/stderr streaming と TTY/PTY 対応
- この拡張での対応案:
  - 実行ツール出力を `Terminal/Step` カードに寄せる
  - 長い出力を折りたたみ表示する
- 優先度案:
  - `P1`
- ユーザー回答:
  - OK

### 8. Full web search tool config (`0.113.0`)

- 差分:
  - web search が on/off 以外の詳細設定を持つ
- この拡張での対応案:
  - Session Settings に search config editor を追加
- 優先度案:
  - `P3`
- ユーザー回答:
  - OK

### 9. New permission-profile config language (`0.113.0`)

- 差分:
  - 権限設定言語が強化
- この拡張での対応案:
  - Settings Overlay に approval/sandbox summary を表示する
- 優先度案:
  - `P2`
- ユーザー回答:
  - OK

### 10. `imageView` の UX 改善 (`0.113.0`)

- 差分:
  - 画像ファイル出力後の `imageView` 表示と保存先導線の扱いを改善できる
- この拡張での対応案:
  - `imageView` カードに保存先パスと `Open` 導線を追加する
  - 生成導線ではなく、agent が返した画像ファイル表示の UX 改善として扱う
- 優先度案:
  - `P3`
- ユーザー回答:
  - 採用。`imageView` の UX 改善として扱う。

### 11. `GET /readyz` and `GET /healthz` (`0.114.0`)

- 差分:
  - health check endpoint 追加
- この拡張での対応案:
  - backend status に health 情報を表示する
- 優先度案:
  - `P2`
- ユーザー回答:
  - OK

### 12. V2 filesystem RPC (`0.115.0`)

- 差分:
  - filesystem RPC が追加される
- この拡張での対応案:
  - 直近の UI 化は後回し
  - まず内部 API 利用余地を調査する
- 優先度案:
  - `P3`
- ユーザー回答:
  - OK

### 13. Smart Approvals guardian review (`0.115.0`)

- 差分:
  - guardian review 経由の approval
- この拡張での対応案:
  - approval UI に `review中` / `review result` 状態を追加する
- 優先度案:
  - `P1`
- ユーザー回答:
  - OK

### 14. Search-based app/tool suggestions (`0.115.0`)

- 差分:
  - tool/app 不足時の suggest/fallback 改善
- この拡張での対応案:
  - 不足ツール候補を表示する案内バナーを追加する
- 優先度案:
  - `P2`
- ユーザー回答:
  - OK

### 15. Device-code ChatGPT sign-in and token refresh (`0.116.0`)

- 差分:
  - device-code sign-in と token refresh 改善
- この拡張での対応案:
  - `Account` UI を拡張
  - 状態表示、Sign in、Refresh token、Logout、rate limit を載せる
- 優先度案:
  - `P1`
- ユーザー回答:
  - OK

### 16. Plugin setup smoothing / suggestion allowlist / remote sync (`0.116.0`)

- 差分:
  - plugin install/uninstall と suggestion/sync が改善
- この拡張での対応案:
  - `Plugins` UI を本格追加
  - install/uninstall、suggest 候補、remote sync 状態を載せる
- 優先度案:
  - `P1`
- ユーザー回答:
  - 採用。plugin で統一して進める。

### 17. Realtime sessions start with recent thread context (`0.116.0`)

- 差分:
  - realtime 開始時に recent thread context を引き継ぐ
- この拡張での対応案:
  - `Realtime` パネルに context source 表示を追加する
- 優先度案:
  - `P2`
- ユーザー回答:
  - 採用。実装対象に含める。

### 18. Remote resume/fork history restored (`0.116.0`)

- 差分:
  - remote resume/fork history 改善
- この拡張での対応案:
  - `Resume from history` に source kind / remote 系ラベルを表示する
- 優先度案:
  - `P2`
- ユーザー回答:
  - 一旦不要。

### 19. Agent finalization race fixed / effective model shown in spawn events (`0.116.0`)

- 差分:
  - agent finalize 改善
  - spawn agent event に effective model が出る
- この拡張での対応案:
  - `Agents` UI に effective model と最終状態を表示する
- 優先度案:
  - `P1`
- ユーザー回答:
  - OK

### 20. MCP inventory visibility (`0.116.0`)

- 差分:
  - MCP inventory 系の可観測性が改善
- この拡張での対応案:
  - `MCP` サブパネルを追加
  - server 一覧、状態、エラーを見せる
- 優先度案:
  - `P2`
- ユーザー回答:
  - 不要。

---

## app-server 経由で恩恵を受けるが、UI実装は必須ではない項目

- resume の安定化
- approval の永続化/整合性改善
- turn/start stall 修正
- Linux sandbox / Windows PTY などの内部安定化

### ユーザー回答

-

---

## 全体方針の回答欄

### UI構成

- plugin と realtime を実装対象にする。remote resume/fork は一旦除外。

### 実装優先順

-

### 後方互換

-

### 最終的な実装対象

- plugin, realtime
