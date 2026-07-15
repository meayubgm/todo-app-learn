# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## このプロジェクトについて

Next.js 学習用の、CRUD 機能を持つ TODO アプリ。バックエンド（API・DB操作・認証）は
すべて Next.js（App Router）内で完結させる方針。開発は Docker / docker compose 上で行い、
ホストにツールを直接インストールしない。

## 開発コマンド

すべて Makefile 経由でコンテナ内実行に委譲している（ホストで直接 npm を叩かない）。

| コマンド | 内容 |
|---|---|
| `make up` | 開発環境を起動（http://localhost:3000、DB込み） |
| `make down` | 停止・破棄（**DBボリュームも削除される**） |
| `make build` | Docker イメージをビルド |
| `make test` | Vitest を実行 |
| `make lint` | ESLint を実行 |
| `make migrate` | Prisma マイグレーション作成・適用（初回は `--name` を求められる） |
| `make generate` | Prisma Client を再生成 |
| `make studio` | Prisma Studio 起動（http://localhost:5555） |
| `make sh` | web コンテナ内でシェル起動 |

- 単一テストの実行: `docker compose run --rm web npx vitest run src/lib/validation.test.ts`
- 初回マイグレーション例: `docker compose run --rm web npx prisma migrate dev --name init`
- `make down` は DB ボリュームごと消すため、データを残したいときは `docker compose stop` を使う。

## スタック / バージョン方針

- Node.js 24 LTS / Next.js 16（App Router）/ React 19 / TypeScript 5
- PostgreSQL 17 + Prisma 6（**7系ではない**）
- 認証: Auth.js（NextAuth v5, 現状 beta）+ `@auth/prisma-adapter`
- バージョンは安定版を明示的に固定する。beta/rc/nightly は原則避ける（Auth.js v5 のみ、
  App Router 対応の都合で例外的に beta を採用している）。
- **Prisma は 6 系に固定**。7 系は `datasource.url` を廃止しドライバアダプタ＋`prisma.config.ts`
  必須になる破壊的変更が入っているため、学習用途では 6 系を使う。上げる場合は移行対応が必要。

## アーキテクチャ

### コンテナ構成（compose.yaml）
- `web`: Next.js 開発サーバ。`Dockerfile` の `dev` ステージを使い、ソースをマウントして
  ホットリロード。`node_modules` と `.next` は匿名ボリュームでコンテナ側のものを使う。
- `db`: PostgreSQL。healthcheck が通ってから web が起動する（`depends_on`）。
- 接続情報・`AUTH_SECRET` は compose が web に既定値を注入するため、compose 経由の開発では
  `.env` は不要。ホストから直接 Prisma 等を叩く場合のみ環境変数を用意する。

### Dockerfile（マルチステージ）
`base`（openssl 込み）→ `deps`（`npm ci`）→ `dev` / `builder`（`prisma generate` + `next build`）
→ `prod`。この環境の npm は postinstall をブロックするため、`prisma generate` は
Dockerfile で明示的に実行している（`package.json` に postinstall は置かない）。

### データモデル（prisma/schema.prisma）
- Auth.js 標準モデル: `User` / `Account` / `Session` / `VerificationToken`
- アプリ本体: `Todo`（`title` / `completed` / `userId` で User に紐づく）
- スキーマ変更後は必ず `make migrate`（または generate）を実行する。

### 認証（Auth.js v5）
- 設定は `src/auth.ts`（`handlers` / `auth` / `signIn` / `signOut` をエクスポート）。
  Prisma Adapter + database セッション戦略。**providers は現状空**で、ログイン手段は
  次ステップで追加する。
- Route Handler は `src/app/api/auth/[...nextauth]/route.ts` が `handlers` を再エクスポート。

### コード構成の要点
- `src/lib/prisma.ts`: PrismaClient のシングルトン（開発時の多重生成を防ぐ）。DB アクセスは
  必ずここ経由。
- `src/lib/validation.ts`: DB 非依存の純粋関数（`isValidTitle` 等）。テスト対象はまずここ。
- import alias は `@/*` → `src/*`。
- Vitest は現状 `environment: "node"`。UI テストを足すときは jsdom に切り替える
  （`vitest.config.ts`）。

## 今後の予定（未実装）

TODO の CRUD 画面（一覧・作成・更新・削除）は Server Actions + Route Handlers で実装予定。
認証の providers 追加も次ステップ。土台（Docker / DB / Prisma / Auth.js の配線）までが完成済み。
