# Codex v0.110 対応提案（VS Code 拡張）

## 結論
`v0.106.0` 基準でこの拡張が優先して対応すべき項目は、`P0: プロトコル追随`、`P1: v0.110 新機能のUI導線`、`P2: 旧経路整理`です。  
特に `src/generated/v2` が `v0.110` で増えた API/通知を反映できていないため、まず型再生成と通知ハンドリングの更新が必要です。

## 根拠（現状）
- `TurnStartParams` に `service tier` 相当の項目がなく、送信時にも `model/provider/reasoning/agent` しか持っていない。  
  根拠: `src/generated/v2/TurnStartParams.ts`, `src/ui/chat_view.ts:250`, `src/extension.ts:3744`, `src/backend/manager.ts:1865`
- `skills/changed` や plugin/marketplace 系の型が `src/generated/v2` に存在しない。  
  根拠: `src/generated/v2` を `plugin|marketplace|skills/changed` で検索してヒットなし
- 未知 v2 通知は「Unhandled event」に落ちる。  
  根拠: `src/extension.ts:7563`
- スキル更新は legacy イベント名（`skills_update_available`）のみ明示対応。  
  根拠: `src/extension.ts:9688`, `src/extension.ts:9722`
- Slash 補完と `/help` に `/fast` が存在しない。  
  根拠: `src/ui/chat_view_client.ts:2523`, `src/extension.ts:4817`

## 提案（優先度順）

### P0. プロトコル追随（必須）
Rule: `codex 0.110` で生成される app-server v2 型へ更新し、通知・RPCを型安全に追随する。  
Why: 現状の型不足だと、`v0.110` の追加機能が未対応のまま debug 扱いになり、運用上の変化を UI が拾えないため。  
When: `v0.110` をサポート対象にするリリース。  
Verify:
- `pnpm run regen:protocol` 後に `src/generated/v2` に新規型が反映される。
- `plugin|marketplace|skills/changed|service tier` 由来の型/メソッドがビルド上参照可能。
- 未対応通知ログ（`Unhandled event`）が対象ケースで発生しない。
Exception: なし。

実装候補:
- `scripts/regen-protocol.js` を `codex-cli 0.110.0` 前提で再生成実行。
- `src/backend/process.ts` に新規 RPC ラッパー追加（生成型に合わせる）。
- `src/extension.ts` の通知分岐に `skills/changed` 相当を追加し、`skillIndexInvalidate` と再読込を実施。

### P1. v0.110 新機能の UI 導線追加
Rule: `v0.110` で利用可能な機能は、少なくとも発見可能（help/補完/設定）にする。  
Why: バックエンドが対応していても UI から到達できないと実質的に機能が死蔵されるため。  
When: P0 完了後の同一マイルストーン。  
Verify:
- `/help` と補完候補に `fast` 関連導線が追加される。
- 設定UIまたは slash から plugin インストール導線に到達できる。
- 操作結果がカード表示またはトーストで観測できる。
Exception: API がまだ experimental で upstream 仕様が不安定な場合は、`/experimental` 配下に限定公開。

実装候補:
- `/fast`（toggle/状態表示）を補完とヘルプに追加。
- plugin 導線として `/plugins`（list/install）カードを追加。
- `service tier`（default/fast/flex）を session model state に追加し、送信時パラメータへ反映。

### P2. 旧経路整理（互換方針を明示して段階削除）
Rule: v1 legacy イベント依存を段階的に縮小し、v2 通知中心に一本化する。  
Why: 無期限の互換分岐は障害解析と変更容易性を下げるため。  
When: `v0.110+` を最小サポートとする方針を採用した場合。  
Verify:
- `codex/event/*` 依存箇所が減り、allowlist を縮小できる。
- 新規実装は v2 通知のみで成立する。
Exception: 旧CLIサポートを明示要件にする場合は維持。

実装候補:
- `applyCodexEvent` 周辺の legacy 分岐を棚卸しし、利用実績のないイベントを削除。
- `docs/spec.md` の「v2/legacy 混在」説明を更新。

## 受け入れ条件（提案の完了条件）
- `codex-cli 0.110.0` 環境で、以下が手動確認できる。
- スキル更新通知が UI に反映され、再読込で候補が更新される。
- `/fast` 導線がヘルプ・補完・実行結果表示まで通る。
- plugin 機能（最低 list/install のどちらか）が UI から実行可能。
- 既存機能（送信、承認、`/skills`、`/agents`、rename、resume）が回帰しない。

## 工数見積り（概算）
- P0: 1.5〜2.5日
- P1: 2〜4日
- P2: 0.5〜1.5日

## 未確定事項（実装前確認）
Rule: 仕様が複数解釈できる点は実装前に確定する。  
Why: 推測実装は再修正コストを増やすため。  
When: 実装着手前。  
Verify: 下記3点の合意をコメントまたはIssueで明文化。  
Exception: 「質問不要で進める」の明示がある場合。

確認質問:
1. この拡張の最小サポート版を `codex >= 0.110.0` に引き上げるか。  
2. plugin 導線は `Settings` 追加か、まず `/plugins` のみで始めるか。  
3. `/fast` は slash 実行のみ対応か、永続トグルUI（セッション設定）まで入れるか。
