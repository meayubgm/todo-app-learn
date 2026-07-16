"use client";

import { useFormStatus } from "react-dom";

// 送信中は disabled にしてラベルを切り替える。
// useFormStatus は <form> の子孫でのみ pending を取得できるため、
// 送信ボタンは必ず別コンポーネントに切り出す必要がある。
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? "送信中…") : children}
    </button>
  );
}
