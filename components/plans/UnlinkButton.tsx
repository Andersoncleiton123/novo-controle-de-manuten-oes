"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function UnlinkButton({ action }: { action: () => Promise<{ error?: string }> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover este vínculo de plano com o veículo?")) return;
        startTransition(async () => {
          await action();
          router.refresh();
        });
      }}
    >
      Remover
    </Button>
  );
}
