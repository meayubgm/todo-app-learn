# セッションサマリー: TODO の CRUD 画面実装と GitHub OAuth ログイン追加

- 日時: 2026-07-16 15:00
- プロジェクト: todo-app-learn（/Users/meayu/next-study/todo-app-learn）

## 目的

土台（Docker / DB / Prisma / Auth.js 配線）のみ完成していた学習用 TODO アプリに対し、
残タスクだった 2 点を実装する:

1. Auth.js の providers（現状空）を追加してログインできるようにする
2. TODO の CRUD 画面（一覧・作成・更新・削除）を実装する

## 実施内容

Plan モードで 3 つの Explore エージェントを並行起動し、(1) 現状ソース構成、(2) Next.js 16 の
作法（`node_modules/next/dist/docs/` をコンテナ内から確認）、(3) Auth.js v5 provider の
制約を調査。その結果を踏まえ、ユーザー確認（AskUserQuestion）で **GitHub OAuth** ＋
**フル CRUD** の方針を決定し、計画承認後に実装した。

### 認証（GitHub OAuth）
- `src/auth.ts`: `providers: [GitHub]` を追加。`session.user.id` を露出させるための型拡張
  （`declare module "next-auth"`）と `session` コールバック（`session.user.id = user.id`）を追加。
  ※ database セッションでは既定の型に `id` が無いため。
- `compose.yaml`: web の environment に `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
  （`${...:-}` でホストの .env から注入）を追加。
- `.gitignore`: ユーザーが最終的に `.env*` → `.env` のみ無視へ変更（`.env.example` は追跡対象）。
  ※ Claude 側の環境では `.env*` ファイルの読み書きが権限で全面ブロックされていたため、
  `.env` / `.env.example` の作成はユーザーが実施。

### Server Actions（新規 `src/lib/actions.ts`, 先頭 `"use server"`）
- 共通ヘルパー `requireUserId()`: `await auth()` から userId を取得、無ければ
  `redirect("/api/auth/signin")`。
- `createTodo(prevState, formData)`: useActionState 対応。`isValidTitle` 検証 → NG は `{error}`、
  OK は `prisma.todo.create` → `revalidatePath("/")` → `{ok:true}`。
- `toggleTodo(formData)`: `updateMany({ where:{id,userId} })` で completed 反転。
- `updateTodo(prevState, formData)`: 検証 → `updateMany` → `revalidatePath` → `redirect("/")`（try 外）。
- `deleteTodo(formData)`: `deleteMany({ where:{id,userId} })`。
- 更新系はすべて `where:{id,userId}` の複合条件で**所有者チェック**（他人の id では 0 件更新）。

### 画面・コンポーネント
- `src/app/page.tsx`: Server Component。未ログイン時は「GitHub でログイン」画面（inline server
  action で `signIn("github")`）、ログイン時はヘッダー（ユーザー名 + ログアウト）＋作成フォーム＋
  一覧（完了トグル・編集リンク・削除を `<form action={...}>` で）。
- `src/app/todos/[id]/edit/page.tsx`: 編集ページ。`await params`（Next.js 16 で Promise 化）、
  `auth()` + 所有者チェックで取得、無ければ `notFound()`。
- `src/app/_components/NewTodoForm.tsx` / `EditTodoForm.tsx`: `"use client"`、`useActionState` で
  エラー表示・pending 制御。NewTodoForm は成功時（`state.ok`）に `formRef.reset()`。
- `src/app/_components/SubmitButton.tsx`: `"use client"`、`useFormStatus()` の pending で
  disabled・ラベル切替。
- `src/app/layout.tsx`: metadata を「TODO アプリ」に、`lang="en"` → `lang="ja"` に変更。

### コミット
- セッション中の変更 10 ファイルを 1 コミットに集約（`8405fca`
  `feat: TODOのCRUD画面とGitHub OAuthログインを追加`、382 insertions / 66 deletions）。

## 主な決定事項

- **認証は GitHub OAuth を採用**。Credentials（メール+パスワード）は Auth.js の仕様上
  database セッションと併用不可（JWT 必須）であり、現行の Prisma Adapter + database セッションを
  そのまま活かせる OAuth を選択した。
- **CRUD は Server Actions 中心**で実装（Next.js 16 の推奨）。Route Handler は Auth.js 用以外は不要。
  一覧のトグル/削除は progressive enhancement を活かし Server Component 内の `<form>`、
  エラー/pending が要る作成・編集フォームのみ Client 化。
- **所有権の担保**は `update/delete` を `updateMany/deleteMany` + `where:{id,userId}` で実現。
- `userId` はクライアントから受け取らず、必ずサーバー側 `auth()` から取得。

## 未完了・残タスク

- **`.env.example` が未コミット**: このセッションで Claude が生成したファイルではないため
  commit-quick フックの追跡対象外。今回のコミットに含まれていない（`git status` 上は未追跡）。
  コミットしたい場合は `git add .env.example` が必要。
- **push 未実施**: コミット `8405fca` はローカルのみ。リモート反映は `/git-commit-push` または
  `git push`。
- **本サマリーは未コミット**（wrap-up の方針どおり）。
- 機能面での既知の残: 認証プロバイダの追加（Google 等）や CRUD の UX 改善（楽観的更新
  `useOptimistic` 等）は未着手。必要になれば別タスク。

## 動作確認の状況

- `make lint`（ESLint）: エラーなしで通過。
- `docker compose run --rm web npx tsc --noEmit`: EXIT=0（型エラーなし）。
- `make test`（Vitest）: 3 tests passed（既存 `validation.test.ts`）。
- dev サーバー（`docker compose up -d web`）: 起動成功、ログにエラーなし（`✓ Ready`）。
  未ログイン画面が HTTP 200 で描画され「TODO アプリ」「GitHub でログイン」を確認
  （`auth()`・Server/Client 境界がランタイムで正常動作）。
- **ユーザー側でフル動作確認済み**: GitHub OAuth App 作成 → `.env` に ID/Secret 設定 →
  ログイン成功、CRUD（作成・トグル・編集・削除）の動作を確認。
- `next build`（本番ビルド）は `/_global-error` の prerender で
  `TypeError: Cannot read properties of null (reading 'useContext')` により失敗するが、
  **変更前のテンプレート状態でも同一に再現する既存バグ**（Next 16.2.10 + React 19.2.4）で
  今回の変更とは無関係。`make up`（=`next dev`）運用のため影響なし（メモに記録済み）。
