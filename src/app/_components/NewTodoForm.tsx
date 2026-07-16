"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTodo, type FormState } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";

const initialState: FormState = {};

// TODO 作成フォーム。useActionState でサーバー側バリデーションの
// エラー表示と pending 制御を行い、成功時（state.ok）に入力欄をリセットする。
export function NewTodoForm() {
  const [state, formAction] = useActionState(createTodo, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          name="title"
          placeholder="やることを入力…"
          maxLength={200}
          required
          className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <SubmitButton
          pendingLabel="追加中…"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          追加
        </SubmitButton>
      </div>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
