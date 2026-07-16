# todo-app-learn

Next.js（App Router）学習用の、CRUD 機能を持つ TODO アプリ。
バックエンド（API・DB操作・認証）はすべて Next.js 内で完結させる方針。
開発は Docker / docker compose 上で行い、ホストにツールを直接インストールしない。

> **状態**: 土台（Docker / DB / Prisma / Auth.js の配線）まで完成。
> TODO の CRUD 画面と認証 providers は未実装（今後の予定）。

## 技術スタック

| 分類 | 技術 | バージョン | 備考 |
|---|---|---|---|
| ランタイム | Node.js | 24 LTS | Docker イメージ `node:24` 系 |
| フレームワーク | Next.js | 16.2.10 | App Router |
| UI | React | 19.2.4 | |
| 言語 | TypeScript | 5 系 | |
| スタイル | Tailwind CSS | 4 系 | PostCSS 経由 |
| DB | PostgreSQL | 17 | `postgres:17-alpine` |
| ORM | Prisma | 6.19.3 | **7 系は不採用**（後述） |
| 認証 | Auth.js (NextAuth) | 5.0.0-beta | `@auth/prisma-adapter` + database セッション |
| テスト | Vitest | 4.1.10 | 現状 `environment: "node"` |
| Lint | ESLint | 9 系 | `eslint-config-next` |
| コンテナ | Docker / docker compose | — | `web` + `db` の 2 サービス |

### バージョン方針

- 原則として LTS / 安定版を明示的に固定する（beta / rc / nightly は避ける）。
- **Prisma は 6 系に固定**。7 系は `datasource.url` を廃止し、ドライバアダプタ +
  `prisma.config.ts` が必須になる破壊的変更が入っているため、学習用途では 6 系を使う。
- **Auth.js v5（beta）は例外的に採用**。App Router を正式サポートするのが v5 のため。

## 開発フロー

### A. Docker + Make を使う場合（推奨）

すべて Makefile 経由でコンテナ内実行に委譲している。ホストで直接 npm を叩かない。
接続情報・`AUTH_SECRET` は compose が web に既定値を注入するため、`.env` は不要。

| コマンド | 内容 |
|---|---|
| `make up` | 開発環境を起動（http://localhost:3000、DB 込み） |
| `make down` | 停止・削除（**DB データは残る**） |
| `make clean` | 停止し、DB ボリュームごと完全削除（**リセット**） |
| `make build` | Docker イメージをビルド |
| `make test` | Vitest を実行 |
| `make lint` | ESLint を実行 |
| `make migrate` | Prisma マイグレーション作成・適用（初回は `--name` を求められる） |
| `make generate` | Prisma Client を再生成 |
| `make studio` | Prisma Studio 起動（http://localhost:5555） |
| `make logs` | web サービスのログを追従表示 |
| `make sh` | web コンテナ内でシェルを起動 |

初回セットアップの例:

```bash
make build                       # イメージをビルド
make up                          # 起動（別ターミナルで以下を実行）
make migrate                     # 初回は --name を対話で求められる
# 単発でマイグレーション名を指定する場合:
docker compose run --rm web npx prisma migrate dev --name init
```

- 単一テストの実行:
  `docker compose run --rm web npx vitest run src/lib/validation.test.ts`
- 日常的な停止は `docker compose stop`（データ保持）、片付けは `make down`（データ保持）、
  DB を初期化したいときだけ `make clean`（ボリュームごと削除→その後 `make migrate`）。
- **DB の確認・操作方法**（Prisma Studio・psql・Prisma Client error の対処など）は
  [`docs/db-の使い方.md`](docs/db-の使い方.md) にまとめている。

### B. Docker を使わない場合

ホストに Node.js 24 / PostgreSQL 17 を用意し、環境変数を自前で設定する。

```bash
# 1. 依存インストール
npm ci

# 2. 環境変数を設定（compose と同じ値を .env などに用意）
#    DATABASE_URL="postgresql://todo:todo@localhost:5432/todo_app?schema=public"
#    AUTH_SECRET="任意のシークレット"
#    AUTH_TRUST_HOST="true"

# 3. PostgreSQL 17 を起動しておく（DB: todo_app / USER: todo / PASSWORD: todo）

# 4. Prisma Client 生成 & マイグレーション適用
npm run db:generate
npm run db:migrate      # 初回は --name を求められる

# 5. 開発サーバ起動（http://localhost:3000）
npm run dev
```

その他の npm scripts:

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバ起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバ起動 |
| `npm run lint` | ESLint |
| `npm test` | Vitest 実行 |
| `npm run test:watch` | Vitest ウォッチ |
| `npm run db:migrate` | Prisma マイグレーション |
| `npm run db:generate` | Prisma Client 再生成 |

> **補足**: この環境の npm は postinstall をブロックするため、`prisma generate` は
> `postinstall` に置かず、Dockerfile または手動（`db:generate`）で明示実行する。

## Claude Code を使った開発フロー

このプロジェクトは Claude Code（claude.ai/code）での開発を前提に、いくつかの
プロジェクト設定ファイルとカスタムスキルを用意している。

### 関連ファイル

| ファイル | 役割 |
|---|---|
| `CLAUDE.md` | プロジェクト固有の指示。`AGENTS.md` を読み込む |
| `AGENTS.md` | この Next.js は破壊的変更を含むため、コード記述前に `node_modules/next/dist/docs/` の該当ガイドを読むよう指示 |
| `WORK_LOG/` | セッションごとの作業サマリー（wrap-up の出力先） |

### セッションの進め方

1. **作業**: 通常どおり Claude Code に依頼して開発を進める。3 ステップ以上の作業や
   アーキテクチャ判断を伴うタスクは、実装前に計画を提示してもらう。
2. **動作確認**: diff の確認・テスト実行・ログ確認ができるまで完了と見なさない。
3. **セッション終了時**: 次の順序で締めくくる。
   1. **`/wrap-up`** — ここまでの会話内容を `WORK_LOG/session-summary-YYYYMMDD-HHmm.md`
      として保存する。
   2. **コミット・プッシュ** — wrap-up の後に、変更をコミットしてリモートへ push する。
      Claude Code に「コミットしてpushして」または **`/git-commit-push`** と依頼すると、
      関連する変更をステージ → 差分から簡潔なコミットメッセージを生成 → 確認のうえ
      コミット & push まで行う。push 不要でコミットだけなら **`/git-commit-quick`**。

> **補足**: wrap-up が生成する `WORK_LOG/` のサマリー自体は、原則コミット対象に含めない
> （引き継ぎメモとして残す前提）。コミットするかはその都度判断する。

## ディレクトリ構成

```
todo-app-learn/
├── compose.yaml              # web(Next.js) + db(PostgreSQL) の2サービス定義
├── Dockerfile                # マルチステージ: base/deps/dev/builder/prod
├── Makefile                  # コンテナ内実行に委譲する開発コマンド群
├── CLAUDE.md                 # Claude Code 向けプロジェクト指示
├── AGENTS.md                 # コード記述前に Next.js 同梱ドキュメントを読む指示
├── docs/                     # 開発メモ（db-の使い方.md 等、git管理対象外）
├── WORK_LOG/                 # セッションサマリー（wrap-up の出力先）
├── next.config.ts
├── tsconfig.json             # import alias: @/* → src/*
├── vitest.config.ts          # 現状 environment: "node"
├── eslint.config.mjs
├── postcss.config.mjs
├── prisma/
│   ├── schema.prisma         # User/Account/Session/VerificationToken + Todo
│   └── migrations/           # マイグレーション履歴（初回 init 済み）
├── public/                   # 静的アセット
└── src/
    ├── auth.ts               # Auth.js 設定（handlers/auth/signIn/signOut）
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   └── api/auth/[...nextauth]/route.ts   # Auth.js Route Handler
    └── lib/
        ├── prisma.ts         # PrismaClient シングルトン
        ├── validation.ts     # DB 非依存の純粋関数（isValidTitle 等）
        └── validation.test.ts
```

### 構成の要点

- **DB アクセスは必ず `src/lib/prisma.ts` 経由**（開発時の多重生成を防ぐシングルトン）。
- **`src/lib/validation.ts`** は DB 非依存の純粋関数。テスト対象はまずここ。
- import alias は `@/*` → `src/*`。
- データモデルは Auth.js 標準 4 モデル + アプリ本体の `Todo`
  （`title` / `completed` / `userId` で User に紐づく）。スキーマ変更後は
  必ず `make migrate`（または `make generate`）を実行する。

## 今後の予定（未実装）

- TODO の CRUD 画面（一覧・作成・更新・削除）— Server Actions + Route Handlers で実装予定。
- Auth.js の providers 追加（Credentials / OAuth 等）とログイン画面。
