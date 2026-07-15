# セッションサマリー: Next.js学習用TODOアプリの環境構築

- 日時: 2026-07-15 15:29
- プロジェクト: todo-app-learn（/Users/meayu/next-study/todo-app-learn）

## 目的

Next.js 学習用の、CRUD 機能を持つ TODO アプリの開発環境を構築する。バックエンド
（API・DB操作・認証）はすべて Next.js（App Router）内で完結させ、docker compose ベースで
組む。`/new-project-setup` の標準方針（compose.yaml / Makefile 5ターゲット / 安定版固定）を適用する。

## 実施内容

空ディレクトリからのゼロ構築。作業はすべてコンテナ内で実行し、ホストにツールを直接インストールしない方針で進めた。

- **スタック確認**: DB/ORM = PostgreSQL + Prisma、認証 = Auth.js (NextAuth v5) をユーザーと合意。
- **Next.jsベース生成**: node:24-slim コンテナ内で `create-next-app@16.2.10` を非対話実行
  （TypeScript / App Router / ESLint / Tailwind / src-dir / import-alias `@/*`）。uid問題のため
  root実行後にホストuid/gidへchown。
- **依存追加**: `@prisma/client` / `prisma` / `next-auth@5.0.0-beta.31` / `@auth/prisma-adapter@2.11.2` / `vitest@4.1.10`。
- **作成ファイル**:
  - `Dockerfile`（マルチステージ: base/deps/dev/builder/prod、openssl込み、prisma generateを明示実行）
  - `.dockerignore`
  - `compose.yaml`（`web` + `db` の2サービス、healthcheck、node_modules/.next匿名ボリューム）
  - `Makefile`（`up`/`down`/`build`/`test`/`lint` + `migrate`/`generate`/`studio`/`logs`/`sh`）
  - `prisma/schema.prisma`（Auth.js標準4モデル + `Todo`）
  - `prisma/migrations/20260715040628_init/`（初回マイグレーション）
  - `src/auth.ts`、`src/app/api/auth/[...nextauth]/route.ts`
  - `src/lib/prisma.ts`（シングルトン）、`src/lib/validation.ts` + `src/lib/validation.test.ts`
  - `vitest.config.ts`
  - `package.json`（scriptsに test/test:watch/db:migrate/db:generate を追加）
  - `CLAUDE.md`（コマンド・アーキテクチャを記載。create-next-app生成の `@AGENTS.md` 取り込みは維持）

## 主な決定事項

- **Prisma 7 → 6.19.3 へ切替**: Prisma 7 は `datasource.url` を廃止し、ドライバアダプタ +
  `prisma.config.ts` が必須になる破壊的変更が入っていたため（generateがP1012で失敗）、当初方針
  「新メジャー直後は1つ前の安定版を検討」に沿って 6 系に固定。schemaの `url = env("DATABASE_URL")` が
  そのまま使える。
- **Auth.js v5-beta の採用**: `next-auth` の安定版は v4.24.14 だが、App Router を正式サポートするのは
  v5（現状 beta）のため、方針の例外として beta を明示採用。providers は現状空。
- **Node 24 LTS / PostgreSQL 17 / Next.js 16 / React 19 / TypeScript 5** をいずれも安定版で固定。
- **postinstall を置かない**: この環境のnpm(v11)がpostinstallをブロックし、かつdepsステージでは
  schema.prismaが未コピーのため、`prisma generate` はDockerfileで明示実行する構成にした。
- `.env.example` は環境の権限設定で作成不可のため未作成。環境変数はcomposeが注入し、説明はCLAUDE.mdに記載。

## 未完了・残タスク

- TODO の CRUD 画面（一覧・作成・更新・削除）の実装（Server Actions + Route Handlers）— 未着手。
- Auth.js の providers 追加（Credentials / OAuth 等）とログイン画面 — 未着手。
- 本タスクの完了ラインは「土台（Docker / DB / Prisma / Auth.js の配線）を通す」まで。CRUDと認証手段は次ステップ。
- **未コミット**: 本プロジェクトはgitリポジトリ未初期化。全ファイルが未コミット状態（このサマリー含む）。

## 動作確認の状況

- `make build`: 成功（devイメージのビルド完了）。
- `make test`: 成功（Vitest 3件パス、`src/lib/validation.test.ts`）。
- `make migrate`（`--name init`）: 成功。`psql \dt` で User/Account/Session/VerificationToken/Todo/_prisma_migrations の全テーブル作成を確認。
- アプリ起動: Next.js Ready。コンテナ内fetchで `/` = HTTP 200（HTML）、`/api/auth/providers` = HTTP 200（`{}`、providers未設定のため想定どおり）を確認。
- 確認後、`docker compose stop` でコンテナ停止（DBボリュームは保持）。
- 補足: curl はホストの権限設定で拒否されたため、HTTP確認はコンテナ内 `node -e "fetch(...)"` で実施した。
