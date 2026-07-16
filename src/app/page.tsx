import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toggleTodo, deleteTodo } from "@/lib/actions";
import { NewTodoForm } from "./_components/NewTodoForm";

export default async function Home() {
  const session = await auth();

  // 未ログイン: GitHub でのログインを促す
  if (!session?.user) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6">
        <h1 className="text-2xl font-semibold">TODO アプリ</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          ログインするとあなたの TODO を管理できます。
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            GitHub でログイン
          </button>
        </form>
      </main>
    );
  }

  // ログイン済み: 自分の Todo 一覧を取得
  const todos = await prisma.todo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">TODO アプリ</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {session.user.name ?? session.user.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <NewTodoForm />

      <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {todos.length === 0 ? (
          <li className="py-8 text-center text-zinc-500">
            TODO はまだありません。
          </li>
        ) : (
          todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 py-3">
              {/* 完了トグル: 現在値を hidden で渡し、Server Action 側で反転 */}
              <form action={toggleTodo} className="flex">
                <input type="hidden" name="id" value={todo.id} />
                <input
                  type="hidden"
                  name="completed"
                  value={String(todo.completed)}
                />
                <button
                  type="submit"
                  aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    todo.completed
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-zinc-400 dark:border-zinc-600"
                  }`}
                >
                  {todo.completed ? "✓" : ""}
                </button>
              </form>

              <span
                className={`flex-1 break-words ${
                  todo.completed
                    ? "text-zinc-400 line-through"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {todo.title}
              </span>

              <Link
                href={`/todos/${todo.id}/edit`}
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                編集
              </Link>

              {/* 削除 */}
              <form action={deleteTodo} className="flex">
                <input type="hidden" name="id" value={todo.id} />
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  削除
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
