import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AutomationStatusToggle } from "@/components/forms/automation-status-toggle";
import { DatabaseSetupCard } from "@/components/ui/database-setup-card";
import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/lib/env";
import { getAutomationSettings } from "@/modules/settings/service";
import { getAutomationObservability } from "@/modules/logs/service";
import { updateAutomationSettingsAction } from "@/app/settings/actions";

export default async function AutomationSettingsPage() {
  if (!env.DATABASE_URL) {
    return <div className="space-y-6"><PageHeader eyebrow="CONFIGURAÇÕES" title="Automação" description="Controle fila, reservas e integrações de publicação." /><DatabaseSetupCard /></div>;
  }
  const [settings, observability] = await Promise.all([getAutomationSettings(), getAutomationObservability()]);
  const latestHealth = observability.health[0];

  function healthStatus(log: unknown, key: string) {
    if (!log || typeof log !== "object" || !("metadata" in log) || !log.metadata || typeof log.metadata !== "object") return null;
    const metadata = log.metadata as Record<string, unknown>;
    const snapshot = "snapshot" in metadata && typeof metadata.snapshot === "object" && metadata.snapshot
      ? metadata.snapshot as Record<string, unknown>
      : metadata;
    return snapshot[key] === true;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CONFIGURAÇÕES" title="Automação" description="Defina regras de entrega, cooldown e reserva para n8n." />
      <Card className="max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Status da automação</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Novas ofertas só seguem ao n8n quando automação estiver ativa.</p>
          </div>
          <AutomationStatusToggle enabled={settings.automationEnabled} />
        </div>
      </Card>
      <Card className="max-w-4xl">
        <form action={updateAutomationSettingsAction} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            Modo
            <select
              name="mode"
              defaultValue={settings.mode}
              className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2"
            >
              <option value="MANUAL">MANUAL</option>
              <option value="SEMI_AUTO">SEMI_AUTO</option>
              <option value="AUTO">AUTO</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Cooldown de produto (horas)
            <Input name="productCooldownHours" type="number" defaultValue={settings.productCooldownHours} />
          </label>
          <label className="grid gap-2 text-sm">
            Reserva padrão (minutos)
            <Input name="defaultReservationMinutes" type="number" defaultValue={settings.defaultReservationMinutes} />
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Salvar automação</Button>
          </div>
        </form>
      </Card>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold">Último health check</p>
          {latestHealth ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className={healthStatus(latestHealth, "backend_api_ok") ? "text-[#77e6af]" : "text-[#ffacb8]"}>Backend API: {healthStatus(latestHealth, "backend_api_ok") ? "OK" : "Falhou/indisponível"}</p>
              <p className={healthStatus(latestHealth, "evolution_api_ok") ? "text-[#77e6af]" : "text-[#ffacb8]"}>Evolution API: {healthStatus(latestHealth, "evolution_api_ok") ? "OK" : "Falhou/indisponível"}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{new Date(latestHealth.created_at).toLocaleString("pt-BR")}</p>
            </div>
          ) : <p className="mt-4 text-sm text-[var(--muted-foreground)]">Nenhum health check recebido.</p>}
        </Card>
        <Card>
          <p className="text-sm font-semibold">Últimas 24 horas</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border)] p-3"><p className="text-2xl font-bold">{String(observability.counts?.publications_24h ?? 0)}</p><p className="text-xs text-[var(--muted-foreground)]">Publicações</p></div>
            <div className="rounded-xl border border-[var(--border)] p-3"><p className="text-2xl font-bold text-[#ffacb8]">{String(observability.counts?.failures_24h ?? 0)}</p><p className="text-xs text-[var(--muted-foreground)]">Falhas</p></div>
          </div>
        </Card>
      </section>
      <Card className="max-w-4xl">
        <h2 className="text-lg font-semibold">Últimos erros</h2>
        <div className="mt-4 space-y-3">
          {observability.errors.length === 0 ? <p className="text-sm text-[var(--muted-foreground)]">Nenhuma falha registrada.</p> : observability.errors.map((log) => {
            const metadata = log.metadata as Record<string, unknown>;
            return <div key={log.id} className="rounded-xl border border-[var(--border)] p-3 text-sm"><p className="font-semibold text-[#ffacb8]">{String(metadata.workflow ?? metadata.stage ?? "Automação")}</p><p className="mt-1 text-[var(--muted-foreground)]">{String(metadata.node ?? metadata.error ?? "Erro sem detalhe")}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">Oferta: {String(log.offer_id ?? "N/A")} · {new Date(log.created_at).toLocaleString("pt-BR")}</p></div>;
          })}
        </div>
      </Card>
    </div>
  );
}
