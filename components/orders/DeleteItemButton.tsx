"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

export function DeleteItemButton({ action }: { action: () => Promise<{ error?: string }> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="Remover item"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await action();
          router.refresh();
        });
      }}
      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
