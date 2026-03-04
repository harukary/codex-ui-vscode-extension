# 調査運用メモ（codex-ui-vscode-extension）

## Rule
- Codex本体の挙動調査（TUI / app-server / feature flag / realtime）は、まず `references/openai-codex` を一次参照する。
- `codez` 側は比較対象としてのみ扱い、一次根拠にしない。

## Why
- このワークスペースには複数の Codex 実装が共存しており、参照先を誤ると「実装あり/なし」の判断を誤るため。

## When
- `thread/realtime/*`、`realtime_conversation`、`voice_transcription`、Subagent 管理、TUI 挙動を調べるとき。

## Verify
- 回答時に `references/openai-codex` の実ファイルパスと行番号を示す。
- 実行中バイナリ（`codex --version` / `codex features list`）とソースが食い違う場合は、その差分を明記する。

## Exception
- `references/openai-codex` に該当実装が存在しない場合のみ、実行中バイナリの実測結果を主根拠にしてよい。
- その場合でも「ソース未確認（runtime実測）」と明示する。
