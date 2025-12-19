<!--
Codex UI VS Code extension specification.
このファイルは「現状実装に合わせた仕様」を言語化したもの。
意図的に未実装/非対応の項目も明示し、隠れたフォールバックを避ける。
-->

# Codex UI VS Code 拡張 仕様（現状）

対象: このリポジトリの VS Code 拡張（`codex-ui-vscode-extension@0.0.1`）。

このドキュメントは「いま実装されている挙動」を、UI/入力/イベント/永続化/制約まで含めて詳細に言語化する。
将来の変更に備え、**何をしているか**だけでなく、**何をしないか（非目標）**も明確にする。

## 1. 目的 / ゴール

- Codex CLI の `app-server` を VS Code から操作できるようにする。
- 右側ペイン（Webview View）に **チャット表示 + 入力欄**を提供する。
- セッション（thread）単位で会話を扱い、タブで切り替えられるようにする。
- CLI/TUI の入力補完に寄せた UI を提供する（`/`、`@`）。
- Streaming 中でも UI 操作（details の開閉など）が破綻しない。
- 「とりあえず」隠すのではなく、未対応イベントは “Other events (debug)” に出して露呈させる。

## 2. 非目標（明示的にやらない）

- **セッションのアーカイブ機能は提供しない**。
  - 背景: Codex 本体のアーカイブは `~/.codex/archived_sessions` に移動するため、VS Code 拡張としては想定外の破壊的動作になりうる。
  - そのため、UI/コマンドとして “Archive” は無効（No-op）または露出しない方針。
- `@` でファイル内容を自動的に貼り付けない（後述）。
  - VS Code 側で巨大な入力展開を勝手に行わず、「パス参照」で十分という前提。
- “Other events (debug)” を完全に消すことはしない。
  - 未対応イベントの露呈を優先し、仕様が固まったら個別 UI に昇格する。

## 3. ディレクトリ/主要ファイル

- `src/extension.ts`
  - Extension Host 側のメインロジック（コマンド、バックエンド接続、イベント反映、永続化）
- `src/backend/*`
  - `codex app-server` を spawn し JSON-RPC でやりとりする層
- `src/ui/chat_view.ts`
  - Chat View の HTML/CSP を生成し Webview を初期化（**インライン script は持たない**）
- `src/ui/chat_view_client.ts`
  - Webview 側ブラウザ JS（入力補完・描画・キーバインド）
  - `tsconfig` が CommonJS のため、**import/export を使わず** browser script として出力する
- `dist/*`
  - `pnpm run compile` により生成される成果物（Webview が読み込むのは dist 側）

## 4. バックエンド（Codex app-server）接続仕様

### 4.1 起動コマンド

`package.json` の設定に基づき、ワークスペースフォルダごとにバックエンドを起動する。

- 設定キー:
  - `codexMine.backend.command`（default: `codex`）
  - `codexMine.backend.args`（default: `["app-server"]`）
- 起動単位:
  - `BackendManager.startForWorkspaceFolder(folder)` が、フォルダ URI をキーにプロセスを 1 つ起動/再利用する
- ログ:
  - Output Channel `Codex UI` に起動ログや JSON-RPC 初期化ログを出力する

### 4.2 JSON-RPC（v2 を主、legacy を副）

- v2（現行）: `thread/*`, `turn/*`, `item/*` の notification を受け取り、UI 状態に反映する。
- legacy: `codex/event/*` 形式の通知が重複して届く場合がある。
  - 原則 v2 を優先し、legacy は **重複ノイズを抑制**しつつ、必要な情報（例: token count / exec_command 系）だけ取り込む。

詳細なイベント一覧/扱いは `docs/codex-mine-vscode-events.md` を参照（この spec でも後述する）。

## 5. セッションモデル

### 5.1 Session の定義（概念）

- VS Code 側の “セッション” は、Codex 側の thread（`threadId`）に対応する。
- VS Code 側で `Session.id`（UUID）を別途持ち、UI のアクティブ状態や永続化キーに使う。

（実体は `src/sessions.ts` 由来の `Session` 型）

### 5.2 新規セッション作成

- UI: Chat View の `New` ボタン、または `/new` スラッシュコマンド
- 処理:
  - `BackendManager.newSession(folder)` → `thread/start`
  - VS Code 側で Session を作成し `SessionStore` に追加
  - 初期タイトル: `${folder.name} (${threadId先頭8桁})`
  - Chat View 上部のタブ表示は、デフォルトタイトルの `(8桁)` を **起動中のみの連番** `#1/#2/...` に置換して短く表示する（永続化しない）

### 5.3 セッション選択/再開

- UI:
  - Chat View 上部のタブ（session tabs）をクリック
  - Sessions Tree（`codexMine.sessionsView`）から選択（別 UI）
- 処理:
  - `codexMine.selectSession` → `BackendManager.resumeSession(session)` → `thread/resume`
  - 返ってきた thread から、履歴を `hydrateRuntimeFromThread()` で UI ブロックへ復元する

### 5.4 セッション名変更

- UI:
  - タブ上でコンテキストメニュー（右クリック/2本指クリック） → rename
  - `/rename <title>` または `/rename`（引数なしは入力ダイアログ）
- 処理:
  - `SessionStore.rename()` → `workspaceState` へ永続化

### 5.5 タブからの「非表示（Close Tab）」

- 目的:
  - セッションのログ/データは消さずに、**Chat View 上部のタブバーからだけ消す**（= “閉じた” 扱い）。
  - 誤って閉じても `Sessions` ツリービューから再度開けるようにする。
- UI:
  - タブを右クリック/2本指クリック → “Session Menu” → “Close Tab (Hide)”
- 挙動:
  - 非表示にしたセッションはタブバーに出ない
  - `Sessions` ツリービュー上は表示されたまま（再オープン導線）
  - 非表示にしたセッションを `Sessions` ツリービューから開く/選ぶと、タブバーに再表示される
- 永続化:
  - `workspaceState` key: `codexMine.hiddenTabSessions.v1`（セッションID配列）

## 6. Chat View UI 仕様

Chat View は `views` の `codexMine.chatView`（webview view）。

### 6.1 レイアウト（上 → 下）

- Top bar:
  - タイトル（アクティブセッション名）
  - `New` ボタン
  - `Open Latest Diff` ボタン（Diff があるときのみ有効）
  - セッションタブ列（横スクロール）
- Approvals:
  - 承認要求があるときのみ表示（カード + Accept/Decline/Cancel 等）
- Log:
  - 会話/イベントの表示領域（スクロール）
- Composer:
  - `textarea` 入力欄
  - `Send` ボタン
  - 候補ポップアップ（`/` と `@`）
- Status text:
  - 入力欄の下に表示（主に token 使用状況/状態メッセージ）

### 6.2 Webview セキュリティ（CSP）

- `chat_view.ts` は CSP を設定し、script は `webview.cspSource` のみ許可する。
- Webview JS は **外部ファイル**として読み込む（`dist/ui/chat_view_client.js`）。
- `localResourceRoots` に `dist` / `resources` を設定し、`webview.asWebviewUri()` 経由で参照する。

### 6.3 フォント

- Webview 全体: `--vscode-font-*` を使用（VS Code の設定に合わせる）
- `pre` / `textarea`: `--vscode-editor-font-*` を使用（エディタと同じ見え方に寄せる）

## 7. 入力欄（Composer）の挙動

### 7.1 送信

- Enter: 送信（ただし IME 変換中は送信しない）
- Shift+Enter: 改行
- Send ボタン: 送信
- 送信成功トリガ:
  - Webview から `{ type: "send", text }` を Extension Host に postMessage
  - Extension Host は必要なら `/` を解釈し、それ以外は `codex app-server` に送る

### 7.2 送信後の入力欄

- 送信したら入力欄を **即時クリア**する（`inputEl.value=""` + カーソル位置 0）
- 送信内容は履歴へ保存（同一文の連続送信は重複登録を避ける）

### 7.3 入力履歴（Up/Down）

- 条件:
  - 候補ポップアップが出ていない
  - カーソルが 0 位置（selection なし）
- `↑`:
  - 過去の送信内容を遡る
  - 初回遡り時、現在の下書きを退避する
- `↓`:
  - 履歴を戻る
  - 最後まで戻ると退避していた下書きを復元する

## 8. 入力補完（CLI 寄せ）

### 8.1 `/` スラッシュ候補

- 表示条件:
  - **1行目先頭**（入力の先頭）で `/` トークンがある場合のみ
- 候補:
  - `/new`, `/diff`, `/rename`, `/help`
- キー操作:
  - `Enter`: 候補確定（候補が出ている場合）
  - `↑/↓`: 候補選択移動
  - `Esc`: 閉じる

### 8.2 `@` メンション候補

- 候補:
  - `@selection`
  - `@<relative/path>`（ワークスペース内ファイルの相対パス）
- ファイル候補の取得:
  - 必要に応じて webview → extension に `requestFileIndex` を送る
  - extension 側は `findFiles("**/*", exclude="**/{.git,node_modules}/**", max=20000)` で一覧を返す
  - 相対パスは「セッションの workspace folder」基準（`path.relative(folderFsPath, fileFsPath)`）で `/` 区切りへ正規化
- ランキング:
  - `README` のように basename が一致/前方一致するもの、浅い階層のもの、短いパスを優先して上位に並べる

### 8.3 重要: 候補確定後に再表示しない

- 候補確定時に末尾へスペースを付与し、確定後はポップアップを閉じる。
- カーソルが whitespace 上にある場合に「左側トークンへフォールバック」すると、確定直後に再び候補が開いて UX が崩れるため、**右側トークンのみを採用**する。

## 9. Slash command（Extension Host 側）

`extension.ts` で送信前に解釈する。

- `/new`:
  - 新規セッション作成
- `/diff`:
  - Latest Diff を開く（アクティブセッションの最新 diff）
- `/rename <title>`:
  - その場でタイトル変更（永続化あり）
- `/rename`:
  - 入力ダイアログを開く
- `/help`:
  - Chat log に help を `system` ブロックとして出す
- 不明なコマンド:
  - ErrorMessage を出し、バックエンドへは送らない（この入力は消費される）

## 10. Mentions（Extension Host 側展開/検証）

`expandMentions(session, text)` で送信前に処理する。

### 10.1 `@selection`

- 目的:
  - 「選択テキストそのもの」ではなく、**ファイル相対パス + 行範囲**を送る。
- 展開結果:
  - `@<relPath>#Lx` または `@<relPath>#Lx-Ly`
- 行範囲の計算:
  - 1-based line
  - end が行頭（character=0）で複数行選択の場合、endLine を 1 行戻して直感に合わせる
- 前提:
  - アクティブエディタが必要
  - 選択範囲が空の場合はエラー
  - セッションの workspace folder 外のファイルはエラー

### 10.2 `@relative/path` / `@file:relative/path`

- どちらも「相対パス」を指す（`@file:` は互換/非推奨）。
- 送信前に **存在確認（file であること）**だけ行う。
  - 絶対パス（`/` 始まり）や `:` を含むものは拒否
  - `#L...` fragment は存在確認から除外して解釈する
- 重要:
  - ファイル内容は展開しない（パスのみ送る）

## 11. 画面表示（ブロックモデル）

UI は `ChatBlock[]` の配列として表現される。

主なブロック:

- `user`: ユーザー発言（テキスト）
- `assistant`: アシスタント発言（テキスト、delta で追記される）
- `reasoning`: Reasoning（summary/raw を details で表示）
- `command`: コマンド実行（details、summary にコマンド先頭プレビューを表示）
- `fileChange`: 変更（details）
- `mcp`: MCP tool call（details）
- `plan`: Plan（details、plan status は絵文字）
- `divider`: 罫線ブロック（例: compacted の通知）
- `system` / `error`: システム通知/エラー

### 11.1 Streaming 中の操作性（重要）

- 以前は `render()` で `logEl.innerHTML=""` を毎回実行しており、Streaming で DOM が差し替わって `details` の toggle が効かない問題があった。
- 現在は `chat_view_client.ts` で **セッションが変わらない限り DOM を全消ししない**。
  - `block.id` をキーに要素を再利用し、`pre.textContent` など必要部分のみ更新する
  - セッション切替時のみ log をクリアして再構築する

### 11.2 Command の summary 表示

- `details` を閉じた状態でも、どのコマンドか分かるように `summary` にコマンドの先頭を表示する。
  - 例: `Command: rg -n "..." …`
    - 長い場合は末尾を `…` で省略
- `command` が不自然なトークン（例: Base64 風）で人間に読めない場合、`commandActions` から生成した要約（`read/listFiles/search`）を `summary` に出す。

### 11.3 Markdown レンダリング

- Chat View では、以下のブロック本文を Markdown として HTML レンダリングする:
  - `user`, `assistant`, `system`, `error`, `plan`, `reasoning` の summary（Raw はプレーンテキスト）
- レンダラ:
  - `markdown-it`（HTML は無効化: `html=false`）
  - `linkify=true`, `breaks=true`
- リンク:
  - webview 内遷移はさせず、クリックは Extension Host 側で処理する
  - **外部URL（`http(s):` 等）**:
    - `openExternal` を送って `vscode.env.openExternal()` で開く
  - **相対リンク（例: `README.md`, `./docs/spec.md`, `/README.md`）**:
    - `openFile` を送ってワークスペース内のファイルとして開く（自動検出はせず、Markdownリンクとして明示されたもののみ）
    - `#L10` / `#L10C5` のようなフラグメントがあればその行へジャンプ
  - `target=_blank` と `rel=noreferrer noopener` を付与する

### 11.4 色（メッセージ種別）

- `user`: ニュートラル + 青い枠（ユーザー発話）
  - 背景はニュートラルにし、`webSearch`（水色）と混ざらないようにする
- `assistant`: ニュートラル（アシスタント発話）
- `reasoning`: 緑系（Reasoning）
- `system`: 黄系（システム通知）
- `error`: システム枠（Error details）
- `tool command`: 紫系（コマンド実行）
- `tool changes`: 橙系（ファイル変更/パッチ適用）
- `tool mcp`: シアン系（MCP tool）
- `tool webSearch`: 水色系（Web検索）

### 11.5 Changes（ファイル変更）と Diff

- `fileChange`（Changes）ブロックは以下を表示する:
  - 変更ファイル一覧（Ctrl/Cmd+クリックでファイルを開く）
  - `detail`（stdout/stderr 等）
  - `latestDiff` がある場合、**ファイルごとの unified diff** を Changes の中にネストした `details` で表示する
    - 例: `Changes` を開く → `README.md` の折りたたみ（diff）を開く
    - `turn_diff`（legacy）/ `turn/diff/updated`（v2）で `latestDiff` 更新時に差分も再計算する

### 11.6 Status 表示（アイコン）

- 各 `details` ブロックの `status` は、本文行を増やさないため **summary 右上のアイコン**で表示する。
  - `inProgress`: スピナー（回転）
  - `completed`: チェック
  - `failed`: バツ
  - `declined/cancelled`: マイナス
- 対象: `reasoning`, `command`, `fileChange`, `mcp`
  - `mcp` は meta に `server/tool` だけ出し、status はアイコンで示す
  - `command` は meta から `status=...` を外し、status はアイコンで示す

### 11.7 Command 表示（shell wrapper の抑制）

- `command` が `"/bin/zsh -lc cd <cwd> && ..."` のような wrapper で始まる場合、UI では wrapper を省いて **実コマンド部分のみ**を表示する。
  - 元の `command` は summary の hover（title）で参照できるようにする。

## 12. イベント処理（v2 / legacy）

詳細は `docs/codex-mine-vscode-events.md` を優先（ここでは要点）。

### 12.0 global（thread/\* など）

- `thread/started`:
  - “Other events (debug)” には出さず、`info`（白い notice カード）として表示する
  - 表示項目は最小限: `cwd` / `cliVersion` / `originUrl`

### 12.1 v2（thread/turn/item）

- `turn/started`:
  - `sending=true`（入力欄 disable）
- `turn/completed`:
  - `sending=false`
- `item/agentMessage/delta`:
  - `assistant` ブロックへ追記
- `item/reasoning/*`:
  - `reasoning` ブロックへ追記（summary/raw）
- `item/commandExecution/*`:
  - `command` ブロックへ追記（output/stdin）
- `turn/plan/updated`:
  - `plan` ブロックを upsert
  - status 表示は `✅/▶️/⏳/…` に変換する
- `thread/compacted`:
  - `divider` ブロックを追加（例: `─ Worked for 21s ─` + `• Context compacted`）
- `thread/tokenUsage/updated`:
  - `statusText` を更新（ctx remaining 等）

### 12.2 legacy（codex/event/\*）

- `exec_command_*` / `terminal_interaction` / `token_count` など、必要なものだけ取り込む
- `web_search_begin` / `web_search_end`:
  - “Other events (debug)” には出さず、`webSearch`（水色）カードとして表示する
  - 検索カードは details ではなく 1 行のカードとして表示（`🔎` + クエリ）
  - begin/end は同一 `call_id` のブロックに統合し、ステータス（スピナー→チェック）で進捗を示す
- `patch_apply_begin` / `patch_apply_end`:
  - “Other events (debug)” には出さず、`fileChange`（Changes）ブロックとして表示する
  - `changes` のファイル一覧を表示し、`stdout/stderr/success` を detail に出す
  - v2 の `fileChange` と同じファイル集合を検知できる場合は、**同じ Changes ブロックに統合**して重複表示しない
- `turn_diff`:
  - “Other events (debug)” には出さず、`latestDiff` を更新して `Open Latest Diff` で見られるようにする
  - 同一 diff の重複通知は de-dupe する
- v2 と重複するノイズ（`item_started` 等）は無視する
- `plan_update` も v2 と重複するため無視する（UI に出さない）
- 未対応イベントは “Other events (debug)” として `system` ブロックに追記

## 13. 永続化（再起動後の復元）

### 13.1 セッション一覧の保存

- `workspaceState` key: `codexMine.sessions.v1`
- 保存内容: `id/backendKey/workspaceFolderUri/title/threadId`

### 13.2 画面ランタイムの保存（会話ログ/状態）

- `workspaceState` key: `codexMine.sessionRuntime.v1`
- 保存内容（セッションIDごと）:
  - `blocks`（ChatBlock 配列）
  - `latestDiff`
  - `statusText`
  - `lastTurnStartedAtMs`
  - `lastTurnCompletedAtMs`
- 保存タイミング:
  - 通知適用時などに `schedulePersistRuntime(sessionId)` で遅延保存（250ms）

### 13.3 Webview 側の UI 状態

- `vscode.setState()` に `detailsState`（details の open/close）を保存する
- 同一 webview 生存中の toggle 状態を保持するためのもの（workspaceState とは別）

## 14. 既知の制約 / 注意点

- file index（`findFiles("**/*")`）は上限 20000。巨大リポジトリでは候補が省略される。
- `@relative/path` は相対パスのみ許可（絶対パスや `:` を含むものは拒否）。
- Webview JS は import/export を使わない設計（tsconfig が CommonJS のため）。

## 15. デバッグ/トラブルシューティング

- `New`/`Send` が無反応:
  - Webview JS が起動していない / postMessage が飛んでいない可能性
  - Output Channel `Codex UI` と webview の statusText を確認する
