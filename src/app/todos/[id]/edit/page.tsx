import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EditTodoForm } from "@/app/_components/EditTodoForm";

// Next.js 16 では params が Promise なので await が必須
export default async function EditTodoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // 所有者チェックを兼ねて userId 込みで取得。他人の Todo や存在しない id は 404。
  const todo = await prisma.todo.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!todo) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold">TODO を編集</h1>
      <EditTodoForm id={todo.id} defaultTitle={todo.title} />
    </main>
  );
}
