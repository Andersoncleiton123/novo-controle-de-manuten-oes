"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function StatusButton({
  label,
  action,
}: {
  label: string;
  action: () => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await action();
          router.refresh();
        });
      }}
    >
      {pending ? "Salvando…" : label}
    </Button>
  );
}
