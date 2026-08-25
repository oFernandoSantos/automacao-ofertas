"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AutomationStatusToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !active;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/automation/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!response.ok) {
        setError("Não foi possível atualizar automação.");
        return;
      }
      const data = (await response.json()) as { enabled: boolean };
      setActive(data.enabled);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={active ? "text-sm font-semibold text-[#77e6af]" : "text-sm font-semibold text-[#ffacb8]"}>
        {active ? "Automação ativa" : "Automação pausada"}
      </span>
      <Button type="button" variant={active ? "secondary" : "primary"} onClick={toggle} disabled={pending}>
        {pending ? "Atualizando..." : active ? "Pausar" : "Ativar"}
      </Button>
      {error ? <span className="text-sm text-[#ffacb8]">{error}</span> : null}
    </div>
  );
}
