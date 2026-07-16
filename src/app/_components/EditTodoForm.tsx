"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateTodo, type FormState } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: FormState = {};

// TODO 編集フォーム。id は hidden input で Server Action に渡す。
// 成功時は updateTodo 内の redirect("/") で一覧へ戻る。
export function EditTodoForm({
  id,
  defaultTitle,
}: {
  id: string;
  defaultTitle: string;
}) {
  const [state, formAction] = useActionState(updateTodo, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <input
        type="text"
        name="title"
        defaultValue={defaultTitle}
        maxLength={200}
        required
        autoFocus
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <div className="flex gap-2">
        <SubmitButton
          pendingLabel="保存中…"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          保存
        </SubmitButton>
        <Link
          href="/"
          className="rounded border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
