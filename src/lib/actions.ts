"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidTitle } from "@/lib/validation";

// useActionState 対応フォームが受け取る状態
// error: バリデーション失敗時の文言 / ok: 成功時のフラグ（フォームのリセット判定に使う）
export type FormState = { error?: string; ok?: boolean };

const TITLE_ERROR = "タイトルは1〜200文字で入力してください";

// 各アクション共通の認可。セッションが無ければサインインへ誘導する。
// redirect() は never を返すため、以降 userId は string に絞り込まれる。
async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/api/auth/signin");
  }
  return userId;
}

// 作成: useActionState 用シグネチャ（第1引数に前回状態）
export async function createTodo(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const title = String(formData.get("title") ?? "");
  if (!isValidTitle(title)) {
    return { error: TITLE_ERROR };
  }
  await prisma.todo.create({ data: { title: title.trim(), userId } });
  revalidatePath("/");
  return { ok: true };
}

// 完了トグル。updateMany + where:{id,userId} で他人の Todo は 0 件更新になる。
export async function toggleTodo(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const completed = formData.get("completed") === "true";
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { completed: !completed },
  });
  revalidatePath("/");
}

// タイトル編集: useActionState 用シグネチャ。成功後は一覧へ戻る。
export async function updateTodo(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  if (!isValidTitle(title)) {
    return { error: TITLE_ERROR };
  }
  await prisma.todo.updateMany({
    where: { id, userId },
    data: { title: title.trim() },
  });
  revalidatePath("/");
  // redirect() は例外を throw するため try/catch の外で呼ぶ
  redirect("/");
}

// 削除。deleteMany + where:{id,userId} で所有者のみ削除できる。
export async function deleteTodo(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  await prisma.todo.deleteMany({ where: { id, userId } });
  revalidatePath("/");
}
