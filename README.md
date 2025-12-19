# Codex UI VS Code Extension

Codex CLI（`codex app-server`）を VS Code の右側ペインで使うための拡張です。

## 前提（Codex CLI）

この拡張は **Codex CLI 本体を同梱しません**。ローカルに Codex CLI をインストールしてください。

- npm: `npm i -g @openai/codex`
- Homebrew: `brew install --cask codex`

## 使い方（ユーザー向け）

1. Activity Bar の `Codex UI` を開く
2. `Chat` で `New` を押してセッション作成
3. 下の入力欄から送信（Enter=送信 / Shift+Enter=改行）
4. `Sessions` からセッションを選択して再開/切り替え

### 設定

- `codexMine.backend.command`（default: `codex`）
  - PATH に `codex` がいない場合、フルパスを指定できます
- `codexMine.backend.args`（default: `["app-server"]`）

## 開発者向け（この repo で開発する）

1. 依存インストール
   - `pnpm install`
2. ビルド
   - `pnpm run compile`
3. VS Code で `vscode-extension/` を開き、`Run Extension (Codex UI)` を選んで F5

## 公開（Marketplace / Maintainership）

この repo は単独の VS Code 拡張リポジトリです。

1. `package.json` の `publisher` を自分の Publisher ID に合わせて更新
2. バージョン更新（`version`）
3. `pnpm run compile`
4. `npx @vscode/vsce package`（`.vsix` を作成。`pnpm run vsix:package` でも可）
5. `npx @vscode/vsce publish`（Publisher でログイン済みであること）

補足:
- 仕様（現状実装の言語化）は `docs/spec.md` を参照
